import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';
import type { DayTemplate } from '../types';

const REST_DAY_QUOTES = [
  'The body grows stronger during rest, not during the workout.',
  'Recovery is not the absence of training \u2014 it is part of it.',
  'Sleep is the greatest legal performance-enhancing drug.',
  'Muscles are torn in the gym, fed in the kitchen, built in bed.',
  'Rest today. Come back sharper tomorrow.',
  'Adaptation happens when you stop, not when you push.',
  'The patience to rest is the patience to grow.',
  'You earned this day off. Use it well.',
  'Progress is built on the days between sessions.',
  'Trust the process. Trust the rest.',
  'Overtraining is underpreparing for the next session.',
  'Today you recover. Tomorrow you conquer.',
];

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export interface TodayCardProps {
  todayTemplate: DayTemplate | undefined;
  isCompleted: boolean;
  blockColor: string;
  onPress: () => void;
  completedStats?: { durationMin: number; setCount: number };
  nextSessionName?: string;
  nextSessionLabel?: string;
}

export function TodayCard({ todayTemplate, isCompleted, blockColor, onPress, completedStats, nextSessionName, nextSessionLabel }: TodayCardProps) {
  if (!todayTemplate) {
    const quote = REST_DAY_QUOTES[getDayOfYear() % REST_DAY_QUOTES.length];
    return (
      <View style={[styles.card, styles.sessionCard]}>
        <Text style={styles.restDayTitle}>Rest Day</Text>
        <Text style={styles.quoteText}>{quote}</Text>
        {nextSessionName && (
          <View style={styles.upNextRow}>
            <Text style={styles.upNextLabel}>{nextSessionLabel ?? 'Next'}:</Text>
            <Text style={styles.upNextName}> {nextSessionName}</Text>
          </View>
        )}
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
      <Text style={styles.todayLabel}>{"Today's Training"}</Text>
      <Text style={styles.todayTitle}>{todayTemplate.name}</Text>

      {isCompleted ? (
        <View style={styles.completedRow}>
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>{'\u2713'} Completed</Text>
          </View>
          {completedStats && (
            <Text style={styles.completedStats}>
              {completedStats.durationMin} min {'\u00B7'} {completedStats.setCount} sets
            </Text>
          )}
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
  completedStats: {
    color: Colors.textDim,
    fontSize: FontSize.body,
  },
  restDayTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.title,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  quoteText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  upNextRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  upNextLabel: {
    color: Colors.textDim,
    fontSize: FontSize.body,
    fontWeight: '600' as const,
  },
  upNextName: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
  },
});
