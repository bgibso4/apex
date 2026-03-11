# Batch 2: Top 4 Issues Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the next 4 highest-impact issues: cancel/delete workout mid-session (#29), edit/delete run logs (#25), warmup timer (#7), and improved sample data (#12).

**Architecture:** Each issue is a self-contained task with its own DB, hook, component, and test changes. No cross-dependencies — they can be implemented in any order. All follow TDD: write failing test → implement → verify green.

**Tech Stack:** React Native (Expo), TypeScript, SQLite (expo-sqlite), Jest + @testing-library/react-native, react-native-reanimated

---

## Task 1: Cancel/Delete Workout Mid-Session (#29)

**Context:** `deleteSessionAction()` already exists in `useWorkoutSession.ts:795-808` and works from the completion screen. The hook already exports it. We need to expose it during warmup and logging phases via a UI control, plus add an "End Early" option that calls `finishSession()` from any point.

**Files:**
- Modify: `app/(tabs)/workout.tsx` (add overflow menu to warmup + logging phases)
- Modify: `src/hooks/useWorkoutSession.ts` (add `endEarlyAction`)
- Modify: `__tests__/hooks/useWorkoutSession.test.ts` (test end-early)

### Step 1: Write failing test for endEarlyAction

In `__tests__/hooks/useWorkoutSession.test.ts`, add a new describe block:

```typescript
describe('endEarlyAction', () => {
  it('should complete session and transition to complete phase', async () => {
    const { result } = await setupWithSession();

    // Log at least one set
    await act(async () => {
      await result.current.completeSetAction(0, 0);
    });

    await act(async () => {
      await result.current.endEarlyAction();
    });

    expect(mockCompleteSession).toHaveBeenCalledWith(
      expect.any(String),
      false
    );
    expect(result.current.phase).toBe('complete');
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- --testPathPattern="useWorkoutSession" --no-coverage`
Expected: FAIL — `endEarlyAction` is not a function

### Step 3: Implement endEarlyAction in hook

In `src/hooks/useWorkoutSession.ts`, add after `deleteSessionAction` (~line 808):

```typescript
/** End workout early — complete with whatever sets are logged */
const endEarlyAction = async () => {
  if (!sessionId) return;
  await finishSession();
};
```

Add `endEarlyAction` to the return object alongside `deleteSessionAction`.

### Step 4: Run test to verify it passes

Run: `npm test -- --testPathPattern="useWorkoutSession" --no-coverage`
Expected: PASS

### Step 5: Add overflow menu UI to workout screen

In `app/(tabs)/workout.tsx`, add a workout action menu that appears during warmup and logging phases. Use `Alert.alert` as an action sheet (consistent with existing patterns in the app):

Add a helper function in the workout screen component:

```typescript
const showWorkoutMenu = () => {
  const hasLoggedSets = w.exercises.some(e =>
    e.sets.some(s => s.status !== 'pending')
  );

  const buttons: AlertButton[] = [];

  if (hasLoggedSets) {
    buttons.push({
      text: 'End Early',
      onPress: () => w.endEarlyAction(),
    });
  }

  buttons.push({
    text: 'Delete Workout',
    style: 'destructive',
    onPress: () => {
      Alert.alert(
        'Delete Workout',
        'All logged sets will be lost. This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => w.deleteSessionAction(),
          },
        ]
      );
    },
  });

  buttons.push({ text: 'Cancel', style: 'cancel' });

  Alert.alert('Workout Options', undefined, buttons);
};
```

Add a `···` (ellipsis/more) button in the warmup and logging phase headers that calls `showWorkoutMenu()`. Place it:

- **Warmup phase:** Pass as a prop to `WarmupChecklist` or add a header row above it
- **Logging phase:** Add to the `loggingHeader` view (line 267), next to the timer

For the warmup phase, add a header bar above the WarmupChecklist:

```tsx
{w.phase === 'warmup' && (
  <>
    <View style={styles.phaseHeader}>
      <Text style={styles.loggingTitle}>{w.selectedTemplate?.name ?? 'Workout'}</Text>
      <TouchableOpacity onPress={showWorkoutMenu} hitSlop={12}>
        <Ionicons name="ellipsis-horizontal" size={24} color={Colors.textSecondary} />
      </TouchableOpacity>
    </View>
    <WarmupChecklist ... />
  </>
)}
```

For the logging phase, add to the existing header (line 267-274):

