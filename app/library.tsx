/**
 * APEX — Program Library Screen
 * Shows bundled programs, completed programs, all-time stats.
 */

import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../src/theme';
import { getAllPrograms, importProgram, getActiveProgram } from '../src/db';
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
          <Text style={styles.logo}>APEX</Text>
          {hasActive && (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={28} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionLabel}>YOUR PROGRAMS</Text>

        {programs.map(p => {
          const isActive = p.status === 'active';
          const isCompleted = p.status === 'completed';
          let def: ProgramDefinition | null = null;
          try { def = JSON.parse(p.definition_json); } catch {}

          return (
            <View key={p.id} style={styles.programCard}>
              <View style={styles.programHeader}>
                <Text style={styles.programName}>{p.name}</Text>
                {isActive && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>ACTIVE</Text>
                  </View>
                )}
                {isCompleted && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.green} />
                )}
              </View>

              <Text style={styles.programMeta}>
                {p.duration_weeks} weeks · Created {p.created_date}
              </Text>

              {/* Block visualization */}
              {def && (
                <View style={styles.blockViz}>
                  {def.program.blocks.map((block, i) => (
                    <View
                      key={i}
                      style={[styles.blockBar, {
                        flex: block.weeks.length,
                        backgroundColor: `${getBlockColor(block)}60`,
                      }]}
                    >
                      <Text style={[styles.blockBarText, { color: getBlockColor(block) }]}>
                        {block.name}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Actions */}
              {p.status === 'inactive' && (
                <TouchableOpacity
                  style={styles.activateButton}
                  onPress={() => router.push({ pathname: '/activate', params: { programId: p.id } })}
                >
                  <Text style={styles.activateButtonText}>Activate</Text>
                </TouchableOpacity>
              )}

              {isActive && (
                <TouchableOpacity
                  style={[styles.activateButton, { backgroundColor: Colors.surface }]}
                  onPress={() => router.back()}
                >
                  <Text style={[styles.activateButtonText, { color: Colors.textSecondary }]}>
                    Return to Dashboard
                  </Text>
                </TouchableOpacity>
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
  scrollContent: { paddingTop: 60, paddingHorizontal: Spacing.lg, paddingBottom: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.xxl,
  },
  logo: { color: Colors.text, fontSize: 28, fontWeight: '800', letterSpacing: 3 },
  sectionLabel: {
    color: Colors.textDim, fontSize: FontSize.xs,
    fontWeight: '700', letterSpacing: 1, marginBottom: Spacing.md,
  },

  programCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  programHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  programName: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '700' },
  programMeta: { color: Colors.textDim, fontSize: FontSize.sm, marginTop: 4, marginBottom: Spacing.md },
  activeBadge: {
    backgroundColor: Colors.indigoMuted, paddingHorizontal: Spacing.sm, paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  activeBadgeText: { color: Colors.indigo, fontSize: FontSize.xs, fontWeight: '700' },

  blockViz: { flexDirection: 'row', gap: 3, marginBottom: Spacing.lg },
  blockBar: {
    height: 28, borderRadius: 4,
    justifyContent: 'center', alignItems: 'center',
  },
  blockBarText: { fontSize: 9, fontWeight: '700' },

  activateButton: {
    backgroundColor: Colors.indigo, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md, alignItems: 'center',
  },
  activateButtonText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyText: { color: Colors.textDim, fontSize: FontSize.md, marginTop: Spacing.md },
});
