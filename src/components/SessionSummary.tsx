import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';

export interface SummaryExercise {
  name: string;
  sets: { weight: number; reps: number; status: string; rpe?: number }[];
  rpe?: number;
  isAdhoc?: boolean;
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
  exercises?: SummaryExercise[];
}

export function SessionSummary({
  exerciseCount, setCount, duration, totalVolume,
  sessionName, weekLabel, notes, notesSaved, onNotesChange,
  exercises,
}: SessionSummaryProps) {
  return (
    <View style={styles.container}>
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
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{exerciseCount}</Text>
          <Text style={styles.statLabel}>Exercises</Text>
        </View>
      </View>

      {/* Exercise breakdown — tap to expand set details */}
      {exercises && exercises.length > 0 && (
        <View style={styles.exerciseSection}>
          <Text style={styles.exerciseSectionLabel}>EXERCISES</Text>
          {exercises.map((ex, i) => (
            <ExerciseRow key={i} exercise={ex} />
          ))}
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
    </View>
  );
}

function ExerciseRow({ exercise }: { exercise: SummaryExercise }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={styles.exerciseRow}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.exerciseNameRow}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <View style={styles.exerciseRightRow}>
          {exercise.rpe != null && (
            <Text style={styles.exerciseRpe}>RPE {exercise.rpe}</Text>
          )}
          <Text style={styles.expandArrow}>{expanded ? '\u25B2' : '\u25BC'}</Text>
        </View>
      </View>
      <Text style={styles.exerciseSets}>
        {exercise.sets.length} {exercise.sets.length === 1 ? 'set' : 'sets'}
        {exercise.sets[0]?.weight > 0 ? ` \u00B7 ${exercise.sets[0].weight} lbs` : ''}
        {exercise.isAdhoc ? ' \u00B7 Ad-hoc' : ''}
      </Text>

      {expanded && (
        <View style={styles.setTable}>
          {/* Header */}
          <View style={styles.setGridHeader}>
            <Text style={[styles.setGridHeaderText, { width: 32 }]}>Set</Text>
            <Text style={[styles.setGridHeaderText, { flex: 1 }]}>Weight</Text>
            <Text style={[styles.setGridHeaderText, { flex: 1 }]}>Reps</Text>
            <Text style={[styles.setGridHeaderText, { width: 40 }]}>RPE</Text>
          </View>
          {/* Rows */}
          {exercise.sets.map((set, si) => (
            <View key={si} style={styles.setGridRow}>
              <Text style={[styles.setGridValue, { width: 32 }]}>{si + 1}</Text>
              <Text style={[styles.setGridValue, { flex: 1 }]}>
                {set.weight > 0 ? set.weight : '\u2014'}
              </Text>
              <Text style={[styles.setGridValue, { flex: 1 }]}>{set.reps}</Text>
              <Text style={[styles.setGridValue, { width: 40 }]}>
                {set.rpe ?? '\u2014'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
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
  exerciseSection: {
    width: '100%',
    marginTop: Spacing.xl,
  },
  exerciseSectionLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sectionLabel,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  exerciseRow: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  exerciseNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  exerciseName: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: '600',
    flex: 1,
  },
  exerciseRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  exerciseRpe: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  expandArrow: {
    color: Colors.textDim,
    fontSize: 8,
  },
  exerciseSets: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },

  // Set table (expanded)
  setTable: {
    marginTop: Spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  setGridHeader: {
    flexDirection: 'row',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  setGridHeaderText: {
    color: Colors.textDim,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  setGridRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: `${Colors.border}40`,
  },
  setGridValue: {
    color: Colors.text,
    fontSize: FontSize.md,
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
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    height: 72,
  },
});
