# Homepage Refinements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Polish the home screen with current-week highlighting, completed session stats, rest day quotes, uniform spacing, and first-launch animations.

**Architecture:** Six incremental changes to existing components. The mockup comes first, then each feature is built with TDD. No new DB queries needed — we reuse `getSetLogsForSession` and derive stats in the HomeScreen. Animations use `react-native-reanimated` entering animations.

**Tech Stack:** React Native, TypeScript, react-native-reanimated, Jest + @testing-library/react-native

**Design doc:** `docs/plans/2026-03-07-homepage-refinements-design.md`

---

### Task 1: Build Updated HTML Mockup

**Files:**
- Create: `docs/mockups/home-2026-03-07.html`

This mockup shows three phone states side by side, building on the existing `home-dashboard.html`:

**Step 1: Create the mockup**

Build the HTML mockup with three phone frames:

1. **Active Program (today is training day)** — Same as existing mockup but with:
   - Month calendar replaces week row
   - Current week row has a subtle `#1e1e30` background band
   - Current-week upcoming training days have brighter text than future weeks

2. **Completed Session** — Same but:
   - TodayCard shows `Completed` badge (left) + `52 min . 24 sets` (right, dim)
   - Month calendar with current week highlighted, today marked as completed

3. **Rest Day** — New state:
   - TodayCard restyled: "REST DAY" label, italic quote, "Tomorrow: Upper Push & Conditioning" preview
   - Card has border like session card
   - Month calendar with current week highlighted

Use the same CSS patterns from `docs/mockups/home-dashboard.html` (phone frame, status bar, tab bar, dynamic island). The calendar styling should match `MonthCalendar.tsx` (S M T W T F S headers, day numbers in circles, green for completed).

**Step 2: Review mockup in browser**

Open the file in a browser and verify all three states look correct.

**Step 3: Commit**

```bash
git add docs/mockups/home-2026-03-07.html
git commit -m "Add updated homepage mockup with calendar highlight, stats, rest day quotes"
```

---

### Task 2: Uniform Section Spacing

**Files:**
- Modify: `app/(tabs)/index.tsx` (styles: `scrollContent`, remove gap workarounds)
- Modify: `src/components/ProgramTimeline.tsx` (remove `marginBottom` from `timeline` style)
- Modify: `src/components/TodayCard.tsx` (remove `marginBottom` from `card` style)
- Modify: `src/components/MonthCalendar.tsx` (remove `marginBottom` from `container` style)

**Step 1: Write a snapshot-style layout test**

In existing test files, there are no spacing-specific tests. This is a visual change — verify by running existing tests to ensure nothing breaks.

Run: `npm test -- --testPathPattern="(TodayCard|MonthCalendar|ProgramTimeline)" --no-coverage`

**Step 2: Remove per-component marginBottom**

In `src/components/ProgramTimeline.tsx`, change the `timeline` style:
```ts
// REMOVE: marginBottom: Spacing.xxl,
```

In `src/components/TodayCard.tsx`, change the `card` style:
```ts
// REMOVE: marginBottom: Spacing.xxl,
```

In `src/components/MonthCalendar.tsx`, change the `container` style:
```ts
// REMOVE: marginBottom: Spacing.lg,
```

**Step 3: Add gap to ScrollView contentContainerStyle**

In `app/(tabs)/index.tsx`, update `scrollContent`:
```ts
scrollContent: {
  paddingTop: Spacing.screenTop,
  paddingHorizontal: Spacing.screenHorizontal,
  paddingBottom: Spacing.screenBottom,
  gap: Spacing.contentGap,
},
```

Also remove `marginBottom: Spacing.lg` from the `programContext` style, since the parent gap now handles spacing.

**Step 4: Run tests**

Run: `npm test -- --no-coverage`
Expected: All existing tests pass.

**Step 5: Commit**

```bash
git add app/(tabs)/index.tsx src/components/ProgramTimeline.tsx src/components/TodayCard.tsx src/components/MonthCalendar.tsx
git commit -m "Normalize homepage spacing to uniform contentGap via parent gap"
```

---

### Task 3: Current Week Highlight in MonthCalendar

