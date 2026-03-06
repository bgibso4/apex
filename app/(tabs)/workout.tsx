/**
 * APEX — Workout Screen
 * The critical logging interface. Target-first, 1-tap per set.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Modal, Pressable
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import {
  getActiveProgram, createSession, logSet, updateSet,
  completeSession, updateReadiness, updateWarmup,
  getSessionsForWeek, getLastSessionForExercise,
  calculateTargetWeight
} from '../../src/db';
import {
  getBlockForWeek, getBlockColor, getTrainingDays,
  getCurrentWeek, getTodayKey, getTargetForWeek, DAY_NAMES
} from '../../src/utils/program';
import type { Program, ProgramDefinition, DayTemplate, SetLog, ExerciseSlot } from '../../src/types';

type SetState = {
  setNumber: number;
  targetWeight: number;
  targetReps: number;
  actualWeight: number;
  actualReps: number;
  rpe?: number;
  status: SetLog['status'];
  id?: string;
};

type ExerciseState = {
  slot: ExerciseSlot;
  exerciseName: string;
  sets: SetState[];
  rpe?: number;
  expanded: boolean;
  lastWeight?: number;
  lastReps?: number;
};

export default function WorkoutScreen() {
  const [program, setProgram] = useState<(Program & { definition: ProgramDefinition }) | null>(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [phase, setPhase] = useState<'select' | 'readiness' | 'warmup' | 'logging' | 'complete'>('select');

  // Readiness
  const [sleep, setSleep] = useState(3);
  const [soreness, setSoreness] = useState(3);
  const [energy, setEnergy] = useState(3);

  // Warmup
  const [warmupRope, setWarmupRope] = useState(false);
  const [warmupAnkle, setWarmupAnkle] = useState(false);
  const [warmupHipIr, setWarmupHipIr] = useState(false);

  // Exercise logging
  const [exercises, setExercises] = useState<ExerciseState[]>([]);
  const [conditioningDone, setConditioningDone] = useState(false);

  // Override modal
  const [overrideModal, setOverrideModal] = useState<{
    exerciseIdx: number;
    setIdx: number;
  } | null>(null);
  const [overrideWeight, setOverrideWeight] = useState(0);
  const [overrideReps, setOverrideReps] = useState(0);

  const loadData = useCallback(async () => {
    const active = await getActiveProgram();
    setProgram(active);
    if (active?.activated_date) {
      const week = getCurrentWeek(active.activated_date);
      setCurrentWeek(week);
      setSelectedDay(getTodayKey());
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  if (!program) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No active program</Text>
        </View>
      </View>
    );
  }

  const def = program.definition.program;
  const block = getBlockForWeek(def.blocks, currentWeek);
  const blockColor = block ? getBlockColor(block) : Colors.indigo;
  const trainingDays = getTrainingDays(def.weekly_template);
  const oneRmValues: Record<string, number> = program.one_rm_values
    ? (typeof program.one_rm_values === 'string'
      ? JSON.parse(program.one_rm_values)
      : program.one_rm_values)
    : {};

  const selectedTemplate = trainingDays.find(d => d.day === selectedDay)?.template;

  /** Start a workout session */
  const startSession = async () => {
    if (!selectedTemplate || !block) return;

    const id = await createSession({
      programId: program.id,
      weekNumber: currentWeek,
      blockName: block.name,
      dayTemplateId: selectedDay,
      scheduledDay: selectedDay,
      actualDay: getTodayKey(),
      date: new Date().toISOString().split('T')[0],
    });
    setSessionId(id);

    // Build exercise states with targets
    const exStates: ExerciseState[] = [];
    for (const slot of selectedTemplate.exercises) {
      const target = getTargetForWeek(slot, currentWeek);
      if (!target) continue;

      const exerciseDef = def.exercise_definitions.find(e => e.id === slot.exercise_id);
      const reps = typeof target.reps === 'string' ? parseInt(target.reps) || 8 : target.reps;

      // Get suggested weight
      let suggestedWeight = 0;
      if (target.percent && oneRmValues[slot.exercise_id]) {
        const pct = typeof target.percent === 'string' ? parseFloat(target.percent) : target.percent;
        suggestedWeight = calculateTargetWeight(oneRmValues[slot.exercise_id], pct);
      }

      // Check last session for reference
      const lastSets = await getLastSessionForExercise(slot.exercise_id, program.id);
      const lastWeight = lastSets.length > 0 ? lastSets[0].actual_weight : undefined;
      const lastReps = lastSets.length > 0 ? lastSets[0].actual_reps : undefined;

      const weight = suggestedWeight || lastWeight || 0;

      const sets: SetState[] = Array.from({ length: target.sets }, (_, i) => ({
        setNumber: i + 1,
        targetWeight: weight,
        targetReps: reps,
        actualWeight: weight,
        actualReps: reps,
        status: 'pending' as const,
      }));

      exStates.push({
        slot,
        exerciseName: exerciseDef?.name ?? slot.exercise_id.replace(/_/g, ' '),
        sets,
        expanded: exStates.length === 0, // first exercise starts expanded
        lastWeight: lastWeight ?? undefined,
        lastReps: lastReps ?? undefined,
      });
    }

    setExercises(exStates);
    setPhase('readiness');
  };

  /** Complete a set (1 tap) */
  const completeSetAction = async (exIdx: number, setIdx: number) => {
    if (!sessionId) return;

    const ex = exercises[exIdx];
    const set = ex.sets[setIdx];

    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Log to database
    const setId = await logSet({
      sessionId,
      exerciseId: ex.slot.exercise_id,
      setNumber: set.setNumber,
      targetWeight: set.targetWeight,
      targetReps: set.targetReps,
      actualWeight: set.actualWeight,
      actualReps: set.actualReps,
      status: 'completed',
    });

    // Update state
    setExercises(prev => {
      const next = [...prev];
      next[exIdx] = {
        ...next[exIdx],
        sets: next[exIdx].sets.map((s, i) =>
          i === setIdx ? { ...s, status: 'completed', id: setId } : s
        ),
      };

      // Auto-expand next exercise if all sets done
      const allDone = next[exIdx].sets.every((s, i) =>
        i === setIdx ? true : s.status !== 'pending'
      );
      if (allDone && exIdx < next.length - 1) {
        next[exIdx] = { ...next[exIdx], expanded: false };
        next[exIdx + 1] = { ...next[exIdx + 1], expanded: true };
      }

      return next;
    });
  };

  /** Open override modal (long press) */
  const openOverride = (exIdx: number, setIdx: number) => {
    const set = exercises[exIdx].sets[setIdx];
    setOverrideWeight(set.actualWeight);
    setOverrideReps(set.actualReps);
    setOverrideModal({ exerciseIdx: exIdx, setIdx });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  /** Save override */
  const saveOverride = async () => {
    if (!overrideModal || !sessionId) return;
    const { exerciseIdx, setIdx } = overrideModal;
    const ex = exercises[exerciseIdx];
    const set = ex.sets[setIdx];

    const hitTarget = overrideWeight >= set.targetWeight && overrideReps >= set.targetReps;
    const status = hitTarget ? 'completed' : 'completed_below';

    if (set.id) {
      await updateSet(set.id, {
        actualWeight: overrideWeight,
        actualReps: overrideReps,
        status,
      });
    } else {
      const setId = await logSet({
        sessionId,
        exerciseId: ex.slot.exercise_id,
        setNumber: set.setNumber,
        targetWeight: set.targetWeight,
        targetReps: set.targetReps,
        actualWeight: overrideWeight,
        actualReps: overrideReps,
        status,
      });
      // store id for future updates
      setExercises(prev => {
        const next = [...prev];
        next[exerciseIdx].sets[setIdx] = {
          ...next[exerciseIdx].sets[setIdx],
          id: setId,
        };
        return next;
      });
    }

    setExercises(prev => {
      const next = [...prev];
      next[exerciseIdx].sets[setIdx] = {
        ...next[exerciseIdx].sets[setIdx],
        actualWeight: overrideWeight,
        actualReps: overrideReps,
        status,
      };
      return next;
    });

    setOverrideModal(null);
  };

  /** Set RPE for an exercise */
  const setRPE = (exIdx: number, rpe: number) => {
    setExercises(prev => {
      const next = [...prev];
      next[exIdx] = { ...next[exIdx], rpe };
      return next;
    });
  };

  /** Complete the session */
  const finishSession = async () => {
    if (!sessionId) return;
    await completeSession(sessionId, conditioningDone);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhase('complete');
  };

  const getSetColor = (status: SetLog['status']) => {
    switch (status) {
      case 'completed': return { bg: Colors.greenMuted, border: `${Colors.green}40`, text: Colors.green };
      case 'completed_below': return { bg: Colors.amberMuted, border: `${Colors.amber}40`, text: Colors.amber };
      case 'skipped': return { bg: Colors.redMuted, border: `${Colors.red}40`, text: Colors.red };
      default: return { bg: Colors.surface, border: Colors.border, text: Colors.textDim };
    }
  };

  // ── RENDER ──

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Day Selector (always visible) */}
        <View style={styles.daySelector}>
          <Text style={styles.daySelectorLabel}>
            Week {currentWeek} · {block?.name}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayRow}>
            {trainingDays.map(({ day, template }) => {
              const isSelected = day === selectedDay;
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayChip,
                    isSelected && { backgroundColor: blockColor, borderColor: blockColor },
                  ]}
                  onPress={() => {
                    setSelectedDay(day);
                    if (phase !== 'select') setPhase('select');
                  }}
                >
                  <Text style={[
                    styles.dayChipText,
                    isSelected && { color: Colors.text },
                  ]}>
                    {DAY_NAMES[day]}
                  </Text>
                  <Text style={[
                    styles.dayChipSubtext,
                    isSelected && { color: `${Colors.text}cc` },
                  ]} numberOfLines={1}>
                    {template.name.split('—')[0].trim()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Phase: Select */}
        {phase === 'select' && selectedTemplate && (
          <View style={styles.card}>
            <Text style={styles.sessionTitle}>{selectedTemplate.name}</Text>
            <Text style={styles.exercisePreview}>
              {selectedTemplate.exercises.length} exercises
              {selectedTemplate.conditioning_finisher ? ' + conditioning finisher' : ''}
            </Text>
            <TouchableOpacity
              style={[styles.bigButton, { backgroundColor: blockColor }]}
              onPress={startSession}
            >
              <Text style={styles.bigButtonText}>Start Session</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Phase: Readiness */}
        {phase === 'readiness' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Readiness Check</Text>
            {[
              { label: 'Sleep Quality', value: sleep, setter: setSleep },
              { label: 'Soreness', value: soreness, setter: setSoreness },
              { label: 'Energy Level', value: energy, setter: setEnergy },
            ].map(({ label, value, setter }) => (
              <View key={label} style={styles.readinessRow}>
                <Text style={styles.readinessLabel}>{label}</Text>
                <View style={styles.readinessButtons}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <TouchableOpacity
                      key={n}
                      style={[
                        styles.readinessButton,
                        value === n && { backgroundColor: blockColor },
                      ]}
                      onPress={() => setter(n)}
                    >
                      <Text style={[
                        styles.readinessButtonText,
                        value === n && { color: Colors.text },
                      ]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.bigButton, { backgroundColor: blockColor }]}
              onPress={async () => {
                if (sessionId) await updateReadiness(sessionId, sleep, soreness, energy);
                setPhase('warmup');
              }}
            >
              <Text style={styles.bigButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Phase: Warmup */}
        {phase === 'warmup' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Warmup</Text>
            {[
              { label: 'Jump Rope (5-7 min)', value: warmupRope, setter: setWarmupRope },
              { label: 'Ankle Protocol', value: warmupAnkle, setter: setWarmupAnkle },
              { label: 'Hip IR Work', value: warmupHipIr, setter: setWarmupHipIr },
            ].map(({ label, value, setter }) => (
              <TouchableOpacity
                key={label}
                style={styles.warmupItem}
                onPress={() => {
                  setter(!value);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons
                  name={value ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={value ? Colors.green : Colors.textDim}
                />
                <Text style={[
                  styles.warmupLabel,
                  value && { color: Colors.green, textDecorationLine: 'line-through' },
                ]}>{label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.bigButton, { backgroundColor: blockColor }]}
              onPress={async () => {
                if (sessionId) await updateWarmup(sessionId, {
                  rope: warmupRope, ankle: warmupAnkle, hipIr: warmupHipIr,
                });
                setPhase('logging');
              }}
            >
              <Text style={styles.bigButtonText}>Start Logging</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Phase: Logging */}
        {phase === 'logging' && exercises.map((ex, exIdx) => {
          const target = getTargetForWeek(ex.slot, currentWeek);
          const allDone = ex.sets.every(s => s.status !== 'pending');

          return (
            <TouchableOpacity
              key={ex.slot.exercise_id}
              style={styles.exerciseCard}
              onPress={() => setExercises(prev => {
                const next = [...prev];
                next[exIdx] = { ...next[exIdx], expanded: !next[exIdx].expanded };
                return next;
              })}
              activeOpacity={0.8}
            >
              {/* Exercise Header */}
              <View style={styles.exerciseHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
                  <Text style={styles.exerciseTarget}>
                    {target ? `${target.sets}×${target.reps}` : ''}
                    {target?.percent ? ` @ ${target.percent}%` : ''}
                    {target?.rpe_target ? ` · RPE ${target.rpe_target}` : ''}
                  </Text>
                </View>
                <Text style={[styles.categoryBadge, { color: blockColor }]}>
                  {ex.slot.category.toUpperCase()}
                </Text>
              </View>

              {/* Suggested weight + last session */}
              {ex.expanded && (
                <>
                  <View style={styles.weightInfo}>
                    {ex.sets[0]?.targetWeight > 0 && (
                      <Text style={styles.suggestedWeight}>
                        Suggested: {ex.sets[0].targetWeight} lbs
                      </Text>
                    )}
                    {ex.lastWeight && (
                      <Text style={styles.lastSession}>
                        Last: {ex.lastWeight} × {ex.lastReps}
                      </Text>
                    )}
                  </View>

                  {/* Set Buttons */}
                  <View style={styles.setsRow}>
                    {ex.sets.map((set, setIdx) => {
                      const color = getSetColor(set.status);
                      return (
                        <TouchableOpacity
                          key={setIdx}
                          style={[styles.setButton, {
                            backgroundColor: color.bg,
                            borderColor: color.border,
                          }]}
                          onPress={() => {
                            if (set.status === 'pending') completeSetAction(exIdx, setIdx);
                          }}
                          onLongPress={() => openOverride(exIdx, setIdx)}
                        >
                          <Text style={[styles.setLabel, { color: color.text }]}>
                            Set {set.setNumber}
                          </Text>
                          <Text style={[styles.setWeight, { color: color.text }]}>
                            {set.actualWeight}
                          </Text>
                          <Text style={[styles.setReps, { color: color.text }]}>
                            ×{set.actualReps}
                          </Text>
                          {set.status === 'completed' && (
                            <Ionicons name="checkmark" size={16} color={Colors.green} style={{ marginTop: 2 }} />
                          )}
                          {set.status === 'completed_below' && (
                            <Ionicons name="arrow-down" size={14} color={Colors.amber} style={{ marginTop: 2 }} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* RPE selector (after all sets done) */}
                  {allDone && (
                    <View style={styles.rpeSection}>
                      <Text style={styles.rpeLabel}>RPE</Text>
                      <View style={styles.rpeRow}>
                        {[6, 7, 8, 9, 10].map(n => (
                          <TouchableOpacity
                            key={n}
                            style={[
                              styles.rpeBubble,
                              ex.rpe === n && {
                                backgroundColor: n >= 9 ? Colors.redMuted : `${blockColor}30`,
                                borderColor: n >= 9 ? Colors.red : blockColor,
                              },
                            ]}
                            onPress={() => setRPE(exIdx, n)}
                          >
                            <Text style={[
                              styles.rpeBubbleText,
                              ex.rpe === n && { color: n >= 9 ? Colors.red : blockColor },
                            ]}>{n}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Conditioning Finisher + Complete */}
        {phase === 'logging' && (
          <>
            <TouchableOpacity
              style={styles.conditioningRow}
              onPress={() => setConditioningDone(!conditioningDone)}
            >
              <Ionicons
                name={conditioningDone ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={conditioningDone ? Colors.green : Colors.textDim}
              />
              <Text style={[
                styles.conditioningLabel,
                conditioningDone && { color: Colors.green },
              ]}>Conditioning Finisher</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bigButton, {
                backgroundColor: blockColor,
                marginHorizontal: 0,
              }]}
              onPress={finishSession}
            >
              <Text style={styles.bigButtonText}>Complete Session</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Phase: Complete */}
        {phase === 'complete' && (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 40 }]}>
            <Ionicons name="checkmark-circle" size={64} color={Colors.green} />
            <Text style={[styles.cardTitle, { marginTop: Spacing.lg, textAlign: 'center' }]}>
              Session Complete
            </Text>
            <Text style={styles.completeSummary}>
              {exercises.filter(e => e.sets.some(s => s.status !== 'pending')).length} exercises
              {' · '}
              {exercises.reduce((acc, e) => acc + e.sets.filter(s => s.status === 'completed' || s.status === 'completed_below').length, 0)} sets logged
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Override Modal */}
      <Modal visible={overrideModal !== null} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setOverrideModal(null)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Adjust Set</Text>

            <Text style={styles.modalLabel}>Weight (lbs)</Text>
            <View style={styles.adjustRow}>
              <TouchableOpacity style={styles.adjustButton}
                onPress={() => setOverrideWeight(Math.max(0, overrideWeight - 5))}>
                <Text style={styles.adjustButtonText}>-5</Text>
              </TouchableOpacity>
              <Text style={styles.adjustValue}>{overrideWeight}</Text>
              <TouchableOpacity style={styles.adjustButton}
                onPress={() => setOverrideWeight(overrideWeight + 5)}>
                <Text style={styles.adjustButtonText}>+5</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Reps</Text>
            <View style={styles.adjustRow}>
              <TouchableOpacity style={styles.adjustButton}
                onPress={() => setOverrideReps(Math.max(0, overrideReps - 1))}>
                <Text style={styles.adjustButtonText}>-1</Text>
              </TouchableOpacity>
              <Text style={styles.adjustValue}>{overrideReps}</Text>
              <TouchableOpacity style={styles.adjustButton}
                onPress={() => setOverrideReps(overrideReps + 1)}>
                <Text style={styles.adjustButtonText}>+1</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.bigButton, { backgroundColor: blockColor, marginTop: Spacing.lg }]}
              onPress={saveOverride}
            >
              <Text style={styles.bigButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
  emptyState: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.lg },

  // Day selector
  daySelector: { marginBottom: Spacing.xl },
  daySelectorLabel: {
    color: Colors.textSecondary, fontSize: FontSize.md,
    fontWeight: '600', marginBottom: Spacing.sm,
  },
  dayRow: { flexDirection: 'row' },
  dayChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    minWidth: 80,
  },
  dayChipText: { color: Colors.textDim, fontSize: FontSize.md, fontWeight: '700' },
  dayChipSubtext: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },

  // Cards
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '700', marginBottom: Spacing.lg },
  sessionTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '700' },
  exercisePreview: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: 4, marginBottom: Spacing.xl },

  bigButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  bigButtonText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },

  // Readiness
  readinessRow: { marginBottom: Spacing.lg },
  readinessLabel: { color: Colors.textSecondary, fontSize: FontSize.md, marginBottom: Spacing.sm },
  readinessButtons: { flexDirection: 'row', gap: Spacing.sm },
  readinessButton: {
    flex: 1, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm, backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  readinessButtonText: { color: Colors.textDim, fontSize: FontSize.md, fontWeight: '600' },

  // Warmup
  warmupItem: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  warmupLabel: { color: Colors.textSecondary, fontSize: FontSize.lg },

  // Exercise card
  exerciseCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  exerciseHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  exerciseName: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '600' },
  exerciseTarget: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
  categoryBadge: { fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 0.5 },

  weightInfo: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: Spacing.md, marginBottom: Spacing.md,
  },
  suggestedWeight: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
  lastSession: { color: Colors.textDim, fontSize: FontSize.sm },

  setsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  setButton: {
    flex: 1, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm, borderWidth: 1,
    alignItems: 'center',
  },
  setLabel: { fontSize: FontSize.xs, fontWeight: '600' },
  setWeight: { fontSize: FontSize.lg, fontWeight: '700', marginTop: 2 },
  setReps: { fontSize: FontSize.sm },

  // RPE
  rpeSection: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.md,
  },
  rpeLabel: { color: Colors.textDim, fontSize: FontSize.sm, fontWeight: '600' },
  rpeRow: { flexDirection: 'row', gap: Spacing.sm },
  rpeBubble: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  rpeBubbleText: { color: Colors.textDim, fontSize: FontSize.sm, fontWeight: '700' },

  // Conditioning
  conditioningRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  conditioningLabel: { color: Colors.textSecondary, fontSize: FontSize.lg },

  // Complete
  completeSummary: {
    color: Colors.textSecondary, fontSize: FontSize.md, marginTop: Spacing.sm,
  },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl,
    padding: Spacing.xxl, width: 300,
  },
  modalTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '700', marginBottom: Spacing.xl, textAlign: 'center' },
  modalLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.sm },
  adjustRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Spacing.xl, marginBottom: Spacing.xl,
  },
  adjustButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  adjustButtonText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
  adjustValue: { color: Colors.text, fontSize: FontSize.xxxl, fontWeight: '700', minWidth: 80, textAlign: 'center' },
});
