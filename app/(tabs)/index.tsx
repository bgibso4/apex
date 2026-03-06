/**
 * APEX — Home Screen
 * Shows active program dashboard with week/block context,
 * today's session card, and quick stats.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import { getActiveProgram, getSessionsForWeek, getEstimated1RM } from '../../src/db';
import {
  getBlockForWeek, getBlockColor, getTrainingDays,
  getCurrentWeek, getTodayKey, DAY_NAMES
} from '../../src/utils/program';
import type { Program, ProgramDefinition, Session } from '../../src/types';

export default function HomeScreen() {
  const router = useRouter();
  const [program, setProgram] = useState<(Program & { definition: ProgramDefinition }) | null>(null);
  const [weekSessions, setWeekSessions] = useState<Session[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(1);

  const loadData = useCallback(async () => {
    const active = await getActiveProgram();
    setProgram(active);

    if (active?.activated_date) {
      const week = getCurrentWeek(active.activated_date);
      setCurrentWeek(week);
      const sessions = await getSessionsForWeek(active.id, week);
      setWeekSessions(sessions);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // No active program → show prompt to go to library
  if (!program) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.logo}>APEX</Text>
          <Text style={styles.emptyText}>No active program</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/library')}
          >
            <Text style={styles.primaryButtonText}>Open Program Library</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const def = program.definition.program;
  const block = getBlockForWeek(def.blocks, currentWeek);
  const blockColor = block ? getBlockColor(block) : Colors.indigo;
  const trainingDays = getTrainingDays(def.weekly_template);
  const todayKey = getTodayKey();
  const completedDays = weekSessions.filter(s => s.completed_at).map(s => s.scheduled_day);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.indigo} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.programName}>{def.name}</Text>
            <Text style={[styles.blockLabel, { color: blockColor }]}>
              Week {currentWeek} · {block?.name ?? 'Unknown Block'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/library')}>
            <Ionicons name="menu" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Periodization Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>PROGRAM TIMELINE</Text>
          <View style={styles.timeline}>
            {Array.from({ length: def.duration_weeks }, (_, i) => {
              const weekNum = i + 1;
              const weekBlock = getBlockForWeek(def.blocks, weekNum);
              const color = weekBlock ? getBlockColor(weekBlock) : Colors.border;
              const isCurrent = weekNum === currentWeek;
              return (
                <View
                  key={i}
                  style={[
                    styles.timelineBar,
                    {
                      backgroundColor: isCurrent ? color : `${color}40`,
                      borderWidth: isCurrent ? 1.5 : 0,
                      borderColor: isCurrent ? color : 'transparent',
                    }
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.timelineLabels}>
            {def.blocks.map((b, i) => (
              <Text key={i} style={[styles.timelineLabelText, { color: getBlockColor(b) }]}>
                {b.name}
              </Text>
            ))}
          </View>
        </View>

        {/* This Week's Schedule */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>THIS WEEK</Text>
          <View style={styles.weekRow}>
            {trainingDays.map(({ day, template }) => {
              const isToday = day === todayKey;
              const isCompleted = completedDays.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayPill,
                    isToday && styles.dayPillToday,
                    isCompleted && styles.dayPillDone,
                  ]}
                  onPress={() => router.push('/workout')}
                >
                  <Text style={[
                    styles.dayPillText,
                    isToday && { color: Colors.text },
                    isCompleted && { color: Colors.green },
                  ]}>
                    {DAY_NAMES[day]}
                  </Text>
                  {isCompleted && (
                    <Ionicons name="checkmark" size={14} color={Colors.green} />
                  )}
                  {isToday && !isCompleted && (
                    <View style={[styles.todayDot, { backgroundColor: blockColor }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Today's Session Card */}
        {(() => {
          const todayTemplate = trainingDays.find(d => d.day === todayKey);
          if (!todayTemplate) {
            return (
              <View style={styles.card}>
                <Text style={styles.restDayText}>Rest Day</Text>
                <Text style={styles.restDaySubtext}>Recovery is training too.</Text>
              </View>
            );
          }

          const isCompleted = completedDays.includes(todayKey);
          return (
            <TouchableOpacity
              style={[styles.card, styles.sessionCard]}
              onPress={() => router.push('/workout')}
              activeOpacity={0.7}
            >
              <View style={styles.sessionCardHeader}>
                <Text style={styles.sessionName}>{todayTemplate.template.name}</Text>
                {isCompleted ? (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.green} />
                    <Text style={styles.completedText}>Done</Text>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={Colors.textDim} />
                )}
              </View>
              <Text style={styles.sessionExercises}>
                {todayTemplate.template.exercises
                  .slice(0, 4)
                  .map(e => e.exercise_id.replace(/_/g, ' '))
                  .join(' · ')}
                {todayTemplate.template.exercises.length > 4
                  ? ` +${todayTemplate.template.exercises.length - 4} more`
                  : ''}
              </Text>
              {!isCompleted && (
                <View style={[styles.startButton, { backgroundColor: blockColor }]}>
                  <Text style={styles.startButtonText}>Start Workout</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  programName: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '700',
  },
  blockLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardLabel: {
    color: Colors.textDim,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  // Timeline
  timeline: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: Spacing.sm,
  },
  timelineBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  timelineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineLabelText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  // Week row
  weekRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dayPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
  },
  dayPillToday: {
    borderWidth: 1,
    borderColor: Colors.indigo,
  },
  dayPillDone: {
    backgroundColor: Colors.greenMuted,
  },
  dayPillText: {
    color: Colors.textDim,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 3,
  },
  // Session card
  sessionCard: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sessionName: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '600',
    flex: 1,
  },
  sessionExercises: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textTransform: 'capitalize',
    marginBottom: Spacing.lg,
  },
  startButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  startButtonText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedText: {
    color: Colors.green,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  // Rest day
  restDayText: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '600',
    textAlign: 'center',
  },
  restDaySubtext: {
    color: Colors.textDim,
    fontSize: FontSize.md,
    textAlign: 'center',
    marginTop: 4,
  },
  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  logo: {
    color: Colors.text,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 4,
    marginBottom: Spacing.xl,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    marginBottom: Spacing.xxl,
  },
  primaryButton: {
    backgroundColor: Colors.indigo,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxxl,
    borderRadius: BorderRadius.md,
  },
  primaryButtonText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
