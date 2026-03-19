/**
 * APEX — Program Library Screen
 * Shows bundled programs, completed programs, all-time stats.
 */

import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, ComponentSize } from '../src/theme';
import { getAllPrograms, importProgram, getActiveProgram, activateProgram } from '../src/db';
import { getBlockColor } from '../src/utils/program';
import type { Program, ProgramDefinition } from '../src/types';

// Bundled program — loaded on first launch
import FA_V2 from '../src/data/functional-athlete-v2.json';

export default function LibraryScreen() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [hasActive, setHasActive] = useState(false);

  const loadData = useCallback(async () => {
    const all = await getAllPrograms();
    setPrograms(all);

    const active = await getActiveProgram();
    setHasActive(!!active);

    // Auto-import bundled program if nothing exists
    if (all.length === 0) {
      await importProgram(FA_V2 as unknown as ProgramDefinition);
      const refreshed = await getAllPrograms();
      setPrograms(refreshed);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Programs</Text>
          {hasActive && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={16} color={Colors.textDim} />
            </TouchableOpacity>
          )}
        </View>

        {/* Program cards */}
        {programs.map(p => {
          const isActive = p.status === 'active';
          const isCompleted = p.status === 'completed';
          let def: ProgramDefinition | null = null;
          try { def = JSON.parse(p.definition_json); } catch {}

          return (
            <View
              key={p.id}
              style={[
                styles.programCard,
                isActive && styles.programCardActive,
                isCompleted && styles.programCardCompleted,
              ]}
            >
              <View style={styles.programHeader}>
                <Text style={styles.programName}>{p.name}</Text>
                {isActive && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>ACTIVE</Text>
                  </View>
                )}
                {isCompleted && (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedBadgeText}>COMPLETED</Text>
                  </View>
                )}
              </View>

              <Text style={styles.programDuration}>
                {p.duration_weeks} weeks
              </Text>

              {/* Block timeline */}
              {def && (
                <View style={styles.blockTimeline}>
                  {def.program.blocks.map((block, i) => (
                    <View
                      key={i}
                      style={[styles.blockSegment, {
                        flex: block.weeks.length,
                        backgroundColor: `${getBlockColor(block)}30`,
                      }]}
                    >
                      <Text style={[styles.blockSegmentText, {
                        color: 'rgba(255,255,255,0.5)',
                      }]}>
                        {block.name.toUpperCase()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Block detail list */}
              {def && (
                <View style={styles.blockDetailList}>
                  {def.program.blocks.map((block, i) => (
                    <View key={i} style={styles.blockDetailRow}>
                      <View style={[styles.blockDot, {
                        backgroundColor: getBlockColor(block),
                      }]} />
                      <Text style={styles.blockDetailName}>{block.name}</Text>
                      <Text style={styles.blockDetailWeeks}>
                        {block.weeks.length} weeks
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Actions */}
              {p.status === 'inactive' && (
                <TouchableOpacity
                  style={styles.activateButton}
                  onPress={async () => {
                    await activateProgram(p.id);
                    router.back();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.activateButtonText}>Activate</Text>
                </TouchableOpacity>
              )}

              {isActive && (
                <View style={styles.activeIndicator}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.green} />
                  <Text style={styles.activeIndicatorText}>Currently Active</Text>
                </View>
              )}
            </View>
          );
        })}

        {programs.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Loading programs...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: Spacing.screenTop,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.screenBottom,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  closeButton: {
    width: Spacing.xxxl,
    height: Spacing.xxxl,
    borderRadius: Spacing.xxxl / 2,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Program cards
  programCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.cardPaddingCompact,
    marginBottom: Spacing.md,
  },
  programCardActive: {
    borderColor: Colors.greenBorderFaint,
  },
  programCardCompleted: {
    opacity: 0.7,
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  programName: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    flex: 1,
  },
  programDuration: {
    color: Colors.textDim,
    fontSize: FontSize.body,
    marginBottom: Spacing.md + 2, // 14px
  },
  activeBadge: {
    backgroundColor: Colors.greenFaint,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  activeBadgeText: {
    color: Colors.green,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  completedBadge: {
    backgroundColor: `${Colors.textMuted}18`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  completedBadgeText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Block timeline
  blockTimeline: {
    flexDirection: 'row',
    gap: 2,
    height: ComponentSize.timelineHeightSmall,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  blockSegment: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockSegmentText: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Block detail list
  blockDetailList: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  blockDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md - 2, // 10px
    paddingVertical: Spacing.sm - 2, // 6px
  },
  blockDot: {
    width: Spacing.md - 2, // 10px
    height: Spacing.md - 2,
    borderRadius: BorderRadius.xs,
    flexShrink: 0,
  },
  blockDetailName: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    fontWeight: '600',
    flex: 1,
  },
  blockDetailWeeks: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },

  // Activate button
  activateButton: {
    paddingVertical: Spacing.md + 2, // 14px
    backgroundColor: Colors.indigo,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  activateButtonText: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: '700',
  },

  // Active indicator
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2, // 14px
    backgroundColor: `${Colors.green}10`,
    borderWidth: 1,
    borderColor: Colors.greenBorderFaint,
    borderRadius: BorderRadius.md,
  },
  activeIndicatorText: {
    color: Colors.green,
    fontSize: FontSize.md,
    fontWeight: '600',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    color: Colors.textDim,
    fontSize: FontSize.md,
    marginTop: Spacing.md,
  },
});
