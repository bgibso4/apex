# Health API + D1 — Design Spec

**Date:** 2026-03-22
**Status:** Design approved, pending implementation planning
**Parent:** `2026-03-22-health-ecosystem-design.md` (roadmap item #3)

## Goal

Extend the existing Cloudflare Worker (currently WHOOP OAuth proxy) into a full health API with a D1 database for cloud sync. This is the foundation that all future apps and the dashboard depend on.

## What Exists Today

- `workers/whoop-oauth/` — Deployed CF Worker with two OAuth endpoints (`/oauth/token`, `/oauth/refresh`)
- API key auth via `X-API-Key` header (PR #51)
- `wrangler.toml` with WHOOP environment variables
- APEX app configured to talk to this Worker for WHOOP token exchange

## What Changes

1. **Rename** `workers/whoop-oauth/` → `workers/health-api/` to reflect expanded role
2. **Restructure** from single `index.ts` to modular Hono app with route files and middleware
3. **Add D1** database binding with schema for all syncable tables
4. **Add sync endpoints** — generic `/v1/:table` with allowlist validation
5. **Add observability** — Sentry error tracking, structured logging middleware, query timing
6. **Move OAuth routes to `/v1/auth/whoop/*`** — cleaner URL structure consistent with the rest of the API. Migrated into `routes/oauth.ts`. Update APEX `src/health/config.ts` to use new paths.

## Worker Architecture

**Framework:** [Hono](https://hono.dev) — lightweight, built for CF Workers, typed, middleware-first.

```
workers/health-api/
  src/
    index.ts              -- Hono app entry, route registration, Sentry wrapper
    routes/
      oauth.ts            -- /v1/auth/whoop/token, /v1/auth/whoop/refresh (migrated from current index.ts)
      sync.ts             -- POST /v1/:table, GET /v1/:table
      analytics.ts        -- GET /v1/analytics/* (dashboard queries, added later)
    middleware/
      auth.ts             -- API key validation (X-API-Key header)
      logging.ts          -- Structured request/response logging with timing
      sentry.ts           -- Sentry error capture wrapper
    db/
      schema.sql          -- D1 table definitions
      migrations/         -- Versioned SQL migration files
      queries.ts          -- Reusable query builders (upsert, select-since)
    lib/
      tables.ts           -- Table allowlist with column definitions
  wrangler.toml           -- D1 binding + existing WHOOP vars
  package.json            -- hono, @sentry/cloudflare
  tsconfig.json
```

**Middleware stack** (applied to every request in order):
1. Sentry — captures unhandled exceptions
2. Logging — structured `console.log` with method, path, status, duration, context
3. Auth — validates `X-API-Key`, rejects with 401 before route logic
4. CORS — expanded from current Worker to allow `GET` (for dashboard pulls) in addition to `POST`

## D1 Schema

```sql
-- ============================================================
-- Workout data (from APEX)
-- ============================================================

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  program_id INTEGER,
  program_name TEXT,
  name TEXT,
  block_name TEXT,
  week_number INTEGER,
  day_index INTEGER,
  scheduled_day INTEGER,
  actual_day INTEGER,
  date TEXT NOT NULL,
  status TEXT,
  started_at TEXT,
  completed_at TEXT,
  sleep INTEGER,
  soreness INTEGER,
  energy INTEGER,
  notes TEXT,
  updated_at TEXT NOT NULL,
  source_app TEXT DEFAULT 'apex'
);

CREATE TABLE set_logs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  exercise_id INTEGER,
  exercise_name TEXT NOT NULL,
  set_number INTEGER,
  target_weight REAL,
  actual_weight REAL,
  target_reps INTEGER,
  actual_reps INTEGER,
  target_distance REAL,
  actual_distance REAL,
  target_duration REAL,
  actual_duration REAL,
  target_time REAL,
  actual_time REAL,
  status TEXT,
  rpe REAL,
  timestamp TEXT,
  is_adhoc INTEGER DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE exercise_notes (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  muscle_groups TEXT,
  alternatives TEXT,
  input_fields TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE programs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT,
  duration_weeks INTEGER,
  definition_json TEXT,
  one_rm_values TEXT,
  started_at TEXT,
  completed_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE run_logs (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  date TEXT NOT NULL,
  duration_min REAL,
  distance REAL,
  pain_level INTEGER,
  pain_level_24h INTEGER,
  included_pickups INTEGER DEFAULT 0,
  notes TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE personal_records (
  id TEXT PRIMARY KEY,
  exercise_id TEXT NOT NULL,
  record_type TEXT NOT NULL,
  rep_count INTEGER,
  value REAL NOT NULL,
  previous_value REAL,
  session_id TEXT NOT NULL,
  date TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE session_protocols (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  type TEXT NOT NULL,
  protocol_key TEXT,
  protocol_name TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  updated_at TEXT NOT NULL
);

-- ============================================================
-- Health data (from APEX / WHOOP)
-- ============================================================

CREATE TABLE daily_health (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  recovery_score REAL,
  sleep_score REAL,
  hrv_rmssd REAL,
  resting_hr REAL,
  strain_score REAL,
  sleep_duration_min INTEGER,
  spo2 REAL,
  skin_temp_celsius REAL,
  respiratory_rate REAL,
  synced_at TEXT,
  updated_at TEXT NOT NULL
);

-- ============================================================
-- Weight / Body Comp (from future weight app)
-- ============================================================

CREATE TABLE body_weights (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  weight REAL NOT NULL,
  unit TEXT DEFAULT 'lbs',
  updated_at TEXT NOT NULL
);

CREATE TABLE body_comp_scans (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  weight REAL,
  skeletal_muscle_mass REAL,
  body_fat_percent REAL,
  bmi REAL,
  body_water_percent REAL,
  notes TEXT,
  updated_at TEXT NOT NULL
);

-- ============================================================
-- Sync tracking
-- ============================================================

CREATE TABLE sync_log (
  app_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  last_synced_at TEXT NOT NULL,
  rows_synced INTEGER,
  PRIMARY KEY (app_id, table_name)
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_sessions_date ON sessions(date);
CREATE INDEX idx_sessions_updated ON sessions(updated_at);
CREATE INDEX idx_set_logs_session ON set_logs(session_id);
CREATE INDEX idx_set_logs_updated ON set_logs(updated_at);
CREATE INDEX idx_exercises_updated ON exercises(updated_at);
CREATE INDEX idx_programs_updated ON programs(updated_at);
CREATE INDEX idx_run_logs_date ON run_logs(date);
CREATE INDEX idx_run_logs_updated ON run_logs(updated_at);
CREATE INDEX idx_personal_records_exercise ON personal_records(exercise_id);
CREATE INDEX idx_personal_records_date ON personal_records(date);
CREATE INDEX idx_personal_records_updated ON personal_records(updated_at);
CREATE INDEX idx_daily_health_date ON daily_health(date);
CREATE INDEX idx_daily_health_updated ON daily_health(updated_at);
CREATE INDEX idx_body_weights_date ON body_weights(date);
CREATE INDEX idx_body_weights_updated ON body_weights(updated_at);
CREATE INDEX idx_body_comp_scans_date ON body_comp_scans(date);
CREATE INDEX idx_body_comp_scans_updated ON body_comp_scans(updated_at);
CREATE INDEX idx_exercise_notes_session ON exercise_notes(session_id);
CREATE INDEX idx_exercise_notes_updated ON exercise_notes(updated_at);
CREATE INDEX idx_session_protocols_session ON session_protocols(session_id);
CREATE INDEX idx_session_protocols_updated ON session_protocols(updated_at);
```

**Key decisions:**
- **Text UUIDs as primary keys** — apps generate IDs locally, no auto-increment conflicts across devices/apps
- **`source_app` on sessions** — tracks which app wrote the data
- **`personal_records` included** — dashboard needs pre-computed e1RM data for trends; cheaper than recomputing from set_logs
- **`body_weights` and `body_comp_scans` created now but empty** — ready for the weight app when built
- **`set_logs.exercise_name` denormalized** — dashboard queries don't always need joins to exercises
- **No `raw_json` columns** — cloud stores structured data only; full API responses stay local in APEX's `daily_health.raw_json`. If analytics later need raw data, a one-time backfill from local → cloud can be done since all historical raw responses are preserved on device
- **D1 migrations tracked in `db/migrations/`** — versioned SQL files applied via `wrangler d1 execute`
- **Indexes on `date` and `updated_at`** for every table — `date` for dashboard time-range queries, `updated_at` for sync pull filtering
- **`body_weights.date` is UNIQUE** — one weigh-in per day, re-weighing overwrites via upsert. `daily_health.date` is also UNIQUE (one snapshot per day)

**Tables intentionally excluded from cloud sync:**
- `weekly_checkins` — not actively used yet (see #49). Will be added when implemented.
- `schema_info` — internal version tracking, not data.
- `is_sample` flag — sample/seed data is excluded from sync. The sync client filters these out before pushing.

### Schema Mapping: APEX Local → D1

The D1 schema closely mirrors the APEX local schema but with these differences:

| Difference | APEX Local | D1 Cloud | Reason |
|------------|-----------|----------|--------|
| ID type for `daily_health` | `INTEGER AUTOINCREMENT` | `TEXT` (UUID) | Cloud needs globally unique IDs. **Sync client must generate a text UUID for each local row before pushing.** |
| `is_sample` column | Present on most tables | Absent | Sample data is not synced — filtered out by sync client |
| `created_at` columns | Present on some tables | Absent (except `exercise_notes` which retains it) | Not needed for sync or analytics; `updated_at` is sufficient. Exception: `exercise_notes.created_at` is retained because it records when the note was originally written. |
| `day_template_id` on sessions | Present | Absent | Internal program structure detail, not useful for analytics |
| `session_protocols.id` | `INTEGER AUTOINCREMENT` | `TEXT` (UUID) | Same as `daily_health` — sync client generates text UUID for each local row |

## Sync Cadence

Apps sync at two moments:

1. **On app open** — Push all changes since last successful sync. Covers anything that accumulated while the app was closed (completed sessions, health data synced from WHOOP, etc.).
2. **On session complete** — When a workout session is marked complete, push the session, its set_logs, exercise_notes, session_protocols, and any personal_records created. This ensures the most important data (a finished workout) reaches the cloud promptly.

**Not** on every individual write (each set, each rep). Mid-workout data stays local until the session completes or the app is next opened.

**Behavior:**
- Sync is background, non-blocking. The app never waits for sync to complete.
- If sync fails (offline, API error), changes accumulate locally. Next sync picks up everything since last successful sync.
- Each app tracks its last successful sync timestamp per table in local storage.
- Estimated API volume: ~10-20 requests per workout day (one batch per table on open, one batch per table on session complete). Well within free tier.

## Sync API

### Push: `POST /v1/:table`

Apps push records after local SQLite writes.

```typescript
// Request
POST /v1/sessions
X-API-Key: <key>
Content-Type: application/json

{
  "app_id": "apex",
  "records": [
    { "id": "uuid-1", "date": "2026-03-22", "status": "completed", "updated_at": "..." },
    { "id": "uuid-2", "date": "2026-03-21", "status": "completed", "updated_at": "..." }
  ]
}

// Response 200
{ "synced": 2, "errors": 0 }

// Response 400 (validation failure)
{ "error": "Unknown table: foo" }
{ "error": "Missing required column: id in records[0]" }
```

**Behavior:**
- Validates table name against allowlist (rejects unknown tables)
- Validates each record has required columns, strips unknown columns
- Upsert via `INSERT INTO <table> (...) VALUES (...) ON CONFLICT(id) DO UPDATE SET col1=excluded.col1, ...` — this preserves existing columns not included in the push payload, unlike `INSERT OR REPLACE` which deletes and reinserts
- Large batches chunked to respect D1's bound parameter limits (max ~100 records per batch statement)
- Updates `sync_log` with timestamp and count
- Returns synced/error count
- `sync_log` is server-side observability — it lets you see when each app last synced and how much data flowed. Apps track their own last-sync timestamp locally and do not query `sync_log`.

### Pull: `GET /v1/:table`

Dashboard (and future reinstall recovery) reads records.

```typescript
// Request
GET /v1/sessions?since=2026-03-01T00:00:00Z&limit=100&offset=0

// Response 200
{
  "records": [...],
  "total": 47,
  "has_more": false
}
```

**Behavior:**
- `since` filters on `updated_at` (only records changed after timestamp)
- Without `since`, returns all records
- Paginated with `limit` (default 100, max 1000) and `offset`
- `total` is the count matching the filter, `has_more` indicates more pages

### Table Allowlist

Hardcoded in `lib/tables.ts`:

```typescript
export const ALLOWED_TABLES = {
  sessions: {
    columns: ['id', 'program_id', 'program_name', 'name', 'block_name',
              'week_number', 'day_index', 'scheduled_day', 'actual_day',
              'date', 'status', 'started_at', 'completed_at', 'sleep',
              'soreness', 'energy', 'notes', 'updated_at', 'source_app'],
    required: ['id', 'date', 'updated_at'],
  },
  set_logs: {
    columns: ['id', 'session_id', 'exercise_id', 'exercise_name', 'set_number',
              'target_weight', 'actual_weight', 'target_reps', 'actual_reps',
              'target_distance', 'actual_distance', 'target_duration', 'actual_duration',
              'target_time', 'actual_time', 'status', 'rpe', 'timestamp', 'updated_at'],
    required: ['id', 'session_id', 'exercise_name', 'updated_at'],
  },
  // ... all tables defined similarly
} as const;
```

**This prevents:**
- SQL injection (table names are never interpolated from user input — they're looked up in the allowlist)
- Junk data (unknown columns stripped, required columns enforced)
- Unauthorized table access (only allowlisted tables are queryable)

## Observability

### Sentry (Error Tracking + Alerting)

- `@sentry/cloudflare` SDK wraps the Hono app
- Captures unhandled exceptions with stack traces
- Free tier: 5K errors/month, email alerts on new issues
- `SENTRY_DSN` stored as Worker secret
- **This is how you find out something broke** — proactive email, not "app feels slow"

### Structured Logging

Every request logs:
```json
{
  "method": "POST",
  "path": "/v1/sessions",
  "status": 200,
  "duration_ms": 12,
  "app_id": "apex",
  "records_count": 5,
  "table": "sessions"
}
```

Visible in:
- **Workers Observability dashboard** — persistent, queryable, 24-72h retention (free)
- **`wrangler tail`** — live streaming during development (free)

### D1 Query Timing

Database queries wrapped with timing:
```typescript
const start = Date.now();
const result = await db.prepare(sql).bind(...params).all();
const ms = Date.now() - start;
if (ms > 100) console.warn(`Slow query (${ms}ms): ${table}`);
```

Slow queries (>100ms) logged as warnings — visible in the same logging pipeline.

### What You Get

| Signal | Source | Cost |
|--------|--------|------|
| Request volume, error rate, latency | CF Workers Analytics dashboard | Free |
| D1 read/write counts, storage | CF D1 dashboard | Free |
| Persistent request logs (24-72h) | Workers Observability | Free |
| Error stack traces + email alerts | Sentry free tier | Free |
| Live log streaming | `wrangler tail` | Free |
| Slow D1 query warnings | Custom logging middleware | Free |

## Migration Plan

### Rename & Restructure

1. Copy `workers/whoop-oauth/` to `workers/health-api/`
2. Restructure into modular layout (routes, middleware, db, lib)
3. Migrate existing OAuth logic into `routes/oauth.ts` (same logic, new paths: `/v1/auth/whoop/token` and `/v1/auth/whoop/refresh`)
4. Add Hono as router, wire up middleware stack
5. Verify existing WHOOP OAuth flow still works via `wrangler dev`

### Add D1

1. `wrangler d1 create health-db`
2. Add D1 binding to `wrangler.toml`
3. Apply schema via `wrangler d1 execute health-db --file=./src/db/schema.sql`
4. Implement sync routes

### Add Observability

1. Create free Sentry project
2. `wrangler secret put SENTRY_DSN`
3. Wrap Hono app with Sentry handler
4. Add logging middleware

### Deploy & Verify

1. Deploy via `wrangler deploy`
2. Smoke test: hit `/v1/auth/whoop/token` (migrated), `/v1/sessions` (new) with curl
3. Verify Sentry captures a test error
4. Verify logs appear in CF dashboard
5. Update APEX `src/health/config.ts` if Worker URL changed

### Update APEX Config

- Update `name` in `wrangler.toml` from `apex-whoop-oauth` to `apex-health-api`. This creates a new Worker at a new URL.
- Update APEX `src/health/config.ts` with the new Worker URL and new OAuth paths (`/v1/auth/whoop/token`, `/v1/auth/whoop/refresh`).
- Delete the old `apex-whoop-oauth` Worker via `wrangler delete --name apex-whoop-oauth` after verifying the new one works.

## Error Handling

- **Invalid table name:** 400 with `{ error: "Unknown table: foo" }`
- **Missing required columns:** 400 with `{ error: "Missing required column: id in records[0]" }`
- **Empty records array:** 400 with `{ error: "No records provided" }`
- **Invalid API key:** 401 with `Unauthorized`
- **D1 error:** 500 with `{ error: "Database error" }` (details in Sentry, not exposed to client)
- **Rate limiting:** Not implemented — free tier limits are far beyond personal usage

## Testing Strategy

- **Unit tests:** Route handlers with mocked D1 bindings (Hono test utilities + Miniflare)
- **Integration tests:** `wrangler dev` with local D1 database
- **Allowlist tests:** Reject unknown tables, missing required fields, extra columns stripped
- **Auth tests:** 401 without key, 200 with valid key
- **Migration test:** Verify OAuth routes still work after restructure
- **Smoke test post-deploy:** curl each endpoint, verify responses

## Cost

| Component | Monthly Cost |
|-----------|-------------|
| CF Worker | $0 (free tier: 100K req/day) |
| CF D1 | $0 (free tier: 5M reads/day, 100K writes/day, 5GB) |
| Sentry | $0 (free tier: 5K errors/month) |
| **Total** | **$0/month** |
