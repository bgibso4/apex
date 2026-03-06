import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  return (
    <TouchableOpacity
      style={[styles.card, styles.sessionCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.sessionCardHeader}>
        <Text style={styles.sessionName}>{todayTemplate.name}</Text>
        {isCompleted ? (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.green} />
            <Text style={styles.completedText}>Done</Text>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={20} color={Colors.textDim} />
        )}
      </View>
      <Text style={styles.sessionExercises}>
        {todayTemplate.exercises
          .slice(0, 4)
          .map(e => e.exercise_id.replace(/_/g, ' '))
          .join(' · ')}
        {todayTemplate.exercises.length > 4
          ? ` +${todayTemplate.exercises.length - 4} more`
          : ''}
      </Text>
      {!isCompleted && (
        <View style={[styles.startButton, { backgroundColor: blockColor }]}>
          <Text style={styles.startButtonText}>Start Workout</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  sessionCard: { borderWidth: 1, borderColor: Colors.border },
  sessionCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.sm,
  },
  sessionName: {
    color: Colors.text, fontSize: FontSize.lg, fontWeight: '600', flex: 1,
  },
  sessionExercises: {
    color: Colors.textSecondary, fontSize: FontSize.sm,
    textTransform: 'capitalize', marginBottom: Spacing.lg,
  },
  startButton: {
    paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center',
  },
  startButtonText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  completedText: { color: Colors.green, fontSize: FontSize.sm, fontWeight: '600' },
  restDayText: {
    color: Colors.text, fontSize: FontSize.xl,
    fontWeight: '600', textAlign: 'center',
  },
  restDaySubtext: {
    color: Colors.textDim, fontSize: FontSize.md,
    textAlign: 'center', marginTop: Spacing.xs,
  },
});
