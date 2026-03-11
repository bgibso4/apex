import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, ComponentSize } from '../theme';
import type { SetLog, ExerciseTarget } from '../types';
import { InputField, FieldType, FIELD_PROFILES, FIELD_LABELS } from '../types/fields';

export interface SetState {
  setNumber: number;
  targetWeight?: number;
  targetReps?: number;
  actualWeight?: number;
  actualReps?: number;
  targetDistance?: number;
  actualDistance?: number;
  targetDuration?: number;
  actualDuration?: number;
  targetTime?: number;
  actualTime?: number;
  rpe?: number;
  status: SetLog['status'];
  id?: string;
}

export interface ExerciseCardProps {
  exerciseName: string;
  category: string;
  target: ExerciseTarget | undefined;
  sets: SetState[];
  rpe?: number;
  expanded: boolean;
  lastWeight?: number;
  lastReps?: number;
  blockColor: string;
  onToggleExpand: () => void;
  onCompleteSet: (setIdx: number) => void;
  onLongPressSet: (setIdx: number) => void;
  onSetRPE: (rpe: number) => void;
  onLongPressCard?: () => void;
  note?: string;
  onNoteChange?: (note: string) => void;
  inputFields?: InputField[];
}

function getSetValue(set: SetState, fieldType: FieldType): number | string {
  const key = fieldType.charAt(0).toUpperCase() + fieldType.slice(1);
  const actual = set[`actual${key}` as keyof SetState] as number | undefined;
  const target = set[`target${key}` as keyof SetState] as number | undefined;
  return actual ?? target ?? '\u2014';
}

