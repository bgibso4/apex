# Progress Screen Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 9 visual and functional issues on the Progress and Exercise Detail screens identified during testing.

**Architecture:** All changes are in the presentation layer (screens, components) and one DB query (`getExerciseSessionCount`). The deload-exclusion logic for deltas is a pure function change. Volume bars switch from vertical to horizontal layout matching the mockup. Chart band labels get repositioned above the chart area.

**Tech Stack:** React Native, TypeScript, expo-router, react-native-svg, SQLite (expo-sqlite)

---

### Task 1: Exclude deload sessions from delta calculation

The delta on exercise cards (e.g., `↓ -83`) is misleading because it includes deload sessions where weights are intentionally light. The fix: filter out deload history points before computing the delta. This applies to both the progress screen and exercise detail screen.

**Files:**
- Modify: `app/(tabs)/progress.tsx:145-148` — `getDelta` function
- Modify: `app/exercise/[id].tsx:109-111` — delta calculation
- Test: `__tests__/utils/deltaCalculation.test.ts` (new)

**Step 1: Write the failing test**

Create `__tests__/utils/deltaCalculation.test.ts`:

```typescript
import { getDeltaExcludingDeload } from '../../src/utils/deltaCalculation';

describe('getDeltaExcludingDeload', () => {
  it('returns null for fewer than 2 non-deload points', () => {
    expect(getDeltaExcludingDeload([])).toBeNull();
    expect(getDeltaExcludingDeload([{ e1rm: 300, blockName: 'Deload' }])).toBeNull();
    expect(getDeltaExcludingDeload([{ e1rm: 300, blockName: 'Strength' }])).toBeNull();
  });

  it('computes delta between first and last non-deload points', () => {
    const history = [
      { e1rm: 280, blockName: 'Hypertrophy' },
      { e1rm: 290, blockName: 'Hypertrophy' },
      { e1rm: 200, blockName: 'Deload' },
      { e1rm: 310, blockName: 'Strength' },
    ];
    expect(getDeltaExcludingDeload(history)).toBe(30); // 310 - 280
  });

  it('ignores trailing deload points', () => {
    const history = [
      { e1rm: 280, blockName: 'Strength' },
      { e1rm: 300, blockName: 'Strength' },
      { e1rm: 150, blockName: 'Deload' },
    ];
    expect(getDeltaExcludingDeload(history)).toBe(20); // 300 - 280
  });

  it('works with no deload points at all', () => {
    const history = [
      { e1rm: 250, blockName: 'Hypertrophy' },
      { e1rm: 275, blockName: 'Strength' },
    ];
    expect(getDeltaExcludingDeload(history)).toBe(25);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/utils/deltaCalculation.test.ts --testPathIgnorePatterns='/node_modules/' --no-coverage`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

Create `src/utils/deltaCalculation.ts`:

```typescript
/**
 * Calculate 1RM delta excluding deload sessions.
 * Compares first non-deload point to last non-deload point.
 */
export function getDeltaExcludingDeload(
  history: { e1rm: number; blockName: string }[]
): number | null {
  const nonDeload = history.filter(h => !/deload/i.test(h.blockName));
  if (nonDeload.length < 2) return null;
  return nonDeload[nonDeload.length - 1].e1rm - nonDeload[0].e1rm;
}
```

**Step 4: Run test to verify it passes**

Run: `npx jest __tests__/utils/deltaCalculation.test.ts --testPathIgnorePatterns='/node_modules/' --no-coverage`
Expected: PASS

**Step 5: Wire into progress screen**

In `app/(tabs)/progress.tsx`:
- Import `getDeltaExcludingDeload` from `../../src/utils/deltaCalculation`
- Replace the `getDelta` function body:
  ```typescript
  const getDelta = (history: E1RMHistoryPoint[]): number | null => {
    return getDeltaExcludingDeload(history);
  };
  ```

**Step 6: Wire into exercise detail screen**

In `app/exercise/[id].tsx`:
- Import `getDeltaExcludingDeload` from `../../src/utils/deltaCalculation`
- Replace delta calculation (lines 109-111):
  ```typescript
  const delta = getDeltaExcludingDeload(history);
  ```

**Step 7: Run all tests**

Run: `npx jest --testPathIgnorePatterns='/node_modules/' --no-coverage`
Expected: All pass

**Step 8: Commit**

```bash
git add src/utils/deltaCalculation.ts __tests__/utils/deltaCalculation.test.ts app/\(tabs\)/progress.tsx app/exercise/\[id\].tsx
git commit -m "fix: exclude deload sessions from 1RM delta calculation"
```

