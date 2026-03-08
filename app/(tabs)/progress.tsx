/**
 * APEX — Progress Screen
 * Estimated 1RMs with SVG trend charts, volume, time range selector.
 * Matches progress-screen-v2.html mockup.
 */

import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, ComponentSize } from '../../src/theme';
import { getActiveProgram, getEstimated1RM, get1RMHistory, getWeeklyVolume, getTrainingConsistency, getAllTimeConsistency, getProtocolConsistency } from '../../src/db';
import { getTrainingDays, getCurrentWeek } from '../../src/utils/program';
import { ProgressBar } from '../../src/components/ProgressBar';
import TrendLineChart, { SparkLine } from '../../src/components/TrendLineChart';
import type { Estimated1RM } from '../../src/types';
import type { WeekConsistency, ProgramConsistency, ProtocolItem } from '../../src/db';

const TOP_LIFTS = [
  { id: 'back_squat', name: 'Back Squat' },
  { id: 'bench_press', name: 'Bench Press' },
];

const COMPACT_LIFTS = [
  { id: 'overhead_press', name: 'Overhead Press' },
  { id: 'weighted_pullup', name: 'Weighted Pull-up' },
  { id: 'zercher_squat', name: 'Zercher Squat' },
  { id: 'romanian_deadlift', name: 'RDL' },
];

const ALL_LIFTS = [...TOP_LIFTS, ...COMPACT_LIFTS];

type TimeRange = 'program' | 'all';

interface LiftData {
  e1rm: Estimated1RM | null;
  history: { date: string; e1rm: number }[];
}

