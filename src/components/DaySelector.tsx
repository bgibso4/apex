import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';

export interface DaySelectorProps {
  currentWeek: number;
  blockName?: string;
  blockColor: string;
  selectedDay: string;
  trainingDays: { day: string; template: { name: string; exercises: { exercise_id: string }[] } }[];
  dayNames: Record<string, string>;
  onSelectDay: (day: string) => void;
  todayKey?: string;
  workoutName?: string;
  exerciseCountLabel?: string;
}

export function DaySelector({
  currentWeek, blockName, selectedDay,
  trainingDays, dayNames, onSelectDay, todayKey,
  workoutName, exerciseCountLabel,
}: DaySelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const isToday = todayKey === selectedDay;

  return (
    <View style={styles.container}>
      {/* Workout title — hero position */}
      {workoutName && (
        <Text style={styles.heroTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.75}>
          {workoutName}
        </Text>
      )}
      {exerciseCountLabel && (
        <Text style={styles.heroSubtitle}>{exerciseCountLabel}</Text>
      )}

      {/* Week label + change link + today badge row */}
      <View style={styles.contextRow}>
        <View style={styles.contextLeft}>
          <Text style={styles.weekLabel}>
            Week {currentWeek} · {blockName}
          </Text>
          {isToday && (
            <View style={styles.todayBadge}>
              <View style={styles.todayDot} />
              <Text style={styles.todayText}>{dayNames[selectedDay]} — Today</Text>
            </View>
          )}
          {!isToday && (
            <Text style={styles.dayText}>{dayNames[selectedDay]}</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.changeLink}>Change workout</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom sheet modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Change Workout</Text>
            <Text style={styles.sheetSubtitle}>Week {currentWeek} · {blockName}</Text>

            {trainingDays.map(({ day, template }) => {
              const isSelected = day === selectedDay;
              const isDayToday = day === todayKey;
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.workoutRow, isSelected && styles.workoutRowSelected]}
                  onPress={() => {
                    onSelectDay(day);
                    setModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.workoutDay, isSelected && styles.workoutDaySelected]}>
                    {dayNames[day]}
                  </Text>
                  <View style={styles.workoutInfo}>
                    <View style={styles.workoutNameRow}>
                      <Text
                        style={[styles.workoutName, isSelected && styles.workoutNameSelected]}
                        numberOfLines={1}
                      >
                        {template.name}
                      </Text>
                      {isDayToday && (
                        <View style={styles.todayBadgeSmall}>
                          <View style={styles.todayDotSmall} />
                          <Text style={styles.todayBadgeText}>Today</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.workoutMeta}>
                      {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  {isSelected && (
                    <Text style={styles.workoutCheck}>{'\u2713'}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  heroTitle: {
    color: Colors.text,
    fontSize: FontSize.screenTitle,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginBottom: Spacing.lg,
  },
  contextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  contextLeft: {
    flex: 1,
    gap: Spacing.xs,
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

  // Modal overlay
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: 40,
    paddingTop: Spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderLight,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  sheetTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: 4,
  },
  sheetSubtitle: {
    color: Colors.textDim,
    fontSize: FontSize.body,
    fontWeight: '500',
    marginBottom: Spacing.lg,
  },

  // Workout rows
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.cardInner,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.cardInset,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  workoutRowSelected: {
    backgroundColor: `${Colors.indigo}08`,
    borderColor: Colors.indigo,
  },
  workoutDay: {
    width: 40,
    fontSize: FontSize.body,
    fontWeight: '700',
    color: Colors.textDim,
  },
  workoutDaySelected: {
    color: Colors.indigo,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  workoutName: {
    color: Colors.textSecondary,
    fontSize: FontSize.base,
    fontWeight: '600',
    flexShrink: 1,
  },
  workoutNameSelected: {
    color: Colors.text,
  },
  workoutMeta: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  workoutCheck: {
    color: Colors.indigo,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginLeft: Spacing.md,
  },

  // Today badge in modal
  todayBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${Colors.green}15`,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  todayDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.green,
  },
  todayBadgeText: {
    fontSize: FontSize.xs + 1,
    fontWeight: '600',
    color: Colors.green,
  },
});
