# Program Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Detect when a training program finishes, celebrate it, show a program summary, and replace the broken "Week 12 of 11" header with a graceful completed-Home state — including a one-time backfill for the program already finished.

**Architecture:** Pure helpers in `src/utils/program.ts` decide completion; `src/db` gains a `completed_date`/`completion_seen` column pair (migration v14) plus mark/query functions and a `buildProgramSummary` data builder; `finishSession` flips the program to completed on the final training day and routes to a new `app/program-complete.tsx` screen (celebration → summary); Home renders a completed card when no program is active; a launch backfill catches the already-finished program.

**Tech Stack:** TypeScript (strict), expo-sqlite, expo-router, react-native-reanimated, expo-haptics, Jest + @testing-library/react-native.

**Spec:** `docs/superpowers/specs/2026-06-07-program-completion-design.md`
**Mockups (visual contract):** `docs/mockups/program-complete-{celebration,summary,home}-2026-06-07.html`

---

## File Structure

| File | Responsibility | Action |
|------|----------------|--------|
| `src/db/schema.ts` | `programs` columns + `SCHEMA_VERSION` | Modify |
| `src/db/database.ts` | v14 migration (ALTER TABLE) | Modify |
| `src/types/training.ts` | `Program.completed_date` / `completion_seen` | Modify |
| `src/utils/program.ts` | `getLastTrainingDay`, `isFinalTrainingSession`, `getCurrentWeek` clamp | Modify |
| `src/db/programs.ts` | `markProgramComplete`, `markCompletionSeen`, `getMostRecentCompletedProgram`, activate fix | Modify |
| `src/db/sessions.ts` | `getCompletedFinalDaySession` | Modify |
| `src/db/programSummary.ts` | `buildProgramSummary` (stats, gains, PRs, adherence) | Create |
| `src/hooks/useWorkoutSession.ts` | detect completion in `finishSession`, expose `programCompletedId` | Modify |
| `app/program-complete.tsx` | celebration → summary screen (route) | Create |
| `src/components/ProgramCompletionCelebration.tsx` | full-screen firework + trophy | Create |
| `src/components/ProgramSummaryView.tsx` | summary body (stats/gains/PRs) | Create |
| `src/components/CompletedProgramCard.tsx` | Home completed card | Create |
| `app/(tabs)/index.tsx` | render completed card + launch redirect | Modify |
| `app/(tabs)/workout.tsx` | route to celebration on final completion | Modify |
| `__tests__/utils/program.test.ts` | helper + clamp tests | Modify |
| `__tests__/db/programCompletion.test.ts` | mark/query/summary tests | Create |

**Conventions to follow:** dates via `getLocalDateString()` (`src/utils/date`); DB access via `getDatabase()`; tokens via `Colors`/`Spacing`/`FontSize`/`BorderRadius` from `src/theme` (use `Colors.amber` as the gold/achievement accent and `Colors.green` for positive deltas — do not hardcode hex); haptics via `expo-haptics`; animation via `react-native-reanimated` (see `src/components/SplashScreen.tsx`).

---

## Phase 1 — Data model & migration

### Task 1: Add `completed_date` + `completion_seen` columns

**Files:**
- Modify: `src/db/schema.ts:6` (SCHEMA_VERSION), `src/db/schema.ts:10-22` (programs table)
- Modify: `src/db/database.ts` (migration block, before the `if (currentVersion < SCHEMA_VERSION)` update at line ~219)
- Modify: `src/types/training.ts:6-15` (Program interface)

- [ ] **Step 1: Bump schema version**

In `src/db/schema.ts` line 6:

```typescript
export const SCHEMA_VERSION = 14;
```

- [ ] **Step 2: Add columns to the CREATE TABLE (for fresh installs)**

In `src/db/schema.ts`, the `programs` table (after `updated_at TEXT` on line 21, before the closing `);`):

```sql
  updated_at TEXT,
  completed_date TEXT,
  completion_seen INTEGER NOT NULL DEFAULT 0
```

- [ ] **Step 3: Add the v14 migration (for existing installs)**

In `src/db/database.ts`, immediately before the `// Safety net:` comment (~line 211), add:

```typescript
    if (currentVersion < 14) {
      try {
        await db.execAsync('ALTER TABLE programs ADD COLUMN completed_date TEXT');
      } catch { /* already exists */ }
      try {
        await db.execAsync('ALTER TABLE programs ADD COLUMN completion_seen INTEGER NOT NULL DEFAULT 0');
      } catch { /* already exists */ }
    }
```

- [ ] **Step 4: Extend the Program type**

In `src/types/training.ts`, add to the `Program` interface (after `bundled_id?: string;`):

```typescript
  completed_date?: string;
  completion_seen?: number;
```

- [ ] **Step 5: Verify existing DB tests still pass**

Run: `npm test -- __tests__/db`
Expected: PASS (no regressions; columns are additive).

- [ ] **Step 6: Commit**

```bash
git add src/db/schema.ts src/db/database.ts src/types/training.ts
git commit -m "feat(#62): add completed_date + completion_seen to programs (schema v14)"
```

---

## Phase 2 — Completion-detection helpers (pure, TDD)

### Task 2: `getLastTrainingDay` + `isFinalTrainingSession`

**Files:**
- Modify: `src/utils/program.ts` (add after `getTrainingDays`, ~line 41)
- Test: `__tests__/utils/program.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `__tests__/utils/program.test.ts` (import the new fns at the top alongside existing imports: `getLastTrainingDay, isFinalTrainingSession`). Use a minimal definition factory:

```typescript
import { getLastTrainingDay, isFinalTrainingSession } from '../../src/utils/program';
import type { ProgramDefinition } from '../../src/types';

