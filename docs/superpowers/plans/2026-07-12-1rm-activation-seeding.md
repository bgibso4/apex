# 1RM Activation Seeding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** At program activation, seed per-lift working 1RMs from recent training history (max Epley e1RM in a bounded window) into `programs.one_rm_values`, and make weight calculation prefer those seeds over the definition's static values.

**Architecture:** New windowed-max query in metrics → `activateProgram` computes and stores a `{ exercise_id: seed }` JSON in the dormant `one_rm_values` column → a pure `resolveOneRm` helper gives run-seeds-first resolution → both `useWorkoutSession` weight sites use it. No schema change.

**Tech Stack:** TypeScript strict, expo-sqlite (mocked in tests), Jest.

**Spec:** `docs/superpowers/specs/2026-07-12-1rm-activation-seeding-design.md`

## Global Constraints

- TDD: failing test → implement → green → commit. `npx tsc --noEmit && npm test` before each commit.
- DB tests use the existing mock idiom (`jest.mock('../../src/db/database')`, `createMockDb()`), never real SQLite.
- Window rule exactly: last 10 sessions containing the exercise AND last 60 days; qualifying sets = status IN ('completed','completed_below'), weight > 0, reps > 0; aggregate = max `calculateEpley`.
- Fallback chain exactly: run seed (`one_rm_values` JSON) → definition `one_rm` → (existing) last-session weight → `default_weight` → 0.
- Existing `activateProgram` behaviors preserved: archive-current, retire completed cards, set `activated_date`. Existing test assertions expecting `one_rm_values = NULL` are the ONE place existing tests may be updated — the behavior change is the feature.
- No import cycles: `metrics.ts` must not import from `programs.ts`.

## File Structure

- `src/db/metrics.ts` — MODIFY: add `SEED_1RM_WINDOW` + `getSeed1RM`
- `src/db/programs.ts` — MODIFY: `activateProgram` computes/stores seeds
- `src/db/index.ts` — MODIFY: export `getSeed1RM`
- `src/utils/program.ts` — MODIFY: add `resolveOneRm`
- `src/types/training.ts` — MODIFY: `Program` gains `one_rm_values?: string | null`
- `src/hooks/useWorkoutSession.ts` — MODIFY: both weight sites use `resolveOneRm`
- Tests: `__tests__/db/metrics.test.ts` (append), `__tests__/db/programs.test.ts` (append + amend NULL assertions), `__tests__/utils/program.test.ts` (append)

---

### Task 1: `getSeed1RM` — windowed max e1RM

