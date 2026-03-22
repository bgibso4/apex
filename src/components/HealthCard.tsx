import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';
import { DailyHealthRow } from '../types/health';

interface HealthCardProps {
  data: DailyHealthRow | null;
  loading?: boolean;
}

function getRecoveryColor(score: number | undefined): string {
  if (score == null) return Colors.textMuted;
  if (score >= 67) return Colors.green;
  if (score >= 34) return Colors.amber;
  return Colors.red;
}

function formatValue(value: number | undefined, suffix = ''): string {
  if (value == null) return '—';
  return `${Math.round(value * 10) / 10}${suffix}`;
}

export default function HealthCard({ data, loading }: HealthCardProps) {
  if (!data && !loading) return null;

  const recoveryColor = getRecoveryColor(data?.recoveryScore);

  return (
    <View style={styles.bar}>
      {/* Sleep — left */}
      <View style={styles.item}>
        <Text style={[styles.value, { color: Colors.text }]}>
          {formatValue(data?.sleepScore, '%')}
        </Text>
        <Text style={styles.label}>Sleep</Text>
      </View>

      <View style={styles.divider} />

      {/* Recovery — center, color-coded */}
      <View style={styles.item}>
        <Text style={[styles.value, { color: recoveryColor }]}>
          {formatValue(data?.recoveryScore, '%')}
        </Text>
        <Text style={styles.label}>Recovery</Text>
      </View>

      <View style={styles.divider} />

      {/* Strain — right */}
      <View style={styles.item}>
        <Text style={[styles.value, { color: Colors.text }]}>
          {formatValue(data?.strainScore)}
        </Text>
        <Text style={styles.label}>Strain</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
});
