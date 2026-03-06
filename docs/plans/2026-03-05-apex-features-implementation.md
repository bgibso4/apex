# APEX Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement session detail view (past workouts), ad-hoc exercise addition, exercise reordering, and finish workout button.

**Architecture:** These features build on the existing SQLite data layer and workout screen. Session detail is a new route (`app/session/[id].tsx`). Ad-hoc exercises add a picker modal to the workout screen and an `is_adhoc` flag to `set_logs`. Exercise reordering uses gesture handler (already installed) for drag-and-drop within the workout screen's exercise list. All features use existing theme tokens.

**Tech Stack:** Expo/React Native, expo-router, expo-sqlite, react-native-gesture-handler, react-native-reanimated, TypeScript

---

### Task 1: Initialize Git Repository

**Files:**
- Create: `.git/` (via git init)

**Step 1: Initialize repo and make initial commit**

```bash
cd /Users/ben/projects/apex
git init
git add -A
git commit -m "feat: initial commit — APEX strength training app

Includes: Home dashboard, workout logging, progress tracking,
running log, program library, activation flow, design docs."
```

**Step 2: Verify**

Run: `git log --oneline`
Expected: One commit with the initial commit message.

---

### Task 2: Schema Migration — Add `is_adhoc` to `set_logs`

**Files:**
- Modify: `src/db/schema.ts`
- Modify: `src/db/database.ts`

**Step 1: Add `is_adhoc` column and bump schema version**

In `src/db/schema.ts`, change `SCHEMA_VERSION` from `1` to `2`.

In the `set_logs` CREATE TABLE, add after the `timestamp` column:
```sql
is_adhoc INTEGER DEFAULT 0,
```

**Step 2: Add migration logic in `database.ts`**

In `getDatabase()`, after the schema version check, add migration logic:

```typescript
const currentVersion = versionResult ? parseInt(versionResult.value) : 0;

if (currentVersion < 2) {
  // Add is_adhoc column to set_logs (safe if column already exists)
  try {
    await db.execAsync('ALTER TABLE set_logs ADD COLUMN is_adhoc INTEGER DEFAULT 0');
  } catch {
    // Column already exists — ignore
  }
  await db.runAsync(
    "UPDATE schema_info SET value = ? WHERE key = 'schema_version'",
    [String(SCHEMA_VERSION)]
  );
}
```

Replace the existing version insert block. The full version check should become:

```typescript
const versionResult = await db.getFirstAsync<{ value: string }>(
  "SELECT value FROM schema_info WHERE key = 'schema_version'"
);

if (!versionResult) {
  await db.runAsync(
    "INSERT INTO schema_info (key, value) VALUES ('schema_version', ?)",
    [String(SCHEMA_VERSION)]
  );
} else {
  const currentVersion = parseInt(versionResult.value);
  if (currentVersion < 2) {
    try {
      await db.execAsync('ALTER TABLE set_logs ADD COLUMN is_adhoc INTEGER DEFAULT 0');
    } catch {
      // Column already exists
    }
    await db.runAsync(
      "UPDATE schema_info SET value = ? WHERE key = 'schema_version'",
      [String(SCHEMA_VERSION)]
    );
  }
}
```

**Step 3: Update SetLog type**

In `src/types/training.ts`, add to `SetLog` interface:
```typescript
is_adhoc?: boolean;
```

**Step 4: Update `logSet` to accept `isAdhoc`**

In `src/db/sessions.ts`, add `isAdhoc?: boolean` to the `logSet` params. Update the INSERT to include `is_adhoc` column:

```typescript
export async function logSet(params: {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  targetWeight: number;
  targetReps: number;
  actualWeight?: number;
  actualReps?: number;
  rpe?: number;
  status: SetLog['status'];
  isAdhoc?: boolean;
}): Promise<string> {
  const db = await getDatabase();
  const id = generateId();

  await db.runAsync(
    `INSERT INTO set_logs
     (id, session_id, exercise_id, set_number, target_weight, target_reps,
      actual_weight, actual_reps, rpe, status, timestamp, is_adhoc)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, params.sessionId, params.exerciseId, params.setNumber,
      params.targetWeight, params.targetReps,
      params.actualWeight ?? params.targetWeight,
      params.actualReps ?? params.targetReps,
      params.rpe ?? null,
      params.status,
      new Date().toISOString(),
      params.isAdhoc ? 1 : 0,
    ]
  );

  return id;
}
```

**Step 5: Verify app still launches**

Run: `npx expo start` — confirm no crash on startup.

**Step 6: Commit**

```bash
git add src/db/schema.ts src/db/database.ts src/db/sessions.ts src/types/training.ts
git commit -m "feat: add is_adhoc column to set_logs with schema migration"
```

---

### Task 3: Session Detail — Data Layer

**Files:**
- Modify: `src/db/sessions.ts`
- Modify: `src/db/index.ts`

**Step 1: Add `getSessionById` function**

In `src/db/sessions.ts`:

```typescript
/** Get a single session by ID */
export async function getSessionById(sessionId: string): Promise<Session | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Session>(
    "SELECT * FROM sessions WHERE id = ?",
    [sessionId]
  );
}
```

**Step 2: Add `getSessionByDate` function**

We need to find a session for a specific program + date (for navigation from home/progress):

```typescript
/** Get completed session for a specific program, week, and day */
export async function getCompletedSessionForDay(
  programId: string,
  weekNumber: number,
  scheduledDay: string
): Promise<Session | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Session>(
    `SELECT * FROM sessions
     WHERE program_id = ? AND week_number = ? AND scheduled_day = ?
     AND completed_at IS NOT NULL
     ORDER BY date DESC LIMIT 1`,
    [programId, weekNumber, scheduledDay]
  );
}
```

**Step 3: Add `getExerciseNames` helper**

```typescript
/** Get exercise names for a list of exercise IDs */
export async function getExerciseNames(
  exerciseIds: string[]
): Promise<Record<string, string>> {
  if (exerciseIds.length === 0) return {};
  const db = await getDatabase();
  const placeholders = exerciseIds.map(() => '?').join(',');
  const rows = await db.getAllAsync<{ id: string; name: string }>(
    `SELECT id, name FROM exercises WHERE id IN (${placeholders})`,
    exerciseIds
  );
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.id] = row.name;
  }
  return map;
}
```

**Step 4: Export new functions**

In `src/db/index.ts`, add to the sessions export:

```typescript
export {
  createSession, updateReadiness, updateWarmup,
  logSet, updateSet, completeSession,
  getSessionsForWeek, getSetLogsForSession, getLastSessionForExercise,
  getSessionById, getCompletedSessionForDay, getExerciseNames
} from './sessions';
```

**Step 5: Commit**

```bash
git add src/db/sessions.ts src/db/index.ts
git commit -m "feat: add session detail and exercise name DB functions"
```

---

### Task 4: Session Detail — Screen

**Files:**
- Create: `app/session/[id].tsx`

**Step 1: Create the session detail screen**

Create `app/session/[id].tsx`. This is a read-only view of a completed workout.

```typescript
/**
 * APEX — Session Detail (Past Workout View)
 * Read-only view of a completed workout session.
 */

