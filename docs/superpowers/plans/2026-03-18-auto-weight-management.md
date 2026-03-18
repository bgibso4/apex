# Auto-Derive Weights Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate manual weight entry by deriving target weights from program JSON definitions and training history.

**Architecture:** Move 1RM values from user-entered activation data into the program JSON exercise definitions. Add `default_weight` to exercise slots for accessories. Update the weight resolution chain to: program percentage > cross-program history > program default > zero. Remove the activation screen.

**Tech Stack:** TypeScript, React Native (Expo), SQLite (expo-sqlite), Jest

**Spec:** `docs/superpowers/specs/2026-03-18-auto-weight-management-design.md`

---

### Task 1: Add `one_rm` and `default_weight` to type definitions

**Files:**
- Modify: `src/types/program.ts:88-96` (ExerciseDefinition)
- Modify: `src/types/program.ts:61-70` (ExerciseSlot)

- [ ] **Step 1: Add `one_rm` to ExerciseDefinition**

In `src/types/program.ts`, add `one_rm?: number` to the `ExerciseDefinition` interface (after the `uses_1rm` field, line ~94):

```typescript
export interface ExerciseDefinition {
  id: string;
  name: string;
  type: 'main' | 'power' | 'accessory' | 'conditioning' | 'movement' | 'core';
  muscle_groups: string[];
  alternatives?: string[];
  uses_1rm?: boolean;
  one_rm?: number;
  input_fields?: InputField[];
}
```

- [ ] **Step 2: Add `default_weight` to ExerciseSlot**

In `src/types/program.ts`, add `default_weight?: number` to the `ExerciseSlot` interface (after `notes`, line ~68):

```typescript
export interface ExerciseSlot {
  exercise_id: string;
  category: 'main' | 'power' | 'compound_accessory' | 'accessory' | 'core' | 'conditioning' | 'movement';
  targets: ExerciseTarget[];
  alternatives?: string[];
  notes?: string;
  default_weight?: number;
  superset_group?: string;
}
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No new errors (fields are optional).

- [ ] **Step 4: Commit**

```bash
git add src/types/program.ts
git commit -m "feat: add one_rm and default_weight to program type definitions (#42)"
```

---

### Task 2: Add `one_rm` and `default_weight` to program JSON

**Files:**
- Modify: `src/data/functional-athlete-v2.json`

**Reference:** Exercise definitions start at line ~529. Exercise slots are in each day's `exercises` array throughout the file.

- [ ] **Step 1: Add `one_rm` to exercise definitions with `uses_1rm: true`**

Add `one_rm` values to these 6 exercises in the `exercise_definitions` array. Use reasonable starting estimates (the user will tune these in issue #41):

```json
{ "id": "back_squat", ..., "uses_1rm": true, "one_rm": 315 }
{ "id": "weighted_pullup", ..., "uses_1rm": true, "one_rm": 100 }
{ "id": "bench_press", ..., "uses_1rm": true, "one_rm": 275 }
{ "id": "overhead_press", ..., "uses_1rm": true, "one_rm": 155 }
{ "id": "zercher_squat", ..., "uses_1rm": true, "one_rm": 225 }
{ "id": "romanian_deadlift", ..., "uses_1rm": true, "one_rm": 275 }
```

- [ ] **Step 2: Add `default_weight` to accessory exercise slots**

Find each accessory exercise slot throughout the day templates and add `default_weight`. Examples:

```json
{ "exercise_id": "barbell_row", "category": "accessory", "default_weight": 135, ... }
{ "exercise_id": "face_pulls", "category": "accessory", "default_weight": 30, ... }
{ "exercise_id": "curls", "category": "accessory", "default_weight": 30, ... }
{ "exercise_id": "lateral_raise", "category": "accessory", "default_weight": 20, ... }
{ "exercise_id": "hip_thrust", "category": "accessory", "default_weight": 185, ... }
```

Add `default_weight` to every exercise slot that doesn't use 1RM percentages and has a weight component. Skip conditioning exercises that use distance/duration/time only (e.g., skierg_intervals, easy_run).

- [ ] **Step 3: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/data/functional-athlete-v2.json', 'utf8')); console.log('Valid JSON')"`
Expected: `Valid JSON`

- [ ] **Step 4: Commit**

```bash
git add src/data/functional-athlete-v2.json
git commit -m "feat: add one_rm and default_weight to Functional Athlete V2 program (#42)"
```

---

### Task 3: Update weight resolution in `useWorkoutSession`

This is the core change. Both `startSession` and `performRestore` have identical weight resolution logic that must be updated.

