# Workout Screen Improvements — Design Doc

**Date:** 2026-03-07
**Status:** Approved

## Overview

A comprehensive improvement pass on the workout screen addressing gaps between the mockup and implementation, plus new features for editing, PR detection, session restore, and animations. The workout screen has 4 phases (select → warmup → logging → complete) and this design touches all of them.

## 1. Session Timer

A running elapsed timer displayed in the workout header during warmup and logging phases.

- Starts when "Start Session" is tapped
- Displays as `MM:SS` (or `H:MM:SS` after 1 hour), right-aligned in the header
- Uses a `useRef` for start timestamp + `setInterval` updating a display string every second
- Final elapsed time saved to the session record in the DB
- Displayed on the summary screen's Duration stat card
- On session restore, timer resumes from the session's `created_at` timestamp

## 2. Logging Header Improvements

Updated to match the mockup layout and consistent title sizing across the app:

- **Left side:** Workout name using `FontSize.screenTitle` / `fontWeight: '800'` (matching other screen titles), with "Week X — [Block Name]" as a subtitle in muted text below
- **Right side:** Running timer
- "Edit Warmup" link moves into the subtitle line or becomes a small link below, keeping the header compact

## 3. Progress Bar Enhancement

Shows both exercise and set counts:

- **Left:** "2 of 6 exercises"
- **Right:** "8 / 22 sets"
- **Below right:** "+ Add exercise" link in subtle indigo text (existing behavior preserved)

## 4. Per-Exercise Notes

A "+ Add note" link at the bottom of each expanded exercise card (below set rows, below RPE if visible).

- Tapping reveals an inline text input field
- Auto-saves on change (debounced)
- Stored per exercise per session
- Shows up in past workout detail view and on the summary screen's exercise breakdown

**Schema:** New `exercise_notes` table:
- `id` TEXT PRIMARY KEY
- `session_id` TEXT NOT NULL (FK → sessions)
- `exercise_id` TEXT NOT NULL
- `note` TEXT
- `created_at` TEXT
- UNIQUE(session_id, exercise_id)

## 5. PR Detection & Display

### Two tiers:

**e1RM PR (primary):** After session completion, compare each exercise's best set via Epley formula against the stored historical best e1RM. If higher, it's a PR.
- Display: "Bench Press — New est. 1RM: 245 lbs (+10 lbs)"

**Rep PR (supplementary):** For each exercise, check if any set's weight is the highest ever recorded at specific rep counts: **1, 3, 5, 8, 12, 15**. Only exact rep matches count — a set of 6 reps doesn't trigger any rep PR.
- Display: "Squat — 225 lbs × 5 (best at 5 reps)"

**Schema:** New `personal_records` table:
- `id` TEXT PRIMARY KEY
- `exercise_id` TEXT NOT NULL
- `record_type` TEXT NOT NULL ('e1rm' | 'rep_best')
- `rep_count` INTEGER (null for e1rm, the rep number for rep bests)
- `value` REAL NOT NULL (weight in lbs)
- `previous_value` REAL (for computing the delta)
- `session_id` TEXT NOT NULL (FK → sessions)
- `date` TEXT NOT NULL
- INDEX on (exercise_id, record_type, rep_count)

### Summary screen display:
- Stat grid shows PR count in amber/gold accent card
- Below the stat grid, each PR gets a small detail card with amber left border/tint
- Hidden if no PRs

## 6. Finish Button Behavior

Pinned to the bottom of the screen (outside ScrollView), but only appears once ≥50% of total sets are completed.

- Slides up from below with a spring animation when the threshold is crossed
- Scroll content gets bottom padding when button is visible to prevent overlap
- Same green styling as current
- Same "Finish Early?" confirmation alert if not all programmed exercises are done

## 7. Dynamic Conditioning Finisher

The conditioning card pulls `conditioning_finisher` from the session's day template.

- Displays the finisher name and any available details (sets × distance/duration)
- If the template has no `conditioning_finisher`, the card is hidden entirely

## 8. Enhanced Summary Screen

**Stat grid (2×2):**
- **Duration** — from the session timer (e.g., "52:18")
- **Sets** — total completed sets
- **Total Volume** — sum of (weight × reps) across all sets, formatted as "12,450 lbs"
- **PRs** — count in amber/gold accent

**PR detail cards** — below stat grid, each PR as a small highlighted card. Hidden if no PRs.

**Exercise breakdown** — existing expandable behavior, now also shows per-exercise notes if entered.

**Session notes** — stays at the bottom.

**Edit mode:**
- "Edit" button in top right of summary screen
- Tapping enters edit mode: weight/rep values become tappable to modify inline, RPE adjustable, notes editable
- "Save" button replaces "Edit" while in edit mode
- At the very bottom of edit mode: subtle red "Delete Workout" text link with confirmation alert
- Delete removes the session and all associated set logs, notes, and PRs from the DB

## 9. Post-Completion Workout Tab State

When today's workout is completed and you navigate to the Workout tab:

- Show the completed session summary (Section 8 view) with Edit button
- Logic: on focus, check for completed session for today → if yes, show summary; if no, show day selector
- Existing `getCompletedSessionForDay` logic extended to fully hydrate the summary with duration, volume, PRs, and notes

## 10. Rest Day State

Updated from plain centered text:

- Subtle rest/recovery icon at top
- "Rest Day" message with "No workout scheduled" subtitle
- Small card below showing "Next workout: [Day] — [Template Name]" for upcoming context
- Keep it simple — rest days should feel calm, not empty

## 11. Session Restore

If the app is killed mid-workout, restore to exact position on relaunch:

1. On app launch / workout tab focus, check for in-progress session (created but not completed)
2. Rebuild exercise states from DB — load session's template, reconstruct set states from logged set records
3. Restore warmup state from the session record
4. Jump to logging phase with first incomplete exercise expanded
5. Restart timer from session's `created_at` timestamp for accurate elapsed time

Priority: critical — losing mid-workout progress is trust-breaking.

## 12. Animations

Five additions using `react-native-reanimated`:

1. **Phase transitions** — crossfade between phases (select → warmup → logging → complete). ~200ms.
2. **Set completion** — scale pulse on check button (1.0 → 1.15 → 1.0) with green color transition. ~150ms.
3. **Exercise auto-advance** — smooth collapse/expand when all sets done on an exercise. Layout animation. ~250ms.
4. **Progress bar fill** — animated width transition via `withTiming`.
5. **Finish button appearance** — spring `translateY` from offscreen when ≥50% threshold hit.

All animations are subtle and quick — enhance feel without slowing the one-tap logging flow.

## Schema Changes Summary

1. **`exercise_notes`** — per-exercise per-session notes
2. **`personal_records`** — e1RM and rep-best PR history
3. **Sessions table** — ensure `started_at` / `completed_at` timestamps (or `duration_seconds` column) exist for timer duration tracking

## Files Likely Affected

- `app/(tabs)/workout.tsx` — all phases, header, finish button, animations
- `src/hooks/useWorkoutSession.ts` — timer, session restore, PR computation, edit/delete
- `src/components/ExerciseCard.tsx` — per-exercise notes, set completion animation
- `src/components/SessionSummary.tsx` — stat grid, PR cards, edit mode, delete
- `src/components/DaySelector.tsx` — minor (rest day state)
- `src/components/WarmupChecklist.tsx` — minor (timer display)
- `src/db/schema.ts` — new tables
- `src/db/index.ts` — new query functions (notes CRUD, PR computation/storage, session restore)
- `src/db/metrics.ts` — PR detection logic, volume calculation