export function ExerciseCard({
  exerciseName, category, target, sets, rpe, expanded,
  lastWeight, lastReps, blockColor,
  onToggleExpand, onCompleteSet, onLongPressSet, onSetRPE,
  onLongPressCard, note, onNoteChange, inputFields,
}: ExerciseCardProps) {
  const allDone = sets.every(s => s.status !== 'pending');
  const completedCount = sets.filter(s => s.status !== 'pending').length;
  const [noteVisible, setNoteVisible] = useState(!!note);
  const fields = inputFields ?? FIELD_PROFILES.weight_reps;

  // Collapsed view
  if (!expanded) {
    return (
      <TouchableOpacity
        style={styles.exerciseCard}
        onPress={onToggleExpand}
        onLongPress={onLongPressCard}
        activeOpacity={0.8}
      >
        <View style={styles.collapsedRow}>
          <Text style={styles.collapsedName}>{exerciseName}</Text>
          <Text style={[
            styles.collapsedStatus,
            allDone && styles.collapsedStatusDone,
          ]}>
            {completedCount}/{sets.length}{allDone ? ' \u2713' : ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Expanded view
  return (
    <TouchableOpacity
      style={[styles.exerciseCard, styles.exerciseCardActive]}
      onPress={onToggleExpand}
      onLongPress={onLongPressCard}
      activeOpacity={0.9}
    >
      <View style={styles.expandedContent}>
        <Text style={styles.exerciseName}>{exerciseName}</Text>

        {/* Reference data: %1RM, target RPE, last weight */}
        {(target?.percent || target?.rpe_target || lastWeight != null) && (
          <Text style={styles.referenceText}>
            {[
              target?.percent != null ? `${target.percent}% 1RM` : null,
              target?.rpe_target != null ? `RPE ${target.rpe_target}` : null,
              lastWeight != null ? `Last ${lastWeight} lbs` : null,
            ].filter(Boolean).join('  \u00B7  ')}
          </Text>
        )}

        {/* Set header */}
        <View style={styles.setHeader}>
          <Text style={styles.setHeaderText}>Set</Text>
          {fields.map((field) => (
            <View key={field.type} style={styles.setHeaderCol}>
              <Text style={styles.setHeaderText}>{FIELD_LABELS[field.type]}</Text>
              {field.unit && <Text style={styles.setHeaderUnit}>{field.unit}</Text>}
            </View>
          ))}
          <Text style={styles.setHeaderText}>{''}</Text>
        </View>

        {/* Set rows */}
        {sets.map((set, setIdx) => {
          const isCompleted = set.status === 'completed' || set.status === 'completed_below';
          const isPending = set.status === 'pending';
          const isCurrent = isPending && setIdx === completedCount;
          const isFuture = isPending && setIdx > completedCount;

          return (
            <View
              key={setIdx}
              style={[
                styles.setRow,
                isCurrent && styles.setRowCurrent,
              ]}
            >
              <Text style={[
                styles.setNumber,
                isCurrent && styles.setNumberCurrent,
              ]}>
                {set.setNumber}
              </Text>
              {fields.map((field) => (
                <Text
                  key={field.type}
                  style={[
                    styles.setValue,
                    isCompleted && styles.setValueCompleted,
                    isFuture && styles.setValueFuture,
                  ]}
                  onPress={() => onLongPressSet(setIdx)}
                >
                  {getSetValue(set, field.type)}
                </Text>
              ))}
              <View style={styles.setAction}>
                <TouchableOpacity
                  style={[
                    styles.setBtn,
                    isCompleted && styles.setBtnCompleted,
                    isCurrent && styles.setBtnCurrent,
                  ]}
                  onPress={() => onCompleteSet(setIdx)}
                  onLongPress={() => onLongPressSet(setIdx)}
                >
                  {isCompleted ? (
                    <Text style={styles.setBtnCheck}>{'\u2713'}</Text>
                  ) : (
                    <View style={[
                      styles.setBtnCircle,
                      isCurrent && styles.setBtnCircleCurrent,
                    ]} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* RPE selector (after all sets done) */}
        {allDone && (
          <View style={styles.rpeSection}>
            <View style={styles.rpeLabelRow}>
              <Text style={styles.rpeLabel}>How hard was this?</Text>
            </View>
            <View style={styles.rpeRow}>
              {[6, 7, 8, 9, 10].map(n => (
                <TouchableOpacity
                  key={n}
                  style={[
                    styles.rpeBtn,
                    rpe === n && styles.rpeBtnSelected,
                  ]}
                  onPress={() => onSetRPE(n)}
                >
                  <Text style={[
                    styles.rpeBtnText,
                    rpe === n && styles.rpeBtnTextSelected,
                  ]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Per-exercise note */}
        {noteVisible || note ? (
          <View style={styles.noteSection}>
            <TextInput
              style={styles.noteInput}
              placeholder="Add a note for this exercise..."
              placeholderTextColor={Colors.textMuted}
              value={note ?? ''}
              onChangeText={onNoteChange}
              multiline
            />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addNoteBtn}
            onPress={() => setNoteVisible(true)}
          >
            <Text style={styles.addNoteText}>+ Add note</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  exerciseCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  exerciseCardActive: {
    borderColor: Colors.indigoBorderFaint,
  },

  // Collapsed
  collapsedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  collapsedName: {
    color: Colors.textSecondary,
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  collapsedStatus: {
    color: Colors.textMuted,
    fontSize: FontSize.body,
    fontWeight: '600',
  },
  collapsedStatusDone: {
    color: Colors.green,
  },

  // Expanded
  expandedContent: {
    padding: Spacing.xl,
  },
  exerciseName: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  referenceText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginBottom: Spacing.lg,
  },

  // Set grid
  setHeader: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  setHeaderText: {
    color: Colors.textMuted,
    fontSize: FontSize.sectionLabel,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  setHeaderCol: {
    flex: 1,
    gap: 1,
  },
  setHeaderUnit: {
    color: Colors.textDim,
    fontSize: 9,
    fontWeight: '600' as const,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.surface,
  },
  setRowCurrent: {
    backgroundColor: `${Colors.indigo}08`,
    borderRadius: BorderRadius.button,
    borderTopColor: 'transparent',
  },
  setNumber: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontWeight: '700',
    flex: 1,
  },
  setNumberCurrent: {
    color: Colors.indigo,
  },
  setValue: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: '600',
    flex: 1,
  },
  setValueCompleted: {
    color: Colors.green,
  },
  setValueFuture: {
    color: Colors.textDim,
  },
  setAction: {
    alignItems: 'flex-end',
    width: ComponentSize.setButtonWidth + Spacing.xs,
  },
  setBtn: {
    width: ComponentSize.setButtonWidth,
    height: ComponentSize.setButtonHeight,
    borderRadius: BorderRadius.button,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setBtnCompleted: {
    borderColor: `${Colors.green}40`,
    backgroundColor: `${Colors.green}15`,
  },
  setBtnCurrent: {
    borderColor: Colors.indigo,
    backgroundColor: `${Colors.indigo}15`,
  },
  setBtnCheck: {
    color: Colors.green,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  setBtnCircle: {
    width: Spacing.md,
    height: Spacing.md,
    borderRadius: Spacing.md / 2,
    borderWidth: 2,
    borderColor: Colors.textMuted,
  },
  setBtnCircleCurrent: {
    borderColor: Colors.indigo,
  },

  // RPE
  rpeSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surface,
  },
  rpeLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  rpeLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sectionLabel,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rpeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  rpeBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.button,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  rpeBtnSelected: {
    backgroundColor: Colors.indigo,
    borderColor: Colors.indigo,
  },
  rpeBtnText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  rpeBtnTextSelected: {
    color: Colors.text,
  },

  // Note
  addNoteBtn: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surface,
  },
  addNoteText: {
    color: Colors.textMuted,
    fontSize: FontSize.body,
  },
  noteSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surface,
  },
  noteInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.button,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    minHeight: 36,
  },
});
