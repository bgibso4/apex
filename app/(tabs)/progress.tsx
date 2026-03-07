/**
 * APEX — Progress Screen
 * Estimated 1RMs, volume trends, time range selector.
 */

import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, ComponentSize } from '../../src/theme';
import { getActiveProgram, getEstimated1RM, getWeeklyVolume } from '../../src/db';
import type { Estimated1RM } from '../../src/types';

const MAIN_LIFTS = [
  { id: 'back_squat', name: 'Back Squat' },
  { id: 'weighted_pullup', name: 'Weighted Pull-up' },
  { id: 'bench_press', name: 'Bench Press' },
  { id: 'overhead_press', name: 'Overhead Press' },
  { id: 'zercher_squat', name: 'Zercher Squat' },
  { id: 'romanian_deadlift', name: 'RDL' },
];

type TimeRange = 'program' | 'all';

export default function ProgressScreen() {
  const [timeRange, setTimeRange] = useState<TimeRange>('program');
  const [e1rms, setE1rms] = useState<(Estimated1RM | null)[]>([]);
  const [volumeData, setVolumeData] = useState<{ week: number; totalSets: number }[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const program = await getActiveProgram();

    // Load 1RMs
    const results = await Promise.all(
      MAIN_LIFTS.map(l => getEstimated1RM(l.id))
    );
    setE1rms(results);

    // Load volume
    if (program) {
      const vol = await getWeeklyVolume(program.id);
      setVolumeData(vol);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
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

        {/* Estimated 1RMs */}
        <Text style={styles.sectionLabel}>Estimated 1RM</Text>
        <View style={styles.liftCards}>
          {MAIN_LIFTS.map((lift, i) => {
            const e1rm = e1rms[i];
            return (
              <View key={lift.id} style={styles.liftCard}>
                <View style={styles.liftHeader}>
                  <Text style={styles.liftName}>{lift.name}</Text>
                  <View style={styles.liftValueRow}>
                    <Text style={styles.liftValue}>
                      {e1rm ? `${e1rm.value}` : '\u2014'}
                    </Text>
                    {e1rm && <Text style={styles.liftUnit}>lbs</Text>}
                  </View>
                </View>
                {e1rm && (
                  <Text style={styles.liftDetail}>
                    from {e1rm.from_weight}{'\u00D7'}{e1rm.from_reps} on {e1rm.date}
                  </Text>
                )}
                {!e1rm && (
                  <Text style={styles.liftDetail}>No data yet</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Volume Trend */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.xxl + Spacing.xs }]}>Weekly Volume</Text>
        {volumeData.length > 0 ? (
          <View style={styles.chart}>
            {volumeData.map((v, i) => (
              <View key={i} style={styles.chartBar}>
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
    fontSize: FontSize.xxxl,
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
    paddingVertical: Spacing.md - 2, // 10px
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
    marginBottom: Spacing.md - 2, // 10px
  },

  // Lift cards
  liftCards: {
    gap: Spacing.sm,
  },
  liftCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.cardInner,
    padding: Spacing.lg,
  },
  liftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  liftName: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    fontWeight: '600',
  },
  liftValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
  liftValue: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  liftUnit: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  liftDetail: {
    color: Colors.textDim,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },

  // Volume chart
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
  chartBar: {
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
});