---

### Task 2: Add context label to delta display

The delta number (`↑ +15`) has no context — users don't know what it's compared against. Add a small label showing the comparison period.

**Files:**
- Modify: `app/(tabs)/progress.tsx:214-218` — top lift delta display
- Modify: `app/(tabs)/progress.tsx:265-269` — compact lift delta display
- Modify: `app/exercise/[id].tsx:160-163` — hero card delta display

**Step 1: Update progress screen top lift delta**

In `app/(tabs)/progress.tsx`, change the delta display block (around lines 214-218) to:

```tsx
{delta != null && delta !== 0 && (
  <Text style={[styles.rmTrendDelta, delta > 0 && styles.rmTrendDeltaUp]}>
    {delta > 0 ? '\u2191' : '\u2193'} {delta > 0 ? '+' : ''}{delta}
  </Text>
)}
```

This already exists. The context comes from the time range. On "This Program" the delta IS "since program start" and on "All Time" it's "since first session." The real issue is the deload corruption (fixed in Task 1). No label needed since deload fix makes the number meaningful.

Actually, rethinking: the delta on the progress screen already reads correctly AFTER the deload fix — it will show `↑ +30` instead of `↓ -3`. The exercise detail screen delta already says `↑ +10 lbs` next to `Based on 220 × 7 on Fri · Nov 14` which gives context.

**Decision: Skip this task.** The deload fix in Task 1 is the real solution. The delta becomes meaningful once deloads are excluded. No additional label needed.

---

### Task 3: Fix exercise detail navigation from All Exercises

Currently, All Exercises is a modal, and tapping an exercise pushes exercise detail on top — creating a modal-on-modal. Fix: make exercise detail pushes from the All Exercises modal use `router.push` which stacks as a full screen within the modal context. This is the correct expo-router behavior. The real fix is ensuring the exercise detail screen is NOT also presented as a modal — it should be a regular stack screen.

**Files:**
- Modify: `app/_layout.tsx:64-70` — verify exercise detail is a stack screen
- Modify: `app/exercises.tsx:125` — navigation from All Exercises

**Step 1: Check current navigation behavior**

The `exercise/[id].tsx` is inside `app/exercise/[id].tsx` — a regular stack screen (not modal). The All Exercises screen pushes to `/exercise/${ex.id}`. With expo-router, this push happens within the stack, which means it slides on top of the modal. This is actually fine behavior — it pushes a new screen on the stack.

The issue: both screens have back buttons and it works as a drill-down. This is the correct pattern. If the user feels it's awkward, we could alternatively make All Exercises a full screen instead of modal.

**Step 1: Change All Exercises from modal to full stack screen**

In `app/_layout.tsx`, change the exercises screen from `presentation: 'modal'` to a regular stack screen:

```tsx
<Stack.Screen
  name="exercises"
  options={{
    animation: 'slide_from_right',
  }}
/>
```

This makes All Exercises a full-page push instead of a bottom sheet, so exercise detail stacks naturally.

**Step 2: Update exercises.tsx header to use back arrow instead of close button**

In `app/exercises.tsx`, change the close button to a back button:

Replace the header:
```tsx
<View style={styles.header}>
  <View style={styles.headerLeft}>
    <TouchableOpacity
      style={styles.backButton}
      onPress={() => router.back()}
    >
      <Ionicons name="chevron-back" size={22} color={Colors.textDim} />
    </TouchableOpacity>
    <Text style={styles.title}>All Exercises</Text>
  </View>
</View>
```

Update styles to match exercise detail screen header pattern.

**Step 3: Commit**

```bash
git add app/_layout.tsx app/exercises.tsx
git commit -m "fix: make All Exercises a full stack screen for consistent navigation"
```

---

### Task 4: Limit All Time volume to 2 most recent programs with expand option

With many programs, the volume section would be huge. Show only the 2 most recent, with "Show N older programs" expand link.

**Files:**
- Modify: `app/(tabs)/progress.tsx:300-342` — All Time volume rendering

**Step 1: Add state for volume expansion**

In `progress.tsx`, add state:
```typescript
const [showAllPrograms, setShowAllPrograms] = useState(false);
```

**Step 2: Limit displayed programs**

In the All Time volume section, replace direct rendering of `allTimeProgramVolumes.map(...)` with:

