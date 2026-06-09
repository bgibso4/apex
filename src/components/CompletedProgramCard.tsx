/**
 * APEX — Completed Program Card
 *
 * Home screen card shown when a program has been completed.
 * Replicates the gold-accented card from the locked mockup:
 * docs/mockups/program-complete-home-2026-06-07.html
 *
 * Features:
 *   - Thin gold (amber) top accent line
 *   - Gold "✓ COMPLETED" eyebrow label
 *   - Program name as large hero text
 *   - Date range + week count line
 *   - Hairline divider
 *   - Two inline stats: PRs (amber) and Adherence% (white)
 *   - "View full summary →" pressable affordance
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';

export interface CompletedProgramCardProps {
  programName: string;
  dateRangeLabel: string;
  prs: number;
  adherencePct: number;
  onViewSummary: () => void;
}

export function CompletedProgramCard({
  programName,
  dateRangeLabel,
  prs,
  adherencePct,
  onViewSummary,
}: CompletedProgramCardProps) {
  return (
    <View style={styles.card}>
      {/* Gold top accent line */}
      <View style={styles.accentLine} />

      {/* Eyebrow — "✓ COMPLETED" */}
      <Text style={styles.eyebrow}>✓  Completed</Text>

      {/* Program name — hero */}
      <Text style={styles.programName} numberOfLines={2}>{programName}</Text>

      {/* Date range */}
      <Text style={styles.dateRange}>{dateRangeLabel}</Text>

      {/* Hairline divider */}
      <View style={styles.divider} />

      {/* Stats row: PRs and Adherence */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValueAmber}>{prs}</Text>
          <Text style={styles.statLabel}> PRs</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValueWhite}>{adherencePct}%</Text>
          <Text style={styles.statLabel}> Adherence</Text>
        </View>
      </View>

      {/* View full summary affordance */}
      <Pressable
        accessibilityRole="button"
        onPress={onViewSummary}
        style={({ pressed }) => [
          styles.summaryButton,
          pressed && styles.summaryButtonPressed,
        ]}
      >
        <Text style={styles.summaryButtonText}>View full summary  →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    marginBottom: Spacing.xxl,
    overflow: 'hidden',
  },

  // Thin amber accent line spanning the full card top (via negative margin + absolute height)
  accentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.amber,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },

  // "✓ COMPLETED" eyebrow
  eyebrow: {
    fontSize: FontSize.xs,
    letterSpacing: 3.5,
    color: Colors.amber,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: Spacing.lg,
  },

  // Program name — large hero
  programName: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.9,
    lineHeight: 34,
    marginBottom: 11,
  },

  // Date range line
  dateRange: {
    fontSize: FontSize.base,
    color: Colors.textDim,
    letterSpacing: 0.2,
    marginBottom: Spacing.xxl,
  },

  // Hairline divider
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.xxl,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 40,
    marginBottom: Spacing.xxl,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValueAmber: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.amber,
  },
  statValueWhite: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    fontSize: FontSize.xl,
    color: Colors.textSecondary,
  },

  // "View full summary →" affordance
  summaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: BorderRadius.cardInner,
    backgroundColor: Colors.indigoMuted,
    borderWidth: 1,
    borderColor: Colors.indigoBorderFaint,
  },
  summaryButtonPressed: {
    opacity: 0.75,
  },
  summaryButtonText: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.indigoLight,
  },
});
