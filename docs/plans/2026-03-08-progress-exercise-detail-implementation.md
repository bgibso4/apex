# Progress & Exercise Detail Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close all gaps between the progress-screen-v2 mockup and the current implementation — exercise detail improvements, training/protocol consistency, block bands, volume actual vs planned, all time view, and a new All Exercises screen.

**Architecture:** Bottom-up by data dependency. New DB queries first, then shared components (ProgressBar, block color utility, TrendLineChart bands), then screen-level changes. Each task is independently testable.

**Tech Stack:** TypeScript, React Native (Expo), SQLite (expo-sqlite), react-native-svg, Jest

**Design Doc:** `docs/plans/2026-03-08-progress-exercise-detail-design.md`

---

### Task 1: DB — Date-filtered 1RM history with block names

**Files:**
- Modify: `src/db/metrics.ts`
- Modify: `src/db/index.ts`
- Test: `__tests__/db/metrics-extended.test.ts`

**Step 1: Write the failing tests**

Add to `__tests__/db/metrics-extended.test.ts`:

```typescript
describe('get1RMHistoryWithBlocks', () => {
  it('returns block_name with each data point', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      { date: '2026-01-10', actual_weight: 200, actual_reps: 5, session_id: 's1', block_name: 'Hypertrophy' },
      { date: '2026-01-17', actual_weight: 210, actual_reps: 5, session_id: 's2', block_name: 'Strength' },
    ]);

    const result = await get1RMHistoryWithBlocks('back_squat');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ date: '2026-01-10', e1rm: calculateEpley(200, 5), blockName: 'Hypertrophy' });
    expect(result[1]).toEqual({ date: '2026-01-17', e1rm: calculateEpley(210, 5), blockName: 'Strength' });
  });

  it('filters by startDate when provided', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([]);

    await get1RMHistoryWithBlocks('back_squat', { startDate: '2026-02-01' });
    const sql = mockDb.getAllAsync.mock.calls[0][0] as string;
    expect(sql).toContain('s.date >= ?');
  });

  it('filters by programId when provided', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([]);

    await get1RMHistoryWithBlocks('back_squat', { programId: 'p1' });
    const sql = mockDb.getAllAsync.mock.calls[0][0] as string;
    expect(sql).toContain('s.program_id = ?');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/db/metrics-extended.test.ts --no-coverage -t "get1RMHistoryWithBlocks"`
Expected: FAIL — `get1RMHistoryWithBlocks` is not defined

**Step 3: Implement**

Add to `src/db/metrics.ts`:

```typescript
export interface E1RMHistoryPoint {
  date: string;
  e1rm: number;
  blockName: string;
}

/** Get 1RM history with block names and optional date/program filtering */
export async function get1RMHistoryWithBlocks(
  exerciseId: string,
  options?: { startDate?: string; programId?: string; limit?: number }
): Promise<E1RMHistoryPoint[]> {
  const db = await getDatabase();
  const limit = options?.limit ?? 50;

  const conditions = [
    'sl.exercise_id = ?',
    "sl.status IN ('completed', 'completed_below')",
    'sl.actual_weight > 0',
    'sl.actual_reps > 0',
    's.completed_at IS NOT NULL',
  ];
  const params: (string | number)[] = [exerciseId];

  if (options?.startDate) {
    conditions.push('s.date >= ?');
    params.push(options.startDate);
  }
  if (options?.programId) {
    conditions.push('s.program_id = ?');
    params.push(options.programId);
  }

  params.push(limit * 5);

  const rows = await db.getAllAsync<{
    date: string;
    actual_weight: number;
    actual_reps: number;
    session_id: string;
    block_name: string;
  }>(
    `SELECT s.date, sl.actual_weight, sl.actual_reps, sl.session_id, s.block_name
     FROM set_logs sl
     JOIN sessions s ON s.id = sl.session_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY s.date DESC
     LIMIT ?`,
    params
  );

  const sessionBests = new Map<string, E1RMHistoryPoint>();
  for (const row of rows) {
    const e1rm = calculateEpley(row.actual_weight, row.actual_reps);
    const existing = sessionBests.get(row.session_id);
    if (!existing || e1rm > existing.e1rm) {
      sessionBests.set(row.session_id, {
        date: row.date,
        e1rm,
        blockName: row.block_name ?? '',
      });
    }
  }

  return Array.from(sessionBests.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-limit);
}
```

**Step 4: Export from index**

In `src/db/index.ts`, add `get1RMHistoryWithBlocks` and the `E1RMHistoryPoint` type to the metrics export line.

**Step 5: Run tests to verify they pass**

Run: `npx jest __tests__/db/metrics-extended.test.ts --no-coverage`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add src/db/metrics.ts src/db/index.ts __tests__/db/metrics-extended.test.ts
git commit -m "feat: add get1RMHistoryWithBlocks with date/program filtering"
```

---

### Task 2: DB — Exercise set history with block names and date filtering

**Files:**
- Modify: `src/db/metrics.ts`
- Modify: `src/db/index.ts`
- Test: `__tests__/db/metrics-extended.test.ts`

**Step 1: Write the failing tests**

Add to `__tests__/db/metrics-extended.test.ts`:

```typescript
describe('getExerciseSetHistoryWithBlocks', () => {
  it('returns blockName and sessionE1rm with each session', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      { date: '2026-01-10', session_id: 's1', set_number: 1, actual_weight: 200, actual_reps: 5, rpe: 8, block_name: 'Hypertrophy' },
      { date: '2026-01-10', session_id: 's1', set_number: 2, actual_weight: 200, actual_reps: 5, rpe: 8.5, block_name: 'Hypertrophy' },
    ]);

    const result = await getExerciseSetHistoryWithBlocks('back_squat');
    expect(result).toHaveLength(1);
    expect(result[0].blockName).toBe('Hypertrophy');
    expect(result[0].sessionE1rm).toBe(calculateEpley(200, 5));
    expect(result[0].sets).toHaveLength(2);
  });

  it('filters by startDate when provided', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([]);

    await getExerciseSetHistoryWithBlocks('back_squat', { startDate: '2026-02-01' });
    const sql = mockDb.getAllAsync.mock.calls[0][0] as string;
    expect(sql).toContain('s.date >= ?');
  });

  it('returns total session count', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([]);
    mockDb.getFirstAsync.mockResolvedValueOnce({ count: 15 });

    const result = await getExerciseSetHistoryWithBlocks('back_squat');
    expect(result).toEqual(expect.objectContaining([]));
  });
});