```typescript
const MAX_VISIBLE_PROGRAMS = 2;
const visiblePrograms = showAllPrograms
  ? allTimeProgramVolumes
  : allTimeProgramVolumes.slice(-MAX_VISIBLE_PROGRAMS); // Most recent
const hiddenCount = allTimeProgramVolumes.length - MAX_VISIBLE_PROGRAMS;
```

Render `visiblePrograms.map(...)` and add expand link after:

```tsx
{!showAllPrograms && hiddenCount > 0 && (
  <TouchableOpacity
    onPress={() => setShowAllPrograms(true)}
    style={styles.showOlderLink}
  >
    <Text style={styles.showOlderText}>
      Show {hiddenCount} older program{hiddenCount > 1 ? 's' : ''} →
    </Text>
  </TouchableOpacity>
)}
```

**Step 3: Add styles**

```typescript
showOlderLink: {
  paddingVertical: Spacing.md,
  alignItems: 'center',
},
showOlderText: {
  color: Colors.indigo,
  fontSize: FontSize.body,
  fontWeight: '600',
},
```

**Step 4: Commit**

```bash
git add app/\(tabs\)/progress.tsx
git commit -m "feat: limit All Time volume to 2 most recent programs with expand"
```

---

### Task 5: Switch volume bars to horizontal layout with numbers

The mockup shows horizontal bars with actual/planned numbers (`98 / 108`). Current implementation uses vertical bar columns without numbers.

**Files:**
- Modify: `app/(tabs)/progress.tsx:297-391` — volume section rendering
- Modify: `app/(tabs)/progress.tsx:657-687` — chart styles

**Step 1: Replace vertical bar chart with horizontal row layout**

Replace the volume rendering sections (both "This Program" and "All Time") with horizontal row layout matching the mockup:

Each row structure:
```
[W1] [=====planned====] [actual/planned]
     [===actual===    ]
```

```tsx
<View style={styles.volumeCard}>
  {/* Legend */}
  <View style={styles.volumeLegend}>
    <View style={styles.volumeLegendItem}>
      <View style={[styles.legendDot, { backgroundColor: Colors.indigo }]} />
      <Text style={styles.legendText}>Actual sets</Text>
    </View>
    <View style={styles.volumeLegendItem}>
      <View style={[styles.legendDot, { backgroundColor: Colors.surface }]} />
      <Text style={styles.legendText}>Planned sets</Text>
    </View>
  </View>

  {/* Rows */}
  {mergedVolume.map((entry, i) => {
    const planned = entry.planned;
    const actual = entry.actual;
    const pct = planned > 0 ? (actual / planned) * 100 : 0;
    const plannedPct = planned > 0 ? (planned / maxVolume) * 100 : 0;
    const actualPct = planned > 0 ? (actual / maxVolume) * 100 : 0;
    const isCurrent = i === mergedVolume.length - 1 && entry.actual < entry.planned;

    return (
      <View key={i} style={styles.volumeRow}>
        <Text style={[styles.volumeWeekLabel, isCurrent && styles.volumeWeekLabelCurrent]}>
          W{entry.week}
        </Text>
        <View style={styles.volumeDualBar}>
          <View style={[styles.volumePlannedBar, { width: `${plannedPct}%` }]} />
          <View style={[styles.volumeActualBar, {
            width: `${actualPct}%`,
            backgroundColor: blockColorMap[entry.blockName] ?? Colors.indigo,
          }]} />
        </View>
        <View style={styles.volumeNums}>
          <Text style={styles.volumeActualNum}>{actual}</Text>
          <Text style={styles.volumePlannedNum}>/ {planned}</Text>
        </View>
      </View>
    );
  })}
</View>
```

**Step 2: Add new styles matching mockup**

