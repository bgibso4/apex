# APEX Interaction Design v1

## Overview

APEX is an iOS strength training app built with Expo/React Native. It follows a **progressive disclosure** UX philosophy: clean at first glance, details available on demand. Primary actions are one tap; secondary actions are discoverable but tucked away. The app tracks where you are and brings you back there.

## Navigation

**Bottom tabs (4):** Home | Workout | Progress | Running

- Library and Activate are modals (slide up from bottom)
- Settings is accessed from the gear icon on Home
- The Running tab is the first "supplementary goal" — architecture supports swapping it for other goals (swimming, cycling, mobility) via Settings

**State routing on app launch:**
1. Check SQLite: is there an in-progress session?
2. Yes → Open to Workout tab, restore session at exact exercise/set
3. No → Open to Home tab

## Screen 1: Home Dashboard

**Mockup:** `docs/mockups/home-dashboard.html`

### Above the Fold (always visible)
- **Header:** "APEX" left-aligned, gear icon (Settings) right-aligned
- **Program context:** Program name, "Week X of Y — [Block Name]", block timeline bar with current block highlighted
- **Today's card:** Day template name, exercise count + finisher note, "Start Workout" button. If completed: green "Completed" badge with duration and set count
- **Week dots:** Row of day chips (Sun-Sat). Completed = green checkmark, today = indigo highlight with day number, upcoming = dim with day number, rest = dash. Tapping an upcoming day navigates to Workout tab for that day's template. Tapping a completed day navigates to a read-only session detail view

### Below the Fold (scroll to see)
- Secondary feature cards that grow over time
- v1: Weekly check-in card, protocol/warmup consistency streaks
- Future: Bodyweight trend (from WHOOP), WHOOP recovery snapshot
- Follow-up pain prompt card appears here when a run was logged 24+ hours ago

### Empty State (no active program)
- "No Active Program" message with "Browse Library" button

### Completed Program State
- Program completion summary with "Browse Library" button

## Screen 2: Workout

**Mockup:** `docs/mockups/workout-screen.html`

### Day Selection (no active session)
- Header: "Week X — [Block]"
- Horizontal scrollable day chips showing program template days (not calendar days)
- Auto-focuses on today's training day
- Completed days show checkmark suffix
- Tapping a day shows a preview: day name, exercise list with sets/reps/%, "Start Session" button
- Tapping a completed day shows the completed session in review mode with a "Repeat Workout" option (creates new session, never overwrites)

### Warmup Phase
- Timer starts running in header
- Checklist of warmup items (jump rope, ankle protocol, hip IR work)
- Tap to check, "Continue to Exercises" button at bottom
- Skippable — can proceed without checking anything

### Exercise Logging (the core)
- Progress bar at top: "X of Y exercises" and "X / Y sets"
- Small "+ Add exercise" link right-aligned below the progress bar (subtle, not prominent)
- Scrollable list of all exercises
- Current exercise expanded, completed/upcoming exercises collapsed

#### Expanded Exercise Card
- **Exercise name** (large)
- **Last session** in small text: "Last: 185 lbs × 5 × 3 sets"
- **Set rows** with columns: set number, target weight (from 1RM %), target reps, action button
  - Current set: highlighted in indigo
  - Pending sets: dimmed
  - Completed sets: green values displayed as **tappable chips** (tap to edit inline)
- **Set logging:** Tap the circle button to log as prescribed. Values turn green.
- **Set editing:** Tap the green weight or rep value on a completed set to edit it inline (no modal). This is the "edit after logging" pattern.
- **Add note:** Collapsed "+" link, tappable to expand a text field for that exercise instance
- **RPE selector:** Appears after all sets complete. Horizontal row of buttons (6-7-8-9-10) with "Skip" option. Optional.

#### Collapsed Exercise Card
- Exercise name + progress indicator ("3/4" or "✓ Done")

#### Auto-scroll Behavior
- When all sets for an exercise are completed, auto-scrolls to the next exercise and expands it

### Conditioning Finisher
- Appears after last exercise as a simple checkbox row
- Shows conditioning name from program template

### Exercise Reordering
- Long press on any exercise card enters reorder mode
- Reorder banner appears below header: "Reorder exercises" with "Done" button
- All exercise cards show drag handles (☰) on the left
- Drag and drop to reorder — drop indicator line shows placement
- "Done" exits reorder mode and saves the new order for the remainder of the session
- Reorder only affects the current session — does not modify the program template

