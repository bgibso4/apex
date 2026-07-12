# Functional Athlete — Pillars Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the "Functional Athlete — Pillars" program as a second bundled program, with focus chips on program cards, a legacy-v2 cleanup migration, and a session-detail fix so past sessions label themselves from their own program.

**Architecture:** Programs are JSON definitions imported into SQLite `programs` rows keyed by `bundled_id`. We add a second bundled JSON plus a `BUNDLED_PROGRAMS` registry consumed at launch (refresh) and in the library (auto-import). A new optional `focus` field renders as chips. Schema bumps to v16 to archive the orphaned pre-launch "Functional Athlete v2" row.

**Tech Stack:** React Native (Expo SDK 54), expo-router, expo-sqlite, TypeScript strict, Jest + @testing-library/react-native.

**Spec:** `docs/superpowers/specs/2026-07-12-functional-athlete-pillars-design.md`

## Global Constraints

- TDD: failing test → implement → green → commit. Run `npm test` before claiming any task complete.
- Tokens, not magic numbers: components use `Colors.*`, `Spacing.*`, `FontSize.*`, `BorderRadius.*` from `src/theme` — never raw hex/px values.
- Existing exercise ids are NEVER renamed or deleted. Reused ids (`incline_bench_bb`, `dips`, `hammer_row`, `bulgarian_split_squat`, `standing_calf_raises`) get updated metadata via program-import upsert only as specified in the spec.
- Program display name is exactly `Functional Athlete — Pillars` (em dash, U+2014). `bundled_id` is exactly `functional-athlete-pillars`.
- DB tests follow the existing mock idiom (`jest.mock` on `src/db/database`, `createMockDb()`), not a real SQLite instance.
- Never modify `src/data/functional-athlete.json`.

## File Structure

- `src/data/functional-athlete-pillars.json` — NEW: the program definition (the core deliverable)
- `src/data/bundled-programs.ts` — NEW: registry of bundled program definitions
- `src/db/migrations.ts` — NEW: dependency-injected migration helpers (testable without expo-sqlite)
- `src/components/FocusChips.tsx` — NEW: chip row component
- `src/db/programs.ts` — MODIFY: add `getProgramById`
- `src/db/index.ts` — MODIFY: export `getProgramById`
- `src/db/schema.ts` — MODIFY: `SCHEMA_VERSION` 15 → 16
- `src/db/database.ts` — MODIFY: v16 migration block
- `src/types/program.ts` — MODIFY: add `focus?: string[]`
- `app/_layout.tsx` — MODIFY: refresh all bundled programs
- `app/library.tsx` — MODIFY: auto-import all bundled programs; render chips
- `app/(tabs)/index.tsx` — MODIFY: render chips under program name
- `app/session/[id].tsx` — MODIFY: resolve labels from the session's own program

---

### Task 1: `getProgramById` + session-detail resolves from its own program

**Files:**
- Modify: `src/db/programs.ts` (add function after `getActiveProgram`, ~line 23)
- Modify: `src/db/index.ts:3` (add export)
- Modify: `app/session/[id].tsx:86` (swap `getActiveProgram()` for `getProgramById(s.program_id)`)
- Test: `__tests__/db/programs.test.ts` (append)

**Interfaces:**
- Produces: `getProgramById(programId: string): Promise<(Program & { definition: ProgramDefinition }) | null>` — exported from `src/db/programs.ts` and the `src/db` barrel.

- [ ] **Step 1: Write the failing test** — append to `__tests__/db/programs.test.ts` (it already has `createMockDb()` and `jest.mock('../../src/db/database', ...)`; add `getProgramById` to the existing import from `../../src/db/programs`):

```typescript
describe('getProgramById', () => {
  it('returns the program row with parsed definition', async () => {
    const mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
    const def = makeProgramDef({ name: 'Old Program' });
    mockDb.getFirstAsync.mockResolvedValue({
      id: 'prog-1',
      name: 'Old Program',
      status: 'archived',
      definition_json: JSON.stringify(def),
    });

    const result = await getProgramById('prog-1');

    expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id = ?'),
      ['prog-1']
    );
    expect(result?.name).toBe('Old Program');
    expect(result?.definition.program.name).toBe('Old Program');
  });

  it('returns null when the program does not exist', async () => {
    const mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
    mockDb.getFirstAsync.mockResolvedValue(null);

    expect(await getProgramById('missing')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/db/programs.test.ts -t getProgramById`
Expected: FAIL — `getProgramById` is not exported.

- [ ] **Step 3: Implement** — in `src/db/programs.ts`, directly after `getActiveProgram` (after line 22):

```typescript
/** Get any program by row id, with parsed definition (for viewing past sessions) */
export async function getProgramById(
  programId: string
): Promise<(Program & { definition: ProgramDefinition }) | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Program>(
    'SELECT * FROM programs WHERE id = ? LIMIT 1',
    [programId]
  );
  if (!row) return null;

  const definition = JSON.parse(row.definition_json) as ProgramDefinition;
  return { ...row, definition };
}
```

In `src/db/index.ts` line 3, add `getProgramById` to the programs export list:

```typescript
export { getActiveProgram, getProgramById, getAllPrograms, importProgram, refreshBundledProgram, activateProgram, restartProgram, stopProgram, markProgramComplete, backfillActiveProgramCompletion, getMostRecentCompletedProgram } from './programs';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/db/programs.test.ts`
Expected: PASS (all tests in file).

- [ ] **Step 5: Fix the session-detail screen** — in `app/session/[id].tsx`:

The file imports DB functions from `'../../src/db'` in the import block starting line 11 — find `getActiveProgram` in that block and replace it with `getProgramById`. Then at line 86, replace:

```typescript
      const program = await getActiveProgram();
```

with:

```typescript
      const program = await getProgramById(s.program_id);
```

Everything downstream (`program.definition.program.blocks`, the superset map) is unchanged — the object shape is identical.

- [ ] **Step 6: Verify types and full suite**

Run: `npx tsc --noEmit && npm test`
Expected: no type errors; all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/db/programs.ts src/db/index.ts "app/session/[id].tsx" __tests__/db/programs.test.ts
git commit -m "fix: past sessions resolve block/superset labels from their own program"
```

---

### Task 2: Schema v16 — archive the orphaned "Functional Athlete v2" row

**Files:**
- Create: `src/db/migrations.ts`
- Modify: `src/db/schema.ts:6` (`SCHEMA_VERSION` 15 → 16)
- Modify: `src/db/database.ts` (new migration block after the v15 block ending line 238)
- Test: `__tests__/db/migrations.test.ts` (new file)

**Interfaces:**
- Produces: `archiveLegacyV2Programs(db: MigrationDb): Promise<void>` from `src/db/migrations.ts`, where `MigrationDb = { runAsync(sql: string, params?: unknown[]): Promise<unknown> }`. `database.ts` imports it (no import cycle: `migrations.ts` imports nothing from `src/db`).

- [ ] **Step 1: Write the failing test** — create `__tests__/db/migrations.test.ts`:

```typescript
/**
 * Tests for src/db/migrations.ts — dependency-injected migration helpers
 */

import { archiveLegacyV2Programs } from '../../src/db/migrations';

