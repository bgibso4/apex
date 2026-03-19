import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  getActiveProgram, createSession, logSet, updateSet, deleteSet,
  completeSession, updateReadiness, updateSessionNotes,
  insertSessionProtocols, getSessionProtocols, updateProtocolCompletion,
  getLastSessionForExercise, calculateTargetWeight,
  ensureExerciseExists,
  saveExerciseNote, getExerciseNotesForSession,
  detectPRs, getPRsForSession,
  getSetLogsForSession,
  getInProgressSession, deleteSession,
  getFullSessionState, getExerciseNames, getExerciseInfo,
  shouldShowBackupReminder, exportDatabase,
} from '../db';
import type { PRRecord } from '../db/personal-records';
import { getLocalDateString } from '../utils/date';
import {
  getBlockForWeek, getBlockColor, getTrainingDays,
  getCurrentWeek, getTodayKey, getTargetForWeek, DAY_NAMES,
} from '../utils/program';
import { Colors } from '../theme';
import type { Program, ProgramDefinition, ExerciseSlot, SetLog, Session, SessionProtocol } from '../types';
import type { InputField } from '../types/fields';
import { getFieldsForExercise } from '../types/fields';
import type { SetState } from '../components/ExerciseCard';
import type { LibraryExercise } from '../data/exercise-library';
import { useSessionTimer } from './useSessionTimer';