describe('getExerciseSessionCount', () => {
  it('returns total session count for an exercise', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({ count: 15 });

    const result = await getExerciseSessionCount('back_squat');
    expect(result).toBe(15);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/db/metrics-extended.test.ts --no-coverage -t "getExerciseSetHistoryWithBlocks|getExerciseSessionCount"`
Expected: FAIL

**Step 3: Implement**

Add to `src/db/metrics.ts`:

```typescript
export interface SessionSetHistory {
  date: string;
  blockName: string;
  sessionE1rm: number;
  avgRpe: number | null;
  sets: { setNumber: number; weight: number; reps: number; rpe: number | null }[];
}

/** Get exercise set history with block names and computed session e1RM */
export async function getExerciseSetHistoryWithBlocks(
  exerciseId: string,
  options?: { startDate?: string; programId?: string; limit?: number }
): Promise<SessionSetHistory[]> {
  const db = await getDatabase();
  const limit = options?.limit ?? 5;

  const conditions = [
    'sl.exercise_id = ?',
    "sl.status IN ('completed', 'completed_below')",
    'sl.actual_weight > 0',
    's.completed_at IS NOT NULL',
  ];
  const params: (string | number)[] = [exerciseId];

  if (options?.startDate) {
    conditions.push('s.date >= ?');
    params.push(options.startDate);
  }
  if (options?.programId) {
    conditions.push('s.program_id = ?');
    params.push(options.programId);
  }

  params.push(limit * 10);

  const rows = await db.getAllAsync<{
    date: string;
    session_id: string;
    set_number: number;
    actual_weight: number;
    actual_reps: number;
    rpe: number | null;
    block_name: string;
  }>(
    `SELECT s.date, sl.session_id, sl.set_number, sl.actual_weight, sl.actual_reps, sl.rpe, s.block_name
     FROM set_logs sl
     JOIN sessions s ON s.id = sl.session_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY s.date DESC, sl.set_number ASC
     LIMIT ?`,
    params
  );

  const grouped = new Map<string, SessionSetHistory>();
  for (const row of rows) {
    const key = row.date;
    if (!grouped.has(key)) {
      grouped.set(key, {
        date: key,
        blockName: row.block_name ?? '',
        sessionE1rm: 0,
        avgRpe: null,
        sets: [],
      });
    }
    const entry = grouped.get(key)!;
    entry.sets.push({
      setNumber: row.set_number,
      weight: row.actual_weight,
      reps: row.actual_reps,
      rpe: row.rpe,
    });
    const e1rm = calculateEpley(row.actual_weight, row.actual_reps);
    if (e1rm > entry.sessionE1rm) entry.sessionE1rm = e1rm;
  }

  // Calculate avg RPE per session
  for (const entry of grouped.values()) {
    const rpes = entry.sets.map(s => s.rpe).filter((r): r is number => r != null);
    entry.avgRpe = rpes.length > 0 ? Math.round((rpes.reduce((a, b) => a + b, 0) / rpes.length) * 10) / 10 : null;
  }

  return Array.from(grouped.values()).slice(0, limit);
}

/** Get total session count for an exercise (for "View all X sessions" link) */
export async function getExerciseSessionCount(exerciseId: string): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(DISTINCT s.id) as count
     FROM set_logs sl
     JOIN sessions s ON s.id = sl.session_id
     WHERE sl.exercise_id = ?
       AND sl.status IN ('completed', 'completed_below')
       AND s.completed_at IS NOT NULL`,
    [exerciseId]
  );
  return row?.count ?? 0;
}
```

**Step 4: Export from index**

In `src/db/index.ts`, add `getExerciseSetHistoryWithBlocks`, `getExerciseSessionCount`, `SessionSetHistory` to the metrics export line.

**Step 5: Run tests**

Run: `npx jest __tests__/db/metrics-extended.test.ts --no-coverage`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add src/db/metrics.ts src/db/index.ts __tests__/db/metrics-extended.test.ts
git commit -m "feat: add getExerciseSetHistoryWithBlocks and getExerciseSessionCount"
```

---

### Task 3: DB — Training consistency queries

**Files:**
- Modify: `src/db/metrics.ts`
- Modify: `src/db/index.ts`
- Test: `__tests__/db/metrics-extended.test.ts`

**Step 1: Write the failing tests**

```typescript
describe('getTrainingConsistency', () => {
  it('returns per-week completed vs planned', async () => {
    // Mock getActiveProgram to return definition with weekly template
    mockDb.getAllAsync.mockResolvedValueOnce([
      { week_number: 1, completed: 3 },
      { week_number: 2, completed: 2 },
    ]);

    const result = await getTrainingConsistency('p1', 4);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ week: 1, completed: 3, planned: 4 });
    expect(result[1]).toEqual({ week: 2, completed: 2, planned: 4 });
  });
});

describe('getAllTimeConsistency', () => {
  it('returns per-program consistency stats', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      { program_id: 'p1', name: 'Program A', duration_weeks: 8, completed_sessions: 28, activated_date: '2025-01-01' },
      { program_id: 'p2', name: 'Program B', duration_weeks: 6, completed_sessions: 18, activated_date: '2025-06-01' },
    ]);

    const result = await getAllTimeConsistency(4);
    expect(result).toHaveLength(2);
    expect(result[0].programName).toBe('Program A');
    expect(result[0].completed).toBe(28);
    expect(result[0].planned).toBe(32); // 8 weeks * 4 days
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/db/metrics-extended.test.ts --no-coverage -t "getTrainingConsistency|getAllTimeConsistency"`
Expected: FAIL

**Step 3: Implement**

Add to `src/db/metrics.ts`:

```typescript
export interface WeekConsistency {
  week: number;
  completed: number;
  planned: number;
}

/** Get per-week training consistency for a program */
export async function getTrainingConsistency(
  programId: string,
  trainingDaysPerWeek: number
): Promise<WeekConsistency[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{ week_number: number; completed: number }>(
    `SELECT week_number, COUNT(*) as completed
     FROM sessions
     WHERE program_id = ? AND completed_at IS NOT NULL
     GROUP BY week_number
     ORDER BY week_number`,
    [programId]
  );

  return rows.map(r => ({
    week: r.week_number,
    completed: r.completed,
    planned: trainingDaysPerWeek,
  }));
}

export interface ProgramConsistency {
  programId: string;
  programName: string;
  completed: number;
  planned: number;
}

/** Get per-program consistency stats across all programs */
export async function getAllTimeConsistency(
  trainingDaysPerWeek: number
): Promise<ProgramConsistency[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    program_id: string;
    name: string;
    duration_weeks: number;
    completed_sessions: number;
    activated_date: string;
  }>(
    `SELECT p.id as program_id, p.name, p.duration_weeks, p.activated_date,
            COUNT(s.id) as completed_sessions
     FROM programs p
     LEFT JOIN sessions s ON s.program_id = p.id AND s.completed_at IS NOT NULL
     WHERE p.status IN ('active', 'completed')
     GROUP BY p.id
     ORDER BY p.activated_date ASC`
  );

  return rows.map(r => ({
    programId: r.program_id,
    programName: r.name,
    completed: r.completed_sessions,
    planned: r.duration_weeks * trainingDaysPerWeek,
  }));
}
```

**Step 4: Export from index**

Add `getTrainingConsistency`, `getAllTimeConsistency`, `WeekConsistency`, `ProgramConsistency` to `src/db/index.ts`.

**Step 5: Run tests**

Run: `npx jest __tests__/db/metrics-extended.test.ts --no-coverage`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add src/db/metrics.ts src/db/index.ts __tests__/db/metrics-extended.test.ts
git commit -m "feat: add training consistency queries (per-week and all-time)"
```

---

### Task 4: DB — Protocol consistency query

**Files:**
- Modify: `src/db/metrics.ts`
- Modify: `src/db/index.ts`
- Test: `__tests__/db/metrics-extended.test.ts`

**Step 1: Write the failing tests**

```typescript
describe('getProtocolConsistency', () => {
  it('returns completion rate per protocol item', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({
      total: 10,
      rope: 8,
      ankle: 6,
      hipIr: 9,
      conditioning: 7,
    });

    const result = await getProtocolConsistency('p1');
    expect(result).toEqual([
      { name: 'Jump Rope', completed: 8, total: 10 },
      { name: 'Ankle Protocol', completed: 6, total: 10 },
      { name: 'Hip IR Work', completed: 9, total: 10 },
      { name: 'Conditioning', completed: 7, total: 10 },
    ]);
  });

  it('queries all programs when programId is null', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({
      total: 0, rope: 0, ankle: 0, hipIr: 0, conditioning: 0,
    });

    await getProtocolConsistency(null);
    const sql = mockDb.getFirstAsync.mock.calls[0][0] as string;
    expect(sql).not.toContain('program_id');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/db/metrics-extended.test.ts --no-coverage -t "getProtocolConsistency"`
Expected: FAIL

**Step 3: Implement**

Add to `src/db/metrics.ts`:

```typescript
export interface ProtocolItem {
  name: string;
  completed: number;
  total: number;
}

/** Get protocol (warmup + finisher) consistency rates */
export async function getProtocolConsistency(
  programId: string | null
): Promise<ProtocolItem[]> {
  const db = await getDatabase();

  const whereClause = programId
    ? 'WHERE program_id = ? AND completed_at IS NOT NULL'
    : 'WHERE completed_at IS NOT NULL';
  const params = programId ? [programId] : [];

  const row = await db.getFirstAsync<{
    total: number;
    rope: number;
    ankle: number;
    hipIr: number;
    conditioning: number;
  }>(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN warmup_rope = 1 THEN 1 ELSE 0 END) as rope,
       SUM(CASE WHEN warmup_ankle = 1 THEN 1 ELSE 0 END) as ankle,
       SUM(CASE WHEN warmup_hip_ir = 1 THEN 1 ELSE 0 END) as hipIr,
       SUM(CASE WHEN conditioning_done = 1 THEN 1 ELSE 0 END) as conditioning
     FROM sessions
     ${whereClause}`,
    params
  );

  if (!row || row.total === 0) {
    return [
      { name: 'Jump Rope', completed: 0, total: 0 },
      { name: 'Ankle Protocol', completed: 0, total: 0 },
      { name: 'Hip IR Work', completed: 0, total: 0 },
      { name: 'Conditioning', completed: 0, total: 0 },
    ];
  }

  return [
    { name: 'Jump Rope', completed: row.rope, total: row.total },
    { name: 'Ankle Protocol', completed: row.ankle, total: row.total },
    { name: 'Hip IR Work', completed: row.hipIr, total: row.total },
    { name: 'Conditioning', completed: row.conditioning, total: row.total },
  ];
}
```

**Step 4: Export from index**

Add `getProtocolConsistency`, `ProtocolItem` to `src/db/index.ts`.

**Step 5: Run tests**

Run: `npx jest __tests__/db/metrics-extended.test.ts --no-coverage`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add src/db/metrics.ts src/db/index.ts __tests__/db/metrics-extended.test.ts
git commit -m "feat: add protocol consistency query (warmup + finisher rates)"
```

