import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '@cadre/shared/theme';

interface Props {
  label: string;
  value: number;
  max: number;
  color: string;
  showPercentage?: boolean;
}

export function ProgressBar({ label, value, max, color, showPercentage }: Props) {
  const ratio = max > 0 ? value / max : 0;
  const fillPercent = Math.min(ratio * 100, 100);

  const countText = showPercentage
    ? `${Math.round(ratio * 100)}%`
    : `${value} / ${max}`;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.count}>{countText}</Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${fillPercent}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

const TRACK_HEIGHT = 6;

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    fontWeight: '600',
  },
  count: {
    color: Colors.textDim,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  track: {
    height: TRACK_HEIGHT,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xs,
    overflow: 'hidden',
  },
  fill: {
    height: TRACK_HEIGHT,
    borderRadius: BorderRadius.xs,
  },
});
