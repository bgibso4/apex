import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';
import type { PRRecord } from '../db/personal-records';
import type { SessionProtocol } from '../types';
import { formatPRDescription, formatPRName } from '../utils/formatPR';

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

export interface RecentSession {
  id: string;
  name: string;
  dateLabel: string;
  blockName?: string;
  durationMin?: number;
  setCount?: number;
}

export interface SessionSummaryProps {
  exerciseCount: number;
  setCount: number;
  totalSets?: number;
  duration?: string;
  sessionName?: string;
  weekLabel?: string;
  notes?: string;
  notesSaved?: boolean;
  onNotesChange?: (text: string) => void;
  prs?: PRRecord[];
  onDelete?: () => void;
  exercises?: ExerciseBreakdown[];
  protocols?: SessionProtocol[];
  sessionId?: string;
  onViewSession?: (id: string) => void;
  onViewAllWorkouts?: () => void;
  recentSessions?: RecentSession[];
}

export function SessionSummary({
  exerciseCount, setCount, totalSets, duration,
  sessionName, weekLabel, notes, notesSaved, onNotesChange,
  prs, onDelete, exercises,
  protocols,
  sessionId, onViewSession, onViewAllWorkouts, recentSessions,
}: SessionSummaryProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const prCount = prs?.length ?? 0;

  // Calculate notes count from exercises
  const notesCount = exercises?.filter(e => e.note).length ?? 0;

  // Build protocol chips from session protocols
  const protocolChips = (protocols ?? []).map(p => ({
    label: p.protocol_name,
    done: !!p.completed,
  }));

  // Sets compliance string (e.g. "12/15")
  const setsDisplay = totalSets != null ? `${setCount}/${totalSets}` : `${setCount}`;

  return (
    <View style={styles.container}>
      {/* Header with menu button */}
      <View style={styles.header}>
        {onDelete && (
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => setMenuOpen(!menuOpen)}
              testID="menu-button"
            >
              <Ionicons
                name="ellipsis-vertical"
                size={16}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
            {menuOpen && (
              <View style={styles.menuDropdown}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.red} />
                  <Text style={styles.menuItemText}>Delete Workout</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        <Text style={styles.icon}>{'\uD83D\uDCAA'}</Text>
        <Text style={styles.title}>Workout Complete</Text>
        {sessionName && (
          <Text style={styles.subtitle}>
            {sessionName}{weekLabel ? ` \u2014 ${weekLabel}` : ''}
          </Text>
        )}
      </View>

      {/* Summary Row — 3 compact cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{duration ?? '--'}</Text>
          <Text style={styles.summaryLabel} testID="summary-label">Duration</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{setsDisplay}</Text>
          <Text style={styles.summaryLabel} testID="summary-label">Sets</Text>
        </View>
        <View style={[styles.summaryItem, prCount > 0 && styles.summaryItemPR]}>
          <Text style={styles.summaryValue}>
            {prCount}
          </Text>
          <Text style={[styles.summaryLabel, prCount > 0 && styles.summaryLabelAmber]} testID="summary-label">PRs</Text>
        </View>
      </View>

      {/* PR detail cards */}
      {prs && prs.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Personal Records</Text>
          <View style={styles.prCards}>
            {prs.map(pr => (
                <View key={pr.id} style={styles.prCard}>
                  <Text style={styles.prIcon}>{'\uD83C\uDFC6'}</Text>
                  <View style={styles.prInfo}>
                    <Text style={styles.prName}>{formatPRName(pr)}</Text>
                    <Text style={styles.prDetail}>{formatPRDescription(pr)}</Text>
                  </View>
                </View>
            ))}
          </View>
        </>
      )}

      {/* Session Review card */}
      {sessionId && onViewSession && (
        <TouchableOpacity
          style={styles.sessionReview}
          onPress={() => onViewSession(sessionId)}
          activeOpacity={0.7}
          testID="session-review-card"
        >
          <View style={styles.sessionReviewLeft}>
            <Text style={styles.sessionReviewTitle}>Session Review</Text>
            <Text style={styles.sessionReviewSubtitle}>
              {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
              {notesCount > 0 ? ` \u00B7 ${notesCount} with notes` : ''}
            </Text>
          </View>
          <Text style={styles.sessionReviewChevron}>{'\u203A'}</Text>
        </TouchableOpacity>
      )}

      {/* Protocol chips */}
      {protocolChips.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { marginTop: Spacing.xxl }]}>Protocols</Text>
          <View style={styles.protocolChips}>
            {protocolChips.map((p, i) => (
              <View
                key={i}
                style={[styles.chip, p.done ? styles.chipDone : styles.chipMissed]}
              >
                <Text style={[styles.chipText, p.done ? styles.chipTextDone : styles.chipTextMissed]}>
                  {p.done ? '\u2713' : '\u2717'} {p.label}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Session Notes */}
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

      {/* Recent Workouts */}
      {recentSessions && recentSessions.length > 0 && (
        <View style={styles.recentWorkoutsCard} testID="recent-workouts-card">
          <Text style={[styles.sectionLabel, { marginTop: 0 }]}>Recent Workouts</Text>
          <View style={styles.recentWorkouts}>
            {recentSessions.map(s => (
              <TouchableOpacity
                key={s.id}
                style={styles.recentCard}
                onPress={() => onViewSession?.(s.id)}
                activeOpacity={0.7}
              >
                <View style={styles.recentLeft}>
                  <Text style={styles.recentName}>{s.name}</Text>
                  <Text style={styles.recentMeta}>
                    {s.dateLabel}{s.blockName ? ` \u00B7 ${s.blockName}` : ''}
                  </Text>
                </View>
                <View style={styles.recentRight}>
                  {s.durationMin != null && (
                    <Text style={styles.recentDuration}>{s.durationMin}m</Text>
                  )}
                  {s.setCount != null && (
                    <Text style={styles.recentSets}>{s.setCount} sets</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
          {onViewAllWorkouts && (
            <TouchableOpacity style={styles.viewAll} onPress={onViewAllWorkouts}>
              <Text style={styles.viewAllText}>View all workouts {'\u2192'}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: Spacing.xs,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingBottom: Spacing.xl,
    position: 'relative' as const,
  },
  menuContainer: {
    position: 'absolute' as const,
    top: Spacing.sm,
    right: 0,
    zIndex: 10,
  },
  menuBtn: {
    width: 36,
    height: 36,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  menuDropdown: {
    position: 'absolute' as const,
    top: 40,
    right: 0,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xs,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  menuItemText: {
    color: Colors.red,
    fontSize: FontSize.md,
    fontWeight: '600' as const,
  },
  icon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  title: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.base,
    fontWeight: '500',
  },

  // Summary row
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.xl,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.cardInner,
    paddingVertical: Spacing.md + 2, // 14px
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
  },
  summaryValue: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  summaryItemPR: {
    borderColor: `${Colors.amber}33`,
  },
  summaryLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryLabelAmber: {
    color: `${Colors.amber}99`,
  },

  // Section label
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sectionLabel,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xxl,
  },

  // PR Cards
  prCards: {
    gap: 10,
    marginBottom: Spacing.xs,
  },
  prCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: `${Colors.amber}33`,
    borderLeftWidth: 3,
    borderLeftColor: Colors.amber,
    borderRadius: BorderRadius.cardInner,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  prIcon: {
    fontSize: 20,
  },
  prInfo: {
    flex: 1,
  },
  prName: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  prDetail: {
    color: Colors.amber,
    fontSize: FontSize.body,
    fontWeight: '500',
  },

  // Session Review
  sessionReview: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.cardInner,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
  },
  sessionReviewLeft: {
    gap: 2,
  },
  sessionReviewTitle: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  sessionReviewSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.body,
    fontWeight: '500',
  },
  sessionReviewChevron: {
    color: Colors.textMuted,
    fontSize: FontSize.xl,
  },

  // Protocol chips
  protocolChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipDone: {
    backgroundColor: `${Colors.green}15`,
    borderColor: `${Colors.green}30`,
  },
  chipMissed: {
    backgroundColor: `${Colors.textMuted}10`,
    borderColor: `${Colors.textMuted}30`,
  },
  chipText: {
    fontSize: FontSize.body,
    fontWeight: '600',
  },
  chipTextDone: {
    color: Colors.green,
  },
  chipTextMissed: {
    color: Colors.textMuted,
  },

  // Notes
  noteSection: {
    width: '100%',
    marginTop: Spacing.xxl,
  },
  noteLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  noteSaved: {
    color: Colors.green,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  noteLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sectionLabel,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  noteInput: {
    width: '100%',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.cardInner,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    height: 72,
  },

  // Recent workouts
  recentWorkoutsCard: {
    backgroundColor: Colors.cardDeep,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.xxl,
  },
  recentWorkouts: {
    gap: Spacing.sm,
  },
  recentCard: {
    backgroundColor: Colors.cardInset,
    borderRadius: BorderRadius.cardInner,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentLeft: {
    gap: 1,
  },
  recentName: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  recentMeta: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  recentRight: {
    alignItems: 'flex-end',
    gap: 1,
  },
  recentDuration: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  recentSets: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  viewAll: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  viewAllText: {
    color: Colors.indigo,
    fontSize: FontSize.md,
    fontWeight: '600',
  },

});