**Files:**
- Modify: `src/components/MonthCalendar.tsx`
- Test: `__tests__/components/MonthCalendar.test.tsx`

**Step 1: Write failing tests**

Add these tests to `__tests__/components/MonthCalendar.test.tsx`:

```tsx
it('applies current-week highlight style to the row containing today', () => {
  // Mock today as June 15, 2025 (a Sunday, row index 3 in June 2025 grid)
  const days = buildJuneDays();
  // Mark day 15 as today by checking rendered output
  const { toJSON } = render(
    <MonthCalendar {...defaultProps} days={days} today="2025-06-15" />,
  );
  const tree = JSON.stringify(toJSON());
  // The current week row should have testID="current-week-row"
  expect(screen.getByTestId('current-week-row')).toBeTruthy();
});

it('does not apply current-week highlight when today is not in displayed month', () => {
  const days = buildJuneDays();
  // today is in July, not June
  render(
    <MonthCalendar {...defaultProps} days={days} today="2025-07-10" />,
  );
  expect(screen.queryByTestId('current-week-row')).toBeNull();
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --testPathPattern="MonthCalendar" --no-coverage`
Expected: FAIL — `today` prop not accepted, `current-week-row` testID not found.

**Step 3: Implement current-week highlight**

In `src/components/MonthCalendar.tsx`:

1. Add an optional `today` prop (defaults to computed today string for production, injectable for tests):

```tsx
export interface MonthCalendarProps {
  // ... existing props
  /** Override today's date for testing (YYYY-MM-DD). Defaults to actual today. */
  today?: string;
}
```

2. In the component, use the prop or fall back to computed:

```tsx
const todayDate = props.today ?? (() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
})();
```

3. Determine which grid row index contains today:

```tsx
const currentWeekRowIndex = useMemo(() => {
  for (let i = 0; i < grid.length; i++) {
    if (grid[i].some(cell => cell?.date === todayDate)) return i;
  }
  return -1;
}, [grid, todayDate]);
```

4. In the week row rendering, apply a highlight style when `weekIndex === currentWeekRowIndex`:

```tsx
<View
  key={weekIndex}
  style={[
    styles.weekRow,
    weekIndex === currentWeekRowIndex && styles.currentWeekRow,
  ]}
  testID={weekIndex === currentWeekRowIndex ? 'current-week-row' : undefined}
>
```

5. Add the style:

```tsx
currentWeekRow: {
  backgroundColor: Colors.surface,
  borderRadius: BorderRadius.button,
  marginHorizontal: -Spacing.xs,
  paddingHorizontal: Spacing.xs,
},
```

6. For current-week upcoming training days, add brighter text. In the day number Text style logic, add a condition:

```tsx
const isCurrentWeek = weekIndex === currentWeekRowIndex;
// In the style array for dayNumber:
cell.isTrainingDay && isFuture && !cell.isCompleted && isCurrentWeek && styles.dayNumberCurrentWeekUpcoming,
```

```tsx
dayNumberCurrentWeekUpcoming: {
  color: Colors.text,
  fontWeight: '600',
},
```

**Step 4: Run tests**

Run: `npm test -- --testPathPattern="MonthCalendar" --no-coverage`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/MonthCalendar.tsx __tests__/components/MonthCalendar.test.tsx
git commit -m "Add current-week highlight band to MonthCalendar"
```

---

### Task 4: Completed TodayCard Stats

**Files:**
- Modify: `src/components/TodayCard.tsx`
- Modify: `app/(tabs)/index.tsx` (data fetching)
- Test: `__tests__/components/TodayCard.test.tsx`

**Step 1: Write failing tests**

Add to `__tests__/components/TodayCard.test.tsx`:

```tsx
it('shows session stats when completed and stats provided', () => {
  render(
    <TodayCard
      {...defaultProps}
      todayTemplate={mockTemplate}
      isCompleted={true}
      completedStats={{ durationMin: 52, setCount: 24 }}
    />,
  );
  expect(screen.getByText(/52 min/)).toBeTruthy();
  expect(screen.getByText(/24 sets/)).toBeTruthy();
});

