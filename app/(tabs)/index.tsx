/**
 * APEX — Home Screen
 * Shows active program dashboard with week/block context,
 * today's session card, and quick stats.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import { getActiveProgram, getSessionsForWeek, getSessionsForDateRange, getCompletedSessionForDay } from '../../src/db';
import {
  getBlockForWeek, getBlockColor, getTrainingDays,
  getCurrentWeek, getTodayKey, DAY_NAMES, DAY_ORDER
} from '../../src/utils/program';
import { ProgramTimeline } from '../../src/components/ProgramTimeline';
import { MonthCalendar } from '../../src/components/MonthCalendar';
import type { MonthCalendarDay } from '../../src/components/MonthCalendar';
import { TodayCard } from '../../src/components/TodayCard';
import type { Program, ProgramDefinition, Session } from '../../src/types';

/** Get the first and last day of a month as YYYY-MM-DD strings */
function getMonthDateRange(year: number, month: number): { startDate: string; endDate: string } {
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
}

export default function HomeScreen() {
  const router = useRouter();
  const [program, setProgram] = useState<(Program & { definition: ProgramDefinition }) | null>(null);
  const [weekSessions, setWeekSessions] = useState<Session[]>([]);
  const [monthSessions, setMonthSessions] = useState<Session[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(1);

  const now = useMemo(() => new Date(), []);
  const displayYear = now.getFullYear();
  const displayMonth = now.getMonth();

  const loadData = useCallback(async () => {
    const active = await getActiveProgram();
    setProgram(active);

    if (active?.activated_date) {
      const week = getCurrentWeek(active.activated_date);
      setCurrentWeek(week);
      const sessions = await getSessionsForWeek(active.id, week);
      setWeekSessions(sessions);

      // Fetch all sessions for the current month
      const { startDate, endDate } = getMonthDateRange(displayYear, displayMonth);
      const mSessions = await getSessionsForDateRange(active.id, startDate, endDate);
      setMonthSessions(mSessions);
    }
  }, [displayYear, displayMonth]);

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

  // Build the set of training day-of-week indices (0=Sun, 6=Sat)
  const trainingDayIndices = useMemo(() => {
    const indices = new Set<number>();
    for (const td of trainingDays) {
      const idx = DAY_ORDER.indexOf(td.day as typeof DAY_ORDER[number]);
      if (idx >= 0) indices.add(idx);
    }
    return indices;
  }, [trainingDays]);

  // Build calendar days from monthSessions
  const calendarDays: MonthCalendarDay[] = useMemo(() => {
    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
    const sessionsByDate = new Map<string, Session>();
    for (const s of monthSessions) {
      // Use the date field (ISO string) - take just the YYYY-MM-DD part
      const dateKey = s.date.slice(0, 10);
      // If multiple sessions on same date, prefer completed one
      const existing = sessionsByDate.get(dateKey);
      if (!existing || (s.completed_at && !existing.completed_at)) {
        sessionsByDate.set(dateKey, s);
      }
    }

    const days: MonthCalendarDay[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dow = new Date(displayYear, displayMonth, d).getDay();
      const isTrainingDay = trainingDayIndices.has(dow);
      const session = sessionsByDate.get(dateStr);
      const isCompleted = !!(session?.completed_at);

      days.push({
        date: dateStr,
        dayNumber: d,
        isTrainingDay,
        isCompleted,
        sessionId: isCompleted ? session?.id : undefined,
      });
    }
    return days;
  }, [displayYear, displayMonth, monthSessions, trainingDayIndices]);

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
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={22} color={Colors.textDim} />
          </TouchableOpacity>
        </View>

        {/* Program context */}
        <View style={styles.programContext}>
          <Text style={styles.programName}>{def.name}</Text>
          <Text style={styles.programWeek}>
            Week {currentWeek} of {def.duration_weeks} — {' '}
            <Text style={{ color: blockColor, fontWeight: '600' }}>{block?.name ?? 'Unknown Block'}</Text>
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

        <MonthCalendar
          year={displayYear}
          month={displayMonth}
          days={calendarDays}
          blockColor={blockColor}
          onDayPress={(day) => {
            if (day.isCompleted && day.sessionId) {
              router.push(`/session/${day.sessionId}`);
            } else if (day.isTrainingDay) {
              router.push('/workout');
            }
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