```typescript
// Volume section
volumeCard: {
  backgroundColor: Colors.card,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: BorderRadius.cardInner,
  padding: Spacing.xl,
},
volumeLegend: {
  flexDirection: 'row',
  gap: Spacing.md,
  marginBottom: Spacing.lg,
},
volumeLegendItem: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 5,
},
legendDot: {
  width: 8,
  height: 8,
  borderRadius: 2,
},
legendText: {
  color: Colors.textMuted,
  fontSize: FontSize.xs,
  fontWeight: '600',
},
volumeRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: Spacing.sm,
  marginBottom: Spacing.sm - 2,
},
volumeWeekLabel: {
  color: Colors.textMuted,
  fontSize: FontSize.xs,
  fontWeight: '600',
  width: 24,
  textAlign: 'right',
},
volumeWeekLabelCurrent: {
  color: Colors.text,
  fontWeight: '700',
},
volumeDualBar: {
  flex: 1,
  height: 20,
  position: 'relative',
  justifyContent: 'center',
},
volumePlannedBar: {
  position: 'absolute',
  top: 0,
  left: 0,
  height: '100%',
  backgroundColor: Colors.surface,
  borderRadius: BorderRadius.xs,
},
volumeActualBar: {
  height: 12,
  borderRadius: BorderRadius.xs - 1,
  marginVertical: 4,
},
volumeNums: {
  flexDirection: 'row',
  gap: 2,
  width: 50,
  justifyContent: 'flex-end',
},
volumeActualNum: {
  color: Colors.textSecondary,
  fontSize: FontSize.xs,
  fontWeight: '700',
  fontVariant: ['tabular-nums'],
},
volumePlannedNum: {
  color: Colors.textMuted,
  fontSize: FontSize.xs,
  fontWeight: '600',
  fontVariant: ['tabular-nums'],
},
```

**Step 3: Apply same horizontal layout to All Time volume programs**

Same pattern for each program's volume in the `allTimeProgramVolumes.map(...)` section.

**Step 4: Remove old vertical chart styles** (chart, chartBarCol, bar, chartLabel)

**Step 5: Commit**

```bash
git add app/\(tabs\)/progress.tsx
git commit -m "feat: switch volume bars to horizontal layout with actual/planned numbers"
```

---

### Task 6: Add empty state for insufficient chart data on exercise detail

When Program or 3M view has fewer than 2 data points, show a message instead of nothing.

**Files:**
- Modify: `app/exercise/[id].tsx:188-214` — chart section

**Step 1: Add empty state when chart can't render**

Change the chart section (around line 189) from:
```tsx
{history.length >= 2 && (
  <View style={styles.chartCard}>...</View>
)}
```
to:
```tsx
{history.length >= 2 ? (
  <View style={styles.chartCard}>...</View>
) : (
  <View style={styles.chartCard}>
    <Text style={styles.cardTitle}>1RM Progression</Text>
    <View style={styles.chartEmpty}>
      <Text style={styles.chartEmptyText}>
        {history.length === 0
          ? 'No sessions in this time range'
          : 'Need at least 2 sessions for a chart'}
      </Text>
    </View>
  </View>
)}
```

**Step 2: Add styles**

```typescript
chartEmpty: {
  height: 80,
  justifyContent: 'center',
  alignItems: 'center',
},
chartEmptyText: {
  color: Colors.textDim,
  fontSize: FontSize.sm,
},
```

**Step 3: Commit**

```bash
git add app/exercise/\[id\].tsx
git commit -m "feat: add empty state message for insufficient chart data"
```

---

### Task 7: Fix chart band labels — move above chart, improve readability

The band labels inside the SVG are tiny (fontSize 8), overlapping, and hard to read. Move them to a separate row ABOVE the chart using React Native `Text` components instead of SVG text.

**Files:**
- Modify: `app/exercise/[id].tsx:188-213` — chart rendering section
- Modify: `src/components/TrendLineChart.tsx:59-61,177-188` — remove SVG band labels option

**Step 1: Add band label row above chart in exercise detail**

In `app/exercise/[id].tsx`, add a band label row above the `TrendLineChart`:

```tsx
{/* Block phase labels */}
{bands.length > 0 && (
  <View style={styles.bandLabelRow}>
    {bands.map((band, i) => (
      <View
        key={i}
        style={[styles.bandLabel, {
          flex: band.endIndex - band.startIndex + 1,
        }]}
      >
        <View style={[styles.bandLabelDot, { backgroundColor: band.color.replace(/18$/, '') || Colors.indigo }]} />
        <Text style={styles.bandLabelText} numberOfLines={1}>
          {band.label}
        </Text>
      </View>
    ))}
  </View>
)}
```

**Step 2: Stop passing `showBandLabels={true}` to TrendLineChart**

Change to `showBandLabels={false}` (or just remove the prop since default is false).

**Step 3: Add styles for band labels**

```typescript
bandLabelRow: {
  flexDirection: 'row',
  gap: Spacing.xs,
  marginBottom: Spacing.sm,
},
bandLabel: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: Spacing.xs,
},
bandLabelDot: {
  width: 6,
  height: 6,
  borderRadius: 3,
},
bandLabelText: {
  color: Colors.textMuted,
  fontSize: FontSize.xs,
  fontWeight: '600',
},
```

**Step 4: Commit**

