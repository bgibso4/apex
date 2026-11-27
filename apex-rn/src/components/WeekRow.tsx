import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, ComponentSize } from '../theme';

export interface WeekRowProps {
  trainingDays: { day: string; template: { name: string } }[];
  todayKey: string;
  completedDays: string[];
  blockColor: string;
  dayNames: Record<string, string>;
  onDayPress: (day: string) => void;
}

export function WeekRow({
  trainingDays, todayKey, completedDays, blockColor, dayNames, onDayPress,
}: WeekRowProps) {
  return (
    <View style={styles.weekRow}>
      {trainingDays.map(({ day }, index) => {
        const isToday = day === todayKey;
        const isCompleted = completedDays.includes(day);
        const isRest = false; // training days are never rest
        const isUpcoming = !isToday && !isCompleted;

        return (
          <TouchableOpacity
            key={day}
            style={styles.dayChip}
            onPress={() => onDayPress(day)}
          >
            <Text style={[
              styles.dayLabel,
              isCompleted && styles.dayLabelCompleted,
              isToday && styles.dayLabelToday,
            ]}>
              {dayNames[day]}
            </Text>
            <View style={[
              styles.dayDot,
              isCompleted && styles.dayDotCompleted,
              isToday && !isCompleted && styles.dayDotToday,
              isUpcoming && styles.dayDotUpcoming,
            ]}>
              <Text style={[
                styles.dayDotText,
                isCompleted && styles.dayDotTextCompleted,
                isToday && !isCompleted && styles.dayDotTextToday,
                isUpcoming && styles.dayDotTextUpcoming,
              ]}>
                {isCompleted ? '\u2713' : `${index + 1}`}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  dayChip: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  dayLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sectionLabel,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dayLabelCompleted: {
    color: '#22c55e80',
  },
  dayLabelToday: {
    color: Colors.indigo,
  },
  dayDot: {
    width: ComponentSize.dayDotSize,
    height: ComponentSize.dayDotSize,
    borderRadius: ComponentSize.dayDotSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDotCompleted: {
    backgroundColor: Colors.greenMuted,
  },
  dayDotToday: {
    backgroundColor: Colors.indigo,
    shadowColor: Colors.indigo,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  dayDotUpcoming: {
    backgroundColor: Colors.surface,
  },
  dayDotText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  dayDotTextCompleted: {
    color: Colors.green,
  },
  dayDotTextToday: {
    color: Colors.text,
  },
  dayDotTextUpcoming: {
    color: Colors.textMuted,
  },
});