**Files:**
- Modify: `src/db/metrics.ts` (after `getEstimated1RM`)
- Modify: `src/db/index.ts` (add `getSeed1RM` to the metrics export list)
- Test: `__tests__/db/metrics.test.ts` (append; follow the file's existing mock setup)

**Interfaces:**
- Produces: `getSeed1RM(exerciseId: string): Promise<number | null>`; `SEED_1RM_WINDOW = { maxSessions: 10, maxDays: 60 }` — both exported from `src/db/metrics.ts`.

- [ ] **Step 1: Write the failing tests** — append to `__tests__/db/metrics.test.ts`, reusing its existing `createMockDb`/`getDatabase` mock pattern (add `getSeed1RM` to the existing import from `../../src/db/metrics`):

```typescript
describe('getSeed1RM', () => {
  it('returns the max Epley e1RM across returned sets', async () => {
    const mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
    mockDb.getAllAsync.mockResolvedValue([
      { actual_weight: 315, actual_reps: 3 },  // Epley 347
      { actual_weight: 275, actual_reps: 8 },  // Epley 348 (the max)
      { actual_weight: 225, actual_reps: 8 },  // deload — loses to the max
    ]);

    const seed = await getSeed1RM('back_squat');

    expect(seed).toBe(348);
  });

  it('returns null when no qualifying sets exist', async () => {
    const mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
    mockDb.getAllAsync.mockResolvedValue([]);

    expect(await getSeed1RM('incline_bench_bb')).toBeNull();
  });

  it('bounds the window: last 60 days AND last 10 sessions containing the exercise, qualifying sets only', async () => {
    const mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
    mockDb.getAllAsync.mockResolvedValue([]);

    await getSeed1RM('back_squat');

    const [sql, params] = mockDb.getAllAsync.mock.calls[0];
    expect(sql).toContain("date('now', '-60 days')");
    expect(sql).toContain('LIMIT 10');
    expect(sql).toContain("status IN ('completed', 'completed_below')");
    expect(sql).toContain('actual_weight > 0');
    expect(sql).toContain('actual_reps > 0');
    expect(params).toEqual(['back_squat', 'back_squat']);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/db/metrics.test.ts -t getSeed1RM`
Expected: FAIL — `getSeed1RM` is not exported.

- [ ] **Step 3: Implement** — in `src/db/metrics.ts`, after `getEstimated1RM`:

```typescript
/** Window for activation-time 1RM seeding */
export const SEED_1RM_WINDOW = { maxSessions: 10, maxDays: 60 } as const;

/**
 * Best (max) Epley e1RM from recent history, for seeding a new program run's
 * working 1RMs at activation. Window: sets from the last 10 sessions
 * containing the exercise AND the last 60 days — whichever is more
 * restrictive. Max across the window makes deload/low-RPE weeks harmless.
 * Returns null when no qualifying sets exist (caller falls back to the
 * definition's seed value).
 */
export async function getSeed1RM(exerciseId: string): Promise<number | null> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ actual_weight: number; actual_reps: number }>(
    `SELECT sl.actual_weight, sl.actual_reps
     FROM set_logs sl
     JOIN sessions s ON s.id = sl.session_id
     WHERE sl.exercise_id = ?
       AND sl.status IN ('completed', 'completed_below')
       AND sl.actual_weight > 0
       AND sl.actual_reps > 0
       AND s.date >= date('now', '-${SEED_1RM_WINDOW.maxDays} days')
       AND sl.session_id IN (
         SELECT id FROM (
           SELECT DISTINCT s2.id, s2.date
           FROM set_logs sl2
           JOIN sessions s2 ON s2.id = sl2.session_id
           WHERE sl2.exercise_id = ?
           ORDER BY s2.date DESC
           LIMIT ${SEED_1RM_WINDOW.maxSessions}
         )
       )`,
    [exerciseId, exerciseId]
  );

  let best = 0;
  for (const row of rows) {
    const e1rm = calculateEpley(row.actual_weight, row.actual_reps);
    if (e1rm > best) best = e1rm;
  }
  return best > 0 ? best : null;
}
```

In `src/db/index.ts`, add `getSeed1RM` to the existing metrics export list (the long `export { calculateEpley, getEstimated1RM, ... } from './metrics';` line).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/db/metrics.test.ts`
Expected: PASS (whole file).

- [ ] **Step 5: Verify types and full suite, then commit**

Run: `npx tsc --noEmit && npm test`
Expected: clean.

```bash
git add src/db/metrics.ts src/db/index.ts __tests__/db/metrics.test.ts
git commit -m "feat: getSeed1RM — windowed max e1RM for activation seeding"
```

---

### Task 2: `activateProgram` computes and stores run seeds

**Files:**
- Modify: `src/db/programs.ts` (`activateProgram`, currently lines 130-154; add import of `getSeed1RM` from `./metrics`)
- Modify: `src/types/training.ts` (`Program` interface, after `definition_json`)
- Test: `__tests__/db/programs.test.ts` (append new describe; AMEND any existing assertion expecting `one_rm_values = NULL`)

**Interfaces:**
- Consumes: `getSeed1RM` (Task 1).
- Produces: `activateProgram` stores `one_rm_values` as `JSON.stringify(Record<string, number>)` (or NULL when the definition is unparseable/has no `uses_1rm` exercises). `Program.one_rm_values?: string | null`.

- [ ] **Step 1: Write the failing tests** — append to `__tests__/db/programs.test.ts`. Add a metrics mock at the top of the file, right after the existing `jest.mock('../../src/db/database', ...)` block:

```typescript
jest.mock('../../src/db/metrics', () => ({
  getSeed1RM: jest.fn().mockResolvedValue(null),
}));
```

Import it for per-test control (with the other imports):

```typescript
import { getSeed1RM } from '../../src/db/metrics';
```

Then append:

```typescript
describe('activateProgram 1RM seeding', () => {
  function defWithMains(): string {
    return JSON.stringify({
      program: {
        id: 'test-prog',
        name: 'Test',
        duration_weeks: 11,
        created: '2026-07-12',
        blocks: [],
        weekly_template: {},
        warmup_protocols: {},
        exercise_definitions: [
          { id: 'back_squat', name: 'Back Squat', type: 'main', muscle_groups: [], uses_1rm: true, one_rm: 315 },
          { id: 'incline_bench_bb', name: 'Incline Bench Press', type: 'main', muscle_groups: [], uses_1rm: true, one_rm: 265 },
          { id: 'face_pulls', name: 'Face Pulls', type: 'accessory', muscle_groups: [] },
        ],
      },
    });
  }

  it('stores computed seeds, falling back to definition one_rm when history is empty', async () => {
    const mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
    mockDb.getFirstAsync.mockResolvedValue({ definition_json: defWithMains() });
    (getSeed1RM as jest.Mock)
      .mockResolvedValueOnce(348)   // back_squat: computed from history
      .mockResolvedValueOnce(null); // incline: no history -> definition seed

    await activateProgram('prog-1');

    const activateCall = (mockDb.runAsync as jest.Mock).mock.calls.find(
      c => (c[0] as string).includes("status = 'active'")
    );
    expect(activateCall).toBeDefined();
    expect(activateCall![0]).toContain('one_rm_values = ?');
    const stored = JSON.parse(activateCall![1][0]);
    expect(stored).toEqual({ back_squat: 348, incline_bench_bb: 265 });
    // accessories without uses_1rm are never seeded
    expect(getSeed1RM).toHaveBeenCalledTimes(2);
  });

  it('stores NULL seeds when the definition is unparseable', async () => {
    const mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
    mockDb.getFirstAsync.mockResolvedValue({ definition_json: 'not json' });

    await activateProgram('prog-1');

    const activateCall = (mockDb.runAsync as jest.Mock).mock.calls.find(
      c => (c[0] as string).includes("status = 'active'")
    );
    expect(activateCall![1][0]).toBeNull();
  });

  it('still archives the previously active program and retires completed cards', async () => {
    const mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
    mockDb.getFirstAsync.mockResolvedValue({ definition_json: defWithMains() });

    await activateProgram('prog-1');

    const sqls = (mockDb.runAsync as jest.Mock).mock.calls.map(c => c[0] as string);
    expect(sqls.some(s => s.includes("SET status = 'archived'"))).toBe(true);
    expect(sqls.some(s => s.includes('card_dismissed = 1'))).toBe(true);
  });
});
```

Also: search the file for existing `activateProgram` assertions containing `one_rm_values = NULL` and update them to expect `one_rm_values = ?` (parameterized) — this is the sanctioned amendment. `beforeEach` clearing: if the file's existing `beforeEach` doesn't reset the new metrics mock, add `(getSeed1RM as jest.Mock).mockReset().mockResolvedValue(null);` to it.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/db/programs.test.ts -t seeding`
Expected: FAIL — activate SQL still contains `one_rm_values = NULL`, no seeds stored.

- [ ] **Step 3: Implement** — in `src/db/programs.ts`:

Add to the imports:

```typescript
import { getSeed1RM } from './metrics';
```

Replace the final block of `activateProgram` (the `// Activate this one` comment and the `UPDATE ... one_rm_values = NULL ...` statement) with:

```typescript
  // Seed this run's working 1RMs from recent training history: best e1RM in
  // the seed window per main lift, definition seed as cold-start fallback.
  const row = await db.getFirstAsync<{ definition_json: string }>(
    'SELECT definition_json FROM programs WHERE id = ?',
    [programId]
  );
  let oneRmJson: string | null = null;
  if (row) {
    try {
      const def = JSON.parse(row.definition_json) as ProgramDefinition;
      const seeds: Record<string, number> = {};
      for (const ex of def.program.exercise_definitions) {
        if (!ex.uses_1rm) continue;
        const seed = (await getSeed1RM(ex.id)) ?? ex.one_rm;
        if (seed) seeds[ex.id] = seed;
      }
      if (Object.keys(seeds).length > 0) oneRmJson = JSON.stringify(seeds);
    } catch {
      // Unparseable definition — read-time fallback to definition seeds covers it
    }
  }

  // Activate this one
  await db.runAsync(
    `UPDATE programs SET status = 'active', one_rm_values = ?, activated_date = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [oneRmJson, getLocalDateString(), programId]
  );
