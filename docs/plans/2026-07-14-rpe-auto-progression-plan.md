# RPE Auto-Progression for Accessories — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When an accessory exercise is completed at full prescribed reps with a low RPE, offer a one-tap weight increase via an inline chip; after two missed sessions in a row, offer a decrease. Accepted adjustments persist, pre-fill the next session, and show as history on the exercise detail screen.

**Architecture:** A pure decision function (`src/utils/progression.ts`) evaluates the rules at RPE-tap time inside `useWorkoutSession`. Accepted suggestions are recorded as rows in a new `weight_adjustments` table (event log); weight pre-fill resolution gains one step that honors an un-trained adjustment. UI: a chip in `ExerciseCard` beneath the RPE row, plus a progression card + increment editor on the exercise detail screen with two full-page list screens.

**Tech Stack:** React Native (Expo SDK 54), expo-sqlite, expo-router, TypeScript strict, Jest + @testing-library/react-native.

**Spec:** `docs/plans/2026-07-13-rpe-auto-progression-design.md`
**Mockups (visual contract):** `docs/mockups/workout-rpe-suggestion-2026-07-14.html`, `docs/mockups/exercise-detail-progression-2026-07-14.html`

## Global Constraints

- Work on branch `feat/rpe-auto-progression`. Never push or merge without Ben's explicit approval.
- TDD: every task writes the failing test first, watches it fail, then implements.
- Design tokens only — import `Colors`, `Spacing`, `FontSize`, `BorderRadius`, `ComponentSize` from `../theme` (components) — never raw hex/number literals in component styles.
- Scope: suggestions apply ONLY to template slots with `category === 'accessory'`; never ad-hoc exercises (`isAdhoc`).
- Exact UI copy: increase chip `Felt easy — {W} lbs next time?`; decrease chip `Tough two weeks — drop to {W} lbs next time?`; accepted confirmation `{W} lbs locked in for next session`; adjustment reasons stored as `'easy'` | `'misses'`.
- Default weight increment: 5 lbs (`DEFAULT_WEIGHT_INCREMENT`).
- RPE threshold: parsed lower bound of the block's `accessory_scheme.rpe_target` (`"7-8"` → 7). No target (e.g. Deload block) → feature fully silent (no increase AND no decrease suggestions).
- Run `npm test` at the end of every task; the full suite must be green before each commit.

---

### Task 1: Schema v17 — `weight_adjustments` table + `exercises.weight_increment`

**Files:**
- Modify: `src/db/schema.ts` (SCHEMA_VERSION 16→17; add column + table to CREATE_TABLES)
- Modify: `src/db/migrations.ts` (new DI helper `ensureProgressionSchema`)
- Modify: `src/db/database.ts` (call the helper for `currentVersion < 17`)
- Modify: `src/types/training.ts` (add `WeightAdjustment`, extend `Exercise`)
- Test: `__tests__/db/migrations.test.ts`

**Interfaces:**
- Consumes: existing migration pattern (`archiveLegacyV2Programs` is the model).
- Produces: `weight_adjustments` table; `exercises.weight_increment REAL` column; type `WeightAdjustment { id, exercise_id, program_id, session_id, old_weight, new_weight, reason: 'easy' | 'misses', created_at }` exported from `src/types` (via `training.ts`).

- [ ] **Step 1: Write the failing test** — append to `__tests__/db/migrations.test.ts`:

```ts
import { ensureProgressionSchema } from '../../src/db/migrations';

describe('ensureProgressionSchema (v17)', () => {
  it('adds exercises.weight_increment and creates weight_adjustments + index', async () => {
    const db = { execAsync: jest.fn().mockResolvedValue(undefined) };

    await ensureProgressionSchema(db);

    const sql = (db.execAsync as jest.Mock).mock.calls.map(c => c[0] as string).join('\n');
    expect(sql).toMatch(/ALTER TABLE exercises ADD COLUMN weight_increment REAL/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS weight_adjustments/);
    expect(sql).toMatch(/reason TEXT NOT NULL CHECK \(reason IN \('easy','misses'\)\)/);
    expect(sql).toMatch(/CREATE INDEX IF NOT EXISTS idx_weight_adjustments_exercise/);
  });

  it('swallows ALTER failure when the column already exists', async () => {
    const db = {
      execAsync: jest.fn()
        .mockRejectedValueOnce(new Error('duplicate column name'))
        .mockResolvedValue(undefined),
    };
    await expect(ensureProgressionSchema(db)).resolves.toBeUndefined();
    expect(db.execAsync).toHaveBeenCalledTimes(3); // failed ALTER + table + index
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/db/migrations.test.ts -t ensureProgressionSchema`
Expected: FAIL — `ensureProgressionSchema` is not exported.

- [ ] **Step 3: Implement**

`src/db/migrations.ts` — append (match the existing DI style of `archiveLegacyV2Programs`):

```ts
/** v17: RPE auto-progression — per-exercise increment + accepted-adjustment event log */
export async function ensureProgressionSchema(
  db: { execAsync: (sql: string) => Promise<unknown> }
): Promise<void> {
  try {
    await db.execAsync('ALTER TABLE exercises ADD COLUMN weight_increment REAL');
  } catch { /* already exists */ }
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS weight_adjustments (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      program_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      old_weight REAL NOT NULL,
      new_weight REAL NOT NULL,
      reason TEXT NOT NULL CHECK (reason IN ('easy','misses')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_weight_adjustments_exercise ON weight_adjustments(exercise_id, created_at DESC)'
  );
}
```

`src/db/schema.ts`:
1. `export const SCHEMA_VERSION = 17;`
2. In the `exercises` CREATE TABLE, add `weight_increment REAL,` after the `input_fields TEXT,` line (fresh installs get it without the ALTER).
3. Append to `CREATE_TABLES` (same SQL as the helper's table + index, so fresh installs match migrated ones):

```sql
-- Accepted auto-progression adjustments (issue #45)
CREATE TABLE IF NOT EXISTS weight_adjustments (
  id TEXT PRIMARY KEY,
  exercise_id TEXT NOT NULL,
  program_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  old_weight REAL NOT NULL,
  new_weight REAL NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('easy','misses')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_weight_adjustments_exercise ON weight_adjustments(exercise_id, created_at DESC);
```

`src/db/database.ts` — after the `< 16` block, following the same pattern:

```ts
// v17: RPE auto-progression schema (issue #45)
if (currentVersion < 17) {
  await ensureProgressionSchema(db);
}
```

and add `ensureProgressionSchema` to the existing import from `./migrations`.

`src/types/training.ts` — append:

```ts
export interface WeightAdjustment {
  id: string;
  exercise_id: string;
  program_id: string;
  session_id: string;
  old_weight: number;
  new_weight: number;
  reason: 'easy' | 'misses';
  created_at: string;
}
```

and add `weight_increment?: number | null;` to the existing `Exercise` interface.

- [ ] **Step 4: Run tests**

Run: `npx jest __tests__/db/migrations.test.ts` → PASS, then `npm test` → all green.

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts src/db/migrations.ts src/db/database.ts src/types/training.ts __tests__/db/migrations.test.ts
git commit -m "feat: schema v17 — weight_adjustments table + exercises.weight_increment (#45)"
```

---

### Task 2: DB module `src/db/weightAdjustments.ts`

**Files:**
- Create: `src/db/weightAdjustments.ts`
- Modify: `src/db/index.ts` (re-export)
- Test: `__tests__/db/weightAdjustments.test.ts`

**Interfaces:**
- Consumes: `getDatabase`, `generateId` from `./database`; `WeightAdjustment` from `../types`.
- Produces (later tasks call these exact signatures):
  - `DEFAULT_WEIGHT_INCREMENT = 5`
  - `recordAdjustment(params: { exerciseId: string; programId: string; sessionId: string; oldWeight: number; newWeight: number; reason: 'easy' | 'misses' }): Promise<string>`
  - `getLatestAdjustment(exerciseId: string): Promise<WeightAdjustment | null>`
  - `getAdjustmentHistory(exerciseId: string, limit?: number): Promise<WeightAdjustment[]>`
  - `getWeightIncrement(exerciseId: string): Promise<number>` (COALESCE to default 5)
  - `setWeightIncrement(exerciseId: string, increment: number): Promise<void>`

- [ ] **Step 1: Write the failing test** — create `__tests__/db/weightAdjustments.test.ts` (mock-db pattern copied from `sessions.test.ts`):

```ts
import { getDatabase, generateId } from '../../src/db/database';
import {
  recordAdjustment, getLatestAdjustment, getAdjustmentHistory,
  getWeightIncrement, setWeightIncrement, DEFAULT_WEIGHT_INCREMENT,
} from '../../src/db/weightAdjustments';

jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn(),
  generateId: jest.fn(() => 'adj-id-1'),
}));