### Ad-Hoc Exercises
- Tapping "+ Add exercise" opens a bottom sheet modal
- **Exercise picker:** Search bar at top, "+ Custom Exercise" entry, then exercises grouped by muscle group (Chest, Back, Shoulders, Legs, Arms, Core)
- Selecting an exercise navigates to a configure screen (still within the modal): sets, reps, and optional weight fields
- Back arrow (←) returns to the picker list
- "Add to Workout" button adds the exercise to the bottom of the exercise list
- Ad-hoc exercises appear with an "Ad-hoc" tag in the header
- No "Last session" reference shown for ad-hoc exercises (no prior data)
- Weight shows "BW" for bodyweight exercises when no weight specified
- Ad-hoc exercises are fully logged in `set_logs` and saved with the session — they are part of the workout record
- The exercise library is a preset list of common exercises; "+ Custom Exercise" allows typing a free-form name

### Workout Complete
- "Finish Workout" button pinned at the bottom of the workout screen (disabled/gray until all programmed exercises are done, green when ready)
- Ad-hoc exercises do not need to be completed to enable the finish button — only programmed exercises count
- Summary screen: duration, total sets, total tonnage, PR callouts (amber), optional session note text field
- "Done" button returns to Home dashboard

### Session Detail (Past Workout View)

**Mockup:** `docs/mockups/past-workout-view.html`

Accessible from:
- Home screen: tap a completed day in the week row
- Progress screen: tap a completed day on the monthly calendar

**Layout:**
- Back arrow (←) + workout day name as header (same style as lift detail view)
- Date line: "Wednesday, Mar 4 · Week 6 Strength"
- Stats row: duration, total sets, tonnage, PR count
- Readiness scores: sleep, soreness, energy displayed in a 3-column grid
- Protocol chips: green "✓" chips for completed warmup/finisher items
- Exercise cards: read-only versions of the workout exercise cards, each showing:
  - Exercise name (with PR badge if applicable, Ad-hoc tag if applicable)
  - Set grid: set number, weight, reps, RPE, status (✓ or ! for below target)
- All data is read-only — no editing from this view

## Screen 3: Progress

**Mockup:** `docs/mockups/progress-screen-v2.html`

### Time Range Filter
- Two tabs: "This Program" | "All Time"
- "This Program" scopes all metrics to the active program's data
- "All Time" shows data across all programs, with program boundaries marked on charts

### Monthly Calendar
- Compact monthly grid at the top of the Progress screen
- Navigable month-by-month with left/right arrows
- Completed workout days shown as green circles
- Today highlighted with indigo ring (green-filled if completed that day)
- Rest days and future days dimmed
- Summary line at bottom: "This month — X workouts" or "All time — X workouts"
- Calendar always shows all workouts regardless of active tab — it's an orientation tool, not filtered
- Tapping a completed day navigates to the session detail view (same view as tapping a completed day on the Home week row)

### Estimated 1RM Trends
- All trend lines use a single consistent color (primary/indigo) — no per-lift color differentiation
- Top 2 main lifts (Back Squat, Bench Press) get full trend line charts with:
  - Current estimated 1RM value + delta from start
  - Line chart with dots per week, area fill
  - Subtle block background bands (hypertrophy, deload, strength) with dots centered within their respective bands — band boundaries sit at midpoints between block transitions, not on the data points
- Remaining 4 lifts in a compact 2×2 grid with mini sparklines
- Each data point = estimated 1RM from best set that session (Epley formula: weight × (1 + reps/30))
- **"All Exercises →" link** below the main lifts opens a list of every exercise ever logged. Tap any one for the same detail view (trend chart + recent sessions). Works for accessories too.
- "All Time" view: charts show longer trend lines spanning multiple programs, with dashed vertical lines at program boundaries and program names labeled

### Lift Detail View (tap a lift card)
- Back arrow + exercise name header
- Large current 1RM number centered, delta from start
- **Time range chips:** "Program | 3M | 1Y | All" — equal-width, centered, positioned close to the chart. Default to "Program". Controls both the chart scope and the session list scope
- Full trend chart with block background bands (centered on dots), Y-axis labels, block labels (Hypertrophy, DL, STR) centered within their bands
- Recent sessions list: week, day, sets × reps @ weight, estimated 1RM, RPE. Deload sessions labeled with "(deload)" tag
- Shows last 4-5 sessions with **"View all X sessions →"** link at bottom for full history
- As data grows over months/years, the chart compresses data points to fit the selected range; session list remains paginated

### Training Consistency
- **This Program view:** Overall completion percentage (e.g., "91% — 28/31 sessions"), bar per week showing sessions completed vs planned. Color coding: green = all done, amber = partial, indigo = current week in progress
- **All Time view:** Overall percentage across all programs, per-program horizontal bars with completion percentages