**Files:**
- Modify: `src/hooks/useWorkoutSession.ts:199-203` (performRestore orm parsing)
- Modify: `src/hooks/useWorkoutSession.ts:233-242` (performRestore weight calc)
- Modify: `src/hooks/useWorkoutSession.ts:441-445` (startSession orm parsing)
- Modify: `src/hooks/useWorkoutSession.ts:488-497` (startSession weight calc)
- Test: `__tests__/hooks/useWorkoutSession.test.ts`

- [ ] **Step 1: Write failing test for weight resolution from exercise definition `one_rm`**

In `__tests__/hooks/useWorkoutSession.test.ts`, add a test that verifies weight is calculated from the exercise definition's `one_rm` field rather than from `program.one_rm_values`. The test should mock a program with an exercise definition containing `one_rm: 300` and a target with `percent: 75`, and verify the suggested weight is `calculateTargetWeight(300, 75)`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="useWorkoutSession" --verbose`
Expected: FAIL — test expects weight from exercise definition but code reads from `program.one_rm_values`.

- [ ] **Step 3: Write failing test for cross-program history search**

Add a test that verifies `getLastSessionForExercise` is called without a program ID argument, so it searches across all programs.

- [ ] **Step 4: Write failing test for `default_weight` fallback**

Add a test that verifies when there's no 1RM percentage and no logged history, the weight falls back to `slot.default_weight` instead of 0.

- [ ] **Step 5: Update `performRestore` weight resolution (lines 199-242)**

Remove the `orm` parsing block (lines 199-203):
```typescript
// DELETE these lines:
const orm: Record<string, number> = active.one_rm_values
  ? (typeof active.one_rm_values === 'string'
    ? JSON.parse(active.one_rm_values as string)
    : active.one_rm_values)
  : {};
```

Update the weight calculation block (around lines 230-242). `exerciseDef` is already computed at line 230 — reuse it. Add the `oneRm` extraction and update the calculation:

```typescript
// exerciseDef already exists at line 230:
// const exerciseDef = def.exercise_definitions.find(e => e.id === slot.exercise_id);
const oneRm = exerciseDef?.one_rm;

let suggestedWeight = 0;
if (target.percent && oneRm) {
  const pct = typeof target.percent === 'string' ? parseFloat(target.percent) : target.percent;
  suggestedWeight = calculateTargetWeight(oneRm, pct);
}
```

Remove the program ID from `getLastSessionForExercise` call:
```typescript
// Before:
const lastSets = await getLastSessionForExercise(slot.exercise_id, active.id);
// After:
const lastSets = await getLastSessionForExercise(slot.exercise_id);
```

Update the weight fallback chain:
```typescript
// Before:
const weight = suggestedWeight || lastWeight || 0;
// After:
const weight = suggestedWeight || lastWeight || slot.default_weight || 0;
```

- [ ] **Step 6: Update `startSession` weight resolution (lines 441-497)**

Apply the same three changes as step 5:

Remove the `oneRmValues` parsing block (lines 441-445). First, verify no other code in the hook references `oneRmValues` beyond the weight calculation — run `grep oneRmValues src/hooks/useWorkoutSession.ts` to confirm.

Update the 1RM lookup (around line 488-491). Note: `exerciseDef` is already computed earlier in `startSession` (`def.exercise_definitions.find(...)`), so reuse it:
```typescript
const oneRm = exerciseDef?.one_rm;
if (target.percent && oneRm) {
  const pct = typeof target.percent === 'string' ? parseFloat(target.percent) : target.percent;
  suggestedWeight = calculateTargetWeight(oneRm, pct);
}
```

Remove program ID from `getLastSessionForExercise`:
```typescript
// Before:
const lastSets = await getLastSessionForExercise(slot.exercise_id, program.id);
// After:
const lastSets = await getLastSessionForExercise(slot.exercise_id);
```

Update the weight fallback:
```typescript
// Before:
const weight = suggestedWeight || lastWeight || 0;
// After:
const weight = suggestedWeight || lastWeight || slot.default_weight || 0;
```

- [ ] **Step 7: Run tests**

Run: `npm test -- --testPathPattern="useWorkoutSession" --verbose`
Expected: All tests pass, including the 3 new tests.

- [ ] **Step 8: Commit**

```bash
git add src/hooks/useWorkoutSession.ts __tests__/hooks/useWorkoutSession.test.ts
git commit -m "feat: derive weights from exercise definitions and cross-program history (#42)"
```

---

### Task 4: Simplify `activateProgram` and remove unused 1RM code

