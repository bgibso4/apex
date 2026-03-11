# Exercise-Specific Tracking Fields — Design

**Date:** 2026-03-11
**Issue:** #27

## Problem

Every exercise currently assumes weight × reps. Many exercises don't fit: farmer's carries (weight + distance), ski erg (distance + time), planks (duration), bodyweight pull-ups (reps only). The data model, UI, and metrics all need to support exercise-specific field types.

## Field Type System

Each exercise declares an ordered list of **input fields** via an `input_fields` property. Each field has:
- **type**: `weight`, `reps`, `distance`, `duration`, `time`
- **unit**: display unit (e.g., `lbs`, `m`, `sec`, `m:ss`)
- **role**: `target` (prescribed by program, pre-filled) or `result` (filled after completion, like erg time)

### Common Field Profiles

| Profile | Fields | Examples |
|---------|--------|----------|
| `weight_reps` | weight (lbs), reps | Bench, Squat, OHP, RDL |
| `reps_only` | reps | Pull-ups, Push-ups, Dips |
| `weight_distance` | weight (lbs), distance (m) | Farmer's Carries, Sled Push |
| `distance_time` | distance (m), time (m:ss) | Ski Erg, Row Erg |
| `duration` | duration (sec) | Plank, Dead Hang |

Exercises without `input_fields` default to `weight_reps` — full backward compatibility.

### Units

Units are per-field-type, not a global imperial/metric toggle. Defaults reflect a Canadian hybrid:
- **weight**: lbs (could switch to kg)
- **distance**: meters (could switch to yards)
- **duration**: seconds (no unit choice)
- **time**: m:ss (no unit choice)
- **reps**: unitless

Unit preference is stored in the exercise's `input_fields` definition. Settings UI to change defaults is out of scope for this iteration but the data model supports it.

## Data Model

### `exercises` table — add `input_fields` column

```sql
ALTER TABLE exercises ADD COLUMN input_fields TEXT; -- JSON array
```

Example value:
```json
[
  { "type": "weight", "unit": "lbs" },
  { "type": "distance", "unit": "m" }
]
```

NULL `input_fields` → defaults to `[{ "type": "weight", "unit": "lbs" }, { "type": "reps" }]`.

### `set_logs` table — add new value columns

Widen the table with real columns (not JSON) for queryability and performance:

| Column | Type | Used by |
|--------|------|---------|
| `target_weight` | REAL | Already exists |
| `actual_weight` | REAL | Already exists |
| `target_reps` | INTEGER | Already exists |
| `actual_reps` | INTEGER | Already exists |
| `target_distance` | REAL | New — carries, erg, sled |
| `actual_distance` | REAL | New |
| `target_duration` | REAL | New — plank, dead hang (seconds) |
| `actual_duration` | REAL | New |
| `target_time` | REAL | New — erg intervals (seconds) |
| `actual_time` | REAL | New |

Each exercise only uses the columns its `input_fields` declare — the rest are NULL. This keeps SQL simple and indexable: `SELECT MAX(actual_duration) FROM set_logs WHERE exercise_id = ?`.

**Mapping:** Field type `"weight"` → columns `target_weight` / `actual_weight`. Field type `"distance"` → `target_distance` / `actual_distance`. Etc.

### Data migration

Since the app has minimal real data, we do a clean migration: add new columns, update the schema version. No data migration needed — existing weight/reps data stays in the existing columns. The `input_fields` column on exercises defaults to NULL which means `weight_reps`.

## Program JSON Changes

### Exercise definitions gain `input_fields`

```json
{
  "id": "farmers_carries",
  "name": "Farmer's Carries",
  "type": "conditioning",
  "input_fields": [
    { "type": "weight", "unit": "lbs" },
    { "type": "distance", "unit": "m" }
  ]
}
```

### Targets prescribe values per field

```json
{
  "exercise_id": "farmers_carries",
  "targets": [{
    "weeks": [1, 2, 3, 4],
    "sets": 3,
    "values": { "weight": 70, "distance": 40 }
  }]
}
```

Exercises without `input_fields` continue using existing `reps`, `percent`, `rpe_target` fields — no breaking change.

## UI Changes

### Design approach: Option A — Unified layout

Same card structure for all exercises. Column headers change based on `input_fields`. Units appear in column headers (small text under label), never in row values. Row values are always raw numbers.

See mockups:
- `docs/mockups/exercise-fields-options-2026-03-11.html` — Option A vs B comparison
- `docs/mockups/exercise-fields-option-a-2026-03-11.html` — Refined Option A

### Screens impacted

| Screen | What changes |
|--------|-------------|
| **ExerciseCard** | Dynamic columns based on exercise's `input_fields` |
| **AdjustModal** | Support editing all field types (number pad for weight/distance/duration, time input for m:ss) |
| **Session Detail** (`session/[id].tsx`) | Render correct columns per exercise |
| **Exercise Detail** (`exercise/[id].tsx`) | Adapt set history table + trend chart to field type |
| **Progress** (`progress.tsx`) | Show appropriate metric per exercise type |
| **Workout Complete summary** | PR detection adapted per field type |
| **Ad-hoc exercise picker** | Library exercises include field type info |
| **Program import/seed** | Exercise definitions include `input_fields` |

### ExerciseCard behavior

1. Read exercise's `input_fields` → determine columns
2. Render column headers with label + unit
3. Set rows show one value per field — all tappable for edit via AdjustModal
4. One-tap complete fills `actual_*` from `target_*` for all declared fields
5. RPE still shows after all sets complete (RPE is universal)

### AdjustModal

- Title adapts: "Adjust Weight", "Adjust Distance", "Adjust Duration", etc.
- Input type adapts: number pad for weight/distance/duration/reps, time picker for m:ss
- All values editable on every field type

## Metrics & Progress

The exercise's `input_fields` determines which metrics make sense:

| Field profile | Primary metric | PR types | Trend chart |
|--------------|---------------|----------|-------------|
| `weight_reps` | e1RM (Epley) | Best e1RM, rep PRs | e1RM over time |
| `reps_only` | Best reps | Most reps in a set | Best reps per session |
| `weight_distance` | Weight progression | Heaviest carry | Weight at fixed distance over time |
| `distance_time` | Pace / best time | Fastest time for distance | Time per session |
| `duration` | Longest hold | Longest duration | Duration over time |

### PR detection changes

`detectPRs()` currently only checks e1RM and rep PRs. Extend to:
- **Duration PR**: longest `actual_duration` for the exercise
- **Time PR**: fastest `actual_time` for a given distance
- **Distance PR**: longest `actual_distance`
- Skip e1RM calculation for exercises without weight+reps fields

### Exercise Detail page

- Set history table columns adapt to `input_fields` (same as ExerciseCard)
- Trend chart Y-axis adapts: lbs for e1RM, seconds for duration, m:ss for time, count for reps
- Chart title adapts: "Estimated 1RM" → "Best Reps" → "Best Time" etc.

## Future extensibility

Adding a new field type (e.g., `resistance_level` for cables/bands):
1. Add `target_resistance` / `actual_resistance` columns via migration
2. Add `"resistance_level"` to the field type enum
3. Add mapping in the field-type-to-column resolver
4. Define what metrics/PRs make sense for it

No schema redesign, no breaking changes.
