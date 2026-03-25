/**
 * APEX — Exercise Detail Screen
 * Shows metric trend chart with block bands, time range chips,
 * primary metric hero card, and compact session history rows.
 * Adapts display based on exercise type (weight+reps, duration, distance+time, etc.).
 * Navigated from Progress screen lift cards.
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, ComponentSize } from '../../src/theme';
import {
  getEstimated1RM,
  get1RMHistoryWithBlocks,
  getExerciseSessionCount,
  getActiveProgram,
  getExercisePrimaryMetric,
  getMetricHistory,
  getGenericExerciseSetHistory,
  getExerciseInfo,
  calculateEpley,
  getExerciseResources,
  addExerciseResource,
  deleteExerciseResource,
} from '../../src/db';
import type { E1RMHistoryPoint, ExercisePrimaryMetric, MetricHistoryPoint, GenericSessionSetHistory, ExerciseResource } from '../../src/db';
import { getFieldsForExercise, supportsE1RM, InputField } from '../../src/types/fields';
import TrendLineChart from '../../src/components/TrendLineChart';
import { getBlockColorMap, buildBands, getBlockColorOpaque } from '../../src/utils/blockColors';
import { getDeltaExcludingDeload } from '../../src/utils/deltaCalculation';

type TimeRange = 'program' | '3m' | '1y' | 'all';

const TIME_RANGE_LABELS: [TimeRange, string][] = [
  ['program', 'Program'],
  ['3m', '3M'],
  ['1y', '1Y'],
  ['all', 'All'],
];

/** Unified chart data point — works for both e1RM history and generic metric history */
interface ChartPoint {
  date: string;
  value: number;
  blockName: string;
}