**Files:**
- Modify: `src/db/programs.ts:97-114` (activateProgram)
- Modify: `src/db/programs.ts:179-187` (remove getOneRmValues)
- Modify: `src/types/training.ts:14` (remove one_rm_values from Program type)
- Test: `__tests__/db/programs.test.ts:228-301`

- [ ] **Step 1: Update tests for simplified `activateProgram`**

In `__tests__/db/programs.test.ts`, update the `activateProgram` tests (lines 228-264) to call with a single argument (just `programId`, no `oneRmValues`). Remove assertions about `one_rm_values` being serialized.

Remove the `getOneRmValues` tests (lines 269-301) entirely.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --testPathPattern="programs.test" --verbose`
Expected: FAIL — `activateProgram` still expects 2 arguments.

- [ ] **Step 3: Simplify `activateProgram` in `src/db/programs.ts`**

```typescript
export async function activateProgram(programId: string): Promise<void> {
  const db = await getDatabase();

  // Deactivate any currently active program
  await db.runAsync(
    "UPDATE programs SET status = 'completed' WHERE status = 'active'"
  );

  // Activate this one (clear stale one_rm_values since we now read from JSON)
  await db.runAsync(
    `UPDATE programs SET status = 'active', one_rm_values = NULL, activated_date = ? WHERE id = ?`,
    [getLocalDateString(), programId]
  );
}
```

- [ ] **Step 4: Remove `getOneRmValues` function**

Delete the `getOneRmValues` function (lines 179-187) from `src/db/programs.ts`.

- [ ] **Step 5: Remove `one_rm_values` from Program type**

In `src/types/training.ts`, remove line 14:
```typescript
// DELETE:
one_rm_values?: Record<string, number>;
```

- [ ] **Step 6: Fix any remaining references to `one_rm_values`**

Run: `npx tsc --noEmit`

Fix any TypeScript errors from code still referencing `program.one_rm_values` or `getOneRmValues`. These should already be gone from Task 3, but verify.

- [ ] **Step 7: Run tests**

Run: `npm test -- --testPathPattern="programs.test" --verbose`
Expected: All tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/db/programs.ts src/types/training.ts __tests__/db/programs.test.ts
git commit -m "refactor: simplify activateProgram, remove unused 1RM code (#42)"
```

---

### Task 5: Remove activation screen and update library

**Files:**
- Delete: `app/activate.tsx`
- Modify: `app/library.tsx:129-137` (activate button)

- [ ] **Step 1: Update library activate button**

In `app/library.tsx`, find the activate button (line ~132) that navigates to the activation screen:
```typescript
// Before:
onPress={() => router.push({ pathname: '/activate', params: { programId: p.id } })}
// After:
onPress={async () => {
  await activateProgram(p.id);
  router.back();
}}
```

Make sure `activateProgram` is imported — check the existing imports at the top of the file (likely `../src/db` or `../src/db/programs`). Remove any import of the activate route/path if present.

- [ ] **Step 2: Delete `app/activate.tsx`**

```bash
rm app/activate.tsx
```

- [ ] **Step 3: Verify no remaining references to activate screen**

Run: `npx tsc --noEmit`

Also search for any remaining references:
```bash
grep -r "activate" app/ src/ --include="*.ts" --include="*.tsx" -l
```

Fix any broken imports or navigation references. Note: `activateProgram` the function should still exist — only the screen is being removed.

- [ ] **Step 4: Run full test suite**

Run: `npm test`
Expected: All tests pass. Some tests may reference the activation screen or `activateProgram` with the old signature — fix any failures.

- [ ] **Step 5: Commit**

```bash
git rm app/activate.tsx
git add app/library.tsx
git commit -m "feat: remove activation screen, activate programs directly from library (#42)"
```

---

### Task 6: Full integration verification

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 2: Verify TypeScript compiles cleanly**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Verify the program JSON is valid and has the new fields**

Run: `node -e "const p = JSON.parse(require('fs').readFileSync('src/data/functional-athlete-v2.json', 'utf8')); const defs = p.program.exercise_definitions; console.log('Exercises with one_rm:', defs.filter(e => e.one_rm).map(e => e.id + '=' + e.one_rm)); const slots = p.program.schedule.flatMap(d => d.exercises); console.log('Slots with default_weight:', slots.filter(s => s.default_weight).map(s => s.exercise_id + '=' + s.default_weight));"`

Expected: Lists all exercises with `one_rm` values and all slots with `default_weight` values.

- [ ] **Step 4: Commit any final fixes**

If any fixes were needed, commit them:
```bash
git add -A
git commit -m "fix: resolve integration issues from weight management changes (#42)"
```
