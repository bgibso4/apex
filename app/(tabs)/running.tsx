/**
 * APEX — Running Screen
 * Pain trend, duration trend, run log list.
 */

import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, RefreshControl, KeyboardAvoidingView, Platform
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import { getRunLogs, logRun, getPainTrend } from '../../src/db';
import type { RunLog } from '../../src/types';

export default function RunningScreen() {
  const [runLogs, setRunLogs] = useState<RunLog[]>([]);
  const [painTrend, setPainTrend] = useState<{ date: string; painLevel: number; durationMin: number }[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showLog, setShowLog] = useState(false);

  // New run form
  const [duration, setDuration] = useState('');
  const [pain, setPain] = useState(0);
  const [notes, setNotes] = useState('');
  const [pickups, setPickups] = useState(false);

  const loadData = useCallback(async () => {
    const logs = await getRunLogs(20);
    setRunLogs(logs);
    const trend = await getPainTrend(12);
    setPainTrend(trend.reverse());
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

    await logRun({
      date: new Date().toISOString().split('T')[0],
      durationMin: durMin,
      painLevel: pain,
      notes: notes || undefined,
      includedPickups: pickups,
    });

    setDuration('');
    setPain(0);
    setNotes('');
    setPickups(false);
    setShowLog(false);
    await loadData();
  };

  const maxPain = 10;

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

        {/* Pain Trend */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>PAIN TREND</Text>
          {painTrend.length > 0 ? (
            <View style={styles.painChart}>
              {painTrend.map((p, i) => (
                <View key={i} style={styles.painBar}>
                  <View style={[styles.painFill, {
                    height: `${(p.painLevel / maxPain) * 100}%`,
                    backgroundColor: p.painLevel <= 3 ? Colors.green :
                      p.painLevel <= 6 ? Colors.amber : Colors.red,
                  }]} />
                  <Text style={styles.painValue}>{p.painLevel}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Log some runs to see trends</Text>
          )}
        </View>

        {/* Duration Trend */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>DURATION TREND</Text>
          {painTrend.length > 0 ? (
            <View style={styles.durationRow}>
              {painTrend.map((p, i) => (
                <View key={i} style={styles.durationItem}>
                  <Text style={styles.durationValue}>{p.durationMin}</Text>
                  <Text style={styles.durationUnit}>min</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No runs yet</Text>
          )}
        </View>

        {/* Log Run Button / Form */}
        {!showLog ? (
          <TouchableOpacity
            style={styles.logButton}
            onPress={() => setShowLog(true)}
          >
            <Ionicons name="add-circle" size={24} color={Colors.cyan} />
            <Text style={styles.logButtonText}>Log a Run</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.card}>
            <Text style={styles.formTitle}>Log Run</Text>

            <Text style={styles.formLabel}>Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              placeholder="e.g. 20"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.formLabel}>Pain Level (0-10)</Text>
            <View style={styles.painSelector}>
              {Array.from({ length: 11 }, (_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.painButton,
                    pain === i && {
                      backgroundColor: i <= 3 ? Colors.greenMuted :
                        i <= 6 ? Colors.amberMuted : Colors.redMuted,
                      borderColor: i <= 3 ? Colors.green :
                        i <= 6 ? Colors.amber : Colors.red,
                    },
                  ]}
                  onPress={() => setPain(i)}
                >
                  <Text style={[
                    styles.painButtonText,
                    pain === i && {
                      color: i <= 3 ? Colors.green :
                        i <= 6 ? Colors.amber : Colors.red,
                    },
                  ]}>{i}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setPickups(!pickups)}
            >
              <Ionicons
                name={pickups ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={pickups ? Colors.cyan : Colors.textDim}
              />
              <Text style={styles.checkLabel}>Included pickups</Text>
            </TouchableOpacity>

            <Text style={styles.formLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Shin/ankle notes..."
              placeholderTextColor={Colors.textMuted}
            />

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.formBtn, { backgroundColor: Colors.surface }]}
                onPress={() => setShowLog(false)}
              >
                <Text style={[styles.formBtnText, { color: Colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formBtn, { backgroundColor: Colors.cyan }]}
                onPress={submitRun}
              >
                <Text style={styles.formBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Run History */}
        <Text style={[styles.cardLabel, { marginTop: Spacing.xxl }]}>RECENT RUNS</Text>
        {runLogs.map(run => (
          <View key={run.id} style={styles.runItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.runDate}>{run.date}</Text>
              <Text style={styles.runDetail}>
                {run.duration_min} min
                {run.included_pickups ? ' · with pickups' : ''}
              </Text>
            </View>
            <View style={[styles.painBadge, {
              backgroundColor: run.pain_level <= 3 ? Colors.greenMuted :
                run.pain_level <= 6 ? Colors.amberMuted : Colors.redMuted,
            }]}>
              <Text style={[styles.painBadgeText, {
                color: run.pain_level <= 3 ? Colors.green :
                  run.pain_level <= 6 ? Colors.amber : Colors.red,
              }]}>
                Pain: {run.pain_level}/10
              </Text>
            </View>
          </View>
        ))}
        {runLogs.length === 0 && (
          <Text style={styles.emptyText}>No runs logged yet</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingHorizontal: Spacing.lg, paddingBottom: 40 },
  title: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '700', marginBottom: Spacing.xl },
  card: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  cardLabel: {
    color: Colors.textDim, fontSize: FontSize.xs,
    fontWeight: '700', letterSpacing: 1, marginBottom: Spacing.md,
  },

  // Pain chart
  painChart: {
    flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 4,
  },
  painBar: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  painFill: { width: '80%', borderRadius: 3, minHeight: 2 },
  painValue: { color: Colors.textDim, fontSize: 9, marginTop: 2 },

  // Duration
  durationRow: { flexDirection: 'row', gap: 4, alignItems: 'flex-end' },
  durationItem: { flex: 1, alignItems: 'center' },
  durationValue: { color: Colors.cyan, fontSize: FontSize.lg, fontWeight: '700' },
  durationUnit: { color: Colors.textDim, fontSize: 9 },

  // Log button
  logButton: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Colors.cyan, borderStyle: 'dashed',
  },
  logButtonText: { color: Colors.cyan, fontSize: FontSize.md, fontWeight: '600' },

  // Form
  formTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.lg },
  formLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.sm },
  input: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.sm,
    padding: Spacing.md, color: Colors.text, fontSize: FontSize.md,
    marginBottom: Spacing.lg,
  },
  painSelector: { flexDirection: 'row', gap: 4, marginBottom: Spacing.lg, flexWrap: 'wrap' },
  painButton: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  painButtonText: { color: Colors.textDim, fontSize: FontSize.xs, fontWeight: '600' },
  checkRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  checkLabel: { color: Colors.textSecondary, fontSize: FontSize.md },
  formButtons: { flexDirection: 'row', gap: Spacing.md },
  formBtn: {
    flex: 1, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md, alignItems: 'center',
  },
  formBtnText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },

  // Run history
  runItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: BorderRadius.md,
    padding: Spacing.lg, marginBottom: Spacing.sm,
  },
  runDate: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
  runDetail: { color: Colors.textDim, fontSize: FontSize.sm, marginTop: 2 },
  painBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.sm },
  painBadgeText: { fontSize: FontSize.xs, fontWeight: '600' },

  emptyText: { color: Colors.textDim, fontSize: FontSize.md, textAlign: 'center', paddingVertical: Spacing.xl },
});
