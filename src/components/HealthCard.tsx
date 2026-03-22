import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';
import { DailyHealthRow } from '../types/health';

interface HealthCardProps {
  data: DailyHealthRow | null;
  loading?: boolean;
}

const RING_SIZE = 88;
const RING_STROKE = 5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function getRecoveryColor(score: number | undefined): string {
  if (score == null) return Colors.textMuted;
  if (score >= 67) return Colors.green;
  if (score >= 34) return Colors.amber;
  return Colors.red;
}

function ProgressRing({
  value,
  color,
  label,
}: {
  value: number | undefined;
  color: string;
  label: string;
}) {
  const progress = value != null ? value / 100 : 0;
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);

  return (
    <View style={ringStyles.container}>
      <View style={ringStyles.wrapper}>
        <Svg width={RING_SIZE} height={RING_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            stroke={`${color}15`}
            strokeWidth={RING_STROKE}
          />
          {value != null && (
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke={color}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
            />
          )}
        </Svg>
        <View style={ringStyles.valueContainer}>
          <Text style={[ringStyles.value, { color }]}>
            {value != null ? Math.round(value) : '—'}
          </Text>
          {value != null && <Text style={[ringStyles.unit, { color }]}>%</Text>}
        </View>
      </View>
      <Text style={ringStyles.label}>{label}</Text>
    </View>
  );
}

export default function HealthCard({ data, loading }: HealthCardProps) {
  if (!data && !loading) return null;

  const recoveryColor = getRecoveryColor(data?.recoveryScore);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>TODAY'S READINESS</Text>
        <Text style={styles.source}>{data?.source?.toUpperCase() ?? 'WHOOP'}</Text>
      </View>
      <View style={styles.body}>
        <ProgressRing
          value={data?.recoveryScore}
          color={recoveryColor}
          label="Recovery"
        />
        <ProgressRing
          value={data?.sleepScore}
          color={Colors.indigo}
          label="Sleep"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    color: Colors.textMuted,
    fontSize: FontSize.sectionLabel,
    fontWeight: '600',
    letterSpacing: 1,
  },
  source: {
    color: Colors.textDim,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  body: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
});

const ringStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  wrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    position: 'relative',
  },
  valueContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 28,
  },
  unit: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.7,
    marginTop: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
