/**
 * APEX — Home Screen
 * Shows active program dashboard with week/block context,
 * today's session card, and quick stats.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import { APEX_FONT_FAMILY } from '../../src/theme/fonts';
import { getActiveProgram, getSessionsForWeek, getSessionsForDateRange, getCompletedSessionForDay, getSetLogsForSession, getPendingPainFollowUp, updateRunPain24h, getAllSessionsForDateRange } from '../../src/db';
import {
  getBlockForWeek, getBlockColor, getTrainingDays,
  getCurrentWeek, getTodayKey, DAY_NAMES, DAY_ORDER
} from '../../src/utils/program';
import { ProgramTimeline } from '../../src/components/ProgramTimeline';
import { MonthCalendar } from '../../src/components/MonthCalendar';
import type { MonthCalendarDay } from '../../src/components/MonthCalendar';
import { TodayCard } from '../../src/components/TodayCard';
import { PainFollowUp } from '../../src/components/PainFollowUp';
import type { Program, ProgramDefinition, Session, RunLog } from '../../src/types';

let hasAnimatedOnce = false;

/** Get the first and last day of a month as YYYY-MM-DD strings */
function getMonthDateRange(year: number, month: number): { startDate: string; endDate: string } {
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
}

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<(Program & { definition: ProgramDefinition }) | null>(null);
  const [weekSessions, setWeekSessions] = useState<Session[]>([]);
  const [monthSessions, setMonthSessions] = useState<Session[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [todaySessionId, setTodaySessionId] = useState<string | null>(null);
  const [pendingFollowUp, setPendingFollowUp] = useState<RunLog | null>(null);
  const [completedStats, setCompletedStats] = useState<{ durationMin: number; setCount: number } | null>(null);

  const now = useMemo(() => new Date(), []);
  const [displayYear, setDisplayYear] = useState(now.getFullYear());
  const [displayMonth, setDisplayMonth] = useState(now.getMonth());

  const loadData = useCallback(async () => {
    const active = await getActiveProgram();
    setProgram(active);

    // Always fetch month sessions (for calendar in both states)
    const { startDate, endDate } = getMonthDateRange(displayYear, displayMonth);

    if (active?.activated_date) {
      const week = getCurrentWeek(active.activated_date);
      setCurrentWeek(week);
      const sessions = await getSessionsForWeek(active.id, week);
      setWeekSessions(sessions);

      const mSessions = await getSessionsForDateRange(active.id, startDate, endDate);
      setMonthSessions(mSessions);

      // Check if today's session is completed (for TodayCard navigation)
      const todayCompleted = await getCompletedSessionForDay(active.id, week, getTodayKey());
      if (todayCompleted?.completed_at) {
        setTodaySessionId(todayCompleted.id);
        const setLogs = await getSetLogsForSession(todayCompleted.id);
        const completedSets = setLogs.filter(s => s.status === 'completed' || s.status === 'completed_below');
        const startedAt = new Date(todayCompleted.started_at).getTime();
        const completedAt = new Date(todayCompleted.completed_at).getTime();
        const durationMin = Math.round((completedAt - startedAt) / 60000);
        setCompletedStats({ durationMin, setCount: completedSets.length });
      } else {
        setTodaySessionId(todayCompleted?.id ?? null);
        setCompletedStats(null);
      }
    } else {
      // No active program — still load completed sessions for the calendar
      const mSessions = await getAllSessionsForDateRange(startDate, endDate);
      setMonthSessions(mSessions);
    }

    // Check for pending pain follow-up (independent of program)
    const followUp = await getPendingPainFollowUp();
    setPendingFollowUp(followUp);
  }, [displayYear, displayMonth]);

  useFocusEffect(useCallback(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const def = program?.definition.program ?? null;
  const block = def ? getBlockForWeek(def.blocks, currentWeek) : null;
  const blockColor = block ? getBlockColor(block) : Colors.indigo;
  const trainingDays = def ? getTrainingDays(def.weekly_template) : [];
  const todayKey = getTodayKey();
  const completedDays = weekSessions.filter(s => s.completed_at).map(s => s.scheduled_day);
  const todayTemplate = trainingDays.find(d => d.day === todayKey)?.template;

  // Compute next training day for rest day up-next preview
  const nextTraining = useMemo(() => {
    if (todayTemplate || !def) return null;
    const todayIdx = DAY_ORDER.indexOf(todayKey as typeof DAY_ORDER[number]);
    for (let offset = 1; offset <= 7; offset++) {
      const idx = (todayIdx + offset) % 7;
      const dayKey = DAY_ORDER[idx];
      const t = trainingDays.find(d => d.day === dayKey);
      if (t) {
        const label = offset === 1 ? 'Tomorrow' : DAY_NAMES[dayKey];
        return { name: t.template.name, label };
      }
    }
    return null;
  }, [todayTemplate, def, todayKey, trainingDays]);

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
      const dateKey = s.date.slice(0, 10);
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

  const shouldAnimate = !hasAnimatedOnce;

  useEffect(() => {
    if (!hasAnimatedOnce) {
      hasAnimatedOnce = true;
    }
  }, []);

  if (loading) {
    return <View style={styles.container} />;
  }

  if (!program || !def) {
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
            <View style={styles.apexTitleRow}>
              <Image
                source={require('../../assets/logo-mark.png')}
                style={styles.apexLogoMark}
                resizeMode="contain"
              />
              <Text style={[
                styles.apexTitle,
                APEX_FONT_FAMILY !== 'System' && { fontFamily: APEX_FONT_FAMILY },
              ]}>PEX</Text>
            </View>
            <TouchableOpacity
              style={styles.gearIcon}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings-outline" size={22} color={Colors.textDim} />
            </TouchableOpacity>
          </View>

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

          <MonthCalendar
            year={displayYear}
            month={displayMonth}
            days={calendarDays}
            blockColor={Colors.indigo}
            onDayPress={(day) => {
              if (day.isCompleted && day.sessionId) {
                router.push(`/session/${day.sessionId}`);
              }
            }}
            onPrevMonth={() => {
              if (displayMonth === 0) {
                setDisplayMonth(11);
                setDisplayYear(y => y - 1);
              } else {
                setDisplayMonth(m => m - 1);
              }
            }}
            onNextMonth={
              displayYear < now.getFullYear() || displayMonth < now.getMonth()
                ? () => {
                    if (displayMonth === 11) {
                      setDisplayMonth(0);
                      setDisplayYear(y => y + 1);
                    } else {
                      setDisplayMonth(m => m + 1);
                    }
                  }
                : undefined
            }
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        directionalLockEnabled={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.indigo} />
        }
      >
        {/* Header: APEX title + gear */}
        <View style={styles.header}>
          <View style={styles.apexTitleRow}>
            <Image
              source={require('../../assets/logo-mark.png')}
              style={styles.apexLogoMark}
              resizeMode="contain"
            />
            <Text style={[
              styles.apexTitle,
              APEX_FONT_FAMILY !== 'System' && { fontFamily: APEX_FONT_FAMILY },
            ]}>PEX</Text>
          </View>
          <TouchableOpacity
            style={styles.gearIcon}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={22} color={Colors.textDim} />
          </TouchableOpacity>
        </View>

        {/* Program context */}
        <Animated.View entering={shouldAnimate ? FadeInDown.delay(0).duration(300) : undefined}>
          <View style={styles.programContext}>
            <Text style={styles.programName}>{def.name}</Text>
            <Text style={styles.programWeek}>
              Week {currentWeek} of {def.duration_weeks} — {' '}
              <Text style={{ color: blockColor, fontWeight: '600' }}>{block?.name ?? 'Unknown Block'}</Text>
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={shouldAnimate ? FadeInDown.delay(80).duration(300) : undefined}>
          <ProgramTimeline
            durationWeeks={def.duration_weeks}
            blocks={def.blocks}
            currentWeek={currentWeek}
          />
        </Animated.View>

        {/* Pain follow-up prompt (24h after a run) */}
        {pendingFollowUp && (
          <Animated.View entering={shouldAnimate ? FadeInDown.delay(160).duration(300) : undefined}>
            <PainFollowUp
              runDate={pendingFollowUp.date}
              durationMin={pendingFollowUp.duration_min}
              distance={pendingFollowUp.distance}
              onSave={async (painLevel) => {
                await updateRunPain24h(pendingFollowUp.id, painLevel);
                setPendingFollowUp(null);
              }}
              onDismiss={() => setPendingFollowUp(null)}
            />
          </Animated.View>
        )}

        <Animated.View entering={shouldAnimate ? FadeInDown.delay(240).duration(300) : undefined}>
          <TodayCard
            todayTemplate={todayTemplate}
            isCompleted={completedDays.includes(todayKey)}
            blockColor={blockColor}
            completedStats={completedStats ?? undefined}
            nextSessionName={nextTraining?.name}
            nextSessionLabel={nextTraining?.label}
            onPress={() => {
              if (completedDays.includes(todayKey) && todaySessionId) {
                router.push(`/session/${todaySessionId}`);
              } else {
                router.push('/workout');
              }
            }}
          />
        </Animated.View>

        <Animated.View entering={shouldAnimate ? FadeInDown.delay(320).duration(300) : undefined}>
          <MonthCalendar
            year={displayYear}
            month={displayMonth}
            days={calendarDays}
            blockColor={blockColor}
            onDayPress={(day) => {
              if (day.isCompleted && day.sessionId) {
                router.push(`/session/${day.sessionId}`);
              }
            }}
            onPrevMonth={() => {
              if (displayMonth === 0) {
                setDisplayMonth(11);
                setDisplayYear(y => y - 1);
              } else {
                setDisplayMonth(m => m - 1);
              }
            }}
            onNextMonth={
              displayYear < now.getFullYear() || displayMonth < now.getMonth()
                ? () => {
                    if (displayMonth === 11) {
                      setDisplayMonth(0);
                      setDisplayYear(y => y + 1);
                    } else {
                      setDisplayMonth(m => m + 1);
                    }
                  }
                : undefined
            }
          />
        </Animated.View>
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
    gap: Spacing.contentGap,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  apexTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  apexLogoMark: {
    width: 28,
    height: 32,
    marginRight: 1,
  },
  apexTitle: {
    color: Colors.text,
    fontSize: 38,
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
    alignItems: 'center',
    gap: Spacing.xl,
    paddingVertical: Spacing.xxxl,
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
