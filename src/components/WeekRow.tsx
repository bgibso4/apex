import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';

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
    <View style={styles.card}>
      <Text style={styles.cardLabel}>THIS WEEK</Text>
      <View style={styles.weekRow}>
        {trainingDays.map(({ day }) => {
          const isToday = day === todayKey;
          const isCompleted = completedDays.includes(day);
          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayPill,
                isToday && styles.dayPillToday,
                isCompleted && styles.dayPillDone,
              ]}
              onPress={() => onDayPress(day)}
            >
              <Text style={[
                styles.dayPillText,
                isToday && { color: Colors.text },
                isCompleted && { color: Colors.green },
              ]}>
                {dayNames[day]}
              </Text>
              {isCompleted && (
                <Ionicons name="checkmark" size={14} color={Colors.green} />
              )}
              {isToday && !isCompleted && (
                <View style={[styles.todayDot, { backgroundColor: blockColor }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  cardLabel: {
    color: Colors.textDim, fontSize: FontSize.xs,
    fontWeight: '700', letterSpacing: 1, marginBottom: Spacing.md,
  },
  weekRow: { flexDirection: 'row', gap: Spacing.sm },
  dayPill: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm, backgroundColor: Colors.surface,
  },
  dayPillToday: { borderWidth: 1, borderColor: Colors.indigo },
  dayPillDone: { backgroundColor: Colors.greenMuted },
  dayPillText: { color: Colors.textDim, fontSize: FontSize.sm, fontWeight: '600' },
  todayDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 3 },
});
