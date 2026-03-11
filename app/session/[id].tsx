/**
 * APEX — Session Detail (Past Workout View)
 * Read-only view of a completed workout session.
 */

import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import {
  getSessionById, getSetLogsForSession, getExerciseInfo, getActiveProgram,
  getExerciseNotesForSession,
} from '../../src/db';
import { getBlockForWeek, getBlockColor } from '../../src/utils/program';
import { getFieldsForExercise, FIELD_LABELS } from '../../src/types/fields';
import type { InputField } from '../../src/types/fields';
import type { Session, SetLog } from '../../src/types';

const DAY_FULL_NAMES: Record<string, string> = {
  sunday: 'Sunday', monday: 'Monday', tuesday: 'Tuesday',
  wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday',
};

type ExerciseGroup = {
  exerciseId: string;
  exerciseName: string;
  isAdhoc: boolean;
  sets: SetLog[];
  inputFields: InputField[];
};

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroup[]>([]);
  const [dateLabel, setDateLabel] = useState('');
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({});

  useFocusEffect(useCallback(() => {
    if (!id) return;
    (async () => {
      const s = await getSessionById(id);
      if (!s) return;
      setSession(s);

      // Build date label: "Wednesday, Mar 4 · Week 6 Strength"
      const sessionDate = new Date(s.date);
      const dayName = DAY_FULL_NAMES[s.scheduled_day] ?? s.scheduled_day;
      const monthDay = sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Get block name from program
      const program = await getActiveProgram();
      let blockLabel = s.block_name;
      if (program) {
        const block = getBlockForWeek(program.definition.program.blocks, s.week_number);
        if (block) blockLabel = block.name;
      }
      setDateLabel(`${dayName}, ${monthDay} · Week ${s.week_number} ${blockLabel}`);

      // Get set logs, exercise notes, and group by exercise
      const [setLogs, notes] = await Promise.all([
        getSetLogsForSession(id),
        getExerciseNotesForSession(id),
      ]);
      setExerciseNotes(notes);
      const exerciseIds = [...new Set(setLogs.map(sl => sl.exercise_id))];
      const infoMap = await getExerciseInfo(exerciseIds);

      const groups: ExerciseGroup[] = [];
      const seen = new Set<string>();
      for (const sl of setLogs) {
        if (!seen.has(sl.exercise_id)) {
          seen.add(sl.exercise_id);
          const info = infoMap[sl.exercise_id];
          groups.push({
            exerciseId: sl.exercise_id,
            exerciseName: info?.name ?? sl.exercise_id.replace(/_/g, ' '),
            isAdhoc: !!(sl as any).is_adhoc,
            sets: setLogs.filter(s2 => s2.exercise_id === sl.exercise_id),
            inputFields: getFieldsForExercise(info?.inputFields ?? null),
          });
        }
      }
      setExerciseGroups(groups);
    })();
  }, [id]));

  if (!session) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Calculate stats
  const allSets = exerciseGroups.flatMap(g => g.sets);
  const completedSets = allSets.filter(s => s.status === 'completed' || s.status === 'completed_below');
  const totalTonnage = completedSets.reduce((sum, s) => sum + (s.actual_weight ?? 0) * (s.actual_reps ?? 0), 0);
  const duration = session.started_at && session.completed_at
    ? Math.round((new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 60000)
    : 0;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{session.day_template_id.replace(/_/g, ' ')}</Text>
        </View>

        {/* Date line */}
        <Text style={styles.dateLine}>{dateLabel}</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{duration}m</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedSets.length}</Text>
            <Text style={styles.statLabel}>Sets</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {totalTonnage >= 1000 ? `${(totalTonnage / 1000).toFixed(1)}k` : totalTonnage}
            </Text>
            <Text style={styles.statLabel}>Tonnage</Text>
          </View>
        </View>

        {/* Readiness */}
        <View style={styles.readinessRow}>
          <View style={styles.readinessItem}>
            <Text style={styles.readinessValue}>{session.sleep}</Text>
            <Text style={styles.readinessLabel}>Sleep</Text>
          </View>
          <View style={styles.readinessItem}>
            <Text style={styles.readinessValue}>{session.soreness}</Text>
            <Text style={styles.readinessLabel}>Soreness</Text>
          </View>
          <View style={styles.readinessItem}>
            <Text style={styles.readinessValue}>{session.energy}</Text>
            <Text style={styles.readinessLabel}>Energy</Text>
          </View>
        </View>

        {/* Protocol chips */}
        <View style={styles.chipRow}>
          {!!session.warmup_rope && (
            <View style={styles.chip}>
              <Ionicons name="checkmark" size={12} color={Colors.green} />
              <Text style={styles.chipText}>Jump Rope</Text>
            </View>
          )}
          {!!session.warmup_ankle && (
            <View style={styles.chip}>
              <Ionicons name="checkmark" size={12} color={Colors.green} />
              <Text style={styles.chipText}>Ankle</Text>
            </View>
          )}
          {!!session.warmup_hip_ir && (
            <View style={styles.chip}>
              <Ionicons name="checkmark" size={12} color={Colors.green} />
              <Text style={styles.chipText}>Hip IR</Text>
            </View>
          )}
          {!!session.conditioning_done && (
            <View style={styles.chip}>
              <Ionicons name="checkmark" size={12} color={Colors.green} />
              <Text style={styles.chipText}>Conditioning</Text>
            </View>
          )}
        </View>

        {/* Session notes */}
        {!!session.notes && (
          <View style={styles.sessionNotesCard}>
            <Text style={styles.sessionNotesLabel}>Session Notes</Text>
            <Text style={styles.sessionNotesText}>{session.notes}</Text>
          </View>
        )}

        {/* Exercise cards */}
        {exerciseGroups.map((group) => (
          <View key={group.exerciseId} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{group.exerciseName}</Text>
              {!!group.isAdhoc && (
                <View style={styles.adhocTag}>
                  <Text style={styles.adhocTagText}>Ad-hoc</Text>
                </View>
              )}
            </View>

            {/* Set grid header */}
            <View style={styles.setGridHeader}>
              <Text style={[styles.setGridHeaderText, { width: 36 }]}>Set</Text>
              {group.inputFields.map((field) => (
                <View key={field.type} style={{ flex: 1 }}>
                  <Text style={styles.setGridHeaderText}>{FIELD_LABELS[field.type]}</Text>
                  {field.unit && <Text style={styles.setGridUnitText}>{field.unit}</Text>}
                </View>
              ))}
              <Text style={[styles.setGridHeaderText, { width: 44 }]}>RPE</Text>
              <View style={{ width: 28 }} />
            </View>

            {/* Set rows */}
            {group.sets.map((set) => (
              <View key={set.id} style={styles.setGridRow}>
                <Text style={[styles.setGridValue, { width: 36 }]}>
                  {set.set_number}
                </Text>
                {group.inputFields.map((field) => {
                  const key = `actual_${field.type}` as keyof SetLog;
                  const value = set[key];
                  return (
                    <Text key={field.type} style={[styles.setGridValue, { flex: 1 }]}>
                      {value ?? '—'}
                    </Text>
                  );
                })}
                <Text style={[styles.setGridValue, { width: 44 }]}>
                  {set.rpe ?? '—'}
                </Text>
                <View style={{ width: 28, alignItems: 'center' }}>
                  {set.status === 'completed' && (
                    <Ionicons name="checkmark" size={14} color={Colors.green} />
                  )}
                  {set.status === 'completed_below' && (
                    <Text style={{ color: Colors.amber, fontSize: FontSize.sm }}>!</Text>
                  )}
                  {set.status === 'skipped' && (
                    <Text style={{ color: Colors.red, fontSize: FontSize.sm }}>—</Text>
                  )}
                </View>
              </View>
            ))}

            {/* Exercise note */}
            {!!exerciseNotes[group.exerciseId] && (
              <View style={styles.exerciseNote}>
                <Ionicons name="chatbubble-outline" size={12} color={Colors.textDim} />
                <Text style={styles.exerciseNoteText}>{exerciseNotes[group.exerciseId]}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: Spacing.screenTop, paddingHorizontal: Spacing.screenHorizontal, paddingBottom: Spacing.screenBottom },

  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  backButton: { padding: Spacing.xs },
  backArrow: { color: Colors.textDim, fontSize: FontSize.xxl },
  headerTitle: {
    color: Colors.text, fontSize: FontSize.xxxl, fontWeight: '800', textTransform: 'capitalize',
  },

  dateLine: { color: Colors.textSecondary, fontSize: FontSize.md, marginBottom: Spacing.xl },

  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  statItem: {
    flex: 1, backgroundColor: Colors.card, borderRadius: BorderRadius.md,
    padding: Spacing.md, alignItems: 'center',
  },
  statValue: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
  statLabel: { color: Colors.textDim, fontSize: FontSize.xs, marginTop: 2 },

  readinessRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  readinessItem: {
    flex: 1, backgroundColor: Colors.card, borderRadius: BorderRadius.md,
    padding: Spacing.md, alignItems: 'center',
  },
  readinessValue: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '600' },
  readinessLabel: { color: Colors.textDim, fontSize: FontSize.xs, marginTop: 2 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.greenMuted, borderRadius: BorderRadius.sm,
    paddingVertical: 4, paddingHorizontal: Spacing.sm,
  },
  chipText: { color: Colors.green, fontSize: FontSize.xs, fontWeight: '600' },

  exerciseCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md,
  },
  exerciseHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  exerciseName: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '600', flex: 1 },
  adhocTag: {
    backgroundColor: Colors.indigoMuted, borderRadius: BorderRadius.sm,
    paddingVertical: 2, paddingHorizontal: Spacing.sm,
  },
  adhocTagText: { color: Colors.indigo, fontSize: FontSize.xs, fontWeight: '600' },

  setGridHeader: {
    flexDirection: 'row', paddingBottom: Spacing.sm,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  setGridHeaderText: { color: Colors.textDim, fontSize: FontSize.xs, fontWeight: '600' },
  setGridUnitText: { color: Colors.textDim, fontSize: FontSize.xs - 1, fontWeight: '400', marginTop: 1 },
  setGridRow: {
    flexDirection: 'row', paddingVertical: Spacing.sm, alignItems: 'center',
    borderBottomWidth: 0.5, borderBottomColor: `${Colors.border}40`,
  },
  setGridValue: { color: Colors.text, fontSize: FontSize.md },

  sessionNotesCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.xl,
  },
  sessionNotesLabel: {
    color: Colors.textDim, fontSize: FontSize.xs, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm,
  },
  sessionNotesText: {
    color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 20,
  },

  exerciseNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    marginTop: Spacing.md, paddingTop: Spacing.sm,
    borderTopWidth: 0.5, borderTopColor: `${Colors.border}40`,
  },
  exerciseNoteText: {
    color: Colors.textSecondary, fontSize: FontSize.sm, flex: 1, lineHeight: 18,
  },
});
