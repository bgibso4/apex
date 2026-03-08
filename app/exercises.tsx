/**
 * APEX — All Exercises Screen
 * Lists all exercises the user has ever logged, grouped by muscle group.
 * Each exercise is tappable to navigate to its detail view.
 */

import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../src/theme';
import { getLoggedExercises, getEstimated1RM, get1RMHistory } from '../src/db';
import { MUSCLE_GROUPS } from '../src/data/exercise-library';
import { SparkLine } from '../src/components/TrendLineChart';
import type { Estimated1RM } from '../src/types';

interface ExerciseData {
  id: string;
  name: string;
  muscleGroup: string;
  e1rm: Estimated1RM | null;
  history: number[];
}

interface GroupedExercises {
  group: string;
  exercises: ExerciseData[];
}

export default function ExercisesScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupedExercises[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const exercises = await getLoggedExercises();

    // Load e1RM and history for all exercises in parallel
    const enriched = await Promise.all(
      exercises.map(async (ex) => {
        const [e1rm, history] = await Promise.all([
          getEstimated1RM(ex.id),
          get1RMHistory(ex.id, 8),
        ]);
        return {
          id: ex.id,
          name: ex.name,
          muscleGroup: ex.muscleGroups[0] ?? 'Other',
          e1rm,
          history: history.map(h => h.e1rm),
        };
      })
    );

    // Group by muscle group
    const groupMap = new Map<string, ExerciseData[]>();
    for (const ex of enriched) {
      const group = MUSCLE_GROUPS.includes(ex.muscleGroup as typeof MUSCLE_GROUPS[number])
        ? ex.muscleGroup
        : 'Other';
      const list = groupMap.get(group) ?? [];
      list.push(ex);
      groupMap.set(group, list);
    }

    // Order by MUSCLE_GROUPS, then "Other" at the end
    const ordered: GroupedExercises[] = [];
    for (const group of MUSCLE_GROUPS) {
      const exercises = groupMap.get(group);
      if (exercises && exercises.length > 0) {
        ordered.push({ group, exercises });
      }
    }
    const other = groupMap.get('Other');
    if (other && other.length > 0) {
      ordered.push({ group: 'Other', exercises: other });
    }

    setGroups(ordered);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textDim} />
        </TouchableOpacity>
        <Text style={styles.title}>All Exercises</Text>
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator color={Colors.indigo} />
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="barbell-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No exercises logged yet</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {groups.map((group) => (
            <View key={group.group} style={styles.section}>
              <Text style={styles.sectionLabel}>{group.group}</Text>
              <View style={styles.card}>
                {group.exercises.map((ex, index) => (
                  <TouchableOpacity
                    key={ex.id}
                    style={[
                      styles.row,
                      index < group.exercises.length - 1 && styles.rowBorder,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => router.push(`/exercise/${ex.id}`)}
                  >
                    <View style={styles.rowLeft}>
                      <Text style={styles.exerciseName}>{ex.name}</Text>
                      {ex.history.length >= 2 && (
                        <View style={styles.sparklineContainer}>
                          <SparkLine
                            data={ex.history}
                            color={Colors.indigo}
                            height={20}
                            opacity={0.3}
                          />
                        </View>
                      )}
                    </View>
                    <View style={styles.rowRight}>
                      {ex.e1rm ? (
                        <View style={styles.e1rmRow}>
                          <Text style={styles.e1rmValue}>{ex.e1rm.value}</Text>
                          <Text style={styles.e1rmUnit}>lbs</Text>
                        </View>
                      ) : (
                        <Text style={styles.e1rmDash}>{'\u2014'}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.screenTop,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: Spacing.xxxl,
    height: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.button,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.screenTitle,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.screenBottom,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sectionLabel,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md - 2,
  },
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.cardInner,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  rowLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  exerciseName: {
    color: Colors.text,
    fontSize: FontSize.body,
    fontWeight: '600',
  },
  sparklineContainer: {
    marginTop: Spacing.xs,
    width: 80,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  e1rmRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
  e1rmValue: {
    color: Colors.text,
    fontSize: FontSize.body,
    fontWeight: '700',
  },
  e1rmUnit: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  e1rmDash: {
    color: Colors.textMuted,
    fontSize: FontSize.body,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyText: {
    color: Colors.textDim,
    fontSize: FontSize.body,
  },
});
