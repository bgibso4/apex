/**
 * APEX — Exercise Detail Screen
 * Shows 1RM trend chart with block bands, time range chips,
 * current estimated 1RM, and compact session history rows.
 * Navigated from Progress screen lift cards.
 */

import { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import {
  getEstimated1RM,
  get1RMHistoryWithBlocks,
  getExerciseSetHistoryWithBlocks,
  getExerciseSessionCount,
  getActiveProgram,
} from '../../src/db';
import type { Estimated1RM, E1RMHistoryPoint, SessionSetHistory } from '../../src/db';
import TrendLineChart from '../../src/components/TrendLineChart';
import { getBlockColorMap, buildBands } from '../../src/utils/blockColors';
import { getDeltaExcludingDeload } from '../../src/utils/deltaCalculation';

type TimeRange = 'program' | '3m' | '1y' | 'all';

const TIME_RANGE_LABELS: [TimeRange, string][] = [
  ['program', 'Program'],
  ['3m', '3M'],
  ['1y', '1Y'],
  ['all', 'All'],
];

function generateYLabels(history: E1RMHistoryPoint[]): string[] {
  if (history.length === 0) return [];
  const values = history.map(h => h.e1rm);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [String(Math.round(min))];
  const step = (max - min) / 3;
  return [
    String(Math.round(min)),
    String(Math.round(min + step)),
    String(Math.round(min + step * 2)),
    String(Math.round(max)),
  ];
}

function getStartDate(range: TimeRange, activatedDate?: string): string | undefined {
  switch (range) {
    case 'program':
      return activatedDate;
    case '3m': {
      const d = new Date();
      d.setMonth(d.getMonth() - 3);
      return d.toISOString().slice(0, 10);
    }
    case '1y': {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 1);
      return d.toISOString().slice(0, 10);
    }
    case 'all':
      return undefined;
  }
}

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [timeRange, setTimeRange] = useState<TimeRange>('program');
  const [e1rm, setE1rm] = useState<Estimated1RM | null>(null);
  const [history, setHistory] = useState<E1RMHistoryPoint[]>([]);
  const [recentSessions, setRecentSessions] = useState<SessionSetHistory[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [showCount, setShowCount] = useState(5);
  const [activatedDate, setActivatedDate] = useState<string | undefined>();
  const [blocks, setBlocks] = useState<{ name: string }[]>([]);

  const loadData = useCallback(async () => {
    if (!id) return;

    // Load program info first (needed for date calculation)
    const program = await getActiveProgram();
    const progId = program?.id;
    const actDate = program?.activated_date;
    const progBlocks = program?.definition?.program?.blocks ?? [];
    setActivatedDate(actDate);
    setBlocks(progBlocks);

    const startDate = getStartDate(timeRange, actDate);
    const filterProgramId = timeRange === 'program' ? progId : undefined;

    const [rm, hist, sets, count] = await Promise.all([
      getEstimated1RM(id),
      get1RMHistoryWithBlocks(id, { startDate, programId: filterProgramId }),
      getExerciseSetHistoryWithBlocks(id, { startDate, programId: filterProgramId, limit: showCount }),
      getExerciseSessionCount(id, { startDate, programId: filterProgramId }),
    ]);
    setE1rm(rm);
    setHistory(hist);
    setRecentSessions(sets);
    setTotalSessions(count);
  }, [id, timeRange, showCount]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const delta = getDeltaExcludingDeload(history);

  const exerciseName = e1rm?.exercise_name ?? id?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? 'Exercise';

  const colorMap = useMemo(
    () => getBlockColorMap(blocks as { name: string; weeks: number[]; main_lift_scheme: any }[]),
    [blocks]
  );
  const bands = useMemo(() => buildBands(history, colorMap), [history, colorMap]);
  const yLabels = useMemo(() => generateYLabels(history), [history]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[d.getDay()]} \u00B7 ${months[d.getMonth()]} ${d.getDate()}`;
  };

  const formatCompactDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  };

  const formatSessionSummary = (session: SessionSetHistory) => {
    if (session.sets.length === 0) return '';
    const first = session.sets[0];
    return `${first.weight} \u00D7 ${first.reps} \u00D7 ${session.sets.length} sets`;
  };

  const isDeload = (blockName: string) => /deload/i.test(blockName);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Colors.textDim} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{exerciseName}</Text>
        </View>

        {/* Current 1RM Hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Estimated 1RM</Text>
          <View style={styles.heroRow}>
            <Text style={styles.heroValue}>{e1rm ? `${e1rm.value}` : '\u2014'}</Text>
            {e1rm && <Text style={styles.heroUnit}>lbs</Text>}
            {delta != null && delta !== 0 && (
              <Text style={[styles.heroDelta, delta > 0 && styles.heroDeltaUp]}>
                {delta > 0 ? '\u2191 +' : '\u2193 '}{delta} lbs
              </Text>
            )}
          </View>
          {e1rm && (
            <Text style={styles.heroDetail}>
              Based on {e1rm.from_weight} {'\u00D7'} {e1rm.from_reps} on {formatDate(e1rm.date)}
            </Text>
          )}
        </View>

        {/* Time Range Chips */}
        <View style={styles.rangeRow}>
          {TIME_RANGE_LABELS.map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[styles.rangeButton, timeRange === key && styles.rangeButtonActive]}
              onPress={() => setTimeRange(key)}
            >
              <Text style={[styles.rangeText, timeRange === key && styles.rangeTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 1RM Trend Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>1RM Progression</Text>
          {bands.length > 0 && (
            <View style={styles.bandLabelRow}>
              {bands.map((band, i) => (
                <View
                  key={i}
                  style={[styles.bandLabel, {
                    flex: band.endIndex - band.startIndex + 1,
                  }]}
                >
                  <View style={[styles.bandLabelDot, {
                    backgroundColor: band.color.replace(/18$/, ''),
                  }]} />
                  <Text style={styles.bandLabelText} numberOfLines={1}>
                    {band.label}
                  </Text>
                </View>
              ))}
            </View>
          )}
          {history.length >= 2 ? (
            <TrendLineChart
              lines={[{
                data: history.map(h => ({ value: h.e1rm })),
                color: Colors.indigo,
              }]}
              height={120}
              viewBoxHeight={80}
              areaOpacity={0.1}
              xLabels={(() => {
                if (history.length <= 3) return history.map(h => formatShortDate(h.date));
                const mid = Math.floor(history.length / 2);
                return [
                  formatShortDate(history[0].date),
                  formatShortDate(history[mid].date),
                  formatShortDate(history[history.length - 1].date),
                ];
              })()}
              yLabels={yLabels}
              bands={bands}
              showBandLabels={false}
            />
          ) : (
            <View style={styles.chartEmpty}>
              <Text style={styles.chartEmptyText}>
                {history.length === 0
                  ? 'No sessions in this time range'
                  : 'Need at least 2 sessions for a chart'}
              </Text>
            </View>
          )}
        </View>

        {/* Session History */}
        <Text style={styles.sectionLabel}>Recent Sessions</Text>
        {recentSessions.length > 0 ? (
          <View style={styles.sessionsCard}>
            {recentSessions.map((session, si) => (
              <View key={si}>
                {si > 0 && <View style={styles.sessionDivider} />}
                <View style={styles.sessionRow}>
                  <View style={styles.sessionLeft}>
                    <Text style={styles.sessionDate}>{formatCompactDate(session.date)}</Text>
                    {isDeload(session.blockName) && (
                      <Text style={styles.deloadTag}>(deload)</Text>
                    )}
                  </View>
                  <Text style={styles.sessionSummary}>{formatSessionSummary(session)}</Text>
                  <Text style={styles.sessionE1rm}>{Math.round(session.sessionE1rm)}</Text>
                  {session.avgRpe != null && (
                    <Text style={styles.sessionRpe}>RPE {session.avgRpe.toFixed(1)}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No completed sets yet</Text>
          </View>
        )}

        {/* View all sessions link */}
        {totalSessions > showCount && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => setShowCount(totalSessions)}
          >
            <Text style={styles.viewAllText}>
              View all {totalSessions} sessions {'\u2192'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: Spacing.screenTop,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.screenBottom,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  backButton: {
    width: Spacing.xxxl,
    height: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.button,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSize.screenTitle,
    fontWeight: '800',
  },

  // Hero card
  heroCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  heroLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sectionLabel,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  heroValue: {
    color: Colors.text,
    fontSize: FontSize.hero,
    fontWeight: '800',
  },
  heroUnit: {
    color: Colors.textMuted,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  heroDelta: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginLeft: Spacing.sm,
  },
  heroDeltaUp: {
    color: Colors.green,
  },
  heroDetail: {
    color: Colors.textDim,
    fontSize: FontSize.sm,
    marginTop: Spacing.sm,
  },

  // Time range chips
  rangeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: Spacing.md - 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  rangeButtonActive: {
    backgroundColor: Colors.indigoMuted,
    borderColor: Colors.indigo,
  },
  rangeText: {
    color: Colors.textMuted,
    fontSize: FontSize.body,
    fontWeight: '600',
  },
  rangeTextActive: {
    color: Colors.text,
  },

  // Chart card
  chartCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  cardTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  bandLabelRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  bandLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  bandLabelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bandLabelText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },

  // Section label
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sectionLabel,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md - 2,
  },

  // Compact sessions
  sessionsCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.cardInner,
    padding: Spacing.lg,
  },
  sessionDivider: {
    height: 1,
    backgroundColor: Colors.surface,
    marginVertical: Spacing.sm,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    width: 90,
  },
  sessionDate: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  deloadTag: {
    color: Colors.green,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  sessionSummary: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  sessionE1rm: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
    width: 40,
    textAlign: 'right',
  },
  sessionRpe: {
    color: Colors.textDim,
    fontSize: FontSize.xs,
    fontWeight: '600',
    width: 50,
    textAlign: 'right',
  },

  // View all link
  viewAllButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  viewAllText: {
    color: Colors.indigo,
    fontSize: FontSize.body,
    fontWeight: '600',
  },

  // Empty state
  emptyState: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.cardInner,
    padding: Spacing.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textDim,
    fontSize: FontSize.md,
    textAlign: 'center',
  },

  // Chart empty state
  chartEmpty: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartEmptyText: {
    color: Colors.textDim,
    fontSize: FontSize.sm,
  },
});
