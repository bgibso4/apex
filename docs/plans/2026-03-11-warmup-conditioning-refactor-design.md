# Warmup & Conditioning Refactor — Design

**Date:** 2026-03-11
**Issue:** #24

## Problem

Warmup and conditioning are hardcoded to 3 boolean columns (`warmup_rope`, `warmup_ankle`, `warmup_hip_ir`) and a `conditioning_done` flag. The program data already defines rich, per-day warmup protocols and conditioning finishers, but they're unused. This means every workout shows the same 3 items regardless of program or day.

## Decisions

- **Approach A: `session_protocols` table** — normalized, flexible, supports multiple protocols per session
- **Protocol-level tracking** — one toggle per protocol, not per step. Step details exist in program data for future expandable views but are not interactive
- **Conditioning stays a boolean** with the prescribed finisher text stored for display in history
- **`DayTemplate.warmup` becomes `string[]`** — supports multiple warmup protocols per day
- **No data migration needed** — no real user data yet, just update schema and seed data
- **`ON DELETE CASCADE`** on session_id handles cleanup for most delete paths

## Data Model

### New Table: `session_protocols`

```sql
CREATE TABLE session_protocols (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL,           -- 'warmup' | 'conditioning'
  protocol_key TEXT,            -- e.g., 'full_ankle' (null for conditioning)
  protocol_name TEXT NOT NULL,  -- display name
  completed INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);
```

### Removed from `sessions` table

- `warmup_rope`
- `warmup_ankle`
- `warmup_hip_ir`
- `conditioning_done`

### Program Type Changes

```typescript
// DayTemplate.warmup: string -> string[]
warmup: string[];  // ["jump_rope", "full_ankle"]
```

### Program JSON Changes

- `warmup` field on each day template becomes an array of protocol keys
- Add `jump_rope` (and any other missing protocols) to `warmup_protocols`
- Each protocol has `duration_min`, `steps[]`, optional `note`

## CRUD Lifecycle

### CREATE
- `createSession()` → after inserting session, insert protocol rows from day template's `warmup[]` + `conditioning_finisher`

### UPDATE
- `updateWarmup()` replaced by `updateProtocolCompletion(sessionId, protocolId, completed)` — updates individual rows
- `completeSession()` → no longer writes `conditioning_done` (it's in `session_protocols`)

### DELETE (CASCADE handles most)
- `deleteSession()` → CASCADE deletes protocol rows
- `stopProgram()` with deleteData → CASCADE via session deletes
- `clearAllData()` → CASCADE via session deletes
- `clearSampleData()` → need explicit delete for sample session protocols (filter by `is_sample` join)

### READ
- `getSessionById()` → join or separate query for protocol rows
- `getFullSessionState()` → include protocol rows for session restore
- `getInProgressSession()` → restore protocol completion state
- `getProtocolConsistency()` → query `session_protocols` grouped by `protocol_key`
- `session/[id].tsx` → display chips from `session_protocols`
- `SessionSummary` → same

## UI Behavior

### Warmup Checklist (during workout)
- Renders a row per prescribed warmup protocol from day template
- Shows protocol name + duration (e.g., "Full Ankle Protocol — 10 min")
- One tap toggles completed
- Conditioning finisher shown as its own row with prescribed text

### Session Summary & Session Detail (history)
- Chips rendered from `session_protocols` rows
- Shows protocol name + completed/skipped status

### Progress/Metrics
- `getProtocolConsistency()` queries `session_protocols` — no hardcoded names
- Automatically adapts to whatever protocols a program defines

## Seed Data
- Update `seed.ts` to insert `session_protocols` rows instead of setting boolean columns
- Generate realistic completion patterns per protocol
