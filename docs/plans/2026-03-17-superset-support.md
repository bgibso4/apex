# Superset Support Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow exercises to be grouped as supersets/tri-sets in program definitions, visually grouped in the workout logging UI with round-robin auto-advance, and displayed grouped in session detail.

**Architecture:** Add an optional `superset_group` field to `ExerciseSlot` in the program JSON schema. Exercises sharing the same group ID are rendered inside a `SupersetGroup` wrapper component. The workout hook tracks superset membership and overrides auto-advance logic to alternate between grouped exercises. No database schema changes needed — superset grouping is derived from the program template at session start and restored from exercise order on resume.

**Tech Stack:** TypeScript, React Native, expo-sqlite, Jest + @testing-library/react-native

**Mockups:** `docs/mockups/superset-workout-logging-2026-03-17.html`, `docs/mockups/superset-session-detail-2026-03-17.html`

**GitHub Issue:** #28

---

## Task 1: Add `superset_group` to ExerciseSlot type

**Files:**
- Modify: `src/types/program.ts:61-68` (ExerciseSlot interface)

**Step 1: Add the field**

In `src/types/program.ts`, add `superset_group` to `ExerciseSlot`:

```typescript
export interface ExerciseSlot {
  exercise_id: string;
  category: 'main' | 'power' | 'compound_accessory' | 'accessory' | 'core' | 'conditioning' | 'movement';
  targets: ExerciseTarget[];
  alternatives?: string[];
  notes?: string;
  /** Exercises sharing the same superset_group are performed as a superset (alternating sets). */
  superset_group?: string;
}
```

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS (field is optional, no breakage)

**Step 3: Commit**

```bash
git add src/types/program.ts
git commit -m "feat: add superset_group field to ExerciseSlot type"
```

---

## Task 2: Tag the existing tri-set in program JSON

**Files:**
- Modify: `src/data/functional-athlete-v2.json` (Sunday exercises)

**Step 1: Add superset_group to the three tri-set exercises**

In the Sunday day template, find `skierg_intervals`, `farmers_carry`, and `sled_push` and add `"superset_group": "sunday-triset"` to each. These are the exercises already described in the notes as "Tri-set: cycle SkiErg → Farmer's Carry → Sled Push with minimal rest."

Example for one exercise:
```json
{
  "exercise_id": "skierg_intervals",
  "category": "conditioning",
  "superset_group": "sunday-triset",
  "targets": [...]
}
```

**Step 2: Run existing tests**

Run: `npm test`
Expected: All tests PASS (program JSON is loaded at runtime, no compile-time validation)

**Step 3: Commit**

```bash
git add src/data/functional-athlete-v2.json
git commit -m "feat: tag SkiErg/Farmer's Carry/Sled Push as tri-set group"
```

---

## Task 3: Add `supersetGroup` to ExerciseState and propagate at session start

**Files:**
- Modify: `src/hooks/useWorkoutSession.ts`
- Test: `__tests__/hooks/useWorkoutSession.test.ts` (create if needed)

**Step 1: Write the failing test**

Create `__tests__/hooks/useSupersetGrouping.test.ts`:

```typescript
import { buildExerciseStates } from '../../src/hooks/useWorkoutSession';

describe('superset grouping', () => {
  it('assigns supersetGroup from ExerciseSlot to ExerciseState', () => {
    // Test that when ExerciseSlot has superset_group, it appears in ExerciseState
  });

  it('leaves supersetGroup undefined for non-superset exercises', () => {
    // Test that exercises without superset_group have undefined supersetGroup
  });
});
```

Note: This may require extracting the exercise-state-building logic into a testable function. Currently it's inline in `startSession()` (lines ~469-527). Extract it as `buildExerciseStates(template, weekNumber, exerciseMap, lastSessionData)` so it's unit-testable.

**Step 2: Run tests to verify they fail**

Run: `npm test -- useSupersetGrouping`
Expected: FAIL

**Step 3: Add `supersetGroup` to ExerciseState interface and propagate**

In `useWorkoutSession.ts`, update the `ExerciseState` interface:

```typescript
interface ExerciseState {
  slot: ExerciseSlot;
  exerciseName: string;
  sets: SetState[];
  rpe?: number;
  expanded: boolean;
  lastWeight?: number;
  lastReps?: number;
  isAdhoc?: boolean;
  inputFields?: InputField[];
  supersetGroup?: string;  // <-- ADD THIS
}
```

In the `startSession()` function where `exStates` are built, propagate the field:

```typescript
exStates.push({
  slot,
  exerciseName: exerciseDef?.name ?? slot.exercise_id,
  sets,
  expanded: exStates.length === 0,
  lastWeight: ...,
  lastReps: ...,
  inputFields: ...,
  supersetGroup: slot.superset_group,  // <-- ADD THIS
});
```

Also propagate in the session restore path (the `else` branch that rebuilds state from DB, around line 220-336).

**Step 4: Run tests to verify they pass**

Run: `npm test -- useSupersetGrouping`
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/useWorkoutSession.ts __tests__/hooks/useSupersetGrouping.test.ts
git commit -m "feat: propagate supersetGroup from program template to exercise state"
```

---

## Task 4: Superset-aware auto-advance after completing a set

**Files:**
- Modify: `src/hooks/useWorkoutSession.ts` (`completeSetAction` ~line 561, `setRPE` ~line 781)
- Test: `__tests__/hooks/useSupersetAdvance.test.ts`

**Step 1: Write the failing test**

```typescript
describe('superset auto-advance', () => {
  it('after completing a set in exercise A of a superset, expands exercise B', () => {
    // When exercise A (supersetGroup: 'ss1') completes set 1,
    // exercise B (supersetGroup: 'ss1') should expand and A should collapse
  });

  it('after completing last set of exercise B, advances back to exercise A', () => {
    // Round-robin: B set 1 done -> A expands for set 2
  });

  it('non-superset exercises advance normally (no change)', () => {
    // Exercises without supersetGroup keep current serial behavior
  });

  it('setRPE in superset does NOT auto-advance to next exercise outside the group', () => {
    // RPE on last superset exercise should advance to next non-superset exercise
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- useSupersetAdvance`
Expected: FAIL

**Step 3: Implement superset-aware advance logic**

The key change is in `completeSetAction`. After logging a set, check if the exercise is in a superset group. If so:

1. Find the next exercise in the same superset group that has pending sets
2. Collapse the current exercise, expand the next one
3. If all exercises in the group have no more pending sets, the superset is done — advance to the next exercise outside the group

```typescript
// After logging the set successfully in completeSetAction:
const currentEx = exercises[exIdx];
if (currentEx.supersetGroup) {
  // Find all exercises in this superset group
  const groupIndices = exercises
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => e.supersetGroup === currentEx.supersetGroup);

  // Find current position in rotation
  const currentGroupPos = groupIndices.findIndex(({ i }) => i === exIdx);

  // Check if current exercise just finished its current set (the one we just completed)
  // Look for the next exercise in the group that has pending sets
  const nextInGroup = findNextSupersetExercise(groupIndices, currentGroupPos, exercises);

  if (nextInGroup !== null) {
    // Collapse current, expand next
    setExercises(prev => {
      const next = [...prev];
      next[exIdx] = { ...next[exIdx], expanded: false };
      next[nextInGroup] = { ...next[nextInGroup], expanded: true };
      return next;
    });
  }
}
```

The helper `findNextSupersetExercise` cycles through group members starting after the current one, wrapping around, and returns the index of the first one with pending sets. Returns `null` if all are done.

For `setRPE`: In a superset, RPE is set per exercise after all its sets are done. The auto-advance in `setRPE` should be superset-aware: if the exercise is in a superset and other group members still have pending sets, stay within the group. If the entire group is done, advance to the next exercise outside the group.

**Step 4: Run tests to verify they pass**

Run: `npm test -- useSupersetAdvance`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All PASS

**Step 6: Commit**

```bash
git add src/hooks/useWorkoutSession.ts __tests__/hooks/useSupersetAdvance.test.ts
git commit -m "feat: superset-aware round-robin auto-advance after set completion"
```

---

## Task 5: Create `SupersetGroup` wrapper component

**Files:**
- Create: `src/components/SupersetGroup.tsx`
- Test: `__tests__/components/SupersetGroup.test.tsx`

**Step 1: Write the failing test**

```typescript
import { render, screen } from '@testing-library/react-native';
import { SupersetGroup } from '../../src/components/SupersetGroup';

describe('SupersetGroup', () => {
  it('renders superset badge with "Superset" for 2 exercises', () => {
    render(<SupersetGroup groupSize={2}>{/* children */}</SupersetGroup>);
    expect(screen.getByText('Superset')).toBeTruthy();
  });

  it('renders "Tri-set" badge for 3 exercises', () => {
    render(<SupersetGroup groupSize={3}>{/* children */}</SupersetGroup>);
    expect(screen.getByText('Tri-set')).toBeTruthy();
  });

  it('renders "Giant set" badge for 4+ exercises', () => {
    render(<SupersetGroup groupSize={4}>{/* children */}</SupersetGroup>);
    expect(screen.getByText('Giant set')).toBeTruthy();
  });

  it('renders children inside the group container', () => {
    render(
      <SupersetGroup groupSize={2}>
        <Text testID="child">Hello</Text>
      </SupersetGroup>
    );
    expect(screen.getByTestId('child')).toBeTruthy();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- SupersetGroup`
Expected: FAIL

**Step 3: Implement SupersetGroup component**

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { BorderRadius } from '../theme/radii';

interface SupersetGroupProps {
  groupSize: number;
  children: React.ReactNode;
}

function getGroupLabel(size: number): string {
  if (size === 2) return 'Superset';
  if (size === 3) return 'Tri-set';
  return 'Giant set';
}

export function SupersetGroup({ groupSize, children }: SupersetGroupProps) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{getGroupLabel(groupSize)}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}
```

Style the container with a subtle indigo border matching the mockup: `borderWidth: 1, borderColor: Colors.indigo + '30', borderRadius: 16, padding: 2`.

**Step 4: Run tests to verify they pass**

Run: `npm test -- SupersetGroup`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/SupersetGroup.tsx __tests__/components/SupersetGroup.test.tsx
git commit -m "feat: add SupersetGroup wrapper component with badge labels"
```

---

## Task 6: Render superset groups in workout logging screen

**Files:**
- Modify: `app/(tabs)/workout.tsx:367-419` (exercise card rendering loop)

**Step 1: Write the failing test**

Add to existing workout screen tests or create `__tests__/screens/workoutSuperset.test.tsx`:

```typescript
describe('workout screen superset rendering', () => {
  it('wraps consecutive superset exercises in a SupersetGroup', () => {
    // Render workout screen with exercises that have matching supersetGroup
    // Assert SupersetGroup wrapper is present
    // Assert both ExerciseCards are inside it
  });

  it('does not wrap non-superset exercises', () => {
    // Exercises without supersetGroup render as standalone cards
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- workoutSuperset`
Expected: FAIL

**Step 3: Implement grouped rendering**

Replace the flat `w.exercises.map(...)` with a grouping function that clusters consecutive exercises by `supersetGroup`:

```typescript
function groupExercises(exercises: ExerciseState[]): Array<{
  type: 'standalone';
  exercise: ExerciseState;
  index: number;
} | {
  type: 'superset';
  exercises: Array<{ exercise: ExerciseState; index: number }>;
  groupId: string;
}> {
  const result: Array<...> = [];
  let i = 0;
  while (i < exercises.length) {
    const ex = exercises[i];
    if (ex.supersetGroup) {
      const group: Array<{ exercise: ExerciseState; index: number }> = [];
      const groupId = ex.supersetGroup;
      while (i < exercises.length && exercises[i].supersetGroup === groupId) {
        group.push({ exercise: exercises[i], index: i });
        i++;
      }
      result.push({ type: 'superset', exercises: group, groupId });
    } else {
      result.push({ type: 'standalone', exercise: ex, index: i });
      i++;
    }
  }
  return result;
}
```

Then in JSX:

```tsx
{groupExercises(w.exercises).map((item) => {
  if (item.type === 'standalone') {
    return (
      <View key={`standalone-${item.index}`}>
        <ExerciseCard ... />
      </View>
    );
  }
  return (
    <SupersetGroup key={`superset-${item.groupId}`} groupSize={item.exercises.length}>
      {item.exercises.map(({ exercise: ex, index: exIdx }) => (
        <ExerciseCard key={`${ex.slot.exercise_id}-${exIdx}`} ... />
      ))}
    </SupersetGroup>
  );
})}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- workoutSuperset`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All PASS

**Step 6: Commit**

```bash
git add app/(tabs)/workout.tsx
git commit -m "feat: render superset exercises inside SupersetGroup wrapper in workout screen"
```

---

## Task 7: Add "Next:" indicator to ExerciseCard for superset flow

**Files:**
- Modify: `src/components/ExerciseCard.tsx`
- Test: `__tests__/components/ExerciseCard.test.tsx`

**Step 1: Write the failing test**

```typescript
describe('ExerciseCard superset next-up indicator', () => {
  it('shows "Next: Face Pull set 2" when nextUpLabel is provided', () => {
    render(<ExerciseCard {...defaultProps} expanded={true} nextUpLabel="Face Pull set 2" />);
    expect(screen.getByText(/Next: Face Pull set 2/)).toBeTruthy();
  });

  it('does not show next-up indicator when nextUpLabel is undefined', () => {
    render(<ExerciseCard {...defaultProps} expanded={true} />);
    expect(screen.queryByText(/Next:/)).toBeNull();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- ExerciseCard`
Expected: FAIL (new tests fail)

**Step 3: Add nextUpLabel prop and render indicator**

Add to `ExerciseCardProps`:
```typescript
nextUpLabel?: string;  // e.g., "Face Pull set 2"
```

At the bottom of the expanded view (after RPE section / note), render:
```tsx
{nextUpLabel && (
  <View style={styles.nextUpIndicator}>
    <Text style={styles.nextUpText}>→ Next: {nextUpLabel}</Text>
  </View>
)}
```

Style: indigo tint background, indigo text, small font, rounded container (matching mockup).

**Step 4: Compute nextUpLabel in workout.tsx**

In `workout.tsx`, when rendering an ExerciseCard inside a superset, compute what comes next:

```typescript
function getNextUpLabel(exercises: ExerciseState[], currentExIdx: number): string | undefined {
  const current = exercises[currentExIdx];
  if (!current.supersetGroup) return undefined;

  // Find next exercise in superset group with pending sets
  const groupMembers = exercises
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => e.supersetGroup === current.supersetGroup);

  const currentPos = groupMembers.findIndex(({ i }) => i === currentExIdx);
  for (let offset = 1; offset <= groupMembers.length; offset++) {
    const nextPos = (currentPos + offset) % groupMembers.length;
    const nextEx = groupMembers[nextPos].e;
    const nextPendingSet = nextEx.sets.find(s => s.status === 'pending');
    if (nextPendingSet) {
      return `${nextEx.exerciseName} set ${nextPendingSet.setNumber}`;
    }
  }
  return undefined;
}
```

Pass this as `nextUpLabel` prop to ExerciseCard.

**Step 5: Run tests to verify they pass**

Run: `npm test -- ExerciseCard`
Expected: All PASS

**Step 6: Commit**

```bash
git add src/components/ExerciseCard.tsx __tests__/components/ExerciseCard.test.tsx app/(tabs)/workout.tsx
git commit -m "feat: add next-up indicator to ExerciseCard for superset flow"
```

---

## Task 8: Show superset grouping in session detail

**Files:**
- Modify: `app/session/[id].tsx:105-120` (exercise grouping logic) and rendering section
- Test: `__tests__/screens/sessionDetailSuperset.test.tsx`

**Step 1: Write the failing test**

```typescript
describe('session detail superset grouping', () => {
  it('wraps exercises with matching superset_group in SupersetGroup', () => {
    // Mock session data where some exercises share a superset group
    // Assert the SupersetGroup component is rendered
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- sessionDetailSuperset`
Expected: FAIL

**Step 3: Propagate superset_group into session detail**

The session detail builds `ExerciseGroup[]` from `set_logs`. To know which exercises are superset-grouped, we need the original template's `superset_group` data. The session already stores `program_id` and `day_template_id`, so we can look up the template:

1. After loading the session, also load the program definition
2. Find the day template by `day_template_id`
3. Build a map: `exerciseId -> superset_group` from the template's `exercises` array
4. Add `supersetGroup?: string` to the `ExerciseGroup` type
5. Populate it from the map during group building

Then in the JSX rendering, use the same `groupExercises` pattern from Task 6 — extract it to a shared utility if not already.

**Step 4: Run tests to verify they pass**

Run: `npm test -- sessionDetailSuperset`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All PASS

**Step 6: Commit**

```bash
git add app/session/[id].tsx
git commit -m "feat: show superset grouping in session detail view"
```

---

## Task 9: Extract `groupExercises` utility for reuse

**Files:**
- Create: `src/utils/supersetGrouping.ts`
- Test: `__tests__/utils/supersetGrouping.test.ts`
- Modify: `app/(tabs)/workout.tsx` (import from utility)
- Modify: `app/session/[id].tsx` (import from utility)

**Step 1: Write the failing test**

```typescript
import { groupExercises } from '../../src/utils/supersetGrouping';

describe('groupExercises', () => {
  it('groups consecutive exercises with same supersetGroup', () => {
    const exercises = [
      { supersetGroup: undefined },  // standalone
      { supersetGroup: 'ss1' },      // superset member
      { supersetGroup: 'ss1' },      // superset member
      { supersetGroup: undefined },  // standalone
    ];
    const groups = groupExercises(exercises as any);
    expect(groups).toHaveLength(3);
    expect(groups[0].type).toBe('standalone');
    expect(groups[1].type).toBe('superset');
    expect(groups[1].exercises).toHaveLength(2);
    expect(groups[2].type).toBe('standalone');
  });

  it('handles all standalone exercises', () => {
    const exercises = [
      { supersetGroup: undefined },
      { supersetGroup: undefined },
    ];
    const groups = groupExercises(exercises as any);
    expect(groups).toHaveLength(2);
    expect(groups.every(g => g.type === 'standalone')).toBe(true);
  });

  it('handles tri-set (3 consecutive exercises)', () => {
    const exercises = [
      { supersetGroup: 'tri1' },
      { supersetGroup: 'tri1' },
      { supersetGroup: 'tri1' },
    ];
    const groups = groupExercises(exercises as any);
    expect(groups).toHaveLength(1);
    expect(groups[0].type).toBe('superset');
    expect(groups[0].exercises).toHaveLength(3);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- supersetGrouping`
Expected: FAIL

**Step 3: Extract the utility**

Move `groupExercises` from `workout.tsx` into `src/utils/supersetGrouping.ts`. Import it in both `workout.tsx` and `session/[id].tsx`.

**Step 4: Run tests to verify they pass**

Run: `npm test -- supersetGrouping`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All PASS

**Step 6: Commit**

```bash
git add src/utils/supersetGrouping.ts __tests__/utils/supersetGrouping.test.ts app/(tabs)/workout.tsx app/session/[id].tsx
git commit -m "refactor: extract groupExercises utility for reuse across screens"
```

---

## Task 10: End-to-end verification on device

**Step 1: Run full test suite**

Run: `npm test`
Expected: All PASS

**Step 2: Build and deploy to device**

Run: `npm run device`

**Step 3: Manual verification checklist**

- [ ] Start a workout on Sunday (Athletic Power & Conditioning)
- [ ] Verify SkiErg, Farmer's Carry, Sled Push are visually grouped with "Tri-set" badge
- [ ] Complete a set of SkiErg — verify it auto-advances to Farmer's Carry
- [ ] Complete a set of Farmer's Carry — verify it auto-advances to Sled Push
- [ ] Complete a set of Sled Push — verify it cycles back to SkiErg
- [ ] Verify non-superset exercises (Back Squat, Broad Jump, etc.) work unchanged
- [ ] Finish the workout and check session detail — verify tri-set grouping appears
- [ ] Kill and relaunch the app mid-workout — verify superset state is restored correctly
- [ ] Verify "Next: [exercise] set N" indicator shows correctly during superset logging

**Step 4: Commit any fixes**

If manual testing reveals issues, fix and commit.
