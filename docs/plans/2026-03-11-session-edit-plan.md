# Session Detail Edit & Workout Complete Refinements — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move edit functionality from workout complete screen to session detail page, add PR display to session detail, refine workout complete with hamburger menu and card-wrapped recent workouts.

**Architecture:** Session detail becomes the single place to view and edit past workout data. Workout complete becomes a summary-only screen with a hamburger menu for delete. Both screens share the same stat row layout (Duration | Sets | PRs) with amber PR treatment. Debounced session notes saving with visual feedback on both screens.

**Tech Stack:** React Native, expo-router, SQLite (expo-sqlite), TypeScript

**Mockup:** `docs/mockups/workout-complete-edit-2026-03-11.html`

---

### Task 1: Update Workout Complete — Remove Edit Mode, Add Hamburger Menu

**Files:**
- Modify: `src/components/SessionSummary.tsx`
- Modify: `app/(tabs)/workout.tsx`
- Modify: `__tests__/components/SessionSummary.test.tsx`

This task removes the edit button/mode from SessionSummary and replaces it with a 3-dot hamburger menu that contains a "Delete Workout" option. Also reorders stats to Duration | Sets | PRs and updates PR card styling.

**Step 1: Write failing tests for the new hamburger menu and removed edit button**

Update `__tests__/components/SessionSummary.test.tsx`:

Remove the existing edit button test (`shows Edit button and calls onEdit on press`) and the delete in edit mode test (`shows Delete button in edit mode`). Replace with:

```typescript
it('shows hamburger menu button', () => {
  render(<SessionSummary {...defaultProps} />);
  expect(screen.getByTestId('menu-button')).toBeTruthy();
});

it('shows delete option when menu is pressed', () => {
  const onDelete = jest.fn();
  render(<SessionSummary {...defaultProps} onDelete={onDelete} />);
  fireEvent.press(screen.getByTestId('menu-button'));
  expect(screen.getByText('Delete Workout')).toBeTruthy();
});

it('calls onDelete when delete option is pressed', () => {
  const onDelete = jest.fn();
  render(<SessionSummary {...defaultProps} onDelete={onDelete} />);
  fireEvent.press(screen.getByTestId('menu-button'));
  fireEvent.press(screen.getByText('Delete Workout'));
  expect(onDelete).toHaveBeenCalled();
});

it('shows stats in order: Duration, Sets, PRs', () => {
  const prs = [
    { id: '1', exercise_id: 'bench', record_type: 'e1rm' as const, rep_count: null,
      value: 263, previous_value: 250, session_id: 's1', date: '2026-03-07',
      exercise_name: 'Bench Press' },
  ];
  render(<SessionSummary {...defaultProps} duration="32m" totalSets={15} prs={prs} />);
  const labels = screen.getAllByTestId('summary-label');
  expect(labels[0].props.children).toBe('Duration');
  expect(labels[1].props.children).toBe('Sets');
  expect(labels[2].props.children).toBe('PRs');
});
```

**Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/components/SessionSummary.test.tsx --no-coverage`
Expected: FAIL — menu-button testID doesn't exist yet, edit tests reference removed functionality

**Step 3: Implement hamburger menu in SessionSummary**

In `src/components/SessionSummary.tsx`:

1. Remove `editMode` and `onEdit` from `SessionSummaryProps` interface
2. Add `menuOpen` state: `const [menuOpen, setMenuOpen] = useState(false);`
3. Replace the edit button (pencil/checkmark icon) with a 3-dot menu button:
```tsx
<TouchableOpacity
  testID="menu-button"
  style={styles.menuBtn}
  onPress={() => setMenuOpen(!menuOpen)}
>
  <Ionicons name="ellipsis-vertical" size={18} color={Colors.textSecondary} />
