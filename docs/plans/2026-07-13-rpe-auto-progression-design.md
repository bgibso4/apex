# RPE Auto-Progression for Accessories — Design

**Date:** 2026-07-13
**Issue:** [#45](https://github.com/bgibso4/apex/issues/45)
**Status:** Approved (brainstormed with Ben 2026-07-13)

## Overview

Accessory exercises use a fixed weight and rep target instead of %1RM. Today the app
carries the last-used weight forward but never evaluates whether it's time to change it.
This feature adds auto-regulation: when an accessory is completed at full prescribed reps
with a low RPE, the app offers a one-tap weight increase for next session. When reps are
missed two sessions running, it offers a decrease.

The Pillars program explicitly anticipates this — its Hypertrophy block accessory scheme
reads: *"Fixed rep target per exercise, auto-regulate weight"* (RPE target 7–8).

## Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Scope | Slots with `category === 'accessory'` only |
| Timing | Inline chip immediately after the RPE tap |
| Increase trigger | One qualifying session (no streak required) |
| Decrease trigger | Missed reps two consecutive sessions at the same weight |
| Increment | Per-exercise, stored on the exercise (not the program), default 5 lbs |
| Increment editing | Exercise detail screen |
| History | Accepted adjustments listed on the exercise detail screen with reasons |

## User Experience

### Workout flow (suggestion chip)

After the final set of an accessory, the existing RPE selector appears. On RPE tap, the
app evaluates the progression rules. If a suggestion applies, a compact chip appears
beneath the RPE row inside the (still-expanded) card (the RPE row stays visible, so the
RPE can still be changed — the chip re-evaluates on each tap until accepted):

```
Felt easy — 75 lbs next time?      [ ✓ Yes ]  [ ✕ ]
```

- **Accept (✓):** adjustment saved, card collapses, normal auto-advance continues.
  Next session pre-fills the new weight.
- **Dismiss (✕) or ignore:** nothing saved; collapse/auto-advance proceeds as today.
  Dismissals are not remembered — if next session also qualifies, it asks again.
- **No suggestion:** flow is pixel-identical to today.
- The card holds open until the user responds to the chip (or taps elsewhere/advances);
  auto-advance fires as soon as the chip is resolved. Works identically in the superset
  advance path.
- Once accepted, changing the RPE does not revoke the adjustment (the user can always
  adjust weight manually next session).

Drop variant after two consecutive missed sessions:

```
Tough two weeks — drop to 65 next time?      [ ✓ Yes ]  [ ✕ ]
```

### Exercise detail screen

Two additions, shown only for exercises with `type === 'accessory'`:

1. **Progression history** — a compact card listing accepted adjustments, newest first:
   `75 lbs  ↑ from 70 · felt easy  ·  Jul 13`. Manual weight edits do not appear here
   (they're visible in the session history). Capped at **3 entries**, with a
   `View all ›` link opening a full-page list of every adjustment.
2. **Weight increment** — an editable row (`Increment: 5 lbs`) inside the progression
   card. Applies to this exercise across all programs, indefinitely.

Ordering and caps (2026-07-14 mockup review):

- The **session history card sits above the progression history card** — it's the more
  important of the two.
- Session history is capped at **5 rows**, also with a `View all ›` link to a full-page
  list of all sessions for the exercise.
- The two `View all` targets are lightweight full-screen list pages (same row styling as
  the cards, scrollable, nothing else).

Non-accessory exercise pages are unchanged apart from the session-history cap/link,
which applies everywhere the section exists.

## Rules (precise)

### Increase suggestion — all must hold at RPE-tap time

1. The slot's `category` is `'accessory'` (template slots only; ad-hoc exercises are
   excluded in v1 — they have no slot category).
2. Every prescribed set has `status === 'completed'` with `actual_reps >= target_reps`
   (no `completed_below`, no `skipped`).
3. Tapped RPE ≤ the block's easy threshold (see *RPE threshold* below).
4. The current block defines `accessory_scheme.rpe_target`. The Pillars Deload block
   does not → the feature is silent during deload, matching its "use lighter weight"
   intent.

Suggested weight = this session's most common actual weight + the exercise's increment.

### Decrease suggestion

- This session has at least one set with `status === 'completed_below'`, AND the
  previous completed session for this exercise (same query as the existing pre-fill,
  `getLastSessionForExercise`) also had at least one `completed_below` set, AND both
  sessions' most common actual weight is the same.
- `skipped` sets do not count toward the miss streak (skipping may mean ran-out-of-time,
  not too-heavy).
- Suggested weight = current weight − increment.
- One bad session is ignored entirely.

### RPE threshold parsing

`accessory_scheme.rpe_target` is a string: `"7-8"` → threshold is the lower bound (7);
a single value `"7"` → 7. Qualify when tapped RPE ≤ threshold.

## Data Model

Two additions via the existing incremental migration pattern in `src/db/database.ts`.
Existing on-device data is untouched.

### `exercises.weight_increment` (new column)

`REAL`, nullable. `NULL` means "use the default" (5 lbs). Edited from the exercise
detail screen. Lives on the exercise, not the program — dips are dips everywhere.

### `weight_adjustments` (new table)

One row per **accepted** suggestion:

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | uuid |
| `exercise_id` | TEXT | FK exercises |
| `program_id` | TEXT | run it happened in |
| `session_id` | TEXT | session it was accepted in |
| `old_weight` | REAL | weight this session was performed at |
| `new_weight` | REAL | accepted target |
| `reason` | TEXT | `'easy'` \| `'misses'` |
| `created_at` | TEXT | ISO timestamp |

Dismissals write nothing.

### Weight resolution (updated)

Current order in `useWorkoutSession`:
`%1RM calc → last session's most common weight → slot default_weight → 0`.

New order inserts one step:

1. `%1RM` calc (main lifts — unchanged, adjustments never apply)
2. **Latest `weight_adjustments` row for the exercise, iff `created_at` is newer than
   the last completed session containing that exercise** — i.e. "accepted but not yet
   trained at"
3. Last session's most common weight (existing behavior)
4. `slot.default_weight`
5. 0

This guarantees manual edits always win: completing a session at any weight makes that
session newer than the adjustment, so step 3 takes over. An accepted suggestion can
never revert a manual change.

## Architecture

- **`evaluateProgression`** (new, `src/utils/progression.ts`): pure function
  `(input: {category, sets, rpe, rpeThreshold, currentWeight, increment, lastSessionSets, lastSessionWeight}) → {kind: 'increase' | 'decrease', suggestedWeight} | null`.
  All rules above live here; exhaustively unit-testable with no DB.
- **`src/db/weightAdjustments.ts`** (new): `recordAdjustment`, `getLatestAdjustment`,
  `getAdjustmentHistory` + migration.
- **`useWorkoutSession`**: on `setRPE`, call `evaluateProgression` (last-session sets are
  already fetched for pre-fill); expose `pendingSuggestion` state + `acceptSuggestion` /
  `dismissSuggestion`; weight resolution updated per above (both the start-session and
  restore paths).
- **`ExerciseCard`**: render the chip when a suggestion is pending; hold collapse until
  resolved.
- **`app/exercise/[id].tsx`**: session history reordered above the new progression
  history card (capped 5 / 3, each with `View all ›`) + increment editor
  (accessories only).
- **Full history list pages**: two lightweight scrollable list screens (progression
  adjustments / exercise sessions), reachable only from the `View all ›` links.

No other navigation changes.

## Out of Scope (v1)

- Non-accessory categories (power/conditioning/movement/core) — widening later is a
  one-line category check
- Ad-hoc (non-template) exercises
- Streak indicator UI ("hit target 3 weeks in a row")
- Remembering dismissals / snoozing suggestions
- Configurable RPE thresholds (always derived from the block scheme)

## Testing

TDD throughout, per project tenets:

- **Unit — `evaluateProgression`:** every rule combination — all-reps × RPE boundary
  (≤7 vs 8) × category × missing scheme (deload) × 2-miss streak (same/different
  weights, skipped-set exclusion, single miss).
- **Unit — DB:** migration, adjustment CRUD, weight-resolution precedence including the
  "adjustment newer/older than last session" rule and manual-override-wins scenario.
- **Component — `ExerciseCard`:** chip renders on qualify, accept/dismiss callbacks,
  no chip when not qualifying, collapse behavior.
- **Full suite** (`npm test`) green before the change is considered complete.

## Mockup Gate

Per the mockup-first design tenet, an HTML mockup of (a) the suggestion chip in the
workout card and (b) the exercise-detail additions goes in `docs/mockups/` and gets
explicit approval **before implementation starts**.