---

### Task 5: DB — Planned weekly volume from program definition

**Files:**
- Modify: `src/db/metrics.ts`
- Modify: `src/db/index.ts`
- Test: `__tests__/db/metrics-extended.test.ts`

**Step 1: Write the failing tests**

```typescript
describe('getPlannedWeeklyVolume', () => {
  it('calculates planned sets per week from definition', () => {
    const definition: ProgramDefinition = {
      program: {
        name: 'Test',
        duration_weeks: 2,
        created: '2026-01-01',
        blocks: [
          { name: 'Hypertrophy', weeks: [1, 2], main_lift_scheme: {} },
        ],
        weekly_template: {
          monday: {
            name: 'Upper A',
            warmup: 'standard',
            exercises: [
              { exercise_id: 'bench_press', category: 'main', targets: [{ weeks: [1, 2], sets: 4, reps: 8 }] },
              { exercise_id: 'barbell_row', category: 'accessory', targets: [{ weeks: [1, 2], sets: 3, reps: 10 }] },
            ],
          },
          wednesday: {
            name: 'Lower A',
            warmup: 'standard',
            exercises: [
              { exercise_id: 'back_squat', category: 'main', targets: [{ weeks: [1, 2], sets: 4, reps: 6 }] },
            ],
          },
          friday: { type: 'rest' as const },
        },
        exercise_definitions: [],
        warmup_protocols: {},
      },
    };

    const result = getPlannedWeeklyVolume(definition, 2);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ week: 1, plannedSets: 11, blockName: 'Hypertrophy' });
    expect(result[1]).toEqual({ week: 2, plannedSets: 11, blockName: 'Hypertrophy' });
  });

  it('handles different targets per week/block', () => {
    const definition: ProgramDefinition = {
      program: {
        name: 'Test',
        duration_weeks: 2,
        created: '2026-01-01',
        blocks: [
          { name: 'Hypertrophy', weeks: [1], main_lift_scheme: {} },
          { name: 'Deload', weeks: [2], main_lift_scheme: {} },
        ],
        weekly_template: {
          monday: {
            name: 'Day A',
            warmup: 'standard',
            exercises: [
              {
                exercise_id: 'bench_press',
                category: 'main',
                targets: [
                  { weeks: [1], sets: 4, reps: 8 },
                  { weeks: [2], sets: 2, reps: 5 },
                ],
              },
            ],
          },
        },
        exercise_definitions: [],
        warmup_protocols: {},
      },
    };

    const result = getPlannedWeeklyVolume(definition, 2);
    expect(result[0]).toEqual({ week: 1, plannedSets: 4, blockName: 'Hypertrophy' });
    expect(result[1]).toEqual({ week: 2, plannedSets: 2, blockName: 'Deload' });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/db/metrics-extended.test.ts --no-coverage -t "getPlannedWeeklyVolume"`
