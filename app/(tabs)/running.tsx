/**
 * APEX — Running Screen
 * Pain tracking, run logging, trends, recent run history.
 * Tabs: Log | Trends
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Switch,
  StyleSheet, RefreshControl, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, ComponentSize } from '../../src/theme';
import { getRunLogs, logRun, getPainTrend, getRunStats, deleteRun, updateRun } from '../../src/db';
import { getLocalDateString } from '../../src/utils/date';
import TrendLineChart from '../../src/components/TrendLineChart';
import type { RunLog } from '../../src/types';

const PAIN_COLORS = [
  '#22c55e', '#4ade80', '#86efac', '#fde047', '#facc15',
  '#f59e0b', '#f97316', '#ef4444', '#dc2626', '#b91c1c', '#7f1d1d',
];
const PAIN_DESCRIPTIONS = [
  'None', 'Minimal', 'Very mild', 'Mild', 'Noticeable',
  'Moderate', 'Moderate-high', 'High', 'Very high', 'Severe', 'Maximum',
];

type Tab = 'log' | 'trends';

interface RunStats {
  totalRuns: number;
  totalMiles: number;
  avgPain: number;
  avgPainPrev: number;
  avgPace: number | null;
  avgPacePrev: number | null;
}

interface TrendPoint {
  date: string;
  painLevel: number;
  painLevel24h: number | null;
  durationMin: number;
  distance: number | null;
}

export default function RunningScreen() {
  const [tab, setTab] = useState<Tab>('log');
  const [runLogs, setRunLogs] = useState<RunLog[]>([]);
  const [painTrend, setPainTrend] = useState<TrendPoint[]>([]);
  const [stats, setStats] = useState<RunStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Edit mode
  const [editingRun, setEditingRun] = useState<RunLog | null>(null);

  // New run form
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [pain, setPain] = useState(0);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [pickups, setPickups] = useState(false);

  const loadData = useCallback(async () => {
    const logs = await getRunLogs(20);
    setRunLogs(logs);
    const trend = await getPainTrend(12);
    setPainTrend(trend.reverse());
    const s = await getRunStats();
    setStats(s);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const submitRun = async () => {
    const durMin = parseFloat(duration);
    if (isNaN(durMin) || durMin <= 0) return;

    const dist = parseFloat(distance);

    if (editingRun) {
      await updateRun(editingRun.id, {
        durationMin: durMin,
        distance: !isNaN(dist) && dist > 0 ? dist : undefined,
        painLevel: pain,
        notes: notes || undefined,
        includedPickups: pickups,
      });
      setEditingRun(null);
    } else {
      await logRun({
        date: getLocalDateString(),
        durationMin: durMin,
        distance: !isNaN(dist) && dist > 0 ? dist : undefined,
        painLevel: pain,
        notes: notes || undefined,
        includedPickups: pickups,
      });
    }

    setDuration('');
    setDistance('');
    setPain(0);
    setNotes('');
    setShowNotes(false);
    setPickups(false);
    await loadData();
  };

  const cancelEdit = () => {
    setEditingRun(null);
    setDuration('');
    setDistance('');
    setPain(0);
    setNotes('');
    setShowNotes(false);
    setPickups(false);
  };

  const startEdit = (run: RunLog) => {
    setEditingRun(run);
    setDuration(String(run.duration_min));
    setDistance(run.distance != null && run.distance > 0 ? String(run.distance) : '');
    setPain(run.pain_level);
    setNotes(run.notes ?? '');
    setShowNotes(!!run.notes);
    setPickups(!!run.included_pickups);
  };

  const handleDelete = (run: RunLog) => {
    Alert.alert(
      'Delete Run',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteRun(run.id);
            await loadData();
          },
        },
      ]
    );
  };

  // Calculate pace
  const durNum = parseFloat(duration);
  const distNum = parseFloat(distance);
  const pace = durNum > 0 && distNum > 0
    ? `${Math.floor(durNum / distNum)}:${String(Math.round((durNum / distNum % 1) * 60)).padStart(2, '0')}`
    : null;

  const getPainBadgeStyle = (level: number) => {
    if (level <= 3) return { bg: `${Colors.green}18`, color: Colors.green };
    if (level <= 6) return { bg: `${Colors.amber}18`, color: Colors.amber };
    return { bg: `${Colors.red}18`, color: Colors.red };
  };

  const formatPace = (paceMin: number) => {
    const mins = Math.floor(paceMin);
    const secs = Math.round((paceMin - mins) * 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.cyan} />
        }
      >
        <Text style={styles.title}>Running</Text>

        {/* Sub-tabs */}
        <View style={styles.subTabs}>
          <TouchableOpacity
            style={[styles.subTab, tab === 'log' && styles.subTabActive]}
            onPress={() => setTab('log')}
          >
            <Text style={[styles.subTabText, tab === 'log' && styles.subTabTextActive]}>Log</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.subTab, tab === 'trends' && styles.subTabActive]}
            onPress={() => setTab('trends')}
          >
            <Text style={[styles.subTabText, tab === 'trends' && styles.subTabTextActive]}>Trends</Text>
          </TouchableOpacity>
        </View>

        {tab === 'log' ? (
          <LogTab
            duration={duration}
            setDuration={setDuration}
            distance={distance}
            setDistance={setDistance}
            pain={pain}
            setPain={setPain}
            notes={notes}
            setNotes={setNotes}
            showNotes={showNotes}
            setShowNotes={setShowNotes}
            pickups={pickups}
            setPickups={setPickups}
            pace={pace}
            submitRun={submitRun}
            runLogs={runLogs}
            getPainBadgeStyle={getPainBadgeStyle}
            formatPace={formatPace}
            editingRun={editingRun}
            cancelEdit={cancelEdit}
            startEdit={startEdit}
            handleDelete={handleDelete}
          />
        ) : (
          <TrendsTab
            stats={stats}
            trend={painTrend}
            formatPace={formatPace}
            getPainBadgeStyle={getPainBadgeStyle}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ---- LOG TAB ---- */

function LogTab({
  duration, setDuration, distance, setDistance,
  pain, setPain, notes, setNotes, showNotes, setShowNotes,
  pickups, setPickups, pace, submitRun, runLogs,
  getPainBadgeStyle, formatPace,
  editingRun, cancelEdit, startEdit, handleDelete,
}: {
  duration: string; setDuration: (v: string) => void;
  distance: string; setDistance: (v: string) => void;
  pain: number; setPain: (v: number) => void;
  notes: string; setNotes: (v: string) => void;
  showNotes: boolean; setShowNotes: (v: boolean) => void;
  pickups: boolean; setPickups: (v: boolean) => void;
  pace: string | null;
  submitRun: () => void;
  runLogs: RunLog[];
  getPainBadgeStyle: (l: number) => { bg: string; color: string };
  formatPace: (p: number) => string;
  editingRun: RunLog | null;
  cancelEdit: () => void;
  startEdit: (run: RunLog) => void;
  handleDelete: (run: RunLog) => void;
}) {
  const openSwipeableRef = useRef<Swipeable | null>(null);
  const swipeableRefs = useRef<Record<string, Swipeable>>({});
  return (
    <>
      {/* Log Form */}
      <View style={styles.logForm}>
        {/* Form header */}
        <View style={styles.formHeader}>
          <Text style={styles.formHeaderText}>{editingRun ? 'Edit Run' : 'Log a Run'}</Text>
          {editingRun && (
            <TouchableOpacity onPress={cancelEdit}>
              <Text style={styles.cancelEditBtn}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Duration + Distance side by side */}
        <View style={styles.formInputsRow}>
          <View style={styles.formField}>
            <Text style={styles.formLabel}>Duration</Text>
            <View style={styles.formInputWithUnit}>
              <TextInput
                style={styles.formInput}
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                placeholder="25"
                placeholderTextColor={Colors.textMuted}
              />
              <Text style={styles.formUnit}>min</Text>
            </View>
          </View>
          <View style={styles.formField}>
            <Text style={styles.formLabel}>Distance</Text>
            <View style={styles.formInputWithUnit}>
              <TextInput
                style={styles.formInput}
                value={distance}
                onChangeText={setDistance}
                keyboardType="numeric"
                placeholder="2.5"
                placeholderTextColor={Colors.textMuted}
              />
              <Text style={styles.formUnit}>mi</Text>
            </View>
          </View>
        </View>

        {/* Calculated pace */}
        {pace && (
          <View style={styles.paceDisplay}>
            <Text style={styles.paceLabel}>Pace</Text>
            <Text style={styles.paceValue}>{pace}</Text>
            <Text style={styles.paceUnit}>/ mi</Text>
          </View>
        )}

        {/* Pain selector */}
        <View>
          <Text style={styles.formLabel}>Pain Level (during / right after)</Text>
          <View style={styles.painSelector}>
            {Array.from({ length: 11 }, (_, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.painDot,
                  pain === i && {
                    backgroundColor: PAIN_COLORS[i],
                    borderColor: PAIN_COLORS[i],
                  },
                ]}
                onPress={() => setPain(i)}
              >
                <Text style={[
                  styles.painDotText,
                  pain === i && styles.painDotTextSelected,
                  pain === i && i >= 1 && i <= 5 && { color: Colors.bg },
                ]}>{i}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[
            styles.painDescription,
            pain > 0 && styles.painDescriptionActive,
          ]}>
            {PAIN_DESCRIPTIONS[pain] ?? ''}
          </Text>
        </View>

        {/* Toggle: pickups */}
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleLabel}>Included pickups</Text>
            <Text style={styles.toggleHint}>Short acceleration bursts during the run</Text>
          </View>
          <Switch
            value={pickups}
            onValueChange={setPickups}
            trackColor={{ false: Colors.border, true: Colors.cyan }}
            thumbColor={Colors.text}
          />
        </View>

        {/* Notes */}
        {!showNotes ? (
          <TouchableOpacity onPress={() => setShowNotes(true)}>
            <Text style={styles.addNoteBtn}>+ Add note</Text>
          </TouchableOpacity>
        ) : (
          <TextInput
            style={styles.noteInput}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Shin/ankle notes..."
            placeholderTextColor={Colors.textMuted}
          />
        )}

        {/* Log button */}
        <TouchableOpacity
          style={styles.logBtn}
          onPress={submitRun}
          activeOpacity={0.8}
        >
          <Text style={styles.logBtnText}>{editingRun ? 'Save Changes' : 'Log Run'}</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Runs */}
      <Text style={styles.sectionLabel}>Recent Runs</Text>
      <View style={styles.runList}>
        {runLogs.map(run => {
          const badge = getPainBadgeStyle(run.pain_level);
          const runPace = run.distance && run.distance > 0
            ? formatPace(run.duration_min / run.distance)
            : null;

          const renderRightActions = () => (
            <View style={styles.swipeActions}>
              <TouchableOpacity
                style={styles.swipeActionEdit}
                onPress={() => {
                  openSwipeableRef.current?.close();
                  startEdit(run);
                }}
              >
                <Ionicons name="pencil" size={20} color={Colors.textSecondary} />
                <Text style={styles.swipeActionEditText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.swipeActionDelete}
                onPress={() => {
                  openSwipeableRef.current?.close();
                  handleDelete(run);
                }}
              >
                <Ionicons name="trash-outline" size={20} color={Colors.red} />
                <Text style={styles.swipeActionDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          );

          return (
            <View key={run.id} style={styles.runItemWrapper}>
            <Swipeable
              renderRightActions={renderRightActions}
              overshootRight={false}
              onSwipeableWillOpen={() => {
                if (openSwipeableRef.current && openSwipeableRef.current !== swipeableRefs.current[run.id]) {
                  openSwipeableRef.current.close();
                }
                openSwipeableRef.current = swipeableRefs.current[run.id] ?? null;
              }}
              ref={(ref) => {
                if (ref) swipeableRefs.current[run.id] = ref;
              }}
            >
              <View style={styles.runItem}>
                <View style={styles.runLeft}>
                  <Text style={styles.runDate}>{formatRunDate(run.date)}</Text>
                  <View style={styles.runDetails}>
                    <Text style={styles.runDetailText}>{run.duration_min} min</Text>
                    {run.distance != null && run.distance > 0 && (
                      <>
                        <Text style={styles.runDetailSep}>{'\u00B7'}</Text>
                        <Text style={styles.runDetailText}>{run.distance} mi</Text>
                      </>
                    )}
                    {runPace && (
                      <>
                        <Text style={styles.runDetailSep}>{'\u00B7'}</Text>
                        <Text style={styles.runDetailText}>{runPace}/mi</Text>
                      </>
                    )}
                    {!!run.included_pickups && (
                      <View style={styles.runPickupBadge}>
                        <Text style={styles.runPickupText}>Pickups</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.runRight}>
                  <View style={[styles.painBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.painBadgeValue, { color: badge.color }]}>
                      {run.pain_level}
                    </Text>
                    <Text style={[styles.painBadgeLabel, { color: badge.color }]}>
                      Acute
                    </Text>
                  </View>
                  {run.pain_level_24h != null && (
                    <View style={[
                      styles.followupBadge,
                      { borderColor: getPainBadgeStyle(run.pain_level_24h).color + '40',
                        backgroundColor: getPainBadgeStyle(run.pain_level_24h).bg.replace('18', '08') },
                    ]}>
                      <Text style={[styles.painBadgeValue, { color: getPainBadgeStyle(run.pain_level_24h).color }]}>
                        {run.pain_level_24h}
                      </Text>
                      <Text style={[styles.painBadgeLabel, { color: getPainBadgeStyle(run.pain_level_24h).color }]}>
                        +24h
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Swipeable>
            </View>
          );
        })}
        {runLogs.length === 0 && (
          <Text style={styles.emptyText}>No runs logged yet</Text>
        )}
      </View>
    </>
  );
}

/* ---- TRENDS TAB ---- */

function TrendsTab({
  stats, trend, formatPace, getPainBadgeStyle,
}: {
  stats: RunStats | null;
  trend: TrendPoint[];
  formatPace: (p: number) => string;
  getPainBadgeStyle: (l: number) => { bg: string; color: string };
}) {
  if (!stats || trend.length === 0) {
    return (
      <View style={styles.emptyTrends}>
        <Text style={styles.emptyText}>Log some runs to see trends</Text>
      </View>
    );
  }

  const painDelta = stats.avgPainPrev > 0 ? stats.avgPain - stats.avgPainPrev : null;
  const paceDelta = stats.avgPace && stats.avgPacePrev ? stats.avgPace - stats.avgPacePrev : null;

  return (
    <View style={styles.trendsContainer}>
      {/* Summary stats — 2x2 grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalRuns}</Text>
          <Text style={styles.statLabel}>Total Runs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalMiles}</Text>
          <Text style={styles.statLabel}>Total Miles</Text>
        </View>
      </View>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValueSmall}>{stats.avgPain}</Text>
          <Text style={styles.statLabel}>Avg Pain</Text>
          {painDelta != null && painDelta !== 0 && (
            <Text style={[styles.statDelta, painDelta < 0 && styles.statDeltaGood]}>
              {painDelta < 0 ? '\u2193' : '\u2191'} from {stats.avgPainPrev}
            </Text>
          )}
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValueSmall}>
            {stats.avgPace ? formatPace(stats.avgPace) : '\u2014'}
          </Text>
          <Text style={styles.statLabel}>Avg Pace</Text>
          {paceDelta != null && paceDelta !== 0 && (
            <Text style={[styles.statDelta, paceDelta < 0 && styles.statDeltaGood]}>
              {paceDelta < 0 ? '\u2193' : '\u2191'} from {stats.avgPacePrev ? formatPace(stats.avgPacePrev) : ''}
            </Text>
          )}
        </View>
      </View>

      {/* Pain Trend Chart */}
      <View style={styles.trendCard}>
        <View style={styles.trendHeader}>
          <Text style={styles.trendTitle}>Pain Trend</Text>
          {trend.length > 0 && (
            <View style={styles.trendCurrent}>
              <Text style={styles.trendValue}>{trend[trend.length - 1].painLevel}</Text>
              <Text style={styles.trendUnit}>/ 10</Text>
            </View>
          )}
        </View>
        <View style={styles.painLegend}>
          <View style={styles.painLegendItem}>
            <View style={[styles.legendLine, { backgroundColor: Colors.amber }]} />
            <Text style={styles.painLegendText}>Acute (during)</Text>
          </View>
          <View style={styles.painLegendItem}>
            <View style={[styles.legendLine, styles.legendLineDashed, { borderColor: Colors.red }]} />
            <Text style={styles.painLegendText}>Delayed (+24h)</Text>
          </View>
        </View>
        <TrendLineChart
          lines={[
            {
              data: trend.map(t => ({ value: t.painLevel })),
              color: Colors.amber,
              gradientColors: [Colors.red, Colors.amber, Colors.green],
            },
            ...(trend.some(t => t.painLevel24h != null) ? [{
              data: trend.map(t => ({ value: t.painLevel24h ?? 0 })),
              color: Colors.red,
              dashed: true,
              opacity: 0.6,
            }] : []),
          ]}
          height={ComponentSize.chartHeightSmall}
          maxValue={10}
          minValue={0}
          showArea={false}
          gradientId="painGrad"
          xLabels={getXLabels(trend)}
        />
      </View>

      {/* Duration Trend */}
      <View style={styles.trendCard}>
        <View style={styles.trendHeader}>
          <Text style={styles.trendTitle}>Duration Trend</Text>
          {trend.length > 0 && (
            <View style={styles.trendCurrent}>
              <Text style={styles.trendValue}>{trend[trend.length - 1].durationMin}</Text>
              <Text style={styles.trendUnit}>min</Text>
            </View>
          )}
        </View>
        {trend.length > 0 && trend[0].durationMin < trend[trend.length - 1].durationMin && (
          <Text style={styles.trendSub}>Steadily increasing</Text>
        )}
        <TrendLineChart
          lines={[{
            data: trend.map(t => ({ value: t.durationMin })),
            color: Colors.cyan,
          }]}
          height={ComponentSize.chartHeightSmall}
          xLabels={getXLabels(trend)}
        />
      </View>

      {/* Pace Trend */}
      {trend.some(t => t.distance != null && t.distance > 0) && (
        <View style={styles.trendCard}>
          <View style={styles.trendHeader}>
            <Text style={styles.trendTitle}>Pace Trend</Text>
            {(() => {
              const last = [...trend].reverse().find(t => t.distance && t.distance > 0);
              if (!last || !last.distance) return null;
              return (
                <View style={styles.trendCurrent}>
                  <Text style={styles.trendValue}>{formatPace(last.durationMin / last.distance)}</Text>
                  <Text style={styles.trendUnit}>/ mi</Text>
                </View>
              );
            })()}
          </View>
          {stats.avgPace && stats.avgPacePrev && stats.avgPace < stats.avgPacePrev && (
            <Text style={styles.trendSub}>Getting faster — down from {formatPace(stats.avgPacePrev)}/mi</Text>
          )}
          <TrendLineChart
            lines={[{
              data: trend.map(t => ({
                value: t.distance && t.distance > 0 ? t.durationMin / t.distance : 0,
              })),
              color: Colors.cyan,
            }]}
            height={ComponentSize.chartHeightSmall}
            inverted
            xLabels={getXLabels(trend)}
          />
        </View>
      )}
    </View>
  );
}

/* ---- HELPERS ---- */

function getXLabels(trend: TrendPoint[]): string[] {
  if (trend.length <= 1) return trend.map(t => formatShortDate(t.date));
  const mid = Math.floor(trend.length / 2);
  return [
    formatShortDate(trend[0].date),
    formatShortDate(trend[mid].date),
    formatShortDate(trend[trend.length - 1].date),
  ];
}

function formatRunDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]} \u00B7 ${months[d.getMonth()]} ${d.getDate()}`;
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
  title: {
    color: Colors.text,
    fontSize: FontSize.screenTitle,
    fontWeight: '800',
    marginBottom: Spacing.lg,
  },

  // Sub-tabs
  subTabs: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  subTab: {
    flex: 1,
    paddingVertical: Spacing.md - 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  subTabActive: {
    backgroundColor: `${Colors.cyan}15`,
    borderColor: Colors.cyan,
  },
  subTabText: {
    color: Colors.textMuted,
    fontSize: FontSize.body,
    fontWeight: '600',
  },
  subTabTextActive: {
    color: Colors.text,
  },

  // Form header
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formHeaderText: {
    color: Colors.text,
    fontSize: FontSize.body,
    fontWeight: '700',
  },
  cancelEditBtn: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    fontWeight: '600',
  },

  // Log form
  logForm: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.cardPaddingCompact,
    gap: Spacing.xl - 2,
    marginBottom: Spacing.xl,
  },
  formInputsRow: {
    flexDirection: 'row',
    gap: Spacing.md - 2,
  },
  formField: {
    flex: 1,
    gap: Spacing.sm - 2,
  },
  formLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm - 2,
  },
  formInputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm - 2,
  },
  formInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  formUnit: {
    color: Colors.textMuted,
    fontSize: FontSize.body,
    fontWeight: '600',
  },

  // Pace display
  paceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.cyan}10`,
    borderWidth: 1,
    borderColor: `${Colors.cyan}30`,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md - 2,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm - 2,
  },
  paceLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sectionLabel,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paceValue: {
    color: Colors.cyan,
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  paceUnit: {
    color: `${Colors.cyan}80`,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },

  // Pain selector
  painSelector: {
    flexDirection: 'row',
    gap: 3,
  },
  painDot: {
    flex: 1,
    height: 38,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: Colors.surface,
  },
  painDotText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  painDotTextSelected: {
    color: Colors.text,
  },
  painDescription: {
    color: Colors.textMuted,
    fontSize: FontSize.sectionLabel,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  painDescriptionActive: {
    color: Colors.textSecondary,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  toggleHint: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },

  // Notes
  addNoteBtn: {
    color: Colors.textMuted,
    fontSize: FontSize.body,
  },
  noteInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    color: Colors.text,
    fontSize: FontSize.md,
    height: 72,
    textAlignVertical: 'top',
  },

  // Log button
  logBtn: {
    paddingVertical: Spacing.md + 2,
    backgroundColor: Colors.cyan,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  logBtnText: {
    color: Colors.bg,
    fontSize: FontSize.base,
    fontWeight: '700',
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

  // Run list
  runList: {
    gap: Spacing.sm - 2,
  },
  runItemWrapper: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  runItem: {
    backgroundColor: Colors.card,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  runLeft: {
    gap: 2,
    flex: 1,
  },
  runDate: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  runDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm - 2,
    flexWrap: 'wrap',
  },
  runDetailText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  runDetailSep: {
    color: Colors.border,
    fontSize: FontSize.sm,
  },
  runRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm - 2,
  },
  runPickupBadge: {
    backgroundColor: `${Colors.cyan}15`,
    paddingHorizontal: Spacing.sm - 2,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs + 1,
  },
  runPickupText: {
    color: Colors.cyan,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  painBadge: {
    alignItems: 'center',
    gap: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    minWidth: 36,
  },
  painBadgeValue: {
    fontSize: FontSize.body,
    fontWeight: '700',
  },
  painBadgeLabel: {
    fontSize: 7,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    opacity: 0.7,
  },
  followupBadge: {
    alignItems: 'center',
    gap: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    minWidth: 36,
    borderWidth: 1,
    borderStyle: 'dashed',
  },

  // Swipe actions
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  swipeActionEdit: {
    width: 72,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
  },
  swipeActionEditText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  swipeActionDelete: {
    width: 72,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
  },
  swipeActionDeleteText: {
    color: Colors.red,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },

  // Trends
  trendsContainer: {
    gap: Spacing.sm,
  },
  emptyTrends: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md + 2,
    alignItems: 'center',
  },
  statValue: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  statValueSmall: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  statDelta: {
    color: Colors.textSecondary,
    fontSize: FontSize.sectionLabel,
    fontWeight: '700',
    marginTop: 2,
  },
  statDeltaGood: {
    color: Colors.green,
  },

  // Trend cards
  trendCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.cardInner,
    padding: Spacing.xl,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.xs,
  },
  trendTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    fontWeight: '600',
  },
  trendCurrent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
  trendValue: {
    color: Colors.text,
    fontSize: FontSize.subtitle,
    fontWeight: '800',
  },
  trendUnit: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  trendSub: {
    color: Colors.textMuted,
    fontSize: FontSize.sectionLabel,
    marginBottom: Spacing.md,
  },

  // Pain legend
  painLegend: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  painLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendLine: {
    width: 16,
    height: 2,
    borderRadius: 1,
  },
  legendLineDashed: {
    height: 0,
    borderTopWidth: 2,
    borderStyle: 'dashed',
  },
  painLegendText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },

  // Empty
  emptyText: {
    color: Colors.textDim,
    fontSize: FontSize.md,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
});