function createMockDb() {
  return {
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
  };
}

describe('weightAdjustments', () => {
  let mockDb: ReturnType<typeof createMockDb>;
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  it('recordAdjustment inserts a row and returns the generated id', async () => {
    const id = await recordAdjustment({
      exerciseId: 'dips', programId: 'prog-1', sessionId: 'sess-1',
      oldWeight: 70, newWeight: 75, reason: 'easy',
    });
    expect(id).toBe('adj-id-1');
    const [sql, values] = mockDb.runAsync.mock.calls[0];
    expect(sql).toMatch(/INSERT INTO weight_adjustments/);
    expect(values).toEqual(['adj-id-1', 'dips', 'prog-1', 'sess-1', 70, 75, 'easy']);
  });

  it('getLatestAdjustment returns the newest row for the exercise', async () => {
    const row = {
      id: 'a', exercise_id: 'dips', program_id: 'p', session_id: 's',
      old_weight: 70, new_weight: 75, reason: 'easy', created_at: '2026-07-14',
    };
    mockDb.getFirstAsync.mockResolvedValue(row);
    const result = await getLatestAdjustment('dips');
    expect(result).toEqual(row);
    const [sql, values] = mockDb.getFirstAsync.mock.calls[0];
    expect(sql).toMatch(/ORDER BY created_at DESC, id DESC LIMIT 1/);
    expect(values).toEqual(['dips']);
  });

  it('getAdjustmentHistory passes LIMIT only when given', async () => {
    await getAdjustmentHistory('dips', 3);
    expect(mockDb.getAllAsync.mock.calls[0][0]).toMatch(/LIMIT \?/);
    expect(mockDb.getAllAsync.mock.calls[0][1]).toEqual(['dips', 3]);

    await getAdjustmentHistory('dips');
    expect(mockDb.getAllAsync.mock.calls[1][0]).not.toMatch(/LIMIT/);
    expect(mockDb.getAllAsync.mock.calls[1][1]).toEqual(['dips']);
  });

  it('getWeightIncrement falls back to the default when unset', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ weight_increment: null });
    expect(await getWeightIncrement('dips')).toBe(DEFAULT_WEIGHT_INCREMENT);
    mockDb.getFirstAsync.mockResolvedValue({ weight_increment: 10 });
    expect(await getWeightIncrement('lat_pulldown')).toBe(10);
    mockDb.getFirstAsync.mockResolvedValue(null); // unknown exercise
    expect(await getWeightIncrement('ghost')).toBe(DEFAULT_WEIGHT_INCREMENT);
  });

  it('setWeightIncrement updates the exercise row', async () => {
    await setWeightIncrement('dips', 10);
    const [sql, values] = mockDb.runAsync.mock.calls[0];
    expect(sql).toMatch(/UPDATE exercises SET weight_increment = \? WHERE id = \?/);
    expect(values).toEqual([10, 'dips']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/db/weightAdjustments.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** — create `src/db/weightAdjustments.ts`:

```ts
/**
 * APEX — Weight adjustment event log (RPE auto-progression, issue #45)
 * One row per ACCEPTED suggestion. Dismissals write nothing.
 */
import { getDatabase, generateId } from './database';
import type { WeightAdjustment } from '../types';

export const DEFAULT_WEIGHT_INCREMENT = 5;

export async function recordAdjustment(params: {
  exerciseId: string;
  programId: string;
  sessionId: string;
  oldWeight: number;
  newWeight: number;
  reason: 'easy' | 'misses';
}): Promise<string> {
  const db = await getDatabase();
  const id = generateId();
  await db.runAsync(
    `INSERT INTO weight_adjustments
       (id, exercise_id, program_id, session_id, old_weight, new_weight, reason)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, params.exerciseId, params.programId, params.sessionId,
     params.oldWeight, params.newWeight, params.reason]
  );
  return id;
}

export async function getLatestAdjustment(exerciseId: string): Promise<WeightAdjustment | null> {
  const db = await getDatabase();
  return await db.getFirstAsync<WeightAdjustment>(
    `SELECT * FROM weight_adjustments WHERE exercise_id = ?
     ORDER BY created_at DESC, id DESC LIMIT 1`,
    [exerciseId]
  );
}

export async function getAdjustmentHistory(
  exerciseId: string,
  limit?: number
): Promise<WeightAdjustment[]> {
  const db = await getDatabase();
  const sql = `SELECT * FROM weight_adjustments WHERE exercise_id = ?
     ORDER BY created_at DESC, id DESC${limit != null ? ' LIMIT ?' : ''}`;
  return db.getAllAsync<WeightAdjustment>(sql, limit != null ? [exerciseId, limit] : [exerciseId]);
}

export async function getWeightIncrement(exerciseId: string): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ weight_increment: number | null }>(
    'SELECT weight_increment FROM exercises WHERE id = ?',
    [exerciseId]
  );
  return row?.weight_increment ?? DEFAULT_WEIGHT_INCREMENT;
}

export async function setWeightIncrement(exerciseId: string, increment: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE exercises SET weight_increment = ? WHERE id = ?',
    [increment, exerciseId]
  );
}
```

Add to `src/db/index.ts` (match the existing re-export style):

```ts
export {
  recordAdjustment, getLatestAdjustment, getAdjustmentHistory,
  getWeightIncrement, setWeightIncrement, DEFAULT_WEIGHT_INCREMENT,
} from './weightAdjustments';
```

- [ ] **Step 4: Run tests** — `npx jest __tests__/db/weightAdjustments.test.ts` → PASS; `npm test` → green.

- [ ] **Step 5: Commit**

```bash
git add src/db/weightAdjustments.ts src/db/index.ts __tests__/db/weightAdjustments.test.ts
git commit -m "feat: weight adjustments DB module — record/query + per-exercise increment (#45)"
```

---

### Task 3: Pure decision logic `src/utils/progression.ts`

**Files:**
- Create: `src/utils/progression.ts`
- Modify: `src/hooks/useWorkoutSession.ts:35-45` (delete the private `getMostCommonWeight`, import it from the new module instead)
- Test: `__tests__/utils/progression.test.ts`

**Interfaces:**
- Produces (exact signatures used by Tasks 4–5):

```ts
export function getMostCommonWeight(sets: { actual_weight?: number | null }[]): number | undefined
export function parseRpeThreshold(rpeTarget: string | undefined | null): number | null
export interface ProgressionSetInput {
  status: 'pending' | 'completed' | 'completed_below' | 'skipped';
  weight?: number;      // actual (or target fallback) weight
  reps?: number;        // actual reps
  targetReps?: number;
}
export type ProgressionSuggestion =
  | { kind: 'increase' | 'decrease'; currentWeight: number; suggestedWeight: number }
  | null;
export function evaluateProgression(input: {
  category: string | undefined;
  rpe: number;
  rpeThreshold: number | null;
  increment: number;
  currentSets: ProgressionSetInput[];
  lastSessionSets: { status: string; actual_weight?: number | null }[];
}): ProgressionSuggestion
export function resolveWorkingWeight(params: {
  percentWeight: number;
  adjustment: { new_weight: number; session_id: string } | null;
  lastSets: { session_id: string; actual_weight?: number | null }[];
  defaultWeight?: number;
}): number
```

- [ ] **Step 1: Write the failing test** — create `__tests__/utils/progression.test.ts`:

```ts
import {
  getMostCommonWeight, parseRpeThreshold, evaluateProgression, resolveWorkingWeight,
} from '../../src/utils/progression';
import type { ProgressionSetInput } from '../../src/utils/progression';

const doneSets = (weight: number, reps = 10, targetReps = 10, count = 3): ProgressionSetInput[] =>
  Array.from({ length: count }, () => ({ status: 'completed' as const, weight, reps, targetReps }));

const BASE = {
  category: 'accessory' as string | undefined,
  rpe: 7,
  rpeThreshold: 7 as number | null,
  increment: 5,
  currentSets: doneSets(70),
  lastSessionSets: [] as { status: string; actual_weight?: number | null }[],
};

describe('parseRpeThreshold', () => {
  it('parses the lower bound of a range', () => expect(parseRpeThreshold('7-8')).toBe(7));
  it('parses a single value', () => expect(parseRpeThreshold('8')).toBe(8));
  it('returns null for missing/garbage', () => {
    expect(parseRpeThreshold(undefined)).toBeNull();
    expect(parseRpeThreshold(null)).toBeNull();
    expect(parseRpeThreshold('moderate')).toBeNull();
  });
});