### Volume — Actual vs Planned
- Legend: actual sets (colored bar) vs planned sets (gray background bar)
- Row per week with actual/planned numbers
- Bar color matches block type (indigo = hypertrophy, green = deload, amber = strength)

### Protocol Consistency (warmup + finisher tracking)
- Tracks how often each warmup/finisher item was checked across sessions
- Row per item: name, progress bar, percentage, "X / Y sessions" count
- Items: jump rope, ankle protocol, hip IR work, conditioning finisher
- Color coding: green (≥80%), amber (50-79%)
- Scoped to active tab (This Program or All Time)

### Bodyweight (background data)
- Small number + sparkline on Progress screen
- Data synced from WHOOP when connected, or manually entered
- Used for relative strength calculations (e.g., "1.8x BW squat")

## Screen 4: Running

**Mockup:** `docs/mockups/running-screen-v2.html`

Running data is **program-independent** — it persists across all training programs on its own timeline.

### Sub-tabs: "Log" | "Trends"

### Log Tab
- **Log form:**
  - Duration (minutes) and distance (miles) side by side
  - Auto-calculated pace display (min/mi) in cyan highlight
  - Pain level selector (0-10) with color gradient (green→red) and description text
  - "Included pickups" toggle
  - Collapsible note field ("+ Add note")
  - "Log Run" button
- **Recent runs list:**
  - Each entry: date, duration, distance, pace
  - Pickup badge when applicable
  - Dual pain badges per run:
    - **Acute** (solid): pain during/right after the run
    - **+24h** (dashed outline): delayed pain logged the next day

### Follow-up Pain Prompt
- Appears on the Home screen (below the fold) when you open the app 24+ hours after logging a run
- Card: "How's the pain today? After your run on [day] · [duration] · [distance]"
- Same 0-10 pain selector + "Save" button
- Dismissable with × — gone forever if dismissed
- Save → card fades away, delayed pain value stored on that run's record

### Trends Tab
- **Summary stats (2×2 grid):** Total runs, total miles, avg pain (with delta), avg pace (with delta)
- **Pain trend chart:** Dual lines — solid (acute) shifting from red→green, dashed (delayed/+24h). Both on same chart with legend.
- **Pace trend chart:** Cyan line, lower = better (inverted Y axis)
- **Duration trend chart:** Cyan line showing steady increase

## Screen 5: Program Library (Modal)

**Mockup:** `docs/mockups/library-activate.html`

- Header: "Program Library" + × close button
- List of program cards, each showing:
  - Program name, duration, block timeline bar
  - Status badge: "Active" (green), "Completed" (dim), or no badge (inactive)
- Active program: shows "Currently Active — Week X" indicator
- Inactive program: shows "Activate" button
- Completed program: tappable to view detail

### Completed Program Detail
- Back arrow + × close
- Program name, completion date
- Block timeline bar
- Program results: sessions completed, completion %
- 1RM changes: before → after for each lift with green deltas
- "Run Again with Updated 1RMs" button

## Screen 6: Activate (Modal)

**Mockup:** `docs/mockups/library-activate.html`

- Header: back arrow to Library + × close
- Program name
- Description: "Enter your current one-rep maxes..."
- **First time (no history):** Empty input fields with placeholder dashes
- **With history:** Fields pre-filled in indigo from previous program's estimated maxes. Notice banner: "Pre-filled from [Program Name] estimated maxes. Edit any value to override."
- Input row per main lift: exercise name, input field, "lbs" unit
- "Activate Program" button
- "Skip for now — enter 1RMs later" link

### Smart Defaults
- Auto-fill from most recent estimated 1RMs when available
- User can override any value
- Skip option always available

## Screen 7: Settings

**Mockup:** `docs/mockups/settings-screen.html`

Accessed from gear icon on Home dashboard.

### Sections:
- **Training:** Units toggle (lbs/kg), Edit Current 1RMs (navigate to 1RM editor)
- **Supplementary Goals:** Pinned goal selector (which goal shows in bottom nav). v1: only Running available. Future: Swimming, Cycling, Mobility shown as "Coming Soon"
- **Integrations:** WHOOP connection. v1: "Coming Soon" badge. When connected: green "Connected" badge + toggles for "Show Recovery on Dashboard" and "Show at Workout Start"
- **Data:** Export training data (JSON), Clear All Data (red Reset button with confirmation)
- **Version:** "APEX v0.1.0" at bottom

## Data Architecture Notes

### State Persistence (Hard Requirement)
- Active workout session persisted to SQLite (session ID, current exercise index, set statuses)
- On app launch: check for in-progress session → restore to exact position
- iOS keeps app in memory during phone lock (covers 95% of cases)
- SQLite persistence covers the edge case of OS killing the app

