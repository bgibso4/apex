# Progress & Exercise Detail Screen Improvements

## Overview

Close the gaps between the v2 mockup (`docs/mockups/progress-screen-v2.html`) and the current implementation of the Progress screen and Exercise Detail screen. Adds missing features, improves data density, and makes the All Time toggle functional.

## 1. Exercise Detail Screen Improvements

### Time Range Chips
- Row of 4 equal-width buttons: `Program | 3M | 1Y | All`
- Default: `Program`
- Controls both the trend chart data range and the session list below
- New DB: `get1RMHistory` needs date-range variant (filter by `startDate` instead of just `limit`)
- `getExerciseSetHistory` also needs date-range filtering

### Compact Session Rows
- Replace full set tables with scannable rows
- Each row: date (left), `weight × reps × sets` summary (center), e1RM value (right), RPE if available
- Deload sessions get a `(deload)` tag — sourced from `sessions.block_name`
- Needs query that joins `set_logs` with `sessions` to get `block_name`

### Y-axis Labels
- TrendLineChart already supports `yLabels` prop — generate and pass them

### "View all X sessions →" Link
- Default shows 5 sessions
- Link shows total count, tapping loads full list

## 2. All Exercises Screen

- New route: `app/exercises.tsx` (modal)
- Header: "All Exercises" + close button
- Exercises grouped by muscle group (Chest, Back, Shoulders, Legs, Arms, Core)
- Same grouping pattern as add-exercise picker on Workout screen — share logic where possible
- Each row: exercise name, current e1RM (if available), mini sparkline (if history exists)
- Tapping any exercise navigates to `/exercise/[id]`
- Only shows exercises logged at least once (query distinct `exercise_id` from `set_logs`, join with `exercises` for name/muscle group)
- Fix: Progress screen "All Exercises →" link currently routes to `/library` (program library) — change to `/exercises`

## 3. Training Consistency

### This Program View
- Section header: "TRAINING CONSISTENCY"
- Overall completion line: "91% — 28/31 sessions" with progress bar
- Per-week horizontal bars: completed vs planned
- Color coding: green = all done, amber = partial, indigo = current week in progress
- Planned count from `definition_json`: count day templates per week

### All Time View
- Overall percentage across all completed + active programs
- Per-program horizontal bars with program name, completion %, bar visualization

### New DB Functions
- `getTrainingConsistency(programId)` → per-week completed vs planned
- `getAllTimeConsistency()` → per-program stats

## 4. Protocol Consistency

- Section header: "PROTOCOL CONSISTENCY"
- Row per item: name, horizontal progress bar, percentage, "X / Y sessions" count
- Items: Jump Rope, Ankle Protocol, Hip IR Work, Conditioning Finisher
- Color coding: green (≥80%), amber (50-79%), default/dim (<50%)
- Data: `warmup_rope`, `warmup_ankle`, `warmup_hip_ir`, `conditioning_done` flags on sessions table
- New DB: `getProtocolConsistency(programId?)` → per-item completion rate
- Scoped to active tab (programId for This Program, null for All Time)

## 5. Block Background Bands on Charts

### TrendLineChart Changes
- New optional prop: `bands?: { startIndex: number; endIndex: number; label: string; color: string }[]`
- Renders semi-transparent rectangles behind the line with centered labels
- Band boundaries at midpoints between block transitions

### Dynamic Block-to-Color Mapping
- `getBlockColorMap(blocks: Block[]) → Record<string, string>`
- Assigns colors from a rotating palette based on block order
- Smart defaults: blocks with "deload" in the name get green, otherwise cycle through indigo, amber, cyan, etc.
- Shared utility used by both volume chart coloring and block bands

### Data
- Update `get1RMHistory` to join with sessions and return `{ date, e1rm, blockName }`
- Applied to: progress screen top lift cards (small bands, no labels) and exercise detail chart (full bands with labels)

## 6. Volume Actual vs Planned

### Visual
- Each week: two bars — actual (colored, foreground) overlaying planned (gray/dim, background)
- Bar color from dynamic block-to-color mapping (not hardcoded block types)
- Week label below each bar pair

### Data
- Actual: existing `getWeeklyVolume(programId)`
- Planned: parse `definition_json`, sum `ExerciseTarget.sets` across all day templates per week
- New DB: `getPlannedWeeklyVolume(programId)` → `{ week, plannedSets, blockName }[]`

### All Time Mode
- Per-program breakdown: each program gets its own labeled volume section with actual vs planned bars

## 7. All Time View Behavior

Currently the toggle exists but doesn't change behavior. Changes:

- **1RM charts:** Longer history spanning multiple programs, dashed vertical lines at program boundaries with program name labels
- **Training Consistency:** Per-program view (Section 3)
- **Protocol Consistency:** All sessions, not scoped to active program (Section 4)
- **Volume:** Per-program breakdown (Section 6)

### Data
- `get1RMHistory` "all" mode: more data points + program boundary info
- Query all programs with `activated_date` to calculate boundary dates

## Reusable Components & Utilities

### ProgressBar Component
- Props: label, value, max, color, showPercentage, showCount
- Used by: Training Consistency bars, Protocol Consistency bars
- Shared visual pattern: label left, bar center, value right

### getBlockColorMap() Utility
- Input: blocks from program definition
- Output: `Record<blockName, color>`
- Smart defaults for deload, otherwise rotating palette
- Used by: volume bars, block background bands

### Date-Range Filtering Pattern
- Consistent approach across `get1RMHistory`, `getExerciseSetHistory`, and new consistency queries
- Support filtering by programId, date range, or "all"

## Screens Affected
- `app/(tabs)/progress.tsx` — Sections 3, 4, 5, 6, 7
- `app/exercise/[id].tsx` — Section 1, 5
- `app/exercises.tsx` — Section 2 (new file)
- `src/components/TrendLineChart.tsx` — Section 5
- `src/components/ProgressBar.tsx` — New shared component
- `src/db/metrics.ts` — New/updated query functions
- `src/utils/blockColors.ts` — New utility
