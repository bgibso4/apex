# APEX Sync Client + updated_at Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add cloud sync to APEX — push workout data to the health-api Worker on app open and session complete.

**Architecture:** Database migration adds `updated_at` to 9 tables. Every DB write sets `updated_at`. A sync client in `src/sync/` queries rows changed since last sync, transforms them to match D1 schema, and POSTs to the Worker. Sync timestamps stored in SQLite `schema_info` table.

**Tech Stack:** TypeScript, expo-sqlite, React Native (Expo), Jest

**Spec:** `docs/superpowers/specs/2026-03-23-apex-sync-client-design.md`

---

## File Structure

```
src/sync/
  syncConfig.ts      -- Table mapping: columns to exclude, renames, ID transforms, custom queries
  syncStorage.ts     -- Read/write last-sync timestamps via schema_info table
  syncClient.ts      -- Core: query changed rows → transform → POST to Worker
  useSyncOnOpen.ts   -- Hook: trigger syncAll() on app mount

src/db/
  schema.ts          -- Bump to v12
  database.ts        -- Add v12 migration (ALTER TABLE + backfill)
  sessions.ts        -- Add updated_at to INSERTs and UPDATEs for sessions, set_logs, session_protocols
  programs.ts        -- Add updated_at to INSERTs and UPDATEs for programs, exercises
  runs.ts            -- Add updated_at to INSERTs and UPDATEs for run_logs
  notes.ts           -- Add updated_at to INSERT OR REPLACE for exercise_notes
  personal-records.ts -- Add updated_at to INSERT for personal_records

app/_layout.tsx      -- Add useSyncOnOpen hook

__tests__/
  sync/
    syncConfig.test.ts
    syncStorage.test.ts
    syncClient.test.ts
  db/
    sessions.test.ts     -- Add updated_at assertions
    programs.test.ts     -- Add updated_at assertions
    runs.test.ts         -- Add updated_at assertions
    notes.test.ts        -- Add updated_at assertions
    personal-records.test.ts -- Add updated_at assertions
```

---

### Task 1: Database migration — Add `updated_at` to 9 tables

**Files:**
- Modify: `src/db/schema.ts` (line 6: bump version)
- Modify: `src/db/database.ts` (add v12 migration block after existing v11 migration)

- [ ] **Step 1: Bump schema version**

In `src/db/schema.ts`, change line 6:

```typescript
export const SCHEMA_VERSION = 12;
```

- [ ] **Step 2: Add `updated_at` to CREATE TABLE statements in schema.ts**

For each syncable table in the `CREATE_TABLES` string, add `updated_at TEXT` before the closing paren or last column. This ensures fresh installs get the column. The tables to update:

- `programs`: add `updated_at TEXT` after `bundled_id TEXT`
- `exercises`: add `updated_at TEXT` after `is_sample INTEGER DEFAULT 0`
- `sessions`: add `updated_at TEXT` before `FOREIGN KEY`
- `set_logs`: add `updated_at TEXT` before `FOREIGN KEY`
- `run_logs`: add `updated_at TEXT` before `FOREIGN KEY`
- `exercise_notes`: add `updated_at TEXT` before `FOREIGN KEY`
- `personal_records`: add `updated_at TEXT` before `FOREIGN KEY`
- `session_protocols`: add `updated_at TEXT` before `FOREIGN KEY`

- [ ] **Step 3: Add v12 migration in database.ts**

Add after the v11 migration block (after the `daily_health` creation). Follow the existing pattern of `if (currentVersion < 12)`:

```typescript
// v12: Add updated_at to all syncable tables for cloud sync
if (currentVersion < 12) {
  const syncableTables = [
    'sessions', 'set_logs', 'exercises', 'programs',
    'run_logs', 'exercise_notes', 'personal_records', 'session_protocols',
  ];
  for (const table of syncableTables) {
    try {
      await db.runAsync(`ALTER TABLE ${table} ADD COLUMN updated_at TEXT`);
    } catch {
      // Column may already exist
    }
    await db.runAsync(`UPDATE ${table} SET updated_at = datetime('now') WHERE updated_at IS NULL`);
  }
}
```

- [ ] **Step 4: Run tests to verify nothing broke**