it('does not show stats when completed but no stats provided', () => {
  render(
    <TodayCard
      {...defaultProps}
      todayTemplate={mockTemplate}
      isCompleted={true}
    />,
  );
  // Should still show completed badge
  expect(screen.getByText(/completed/i)).toBeTruthy();
  // But no stats text
  expect(screen.queryByText(/min/)).toBeNull();
});
```

**Step 2: Run to verify failure**

Run: `npm test -- --testPathPattern="TodayCard" --no-coverage`
Expected: FAIL — `completedStats` prop not recognized.

**Step 3: Implement stats display**

In `src/components/TodayCard.tsx`:

1. Add optional `completedStats` prop:

```tsx
export interface TodayCardProps {
  todayTemplate: DayTemplate | undefined;
  isCompleted: boolean;
  blockColor: string;
  onPress: () => void;
  completedStats?: { durationMin: number; setCount: number };
}
```

2. In the completed branch, add stats to the right of the badge:

```tsx
{isCompleted ? (
  <View style={styles.completedRow}>
    <View style={styles.completedBadge}>
      <Text style={styles.completedBadgeText}>{'\u2713'} Completed</Text>
    </View>
    {completedStats && (
      <Text style={styles.completedStats}>
        {completedStats.durationMin} min {'\u00B7'} {completedStats.setCount} sets
      </Text>
    )}
  </View>
) : (
  // ... existing start button
)}
```

3. Add the style:

```tsx
completedStats: {
  color: Colors.textDim,
  fontSize: FontSize.body,
},
```

**Step 4: Wire up data in HomeScreen**

In `app/(tabs)/index.tsx`:

1. Add state for completed stats:
```tsx
const [completedStats, setCompletedStats] = useState<{ durationMin: number; setCount: number } | null>(null);
```

2. In `loadData`, after fetching `todayCompleted`, if it exists and has `completed_at`:
```tsx
if (todayCompleted?.completed_at) {
  setTodaySessionId(todayCompleted.id);
  const setLogs = await getSetLogsForSession(todayCompleted.id);
  const completedSets = setLogs.filter(s => s.status === 'completed' || s.status === 'completed_below');
  const startedAt = new Date(todayCompleted.started_at).getTime();
  const completedAt = new Date(todayCompleted.completed_at).getTime();
  const durationMin = Math.round((completedAt - startedAt) / 60000);
  setCompletedStats({ durationMin, setCount: completedSets.length });
} else {
  setTodaySessionId(todayCompleted?.id ?? null);
  setCompletedStats(null);
}
```

3. Pass to TodayCard:
```tsx
<TodayCard
  todayTemplate={todayTemplate}
  isCompleted={completedDays.includes(todayKey)}
  blockColor={blockColor}
  onPress={...}
  completedStats={completedStats ?? undefined}
/>
```

**Step 5: Run tests**

Run: `npm test -- --no-coverage`
Expected: All pass.

**Step 6: Commit**

```bash
git add src/components/TodayCard.tsx __tests__/components/TodayCard.test.tsx app/(tabs)/index.tsx
git commit -m "Show subtle duration and set count on completed TodayCard"
```

---

### Task 5: Rest Day Card with Quotes + Up Next

**Files:**
- Modify: `src/components/TodayCard.tsx`
- Modify: `app/(tabs)/index.tsx` (compute next training day)
- Test: `__tests__/components/TodayCard.test.tsx`

**Step 1: Write failing tests**

Add to `__tests__/components/TodayCard.test.tsx`:

```tsx
it('shows REST DAY label on rest day card', () => {
  render(<TodayCard {...defaultProps} todayTemplate={undefined} />);
  expect(screen.getByText(/rest day/i)).toBeTruthy();
});

it('shows a quote on rest day', () => {
  render(<TodayCard {...defaultProps} todayTemplate={undefined} />);
  // The card should contain some text that's not just "Rest Day"
  const tree = JSON.stringify(screen.toJSON());
  // Quotes contain words like "recovery", "grow", "rest", "stronger", etc.
  expect(tree).toMatch(/grow|recover|stronger|rest|sleep|repair|adapt|earned|patience|progress/i);
});

