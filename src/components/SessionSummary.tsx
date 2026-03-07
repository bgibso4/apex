import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';

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
}

export function SessionSummary({
  exerciseCount, setCount, duration, totalVolume,
  sessionName, weekLabel, notes, notesSaved, onNotesChange,
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