### Bodyweight Log
- New table: date, weight, source (manual/whoop)
- One entry per day max
- WHOOP auto-populates when connected
- Displayed subtly on Progress screen

### Running Follow-up Pain
- `run_logs` table gets a `delayed_pain` column (nullable integer 0-10)
- `followup_pending` flag (boolean) set to true on run log, cleared when follow-up is submitted or dismissed
- App checks on launch: any runs with `followup_pending = true` AND `date < now - 24h`

### Supplementary Goals Architecture
- Goals are a generic concept with a type (running, swimming, etc.)
- Each goal type has its own log table and trend calculations
- Settings stores which goal is pinned to the nav bar
- v1: only running is implemented, but the data model supports expansion

## Design Principles

1. **Optimize for the common case.** Tap to log a set as prescribed. Only interact more when something was different.
2. **State is sacred.** Never lose workout progress. Persist to SQLite, restore on relaunch.
3. **Progressive disclosure.** Exercise cards collapsed by default. Notes collapsed. RPE optional. Details available on demand.
4. **No vanity metrics.** Every displayed metric should be actionable or tell a story. 1RM trends > total tonnage. Compliance > raw set counts.
5. **Dark, minimal, gym-proof.** High contrast dark theme. Large tap targets. Works with sweaty hands.
6. **Theme as tokens, not colors.** All visual styling flows from semantic design tokens. Changing the look of the app means changing tokens, not hunting through components.

## Theme Architecture (Hard Requirement)

The app's visual identity must be defined through a **semantic design token system** that makes theming changes trivial. This is a first iteration — colors, contrast, and accent choices will evolve.

### Token Layers

1. **Primitive palette** — Raw color values defined once (e.g., `indigo600: '#6366f1'`, `green500: '#22c55e'`). Never referenced directly by components.
2. **Semantic tokens** — What a color *means*, not what it *looks like*. Components only reference these:
   - `colors.primary` — Main accent (indigo in v1)
   - `colors.primaryMuted` — Subtle primary backgrounds
   - `colors.success` — Completed states, positive deltas
   - `colors.warning` — Partial completion, strength block
   - `colors.danger` — Errors, missed sessions
   - `colors.accent` — Secondary highlight (cyan for running/pace)
   - `colors.bg` — App background
   - `colors.card` — Card/surface background
   - `colors.surface` — Elevated surface
   - `colors.border` — Card borders, dividers
   - `colors.textPrimary` — Main text
   - `colors.textSecondary` — Subdued text
   - `colors.textTertiary` — Dimmest text, placeholders
3. **Component tokens** (optional, as needed) — Specific overrides like `colors.setCompleted`, `colors.deloadBand`, `colors.currentWeek`. Map to semantic tokens by default but can be overridden individually.

### Rules

- **Components never use hex values or primitive palette names.** Always `theme.colors.primary`, never `'#6366f1'` or `colors.indigo600`.
- **Spacing, radii, and typography** also defined as tokens (`spacing.sm`, `radii.card`, `fontSize.body`).
- **Single source of truth:** One theme file that defines the full token set. Changing `primary` from indigo to teal propagates everywhere.
- **Dark theme first, light theme possible.** Token structure supports multiple themes (dark/light) via the same semantic names resolving to different primitives.
- **Future: user-customizable.** A subset of tokens (primary accent, contrast level) could be exposed in Settings as a theme picker.

## Mockup Index

All mockups are in `docs/mockups/`:
- `home-dashboard.html` — Home screen (active program, completed day, empty state)
- `workout-screen.html` — Workout flow (day select, warmup, exercise logging, RPE/finish, summary)
- `progress-screen-v2.html` — Progress (calendar, 1RM trends with block bands, consistency, volume, protocol consistency, lift detail with time range chips)
- `running-screen-v2.html` — Running (log form with distance/pace, follow-up prompt, trends with dual pain)
- `library-activate.html` — Library (program list, completed detail) and Activate (first time, with history)
- `settings-screen.html` — Settings (v1, goal selector, WHOOP connected state)
- `add-exercise-flow.html` — Add exercise flow (workout with + link, exercise picker, configure, ad-hoc in workout, reorder mode)
- `past-workout-view.html` — Past workout view (tap completed day on home, read-only session detail)

## Future Features (Captured, Not Designed)

- WHOOP integration (recovery, sleep, strain, bodyweight sync)
- Additional supplementary goals (swimming, cycling, mobility)
- Program builder/editor (create custom programs in-app)
- JSON import for programs (from coaches or online)
- Weekly check-in prompts (bodyweight, dorsiflexion measurements)