import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import {
  getSessionById, getSetLogsForSession, getExerciseNames, getActiveProgram
} from '../../src/db';
import { getBlockForWeek, getBlockColor } from '../../src/utils/program';
import type { Session, SetLog } from '../../src/types';

const DAY_FULL_NAMES: Record<string, string> = {
  sunday: 'Sunday', monday: 'Monday', tuesday: 'Tuesday',
  wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday',
};

type ExerciseGroup = {
  exerciseId: string;
  exerciseName: string;
  isAdhoc: boolean;
  sets: SetLog[];
};

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroup[]>([]);
  const [blockColor, setBlockColor] = useState(Colors.indigo);
  const [dateLabel, setDateLabel] = useState('');

  useFocusEffect(useCallback(() => {
    if (!id) return;
    (async () => {
      const s = await getSessionById(id);
      if (!s) return;
      setSession(s);

      // Get block color
      const program = await getActiveProgram();
      if (program) {
        const block = getBlockForWeek(program.definition.program.blocks, s.week_number);
        if (block) setBlockColor(getBlockColor(block));
      }

      // Build date label: "Wednesday, Mar 4 · Week 6 Strength"
      const sessionDate = new Date(s.date);
      const dayName = DAY_FULL_NAMES[s.scheduled_day] ?? s.scheduled_day;
      const monthDay = sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      setDateLabel(`${dayName}, ${monthDay} · Week ${s.week_number} ${s.block_name}`);

      // Get set logs and group by exercise
      const setLogs = await getSetLogsForSession(id);
      const exerciseIds = [...new Set(setLogs.map(sl => sl.exercise_id))];
      const nameMap = await getExerciseNames(exerciseIds);

      const groups: ExerciseGroup[] = [];
      const seen = new Set<string>();
      for (const sl of setLogs) {
        if (!seen.has(sl.exercise_id)) {
          seen.add(sl.exercise_id);
          groups.push({
            exerciseId: sl.exercise_id,
            exerciseName: nameMap[sl.exercise_id] ?? sl.exercise_id.replace(/_/g, ' '),
            isAdhoc: !!(sl as any).is_adhoc,
            sets: setLogs.filter(s => s.exercise_id === sl.exercise_id),
          });
        }
      }
      setExerciseGroups(groups);
    })();
  }, [id]));

  if (!session) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Calculate stats
  const allSets = exerciseGroups.flatMap(g => g.sets);
  const completedSets = allSets.filter(s => s.status === 'completed' || s.status === 'completed_below');
  const totalTonnage = completedSets.reduce((sum, s) => sum + (s.actual_weight ?? 0) * (s.actual_reps ?? 0), 0);
  const duration = session.started_at && session.completed_at
    ? Math.round((new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 60000)
    : 0;
  const prCount = 0; // TODO: PR detection in future

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{session.day_template_id.replace(/_/g, ' ')}</Text>
        </View>

        {/* Date line */}
        <Text style={styles.dateLine}>{dateLabel}</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{duration}m</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedSets.length}</Text>
            <Text style={styles.statLabel}>Sets</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {totalTonnage >= 1000 ? `${(totalTonnage / 1000).toFixed(1)}k` : totalTonnage}
            </Text>
            <Text style={styles.statLabel}>Tonnage</Text>
          </View>
          {prCount > 0 && (
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.amber }]}>{prCount}</Text>
              <Text style={styles.statLabel}>PRs</Text>
            </View>
          )}
        </View>

        {/* Readiness */}
        <View style={styles.readinessRow}>
          <View style={styles.readinessItem}>
            <Text style={styles.readinessValue}>{session.sleep}</Text>
            <Text style={styles.readinessLabel}>Sleep</Text>
          </View>
          <View style={styles.readinessItem}>
            <Text style={styles.readinessValue}>{session.soreness}</Text>
            <Text style={styles.readinessLabel}>Soreness</Text>
          </View>
          <View style={styles.readinessItem}>
            <Text style={styles.readinessValue}>{session.energy}</Text>
            <Text style={styles.readinessLabel}>Energy</Text>
          </View>
        </View>

        {/* Protocol chips */}
        <View style={styles.chipRow}>
          {session.warmup_rope && (
            <View style={styles.chip}>
              <Ionicons name="checkmark" size={12} color={Colors.green} />
              <Text style={styles.chipText}>Jump Rope</Text>
            </View>
          )}
          {session.warmup_ankle && (
            <View style={styles.chip}>
              <Ionicons name="checkmark" size={12} color={Colors.green} />
              <Text style={styles.chipText}>Ankle</Text>
            </View>
          )}
          {session.warmup_hip_ir && (
            <View style={styles.chip}>
              <Ionicons name="checkmark" size={12} color={Colors.green} />
              <Text style={styles.chipText}>Hip IR</Text>
            </View>
          )}
          {session.conditioning_done && (
            <View style={styles.chip}>
              <Ionicons name="checkmark" size={12} color={Colors.green} />
              <Text style={styles.chipText}>Conditioning</Text>
            </View>
          )}
        </View>

        {/* Exercise cards */}
        {exerciseGroups.map((group) => (
          <View key={group.exerciseId} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{group.exerciseName}</Text>
              {group.isAdhoc && (
                <View style={styles.adhocTag}>
                  <Text style={styles.adhocTagText}>Ad-hoc</Text>
                </View>
              )}
            </View>

            {/* Set grid header */}
            <View style={styles.setGridHeader}>
              <Text style={[styles.setGridCell, styles.setGridHeaderText, { width: 36 }]}>Set</Text>
              <Text style={[styles.setGridCell, styles.setGridHeaderText, { flex: 1 }]}>Weight</Text>
              <Text style={[styles.setGridCell, styles.setGridHeaderText, { flex: 1 }]}>Reps</Text>
              <Text style={[styles.setGridCell, styles.setGridHeaderText, { width: 44 }]}>RPE</Text>
              <Text style={[styles.setGridCell, styles.setGridHeaderText, { width: 28 }]}></Text>
            </View>

            {/* Set rows */}
            {group.sets.map((set) => {
              const isBelowTarget = set.status === 'completed_below';
              return (
                <View key={set.id} style={styles.setGridRow}>
                  <Text style={[styles.setGridCell, styles.setGridValue, { width: 36 }]}>
                    {set.set_number}
                  </Text>
                  <Text style={[styles.setGridCell, styles.setGridValue, { flex: 1 }]}>
                    {set.actual_weight ?? '—'}
                  </Text>
                  <Text style={[styles.setGridCell, styles.setGridValue, { flex: 1 }]}>
                    {set.actual_reps ?? '—'}
                  </Text>
                  <Text style={[styles.setGridCell, styles.setGridValue, { width: 44 }]}>
                    {set.rpe ?? '—'}
                  </Text>
                  <View style={{ width: 28, alignItems: 'center' }}>
                    {set.status === 'completed' && (
                      <Ionicons name="checkmark" size={14} color={Colors.green} />
                    )}
                    {isBelowTarget && (
                      <Text style={{ color: Colors.amber, fontSize: FontSize.sm }}>!</Text>
                    )}
                    {set.status === 'skipped' && (
                      <Text style={{ color: Colors.red, fontSize: FontSize.sm }}>—</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingHorizontal: Spacing.lg, paddingBottom: 40 },

  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  backButton: { padding: Spacing.xs },
  backArrow: { color: Colors.textDim, fontSize: 22 },
  headerTitle: {
    color: Colors.text, fontSize: FontSize.xl, fontWeight: '700', textTransform: 'capitalize',
  },

  dateLine: { color: Colors.textSecondary, fontSize: FontSize.md, marginBottom: Spacing.xl },

  statsRow: {
    flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg,
  },
  statItem: {
    flex: 1, backgroundColor: Colors.card, borderRadius: BorderRadius.md,
    padding: Spacing.md, alignItems: 'center',
  },
  statValue: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
  statLabel: { color: Colors.textDim, fontSize: FontSize.xs, marginTop: 2 },

  readinessRow: {
    flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg,
  },
  readinessItem: {
    flex: 1, backgroundColor: Colors.card, borderRadius: BorderRadius.md,
    padding: Spacing.md, alignItems: 'center',
  },
  readinessValue: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '600' },
  readinessLabel: { color: Colors.textDim, fontSize: FontSize.xs, marginTop: 2 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.greenMuted, borderRadius: BorderRadius.sm,
    paddingVertical: 4, paddingHorizontal: Spacing.sm,
  },
  chipText: { color: Colors.green, fontSize: FontSize.xs, fontWeight: '600' },

  exerciseCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md,
  },
  exerciseHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  exerciseName: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '600', flex: 1 },
  adhocTag: {
    backgroundColor: Colors.indigoMuted, borderRadius: BorderRadius.sm,
    paddingVertical: 2, paddingHorizontal: Spacing.sm,
  },
  adhocTagText: { color: Colors.indigo, fontSize: FontSize.xs, fontWeight: '600' },

  setGridHeader: {
    flexDirection: 'row', paddingBottom: Spacing.sm,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  setGridHeaderText: { color: Colors.textDim, fontSize: FontSize.xs, fontWeight: '600' },
  setGridRow: {
    flexDirection: 'row', paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5, borderBottomColor: `${Colors.border}40`,
  },
  setGridCell: { },
  setGridValue: { color: Colors.text, fontSize: FontSize.md },
});
```

**Step 2: Verify the route loads**

Run: `npx expo start` — navigate to `/session/test-id` (will show empty state with back arrow).

**Step 3: Commit**

```bash
git add app/session/
git commit -m "feat: add session detail screen for viewing past workouts"
```

---

### Task 5: Session Detail — Navigation from Home

**Files:**
- Modify: `app/(tabs)/index.tsx`

**Step 1: Update Home screen week dots to navigate to session detail**

In `app/(tabs)/index.tsx`, update the `dayPill` `onPress` handler. Currently all day pills navigate to `/workout`. For completed days, they should navigate to the session detail view.

Find the `weekRow` section where day pills are rendered. Update the `onPress`:

```typescript
onPress={async () => {
  if (isCompleted) {
    // Find the session for this day and navigate to detail
    const session = await getCompletedSessionForDay(
      program.id, currentWeek, day
    );
    if (session) {
      router.push(`/session/${session.id}`);
    }
  } else {
    router.push('/workout');
  }
}}
```

Add `getCompletedSessionForDay` to the imports from `../../src/db`.

**Step 2: Verify navigation**

Run the app, complete a workout, return to Home, tap the completed day chip — should navigate to session detail.

**Step 3: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "feat: navigate to session detail when tapping completed day on home"
```

---

### Task 6: Exercise Library Data

**Files:**
- Create: `src/data/exercise-library.ts`

**Step 1: Create the exercise library**

This is a static list of common exercises grouped by muscle group, used by the ad-hoc exercise picker. Each exercise has an `id`, `name`, and `muscleGroup`.

```typescript
/**
 * APEX — Built-in Exercise Library
 * Common exercises grouped by muscle group for the ad-hoc exercise picker.
 */

export type LibraryExercise = {
  id: string;
  name: string;
  muscleGroup: string;
  type: 'main' | 'accessory' | 'core' | 'conditioning';
};

export const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core',
] as const;

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // Chest
  { id: 'bench_press', name: 'Bench Press', muscleGroup: 'Chest', type: 'main' },
  { id: 'incline_bench_press', name: 'Incline Bench Press', muscleGroup: 'Chest', type: 'accessory' },
  { id: 'dumbbell_bench_press', name: 'Dumbbell Bench Press', muscleGroup: 'Chest', type: 'accessory' },
  { id: 'dumbbell_flyes', name: 'Dumbbell Flyes', muscleGroup: 'Chest', type: 'accessory' },
  { id: 'push_ups', name: 'Push-ups', muscleGroup: 'Chest', type: 'accessory' },
  { id: 'cable_crossover', name: 'Cable Crossover', muscleGroup: 'Chest', type: 'accessory' },
  { id: 'dips', name: 'Dips', muscleGroup: 'Chest', type: 'accessory' },

  // Back
  { id: 'weighted_pullup', name: 'Weighted Pull-up', muscleGroup: 'Back', type: 'main' },
  { id: 'pull_ups', name: 'Pull-ups', muscleGroup: 'Back', type: 'accessory' },
  { id: 'barbell_row', name: 'Barbell Row', muscleGroup: 'Back', type: 'accessory' },
  { id: 'dumbbell_row', name: 'Dumbbell Row', muscleGroup: 'Back', type: 'accessory' },
  { id: 'lat_pulldown', name: 'Lat Pulldown', muscleGroup: 'Back', type: 'accessory' },
  { id: 'cable_row', name: 'Cable Row', muscleGroup: 'Back', type: 'accessory' },
  { id: 'face_pulls', name: 'Face Pulls', muscleGroup: 'Back', type: 'accessory' },
  { id: 'romanian_deadlift', name: 'Romanian Deadlift', muscleGroup: 'Back', type: 'main' },

  // Shoulders
  { id: 'overhead_press', name: 'Overhead Press', muscleGroup: 'Shoulders', type: 'main' },
  { id: 'dumbbell_shoulder_press', name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders', type: 'accessory' },
  { id: 'lateral_raises', name: 'Lateral Raises', muscleGroup: 'Shoulders', type: 'accessory' },
  { id: 'front_raises', name: 'Front Raises', muscleGroup: 'Shoulders', type: 'accessory' },
  { id: 'rear_delt_flyes', name: 'Rear Delt Flyes', muscleGroup: 'Shoulders', type: 'accessory' },
  { id: 'arnold_press', name: 'Arnold Press', muscleGroup: 'Shoulders', type: 'accessory' },

  // Legs
  { id: 'back_squat', name: 'Back Squat', muscleGroup: 'Legs', type: 'main' },
  { id: 'front_squat', name: 'Front Squat', muscleGroup: 'Legs', type: 'main' },
  { id: 'zercher_squat', name: 'Zercher Squat', muscleGroup: 'Legs', type: 'main' },
  { id: 'leg_press', name: 'Leg Press', muscleGroup: 'Legs', type: 'accessory' },
  { id: 'lunges', name: 'Lunges', muscleGroup: 'Legs', type: 'accessory' },
  { id: 'bulgarian_split_squat', name: 'Bulgarian Split Squat', muscleGroup: 'Legs', type: 'accessory' },
  { id: 'leg_curl', name: 'Leg Curl', muscleGroup: 'Legs', type: 'accessory' },
  { id: 'leg_extension', name: 'Leg Extension', muscleGroup: 'Legs', type: 'accessory' },
  { id: 'calf_raises', name: 'Calf Raises', muscleGroup: 'Legs', type: 'accessory' },
  { id: 'hip_thrust', name: 'Hip Thrust', muscleGroup: 'Legs', type: 'accessory' },
  { id: 'broad_jump', name: 'Broad Jump', muscleGroup: 'Legs', type: 'accessory' },

  // Arms
  { id: 'barbell_curl', name: 'Barbell Curl', muscleGroup: 'Arms', type: 'accessory' },
  { id: 'dumbbell_curl', name: 'Dumbbell Curl', muscleGroup: 'Arms', type: 'accessory' },
  { id: 'hammer_curl', name: 'Hammer Curl', muscleGroup: 'Arms', type: 'accessory' },
  { id: 'tricep_pushdown', name: 'Tricep Pushdown', muscleGroup: 'Arms', type: 'accessory' },
  { id: 'skull_crushers', name: 'Skull Crushers', muscleGroup: 'Arms', type: 'accessory' },
  { id: 'overhead_tricep_extension', name: 'Overhead Tricep Extension', muscleGroup: 'Arms', type: 'accessory' },

  // Core
  { id: 'plank', name: 'Plank', muscleGroup: 'Core', type: 'core' },
  { id: 'hanging_leg_raise', name: 'Hanging Leg Raise', muscleGroup: 'Core', type: 'core' },
  { id: 'ab_wheel', name: 'Ab Wheel', muscleGroup: 'Core', type: 'core' },
  { id: 'cable_woodchop', name: 'Cable Woodchop', muscleGroup: 'Core', type: 'core' },
  { id: 'pallof_press', name: 'Pallof Press', muscleGroup: 'Core', type: 'core' },
  { id: 'russian_twist', name: 'Russian Twist', muscleGroup: 'Core', type: 'core' },
  { id: 'dead_bug', name: 'Dead Bug', muscleGroup: 'Core', type: 'core' },
];
```

**Step 2: Add function to ensure exercise exists in DB**

In `src/db/sessions.ts`, add:

```typescript
/** Ensure an exercise exists in the exercises table (for ad-hoc additions) */
export async function ensureExerciseExists(exercise: {
  id: string;
  name: string;
  type: string;
  muscleGroups: string[];
}): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR IGNORE INTO exercises (id, name, type, muscle_groups, alternatives)
     VALUES (?, ?, ?, ?, '[]')`,
    [exercise.id, exercise.name, exercise.type, JSON.stringify(exercise.muscleGroups)]
  );
}
```

Export it from `src/db/index.ts`.

**Step 3: Commit**

```bash
git add src/data/exercise-library.ts src/db/sessions.ts src/db/index.ts
git commit -m "feat: add exercise library data and ensureExerciseExists function"
```

---

### Task 7: Workout Screen — Progress Bar + Add Exercise Link

**Files:**
- Modify: `app/(tabs)/workout.tsx`

**Step 1: Add progress bar and "+ Add exercise" link to logging phase**

In `workout.tsx`, find the `{/* Phase: Logging */}` section. Before the exercise map, add a progress bar:

```tsx
{phase === 'logging' && (
  <>
    {/* Progress bar */}
    <View style={styles.progressRow}>
      <Text style={styles.progressText}>
        {exercises.filter(e => e.sets.every(s => s.status !== 'pending')).length} of {exercises.length} exercises
      </Text>
      <TouchableOpacity onPress={() => setShowExercisePicker(true)}>
        <Text style={styles.addExerciseLink}>+ Add exercise</Text>
      </TouchableOpacity>
    </View>

    {/* ... existing exercise cards ... */}
  </>
)}
```

Add state: `const [showExercisePicker, setShowExercisePicker] = useState(false);`

Add styles:

```typescript
progressRow: {
  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  marginBottom: Spacing.lg,
},
progressText: { color: Colors.textSecondary, fontSize: FontSize.sm },
addExerciseLink: { color: Colors.indigo, fontSize: FontSize.sm, fontWeight: '600' },
```

**Step 2: Commit**

```bash
git add app/(tabs)/workout.tsx
git commit -m "feat: add progress bar and + Add exercise link to workout screen"
```

---

### Task 8: Exercise Picker Modal

**Files:**
- Modify: `app/(tabs)/workout.tsx`

**Step 1: Add exercise picker state**

Add these state variables to `WorkoutScreen`:

```typescript
const [showExercisePicker, setShowExercisePicker] = useState(false);
const [pickerSearch, setPickerSearch] = useState('');
const [pickerStep, setPickerStep] = useState<'pick' | 'configure'>('pick');
const [selectedLibraryExercise, setSelectedLibraryExercise] = useState<LibraryExercise | null>(null);
const [adhocSets, setAdhocSets] = useState(3);
const [adhocReps, setAdhocReps] = useState(10);
const [adhocWeight, setAdhocWeight] = useState(0);
```

Add import at top:

```typescript
import { EXERCISE_LIBRARY, MUSCLE_GROUPS, type LibraryExercise } from '../../src/data/exercise-library';
import { TextInput } from 'react-native';
```

**Step 2: Build the picker modal**

Add this modal after the existing override modal in the JSX:

```tsx
{/* Exercise Picker Modal */}
<Modal visible={showExercisePicker} transparent animationType="slide">
  <Pressable
    style={styles.pickerOverlay}
    onPress={() => {
      setShowExercisePicker(false);
      setPickerStep('pick');
      setPickerSearch('');
    }}
  >
    <View style={styles.pickerSheet} onStartShouldSetResponder={() => true}>
      {pickerStep === 'pick' ? (
        <>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Add Exercise</Text>
            <TouchableOpacity onPress={() => {
              setShowExercisePicker(false);
              setPickerStep('pick');
              setPickerSearch('');
            }}>
              <Ionicons name="close" size={24} color={Colors.textDim} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.pickerSearch}
            placeholder="Search exercises..."
            placeholderTextColor={Colors.textDim}
            value={pickerSearch}
            onChangeText={setPickerSearch}
            autoCapitalize="none"
          />

          <ScrollView style={styles.pickerList}>
            {/* Custom exercise option */}
            <TouchableOpacity
              style={styles.pickerItem}
              onPress={() => {
                const customName = pickerSearch.trim() || 'Custom Exercise';
                const customId = customName.toLowerCase().replace(/\s+/g, '_');
                setSelectedLibraryExercise({
                  id: customId,
                  name: customName,
                  muscleGroup: 'Other',
                  type: 'accessory',
                });
                setPickerStep('configure');
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color={Colors.indigo} />
              <Text style={[styles.pickerItemText, { color: Colors.indigo }]}>
                + Custom Exercise{pickerSearch ? `: "${pickerSearch}"` : ''}
              </Text>
            </TouchableOpacity>

            {/* Exercises by muscle group */}
            {MUSCLE_GROUPS.map(group => {
              const filtered = EXERCISE_LIBRARY.filter(e =>
                e.muscleGroup === group &&
                (pickerSearch === '' || e.name.toLowerCase().includes(pickerSearch.toLowerCase()))
              );
              if (filtered.length === 0) return null;
              return (
                <View key={group}>
                  <Text style={styles.pickerGroupLabel}>{group.toUpperCase()}</Text>
                  {filtered.map(ex => (
                    <TouchableOpacity
                      key={ex.id}
                      style={styles.pickerItem}
                      onPress={() => {
                        setSelectedLibraryExercise(ex);
                        setPickerStep('configure');
                      }}
                    >
                      <Text style={styles.pickerItemText}>{ex.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })}
          </ScrollView>
        </>
      ) : (
        <>
          {/* Configure step */}
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={() => setPickerStep('pick')}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={[styles.pickerTitle, { flex: 1, marginLeft: Spacing.md }]}>
              {selectedLibraryExercise?.name}
            </Text>
          </View>

          <View style={styles.configSection}>
            <Text style={styles.configLabel}>Sets</Text>
            <View style={styles.adjustRow}>
              <TouchableOpacity style={styles.adjustButton}
                onPress={() => setAdhocSets(Math.max(1, adhocSets - 1))}>
                <Text style={styles.adjustButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.adjustValue}>{adhocSets}</Text>
              <TouchableOpacity style={styles.adjustButton}
                onPress={() => setAdhocSets(adhocSets + 1)}>
                <Text style={styles.adjustButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.configLabel}>Reps</Text>
            <View style={styles.adjustRow}>
              <TouchableOpacity style={styles.adjustButton}
                onPress={() => setAdhocReps(Math.max(1, adhocReps - 1))}>
                <Text style={styles.adjustButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.adjustValue}>{adhocReps}</Text>
              <TouchableOpacity style={styles.adjustButton}
                onPress={() => setAdhocReps(adhocReps + 1)}>
                <Text style={styles.adjustButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.configLabel}>Weight (lbs) — 0 = bodyweight</Text>
            <View style={styles.adjustRow}>
              <TouchableOpacity style={styles.adjustButton}
                onPress={() => setAdhocWeight(Math.max(0, adhocWeight - 5))}>
                <Text style={styles.adjustButtonText}>−5</Text>
              </TouchableOpacity>
              <Text style={styles.adjustValue}>
                {adhocWeight === 0 ? 'BW' : adhocWeight}
              </Text>
              <TouchableOpacity style={styles.adjustButton}
                onPress={() => setAdhocWeight(adhocWeight + 5)}>
                <Text style={styles.adjustButtonText}>+5</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.bigButton, { backgroundColor: Colors.indigo, marginTop: Spacing.lg }]}
            onPress={() => addAdhocExercise()}
          >
            <Text style={styles.bigButtonText}>Add to Workout</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  </Pressable>
</Modal>
```

**Step 3: Add picker styles**

```typescript
// Picker modal
pickerOverlay: {
  flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
  justifyContent: 'flex-end',
},
pickerSheet: {
  backgroundColor: Colors.card, borderTopLeftRadius: BorderRadius.xl,
  borderTopRightRadius: BorderRadius.xl,
  padding: Spacing.xl, maxHeight: '80%',
},
pickerHeader: {
  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  marginBottom: Spacing.lg,
},
pickerTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '700' },
pickerSearch: {
  backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
  padding: Spacing.md, color: Colors.text, fontSize: FontSize.md,
  marginBottom: Spacing.lg,
},
pickerList: { maxHeight: 400 },
pickerGroupLabel: {
  color: Colors.textDim, fontSize: FontSize.xs, fontWeight: '700',
  letterSpacing: 1, marginTop: Spacing.lg, marginBottom: Spacing.sm,
},
pickerItem: {
  flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
  paddingVertical: Spacing.md,
  borderBottomWidth: 0.5, borderBottomColor: `${Colors.border}40`,
},
pickerItemText: { color: Colors.text, fontSize: FontSize.md },
backArrow: { color: Colors.textDim, fontSize: 22 },

// Configure
configSection: { marginTop: Spacing.lg },
configLabel: {
  color: Colors.textSecondary, fontSize: FontSize.sm,
  marginBottom: Spacing.sm, marginTop: Spacing.md,
},
```

**Step 4: Commit**

```bash
git add app/(tabs)/workout.tsx
git commit -m "feat: add exercise picker modal with search and configure"
```

---

### Task 9: Ad-Hoc Exercise — Add to Workout

**Files:**
- Modify: `app/(tabs)/workout.tsx`

**Step 1: Implement `addAdhocExercise` function**

Add this function inside `WorkoutScreen`:

```typescript
/** Add an ad-hoc exercise to the current workout */
const addAdhocExercise = async () => {
  if (!selectedLibraryExercise || !sessionId) return;

  // Ensure exercise exists in DB
  await ensureExerciseExists({
    id: selectedLibraryExercise.id,
    name: selectedLibraryExercise.name,
    type: selectedLibraryExercise.type,
    muscleGroups: [selectedLibraryExercise.muscleGroup],
  });

  // Build exercise state
  const sets: SetState[] = Array.from({ length: adhocSets }, (_, i) => ({
    setNumber: i + 1,
    targetWeight: adhocWeight,
    targetReps: adhocReps,
    actualWeight: adhocWeight,
    actualReps: adhocReps,
    status: 'pending' as const,
  }));

  const newExercise: ExerciseState = {
    slot: {
      exercise_id: selectedLibraryExercise.id,
      category: selectedLibraryExercise.type === 'core' ? 'core' : 'accessory',
      targets: [],
    },
    exerciseName: selectedLibraryExercise.name,
    sets,
    expanded: false,
    isAdhoc: true,
  };

  setExercises(prev => [...prev, newExercise]);

  // Reset picker state
  setShowExercisePicker(false);
  setPickerStep('pick');
  setPickerSearch('');
  setSelectedLibraryExercise(null);
  setAdhocSets(3);
  setAdhocReps(10);
  setAdhocWeight(0);

  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};
```

**Step 2: Update `ExerciseState` type**

Add `isAdhoc` to the `ExerciseState` type at the top of the file:

```typescript
type ExerciseState = {
  slot: ExerciseSlot;
  exerciseName: string;
  sets: SetState[];
  rpe?: number;
  expanded: boolean;
  lastWeight?: number;
  lastReps?: number;
  isAdhoc?: boolean;
};
```

**Step 3: Update `completeSetAction` to pass `isAdhoc`**

In the `completeSetAction` function, update the `logSet` call:

```typescript
const setId = await logSet({
  sessionId,
  exerciseId: ex.slot.exercise_id,
  setNumber: set.setNumber,
  targetWeight: set.targetWeight,
  targetReps: set.targetReps,
  actualWeight: set.actualWeight,
  actualReps: set.actualReps,
  status: 'completed',
  isAdhoc: ex.isAdhoc,
});
```

Also update in `saveOverride` — add `isAdhoc: exercises[exerciseIdx].isAdhoc` to the `logSet` call there.

**Step 4: Show "Ad-hoc" tag on exercise cards**

In the exercise header rendering (inside the logging phase), after the category badge, add:

```tsx
{ex.isAdhoc && (
  <View style={styles.adhocTag}>
    <Text style={styles.adhocTagText}>Ad-hoc</Text>
  </View>
)}
```

Add styles:

```typescript
adhocTag: {
  backgroundColor: Colors.indigoMuted, borderRadius: BorderRadius.sm,
  paddingVertical: 2, paddingHorizontal: Spacing.sm, marginLeft: Spacing.sm,
},
adhocTagText: { color: Colors.indigo, fontSize: FontSize.xs, fontWeight: '600' },
```

**Step 5: Show "BW" for bodyweight exercises**

In the set button rendering, update the weight display:

```tsx
<Text style={[styles.setWeight, { color: color.text }]}>
  {set.actualWeight === 0 ? 'BW' : set.actualWeight}
</Text>
```

**Step 6: Add `ensureExerciseExists` to imports**

```typescript
import {
  getActiveProgram, createSession, logSet, updateSet,
  completeSession, updateReadiness, updateWarmup,
  getSessionsForWeek, getLastSessionForExercise,
  calculateTargetWeight, ensureExerciseExists
} from '../../src/db';
```

**Step 7: Verify end-to-end**

Start a workout, tap "+ Add exercise", search for an exercise, configure sets/reps/weight, add it, log sets for it, complete workout. Verify ad-hoc sets are saved with `is_adhoc = 1` in the database.

**Step 8: Commit**

```bash
git add app/(tabs)/workout.tsx
git commit -m "feat: implement ad-hoc exercise addition during workout"
```

---

### Task 10: Finish Workout Button

**Files:**
- Modify: `app/(tabs)/workout.tsx`

**Step 1: Rename and update finish button logic**

Find the "Complete Session" button in the logging phase. Replace it with a "Finish Workout" button that is disabled until all programmed (non-ad-hoc) exercises are complete:

```tsx
{phase === 'logging' && (
  <>
    {/* ... conditioning row ... */}

    {(() => {
      const programmedExercises = exercises.filter(e => !e.isAdhoc);
      const allProgrammedDone = programmedExercises.every(e =>
        e.sets.every(s => s.status !== 'pending')
      );
      return (
        <TouchableOpacity
          style={[styles.bigButton, {
            backgroundColor: allProgrammedDone ? Colors.green : Colors.surface,
            marginHorizontal: 0,
          }]}
          onPress={finishSession}
          disabled={!allProgrammedDone}
        >
          <Text style={[styles.bigButtonText, {
            color: allProgrammedDone ? Colors.text : Colors.textDim,
          }]}>Finish Workout</Text>
        </TouchableOpacity>
      );
    })()}
  </>
)}
```

**Step 2: Verify behavior**

Start a workout, confirm "Finish Workout" is disabled (gray) until all programmed exercises are done. Add an ad-hoc exercise — it should not block the finish button.

**Step 3: Commit**

```bash
git add app/(tabs)/workout.tsx
git commit -m "feat: finish workout button disabled until programmed exercises complete"
```

---

### Task 11: Exercise Reordering

**Files:**
- Modify: `app/(tabs)/workout.tsx`

**Step 1: Add reorder state**

```typescript
const [reorderMode, setReorderMode] = useState(false);
```

**Step 2: Add long press handler on exercise cards**

Update the exercise card `TouchableOpacity` in the logging phase to enter reorder mode on long press:

```tsx
onLongPress={() => {
  if (!reorderMode) {
    setReorderMode(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
}}
```

**Step 3: Add reorder banner**

Below the progress row (and above exercise cards), when in reorder mode, show:

```tsx
{reorderMode && (
  <View style={styles.reorderBanner}>
    <Text style={styles.reorderBannerText}>Reorder exercises</Text>
    <TouchableOpacity onPress={() => setReorderMode(false)}>
      <Text style={styles.reorderDoneText}>Done</Text>
    </TouchableOpacity>
  </View>
)}
```

Add styles:

```typescript
reorderBanner: {
  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
  padding: Spacing.md, marginBottom: Spacing.lg,
},
reorderBannerText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
reorderDoneText: { color: Colors.indigo, fontSize: FontSize.md, fontWeight: '700' },
```

**Step 4: Add move up/down buttons in reorder mode**

When in reorder mode, show move buttons instead of the normal exercise card tap behavior. Replace the set buttons area with simple up/down arrows:

```tsx
{reorderMode && (
  <View style={styles.reorderControls}>
    <TouchableOpacity
      style={styles.reorderButton}
      onPress={() => moveExercise(exIdx, -1)}
      disabled={exIdx === 0}
    >
      <Ionicons name="arrow-up" size={20}
        color={exIdx === 0 ? Colors.textMuted : Colors.text} />
    </TouchableOpacity>
    <TouchableOpacity
      style={styles.reorderButton}
      onPress={() => moveExercise(exIdx, 1)}
      disabled={exIdx === exercises.length - 1}
    >
      <Ionicons name="arrow-down" size={20}
        color={exIdx === exercises.length - 1 ? Colors.textMuted : Colors.text} />
    </TouchableOpacity>
  </View>
)}
```

**Step 5: Add `moveExercise` function**

```typescript
const moveExercise = (index: number, direction: -1 | 1) => {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= exercises.length) return;
  setExercises(prev => {
    const next = [...prev];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    return next;
  });
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};
```

**Step 6: Show drag handle (☰) in reorder mode**

In the exercise card header, when in reorder mode, show a drag handle icon on the left:

```tsx
<View style={styles.exerciseHeader}>
  {reorderMode && (
    <Text style={styles.dragHandle}>☰</Text>
  )}
  <View style={{ flex: 1 }}>
    <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
    {/* ... target text ... */}
  </View>
  {/* ... category badge / adhoc tag ... */}
</View>
```

Add styles:

```typescript
dragHandle: {
  color: Colors.textDim, fontSize: FontSize.xl, marginRight: Spacing.md,
},
reorderControls: {
  flexDirection: 'row', justifyContent: 'center', gap: Spacing.lg,
  marginTop: Spacing.md,
},
reorderButton: {
  width: 44, height: 44, borderRadius: 22,
  backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  alignItems: 'center', justifyContent: 'center',
},
```

**Step 7: Suppress normal card interaction in reorder mode**

Update the exercise card's `onPress` to be a no-op in reorder mode:

```tsx
onPress={() => {
  if (reorderMode) return;
  setExercises(prev => {
    const next = [...prev];
    next[exIdx] = { ...next[exIdx], expanded: !next[exIdx].expanded };
    return next;
  });
}}
```

Also collapse all exercises when entering reorder mode by updating the long press handler:

```tsx
onLongPress={() => {
  if (!reorderMode) {
    setReorderMode(true);
    setExercises(prev => prev.map(e => ({ ...e, expanded: false })));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
}}
```

**Step 8: Verify reorder flow**

Long press an exercise → reorder banner appears → use up/down arrows → tap "Done" → exercises stay in new order for rest of session.

**Step 9: Commit**

```bash
git add app/(tabs)/workout.tsx
git commit -m "feat: add exercise reordering via long press with up/down controls"
```

---

### Task 12: Final Integration & Polish

**Files:**
- Modify: `app/(tabs)/workout.tsx` (minor adjustments)
- Modify: `app/(tabs)/index.tsx` (minor adjustments)

**Step 1: Hide "+ Add exercise" link when in reorder mode**

```tsx
{!reorderMode && (
  <TouchableOpacity onPress={() => setShowExercisePicker(true)}>
    <Text style={styles.addExerciseLink}>+ Add exercise</Text>
  </TouchableOpacity>
)}
```

**Step 2: Hide conditioning and finish button in reorder mode**

Wrap the conditioning row and finish button in `{!reorderMode && (...)}`

**Step 3: Verify the session detail correctly shows ad-hoc tags**

Navigate to a completed session that had ad-hoc exercises. Verify the "Ad-hoc" tag appears.

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: polish exercise reorder mode and ad-hoc display"
```

---

## Summary of All Changes

| Feature | Files Modified/Created |
|---------|----------------------|
| Schema migration | `src/db/schema.ts`, `src/db/database.ts`, `src/types/training.ts` |
| Session detail data | `src/db/sessions.ts`, `src/db/index.ts` |
| Session detail screen | `app/session/[id].tsx` (new) |
| Navigation from home | `app/(tabs)/index.tsx` |
| Exercise library | `src/data/exercise-library.ts` (new) |
| Ad-hoc exercises | `app/(tabs)/workout.tsx` |
| Finish workout button | `app/(tabs)/workout.tsx` |
| Exercise reordering | `app/(tabs)/workout.tsx` |

## Dependencies Between Tasks

```
Task 1 (git init)
  └── Task 2 (schema migration)
        ├── Task 3 (session detail data) → Task 4 (session detail screen) → Task 5 (navigation)
        └── Task 6 (exercise library) → Task 7 (progress bar) → Task 8 (picker modal) → Task 9 (add to workout) → Task 10 (finish button) → Task 11 (reorder) → Task 12 (polish)
```

Tasks 3-5 (session detail) and Tasks 6-12 (ad-hoc + reorder) can run in parallel after Task 2.