/** Check if override values meet or exceed all targets for a set */
function checkHitTarget(vals: Record<string, number>, set: SetState): boolean {
  // Weight: actual >= target
  if (set.targetWeight != null && (vals.weight ?? 0) < set.targetWeight) return false;
  // Reps: actual >= target
  if (set.targetReps != null && (vals.reps ?? 0) < set.targetReps) return false;
  // Distance: actual >= target
  if (set.targetDistance != null && (vals.distance ?? 0) < set.targetDistance) return false;
  // Duration: actual >= target
  if (set.targetDuration != null && (vals.duration ?? 0) < set.targetDuration) return false;
  // Time: actual <= target (faster is better)
  if (set.targetTime != null && (vals.time ?? 0) > set.targetTime) return false;
  return true;
}

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
  inputFields?: InputField[];
  supersetGroup?: string;
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

  // Protocols (warmup + conditioning)
  const [protocols, setProtocols] = useState<SessionProtocol[]>([]);

  // Exercise logging
  const [exercises, setExercises] = useState<ExerciseState[]>([]);

  // Override modal
  const [overrideModal, setOverrideModal] = useState<{
    exerciseIdx: number;
    setIdx: number;
  } | null>(null);
  const [overrideValues, setOverrideValues] = useState<Record<string, number>>({});

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

  // Debounce timer for session notes
  const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up notes debounce timer on unmount
  useEffect(() => {
    return () => {
      if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    };
  }, []);

  // Prevent re-running restoration on every tab focus
  const hasAttemptedRestore = useRef(false);

  /** Restore an in-progress session if one exists */
  const restoreInProgressSession = async (
    active: (Program & { definition: ProgramDefinition }) | null
  ) => {
    if (!active) return;

    const inProgress = await getInProgressSession(active.id);
    if (!inProgress) return;

    const fullState = await getFullSessionState(inProgress.id);
    if (!fullState) return;

    const { session, setLogs, exerciseNotes: restoredNotes, protocols: restoredProtocols } = fullState;

    // Check if session is stale (>4 hours old)
    const sessionAge = Date.now() - new Date(session.started_at).getTime();
    const STALE_THRESHOLD = 4 * 60 * 60 * 1000; // 4 hours

    if (sessionAge > STALE_THRESHOLD) {
      // Show alert and wait for user decision
      await new Promise<void>((resolve) => {
        Alert.alert(
          'Resume Workout?',
          'You have an unfinished workout from earlier. What would you like to do?',
          [
            {
              text: 'Discard',
              style: 'destructive',
              onPress: async () => {
                await deleteSession(session.id);
                resolve();
              },
            },
            {
              text: 'Complete As-Is',
              onPress: async () => {
                await completeSession(session.id);
                resolve();
              },
            },
            {
              text: 'Resume',
              style: 'default',
              onPress: () => {
                performRestore(active, session, setLogs, restoredNotes, restoredProtocols);
                resolve();
              },
            },
          ],
          { cancelable: false }
        );
      });
      return;
    }

    // Not stale — restore directly
    performRestore(active, session, setLogs, restoredNotes, restoredProtocols);
  };

  /** Perform the actual state restoration from session data */
  const performRestore = async (
    active: Program & { definition: ProgramDefinition },
    session: Session,
    setLogs: SetLog[],
    restoredNotes: Record<string, string>,
    restoredProtocols: SessionProtocol[]
  ) => {
    const def = active.definition.program;
    const week = session.week_number;

    // Find the day template for this session
    const trainingDays = getTrainingDays(def.weekly_template);
    const dayEntry = trainingDays.find(d => d.day === session.day_template_id);
    const template = dayEntry?.template;

    if (!template) return; // Can't restore without a template

    // Group set logs by exercise_id
    const logsByExercise: Record<string, SetLog[]> = {};
    for (const log of setLogs) {
      if (!logsByExercise[log.exercise_id]) {
        logsByExercise[log.exercise_id] = [];
      }
      logsByExercise[log.exercise_id].push(log);
    }

    // Build exercise states from template
    const exStates: ExerciseState[] = [];
    const templateExerciseIds = new Set<string>();

    for (const slot of template.exercises) {
      templateExerciseIds.add(slot.exercise_id);
      const target = getTargetForWeek(slot, week);
      if (!target) continue;

      const exerciseDef = def.exercise_definitions.find(e => e.id === slot.exercise_id);
      const oneRm = exerciseDef?.one_rm;
      const reps = target.reps == null ? 0 : typeof target.reps === 'string' ? parseInt(target.reps) || 8 : target.reps;

      let suggestedWeight = 0;
      if (target.percent && oneRm) {
        const pct = typeof target.percent === 'string' ? parseFloat(target.percent) : target.percent;
        suggestedWeight = calculateTargetWeight(oneRm, pct);
      }

      const lastSets = await getLastSessionForExercise(slot.exercise_id);
      const lastWeight = lastSets.length > 0 ? lastSets[0].actual_weight : undefined;
      const lastReps = lastSets.length > 0 ? lastSets[0].actual_reps : undefined;
      const weight = suggestedWeight || lastWeight || slot.default_weight || 0;

      // Merge logged sets into the template sets
      const logged = logsByExercise[slot.exercise_id] || [];
      const sets: SetState[] = Array.from({ length: target.sets }, (_, i) => {
        const setNum = i + 1;
        const loggedSet = logged.find(l => l.set_number === setNum);
        if (loggedSet) {
          return {
            setNumber: setNum,
            targetWeight: loggedSet.target_weight,
            targetReps: loggedSet.target_reps,
            actualWeight: loggedSet.actual_weight ?? loggedSet.target_weight,
            actualReps: loggedSet.actual_reps ?? loggedSet.target_reps,
            targetDistance: loggedSet.target_distance,
            actualDistance: loggedSet.actual_distance ?? loggedSet.target_distance,
            targetDuration: loggedSet.target_duration,
            actualDuration: loggedSet.actual_duration ?? loggedSet.target_duration,
            targetTime: loggedSet.target_time,
            actualTime: loggedSet.actual_time ?? loggedSet.target_time,
            rpe: loggedSet.rpe ?? undefined,
            status: loggedSet.status,
            id: loggedSet.id,
          };
        }
        return {
          setNumber: setNum,
          targetWeight: weight || undefined,
          targetReps: reps || undefined,
          actualWeight: weight || undefined,
          actualReps: reps || undefined,
          ...(target.values?.distance != null && {
            targetDistance: target.values.distance,
            actualDistance: target.values.distance,
          }),
          ...(target.values?.duration != null && {
            targetDuration: target.values.duration,
            actualDuration: target.values.duration,
          }),
          ...(target.values?.time != null && {
            targetTime: target.values.time,
            actualTime: target.values.time,
          }),
          status: 'pending' as const,
        };
      });

      exStates.push({
        slot,
        exerciseName: exerciseDef?.name ?? slot.exercise_id.replace(/_/g, ' '),
        sets,
        expanded: false,
        lastWeight: lastWeight ?? undefined,
        lastReps: lastReps ?? undefined,
        inputFields: getFieldsForExercise(exerciseDef?.input_fields),
        supersetGroup: slot.superset_group,
      });
    }

    // Restore ad-hoc exercises (logged sets for exercise_ids not in the template)
    const adhocExerciseIds = Object.keys(logsByExercise).filter(id => !templateExerciseIds.has(id));
    if (adhocExerciseIds.length > 0) {
      const adhocInfo = await getExerciseInfo(adhocExerciseIds);
      for (const exerciseId of adhocExerciseIds) {
        const logged = logsByExercise[exerciseId];
        const sets: SetState[] = logged.map(l => ({
          setNumber: l.set_number,
          targetWeight: l.target_weight,
          targetReps: l.target_reps,
          actualWeight: l.actual_weight ?? l.target_weight,
          actualReps: l.actual_reps ?? l.target_reps,
          targetDistance: l.target_distance,
          actualDistance: l.actual_distance ?? l.target_distance,
          targetDuration: l.target_duration,
          actualDuration: l.actual_duration ?? l.target_duration,
          targetTime: l.target_time,
          actualTime: l.actual_time ?? l.target_time,
          rpe: l.rpe ?? undefined,
          status: l.status,
          id: l.id,
        }));

        const info = adhocInfo[exerciseId];
        exStates.push({
          slot: {
            exercise_id: exerciseId,
            category: 'accessory',
            targets: [],
          },
          exerciseName: info?.name ?? exerciseId.replace(/_/g, ' '),
          sets,
          expanded: false,
          isAdhoc: true,
          inputFields: getFieldsForExercise(info?.inputFields),
        });
      }
    }

    // Expand the first incomplete exercise
    const firstIncomplete = exStates.findIndex(ex => ex.sets.some(s => s.status === 'pending'));
    if (firstIncomplete >= 0) {
      exStates[firstIncomplete].expanded = true;
    } else if (exStates.length > 0) {
      // All complete — expand the last one
      exStates[exStates.length - 1].expanded = true;
    }

    // Restore state
    setSessionId(session.id);
    setStartedAt(session.started_at);
    setSelectedDay(session.day_template_id);

    // Restore readiness values
    if (session.sleep) setSleep(session.sleep);
    if (session.soreness) setSoreness(session.soreness);
    if (session.energy) setEnergy(session.energy);

    // Restore protocol state
    setProtocols(restoredProtocols);

    // Restore notes
    setExerciseNotes(restoredNotes);
    if (session.notes) setSessionNotes(session.notes);

    // Set exercises
    setExercises(exStates);

    // Determine phase: if any sets have been logged, go to 'logging', otherwise 'warmup'
    const hasLoggedSets = setLogs.length > 0;
    setPhase(hasLoggedSets ? 'logging' : 'warmup');
  };

  const loadData = useCallback(async () => {
    const active = await getActiveProgram();

    // Detect program change (stopped + restarted, or switched)
    const programChanged = active?.id !== program?.id;
    if (programChanged) {
      setProgram(active);
      // Reset all session state when program changes
      setSessionId(null);
      setPhase('select');
      setExercises([]);
      setStartedAt(null);
      setFinalDuration(null);
      setPRs([]);
      setExerciseNotes({});
      setSessionNotes('');
      setProtocols([]);
      hasAttemptedRestore.current = false;
    }

    if (active?.activated_date) {
      const week = getCurrentWeek(active.activated_date);
      setCurrentWeek(week);
      // Don't reset selectedDay if we're mid-session (preserves title/state on tab switch)
      const effectivePhase = programChanged ? 'select' : phase;
      if (effectivePhase === 'select') {
        setSelectedDay(getTodayKey());

        // Attempt to restore an in-progress session (only once)
        if (!hasAttemptedRestore.current) {
          hasAttemptedRestore.current = true;
          await restoreInProgressSession(active);
        }
      }
    }
  }, [phase, program?.id]);

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

  // Derived from protocols
  const conditioningDone = protocols.some(p => p.type === 'conditioning' && p.completed);

  // Total volume (sum of weight × reps for completed sets)
  const totalVolume = useMemo(() => {
    let vol = 0;
    for (const ex of exercises) {
      for (const set of ex.sets) {
        if (set.status === 'completed' || set.status === 'completed_below') {
          vol += (set.actualWeight ?? 0) * (set.actualReps ?? 0);
        }
      }
    }
    return vol;
  }, [exercises]);

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
      name: selectedTemplate.name,
      weekNumber: currentWeek,
      blockName: block.name,
      dayTemplateId: selectedDay,
      scheduledDay: selectedDay,
      actualDay: getTodayKey(),
      date: getLocalDateString(),
    });
    setSessionId(id);
    setStartedAt(new Date().toISOString());

    const exStates: ExerciseState[] = [];
    for (const slot of selectedTemplate.exercises) {
      const target = getTargetForWeek(slot, currentWeek);
      if (!target) continue;

      const exerciseDef = def.exercise_definitions.find(e => e.id === slot.exercise_id);
      const oneRm = exerciseDef?.one_rm;

      // Ensure exercise exists in DB (guards against missing exercise_definitions)
      await ensureExerciseExists({
        id: slot.exercise_id,
        name: exerciseDef?.name ?? slot.exercise_id.replace(/_/g, ' '),
        type: slot.category ?? 'accessory',
        muscleGroups: exerciseDef?.muscle_groups ?? [],
        inputFields: exerciseDef?.input_fields,
      });

      const reps = target.reps == null ? 0 : typeof target.reps === 'string' ? parseInt(target.reps) || 8 : target.reps;

      let suggestedWeight = 0;
      if (target.percent && oneRm) {
        const pct = typeof target.percent === 'string' ? parseFloat(target.percent) : target.percent;
        suggestedWeight = calculateTargetWeight(oneRm, pct);
      }

      const lastSets = await getLastSessionForExercise(slot.exercise_id);
      const lastWeight = lastSets.length > 0 ? lastSets[0].actual_weight : undefined;
      const lastReps = lastSets.length > 0 ? lastSets[0].actual_reps : undefined;
      const weight = suggestedWeight || lastWeight || slot.default_weight || 0;

      const sets: SetState[] = Array.from({ length: target.sets }, (_, i) => ({
        setNumber: i + 1,
        targetWeight: weight || undefined,
        targetReps: reps || undefined,
        actualWeight: weight || undefined,
        actualReps: reps || undefined,
        ...(target.values?.distance != null && {
          targetDistance: target.values.distance,
          actualDistance: target.values.distance,
        }),
        ...(target.values?.duration != null && {
          targetDuration: target.values.duration,
          actualDuration: target.values.duration,
        }),
        ...(target.values?.time != null && {
          targetTime: target.values.time,
          actualTime: target.values.time,
        }),
        status: 'pending' as const,
      }));

      exStates.push({
        slot,
        exerciseName: exerciseDef?.name ?? slot.exercise_id.replace(/_/g, ' '),
        sets,
        expanded: exStates.length === 0,
        lastWeight: lastWeight ?? undefined,
        lastReps: lastReps ?? undefined,
        inputFields: getFieldsForExercise(exerciseDef?.input_fields),
        supersetGroup: slot.superset_group,
      });
    }

    setExercises(exStates);

    // Insert warmup + conditioning protocols from day template
    const protocolItems: { type: string; protocolKey: string | null; protocolName: string }[] = [];
    // Normalize warmup to array (handles legacy string format from stored programs)
    const warmupKeys = Array.isArray(selectedTemplate.warmup)
      ? selectedTemplate.warmup
      : selectedTemplate.warmup ? [selectedTemplate.warmup] : [];
    if (warmupKeys.length > 0) {
      for (const key of warmupKeys) {
        const proto = def.warmup_protocols?.[key];
        const name = proto?.name ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        protocolItems.push({ type: 'warmup', protocolKey: key, protocolName: name });
      }
    }
    if (selectedTemplate.conditioning_finisher) {
      protocolItems.push({
        type: 'conditioning',
        protocolKey: null,
        protocolName: selectedTemplate.conditioning_finisher,
      });
    }
    if (protocolItems.length > 0) {
      await insertSessionProtocols(id, protocolItems);
      const sessionProtocols = await getSessionProtocols(id);
      setProtocols(sessionProtocols);
    }

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
      targetDistance: set.targetDistance,
      actualDistance: set.actualDistance ?? set.targetDistance,
      targetDuration: set.targetDuration,
      actualDuration: set.actualDuration ?? set.targetDuration,
      targetTime: set.targetTime,
      actualTime: set.actualTime ?? set.targetTime,
      status: 'completed',
      isAdhoc: ex.isAdhoc,
    });

    setExercises(prev => {
      const next = [...prev];
      next[exIdx] = {
        ...next[exIdx],
        sets: next[exIdx].sets.map((s, i) =>
          i === setIdx ? {
            ...s,
            status: 'completed' as const,
            id: setId,
            // Fill actual values from target if not yet set
            actualDistance: s.actualDistance ?? s.targetDistance,
            actualDuration: s.actualDuration ?? s.targetDuration,
            actualTime: s.actualTime ?? s.targetTime,
          } : s
        ),
      };

      // Superset auto-advance: if this exercise is in a superset group,
      // advance to the next group member with pending sets (round-robin)
      const group = next[exIdx].supersetGroup;
      if (group) {
        // Find all indices in this superset group
        const groupIndices = next
          .map((ex, i) => ex.supersetGroup === group ? i : -1)
          .filter(i => i >= 0);

        // Find the next group member (round-robin from current) with pending sets
        const posInGroup = groupIndices.indexOf(exIdx);
        let advanceTarget = -1;
        for (let offset = 1; offset < groupIndices.length; offset++) {
          const candidate = groupIndices[(posInGroup + offset) % groupIndices.length];
          if (next[candidate].sets.some(s => s.status === 'pending')) {
            advanceTarget = candidate;
            break;
          }
        }

        if (advanceTarget >= 0) {
          next[exIdx] = { ...next[exIdx], expanded: false };
          next[advanceTarget] = { ...next[advanceTarget], expanded: true };
        }
        // If no pending sets in any group member, don't advance —
        // user will set RPE which triggers normal advance
      }

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
    const vals: Record<string, number> = {};
    if (set.actualWeight != null) vals.weight = set.actualWeight;
    if (set.actualReps != null) vals.reps = set.actualReps;
    if (set.actualDistance != null) vals.distance = set.actualDistance;
    if (set.actualDuration != null) vals.duration = set.actualDuration;
    if (set.actualTime != null) vals.time = set.actualTime;
    setOverrideValues(vals);
    setOverrideModal({ exerciseIdx: exIdx, setIdx });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  /** Save override */
  const saveOverride = async () => {
    if (!overrideModal || !sessionId) return;
    const { exerciseIdx, setIdx } = overrideModal;
    const ex = exercises[exerciseIdx];
    const set = ex.sets[setIdx];

    const hitTarget = checkHitTarget(overrideValues, set);
    const status: SetLog['status'] = hitTarget ? 'completed' : 'completed_below';

    const actualUpdates: Record<string, number | undefined> = {
      actualWeight: overrideValues.weight,
      actualReps: overrideValues.reps,
      actualDistance: overrideValues.distance,
      actualDuration: overrideValues.duration,
      actualTime: overrideValues.time,
    };

    if (set.id) {
      await updateSet(set.id, { ...actualUpdates, status });
    } else {
      const setId = await logSet({
        sessionId,
        exerciseId: ex.slot.exercise_id,
        setNumber: set.setNumber,
        targetWeight: set.targetWeight,
        targetReps: set.targetReps,
        actualWeight: overrideValues.weight ?? set.actualWeight,
        actualReps: overrideValues.reps ?? set.actualReps,
        targetDistance: set.targetDistance,
        actualDistance: overrideValues.distance ?? set.actualDistance,
        targetDuration: set.targetDuration,
        actualDuration: overrideValues.duration ?? set.actualDuration,
        targetTime: set.targetTime,
        actualTime: overrideValues.time ?? set.actualTime,
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
        ...(overrideValues.weight != null && { actualWeight: overrideValues.weight }),
        ...(overrideValues.reps != null && { actualReps: overrideValues.reps }),
        ...(overrideValues.distance != null && { actualDistance: overrideValues.distance }),
        ...(overrideValues.duration != null && { actualDuration: overrideValues.duration }),
        ...(overrideValues.time != null && { actualTime: overrideValues.time }),
        status,
      };
      return next;
    });

    setOverrideModal(null);
  };

  /** Save override to all sets of the exercise */
  const saveOverrideToAll = async () => {
    if (!overrideModal || !sessionId) return;
    const { exerciseIdx } = overrideModal;
    const ex = exercises[exerciseIdx];

    for (let i = 0; i < ex.sets.length; i++) {
      const set = ex.sets[i];
      const hitTarget = checkHitTarget(overrideValues, set);
      const status: SetLog['status'] = hitTarget ? 'completed' : 'completed_below';

      const actualUpdates: Record<string, number | undefined> = {
        actualWeight: overrideValues.weight,
        actualReps: overrideValues.reps,
        actualDistance: overrideValues.distance,
        actualDuration: overrideValues.duration,
        actualTime: overrideValues.time,
      };

      if (set.id) {
        await updateSet(set.id, { ...actualUpdates, status });
      } else {
        const setId = await logSet({
          sessionId,
          exerciseId: ex.slot.exercise_id,
          setNumber: set.setNumber,
          targetWeight: set.targetWeight,
          targetReps: set.targetReps,
          actualWeight: overrideValues.weight ?? set.actualWeight,
          actualReps: overrideValues.reps ?? set.actualReps,
          targetDistance: set.targetDistance,
          actualDistance: overrideValues.distance ?? set.actualDistance,
          targetDuration: set.targetDuration,
          actualDuration: overrideValues.duration ?? set.actualDuration,
          targetTime: set.targetTime,
          actualTime: overrideValues.time ?? set.actualTime,
          status,
          isAdhoc: ex.isAdhoc,
        });
        ex.sets[i] = { ...ex.sets[i], id: setId };
      }
    }

    setExercises(prev => {
      const next = [...prev];
      next[exerciseIdx] = {
        ...next[exerciseIdx],
        sets: next[exerciseIdx].sets.map(s => {
          const hitTarget = checkHitTarget(overrideValues, s);
          return {
            ...s,
            ...(overrideValues.weight != null && { actualWeight: overrideValues.weight }),
            ...(overrideValues.reps != null && { actualReps: overrideValues.reps }),
            ...(overrideValues.distance != null && { actualDistance: overrideValues.distance }),
            ...(overrideValues.duration != null && { actualDuration: overrideValues.duration }),
            ...(overrideValues.time != null && { actualTime: overrideValues.time }),
            status: hitTarget ? 'completed' as const : 'completed_below' as const,
          };
        }),
      };
      return next;
    });

    setOverrideModal(null);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

      const group = next[exIdx].supersetGroup;

      if (group) {
        // Superset-aware advance
        const groupIndices = next
          .map((ex, i) => ex.supersetGroup === group ? i : -1)
          .filter(i => i >= 0);

        // Check if any group member still has pending sets
        const posInGroup = groupIndices.indexOf(exIdx);
        let groupAdvanceTarget = -1;
        for (let offset = 1; offset < groupIndices.length; offset++) {
          const candidate = groupIndices[(posInGroup + offset) % groupIndices.length];
          if (next[candidate].sets.some(s => s.status === 'pending')) {
            groupAdvanceTarget = candidate;
            break;
          }
        }

        if (groupAdvanceTarget >= 0) {
          // Stay in group: advance to next group member with pending sets
          next[exIdx] = { ...next[exIdx], rpe, expanded: false };
          next[groupAdvanceTarget] = { ...next[groupAdvanceTarget], expanded: true };
        } else {
          // Entire group is done: collapse all group members, advance past the group
          for (const gi of groupIndices) {
            next[gi] = { ...next[gi], expanded: false };
          }
          next[exIdx] = { ...next[exIdx], rpe, expanded: false };
          const maxGroupIdx = Math.max(...groupIndices);
          for (let i = maxGroupIdx + 1; i < next.length; i++) {
            if (next[i].sets.some(s => s.status === 'pending')) {
              next[i] = { ...next[i], expanded: true };
              break;
            }
          }
        }
      } else {
        // Non-superset: original linear advance
        if (exIdx < next.length - 1) {
          next[exIdx] = { ...next[exIdx], rpe, expanded: false };
          for (let i = exIdx + 1; i < next.length; i++) {
            if (next[i].sets.some(s => s.status === 'pending')) {
              next[i] = { ...next[i], expanded: true };
              break;
            }
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
    // Protocol completions are already persisted on toggle
    setPhase('logging');
  };

  /** Toggle a protocol's completion state */
  const toggleProtocol = async (protocolId: number) => {
    const current = protocols.find(p => p.id === protocolId);
    if (!current) return;
    const newCompleted = !current.completed;
    await updateProtocolCompletion(protocolId, newCompleted);
    setProtocols(prev => prev.map(p =>
      p.id === protocolId ? { ...p, completed: newCompleted } : p
    ));
  };

  /** Add an ad-hoc exercise to the current workout */
  const addAdhocExercise = async () => {
    if (!selectedLibraryExercise || !sessionId) return;

    await ensureExerciseExists({
      id: selectedLibraryExercise.id,
      name: selectedLibraryExercise.name,
      type: selectedLibraryExercise.type,
      muscleGroups: [selectedLibraryExercise.muscleGroup],
      inputFields: selectedLibraryExercise.inputFields,
    });

    const fields = getFieldsForExercise(selectedLibraryExercise.inputFields);
    const fieldTypes = fields.map(f => f.type);

    const sets: SetState[] = Array.from({ length: adhocSets }, (_, i) => {
      const base: SetState = { setNumber: i + 1, status: 'pending' as const };
      if (fieldTypes.includes('weight')) {
        base.targetWeight = adhocWeight;
        base.actualWeight = adhocWeight;
      }
      if (fieldTypes.includes('reps')) {
        base.targetReps = adhocReps;
        base.actualReps = adhocReps;
      }
      if (fieldTypes.includes('distance')) {
        base.targetDistance = 0;
        base.actualDistance = 0;
      }
      if (fieldTypes.includes('duration')) {
        base.targetDuration = 0;
        base.actualDuration = 0;
      }
      if (fieldTypes.includes('time')) {
        base.targetTime = 0;
        base.actualTime = 0;
      }
      return base;
    });

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
      inputFields: getFieldsForExercise(selectedLibraryExercise.inputFields),
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

  /** Save session notes (debounced — saves after 1s of inactivity) */
  const handleNotesChange = useCallback((text: string) => {
    setSessionNotes(text);
    setNotesSaved(false);
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    notesTimerRef.current = setTimeout(async () => {
      if (sessionId) {
        await updateSessionNotes(sessionId, text);
        setNotesSaved(true);
      }
    }, 1000);
  }, [sessionId]);

  /** Save an exercise note */
  const saveExerciseNoteAction = async (exerciseId: string, note: string) => {
    setExerciseNotes(prev => ({ ...prev, [exerciseId]: note }));
    if (sessionId) {
      await saveExerciseNote(sessionId, exerciseId, note);
    }
  };

  /** End the session early (calls finishSession) */
  const endEarlyAction = async () => {
    await finishSession();
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
    setProtocols([]);
  };

  /** Complete the session */
  const finishSession = async () => {
    if (!sessionId) return;
    await completeSession(sessionId);

    // Detect PRs from current set logs
    const setLogs = await getSetLogsForSession(sessionId);
    const exerciseIds = [...new Set(setLogs.map(s => s.exercise_id))];
    const exerciseInfo = await getExerciseInfo(exerciseIds);
    const detectedPRs = await detectPRs(
      sessionId,
      getLocalDateString(),
      setLogs.map(s => ({
        exercise_id: s.exercise_id,
        actual_weight: s.actual_weight ?? 0,
        actual_reps: s.actual_reps ?? 0,
        actual_duration: s.actual_duration,
        actual_time: s.actual_time,
        actual_distance: s.actual_distance,
        input_fields: exerciseInfo[s.exercise_id]?.inputFields ?? null,
        status: s.status,
      }))
    );
    setPRs(detectedPRs);

    // Freeze timer before stopping it
    setFinalDuration(timerDisplay);
    setStartedAt(null);

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhase('complete');

    // Check if backup reminder is needed (non-blocking)
    try {
      const needsBackup = await shouldShowBackupReminder();
      if (needsBackup) {
        Alert.alert(
          'Back Up Your Data?',
          "It's been a while since your last backup.",
          [
            { text: 'Dismiss', style: 'cancel' },
            {
              text: 'Export Now',
              onPress: async () => {
                try {
                  await exportDatabase();
                } catch { /* silently fail — non-critical */ }
              },
            },
          ],
        );
      }
    } catch { /* silently fail — non-critical */ }
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

    // Protocols (warmup + conditioning)
    protocols,
    toggleProtocol,

    // Override modal
    overrideModal,
    overrideValues, setOverrideValues,

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
    sessionNotes, notesSaved, onNotesChange: handleNotesChange,

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

    // Session ID (for navigation to session detail)
    sessionId,

    // Phase control (for Edit Warmup)
    setPhase,

    // Actions
    selectDay,
    startSession,
    completeSetAction,
    toggleExpand,
    openOverride,
    saveOverride,
    saveOverrideToAll,
    setRPE,
    submitReadiness,
    submitWarmup,
    finishSession,
    closeOverride: () => setOverrideModal(null),
    addAdhocExercise,
    moveExercise,
    enterReorderMode,
    deleteSessionAction,
    endEarlyAction,
  };
}
