/**
 * APEX — All Exercises Screen
 * Lists all exercises (library + user-created), grouped by muscle group.
 * Each exercise shows its primary metric and trend indicator.
 * Groups are collapsible; all expanded by default.
 */

import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../src/theme';
import { getAllExercises, getEstimated1RM, getExercisePrimaryMetric, get1RMHistory } from '../src/db';
import type { ExerciseListItem, ExercisePrimaryMetric as PrimaryMetric } from '../src/db';
import { MUSCLE_GROUPS } from '../src/data/exercise-library';
import { getFieldsForExercise, supportsE1RM } from '../src/types/fields';

type TrendDirection = 'up' | 'down' | 'flat';

interface ExerciseRow {
  id: string;
  name: string;
  muscleGroup: string;
  hasLoggedSets: boolean;
  metric: PrimaryMetric | null;
  trend: TrendDirection;
}

interface GroupedExercises {
  group: string;
  exercises: ExerciseRow[];
}

export default function ExercisesScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupedExercises[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleGroup = (group: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  const loadData = useCallback(async () => {
    const allExercises = await getAllExercises();

    // Enrich exercises with metrics in parallel
    const enriched: ExerciseRow[] = await Promise.all(
      allExercises.map(async (ex) => {
        const muscleGroup = ex.muscleGroups[0] ?? 'Other';
        if (!ex.hasLoggedSets) {
          return { id: ex.id, name: ex.name, muscleGroup, hasLoggedSets: false, metric: null, trend: 'flat' as TrendDirection };
        }

        const fields = getFieldsForExercise(ex.inputFields);
        const isE1RM = supportsE1RM(fields);
        const metric = await getExercisePrimaryMetric(ex.id, ex.inputFields);

        // Determine trend for e1RM exercises
        let trend: TrendDirection = 'flat';
        if (isE1RM && metric) {
          try {
            const history = await get1RMHistory(ex.id, 4);
            if (history.length >= 2) {
              const latest = history[0].e1rm;
              const previous = history[1].e1rm;
              if (latest > previous) trend = 'up';
              else if (latest < previous) trend = 'down';
            }
          } catch {
            // Ignore — just show flat
          }
        }

        return { id: ex.id, name: ex.name, muscleGroup, hasLoggedSets: true, metric, trend };
      })
    );

    // Group by muscle group following MUSCLE_GROUPS order
    const groupMap = new Map<string, ExerciseRow[]>();
    for (const ex of enriched) {
      const group = (MUSCLE_GROUPS as readonly string[]).includes(ex.muscleGroup)
        ? ex.muscleGroup
        : 'Other';
      const list = groupMap.get(group) ?? [];
      list.push(ex);
      groupMap.set(group, list);
    }

    // Sort exercises alphabetically within each group
    for (const list of groupMap.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Order groups by MUSCLE_GROUPS, then "Other" at the end
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

  const getTrendArrow = (trend: TrendDirection) => {
    switch (trend) {
      case 'up': return { symbol: '\u2191', color: Colors.green };
      case 'down': return { symbol: '\u2193', color: Colors.amber };
      default: return { symbol: '\u2192', color: Colors.textMuted };
    }
  };

  const formatMetricValue = (metric: PrimaryMetric) => {
    if (metric.unit === 'sec') {
      return `${metric.value}s`;
    }
    if (metric.unit === 'reps') {
      return `${metric.value} reps`;
    }
    if (metric.unit === 'm') {
      return `${metric.value}m`;
    }
    return `${metric.value} ${metric.unit ?? ''}`.trim();
  };

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
        <View style={styles.headerSpacer} />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {}}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color={Colors.indigo} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator color={Colors.indigo} />
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="barbell-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No exercises found</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {groups.map((group) => {
            const isCollapsed = collapsed.has(group.group);
            return (
              <View key={group.group} style={styles.section}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleGroup(group.group)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sectionLabel}>
                    {group.group} ({group.exercises.length})
                  </Text>
                  <Ionicons
                    name={isCollapsed ? 'chevron-forward' : 'chevron-down'}
                    size={14}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
                {!isCollapsed && (
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
                        <Text
                          style={[
                            styles.exerciseName,
                            !ex.hasLoggedSets && styles.exerciseNameUnlogged,
                          ]}
                          numberOfLines={1}
                        >
                          {ex.name}
                        </Text>
                        <View style={styles.rowRight}>
                          {ex.metric ? (
                            <View style={styles.metricRow}>
                              <Text style={styles.metricValue}>
                                {formatMetricValue(ex.metric)}
                              </Text>
                              {ex.hasLoggedSets && (
                                <Text style={[styles.trendArrow, { color: getTrendArrow(ex.trend).color }]}>
                                  {' '}{getTrendArrow(ex.trend).symbol}
                                </Text>
                              )}
                            </View>
                          ) : (
                            <Text style={styles.metricDash}>{'\u2014'}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
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
  headerSpacer: {
    flex: 1,
  },
  addButton: {
    width: Spacing.xxxl,
    height: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.button,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md - 2,
    paddingVertical: Spacing.xs,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sectionLabel,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
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
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    minHeight: 56,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  exerciseName: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '500',
    marginRight: Spacing.md,
  },
  exerciseNameUnlogged: {
    color: Colors.textSecondary,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricValue: {
    color: Colors.text,
    fontSize: FontSize.body,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  trendArrow: {
    fontSize: FontSize.body,
    fontWeight: '700',
  },
  metricDash: {
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
