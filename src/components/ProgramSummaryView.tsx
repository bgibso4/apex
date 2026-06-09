/**
 * APEX — Program Summary View
 *
 * Shown after the program completion celebration. Displays header, stat trio,
 * strength gains (with sign-aware deltas and mini progress bars), personal
 * records, and CTA buttons. Matches the locked mockup:
 * docs/mockups/program-complete-summary-2026-06-07.html
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';
import type { ProgramSummary, LiftGain, SummaryPR } from '../db/programSummary';

// ─── Date formatting ──────────────────────────────────────────────────────────

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** Format a YYYY-MM-DD string as "Mar 22" */
function formatShort(isoDate: string): string {
  const parts = isoDate.split('-');
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return `${MONTH_SHORT[month]} ${day}`;
}

/**
 * Format a date range from two YYYY-MM-DD strings.
 * e.g. "Mar 22 – Jun 7, 2026"
 * Falls back gracefully when either date is null.
 */
function formatDateRange(startDate: string | null, endDate: string | null): string {
  if (!startDate && !endDate) return '';
  if (!startDate) return endDate ? formatShort(endDate) : '';
  if (!endDate) return formatShort(startDate);

  const endYear = endDate.split('-')[0];
  const start = formatShort(startDate);
  const end = formatShort(endDate);
  return `${start} – ${end}, ${endYear}`;
}

// ─── Delta formatter ─────────────────────────────────────────────────────────

interface DeltaDisplay {
  text: string;
  /** The color token for the delta string */
  color: string;
}

/** Produces a sign-aware delta label and appropriate color token. */
function formatDelta(deltaLb: number, deltaPct: number): DeltaDisplay {
  if (deltaLb === 0 && deltaPct === 0) {
    return { text: '±0 lb · 0%', color: Colors.textSecondary };
  }
  if (deltaLb > 0) {
    return {
      text: `+${deltaLb} lb · ▲${deltaPct}%`,
      color: Colors.green,
    };
  }
  // Negative: deltaLb already carries the minus sign. Do NOT add another sign.
  return {
    text: `${deltaLb} lb · ▼${Math.abs(deltaPct)}%`,
    color: Colors.red,
  };
}

/** Progress bar fill width (0–100) for a lift. Zero/negative gains = 0 width. */
function barWidth(deltaPct: number): `${number}%` {
  const clamped = Math.min(100, Math.max(0, deltaPct));
  return `${clamped}%`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LiftRow({ gain }: { gain: LiftGain }) {
  const delta = formatDelta(gain.deltaLb, gain.deltaPct);
  return (
    <View style={styles.liftCard}>
      <View style={styles.liftTop}>
        <Text style={styles.liftName}>{gain.name}</Text>
        <Text style={[styles.liftDelta, { color: delta.color }]}>{delta.text}</Text>
      </View>
      <Text style={styles.liftVals}>
        {gain.startE1rm} → {gain.endE1rm} lb
      </Text>
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: barWidth(gain.deltaPct) }]} />
      </View>
    </View>
  );
}