function generateYLabels(points: ChartPoint[]): string[] {
  if (points.length === 0) return [];
  const values = points.map(h => h.value);
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

/** Format seconds as m:ss */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** Format a metric value for display */
function formatMetricValue(value: number, unit?: string): string {
  if (unit === 'sec') {
    return formatTime(value);
  }
  return String(Math.round(value));
}

/** Get chart config for a given exercise type */
function getChartConfig(fields: InputField[]): {
  column: string;
  agg: 'MAX' | 'MIN';
  title: string;
} | null {
  const types = fields.map(f => f.type);

  if (types.includes('duration')) {
    return { column: 'actual_duration', agg: 'MAX', title: 'Duration Progression' };
  }
  if (types.includes('time')) {
    return { column: 'actual_time', agg: 'MIN', title: 'Time Progression' };
  }
  if (types.includes('reps') && !types.includes('weight')) {
    return { column: 'actual_reps', agg: 'MAX', title: 'Reps Progression' };
  }
  if (types.includes('distance')) {
    return { column: 'actual_distance', agg: 'MAX', title: 'Distance Progression' };
  }
  return null;
}

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [timeRange, setTimeRange] = useState<TimeRange>('program');
  const [primaryMetric, setPrimaryMetric] = useState<ExercisePrimaryMetric | null>(null);
  const [chartHistory, setChartHistory] = useState<ChartPoint[]>([]);
  const [chartTitle, setChartTitle] = useState('1RM Progression');
  const [recentSessions, setRecentSessions] = useState<GenericSessionSetHistory[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [showCount, setShowCount] = useState(5);
  const [activatedDate, setActivatedDate] = useState<string | undefined>();
  const [blocks, setBlocks] = useState<{ name: string }[]>([]);
  const [exerciseName, setExerciseName] = useState<string>('');
  const [exerciseFields, setExerciseFields] = useState<InputField[]>([]);
  const [isE1RMExercise, setIsE1RMExercise] = useState(true);
  const [resources, setResources] = useState<ExerciseResource[]>([]);
  const [showAddResource, setShowAddResource] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const loadData = useCallback(async () => {
    if (!id) return;

    // Load exercise info and program info in parallel
    const [exerciseInfoMap, program] = await Promise.all([
      getExerciseInfo([id]),
      getActiveProgram(),
    ]);

    const info = exerciseInfoMap[id];
    const name = info?.name ?? id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    setExerciseName(name);

    const fields = getFieldsForExercise(info?.inputFields ?? null);
    setExerciseFields(fields);
    const isE1RM = supportsE1RM(fields);
    setIsE1RMExercise(isE1RM);

    const progId = program?.id;
    const actDate = program?.activated_date;
    const progBlocks = program?.definition?.program?.blocks ?? [];
    setActivatedDate(actDate);
    setBlocks(progBlocks);

    const startDate = getStartDate(timeRange, actDate);
    const filterProgramId = timeRange === 'program' ? progId : undefined;

    // Load primary metric
    const metric = await getExercisePrimaryMetric(id, info?.inputFields ?? null);
    setPrimaryMetric(metric);

    // Load chart history based on type
    if (isE1RM) {
      setChartTitle('1RM Progression');
      const hist = await get1RMHistoryWithBlocks(id, { startDate, programId: filterProgramId });
      setChartHistory(hist.map(h => ({ date: h.date, value: h.e1rm, blockName: h.blockName })));
    } else {
      const config = getChartConfig(fields);
      if (config) {
        setChartTitle(config.title);
        const hist = await getMetricHistory(id, config.column, config.agg, {
          startDate,
          programId: filterProgramId,
        });
        setChartHistory(hist);
      } else {
        setChartTitle('Progression');
        setChartHistory([]);
      }
    }

    // Load session history, count, and resources
    const [sets, count, exerciseResources] = await Promise.all([
      getGenericExerciseSetHistory(id, { startDate, programId: filterProgramId, limit: showCount }),
      getExerciseSessionCount(id, { startDate, programId: filterProgramId }),
      getExerciseResources(id),
    ]);
    setRecentSessions(sets);
    setTotalSessions(count);
    setResources(exerciseResources);
  }, [id, timeRange, showCount]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // Delta only makes sense for e1RM exercises with the e1rm history format
  const delta = isE1RMExercise
    ? getDeltaExcludingDeload(chartHistory.map(p => ({ date: p.date, e1rm: p.value, blockName: p.blockName })))
    : null;

  const colorMap = useMemo(
    () => getBlockColorMap(blocks as { name: string; weeks: number[]; main_lift_scheme: any }[]),
    [blocks]
  );
  const bands = useMemo(() => buildBands(chartHistory.map(p => ({ date: p.date, e1rm: p.value, blockName: p.blockName })), colorMap), [chartHistory, colorMap]);
  const yLabels = useMemo(() => generateYLabels(chartHistory), [chartHistory]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[d.getDay()]} \u00B7 ${months[d.getMonth()]} ${d.getDate()}`;
  };

  const formatCompactDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const formatSessionSummary = (session: GenericSessionSetHistory) => {
    if (session.sets.length === 0) return '';
    const first = session.sets[0];
    const types = exerciseFields.map(f => f.type);

    if (types.includes('weight') && types.includes('reps')) {
      return `${session.sets.length} \u00D7 ${first.reps} @ ${first.weight} lb`;
    }
    if (types.includes('duration')) {
      return `${formatTime(first.duration ?? 0)} \u00D7 ${session.sets.length} sets`;
    }
    if (types.includes('distance') && types.includes('time')) {
      return `${first.distance}m in ${formatTime(first.time ?? 0)} \u00D7 ${session.sets.length} sets`;
    }
    if (types.includes('reps') && !types.includes('weight')) {
      return `${first.reps} reps \u00D7 ${session.sets.length} sets`;
    }
    if (types.includes('distance')) {
      return `${first.distance}m \u00D7 ${session.sets.length} sets`;
    }
    // Fallback
    return `${session.sets.length} sets`;
  };

  /** Get per-session metric value for session history rows */
  const getSessionMetricValue = (session: GenericSessionSetHistory): string | null => {
    const types = exerciseFields.map(f => f.type);

    if (types.includes('weight') && types.includes('reps')) {
      // Calculate best e1RM for the session
      let bestE1rm = 0;
      for (const set of session.sets) {
        if (set.weight && set.reps) {
          const e1rm = calculateEpley(set.weight, set.reps);
          if (e1rm > bestE1rm) bestE1rm = e1rm;
        }
      }
      return bestE1rm > 0 ? String(Math.round(bestE1rm)) : null;
    }
    if (types.includes('duration')) {
      const best = Math.max(...session.sets.map(s => s.duration ?? 0));
      return best > 0 ? formatTime(best) : null;
    }
    if (types.includes('time')) {
      const best = Math.min(...session.sets.filter(s => s.time != null && s.time > 0).map(s => s.time!));
      return isFinite(best) ? formatTime(best) : null;
    }
    if (types.includes('reps') && !types.includes('weight')) {
      const best = Math.max(...session.sets.map(s => s.reps ?? 0));
      return best > 0 ? String(best) : null;
    }
    return null;
  };

  const isDeload = (blockName: string) => /deload/i.test(blockName);

  // URL-based icon detection for resource links
  const getResourceIconName = (url: string): keyof typeof Ionicons.glyphMap => {
    if (/youtube\.com|youtu\.be/i.test(url)) return 'logo-youtube';
    if (/instagram\.com/i.test(url)) return 'logo-instagram';
    if (/tiktok\.com/i.test(url)) return 'logo-tiktok';
    if (/reddit\.com/i.test(url)) return 'logo-reddit';
    return 'link-outline';
  };
  const getResourceIconColor = (url: string): string => {
    if (/youtube\.com|youtu\.be/i.test(url)) return '#FF4444';
    if (/instagram\.com/i.test(url)) return '#E1306C';
    if (/tiktok\.com/i.test(url)) return '#F5F5F7';
    return Colors.indigo;
  };
  const getResourceIconBg = (url: string): string => {
    if (/youtube\.com|youtu\.be/i.test(url)) return 'rgba(255, 68, 68, 0.12)';
    if (/instagram\.com/i.test(url)) return 'rgba(225, 48, 108, 0.12)';
    if (/tiktok\.com/i.test(url)) return 'rgba(245, 245, 247, 0.08)';
    return Colors.indigoMuted;
  };

  // Format the hero value for display
  const heroDisplayValue = primaryMetric
    ? formatMetricValue(primaryMetric.value, primaryMetric.unit)
    : '\u2014';

  // For e1RM we show "lbs", for time-based we don't show unit (it's in the formatted value)
  const showHeroUnit = primaryMetric && primaryMetric.unit !== 'sec';

  const scrollRef = useRef<ScrollView>(null);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Colors.textDim} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{exerciseName}</Text>
        </View>

        {/* Primary Metric Hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>{primaryMetric?.label ?? 'No Data'}</Text>
          <View style={styles.heroRow}>
            <Text style={styles.heroValue}>{heroDisplayValue}</Text>
            {showHeroUnit && <Text style={styles.heroUnit}>{primaryMetric!.unit}</Text>}
            {delta != null && delta !== 0 && (
              <Text style={[styles.heroDelta, delta > 0 && styles.heroDeltaUp]}>
                {delta > 0 ? '\u2191 +' : '\u2193 '}{delta} lbs
              </Text>
            )}
          </View>
          {primaryMetric?.detail && (
            <Text style={styles.heroDetail}>{primaryMetric.detail}</Text>
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

        {/* Metric Trend Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>{chartTitle}</Text>
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
                    backgroundColor: getBlockColorOpaque(band.color),
                  }]} />
                  <Text style={styles.bandLabelText} numberOfLines={1}>
                    {band.label.slice(0, 3)}
                  </Text>
                </View>
              ))}
            </View>
          )}
          {chartHistory.length >= 2 ? (
            <TrendLineChart
              lines={[{
                data: chartHistory.map(h => ({ value: h.value })),
                color: Colors.indigo,
              }]}
              height={140}
              viewBoxHeight={100}
              areaOpacity={0.1}
              xLabels={(() => {
                if (chartHistory.length <= 3) return chartHistory.map(h => formatShortDate(h.date));
                const mid = Math.floor(chartHistory.length / 2);
                return [
                  formatShortDate(chartHistory[0].date),
                  formatShortDate(chartHistory[mid].date),
                  formatShortDate(chartHistory[chartHistory.length - 1].date),
                ];
              })()}
              yLabels={yLabels}
              bands={bands}
              showBandLabels={false}
            />
          ) : (
            <View style={styles.chartEmpty}>
              <Text style={styles.chartEmptyText}>
                {chartHistory.length === 0
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
            {recentSessions.map((session, si) => {
              const metricValue = getSessionMetricValue(session);
              return (
                <TouchableOpacity
                  key={si}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/session/${session.sessionId}`)}
                >
                  {si > 0 && <View style={styles.sessionDivider} />}
                  <View style={styles.sessionRow}>
                    <View style={styles.sessionLeft}>
                      <Text style={styles.sessionDate}>
                        {formatCompactDate(session.date)}
                        {isDeload(session.blockName) && (
                          <Text style={styles.deloadTag}> (deload)</Text>
                        )}
                      </Text>
                      <Text style={styles.sessionSummary}>
                        {formatSessionSummary(session)}
                        {session.avgRpe != null && (
                          <Text style={styles.sessionRpe}> · RPE {session.avgRpe.toFixed(1)}</Text>
                        )}
                      </Text>
                    </View>
                    {metricValue && (
                      <View style={styles.sessionMetricRight}>
                        <Text style={styles.sessionE1rm}>{metricValue}</Text>
                        <Text style={styles.sessionE1rmLabel}> e1RM</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
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

        {/* Resources Section */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.xxl }]}>Resources</Text>
        <View style={styles.sessionsCard}>
          {/* Resource links */}
          {resources.map((resource, ri) => (
            <TouchableOpacity
              key={resource.id}
              style={styles.resourceRow}
              activeOpacity={0.7}
              onPress={() => Linking.openURL(resource.url)}
            >
              <View style={[styles.resourceIconBox, { backgroundColor: getResourceIconBg(resource.url) }]}>
                <Ionicons name={getResourceIconName(resource.url)} size={14} color={getResourceIconColor(resource.url)} />
              </View>
              <Text style={styles.resourceLabel} numberOfLines={1}>{resource.label}</Text>
              <View style={styles.resourceActions}>
                <Ionicons name="open-outline" size={16} color={Colors.textSecondary} />
                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => {
                    deleteExerciseResource(resource.id).then(() => {
                      getExerciseResources(id!).then(setResources);
                    });
                  }}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
          {/* Empty state */}
          {resources.length === 0 && !showAddResource && (
            <View style={styles.resourceEmptyState}>
              <Text style={styles.addResourceEmptyText}>No resources yet</Text>
            </View>
          )}
          {/* Add resource row or form */}
          {!showAddResource ? (
            <TouchableOpacity
              style={[styles.addResourceRow, resources.length > 0 && { borderTopWidth: 1, borderTopColor: Colors.border }]}
              onPress={() => { setShowAddResource(true); setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100); }}
            >
              <View style={styles.addResourceIcon}>
                <Ionicons name="add" size={16} color={Colors.indigo} />
              </View>
              <Text style={styles.addResourceText}>Add resource</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.addResourceForm}>
              <Text style={styles.addResourceFormTitle}>Add Resource</Text>
              <TextInput
                style={styles.resourceInput}
                placeholder="Label (e.g. Form Tutorial)"
                onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)}
                placeholderTextColor={Colors.textDim}
                value={newLabel}
                onChangeText={setNewLabel}
                autoFocus
              />
              <TextInput
                style={styles.resourceInput}
                placeholder="URL (e.g. https://youtube.com/...)"
                onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)}
                placeholderTextColor={Colors.textDim}
                value={newUrl}
                onChangeText={setNewUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
              <View style={styles.addResourceButtons}>
                <TouchableOpacity
                  style={styles.resourceCancelButton}
                  onPress={() => { setShowAddResource(false); setNewLabel(''); setNewUrl(''); }}
                >
                  <Text style={styles.resourceCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.resourceSaveButton, (!newLabel.trim() || !newUrl.trim()) && styles.resourceSaveButtonDisabled]}
                  onPress={() => {
                    if (!newLabel.trim() || !newUrl.trim()) return;
                    addExerciseResource(id!, newLabel.trim(), newUrl.trim()).then(() => {
                      getExerciseResources(id!).then(setResources);
                      setShowAddResource(false);
                      setNewLabel('');
                      setNewUrl('');
                    });
                  }}
                >
                  <Text style={styles.resourceSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    width: ComponentSize.bandDotSize,
    height: ComponentSize.bandDotSize,
    borderRadius: ComponentSize.bandDotSize / 2,
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
    overflow: 'hidden',
  },
  sessionDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
  },
  sessionLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  sessionDate: {
    color: Colors.text,
    fontSize: FontSize.body,
    fontWeight: '500',
  },
  deloadTag: {
    color: Colors.green,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  sessionSummary: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 3,
  },
  sessionRpe: {
    color: Colors.indigo,
  },
  sessionMetricRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexShrink: 0,
  },
  sessionE1rm: {
    color: Colors.indigo,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  sessionE1rmLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '400',
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
    height: ComponentSize.chartHeightSmall,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartEmptyText: {
    color: Colors.textDim,
    fontSize: FontSize.sm,
  },

  // Resources
  resourceIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resourceEmptyState: {
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  resourceLabel: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  resourceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginLeft: Spacing.sm,
  },
  addResourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 13,
    paddingHorizontal: Spacing.lg,
  },
  addResourceIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.indigoMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addResourceText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  addResourceEmptyText: {
    color: Colors.textDim,
    fontSize: FontSize.sm,
  },
  addResourceForm: {
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  addResourceFormTitle: {
    color: Colors.text,
    fontSize: FontSize.sm - 1,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  resourceInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.cardInner,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: Colors.text,
    fontSize: FontSize.sm,
  },
  addResourceButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 2,
  },
  resourceCancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.cardInner,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  resourceCancelText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  resourceSaveButton: {
    flex: 1,
    backgroundColor: Colors.indigo,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.cardInner,
    alignItems: 'center',
  },
  resourceSaveButtonDisabled: {
    opacity: 0.4,
  },
  resourceSaveText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
});