```tsx
<View style={styles.loggingHeader}>
  <View style={styles.loggingHeaderLeft}>
    <Text style={styles.loggingTitle}>{w.selectedTemplate?.name ?? 'Workout'}</Text>
    <Text style={styles.loggingSubtitle}>Week {w.currentWeek} — {w.block?.name ?? ''}</Text>
  </View>
  <View style={styles.loggingHeaderRight}>
    <Text style={styles.timerDisplay}>{w.timer}</Text>
    <TouchableOpacity onPress={showWorkoutMenu} hitSlop={12}>
      <Ionicons name="ellipsis-horizontal" size={24} color={Colors.textSecondary} />
    </TouchableOpacity>
  </View>
</View>
```

Add `phaseHeader` and `loggingHeaderRight` styles using design tokens.

### Step 6: Run all tests

Run: `npm test --no-coverage`
Expected: All tests pass

### Step 7: Commit

```bash
git add -A
git commit -m "feat: add cancel/delete and end-early options during workout (#29)"
```

---

## Task 2: Edit and Delete Run Logs (#25)

**Context:** The running tab (`app/(tabs)/running.tsx`) shows recent runs in a list but they're read-only. We need swipe-to-delete or long-press delete, and tap-to-edit functionality. The DB layer (`src/db/runs.ts`) currently has no `updateRun` or `deleteRun` functions.

**Files:**
- Modify: `src/db/runs.ts` (add `updateRun`, `deleteRun`)
- Modify: `src/db/index.ts` (export new functions)
- Modify: `app/(tabs)/running.tsx` (add edit/delete UI)
- Modify: `__tests__/db/runs.test.ts` (test new DB functions)

### Step 1: Write failing tests for deleteRun and updateRun

In `__tests__/db/runs.test.ts`, add two new describe blocks:

```typescript
describe('deleteRun', () => {
  it('should delete a run by id', async () => {
    await deleteRun('run-1');

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      'DELETE FROM run_logs WHERE id = ?',
      ['run-1']
    );
  });
});

describe('updateRun', () => {
  it('should update run fields', async () => {
    await updateRun('run-1', {
      durationMin: 25,
      distance: 2.5,
      painLevel: 3,
      notes: 'felt good',
      includedPickups: true,
    });

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE run_logs SET'),
      expect.arrayContaining(['run-1'])
    );
  });
});
```

### Step 2: Run tests to verify they fail

Run: `npm test -- --testPathPattern="runs.test" --no-coverage`
Expected: FAIL — `deleteRun` and `updateRun` not defined

### Step 3: Implement deleteRun and updateRun

In `src/db/runs.ts`, add:

```typescript
/** Delete a run log entry */
export async function deleteRun(runId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM run_logs WHERE id = ?', [runId]);
}

/** Update a run log entry */
export async function updateRun(runId: string, params: {
  durationMin: number;
  distance?: number;
  painLevel: number;
  notes?: string;
  includedPickups: boolean;
}): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE run_logs SET duration_min = ?, distance = ?, pain_level = ?, notes = ?, included_pickups = ? WHERE id = ?`,
    [params.durationMin, params.distance ?? null, params.painLevel, params.notes ?? null, params.includedPickups ? 1 : 0, runId]
  );
}
```

Export both from `src/db/index.ts`.

### Step 4: Run tests to verify they pass

Run: `npm test -- --testPathPattern="runs.test" --no-coverage`
Expected: PASS

### Step 5: Add delete functionality to the running screen

In `app/(tabs)/running.tsx`, in the `LogTab` component where recent runs are rendered, add a long-press handler on each run item:

```typescript
const handleDeleteRun = (run: RunLog) => {
  Alert.alert(
    'Delete Run',
    `Delete the ${formatRunDate(run.date)} run?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteRun(run.id);
          onRefresh();
        },
      },
    ]
  );
};
```

Add `onLongPress={() => handleDeleteRun(run)}` to each run item's `TouchableOpacity`.

### Step 6: Add edit functionality to the running screen

Add state for editing:

```typescript
const [editingRun, setEditingRun] = useState<RunLog | null>(null);
```

When `editingRun` is set, pre-populate the existing log form fields with the run's values and change the submit button from "Log Run" to "Save Changes". Add a cancel button to exit edit mode.

Modify the submit handler to check if editing:

```typescript
const handleSubmit = async () => {
  if (!duration || Number(duration) <= 0) return;

  if (editingRun) {
    await updateRun(editingRun.id, {
      durationMin: Number(duration),
      distance: distance ? Number(distance) : undefined,
      painLevel: pain,
      notes: notes || undefined,
      includedPickups: pickups,
    });
    setEditingRun(null);
  } else {
    await logRun({
      date: getLocalDateString(),
      durationMin: Number(duration),
      distance: distance ? Number(distance) : undefined,
      painLevel: pain,
      notes: notes || undefined,
      includedPickups: pickups,
    });
  }

  // Reset form and reload
  setDuration('');
  setDistance('');
  setPain(0);
  setNotes('');
  setPickups(false);
  setShowNotes(false);
  onRefresh();
};
```

When tapping a run in the recent list (`onPress`), enter edit mode:

```typescript
const handleEditRun = (run: RunLog) => {
  setEditingRun(run);
  setDuration(String(run.duration_min));
  setDistance(run.distance ? String(run.distance) : '');
  setPain(run.pain_level);
  setNotes(run.notes || '');
  setPickups(run.included_pickups);
  setShowNotes(!!run.notes);
  // Scroll to top so user sees the form
};
```

Update the form header to show "Edit Run" vs "Log a Run" and add a cancel button when editing:

```tsx
<View style={styles.formHeader}>
  <Text style={styles.sectionTitle}>
    {editingRun ? 'Edit Run' : 'Log a Run'}
  </Text>
  {editingRun && (
    <TouchableOpacity onPress={() => {
      setEditingRun(null);
      setDuration('');
      setDistance('');
      setPain(0);
      setNotes('');
      setPickups(false);
      setShowNotes(false);
    }}>
      <Text style={{ color: Colors.textSecondary }}>Cancel</Text>
    </TouchableOpacity>
  )}
</View>
```

Change the submit button label:

```tsx
<Text>{editingRun ? 'Save Changes' : 'Log Run'}</Text>
```

### Step 7: Run all tests

Run: `npm test --no-coverage`
Expected: All tests pass

### Step 8: Commit

```bash
git add -A
git commit -m "feat: add edit and delete for run logs (#25)"
```

---

## Task 3: Show Workout Timer on Warmup Checklist (#7)

**Context:** The timer starts when `startSession()` is called (sets `startedAt`). The `timer` display string is computed in the hook. The WarmupChecklist component currently does NOT receive or display the timer. We just need to pass it through and render it.

**Files:**
- Modify: `src/components/WarmupChecklist.tsx` (add timer display)
- Modify: `app/(tabs)/workout.tsx` (pass timer prop)
- Modify: `__tests__/components/WarmupChecklist.test.tsx` (test timer display)

### Step 1: Write failing test for timer in WarmupChecklist

In `__tests__/components/WarmupChecklist.test.tsx`, add:

```typescript
it('should display the workout timer', () => {
  const { getByText } = render(
    <WarmupChecklist
      warmupRope={false}
      warmupAnkle={false}
      warmupHipIr={false}
      blockColor="#6366F1"
      onToggleRope={jest.fn()}
      onToggleAnkle={jest.fn()}
      onToggleHipIr={jest.fn()}
      onContinue={jest.fn()}
      timer="03:45"
    />
  );

  expect(getByText('03:45')).toBeTruthy();
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- --testPathPattern="WarmupChecklist" --no-coverage`
Expected: FAIL — timer prop not recognized or text not found

### Step 3: Add timer prop to WarmupChecklist

In `src/components/WarmupChecklist.tsx`:

1. Add `timer?: string` to `WarmupChecklistProps` interface
2. Add a timer display at the top of the component, styled subtly (secondary text, not dominant):

```tsx
{timer && (
  <View style={styles.timerContainer}>
    <Ionicons name="timer-outline" size={16} color={Colors.textSecondary} />
    <Text style={styles.timerText}>{timer}</Text>
  </View>
)}
```

Style the timer to be visible but secondary — right-aligned or centered above the checklist items, using `FontSize.caption` or `FontSize.body` with `Colors.textSecondary`.

### Step 4: Pass timer prop from workout screen

In `app/(tabs)/workout.tsx`, in the warmup phase render (~line 251):

```tsx
<WarmupChecklist
  ...existing props...
  timer={w.timer}
/>
```

### Step 5: Run tests to verify they pass

Run: `npm test -- --testPathPattern="WarmupChecklist" --no-coverage`
Expected: PASS

### Step 6: Run all tests

Run: `npm test --no-coverage`
Expected: All tests pass

### Step 7: Commit

```bash
git add -A
git commit -m "feat: show workout timer on warmup checklist screen (#7)"
```

---

## Task 4: Improved Sample Data — Tag and Clear Independently (#12)

**Context:** Currently `seedRunLogs()`, `seedHistoricalProgram()`, and `seedWorkoutSessions()` insert data with no way to distinguish it from real data. `clearAllData()` deletes everything. We need an `is_sample` flag on sessions, set_logs, run_logs, programs, and exercises so sample data can be cleared independently.

**Files:**
- Modify: `src/db/schema.ts` (add `is_sample` columns + migration)
- Modify: `src/db/database.ts` (add `clearSampleData()`, bump migration)
- Modify: `src/db/seed.ts` (set `is_sample = 1` on all seeded data)
- Modify: `src/db/index.ts` (export `clearSampleData`)
- Modify: `app/settings.tsx` (add "Clear Sample Data" button, update hints)
- Modify: `__tests__/db/seed.test.ts` (test `is_sample` flag)
- Modify: `__tests__/db/sessions.test.ts` (if needed for migration test)

### Step 1: Write failing test for clearSampleData

In `__tests__/db/seed.test.ts`, add:

```typescript
import { clearSampleData } from '../../src/db/database';

describe('clearSampleData', () => {
  it('should delete only sample data from all tables', async () => {
    await clearSampleData();

    expect(mockDb.execAsync).toHaveBeenCalledWith(
      expect.stringContaining('is_sample = 1')
    );
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- --testPathPattern="seed.test" --no-coverage`
Expected: FAIL — `clearSampleData` not defined

### Step 3: Add is_sample columns via migration

In `src/db/schema.ts`, bump `SCHEMA_VERSION` to 6.

In `src/db/database.ts`, add migration for version 6 in the migration chain:

```typescript
if (currentVersion < 6) {
  await db.execAsync(`
    ALTER TABLE sessions ADD COLUMN is_sample INTEGER DEFAULT 0;
    ALTER TABLE set_logs ADD COLUMN is_sample INTEGER DEFAULT 0;
    ALTER TABLE run_logs ADD COLUMN is_sample INTEGER DEFAULT 0;
    ALTER TABLE programs ADD COLUMN is_sample INTEGER DEFAULT 0;
    ALTER TABLE exercises ADD COLUMN is_sample INTEGER DEFAULT 0;
    ALTER TABLE personal_records ADD COLUMN is_sample INTEGER DEFAULT 0;
    ALTER TABLE exercise_notes ADD COLUMN is_sample INTEGER DEFAULT 0;
  `);
}
```

Also update CREATE TABLE statements in `schema.ts` to include `is_sample INTEGER DEFAULT 0` for each table (for fresh installs).

### Step 4: Implement clearSampleData

In `src/db/database.ts`, add:

```typescript
/** Delete only sample/test data, preserving real user data */
export async function clearSampleData(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM personal_records WHERE is_sample = 1;
    DELETE FROM exercise_notes WHERE is_sample = 1;
    DELETE FROM set_logs WHERE is_sample = 1;
    DELETE FROM sessions WHERE is_sample = 1;
    DELETE FROM run_logs WHERE is_sample = 1;
    DELETE FROM programs WHERE is_sample = 1;
    DELETE FROM exercises WHERE is_sample = 1;
  `);
}
```

Export from `src/db/index.ts`.

### Step 5: Run test to verify it passes

Run: `npm test -- --testPathPattern="seed.test" --no-coverage`
Expected: PASS

### Step 6: Update seed functions to set is_sample = 1

In `src/db/seed.ts`:

**`seedRunLogs()`:** Update the INSERT statement to include `is_sample`:
```sql
INSERT OR IGNORE INTO run_logs (id, date, duration_min, distance, pain_level, pain_level_24h, notes, included_pickups, is_sample)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
```

**`seedHistoricalProgram()`:** Update all INSERTs for programs, exercises, sessions, set_logs to include `is_sample = 1`.

**`seedWorkoutSessions()`:** Update all INSERTs for sessions, set_logs, exercise_notes, personal_records to include `is_sample = 1`.

### Step 7: Add "Clear Sample Data" button to Settings

In `app/settings.tsx`, add a new handler:

```typescript
const handleClearSampleData = async () => {
  Alert.alert(
    'Clear Sample Data',
    'This removes only test data. Your real workouts and runs are safe.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear Sample Data',
        onPress: async () => {
          await clearSampleData();
          Alert.alert('Done', 'Sample data cleared.');
        },
      },
    ]
  );
};
```

Add a button in the DEV TOOLS section between "Load Sample Data" and "Clear All Data":

```tsx
<TouchableOpacity style={styles.settingRow} onPress={handleClearSampleData}>
  <Text style={styles.settingText}>Clear Sample Data</Text>
  <Text style={styles.settingHint}>Remove test data only — your real data is safe</Text>
</TouchableOpacity>
```

### Step 8: Update existing seed tests

In `__tests__/db/seed.test.ts`, update the INSERT expectations for `seedRunLogs`, `seedHistoricalProgram`, and `seedWorkoutSessions` to expect `is_sample` in the SQL and `1` in the parameter arrays.

### Step 9: Run all tests

Run: `npm test --no-coverage`
Expected: All tests pass

### Step 10: Commit

```bash
git add -A
git commit -m "feat: tag sample data with is_sample flag for independent cleanup (#12)"
```

---

## Final Verification

After all 4 tasks are complete:

1. Run full test suite: `npm test --no-coverage`
2. Verify all tests pass
3. Create a single feature branch and PR combining all 4 issues