```

In `src/types/training.ts`, in the `Program` interface after `definition_json: string;`:

```typescript
  /** Per-run working 1RMs seeded at activation: JSON Record<exercise_id, number> */
  one_rm_values?: string | null;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/db/programs.test.ts`
Expected: PASS (whole file, including amended existing assertions).

- [ ] **Step 5: Verify types and full suite, then commit**

Run: `npx tsc --noEmit && npm test`
Expected: clean.

```bash
git add src/db/programs.ts src/types/training.ts __tests__/db/programs.test.ts
git commit -m "feat: activation seeds per-run 1RMs from recent history"
```

---

### Task 3: `resolveOneRm` + wire both weight-resolution sites

**Files:**
- Modify: `src/utils/program.ts` (add helper)
- Modify: `src/hooks/useWorkoutSession.ts` (two sites: `performRestore` ~line 239, `startSession` ~line 480 — both currently `const oneRm = exerciseDef?.one_rm;`)
- Test: `__tests__/utils/program.test.ts` (append)

**Interfaces:**
- Consumes: `Program.one_rm_values` (Task 2).
- Produces: `resolveOneRm(oneRmValuesJson: string | null | undefined, exerciseId: string, definitionOneRm: number | undefined): number | undefined` from `src/utils/program.ts`.

- [ ] **Step 1: Write the failing tests** — append to `__tests__/utils/program.test.ts` (add `resolveOneRm` to the existing import):

```typescript
describe('resolveOneRm', () => {
  const seeds = JSON.stringify({ back_squat: 348, barbell_row: 260 });

  it('prefers the run seed over the definition value', () => {
    expect(resolveOneRm(seeds, 'back_squat', 315)).toBe(348);
  });

  it('falls back to the definition value when the exercise has no seed', () => {
    expect(resolveOneRm(seeds, 'incline_bench_bb', 265)).toBe(265);
  });

  it('falls back when the column is null or undefined', () => {
    expect(resolveOneRm(null, 'back_squat', 315)).toBe(315);
    expect(resolveOneRm(undefined, 'back_squat', 315)).toBe(315);
  });

  it('falls back on invalid JSON', () => {
    expect(resolveOneRm('not json', 'back_squat', 315)).toBe(315);
  });

  it('ignores non-positive or non-numeric seeds', () => {
    expect(resolveOneRm(JSON.stringify({ back_squat: 0 }), 'back_squat', 315)).toBe(315);
    expect(resolveOneRm(JSON.stringify({ back_squat: 'x' }), 'back_squat', 315)).toBe(315);
  });

  it('returns undefined when nothing resolves (accessory without 1RM)', () => {
    expect(resolveOneRm(null, 'face_pulls', undefined)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/utils/program.test.ts -t resolveOneRm`
Expected: FAIL — not exported.

- [ ] **Step 3: Implement the helper** — in `src/utils/program.ts`:

```typescript
/** Resolve the working 1RM for an exercise: the run's activation-time seeds
 *  first (programs.one_rm_values JSON), then the definition's seed value. */
export function resolveOneRm(
  oneRmValuesJson: string | null | undefined,
  exerciseId: string,
  definitionOneRm: number | undefined
): number | undefined {
  if (oneRmValuesJson) {
    try {
      const seeds = JSON.parse(oneRmValuesJson) as Record<string, unknown>;
      const seed = seeds[exerciseId];
      if (typeof seed === 'number' && seed > 0) return seed;
    } catch {
      // fall through to the definition seed
    }
  }
  return definitionOneRm;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/utils/program.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire both hook sites** — in `src/hooks/useWorkoutSession.ts`, add `resolveOneRm` to the existing import from `'../utils/program'`. Both sites sit inside functions that hold the active program row (`active: Program & { definition: ProgramDefinition }` in `performRestore`; the `startSession` flow's program variable — verify its name in scope, it comes from `getActiveProgram()`). Replace, at BOTH sites:

```typescript
      const oneRm = exerciseDef?.one_rm;
```

with (using the in-scope program row variable):

```typescript
      const oneRm = resolveOneRm(active.one_rm_values, slot.exercise_id, exerciseDef?.one_rm);
```

If the `startSession` site's program variable is named differently (e.g., `program`), use that name — the requirement is the ACTIVE PROGRAM ROW's `one_rm_values`, same object the `definition` came from.

- [ ] **Step 6: Verify types and full suite, then commit**

Run: `npx tsc --noEmit && npm test`
Expected: clean — the hook's existing tests must stay green (the resolution change is invisible when `one_rm_values` is null, which is what existing fixtures have).

```bash
git add src/utils/program.ts src/hooks/useWorkoutSession.ts __tests__/utils/program.test.ts
git commit -m "feat: weight calc prefers activation-seeded 1RMs over definition values"
```

---

### Task 4: Final verification

- [ ] `npx tsc --noEmit && npm test` — everything green
- [ ] `grep -n "one_rm_values = NULL" src/db/programs.ts` — no hits (the literal NULL write is gone)
- [ ] On-device (user-run, later): activate Pillars → week 1 squat weight should reflect recent FA e1RM, incline should be ~200 (75% of the 265 fallback)
