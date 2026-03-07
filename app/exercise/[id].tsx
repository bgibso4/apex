/**
 * APEX — Exercise Detail Screen
 * Shows 1RM trend chart, current estimated 1RM, and recent set history
 * for a single exercise. Navigated from Progress screen lift cards.
 */

import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import { getEstimated1RM, get1RMHistory, getExerciseSetHistory } from '../../src/db';
import TrendLineChart from '../../src/components/TrendLineChart';
import type { Estimated1RM } from '../../src/types';

interface SessionSets {
  date: string;
  sets: { setNumber: number; weight: number; reps: number; rpe: number | null }[];
}

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [e1rm, setE1rm] = useState<Estimated1RM | null>(null);
  const [history, setHistory] = useState<{ date: string; e1rm: number }[]>([]);
  const [recentSessions, setRecentSessions] = useState<SessionSets[]>([]);

  const loadData = useCallback(async () => {
    if (!id) return;
    const [rm, hist, sets] = await Promise.all([
      getEstimated1RM(id),
      get1RMHistory(id, 20),
      getExerciseSetHistory(id, 10),
    ]);
    setE1rm(rm);
    setHistory(hist);
    setRecentSessions(sets);
  }, [id]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const delta = history.length >= 2
    ? history[history.length - 1].e1rm - history[0].e1rm
    : null;

  const exerciseName = e1rm?.exercise_name ?? id?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? 'Exercise';

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[d.getDay()]} \u00B7 ${months[d.getMonth()]} ${d.getDate()}`;
  };

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

        {/* 1RM Trend Chart */}
        {history.length >= 2 && (
          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>1RM Progression</Text>
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
            />
          </View>
        )}

        {/* Set History */}
        <Text style={styles.sectionLabel}>Recent Sessions</Text>
        {recentSessions.length > 0 ? (
          <View style={styles.sessionsContainer}>
            {recentSessions.map((session, si) => (
              <View key={si} style={styles.sessionCard}>
                <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
                <View style={styles.setTable}>
                  <View style={styles.setTableHeader}>
                    <Text style={[styles.setHeaderText, { flex: 0.5 }]}>Set</Text>
                    <Text style={styles.setHeaderText}>Weight</Text>
                    <Text style={styles.setHeaderText}>Reps</Text>
                    <Text style={styles.setHeaderText}>RPE</Text>
                  </View>
                  {session.sets.map((set, setIdx) => (
                    <View key={setIdx} style={styles.setRow}>
                      <Text style={[styles.setValueDim, { flex: 0.5 }]}>{set.setNumber}</Text>
                      <Text style={styles.setValue}>{set.weight}</Text>
                      <Text style={styles.setValue}>{set.reps}</Text>
                      <Text style={styles.setValueDim}>
                        {set.rpe != null ? set.rpe : '\u2014'}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No completed sets yet</Text>
          </View>
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
    fontSize: 40,
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

  // Section label
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sectionLabel,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md - 2,
  },

  // Sessions list
  sessionsContainer: {
    gap: Spacing.sm,
  },
  sessionCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.cardInner,
    padding: Spacing.lg,
  },
  sessionDate: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },

  // Set table
  setTable: {
    gap: Spacing.sm - 2,
  },
  setTableHeader: {
    flexDirection: 'row',
    paddingBottom: Spacing.sm - 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  setHeaderText: {
    flex: 1,
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  setValue: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  setValueDim: {
    flex: 1,
    color: Colors.textDim,
    fontSize: FontSize.md,
    fontWeight: '600',
    textAlign: 'center',
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
});
