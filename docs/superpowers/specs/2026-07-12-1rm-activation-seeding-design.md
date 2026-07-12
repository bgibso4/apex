# 1RM Activation Seeding — Design

**Date:** 2026-07-12
**Status:** Design approved in conversation (follow-up to Pillars, same branch/PR #76)

## Problem

Main-lift weights are computed as `1RM × week%`, but the 1RM comes from the program definition JSON's static seed values (`exercise_definitions[].one_rm`) — the user's numbers from whenever the JSON was written. Actual strength moves over a program; the app already tracks estimated 1RM (Epley) from every logged set but never feeds it back. Result: a new program starts anchored to stale numbers.

## Design

**At program activation, compute per-lift working 1RMs from recent history and store them on the run.** The dormant `programs.one_rm_values` column (currently only ever set to NULL) becomes the per-run seed store.

### Seeding rule (per `uses_1rm` exercise)

- **Window:** qualifying sets from the last **10 sessions containing that exercise** AND the last **60 days** — whichever is more restrictive. Qualifying = status `completed`/`completed_below`, weight > 0, reps > 0 (same filter as `getEstimated1RM`).
- **Aggregate:** **max** Epley e1RM across the window (`calculateEpley`). Max makes deloads and low-RPE weeks harmless — they lose to the best recent set.
- **Fallback:** no qualifying sets in the window → the definition's `one_rm` seed (e.g., incline bench 265 on day one). The JSON seeds become cold-start defaults, not the source of truth.
- **Known tradeoff (accepted):** an outlier PR inside the window (e.g., pre-injury) can overshoot. Smarter filtering is a later iteration.

### Data flow

1. `getSeed1RM(exerciseId)` (new, `src/db/metrics.ts`) — returns the windowed max e1RM or null.
2. `activateProgram` (modified, `src/db/programs.ts`) — parses the row's `definition_json`, computes `{ exercise_id: seed }` for every `uses_1rm` definition (computed ?? definition seed), stores as JSON in `one_rm_values` (replacing the current `one_rm_values = NULL`). `restartProgram` already funnels through `activateProgram`, so restarts seed too. Unparseable definition → `one_rm_values` NULL (read-time fallback covers it).
3. `resolveOneRm(oneRmValuesJson, exerciseId, definitionOneRm)` (new pure helper, `src/utils/program.ts`) — run seeds first, definition seed as fallback; tolerant of invalid JSON / missing keys / non-positive values.
4. `useWorkoutSession` (modified) — both weight-resolution sites (session start + restore) use `resolveOneRm(active.one_rm_values, ...)` instead of reading `exerciseDef.one_rm` directly.
5. `Program` type (`src/types/training.ts`) gains `one_rm_values?: string | null` (the column exists; the type never declared it).

### Behavior notes

- Seeds are frozen per run at activation — re-running a program years later re-seeds from then-current history; past runs keep the numbers they trained with.
- Activating Pillars after this ships: squat/row/OHP/Zercher/RDL seed from recent FA training; incline (no history) falls back to 265.
- Non-goals: mid-program re-seeding, UI for viewing/editing seeds, outlier filtering.

## Testing

- `getSeed1RM`: mock-db idiom — max-of-window computation, null on empty, SQL encodes both window bounds and the qualifying-set filter.
- `activateProgram`: computed seeds stored as JSON; definition fallback used when `getSeed1RM` returns null; archive/card side effects unchanged. **Existing `activateProgram` test assertions that expect `one_rm_values = NULL` must be updated — the behavior change is the point of this feature.**
- `resolveOneRm`: seed wins; missing key, invalid JSON, null column, non-positive seed all fall back to the definition value.
