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

        <ProgramTimeline
          durationWeeks={def.duration_weeks}
          blocks={def.blocks}
          currentWeek={currentWeek}
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

        <TodayCard
          todayTemplate={todayTemplate}
          isCompleted={completedDays.includes(todayKey)}
          blockColor={blockColor}
          onPress={() => router.push('/workout')}
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
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: Spacing.xl,
  },
  programName: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '700' },
  blockLabel: { fontSize: FontSize.md, fontWeight: '600', marginTop: 2 },
  emptyState: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  logo: {
    color: Colors.text, fontSize: FontSize.logo, fontWeight: '800',
    letterSpacing: 4, marginBottom: Spacing.xl,
  },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.lg, marginBottom: Spacing.xxl },
  primaryButton: {
    backgroundColor: Colors.indigo, paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxxl, borderRadius: BorderRadius.md,
  },
  primaryButtonText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
});