it('shows up-next preview when nextSession provided on rest day', () => {
  render(
    <TodayCard
      {...defaultProps}
      todayTemplate={undefined}
      nextSessionName="Upper Push & Conditioning"
      nextSessionLabel="Tomorrow"
    />,
  );
  expect(screen.getByText(/tomorrow/i)).toBeTruthy();
  expect(screen.getByText(/upper push/i)).toBeTruthy();
});

it('does not show up-next when nextSession not provided', () => {
  render(<TodayCard {...defaultProps} todayTemplate={undefined} />);
  expect(screen.queryByText(/tomorrow/i)).toBeNull();
});
```

**Step 2: Run to verify failure**

Run: `npm test -- --testPathPattern="TodayCard" --no-coverage`
Expected: FAIL — quote not rendered, `nextSessionName` prop not recognized.

**Step 3: Implement rest day redesign**

In `src/components/TodayCard.tsx`:

1. Add a quotes array at the top of the file:

```tsx
const REST_DAY_QUOTES = [
  'The body grows stronger during rest, not during the workout.',
  'Recovery is not the absence of training — it is part of it.',
  'Sleep is the greatest legal performance-enhancing drug.',
  'Muscles are torn in the gym, fed in the kitchen, built in bed.',
  'Rest today. Come back sharper tomorrow.',
  'Adaptation happens when you stop, not when you push.',
  'The patience to rest is the patience to grow.',
  'You earned this day off. Use it well.',
  'Progress is built on the days between sessions.',
  'Trust the process. Trust the rest.',
  'Overtraining is underpreparing for the next session.',
  'Today you recover. Tomorrow you conquer.',
];

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
```

2. Add new optional props:

```tsx
export interface TodayCardProps {
  todayTemplate: DayTemplate | undefined;
  isCompleted: boolean;
  blockColor: string;
  onPress: () => void;
  completedStats?: { durationMin: number; setCount: number };
  nextSessionName?: string;
  nextSessionLabel?: string; // e.g. "Tomorrow" or "Monday"
}
```

3. Replace the rest day branch:

```tsx
if (!todayTemplate) {
  const quote = REST_DAY_QUOTES[getDayOfYear() % REST_DAY_QUOTES.length];
  return (
    <View style={[styles.card, styles.sessionCard]}>
      <Text style={styles.todayLabel}>Rest Day</Text>
      <Text style={styles.quoteText}>{quote}</Text>
      {nextSessionName && (
        <View style={styles.upNextRow}>
          <Text style={styles.upNextLabel}>{nextSessionLabel ?? 'Next'}:</Text>
          <Text style={styles.upNextName}>{nextSessionName}</Text>
        </View>
      )}
    </View>
  );
}
```

4. Add styles:

```tsx
quoteText: {
  color: Colors.textSecondary,
  fontSize: FontSize.md,
  fontStyle: 'italic',
  lineHeight: 20,
  marginBottom: Spacing.sm,
},
upNextRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: Spacing.xs,
  paddingTop: Spacing.md,
  borderTopWidth: StyleSheet.hairlineWidth,
  borderTopColor: Colors.border,
},
upNextLabel: {
  color: Colors.textDim,
  fontSize: FontSize.body,
  fontWeight: '600',
},
upNextName: {
  color: Colors.textSecondary,
  fontSize: FontSize.body,
},
```

**Step 4: Compute next session in HomeScreen**

In `app/(tabs)/index.tsx`, add a utility and state:

```tsx
const [nextSession, setNextSession] = useState<{ name: string; label: string } | null>(null);
```

Add a function to find the next training day:

```tsx
function getNextTrainingDay(
  template: ProgramDefinition['program']['weekly_template'],
  todayKey: string,
): { day: string; template: DayTemplate } | null {
  const todayIdx = DAY_ORDER.indexOf(todayKey as typeof DAY_ORDER[number]);
  // Search from tomorrow through the next 7 days
  for (let offset = 1; offset <= 7; offset++) {
    const idx = (todayIdx + offset) % 7;
    const dayKey = DAY_ORDER[idx];
    const t = template[dayKey];
    if (t && !('type' in t && t.type === 'rest')) {
      const label = offset === 1 ? 'Tomorrow' : DAY_NAMES[dayKey];
      return { day: dayKey, template: t as DayTemplate };
    }
  }
  return null;
}
```

In `loadData`, when today is a rest day (`!todayTemplate`):

```tsx
if (!todayTemplate && active?.definition?.program?.weekly_template) {
  const next = getNextTrainingDay(active.definition.program.weekly_template, getTodayKey());
  if (next) {
    const todayIdx = DAY_ORDER.indexOf(getTodayKey() as typeof DAY_ORDER[number]);
    const nextIdx = DAY_ORDER.indexOf(next.day as typeof DAY_ORDER[number]);
    const offset = (nextIdx - todayIdx + 7) % 7;
    const label = offset === 1 ? 'Tomorrow' : DAY_NAMES[next.day];
    setNextSession({ name: next.template.name, label });
  } else {
    setNextSession(null);
  }
} else {
  setNextSession(null);
}
```

Pass to TodayCard:

```tsx
<TodayCard
  ...
  nextSessionName={nextSession?.name}
  nextSessionLabel={nextSession?.label}
