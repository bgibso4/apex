import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, ComponentSize } from '../theme';

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
      <Text style={styles.daySelectorLabel}>
        Week {currentWeek} · {blockName}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayRow}>
        {trainingDays.map(({ day, template }) => {
          const isSelected = day === selectedDay;
          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayChip,
                isSelected && { backgroundColor: blockColor, borderColor: blockColor },
              ]}
              onPress={() => onSelectDay(day)}
            >
              <Text style={[
                styles.dayChipText,
                isSelected && { color: Colors.text },
              ]}>
                {dayNames[day]}
              </Text>
              <Text style={[
                styles.dayChipSubtext,
                isSelected && { color: `${Colors.text}cc` },
              ]} numberOfLines={1}>
                {template.name.split('—')[0].trim()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  daySelector: { marginBottom: Spacing.xl },
  daySelectorLabel: {
    color: Colors.textSecondary, fontSize: FontSize.md,
    fontWeight: '600', marginBottom: Spacing.sm,
  },
  dayRow: { flexDirection: 'row' },
  dayChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    minWidth: ComponentSize.chartHeightSmall,
  },
  dayChipText: { color: Colors.textDim, fontSize: FontSize.md, fontWeight: '700' },
  dayChipSubtext: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
});