Expected: FAIL

**Step 3: Implement**

This is a pure function (no DB needed — it computes from the definition JSON). Add to `src/db/metrics.ts`:

```typescript
import type { ProgramDefinition, DayTemplate } from '../types';
import { getBlockForWeek, getTargetForWeek } from '../utils/program';

export interface PlannedWeekVolume {
  week: number;
  plannedSets: number;
  blockName: string;
}

/** Calculate planned weekly volume from a program definition */
export function getPlannedWeeklyVolume(
  definition: ProgramDefinition,
  durationWeeks: number
): PlannedWeekVolume[] {
  const { blocks, weekly_template } = definition.program;
  const result: PlannedWeekVolume[] = [];

  // Get training day templates (non-rest)
  const trainingDays: DayTemplate[] = [];
  for (const dayKey of Object.keys(weekly_template)) {
    const day = weekly_template[dayKey];
    if (day && !('type' in day && day.type === 'rest')) {
      trainingDays.push(day as DayTemplate);
    }
  }

  for (let week = 1; week <= durationWeeks; week++) {
    const block = getBlockForWeek(blocks, week);
    let plannedSets = 0;

    for (const day of trainingDays) {
      for (const exercise of day.exercises) {
        const target = getTargetForWeek(exercise, week);
        if (target) {
          plannedSets += target.sets;
        }
      }
    }

    result.push({
      week,
      plannedSets,
      blockName: block?.name ?? '',
    });
  }

  return result;
}
```

**Step 4: Export from index**

Add `getPlannedWeeklyVolume`, `PlannedWeekVolume` to `src/db/index.ts`.

**Step 5: Run tests**

Run: `npx jest __tests__/db/metrics-extended.test.ts --no-coverage`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add src/db/metrics.ts src/db/index.ts __tests__/db/metrics-extended.test.ts
git commit -m "feat: add getPlannedWeeklyVolume from program definition"
```

---

### Task 6: DB — All logged exercises query

**Files:**
- Modify: `src/db/metrics.ts`
- Modify: `src/db/index.ts`
- Test: `__tests__/db/metrics-extended.test.ts`

**Step 1: Write the failing tests**

```typescript
describe('getLoggedExercises', () => {
  it('returns distinct exercises that have been logged', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      { id: 'bench_press', name: 'Bench Press', muscle_groups: '["Chest"]' },
      { id: 'back_squat', name: 'Back Squat', muscle_groups: '["Legs"]' },
    ]);

    const result = await getLoggedExercises();
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 'bench_press',
      name: 'Bench Press',
      muscleGroups: ['Chest'],
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/db/metrics-extended.test.ts --no-coverage -t "getLoggedExercises"`
Expected: FAIL

**Step 3: Implement**

Add to `src/db/metrics.ts`:

```typescript
export interface LoggedExercise {
  id: string;
  name: string;
  muscleGroups: string[];
}

/** Get all exercises that have at least one completed set log */
export async function getLoggedExercises(): Promise<LoggedExercise[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    muscle_groups: string;
  }>(
    `SELECT DISTINCT e.id, e.name, e.muscle_groups
     FROM exercises e
     JOIN set_logs sl ON sl.exercise_id = e.id
     WHERE sl.status IN ('completed', 'completed_below')
     ORDER BY e.name`
  );

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    muscleGroups: JSON.parse(r.muscle_groups || '[]'),
  }));
}
```

**Step 4: Export from index**

Add `getLoggedExercises`, `LoggedExercise` to `src/db/index.ts`.

**Step 5: Run tests**

Run: `npx jest __tests__/db/metrics-extended.test.ts --no-coverage`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add src/db/metrics.ts src/db/index.ts __tests__/db/metrics-extended.test.ts
git commit -m "feat: add getLoggedExercises query for all-exercises screen"
```