describe('archiveLegacyV2Programs (v16)', () => {
  it('archives only legacy v2 rows: matches name, requires NULL bundled_id, spares finished runs', async () => {
    const db = { runAsync: jest.fn().mockResolvedValue({ changes: 1 }) };

    await archiveLegacyV2Programs(db);

    expect(db.runAsync).toHaveBeenCalledTimes(1);
    const sql = (db.runAsync as jest.Mock).mock.calls[0][0] as string;
    // Targets archived status
    expect(sql).toMatch(/SET\s+status\s*=\s*'archived'/i);
    // Only the legacy pre-launch name
    expect(sql).toContain("name = 'Functional Athlete v2'");
    // Never touches rows the bundled refresh manages
    expect(sql).toMatch(/bundled_id\s+IS\s+NULL/i);
    // Never re-files completed/archived history
    expect(sql).toMatch(/status\s+IN\s*\(\s*'active'\s*,\s*'inactive'\s*\)/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/db/migrations.test.ts`
Expected: FAIL — module `src/db/migrations` does not exist.

- [ ] **Step 3: Implement** — create `src/db/migrations.ts`:

```typescript
/**
 * APEX — Migration helpers
 * Dependency-injected (db handle passed in) so they are unit-testable
 * without expo-sqlite. Called from database.ts migration blocks.
 */

export interface MigrationDb {
  runAsync(sql: string, params?: unknown[]): Promise<unknown>;
}

/**
 * v16: Archive orphaned pre-launch "Functional Athlete v2" rows.
 * That row holds the obsolete 12-week draft; it predates bundled_id, so the
 * launch-time refresh can never match it (bundled_id NULL, name mismatch) —
 * leaving it activatable by accident. Archiving (not deleting) keeps the row
 * and any attached sessions recoverable.
 */
export async function archiveLegacyV2Programs(db: MigrationDb): Promise<void> {
  await db.runAsync(`
    UPDATE programs SET status = 'archived', updated_at = datetime('now')
    WHERE name = 'Functional Athlete v2'
      AND bundled_id IS NULL
      AND status IN ('active', 'inactive')
  `);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/db/migrations.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire the migration** — in `src/db/schema.ts` line 6:

```typescript
export const SCHEMA_VERSION = 16;
```

In `src/db/database.ts`, add an import at the top with the other local imports:

```typescript
import { archiveLegacyV2Programs } from './migrations';
```

And insert the v16 block immediately after the v15 block (after line 238, before the "Safety net" comment):

```typescript
    // v16: archive the orphaned pre-launch "Functional Athlete v2" row —
    // obsolete 12-week draft, unmatchable by the bundled refresh, and
    // accidentally activatable until now. Archived, not deleted.
    if (currentVersion < 16) {
      await archiveLegacyV2Programs(db);
    }
```

- [ ] **Step 6: Verify types and full suite**

Run: `npx tsc --noEmit && npm test`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add src/db/migrations.ts src/db/schema.ts src/db/database.ts __tests__/db/migrations.test.ts
git commit -m "feat: schema v16 archives orphaned pre-launch Functional Athlete v2 row"
```

---

### Task 3: The Pillars program definition JSON + validation test

**Files:**
- Create: `src/data/functional-athlete-pillars.json`
- Test: `__tests__/data/functional-athlete-pillars.test.ts` (new file + new directory)
- Modify: `package.json` — the "unit" jest project's `testMatch` only covers `__tests__/utils/**` and `__tests__/db/**`; a new `__tests__/data/` directory would be SILENTLY IGNORED without the config change below

**Interfaces:**
- Produces: the JSON with `program.id === 'functional-athlete-pillars'`, `program.name === 'Functional Athlete — Pillars'`, `program.focus === ['hips','core','back']`. Task 4 imports this file; Task 5 reads `focus`.

**Content notes (from the spec — the test enforces these):**
- Main lifts (`category: "main"`) all share the identical 11-week wave (75/77/79/81/65/80/83/85/87/70/90).
- Sunday circuit (`sunday-circuit`) is a QUAD-set: SkiErg, Farmer's Carry 60m, KB Swings, Sprints 80m — all on the wave 3/3/4/4/2/4/4/5/5/3/6. Sunday has NO `conditioning_finisher`.
- Snatch-grip high pull: constant 4×4 (deloads 3×4), `default_weight: 155`.
- `wednesday-plyo-lat`: plyo push-up ×5 and lat pulldown ×8, sets always equal per week (4/4/4/4/2/4/4/4/4/2/3).
- Hip thrust `default_weight: 225`, trap-bar contrast `default_weight: 225`, dips `default_weight: 70`, carries 60m both days, DB curls 3 sets (deload 2).

- [ ] **Step 1: Write the failing validation test** — create `__tests__/data/functional-athlete-pillars.test.ts`:

```typescript
/**
 * Validation tests for the Pillars program definition.
 * This is the machine-checkable half of the D14 audit.
 */

import pillarsJson from '../../src/data/functional-athlete-pillars.json';
import type { ProgramDefinition, DayTemplate, ExerciseSlot } from '../../src/types';

const def = (pillarsJson as unknown as ProgramDefinition).program;
const TRAINING_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const ALL_WEEKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

function slotsOf(day: string): ExerciseSlot[] {
  return (def.weekly_template[day] as DayTemplate).exercises;
}
function allSlots(): Array<{ day: string; slot: ExerciseSlot }> {
  return TRAINING_DAYS.flatMap(day => slotsOf(day).map(slot => ({ day, slot })));
}
function setsForWeek(slot: ExerciseSlot, week: number): number | null {
  const t = slot.targets.find(t => t.weeks.includes(week));
  return t ? t.sets : null;
}

describe('functional-athlete-pillars.json', () => {
  it('has correct identity, duration, and focus', () => {
    expect(def.id).toBe('functional-athlete-pillars');
    expect(def.name).toBe('Functional Athlete — Pillars');
    expect(def.duration_weeks).toBe(11);
    expect((def as any).focus).toEqual(['hips', 'core', 'back']);
  });

  it('has 6 training days and a Saturday rest day', () => {
    for (const day of TRAINING_DAYS) {
      expect(def.weekly_template[day]).toHaveProperty('exercises');
    }
    expect(def.weekly_template.saturday).toEqual({ type: 'rest' });
  });

  it('every exercise slot references a defined exercise', () => {
    const definedIds = new Set(def.exercise_definitions.map(e => e.id));
    for (const { day, slot } of allSlots()) {
      expect({ day, id: slot.exercise_id, defined: definedIds.has(slot.exercise_id) })
        .toEqual({ day, id: slot.exercise_id, defined: true });
    }
  });

  it('every slot covers all 11 weeks exactly once', () => {
    for (const { day, slot } of allSlots()) {
      for (const week of ALL_WEEKS) {
        const covering = slot.targets.filter(t => t.weeks.includes(week));
        expect({ day, id: slot.exercise_id, week, count: covering.length })
          .toEqual({ day, id: slot.exercise_id, week, count: 1 });
      }
    }
  });

  it('every main lift runs the full %1RM wave', () => {
    const expectedPercents: Record<number, number> = {
      1: 75, 2: 77, 3: 79, 4: 81, 5: 65, 6: 80, 7: 83, 8: 85, 9: 87, 10: 70, 11: 90,
    };
    const mains = allSlots().filter(({ slot }) => slot.category === 'main');
    // back squat, incline bench, barbell row, OHP, zercher, RDL
    expect(mains.length).toBe(6);
    for (const { slot } of mains) {
      for (const week of ALL_WEEKS) {
        const t = slot.targets.find(t => t.weeks.includes(week))!;
        expect(t.percent).toBe(expectedPercents[week]);
      }
    }
  });

  it('flat bench press and DB hang high pull are gone', () => {
    const ids = allSlots().map(({ slot }) => slot.exercise_id);
    expect(ids).not.toContain('bench_press');
    expect(ids).not.toContain('db_hang_high_pull');
    expect(ids).toContain('incline_bench_bb');
    expect(ids).toContain('snatch_grip_high_pull');
  });

  it('Sunday circuit is a quad-set on the shared wave, and Sunday has no finisher', () => {
    const sunday = def.weekly_template.sunday as DayTemplate;
    const circuit = sunday.exercises.filter(s => s.superset_group === 'sunday-circuit');
    expect(circuit.map(s => s.exercise_id).sort()).toEqual(
      ['farmers_carry', 'kb_swings_heavy', 'skierg_intervals', 'sprints'].sort()
    );
    const wave: Record<number, number> = { 1: 3, 2: 3, 3: 4, 4: 4, 5: 2, 6: 4, 7: 4, 8: 5, 9: 5, 10: 3, 11: 6 };
    for (const slot of circuit) {
      for (const week of ALL_WEEKS) {
        expect(setsForWeek(slot, week)).toBe(wave[week]);
      }
    }
    expect(sunday.conditioning_finisher).toBeUndefined();
  });

  it('carries are 60m on both days', () => {
    const carries = allSlots().filter(({ slot }) => slot.exercise_id === 'farmers_carry');
    expect(carries.map(c => c.day).sort()).toEqual(['sunday', 'wednesday']);
    for (const { slot } of carries) {
      for (const t of slot.targets) {
        expect(t.values).toEqual({ distance: 60 });
      }
    }
  });

  it('snatch-grip high pull is constant 4x4 at 155 (3x4 deloads)', () => {
    const slot = slotsOf('wednesday').find(s => s.exercise_id === 'snatch_grip_high_pull')!;
    expect(slot.default_weight).toBe(155);
    for (const week of ALL_WEEKS) {
      const t = slot.targets.find(t => t.weeks.includes(week))!;
      expect(t.reps).toBe(4);
      expect(t.sets).toBe(week === 5 || week === 10 ? 3 : 4);
    }
  });

  it('plyo push-up and lat pulldown sets match every week; reps never change', () => {
    const plyo = slotsOf('wednesday').find(s => s.exercise_id === 'plyo_pushup')!;
    const pulldown = slotsOf('wednesday').find(s => s.exercise_id === 'lat_pulldown')!;
    expect(plyo.superset_group).toBe('wednesday-plyo-lat');
    expect(pulldown.superset_group).toBe('wednesday-plyo-lat');
    for (const week of ALL_WEEKS) {
      expect(setsForWeek(plyo, week)).toBe(setsForWeek(pulldown, week));
      expect(plyo.targets.find(t => t.weeks.includes(week))!.reps).toBe(5);
      expect(pulldown.targets.find(t => t.weeks.includes(week))!.reps).toBe(8);
    }
  });

  it('key weights: hip thrust 225, trap bar 225, dips +70', () => {
    expect(slotsOf('thursday').find(s => s.exercise_id === 'hip_thrust')!.default_weight).toBe(225);
    expect(slotsOf('sunday').find(s => s.exercise_id === 'trap_bar_squat_to_box_jump')!.default_weight).toBe(225);
    expect(slotsOf('monday').find(s => s.exercise_id === 'dips')!.default_weight).toBe(70);
  });

  it('incline bench is promoted to a main with a 265 seed; dips gain a weight field', () => {
    const incline = def.exercise_definitions.find(e => e.id === 'incline_bench_bb')!;
    expect(incline.name).toBe('Incline Bench Press');
    expect(incline.type).toBe('main');
    expect(incline.uses_1rm).toBe(true);
    expect(incline.one_rm).toBe(265);
    const dips = def.exercise_definitions.find(e => e.id === 'dips')!;
    expect(dips.input_fields).toEqual([
      { type: 'weight', unit: 'lbs' },
      { type: 'reps' },
    ]);
  });

  it('every superset group has at least 2 members on its day', () => {
    for (const day of TRAINING_DAYS) {
      const groups = new Map<string, number>();
      for (const slot of slotsOf(day)) {
        if (slot.superset_group) {
          groups.set(slot.superset_group, (groups.get(slot.superset_group) ?? 0) + 1);
        }
      }
      for (const [group, count] of groups) {
        expect({ day, group, ok: count >= 2 }).toEqual({ day, group, ok: true });
      }
    }
  });

  it('every warmup key on every day exists in warmup_protocols', () => {
    for (const day of TRAINING_DAYS) {
      const tmpl = def.weekly_template[day] as DayTemplate;
      for (const key of tmpl.warmup) {
        expect({ day, key, defined: key in def.warmup_protocols })
          .toEqual({ day, key, defined: true });
      }
    }
  });

  it('Tuesday warmup is trimmed and the hip block is ordered: superset -> IR -> mobility last', () => {
    const tue = def.weekly_template.tuesday as DayTemplate;
    expect(tue.warmup).toEqual(['jump_rope', 'abbreviated_ankle']);
    const ids = tue.exercises.map(s => s.exercise_id);
    expect(ids[0]).toBe('easy_run');
    expect(ids[ids.length - 1]).toBe('hip_mobility_flow');
    expect(ids).toContain('copenhagen_plank');
    expect(ids).toContain('step_out_squat');
    expect(ids.indexOf('hip_ir_liftoff')).toBeGreaterThan(ids.indexOf('copenhagen_plank'));
  });
});
```

- [ ] **Step 2: Register the new test directory** — in `package.json`, in the jest `projects` entry with `"displayName": "unit"`, extend `testMatch`:

```json
        "testMatch": [
          "**/__tests__/utils/**",
          "**/__tests__/db/**",
          "**/__tests__/data/**"
        ],
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest __tests__/data/functional-athlete-pillars.test.ts`
Expected: FAIL — cannot find module `src/data/functional-athlete-pillars.json`. (If it reports "no tests found" instead, the testMatch change from Step 2 didn't take — fix that first.)

- [ ] **Step 4: Create the program JSON** — create `src/data/functional-athlete-pillars.json` with exactly this content:

```json
{
  "program": {
    "id": "functional-athlete-pillars",
    "name": "Functional Athlete — Pillars",
    "duration_weeks": 11,
    "created": "2026-07-12",
    "focus": ["hips", "core", "back"],

    "blocks": [
      {
        "name": "Hypertrophy",
        "weeks": [1, 2, 3, 4],
        "emphasis": "work_capacity",
        "main_lift_scheme": {
          "progression": "weekly_weight",
          "week_1": { "sets": 4, "reps": 8, "percent": 75, "rpe_target": "6-7" },
          "week_2": { "sets": 4, "reps": 8, "percent": 77, "rpe_target": "7" },
          "week_3": { "sets": 4, "reps": 8, "percent": 79, "rpe_target": "7-8" },
          "week_4": { "sets": 4, "reps": 8, "percent": 81, "rpe_target": "8" }
        },
        "accessory_scheme": { "rep_target": "fixed", "rpe_target": "7-8", "notes": "Fixed rep target per exercise, auto-regulate weight" }
      },
      {
        "name": "Deload",
        "weeks": [5],
        "emphasis": "recovery",
        "main_lift_scheme": {
          "week_5": { "sets": 3, "reps": 8, "percent": 65, "rpe_target": "4-5" }
        },
        "volume_modifier": 0.6,
        "accessory_scheme": { "notes": "Drop 1 set per exercise, use lighter weight" }
      },
      {
        "name": "Strength",
        "weeks": [6, 7, 8, 9],
        "emphasis": "strength",
        "main_lift_scheme": {
          "progression": "weekly_weight",
          "week_6": { "sets": 4, "reps": 5, "percent": 80, "rpe_target": "7" },
          "week_7": { "sets": 4, "reps": 5, "percent": 83, "rpe_target": "7-8" },
          "week_8": { "sets": 4, "reps": 5, "percent": 85, "rpe_target": "8" },
          "week_9": { "sets": 4, "reps": 5, "percent": 87, "rpe_target": "8-9" }
        },
        "accessory_scheme": { "rep_target": "fixed", "rpe_target": "7-8", "notes": "Same rep target as hypertrophy, auto-regulate weight" }
      },
      {
        "name": "Deload",
        "weeks": [10],
        "emphasis": "recovery",
        "main_lift_scheme": {
          "week_10": { "sets": 3, "reps": 5, "percent": 70, "rpe_target": "4-5" }
        },
        "volume_modifier": 0.6,
        "accessory_scheme": { "notes": "Drop 1 set per exercise, use lighter weight" }
      },
      {
        "name": "Realization",
        "weeks": [11],
        "emphasis": "peak",
        "main_lift_scheme": {
          "week_11": { "sets": 3, "reps": 3, "percent": 90, "rpe_target": "8-9" }
        },
        "accessory_scheme": { "notes": "Same rep target, moderate weight, keep volume low" }
      }
    ],

    "weekly_template": {
      "saturday": { "type": "rest" },

      "sunday": {
        "name": "Athletic Power & Conditioning",
        "locked": true,
        "warmup": ["jump_rope", "full_ankle", "dynamic_warmup"],
        "exercises": [
          {
            "exercise_id": "back_squat",
            "category": "main",
            "targets": [
              { "weeks": [1], "sets": 4, "reps": 8, "percent": 75, "rpe_target": "6-7" },
              { "weeks": [2], "sets": 4, "reps": 8, "percent": 77, "rpe_target": "7" },
              { "weeks": [3], "sets": 4, "reps": 8, "percent": 79, "rpe_target": "7-8" },
              { "weeks": [4], "sets": 4, "reps": 8, "percent": 81, "rpe_target": "8" },
              { "weeks": [5], "sets": 3, "reps": 8, "percent": 65, "rpe_target": "4-5" },
              { "weeks": [6], "sets": 4, "reps": 5, "percent": 80, "rpe_target": "7" },
              { "weeks": [7], "sets": 4, "reps": 5, "percent": 83, "rpe_target": "7-8" },
              { "weeks": [8], "sets": 4, "reps": 5, "percent": 85, "rpe_target": "8" },
              { "weeks": [9], "sets": 4, "reps": 5, "percent": 87, "rpe_target": "8-9" },
              { "weeks": [10], "sets": 3, "reps": 5, "percent": 70, "rpe_target": "4-5" },
              { "weeks": [11], "sets": 3, "reps": 3, "percent": 90, "rpe_target": "8-9" }
            ]
          },
          {
            "exercise_id": "trap_bar_squat_to_box_jump",
            "category": "power",
            "default_weight": 225,
            "notes": "Hamstring bias: deeper hinge, hips back. Jump stays max-intent.",
            "targets": [
              { "weeks": [1, 2, 3, 4], "sets": 4, "reps": 1, "notes": "3 trap bar squats + 1 box jump per set" },
              { "weeks": [5], "sets": 3, "reps": 1, "notes": "3 trap bar squats + 1 box jump per set" },
              { "weeks": [6, 7, 8, 9], "sets": 4, "reps": 1, "notes": "3 trap bar squats + 1 box jump per set" },
              { "weeks": [10], "sets": 3, "reps": 1, "notes": "3 trap bar squats + 1 box jump per set" },
              { "weeks": [11], "sets": 4, "reps": 1, "notes": "3 trap bar squats + 1 box jump per set" }
            ]
          },
          {
            "exercise_id": "skierg_intervals",
            "category": "conditioning",
            "superset_group": "sunday-circuit",
            "targets": [
              { "weeks": [1, 2], "sets": 3, "values": { "distance": 250 }, "notes": "250m per round" },
              { "weeks": [3, 4], "sets": 4, "values": { "distance": 250 }, "notes": "250m per round" },
              { "weeks": [5], "sets": 2, "values": { "distance": 250 }, "notes": "250m per round" },
              { "weeks": [6, 7], "sets": 4, "values": { "distance": 250 }, "notes": "250m per round" },
              { "weeks": [8, 9], "sets": 5, "values": { "distance": 250 }, "notes": "250m per round" },
              { "weeks": [10], "sets": 3, "values": { "distance": 250 }, "notes": "250m per round" },
              { "weeks": [11], "sets": 6, "values": { "distance": 250 }, "notes": "250m per round" }
            ]
          },
          {
            "exercise_id": "farmers_carry",
            "category": "conditioning",
            "superset_group": "sunday-circuit",
            "default_weight": 88,
            "targets": [
              { "weeks": [1, 2], "sets": 3, "values": { "distance": 60 }, "notes": "60m per round, 88lb KBs" },
              { "weeks": [3, 4], "sets": 4, "values": { "distance": 60 }, "notes": "60m per round, 88lb KBs" },
              { "weeks": [5], "sets": 2, "values": { "distance": 60 }, "notes": "60m per round, 88lb KBs" },
              { "weeks": [6, 7], "sets": 4, "values": { "distance": 60 }, "notes": "60m per round, 88lb KBs" },
              { "weeks": [8, 9], "sets": 5, "values": { "distance": 60 }, "notes": "60m per round, 88lb KBs" },
              { "weeks": [10], "sets": 3, "values": { "distance": 60 }, "notes": "60m per round, 88lb KBs" },
              { "weeks": [11], "sets": 6, "values": { "distance": 60 }, "notes": "60m per round, 88lb KBs" }
            ]
          },
          {
            "exercise_id": "kb_swings_heavy",
            "category": "conditioning",
            "superset_group": "sunday-circuit",
            "default_weight": 88,
            "targets": [
              { "weeks": [1, 2], "sets": 3, "reps": 10, "notes": "88lb KB" },
              { "weeks": [3, 4], "sets": 4, "reps": 10, "notes": "88lb KB" },
              { "weeks": [5], "sets": 2, "reps": 10, "notes": "88lb KB" },
              { "weeks": [6, 7], "sets": 4, "reps": 10, "notes": "88lb KB" },
              { "weeks": [8, 9], "sets": 5, "reps": 10, "notes": "88lb KB" },
              { "weeks": [10], "sets": 3, "reps": 10, "notes": "88lb KB" },
              { "weeks": [11], "sets": 6, "reps": 10, "notes": "88lb KB" }
            ]
          },
          {
            "exercise_id": "sprints",
            "category": "conditioning",
            "superset_group": "sunday-circuit",
            "notes": "By feel: sprint when 100%, strides otherwise. Walk-back recovery.",
            "targets": [
              { "weeks": [1, 2], "sets": 3, "values": { "distance": 80 }, "notes": "80m per round" },
              { "weeks": [3, 4], "sets": 4, "values": { "distance": 80 }, "notes": "80m per round" },
              { "weeks": [5], "sets": 2, "values": { "distance": 80 }, "notes": "80m per round, strides only" },
              { "weeks": [6, 7], "sets": 4, "values": { "distance": 80 }, "notes": "80m per round" },
              { "weeks": [8, 9], "sets": 5, "values": { "distance": 80 }, "notes": "80m per round" },
              { "weeks": [10], "sets": 3, "values": { "distance": 80 }, "notes": "80m per round, strides only" },
              { "weeks": [11], "sets": 6, "values": { "distance": 80 }, "notes": "80m per round" }
            ]
          },
          {
            "exercise_id": "lying_leg_curl",
            "category": "accessory",
            "default_weight": 100,
            "targets": [
              { "weeks": [1, 2, 3, 4], "sets": 3, "reps": 15 },
              { "weeks": [5], "sets": 2, "reps": 15 },
              { "weeks": [6, 7, 8, 9], "sets": 3, "reps": 15 },
              { "weeks": [10], "sets": 2, "reps": 15 },
              { "weeks": [11], "sets": 3, "reps": 15 }
            ],
            "alternatives": ["nordic_curl"]
          },
          {
            "exercise_id": "core_circuit",
            "category": "core",
            "targets": [
              { "weeks": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], "sets": 3, "reps": 1, "notes": "2-3 exercises" }
            ]
          }
        ],
        "notes": "Quad-set: SkiErg 250m → Farmer's Carry 60m → KB Swings ×10 → Sprint 80m, minimal rest. The circuit IS the conditioning — no finisher."
      },

      "monday": {
        "name": "Upper Strength — Heavy Pull",
        "warmup": ["jump_rope", "abbreviated_ankle", "dynamic_warmup"],
        "exercises": [
          {
            "exercise_id": "weighted_pullup",
            "category": "accessory",
            "default_weight": 35,
            "targets": [
              { "weeks": [1, 2, 3, 4], "sets": 3, "reps": 8 },
              { "weeks": [5], "sets": 2, "reps": 8 },
              { "weeks": [6, 7, 8, 9], "sets": 3, "reps": 8 },
              { "weeks": [10], "sets": 2, "reps": 8 },
              { "weeks": [11], "sets": 3, "reps": 8 }
            ]
          },
          {
            "exercise_id": "incline_bench_bb",
            "category": "main",
            "targets": [
              { "weeks": [1], "sets": 4, "reps": 8, "percent": 75, "rpe_target": "6-7" },
              { "weeks": [2], "sets": 4, "reps": 8, "percent": 77, "rpe_target": "7" },
              { "weeks": [3], "sets": 4, "reps": 8, "percent": 79, "rpe_target": "7-8" },
              { "weeks": [4], "sets": 4, "reps": 8, "percent": 81, "rpe_target": "8" },
              { "weeks": [5], "sets": 3, "reps": 8, "percent": 65, "rpe_target": "4-5" },
              { "weeks": [6], "sets": 4, "reps": 5, "percent": 80, "rpe_target": "7" },
              { "weeks": [7], "sets": 4, "reps": 5, "percent": 83, "rpe_target": "7-8" },
              { "weeks": [8], "sets": 4, "reps": 5, "percent": 85, "rpe_target": "8" },
              { "weeks": [9], "sets": 4, "reps": 5, "percent": 87, "rpe_target": "8-9" },
              { "weeks": [10], "sets": 3, "reps": 5, "percent": 70, "rpe_target": "4-5" },
              { "weeks": [11], "sets": 3, "reps": 3, "percent": 90, "rpe_target": "8-9" }
            ],
            "notes": "1RM seeded at 265 (~85% of flat 315) — verify week 1: 75% ≈ 200×8 should feel RPE 6-7."
          },
          {
            "exercise_id": "barbell_row",
            "category": "main",
            "targets": [
              { "weeks": [1], "sets": 4, "reps": 8, "percent": 75, "rpe_target": "6-7" },
              { "weeks": [2], "sets": 4, "reps": 8, "percent": 77, "rpe_target": "7" },
              { "weeks": [3], "sets": 4, "reps": 8, "percent": 79, "rpe_target": "7-8" },
              { "weeks": [4], "sets": 4, "reps": 8, "percent": 81, "rpe_target": "8" },
              { "weeks": [5], "sets": 3, "reps": 8, "percent": 65, "rpe_target": "4-5" },
              { "weeks": [6], "sets": 4, "reps": 5, "percent": 80, "rpe_target": "7" },
              { "weeks": [7], "sets": 4, "reps": 5, "percent": 83, "rpe_target": "7-8" },
              { "weeks": [8], "sets": 4, "reps": 5, "percent": 85, "rpe_target": "8" },
              { "weeks": [9], "sets": 4, "reps": 5, "percent": 87, "rpe_target": "8-9" },
              { "weeks": [10], "sets": 3, "reps": 5, "percent": 70, "rpe_target": "4-5" },
              { "weeks": [11], "sets": 3, "reps": 3, "percent": 90, "rpe_target": "8-9" }
            ],
            "notes": "Form audit: lock the hinge."
          },
          {
            "exercise_id": "dips",
            "category": "accessory",
            "default_weight": 70,
            "notes": "Weighted. Slight forward lean, shoulder decides the ROM — don't bottom out.",
            "targets": [
              { "weeks": [1, 2, 3, 4], "sets": 3, "reps": 8 },
              { "weeks": [5], "sets": 2, "reps": 8 },
              { "weeks": [6, 7, 8, 9], "sets": 3, "reps": 8 },
              { "weeks": [10], "sets": 2, "reps": 8 },
              { "weeks": [11], "sets": 3, "reps": 8 }
            ]
          },
          {
            "exercise_id": "face_pulls",
            "category": "accessory",
            "default_weight": 40,
            "notes": "Rear-delt fix: lighter, slower, external-rotate hard at end range.",
            "targets": [
              { "weeks": [1, 2, 3, 4], "sets": 3, "reps": 15 },
              { "weeks": [5], "sets": 2, "reps": 15 },
              { "weeks": [6, 7, 8, 9], "sets": 3, "reps": 15 },
              { "weeks": [10], "sets": 2, "reps": 15 },
              { "weeks": [11], "sets": 3, "reps": 15 }
            ]
          },
          {
            "exercise_id": "tricep_pushdown",
            "category": "accessory",
            "default_weight": 60,
            "superset_group": "monday-tricep",
            "targets": [
              { "weeks": [1, 2, 3, 4], "sets": 3, "reps": 8 },
              { "weeks": [5], "sets": 2, "reps": 8 },
              { "weeks": [6, 7, 8, 9], "sets": 3, "reps": 8 },
              { "weeks": [10], "sets": 2, "reps": 8 },
              { "weeks": [11], "sets": 3, "reps": 8 }
            ]
          },
          {
            "exercise_id": "overhead_tricep_extension",
            "category": "accessory",
            "default_weight": 45,
            "superset_group": "monday-tricep",
            "targets": [
              { "weeks": [1, 2, 3, 4], "sets": 3, "reps": 8 },
              { "weeks": [5], "sets": 2, "reps": 8 },
              { "weeks": [6, 7, 8, 9], "sets": 3, "reps": 8 },
              { "weeks": [10], "sets": 2, "reps": 8 },
              { "weeks": [11], "sets": 3, "reps": 8 }
            ]
          },
          {
            "exercise_id": "core_circuit",
            "category": "core",
            "targets": [
              { "weeks": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], "sets": 3, "reps": 1, "notes": "2-3 exercises" }
            ]
          }
        ],
        "conditioning_finisher": "5-8 min: KB Swings, Row, or Assault Bike",
        "notes": "Heavy pulling day. Incline bench and barbell rows are the main lifts."
      },

      "tuesday": {
        "name": "Run + Hips",
        "warmup": ["jump_rope", "abbreviated_ankle"],
        "exercises": [
          {
            "exercise_id": "easy_run",
            "category": "conditioning",
            "targets": [
              { "weeks": [1, 2], "sets": 1, "values": { "duration": 900 }, "notes": "15 min easy" },
              { "weeks": [3], "sets": 1, "values": { "duration": 1080 }, "notes": "18 min easy" },
              { "weeks": [4], "sets": 1, "values": { "duration": 1200 }, "notes": "20 min easy" },
              { "weeks": [5], "sets": 1, "values": { "duration": 720 }, "notes": "12 min very easy" },
              { "weeks": [6], "sets": 1, "values": { "duration": 1200 }, "notes": "20 min easy" },
              { "weeks": [7], "sets": 1, "values": { "duration": 1320 }, "notes": "22 min easy" },
              { "weeks": [8], "sets": 1, "values": { "duration": 1320 }, "notes": "22 min + 3-4 pickups" },
              { "weeks": [9], "sets": 1, "values": { "duration": 1500 }, "notes": "25 min + 4-5 pickups" },
              { "weeks": [10], "sets": 1, "values": { "duration": 720 }, "notes": "12 min very easy" },
              { "weeks": [11], "sets": 1, "values": { "duration": 1500 }, "notes": "25 min + pickups" }
            ]
          },
          {
            "exercise_id": "copenhagen_plank",
            "category": "movement",
            "superset_group": "tuesday-hips",
            "notes": "Start knee-supported (short lever), earn the straight leg. Bench or box, padded.",
            "targets": [
              { "weeks": [1, 2, 3, 4], "sets": 3, "values": { "duration": 30 }, "notes": "20-30s per side" },
              { "weeks": [5], "sets": 2, "values": { "duration": 30 }, "notes": "20-30s per side" },
              { "weeks": [6, 7, 8, 9], "sets": 3, "values": { "duration": 30 }, "notes": "20-30s per side" },
              { "weeks": [10], "sets": 2, "values": { "duration": 30 }, "notes": "20-30s per side" },
              { "weeks": [11], "sets": 3, "values": { "duration": 30 }, "notes": "20-30s per side" }
            ]
          },
          {
            "exercise_id": "step_out_squat",
            "category": "movement",
            "superset_group": "tuesday-hips",
            "notes": "Light KB. Movement dose — opens the hips post-run. The loaded version lives on Friday as the Cossack.",
            "targets": [
              { "weeks": [1, 2, 3, 4], "sets": 3, "reps": 8, "notes": "per side" },
              { "weeks": [5], "sets": 2, "reps": 8, "notes": "per side" },
              { "weeks": [6, 7, 8, 9], "sets": 3, "reps": 8, "notes": "per side" },
              { "weeks": [10], "sets": 2, "reps": 8, "notes": "per side" },
              { "weeks": [11], "sets": 3, "reps": 8, "notes": "per side" }
            ]
          },
          {
            "exercise_id": "hip_ir_liftoff",
            "category": "movement",
            "notes": "Seated 90/90, lift the front foot via internal rotation, 2s pause. Progression: seated → foot on box → weighted.",
            "targets": [
              { "weeks": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], "sets": 2, "reps": 8, "notes": "per side, 2s pause at top" }
            ]
          },
          {
            "exercise_id": "hip_mobility_flow",
            "category": "movement",
            "notes": "Moved to close the session — mobility lands best on warm hips. Include 90/90 switches + extra left IR.",
            "targets": [
              { "weeks": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], "sets": 1, "values": { "duration": 390 }, "notes": "5-8 min" }
            ]
          }
        ],
        "run_progression": {
          "week_1": { "duration_min": 15, "type": "easy" },
          "week_2": { "duration_min": 15, "type": "easy" },
          "week_3": { "duration_min": 18, "type": "easy" },
          "week_4": { "duration_min": 20, "type": "easy" },
          "week_5": { "duration_min": 12, "type": "easy" },
          "week_6": { "duration_min": 20, "type": "easy" },
          "week_7": { "duration_min": 22, "type": "easy" },
          "week_8": { "duration_min": 22, "type": "easy_with_pickups", "pickups": 4 },
          "week_9": { "duration_min": 25, "type": "easy_with_pickups", "pickups": 5 },
          "week_10": { "duration_min": 12, "type": "easy" },
          "week_11": { "duration_min": 25, "type": "easy_with_pickups", "pickups": 5 }
        },
        "notes": "Trimmed warmup, run early, get it done — then the hip block. This is the hip day."
      },

      "wednesday": {
        "name": "Upper Power — Push/Explosive",
        "warmup": ["jump_rope", "abbreviated_ankle", "dynamic_warmup"],
        "exercises": [
          {
            "exercise_id": "snatch_grip_high_pull",
            "category": "power",
            "default_weight": 155,
            "notes": "Wide grip, elbows high — scap retraction finishes the pull. Straps optional. Goes first, nervous system freshest.",
            "targets": [
              { "weeks": [1, 2, 3, 4], "sets": 4, "reps": 4 },
              { "weeks": [5], "sets": 3, "reps": 4 },
              { "weeks": [6, 7, 8, 9], "sets": 4, "reps": 4 },
              { "weeks": [10], "sets": 3, "reps": 4 },
              { "weeks": [11], "sets": 4, "reps": 4 }
            ]
          },
          {
            "exercise_id": "overhead_press",
            "category": "main",
            "targets": [
              { "weeks": [1], "sets": 4, "reps": 8, "percent": 75, "rpe_target": "6-7" },
              { "weeks": [2], "sets": 4, "reps": 8, "percent": 77, "rpe_target": "7" },
              { "weeks": [3], "sets": 4, "reps": 8, "percent": 79, "rpe_target": "7-8" },
              { "weeks": [4], "sets": 4, "reps": 8, "percent": 81, "rpe_target": "8" },
              { "weeks": [5], "sets": 3, "reps": 8, "percent": 65, "rpe_target": "4-5" },
              { "weeks": [6], "sets": 4, "reps": 5, "percent": 80, "rpe_target": "7" },
              { "weeks": [7], "sets": 4, "reps": 5, "percent": 83, "rpe_target": "7-8" },
              { "weeks": [8], "sets": 4, "reps": 5, "percent": 85, "rpe_target": "8" },
              { "weeks": [9], "sets": 4, "reps": 5, "percent": 87, "rpe_target": "8-9" },
              { "weeks": [10], "sets": 3, "reps": 5, "percent": 70, "rpe_target": "4-5" },
              { "weeks": [11], "sets": 3, "reps": 3, "percent": 90, "rpe_target": "8-9" }
            ],
            "notes": "Shoulder still watch-listed — keep the shoulder mobility work running alongside."
          },
          {
            "exercise_id": "plyo_pushup",
            "category": "power",
            "superset_group": "wednesday-plyo-lat",
            "targets": [
              { "weeks": [1, 2, 3, 4], "sets": 4, "reps": 5 },
              { "weeks": [5], "sets": 2, "reps": 5 },
              { "weeks": [6, 7, 8, 9], "sets": 4, "reps": 5 },
              { "weeks": [10], "sets": 2, "reps": 5 },
              { "weeks": [11], "sets": 3, "reps": 5 }
            ]
          },
          {
            "exercise_id": "lat_pulldown",
            "category": "accessory",
            "default_weight": 125,
            "superset_group": "wednesday-plyo-lat",
            "targets": [
              { "weeks": [1, 2, 3, 4], "sets": 4, "reps": 8, "notes": "Hammer machine, 125 per side" },
              { "weeks": [5], "sets": 2, "reps": 8, "notes": "Hammer machine, 125 per side" },
              { "weeks": [6, 7, 8, 9], "sets": 4, "reps": 8, "notes": "Hammer machine, 125 per side" },
              { "weeks": [10], "sets": 2, "reps": 8, "notes": "Hammer machine, 125 per side" },
              { "weeks": [11], "sets": 3, "reps": 8, "notes": "Hammer machine, 125 per side" }
            ]
          },
          {
            "exercise_id": "hammer_row",
            "category": "accessory",
            "notes": "4th back movement. Chest-supported — zero lower-back cost.",
            "targets": [
              { "weeks": [1, 2, 3, 4], "sets": 3, "reps": 10, "notes": "per side" },
              { "weeks": [5], "sets": 2, "reps": 10, "notes": "per side" },
              { "weeks": [6, 7, 8, 9], "sets": 3, "reps": 10, "notes": "per side" },
              { "weeks": [10], "sets": 2, "reps": 10, "notes": "per side" },
              { "weeks": [11], "sets": 3, "reps": 10, "notes": "per side" }
            ]
          },
          {
            "exercise_id": "lateral_raises",
            "category": "accessory",
            "default_weight": 25,
            "targets": [
              { "weeks": [1, 2, 3, 4], "sets": 3, "reps": 10 },
              { "weeks": [5], "sets": 2, "reps": 10 },
              { "weeks": [6, 7, 8, 9], "sets": 3, "reps": 10 },
              { "weeks": [10], "sets": 2, "reps": 10 },
              { "weeks": [11], "sets": 3, "reps": 10 }
            ]
          },
          {
            "exercise_id": "farmers_carry",
            "category": "accessory",
            "default_weight": 88,
            "superset_group": "wednesday-carry-curl",
            "targets": [
              { "weeks": [1, 2, 3, 4], "sets": 3, "values": { "distance": 60 }, "notes": "60m, 88lb KBs" },
              { "weeks": [5], "sets": 2, "values": { "distance": 60 }, "notes": "60m, 88lb KBs" },
              { "weeks": [6, 7, 8, 9], "sets": 3, "values": { "distance": 60 }, "notes": "60m, 88lb KBs" },
              { "weeks": [10], "sets": 2, "values": { "distance": 60 }, "notes": "60m, 88lb KBs" },
              { "weeks": [11], "sets": 3, "values": { "distance": 60 }, "notes": "60m, 88lb KBs" }
            ]
          },
          {
            "exercise_id": "db_curls",
            "category": "accessory",
            "default_weight": 35,
            "superset_group": "wednesday-carry-curl",
            "targets": [
              { "weeks": [1, 2, 3, 4], "sets": 3, "reps": 12 },
              { "weeks": [5], "sets": 2, "reps": 12 },
              { "weeks": [6, 7, 8, 9], "sets": 3, "reps": 12 },
              { "weeks": [10], "sets": 2, "reps": 12 },
              { "weeks": [11], "sets": 3, "reps": 12 }
            ]
          },
          {
            "exercise_id": "core_circuit",
            "category": "core",
            "targets": [
              { "weeks": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], "sets": 3, "reps": 1, "notes": "2-3 exercises" }
            ]
          }
        ],
        "conditioning_finisher": "5-8 min: Jump Rope, Assault Bike, or Row",
        "notes": "Push and explosive dominant. The back owns the explosive slot now."
      },

      "thursday": {
        "name": "Lower Strength & Development",
        "warmup": ["jump_rope", "full_ankle", "dynamic_warmup"],
        "exercises": [
          {
            "exercise_id": "zercher_squat",
            "category": "main",
            "alternatives": ["front_squat"],
            "targets": [
              { "weeks": [1], "sets": 4, "reps": 8, "percent": 75, "rpe_target": "6-7" },
              { "weeks": [2], "sets": 4, "reps": 8, "percent": 77, "rpe_target": "7" },
              { "weeks": [3], "sets": 4, "reps": 8, "percent": 79, "rpe_target": "7-8" },
              { "weeks": [4], "sets": 4, "reps": 8, "percent": 81, "rpe_target": "8" },
              { "weeks": [5], "sets": 3, "reps": 8, "percent": 65, "rpe_target": "4-5" },
              { "weeks": [6], "sets": 4, "reps": 5, "percent": 80, "rpe_target": "7" },
              { "weeks": [7], "sets": 4, "reps": 5, "percent": 83, "rpe_target": "7-8" },
              { "weeks": [8], "sets": 4, "reps": 5, "percent": 85, "rpe_target": "8" },
              { "weeks": [9], "sets": 4, "reps": 5, "percent": 87, "rpe_target": "8-9" },
              { "weeks": [10], "sets": 3, "reps": 5, "percent": 70, "rpe_target": "4-5" },
              { "weeks": [11], "sets": 3, "reps": 3, "percent": 90, "rpe_target": "8-9" }
            ]
          },
          {
            "exercise_id": "hip_thrust",
            "category": "accessory",
            "default_weight": 225,
            "notes": "225 floor — the fix is execution: 2s squeeze, posterior tilt, stop shy of lumbar takeover.",
            "targets": [
              { "weeks": [1, 2, 3, 4], "sets": 3, "reps": 12 },
              { "weeks": [5], "sets": 2, "reps": 12 },
              { "weeks": [6, 7, 8, 9], "sets": 3, "reps": 12 },
              { "weeks": [10], "sets": 2, "reps": 12 },
              { "weeks": [11], "sets": 3, "reps": 12 }
            ]
          },
          {
            "exercise_id": "bulgarian_split_squat",
            "category": "accessory",
            "default_weight": 63,
            "notes": "Generic split-squat slot — variant under evaluation (BB step-back / BB Bulgarian / KB fix).",
            "targets": [
              { "weeks": [1, 2, 3, 4], "sets": 3, "reps": 8, "notes": "per side" },
              { "weeks": [5], "sets": 2, "reps": 8, "notes": "per side" },
              { "weeks": [6, 7, 8, 9], "sets": 3, "reps": 8, "notes": "per side" },
              { "weeks": [10], "sets": 2, "reps": 8, "notes": "per side" },
              { "weeks": [11], "sets": 3, "reps": 8, "notes": "per side" }
            ]
          },
          {
            "exercise_id": "romanian_deadlift",
            "category": "main",
            "targets": [
              { "weeks": [1], "sets": 4, "reps": 8, "percent": 75, "rpe_target": "6-7" },
              { "weeks": [2], "sets": 4, "reps": 8, "percent": 77, "rpe_target": "7" },
              { "weeks": [3], "sets": 4, "reps": 8, "percent": 79, "rpe_target": "7-8" },
              { "weeks": [4], "sets": 4, "reps": 8, "percent": 81, "rpe_target": "8" },
              { "weeks": [5], "sets": 3, "reps": 8, "percent": 65, "rpe_target": "4-5" },
              { "weeks": [6], "sets": 4, "reps": 5, "percent": 80, "rpe_target": "7" },
              { "weeks": [7], "sets": 4, "reps": 5, "percent": 83, "rpe_target": "7-8" },
              { "weeks": [8], "sets": 4, "reps": 5, "percent": 85, "rpe_target": "8" },
              { "weeks": [9], "sets": 4, "reps": 5, "percent": 87, "rpe_target": "8-9" },
              { "weeks": [10], "sets": 3, "reps": 5, "percent": 70, "rpe_target": "4-5" },
              { "weeks": [11], "sets": 3, "reps": 3, "percent": 90, "rpe_target": "8-9" }
            ]
          },
          {
            "exercise_id": "close_stance_smith_squat",
            "category": "accessory",
            "default_weight": 225,
            "notes": "Burnout. Hip activation work beside the machine while you're there.",
            "targets": [
              { "weeks": [1, 2, 3, 4], "sets": 3, "reps": 8, "notes": "Burnout set" },
              { "weeks": [5], "sets": 2, "reps": 8, "notes": "Burnout set" },
              { "weeks": [6, 7, 8, 9], "sets": 3, "reps": 8, "notes": "Burnout set" },
              { "weeks": [10], "sets": 2, "reps": 8, "notes": "Burnout set" },
              { "weeks": [11], "sets": 3, "reps": 8, "notes": "Burnout set" }
            ]
          },
          {
            "exercise_id": "standing_calf_raises",
            "category": "accessory",
            "notes": "Close stance, slow eccentric, pause at stretch. Finally actually programmed.",
            "targets": [
              { "weeks": [1, 2, 3, 4], "sets": 3, "reps": 12 },
              { "weeks": [5], "sets": 2, "reps": 12 },
              { "weeks": [6, 7, 8, 9], "sets": 3, "reps": 12 },
              { "weeks": [10], "sets": 2, "reps": 12 },
              { "weeks": [11], "sets": 3, "reps": 12 }
            ]
          }
        ],
        "conditioning_finisher": "Row",
        "notes": "96 hours from Sunday's heavy squats. Order locked: Zercher → thrust → split squat → RDL."
      },

      "friday": {
        "name": "Athletic Lower & Agility",
        "warmup": ["jump_rope", "full_ankle", "dynamic_warmup", "agility_drills"],
        "exercises": [
          {
            "exercise_id": "box_jump_lateral",
            "category": "power",
            "notes": "Start beside the box: single-foot jump up → lateral hop down to the other foot in front → jump up off that foot. Revert to standard box jumps if it doesn't feel right.",
            "targets": [
              { "weeks": [1, 2, 3, 4], "sets": 4, "reps": 3, "notes": "per side" },
              { "weeks": [5], "sets": 3, "reps": 2, "notes": "per side" },
              { "weeks": [6, 7, 8, 9], "sets": 4, "reps": 3, "notes": "per side" },
              { "weeks": [10], "sets": 3, "reps": 2, "notes": "per side" },
              { "weeks": [11], "sets": 4, "reps": 3, "notes": "per side" }
            ]
          },
          {
            "exercise_id": "landmine_explosive_row",
            "category": "power",
            "default_weight": 45,
            "superset_group": "friday-landmine",
            "targets": [
              { "weeks": [1, 2, 3, 4], "sets": 3, "reps": 12, "notes": "45 plate, one-arm row to press transition" },
              { "weeks": [5], "sets": 2, "reps": 12, "notes": "45 plate, one-arm row to press transition" },
              { "weeks": [6, 7, 8, 9], "sets": 3, "reps": 12, "notes": "45 plate, one-arm row to press transition" },
              { "weeks": [10], "sets": 2, "reps": 12, "notes": "45 plate, one-arm row to press transition" },
              { "weeks": [11], "sets": 3, "reps": 12, "notes": "45 plate, one-arm row to press transition" }
            ]
          },
          {
            "exercise_id": "landmine_rotation",
            "category": "core",
            "superset_group": "friday-landmine",
            "notes": "Provisional — same bar as the row. Bar at chest, sweep hip-to-hip, soft arms.",
            "targets": [
              { "weeks": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], "sets": 2, "reps": 8, "notes": "per side" }
            ]
          },
          {
            "exercise_id": "cossack_squat",
            "category": "movement",
            "default_weight": 50,
            "notes": "The strength one — stable base, progress the load past 50 into end-range adduction.",
            "targets": [
              { "weeks": [1, 2, 3, 4], "sets": 3, "reps": 8, "notes": "per side, 50lb DB/KB" },
              { "weeks": [5], "sets": 2, "reps": 8, "notes": "per side, 50lb DB/KB" },
              { "weeks": [6, 7, 8, 9], "sets": 3, "reps": 8, "notes": "per side, 50lb DB/KB" },
              { "weeks": [10], "sets": 2, "reps": 8, "notes": "per side, 50lb DB/KB" },
              { "weeks": [11], "sets": 3, "reps": 8, "notes": "per side, 50lb DB/KB" }
            ]
          },
          {
            "exercise_id": "hip_abduction",
            "category": "accessory",
            "default_weight": 120,
            "targets": [
              { "weeks": [1, 2, 3, 4], "sets": 3, "reps": 12 },
              { "weeks": [5], "sets": 2, "reps": 12 },
              { "weeks": [6, 7, 8, 9], "sets": 3, "reps": 12 },
              { "weeks": [10], "sets": 2, "reps": 12 },
              { "weeks": [11], "sets": 3, "reps": 12 }
            ]
          },
          {
            "exercise_id": "hip_adduction",
            "category": "accessory",
            "default_weight": 110,
            "targets": [
              { "weeks": [1, 2, 3, 4], "sets": 3, "reps": 12 },
              { "weeks": [5], "sets": 2, "reps": 12 },
              { "weeks": [6, 7, 8, 9], "sets": 3, "reps": 12 },
              { "weeks": [10], "sets": 2, "reps": 12 },
              { "weeks": [11], "sets": 3, "reps": 12 }
            ]
          },
          {
            "exercise_id": "pogo_hops",
            "category": "power",
            "targets": [
              { "weeks": [1, 2, 3, 4], "sets": 3, "reps": 15 },
              { "weeks": [5], "sets": 2, "reps": 15 },
              { "weeks": [6, 7, 8, 9], "sets": 3, "reps": 15 },
              { "weeks": [10], "sets": 2, "reps": 15 },
              { "weeks": [11], "sets": 3, "reps": 15 }
            ]
          }
        ],
        "notes": "Movement quality day, not heavy loading. Abduction/adduction are non-negotiable."
      }
    },

    "exercise_definitions": [
      { "id": "back_squat", "name": "Back Squat", "type": "main", "muscle_groups": ["quads", "glutes", "core"], "alternatives": ["front_squat", "zercher_squat"], "uses_1rm": true, "one_rm": 315 },
      { "id": "incline_bench_bb", "name": "Incline Bench Press", "type": "main", "muscle_groups": ["upper_chest", "shoulders", "triceps"], "uses_1rm": true, "one_rm": 265 },
      { "id": "overhead_press", "name": "Overhead Press", "type": "main", "muscle_groups": ["shoulders", "triceps", "core"], "uses_1rm": true, "one_rm": 180 },
      { "id": "zercher_squat", "name": "Zercher Squat", "type": "main", "muscle_groups": ["quads", "glutes", "core", "upper_back"], "alternatives": ["front_squat", "back_squat"], "uses_1rm": true, "one_rm": 225 },
      { "id": "romanian_deadlift", "name": "Romanian Deadlift", "type": "main", "muscle_groups": ["hamstrings", "glutes", "lower_back"], "uses_1rm": true, "one_rm": 205 },
      { "id": "barbell_row", "name": "Barbell Row", "type": "main", "muscle_groups": ["upper_back", "lats", "biceps"], "uses_1rm": true, "one_rm": 245 },

      { "id": "weighted_pullup", "name": "Weighted Pull-up", "type": "accessory", "muscle_groups": ["lats", "biceps", "upper_back"] },
      { "id": "dips", "name": "Dips", "type": "accessory", "muscle_groups": ["chest", "triceps", "shoulders"], "input_fields": [{ "type": "weight", "unit": "lbs" }, { "type": "reps" }] },
      { "id": "hammer_row", "name": "Hammer Row", "type": "accessory", "muscle_groups": ["upper_back", "lats", "biceps"], "notes": "Chest-supported machine row — track weight per side" },
      { "id": "face_pulls", "name": "Face Pulls", "type": "accessory", "muscle_groups": ["rear_delts", "upper_back"] },
      { "id": "db_curls", "name": "DB Curls", "type": "accessory", "muscle_groups": ["biceps"] },
      { "id": "lateral_raises", "name": "Lateral Raises", "type": "accessory", "muscle_groups": ["lateral_delts"] },
      { "id": "tricep_pushdown", "name": "Tricep Pushdown", "type": "accessory", "muscle_groups": ["triceps"] },
      { "id": "overhead_tricep_extension", "name": "Overhead Tricep Extension", "type": "accessory", "muscle_groups": ["triceps"] },
      { "id": "lat_pulldown", "name": "Lat Pulldown", "type": "accessory", "muscle_groups": ["lats", "upper_back", "biceps"], "notes": "Hammer machine, track weight per side" },
      { "id": "hip_thrust", "name": "Hip Thrust", "type": "accessory", "muscle_groups": ["glutes", "hamstrings"] },
      { "id": "close_stance_smith_squat", "name": "Close-Stance Smith Squat", "type": "accessory", "muscle_groups": ["quads"] },
      { "id": "bulgarian_split_squat", "name": "Bulgarian Split Squat", "type": "accessory", "muscle_groups": ["quads", "glutes"] },
      { "id": "standing_calf_raises", "name": "Standing Calf Raises", "type": "accessory", "muscle_groups": ["calves"] },
      { "id": "nordic_curl", "name": "Nordic Hamstring Curl", "type": "accessory", "muscle_groups": ["hamstrings"], "alternatives": ["lying_leg_curl"], "input_fields": [{ "type": "reps" }] },
      { "id": "lying_leg_curl", "name": "Lying Leg Curl", "type": "accessory", "muscle_groups": ["hamstrings"], "alternatives": ["nordic_curl"] },
      { "id": "hip_adduction", "name": "Hip Adduction", "type": "accessory", "muscle_groups": ["adductors"] },
      { "id": "hip_abduction", "name": "Hip Abduction", "type": "accessory", "muscle_groups": ["abductors", "glutes"] },

      { "id": "box_jump", "name": "Box Jump", "type": "power", "muscle_groups": ["quads", "glutes", "calves"], "alternatives": ["box_jump_lateral"], "input_fields": [{ "type": "reps" }] },
      { "id": "box_jump_lateral", "name": "One-Foot Lateral Box Jump", "type": "power", "muscle_groups": ["quads", "glutes", "calves"], "alternatives": ["box_jump"], "input_fields": [{ "type": "reps" }] },
      { "id": "plyo_pushup", "name": "Plyo Push-up", "type": "power", "muscle_groups": ["chest", "triceps"], "input_fields": [{ "type": "reps" }] },
      { "id": "pogo_hops", "name": "Pogo Hops", "type": "power", "muscle_groups": ["calves", "ankles"], "input_fields": [{ "type": "reps" }] },
      { "id": "landmine_explosive_row", "name": "Landmine Explosive Row", "type": "power", "muscle_groups": ["upper_back", "shoulders", "core", "glutes"], "notes": "T-bar attachment, one-arm explosive row to press transition" },
      { "id": "trap_bar_squat_to_box_jump", "name": "Trap Bar Squat to Box Jump", "type": "power", "muscle_groups": ["quads", "glutes", "calves", "core"], "notes": "Contrast set: 3 trap bar squats then 1 explosive box jump" },
      { "id": "snatch_grip_high_pull", "name": "Snatch-Grip High Pull", "type": "power", "muscle_groups": ["upper_back", "traps", "rear_delts", "glutes"], "notes": "Wide grip, elbows high and wide — scap retraction finishes the pull. Straps optional." },

      { "id": "copenhagen_plank", "name": "Copenhagen Plank", "type": "movement", "muscle_groups": ["adductors", "core"], "input_fields": [{ "type": "duration", "unit": "sec" }] },
      { "id": "step_out_squat", "name": "Step-Out Squat", "type": "movement", "muscle_groups": ["adductors", "abductors", "quads"], "input_fields": [{ "type": "reps" }], "notes": "Foot turned out, step out into a squat, alternate sides. Light KB." },
      { "id": "hip_ir_liftoff", "name": "90/90 Hip IR Lift-off", "type": "movement", "muscle_groups": ["hips"], "input_fields": [{ "type": "reps" }] },
      { "id": "cossack_squat", "name": "Cossack Squat", "type": "movement", "muscle_groups": ["quads", "adductors", "ankles"] },
      { "id": "hip_mobility_flow", "name": "Hip Mobility Flow", "type": "movement", "muscle_groups": ["hips"], "input_fields": [{ "type": "duration", "unit": "sec" }] },
      { "id": "agility_drills", "name": "Agility Drills", "type": "movement", "muscle_groups": ["ankles", "coordination"], "input_fields": [{ "type": "duration", "unit": "sec" }], "notes": "No equipment needed. Options: lateral shuffles, carioca/grapevine, quick feet in place, skater bounds, lateral hops over a line, 180-degree squat jumps, single-leg lateral hops" },

      { "id": "skierg_intervals", "name": "SkiErg Intervals", "type": "conditioning", "muscle_groups": ["full_body"], "input_fields": [{ "type": "distance", "unit": "m" }] },
      { "id": "farmers_carry", "name": "Farmer's Carry", "type": "conditioning", "muscle_groups": ["grip", "core", "traps"], "input_fields": [{ "type": "weight", "unit": "lbs" }, { "type": "distance", "unit": "m" }] },
      { "id": "kb_swings_heavy", "name": "KB Swings (Heavy)", "type": "conditioning", "muscle_groups": ["hamstrings", "glutes", "core"] },
      { "id": "sprints", "name": "Sprints", "type": "conditioning", "muscle_groups": ["hamstrings", "glutes"], "input_fields": [{ "type": "distance", "unit": "m" }] },
      { "id": "easy_run", "name": "Easy Run", "type": "conditioning", "muscle_groups": ["cardio", "legs"], "input_fields": [{ "type": "duration", "unit": "sec" }] },

      { "id": "landmine_rotation", "name": "Landmine Rotation", "type": "core", "muscle_groups": ["core"], "input_fields": [{ "type": "reps" }] },
      { "id": "core_circuit", "name": "Core Circuit", "type": "core", "muscle_groups": ["core"], "input_fields": [{ "type": "reps" }] }
    ],

    "warmup_protocols": {
      "jump_rope": {
        "name": "Jump Rope",
        "duration_min": 3,
        "steps": [
          { "name": "Jump Rope", "prescription": "3 min continuous", "notes": "Any style — single bounce, alternating, or mixed" }
        ]
      },
      "full_ankle": {
        "name": "Full Ankle Protocol",
        "duration_min": 10,
        "steps": [
          { "name": "Plantar Fascia Roll", "prescription": "30 sec/foot", "notes": "Lacrosse ball or golf ball on hard surface" },
          { "name": "Calf SMR", "prescription": "30 sec/side", "notes": "Foam roller or lacrosse ball" },
          { "name": "Banded Ankle Mobilization", "prescription": "2×10 reps/side", "notes": "Band anchored low, drive knee forward over toes" },
          { "name": "Short Foot Exercise (Doming)", "prescription": "3×8 sec holds", "notes": "Maintenance dose — the full foot program lives at home now" },
          { "name": "Toe Yoga", "prescription": "2×8 reps", "notes": "Big toe up/small toes down, then switch" },
          { "name": "Single-Leg Balance", "prescription": "2×20 sec/side", "notes": "Eyes open or closed by feel" },
          { "name": "Wall Ankle Mobilization (K2W)", "prescription": "2×10 reps/side", "notes": "Knee tracks over 2nd-3rd toe" },
          { "name": "Barefoot Cossack Squat", "prescription": "1×5/side", "notes": "Bodyweight only, full depth" }
        ]
      },
      "abbreviated_ankle": {
        "name": "Abbreviated Ankle Protocol",
        "duration_min": 5,
        "steps": [
          { "name": "Plantar Fascia Roll", "prescription": "30 sec/foot", "notes": "Quick pass" },
          { "name": "Short Foot Exercise (Standing)", "prescription": "2×8 sec holds", "notes": "Standing bilateral" },
          { "name": "Toe Yoga", "prescription": "1×8 reps", "notes": "Quick set" },
          { "name": "Wall Ankle Mobilization (3-way)", "prescription": "8 reps each direction/side", "notes": "Straight, inside, outside" },
          { "name": "Single-Leg Balance (Eyes Closed)", "prescription": "2×15 sec/side", "notes": "Challenge proprioception" }
        ]
      },
      "dynamic_warmup": {
        "name": "Dynamic Warmup",
        "duration_min": 5,
        "notes": "Session-specific movement prep. Pick 3-5 exercises based on the day's focus.",
        "steps": [
          { "name": "Leg Swings (Front-to-Back)", "prescription": "10/side", "notes": "Lower body days" },
          { "name": "Leg Swings (Lateral)", "prescription": "10/side", "notes": "Lower body days" },
          { "name": "Banded Hip Activation (Monster Walks)", "prescription": "10/direction", "notes": "Lower body days — glute activation" },
          { "name": "Banded Hip Activation (Clamshells)", "prescription": "10/side", "notes": "Lower body days — glute activation" },
          { "name": "Walking Lunges with Rotation", "prescription": "5/side", "notes": "Lower body days — hip mobility + activation" },
          { "name": "Band Pull-Aparts", "prescription": "15-20 reps", "notes": "Upper body days — shoulder warmup" },
          { "name": "Band Dislocates", "prescription": "10 reps", "notes": "Upper body days — shoulder mobility" },
          { "name": "Banded External Rotations", "prescription": "10/side", "notes": "Upper body days — rotator cuff" },
          { "name": "Scapular Push-ups", "prescription": "10 reps", "notes": "Upper body days — scapular activation" },
          { "name": "Arm Circles", "prescription": "10 forward + 10 backward", "notes": "Upper body days" }
        ]
      },
      "agility_drills": {
        "name": "Agility Drills",
        "duration_min": 7,
        "notes": "5-8 min of footwork and agility. No equipment needed. Pick 3-4 drills. Only fast-feet work all week — keep it.",
        "steps": [
          { "name": "Lateral Shuffles", "prescription": "5-10 yards, 4-6 reps", "notes": "Quick, low stance" },
          { "name": "Carioca / Grapevine", "prescription": "10 yards, 3-4 reps/direction", "notes": "Crossover steps, stay low" },
          { "name": "Quick Feet in Place", "prescription": "3×10-15 sec", "notes": "As fast as possible" },
          { "name": "Skater Bounds", "prescription": "3×8/side", "notes": "Lateral single-leg jumps, stick the landing" },
          { "name": "Single-Leg Lateral Hops", "prescription": "3×8/side", "notes": "Over a line on the floor" },
          { "name": "180-Degree Squat Jumps", "prescription": "3×6", "notes": "Land, immediately rotate and jump" },
          { "name": "Lateral Box Step-Overs", "prescription": "3×10", "notes": "Quick feet over and back, use a box or bench" }
        ]
      }
    }
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest __tests__/data/functional-athlete-pillars.test.ts`
Expected: PASS — all validation assertions green.

- [ ] **Step 6: Commit**

```bash
git add src/data/functional-athlete-pillars.json __tests__/data/functional-athlete-pillars.test.ts package.json
git commit -m "feat: add Functional Athlete — Pillars program definition"
```

---

### Task 4: Bundled program registry — refresh + auto-import both programs

**Files:**
- Create: `src/data/bundled-programs.ts`
- Modify: `app/_layout.tsx:16-18,33-36`
- Modify: `app/library.tsx:13-18,46-58`
- Modify: `src/utils/program.ts` (add `isBundledProgramImported` helper)
- Test: `__tests__/utils/program.test.ts` (append)

**Interfaces:**
- Consumes: `functional-athlete-pillars.json` (Task 3).
- Produces: `BUNDLED_PROGRAMS: ProgramDefinition[]` from `src/data/bundled-programs.ts`; `isBundledProgramImported(programs: Pick<Program, 'bundled_id' | 'name'>[], def: ProgramDefinition): boolean` from `src/utils/program.ts`.

- [ ] **Step 1: Write the failing test** — append to `__tests__/utils/program.test.ts` (add `isBundledProgramImported` to its existing import from `../../src/utils/program`):

```typescript
describe('isBundledProgramImported', () => {
  const def = {
    program: { id: 'functional-athlete-pillars', name: 'Functional Athlete — Pillars' },
  } as any;

  it('matches by bundled_id', () => {
    const programs = [{ bundled_id: 'functional-athlete-pillars', name: 'Renamed Later' }] as any[];
    expect(isBundledProgramImported(programs, def)).toBe(true);
  });

  it('falls back to name match for legacy rows without bundled_id', () => {
    const programs = [{ bundled_id: null, name: 'Functional Athlete — Pillars' }] as any[];
    expect(isBundledProgramImported(programs, def)).toBe(true);
  });

  it('returns false when neither matches', () => {
    const programs = [{ bundled_id: 'functional-athlete', name: 'Functional Athlete' }] as any[];
    expect(isBundledProgramImported(programs, def)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/utils/program.test.ts -t isBundledProgramImported`
Expected: FAIL — `isBundledProgramImported` is not exported.

- [ ] **Step 3: Implement the helper** — in `src/utils/program.ts`, add (near `buildProgramCatalog`; `Program` and `ProgramDefinition` types are already imported in that file):

```typescript
/** True if a bundled definition already has a row (by bundled_id, name fallback for legacy rows) */
export function isBundledProgramImported(
  programs: Pick<Program, 'bundled_id' | 'name'>[],
  def: ProgramDefinition
): boolean {
  const bundledId = def.program.id;
  const name = def.program.name;
  return programs.some(p => (bundledId && p.bundled_id === bundledId) || p.name === name);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/utils/program.test.ts`
Expected: PASS.

- [ ] **Step 5: Create the registry** — create `src/data/bundled-programs.ts`:

```typescript
/**
 * APEX — Bundled programs
 * Programs shipped with the app. Auto-imported on first library open and
 * refreshed (definition + exercises) on every launch for active/inactive rows.
 */

import type { ProgramDefinition } from '../types';
import FunctionalAthlete from './functional-athlete.json';
import FunctionalAthletePillars from './functional-athlete-pillars.json';

export const BUNDLED_PROGRAMS: ProgramDefinition[] = [
  FunctionalAthlete as unknown as ProgramDefinition,
  FunctionalAthletePillars as unknown as ProgramDefinition,
];
```

- [ ] **Step 6: Wire into `app/_layout.tsx`** — replace lines 16-18:

```typescript
import { getDatabase, refreshBundledProgram } from '../src/db';
import { BUNDLED_PROGRAMS } from '../src/data/bundled-programs';
```

(delete the `import type { ProgramDefinition }` and `import FA_V2` lines — the registry owns the casts). Then replace the refresh call (lines 34-36):

```typescript
        getDatabase().then(async () => {
          for (const def of BUNDLED_PROGRAMS) {
            await refreshBundledProgram(def);
          }
        }),
```

- [ ] **Step 7: Wire into `app/library.tsx`** — replace lines 17-18 (`// Bundled program` comment + `import FA_V2`) with:

```typescript
// Bundled programs — auto-imported on first library open
import { BUNDLED_PROGRAMS } from '../src/data/bundled-programs';
```

Add `isBundledProgramImported` to the existing import from `'../src/utils/program'` (line 14). Then replace the auto-import block in `loadData` (lines 46-58) with:

```typescript
    // Auto-import any bundled programs that don't exist yet (by bundled_id or name)
    const missing = BUNDLED_PROGRAMS.filter(def => !isBundledProgramImported(all, def));
    for (const def of missing) {
      await importProgram(def);
    }
    if (missing.length > 0) {
      const refreshed = await getAllPrograms();
      setPrograms(refreshed);
    }
```

(The `ProgramDefinition` type import at line 15 is still used by the catalog rendering — leave it.)

- [ ] **Step 8: Verify types and full suite**

Run: `npx tsc --noEmit && npm test`
Expected: clean. Also confirm no remaining references: `grep -rn "FA_V2" app/ src/` returns nothing.

- [ ] **Step 9: Commit**

```bash
git add src/data/bundled-programs.ts src/utils/program.ts app/_layout.tsx app/library.tsx __tests__/utils/program.test.ts
git commit -m "feat: bundled-program registry — ship Pillars alongside Functional Athlete"
```

---

### Task 5: Focus chips on program cards

**Files:**
- Modify: `src/types/program.ts:8-19` (add `focus`)
- Create: `src/components/FocusChips.tsx`
- Modify: `app/library.tsx` (chips under program name, after the header View closing line 108)
- Modify: `app/(tabs)/index.tsx:378` (chips under program name)
- Test: `__tests__/components/FocusChips.test.tsx` (new file)

**Interfaces:**
- Consumes: `def.program.focus` / `def.focus` from the definitions (Task 3 JSON).
- Produces: `FocusChips({ focus?: string[], style?: StyleProp<ViewStyle> })` component from `src/components/FocusChips.tsx`.

- [ ] **Step 1: Add the type** — in `src/types/program.ts`, inside the `program` object type (after line 12 `duration_weeks: number;`):

```typescript
    /** Optional goal tags rendered as chips on program cards (e.g. ["hips","core","back"]) */
    focus?: string[];
```

- [ ] **Step 2: Write the failing component test** — create `__tests__/components/FocusChips.test.tsx`:

```tsx
import { render } from '@testing-library/react-native';
import { FocusChips } from '../../src/components/FocusChips';

describe('FocusChips', () => {
  it('renders one uppercase chip per focus entry', () => {
    const { getByText } = render(<FocusChips focus={['hips', 'core', 'back']} />);
    expect(getByText('HIPS')).toBeTruthy();
    expect(getByText('CORE')).toBeTruthy();
    expect(getByText('BACK')).toBeTruthy();
  });

  it('renders nothing when focus is undefined', () => {
    const { toJSON } = render(<FocusChips />);
    expect(toJSON()).toBeNull();
  });

  it('renders nothing when focus is empty', () => {
    const { toJSON } = render(<FocusChips focus={[]} />);
    expect(toJSON()).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest __tests__/components/FocusChips.test.tsx`
Expected: FAIL — module does not exist.

- [ ] **Step 4: Implement the component** — create `src/components/FocusChips.tsx`:

```tsx
/**
 * APEX — Focus chips
 * Small goal tags shown under a program's name (from definition.program.focus).
 */

import { View, Text, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Colors, BorderRadius } from '../theme';

interface FocusChipsProps {
  focus?: string[];
  style?: StyleProp<ViewStyle>;
}

export function FocusChips({ focus, style }: FocusChipsProps) {
  if (!focus || focus.length === 0) return null;

  return (
    <View style={[styles.row, style]}>
      {focus.map(tag => (
        <View key={tag} style={styles.chip}>
          <Text style={styles.chipText}>{tag.toUpperCase()}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: Colors.indigoMuted,
    borderWidth: 1,
    borderColor: Colors.indigoBorderFaint,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  chipText: {
    color: Colors.indigoLight,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest __tests__/components/FocusChips.test.tsx`
Expected: PASS.

- [ ] **Step 6: Wire into the library card** — in `app/library.tsx`, import the component:

```typescript
import { FocusChips } from '../src/components/FocusChips';
```

Then after the `programHeader` View closes (line 108, before the `programDuration` Text at line 110), insert:

```tsx
              <FocusChips focus={def?.program.focus} style={styles.focusChips} />
```

And add to the `StyleSheet.create` block:

```typescript
  focusChips: {
    marginTop: Spacing.sm,
  },
```

- [ ] **Step 7: Wire into the home dashboard** — in `app/(tabs)/index.tsx`, import:

```typescript
import { FocusChips } from '../../src/components/FocusChips';
```

Then after the program name Text at line 378, insert:

```tsx
            <FocusChips focus={def.focus} style={styles.focusChips} />
```

(Here `def` is `definition.program`, so `focus` sits directly on it.) Add to the styles block near `programContext` (line 509):

```typescript
  focusChips: {
    marginTop: Spacing.sm,
  },
```

Confirm `Spacing` is already imported in both files (it is — both import from `../src/theme` / `../../src/theme`).

- [ ] **Step 8: Verify types and full suite**

Run: `npx tsc --noEmit && npm test`
Expected: clean.

- [ ] **Step 9: Commit**

```bash
git add src/types/program.ts src/components/FocusChips.tsx app/library.tsx "app/(tabs)/index.tsx" __tests__/components/FocusChips.test.tsx
git commit -m "feat: focus chips on program cards (home + library)"
```

---

### Task 6: Final verification

**Files:** none new — verification only.

- [ ] **Step 1: Full suite + types**

Run: `npx tsc --noEmit && npm test`
Expected: 0 type errors, all suites pass.

- [ ] **Step 2: Grep for leftovers**

Run: `grep -rn "FA_V2" app/ src/ && echo "LEFTOVERS FOUND" || echo "clean"`
Expected: `clean`.

Run: `grep -c "functional-athlete-pillars" src/data/bundled-programs.ts`
Expected: `1`.

- [ ] **Step 3: On-device smoke test (user runs this — coordinate, don't do it unprompted)**

`npm run device`, then verify: (1) library shows both programs, Pillars with HIPS/CORE/BACK chips; (2) old "Functional Athlete v2" card no longer appears as activatable; (3) opening a past Functional Athlete session shows its original block name; (4) activating Pillars (when Ben chooses to) starts week 1 with incline bench at ~200 lb.

- [ ] **Step 4: Commit anything outstanding, then stop**

Do NOT push or open a PR without explicit user approval (house rule).

---

## Deferred (explicitly NOT in this plan)

- D15 split squat variant (ships as Bulgarian split squat in the generic slot)
- Per-day core circuit menus; Copenhagen setup choice; incline 1RM verification (week 1, in the gym)
- Ben's final line-by-line D14 review of the JSON before activation — the Task 3 validation test is the machine-checkable half
- Program versioning system / in-app editor (non-goal per spec)