describe('getMostCommonWeight', () => {
  it('returns the modal weight', () => {
    expect(getMostCommonWeight([
      { actual_weight: 70 }, { actual_weight: 70 }, { actual_weight: 75 },
    ])).toBe(70);
  });
  it('ignores null/zero and returns undefined when empty', () => {
    expect(getMostCommonWeight([{ actual_weight: null }, { actual_weight: 0 }])).toBeUndefined();
  });
});

describe('evaluateProgression — increase', () => {
  it('suggests +increment when all sets hit target reps and RPE ≤ threshold', () => {
    expect(evaluateProgression(BASE)).toEqual({
      kind: 'increase', currentWeight: 70, suggestedWeight: 75,
    });
  });
  it('uses the exercise increment', () => {
    expect(evaluateProgression({ ...BASE, increment: 10 })!.suggestedWeight).toBe(80);
  });
  it('does not suggest when RPE above threshold', () => {
    expect(evaluateProgression({ ...BASE, rpe: 8 })).toBeNull();
  });
  it('does not suggest for non-accessories', () => {
    expect(evaluateProgression({ ...BASE, category: 'main' })).toBeNull();
    expect(evaluateProgression({ ...BASE, category: undefined })).toBeNull();
  });
  it('is silent when the block has no RPE target (deload)', () => {
    expect(evaluateProgression({ ...BASE, rpeThreshold: null })).toBeNull();
  });
  it('does not suggest when any set missed reps', () => {
    const sets = [...doneSets(70, 10, 10, 2), { status: 'completed_below' as const, weight: 70, reps: 8, targetReps: 10 }];
    expect(evaluateProgression({ ...BASE, currentSets: sets })).toBeNull();
  });
  it('does not suggest when any set was skipped', () => {
    const sets = [...doneSets(70, 10, 10, 2), { status: 'skipped' as const, weight: 70, targetReps: 10 }];
    expect(evaluateProgression({ ...BASE, currentSets: sets })).toBeNull();
  });
  it('treats sets without a target-rep prescription as hit', () => {
    const sets: ProgressionSetInput[] = [{ status: 'completed', weight: 70, reps: 12 }];
    expect(evaluateProgression({ ...BASE, currentSets: sets })).not.toBeNull();
  });
});

describe('evaluateProgression — decrease', () => {
  const missNow = [...doneSets(70, 10, 10, 2), { status: 'completed_below' as const, weight: 70, reps: 7, targetReps: 10 }];
  const missLast = [{ status: 'completed_below', actual_weight: 70 }, { status: 'completed', actual_weight: 70 }];

  it('suggests -increment after misses in two consecutive sessions at the same weight', () => {
    expect(evaluateProgression({ ...BASE, rpe: 9, currentSets: missNow, lastSessionSets: missLast }))
      .toEqual({ kind: 'decrease', currentWeight: 70, suggestedWeight: 65 });
  });
  it('one bad session is ignored', () => {
    const cleanLast = [{ status: 'completed', actual_weight: 70 }];
    expect(evaluateProgression({ ...BASE, rpe: 9, currentSets: missNow, lastSessionSets: cleanLast })).toBeNull();
    expect(evaluateProgression({ ...BASE, rpe: 9, currentSets: missNow, lastSessionSets: [] })).toBeNull();
  });
  it('different weights between the two sessions → no suggestion', () => {
    const heavierLast = [{ status: 'completed_below', actual_weight: 75 }];
    expect(evaluateProgression({ ...BASE, rpe: 9, currentSets: missNow, lastSessionSets: heavierLast })).toBeNull();
  });
  it('skipped sets do not count as misses', () => {
    const skippedNow = [...doneSets(70, 10, 10, 2), { status: 'skipped' as const, weight: 70, targetReps: 10 }];
    expect(evaluateProgression({ ...BASE, rpe: 9, currentSets: skippedNow, lastSessionSets: missLast })).toBeNull();
  });
  it('silent during deload', () => {
    expect(evaluateProgression({ ...BASE, rpe: 9, rpeThreshold: null, currentSets: missNow, lastSessionSets: missLast })).toBeNull();
  });
  it('never suggests a non-positive weight', () => {
    const light = [{ status: 'completed_below' as const, weight: 5, reps: 5, targetReps: 10 }];
    const lightLast = [{ status: 'completed_below', actual_weight: 5 }];
    expect(evaluateProgression({ ...BASE, rpe: 9, currentSets: light, lastSessionSets: lightLast })).toBeNull();
  });
});

