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
import { getActiveProgram, getAllPrograms, getEstimated1RM, get1RMHistoryWithBlocks, getWeeklyVolume, getPlannedWeeklyVolume, getTrainingConsistency, getAllTimeConsistency, getProtocolConsistency, getProgramBoundaries, getExerciseInfo, getExercisePrimaryMetric, getMetricHistory } from '../../src/db';
import { getTrainingDays, getCurrentWeek } from '../../src/utils/program';
import { getBlockColorMap, buildBands } from '../../src/utils/blockColors';
import type { E1RMHistoryPoint, ProgramBoundary, MetricHistoryPoint, ExercisePrimaryMetric } from '../../src/db';
import { ProgressBar } from '../../src/components/ProgressBar';
import TrendLineChart, { SparkLine } from '../../src/components/TrendLineChart';
import type { Estimated1RM } from '../../src/types';
import type { WeekConsistency, ProgramConsistency, ProtocolItem, PlannedWeekVolume } from '../../src/db';
import { getDeltaExcludingDeload } from '../../src/utils/deltaCalculation';
import { getFieldsForExercise, supportsE1RM } from '../../src/types/fields';

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

/** Determine the DB column and aggregation for a non-e1RM exercise's history */
function getMetricColumnForFields(fields: { type: string }[]): { column: string | null; agg: 'MAX' | 'MIN' } {
  const types = fields.map(f => f.type);
  if (types.includes('duration')) return { column: 'actual_duration', agg: 'MAX' };
  if (types.includes('time')) return { column: 'actual_time', agg: 'MIN' };
  if (types.includes('reps') && !types.includes('weight')) return { column: 'actual_reps', agg: 'MAX' };
  if (types.includes('distance')) return { column: 'actual_distance', agg: 'MAX' };
  return { column: null, agg: 'MAX' };
}

/** Format a metric value for display */
function formatMetricValue(value: number, unit?: string): string {
  if (unit === 'sec' || unit === 'm:ss') {
    const mins = Math.floor(value / 60);
    const secs = value % 60;
    if (mins > 0) return `${mins}:${secs.toString().padStart(2, '0')}`;
    return `${value}`;
  }
  return `${value}`;
}

/** Get display unit for a metric */
function getMetricDisplayUnit(unit?: string): string {
  if (unit === 'lbs' || unit === 'kg') return unit;
  if (unit === 'reps') return 'reps';
  if (unit === 'sec' || unit === 'm:ss') return 'sec';
  if (unit === 'm') return 'm';
  return unit ?? '';
}

type TimeRange = 'program' | 'all';

interface ProgramVolumeData {
  programName: string;
  volumeData: { week: number; totalSets: number }[];
  plannedVolume: PlannedWeekVolume[];
  blockColorMap: Record<string, string>;
}

interface LiftData {
  e1rm: Estimated1RM | null;
  history: E1RMHistoryPoint[];
  /** For non-e1RM exercises */
  metric: ExercisePrimaryMetric | null;
  metricHistory: MetricHistoryPoint[];
  isE1RM: boolean;
}