function makeDef(durationWeeks = 11): ProgramDefinition {
  const day = (name: string) => ({ name, warmup: [], exercises: [] });
  return {
    program: {
      name: 'Test', duration_weeks: durationWeeks, created: '2026-01-01',
      blocks: [], exercise_definitions: [], warmup_protocols: {},
      weekly_template: {
        sunday: { type: 'rest' },
        monday: day('A'), tuesday: { type: 'rest' }, wednesday: day('B'),
        thursday: { type: 'rest' }, friday: day('C'),
        saturday: { type: 'rest' },
      },
    },
  } as ProgramDefinition;
}

describe('getLastTrainingDay', () => {
  it('returns the last non-rest day in week order, trimming trailing rest days', () => {
    expect(getLastTrainingDay(makeDef())).toBe('friday');
  });
});

describe('isFinalTrainingSession', () => {
  it('is true on the last training day of the final week', () => {
    expect(isFinalTrainingSession(makeDef(11), 11, 'friday')).toBe(true);
  });
  it('is true when week_number exceeds duration (legacy max-12 clamp)', () => {
    expect(isFinalTrainingSession(makeDef(11), 12, 'friday')).toBe(true);
  });
  it('is false on an earlier training day of the final week', () => {
    expect(isFinalTrainingSession(makeDef(11), 11, 'wednesday')).toBe(false);
  });
  it('is false before the final week', () => {
    expect(isFinalTrainingSession(makeDef(11), 10, 'friday')).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- __tests__/utils/program.test.ts -t "getLastTrainingDay|isFinalTrainingSession"`
Expected: FAIL ("getLastTrainingDay is not a function").

- [ ] **Step 3: Implement the helpers**

In `src/utils/program.ts`, after `getTrainingDays` (line 41):

```typescript
/** The last non-rest training day of the week (rest days trimmed). null if none. */
export function getLastTrainingDay(definition: ProgramDefinition): string | null {
  const days = getTrainingDays(definition.program.weekly_template);
  return days.length ? days[days.length - 1].day : null;
}

/**
 * Whether a just-completed session is the program's final scheduled workout:
 * the last training day of the final week. Uses `>=` so legacy rows created
 * under the old max-12 week clamp (and behind-schedule users) still match.
 */
export function isFinalTrainingSession(
  definition: ProgramDefinition,
  weekNumber: number,
  scheduledDay: string
): boolean {
  const lastDay = getLastTrainingDay(definition);
  if (!lastDay) return false;
  return weekNumber >= definition.program.duration_weeks && scheduledDay === lastDay;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- __tests__/utils/program.test.ts -t "getLastTrainingDay|isFinalTrainingSession"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/program.ts __tests__/utils/program.test.ts
git commit -m "feat(#62): add isFinalTrainingSession completion-detection helper"
```

---

## Phase 3 — Week clamp fix (TDD)

### Task 3: Clamp `getCurrentWeek` to `duration_weeks`

**Files:**
- Modify: `src/utils/program.ts:76-82`
- Modify: `src/hooks/useWorkoutSession.ts:401`, `app/(tabs)/index.tsx:69` (call sites)
- Test: `__tests__/utils/program.test.ts:148-173`

- [ ] **Step 1: Update the failing tests**

Replace the `getCurrentWeek` describe block in `__tests__/utils/program.test.ts` (lines 150-173) with:

```typescript
describe('getCurrentWeek', () => {
  it('returns 1 for today activation', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(getCurrentWeek(today, 11)).toBe(1);
  });
  it('returns 2 for 8 days ago', () => {
    const d = new Date(); d.setDate(d.getDate() - 8);
    expect(getCurrentWeek(d.toISOString().split('T')[0], 11)).toBe(2);
  });
  it('clamps to minimum of 1', () => {
    const future = new Date(); future.setDate(future.getDate() + 7);
    expect(getCurrentWeek(future.toISOString().split('T')[0], 11)).toBe(1);
  });
  it('clamps to the program duration (no overflow past the final week)', () => {
    const old = new Date(); old.setDate(old.getDate() - 365);
    expect(getCurrentWeek(old.toISOString().split('T')[0], 11)).toBe(11);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- __tests__/utils/program.test.ts -t "getCurrentWeek"`
Expected: FAIL (current signature ignores the 2nd arg; "clamps to duration" returns 12).

- [ ] **Step 3: Implement the clamp**

Replace `getCurrentWeek` in `src/utils/program.ts` (lines 75-82):

```typescript
/** Current week number from activation date, clamped to the program's length. */
export function getCurrentWeek(activatedDate: string, durationWeeks: number): number {
  const start = new Date(activatedDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(durationWeeks, diffWeeks + 1));
}
```

- [ ] **Step 4: Update call sites**

`src/hooks/useWorkoutSession.ts` line 401:

```typescript
      const week = getCurrentWeek(active.activated_date, active.definition.program.duration_weeks);
```

`app/(tabs)/index.tsx` line 69 (currently `getCurrentWeek(active.activated_date)`):

```typescript
  const currentWeek = getCurrentWeek(active.activated_date, def.duration_weeks);
```

> Verify there are no other call sites: `grep -rn "getCurrentWeek(" app src` — update any to pass `durationWeeks`.

- [ ] **Step 5: Run tests + typecheck**

Run: `npm test -- __tests__/utils/program.test.ts -t "getCurrentWeek"` → PASS
Run: `npx tsc --noEmit` → no new errors about `getCurrentWeek` arity.

- [ ] **Step 6: Commit**

```bash
git add src/utils/program.ts __tests__/utils/program.test.ts src/hooks/useWorkoutSession.ts "app/(tabs)/index.tsx"
git commit -m "fix(#62): clamp current week to program duration (kills Week 12 of 11)"
```

---

## Phase 4 — DB: mark complete + queries (TDD)

### Task 4: `markProgramComplete`, `markCompletionSeen`, `getMostRecentCompletedProgram`, `getCompletedFinalDaySession`

**Files:**
- Modify: `src/db/programs.ts`, `src/db/sessions.ts`
- Test: `__tests__/db/programCompletion.test.ts` (create)

- [ ] **Step 1: Write failing tests**

Create `__tests__/db/programCompletion.test.ts`. Follow the existing `__tests__/db` setup pattern (open the test DB, run `CREATE_TABLES`). Inspect `__tests__/db/sessions.test.ts` for the exact `beforeEach`/`getDatabase` harness this repo uses and mirror it.

```typescript
import { getDatabase } from '../../src/db/database';
import { markProgramComplete, markCompletionSeen, getMostRecentCompletedProgram } from '../../src/db/programs';
import { getCompletedFinalDaySession } from '../../src/db/sessions';
import { getLocalDateString } from '../../src/utils/date';

// (Reuse this file's standard test-DB reset helper — see __tests__/db/sessions.test.ts)

async function seedProgram(id: string, status = 'active') {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO programs (id, name, duration_weeks, created_date, status, definition_json, updated_at)
     VALUES (?, ?, 11, '2026-01-01', ?, '{}', datetime('now'))`,
    [id, `Prog ${id}`, status]
  );
}
async function seedSession(id: string, programId: string, week: number, day: string, completed = true) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO sessions (id, program_id, week_number, block_name, day_template_id, scheduled_day, actual_day, date, started_at, completed_at, updated_at)
     VALUES (?, ?, ?, 'B', ?, ?, ?, '2026-03-01', '2026-03-01T10:00:00Z', ?, datetime('now'))`,
    [id, programId, week, day, day, day, completed ? '2026-03-01T11:00:00Z' : null]
  );
}

describe('program completion DB', () => {
  it('markProgramComplete flips status + stamps date, completion_seen=0', async () => {
    await seedProgram('p1');
    await markProgramComplete('p1');
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>("SELECT * FROM programs WHERE id='p1'");
    expect(row.status).toBe('completed');
    expect(row.completed_date).toBe(getLocalDateString());
    expect(row.completion_seen).toBe(0);
  });

  it('markCompletionSeen sets completion_seen=1', async () => {
    await seedProgram('p1'); await markProgramComplete('p1');
    await markCompletionSeen('p1');
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>("SELECT completion_seen FROM programs WHERE id='p1'");
    expect(row.completion_seen).toBe(1);
  });

  it('getMostRecentCompletedProgram returns newest completed', async () => {
    await seedProgram('p1'); await markProgramComplete('p1');
    const prog = await getMostRecentCompletedProgram();
    expect(prog?.id).toBe('p1');
  });

  it('getCompletedFinalDaySession finds a logged final-week last-day session (>= duration)', async () => {
    await seedProgram('p1');
    await seedSession('s1', 'p1', 12, 'friday'); // legacy clamp week 12
    const s = await getCompletedFinalDaySession('p1', 'friday', 11);
    expect(s?.id).toBe('s1');
  });

  it('getCompletedFinalDaySession returns null when final day not logged', async () => {
    await seedProgram('p1');
    await seedSession('s1', 'p1', 11, 'wednesday');
    const s = await getCompletedFinalDaySession('p1', 'friday', 11);
    expect(s).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- __tests__/db/programCompletion.test.ts`
Expected: FAIL ("markProgramComplete is not a function").

- [ ] **Step 3: Implement the program functions**

In `src/db/programs.ts`, add (and ensure `getLocalDateString` is already imported — it is):

```typescript
/** Mark a program complete (training finished). Celebration not yet shown. */
export async function markProgramComplete(programId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE programs SET status = 'completed', completed_date = ?, completion_seen = 0, updated_at = datetime('now')
     WHERE id = ?`,
    [getLocalDateString(), programId]
  );
}

/** Mark the completion celebration as shown (fires once). */
export async function markCompletionSeen(programId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE programs SET completion_seen = 1, updated_at = datetime('now') WHERE id = ?",
    [programId]
  );
}

/** Most recently completed program (for the Home completed card). */
export async function getMostRecentCompletedProgram(): Promise<(Program & { definition: ProgramDefinition }) | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Program>(
    `SELECT * FROM programs WHERE status = 'completed'
     ORDER BY completed_date DESC, updated_at DESC LIMIT 1`
  );
  if (!row) return null;
  return { ...row, definition: JSON.parse(row.definition_json) as ProgramDefinition };
}
```

- [ ] **Step 4: Fix `activateProgram` to not falsely celebrate a superseded program**

In `src/db/programs.ts`, replace the deactivation line in `activateProgram` (line 118-120):

```typescript
  // Deactivate any currently active program (mark complete, already "seen" — no celebration)
  await db.runAsync(
    `UPDATE programs SET status = 'completed', completion_seen = 1,
       completed_date = COALESCE(completed_date, ?), updated_at = datetime('now')
     WHERE status = 'active'`,
    [getLocalDateString()]
  );
```

- [ ] **Step 5: Implement the session query**

In `src/db/sessions.ts`, add after `getCompletedSessionForDay` (~line 274):

```typescript
/** Completed session for the program's final-week last training day (week_number >= duration). */
export async function getCompletedFinalDaySession(
  programId: string,
  lastTrainingDay: string,
  durationWeeks: number
): Promise<Session | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Session>(
    `SELECT * FROM sessions
     WHERE program_id = ? AND scheduled_day = ? AND week_number >= ?
       AND completed_at IS NOT NULL
     ORDER BY week_number DESC, date DESC LIMIT 1`,
    [programId, lastTrainingDay, durationWeeks]
  );
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test -- __tests__/db/programCompletion.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/db/programs.ts src/db/sessions.ts __tests__/db/programCompletion.test.ts
git commit -m "feat(#62): program completion DB writes + queries"
```

---

## Phase 5 — Program summary data builder (TDD)

### Task 5: `buildProgramSummary`

**Files:**
- Create: `src/db/programSummary.ts`
- Test: `__tests__/db/programCompletion.test.ts` (extend)

The summary needs: date range, sessions completed, adherence %, main-lift e1RM gains, and named PRs.

- [ ] **Step 1: Write the failing test**

Append to `__tests__/db/programCompletion.test.ts`. Seed a program whose `definition_json` has one `main` lift with e1RM data across two non-deload weeks, then assert the gain. (Mirror the seed helpers above; set `definition_json` to a real JSON string with `duration_weeks`, `weekly_template` with two training days, one `category:'main'` exercise, and `blocks` naming a non-deload block.)

```typescript
import { buildProgramSummary } from '../../src/db/programSummary';

it('buildProgramSummary computes adherence, main-lift gains, and PRs', async () => {
  // seedProgramWithMainLift(...) -> inserts program (definition_json), 2 completed
  // sessions in weeks 1 and 2 with back_squat sets 200x5 then 230x5, and an
  // e1rm personal_record row. See helper below.
  const programId = await seedProgramWithMainLift();
  const summary = await buildProgramSummary(programId);

  expect(summary.programName).toBe('Functional Athlete');
  expect(summary.sessionsCompleted).toBe(2);
  expect(summary.adherencePct).toBeGreaterThan(0);
  const squat = summary.gains.find(g => g.exerciseId === 'back_squat');
  expect(squat).toBeTruthy();
  expect(squat!.endE1rm).toBeGreaterThan(squat!.startE1rm); // 230x5 > 200x5
  expect(summary.prs.length).toBeGreaterThanOrEqual(1);
});
```

Add a `seedProgramWithMainLift()` helper in the test that inserts: the program with `definition_json` = JSON containing `program.duration_weeks: 11`, `program.weekly_template` with two training days (`monday`,`wednesday`) each a `DayTemplate`, `program.exercise_definitions: [{id:'back_squat', name:'Back Squat', type:'main'}]`, `program.blocks: [{name:'Hypertrophy', weeks:[1,2], main_lift_scheme:{}}]`, and one exercise slot with `category:'main'`; the `exercises` row for `back_squat` (input_fields null → weight+reps); two completed sessions (weeks 1, 2); set_logs `200x5` (wk1) and `230x5` (wk2); and a `personal_records` e1rm row for back_squat.

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- __tests__/db/programCompletion.test.ts -t "buildProgramSummary"`
Expected: FAIL ("Cannot find module '../../src/db/programSummary'").

- [ ] **Step 3: Implement `buildProgramSummary`**

Create `src/db/programSummary.ts`:

```typescript
/**
 * APEX — Program completion summary builder.
 * Aggregates the data shown on the celebration → summary → Home completed card.
 */
import { getDatabase } from './database';
import { get1RMHistoryWithBlocks } from './metrics';
import { getDeltaExcludingDeload } from '../utils/deltaCalculation';
import { getTrainingDays } from '../utils/program';
import type { Program, ProgramDefinition } from '../types';

export interface LiftGain {
  exerciseId: string;
  name: string;
  startE1rm: number;
  endE1rm: number;
  deltaLb: number;       // excludes deload weeks
  deltaPct: number;
}

export interface SummaryPR {
  exerciseId: string;
  name: string;
  recordType: string;
  value: number;        // e1RM or weight
  repCount: number | null;
  weekNumber: number | null;
  date: string;
}

export interface ProgramSummary {
  programId: string;
  programName: string;
  startDate: string | null;     // activated_date
  endDate: string | null;       // completed_date
  weeks: number;
  sessionsCompleted: number;
  sessionsPlanned: number;
  adherencePct: number;
  gains: LiftGain[];            // main lifts only
  prs: SummaryPR[];
}

export async function buildProgramSummary(programId: string): Promise<ProgramSummary> {
  const db = await getDatabase();
  const prog = await db.getFirstAsync<Program>('SELECT * FROM programs WHERE id = ?', [programId]);
  if (!prog) throw new Error(`Program ${programId} not found`);
  const def = JSON.parse(prog.definition_json) as ProgramDefinition;
  const trainingDaysPerWeek = getTrainingDays(def.program.weekly_template).length;

  // Sessions completed + adherence
  const sessionRow = await db.getFirstAsync<{ n: number }>(
    "SELECT COUNT(*) as n FROM sessions WHERE program_id = ? AND completed_at IS NOT NULL",
    [programId]
  );
  const sessionsCompleted = sessionRow?.n ?? 0;
  const sessionsPlanned = def.program.duration_weeks * trainingDaysPerWeek;
  const adherencePct = sessionsPlanned > 0
    ? Math.round((sessionsCompleted / sessionsPlanned) * 100)
    : 0;

  // Main-lift e1RM gains (category 'main', e1RM-trackable, >=2 non-deload points)
  const mainSlots = new Map<string, string>(); // exerciseId -> name
  for (const day of getTrainingDays(def.program.weekly_template)) {
    for (const slot of day.template.exercises) {
      if (slot.category === 'main') {
        const exDef = def.program.exercise_definitions.find(e => e.id === slot.exercise_id);
        mainSlots.set(slot.exercise_id, exDef?.name ?? slot.exercise_id);
      }
    }
  }
  const gains: LiftGain[] = [];
  for (const [exerciseId, name] of mainSlots) {
    const history = await get1RMHistoryWithBlocks(exerciseId, { programId, limit: 100 });
    const nonDeload = history.filter(h => !/deload/i.test(h.blockName));
    if (nonDeload.length < 2) continue;
    const startE1rm = Math.round(nonDeload[0].e1rm);
    const endE1rm = Math.round(nonDeload[nonDeload.length - 1].e1rm);
    const deltaLb = getDeltaExcludingDeload(history) ?? 0;
    gains.push({
      exerciseId, name, startE1rm, endE1rm,
      deltaLb: Math.round(deltaLb),
      deltaPct: startE1rm > 0 ? Math.round((deltaLb / startE1rm) * 100) : 0,
    });
  }
  gains.sort((a, b) => b.deltaLb - a.deltaLb);

  // PRs set during this program (join through the program's sessions)
  const prRows = await db.getAllAsync<{
    exercise_id: string; name: string; record_type: string;
    value: number; rep_count: number | null; week_number: number; date: string;
  }>(
    `SELECT pr.exercise_id, e.name as name, pr.record_type, pr.value, pr.rep_count,
            s.week_number, pr.date
     FROM personal_records pr
     JOIN sessions s ON s.id = pr.session_id
     LEFT JOIN exercises e ON e.id = pr.exercise_id
     WHERE s.program_id = ? AND pr.record_type = 'e1rm'
     ORDER BY pr.value DESC`,
    [programId]
  );
  const prs: SummaryPR[] = prRows.map(r => ({
    exerciseId: r.exercise_id,
    name: r.name ?? r.exercise_id,
    recordType: r.record_type,
    value: Math.round(r.value),
    repCount: r.rep_count,
    weekNumber: r.week_number,
    date: r.date,
  }));

  return {
    programId,
    programName: prog.name,
    startDate: prog.activated_date ?? null,
    endDate: prog.completed_date ?? null,
    weeks: def.program.duration_weeks,
    sessionsCompleted,
    sessionsPlanned,
    adherencePct,
    gains,
    prs,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- __tests__/db/programCompletion.test.ts -t "buildProgramSummary"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/db/programSummary.ts __tests__/db/programCompletion.test.ts
git commit -m "feat(#62): buildProgramSummary (adherence, main-lift gains, PRs)"
```

---

## Phase 6 — Detect completion in `finishSession`

### Task 6: Flip program to completed on the final training day

**Files:**
- Modify: `src/hooks/useWorkoutSession.ts` (`finishSession` ~1013; add state + return)
- Modify: `app/(tabs)/workout.tsx` (route to celebration)

- [ ] **Step 1: Add completion state to the hook**

In `useWorkoutSession.ts`, near the other `useState` declarations (~line 79), add:

```typescript
  const [programCompletedId, setProgramCompletedId] = useState<string | null>(null);
```

Import the helpers/db fns at the top (extend existing imports):

```typescript
import { isFinalTrainingSession } from '../utils/program';
import { markProgramComplete } from '../db/programs';
import { getSessionById } from '../db/sessions';
```

- [ ] **Step 2: Detect after completing the session**

In `finishSession` (after `await completeSession(sessionId);`, line 1015, before PR detection):

```typescript
    // Program completion: is this the final scheduled training day?
    if (program) {
      const session = await getSessionById(sessionId);
      if (session && isFinalTrainingSession(program.definition, session.week_number, session.scheduled_day)) {
        await markProgramComplete(program.id);
        setProgramCompletedId(program.id);
      }
    }
```

- [ ] **Step 3: Expose it from the hook**

In the hook's return object (~line 1128), add:

```typescript
    programCompletedId,
    clearProgramCompleted: () => setProgramCompletedId(null),
```

- [ ] **Step 4: Route to the celebration from the workout screen**

In `app/(tabs)/workout.tsx`, read `programCompletedId` from the hook and add an effect (place near other effects; ensure `router` from `expo-router` and `useEffect` are imported):

```typescript
  useEffect(() => {
    if (programCompletedId) {
      const id = programCompletedId;
      clearProgramCompleted();
      router.push(`/program-complete?programId=${id}&celebrate=1`);
    }
  }, [programCompletedId]);
```

- [ ] **Step 5: Typecheck + existing hook/finish tests**

Run: `npx tsc --noEmit` → no new errors.
Run: `npm test -- __tests__/hooks` (if present) → PASS (no regression).

> The decision logic is already unit-tested via `isFinalTrainingSession` (Task 2). This task is wiring; it is verified end-to-end in Phase 10.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useWorkoutSession.ts "app/(tabs)/workout.tsx"
git commit -m "feat(#62): detect program completion on final session, route to celebration"
```

---

## Phase 7 — Celebration component (UI)

### Task 7: `ProgramCompletionCelebration`

**Visual contract:** `docs/mockups/program-complete-celebration-2026-06-07.html` (firework burst + flash + shockwave behind a trophy core that stamps in; "Program Complete" / program name / `N weeks · M sessions · K PRs`; success haptic; tap to continue).

**Files:**
- Create: `src/components/ProgramCompletionCelebration.tsx`
- Test: `__tests__/components/ProgramCompletionCelebration.test.tsx`

- [ ] **Step 1: Write a render test**

Create `__tests__/components/ProgramCompletionCelebration.test.tsx`:

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProgramCompletionCelebration } from '../../src/components/ProgramCompletionCelebration';

describe('ProgramCompletionCelebration', () => {
  it('renders program name + stat line and fires onContinue on press', () => {
    const onContinue = jest.fn();
    const { getByText } = render(
      <ProgramCompletionCelebration
        programName="Functional Athlete"
        weeks={11} sessions={38} prs={6}
        onContinue={onContinue}
      />
    );
    expect(getByText('Functional Athlete')).toBeTruthy();
    expect(getByText(/11 weeks/)).toBeTruthy();
    fireEvent.press(getByText('Continue'));
    expect(onContinue).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- __tests__/components/ProgramCompletionCelebration.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the component**

Create `src/components/ProgramCompletionCelebration.tsx`. Build the firework + trophy per the mockup using `react-native-reanimated` (entering animations like `SplashScreen.tsx`), `expo-haptics` Success on mount, and the real logo wordmark if desired. Use `Colors.amber` (gold accent), `Colors.green`, `Colors`/`Spacing`/`FontSize` tokens — no hex literals.

```typescript
/**
 * APEX — Program completion celebration (full-screen takeover).
 * Visual contract: docs/mockups/program-complete-celebration-2026-06-07.html
 */
import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';

interface Props {
  programName: string;
  weeks: number;
  sessions: number;
  prs: number;
  onContinue: () => void;
}

// 12 spark vectors (matches the mockup burst); animation polish per visual contract.
const SPARKS = [
  [115, 0], [99, 58], [58, 99], [0, 115], [-58, 99], [-99, 58],
  [-115, 0], [-99, -58], [-58, -99], [0, -115], [58, -99], [99, -58],
];

export function ProgramCompletionCelebration({ programName, weeks, sessions, prs, onContinue }: Props) {
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  return (
    <Animated.View entering={FadeIn.duration(250)} style={styles.container}>
      <Animated.View entering={ZoomIn.delay(120).springify()} style={styles.trophyWrap}>
        {/* Firework sparks render behind the trophy — see SPARKS; trophy core: */}
        <View style={styles.trophy}><Text style={styles.trophyGlyph}>🏆</Text></View>
      </Animated.View>

      <Animated.Text entering={FadeInUp.delay(260)} style={styles.eyebrow}>PROGRAM COMPLETE</Animated.Text>
      <Animated.Text entering={FadeInUp.delay(320)} style={styles.name}>{programName}</Animated.Text>
      <Animated.Text entering={FadeInUp.delay(380)} style={styles.sub}>
        {weeks} weeks · {sessions} sessions · {prs} PRs
      </Animated.Text>

      <Animated.View entering={FadeIn.delay(800)} style={styles.continueWrap}>
        <Pressable onPress={onContinue} style={styles.continueBtn} accessibilityRole="button">
          <Text style={styles.continueText}>Continue</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', padding: Spacing.screenHorizontal },
  trophyWrap: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  trophy: {
    width: 150, height: 150, borderRadius: 75, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.card, borderWidth: 2, borderColor: Colors.amber,
  },
  trophyGlyph: { fontSize: 62 },
  eyebrow: { color: Colors.textDim, fontSize: FontSize.caption, letterSpacing: 4, fontWeight: '700', marginTop: Spacing.lg },
  name: { color: Colors.text, fontSize: FontSize.screenTitle, fontWeight: '800', marginTop: Spacing.md },
  sub: { color: Colors.textDim, fontSize: FontSize.body, marginTop: Spacing.sm },
  continueWrap: { position: 'absolute', bottom: Spacing.xxl, left: 0, right: 0, alignItems: 'center' },
  continueBtn: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, borderRadius: BorderRadius.button, backgroundColor: Colors.indigo },
  continueText: { color: '#fff', fontWeight: '700', fontSize: FontSize.body },
});
```

> Note: the spark/flash/shockwave burst is polish — implement per the mockup with reanimated `useSharedValue`/`withTiming`/`withDelay` (see `SplashScreen.tsx`). The test only asserts content + the Continue action; verify the motion visually against the mockup during execution. Confirm `Colors.amber`, `Colors.textDim`, `FontSize.caption`, `Spacing.xxl` exist (`grep` the theme); substitute the nearest existing token if a name differs.

- [ ] **Step 4: Run test to verify pass**

Run: `npm test -- __tests__/components/ProgramCompletionCelebration.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ProgramCompletionCelebration.tsx __tests__/components/ProgramCompletionCelebration.test.tsx
git commit -m "feat(#62): program completion celebration component"
```

---

## Phase 8 — Summary view + completion route (UI)

### Task 8a: `ProgramSummaryView`

**Visual contract:** `docs/mockups/program-complete-summary-2026-06-07.html`.

**Files:**
- Create: `src/components/ProgramSummaryView.tsx`
- Test: `__tests__/components/ProgramSummaryView.test.tsx`

- [ ] **Step 1: Write a render test**

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import { ProgramSummaryView } from '../../src/components/ProgramSummaryView';
import type { ProgramSummary } from '../../src/db/programSummary';

const summary: ProgramSummary = {
  programId: 'p1', programName: 'Functional Athlete', startDate: '2026-03-22', endDate: '2026-06-07',
  weeks: 11, sessionsCompleted: 38, sessionsPlanned: 40, adherencePct: 95,
  gains: [{ exerciseId: 'deadlift', name: 'Deadlift', startE1rm: 335, endE1rm: 375, deltaLb: 40, deltaPct: 12 }],
  prs: [{ exerciseId: 'deadlift', name: 'Deadlift', recordType: 'e1rm', value: 389, repCount: null, weekNumber: 11, date: '2026-06-05' }],
};

it('renders gains and PRs', () => {
  const { getByText } = render(<ProgramSummaryView summary={summary} onPrimary={() => {}} onSecondary={() => {}} />);
  expect(getByText('Deadlift')).toBeTruthy();
  expect(getByText(/\+40/)).toBeTruthy();
  expect(getByText('Start a new program')).toBeTruthy();
});
```

- [ ] **Step 2: Run to verify failure** → `npm test -- __tests__/components/ProgramSummaryView.test.tsx` → FAIL.

- [ ] **Step 3: Implement `ProgramSummaryView`**

Create `src/components/ProgramSummaryView.tsx` — a `ScrollView` rendering: header (trophy, name, date range), stat trio (Sessions / Adherence% / PRs), "Strength Gains · est. 1RM" rows (`name`, `start → end lb`, green `+delta · ▲pct%`, mini bar), "Personal Records" rows (name, `value × rep · Week n`, e1RM), and two CTAs (`onPrimary` "Start a new program", `onSecondary` "Back to Home"). Match the mockup layout; use tokens (`Colors.amber` gold, `Colors.green` deltas). Props:

```typescript
import type { ProgramSummary } from '../db/programSummary';
interface Props { summary: ProgramSummary; onPrimary: () => void; onSecondary: () => void; }
export function ProgramSummaryView({ summary, onPrimary, onSecondary }: Props) { /* per mockup */ }
```

(Render the date range as `formatDateRange(summary.startDate, summary.endDate)`; reuse existing date utils in `src/utils/date` or inline a short formatter.)

- [ ] **Step 4: Run test** → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ProgramSummaryView.tsx __tests__/components/ProgramSummaryView.test.tsx
git commit -m "feat(#62): program summary view component"
```

### Task 8b: `app/program-complete.tsx` route

**Files:**
- Create: `app/program-complete.tsx`

- [ ] **Step 1: Implement the route**

Reads `programId` + `celebrate` params; loads `buildProgramSummary`; if `celebrate==='1'` shows `ProgramCompletionCelebration` first, else goes straight to `ProgramSummaryView`; calls `markCompletionSeen(programId)` on mount; "Start a new program" → `router.replace('/library')`; "Back to Home" → `router.replace('/(tabs)')`.

```typescript
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { buildProgramSummary, type ProgramSummary } from '../src/db/programSummary';
import { markCompletionSeen } from '../src/db/programs';
import { ProgramCompletionCelebration } from '../src/components/ProgramCompletionCelebration';
import { ProgramSummaryView } from '../src/components/ProgramSummaryView';
import { Colors } from '../src/theme';

export default function ProgramCompleteScreen() {
  const { programId, celebrate } = useLocalSearchParams<{ programId: string; celebrate?: string }>();
  const [summary, setSummary] = useState<ProgramSummary | null>(null);
  const [showCelebration, setShowCelebration] = useState(celebrate === '1');

  useEffect(() => {
    if (!programId) return;
    buildProgramSummary(programId).then(setSummary);
    markCompletionSeen(programId).catch(() => {});
  }, [programId]);

  if (!summary) return <View style={{ flex: 1, backgroundColor: Colors.bg }} />;

  if (showCelebration) {
    return (
      <ProgramCompletionCelebration
        programName={summary.programName}
        weeks={summary.weeks}
        sessions={summary.sessionsCompleted}
        prs={summary.prs.length}
        onContinue={() => setShowCelebration(false)}
      />
    );
  }

  return (
    <ProgramSummaryView
      summary={summary}
      onPrimary={() => router.replace('/library')}
      onSecondary={() => router.replace('/(tabs)')}
    />
  );
}
```

> Confirm the Library modal route path (`grep -rn "library" app` — the CLAUDE.md lists `app/library.tsx`). Adjust `router.replace('/library')` to the actual path.

- [ ] **Step 2: Typecheck + smoke**

Run: `npx tsc --noEmit` → no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/program-complete.tsx
git commit -m "feat(#62): program-complete route (celebration -> summary)"
```

---

## Phase 9 — Home completed card + launch backfill

### Task 9a: `CompletedProgramCard`

**Visual contract:** `docs/mockups/program-complete-home-2026-06-07.html` (gold "✓ COMPLETED" + thin gold top accent, program name hero, date range · weeks, two stats `N PRs` / `M% Adherence` with a generous gap, "View full summary →").

**Files:**
- Create: `src/components/CompletedProgramCard.tsx`
- Test: `__tests__/components/CompletedProgramCard.test.tsx`

- [ ] **Step 1: Write a render test**

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CompletedProgramCard } from '../../src/components/CompletedProgramCard';

it('renders name, stats and fires onViewSummary', () => {
  const onView = jest.fn();
  const { getByText } = render(
    <CompletedProgramCard
      programName="Functional Athlete" dateRangeLabel="Mar 22 – Jun 7, 2026 · 11 weeks"
      prs={6} adherencePct={95} onViewSummary={onView}
    />
  );
  expect(getByText('Functional Athlete')).toBeTruthy();
  expect(getByText(/Adherence/)).toBeTruthy();
  fireEvent.press(getByText(/View full summary/));
  expect(onView).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run to verify failure** → FAIL.

- [ ] **Step 3: Implement `CompletedProgramCard`** per the mockup (Option 3 pride line: `<b>6</b>PRs` and `<b>95%</b>Adherence`, generous gap; gold top accent via a 3px bar; tokens only). Props:

```typescript
interface Props {
  programName: string; dateRangeLabel: string;
  prs: number; adherencePct: number; onViewSummary: () => void;
}
```

- [ ] **Step 4: Run test** → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/CompletedProgramCard.tsx __tests__/components/CompletedProgramCard.test.tsx
git commit -m "feat(#62): Home completed-program card"
```

### Task 9b: Wire Home — render card + backfill/celebration redirect

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Load completed program when none active**

In the Home data load, when `getActiveProgram()` returns null, fetch `getMostRecentCompletedProgram()` and `buildProgramSummary(prog.id)` for the card stats; store in state. Import `getMostRecentCompletedProgram`, `markCompletionSeen` from `../../src/db/programs`, `buildProgramSummary` from `../../src/db/programSummary`, `getCompletedFinalDaySession` from `../../src/db/sessions`, `getLastTrainingDay` from `../../src/utils/program`, and `router` from `expo-router`.

- [ ] **Step 2: Launch backfill + celebration redirect**

In the Home focus effect, before rendering, run once:

```typescript
  // Backfill: an active program whose final training day is already logged -> complete it.
  const active = await getActiveProgram();
  if (active) {
    const lastDay = getLastTrainingDay(active.definition);
    if (lastDay) {
      const finalDone = await getCompletedFinalDaySession(active.id, lastDay, active.definition.program.duration_weeks);
      if (finalDone) {
        await markProgramComplete(active.id);
      }
    }
  }
  // Celebrate any completed-but-unseen program once.
  const completed = await getMostRecentCompletedProgram();
  if (completed && (completed.completion_seen ?? 0) === 0) {
    router.push(`/program-complete?programId=${completed.id}&celebrate=1`);
    return;
  }
```

(Import `markProgramComplete` too.)

- [ ] **Step 3: Render the completed card**

When there is no active program but `completedSummary` exists, render `<CompletedProgramCard .../>` (instead of the bare "Browse Library" empty state) with a "Start a new program" button below, and `onViewSummary={() => router.push(\`/program-complete?programId=${completed.id}&celebrate=0\`)}`. Keep the health bar + calendar as-is. Build `dateRangeLabel` from `startDate`/`endDate` + `weeks`.

- [ ] **Step 4: Typecheck + Home renders**

Run: `npx tsc --noEmit` → clean.
Run: `npm test -- __tests__/components __tests__/hooks` → PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/(tabs)/index.tsx"
git commit -m "feat(#62): Home completed-state card + launch backfill/celebration"
```

---

## Phase 10 — Remove redundant detection regressions & full verification

### Task 10: Full suite, E2E, lint

- [ ] **Step 1: Run the entire test suite**

Run: `npm test`
Expected: PASS (all unit, db, component tests green; existing finish-workout E2E unaffected).

- [ ] **Step 2: Add an E2E assertion for the final session**

In the existing finish-workout E2E (find via `grep -rln "finishSession\|finish workout\|complete" __tests__` for the E2E flow), add a case: seed a program positioned at the final week's last training day, complete it, and assert the program row flips to `status='completed'` with `completion_seen=0`. (Reuse the seed helpers from `__tests__/db/programCompletion.test.ts`.)

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual device check (per CLAUDE.md)**

Build to device (`npm run device`) and verify against mockups:
- Completing the final training day → celebration plays → summary → Home shows completed card.
- Relaunch with the already-finished program → celebration fires once, then `completion_seen=1` (no repeat on next launch).
- Home no longer shows "Week 12 of 11 — Unknown Block".

- [ ] **Step 5: Commit**

```bash
git add __tests__
git commit -m "test(#62): e2e coverage for final-session completion"
```

---

## Self-Review

**Spec coverage:**
- §1 detection → Task 2 (helper) + Task 6 (wiring). ✓
- §2 week clamp → Task 3. ✓
- §3 state model → Task 1 (columns) + Task 4 (writes). ✓
- §4 backfill → Task 9b. ✓
- §5 celebration → Task 7; summary → Task 5 (data) + Task 8a/8b; Home → Task 9. ✓
- §6 summary content (main-lift gains, PRs, adherence) → Task 5. ✓
- §7 Home completed card → Task 9a. ✓
- §8 adherence (training adherence = completed/planned sessions) → Task 5 `adherencePct`. ✓
- §9 tokens → use `Colors.amber`/`Colors.green` across UI tasks (noted). ✓
- Edge cases (skips, legacy week-12 rows, idempotent backfill) → `>=` rule + `completion_seen` guard. ✓

**Placeholder scan:** UI tasks (7, 8a, 9a) reference the locked mockups as the exact visual contract and give complete component skeletons with real props/tokens/animation primitives; the burst animation polish is explicitly delegated to the mockup. No "TBD"/"add error handling"-style gaps in logic/DB tasks.

**Type consistency:** `ProgramSummary`/`LiftGain`/`SummaryPR` defined in Task 5 and consumed unchanged in Tasks 8/9. `isFinalTrainingSession(definition, weekNumber, scheduledDay)` signature consistent across Tasks 2 and 6. `getCurrentWeek(activatedDate, durationWeeks)` updated consistently in Task 3 and all call sites.

**Verification note for executor:** several token names (`Colors.amber`, `Colors.textDim`, `FontSize.caption`, `Spacing.xxl`) and route paths (`/library`, `/(tabs)`) are assumed — confirm each with a quick `grep` before use and substitute the nearest existing token/path if a name differs.