/>
```

**Step 5: Run tests**

Run: `npm test -- --no-coverage`
Expected: All pass.

**Step 6: Commit**

```bash
git add src/components/TodayCard.tsx __tests__/components/TodayCard.test.tsx app/(tabs)/index.tsx
git commit -m "Redesign rest day card with rotating quotes and up-next preview"
```

---

### Task 6: First-Launch Staggered Fade-In

**Files:**
- Modify: `app/(tabs)/index.tsx`

This task uses `react-native-reanimated` entering animations. These are difficult to unit test meaningfully (animation timing is native-side), so we verify visually and ensure existing tests still pass.

**Step 1: Add module-level animation guard**

At the top of `app/(tabs)/index.tsx` (outside the component):

```tsx
import Animated, { FadeInDown } from 'react-native-reanimated';

let hasAnimatedOnce = false;
```

**Step 2: Wrap sections in Animated.View with staggered entering**

In the component's return, wrap each major section. Only apply entering animation if `!hasAnimatedOnce`:

```tsx
const shouldAnimate = !hasAnimatedOnce;

// After the return JSX is rendered, mark as animated
useEffect(() => {
  if (!hasAnimatedOnce) {
    hasAnimatedOnce = true;
  }
}, []);
```

Wrap each section:

```tsx
{/* Program context */}
<Animated.View entering={shouldAnimate ? FadeInDown.delay(0).duration(300) : undefined}>
  <View style={styles.programContext}>
    ...
  </View>
</Animated.View>

{/* Timeline */}
<Animated.View entering={shouldAnimate ? FadeInDown.delay(80).duration(300) : undefined}>
  <ProgramTimeline ... />
</Animated.View>

{/* Today card */}
<Animated.View entering={shouldAnimate ? FadeInDown.delay(160).duration(300) : undefined}>
  <TodayCard ... />
</Animated.View>

{/* Calendar */}
<Animated.View entering={shouldAnimate ? FadeInDown.delay(240).duration(300) : undefined}>
  <MonthCalendar ... />
</Animated.View>
```

**Step 3: Run tests**

Run: `npm test -- --no-coverage`
Expected: All pass. (Reanimated is mocked in test environment.)

**Step 4: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "Add first-launch staggered fade-in animation to homepage sections"
```

---

### Task 7: Final Verification

**Step 1: Run full test suite**

Run: `npm test -- --no-coverage`
Expected: All tests pass.

**Step 2: Visual review**

Open the app in Expo Go / iOS simulator. Verify:
- [ ] Uniform spacing between all homepage sections
- [ ] Current week row has subtle background highlight in calendar
- [ ] Completed TodayCard shows dim stats to the right of badge
- [ ] Rest day card shows quote and "Tomorrow: ..." preview
- [ ] First app launch: sections fade in with stagger
- [ ] Switching tabs and coming back: no animation, instant render
- [ ] Pull-to-refresh still works

**Step 3: Compare to mockup**

Open `docs/mockups/home-2026-03-07.html` in browser alongside the running app. Verify visual alignment.

**Step 4: Commit any final tweaks**

```bash
git add -A
git commit -m "Homepage refinements: week highlight, stats, rest quotes, spacing, animations"
```