export default function ProgressScreen() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<TimeRange>('program');
  const [liftData, setLiftData] = useState<Map<string, LiftData>>(new Map());
  const [volumeData, setVolumeData] = useState<{ week: number; totalSets: number }[]>([]);
  const [consistencyData, setConsistencyData] = useState<WeekConsistency[]>([]);
  const [allTimeConsistency, setAllTimeConsistency] = useState<ProgramConsistency[]>([]);
  const [currentWeek, setCurrentWeek] = useState<number>(0);
  const [plannedVolume, setPlannedVolume] = useState<PlannedWeekVolume[]>([]);
  const [blockColorMap, setBlockColorMap] = useState<Record<string, string>>({});
  const [protocolData, setProtocolData] = useState<ProtocolItem[]>([]);
  const [programBoundaries, setProgramBoundaries] = useState<ProgramBoundary[]>([]);
  const [allTimeProgramVolumes, setAllTimeProgramVolumes] = useState<ProgramVolumeData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllPrograms, setShowAllPrograms] = useState(false);

  const loadData = useCallback(async () => {
    setShowAllPrograms(false);
    const program = await getActiveProgram();

    // Load exercise info to determine field types
    const exerciseIds = ALL_LIFTS.map(l => l.id);
    const exerciseInfoMap = await getExerciseInfo(exerciseIds);

    // Load metrics and history for all lifts (type-aware)
    const entries = await Promise.all(
      ALL_LIFTS.map(async (lift) => {
        const info = exerciseInfoMap[lift.id];
        const fields = getFieldsForExercise(info?.inputFields ?? null);
        const isE1RM = supportsE1RM(fields);

        if (isE1RM) {
          const [e1rm, history] = await Promise.all([
            getEstimated1RM(lift.id),
            timeRange === 'all'
              ? get1RMHistoryWithBlocks(lift.id, { limit: 50 })
              : get1RMHistoryWithBlocks(lift.id, { limit: 12 }),
          ]);
          return [lift.id, { e1rm, history, metric: null, metricHistory: [], isE1RM: true }] as [string, LiftData];
        } else {
          // Non-e1RM: use type-aware metric queries
          const metric = await getExercisePrimaryMetric(lift.id, info?.inputFields ?? null);
          const { column, agg } = getMetricColumnForFields(fields);
          const metricHistory = column
            ? await getMetricHistory(lift.id, column, agg, {
                limit: timeRange === 'all' ? 50 : 12,
              })
            : [];
          return [lift.id, { e1rm: null, history: [], metric, metricHistory, isE1RM: false }] as [string, LiftData];
        }
      })
    );
    setLiftData(new Map(entries));

    // Load program boundaries for All Time mode
    if (timeRange === 'all') {
      const boundaries = await getProgramBoundaries();
      setProgramBoundaries(boundaries);
    }

    // Load volume and consistency
    if (!program) {
      setVolumeData([]);
      setPlannedVolume([]);
      setBlockColorMap({});
      setConsistencyData([]);
      setAllTimeConsistency([]);
      setAllTimeProgramVolumes([]);
      setCurrentWeek(0);
      setProgramBoundaries([]);
    }
    if (program) {
      const trainingDaysPerWeek = getTrainingDays(program.definition.program.weekly_template).length;

      if (timeRange === 'program') {
        const vol = await getWeeklyVolume(program.id);
        setVolumeData(vol);

        const planned = getPlannedWeeklyVolume(program.definition, program.duration_weeks);
        setPlannedVolume(planned);

        const colorMap = getBlockColorMap(program.definition.program.blocks);
        setBlockColorMap(colorMap);

        const consistency = await getTrainingConsistency(program.id, trainingDaysPerWeek);
        setConsistencyData(consistency);
        if (program.activated_date) {
          setCurrentWeek(getCurrentWeek(program.activated_date));
        }
      }

      if (timeRange === 'all') {
        // All Time volume: per-program breakdown
        const allPrograms = await getAllPrograms();
        const activeCompleted = allPrograms.filter(p => p.status === 'active' || p.status === 'completed');
        const programVolumes: ProgramVolumeData[] = [];

        for (const prog of activeCompleted) {
          const definition = JSON.parse(prog.definition_json);
          const vol = await getWeeklyVolume(prog.id);
          const planned = getPlannedWeeklyVolume(definition, prog.duration_weeks);
          const colors = getBlockColorMap(definition.program.blocks);
          programVolumes.push({
            programName: prog.name,
            volumeData: vol,
            plannedVolume: planned,
            blockColorMap: colors,
          });
        }
        setAllTimeProgramVolumes(programVolumes);

        // All Time consistency
        const allConsistency = await getAllTimeConsistency(trainingDaysPerWeek);
        setAllTimeConsistency(allConsistency);
      }
    }

    // Protocol consistency — null for all time, programId for program
    const protocols = await getProtocolConsistency(timeRange === 'program' && program ? program.id : null);
    setProtocolData(protocols);
  }, [timeRange]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getDelta = (history: E1RMHistoryPoint[]): number | null => {
    return getDeltaExcludingDeload(history);
  };

  const maxVolume = Math.max(...plannedVolume.map(v => v.plannedSets), ...volumeData.map(v => v.totalSets), 1);

  const mergedVolume = plannedVolume.map(pv => {
    const actual = volumeData.find(v => v.week === pv.week);
    return {
      week: pv.week,
      actual: actual?.totalSets ?? 0,
      planned: pv.plannedSets,
      blockName: pv.blockName,
    };
  });

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

        {/* Lift Metrics — Top lifts with full charts */}
        <Text style={styles.sectionLabel}>Estimated 1RM</Text>
        <View style={styles.rmTrends}>
          {TOP_LIFTS.map((lift) => {
            const data = liftData.get(lift.id);
            const isE1RM = data?.isE1RM ?? true;

            if (isE1RM) {
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
                      bands={buildBands(history, blockColorMap)}
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
            } else {
              const metric = data?.metric;
              const metricHistory = data?.metricHistory ?? [];

              return (
                <TouchableOpacity
                  key={lift.id}
                  style={styles.rmTrendCard}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/exercise/${lift.id}`)}
                >
                  <View style={styles.rmTrendHeader}>
                    <View>
                      <Text style={styles.rmTrendName}>{lift.name}</Text>
                      {metric && <Text style={styles.rmTrendSubtitle}>{metric.label}</Text>}
                    </View>
                    <View style={styles.rmTrendCurrent}>
                      <Text style={styles.rmTrendValue}>
                        {metric ? formatMetricValue(metric.value, metric.unit) : '\u2014'}
                      </Text>
                      {metric && <Text style={styles.rmTrendUnit}>{getMetricDisplayUnit(metric.unit)}</Text>}
                    </View>
                  </View>
                  {metricHistory.length >= 2 ? (
                    <TrendLineChart
                      lines={[{
                        data: metricHistory.map(h => ({ value: h.value })),
                        color: Colors.indigo,
                      }]}
                      height={60}
                      viewBoxHeight={60}
                      areaOpacity={0.1}
                      bands={buildBands(metricHistory, blockColorMap)}
                      xLabels={metricHistory.length > 0
                        ? metricHistory.map((_, i) => i === metricHistory.length - 1 ? `W${metricHistory.length}` : (i === 0 ? 'W1' : ''))
                          .filter(l => l !== '')
                        : []
                      }
                    />
                  ) : (
                    <Text style={styles.noDataText}>Not enough data for chart</Text>
                  )}
                </TouchableOpacity>
              );
            }
          })}

          {/* Compact grid for remaining lifts */}
          <View style={styles.rmCompactGrid}>
            {COMPACT_LIFTS.map((lift) => {
              const data = liftData.get(lift.id);
              const isE1RM = data?.isE1RM ?? true;

              if (isE1RM) {
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
              } else {
                const metric = data?.metric;
                const metricHistory = data?.metricHistory ?? [];

                return (
                  <TouchableOpacity
                    key={lift.id}
                    style={styles.rmCompactCard}
                    activeOpacity={0.7}
                    onPress={() => router.push(`/exercise/${lift.id}`)}
                  >
                    <Text style={styles.rmCompactName}>{lift.name}</Text>
                    {metric && <Text style={styles.rmCompactSubtitle}>{metric.label}</Text>}
                    <View style={styles.rmCompactRow}>
                      <Text style={styles.rmCompactValue}>
                        {metric ? formatMetricValue(metric.value, metric.unit) : '\u2014'}
                      </Text>
                      {metric && <Text style={styles.rmCompactUnit}>{getMetricDisplayUnit(metric.unit)}</Text>}
                    </View>
                    {metricHistory.length >= 2 && (
                      <View style={styles.rmCompactMiniChart}>
                        <SparkLine
                          data={metricHistory.map(h => h.value)}
                          color={Colors.indigo}
                          height={24}
                          opacity={0.25}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }
            })}
          </View>

          {/* All Exercises link */}
          <TouchableOpacity
            style={styles.allExercisesLink}
            activeOpacity={0.7}
            onPress={() => router.push('/exercises' as any)}
          >
            <Text style={styles.allExercisesText}>All Exercises</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.indigo} />
          </TouchableOpacity>
        </View>

        {/* Volume Trend */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.xxl + Spacing.xs }]}>Weekly Volume</Text>
        {timeRange === 'all' ? (
          allTimeProgramVolumes.length > 0 ? (
            <>
            {(() => {
              const MAX_VISIBLE_PROGRAMS = 2;
              const visiblePrograms = showAllPrograms
                ? allTimeProgramVolumes
                : allTimeProgramVolumes.slice(-MAX_VISIBLE_PROGRAMS);
              const hiddenCount = allTimeProgramVolumes.length - MAX_VISIBLE_PROGRAMS;
              return (
                <>
                  {visiblePrograms.map((prog) => {
                    const progMerged = prog.plannedVolume.map(pv => {
                      const actual = prog.volumeData.find(v => v.week === pv.week);
                      return {
                        week: pv.week,
                        actual: actual?.totalSets ?? 0,
                        planned: pv.plannedSets,
                        blockName: pv.blockName,
                      };
                    });
                    const progMax = Math.max(...prog.plannedVolume.map(v => v.plannedSets), ...prog.volumeData.map(v => v.totalSets), 1);

                    return (
                      <View key={prog.programName} style={{ marginBottom: Spacing.lg }}>
                        <Text style={styles.programVolumeHeader}>{prog.programName}</Text>
                        {progMerged.length > 0 ? (
                          <View style={styles.volumeCard}>
                            <View style={styles.volumeLegend}>
                              <View style={styles.volumeLegendItem}>
                                <View style={[styles.legendDot, { backgroundColor: Colors.indigo }]} />
                                <Text style={styles.legendText}>Actual sets</Text>
                              </View>
                              <View style={styles.volumeLegendItem}>
                                <View style={[styles.legendDot, { backgroundColor: Colors.surface }]} />
                                <Text style={styles.legendText}>Planned sets</Text>
                              </View>
                            </View>

                            {progMerged.map((entry, i) => {
                              const plannedPct = progMax > 0 ? (entry.planned / progMax) * 100 : 0;
                              const actualPct = progMax > 0 ? (entry.actual / progMax) * 100 : 0;

                              return (
                                <View key={i} style={styles.volumeRow}>
                                  <Text style={styles.volumeWeekLabel}>W{entry.week}</Text>
                                  <View style={styles.volumeDualBar}>
                                    <View style={[styles.volumePlannedBar, { width: `${plannedPct}%` }]} />
                                    <View style={[styles.volumeActualBar, {
                                      width: `${actualPct}%`,
                                      backgroundColor: prog.blockColorMap[entry.blockName] ?? Colors.indigo,
                                    }]} />
                                  </View>
                                  <View style={styles.volumeNums}>
                                    <Text style={styles.volumeActualNum}>{entry.actual}</Text>
                                    <Text style={styles.volumePlannedNum}>/ {entry.planned}</Text>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        ) : (
                          <View style={styles.emptyChart}>
                            <Text style={styles.emptyChartText}>No volume data</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                  {!showAllPrograms && hiddenCount > 0 && (
                    <TouchableOpacity
                      onPress={() => setShowAllPrograms(true)}
                      style={styles.showOlderLink}
                    >
                      <Text style={styles.showOlderText}>
                        Show {hiddenCount} older program{hiddenCount > 1 ? 's' : ''} →
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              );
            })()}
            </>
          ) : (
            <View style={styles.emptyChart}>
              <Ionicons name="bar-chart-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyChartText}>
                No program data available
              </Text>
            </View>
          )
        ) : mergedVolume.length > 0 ? (
          <View style={styles.volumeCard}>
            {/* Legend */}
            <View style={styles.volumeLegend}>
              <View style={styles.volumeLegendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.indigo }]} />
                <Text style={styles.legendText}>Actual sets</Text>
              </View>
              <View style={styles.volumeLegendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.surface }]} />
                <Text style={styles.legendText}>Planned sets</Text>
              </View>
            </View>

            {mergedVolume.map((entry, i) => {
              const plannedPct = maxVolume > 0 ? (entry.planned / maxVolume) * 100 : 0;
              const actualPct = maxVolume > 0 ? (entry.actual / maxVolume) * 100 : 0;
              const isCurrent = entry.week === currentWeek;

              return (
                <View key={i} style={styles.volumeRow}>
                  <Text style={[styles.volumeWeekLabel, isCurrent && styles.volumeWeekLabelCurrent]}>
                    W{entry.week}
                  </Text>
                  <View style={styles.volumeDualBar}>
                    <View style={[styles.volumePlannedBar, { width: `${plannedPct}%` }]} />
                    <View style={[styles.volumeActualBar, {
                      width: `${actualPct}%`,
                      backgroundColor: blockColorMap[entry.blockName] ?? Colors.indigo,
                    }]} />
                  </View>
                  <View style={styles.volumeNums}>
                    <Text style={styles.volumeActualNum}>{entry.actual}</Text>
                    <Text style={styles.volumePlannedNum}>/ {entry.planned}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : volumeData.length > 0 ? (
          <View style={styles.volumeCard}>
            {volumeData.map((v, i) => {
              const pct = maxVolume > 0 ? (v.totalSets / maxVolume) * 100 : 0;
              return (
                <View key={i} style={styles.volumeRow}>
                  <Text style={styles.volumeWeekLabel}>W{v.week}</Text>
                  <View style={styles.volumeDualBar}>
                    <View style={[styles.volumeActualBar, {
                      width: `${pct}%`,
                      backgroundColor: Colors.indigo,
                    }]} />
                  </View>
                  <View style={styles.volumeNums}>
                    <Text style={styles.volumeActualNum}>{v.totalSets}</Text>
                  </View>
                </View>
              );
            })}
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
                  let color: string = Colors.textDim;
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
              let color: string = Colors.textDim;
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
  rmTrendSubtitle: {
    color: Colors.textDim,
    fontSize: FontSize.sectionLabel,
    fontWeight: '600',
    marginTop: 2,
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
  rmCompactSubtitle: {
    color: Colors.textDim,
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginBottom: 2,
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

  // Volume section (horizontal bars)
  volumeCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.cardInner,
    padding: Spacing.xl,
  },
  volumeLegend: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  volumeLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: ComponentSize.legendDotSize,
    height: ComponentSize.legendDotSize,
    borderRadius: BorderRadius.xs - 1,
  },
  legendText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  volumeWeekLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
    width: ComponentSize.volumeWeekLabelWidth,
    textAlign: 'right',
  },
  volumeWeekLabelCurrent: {
    color: Colors.text,
    fontWeight: '700',
  },
  volumeDualBar: {
    flex: 1,
    height: ComponentSize.volumeBarHeight,
    position: 'relative',
    justifyContent: 'center',
  },
  volumePlannedBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xs,
  },
  volumeActualBar: {
    height: ComponentSize.volumeBarInnerHeight,
    borderRadius: BorderRadius.xs - 1,
    marginVertical: Spacing.xs,
  },
  volumeNums: {
    flexDirection: 'row',
    gap: Spacing.xs / 2,
    width: ComponentSize.volumeNumsWidth,
    justifyContent: 'flex-end',
  },
  volumeActualNum: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  volumePlannedNum: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
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
  programVolumeHeader: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  showOlderLink: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  showOlderText: {
    color: Colors.indigo,
    fontSize: FontSize.body,
    fontWeight: '600',
  },
});
