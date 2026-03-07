# Homepage Refinements Design

**Date:** 2026-03-07
**Scope:** Visual and UX refinements to the Home screen

## Context

The homepage is functional but needs polish. The MonthCalendar replaced the original WeekRow but lost the "this week" focus. The TodayCard doesn't show stats when completed. Rest days feel like dead ends. Spacing is inconsistent. No animations.

## Changes

### 1. Current Week Highlight in MonthCalendar

Add a subtle background band (`Colors.surface`) behind the row containing the current week. This draws the eye to "where am I this week" within the broader month. Upcoming training days in the current week get slightly brighter text than training days in future weeks.

**Implementation:** In `MonthCalendar`, identify which grid row contains today's date. Apply a background style to that row. Adjust text color for current-week upcoming training days.

### 2. Subtle Stats on Completed TodayCard

When today's session is completed, show session duration and set count to the right of the green "Completed" badge. Small font, `Colors.textDim`, not a focal point.

Layout: badge left-aligned, stats right-aligned (matching the mockup's `justify-content: space-between`).

**Data:** The HomeScreen needs to fetch set logs for the completed session to compute duration and set count, then pass them as props to TodayCard.

### 3. Rest Day Card with Rotating Quotes + "Up Next" Preview

Give the rest day state a proper card treatment (border, same card styling as the session card). Content:
- "REST DAY" label (same style as "Today's Training" label)
- A curated rotating quote (~10-15 recovery/mindset quotes), selected deterministically by day of year (`dayOfYear % quotes.length`)
- "Up Next" line showing the next training day's session name, e.g. "Tomorrow: Upper Push & Conditioning"

**Data:** HomeScreen needs to resolve the next scheduled training day from the weekly template relative to today.

### 4. Uniform Section Spacing

Remove per-component `marginBottom` from ProgramTimeline, TodayCard, and MonthCalendar. Apply `gap: Spacing.contentGap` (24px) on the ScrollView's `contentContainerStyle` so all top-level sections are evenly spaced by the parent.

### 5. First-Launch Staggered Fade-In

On the first time the home screen mounts after app launch, sections fade in with a quick stagger (~80ms apart, ~300ms duration each) using `react-native-reanimated`. On subsequent tab switches, everything renders instantly.

Track "has animated" with a module-level variable (survives re-renders, resets on app restart). Each section wraps in an `Animated.View` with a `FadeInDown` or opacity animation that only fires when `!hasAnimated`.

### 6. Mockup First

Per design tenets, build an updated HTML mockup (`docs/mockups/home-2026-03-07.html`) before writing any implementation code. The mockup should show:
- Active program state with current-week highlight in the calendar
- Completed session state with stats
- Rest day state with quote and "up next"

## Out of Scope (Future Rounds)

- APEX logo font/branding
- App splash screen with quote
- Compliance metrics (belongs on Progress tab)
- Time-aware greeting
- Last session recall

## Affected Files

- `docs/mockups/home-2026-03-07.html` (new — mockup)
- `app/(tabs)/index.tsx` (spacing, data fetching for stats + next session)
- `src/components/MonthCalendar.tsx` (current week highlight)
- `src/components/TodayCard.tsx` (completed stats, rest day card redesign, quotes)