export default function ProgressScreen() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<TimeRange>('program');
  const [liftData, setLiftData] = useState<Map<string, LiftData>>(new Map());
  const [volumeData, setVolumeData] = useState<{ week: number; totalSets: number }[]>([]);
  const [consistencyData, setConsistencyData] = useState<WeekConsistency[]>([]);
  const [allTimeConsistency, setAllTimeConsistency] = useState<ProgramConsistency[]>([]);
  const [currentWeek, setCurrentWeek] = useState<number>(0);
  const [protocolData, setProtocolData] = useState<ProtocolItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const program = await getActiveProgram();

    // Load 1RMs and history for all lifts
    const entries = await Promise.all(
      ALL_LIFTS.map(async (lift) => {
        const [e1rm, history] = await Promise.all([
          getEstimated1RM(lift.id),
          get1RMHistory(lift.id, 12),
        ]);
        return [lift.id, { e1rm, history }] as [string, LiftData];
      })
    );
    setLiftData(new Map(entries));

    // Load volume and consistency
    if (program) {
      const trainingDaysPerWeek = getTrainingDays(program.definition.program.weekly_template).length;
      const vol = await getWeeklyVolume(program.id);
      setVolumeData(vol);

      const consistency = await getTrainingConsistency(program.id, trainingDaysPerWeek);
      setConsistencyData(consistency);
      setCurrentWeek(getCurrentWeek(program.activated_date));

      const allTime = await getAllTimeConsistency(trainingDaysPerWeek);
      setAllTimeConsistency(allTime);
    }

    // Protocol consistency
    const protocols = await getProtocolConsistency(program ? program.id : null);
    setProtocolData(protocols);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getDelta = (history: { e1rm: number }[]): number | null => {
    if (history.length < 2) return null;
    return history[history.length - 1].e1rm - history[0].e1rm;
  };

  const maxVolume = Math.max(...volumeData.map(v => v.totalSets), 1);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.indigo} />
        }
      >
        <Text style={styles.title}>Progress</Text>

        {/* Time Range Selector */}
        <View style={styles.rangeRow}>
          {([
            ['program', 'This Program'],
            ['all', 'All Time'],
          ] as [TimeRange, string][]).map(([key, label]) => (
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

        {/* Estimated 1RMs — Top lifts with full charts */}
        <Text style={styles.sectionLabel}>Estimated 1RM</Text>
        <View style={styles.rmTrends}>
          {TOP_LIFTS.map((lift) => {
            const data = liftData.get(lift.id);
            const e1rm = data?.e1rm;
            const history = data?.history ?? [];
            const delta = getDelta(history);

            return (
              <TouchableOpacity
                key={lift.id}
                style={styles.rmTrendCard}
                activeOpacity={0.7}
                onPress={() => router.push(`/exercise/${lift.id}`)}
              >
                <View style={styles.rmTrendHeader}>
                  <Text style={styles.rmTrendName}>{lift.name}</Text>
                  <View style={styles.rmTrendCurrent}>
                    <Text style={styles.rmTrendValue}>
                      {e1rm ? `${e1rm.value}` : '\u2014'}
                    </Text>
                    {e1rm && <Text style={styles.rmTrendUnit}>lbs</Text>}
                    {delta != null && delta !== 0 && (
                      <Text style={[styles.rmTrendDelta, delta > 0 && styles.rmTrendDeltaUp]}>
                        {delta > 0 ? '\u2191' : '\u2193'} {delta > 0 ? '+' : ''}{delta}
                      </Text>
                    )}
                  </View>
                </View>
                {history.length >= 2 ? (
                  <TrendLineChart
                    lines={[{
                      data: history.map(h => ({ value: h.e1rm })),
                      color: Colors.indigo,
                    }]}
                    height={60}
                    viewBoxHeight={60}
                    areaOpacity={0.1}
                    xLabels={history.length > 0
                      ? history.map((_, i) => i === history.length - 1 ? `W${history.length}` : (i === 0 ? 'W1' : ''))
                        .filter(l => l !== '')
                      : []
                    }
                  />
                ) : (
                  <Text style={styles.noDataText}>Not enough data for chart</Text>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Compact grid for remaining lifts */}
          <View style={styles.rmCompactGrid}>
            {COMPACT_LIFTS.map((lift) => {
              const data = liftData.get(lift.id);
              const e1rm = data?.e1rm;
              const history = data?.history ?? [];
              const delta = getDelta(history);

              return (
                <TouchableOpacity
                  key={lift.id}
                  style={styles.rmCompactCard}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/exercise/${lift.id}`)}
                >
                  <Text style={styles.rmCompactName}>{lift.name}</Text>
                  <View style={styles.rmCompactRow}>
                    <Text style={styles.rmCompactValue}>
                      {e1rm ? `${e1rm.value}` : '\u2014'}
                    </Text>
                    {e1rm && <Text style={styles.rmCompactUnit}>lbs</Text>}
                    {delta != null && delta !== 0 && (
                      <Text style={[styles.rmCompactDelta, delta > 0 && styles.rmCompactDeltaUp]}>
                        {delta > 0 ? '\u2191' : ''}{delta > 0 ? '+' : ''}{delta}
                      </Text>
                    )}
                  </View>
                  {history.length >= 2 && (
                    <View style={styles.rmCompactMiniChart}>
                      <SparkLine
                        data={history.map(h => h.e1rm)}
                        color={Colors.indigo}
                        height={24}
                        opacity={0.25}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* All Exercises link */}
          <TouchableOpacity
            style={styles.allExercisesLink}
            activeOpacity={0.7}
            onPress={() => router.push('/exercises')}
          >
            <Text style={styles.allExercisesText}>All Exercises</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.indigo} />
          </TouchableOpacity>
        </View>

        {/* Volume Trend */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.xxl + Spacing.xs }]}>Weekly Volume</Text>
        {volumeData.length > 0 ? (
          <View style={styles.chart}>
            {volumeData.map((v, i) => (
              <View key={i} style={styles.chartBarCol}>
                <View style={[styles.bar, {
                  height: `${(v.totalSets / maxVolume) * 100}%`,
                  backgroundColor: Colors.indigo,
                }]} />
                <Text style={styles.chartLabel}>W{v.week}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyChart}>
            <Ionicons name="bar-chart-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyChartText}>
              Complete some sessions to see volume trends
            </Text>
          </View>
        )}

        {/* Training Consistency */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.xxl + Spacing.xs }]}>Training Consistency</Text>
        {timeRange === 'program' ? (
          <View style={styles.consistencyCard}>
            {consistencyData.length > 0 ? (
              <>
                <Text style={styles.consistencySummary}>
                  {Math.round(
                    (consistencyData.reduce((s, w) => s + w.completed, 0) /
                      Math.max(consistencyData.reduce((s, w) => s + w.planned, 0), 1)) * 100
                  )}% — {consistencyData.reduce((s, w) => s + w.completed, 0)}/{consistencyData.reduce((s, w) => s + w.planned, 0)} sessions
                </Text>
                {consistencyData.map((week) => {
                  let color = Colors.textDim;
                  if (week.completed >= week.planned) {
                    color = Colors.green;
                  } else if (week.completed > 0 && week.week === currentWeek) {
                    color = Colors.indigo;
                  } else if (week.completed > 0) {
                    color = Colors.amber;
                  }
                  return (
                    <ProgressBar
                      key={week.week}
                      label={`Week ${week.week}`}
                      value={week.completed}
                      max={week.planned}
                      color={color}
                    />
                  );
                })}
              </>
            ) : (
              <Text style={styles.emptyChartText}>
                Complete some sessions to see consistency data
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.consistencyCard}>
            {allTimeConsistency.length > 0 ? (
              <>
                <Text style={styles.consistencySummary}>
                  {Math.round(
                    (allTimeConsistency.reduce((s, p) => s + p.completed, 0) /
                      Math.max(allTimeConsistency.reduce((s, p) => s + p.planned, 0), 1)) * 100
                  )}% — {allTimeConsistency.reduce((s, p) => s + p.completed, 0)}/{allTimeConsistency.reduce((s, p) => s + p.planned, 0)} sessions
                </Text>
                {allTimeConsistency.map((prog) => (
                  <ProgressBar
                    key={prog.programName}
                    label={prog.programName}
                    value={prog.completed}
                    max={prog.planned}
                    color={Colors.indigo}
                    showPercentage
                  />
                ))}
              </>
            ) : (
              <Text style={styles.emptyChartText}>
                No program data available
              </Text>
            )}
          </View>
        )}

        {/* Protocol Consistency */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.xxl + Spacing.xs }]}>Protocol Consistency</Text>
        <View style={styles.consistencyCard}>
          {protocolData.length > 0 ? (
            protocolData.map((item) => {
              const pct = item.total > 0 ? Math.round(item.completed / item.total * 100) : 0;
              let color = Colors.textDim;
              if (pct >= 80) color = Colors.green;
              else if (pct >= 50) color = Colors.amber;
              return (
                <ProgressBar
                  key={item.name}
                  label={item.name}
                  value={item.completed}
                  max={item.total}
                  color={color}
                  showPercentage
                />
              );
            })
          ) : (
            <Text style={styles.emptyChartText}>
              Complete some sessions to see protocol data
            </Text>
          )}
        </View>
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
  title: {
    color: Colors.text,
    fontSize: FontSize.screenTitle,
    fontWeight: '800',
    marginBottom: Spacing.lg,
  },

  // Time range tabs
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
    backgroundColor: `${Colors.indigo}15`,
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

  // Section labels
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sectionLabel,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md - 2,
  },

  // 1RM trend cards
  rmTrends: {
    gap: Spacing.sm,
  },
  rmTrendCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.cardInner,
    padding: Spacing.lg,
  },
  rmTrendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.md,
  },
  rmTrendName: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    fontWeight: '600',
  },
  rmTrendCurrent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
  rmTrendValue: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  rmTrendUnit: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  rmTrendDelta: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginLeft: Spacing.sm,
  },
  rmTrendDeltaUp: {
    color: Colors.green,
  },

  // Compact 1RM grid (2x2)
  rmCompactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  rmCompactCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.cardInner,
    padding: Spacing.md + 2,
    width: '48.5%',
  },
  rmCompactName: {
    color: Colors.textDim,
    fontSize: FontSize.sectionLabel,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  rmCompactRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
  rmCompactValue: {
    color: Colors.text,
    fontSize: FontSize.subtitle,
    fontWeight: '800',
  },
  rmCompactUnit: {
    color: Colors.textMuted,
    fontSize: FontSize.sectionLabel,
    fontWeight: '600',
  },
  rmCompactDelta: {
    color: Colors.textSecondary,
    fontSize: FontSize.sectionLabel,
    fontWeight: '700',
    marginLeft: Spacing.xs,
  },
  rmCompactDeltaUp: {
    color: Colors.green,
  },
  rmCompactMiniChart: {
    marginTop: Spacing.sm - 2,
  },

  // All exercises link
  allExercisesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm - 2,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.card,
  },
  allExercisesText: {
    color: Colors.indigo,
    fontSize: FontSize.body,
    fontWeight: '600',
  },

  // Volume chart (bar chart — volume is best shown as bars)
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: ComponentSize.chartHeight,
    gap: Spacing.xs,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.cardInner,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  chartBarCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '80%',
    borderRadius: BorderRadius.xs,
    minHeight: Spacing.xs,
  },
  chartLabel: {
    color: Colors.textDim,
    fontSize: FontSize.chartLabel,
    marginTop: Spacing.xs,
    position: 'absolute',
    bottom: -Spacing.lg,
  },

  // No data
  noDataText: {
    color: Colors.textDim,
    fontSize: FontSize.sm,
    marginTop: Spacing.sm,
  },

  // Empty chart
  emptyChart: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.cardInner,
    padding: Spacing.xxxl,
    alignItems: 'center',
  },
  emptyChartText: {
    color: Colors.textDim,
    fontSize: FontSize.sm,
    marginTop: Spacing.md,
    textAlign: 'center',
  },

  // Training Consistency
  consistencyCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.cardInner,
    padding: Spacing.lg,
  },
  consistencySummary: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
});