Run: `npm test -- --testPathPattern="__tests__/db"`
Expected: All existing DB tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts src/db/database.ts
git commit -m "feat: add updated_at column to 9 syncable tables (schema v12)"
```

---

### Task 2: DB layer — Add `updated_at` to sessions.ts writes

**Files:**
- Modify: `src/db/sessions.ts`
- Modify: `__tests__/db/sessions.test.ts`

- [ ] **Step 1: Update `createSession()` INSERT**

Current SQL (line ~20):
```sql
INSERT INTO sessions
 (id, program_id, name, week_number, block_name, day_template_id,
  scheduled_day, actual_day, date, started_at)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

Add `updated_at` column and `datetime('now')` value:
```sql
INSERT INTO sessions
 (id, program_id, name, week_number, block_name, day_template_id,
  scheduled_day, actual_day, date, started_at, updated_at)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
```

Parameters stay the same (10 params — `datetime('now')` is in SQL, not a param).

- [ ] **Step 2: Update `updateReadiness()` UPDATE**

Current SQL:
```sql
UPDATE sessions SET sleep = ?, soreness = ?, energy = ? WHERE id = ?
```

Change to:
```sql
UPDATE sessions SET sleep = ?, soreness = ?, energy = ?, updated_at = datetime('now') WHERE id = ?
```

- [ ] **Step 3: Update `completeSession()` UPDATE**

Current SQL:
```sql
UPDATE sessions SET completed_at = ? WHERE id = ?
```

Change to:
```sql
UPDATE sessions SET completed_at = ?, updated_at = datetime('now') WHERE id = ?
```

- [ ] **Step 4: Update `updateSessionNotes()` UPDATE**

Current SQL:
```sql
UPDATE sessions SET notes = ? WHERE id = ?
```

Change to:
```sql
UPDATE sessions SET notes = ?, updated_at = datetime('now') WHERE id = ?
```

- [ ] **Step 5: Update `logSet()` INSERT**

Current SQL:
```sql
INSERT INTO set_logs
 (id, session_id, exercise_id, set_number, target_weight, target_reps,
  actual_weight, actual_reps, target_distance, actual_distance,
  target_duration, actual_duration, target_time, actual_time,
  rpe, status, timestamp, is_adhoc)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

Add `updated_at`:
```sql
INSERT INTO set_logs
 (id, session_id, exercise_id, set_number, target_weight, target_reps,
  actual_weight, actual_reps, target_distance, actual_distance,
  target_duration, actual_duration, target_time, actual_time,
  rpe, status, timestamp, is_adhoc, updated_at)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
```

- [ ] **Step 6: Update `updateSet()` UPDATE**

This function dynamically builds the SET clause. Add `updated_at = datetime('now')` to the SET fields list. Find the line that builds the fields array and append `updated_at = datetime('now')` to the SQL string (not as a parameter — it's a SQL expression).

After all conditional fields are built, before the final `WHERE id = ?`, append:
```typescript
fields.push('updated_at = datetime(\'now\')');
```

Note: This goes into the `fields` array but does NOT add a parameter (it's a literal SQL expression, not a `?` placeholder).

- [ ] **Step 7: Update `insertSessionProtocols()` INSERT**

Current SQL:
```sql
INSERT INTO session_protocols (session_id, type, protocol_key, protocol_name, sort_order)
 VALUES (?, ?, ?, ?, ?)
```

Change to:
```sql
INSERT INTO session_protocols (session_id, type, protocol_key, protocol_name, sort_order, updated_at)
 VALUES (?, ?, ?, ?, ?, datetime('now'))
```

- [ ] **Step 8: Update `updateProtocolCompletion()` UPDATE**

Current SQL:
```sql
UPDATE session_protocols SET completed = ? WHERE id = ?
```

Change to:
```sql
UPDATE session_protocols SET completed = ?, updated_at = datetime('now') WHERE id = ?
```

- [ ] **Step 9: Update `ensureExerciseExists()` INSERT OR REPLACE**

Current SQL:
```sql
INSERT OR REPLACE INTO exercises (id, name, type, muscle_groups, alternatives, input_fields)
 VALUES (?, ?, ?, ?, ?, ?)
