import { useState } from 'react';
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
  todayKey?: string;
}

export function DaySelector({
  currentWeek, blockName, selectedDay,
  trainingDays, dayNames, onSelectDay, todayKey,
}: DaySelectorProps) {
  const [expanded, setExpanded] = useState(false);
  const isToday = todayKey === selectedDay;

  return (
    <View style={styles.container}>
      {/* Top row: week label + change link */}
      <View style={styles.topRow}>
        <Text style={styles.weekLabel}>
          Week {currentWeek} · {blockName}
        </Text>
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <Text style={styles.changeLink}>
            {expanded ? 'Done' : 'Change workout'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Today badge */}
      {isToday && !expanded && (
        <View style={styles.todayBadge}>
          <View style={styles.todayDot} />
          <Text style={styles.todayText}>{dayNames[selectedDay]} — Today</Text>
        </View>
      )}

      {/* Not today badge */}
      {!isToday && !expanded && (
        <View style={styles.todayBadge}>
          <Text style={styles.dayText}>{dayNames[selectedDay]}</Text>
        </View>
      )}

      {/* Expanded day chips */}
      {expanded && (
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
                onPress={() => {
                  onSelectDay(day);
                  setExpanded(false);
                }}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.xs,
  },
  weekLabel: {
    fontSize: FontSize.body,
    fontWeight: '700',
    color: Colors.indigo,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  changeLink: {
    fontSize: FontSize.body,
    fontWeight: '600',
    color: Colors.indigo,
  },
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.green,
  },
  todayText: {
    fontSize: FontSize.body,
    fontWeight: '600',
    color: Colors.textDim,
  },
  dayText: {
    fontSize: FontSize.body,
    fontWeight: '600',
    color: Colors.textDim,
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
