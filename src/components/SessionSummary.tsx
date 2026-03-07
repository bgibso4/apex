import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';
import type { PRRecord } from '../db/personal-records';

export interface ExerciseBreakdown {
  exerciseName: string;
  sets: Array<{
    setNumber: number;
    actualWeight: number;
    actualReps: number;
    status: string;
  }>;
  rpe?: number;
  note?: string;
}

export interface SessionSummaryProps {
  exerciseCount: number;
  setCount: number;
  duration?: string;
  totalVolume?: number;
  sessionName?: string;
  weekLabel?: string;
  notes?: string;
  notesSaved?: boolean;
  onNotesChange?: (text: string) => void;
  prs?: PRRecord[];
  editMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  exercises?: ExerciseBreakdown[];
  onUpdateSet?: (exerciseIdx: number, setIdx: number, weight: number, reps: number) => void;
  warmup?: { rope: boolean; ankle: boolean; hipIr: boolean };
  conditioningFinisher?: string | null;
  conditioningDone?: boolean;
}

function humanizeId(id: string): string {
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatPRDescription(pr: PRRecord): { name: string; detail: string } {
  const name = pr.exercise_name ?? humanizeId(pr.exercise_id);
  if (pr.record_type === 'e1rm') {
    const diff = pr.previous_value != null ? ` (+${Math.round(pr.value - pr.previous_value)} lbs)` : '';
    return { name, detail: `New est. 1RM: ${Math.round(pr.value)} lbs${diff}` };
  }
  return { name, detail: `${Math.round(pr.value)} lbs \u00D7 ${pr.rep_count} (best at ${pr.rep_count} reps)` };
}

export function SessionSummary({
  exerciseCount, setCount, duration, totalVolume,
  sessionName, weekLabel, notes, notesSaved, onNotesChange,
  prs, editMode, onEdit, onDelete, exercises, onUpdateSet,
  warmup, conditioningFinisher, conditioningDone,
}: SessionSummaryProps) {
  const prCount = prs?.length ?? 0;

  return (
    <View style={styles.container}>
      {/* Header with edit button */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }} />
        {onEdit && (
          <TouchableOpacity onPress={onEdit} testID="edit-button">
            <Ionicons
              name={editMode ? 'checkmark-circle' : 'pencil'}
              size={22}
              color={editMode ? Colors.green : Colors.indigo}
            />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.icon}>{'\uD83D\uDCAA'}</Text>
      <Text style={styles.title}>Workout Complete</Text>
      {sessionName && (
        <Text style={styles.subtitle}>
          {sessionName}{weekLabel ? ` \u2014 ${weekLabel}` : ''}
        </Text>
      )}

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{duration ?? '--'}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{setCount}</Text>
          <Text style={styles.statLabel}>Sets</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {totalVolume != null ? totalVolume.toLocaleString() : exerciseCount}
          </Text>
          <Text style={styles.statLabel}>
            {totalVolume != null ? 'Total lbs' : 'Exercises'}
          </Text>
        </View>
        <View style={[styles.statCard, prCount > 0 && styles.statCardPR]}>
          <Text style={[styles.statValue, prCount > 0 && styles.statValuePR]}>{prCount}</Text>
          <Text style={[styles.statLabel, prCount > 0 && styles.statLabelPR]}>PRs</Text>
        </View>
      </View>

      {/* PR detail cards */}
      {prs && prs.length > 0 && (
        <View style={styles.prSection}>
          {prs.map(pr => {
            const { name, detail } = formatPRDescription(pr);
            return (
              <View key={pr.id} style={styles.prCard}>
                <Text style={styles.prName}>{name}</Text>
                <Text style={styles.prDetail}>{detail}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Exercise breakdown */}
      {exercises && exercises.length > 0 && (
        <View style={styles.exerciseBreakdown}>
          <Text style={styles.breakdownTitle}>EXERCISES</Text>
          {exercises.map((ex, exIdx) => (
            <View key={exIdx} style={styles.breakdownCard}>
              <View style={styles.breakdownHeader}>
                <Text style={styles.breakdownName}>{ex.exerciseName}</Text>
                {ex.rpe != null && (
                  <Text style={styles.breakdownRpe}>RPE {ex.rpe}</Text>
                )}
              </View>
              {ex.sets.map((set, setIdx) => (
                <View key={setIdx} style={styles.breakdownSetRow}>
                  <Text style={styles.breakdownSetNum}>Set {set.setNumber}</Text>
                  {set.status === 'pending' ? (
                    <Text style={styles.breakdownSkipped}>Skipped</Text>
                  ) : editMode ? (
                    <View style={styles.breakdownEditRow}>
                      <TextInput
                        style={styles.breakdownEditInput}
                        defaultValue={String(set.actualWeight)}
                        keyboardType="numeric"
                        onEndEditing={(e) => {
                          const newWeight = parseFloat(e.nativeEvent.text) || set.actualWeight;
                          onUpdateSet?.(exIdx, setIdx, newWeight, set.actualReps);
                        }}
                      />
                      <Text style={styles.breakdownSetDetail}> lbs × </Text>
                      <TextInput
                        style={styles.breakdownEditInput}
                        defaultValue={String(set.actualReps)}
                        keyboardType="numeric"
                        onEndEditing={(e) => {
                          const newReps = parseInt(e.nativeEvent.text) || set.actualReps;
                          onUpdateSet?.(exIdx, setIdx, set.actualWeight, newReps);
                        }}
                      />
                    </View>
                  ) : (
                    <Text style={styles.breakdownSetDetail}>
                      {set.actualWeight} lbs × {set.actualReps}
                    </Text>
                  )}
                </View>
              ))}
              {ex.note ? (
                <Text style={styles.breakdownNote}>{ex.note}</Text>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {/* Warmup & Conditioning summary */}
      {(warmup || conditioningFinisher) && (
        <View style={styles.checklistSection}>
          {warmup && (
            <>
              <Text style={styles.checklistTitle}>WARM UP</Text>
              <View style={styles.checklistRow}>
                <Ionicons name={warmup.rope ? 'checkmark-circle' : 'close-circle-outline'} size={16}
                  color={warmup.rope ? Colors.green : Colors.textMuted} />
                <Text style={[styles.checklistLabel, !warmup.rope && styles.checklistSkipped]}>Jump Rope</Text>
              </View>
              <View style={styles.checklistRow}>
                <Ionicons name={warmup.ankle ? 'checkmark-circle' : 'close-circle-outline'} size={16}
                  color={warmup.ankle ? Colors.green : Colors.textMuted} />
                <Text style={[styles.checklistLabel, !warmup.ankle && styles.checklistSkipped]}>Ankle Dorsiflexion</Text>
              </View>
              <View style={styles.checklistRow}>
                <Ionicons name={warmup.hipIr ? 'checkmark-circle' : 'close-circle-outline'} size={16}
                  color={warmup.hipIr ? Colors.green : Colors.textMuted} />
                <Text style={[styles.checklistLabel, !warmup.hipIr && styles.checklistSkipped]}>Hip IR Mobility</Text>
              </View>
            </>
          )}
          {conditioningFinisher && (
            <>
              <Text style={[styles.checklistTitle, warmup && { marginTop: Spacing.lg }]}>CONDITIONING</Text>
              <View style={styles.checklistRow}>
                <Ionicons name={conditioningDone ? 'checkmark-circle' : 'close-circle-outline'} size={16}
                  color={conditioningDone ? Colors.green : Colors.textMuted} />
                <Text style={[styles.checklistLabel, !conditioningDone && styles.checklistSkipped]}>
                  {conditioningFinisher}
                </Text>
              </View>
            </>
          )}
        </View>
      )}

      <View style={styles.noteSection}>
        <View style={styles.noteLabelRow}>
          <Text style={styles.noteLabel}>Session Notes (optional)</Text>
          {notesSaved && notes && notes.length > 0 && (
            <Text style={styles.noteSaved}>{'\u2713'} Saved</Text>
          )}
        </View>
        <TextInput
          style={styles.noteInput}
          placeholder="How did the session feel overall?"
          placeholderTextColor={Colors.textSecondary}
          value={notes}
          onChangeText={onNotesChange}
          multiline
          textAlignVertical="top"
        />
      </View>

      {/* Delete button (edit mode only) */}
      {editMode && onDelete && (
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
          <Text style={styles.deleteText}>Delete Workout</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginBottom: Spacing.sm,
  },
  editBtn: {
    color: Colors.indigo,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  icon: {
    fontSize: 48,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.sectionTitle,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginBottom: Spacing.xxxl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    width: '100%',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.cardInner,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    color: Colors.text,
    fontSize: FontSize.sectionTitle,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sectionLabel,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statCardPR: {
    borderColor: `${Colors.amber}40`,
    backgroundColor: `${Colors.amber}10`,
  },
  statValuePR: {
    color: Colors.amber,
  },
  statLabelPR: {
    color: Colors.amber,
  },
  prSection: {
    width: '100%',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  prCard: {
    backgroundColor: `${Colors.amber}10`,
    borderWidth: 1,
    borderColor: `${Colors.amber}30`,
    borderRadius: BorderRadius.cardInner,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: 2,
  },
  prName: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: '700',
  },
  prDetail: {
    color: Colors.amber,
    fontSize: FontSize.body,
    fontWeight: '500',
  },
  deleteBtn: {
    marginTop: Spacing.xxl,
    paddingVertical: Spacing.md,
  },
  deleteText: {
    color: Colors.red,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  exerciseBreakdown: {
    width: '100%',
    marginTop: Spacing.xl,
  },
  breakdownTitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sectionLabel,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  breakdownCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.cardInner,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  breakdownName: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  breakdownRpe: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  breakdownSetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  breakdownSetNum: {
    color: Colors.textMuted,
    fontSize: FontSize.body,
  },
  breakdownSetDetail: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    fontWeight: '600',
  },
  breakdownSkipped: {
    color: Colors.textMuted,
    fontSize: FontSize.body,
    fontStyle: 'italic',
  },
  breakdownEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownEditInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.button,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    color: Colors.text,
    fontSize: FontSize.body,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'center',
  },
  breakdownNote: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.surface,
  },
  checklistSection: {
    width: '100%',
    marginTop: Spacing.xl,
  },
  checklistTitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sectionLabel,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 3,
  },
  checklistLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    fontWeight: '500',
  },
  checklistSkipped: {
    color: Colors.textMuted,
  },
  noteSection: {
    width: '100%',
    marginTop: Spacing.xl,
  },
  noteLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  noteSaved: {
    color: Colors.green,
    fontSize: FontSize.sectionLabel,
    fontWeight: '600',
  },
  noteLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sectionLabel,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noteInput: {
    width: '100%',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md + 2, // 14px
    paddingHorizontal: Spacing.lg,
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    height: 72,
  },
});
