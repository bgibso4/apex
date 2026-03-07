import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';

export interface DaySelectorProps {
  currentWeek: number;
  blockName?: string;
  blockColor: string;
  selectedDay: string;
  trainingDays: { day: string; template: { name: string } }[];
  dayNames: Record<string, string>;
  onSelectDay: (day: string) => void;
}

export function DaySelector({
  currentWeek, blockName, blockColor, selectedDay,
  trainingDays, dayNames, onSelectDay,
}: DaySelectorProps) {
  return (
    <View style={styles.daySelector}>
      <Text style={styles.daySelectorTitle}>
        Week {currentWeek} — {blockName}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayRow}
      >
        {trainingDays.map(({ day, template }) => {
          const isSelected = day === selectedDay;
          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayChip,
                isSelected && styles.dayChipSelected,
              ]}
              onPress={() => onSelectDay(day)}
            >
              <Text style={[
                styles.dayChipText,
                isSelected && styles.dayChipTextSelected,
              ]}>
                {dayNames[day]} {'\u00B7'} {template.name.split('—')[0].trim()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  daySelector: {
    marginBottom: Spacing.sm,
  },
  daySelectorTitle: {
    color: Colors.text,
    fontSize: FontSize.screenTitle,
    fontWeight: '800',
    marginBottom: Spacing.md,
  },
  dayRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  dayChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  dayChipSelected: {
    backgroundColor: `${Colors.indigo}15`,
    borderColor: Colors.indigo,
  },
  dayChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    fontWeight: '600',
  },
  dayChipTextSelected: {
    color: Colors.text,
  },
});
