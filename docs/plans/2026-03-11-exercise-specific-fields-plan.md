# Exercise-Specific Tracking Fields — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable exercises to declare which fields they track (weight, reps, distance, duration, time) so the UI, storage, and metrics adapt per exercise type.

**Architecture:** Add an `input_fields` JSON column to the `exercises` table that declares which fields an exercise tracks. Widen `set_logs` with real columns for distance, duration, and time. A shared `InputField` type maps field types to column names, units, and UI behavior. All screens read `input_fields` to decide which columns to render.

**Tech Stack:** TypeScript, SQLite (expo-sqlite), React Native, Jest

**Design doc:** `docs/plans/2026-03-11-exercise-specific-fields-design.md`
**Mockups:** `docs/mockups/exercise-fields-option-a-2026-03-11.html`

---

### Task 1: Define the InputField type system

**Files:**
- Create: `src/types/fields.ts`
- Test: `__tests__/utils/fields.test.ts`

**Step 1: Write the failing test**

Create `__tests__/utils/fields.test.ts`:

```typescript
/**
 * Tests for the InputField type system and helper utilities.
 */
import {
  InputField,
  FieldType,
  FIELD_PROFILES,
  getFieldsForExercise,
  getTargetColumn,
  getActualColumn,
} from '../../src/types/fields';

describe('InputField type system', () => {
  describe('FIELD_PROFILES', () => {
    it('defines weight_reps as the default profile', () => {
      expect(FIELD_PROFILES.weight_reps).toEqual([
        { type: 'weight', unit: 'lbs' },
        { type: 'reps', unit: undefined },
      ]);
    });

    it('defines reps_only profile', () => {
      expect(FIELD_PROFILES.reps_only).toEqual([
        { type: 'reps', unit: undefined },
      ]);
    });

    it('defines weight_distance profile', () => {
      expect(FIELD_PROFILES.weight_distance).toEqual([
        { type: 'weight', unit: 'lbs' },
        { type: 'distance', unit: 'm' },
      ]);
    });

    it('defines distance_time profile', () => {
      expect(FIELD_PROFILES.distance_time).toEqual([
        { type: 'distance', unit: 'm' },
        { type: 'time', unit: 'm:ss' },
      ]);
    });

    it('defines duration profile', () => {
      expect(FIELD_PROFILES.duration).toEqual([
        { type: 'duration', unit: 'sec' },
      ]);
    });
  });

  describe('getFieldsForExercise', () => {
    it('returns weight_reps when input_fields is null', () => {
      const fields = getFieldsForExercise(null);
      expect(fields).toEqual(FIELD_PROFILES.weight_reps);
    });

    it('returns weight_reps when input_fields is undefined', () => {
      const fields = getFieldsForExercise(undefined);
      expect(fields).toEqual(FIELD_PROFILES.weight_reps);
    });

    it('returns parsed input_fields when provided as JSON string', () => {
      const json = JSON.stringify([{ type: 'duration', unit: 'sec' }]);
      const fields = getFieldsForExercise(json);
      expect(fields).toEqual([{ type: 'duration', unit: 'sec' }]);
    });

    it('returns input_fields when provided as array', () => {
      const arr: InputField[] = [{ type: 'weight', unit: 'lbs' }, { type: 'distance', unit: 'm' }];
      const fields = getFieldsForExercise(arr);
      expect(fields).toEqual(arr);
    });
  });

  describe('column mapping', () => {
    it('maps weight to target_weight / actual_weight', () => {
      expect(getTargetColumn('weight')).toBe('target_weight');
      expect(getActualColumn('weight')).toBe('actual_weight');
    });

    it('maps reps to target_reps / actual_reps', () => {
      expect(getTargetColumn('reps')).toBe('target_reps');
      expect(getActualColumn('reps')).toBe('actual_reps');
    });

    it('maps distance to target_distance / actual_distance', () => {
      expect(getTargetColumn('distance')).toBe('target_distance');
      expect(getActualColumn('distance')).toBe('actual_distance');
    });

    it('maps duration to target_duration / actual_duration', () => {
      expect(getTargetColumn('duration')).toBe('target_duration');
      expect(getActualColumn('duration')).toBe('actual_duration');
    });

    it('maps time to target_time / actual_time', () => {
      expect(getTargetColumn('time')).toBe('target_time');
      expect(getActualColumn('time')).toBe('actual_time');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/utils/fields.test.ts --no-coverage`
Expected: FAIL — module not found

**Step 3: Write the implementation**

Create `src/types/fields.ts`:

```typescript
/**
 * APEX — Exercise Input Field Type System
 *
 * Defines which fields an exercise tracks (weight, reps, distance, etc.)
 * and maps them to database columns, UI labels, and units.
 */

export type FieldType = 'weight' | 'reps' | 'distance' | 'duration' | 'time';

export interface InputField {
  type: FieldType;
  unit?: string; // 'lbs', 'kg', 'm', 'yd', 'sec', 'm:ss'
}

export type FieldProfile = 'weight_reps' | 'reps_only' | 'weight_distance' | 'distance_time' | 'duration';

/** Pre-defined field combinations for common exercise types */
export const FIELD_PROFILES: Record<FieldProfile, InputField[]> = {
  weight_reps: [
    { type: 'weight', unit: 'lbs' },
    { type: 'reps', unit: undefined },
  ],
  reps_only: [
    { type: 'reps', unit: undefined },
  ],
  weight_distance: [
    { type: 'weight', unit: 'lbs' },
    { type: 'distance', unit: 'm' },
  ],
  distance_time: [
    { type: 'distance', unit: 'm' },
    { type: 'time', unit: 'm:ss' },
  ],
  duration: [
    { type: 'duration', unit: 'sec' },
  ],
};

/** Default fields when an exercise has no input_fields declared */
const DEFAULT_FIELDS = FIELD_PROFILES.weight_reps;

/**
 * Get the input fields for an exercise.
 * Accepts null/undefined (returns default), a JSON string, or an array.
 */
export function getFieldsForExercise(inputFields: string | InputField[] | null | undefined): InputField[] {
  if (inputFields == null) return DEFAULT_FIELDS;
  if (Array.isArray(inputFields)) return inputFields;
  try {
    return JSON.parse(inputFields);
  } catch {
    return DEFAULT_FIELDS;
  }
}

/** Map a field type to its target column name in set_logs */
export function getTargetColumn(fieldType: FieldType): string {
  return `target_${fieldType}`;
}

/** Map a field type to its actual column name in set_logs */
export function getActualColumn(fieldType: FieldType): string {
  return `actual_${fieldType}`;
}

/** UI display labels for each field type */
export const FIELD_LABELS: Record<FieldType, string> = {
  weight: 'Weight',
  reps: 'Reps',
  distance: 'Distance',
  duration: 'Duration',
  time: 'Time',
};

/** Increment/decrement step sizes for the AdjustModal */
export const FIELD_STEPS: Record<FieldType, number> = {
  weight: 5,
  reps: 1,
  distance: 5,
  duration: 5,
  time: 5, // seconds
};

/** Keyboard type for each field */
export const FIELD_KEYBOARD: Record<FieldType, 'decimal-pad' | 'number-pad'> = {
  weight: 'decimal-pad',
  reps: 'number-pad',
  distance: 'decimal-pad',
  duration: 'number-pad',
  time: 'number-pad',
};

/**
 * Check whether an exercise supports e1RM calculation.
 * Requires both weight and reps fields.
 */
export function supportsE1RM(fields: InputField[]): boolean {
  const types = fields.map(f => f.type);
  return types.includes('weight') && types.includes('reps');
}
```

**Step 4: Run test to verify it passes**

Run: `npx jest __tests__/utils/fields.test.ts --no-coverage`
Expected: PASS

**Step 5: Commit**

```bash
git add src/types/fields.ts __tests__/utils/fields.test.ts
git commit -m "feat: add InputField type system with profiles and column mapping (#27)"
```

---

### Task 2: Update database schema — add new columns to set_logs and exercises

**Files:**
- Modify: `src/db/schema.ts` (lines 6, 23-30, 57-73)
- Test: `__tests__/db/sessions.test.ts`

**Step 1: Write the failing test**

Add to `__tests__/db/sessions.test.ts`:

```typescript
describe('logSet with extended fields', () => {
  it('inserts target_distance and actual_distance when provided', async () => {
    await logSet({
      sessionId: 'session-1',
      exerciseId: 'farmers_carries',
      setNumber: 1,
      targetWeight: 70,
      targetReps: 0,
      targetDistance: 40,
      actualWeight: 70,
      actualReps: 0,
      actualDistance: 40,
      status: 'completed',
    });

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('target_distance'),
      expect.arrayContaining([40, 40])
    );
  });

  it('inserts target_duration and actual_duration when provided', async () => {
    await logSet({
      sessionId: 'session-1',
      exerciseId: 'plank',
      setNumber: 1,
      targetDuration: 45,
      actualDuration: 45,
      status: 'completed',
    });

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('target_duration'),
      expect.arrayContaining([45, 45])
    );
  });

  it('inserts target_time and actual_time when provided', async () => {
    await logSet({
      sessionId: 'session-1',
      exerciseId: 'ski_erg',
      setNumber: 1,
      targetDistance: 500,
      actualDistance: 500,
      actualTime: 108, // 1:48 in seconds
      status: 'completed',
    });

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('target_time'),
      expect.arrayContaining([500, 108])
    );
  });
});

describe('updateSet with extended fields', () => {
  it('updates actual_distance', async () => {
    await updateSet('set-1', { actualDistance: 50 });
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('actual_distance'),
      expect.arrayContaining([50, 'set-1'])
    );
  });

  it('updates actual_duration', async () => {
    await updateSet('set-1', { actualDuration: 60 });
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('actual_duration'),
      expect.arrayContaining([60, 'set-1'])
    );
  });

  it('updates actual_time', async () => {
    await updateSet('set-1', { actualTime: 95 });
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('actual_time'),
      expect.arrayContaining([95, 'set-1'])
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/db/sessions.test.ts --no-coverage`
Expected: FAIL — logSet does not accept targetDistance etc.

**Step 3: Update schema and DB functions**

Modify `src/db/schema.ts`:

1. Bump `SCHEMA_VERSION` from 6 to 7
2. Add `input_fields TEXT` to the `exercises` table
3. Add new columns to `set_logs`: `target_distance`, `actual_distance`, `target_duration`, `actual_duration`, `target_time`, `actual_time`