describe('resolveWorkingWeight', () => {
  const lastSets = [{ session_id: 'sess-X', actual_weight: 70 }, { session_id: 'sess-X', actual_weight: 70 }];

  it('%1RM weight always wins', () => {
    expect(resolveWorkingWeight({
      percentWeight: 185, adjustment: { new_weight: 75, session_id: 'sess-X' }, lastSets,
    })).toBe(185);
  });
  it('an adjustment accepted in the most recent completed session wins (not yet trained)', () => {
    expect(resolveWorkingWeight({
      percentWeight: 0, adjustment: { new_weight: 75, session_id: 'sess-X' }, lastSets,
    })).toBe(75);
  });
  it('a session completed after the adjustment supersedes it (manual edits win)', () => {
    expect(resolveWorkingWeight({
      percentWeight: 0, adjustment: { new_weight: 75, session_id: 'sess-OLD' }, lastSets,
    })).toBe(70);
  });
  it('adjustment applies when there is no history yet', () => {
    expect(resolveWorkingWeight({
      percentWeight: 0, adjustment: { new_weight: 75, session_id: 'sess-X' }, lastSets: [],
    })).toBe(75);
  });
  it('falls back: last weight → default → 0', () => {
    expect(resolveWorkingWeight({ percentWeight: 0, adjustment: null, lastSets })).toBe(70);
    expect(resolveWorkingWeight({ percentWeight: 0, adjustment: null, lastSets: [], defaultWeight: 60 })).toBe(60);
    expect(resolveWorkingWeight({ percentWeight: 0, adjustment: null, lastSets: [] })).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/utils/progression.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** — create `src/utils/progression.ts`:

```ts
/**
 * APEX — RPE auto-progression decision logic (issue #45)
 * Pure functions; all DB access stays in the callers.
 * Spec: docs/plans/2026-07-13-rpe-auto-progression-design.md
 */

export function getMostCommonWeight(
  sets: { actual_weight?: number | null }[]
): number | undefined {
  const weights = sets.map(s => s.actual_weight).filter((w): w is number => w != null && w > 0);
  if (weights.length === 0) return undefined;
  const counts = new Map<number, number>();
  for (const w of weights) counts.set(w, (counts.get(w) || 0) + 1);
  let best = weights[0], bestCount = 0;
  for (const [w, c] of counts) { if (c > bestCount) { best = w; bestCount = c; } }
  return best;
}

/** "7-8" → 7, "7" → 7, missing/garbage → null (null = suggestions disabled) */
export function parseRpeThreshold(rpeTarget: string | undefined | null): number | null {
  if (!rpeTarget) return null;
  const m = String(rpeTarget).match(/^\s*(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

export interface ProgressionSetInput {
  status: 'pending' | 'completed' | 'completed_below' | 'skipped';
  weight?: number;
  reps?: number;
  targetReps?: number;
}

export type ProgressionSuggestion =
  | { kind: 'increase' | 'decrease'; currentWeight: number; suggestedWeight: number }
  | null;

export function evaluateProgression(input: {
  category: string | undefined;
  rpe: number;
  rpeThreshold: number | null;
  increment: number;
  currentSets: ProgressionSetInput[];
  lastSessionSets: { status: string; actual_weight?: number | null }[];
}): ProgressionSuggestion {
  const { category, rpe, rpeThreshold, increment, currentSets, lastSessionSets } = input;
  if (category !== 'accessory') return null;
  if (rpeThreshold == null) return null; // deload / no accessory scheme → silent

  const currentWeight = getMostCommonWeight(currentSets.map(s => ({ actual_weight: s.weight })));
  if (!currentWeight) return null;

  // Increase: every prescribed set completed at/above target reps, RPE at/below threshold
  if (rpe <= rpeThreshold) {
    const allHit = currentSets.length > 0 && currentSets.every(s =>
      s.status === 'completed' && (s.targetReps == null || (s.reps ?? 0) >= s.targetReps)
    );
    if (allHit) {
      return { kind: 'increase', currentWeight, suggestedWeight: currentWeight + increment };
    }
  }

  // Decrease: missed reps this session AND last session, at the same weight
  const missedNow = currentSets.some(s => s.status === 'completed_below');
  if (missedNow) {
    const missedLast = lastSessionSets.some(s => s.status === 'completed_below');
    const lastWeight = getMostCommonWeight(lastSessionSets);
    if (missedLast && lastWeight === currentWeight) {
      const suggestedWeight = currentWeight - increment;
      if (suggestedWeight > 0) return { kind: 'decrease', currentWeight, suggestedWeight };
    }
  }

  return null;
}

/**
 * Pre-fill weight resolution:
 * %1RM → un-trained accepted adjustment → last session's modal weight → program default → 0.
 * An adjustment counts as "un-trained" while the session it was accepted in is still the
 * most recent completed session containing the exercise; any newer completed session
 * supersedes it, which is what makes manual edits always win.
 */
export function resolveWorkingWeight(params: {
  percentWeight: number;
  adjustment: { new_weight: number; session_id: string } | null;
  lastSets: { session_id: string; actual_weight?: number | null }[];
  defaultWeight?: number;
}): number {
  const { percentWeight, adjustment, lastSets, defaultWeight } = params;
  if (percentWeight) return percentWeight;
  const lastSessionId = lastSets[0]?.session_id;
  if (adjustment && (lastSessionId == null || adjustment.session_id === lastSessionId)) {
    return adjustment.new_weight;
  }
  return getMostCommonWeight(lastSets) ?? defaultWeight ?? 0;
}
```

In `src/hooks/useWorkoutSession.ts`: delete the module-private `getMostCommonWeight` (lines 35-45) and add `getMostCommonWeight` to the imports from `'../utils/progression'` (new import line). No behavior change.

- [ ] **Step 4: Run tests** — `npx jest __tests__/utils/progression.test.ts` → PASS; `npm test` → green (hook suite must still pass after the import swap).

- [ ] **Step 5: Commit**

```bash
git add src/utils/progression.ts src/hooks/useWorkoutSession.ts __tests__/utils/progression.test.ts
git commit -m "feat: pure progression decision logic — evaluate/threshold/resolve (#45)"
```

---

### Task 4: Hook honors adjustments in weight pre-fill

**Files:**
- Modify: `src/hooks/useWorkoutSession.ts` (`performRestore` ~line 248-251, `startSession` ~line 499-502, `ExerciseState`)
- Test: `__tests__/hooks/useWorkoutSession.test.ts`

**Interfaces:**
- Consumes: `getLatestAdjustment` (Task 2), `resolveWorkingWeight` (Task 3).
- Produces: `ExerciseState.lastSets?: SetLog[]` (Task 5 reads it for the 2-miss check).

- [ ] **Step 1: Update the hook-test DB mock.** In `__tests__/hooks/useWorkoutSession.test.ts`, add to the `jest.mock('../../src/db', ...)` factory object:

```ts
  getLatestAdjustment: jest.fn(),
  getWeightIncrement: jest.fn(),
  recordAdjustment: jest.fn(),
```

and wherever the test file's `beforeEach` sets default mock resolutions, add:

```ts
  (db.getLatestAdjustment as jest.Mock).mockResolvedValue(null);
  (db.getWeightIncrement as jest.Mock).mockResolvedValue(5);
```

(match the file's existing style for default mock setup — it may destructure the mocked module once at the top).

- [ ] **Step 2: Write the failing test** — add a describe block (reuse the file's existing program-fixture helpers; find the existing `startSession` tests and mirror their setup, with an accessory slot whose `default_weight` is 70):

```ts
describe('adjustment-aware weight pre-fill', () => {
  it('pre-fills an accepted, un-trained adjustment weight for an accessory', async () => {
    (db.getLastSessionForExercise as jest.Mock).mockResolvedValue([
      { session_id: 'sess-X', set_number: 1, actual_weight: 70, actual_reps: 10, status: 'completed' },
    ]);
    (db.getLatestAdjustment as jest.Mock).mockResolvedValue({
      id: 'a1', exercise_id: 'dips', program_id: 'p1', session_id: 'sess-X',
      old_weight: 70, new_weight: 75, reason: 'easy', created_at: '2026-07-13',
    });
    // ...start a session using the file's existing fixture flow...
    // Assert the accessory's first set targetWeight === 75
  });

  it('ignores an adjustment superseded by a newer completed session', async () => {
    (db.getLastSessionForExercise as jest.Mock).mockResolvedValue([
      { session_id: 'sess-Y', set_number: 1, actual_weight: 95, actual_reps: 10, status: 'completed' },
    ]);
    (db.getLatestAdjustment as jest.Mock).mockResolvedValue({
      id: 'a1', exercise_id: 'dips', program_id: 'p1', session_id: 'sess-X',
      old_weight: 70, new_weight: 75, reason: 'easy', created_at: '2026-07-13',
    });
    // ...start a session...
    // Assert the accessory's first set targetWeight === 95
  });
});
```

Flesh the `...start a session...` parts out by copying the arrange/act pattern from the file's existing `startSession` describe block (program fixture + `act(() => result.current.selectDay(...))` + `act(() => result.current.startSession())` + `waitFor`).

- [ ] **Step 3: Run to verify the new tests fail** — `npx jest __tests__/hooks/useWorkoutSession.test.ts -t adjustment-aware` → FAIL (weight comes out 70/95 vs 75 — first test fails).

- [ ] **Step 4: Implement.** In BOTH weight-resolution sites (`performRestore` and `startSession`), replace:

```ts
const weight = suggestedWeight || lastWeight || slot.default_weight || 0;
```

with:

```ts
const adjustment = slot.category === 'accessory'
  ? await getLatestAdjustment(slot.exercise_id)
  : null;
const weight = resolveWorkingWeight({
  percentWeight: suggestedWeight,
  adjustment,
  lastSets,
  defaultWeight: slot.default_weight,
});
```

Add `getLatestAdjustment` to the `../db` import list and `resolveWorkingWeight` to the `../utils/progression` import. Add `lastSets?: SetLog[]` to `ExerciseState` and include `lastSets` in the `exStates.push({...})` object in both paths.

- [ ] **Step 5: Run tests** — `npx jest __tests__/hooks/useWorkoutSession.test.ts` → all PASS (60 existing + new); `npm test` → green.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useWorkoutSession.ts __tests__/hooks/useWorkoutSession.test.ts
git commit -m "feat: weight pre-fill honors un-trained accepted adjustments (#45)"
```

---

### Task 5: Hook suggestion state machine (evaluate on RPE, accept/dismiss, held advance)

**Files:**
- Modify: `src/hooks/useWorkoutSession.ts` (`setRPE` ~line 796-865, new state + actions, extract `advanceAfterExercise`)
- Test: `__tests__/hooks/useWorkoutSession.test.ts`

**Interfaces:**
- Consumes: `evaluateProgression`, `parseRpeThreshold` (Task 3); `getWeightIncrement`, `recordAdjustment` (Task 2); `ExerciseState.lastSets` (Task 4).
- Produces (workout.tsx consumes in Task 7):

```ts
pendingSuggestion: {
  exerciseIdx: number;
  kind: 'increase' | 'decrease';
  currentWeight: number;
  suggestedWeight: number;
  accepted: boolean;
} | null
acceptSuggestion: () => Promise<void>
dismissSuggestion: () => void
```

- [ ] **Step 1: Extract the advance logic.** Add a module-level function to `useWorkoutSession.ts` (above the hook), transplanting the exact branch logic that currently lives inside `setRPE`'s `setExercises` updater:

```ts
/** Collapse exIdx and expand the next exercise with pending sets (superset-aware). */
function advanceAfterExercise(prev: ExerciseState[], exIdx: number): ExerciseState[] {
  const next = [...prev];
  const group = next[exIdx].supersetGroup;

  if (group) {
    const groupIndices = next
      .map((ex, i) => ex.supersetGroup === group ? i : -1)
      .filter(i => i >= 0);
    const posInGroup = groupIndices.indexOf(exIdx);
    for (let offset = 1; offset < groupIndices.length; offset++) {
      const candidate = groupIndices[(posInGroup + offset) % groupIndices.length];
      if (next[candidate].sets.some(s => s.status === 'pending')) {
        next[exIdx] = { ...next[exIdx], expanded: false };
        next[candidate] = { ...next[candidate], expanded: true };
        return next;
      }
    }
    // Entire group done: collapse all members, advance past the group
    for (const gi of groupIndices) next[gi] = { ...next[gi], expanded: false };
    const maxGroupIdx = Math.max(...groupIndices);
    for (let i = maxGroupIdx + 1; i < next.length; i++) {
      if (next[i].sets.some(s => s.status === 'pending')) {
        next[i] = { ...next[i], expanded: true };
        break;
      }
    }
    return next;
  }

  next[exIdx] = { ...next[exIdx], expanded: false };
  for (let i = exIdx + 1; i < next.length; i++) {
    if (next[i].sets.some(s => s.status === 'pending')) {
      next[i] = { ...next[i], expanded: true };
      break;
    }
  }
  return next;
}
```

Rewrite `setRPE` to persist RPE as today, then evaluate; hold the card open when a suggestion fires:

```ts
/** Set RPE for an exercise (persists to all completed sets), then advance or suggest */
const setRPE = async (exIdx: number, rpe: number) => {
  const ex = exercises[exIdx];

  for (const set of ex.sets) {
    if (set.id && (set.status === 'completed' || set.status === 'completed_below')) {
      await updateSet(set.id, { rpe });
    }
  }

  let suggestion: ProgressionSuggestion = null;
  if (!ex.isAdhoc && program) {
    const block = getBlockForWeek(program.definition.program.blocks, currentWeek);
    const rpeThreshold = parseRpeThreshold(block?.accessory_scheme?.rpe_target);
    if (ex.slot.category === 'accessory' && rpeThreshold != null) {
      const increment = await getWeightIncrement(ex.slot.exercise_id);
      suggestion = evaluateProgression({
        category: ex.slot.category,
        rpe,
        rpeThreshold,
        increment,
        currentSets: ex.sets.map(s => ({
          status: s.status,
          weight: s.actualWeight ?? s.targetWeight,
          reps: s.actualReps,
          targetReps: s.targetReps,
        })),
        lastSessionSets: ex.lastSets ?? [],
      });
    }
  }

  if (suggestion) {
    setExercises(prev => {
      const next = [...prev];
      next[exIdx] = { ...next[exIdx], rpe };
      return next;
    });
    setPendingSuggestion({ exerciseIdx: exIdx, ...suggestion, accepted: false });
    return; // card stays open until the chip is resolved
  }

  setPendingSuggestion(null); // re-tapped RPE no longer qualifies → clear any chip
  setExercises(prev => {
    const next = [...prev];
    next[exIdx] = { ...next[exIdx], rpe };
    return advanceAfterExercise(next, exIdx);
  });
};
```

New state + actions inside the hook:

```ts
const [pendingSuggestion, setPendingSuggestion] = useState<{
  exerciseIdx: number;
  kind: 'increase' | 'decrease';
  currentWeight: number;
  suggestedWeight: number;
  accepted: boolean;
} | null>(null);

/** Accept the pending suggestion: record it, confirm briefly, then advance */
const acceptSuggestion = async () => {
  if (!pendingSuggestion || pendingSuggestion.accepted || !sessionId || !program) return;
  const { exerciseIdx, currentWeight, suggestedWeight, kind } = pendingSuggestion;
  const ex = exercises[exerciseIdx];

  await recordAdjustment({
    exerciseId: ex.slot.exercise_id,
    programId: program.id,
    sessionId,
    oldWeight: currentWeight,
    newWeight: suggestedWeight,
    reason: kind === 'increase' ? 'easy' : 'misses',
  });

  setPendingSuggestion(prev => (prev ? { ...prev, accepted: true } : prev));
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  setTimeout(() => {
    setPendingSuggestion(null);
    setExercises(prev => advanceAfterExercise(prev, exerciseIdx));
  }, 900);
};

/** Dismiss the pending suggestion: save nothing, advance as normal */
const dismissSuggestion = () => {
  if (!pendingSuggestion) return;
  const { exerciseIdx } = pendingSuggestion;
  setPendingSuggestion(null);
  setExercises(prev => advanceAfterExercise(prev, exerciseIdx));
};
```

Imports to add: `parseRpeThreshold, evaluateProgression` and `type ProgressionSuggestion` from `'../utils/progression'`; `getWeightIncrement, recordAdjustment` from `'../db'`. Add `pendingSuggestion, acceptSuggestion, dismissSuggestion` to the hook's return object (next to `setRPE`).

- [ ] **Step 2: Write the failing tests** (before Step 1's implementation — TDD order: write these first, watch them fail, then implement Step 1). Arrange helpers: program fixture with `blocks[0].accessory_scheme = { rpe_target: '7-8' }`, an accessory slot (`category: 'accessory'`, `default_weight: 70`, 3×10), and `(getBlockForWeek as jest.Mock).mockReturnValue(<that block>)`. Complete all sets via the file's existing set-completion pattern, then:

```ts
it('offers an increase after a qualifying RPE and holds the card open', async () => {
  // complete all 3 sets at 70×10 ...
  await act(async () => { await result.current.setRPE(0, 7); });
  expect(result.current.pendingSuggestion).toMatchObject({
    exerciseIdx: 0, kind: 'increase', currentWeight: 70, suggestedWeight: 75, accepted: false,
  });
  expect(result.current.exercises[0].expanded).toBe(true); // not collapsed yet
});

it('does not suggest when RPE is above threshold, and advances normally', async () => {
  await act(async () => { await result.current.setRPE(0, 8); });
  expect(result.current.pendingSuggestion).toBeNull();
  expect(result.current.exercises[0].expanded).toBe(false);
});

it('accept records the adjustment, flips to accepted, then advances after the delay', async () => {
  await act(async () => { await result.current.setRPE(0, 7); });
  await act(async () => { await result.current.acceptSuggestion(); });
  expect(db.recordAdjustment).toHaveBeenCalledWith(expect.objectContaining({
    oldWeight: 70, newWeight: 75, reason: 'easy',
  }));
  expect(result.current.pendingSuggestion?.accepted).toBe(true);
  act(() => { jest.advanceTimersByTime(1000); });
  expect(result.current.pendingSuggestion).toBeNull();
  expect(result.current.exercises[0].expanded).toBe(false);
});

it('dismiss records nothing and advances', async () => {
  await act(async () => { await result.current.setRPE(0, 7); });
  act(() => { result.current.dismissSuggestion(); });
  expect(db.recordAdjustment).not.toHaveBeenCalled();
  expect(result.current.pendingSuggestion).toBeNull();
  expect(result.current.exercises[0].expanded).toBe(false);
});
```

(The file already runs `jest.useFakeTimers()` in `beforeAll` — `advanceTimersByTime` works.)

- [ ] **Step 3: Verify fail → implement Step 1 → verify pass**

Run: `npx jest __tests__/hooks/useWorkoutSession.test.ts` — new tests FAIL first, then PASS after implementation; all 60 existing tests must still pass (the extracted `advanceAfterExercise` must be behavior-identical).

- [ ] **Step 4: Full suite** — `npm test` → green.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useWorkoutSession.ts __tests__/hooks/useWorkoutSession.test.ts
git commit -m "feat: suggestion state machine in workout hook — evaluate on RPE, accept/dismiss (#45)"
```

---

### Task 6: Suggestion chip in `ExerciseCard`

**Files:**
- Modify: `src/components/ExerciseCard.tsx`
- Test: `__tests__/components/ExerciseCard.test.tsx`

**Interfaces:**
- Consumes: nothing new at runtime; purely presentational.
- Produces — new optional props (Task 7 wires them):

```ts
suggestion?: { kind: 'increase' | 'decrease'; suggestedWeight: number; accepted: boolean } | null;
onAcceptSuggestion?: () => void;
onDismissSuggestion?: () => void;
```

- [ ] **Step 1: Write the failing tests** — append to `__tests__/components/ExerciseCard.test.tsx`:

```ts
describe('progression suggestion chip', () => {
  const doneProps = {
    ...defaultProps,
    expanded: true,
    sets: makeSets(3, 'completed'),
    rpe: 7,
  };

  it('renders the increase chip with copy and weight', () => {
    render(<ExerciseCard {...doneProps}
      suggestion={{ kind: 'increase', suggestedWeight: 75, accepted: false }} />);
    expect(screen.getByText(/Felt easy/)).toBeTruthy();
    expect(screen.getByText(/75 lbs/)).toBeTruthy();
  });

  it('renders the decrease chip copy', () => {
    render(<ExerciseCard {...doneProps}
      suggestion={{ kind: 'decrease', suggestedWeight: 65, accepted: false }} />);
    expect(screen.getByText(/Tough two weeks/)).toBeTruthy();
    expect(screen.getByText(/65 lbs/)).toBeTruthy();
  });

  it('fires accept and dismiss callbacks', () => {
    const onAccept = jest.fn();
    const onDismiss = jest.fn();
    render(<ExerciseCard {...doneProps}
      suggestion={{ kind: 'increase', suggestedWeight: 75, accepted: false }}
      onAcceptSuggestion={onAccept} onDismissSuggestion={onDismiss} />);
    fireEvent.press(screen.getByTestId('suggestion-accept'));
    expect(onAccept).toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('suggestion-dismiss'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('shows the locked-in confirmation once accepted', () => {
    render(<ExerciseCard {...doneProps}
      suggestion={{ kind: 'increase', suggestedWeight: 75, accepted: true }} />);
    expect(screen.getByText('75 lbs locked in for next session')).toBeTruthy();
    expect(screen.queryByTestId('suggestion-accept')).toBeNull();
  });

  it('renders no chip without a suggestion', () => {
    render(<ExerciseCard {...doneProps} />);
    expect(screen.queryByTestId('suggestion-accept')).toBeNull();
    expect(screen.queryByText(/Felt easy/)).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify fail** — `npx jest __tests__/components/ExerciseCard.test.tsx -t "progression suggestion"` → FAIL.

- [ ] **Step 3: Implement.** Add the three props to `ExerciseCardProps` and destructure them. Inside the expanded view, directly after the RPE selector block (`{allDone && (...rpeSection...)}`), add:

```tsx
{/* Progression suggestion chip (issue #45) */}
{allDone && suggestion && !suggestion.accepted && (
  <View style={styles.suggestionChip}>
    <View style={[
      styles.suggestionBadge,
      suggestion.kind === 'increase' ? styles.suggestionBadgeUp : styles.suggestionBadgeDown,
    ]}>
      <Text style={suggestion.kind === 'increase' ? styles.suggestionArrowUp : styles.suggestionArrowDown}>
        {suggestion.kind === 'increase' ? '↑' : '↓'}
      </Text>
    </View>
    <Text style={styles.suggestionText}>
      {suggestion.kind === 'increase' ? 'Felt easy — ' : 'Tough two weeks — drop to '}
      <Text style={styles.suggestionWeight}>{suggestion.suggestedWeight} lbs</Text>
      {' next time?'}
    </Text>
    <TouchableOpacity testID="suggestion-accept" style={styles.suggestionAccept} onPress={onAcceptSuggestion}>
      <Text style={styles.suggestionAcceptText}>{'✓'}</Text>
    </TouchableOpacity>
    <TouchableOpacity testID="suggestion-dismiss" style={styles.suggestionDismiss} onPress={onDismissSuggestion}>
      <Text style={styles.suggestionDismissText}>{'✕'}</Text>
    </TouchableOpacity>
  </View>
)}
{allDone && suggestion?.accepted && (
  <View style={styles.suggestionConfirm}>
    <View style={styles.suggestionConfirmBadge}>
      <Text style={styles.suggestionConfirmCheck}>{'✓'}</Text>
    </View>
    <Text style={styles.suggestionConfirmText}>
      {suggestion.suggestedWeight} lbs locked in for next session
    </Text>
  </View>
)}
```

Styles (append to the StyleSheet; tokens only — per mock `workout-rpe-suggestion-2026-07-14.html`):

```ts
// Progression suggestion chip
suggestionChip: {
  marginTop: Spacing.sm + 2,
  flexDirection: 'row',
  alignItems: 'center',
  gap: Spacing.sm + 2,
  backgroundColor: Colors.cardInset,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: BorderRadius.md,
  paddingVertical: Spacing.sm,
  paddingLeft: Spacing.md,
  paddingRight: Spacing.sm,
},
suggestionBadge: {
  width: 22,
  height: 22,
  borderRadius: BorderRadius.pill,
  alignItems: 'center',
  justifyContent: 'center',
},
suggestionBadgeUp: { backgroundColor: Colors.greenMuted },
suggestionBadgeDown: { backgroundColor: Colors.amberMuted },
suggestionArrowUp: { color: Colors.green, fontSize: FontSize.sm, fontWeight: '700' },
suggestionArrowDown: { color: Colors.amber, fontSize: FontSize.sm, fontWeight: '700' },
suggestionText: { flex: 1, color: Colors.textSecondary, fontSize: FontSize.body, lineHeight: 18 },
suggestionWeight: { color: Colors.text, fontWeight: '600' },
suggestionAccept: {
  width: ComponentSize.buttonLarge,
  height: ComponentSize.setButtonHeight,
  borderRadius: BorderRadius.button,
  backgroundColor: Colors.greenFaint,
  borderWidth: 1,
  borderColor: Colors.greenBorderFaint,
  alignItems: 'center',
  justifyContent: 'center',
},
suggestionAcceptText: { color: Colors.green, fontSize: FontSize.base, fontWeight: '700' },
suggestionDismiss: {
  width: ComponentSize.buttonLarge,
  height: ComponentSize.setButtonHeight,
  borderRadius: BorderRadius.button,
  borderWidth: 1,
  borderColor: Colors.border,
  alignItems: 'center',
  justifyContent: 'center',
},
suggestionDismissText: { color: Colors.textDim, fontSize: FontSize.md, fontWeight: '600' },
suggestionConfirm: {
  marginTop: Spacing.sm + 2,
  flexDirection: 'row',
  alignItems: 'center',
  gap: Spacing.sm + 2,
  backgroundColor: Colors.greenFaint,
  borderWidth: 1,
  borderColor: Colors.greenBorderFaint,
  borderRadius: BorderRadius.md,
  paddingVertical: Spacing.md - 1,
  paddingHorizontal: Spacing.md,
},
suggestionConfirmBadge: {
  width: 22,
  height: 22,
  borderRadius: BorderRadius.pill,
  backgroundColor: Colors.green,
  alignItems: 'center',
  justifyContent: 'center',
},
suggestionConfirmCheck: { color: Colors.bg, fontSize: FontSize.sm, fontWeight: '800' },
suggestionConfirmText: { flex: 1, color: Colors.green, fontSize: FontSize.body, fontWeight: '600' },
```

- [ ] **Step 4: Run tests** — `npx jest __tests__/components/ExerciseCard.test.tsx` → all PASS; `npm test` → green.

- [ ] **Step 5: Commit**

```bash
git add src/components/ExerciseCard.tsx __tests__/components/ExerciseCard.test.tsx
git commit -m "feat: suggestion chip UI in ExerciseCard — increase/decrease/accepted states (#45)"
```

---

### Task 7: Wire the chip in `app/(tabs)/workout.tsx`

**Files:**
- Modify: `app/(tabs)/workout.tsx` (~lines 427 and 483 — BOTH `<ExerciseCard>` render sites: the regular list and the superset-group renderer)

**Interfaces:**
- Consumes: `w.pendingSuggestion`, `w.acceptSuggestion`, `w.dismissSuggestion` (Task 5); ExerciseCard props (Task 6).

- [ ] **Step 1: Add the three props at BOTH render sites**, next to the existing `onSetRPE={(rpe) => w.setRPE(exIdx, rpe)}` lines:

```tsx
suggestion={w.pendingSuggestion?.exerciseIdx === exIdx ? w.pendingSuggestion : null}
onAcceptSuggestion={w.acceptSuggestion}
onDismissSuggestion={w.dismissSuggestion}
```

(Note: at each site, `exIdx` is the index variable in scope there — verify its exact name at both sites before pasting.)

- [ ] **Step 2: Verify** — `npx tsc --noEmit` clean; `npm test` green (no snapshot/props tests break).

- [ ] **Step 3: Commit**

```bash
git add "app/(tabs)/workout.tsx"
git commit -m "feat: wire suggestion chip into workout screen (#45)"
```

---

### Task 8: Exercise detail — progression card, increment editor, View-all links

**Files:**
- Modify: `src/db/sessions.ts:311-327` (`getExerciseInfo` — add `type` to SELECT and return shape)
- Modify: `app/exercise/[id].tsx` (progression card after Recent Sessions; View-all-sessions navigates instead of expanding)
- Test: `__tests__/db/sessions.test.ts` (only if it asserts `getExerciseInfo` columns — it currently doesn't; add one)

**Interfaces:**
- Consumes: `getAdjustmentHistory`, `getWeightIncrement`, `setWeightIncrement` (Task 2).
- Produces: `getExerciseInfo` now returns `Record<string, { name: string; type: string; inputFields: string | null }>`; routes `/exercise/sessions?id=` and `/exercise/progression?id=` are navigated to (implemented in Task 9 — build Task 9 before manually tapping the links).

- [ ] **Step 1: Failing test for `getExerciseInfo`** — add to the `sessions.test.ts` describe structure:

```ts
describe('getExerciseInfo', () => {
  it('selects id, name, type and input_fields', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { id: 'dips', name: 'Dips', type: 'accessory', input_fields: null },
    ]);
    const result = await getExerciseInfo(['dips']);
    expect(mockDb.getAllAsync.mock.calls[0][0]).toMatch(/SELECT id, name, type, input_fields FROM exercises/);
    expect(result['dips']).toEqual({ name: 'Dips', type: 'accessory', inputFields: null });
  });
});
```

- [ ] **Step 2: Verify fail, then implement** — in `getExerciseInfo`: SELECT becomes `SELECT id, name, type, input_fields FROM exercises WHERE id IN (${placeholders})`; row type and result record gain `type: string`; assignment becomes `result[row.id] = { name: row.name, type: row.type, inputFields: row.input_fields };`. Update the function's return type annotation accordingly. Run `npx tsc --noEmit` — fix any consumer that destructures the record shape (existing consumers only read `.name`/`.inputFields`, which still exist).

- [ ] **Step 3: Detail screen changes** in `app/exercise/[id].tsx`:

State + imports:

```ts
import { getAdjustmentHistory, getWeightIncrement, setWeightIncrement } from '../../src/db';
import type { WeightAdjustment } from '../../src/types';

const [exerciseType, setExerciseType] = useState<string>('');
const [adjustments, setAdjustments] = useState<WeightAdjustment[]>([]);
const [increment, setIncrement] = useState(5);
```

In `loadData`, after `setExerciseName(name)`:

```ts
setExerciseType(info?.type ?? '');
if (info?.type === 'accessory') {
  const [adj, inc] = await Promise.all([
    getAdjustmentHistory(id, 3),
    getWeightIncrement(id),
  ]);
  setAdjustments(adj);
  setIncrement(inc);
}
```

Increment editor handler (inside the component; `Alert` is imported from `react-native` — add it to the existing import if absent):

```ts
const editIncrement = () => {
  Alert.alert(
    'Weight increment',
    'Jump size used by progression suggestions for this exercise.',
    [
      ...[2.5, 5, 10, 15].map(v => ({
        text: `${v} lbs${v === increment ? '  ✓' : ''}`,
        onPress: async () => {
          await setWeightIncrement(id!, v);
          setIncrement(v);
        },
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]
  );
};
```

Render block — insert AFTER the `{/* View all sessions link */}` block and BEFORE `{/* Resources Section */}` (per the approved mockup: session history above progression):

```tsx
{/* Progression (RPE auto-progression, issue #45) */}
{exerciseType === 'accessory' && (
  <>
    <View style={styles.progressionHeader}>
      <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>Progression</Text>
      {adjustments.length >= 3 && (
        <TouchableOpacity onPress={() => router.push(`/exercise/progression?id=${id}`)}>
          <Text style={styles.viewAllText}>View all {'›'}</Text>
        </TouchableOpacity>
      )}
    </View>
    <View style={styles.sessionsCard}>
      {adjustments.length === 0 && (
        <Text style={styles.emptyText}>No adjustments yet — log accessory sets and rate the RPE</Text>
      )}
      {adjustments.map((adj, ai) => (
        <View key={adj.id}>
          {ai > 0 && <View style={styles.sessionDivider} />}
          <View style={styles.adjustmentRow}>
            <View style={[
              styles.adjustmentBadge,
              adj.reason === 'easy' ? styles.adjustmentBadgeUp : styles.adjustmentBadgeDown,
            ]}>
              <Text style={adj.reason === 'easy' ? styles.adjustmentArrowUp : styles.adjustmentArrowDown}>
                {adj.new_weight > adj.old_weight ? '↑' : '↓'}
              </Text>
            </View>
            <Text style={styles.adjustmentWeight}>
              {adj.new_weight} lbs <Text style={styles.adjustmentFrom}>from {adj.old_weight}</Text>
            </Text>
            <Text style={styles.adjustmentReason}>
              {adj.reason === 'easy' ? 'felt easy' : '2 missed'}
            </Text>
            <Text style={styles.adjustmentDate}>{formatCompactDate(adj.created_at)}</Text>
          </View>
        </View>
      ))}
      <View style={styles.incrementRow}>
        <Text style={styles.incrementLabel}>Weight increment</Text>
        <TouchableOpacity style={styles.incrementPill} onPress={editIncrement}>
          <Text style={styles.incrementPillText}>{increment} lbs</Text>
          <Ionicons name="pencil-outline" size={11} color={Colors.textDim} />
        </TouchableOpacity>
      </View>
    </View>
  </>
)}
```

(Reuse the screen's existing `formatCompactDate` helper and `sessionsCard`, `sessionDivider`, `emptyText`, `viewAllText`, `sectionLabel` styles.)

Change the existing View-all-sessions button: replace `onPress={() => setShowCount(totalSessions)}` with `onPress={() => router.push(\`/exercise/sessions?id=${id}\`)}` (label unchanged). Remove the now-unused `setShowCount` by converting `showCount` state to a plain `const showCount = 5;` and dropping it from the `loadData` dependency array.

New styles (append; tokens only):

```ts
progressionHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: Spacing.xxl,
  marginBottom: Spacing.md,
},
adjustmentRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
adjustmentBadge: {
  width: 24, height: 24, borderRadius: BorderRadius.pill,
  alignItems: 'center', justifyContent: 'center',
},
adjustmentBadgeUp: { backgroundColor: Colors.greenMuted },
adjustmentBadgeDown: { backgroundColor: Colors.amberMuted },
adjustmentArrowUp: { color: Colors.green, fontSize: FontSize.body, fontWeight: '700' },
adjustmentArrowDown: { color: Colors.amber, fontSize: FontSize.body, fontWeight: '700' },
adjustmentWeight: { flex: 1, color: Colors.text, fontSize: FontSize.base, fontWeight: '600' },
adjustmentFrom: { color: Colors.textDim, fontSize: FontSize.body, fontWeight: '400' },
adjustmentReason: { color: Colors.textDim, fontSize: FontSize.sm },
adjustmentDate: { color: Colors.textMuted, fontSize: FontSize.sm, width: 48, textAlign: 'right' },
incrementRow: {
  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  paddingTop: Spacing.md + 2, borderTopWidth: 1, borderTopColor: Colors.surface,
},
incrementLabel: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '600' },
incrementPill: {
  flexDirection: 'row', alignItems: 'center', gap: 6,
  paddingVertical: 6, paddingHorizontal: Spacing.md,
  backgroundColor: Colors.indigoMuted, borderRadius: BorderRadius.button,
},
incrementPillText: { color: Colors.indigoLight, fontSize: FontSize.body, fontWeight: '700' },
```

- [ ] **Step 4: Verify** — `npx jest __tests__/db/sessions.test.ts` PASS; `npx tsc --noEmit` clean; `npm test` green.

- [ ] **Step 5: Commit**

```bash
git add src/db/sessions.ts "app/exercise/[id].tsx" __tests__/db/sessions.test.ts
git commit -m "feat: exercise detail — progression card, increment editor, View-all links (#45)"
```

---

### Task 9: Full-page list screens

**Files:**
- Create: `app/exercise/progression.tsx`
- Create: `app/exercise/sessions.tsx`

**Interfaces:**
- Consumes: `getAdjustmentHistory` (no limit), `getGenericExerciseSetHistory(id, { limit: 1000 })`, `getExerciseInfo`.
- Routes: `/exercise/progression?id=<exerciseId>`, `/exercise/sessions?id=<exerciseId>`. Static segments take precedence over `[id]`, so these don't collide with `/exercise/[id]` — expo-router auto-registers them; no `_layout.tsx` change needed (matching `exercise/[id].tsx`, which also has no explicit `Stack.Screen`).

- [ ] **Step 1: Create `app/exercise/progression.tsx`:**

```tsx
/**
 * APEX — Full progression history for one exercise (issue #45)
 * Reached via "View all ›" on the exercise detail progression card.
 */
import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import { getAdjustmentHistory, getExerciseInfo } from '../../src/db';
import type { WeightAdjustment } from '../../src/types';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ProgressionHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [adjustments, setAdjustments] = useState<WeightAdjustment[]>([]);
  const [exerciseName, setExerciseName] = useState('');

  useFocusEffect(useCallback(() => {
    (async () => {
      if (!id) return;
      const [history, infoMap] = await Promise.all([
        getAdjustmentHistory(id),
        getExerciseInfo([id]),
      ]);
      setAdjustments(history);
      setExerciseName(infoMap[id]?.name ?? id.replace(/_/g, ' '));
    })();
  }, [id]));

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Colors.textDim} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Progression</Text>
            <Text style={styles.headerSubtitle}>{exerciseName}</Text>
          </View>
        </View>

        <View style={styles.card}>
          {adjustments.length === 0 && (
            <Text style={styles.emptyText}>No adjustments yet</Text>
          )}
          {adjustments.map((adj, ai) => (
            <View key={adj.id}>
              {ai > 0 && <View style={styles.divider} />}
              <View style={styles.row}>
                <View style={[
                  styles.badge,
                  adj.reason === 'easy' ? styles.badgeUp : styles.badgeDown,
                ]}>
                  <Text style={adj.reason === 'easy' ? styles.arrowUp : styles.arrowDown}>
                    {adj.new_weight > adj.old_weight ? '↑' : '↓'}
                  </Text>
                </View>
                <Text style={styles.weight}>
                  {adj.new_weight} lbs <Text style={styles.from}>from {adj.old_weight}</Text>
                </Text>
                <Text style={styles.reason}>{adj.reason === 'easy' ? 'felt easy' : '2 missed'}</Text>
                <Text style={styles.date}>{formatDate(adj.created_at)}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: Spacing.screenTop,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.screenBottom,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xxl },
  backButton: { padding: Spacing.xs },
  headerTitle: { color: Colors.text, fontSize: FontSize.sectionTitle, fontWeight: '700' },
  headerSubtitle: { color: Colors.textDim, fontSize: FontSize.sm, marginTop: 2 },
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  divider: { height: 1, backgroundColor: Colors.surface },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  badge: { width: 24, height: 24, borderRadius: BorderRadius.pill, alignItems: 'center', justifyContent: 'center' },
  badgeUp: { backgroundColor: Colors.greenMuted },
  badgeDown: { backgroundColor: Colors.amberMuted },
  arrowUp: { color: Colors.green, fontSize: FontSize.body, fontWeight: '700' },
  arrowDown: { color: Colors.amber, fontSize: FontSize.body, fontWeight: '700' },
  weight: { flex: 1, color: Colors.text, fontSize: FontSize.base, fontWeight: '600' },
  from: { color: Colors.textDim, fontSize: FontSize.body, fontWeight: '400' },
  reason: { color: Colors.textDim, fontSize: FontSize.sm },
  date: { color: Colors.textMuted, fontSize: FontSize.sm, width: 88, textAlign: 'right' },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.body, textAlign: 'center', paddingVertical: Spacing.md },
});
```

- [ ] **Step 2: Create `app/exercise/sessions.tsx`** — same skeleton (container/scroll/header/card styles identical to Step 1's), title `Session History`, data from `getGenericExerciseSetHistory(id, { limit: 1000 })`, one row per session pushing to the session detail:

```tsx
/**
 * APEX — Full session history for one exercise (issue #45)
 * Reached via "View all N sessions" on the exercise detail screen.
 */
import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import { getGenericExerciseSetHistory, getExerciseInfo } from '../../src/db';
import type { GenericSessionSetHistory } from '../../src/db';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function summarize(session: GenericSessionSetHistory): string {
  const sets = session.sets;
  const weights = sets.map(s => s.weight).filter((w): w is number => w != null && w > 0);
  const reps = sets.map(s => s.reps).filter((r): r is number => r != null);
  const weightPart = weights.length ? ` · ${Math.max(...weights)} lbs` : '';
  const repsPart = reps.length ? `${sets.length} × ${Math.max(...reps)}` : `${sets.length} sets`;
  return `${repsPart}${weightPart}`;
}

export default function ExerciseSessionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [sessions, setSessions] = useState<GenericSessionSetHistory[]>([]);
  const [exerciseName, setExerciseName] = useState('');

  useFocusEffect(useCallback(() => {
    (async () => {
      if (!id) return;
      const [history, infoMap] = await Promise.all([
        getGenericExerciseSetHistory(id, { limit: 1000 }),
        getExerciseInfo([id]),
      ]);
      setSessions(history);
      setExerciseName(infoMap[id]?.name ?? id.replace(/_/g, ' '));
    })();
  }, [id]));

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Colors.textDim} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Session History</Text>
            <Text style={styles.headerSubtitle}>{exerciseName}</Text>
          </View>
        </View>

        <View style={styles.card}>
          {sessions.length === 0 && <Text style={styles.emptyText}>No completed sets yet</Text>}
          {sessions.map((session, si) => (
            <TouchableOpacity
              key={session.sessionId + si}
              activeOpacity={0.7}
              onPress={() => router.push(`/session/${session.sessionId}`)}
            >
              {si > 0 && <View style={styles.divider} />}
              <View style={styles.row}>
                <Text style={styles.date}>{formatDate(session.date)}</Text>
                <Text style={styles.summary}>{summarize(session)}</Text>
                {session.avgRpe != null && (
                  <Text style={styles.rpe}>RPE {session.avgRpe.toFixed(1)}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: Spacing.screenTop,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.screenBottom,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xxl },
  backButton: { padding: Spacing.xs },
  headerTitle: { color: Colors.text, fontSize: FontSize.sectionTitle, fontWeight: '700' },
  headerSubtitle: { color: Colors.textDim, fontSize: FontSize.sm, marginTop: 2 },
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  divider: { height: 1, backgroundColor: Colors.surface },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  date: { flex: 1, color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '600' },
  summary: { color: Colors.textDim, fontSize: FontSize.body },
  rpe: { color: Colors.textDim, fontSize: FontSize.body, width: 56, textAlign: 'right' },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.body, textAlign: 'center', paddingVertical: Spacing.md },
});
```

(Verify `GenericSessionSetHistory` is re-exported from `src/db/index.ts`; if not, import it from `../../src/db/metrics`.)

- [ ] **Step 3: Verify** — `npx tsc --noEmit` clean; `npm test` green.

- [ ] **Step 4: Commit**

```bash
git add app/exercise/progression.tsx app/exercise/sessions.tsx
git commit -m "feat: full-page progression + session history screens (#45)"
```

---

### Task 10: Spec sync, full verification, device build

**Files:**
- Modify: `docs/plans/2026-07-13-rpe-auto-progression-design.md` (weight-resolution rule wording)

- [ ] **Step 1: Sync the spec.** Implementation refined the resolution rule (same-session identity instead of timestamp comparison — timestamps break because acceptance always precedes session completion). In the spec's "Weight resolution (updated)" section, replace step 2's text with:

```markdown
2. **Latest `weight_adjustments` row for the exercise, iff it was accepted during the
   most recent completed session containing that exercise (`adjustment.session_id ===`
   that session's id), or there is no completed session yet** — i.e. "accepted but not
   yet trained at". Any session completed after the acceptance supersedes it.
```

- [ ] **Step 2: Full suite + types** — `npm test` and `npx tsc --noEmit`, both clean. Fix anything that isn't.

- [ ] **Step 3: On-device verification** (Ben's phone, `npm run device`): walk one accessory through the flow — complete all sets as prescribed, tap RPE 6/7 → chip appears; accept → confirmation → card collapses; check the exercise detail page shows the adjustment and increment row; next session of that exercise pre-fills the bumped weight. Also confirm a main lift (%1RM) shows no chip.

- [ ] **Step 4: Commit + wrap up**

```bash
git add docs/plans/2026-07-13-rpe-auto-progression-design.md
git commit -m "docs: sync spec weight-resolution rule with implementation (#45)"
```

Then use superpowers:finishing-a-development-branch — PR to `main` referencing #45 (do NOT push or merge without Ben's approval).

---

## Self-Review Notes

- **Spec coverage:** chip states/timing (T5-T7), rules incl. deload silence + skipped-set handling (T3), event log + increment storage (T1-T2), pre-fill precedence incl. manual-wins (T3-T4), detail screen ordering/caps/View-all + increment editor (T8), full-page lists (T9), ad-hoc exclusion (T5 guard), mockup copy strings (T6). Spec's timestamp-based resolution rule was found unimplementable as written (acceptance always predates session completion) — replaced by the session-identity rule; spec synced in T10.
- **Known deviation:** mockup's "Current working weight" hero card + weight-trend chart on the detail screen are out of v1 scope per Ben's don't-over-fiddle call (2026-07-14); the existing hero/chart stay as they are.
- **Type consistency check:** `ProgressionSuggestion`/`ProgressionSetInput` (T3) match T5's call site; `WeightAdjustment` (T1) matches T2's queries and T8/T9's renders; ExerciseCard props (T6) match T7's wiring; `getExerciseInfo` new shape (T8) is additive.