```

Change to:
```sql
INSERT OR REPLACE INTO exercises (id, name, type, muscle_groups, alternatives, input_fields, updated_at)
 VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
```

- [ ] **Step 10: Add `updated_at` assertions to sessions tests**

In `__tests__/db/sessions.test.ts`, for each test that verifies SQL calls, add assertions that the SQL string contains `updated_at`. Example pattern:

```typescript
// In the createSession test:
expect(mockDb.runAsync).toHaveBeenCalledWith(
  expect.stringContaining('updated_at'),
  expect.any(Array),
);
```

Add similar assertions for `updateReadiness`, `completeSession`, `logSet`, `updateSet`, `insertSessionProtocols`, `updateProtocolCompletion`.

- [ ] **Step 11: Run tests**

Run: `npm test -- --testPathPattern="sessions"`
Expected: All PASS.

- [ ] **Step 12: Commit**

```bash
git add src/db/sessions.ts __tests__/db/sessions.test.ts
git commit -m "feat: add updated_at to all sessions/set_logs/protocol writes"
```

---

### Task 3: DB layer — Add `updated_at` to programs.ts writes

**Files:**
- Modify: `src/db/programs.ts`
- Modify: `__tests__/db/programs.test.ts`

- [ ] **Step 1: Update `importProgram()` INSERT**

Current SQL:
```sql
INSERT INTO programs (id, name, duration_weeks, created_date, status, definition_json, bundled_id)
 VALUES (?, ?, ?, ?, 'inactive', ?, ?)
```

Change to:
```sql
INSERT INTO programs (id, name, duration_weeks, created_date, status, definition_json, bundled_id, updated_at)
 VALUES (?, ?, ?, ?, 'inactive', ?, ?, datetime('now'))
```

Also update the exercise INSERT OR REPLACE within the import loop (same change as ensureExerciseExists in Task 2 — add `updated_at`):
```sql
INSERT OR REPLACE INTO exercises (id, name, type, muscle_groups, alternatives, input_fields, updated_at)
 VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
```

- [ ] **Step 2: Update `refreshBundledProgram()` UPDATE + exercises**

Program UPDATE:
```sql
UPDATE programs SET definition_json = ?, name = ?, bundled_id = ?, updated_at = datetime('now') WHERE id = ?
```

Exercise INSERT OR REPLACE (same as Step 1).

- [ ] **Step 3: Update `activateProgram()` UPDATEs**

First UPDATE (deactivate current):
```sql
UPDATE programs SET status = 'completed', updated_at = datetime('now') WHERE status = 'active'
```

Second UPDATE (activate new):
```sql
UPDATE programs SET status = 'active', one_rm_values = NULL, activated_date = ?, updated_at = datetime('now')
 WHERE id = ?
```

- [ ] **Step 4: Update `stopProgram()` UPDATEs**

Both UPDATE branches need `updated_at = datetime('now')` added to SET clause.

- [ ] **Step 5: Add `updated_at` assertions to programs tests**

In `__tests__/db/programs.test.ts`, verify SQL contains `updated_at` for each write operation.

- [ ] **Step 6: Run tests**

Run: `npm test -- --testPathPattern="programs"`
Expected: All PASS.

- [ ] **Step 7: Commit**

```bash
git add src/db/programs.ts __tests__/db/programs.test.ts
git commit -m "feat: add updated_at to all programs/exercises writes"
```

---

### Task 4: DB layer — Add `updated_at` to runs, notes, personal-records

**Files:**
- Modify: `src/db/runs.ts`
- Modify: `src/db/notes.ts`
- Modify: `src/db/personal-records.ts`
- Modify: `__tests__/db/runs.test.ts`
- Modify: `__tests__/db/notes.test.ts`
- Modify: `__tests__/db/personal-records.test.ts`

- [ ] **Step 1: Update `logRun()` INSERT in runs.ts**

Current SQL:
```sql
INSERT INTO run_logs (id, session_id, date, duration_min, distance, pain_level, notes, included_pickups)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
```

Change to:
```sql
INSERT INTO run_logs (id, session_id, date, duration_min, distance, pain_level, notes, included_pickups, updated_at)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
```

- [ ] **Step 2: Update `updateRun()` UPDATE in runs.ts**

Current SQL:
```sql
UPDATE run_logs SET duration_min = ?, distance = ?, pain_level = ?, notes = ?, included_pickups = ? WHERE id = ?
```

Change to:
```sql
UPDATE run_logs SET duration_min = ?, distance = ?, pain_level = ?, notes = ?, included_pickups = ?, updated_at = datetime('now') WHERE id = ?
```

- [ ] **Step 3: Update `updateRunPain24h()` UPDATE in runs.ts**

Current SQL:
```sql
UPDATE run_logs SET pain_level_24h = ? WHERE id = ?
```

Change to:
```sql
UPDATE run_logs SET pain_level_24h = ?, updated_at = datetime('now') WHERE id = ?
```

- [ ] **Step 4: Update `saveExerciseNote()` in notes.ts**

Current SQL:
```sql
INSERT OR REPLACE INTO exercise_notes (id, session_id, exercise_id, note, created_at)
 VALUES (
   COALESCE((SELECT id FROM exercise_notes WHERE session_id = ? AND exercise_id = ?), ?),
   ?, ?, ?, datetime('now')
 )
