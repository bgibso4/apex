import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';
import type { PRRecord } from '../db/personal-records';

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
}

function formatPRDescription(pr: PRRecord): string {
  if (pr.record_type === 'e1rm') {
    const diff = pr.previous_value != null ? ` (+${Math.round(pr.value - pr.previous_value)} lbs)` : '';
    return `${pr.exercise_name ?? pr.exercise_id} — New est. 1RM: ${Math.round(pr.value)} lbs${diff}`;
  }
  return `${pr.exercise_name ?? pr.exercise_id} — ${Math.round(pr.value)} lbs × ${pr.rep_count} (best at ${pr.rep_count} reps)`;
}

export function SessionSummary({
  exerciseCount, setCount, duration, totalVolume,
  sessionName, weekLabel, notes, notesSaved, onNotesChange,
  prs, editMode, onEdit, onDelete,
}: SessionSummaryProps) {
  const prCount = prs?.length ?? 0;

  return (
    <View style={styles.container}>
      {/* Header with edit button */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }} />
        {onEdit && (
          <TouchableOpacity onPress={onEdit}>
            <Text style={styles.editBtn}>{editMode ? 'Save' : 'Edit'}</Text>
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
          {prs.map(pr => (
            <View key={pr.id} style={styles.prCard}>
              <Text style={styles.prText}>{formatPRDescription(pr)}</Text>
            </View>
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
  },
  prText: {
    color: Colors.amber,
    fontSize: FontSize.body,
    fontWeight: '600',
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
