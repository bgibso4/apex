# Auto-Derive Weights from Program Data and History

**Issue:** [#42](https://github.com/bgibso4/apex/issues/42)
**Date:** 2026-03-18

## Problem

Weight entry is too manual. On day 1 of a new program, accessories default to 0 and require manual entry every time. Main lifts require the user to estimate and enter 1RM values on an activation screen. The system should derive weights automatically from the program definition and training history.

## Design

### Program JSON Changes

**Exercise definitions** gain an optional `one_rm` field for lifts that use percentage-based programming:

```json
{
  "id": "back_squat",
  "name": "Back Squat",
  "uses_1rm": true,
  "one_rm": 315,
  "type": "barbell_compound",
  "muscle_groups": ["quads", "glutes"]
}
```

**Exercise slots** gain an optional `default_weight` field as a day-1 fallback for accessories:

```json
{
  "exercise_id": "lateral_raise",
  "category": "accessory",
  "default_weight": 25,
  "targets": [{ "weeks": [1,2,3,4], "sets": 3, "reps": "10-12" }]
}
```

- `one_rm` lives on the exercise definition because it's a property of the lift itself.
- `default_weight` lives on the exercise slot because it's a starting-point prescription that could vary by program context.
- Both fields are optional. The weight suggestion chain falls through if they're absent.
- All weights are in pounds. `calculateTargetWeight` rounds to nearest 5 lbs.

### Weight Suggestion Chain

When building a workout session, the app resolves the target weight for each exercise in this order:

1. **Program percentage** — `one_rm * (target.percent / 100)`, rounded to nearest 5 lbs. Only applies when both `one_rm` (from exercise definition) and `target.percent` (from the week's target) exist. This always wins when present — following the periodized program is the point.

2. **Logged history** — Last `actual_weight` from the most recent completed session for this exercise, searched across all programs. Your strength on lateral raises doesn't reset because you switched programs.

3. **Program default** — `default_weight` from the exercise slot. Day-1 fallback for accessories with no training history.

4. **Zero** — No data available. User enters the weight manually on their first set. This weight is then logged and used as history for next time.

The `lastWeight` value continues to display in the ExerciseCard reference line regardless of which step provided the target weight, so the user always sees what they lifted last time as context.

**Implementation detail:** Both `startSession` and `performRestore` in `useWorkoutSession.ts` contain weight resolution logic and both must be updated. The current pattern:

```typescript
// Current (reads from programs.one_rm_values column)
const orm = JSON.parse(program.one_rm_values || '{}');
if (target.percent && orm[slot.exercise_id]) {
  suggestedWeight = calculateTargetWeight(orm[slot.exercise_id], pct);
}
const weight = suggestedWeight || lastWeight || 0;
```

Becomes:

```typescript
// New (reads one_rm from exercise definition in JSON)
const exerciseDef = def.exercise_definitions.find(e => e.id === slot.exercise_id);
const oneRm = exerciseDef?.one_rm;
if (target.percent && oneRm) {
  suggestedWeight = calculateTargetWeight(oneRm, pct);
}
const weight = suggestedWeight || lastWeight || slot.default_weight || 0;
```

### Activation Flow Changes

The activation screen (`app/activate.tsx`) is removed. The current flow:

```
Library → Select program → Activation screen (enter 1RMs) → Program active
```

Becomes:

```
Library → Select program → Program active (immediately)
```

1RM values come from the program JSON exercise definitions, so there is nothing to prompt the user for.

### Editing Weights After Program Start

If a weight feels wrong mid-program (e.g., a 1RM is too high after time off), the user edits the program JSON and redeploys. `refreshBundledProgram` already runs on app startup and syncs `definition_json` to SQLite. Since `one_rm` lives inside the JSON definition (not in a separate DB column), updating the JSON and redeploying is sufficient — no additional sync logic is needed.

This is a manual process for now. In-app editing of 1RM values can be added later if the JSON workflow becomes friction.

### Migration

Programs activated before this change have `one_rm_values` stored in the database. After the update, the app reads `one_rm` from the JSON definition instead. This is a clean transition — old data is simply ignored, and the JSON is the source of truth going forward. No data migration is needed.

## Code Changes

### Files to modify

1. **`src/data/functional-athlete-v2.json`** — Add `one_rm` to exercise definitions with `uses_1rm: true`. Add `default_weight` to accessory exercise slots where a sensible starting weight exists.

2. **`src/types/program.ts`** — Add `one_rm?: number` to `ExerciseDefinition`. Add `default_weight?: number` to `ExerciseSlot`.

3. **`src/hooks/useWorkoutSession.ts`** — Update weight resolution in both `startSession` and `performRestore`:
   - Read `one_rm` from the exercise definition (via `def.exercise_definitions`) instead of `program.one_rm_values`.
   - Remove the `programId` argument from `getLastSessionForExercise()` calls so history searches across all programs.
   - Add `slot.default_weight` to the fallback chain: `suggestedWeight || lastWeight || slot.default_weight || 0`.
   - Remove the `orm` / `oneRmValues` parsing from `program.one_rm_values`.

4. **`src/db/programs.ts`** — Simplify `activateProgram()` to no longer accept `oneRmValues` parameter. Just set status and activation date. Write `NULL` for `one_rm_values` column.

5. **`app/activate.tsx`** — Remove entirely.

6. **`app/library.tsx`** — Update the activate button to call `activateProgram()` directly without navigating to the activation screen.

### Cleanup (unused code removal)

- **`src/db/programs.ts`** — Remove `getOneRmValues()` function (no longer called).
- **`src/types/training.ts`** — Remove `one_rm_values` from the `Program` type.
- The `one_rm_values` column in the `programs` table is left in place (no schema migration needed; it's simply unused).

### Files unchanged

- `src/components/ExerciseCard.tsx` — Reference line already displays %1RM, RPE, and last weight.
- `src/db/metrics.ts` — `calculateTargetWeight()` unchanged.
- `src/db/sessions.ts` — `getLastSessionForExercise()` already supports omitting the `programId` parameter. The change is at the call sites, not in this function.
- `src/db/programs.ts` — `refreshBundledProgram()` already syncs `definition_json`. No changes needed since `one_rm` lives in the JSON, not a separate column.
- Progress and trends screens — unaffected.