```

Change to:
```sql
INSERT OR REPLACE INTO exercise_notes (id, session_id, exercise_id, note, created_at, updated_at)
 VALUES (
   COALESCE((SELECT id FROM exercise_notes WHERE session_id = ? AND exercise_id = ?), ?),
   ?, ?, ?, datetime('now'), datetime('now')
 )
```

- [ ] **Step 5: Update `detectPRs()` INSERT in personal-records.ts**

Current SQL:
```sql
INSERT INTO personal_records (id, exercise_id, record_type, rep_count, value, previous_value, session_id, date)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
```

Change to:
```sql
INSERT INTO personal_records (id, exercise_id, record_type, rep_count, value, previous_value, session_id, date, updated_at)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
```

- [ ] **Step 6: Add `updated_at` assertions to all three test files**

Add `expect.stringContaining('updated_at')` assertions for each write operation in runs.test.ts, notes.test.ts, and personal-records.test.ts.

- [ ] **Step 7: Run tests**

Run: `npm test -- --testPathPattern="(runs|notes|personal-records)"`
Expected: All PASS.

- [ ] **Step 8: Commit**

```bash
git add src/db/runs.ts src/db/notes.ts src/db/personal-records.ts __tests__/db/runs.test.ts __tests__/db/notes.test.ts __tests__/db/personal-records.test.ts
git commit -m "feat: add updated_at to run_logs, exercise_notes, personal_records writes"
```

---

### Task 5: Sync config — Table mapping definitions

**Files:**
- Create: `src/sync/syncConfig.ts`
- Create: `__tests__/sync/syncConfig.test.ts`

- [ ] **Step 1: Write syncConfig tests**

```typescript
// __tests__/sync/syncConfig.test.ts
import { SYNC_TABLES, transformRow } from '../../src/sync/syncConfig';