```bash
git add app/exercise/\[id\].tsx
git commit -m "fix: move chart band labels above chart for readability"
```

---

### Task 8: Filter session count by time range

`getExerciseSessionCount` currently returns the total across all time, ignoring the selected time range. The "View all 15 sessions" should reflect the filtered count.

**Files:**
- Modify: `src/db/metrics.ts:374-389` — `getExerciseSessionCount`
- Modify: `app/exercise/[id].tsx:99` — pass filter params
- Test: update `__tests__/db/metrics-extended.test.ts`

**Step 1: Add filter params to getExerciseSessionCount**

Update signature and body:

```typescript
export async function getExerciseSessionCount(
  exerciseId: string,
  options?: { startDate?: string; programId?: string }
): Promise<number> {
  const db = await getDatabase();

  let sql = `SELECT COUNT(DISTINCT sl.session_id) as count
     FROM set_logs sl
     JOIN sessions s ON s.id = sl.session_id
     WHERE sl.exercise_id = ?
       AND sl.status IN ('completed', 'completed_below')
       AND s.completed_at IS NOT NULL`;

  const params: (string | number)[] = [exerciseId];

  if (options?.startDate) {
    sql += `\n       AND s.date >= ?`;
    params.push(options.startDate);
  }

  if (options?.programId) {
    sql += `\n       AND s.program_id = ?`;
    params.push(options.programId);
  }

  const row = await db.getFirstAsync<{ count: number }>(sql, params);
  return row?.count ?? 0;
}
```

**Step 2: Pass filter params from exercise detail screen**

In `app/exercise/[id].tsx`, change the `getExerciseSessionCount` call (line 99):

```typescript
getExerciseSessionCount(id, { startDate, programId: filterProgramId }),
```

**Step 3: Run tests**

Run: `npx jest --testPathIgnorePatterns='/node_modules/' --no-coverage`
Expected: All pass (existing tests pass `getExerciseSessionCount` with just exerciseId, which still works with optional params)

**Step 4: Commit**

```bash
git add src/db/metrics.ts app/exercise/\[id\].tsx
git commit -m "fix: filter session count by time range on exercise detail"
```

---

### Task 9: Improve chart rendering — viewBox sizing and aspect ratio

The exercise detail chart (`height={120}`, `viewBoxHeight={80}`) creates a distorted rendering. The `preserveAspectRatio="none"` causes the chart to stretch non-uniformly. Fix by aligning viewBox height with rendered height and improving the overall chart proportions.

**Files:**
- Modify: `app/exercise/[id].tsx:196-198` — chart height props
- Modify: `src/components/TrendLineChart.tsx` — improve dot sizing for dense data, improve band rendering

**Step 1: Fix chart proportions on exercise detail**

In `app/exercise/[id].tsx`, change TrendLineChart props:

```tsx
height={140}
viewBoxHeight={100}
```

This gives a 1.4:1 ratio instead of 1.5:1, with more vertical space for the data.

**Step 2: Improve dot density for many data points in TrendLineChart**

In `src/components/TrendLineChart.tsx`, around line 260-261, improve the dot visibility logic:

```typescript
// Show dots at regular intervals based on data density
const showEveryN = filteredData.length > 12 ? 3 : filteredData.length > 6 ? 2 : 1;
if (i % showEveryN !== 0 && filteredData.length > 4) return null;
```

Also reduce dot size for dense charts:
```typescript
const dotRadius = filteredData.length > 10 ? 3 : 3.5;
```

**Step 3: Commit**

```bash
git add app/exercise/\[id\].tsx src/components/TrendLineChart.tsx
git commit -m "fix: improve chart proportions and dot density for exercise detail"
```

---

### Summary of all tasks:

| Task | Description | Files changed |
|------|-------------|---------------|
| 1 | Exclude deload from delta calculation | new util + progress.tsx + exercise/[id].tsx |
| 2 | ~~Delta context label~~ SKIPPED — deload fix resolves this | — |
| 3 | All Exercises → full stack screen | _layout.tsx + exercises.tsx |
| 4 | Limit All Time volume to 2 programs | progress.tsx |
| 5 | Horizontal volume bars with numbers | progress.tsx |
| 6 | Empty state for insufficient chart data | exercise/[id].tsx |
| 7 | Band labels above chart | exercise/[id].tsx |
| 8 | Filter session count by time range | metrics.ts + exercise/[id].tsx |
| 9 | Chart rendering improvements | exercise/[id].tsx + TrendLineChart.tsx |
