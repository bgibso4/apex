import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';
import type { DayTemplate } from '../types';

export interface TodayCardProps {
  todayTemplate: DayTemplate | undefined;
  isCompleted: boolean;
  blockColor: string;
  onPress: () => void;
}

export function TodayCard({ todayTemplate, isCompleted, blockColor, onPress }: TodayCardProps) {
  if (!todayTemplate) {
    return (
      <View style={styles.card}>
        <Text style={styles.restDayText}>Rest Day</Text>
        <Text style={styles.restDaySubtext}>Recovery is training too.</Text>
      </View>
    );
  }

  const exerciseCount = todayTemplate.exercises.length;
  const subtitle = `${exerciseCount} exercises${todayTemplate.conditioning_finisher ? ' + finisher' : ''}`;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        styles.sessionCard,
        isCompleted && styles.sessionCardCompleted,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.todayLabel}>Today's Training</Text>
      <Text style={styles.todayTitle}>{todayTemplate.name}</Text>

      {isCompleted ? (
        <View style={styles.completedRow}>
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>{'\u2713'} Completed</Text>
          </View>
        </View>
      ) : (
        <>
          <Text style={styles.todaySubtitle}>{subtitle}</Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={onPress}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>Start Workout</Text>
            <Text style={styles.startButtonArrow}>{'\u2192'}</Text>
          </TouchableOpacity>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.cardPadding,
  },
  sessionCard: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sessionCardCompleted: {
    borderColor: Colors.greenBorderFaint,
  },
  todayLabel: {
    color: Colors.textDim,
    fontSize: FontSize.sectionLabel,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
  todayTitle: {
    color: Colors.text,
    fontSize: FontSize.title,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  todaySubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginBottom: Spacing.xl,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.indigo,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
  },
  startButtonText: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  startButtonArrow: {
    color: Colors.text,
    fontSize: FontSize.xl,
  },
  completedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.greenFaint,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.button,
  },
  completedBadgeText: {
    color: Colors.green,
    fontSize: FontSize.body,
    fontWeight: '600',
  },
  restDayText: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '600',
    textAlign: 'center',
  },
  restDaySubtext: {
    color: Colors.textDim,
    fontSize: FontSize.md,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
