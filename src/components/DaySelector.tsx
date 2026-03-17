import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';

export interface ExercisePreview {
  name: string;
  detail: string;
}

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
  exercises?: ExercisePreview[];
}

export function DaySelector({
  currentWeek, blockName, selectedDay,
  trainingDays, dayNames, onSelectDay, todayKey,
  workoutName, exerciseCountLabel, exercises,
}: DaySelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [exercisesExpanded, setExercisesExpanded] = useState(false);
  const isToday = todayKey === selectedDay;

  return (
    <View style={styles.container}>
      {/* Info card — only when a workout is selected */}
      {workoutName && (
        <View style={styles.card}>
          {/* Workout name + Change link */}
          <View style={styles.cardTop}>
            <Text style={styles.cardTitle}>{workoutName}</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Text style={styles.changeLink}>Change</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Week/block + today badge */}
          <View style={styles.contextRow}>
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

          {/* Exercise toggle row */}
          {exerciseCountLabel && (
            <TouchableOpacity
              style={styles.exerciseToggle}
              onPress={() => setExercisesExpanded(!exercisesExpanded)}
              activeOpacity={0.7}
            >
              <Text style={styles.exerciseToggleText}>{exerciseCountLabel}</Text>
              <Ionicons
                name={exercisesExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={Colors.textDim}
              />
            </TouchableOpacity>
          )}

          {/* Collapsible exercise list */}
          {exercisesExpanded && exercises && exercises.length > 0 && (
            <View style={styles.exerciseList}>
              {exercises.map((ex, i) => (
                <View key={i} style={styles.exerciseRow}>
                  <Text style={styles.exerciseName}>{ex.name}</Text>
                  <Text style={styles.exerciseDetail}>{ex.detail}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Fallback context row when no workout selected (rest day) */}
      {!workoutName && (
        <View style={styles.restDayContext}>
          <Text style={styles.weekLabel}>
            Week {currentWeek} · {blockName}
          </Text>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={styles.changeLink}>Change</Text>
          </TouchableOpacity>
        </View>
      )}

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
    marginBottom: Spacing.lg,
  },

  // Info card
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.cardPadding,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    flex: 1,
    marginRight: Spacing.md,
  },
  changeLink: {
    fontSize: FontSize.body,
    fontWeight: '600',
    color: Colors.indigo,
    paddingTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },
  contextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: FontSize.body,
    fontWeight: '700',
    color: Colors.indigo,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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

  // Exercise toggle
  exerciseToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.lg,
  },
  exerciseToggleText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  // Exercise list (inside card)
  exerciseList: {
    marginTop: Spacing.md,
    gap: 3,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.bg,
    borderRadius: BorderRadius.cardInner,
  },
  exerciseName: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  exerciseDetail: {
    color: Colors.textMuted,
    fontSize: FontSize.body,
  },

  // Rest day fallback
  restDayContext: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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

  // Workout rows (modal)
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
