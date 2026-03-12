/**
 * APEX — Session Detail (Past Workout View)
 * Read-only view of a completed workout session.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import {
  getSessionById, getSetLogsForSession, getExerciseInfo, getActiveProgram,
  getExerciseNotesForSession, getPRsForSession,
  updateSet, updateSessionNotes, updateProtocolCompletion,
  saveExerciseNote, deleteExerciseNote,
  detectPRs, deletePRsForSession, deleteSession,
} from '../../src/db';
import type { PRRecord } from '../../src/db';
import { getBlockForWeek, getBlockColor } from '../../src/utils/program';
import { formatPRDescription, formatPRName } from '../../src/utils/formatPR';
import { getFieldsForExercise, FIELD_LABELS } from '../../src/types/fields';
import type { InputField } from '../../src/types/fields';
import type { Session, SetLog, SessionProtocol } from '../../src/types';
import { getSessionProtocols } from '../../src/db/sessions';

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
  const [protocols, setProtocols] = useState<SessionProtocol[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [prs, setPRs] = useState<PRRecord[]>([]);
  const [sessionNotes, setSessionNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(true);
  const notesTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    };
  }, []);

  useFocusEffect(useCallback(() => {
    if (!id) return;
    (async () => {
      const s = await getSessionById(id);
      if (!s) return;
      setSession(s);
      setSessionNotes(s.notes ?? '');

      const sessionProtocols = await getSessionProtocols(s.id);
      setProtocols(sessionProtocols);

      const sessionPRs = await getPRsForSession(s.id);
      setPRs(sessionPRs);

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

  const handleExitEditMode = async () => {
    if (!session) return;
    // Clear any pending notes save
    if (notesTimerRef.current) {
      clearTimeout(notesTimerRef.current);
      await updateSessionNotes(session.id, sessionNotes);
      setNotesSaved(true);
    }

    // Recalculate PRs with updated set data
    const setLogs = await getSetLogsForSession(session.id);
    const exerciseIds = [...new Set(setLogs.map(s => s.exercise_id))];
    const exerciseInfoMap = await getExerciseInfo(exerciseIds);

    const sessionSets = setLogs.map(sl => ({
      exercise_id: sl.exercise_id,
      actual_weight: sl.actual_weight ?? 0,
      actual_reps: sl.actual_reps ?? 0,
      status: sl.status,
      actual_duration: sl.actual_duration,
      actual_time: sl.actual_time,
      actual_distance: sl.actual_distance,
      input_fields: exerciseInfoMap[sl.exercise_id]?.inputFields ?? null,
    }));

    await deletePRsForSession(session.id);
    const newPRs = await detectPRs(session.id, session.date, sessionSets);
    setPRs(newPRs);
  };

  if (!session) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Calculate stats
  const allSets = exerciseGroups.flatMap(g => g.sets);
  const completedSets = allSets.filter(s => s.status === 'completed' || s.status === 'completed_below');
  const duration = session.started_at && session.completed_at
    ? Math.round((new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 60000)
    : 0;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{session.name ?? session.day_template_id.replace(/_/g, ' ')}</Text>
          </View>
          <TouchableOpacity
            testID="edit-button"
            style={[styles.editBtn, editMode && styles.editBtnActive]}
            onPress={async () => {
              if (editMode) {
                await handleExitEditMode();
              }
              setEditMode(!editMode);
            }}
          >
            <Ionicons
              name={editMode ? 'checkmark' : 'pencil'}
              size={16}
              color={editMode ? Colors.green : Colors.textSecondary}
            />
          </TouchableOpacity>
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
          <View style={[styles.statItem, prs.length > 0 && { borderColor: `${Colors.amber}33` }]}>
            <Text style={styles.statValue}>{prs.length}</Text>
            <Text style={[styles.statLabel, prs.length > 0 && { color: `${Colors.amber}99` }]}>PRs</Text>
          </View>
        </View>

        {/* Personal Records */}
        {prs.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Personal Records</Text>
            <View style={styles.prCards}>
              {prs.map(pr => (
                <View key={pr.id} style={styles.prCard}>
                  <Text style={styles.prIcon}>🏆</Text>
                  <View style={styles.prInfo}>
                    <Text style={styles.prExercise}>{formatPRName(pr)}</Text>
                    <Text style={styles.prDetail}>{formatPRDescription(pr)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Protocol chips */}
        {protocols.length > 0 && (
          <View style={styles.chipRow}>
            {protocols.map(p => {
              const ChipWrapper = editMode ? TouchableOpacity : View;
              return (
                <ChipWrapper
                  key={p.id}
                  onPress={editMode ? async () => {
                    await updateProtocolCompletion(p.id, !p.completed);
                    setProtocols(prev => prev.map(pp =>
                      pp.id === p.id ? { ...pp, completed: !pp.completed } : pp
                    ));
                  } : undefined}
                  style={[
                    styles.chip,
                    p.completed ? styles.chipDone : styles.chipMissed,
                    editMode && styles.chipEditable,
                  ]}
                >
                  <Ionicons
                    name={p.completed ? 'checkmark' : 'close'}
                    size={12}
                    color={p.completed ? Colors.green : Colors.textDim}
                  />
                  <Text style={[styles.chipText, !p.completed && styles.chipTextMissed]}>
                    {p.protocol_name}
                  </Text>
                </ChipWrapper>
              );
            })}
          </View>
        )}

        {/* Session notes */}
        {(editMode || !!sessionNotes) && (
          <View style={[styles.sessionNotesCard, editMode && styles.editableCard]}>
            <View style={styles.notesHeader}>
              <Text style={styles.sessionNotesLabel}>Session Notes</Text>
              {editMode && notesSaved && <Text style={styles.notesSavedText}>{'✓ Saved'}</Text>}
              {editMode && !notesSaved && <Text style={styles.notesSavingText}>Saving...</Text>}
            </View>
            {editMode ? (
              <TextInput
                style={styles.sessionNotesInput}
                value={sessionNotes}
                onChangeText={(text) => {
                  setSessionNotes(text);
                  setNotesSaved(false);
                  if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
                  notesTimerRef.current = setTimeout(async () => {
                    await updateSessionNotes(session!.id, text);
                    setNotesSaved(true);
                  }, 1000);
                }}
                multiline
                placeholder="How did the session feel overall?"
                placeholderTextColor={Colors.textDim}
              />
            ) : (
              <Text style={styles.sessionNotesText}>{sessionNotes}</Text>
            )}
          </View>
        )}

        {/* Exercise cards */}
        {exerciseGroups.map((group) => (
          <View key={group.exerciseId} style={[styles.exerciseCard, editMode && styles.editableCard]}>
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
                  const FIELD_TO_UPDATE_KEY: Record<string, string> = {
                    weight: 'actualWeight', reps: 'actualReps', duration: 'actualDuration',
                    time: 'actualTime', distance: 'actualDistance',
                  };
                  const updateKey = FIELD_TO_UPDATE_KEY[field.type];
                  return editMode ? (
                    <TextInput
                      key={field.type}
                      style={[styles.setGridValue, styles.setGridEditable, { flex: 1 }]}
                      defaultValue={value?.toString() ?? ''}
                      keyboardType="numeric"
                      onEndEditing={(e) => {
                        const newValue = parseFloat(e.nativeEvent.text) || 0;
                        setExerciseGroups(prev => prev.map(g => ({
                          ...g,
                          sets: g.sets.map(s => s.id === set.id ? { ...s, [`actual_${field.type}`]: newValue } : s),
                        })));
                        updateSet(set.id, { [updateKey]: newValue } as any);
                      }}
                    />
                  ) : (
                    <Text key={field.type} style={[styles.setGridValue, { flex: 1 }]}>
                      {value ?? '—'}
                    </Text>
                  );
                })}
                {editMode ? (
                  <TextInput
                    style={[styles.setGridValue, styles.setGridEditable, { width: 44 }]}
                    defaultValue={set.rpe?.toString() ?? ''}
                    keyboardType="numeric"
                    onEndEditing={(e) => {
                      const newRpe = parseFloat(e.nativeEvent.text) || undefined;
                      setExerciseGroups(prev => prev.map(g => ({
                        ...g,
                        sets: g.sets.map(s => s.id === set.id ? { ...s, rpe: newRpe } : s),
                      })));
                      if (newRpe !== undefined) updateSet(set.id, { rpe: newRpe });
                    }}
                  />
                ) : (
                  <Text style={[styles.setGridValue, { width: 44 }]}>{set.rpe ?? '—'}</Text>
                )}
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
            {(editMode || !!exerciseNotes[group.exerciseId]) && (
              <View style={styles.exerciseNote}>
                <Ionicons name="chatbubble-outline" size={12} color={Colors.textDim} />
                {editMode ? (
                  <TextInput
                    style={styles.exerciseNoteInput}
                    defaultValue={exerciseNotes[group.exerciseId] ?? ''}
                    placeholder="Add a note..."
                    placeholderTextColor={Colors.textDim}
                    onEndEditing={(e) => {
                      const text = e.nativeEvent.text.trim();
                      if (text) {
                        saveExerciseNote(session!.id, group.exerciseId, text);
                      } else {
                        deleteExerciseNote(session!.id, group.exerciseId);
                      }
                      setExerciseNotes(prev => {
                        const next = { ...prev };
                        if (text) next[group.exerciseId] = text;
                        else delete next[group.exerciseId];
                        return next;
                      });
                    }}
                    multiline
                  />
                ) : (
                  <Text style={styles.exerciseNoteText}>{exerciseNotes[group.exerciseId]}</Text>
                )}
              </View>
            )}
          </View>
        ))}
        {/* Delete button in edit mode */}
        {editMode && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => {
              Alert.alert('Delete Workout', 'This will permanently delete this session and all its data.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: async () => {
                  await deleteSession(session!.id);
                  router.back();
                }},
              ]);
            }}
          >
            <Text style={styles.deleteBtnText}>Delete Workout</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: Spacing.screenTop, paddingHorizontal: Spacing.screenHorizontal, paddingBottom: Spacing.screenBottom },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  backButton: { padding: Spacing.xs },
  backArrow: { color: Colors.textDim, fontSize: FontSize.xxl },
  headerTitle: {
    color: Colors.text, fontSize: FontSize.xxxl, fontWeight: '800', textTransform: 'capitalize',
  },

  editBtn: {
    width: 36, height: 36, backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  editBtnActive: {
    backgroundColor: `${Colors.green}20`, borderColor: `${Colors.green}40`,
  },

  dateLine: { color: Colors.textSecondary, fontSize: FontSize.md, marginBottom: Spacing.xl },

  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  statItem: {
    flex: 1, backgroundColor: Colors.card, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, alignItems: 'center',
  },
  statValue: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
  statLabel: { color: Colors.textDim, fontSize: FontSize.xs, marginTop: 2 },

  sectionLabel: {
    color: Colors.textDim, fontSize: FontSize.xs, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm, marginTop: Spacing.sm,
  },
  prCards: { gap: Spacing.sm, marginBottom: Spacing.lg },
  prCard: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: `${Colors.amber}33`,
    borderLeftWidth: 3, borderLeftColor: Colors.amber, borderRadius: BorderRadius.md,
    padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
  },
  prIcon: { fontSize: 20 },
  prInfo: { flex: 1 },
  prExercise: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600', marginBottom: 2 },
  prDetail: { color: Colors.amber, fontSize: FontSize.sm, fontWeight: '500' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 4, paddingHorizontal: Spacing.sm,
  },
  chipDone: {
    backgroundColor: Colors.greenMuted, borderRadius: BorderRadius.pill ?? 20,
    borderWidth: 1, borderColor: `${Colors.green}30`,
  },
  chipMissed: {
    backgroundColor: `${Colors.textDim}10`, borderRadius: BorderRadius.pill ?? 20,
    borderWidth: 1, borderColor: `${Colors.textDim}30`,
  },
  chipText: { color: Colors.green, fontSize: FontSize.xs, fontWeight: '600' },
  chipTextMissed: { color: Colors.textDim },

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
    textTransform: 'uppercase', letterSpacing: 1,
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

  // Edit mode styles
  editableCard: {
    borderWidth: 1, borderColor: `${Colors.indigo}40`,
  },
  chipEditable: {
    borderStyle: 'dashed' as const,
  },
  notesHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  notesSavedText: { color: Colors.green, fontSize: FontSize.xs, fontWeight: '600' as const },
  notesSavingText: { color: Colors.textDim, fontSize: FontSize.xs, fontWeight: '600' as const },
  sessionNotesInput: {
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: `${Colors.indigo}40`,
    borderRadius: BorderRadius.sm, padding: Spacing.sm,
    color: Colors.text, fontSize: FontSize.md,
    minHeight: 44, textAlignVertical: 'top' as const,
  },
  setGridEditable: {
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: `${Colors.indigo}40`,
    borderRadius: BorderRadius.xs, paddingVertical: 4, paddingHorizontal: 8,
    minWidth: 48, textAlign: 'center' as const,
  },
  exerciseNoteInput: {
    flex: 1, backgroundColor: Colors.bg, borderWidth: 1, borderColor: `${Colors.indigo}40`,
    borderRadius: BorderRadius.xs, paddingVertical: 6, paddingHorizontal: 10,
    color: Colors.text, fontSize: FontSize.sm,
    minHeight: 32, textAlignVertical: 'top' as const,
  },
  deleteBtn: {
    marginTop: Spacing.xxl, padding: Spacing.lg,
    backgroundColor: `${Colors.red}15`, borderWidth: 1, borderColor: `${Colors.red}30`,
    borderRadius: BorderRadius.md, alignItems: 'center' as const,
  },
  deleteBtnText: { color: Colors.red, fontSize: FontSize.md, fontWeight: '600' as const },
});
