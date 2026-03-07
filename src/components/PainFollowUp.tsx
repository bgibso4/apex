/**
 * APEX — Pain Follow-Up Prompt
 * Shows on home screen ~24h after logging a run, asking for delayed pain level.
 */

import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';

const PAIN_COLORS = [
  '#22c55e', '#4ade80', '#86efac', '#fde047', '#facc15',
  '#f59e0b', '#f97316', '#ef4444', '#dc2626', '#b91c1c', '#7f1d1d',
];
const PAIN_DESCRIPTIONS = [
  'None', 'Minimal', 'Very mild', 'Mild', 'Noticeable',
  'Moderate', 'Moderate-high', 'High', 'Very high', 'Severe', 'Maximum',
];

export interface PainFollowUpProps {
  runDate: string;
  durationMin: number;
  distance?: number;
  onSave: (painLevel: number) => void;
  onDismiss: () => void;
}

export function PainFollowUp({ runDate, durationMin, distance, onSave, onDismiss }: PainFollowUpProps) {
  const [pain, setPain] = useState(0);

  const dateLabel = formatFollowUpDate(runDate);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>How's the pain today?</Text>
          <Text style={styles.sub}>
            After your run on {dateLabel} {'\u00B7'} {durationMin} min
            {distance ? ` \u00B7 ${distance} mi` : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
          <Text style={styles.dismissText}>{'\u00D7'}</Text>
        </TouchableOpacity>
      </View>

      <View>
        <Text style={styles.label}>Pain Level (day after)</Text>
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
        <Text style={[styles.painDescription, pain > 0 && styles.painDescriptionActive]}>
          {PAIN_DESCRIPTIONS[pain] ?? ''}
        </Text>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={() => onSave(pain)} activeOpacity={0.8}>
        <Text style={styles.saveBtnText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

function formatFollowUpDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[d.getDay()];
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: `${Colors.cyan}30`,
    borderRadius: BorderRadius.lg,
    padding: Spacing.cardPaddingCompact,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: '700',
  },
  sub: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  dismissBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    color: Colors.textMuted,
    fontSize: FontSize.xl,
    lineHeight: FontSize.xl,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm - 2,
  },
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
  saveBtn: {
    paddingVertical: Spacing.md - 2,
    backgroundColor: Colors.cyan,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
  },
  saveBtnText: {
    color: Colors.bg,
    fontSize: FontSize.body,
    fontWeight: '700',
  },
});
