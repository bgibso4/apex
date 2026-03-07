/**
 * APEX — Running Screen
 * Pain tracking, run logging, recent run history.
 */

import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Switch,
  StyleSheet, RefreshControl, KeyboardAvoidingView, Platform
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius, ComponentSize } from '../../src/theme';
import { getRunLogs, logRun, getPainTrend } from '../../src/db';
import type { RunLog } from '../../src/types';

const PAIN_COLORS = [
  '#22c55e', '#4ade80', '#86efac', '#fde047', '#facc15',
  '#f59e0b', '#f97316', '#ef4444', '#dc2626', '#b91c1c', '#7f1d1d',
];
const PAIN_DESCRIPTIONS = [
  'None', 'Minimal', 'Very mild', 'Mild', 'Noticeable',
  'Moderate', 'Moderate-high', 'High', 'Very high', 'Severe', 'Maximum',
];

export default function RunningScreen() {
  const [runLogs, setRunLogs] = useState<RunLog[]>([]);
  const [painTrend, setPainTrend] = useState<{ date: string; painLevel: number; durationMin: number }[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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
    setDistance('');
    setPain(0);
    setNotes('');
    setShowNotes(false);
    setPickups(false);
    await loadData();
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

        {/* Log Form */}
        <View style={styles.logForm}>
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
            <Text style={styles.toggleLabel}>Included pickups</Text>
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
            <Text style={styles.logBtnText}>Log Run</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Runs */}
        <Text style={styles.sectionLabel}>Recent Runs</Text>
        <View style={styles.runList}>
          {runLogs.map(run => {
            const badge = getPainBadgeStyle(run.pain_level);
            return (
              <View key={run.id} style={styles.runItem}>
                <View style={styles.runLeft}>
                  <Text style={styles.runDate}>{run.date}</Text>
                  <View style={styles.runDetails}>
                    <Text style={styles.runDetailText}>{run.duration_min} min</Text>
                    {run.included_pickups && (
                      <View style={styles.runPickupBadge}>
                        <Text style={styles.runPickupText}>Pickups</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={[styles.painBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.painBadgeValue, { color: badge.color }]}>
                    {run.pain_level}
                  </Text>
                  <Text style={[styles.painBadgeLabel, { color: badge.color }]}>
                    Acute
                  </Text>
                </View>
              </View>
            );
          })}
          {runLogs.length === 0 && (
            <Text style={styles.emptyText}>No runs logged yet</Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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

  // Log form
  logForm: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.cardPaddingCompact,
    gap: Spacing.xl - 2, // 18px
    marginBottom: Spacing.xl,
  },
  formInputsRow: {
    flexDirection: 'row',
    gap: Spacing.md - 2, // 10px
  },
  formField: {
    flex: 1,
    gap: Spacing.sm - 2, // 6px
  },
  formLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm - 2, // 6px
  },
  formInputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm - 2, // 6px
  },
  formInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md + 2, // 14px
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
    paddingVertical: Spacing.md - 2, // 10px
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm - 2, // 6px
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
    paddingVertical: Spacing.md + 2, // 14px
    paddingHorizontal: Spacing.lg,
    color: Colors.text,
    fontSize: FontSize.md,
    height: 72,
    textAlignVertical: 'top',
  },

  // Log button
  logBtn: {
    paddingVertical: Spacing.md + 2, // 14px
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
    marginBottom: Spacing.md - 2, // 10px
  },

  // Run list
  runList: {
    gap: Spacing.sm - 2, // 6px
  },
  runItem: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md + 2, // 14px
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  runLeft: {
    gap: 2,
  },
  runDate: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  runDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm - 2, // 6px
  },
  runDetailText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  runPickupBadge: {
    backgroundColor: `${Colors.cyan}15`,
    paddingHorizontal: Spacing.sm - 2, // 6px
    paddingVertical: 2,
    borderRadius: BorderRadius.xs + 1, // 4px
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

  // Empty
  emptyText: {
    color: Colors.textDim,
    fontSize: FontSize.md,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
});
