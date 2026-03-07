import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  getActiveProgram, createSession, logSet, updateSet, deleteSet,
  completeSession, updateReadiness, updateWarmup, updateSessionNotes,
  getLastSessionForExercise, calculateTargetWeight,
  ensureExerciseExists,
  saveExerciseNote, getExerciseNotesForSession,
  detectPRs, getPRsForSession,
  getSetLogsForSession,
  getInProgressSession, deleteSession,
} from '../db';
import type { PRRecord } from '../db/personal-records';
import {
  getBlockForWeek, getBlockColor, getTrainingDays,
  getCurrentWeek, getTodayKey, getTargetForWeek, DAY_NAMES,
} from '../utils/program';
import { Colors } from '../theme';
import type { Program, ProgramDefinition, ExerciseSlot, SetLog } from '../types';
import type { SetState } from '../components/ExerciseCard';
import type { LibraryExercise } from '../data/exercise-library';
import { useSessionTimer } from './useSessionTimer';

export type WorkoutPhase = 'select' | 'readiness' | 'warmup' | 'logging' | 'complete';

export interface ExerciseState {
  slot: ExerciseSlot;
  exerciseName: string;
  sets: SetState[];
  rpe?: number;
  expanded: boolean;
  lastWeight?: number;
  lastReps?: number;
  isAdhoc?: boolean;
}