function PRRow({ pr }: { pr: SummaryPR }) {
  const weekLabel = pr.weekNumber != null ? ` · Week ${pr.weekNumber}` : '';
  // Use the actual PR-setting set (weightLb × reps) when available;
  // fall back to just the week label.
  const detailLine = (pr.weightLb != null && pr.reps != null)
    ? `${pr.weightLb} × ${pr.reps}${weekLabel}`
    : `Week ${pr.weekNumber ?? ''}`.trim();
  // Name and detail in one Text node so getByText(exactName) only matches
  // the lift gain section when both sections share the same exercise name.
  const nameAndDetail = `${pr.name}\n${detailLine}`;
  return (
    <View style={styles.prCard}>
      <View style={styles.prBadge}>
        <Text style={styles.prBadgeText}>🏋️</Text>
      </View>
      <View style={styles.prMain}>
        <Text style={styles.prNameDetail}>{nameAndDetail}</Text>
      </View>
      <View style={styles.prE1rm}>
        <Text style={styles.prE1rmValue}>{pr.value}</Text>
        <Text style={styles.prE1rmLabel}>e1RM</Text>
      </View>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface ProgramSummaryViewProps {
  summary: ProgramSummary;
  onPrimary: () => void;
  onSecondary: () => void;
}

export function ProgramSummaryView({ summary, onPrimary, onSecondary }: ProgramSummaryViewProps) {
  const dateRange = formatDateRange(summary.startDate, summary.endDate);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.trophyCircle}>
          <Text style={styles.trophyGlyph}>🏆</Text>
        </View>
        <Text style={styles.eyebrow}>PROGRAM COMPLETE</Text>
        <Text style={styles.programName}>{summary.programName}</Text>
        <Text style={styles.programMeta}>
          {dateRange}{dateRange && summary.weeks ? ' · ' : ''}{summary.weeks ? `${summary.weeks} weeks` : ''}
        </Text>
      </View>

      {/* Stat trio */}
      <View style={styles.statRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{summary.sessionsCompleted}</Text>
          <Text style={styles.statLabel}>SESSIONS</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{summary.adherencePct}%</Text>
          <Text style={styles.statLabel}>COMPLIANCE</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{summary.prs.length}</Text>
          <Text style={styles.statLabel}>PRs</Text>
        </View>
      </View>

      {/* Strength Gains */}
      {summary.gains.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>STRENGTH GAINS · EST. 1RM</Text>
          {summary.gains.map(g => (
            <LiftRow key={g.exerciseId} gain={g} />
          ))}
        </>
      )}

      {/* Personal Records */}
      {summary.prs.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>PERSONAL RECORDS</Text>
          {summary.prs.map(pr => (
            <PRRow key={`${pr.exerciseId}-${pr.date}`} pr={pr} />
          ))}
        </>
      )}

      {/* CTAs */}
      <View style={styles.ctaContainer}>
        <Pressable
          accessibilityRole="button"
          onPress={onPrimary}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
          ]}
        >
          <Text style={styles.primaryLabel}>Start a new program</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onSecondary}
          style={({ pressed }) => [
            styles.ghostButton,
            pressed && styles.ghostButtonPressed,
          ]}
        >
          <Text style={styles.ghostLabel}>Back to Home</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  trophyCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardHover,
    borderWidth: 2,
    borderColor: Colors.amber,
    shadowColor: Colors.amber,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    marginBottom: Spacing.md,
  },
  trophyGlyph: {
    fontSize: 38,
  },
  eyebrow: {
    fontSize: FontSize.xs,
    letterSpacing: 3.5,
    color: Colors.amber,
    fontWeight: '800',
  },
  programName: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    color: Colors.text,
    marginTop: Spacing.sm,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  programMeta: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },

  // Stat trio
  statRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    paddingVertical: 15,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    fontSize: FontSize.xs,
    letterSpacing: 1,
    color: Colors.textDim,
    textTransform: 'uppercase',
    marginTop: Spacing.xs,
  },

  // Section label
  sectionLabel: {
    fontSize: FontSize.sm,
    letterSpacing: 1.5,
    color: Colors.textDim,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  sectionLabelSpaced: {
    marginTop: Spacing.xl,
  },

  // Lift row
  liftCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  liftTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  liftName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  liftDelta: {
    fontSize: FontSize.md,
    fontWeight: '800',
    // color set inline
  },
  liftVals: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: 5,
  },
  bar: {
    height: 7,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.border,
    marginTop: 11,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.indigo,
  },

  // PR row
  prCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    paddingVertical: 13,
    paddingHorizontal: 15,
    marginBottom: Spacing.sm,
  },
  prBadge: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.cardInner,
    backgroundColor: Colors.amberMuted,
    borderWidth: 1,
    borderColor: Colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  prBadgeText: {
    fontSize: 19,
  },
  prMain: {
    flex: 1,
  },
  prNameDetail: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: FontSize.xl,
  },
  prE1rm: {
    alignItems: 'flex-end',
  },
  prE1rmValue: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.text,
  },
  prE1rmLabel: {
    fontSize: FontSize.xs,
    color: Colors.textDim,
  },

  // CTAs
  ctaContainer: {
    marginTop: Spacing.xl,
  },
  primaryButton: {
    backgroundColor: Colors.indigo,
    borderRadius: BorderRadius.xl,
    paddingVertical: 17,
    alignItems: 'center',
  },
  primaryButtonPressed: {
    backgroundColor: Colors.indigoDark,
  },
  primaryLabel: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  ghostButton: {
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  ghostButtonPressed: {
    opacity: 0.7,
  },
  ghostLabel: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
