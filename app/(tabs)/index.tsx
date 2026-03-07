/**
 * APEX — Home Screen
 * Shows active program dashboard with week/block context,
 * today's session card, and quick stats.
 */

import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import { getActiveProgram, getSessionsForWeek, getCompletedSessionForDay } from '../../src/db';
import {
  getBlockForWeek, getBlockColor, getTrainingDays,
  getCurrentWeek, getTodayKey, DAY_NAMES
} from '../../src/utils/program';
import { ProgramTimeline } from '../../src/components/ProgramTimeline';
import { WeekRow } from '../../src/components/WeekRow';
import { TodayCard } from '../../src/components/TodayCard';
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

  if (!program) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>{'🏋'}</Text>
          <Text style={styles.emptyTitle}>No Active Program</Text>
          <Text style={styles.emptySub}>
            Choose a training program from the library to get started.
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/library')}
          >
            <Text style={styles.browseButtonText}>Browse Library</Text>
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
  const todayTemplate = trainingDays.find(d => d.day === todayKey)?.template;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.indigo} />
        }
      >
        {/* Header: APEX title + gear */}
        <View style={styles.header}>
          <Text style={styles.apexTitle}>APEX</Text>
          <TouchableOpacity
            style={styles.gearIcon}
            onPress={() => router.push('/library')}
          >
            <Ionicons name="settings-outline" size={22} color={Colors.textDim} />
          </TouchableOpacity>
        </View>

        {/* Program context */}
        <View style={styles.programContext}>
          <Text style={styles.programName}>{def.name}</Text>
          <Text style={styles.programWeek}>
            Week {currentWeek} of {def.duration_weeks} — {' '}
            <Text style={styles.programWeekAccent}>{block?.name ?? 'Unknown Block'}</Text>
          </Text>
        </View>

        <ProgramTimeline
          durationWeeks={def.duration_weeks}
          blocks={def.blocks}
          currentWeek={currentWeek}
        />

        <TodayCard
          todayTemplate={todayTemplate}
          isCompleted={completedDays.includes(todayKey)}
          blockColor={blockColor}
          onPress={() => router.push('/workout')}
        />

        <WeekRow
          trainingDays={trainingDays}
          todayKey={todayKey}
          completedDays={completedDays}
          blockColor={blockColor}
          dayNames={DAY_NAMES}
          onDayPress={async (day) => {
            if (completedDays.includes(day)) {
              const session = await getCompletedSessionForDay(program.id, currentWeek, day);
              if (session) {
                router.push(`/session/${session.id}`);
                return;
              }
            }
            router.push('/workout');
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: Spacing.screenTop,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.screenBottom,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  apexTitle: {
    color: Colors.text,
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    letterSpacing: 3,
  },
  gearIcon: {
    width: Spacing.xxxl,
    height: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.button,
  },
  programContext: {
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  programName: {
    color: Colors.text,
    fontSize: FontSize.subtitle,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  programWeek: {
    color: Colors.textSecondary,
    fontSize: FontSize.base,
    fontWeight: '500',
  },
  programWeekAccent: {
    color: Colors.amber,
    fontWeight: '600',
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xl,
    paddingHorizontal: Spacing.screenHorizontal,
  },
  emptyIcon: {
    fontSize: 48,
    opacity: 0.3,
  },
  emptyTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xl,
    fontWeight: '600',
  },
  emptySub: {
    color: Colors.textDim,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 21,
  },
  browseButton: {
    backgroundColor: Colors.indigo,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxxl,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  browseButtonText: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: '700',
  },
});
