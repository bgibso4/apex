# Session Detail Edit & Workout Complete Refinements — Design

> Approved mockup: `docs/mockups/workout-complete-edit-2026-03-11.html`

## Changes

### Workout Complete Screen
1. Replace edit button (pencil/checkmark) with hamburger menu (3-dot vertical) containing "Delete Workout"
2. Remove editMode toggle — no edit functionality on this screen anymore
3. Reorder stats: Duration | Sets | PRs
4. PR stat card: white number, amber "PRs" label, amber border (when prCount > 0)
5. Recent workouts: wrap in card container for visual separation (Option B)
6. Session notes: debounced save with "Saving..."/"Saved" indicator

### Session Detail Screen
1. Add edit button (pencil) in header — same pattern as old workout complete
2. Add PR section (fetched via getPRsForSession)
3. Stat row: Duration | Sets | PRs (remove readiness + tonnage)
4. PR stat card: same amber treatment as workout complete
5. Edit mode toggles:
   - Protocol chips become tappable (toggle completion)
   - Exercise values become editable inputs (weight, reps, RPE)
   - Exercise notes become editable text inputs
   - Session notes become editable with debounced save + saved indicator
   - Delete button appears at bottom
6. On exiting edit mode: recalculate PRs for this session
7. Exercise notes: show chat bubble icon for visibility