</TouchableOpacity>
```
4. Add dropdown menu (rendered conditionally when `menuOpen` is true):
```tsx
{menuOpen && (
  <View style={styles.dropdownMenu}>
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => { setMenuOpen(false); onDelete?.(); }}
    >
      <Ionicons name="trash-outline" size={16} color={Colors.red} />
      <Text style={styles.dropdownItemText}>Delete Workout</Text>
    </TouchableOpacity>
  </View>
)}
```
5. Remove the delete button at the bottom (was only visible in editMode)
6. Reorder summary row to: Duration | Sets | PRs
7. Update PR stat card styling — when prCount > 0, apply amber border and amber label color (not amber on the number):
```tsx
<View style={[styles.summaryItem, prCount > 0 && styles.summaryItemPR]}>
  <Text style={styles.summaryValue}>{prCount}</Text>
  <Text testID="summary-label" style={[styles.summaryLabel, prCount > 0 && styles.summaryLabelPR]}>PRs</Text>
</View>
```
8. Add styles:
```typescript
menuBtn: {
  position: 'absolute', top: 8, right: 0,
  width: 36, height: 36, backgroundColor: Colors.card,
  borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.sm,
  alignItems: 'center', justifyContent: 'center',
},
dropdownMenu: {
  position: 'absolute', top: 48, right: 0, zIndex: 20,
  backgroundColor: Colors.cardLight ?? '#1E1E2E',
  borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
  padding: 4, minWidth: 160,
  shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 24,
},
dropdownItem: {
  flexDirection: 'row', alignItems: 'center', gap: 10,
  padding: 12, paddingHorizontal: 14, borderRadius: BorderRadius.sm,
},
dropdownItemText: { color: Colors.red, fontSize: FontSize.md, fontWeight: '600' },
summaryItemPR: { borderColor: `${Colors.amber}33` },
summaryLabelPR: { color: `${Colors.amber}99` },
```
9. Add `testID="summary-label"` to each summary label `<Text>` element.

**Step 4: Update workout.tsx to remove editMode props**

In `app/(tabs)/workout.tsx`:
- Remove `editMode` and `onEdit` props from the `<SessionSummary>` render
- Keep `onDelete` prop as-is (the Alert confirmation stays in workout.tsx)
- Remove `w.editMode`, `w.setEditMode`, and the `recalculatePRs` call from the `onEdit` handler
- Reorder the stat display to match Duration | Sets | PRs if ordering is controlled from workout.tsx

**Step 5: Run tests to verify they pass**

Run: `npx jest __tests__/components/SessionSummary.test.tsx --no-coverage`
Expected: All tests PASS

**Step 6: Commit**

```bash
git add src/components/SessionSummary.tsx app/\(tabs\)/workout.tsx __tests__/components/SessionSummary.test.tsx
git commit -m "refactor: replace edit button with hamburger menu on workout complete"
```

---

### Task 2: Wrap Recent Workouts in Card Container

**Files:**
- Modify: `src/components/SessionSummary.tsx`
- Modify: `__tests__/components/SessionSummary.test.tsx`

**Step 1: Write failing test**

```typescript
it('wraps recent workouts in a card container', () => {
  const recentSessions = [
    { id: 's1', name: 'Pull A', dateLabel: 'Mar 7', blockName: 'Strength Block', durationMin: 45, setCount: 18 },
  ];
  render(
    <SessionSummary
      {...defaultProps}
      recentSessions={recentSessions}
      onViewSession={jest.fn()}
      onViewAllWorkouts={jest.fn()}
    />
  );
  expect(screen.getByTestId('recent-workouts-card')).toBeTruthy();
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/components/SessionSummary.test.tsx --no-coverage`
Expected: FAIL — testID doesn't exist

**Step 3: Implement card wrapper**

In `SessionSummary.tsx`, wrap the recent workouts section (section label, cards list, "View all" link) in a container `<View>` with:
```typescript
recentWorkoutsCard: {
  backgroundColor: '#111118',
  borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.lg,
  padding: Spacing.lg, marginTop: Spacing.xxl,
},
```
Apply `testID="recent-workouts-card"` to this wrapper. Adjust inner recent cards to use a slightly lighter background (`#181824`) and remove their individual borders.

**Step 4: Run tests**

Run: `npx jest __tests__/components/SessionSummary.test.tsx --no-coverage`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/SessionSummary.tsx __tests__/components/SessionSummary.test.tsx
git commit -m "feat: wrap recent workouts in card container for visual separation"
```

---

### Task 3: Add Debounced Save Indicator to Session Notes

**Files:**
- Modify: `src/components/SessionSummary.tsx`
- Modify: `src/hooks/useWorkoutSession.ts`
- Modify: `__tests__/components/SessionSummary.test.tsx`

The session notes on workout complete should show "Saving..." while debouncing and "Saved" once persisted. This same pattern will be reused on session detail in Task 5.

**Step 1: Write failing test**

```typescript
it('shows Saved indicator for session notes when notesSaved is true', () => {
  render(
    <SessionSummary
      {...defaultProps}
      notes="Great session"
      notesSaved={true}
      onNotesChange={jest.fn()}
    />
  );
  expect(screen.getByText(/Saved/)).toBeTruthy();
});
```

**Step 2: Run test to verify current behavior**

Run: `npx jest __tests__/components/SessionSummary.test.tsx --no-coverage`
Expected: This may already pass if notesSaved rendering exists. Check and add the debounce behavior.

**Step 3: Add debounced save to useWorkoutSession**

In `src/hooks/useWorkoutSession.ts`, update the session notes handling:
- When notes change, set `notesSaved` to false and show "Saving..."
- After a 1-second debounce, call `updateSessionNotes`, then set `notesSaved` to true
- Use a `useRef` for the debounce timer to clear on unmount

```typescript
const notesTimerRef = useRef<ReturnType<typeof setTimeout>>();

const handleNotesChange = useCallback((text: string) => {
  setSessionNotes(text);
  setNotesSaved(false);
  if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
  notesTimerRef.current = setTimeout(async () => {
    if (currentSession?.id) {
      await updateSessionNotes(currentSession.id, text);
      setNotesSaved(true);
    }
  }, 1000);
}, [currentSession?.id]);
```

**Step 4: Run tests**

Run: `npx jest __tests__/components/SessionSummary.test.tsx --no-coverage`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/SessionSummary.tsx src/hooks/useWorkoutSession.ts __tests__/components/SessionSummary.test.tsx
git commit -m "feat: add debounced save indicator for session notes"
```

---

### Task 4: Add PRs and Edit Button to Session Detail — Read Mode

**Files:**
- Modify: `app/session/[id].tsx`
- Modify: `src/db/index.ts` (ensure getPRsForSession is exported)

This task updates the session detail page to: show the edit button in the header, display PRs, use the new stat row (Duration | Sets | PRs), and remove readiness/tonnage.

**Step 1: Update session detail header with edit button**

In `app/session/[id].tsx`:

1. Add state: `const [editMode, setEditMode] = useState(false);`
2. Add state: `const [prs, setPRs] = useState<PRRecord[]>([]);`
3. In the data loading effect, add: `const sessionPRs = await getPRsForSession(s.id); setPRs(sessionPRs);`
4. Import `getPRsForSession` and `PRRecord` type.

5. Update the header to include the edit button on the right:
```tsx
<View style={styles.header}>
  <View style={styles.headerLeft}>
    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
      <Text style={styles.backArrow}>←</Text>
    </TouchableOpacity>
    <Text style={styles.headerTitle}>{session.day_template_id.replace(/_/g, ' ')}</Text>
  </View>
  <TouchableOpacity
    testID="edit-button"
    style={[styles.editBtn, editMode && styles.editBtnActive]}
    onPress={() => {
      if (editMode) {
        // Exiting edit mode — recalculate PRs
        handleExitEditMode();
      }
      setEditMode(!editMode);
    }}
  >
    <Ionicons
      name={editMode ? 'checkmark' : 'pencil'}
      size={16}
      color={editMode ? Colors.green : Colors.textSecondary}
    />
  </TouchableOpacity>
</View>
```

6. Replace the stats row — remove readiness row and tonnage. New stats row:
```tsx
<View style={styles.statsRow}>
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{duration}m</Text>
    <Text style={styles.statLabel}>Duration</Text>
  </View>
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{completedSets.length}</Text>
    <Text style={styles.statLabel}>Sets</Text>
  </View>
  <View style={[styles.statItem, prs.length > 0 && styles.statItemPR]}>
    <Text style={styles.statValue}>{prs.length}</Text>
    <Text style={[styles.statLabel, prs.length > 0 && styles.statLabelPR]}>PRs</Text>
  </View>
</View>
```

7. Add PR cards section below stats (reuse same PR card styling pattern from SessionSummary):
```tsx
{prs.length > 0 && (
  <>
    <Text style={styles.sectionLabel}>Personal Records</Text>
    <View style={styles.prCards}>
      {prs.map(pr => (
        <View key={pr.id} style={styles.prCard}>
          <Text style={styles.prIcon}>🏆</Text>
          <View style={styles.prInfo}>
            <Text style={styles.prExercise}>{pr.exercise_name ?? pr.exercise_id}</Text>
            <Text style={styles.prDetail}>{formatPRDescription(pr)}</Text>
          </View>
        </View>
      ))}
    </View>
  </>
)}
```

8. Extract `formatPRDescription` into a shared utility or duplicate the format logic from SessionSummary. Preferred: extract to `src/utils/formatPR.ts` and import in both files.

9. Remove the readiness row, readiness styles, tonnage calculation, and associated styles.

10. Add new styles for edit button, PR cards, and amber stat treatment:
```typescript
headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
editBtn: {
  width: 36, height: 36, backgroundColor: Colors.card,
  borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.sm,
  alignItems: 'center', justifyContent: 'center',
},
editBtnActive: {
  backgroundColor: `${Colors.green}20`, borderColor: `${Colors.green}40`,
},
statItemPR: { borderColor: `${Colors.amber}33` },
statLabelPR: { color: `${Colors.amber}99` },
sectionLabel: {
  color: Colors.textDim, fontSize: FontSize.xs, fontWeight: '700',
  textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm, marginTop: Spacing.lg,
},
prCards: { gap: Spacing.sm, marginBottom: Spacing.lg },
prCard: {
  backgroundColor: Colors.card, borderWidth: 1, borderColor: `${Colors.amber}33`,
  borderLeftWidth: 3, borderLeftColor: Colors.amber, borderRadius: BorderRadius.md,
  padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
},
prIcon: { fontSize: 20 },
prInfo: { flex: 1 },
prExercise: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600', marginBottom: 2 },
prDetail: { color: Colors.amber, fontSize: FontSize.sm, fontWeight: '500' },
```

**Step 2: Run app or tests to verify read mode works**

Run: `npx jest --no-coverage`
Expected: All existing tests PASS (no tests yet for session detail — it's a screen)

**Step 3: Commit**

```bash
git add app/session/\[id\].tsx src/db/index.ts
git commit -m "feat: add PRs and edit button to session detail page"
```

---

### Task 5: Implement Edit Mode on Session Detail

**Files:**
- Modify: `app/session/[id].tsx`
- Modify: `src/db/sessions.ts` (if any new DB functions needed)

This is the core task — making the session detail page fully editable in edit mode.

**Step 1: Add edit mode state and DB update functions**

In `app/session/[id].tsx`, add imports for DB functions:
```typescript
import {
  updateSet, updateSessionNotes, updateProtocolCompletion,
  saveExerciseNote, deleteExerciseNote,
  detectPRs, deletePRsForSession, getPRsForSession,
  getSetLogsForSession, getExerciseInfo,
} from '../../src/db';
```

**Step 2: Implement protocol toggle in edit mode**

Protocol chips become tappable when `editMode` is true:
```tsx
{protocols.map(p => (
  <TouchableOpacity
    key={p.id}
    disabled={!editMode}
    onPress={async () => {
      await updateProtocolCompletion(p.id, !p.completed);
      setProtocols(prev => prev.map(pp =>
        pp.id === p.id ? { ...pp, completed: !pp.completed } : pp
      ));
    }}
    style={[
      styles.chip,
      p.completed ? styles.chipDone : styles.chipMissed,
      editMode && styles.chipEditable,
    ]}
  >
    <Ionicons name={p.completed ? 'checkmark' : 'close'} size={12} color={p.completed ? Colors.green : Colors.textDim} />
    <Text style={[styles.chipText, p.completed ? styles.chipTextDone : styles.chipTextMissed]}>
      {p.protocol_name}
    </Text>
  </TouchableOpacity>
))}
```

Add style:
```typescript
chipEditable: { borderStyle: 'dashed' },
```

Show ALL protocols (not just completed ones) — currently the read mode only shows completed protocols. Change the filter on line 164 to show all protocols always, using completed/missed styling to differentiate.

**Step 3: Implement session notes editing in edit mode**

Add notes state and debounced save:
```typescript
const [sessionNotes, setSessionNotes] = useState(session?.notes ?? '');
const [notesSaved, setNotesSaved] = useState(true);
const notesTimerRef = useRef<ReturnType<typeof setTimeout>>();
```

Conditionally render TextInput vs Text:
```tsx
<View style={[styles.sessionNotesCard, editMode && { borderColor: `${Colors.indigo}40` }]}>
  <View style={styles.notesHeader}>
    <Text style={styles.sessionNotesLabel}>Session Notes</Text>
    {editMode && notesSaved && <Text style={styles.notesSaved}>✓ Saved</Text>}
    {editMode && !notesSaved && <Text style={styles.notesSaving}>Saving...</Text>}
  </View>
  {editMode ? (
    <TextInput
      style={styles.sessionNotesInput}
      value={sessionNotes}
      onChangeText={(text) => {
        setSessionNotes(text);
        setNotesSaved(false);
        if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
        notesTimerRef.current = setTimeout(async () => {
          await updateSessionNotes(session.id, text);
          setNotesSaved(true);
        }, 1000);
      }}
      multiline
      placeholder="How did the session feel overall?"
      placeholderTextColor={Colors.textDim}
    />
  ) : (
    !!sessionNotes && <Text style={styles.sessionNotesText}>{sessionNotes}</Text>
  )}
</View>
```

If there are no notes and not in edit mode, hide the card entirely.

**Step 4: Implement exercise value editing in edit mode**

For each set row, conditionally render TextInput or Text for weight, reps, RPE, and other field types:

```tsx
{group.inputFields.map((field) => {
  const key = `actual_${field.type}` as keyof SetLog;
  const value = set[key];
  return editMode ? (
    <TextInput
      key={field.type}
      style={[styles.setGridValue, styles.setGridEditable, { flex: 1 }]}
      defaultValue={value?.toString() ?? ''}
      keyboardType="numeric"
      onEndEditing={(e) => {
        const newValue = parseFloat(e.nativeEvent.text) || 0;
        handleSetUpdate(set.id, field.type, newValue);
      }}
    />
  ) : (
    <Text key={field.type} style={[styles.setGridValue, { flex: 1 }]}>
      {value ?? '—'}
    </Text>
  );
})}
```

RPE column similarly toggles between Text and TextInput.

Add the set update handler:
```typescript
const handleSetUpdate = async (setLogId: string, fieldType: string, value: number) => {
  const fieldMap: Record<string, string> = {
    weight: 'actual_weight', reps: 'actual_reps',
    duration: 'actual_duration', time: 'actual_time',
    distance: 'actual_distance',
  };
  const dbField = fieldMap[fieldType] ?? fieldType;
  // Update local state
  setExerciseGroups(prev => prev.map(g => ({
    ...g,
    sets: g.sets.map(s => s.id === setLogId ? { ...s, [dbField]: value } : s),
  })));
  // Update DB
  await updateSet(setLogId, { [dbField]: value });
};
```

Note: `updateSet` in `src/db/sessions.ts` already accepts partial updates.

**Step 5: Implement exercise note editing in edit mode**

```tsx
{(editMode || !!exerciseNotes[group.exerciseId]) && (
  <View style={styles.exerciseNote}>
    <Ionicons name="chatbubble-outline" size={12} color={Colors.textDim} />
    {editMode ? (
      <TextInput
        style={styles.exerciseNoteInput}
        defaultValue={exerciseNotes[group.exerciseId] ?? ''}
        placeholder="Add a note..."
        placeholderTextColor={Colors.textDim}
        onEndEditing={(e) => {
          const text = e.nativeEvent.text.trim();
          if (text) {
            saveExerciseNote(session.id, group.exerciseId, text);
          } else {
            deleteExerciseNote(session.id, group.exerciseId);
          }
          setExerciseNotes(prev => {
            const next = { ...prev };
            if (text) next[group.exerciseId] = text;
            else delete next[group.exerciseId];
            return next;
          });
        }}
        multiline
      />
    ) : (
      <Text style={styles.exerciseNoteText}>{exerciseNotes[group.exerciseId]}</Text>
    )}
  </View>
)}
```

Apply indigo border to exercise cards in edit mode:
```tsx
<View style={[styles.exerciseCard, editMode && { borderColor: `${Colors.indigo}40` }]}>
```

**Step 6: Implement PR recalculation on edit mode exit**

```typescript
const handleExitEditMode = async () => {
  // Recalculate PRs with updated set data
  const setLogs = await getSetLogsForSession(session.id);
  const exerciseIds = [...new Set(setLogs.map(s => s.exercise_id))];
  const exerciseInfo = await getExerciseInfo(exerciseIds);

  const sessionSets = setLogs.map(sl => ({
    exercise_id: sl.exercise_id,
    actual_weight: sl.actual_weight ?? 0,
    actual_reps: sl.actual_reps ?? 0,
    status: sl.status,
    actual_duration: sl.actual_duration,
    actual_time: sl.actual_time,
    actual_distance: sl.actual_distance,
    input_fields: exerciseInfo[sl.exercise_id]?.inputFields ?? null,
  }));

  // Delete old PRs for this session and re-detect
  await deletePRsForSession(session.id);
  const newPRs = await detectPRs(session.id, session.date, sessionSets);
  setPRs(newPRs);
};
```

**Step 7: Implement delete button in edit mode**

At the bottom of the scroll view, when editMode is true:
```tsx
{editMode && (
  <TouchableOpacity
    style={styles.deleteBtn}
    onPress={() => {
      Alert.alert('Delete Workout', 'This will permanently delete this session and all its data.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteSession(session.id);
          router.back();
        }},
      ]);
    }}
  >
    <Text style={styles.deleteBtnText}>Delete Workout</Text>
  </TouchableOpacity>
)}
```

**Step 8: Add all new styles**

```typescript
setGridEditable: {
  backgroundColor: Colors.bg, borderWidth: 1, borderColor: `${Colors.indigo}40`,
  borderRadius: BorderRadius.xs, paddingVertical: 4, paddingHorizontal: 8,
  minWidth: 48, textAlign: 'center', color: Colors.text,
},
notesHeader: {
  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  marginBottom: Spacing.sm,
},
notesSaved: { color: Colors.green, fontSize: FontSize.xs, fontWeight: '600' },
notesSaving: { color: Colors.textDim, fontSize: FontSize.xs, fontWeight: '600' },
sessionNotesInput: {
  backgroundColor: Colors.bg, borderWidth: 1, borderColor: `${Colors.indigo}40`,
  borderRadius: BorderRadius.sm, padding: Spacing.sm,
  color: Colors.text, fontSize: FontSize.md, fontFamily: 'System',
  minHeight: 44, textAlignVertical: 'top',
},
exerciseNoteInput: {
  flex: 1, backgroundColor: Colors.bg, borderWidth: 1, borderColor: `${Colors.indigo}40`,
  borderRadius: BorderRadius.xs, paddingVertical: 6, paddingHorizontal: 10,
  color: Colors.text, fontSize: FontSize.sm, fontFamily: 'System',
  minHeight: 32, textAlignVertical: 'top',
},
deleteBtn: {
  marginTop: Spacing.xxl, padding: Spacing.lg,
  backgroundColor: `${Colors.red}15`, borderWidth: 1, borderColor: `${Colors.red}30`,
  borderRadius: BorderRadius.md, alignItems: 'center',
},
deleteBtnText: { color: Colors.red, fontSize: FontSize.md, fontWeight: '600' },
```

**Step 9: Run all tests**

Run: `npx jest --no-coverage`
Expected: All tests PASS

**Step 10: Commit**

```bash
git add app/session/\[id\].tsx
git commit -m "feat: add full edit mode to session detail page"
```

---

### Task 6: Extract formatPRDescription to Shared Utility

**Files:**
- Create: `src/utils/formatPR.ts`
- Modify: `src/components/SessionSummary.tsx`
- Modify: `app/session/[id].tsx`
- Create: `__tests__/utils/formatPR.test.ts`

**Step 1: Write tests for the shared utility**

```typescript
import { formatPRDescription } from '../../src/utils/formatPR';

describe('formatPRDescription', () => {
  it('formats e1rm PR with diff', () => {
    const result = formatPRDescription({
      record_type: 'e1rm', value: 263, previous_value: 250,
      rep_count: null, exercise_name: 'Bench', exercise_id: 'bench',
    });
    expect(result).toBe('New est. 1RM: 263 lbs (+13 lbs)');
  });

  it('formats e1rm PR without previous', () => {
    const result = formatPRDescription({
      record_type: 'e1rm', value: 263, previous_value: null,
      rep_count: null, exercise_name: 'Bench', exercise_id: 'bench',
    });
    expect(result).toBe('New est. 1RM: 263 lbs');
  });

  it('formats rep_best PR', () => {
    const result = formatPRDescription({
      record_type: 'rep_best', value: 225, previous_value: null,
      rep_count: 5, exercise_name: 'Squat', exercise_id: 'squat',
    });
    expect(result).toBe('225 lbs × 5 (best at 5 reps)');
  });

  it('formats best_reps PR', () => {
    const result = formatPRDescription({
      record_type: 'best_reps', value: 12, previous_value: null,
      rep_count: null, exercise_name: 'Pushup', exercise_id: 'pushup',
    });
    expect(result).toBe('12 reps (new best)');
  });

  it('formats best_duration PR', () => {
    const result = formatPRDescription({
      record_type: 'best_duration', value: 95, previous_value: null,
      rep_count: null, exercise_name: 'Plank', exercise_id: 'plank',
    });
    expect(result).toBe('1m 35s (new best)');
  });

  it('formats best_time PR', () => {
    const result = formatPRDescription({
      record_type: 'best_time', value: 120, previous_value: null,
      rep_count: null, exercise_name: 'Erg', exercise_id: 'erg',
    });
    expect(result).toBe('2m 0s (new fastest)');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/utils/formatPR.test.ts --no-coverage`
Expected: FAIL — module doesn't exist

**Step 3: Create the shared utility**

Create `src/utils/formatPR.ts`:
```typescript
interface PRForFormat {
  record_type: string;
  value: number;
  previous_value: number | null;
  rep_count: number | null;
  exercise_name?: string;
  exercise_id: string;
}

function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
}

export function formatPRDescription(pr: PRForFormat): string {
  switch (pr.record_type) {
    case 'e1rm': {
      const diff = pr.previous_value != null ? ` (+${Math.round(pr.value - pr.previous_value)} lbs)` : '';
      return `New est. 1RM: ${Math.round(pr.value)} lbs${diff}`;
    }
    case 'rep_best':
      return `${Math.round(pr.value)} lbs × ${pr.rep_count} (best at ${pr.rep_count} reps)`;
    case 'best_reps':
      return `${Math.round(pr.value)} reps (new best)`;
    case 'best_duration':
      return `${formatDuration(pr.value)} (new best)`;
    case 'best_time':
      return `${formatDuration(pr.value)} (new fastest)`;
    default:
      return `${Math.round(pr.value)} (new PR)`;
  }
}

export function formatPRName(pr: PRForFormat): string {
  return pr.exercise_name ?? pr.exercise_id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
```

**Step 4: Update SessionSummary to use shared utility**

In `src/components/SessionSummary.tsx`:
- Import `formatPRDescription, formatPRName` from `../utils/formatPR`
- Remove the local `formatPRDescription` function and `formatDuration` helper
- Update PR card rendering to use `formatPRName(pr)` and `formatPRDescription(pr)`

**Step 5: Update session detail to use shared utility**

In `app/session/[id].tsx`:
- Import `formatPRDescription, formatPRName` from `../../src/utils/formatPR`
- Use in PR card rendering

**Step 6: Run all tests**

Run: `npx jest --no-coverage`
Expected: All tests PASS

**Step 7: Commit**

```bash
git add src/utils/formatPR.ts __tests__/utils/formatPR.test.ts src/components/SessionSummary.tsx app/session/\[id\].tsx
git commit -m "refactor: extract formatPRDescription to shared utility"
```

---

### Task 7: Clean Up useWorkoutSession — Remove editMode

**Files:**
- Modify: `src/hooks/useWorkoutSession.ts`
- Modify: `__tests__/hooks/` (if applicable)

**Step 1: Remove editMode state and recalculatePRs from useWorkoutSession**

Since edit mode is no longer on the workout complete screen, remove:
- `editMode` state (line 115)
- `setEditMode` from returned values
- `recalculatePRs` function (lines 977-1001) — this logic now lives in session detail

Keep everything else (deleteSessionAction, notes handling, etc.).

**Step 2: Run all tests**

Run: `npx jest --no-coverage`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add src/hooks/useWorkoutSession.ts
git commit -m "refactor: remove editMode from useWorkoutSession hook"
```

---

### Task 8: Final Integration Test & Polish

**Step 1: Run full test suite**

Run: `npx jest --no-coverage`
Expected: All tests PASS

**Step 2: Visual verification against mockup**

Compare implementation against `docs/mockups/workout-complete-edit-2026-03-11.html`:
- [ ] Workout complete: hamburger menu with delete option
- [ ] Workout complete: stats order Duration | Sets | PRs
- [ ] Workout complete: PR stat amber label + amber border (white number)
- [ ] Workout complete: recent workouts in card container
- [ ] Workout complete: session notes saved indicator
- [ ] Session detail read: edit button in header
- [ ] Session detail read: PRs displayed
- [ ] Session detail read: stats Duration | Sets | PRs (no readiness/tonnage)
- [ ] Session detail read: amber PR stat treatment
- [ ] Session detail edit: green checkmark button
- [ ] Session detail edit: tappable protocol chips (dashed border)
- [ ] Session detail edit: editable exercise values (indigo border)
- [ ] Session detail edit: editable exercise notes
- [ ] Session detail edit: editable session notes with saved indicator
- [ ] Session detail edit: delete button at bottom
- [ ] Session detail edit: PR recalculation on exit

**Step 3: Commit any polish**

```bash
git commit -m "chore: polish session edit implementation"
```