---

### Task 7: DB — Program boundaries query (for All Time view)

**Files:**
- Modify: `src/db/metrics.ts`
- Modify: `src/db/index.ts`
- Test: `__tests__/db/metrics-extended.test.ts`

**Step 1: Write the failing tests**

```typescript
describe('getProgramBoundaries', () => {
  it('returns program name and date boundaries', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      { id: 'p1', name: 'Program A', activated_date: '2025-06-01', duration_weeks: 8 },
      { id: 'p2', name: 'Program B', activated_date: '2025-08-01', duration_weeks: 6 },
    ]);

    const result = await getProgramBoundaries();
    expect(result).toHaveLength(2);
    expect(result[0].programName).toBe('Program A');
    expect(result[0].startDate).toBe('2025-06-01');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/db/metrics-extended.test.ts --no-coverage -t "getProgramBoundaries"`
Expected: FAIL

**Step 3: Implement**

Add to `src/db/metrics.ts`:

```typescript
export interface ProgramBoundary {
  programId: string;
  programName: string;
  startDate: string;
  durationWeeks: number;
}

/** Get all program boundaries for All Time chart markers */
export async function getProgramBoundaries(): Promise<ProgramBoundary[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    activated_date: string;
    duration_weeks: number;
  }>(
    `SELECT id, name, activated_date, duration_weeks
     FROM programs
     WHERE status IN ('active', 'completed')
       AND activated_date IS NOT NULL
     ORDER BY activated_date ASC`
  );

  return rows.map(r => ({
    programId: r.id,
    programName: r.name,
    startDate: r.activated_date,
    durationWeeks: r.duration_weeks,
  }));
}
```

**Step 4: Export from index**

Add `getProgramBoundaries`, `ProgramBoundary` to `src/db/index.ts`.

**Step 5: Run tests**

Run: `npx jest __tests__/db/metrics-extended.test.ts --no-coverage`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add src/db/metrics.ts src/db/index.ts __tests__/db/metrics-extended.test.ts
git commit -m "feat: add getProgramBoundaries for all-time chart markers"
```

---

### Task 8: Block color map utility

**Files:**
- Create: `src/utils/blockColors.ts`
- Modify: `src/utils/program.ts` (remove old `getBlockColor`, re-export from new utility)
- Test: `__tests__/utils/blockColors.test.ts`

**Step 1: Write the failing tests**

Create `__tests__/utils/blockColors.test.ts`:

```typescript
import { getBlockColorMap } from '../../src/utils/blockColors';
import { Colors } from '../../src/theme';