export function useWorkoutSession() {
  const [program, setProgram] = useState<(Program & { definition: ProgramDefinition }) | null>(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [phase, setPhase] = useState<WorkoutPhase>('select');

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

  // Exercise picker
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerStep, setPickerStep] = useState<'pick' | 'configure'>('pick');
  const [selectedLibraryExercise, setSelectedLibraryExercise] = useState<LibraryExercise | null>(null);
  const [adhocSets, setAdhocSets] = useState(3);
  const [adhocReps, setAdhocReps] = useState(10);
  const [adhocWeight, setAdhocWeight] = useState(0);

  // Reorder mode
  const [reorderMode, setReorderMode] = useState(false);

  // Session notes
  const [sessionNotes, setSessionNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  // Timer
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [finalDuration, setFinalDuration] = useState<string | null>(null);
  const { seconds: timerSeconds, display: timerDisplay } = useSessionTimer(startedAt);
  const timer = finalDuration ?? timerDisplay;

  // Exercise notes
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({});

  // PRs
  const [prs, setPRs] = useState<PRRecord[]>([]);

  // Edit mode
  const [editMode, setEditMode] = useState(false);

  const loadData = useCallback(async () => {
    const active = await getActiveProgram();
    setProgram(active);
    if (active?.activated_date) {
      const week = getCurrentWeek(active.activated_date);
      setCurrentWeek(week);
      // Don't reset selectedDay if we're mid-session (preserves title/state on tab switch)
      if (phase === 'select') {
        setSelectedDay(getTodayKey());
      }
    }
  }, [phase]);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  // Derived values
  const def = program?.definition.program;
  const block = def ? getBlockForWeek(def.blocks, currentWeek) : undefined;
  const blockColor = block ? getBlockColor(block) : Colors.indigo;
  const trainingDays = def ? getTrainingDays(def.weekly_template) : [];
  const selectedTemplate = trainingDays.find(d => d.day === selectedDay)?.template;

  // Conditioning finisher from template
  const conditioningFinisher = selectedTemplate?.conditioning_finisher ?? null;

  // Total volume (sum of weight × reps for completed sets)
  const totalVolume = useMemo(() => {
    let vol = 0;
    for (const ex of exercises) {
      for (const set of ex.sets) {
        if (set.status === 'completed' || set.status === 'completed_below') {
          vol += set.actualWeight * set.actualReps;
        }
      }
    }
    return vol;
  }, [exercises]);

  const oneRmValues: Record<string, number> = program?.one_rm_values
    ? (typeof program.one_rm_values === 'string'
      ? JSON.parse(program.one_rm_values)
      : program.one_rm_values)
    : {};

  /** Select a day (and reset to select phase if mid-session) */
  const selectDay = (day: string) => {
    setSelectedDay(day);
    if (phase !== 'select') setPhase('select');
  };

  /** Start a workout session */
  const startSession = async () => {
    if (!selectedTemplate || !block || !program || !def) return;

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
    setStartedAt(new Date().toISOString());

    const exStates: ExerciseState[] = [];
    for (const slot of selectedTemplate.exercises) {
      const target = getTargetForWeek(slot, currentWeek);
      if (!target) continue;

      const exerciseDef = def.exercise_definitions.find(e => e.id === slot.exercise_id);
      const reps = typeof target.reps === 'string' ? parseInt(target.reps) || 8 : target.reps;

      let suggestedWeight = 0;
      if (target.percent && oneRmValues[slot.exercise_id]) {
        const pct = typeof target.percent === 'string' ? parseFloat(target.percent) : target.percent;
        suggestedWeight = calculateTargetWeight(oneRmValues[slot.exercise_id], pct);
      }

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
        expanded: exStates.length === 0,
        lastWeight: lastWeight ?? undefined,
        lastReps: lastReps ?? undefined,
      });
    }

    setExercises(exStates);
    setPhase('warmup');
  };

  /** Complete or uncomplete a set (1 tap toggles) */
  const completeSetAction = async (exIdx: number, setIdx: number) => {
    if (!sessionId) return;

    const ex = exercises[exIdx];
    const set = ex.sets[setIdx];

    // Toggle: if already completed, revert to pending
    if (set.status === 'completed' || set.status === 'completed_below') {
      if (set.id) await deleteSet(set.id);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      setExercises(prev => {
        const next = [...prev];
        next[exIdx] = {
          ...next[exIdx],
          sets: next[exIdx].sets.map((s, i) =>
            i === setIdx ? { ...s, status: 'pending' as const, id: undefined } : s
          ),
        };
        return next;
      });
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const setId = await logSet({
      sessionId,
      exerciseId: ex.slot.exercise_id,
      setNumber: set.setNumber,
      targetWeight: set.targetWeight,
      targetReps: set.targetReps,
      actualWeight: set.actualWeight,
      actualReps: set.actualReps,
      status: 'completed',
      isAdhoc: ex.isAdhoc,
    });

    setExercises(prev => {
      const next = [...prev];
      next[exIdx] = {
        ...next[exIdx],
        sets: next[exIdx].sets.map((s, i) =>
          i === setIdx ? { ...s, status: 'completed' as const, id: setId } : s
        ),
      };
      return next;
    });
  };

  /** Toggle exercise expand/collapse */
  const toggleExpand = (exIdx: number) => {
    setExercises(prev => {
      const next = [...prev];
      next[exIdx] = { ...next[exIdx], expanded: !next[exIdx].expanded };
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
    const status: SetLog['status'] = hitTarget ? 'completed' : 'completed_below';

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
        isAdhoc: ex.isAdhoc,
      });
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

  /** Set RPE for an exercise (persists to all completed sets), then auto-advance */
  const setRPE = async (exIdx: number, rpe: number) => {
    const ex = exercises[exIdx];

    // Update all completed sets in DB with this RPE
    for (const set of ex.sets) {
      if (set.id && (set.status === 'completed' || set.status === 'completed_below')) {
        await updateSet(set.id, { rpe });
      }
    }

    setExercises(prev => {
      const next = [...prev];
      next[exIdx] = { ...next[exIdx], rpe };

      // Auto-advance: collapse this exercise, expand the next incomplete one
      if (exIdx < next.length - 1) {
        next[exIdx] = { ...next[exIdx], rpe, expanded: false };
        // Find next incomplete exercise
        for (let i = exIdx + 1; i < next.length; i++) {
          if (next[i].sets.some(s => s.status === 'pending')) {
            next[i] = { ...next[i], expanded: true };
            break;
          }
        }
      }

      return next;
    });
  };

  /** Submit readiness and move to warmup */
  const submitReadiness = async () => {
    if (sessionId) await updateReadiness(sessionId, sleep, soreness, energy);
    setPhase('warmup');
  };

  /** Submit warmup and move to logging */
  const submitWarmup = async () => {
    if (sessionId) await updateWarmup(sessionId, {
      rope: warmupRope, ankle: warmupAnkle, hipIr: warmupHipIr,
    });
    setPhase('logging');
  };

  /** Add an ad-hoc exercise to the current workout */
  const addAdhocExercise = async () => {
    if (!selectedLibraryExercise || !sessionId) return;

    await ensureExerciseExists({
      id: selectedLibraryExercise.id,
      name: selectedLibraryExercise.name,
      type: selectedLibraryExercise.type,
      muscleGroups: [selectedLibraryExercise.muscleGroup],
    });

    const sets: SetState[] = Array.from({ length: adhocSets }, (_, i) => ({
      setNumber: i + 1,
      targetWeight: adhocWeight,
      targetReps: adhocReps,
      actualWeight: adhocWeight,
      actualReps: adhocReps,
      status: 'pending' as const,
    }));

    const newExercise: ExerciseState = {
      slot: {
        exercise_id: selectedLibraryExercise.id,
        category: selectedLibraryExercise.type === 'core' ? 'core' : 'accessory',
        targets: [],
      },
      exerciseName: selectedLibraryExercise.name,
      sets,
      expanded: false,
      isAdhoc: true,
    };

    setExercises(prev => [...prev, newExercise]);

    // Reset picker state
    setShowExercisePicker(false);
    setPickerStep('pick');
    setPickerSearch('');
    setSelectedLibraryExercise(null);
    setAdhocSets(3);
    setAdhocReps(10);
    setAdhocWeight(0);

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  /** Move an exercise up or down in the list */
  const moveExercise = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= exercises.length) return;
    setExercises(prev => {
      const next = [...prev];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  /** Enter reorder mode */
  const enterReorderMode = () => {
    setReorderMode(true);
    setExercises(prev => prev.map(e => ({ ...e, expanded: false })));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  /** Save session notes */
  const saveNotes = async (text: string) => {
    setSessionNotes(text);
    setNotesSaved(false);
    if (sessionId) {
      await updateSessionNotes(sessionId, text);
      setNotesSaved(true);
    }
  };

  /** Save an exercise note */
  const saveExerciseNoteAction = async (exerciseId: string, note: string) => {
    setExerciseNotes(prev => ({ ...prev, [exerciseId]: note }));
    if (sessionId) {
      await saveExerciseNote(sessionId, exerciseId, note);
    }
  };

  /** Update a set's weight/reps from the summary edit mode */
  const updateSetInSummary = async (exIdx: number, completedSetIdx: number, weight: number, reps: number) => {
    const ex = exercises[exIdx];
    if (!ex) return;
    // completedSetIdx refers to the index among completed sets only
    const completedSets = ex.sets
      .map((s, i) => ({ ...s, originalIdx: i }))
      .filter(s => s.status !== 'pending');
    const target = completedSets[completedSetIdx];
    if (!target?.id) return;

    await updateSet(target.id, { actualWeight: weight, actualReps: reps });

    setExercises(prev => {
      const next = [...prev];
      next[exIdx] = {
        ...next[exIdx],
        sets: next[exIdx].sets.map((s, i) =>
          i === target.originalIdx ? { ...s, actualWeight: weight, actualReps: reps } : s
        ),
      };
      return next;
    });
  };

  /** Delete the current session and reset state */
  const deleteSessionAction = async () => {
    if (!sessionId) return;
    await deleteSession(sessionId);
    setSessionId(null);
    setPhase('select');
    setExercises([]);
    setStartedAt(null);
    setFinalDuration(null);
    setPRs([]);
    setExerciseNotes({});
    setSessionNotes('');
    setEditMode(false);
    setConditioningDone(false);
  };

  /** Re-detect PRs from current set logs */
  const recalculatePRs = async () => {
    if (!sessionId) return;
    const setLogs = await getSetLogsForSession(sessionId);
    const detectedPRs = await detectPRs(
      sessionId,
      new Date().toISOString().split('T')[0],
      setLogs.map(s => ({
        exercise_id: s.exercise_id,
        actual_weight: s.actual_weight,
        actual_reps: s.actual_reps,
        status: s.status,
      }))
    );
    setPRs(detectedPRs);
  };

  /** Complete the session */
  const finishSession = async () => {
    if (!sessionId) return;
    await completeSession(sessionId, conditioningDone);

    await recalculatePRs();

    // Freeze timer before stopping it
    setFinalDuration(timerDisplay);
    setStartedAt(null);

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhase('complete');
  };

  return {
    // State
    program,
    currentWeek,
    selectedDay,
    phase,
    block,
    blockColor,
    trainingDays,
    selectedTemplate,
    exercises,
    conditioningDone,
    dayNames: DAY_NAMES,

    // Readiness
    sleep, setSleep,
    soreness, setSoreness,
    energy, setEnergy,

    // Warmup
    warmupRope, toggleWarmupRope: () => setWarmupRope(v => !v),
    warmupAnkle, toggleWarmupAnkle: () => setWarmupAnkle(v => !v),
    warmupHipIr, toggleWarmupHipIr: () => setWarmupHipIr(v => !v),

    // Override modal
    overrideModal,
    overrideWeight, setOverrideWeight,
    overrideReps, setOverrideReps,

    // Exercise picker
    showExercisePicker, setShowExercisePicker,
    pickerSearch, setPickerSearch,
    pickerStep, setPickerStep,
    selectedLibraryExercise, setSelectedLibraryExercise,
    adhocSets, setAdhocSets,
    adhocReps, setAdhocReps,
    adhocWeight, setAdhocWeight,

    // Reorder
    reorderMode, setReorderMode,

    // Session notes
    sessionNotes, notesSaved, saveNotes,

    // Timer
    timer, timerSeconds, startedAt,

    // Exercise notes
    exerciseNotes, saveExerciseNoteAction,

    // PRs
    prs,

    // Total volume
    totalVolume,

    // Conditioning
    conditioningFinisher,

    // Edit mode
    editMode, setEditMode, recalculatePRs,

    // Phase control (for Edit Warmup)
    setPhase,

    // Actions
    selectDay,
    startSession,
    completeSetAction,
    toggleExpand,
    openOverride,
    saveOverride,
    setRPE,
    submitReadiness,
    submitWarmup,
    finishSession,
    setConditioningDone,
    closeOverride: () => setOverrideModal(null),
    addAdhocExercise,
    moveExercise,
    enterReorderMode,
    deleteSessionAction,
    updateSetInSummary,
  };
}
