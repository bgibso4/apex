# APEX Sync Client + updated_at Migration — Design Spec

**Date:** 2026-03-23
**Status:** Design approved, pending implementation planning
**Parent:** `2026-03-22-health-ecosystem-design.md` (roadmap item #4)
**Depends on:** Health API Worker deployed with D1 sync endpoints (roadmap item #3, complete)

## Goal

Add cloud sync to the APEX app. The app pushes workout data to the health-api Worker's D1 database on two triggers: app open and session complete. This is the foundation for the dashboard and cross-app analytics.

## What Exists Today

- **Health API Worker** — Deployed at `apex-health-api.bgibso4.workers.dev` with `POST /v1/:table` (push) and `GET /v1/:table` (pull) endpoints, API key auth, table allowlist validation
- **APEX local DB** — SQLite via expo-sqlite, schema v11, 10+ tables for workout/health data
- **Health config** — `src/health/config.ts` has the Worker URL and API key
- **No sync client** — APEX doesn't push any data to the Worker yet
- **`updated_at` gap** — Only `daily_health` has an `updated_at` column. The other 9 syncable tables don't, which means there's no way to detect changed rows for incremental sync.

## What Changes

1. **Database migration (v12)** — Add `updated_at` column to 9 tables
2. **DB layer edits** — Set `updated_at = datetime('now')` on every insert/update across the affected DB files
3. **Sync client** — New `src/sync/` module that queries changed rows, transforms them, and pushes to the Worker
4. **Sync triggers** — Hook into app open and session complete flows

## Database Migration

### Schema v12: Add `updated_at` to syncable tables

Tables receiving the new column:
- `sessions`
- `set_logs`
- `exercises`
- `programs`
- `run_logs`
- `exercise_notes`
- `personal_records`
- `session_protocols`

(`daily_health` already has `updated_at`. `weekly_checkins` and `schema_info` are not synced.)

**Migration SQL per table:**
```sql
ALTER TABLE <table> ADD COLUMN updated_at TEXT DEFAULT (datetime('now'));
UPDATE <table> SET updated_at = datetime('now') WHERE updated_at IS NULL;
```

**Effect on first sync:** All existing rows get `updated_at` set to the migration timestamp. The first sync after migration pushes all data to D1. This is acceptable — it's a personal app with manageable data volume.

## DB Layer Changes

Every DB function that inserts or updates a syncable table must set `updated_at = datetime('now')`.

**Files and operations affected:**

| File | Tables | Operations |
|------|--------|-----------|
| `src/db/sessions.ts` | `sessions`, `set_logs`, `session_protocols` | createSession, updateReadiness, completeSession, updateSessionNotes, logSet, updateSet, insertSessionProtocols, updateProtocolCompletion |
| `src/db/programs.ts` | `programs`, `exercises` | importProgram, activateProgram, stopProgram, refreshBundledProgram, ensureExerciseExists |
| `src/db/runs.ts` | `run_logs` | logRun, updateRun, updateRunPain24h |
| `src/db/notes.ts` | `exercise_notes` | saveExerciseNote |
| `src/db/personal-records.ts` | `personal_records` | detectPRs |

**Approach:**
- INSERTs: Add `updated_at` to column list with value `datetime('now')`
- UPDATEs: Add `updated_at = datetime('now')` to the SET clause
- No SQLite triggers — explicit in each function for visibility and testability

**Not touched:** `daily_health` (already sets `updated_at` in `src/db/health.ts`), `weekly_checkins` (not synced), `schema_info` (not synced).

## Sync Client Architecture

```
src/sync/
  syncClient.ts      -- Core sync logic: query changed rows, transform, push
  syncConfig.ts      -- Table mapping config (local schema → D1 schema)
  syncStorage.ts     -- Last-sync timestamps (per table, persisted to SQLite schema_info)
  useSyncOnOpen.ts   -- Hook: triggers sync when app opens
```

### syncConfig.ts — Table Mapping

Defines the mapping for each of the 10 syncable tables:

```typescript
interface TableSyncConfig {
  localTable: string;              // Local SQLite table name
  remoteTable: string;             // D1 table name (same in all cases)
  excludeColumns: string[];        // Columns to strip before pushing
  columnRenames?: Record<string, string>;  // Local column → D1 column name
  extraColumns?: (row: any) => Record<string, unknown>;  // Derived columns to add
  idTransform?: (row: any) => string;  // Generate text UUID for tables with integer PKs
}
```

**Column exclusions (applied to all tables unless noted):**
- All tables: strip `is_sample`
- `sessions`: also strip `day_template_id`
- `daily_health`: also strip `raw_json`, `created_at`
- `programs`: strip `bundled_id`, `created_date`
- `exercise_notes`: strip `is_sample` only (keep `created_at` — it's retained in D1 per spec)
- Other tables: strip `created_at` if present, strip `is_sample`

**Column renames:**
- `programs.activated_date` → D1 `started_at` (local uses `activated_date`, D1 uses `started_at`)

**Derived columns (computed at sync time via joins/lookups):**
- `sessions.program_name` — looked up from `programs.name` using `sessions.program_id`. D1 denormalizes this for dashboard queries.
- `set_logs.exercise_name` — looked up from `exercises.name` using `set_logs.exercise_id`. D1 requires this (it's in the `required` columns list in the Worker allowlist).

These lookups are done in the sync query itself via SQL JOIN, not in application code. The sync query for `sessions` and `set_logs` will be custom (not a plain `SELECT *`).

**Tables requiring ID transformation:**
- `daily_health`: local integer autoincrement → `apex-health-<date>` (deterministic, one row per date)
- `session_protocols`: local integer autoincrement → `apex-proto-<session_id>-<type>-<sort_order>` (deterministic, unique per session + position). Uses `sort_order` instead of `protocol_key` to handle cases where `protocol_key` is null.

Deterministic IDs ensure re-syncing produces the same ID, so D1's `ON CONFLICT(id) DO UPDATE` works correctly. No mapping table needed.

### syncClient.ts — Core Logic

**`syncAll()` function:**

```
for each syncable table:
  1. Read last-sync timestamp from schema_info (default: epoch)
  2. Query local DB with table-specific query:
     - Simple tables: SELECT * FROM <table> WHERE updated_at > ? AND (is_sample IS NULL OR is_sample = 0)
     - sessions: JOIN to programs for program_name
     - set_logs: JOIN to exercises for exercise_name
  3. If no rows, skip
  4. Transform each row:
     a. Strip excluded columns per syncConfig
     b. Apply column renames
     c. Add derived columns
     d. Apply ID transform if needed
  5. POST /v1/<table> with { app_id: "apex", records: [...] }
  6. On 200: update last-sync timestamp to max(updated_at) from pushed rows
  7. On failure: log error, continue to next table (don't update timestamp)
```

**Key behaviors:**
- Tables are synced independently — one table failing doesn't block others
- Fire-and-forget — sync runs in background, never blocks the UI
- Idempotent — re-pushing the same rows is safe (upsert on D1 side)
- Last-sync timestamp updates to `max(updated_at)` of successfully pushed rows, not current time. This avoids missing rows that were written between query and push completion.

**API config:** Reuses Worker URL and API key from `src/health/config.ts`.

### syncStorage.ts — Timestamp Persistence

Uses the existing `schema_info` SQLite table (key-value store) to persist sync timestamps. No new dependency needed.

- Key pattern: `sync_last_<table>` → ISO timestamp string
- `getLastSync(table)` → timestamp or `null` (null means sync everything)
- `setLastSync(table, timestamp)` → void
- On first ever sync: no stored timestamp means query with epoch, which includes all rows

### useSyncOnOpen.ts — App Open Trigger

React hook used in the root layout (`app/_layout.tsx`):
- On mount, calls `syncAll()` without awaiting it
- Non-blocking — the app renders immediately, sync happens in background
- Only fires once per app launch (not on tab switches)

### Session Complete Trigger

When a workout session is marked complete (existing `completeSession()` flow), call `syncAll()` after the local DB writes finish. This ensures finished workouts reach the cloud promptly.

This is a single function call addition to the session completion logic — no new hook or component.

## Sync Cadence Summary

| Trigger | When | What syncs |
|---------|------|-----------|
| App open | Root layout mount | All tables with changes since last sync |
| Session complete | After `completeSession()` DB writes | All tables (session, sets, protocols, records, notes) |

**Not synced mid-workout.** Individual set logs accumulate locally until session complete or next app open.

## Error Handling

- **Network failure:** Log, skip table, continue. Next sync picks up everything.
- **API 400 (validation):** Log the error details. This indicates a schema mismatch that needs investigation.
- **API 500 (server error):** Log, skip, continue. Sentry on the Worker side captures details.
- **No retry logic.** Two sync triggers per workout day is sufficient. If both fail, the next app open catches up.

## Testing Strategy

**Unit tests for sync module:**
- `syncConfig` — verify column mapping, is_sample filtering, UUID generation for each table produces correct deterministic IDs, column renames work, derived columns are computed
- `syncClient` — mock DB queries and fetch calls; verify correct payloads are built; verify last-sync timestamps update on success and don't update on failure; verify tables sync independently (one failure doesn't block others)
- `syncStorage` — verify read/write of timestamps via schema_info, default behavior when no timestamp exists

**DB layer test updates:**
- Existing test files for each DB module — add assertions that `updated_at` is set on insert and updated on modification

**No integration tests against the live Worker.** The Worker has its own test suite. The sync client tests mock the HTTP layer and verify the right data shape is sent.

## Schema Mapping Reference

Complete mapping of local APEX schema to D1 cloud schema:

| Difference | APEX Local | D1 Cloud | Sync Client Handles |
|------------|-----------|----------|-------------------|
| `daily_health.id` | INTEGER autoincrement | TEXT UUID | Generate `apex-health-<date>` |
| `session_protocols.id` | INTEGER autoincrement | TEXT UUID | Generate `apex-proto-<session_id>-<type>-<sort_order>` |
| `is_sample` column | Present on most tables | Absent | Filter out `is_sample = 1` rows, strip column |
| `created_at` columns | Present on some tables | Absent (except `exercise_notes`) | Strip from all except `exercise_notes` |
| `day_template_id` on sessions | Present | Absent | Strip before push |
| `daily_health.raw_json` | Present (full API response) | Absent | Strip before push (raw data stays local only) |
| `programs.activated_date` | Present | `started_at` in D1 | Rename column during transform |
| `programs.bundled_id` | Present | Absent | Strip before push |
| `programs.created_date` | Present | Absent | Strip before push |
| `programs.completed_at` | Not present locally | Present in D1 | Push as null (program completion tracked via `status`) |
| `sessions.program_name` | Not stored (derived from program) | Denormalized column | JOIN to programs.name at sync query time |
| `sessions.day_index` | Not stored locally | Present in D1 | Push as null (not tracked locally) |
| `set_logs.exercise_name` | Not stored (FK to exercises) | Denormalized, **required** | JOIN to exercises.name at sync query time |