Update the `exercises` table (line 23-30):
```sql
CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  muscle_groups TEXT NOT NULL DEFAULT '[]',
  alternatives TEXT NOT NULL DEFAULT '[]',
  input_fields TEXT,
  is_sample INTEGER DEFAULT 0
);
```

Update the `set_logs` table (lines 57-73):
```sql
CREATE TABLE IF NOT EXISTS set_logs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  target_weight REAL,
  target_reps INTEGER,
  actual_weight REAL,
  actual_reps INTEGER,
  target_distance REAL,
  actual_distance REAL,
  target_duration REAL,
  actual_duration REAL,
  target_time REAL,
  actual_time REAL,
  rpe REAL,
  status TEXT NOT NULL DEFAULT 'pending',
  timestamp TEXT,
  is_adhoc INTEGER DEFAULT 0,
  is_sample INTEGER DEFAULT 0,
  FOREIGN KEY (session_id) REFERENCES sessions(id),
  FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);
```

Modify `src/types/training.ts` — update the `SetLog` interface (lines 47-60):
```typescript
export interface SetLog {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  target_weight?: number;
  target_reps?: number;
  actual_weight?: number;
  actual_reps?: number;
  target_distance?: number;
  actual_distance?: number;
  target_duration?: number;
  actual_duration?: number;
  target_time?: number;
  actual_time?: number;
  rpe?: number;
  status: 'pending' | 'completed' | 'completed_below' | 'skipped';
  timestamp?: string;
  is_adhoc?: boolean;
}
```

Also update the `Exercise` interface (lines 18-24):
```typescript
export interface Exercise {
  id: string;
  name: string;
  type: string;
  muscle_groups: string;
  alternatives: string;
  input_fields?: string; // JSON array of InputField[]
}
```

Modify `src/db/sessions.ts` — update `logSet` (lines 73-106) to accept and insert the new fields:

```typescript
export async function logSet(params: {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  targetWeight?: number;
  targetReps?: number;
  actualWeight?: number;
  actualReps?: number;
  targetDistance?: number;
  actualDistance?: number;
  targetDuration?: number;
  actualDuration?: number;
  targetTime?: number;
  actualTime?: number;
  rpe?: number;
  status: SetLog['status'];
  isAdhoc?: boolean;
}): Promise<string> {
  const db = await getDatabase();
  const id = generateId();

  await db.runAsync(
    `INSERT INTO set_logs
     (id, session_id, exercise_id, set_number,
      target_weight, target_reps, actual_weight, actual_reps,
      target_distance, actual_distance, target_duration, actual_duration,
      target_time, actual_time,
      rpe, status, timestamp, is_adhoc)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, params.sessionId, params.exerciseId, params.setNumber,
      params.targetWeight ?? null, params.targetReps ?? null,
      params.actualWeight ?? params.targetWeight ?? null,
      params.actualReps ?? params.targetReps ?? null,
      params.targetDistance ?? null, params.actualDistance ?? params.targetDistance ?? null,
      params.targetDuration ?? null, params.actualDuration ?? params.targetDuration ?? null,
      params.targetTime ?? null, params.actualTime ?? params.targetTime ?? null,
      params.rpe ?? null,
      params.status,
      new Date().toISOString(),
      params.isAdhoc ? 1 : 0,
    ]
  );

  return id;
}
```

Update `updateSet` (lines 109-129) to support new fields:

```typescript
export async function updateSet(
  setId: string,
  updates: {
    actualWeight?: number;
    actualReps?: number;
    actualDistance?: number;
    actualDuration?: number;
    actualTime?: number;
    rpe?: number;
    status?: SetLog['status'];
  }
): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: (number | string | null)[] = [];

  if (updates.actualWeight !== undefined) { fields.push('actual_weight = ?'); values.push(updates.actualWeight); }
  if (updates.actualReps !== undefined) { fields.push('actual_reps = ?'); values.push(updates.actualReps); }
  if (updates.actualDistance !== undefined) { fields.push('actual_distance = ?'); values.push(updates.actualDistance); }
  if (updates.actualDuration !== undefined) { fields.push('actual_duration = ?'); values.push(updates.actualDuration); }
  if (updates.actualTime !== undefined) { fields.push('actual_time = ?'); values.push(updates.actualTime); }
  if (updates.rpe !== undefined) { fields.push('rpe = ?'); values.push(updates.rpe); }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }

  if (fields.length === 0) return;
  values.push(setId);

  await db.runAsync(
    `UPDATE set_logs SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npx jest __tests__/db/sessions.test.ts --no-coverage`
Expected: PASS

**Step 5: Run full test suite to check for regressions**

Run: `npx jest --no-coverage`
Expected: All existing tests still pass. Fix any callers of `logSet` that relied on `targetWeight`/`targetReps` being required.

**Step 6: Commit**

```bash
git add src/db/schema.ts src/db/sessions.ts src/types/training.ts __tests__/db/sessions.test.ts
git commit -m "feat: add distance/duration/time columns to set_logs and input_fields to exercises (#27)"
```

---

### Task 3: Update program types and exercise definitions

**Files:**
- Modify: `src/types/program.ts` (lines 59-75, 83-90)
- Modify: `src/data/exercise-library.ts` (lines 6-11)
- Test: `__tests__/utils/fields.test.ts` (add integration tests)

**Step 1: Write the failing test**

Add to `__tests__/utils/fields.test.ts`:

```typescript
import { EXERCISE_LIBRARY } from '../../src/data/exercise-library';

describe('exercise library input_fields', () => {
  it('library exercises that are conditioning type have input_fields defined', () => {
    const conditioning = EXERCISE_LIBRARY.filter(e => e.type === 'conditioning');
    for (const ex of conditioning) {
      expect(ex.inputFields).toBeDefined();
    }
  });

  it('main/accessory exercises default to weight_reps when no inputFields', () => {
    const mainExercise = EXERCISE_LIBRARY.find(e => e.id === 'bench_press');
    expect(mainExercise?.inputFields).toBeUndefined();
    // getFieldsForExercise handles the default
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/utils/fields.test.ts --no-coverage`
Expected: FAIL — inputFields property does not exist on LibraryExercise

**Step 3: Update types and library**

Modify `src/types/program.ts` — add `input_fields` to `ExerciseDefinition` (lines 83-90):

```typescript
import type { InputField } from './fields';

export interface ExerciseDefinition {
  id: string;
  name: string;
  type: 'main' | 'power' | 'accessory' | 'conditioning' | 'movement' | 'core';
  muscle_groups: string[];
  alternatives?: string[];
  uses_1rm?: boolean;
  input_fields?: InputField[];
}
```

Add `values` to `ExerciseTarget` (lines 68-75):

```typescript
export interface ExerciseTarget {
  weeks: number[];
  sets: number;
  reps?: number | string;
  percent?: number | string;
  rpe_target?: string;
  notes?: string;
  /** Target values for non-standard fields: { distance: 40, duration: 45 } */
  values?: Record<string, number>;
}
```

Modify `src/data/exercise-library.ts` — add `inputFields` to the type and relevant exercises:

```typescript
import type { InputField } from '../types/fields';

export type LibraryExercise = {
  id: string;
  name: string;
  muscleGroup: string;
  type: 'main' | 'accessory' | 'core' | 'conditioning';
  inputFields?: InputField[];
};
```

Then add `inputFields` to specific library exercises. For example:
- `farmers_carries` → `[{ type: 'weight', unit: 'lbs' }, { type: 'distance', unit: 'm' }]`
- `sled_push` → `[{ type: 'weight', unit: 'lbs' }, { type: 'distance', unit: 'm' }]`
- `plank` → `[{ type: 'duration', unit: 'sec' }]`
- `dead_hang` → `[{ type: 'duration', unit: 'sec' }]`
- Any erg exercises → `[{ type: 'distance', unit: 'm' }, { type: 'time', unit: 'm:ss' }]`
- Bodyweight exercises (pull_ups, push_ups, dips) → `[{ type: 'reps' }]`

Exercises without `inputFields` continue defaulting to weight + reps via `getFieldsForExercise()`.

**Step 4: Run test to verify it passes**

Run: `npx jest __tests__/utils/fields.test.ts --no-coverage`
Expected: PASS

**Step 5: Run full test suite**

Run: `npx jest --no-coverage`
Expected: PASS (ExerciseTarget.reps is now optional — check all callers)

**Step 6: Commit**

```bash
git add src/types/program.ts src/data/exercise-library.ts __tests__/utils/fields.test.ts
git commit -m "feat: add input_fields to exercise definitions and library (#27)"
```

---

### Task 4: Update SetState and useWorkoutSession to support flexible fields

**Files:**
- Modify: `src/components/ExerciseCard.tsx` (lines 6-15 — SetState interface)
- Modify: `src/hooks/useWorkoutSession.ts` (lines 31-40, 445-452, 469-517)
- Test: `__tests__/hooks/useWorkoutSession.test.ts`

**Step 1: Write the failing test**

Add to `__tests__/hooks/useWorkoutSession.test.ts`:

```typescript
describe('set state with extended fields', () => {
  it('initializes sets with distance targets for carry exercises', () => {
    // Test that when an exercise has input_fields with distance,
    // the created SetState includes targetDistance and actualDistance
    // This test depends on how the hook creates sets from targets
  });

  it('completeSetAction fills actual values from targets for all field types', () => {
    // Test that one-tap complete fills actualDistance from targetDistance, etc.
  });
});
```

Note: The exact test shape depends on how the hook is structured. Read `__tests__/hooks/useWorkoutSession.test.ts` to match the existing test patterns before writing these tests.

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/hooks/useWorkoutSession.test.ts --no-coverage`

**Step 3: Update SetState and hook logic**

Update `SetState` in `src/components/ExerciseCard.tsx` (lines 6-15):

```typescript
export interface SetState {
  setNumber: number;
  targetWeight?: number;
  targetReps?: number;
  actualWeight?: number;
  actualReps?: number;
  targetDistance?: number;
  actualDistance?: number;
  targetDuration?: number;
  actualDuration?: number;
  targetTime?: number;
  actualTime?: number;
  rpe?: number;
  status: SetLog['status'];
  id?: string;
}
```

Update `useWorkoutSession.ts`:

1. **Set creation** (around line 445-452): When building `SetState[]` from targets, read the exercise's `input_fields` and populate the appropriate target/actual fields. For exercises with `values` in their target, use those. For weight/reps, continue using the existing percent-based calculation.

2. **completeSetAction** (around line 469-517): When completing a set, fill all `actual_*` fields from their `target_*` counterparts (not just weight/reps).

3. **logSet calls**: Update all `logSet()` invocations to pass the new fields from SetState.

**Step 4: Run test to verify it passes**

Run: `npx jest __tests__/hooks/useWorkoutSession.test.ts --no-coverage`
Expected: PASS

**Step 5: Run full test suite**

Run: `npx jest --no-coverage`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/ExerciseCard.tsx src/hooks/useWorkoutSession.ts __tests__/hooks/useWorkoutSession.test.ts
git commit -m "feat: extend SetState and workout session hook for flexible fields (#27)"
```

---

### Task 5: Update ExerciseCard to render dynamic columns

**Files:**
- Modify: `src/components/ExerciseCard.tsx` (lines 36-212)
- Test: `__tests__/components/ExerciseCard.test.tsx`

**Step 1: Write the failing test**

Add to `__tests__/components/ExerciseCard.test.tsx`:

```typescript
import { FIELD_PROFILES } from '../../src/types/fields';

describe('ExerciseCard with input_fields', () => {
  it('renders Weight and Reps headers for weight_reps exercises', () => {
    render(<ExerciseCard {...defaultProps} expanded={true} inputFields={FIELD_PROFILES.weight_reps} />);
    expect(screen.getByText('Weight')).toBeTruthy();
    expect(screen.getByText('Reps')).toBeTruthy();
  });

  it('renders only Reps header for reps_only exercises', () => {
    const repsSets = makeSets(3, 'pending');
    render(<ExerciseCard {...defaultProps} expanded={true} sets={repsSets} inputFields={FIELD_PROFILES.reps_only} />);
    expect(screen.getByText('Reps')).toBeTruthy();
    expect(screen.queryByText('Weight')).toBeNull();
  });

  it('renders Weight and Distance headers for weight_distance exercises', () => {
    render(<ExerciseCard {...defaultProps} expanded={true} inputFields={FIELD_PROFILES.weight_distance} />);
    expect(screen.getByText('Weight')).toBeTruthy();
    expect(screen.getByText('Distance')).toBeTruthy();
    expect(screen.queryByText('Reps')).toBeNull();
  });

  it('renders Distance and Time headers for distance_time exercises', () => {
    render(<ExerciseCard {...defaultProps} expanded={true} inputFields={FIELD_PROFILES.distance_time} />);
    expect(screen.getByText('Distance')).toBeTruthy();
    expect(screen.getByText('Time')).toBeTruthy();
  });

  it('renders Duration header for duration exercises', () => {
    render(<ExerciseCard {...defaultProps} expanded={true} inputFields={FIELD_PROFILES.duration} />);
    expect(screen.getByText('Duration')).toBeTruthy();
    expect(screen.queryByText('Weight')).toBeNull();
    expect(screen.queryByText('Reps')).toBeNull();
  });

  it('shows unit under column header', () => {
    render(<ExerciseCard {...defaultProps} expanded={true} inputFields={FIELD_PROFILES.weight_distance} />);
    expect(screen.getByText('lbs')).toBeTruthy();
    expect(screen.getByText('m')).toBeTruthy();
  });

  it('defaults to weight_reps when inputFields not provided', () => {
    render(<ExerciseCard {...defaultProps} expanded={true} />);
    expect(screen.getByText('Weight')).toBeTruthy();
    expect(screen.getByText('Reps')).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/components/ExerciseCard.test.tsx --no-coverage`
Expected: FAIL — inputFields prop not recognized

**Step 3: Update ExerciseCard**

Add `inputFields` prop to `ExerciseCardProps`:

```typescript
import { InputField, FIELD_PROFILES, FIELD_LABELS, getFieldsForExercise } from '../types/fields';

export interface ExerciseCardProps {
  // ... existing props ...
  inputFields?: InputField[];
}
```

Replace the hardcoded set header (lines 91-96) with dynamic rendering:

```typescript
const fields = inputFields ?? FIELD_PROFILES.weight_reps;

{/* Set header */}
<View style={styles.setHeader}>
  <Text style={styles.setHeaderText}>Set</Text>
  {fields.map((field, i) => (
    <View key={field.type} style={styles.setHeaderCol}>
      <Text style={styles.setHeaderText}>{FIELD_LABELS[field.type]}</Text>
      {field.unit && <Text style={styles.setHeaderUnit}>{field.unit}</Text>}
    </View>
  ))}
  <Text style={styles.setHeaderText}>{''}</Text>
</View>
```

Replace the hardcoded weight/reps columns in set rows (lines 119-138) with dynamic value rendering. Each field reads from the corresponding property on `SetState`:

```typescript
{fields.map((field) => {
  const targetKey = `target${field.type.charAt(0).toUpperCase() + field.type.slice(1)}` as keyof SetState;
  const actualKey = `actual${field.type.charAt(0).toUpperCase() + field.type.slice(1)}` as keyof SetState;
  const value = (set[actualKey] ?? set[targetKey] ?? '—') as number | string;

  return (
    <Text
      key={field.type}
      style={[
        styles.setWeight, // reuse existing value style
        isCompleted && styles.setValueCompleted,
        isFuture && styles.setValueFuture,
      ]}
      onPress={() => onLongPressSet(setIdx)}
    >
      {value}
    </Text>
  );
})}
```

Add the new styles for unit text:

```typescript
setHeaderCol: {
  flex: 1,
  flexDirection: 'column' as const,
  gap: 1,
},
setHeaderUnit: {
  color: Colors.textDim,
  fontSize: 9,
  fontWeight: '600' as const,
},
```

**Step 4: Run test to verify it passes**

Run: `npx jest __tests__/components/ExerciseCard.test.tsx --no-coverage`
Expected: PASS

**Step 5: Run full test suite**

Run: `npx jest --no-coverage`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/ExerciseCard.tsx __tests__/components/ExerciseCard.test.tsx
git commit -m "feat: render dynamic columns in ExerciseCard based on input_fields (#27)"
```

---

### Task 6: Update AdjustModal to support all field types

**Files:**
- Modify: `src/components/AdjustModal.tsx`
- Test: `__tests__/components/AdjustModal.test.tsx`

**Step 1: Write the failing test**

Add to `__tests__/components/AdjustModal.test.tsx`:

```typescript
describe('AdjustModal with field types', () => {
  it('renders fields based on inputFields prop', () => {
    const fields = [{ type: 'weight' as const, unit: 'lbs' }, { type: 'distance' as const, unit: 'm' }];
    render(
      <AdjustModal
        visible={true}
        values={{ weight: 70, distance: 40 }}
        inputFields={fields}
        blockColor="#6366f1"
        onValueChange={jest.fn()}
        onSave={jest.fn()}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText('Weight (lbs)')).toBeTruthy();
    expect(screen.getByText('Distance (m)')).toBeTruthy();
  });

  it('renders only duration for duration exercises', () => {
    const fields = [{ type: 'duration' as const, unit: 'sec' }];
    render(
      <AdjustModal
        visible={true}
        values={{ duration: 45 }}
        inputFields={fields}
        blockColor="#6366f1"
        onValueChange={jest.fn()}
        onSave={jest.fn()}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText('Duration (sec)')).toBeTruthy();
    expect(screen.queryByText('Weight')).toBeNull();
  });

  it('uses correct step sizes per field type', () => {
    const fields = [{ type: 'weight' as const, unit: 'lbs' }];
    render(
      <AdjustModal
        visible={true}
        values={{ weight: 100 }}
        inputFields={fields}
        blockColor="#6366f1"
        onValueChange={jest.fn()}
        onSave={jest.fn()}
        onClose={jest.fn()}
      />
    );
    // Weight uses ±5
    expect(screen.getByText('-5')).toBeTruthy();
    expect(screen.getByText('+5')).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/components/AdjustModal.test.tsx --no-coverage`
Expected: FAIL — new props not recognized

**Step 3: Rewrite AdjustModal to be field-driven**

Replace the hardcoded weight/reps UI with a dynamic loop over `inputFields`. The new props interface:

```typescript
import { InputField, FIELD_LABELS, FIELD_STEPS, FIELD_KEYBOARD, FIELD_PROFILES } from '../types/fields';

export interface AdjustModalProps {
  visible: boolean;
  values: Record<string, number>;
  inputFields: InputField[];
  blockColor: string;
  onValueChange: (fieldType: string, value: number) => void;
  onSave: () => void;
  onClose: () => void;
  onApplyToAll?: () => void;
}
```

Render each field dynamically:

```typescript
{inputFields.map((field) => (
  <View key={field.type}>
    <Text style={styles.label}>
      {FIELD_LABELS[field.type]}{field.unit ? ` (${field.unit})` : ''}
    </Text>
    <View style={styles.adjustRow}>
      <TouchableOpacity
        style={styles.adjustButton}
        onPress={() => onValueChange(field.type, Math.max(0, (values[field.type] ?? 0) - FIELD_STEPS[field.type]))}
      >
        <Text style={styles.adjustButtonText}>-{FIELD_STEPS[field.type]}</Text>
      </TouchableOpacity>
      <TextInput
        testID={`${field.type}-input`}
        style={styles.adjustValue}
        value={String(values[field.type] ?? 0)}
        keyboardType={FIELD_KEYBOARD[field.type]}
        selectTextOnFocus
        onChangeText={(text) => {
          const parsed = parseFloat(text);
          if (!isNaN(parsed)) onValueChange(field.type, Math.max(0, parsed));
        }}
      />
      <TouchableOpacity
        style={styles.adjustButton}
        onPress={() => onValueChange(field.type, (values[field.type] ?? 0) + FIELD_STEPS[field.type])}
      >
        <Text style={styles.adjustButtonText}>+{FIELD_STEPS[field.type]}</Text>
      </TouchableOpacity>
    </View>
  </View>
))}
```

**Step 4: Update all callers of AdjustModal**

The main caller is in `app/(tabs)/workout.tsx` via the `openOverride` flow in `useWorkoutSession`. Update the override state and handler to pass `inputFields` and use the new `values`/`onValueChange` API instead of separate `weight`/`reps` props.

**Step 5: Run test to verify it passes**

Run: `npx jest __tests__/components/AdjustModal.test.tsx --no-coverage`
Expected: PASS

**Step 6: Run full test suite**

Run: `npx jest --no-coverage`
Expected: PASS

**Step 7: Commit**

```bash
git add src/components/AdjustModal.tsx __tests__/components/AdjustModal.test.tsx app/\(tabs\)/workout.tsx src/hooks/useWorkoutSession.ts
git commit -m "feat: make AdjustModal field-driven for all exercise types (#27)"
```

---

### Task 7: Update Session Detail page

**Files:**
- Modify: `app/session/[id].tsx`
- Modify: `src/db/sessions.ts` — update queries to return new columns and `input_fields`

**Step 1: Read the current session detail implementation**

Read `app/session/[id].tsx` to understand the current rendering. The key change: when displaying set logs grouped by exercise, read the exercise's `input_fields` and render the appropriate columns — same pattern as ExerciseCard.

**Step 2: Update the query**

In `src/db/sessions.ts`, update `getSetLogsForSession` (or equivalent) to also return the new columns. Update `getExerciseNames` or the join query to include `exercises.input_fields`.

**Step 3: Update the session detail rendering**

Replace hardcoded "Weight / Reps" columns with dynamic columns based on each exercise's `input_fields`. Use `getFieldsForExercise()` and `FIELD_LABELS` for consistency.

**Step 4: Run full test suite**

Run: `npx jest --no-coverage`
Expected: PASS

**Step 5: Commit**

```bash
git add app/session/\[id\].tsx src/db/sessions.ts
git commit -m "feat: render dynamic columns in session detail based on input_fields (#27)"
```

---

### Task 8: Update Exercise Detail page and metrics

**Files:**
- Modify: `app/exercise/[id].tsx`
- Modify: `src/db/metrics.ts`
- Test: `__tests__/db/metrics.test.ts`

**Step 1: Write the failing test**

Add to `__tests__/db/metrics.test.ts`:

```typescript
describe('metrics for non-weight exercises', () => {
  it('returns null e1RM for reps-only exercises', () => {
    // An exercise with input_fields = reps_only should not calculate e1RM
  });

  it('calculates best duration for duration exercises', () => {
    // getExerciseBestMetric for a plank should return max actual_duration
  });

  it('calculates best time for distance_time exercises', () => {
    // getExerciseBestMetric for ski erg should return min actual_time
  });
});
```

**Step 2: Implement metric functions**

Add to `src/db/metrics.ts`:

```typescript
import { InputField, getFieldsForExercise, supportsE1RM } from '../types/fields';

/**
 * Get the primary metric for an exercise based on its field type.
 * Returns { value, label, unit } or null.
 */
export async function getExercisePrimaryMetric(
  exerciseId: string,
  inputFields: InputField[]
): Promise<{ value: number; label: string; unit?: string } | null> {
  if (supportsE1RM(inputFields)) {
    const e1rm = await getEstimated1RM(exerciseId);
    return e1rm ? { value: e1rm.value, label: 'Est. 1RM', unit: 'lbs' } : null;
  }

  const types = inputFields.map(f => f.type);

  if (types.includes('duration')) {
    // Best (longest) duration
    const result = await getBestValue(exerciseId, 'actual_duration');
    return result ? { value: result, label: 'Best', unit: 'sec' } : null;
  }

  if (types.includes('time')) {
    // Best (fastest) time
    const result = await getBestValue(exerciseId, 'actual_time', 'MIN');
    return result ? { value: result, label: 'Best Time', unit: 'sec' } : null;
  }

  if (types.includes('reps') && !types.includes('weight')) {
    // Best reps in a single set
    const result = await getBestValue(exerciseId, 'actual_reps');
    return result ? { value: result, label: 'Best', unit: 'reps' } : null;
  }

  return null;
}

async function getBestValue(
  exerciseId: string,
  column: string,
  agg: 'MAX' | 'MIN' = 'MAX'
): Promise<number | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ best: number }>(
    `SELECT ${agg}(${column}) as best FROM set_logs
     WHERE exercise_id = ? AND status IN ('completed', 'completed_below')
     AND ${column} IS NOT NULL`,
    [exerciseId]
  );
  return row?.best ?? null;
}
```

**Step 3: Update Exercise Detail page**

Modify `app/exercise/[id].tsx` to:
1. Fetch the exercise's `input_fields`
2. Use `getExercisePrimaryMetric()` for the headline metric
3. Adapt the set history table columns (same dynamic pattern as ExerciseCard)
4. Adapt the trend chart Y-axis label and data source

**Step 4: Run tests**

Run: `npx jest __tests__/db/metrics.test.ts --no-coverage`
Expected: PASS

Run: `npx jest --no-coverage`
Expected: PASS

**Step 5: Commit**

```bash
git add src/db/metrics.ts app/exercise/\[id\].tsx __tests__/db/metrics.test.ts
git commit -m "feat: add field-type-aware metrics and update exercise detail page (#27)"
```

---

### Task 9: Update PR detection for non-weight exercises

**Files:**
- Modify: `src/db/personal-records.ts`
- Test: `__tests__/db/personal-records.test.ts`

**Step 1: Write the failing test**

Add to `__tests__/db/personal-records.test.ts`:

```typescript
describe('PR detection for non-standard exercises', () => {
  it('skips e1RM PR for exercises without weight+reps', () => {
    // Plank exercise should not trigger e1RM PR detection
  });

  it('detects duration PR for duration exercises', () => {
    // Plank with actual_duration = 60 beating previous best of 45
  });

  it('detects time PR for distance_time exercises (lower is better)', () => {
    // Ski erg with actual_time = 100 beating previous best of 108
  });

  it('detects reps PR for reps-only exercises', () => {
    // Pull-ups with actual_reps = 15 beating previous best of 12
  });
});
```

**Step 2: Update detectPRs**

Modify `src/db/personal-records.ts` `detectPRs()` to:
1. Accept `inputFields` parameter (or look up from exercise)
2. Only check e1RM/rep PRs for exercises with weight+reps
3. Check duration PRs for duration exercises (higher is better)
4. Check time PRs for time exercises (lower is better)
5. Check reps PRs for reps-only exercises

Add new `record_type` values: `'best_duration'`, `'best_time'`, `'best_reps'`.

**Step 3: Run tests**

Run: `npx jest __tests__/db/personal-records.test.ts --no-coverage`
Expected: PASS

**Step 4: Commit**

```bash
git add src/db/personal-records.ts __tests__/db/personal-records.test.ts
git commit -m "feat: extend PR detection for duration, time, and reps-only exercises (#27)"
```

---

### Task 10: Update Progress screen

**Files:**
- Modify: `app/(tabs)/progress.tsx`

**Step 1: Read current implementation**

Read `app/(tabs)/progress.tsx` to understand how lift cards are rendered and which exercises are shown.

**Step 2: Update lift cards**

Currently `TOP_LIFTS` and `COMPACT_LIFTS` are hardcoded lists that assume e1RM. Update the progress screen to:
1. Fetch each exercise's `input_fields` from the DB
2. Use `getExercisePrimaryMetric()` to get the right metric per exercise
3. Display the appropriate label and unit (e.g., "Best: 45 sec" for plank instead of "Est. 1RM: 225 lbs")
4. For exercises without e1RM, skip the trend line chart or show an appropriate alternative (best value over time)

**Step 3: Run full test suite**

Run: `npx jest --no-coverage`
Expected: PASS

**Step 4: Commit**

```bash
git add app/\(tabs\)/progress.tsx
git commit -m "feat: adapt progress screen to show field-appropriate metrics (#27)"
```

---

### Task 11: Update seed data program with input_fields

**Files:**
- Modify: `src/db/seed.ts`
- Modify: `src/db/sessions.ts` — update `ensureExerciseExists` to store `input_fields`
- Test: `__tests__/db/seed.test.ts`

**Step 1: Update ensureExerciseExists**

In `src/db/sessions.ts`, update the function that upserts exercises to also write `input_fields`:

```typescript
export async function ensureExerciseExists(exercise: {
  id: string;
  name: string;
  type: string;
  muscleGroups?: string[];
  alternatives?: string[];
  inputFields?: InputField[];
}): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO exercises (id, name, type, muscle_groups, alternatives, input_fields)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      exercise.id, exercise.name, exercise.type,
      JSON.stringify(exercise.muscleGroups ?? []),
      JSON.stringify(exercise.alternatives ?? []),
      exercise.inputFields ? JSON.stringify(exercise.inputFields) : null,
    ]
  );
}
```

**Step 2: Update seed data**

In `src/db/seed.ts`, add `input_fields` to exercise definitions that need them (conditioning exercises, bodyweight exercises, etc.).

**Step 3: Run tests**

Run: `npx jest __tests__/db/seed.test.ts --no-coverage`
Expected: PASS

Run: `npx jest --no-coverage`
Expected: PASS

**Step 4: Commit**

```bash
git add src/db/seed.ts src/db/sessions.ts __tests__/db/seed.test.ts
git commit -m "feat: store input_fields when importing exercises and update seed data (#27)"
```

---

### Task 12: Wire inputFields through workout.tsx

**Files:**
- Modify: `app/(tabs)/workout.tsx` (lines 368-419)
- Modify: `src/hooks/useWorkoutSession.ts` — expose `inputFields` per exercise in state

**Step 1: Update exercise state in the hook**

In `useWorkoutSession.ts`, the `ExerciseState` (around line 31-40) needs to include `inputFields`. When loading exercises from the program definition, look up the exercise's `input_fields` and include it in the state.

**Step 2: Pass inputFields to ExerciseCard**

In `app/(tabs)/workout.tsx`, pass `inputFields={ex.inputFields}` to `<ExerciseCard>`.

**Step 3: Pass inputFields to AdjustModal**

When opening the adjust modal, pass the current exercise's `inputFields` so it renders the right fields.

**Step 4: Run full test suite**

Run: `npx jest --no-coverage`
Expected: PASS

**Step 5: Manual verification**

Build and run on device: `npm run device`
- Start a workout
- Verify standard exercises still show Weight/Reps
- If seed data has been updated with non-standard exercises, verify those render correctly

**Step 6: Commit**

```bash
git add app/\(tabs\)/workout.tsx src/hooks/useWorkoutSession.ts
git commit -m "feat: wire inputFields through workout screen to ExerciseCard and AdjustModal (#27)"
```

---

### Task 13: Final integration test and cleanup

**Step 1: Run full test suite**

Run: `npx jest --no-coverage`
Expected: ALL PASS

**Step 2: Check for TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Test on device**

Run: `npm run device`
Manual checks:
- [ ] Start workout — standard exercises show Weight/Reps columns
- [ ] Tap to complete a set — still fills values correctly
- [ ] Long-press to adjust — modal shows correct fields
- [ ] Session detail — shows correct columns per exercise
- [ ] Exercise detail — shows appropriate metric (e1RM vs best reps vs duration)
- [ ] Progress screen — lift cards show correct metrics
- [ ] Workout complete — PRs detected appropriately

**Step 4: Commit any final fixes**

```bash
git commit -m "fix: integration fixes for exercise-specific fields (#27)"
```