describe('syncConfig', () => {
  describe('SYNC_TABLES', () => {
    it('defines 9 syncable tables', () => {
      expect(Object.keys(SYNC_TABLES)).toHaveLength(9);
    });

    it('includes all expected tables', () => {
      const expected = [
        'sessions', 'set_logs', 'exercises', 'programs', 'run_logs',
        'exercise_notes', 'personal_records', 'session_protocols',
        'daily_health',
      ];
      for (const table of expected) {
        expect(SYNC_TABLES).toHaveProperty(table);
      }
    });
  });

  describe('transformRow', () => {
    it('strips is_sample from all tables', () => {
      const row = { id: '1', date: '2026-03-22', is_sample: 0, updated_at: 'now' };
      const result = transformRow('sessions', row);
      expect(result).not.toHaveProperty('is_sample');
    });

    it('strips day_template_id from sessions', () => {
      const row = { id: '1', date: '2026-03-22', day_template_id: 'dt1', updated_at: 'now' };
      const result = transformRow('sessions', row);
      expect(result).not.toHaveProperty('day_template_id');
    });

    it('strips raw_json and created_at from daily_health', () => {
      const row = { id: 1, date: '2026-03-22', source: 'whoop', raw_json: '{}', created_at: 'x', updated_at: 'now' };
      const result = transformRow('daily_health', row);
      expect(result).not.toHaveProperty('raw_json');
      expect(result).not.toHaveProperty('created_at');
    });

    it('generates deterministic ID for daily_health', () => {
      const row = { id: 1, date: '2026-03-22', source: 'whoop', updated_at: 'now' };
      const result = transformRow('daily_health', row);
      expect(result.id).toBe('apex-health-2026-03-22');
    });

    it('generates deterministic ID for session_protocols', () => {
      const row = { id: 5, session_id: 'sess-1', type: 'warmup', protocol_key: 'foam_roll', protocol_name: 'Foam Roll', sort_order: 0, updated_at: 'now' };
      const result = transformRow('session_protocols', row);
      expect(result.id).toBe('apex-proto-sess-1-warmup-0');
    });

    it('handles null protocol_key in session_protocols', () => {
      const row = { id: 5, session_id: 'sess-1', type: 'warmup', protocol_key: null, protocol_name: 'Custom', sort_order: 2, updated_at: 'now' };
      const result = transformRow('session_protocols', row);
      expect(result.id).toBe('apex-proto-sess-1-warmup-2');
    });

    it('renames activated_date to started_at for programs', () => {
      const row = { id: 'p1', name: 'Test', status: 'active', activated_date: '2026-01-01', updated_at: 'now' };
      const result = transformRow('programs', row);
      expect(result).toHaveProperty('started_at', '2026-01-01');
      expect(result).not.toHaveProperty('activated_date');
    });

    it('strips bundled_id and created_date from programs', () => {
      const row = { id: 'p1', name: 'Test', bundled_id: 'b1', created_date: '2026-01-01', updated_at: 'now' };
      const result = transformRow('programs', row);
      expect(result).not.toHaveProperty('bundled_id');
      expect(result).not.toHaveProperty('created_date');
    });

    it('keeps created_at for exercise_notes', () => {
      const row = { id: 'n1', session_id: 's1', exercise_id: 'e1', note: 'test', created_at: '2026-01-01', is_sample: 0, updated_at: 'now' };
      const result = transformRow('exercise_notes', row);
      expect(result).toHaveProperty('created_at', '2026-01-01');
      expect(result).not.toHaveProperty('is_sample');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="syncConfig"`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement syncConfig.ts**

```typescript
// src/sync/syncConfig.ts

export type SyncTableName =
  | 'sessions' | 'set_logs' | 'exercises' | 'programs' | 'run_logs'
  | 'exercise_notes' | 'personal_records' | 'session_protocols' | 'daily_health';

interface TableSyncConfig {
  /** Columns to strip before pushing */
  excludeColumns: string[];
  /** Local column → D1 column renames */
  columnRenames?: Record<string, string>;
  /** Generate a text ID from row data (for tables with integer autoincrement PKs) */
  idTransform?: (row: Record<string, unknown>) => string;
  /**
   * Custom SQL query for sync (replaces default SELECT *).
   * Must include WHERE updated_at > ? AND (is_sample IS NULL OR is_sample = 0) filtering.
   * The ? placeholder is for the last-sync timestamp.
   */
  customQuery?: string;
}

export const SYNC_TABLES: Record<SyncTableName, TableSyncConfig> = {
  sessions: {
    excludeColumns: ['is_sample', 'day_template_id'],
    customQuery: `
      SELECT s.*, p.name AS program_name
      FROM sessions s
      LEFT JOIN programs p ON s.program_id = p.id
      WHERE s.updated_at > ? AND (s.is_sample IS NULL OR s.is_sample = 0)
    `,
  },
  set_logs: {
    excludeColumns: ['is_sample'],
    customQuery: `
      SELECT sl.*, e.name AS exercise_name
      FROM set_logs sl
      LEFT JOIN exercises e ON sl.exercise_id = e.id
      WHERE sl.updated_at > ? AND (sl.is_sample IS NULL OR sl.is_sample = 0)
    `,
  },
  exercises: {
    excludeColumns: ['is_sample'],
  },
  programs: {
    excludeColumns: ['is_sample', 'bundled_id', 'created_date'],
    columnRenames: { activated_date: 'started_at' },
  },
  run_logs: {
    excludeColumns: ['is_sample'],
  },
  exercise_notes: {
    excludeColumns: ['is_sample'],
    // Note: created_at is NOT excluded — it's retained in D1 per spec
  },
  personal_records: {
    excludeColumns: ['is_sample'],
  },
  session_protocols: {
    excludeColumns: ['is_sample'],
    idTransform: (row) =>
      `apex-proto-${row.session_id}-${row.type}-${row.sort_order}`,
  },
  daily_health: {
    excludeColumns: ['raw_json', 'created_at'],
    idTransform: (row) => `apex-health-${row.date}`,
  },
};

const DEFAULT_QUERY = (table: string) => `
  SELECT * FROM ${table}
  WHERE updated_at > ? AND (is_sample IS NULL OR is_sample = 0)
`;

/**
 * Get the SQL query for fetching changed rows from a syncable table.
 */
export function getSyncQuery(table: SyncTableName): string {
  return SYNC_TABLES[table].customQuery ?? DEFAULT_QUERY(table);
}

/**
 * Transform a local DB row into the shape expected by the D1 cloud schema.
 * Strips excluded columns, applies renames, generates IDs where needed.
 */
export function transformRow(
  table: SyncTableName,
  row: Record<string, unknown>,
): Record<string, unknown> {
  const config = SYNC_TABLES[table];
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    if (config.excludeColumns.includes(key)) continue;

    const renamedKey = config.columnRenames?.[key] ?? key;
    result[renamedKey] = value;
  }

  // Apply ID transform if needed (overwrites integer autoincrement ID)
  if (config.idTransform) {
    result.id = config.idTransform(row);
  }

  return result;
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- --testPathPattern="syncConfig"`
Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sync/syncConfig.ts __tests__/sync/syncConfig.test.ts
git commit -m "feat: add sync table configuration with transforms"
```

---

### Task 6: Sync storage — Last-sync timestamp persistence

**Files:**
- Create: `src/sync/syncStorage.ts`
- Create: `__tests__/sync/syncStorage.test.ts`

- [ ] **Step 1: Write syncStorage tests**

```typescript
// __tests__/sync/syncStorage.test.ts
import { getLastSync, setLastSync } from '../../src/sync/syncStorage';

jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn(),
}));

import { getDatabase } from '../../src/db/database';

describe('syncStorage', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      getFirstAsync: jest.fn(),
      runAsync: jest.fn(),
    };
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  describe('getLastSync', () => {
    it('returns null when no timestamp stored', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);
      const result = await getLastSync('sessions');
      expect(result).toBeNull();
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        'SELECT value FROM schema_info WHERE key = ?',
        ['sync_last_sessions'],
      );
    });

    it('returns stored timestamp', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ value: '2026-03-22T10:00:00Z' });
      const result = await getLastSync('sessions');
      expect(result).toBe('2026-03-22T10:00:00Z');
    });
  });

  describe('setLastSync', () => {
    it('upserts timestamp into schema_info', async () => {
      await setLastSync('sessions', '2026-03-22T10:00:00Z');
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO schema_info'),
        ['sync_last_sessions', '2026-03-22T10:00:00Z'],
      );
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="syncStorage"`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement syncStorage.ts**

```typescript
// src/sync/syncStorage.ts
import { getDatabase } from '../db/database';

const KEY_PREFIX = 'sync_last_';

export async function getLastSync(table: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM schema_info WHERE key = ?',
    [KEY_PREFIX + table],
  );
  return row?.value ?? null;
}

export async function setLastSync(table: string, timestamp: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO schema_info (key, value) VALUES (?, ?)',
    [KEY_PREFIX + table, timestamp],
  );
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- --testPathPattern="syncStorage"`
Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sync/syncStorage.ts __tests__/sync/syncStorage.test.ts
git commit -m "feat: add sync timestamp storage via schema_info"
```

---

### Task 7: Sync client — Core sync logic

**Files:**
- Create: `src/sync/syncClient.ts`
- Create: `__tests__/sync/syncClient.test.ts`

- [ ] **Step 1: Write syncClient tests**

```typescript
// __tests__/sync/syncClient.test.ts
import { syncTable, syncAll } from '../../src/sync/syncClient';

jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn(),
}));

jest.mock('../../src/sync/syncStorage', () => ({
  getLastSync: jest.fn(),
  setLastSync: jest.fn(),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { getDatabase } from '../../src/db/database';
import { getLastSync, setLastSync } from '../../src/sync/syncStorage';

describe('syncClient', () => {
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      getAllAsync: jest.fn().mockResolvedValue([]),
    };
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
    (getLastSync as jest.Mock).mockResolvedValue(null);
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ synced: 1, errors: 0 }),
    });
  });

  describe('syncTable', () => {
    it('skips when no changed rows', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);
      await syncTable('sessions');
      expect(mockFetch).not.toHaveBeenCalled();
      expect(setLastSync).not.toHaveBeenCalled();
    });

    it('pushes changed rows to the Worker', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        { id: 's1', program_id: 'p1', date: '2026-03-22', is_sample: 0, updated_at: '2026-03-22T10:00:00Z' },
      ]);

      await syncTable('sessions');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1/sessions');
      expect(options.method).toBe('POST');

      const body = JSON.parse(options.body);
      expect(body.app_id).toBe('apex');
      expect(body.records).toHaveLength(1);
      expect(body.records[0]).not.toHaveProperty('is_sample');
    });

    it('updates last-sync timestamp on success', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        { id: 's1', date: '2026-03-22', updated_at: '2026-03-22T10:00:00Z', is_sample: 0 },
        { id: 's2', date: '2026-03-23', updated_at: '2026-03-23T08:00:00Z', is_sample: 0 },
      ]);

      await syncTable('sessions');

      expect(setLastSync).toHaveBeenCalledWith('sessions', '2026-03-23T08:00:00Z');
    });

    it('does NOT update timestamp on failure', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        { id: 's1', date: '2026-03-22', updated_at: '2026-03-22T10:00:00Z', is_sample: 0 },
      ]);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Database error' }),
      });

      await syncTable('sessions');

      expect(setLastSync).not.toHaveBeenCalled();
    });

    it('uses epoch as default last-sync when no timestamp stored', async () => {
      (getLastSync as jest.Mock).mockResolvedValue(null);
      mockDb.getAllAsync.mockResolvedValue([]);

      await syncTable('sessions');

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.any(String),
        ['1970-01-01T00:00:00Z'],
      );
    });
  });

  describe('syncAll', () => {
    it('syncs all tables independently', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);
      await syncAll();
      // Should have queried all 9 syncable tables
      expect(mockDb.getAllAsync).toHaveBeenCalledTimes(9);
    });

    it('continues syncing other tables when one fails', async () => {
      let callCount = 0;
      mockDb.getAllAsync.mockImplementation(() => {
        callCount++;
        if (callCount === 1) throw new Error('DB error');
        return Promise.resolve([]);
      });

      await syncAll(); // Should not throw

      // Should have attempted all 9 tables despite first failure
      expect(mockDb.getAllAsync).toHaveBeenCalledTimes(9);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="syncClient"`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement syncClient.ts**

```typescript
// src/sync/syncClient.ts
import { getDatabase } from '../db/database';
import { SYNC_TABLES, getSyncQuery, transformRow, type SyncTableName } from './syncConfig';
import { getLastSync, setLastSync } from './syncStorage';
import { WHOOP_WORKER_URL, WHOOP_WORKER_API_KEY } from '../health/config';

const EPOCH = '1970-01-01T00:00:00Z';

/**
 * Sync a single table: query changed rows, transform, push to Worker.
 */
export async function syncTable(table: SyncTableName): Promise<void> {
  const db = await getDatabase();
  const lastSync = await getLastSync(table) ?? EPOCH;
  const query = getSyncQuery(table);

  const rows = await db.getAllAsync<Record<string, unknown>>(query, [lastSync]);

  if (rows.length === 0) return;

  const records = rows.map((row) => transformRow(table, row));

  const response = await fetch(`${WHOOP_WORKER_URL}/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': WHOOP_WORKER_API_KEY,
    },
    body: JSON.stringify({
      app_id: 'apex',
      records,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.warn(`[sync] Failed to push ${table}: ${response.status}`, errorBody);
    return;
  }

  // Update last-sync to max updated_at of pushed rows
  const maxUpdatedAt = rows.reduce((max, row) => {
    const val = row.updated_at as string;
    return val > max ? val : max;
  }, '');

  if (maxUpdatedAt) {
    await setLastSync(table, maxUpdatedAt);
  }
}

/**
 * Sync all tables. Tables are independent — one failure doesn't block others.
 */
export async function syncAll(): Promise<void> {
  const tables = Object.keys(SYNC_TABLES) as SyncTableName[];

  for (const table of tables) {
    try {
      await syncTable(table);
    } catch (err) {
      console.warn(`[sync] Error syncing ${table}:`, err);
    }
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- --testPathPattern="syncClient"`
Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sync/syncClient.ts __tests__/sync/syncClient.test.ts
git commit -m "feat: add sync client with per-table push logic"
```

---

### Task 8: Sync hook — Trigger on app open + session complete

**Files:**
- Create: `src/sync/useSyncOnOpen.ts`
- Modify: `app/_layout.tsx`
- Modify: `src/db/sessions.ts` (add sync trigger after completeSession)

- [ ] **Step 1: Create useSyncOnOpen hook**

```typescript
// src/sync/useSyncOnOpen.ts
import { useEffect, useRef } from 'react';
import { syncAll } from './syncClient';

/**
 * Triggers a background sync on app mount. Non-blocking.
 * Only fires once per app launch.
 */
export function useSyncOnOpen(): void {
  const hasSynced = useRef(false);

  useEffect(() => {
    if (hasSynced.current) return;
    hasSynced.current = true;

    // Fire and forget — don't await
    syncAll().catch((err) => {
      console.warn('[sync] Background sync failed:', err);
    });
  }, []);
}
```

- [ ] **Step 2: Add hook to root layout**

In `app/_layout.tsx`, add import and call the hook inside the root component, after existing hooks:

```typescript
import { useSyncOnOpen } from '../src/sync/useSyncOnOpen';
```

Inside the component body (after other hooks):
```typescript
useSyncOnOpen();
```

- [ ] **Step 3: Add sync trigger to session completion**

In `src/db/sessions.ts`, in the `completeSession()` function, after the UPDATE query, add a fire-and-forget sync call:

```typescript
import { syncAll } from '../sync/syncClient';
```

At the end of `completeSession()`, after the DB write:
```typescript
// Trigger background sync after completing a session
syncAll().catch((err) => {
  console.warn('[sync] Post-session sync failed:', err);
});
```

- [ ] **Step 4: Run all tests to verify nothing broke**

Run: `npm test`
Expected: All PASS. (The sync hook test would need mocking if we added a test for it, but useSyncOnOpen is thin enough to skip a dedicated unit test — it's just a useEffect wrapper.)

- [ ] **Step 5: Commit**

```bash
git add src/sync/useSyncOnOpen.ts app/_layout.tsx src/db/sessions.ts
git commit -m "feat: trigger cloud sync on app open and session complete"
```

---

### Task 9: Create index file + final verification

**Files:**
- Create: `src/sync/index.ts`

- [ ] **Step 1: Create barrel export**

```typescript
// src/sync/index.ts
export { syncAll, syncTable } from './syncClient';
export { useSyncOnOpen } from './useSyncOnOpen';
```

- [ ] **Step 2: Run full test suite**

Run: `npm test`
Expected: All PASS.

- [ ] **Step 3: Commit**

```bash
git add src/sync/index.ts
git commit -m "feat: add sync module barrel export"
```

- [ ] **Step 4: Verify on device (manual)**

Run: `npm run device`

After install:
1. Open the app — check Cloudflare Workers logs (`cd workers/health-api && npx wrangler tail`) for incoming sync requests
2. Complete a workout session — verify another round of sync requests appears
3. Check D1 data: `cd workers/health-api && npx wrangler d1 execute apex-health-db --remote --command="SELECT COUNT(*) FROM sessions"`