describe('getBlockColorMap', () => {
  it('assigns green to deload blocks', () => {
    const blocks = [
      { name: 'Hypertrophy', weeks: [1, 2, 3] },
      { name: 'Deload', weeks: [4] },
    ];
    const map = getBlockColorMap(blocks as any);
    expect(map['Deload']).toBe(Colors.deload);
  });

  it('assigns colors from palette for non-deload blocks', () => {
    const blocks = [
      { name: 'Phase 1', weeks: [1, 2] },
      { name: 'Phase 2', weeks: [3, 4] },
      { name: 'Phase 3', weeks: [5, 6] },
    ];
    const map = getBlockColorMap(blocks as any);
    expect(Object.keys(map)).toHaveLength(3);
    // All should have colors assigned
    expect(map['Phase 1']).toBeDefined();
    expect(map['Phase 2']).toBeDefined();
    expect(map['Phase 3']).toBeDefined();
    // Should not all be the same
    const uniqueColors = new Set(Object.values(map));
    expect(uniqueColors.size).toBe(3);
  });

  it('handles known block names with smart defaults', () => {
    const blocks = [
      { name: 'Hypertrophy', weeks: [1] },
      { name: 'Strength', weeks: [2] },
      { name: 'Realization', weeks: [3] },
    ];
    const map = getBlockColorMap(blocks as any);
    expect(map['Hypertrophy']).toBe(Colors.hypertrophy);
    expect(map['Strength']).toBe(Colors.strength);
    expect(map['Realization']).toBe(Colors.realization);
  });

  it('returns empty map for empty blocks', () => {
    expect(getBlockColorMap([])).toEqual({});
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/utils/blockColors.test.ts --no-coverage`
Expected: FAIL — module not found

**Step 3: Implement**

Create `src/utils/blockColors.ts`:

```typescript
/**
 * APEX — Dynamic block-to-color mapping
 * Assigns colors to training blocks based on name patterns,
 * falling back to a rotating palette for unknown block names.
 */

import { Colors } from '../theme';
import type { Block } from '../types';

/** Known block name patterns mapped to theme colors */
const KNOWN_PATTERNS: [RegExp, string][] = [
  [/deload/i, Colors.deload],
  [/hypertrophy|work.?capacity/i, Colors.hypertrophy],
  [/strength/i, Colors.strength],
  [/realization|peak/i, Colors.realization],
];

/** Fallback palette for blocks that don't match known patterns */
const PALETTE = [
  Colors.indigo,
  Colors.amber,
  Colors.cyan,
  Colors.realization,
];

/** Build a color map from block definitions. Reusable across volume bars and chart bands. */
export function getBlockColorMap(blocks: Block[]): Record<string, string> {
  const map: Record<string, string> = {};
  let paletteIndex = 0;

  for (const block of blocks) {
    if (map[block.name]) continue;

    const knownMatch = KNOWN_PATTERNS.find(([pattern]) => pattern.test(block.name));
    if (knownMatch) {
      map[block.name] = knownMatch[1];
    } else {
      map[block.name] = PALETTE[paletteIndex % PALETTE.length];
      paletteIndex++;
    }
  }

  return map;
}

/** Get muted (low-opacity) version of a block color for background bands */
export function getBlockColorMuted(color: string): string {
  return `${color}18`;
}
```

**Step 4: Update old getBlockColor in program.ts**

In `src/utils/program.ts`, replace the `getBlockColor` function body to delegate to the new utility:

```typescript
import { getBlockColorMap } from './blockColors';

/** Get block color based on emphasis/name */
export function getBlockColor(block: Block): string {
  const map = getBlockColorMap([block]);
  return map[block.name] ?? '#6366f1';
}
```

Remove the hardcoded hex values from the old implementation.

**Step 5: Run tests**

Run: `npx jest __tests__/utils/blockColors.test.ts __tests__/utils/program.test.ts --no-coverage`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add src/utils/blockColors.ts src/utils/program.ts __tests__/utils/blockColors.test.ts
git commit -m "feat: add reusable getBlockColorMap utility for dynamic block coloring"
```

---

### Task 9: ProgressBar reusable component

**Files:**
- Create: `src/components/ProgressBar.tsx`
- Test: `__tests__/components/ProgressBar.test.tsx`

**Step 1: Write the failing test**

Create `__tests__/components/ProgressBar.test.tsx`:

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import ProgressBar from '../../src/components/ProgressBar';

describe('ProgressBar', () => {
  it('renders label and count text', () => {
    const { getByText } = render(
      <ProgressBar label="Jump Rope" value={8} max={10} color="#22c55e" />
    );
    expect(getByText('Jump Rope')).toBeTruthy();
    expect(getByText('8 / 10')).toBeTruthy();
  });

  it('renders percentage when showPercentage is true', () => {
    const { getByText } = render(
      <ProgressBar label="Test" value={3} max={4} color="#6366f1" showPercentage />
    );
    expect(getByText('75%')).toBeTruthy();
  });

  it('handles zero max gracefully', () => {
    const { getByText } = render(
      <ProgressBar label="Test" value={0} max={0} color="#6366f1" />
    );
    expect(getByText('0 / 0')).toBeTruthy();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/components/ProgressBar.test.tsx --no-coverage`
Expected: FAIL — module not found

**Step 3: Implement**

Create `src/components/ProgressBar.tsx`:

```typescript
/**
 * APEX — Reusable ProgressBar component
 * Used by Training Consistency and Protocol Consistency sections.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';

interface Props {
  label: string;
  value: number;
  max: number;
  color: string;
  /** Show percentage instead of / alongside count */
  showPercentage?: boolean;
}

export default function ProgressBar({ label, value, max, color, showPercentage }: Props) {
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  const percentage = Math.round(ratio * 100);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.count}>
          {showPercentage ? `${percentage}%` : `${value} / ${max}`}
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${percentage}%`, backgroundColor: color }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.xs,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    fontWeight: '600',
  },
  count: {
    color: Colors.textDim,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  track: {
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xs,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: BorderRadius.xs,
  },
});
```

**Step 4: Run tests**

Run: `npx jest __tests__/components/ProgressBar.test.tsx --no-coverage`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/components/ProgressBar.tsx __tests__/components/ProgressBar.test.tsx
git commit -m "feat: add reusable ProgressBar component"
```

---

### Task 10: TrendLineChart — Add block background bands

**Files:**
- Modify: `src/components/TrendLineChart.tsx`
- Test: `__tests__/components/TrendLineChart.test.tsx`

**Step 1: Write the failing test**

Create `__tests__/components/TrendLineChart.test.tsx`:

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import TrendLineChart from '../../src/components/TrendLineChart';

describe('TrendLineChart bands', () => {
  it('renders without bands (backward compatible)', () => {
    const { toJSON } = render(
      <TrendLineChart
        lines={[{ data: [{ value: 100 }, { value: 110 }], color: '#6366f1' }]}
        height={80}
      />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders with bands prop without crashing', () => {
    const { toJSON } = render(
      <TrendLineChart
        lines={[{ data: [{ value: 100 }, { value: 110 }, { value: 120 }], color: '#6366f1' }]}
        height={80}
        bands={[
          { startIndex: 0, endIndex: 1, label: 'Hypertrophy', color: '#6366f118' },
          { startIndex: 2, endIndex: 2, label: 'Deload', color: '#22c55e18' },
        ]}
      />
    );
    expect(toJSON()).toBeTruthy();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/components/TrendLineChart.test.tsx --no-coverage`
Expected: FAIL — bands prop not recognized (or test file not found)

**Step 3: Implement**

Add the `bands` prop to `TrendLineChart` in `src/components/TrendLineChart.tsx`:

Add to the `Props` interface:

```typescript
/** Block background bands (e.g., training phases) */
bands?: { startIndex: number; endIndex: number; label: string; color: string }[];
/** Show band labels (default false — use true for larger charts) */
showBandLabels?: boolean;
```

Add to the destructured props: `bands, showBandLabels = false`

Add the band rendering inside the `<Svg>` element, BEFORE the grid lines (so bands are behind everything):

```tsx
{/* Block background bands */}
{bands && bands.map((band, bi) => {
  const total = lines[0]?.data.length ?? 0;
  if (total === 0) return null;

  // Calculate x positions with midpoint boundaries
  const x1 = band.startIndex === 0
    ? 0
    : (toX(band.startIndex, total) + toX(band.startIndex - 1, total)) / 2;
  const x2 = band.endIndex === total - 1
    ? viewBoxWidth
    : (toX(band.endIndex, total) + toX(band.endIndex + 1, total)) / 2;

  return (
    <React.Fragment key={`band-${bi}`}>
      <Rect
        x={x1}
        y={0}
        width={x2 - x1}
        height={viewBoxHeight}
        fill={band.color}
      />
      {showBandLabels && (
        <SvgText
          x={(x1 + x2) / 2}
          y={viewBoxHeight - 4}
          fill={Colors.textMuted}
          fontSize={8}
          textAnchor="middle"
          opacity={0.6}
        >
          {band.label}
        </SvgText>
      )}
    </React.Fragment>
  );
})}
```

Add `Rect` and `Text as SvgText` to the imports from `react-native-svg`:

```typescript
import Svg, {
  Polyline, Path, Circle, Line, Rect, Text as SvgText, Defs, LinearGradient, Stop,
} from 'react-native-svg';
```

**Step 4: Run tests**

Run: `npx jest __tests__/components/TrendLineChart.test.tsx --no-coverage`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/components/TrendLineChart.tsx __tests__/components/TrendLineChart.test.tsx
git commit -m "feat: add block background bands to TrendLineChart"
```

---

### Task 11: Exercise Detail Screen — Time range chips + compact sessions

This is a larger screen rewrite. Combines: time range chips, compact session rows, Y-axis labels, deload tags, "View all" link, and block bands on the chart.

**Files:**
- Modify: `app/exercise/[id].tsx`

**Step 1: Rewrite the exercise detail screen**

Replace the full content of `app/exercise/[id].tsx`. Key changes:

1. **Add time range state** with `TimeRange = 'program' | '3m' | '1y' | 'all'`
2. **Time range chip row** — 4 equal-width buttons below the hero card
3. **Use `get1RMHistoryWithBlocks`** instead of `get1RMHistory` — pass date filter based on selected range
4. **Use `getExerciseSetHistoryWithBlocks`** instead of `getExerciseSetHistory` — compact row format
5. **Add `getExerciseSessionCount`** for the "View all" link
6. **Generate Y-axis labels** from history min/max and pass to TrendLineChart
7. **Build bands array** from history block names and pass to TrendLineChart
8. **Compact session rows:** Each row shows date, `weight × reps × sets` summary, e1RM, RPE, deload tag
9. **"View all X sessions →" link** at bottom, loads more when tapped

The screen should load the active program to determine the program filter date. Use `getActiveProgram` to get `activated_date` and `definition.program.blocks` for the band colors.

Refer to the mockup `docs/mockups/progress-screen-v2.html` (Lift Detail View section) for exact layout.

**Step 2: Run the full test suite**

Run: `npx jest --no-coverage`
Expected: ALL PASS (no component tests exist for this screen currently, so this validates no regressions)

**Step 3: Commit**

```bash
git add app/exercise/[id].tsx
git commit -m "feat: exercise detail — time range chips, compact sessions, block bands, view-all link"
```

---

### Task 12: All Exercises screen

**Files:**
- Create: `app/exercises.tsx`
- Modify: `app/(tabs)/progress.tsx` (fix "All Exercises" link to route to `/exercises`)

**Step 1: Create the All Exercises screen**

Create `app/exercises.tsx` as a modal screen:

- Header: "All Exercises" + close (×) button
- Load data via `getLoggedExercises()` and `getEstimated1RM()` + `get1RMHistory()` for each
- Group exercises by muscle group using the `muscleGroups` field
- Each group: section header (muscle group name), then exercise rows
- Each row: exercise name (left), e1RM value + "lbs" (right), mini sparkline if history exists
- Tapping a row navigates to `/exercise/${id}`
- Uses `MUSCLE_GROUPS` from `src/data/exercise-library.ts` for group ordering
- Empty state if no exercises logged yet

Use `SparkLine` from `src/components/TrendLineChart` for the mini charts.

**Step 2: Fix the "All Exercises" link in progress.tsx**

In `app/(tabs)/progress.tsx`, change line 209:

```typescript
// Before:
onPress={() => router.push('/library')}
// After:
onPress={() => router.push('/exercises')}
```

**Step 3: Run the full test suite**

Run: `npx jest --no-coverage`
Expected: ALL PASS

**Step 4: Commit**

```bash
git add app/exercises.tsx app/(tabs)/progress.tsx
git commit -m "feat: add All Exercises screen grouped by muscle group, fix progress link"
```

---

### Task 13: Progress Screen — Training Consistency section

**Files:**
- Modify: `app/(tabs)/progress.tsx`

**Step 1: Add Training Consistency section**

Add below the volume chart section. Key implementation:

1. Import `getTrainingConsistency`, `getAllTimeConsistency` from `src/db`
2. Import `ProgressBar` from `src/components/ProgressBar`
3. Import `getTrainingDays` from `src/utils/program`
4. Add state: `consistencyData` (per-week) and `allTimeConsistency` (per-program)
5. In `loadData`, calculate `trainingDaysPerWeek` from the program definition using `getTrainingDays(definition.program.weekly_template).length`
6. Load consistency data based on `timeRange`:
   - `'program'`: call `getTrainingConsistency(program.id, trainingDaysPerWeek)`
   - `'all'`: call `getAllTimeConsistency(trainingDaysPerWeek)`

**This Program view:**
- Section header: "TRAINING CONSISTENCY"
- Overall line: `${percentage}% — ${total completed}/${total planned} sessions`
- Per-week `ProgressBar` components with color: green if completed === planned, amber if > 0, indigo if current week

**All Time view:**
- Per-program `ProgressBar` components with program name as label, showPercentage

**Step 2: Run the full test suite**

Run: `npx jest --no-coverage`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add app/(tabs)/progress.tsx
git commit -m "feat: add training consistency section to progress screen"
```

---

### Task 14: Progress Screen — Protocol Consistency section

**Files:**
- Modify: `app/(tabs)/progress.tsx`

**Step 1: Add Protocol Consistency section**

Add below Training Consistency. Key implementation:

1. Import `getProtocolConsistency` from `src/db`
2. Add state: `protocolData: ProtocolItem[]`
3. In `loadData`, call `getProtocolConsistency(timeRange === 'program' ? program.id : null)`
4. Render section with header "PROTOCOL CONSISTENCY"
5. For each item, render a `ProgressBar` with dynamic color:
   - `percentage >= 80` → `Colors.green`
   - `percentage >= 50` → `Colors.amber`
   - else → `Colors.textDim`

**Step 2: Run the full test suite**

Run: `npx jest --no-coverage`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add app/(tabs)/progress.tsx
git commit -m "feat: add protocol consistency section to progress screen"
```

---

### Task 15: Progress Screen — Volume Actual vs Planned

**Files:**
- Modify: `app/(tabs)/progress.tsx`

**Step 1: Update the volume chart**

Replace the simple bar chart with actual vs planned dual bars:

1. Import `getPlannedWeeklyVolume` from `src/db`
2. Import `getBlockColorMap` from `src/utils/blockColors`
3. Add state for `plannedVolume` and `blockColorMap`
4. In `loadData`, compute planned volume from program definition and build block color map
5. Render dual bars per week:
   - Background bar (planned): `Colors.surface` fill, full width based on max planned
   - Foreground bar (actual): colored by block name using `blockColorMap`
   - Week label below
6. For "All Time" view: group volumes by program, show program name header above each group

**Step 2: Run the full test suite**

Run: `npx jest --no-coverage`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add app/(tabs)/progress.tsx
git commit -m "feat: volume actual vs planned with dynamic block colors"
```

---

### Task 16: Progress Screen — Block bands on 1RM charts

**Files:**
- Modify: `app/(tabs)/progress.tsx`

**Step 1: Add block bands to top lift charts**

1. Use `get1RMHistoryWithBlocks` instead of `get1RMHistory` for loading lift data
2. Build bands array from the returned `blockName` field per data point — group consecutive points with same block into a single band
3. Pass `bands` prop to `TrendLineChart` for the top lift cards (no labels — too small)
4. Use `getBlockColorMuted` for band colors

Update the `LiftData` interface:

```typescript
interface LiftData {
  e1rm: Estimated1RM | null;
  history: E1RMHistoryPoint[]; // now includes blockName
}
```

Add a helper to build bands from history:

```typescript
function buildBands(history: E1RMHistoryPoint[], colorMap: Record<string, string>) {
  if (history.length === 0) return [];
  const bands: { startIndex: number; endIndex: number; label: string; color: string }[] = [];
  let current = { start: 0, block: history[0].blockName };

  for (let i = 1; i < history.length; i++) {
    if (history[i].blockName !== current.block) {
      bands.push({
        startIndex: current.start,
        endIndex: i - 1,
        label: current.block,
        color: getBlockColorMuted(colorMap[current.block] ?? Colors.indigo),
      });
      current = { start: i, block: history[i].blockName };
    }
  }
  bands.push({
    startIndex: current.start,
    endIndex: history.length - 1,
    label: current.block,
    color: getBlockColorMuted(colorMap[current.block] ?? Colors.indigo),
  });

  return bands;
}
```

**Step 2: Run the full test suite**

Run: `npx jest --no-coverage`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add app/(tabs)/progress.tsx
git commit -m "feat: add block background bands to 1RM trend charts"
```

---

### Task 17: Progress Screen — All Time view behavior

**Files:**
- Modify: `app/(tabs)/progress.tsx`

**Step 1: Make the time range toggle functional**

Currently `timeRange` state exists but doesn't affect data loading. Update `loadData` to respond to `timeRange`:

1. **1RM charts (All Time):** Call `get1RMHistoryWithBlocks` without `programId` filter, with higher limit (50). Add program boundary markers as dashed vertical lines on charts (use `getProgramBoundaries`).

2. **Volume (All Time):** Load volume data per program. For each program with status 'active' or 'completed', load `getWeeklyVolume(programId)` and `getPlannedWeeklyVolume(definition, durationWeeks)`. Render program name header above each group.

3. **Training Consistency:** Already handled in Task 13 — `getAllTimeConsistency` vs `getTrainingConsistency`.

4. **Protocol Consistency:** Already handled in Task 14 — null programId for All Time.

5. Make `loadData` depend on `timeRange` — add it to the `useCallback` dependency array and re-fetch on toggle.

**Step 2: Run the full test suite**

Run: `npx jest --no-coverage`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add app/(tabs)/progress.tsx
git commit -m "feat: make All Time toggle functional across all progress sections"
```

---

### Task 18: Final verification and cleanup

**Step 1: Run the full test suite**

Run: `npx jest --no-coverage`
Expected: ALL PASS

**Step 2: Visual verification**

Open the app in Expo Go or simulator. Check:
- Progress screen: all sections render, time range toggle works
- Exercise detail: time range chips filter data, compact sessions display correctly
- All Exercises: groups by muscle group, sparklines show, tapping navigates to detail
- Block bands visible on charts when data exists

**Step 3: Final commit (if any cleanup needed)**

```bash
git add -A
git commit -m "chore: cleanup progress/exercise detail implementation"
```
