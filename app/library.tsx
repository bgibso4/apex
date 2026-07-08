/**
 * APEX — Program Library Screen
 * Catalog of selectable programs: tap a card to select, floating button activates.
 */

import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, FadeInUp, FadeOutDown, Easing } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Colors, Spacing, FontSize, BorderRadius, ComponentSize } from '../src/theme';
import { getAllPrograms, importProgram, getActiveProgram, activateProgram, restartProgram } from '../src/db';
import { getBlockColor, buildProgramCatalog } from '../src/utils/program';
import type { Program, ProgramDefinition } from '../src/types';

// Bundled program — loaded on first launch
import FA_V2 from '../src/data/functional-athlete.json';

export default function LibraryScreen() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [hasActive, setHasActive] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const catalog = buildProgramCatalog(programs);
  const selected = catalog.find(e => e.program.id === selectedId && e.action) ?? null;

  const handleActivate = async () => {
    if (!selected?.action) return;
    if (selected.action.type === 'restart') {
      await restartProgram(selected.action.programId);
    } else {
      await activateProgram(selected.action.programId);
    }
    router.back();
  };

  const loadData = useCallback(async () => {
    const all = await getAllPrograms();
    setPrograms(all);

    const active = await getActiveProgram();
    setHasActive(!!active);

    // Auto-import bundled program if it doesn't exist yet (by bundled_id or name)
    const bundledDef = FA_V2 as unknown as ProgramDefinition;
    const bundledId = bundledDef.program.id;
    const bundledName = bundledDef.program.name;
    const alreadyImported = all.some(p => {
      if (bundledId && p.bundled_id === bundledId) return true;
      return p.name === bundledName;
    });
    if (!alreadyImported) {
      await importProgram(bundledDef);
      const refreshed = await getAllPrograms();
      setPrograms(refreshed);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
    // Reset selection whenever the screen is left
    return () => setSelectedId(null);
  }, [loadData]));

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

        {/* Program catalog — one card per program, active first */}
        {catalog.map(({ program: p, isActive, action }) => {
          let def: ProgramDefinition | null = null;
          try { def = JSON.parse(p.definition_json); } catch {}
          const isSelected = selected?.program.id === p.id;

          return (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.programCard,
                isActive && styles.programCardActive,
                isSelected && styles.programCardSelected,
              ]}
              onPress={() => setSelectedId(prev => (prev === p.id ? null : p.id))}
              disabled={!action}
              activeOpacity={0.9}
            >
              <View style={styles.programHeader}>
                <Text style={styles.programName}>{p.name}</Text>
                {isActive && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>ACTIVE</Text>
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
                      }]} numberOfLines={1}>
                        {block.name.substring(0, 3).toUpperCase()}
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

              {isActive && (
                <View style={styles.activeIndicator}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.green} />
                  <Text style={styles.activeIndicatorText}>Currently Active</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {programs.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Loading programs...</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Activate — appears when a program is selected */}
      {selected && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          pointerEvents="none"
          style={styles.scrim}
        >
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id="libraryScrim" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={Colors.bg} stopOpacity="0" />
                <Stop offset="0.7" stopColor={Colors.bg} stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#libraryScrim)" />
          </Svg>
        </Animated.View>
      )}
      {selected && (
        <Animated.View
          entering={FadeInUp.duration(200)
            .easing(Easing.out(Easing.cubic))
            .withInitialValues({ opacity: 0, transform: [{ translateY: 15 }] })}
          exiting={FadeOutDown.duration(150)}
          pointerEvents="box-none"
          style={styles.floatWrap}
        >
          <TouchableOpacity
            style={styles.floatButton}
            onPress={handleActivate}
            activeOpacity={0.85}
          >
            <Text style={styles.floatButtonText}>Activate</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: Spacing.screenTop,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: ComponentSize.floatingButtonClearance, // last card clears the floating button
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
  programCardSelected: {
    borderColor: Colors.indigo,
    backgroundColor: Colors.cardHover,
    shadowColor: Colors.indigo,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
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

  // Floating Activate overlay
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: ComponentSize.floatingScrimHeight,
  },
  floatWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Spacing.screenBottom,
    alignItems: 'center',
  },
  floatButton: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl + Spacing.xxxl, // 56px — content-width pill
    backgroundColor: Colors.indigo,
    borderRadius: BorderRadius.pill,
    shadowColor: Colors.indigo,
    shadowOpacity: 0.4,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  floatButtonText: {
    color: Colors.text,
    fontSize: FontSize.lg,
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
