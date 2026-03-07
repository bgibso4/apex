import { renderHook, act, waitFor } from '@testing-library/react-native';

// Suppress "not wrapped in act(...)" warnings from async loadData fired by useFocusEffect mock.
// The hook's loadData is an async callback triggered synchronously by the mock — React warns about
// the state updates, but we properly wait for them with waitFor(). This is a known testing pattern.
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) return;
    originalConsoleError(...args);
  };
});
afterAll(() => {
  console.error = originalConsoleError;
});

// --- Mocks ---

jest.mock('expo-router', () => ({
  useFocusEffect: (cb: () => void) => cb(),
}));

// expo-haptics is mocked via __mocks__/expo-haptics.ts automatically

jest.mock('../../src/db', () => ({
  getActiveProgram: jest.fn(),
  createSession: jest.fn(),
  logSet: jest.fn(),
  updateSet: jest.fn(),
  deleteSet: jest.fn(),
  completeSession: jest.fn(),
  updateReadiness: jest.fn(),
  updateWarmup: jest.fn(),
  updateSessionNotes: jest.fn(),
  getLastSessionForExercise: jest.fn(),
  calculateTargetWeight: jest.fn(),
  ensureExerciseExists: jest.fn(),
  getCompletedSessionForDay: jest.fn(),
  getSetLogsForSession: jest.fn(),
  getExerciseNames: jest.fn(),
  getExerciseNotesForSession: jest.fn(),
  getPRsForSession: jest.fn(),
  detectPRs: jest.fn(),
  saveExerciseNote: jest.fn(),
}));

jest.mock('../../src/utils/program', () => ({
  getBlockForWeek: jest.fn(),
  getBlockColor: jest.fn(),
  getTrainingDays: jest.fn(),
  getCurrentWeek: jest.fn(),
  getTodayKey: jest.fn(),
  getTargetForWeek: jest.fn(),
  DAY_NAMES: {
    sunday: 'Sun', monday: 'Mon', tuesday: 'Tue',
    wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat',
  },
}));

jest.mock('../../src/theme', () => ({
  Colors: { indigo: '#6366f1' },
}));

import { useWorkoutSession } from '../../src/hooks/useWorkoutSession';
import * as Haptics from 'expo-haptics';
import {
  getActiveProgram, createSession, logSet, updateSet, deleteSet,
  completeSession, updateReadiness, updateWarmup, updateSessionNotes,
  getLastSessionForExercise, calculateTargetWeight,
  ensureExerciseExists, getCompletedSessionForDay, getSetLogsForSession,
  getExerciseNames, getExerciseNotesForSession, getPRsForSession, detectPRs,
} from '../../src/db';
import {
  getBlockForWeek, getBlockColor, getTrainingDays,
  getCurrentWeek, getTodayKey, getTargetForWeek,
} from '../../src/utils/program';

// Cast to jest.Mock
const mockedGetActiveProgram = getActiveProgram as jest.Mock;
const mockedCreateSession = createSession as jest.Mock;
const mockedLogSet = logSet as jest.Mock;
const mockedUpdateSet = updateSet as jest.Mock;
const mockedDeleteSet = deleteSet as jest.Mock;
const mockedCompleteSession = completeSession as jest.Mock;
const mockedUpdateReadiness = updateReadiness as jest.Mock;
const mockedUpdateWarmup = updateWarmup as jest.Mock;
const mockedUpdateSessionNotes = updateSessionNotes as jest.Mock;
const mockedGetLastSessionForExercise = getLastSessionForExercise as jest.Mock;
const mockedCalculateTargetWeight = calculateTargetWeight as jest.Mock;
const mockedEnsureExerciseExists = ensureExerciseExists as jest.Mock;
const mockedGetCompletedSessionForDay = getCompletedSessionForDay as jest.Mock;
const mockedGetSetLogsForSession = getSetLogsForSession as jest.Mock;
const mockedGetExerciseNames = getExerciseNames as jest.Mock;
const mockedGetExerciseNotesForSession = getExerciseNotesForSession as jest.Mock;
const mockedGetPRsForSession = getPRsForSession as jest.Mock;
const mockedDetectPRs = detectPRs as jest.Mock;

const mockedGetBlockForWeek = getBlockForWeek as jest.Mock;
const mockedGetBlockColor = getBlockColor as jest.Mock;
const mockedGetTrainingDays = getTrainingDays as jest.Mock;
const mockedGetCurrentWeek = getCurrentWeek as jest.Mock;
const mockedGetTodayKey = getTodayKey as jest.Mock;
const mockedGetTargetForWeek = getTargetForWeek as jest.Mock;

// --- Test data factories ---

function makeProgram(overrides: Record<string, unknown> = {}) {
  return {
    id: 'prog-1',
    name: 'Test Program',
    duration_weeks: 12,
    created_date: '2025-01-01',
    status: 'active' as const,
    definition_json: '{}',
    activated_date: '2025-01-01',
    one_rm_values: { squat: 300, bench_press: 225 },
    definition: {
      program: {
        name: 'Test Program',
        duration_weeks: 12,
        created: '2025-01-01',
        blocks: [
          { name: 'Hypertrophy', weeks: [1, 2, 3, 4], emphasis: 'hypertrophy', main_lift_scheme: {} },
        ],
        weekly_template: {
          monday: {
            name: 'Upper A',
            warmup: 'default',
            exercises: [
              {
                exercise_id: 'bench_press',
                category: 'main' as const,
                targets: [{ weeks: [1, 2, 3, 4], sets: 3, reps: 8, percent: 0.75 }],
              },
              {
                exercise_id: 'row',
                category: 'compound_accessory' as const,
                targets: [{ weeks: [1, 2, 3, 4], sets: 3, reps: 10 }],
              },
            ],
          },
          wednesday: {
            name: 'Lower A',
            warmup: 'default',
            exercises: [
              {
                exercise_id: 'squat',
                category: 'main' as const,
                targets: [{ weeks: [1, 2, 3, 4], sets: 4, reps: 5, percent: 0.8 }],
              },
            ],
          },
        },
        exercise_definitions: [
          { id: 'bench_press', name: 'Bench Press', type: 'main', muscle_groups: ['chest'] },
          { id: 'row', name: 'Barbell Row', type: 'accessory', muscle_groups: ['back'] },
          { id: 'squat', name: 'Back Squat', type: 'main', muscle_groups: ['legs'] },
        ],
        warmup_protocols: {},
      },
    },
    ...overrides,
  };
}

function makeMondayTrainingDays() {
  const prog = makeProgram();
  const template = prog.definition.program.weekly_template;
  return [
    { day: 'monday', template: template.monday },
    { day: 'wednesday', template: template.wednesday },
  ];
}

const fakeBlock = { name: 'Hypertrophy', weeks: [1, 2, 3, 4], emphasis: 'hypertrophy', main_lift_scheme: {} };

/**
 * Set up all mocks so that the hook loads with a program, on a monday,
 * week 1, with no completed session for today.
 */
function setupDefaultMocks() {
  const prog = makeProgram();
  mockedGetActiveProgram.mockResolvedValue(prog);
  mockedGetCompletedSessionForDay.mockResolvedValue(null);
  mockedCreateSession.mockResolvedValue('session-1');
  mockedLogSet.mockResolvedValue('set-1');
  mockedUpdateSet.mockResolvedValue(undefined);
  mockedDeleteSet.mockResolvedValue(undefined);
  mockedCompleteSession.mockResolvedValue(undefined);
  mockedUpdateReadiness.mockResolvedValue(undefined);
  mockedUpdateWarmup.mockResolvedValue(undefined);
  mockedUpdateSessionNotes.mockResolvedValue(undefined);
  mockedGetLastSessionForExercise.mockResolvedValue([]);
  mockedCalculateTargetWeight.mockImplementation(
    (oneRm: number, pct: number) => Math.round(oneRm * pct / 5) * 5,
  );
  mockedEnsureExerciseExists.mockResolvedValue(undefined);
  mockedGetSetLogsForSession.mockResolvedValue([]);
  mockedGetExerciseNames.mockResolvedValue({});
  mockedGetExerciseNotesForSession.mockResolvedValue({});
  mockedGetPRsForSession.mockResolvedValue([]);
  mockedDetectPRs.mockResolvedValue([]);

  mockedGetCurrentWeek.mockReturnValue(1);
  mockedGetTodayKey.mockReturnValue('monday');
  mockedGetBlockForWeek.mockReturnValue(fakeBlock);
  mockedGetBlockColor.mockReturnValue('#6366f1');
  mockedGetTrainingDays.mockReturnValue(makeMondayTrainingDays());
  mockedGetTargetForWeek.mockImplementation(
    (slot: { targets: Array<{ weeks: number[] }> }, week: number) => {
      return slot.targets.find((t: { weeks: number[] }) => t.weeks.includes(week)) ?? null;
    },
  );
}

/**
 * Render the hook and wait for initial loadData to resolve.
 * loadData fires async state updates so we use waitFor.
 */
async function renderAndLoad() {
  setupDefaultMocks();
  const hookResult = renderHook(() => useWorkoutSession());

  await waitFor(() => {
    // Wait until program is loaded (selectedDay is set by loadData)
    expect(hookResult.result.current.selectedDay).toBe('monday');
  });

  return hookResult;
}

/**
 * Helper: render the hook, then start a session so exercises are populated
 * and phase is 'warmup'. Then advance to 'logging' via submitWarmup.
 */
async function setupWithSession() {
  const hookResult = await renderAndLoad();

  // Start session (goes to warmup phase)
  await act(async () => {
    await hookResult.result.current.startSession();
  });

  // Move to logging phase
  await act(async () => {
    await hookResult.result.current.submitWarmup();
  });

  return hookResult;
}

// --- Tests ---

describe('useWorkoutSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // 1. Initial state values
  // -----------------------------------------------------------------------
  describe('initial state', () => {
    it('has phase="select" and default readiness values', async () => {
      mockedGetActiveProgram.mockResolvedValue(null);
      mockedGetBlockForWeek.mockReturnValue(undefined);
      mockedGetBlockColor.mockReturnValue('#6366f1');
      mockedGetTrainingDays.mockReturnValue([]);

      const { result } = renderHook(() => useWorkoutSession());

      await waitFor(() => {
        expect(mockedGetActiveProgram).toHaveBeenCalled();
      });

      expect(result.current.phase).toBe('select');
      expect(result.current.sleep).toBe(3);
      expect(result.current.soreness).toBe(3);
      expect(result.current.energy).toBe(3);
      expect(result.current.warmupRope).toBe(false);
      expect(result.current.warmupAnkle).toBe(false);
      expect(result.current.warmupHipIr).toBe(false);
      expect(result.current.exercises).toEqual([]);
      expect(result.current.conditioningDone).toBe(false);
      expect(result.current.overrideModal).toBeNull();
      expect(result.current.showExercisePicker).toBe(false);
      expect(result.current.reorderMode).toBe(false);
      expect(result.current.sessionNotes).toBe('');
      expect(result.current.notesSaved).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // 2. loadData with no active program
  // -----------------------------------------------------------------------
  describe('loadData with no active program', () => {
    it('sets program to null and stays on select phase', async () => {
      mockedGetActiveProgram.mockResolvedValue(null);
      mockedGetBlockForWeek.mockReturnValue(undefined);
      mockedGetBlockColor.mockReturnValue('#6366f1');
      mockedGetTrainingDays.mockReturnValue([]);

      const { result } = renderHook(() => useWorkoutSession());

      await waitFor(() => {
        expect(mockedGetActiveProgram).toHaveBeenCalled();
      });

      expect(result.current.program).toBeNull();
      expect(result.current.phase).toBe('select');
      expect(mockedGetCompletedSessionForDay).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // 3. loadData with active program + completed session
  // -----------------------------------------------------------------------
  describe('loadData with completed session', () => {
    // TODO: Re-enable when completed session restore is wired into loadData
    it.skip('restores exercises and sets phase to complete', async () => {
      const prog = makeProgram();
      mockedGetActiveProgram.mockResolvedValue(prog);
      mockedGetCurrentWeek.mockReturnValue(1);
      mockedGetTodayKey.mockReturnValue('monday');
      mockedGetBlockForWeek.mockReturnValue(fakeBlock);
      mockedGetBlockColor.mockReturnValue('#6366f1');
      mockedGetTrainingDays.mockReturnValue(makeMondayTrainingDays());

      const completedSession = { id: 'sess-done', notes: 'Great workout' };
      mockedGetCompletedSessionForDay.mockResolvedValue(completedSession);
      mockedGetExerciseNotesForSession.mockResolvedValue({});
      mockedGetPRsForSession.mockResolvedValue([]);

      const setLogs = [
        {
          id: 'log-1', exercise_id: 'bench_press', set_number: 1,
          target_weight: 170, target_reps: 8,
          actual_weight: 170, actual_reps: 8,
          status: 'completed', is_adhoc: 0,
        },
        {
          id: 'log-2', exercise_id: 'bench_press', set_number: 2,
          target_weight: 170, target_reps: 8,
          actual_weight: 165, actual_reps: 7,
          status: 'completed_below', is_adhoc: 0,
        },
      ];
      mockedGetSetLogsForSession.mockResolvedValue(setLogs);
      mockedGetExerciseNames.mockResolvedValue({ bench_press: 'Bench Press' });

      const { result } = renderHook(() => useWorkoutSession());

      await waitFor(() => {
        expect(result.current.phase).toBe('complete');
      });

      expect(result.current.exercises).toHaveLength(1);
      expect(result.current.exercises[0].exerciseName).toBe('Bench Press');
      expect(result.current.exercises[0].sets).toHaveLength(2);
      expect(result.current.exercises[0].sets[0].status).toBe('completed');
      expect(result.current.exercises[0].sets[1].status).toBe('completed_below');
      expect(result.current.sessionNotes).toBe('Great workout');
    });

    // TODO: Re-enable when completed session restore is wired into loadData
    it.skip('falls back to exercise_id for unknown exercise name', async () => {
      const prog = makeProgram();
      mockedGetActiveProgram.mockResolvedValue(prog);
      mockedGetCurrentWeek.mockReturnValue(1);
      mockedGetTodayKey.mockReturnValue('monday');
      mockedGetBlockForWeek.mockReturnValue(fakeBlock);
      mockedGetBlockColor.mockReturnValue('#6366f1');
      mockedGetTrainingDays.mockReturnValue(makeMondayTrainingDays());

      const completedSession = { id: 'sess-done', notes: null };
      mockedGetCompletedSessionForDay.mockResolvedValue(completedSession);
      mockedGetExerciseNotesForSession.mockResolvedValue({});
      mockedGetPRsForSession.mockResolvedValue([]);

      const setLogs = [
        {
          id: 'log-1', exercise_id: 'cable_fly', set_number: 1,
          target_weight: 30, target_reps: 12,
          actual_weight: null, actual_reps: null,
          status: 'completed', is_adhoc: 1,
        },
      ];
      mockedGetSetLogsForSession.mockResolvedValue(setLogs);
      mockedGetExerciseNames.mockResolvedValue({});

      const { result } = renderHook(() => useWorkoutSession());

      await waitFor(() => {
        expect(result.current.phase).toBe('complete');
      });

      expect(result.current.exercises[0].exerciseName).toBe('cable fly');
      expect(result.current.exercises[0].isAdhoc).toBe(true);
      // actual_weight/actual_reps null falls back to target
      expect(result.current.exercises[0].sets[0].actualWeight).toBe(30);
      expect(result.current.exercises[0].sets[0].actualReps).toBe(12);
      expect(result.current.sessionNotes).toBe('');
    });
  });

  // -----------------------------------------------------------------------
  // 4. selectDay changes day and resets phase
  // -----------------------------------------------------------------------
  describe('selectDay', () => {
    it('changes selectedDay and resets phase if not already select', async () => {
      const hookResult = await renderAndLoad();

      // Start a session to move away from select phase
      await act(async () => {
        await hookResult.result.current.startSession();
      });
      expect(hookResult.result.current.phase).toBe('warmup');

      act(() => {
        hookResult.result.current.selectDay('wednesday');
      });

      expect(hookResult.result.current.selectedDay).toBe('wednesday');
      expect(hookResult.result.current.phase).toBe('select');
    });

    it('does not change phase if already on select', async () => {
      const hookResult = await renderAndLoad();
      expect(hookResult.result.current.phase).toBe('select');

      act(() => {
        hookResult.result.current.selectDay('wednesday');
      });

      expect(hookResult.result.current.selectedDay).toBe('wednesday');
      expect(hookResult.result.current.phase).toBe('select');
    });
  });

  // -----------------------------------------------------------------------
  // 5. startSession
  // -----------------------------------------------------------------------
  describe('startSession', () => {
    it('creates session, builds exercise states, sets phase to warmup', async () => {
      const hookResult = await renderAndLoad();

      await act(async () => {
        await hookResult.result.current.startSession();
      });

      expect(mockedCreateSession).toHaveBeenCalledWith(
        expect.objectContaining({
          programId: 'prog-1',
          weekNumber: 1,
          blockName: 'Hypertrophy',
          dayTemplateId: 'monday',
        }),
      );

      expect(hookResult.result.current.phase).toBe('warmup');
      // monday template has 2 exercises: bench_press and row
      expect(hookResult.result.current.exercises).toHaveLength(2);

      // First exercise should be expanded
      expect(hookResult.result.current.exercises[0].expanded).toBe(true);
      expect(hookResult.result.current.exercises[0].exerciseName).toBe('Bench Press');
      expect(hookResult.result.current.exercises[0].sets).toHaveLength(3);

      // Second exercise should not be expanded
      expect(hookResult.result.current.exercises[1].expanded).toBe(false);
      expect(hookResult.result.current.exercises[1].exerciseName).toBe('Barbell Row');
    });

    it('uses calculateTargetWeight for exercises with percent + 1RM', async () => {
      const hookResult = await renderAndLoad();

      await act(async () => {
        await hookResult.result.current.startSession();
      });

      // bench_press has percent=0.75 and 1RM=225
      expect(mockedCalculateTargetWeight).toHaveBeenCalledWith(225, 0.75);
    });

    it('uses last session weight when no percent-based suggestion', async () => {
      setupDefaultMocks();
      mockedGetLastSessionForExercise.mockImplementation(async (exerciseId: string) => {
        if (exerciseId === 'row') {
          return [{ actual_weight: 135, actual_reps: 10 }];
        }
        return [];
      });

      const hookResult = renderHook(() => useWorkoutSession());
      await waitFor(() => {
        expect(hookResult.result.current.selectedDay).toBe('monday');
      });

      await act(async () => {
        await hookResult.result.current.startSession();
      });

      // row has no percent, so it should use lastWeight
      const rowExercise = hookResult.result.current.exercises[1];
      expect(rowExercise.sets[0].targetWeight).toBe(135);
      expect(rowExercise.lastWeight).toBe(135);
      expect(rowExercise.lastReps).toBe(10);
    });

    it('does nothing when program/template/block not available', async () => {
      mockedGetActiveProgram.mockResolvedValue(null);
      mockedGetBlockForWeek.mockReturnValue(undefined);
      mockedGetTrainingDays.mockReturnValue([]);

      const hookResult = renderHook(() => useWorkoutSession());
      await waitFor(() => {
        expect(mockedGetActiveProgram).toHaveBeenCalled();
      });

      await act(async () => {
        await hookResult.result.current.startSession();
      });

      expect(mockedCreateSession).not.toHaveBeenCalled();
      expect(hookResult.result.current.phase).toBe('select');
    });
  });

  // -----------------------------------------------------------------------
  // 6. completeSetAction - logs a set
  // -----------------------------------------------------------------------
  describe('completeSetAction', () => {
    it('logs a set and marks as completed', async () => {
      const hookResult = await setupWithSession();
      mockedLogSet.mockResolvedValue('new-set-id');

      await act(async () => {
        await hookResult.result.current.completeSetAction(0, 0);
      });

      expect(mockedLogSet).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-1',
          exerciseId: 'bench_press',
          setNumber: 1,
          status: 'completed',
        }),
      );

      expect(hookResult.result.current.exercises[0].sets[0].status).toBe('completed');
      expect(hookResult.result.current.exercises[0].sets[0].id).toBe('new-set-id');
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    });

    // -------------------------------------------------------------------
    // 7. completeSetAction - toggle completed back to pending
    // -------------------------------------------------------------------
    it('toggles a completed set back to pending and deletes from DB', async () => {
      const hookResult = await setupWithSession();
      mockedLogSet.mockResolvedValue('set-to-delete');

      // First complete
      await act(async () => {
        await hookResult.result.current.completeSetAction(0, 0);
      });
      expect(hookResult.result.current.exercises[0].sets[0].status).toBe('completed');
      expect(hookResult.result.current.exercises[0].sets[0].id).toBe('set-to-delete');

      // Then toggle back
      jest.clearAllMocks();
      await act(async () => {
        await hookResult.result.current.completeSetAction(0, 0);
      });

      expect(mockedDeleteSet).toHaveBeenCalledWith('set-to-delete');
      expect(hookResult.result.current.exercises[0].sets[0].status).toBe('pending');
      expect(hookResult.result.current.exercises[0].sets[0].id).toBeUndefined();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });

    // -------------------------------------------------------------------
    // 8. completeSetAction - auto-expands next exercise
    // -------------------------------------------------------------------
    it('auto-expands next exercise when all sets done and RPE selected', async () => {
      const hookResult = await setupWithSession();
      let setIdCounter = 0;
      mockedLogSet.mockImplementation(async () => `set-${++setIdCounter}`);

      // Complete all 3 sets of exercise 0 (bench_press)
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          await hookResult.result.current.completeSetAction(0, i);
        });
      }

      // Auto-advance should NOT happen yet (RPE not selected)
      expect(hookResult.result.current.exercises[0].expanded).toBe(true);

      // Select RPE — this triggers auto-advance
      await act(async () => {
        await hookResult.result.current.setRPE(0, 7);
      });

      // Exercise 0 should be collapsed, exercise 1 should be expanded
      expect(hookResult.result.current.exercises[0].expanded).toBe(false);
      expect(hookResult.result.current.exercises[1].expanded).toBe(true);
    });

    it('does nothing without a sessionId', async () => {
      // Render hook without starting a session (no sessionId)
      mockedGetActiveProgram.mockResolvedValue(null);
      mockedGetBlockForWeek.mockReturnValue(undefined);
      mockedGetTrainingDays.mockReturnValue([]);

      const hookResult = renderHook(() => useWorkoutSession());
      await waitFor(() => {
        expect(mockedGetActiveProgram).toHaveBeenCalled();
      });

      await act(async () => {
        await hookResult.result.current.completeSetAction(0, 0);
      });

      expect(mockedLogSet).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // 9. toggleExpand
  // -----------------------------------------------------------------------
  describe('toggleExpand', () => {
    it('toggles exercise expanded state', async () => {
      const hookResult = await setupWithSession();

      // Exercise 0 starts expanded (first exercise), toggle it off
      expect(hookResult.result.current.exercises[0].expanded).toBe(true);

      act(() => {
        hookResult.result.current.toggleExpand(0);
      });
      expect(hookResult.result.current.exercises[0].expanded).toBe(false);

      // Toggle it back on
      act(() => {
        hookResult.result.current.toggleExpand(0);
      });
      expect(hookResult.result.current.exercises[0].expanded).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 10. openOverride
  // -----------------------------------------------------------------------
  describe('openOverride', () => {
    it('opens modal with current set values', async () => {
      const hookResult = await setupWithSession();

      const setBeforeOpen = hookResult.result.current.exercises[0].sets[0];

      act(() => {
        hookResult.result.current.openOverride(0, 0);
      });

      expect(hookResult.result.current.overrideModal).toEqual({
        exerciseIdx: 0,
        setIdx: 0,
      });
      expect(hookResult.result.current.overrideWeight).toBe(setBeforeOpen.actualWeight);
      expect(hookResult.result.current.overrideReps).toBe(setBeforeOpen.actualReps);
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });
  });

  // -----------------------------------------------------------------------
  // 11. saveOverride - existing set.id -> updateSet
  // -----------------------------------------------------------------------
  describe('saveOverride', () => {
    it('calls updateSet when set already has an id', async () => {
      const hookResult = await setupWithSession();
      mockedLogSet.mockResolvedValue('existing-set-id');

      // Complete a set first so it has an id
      await act(async () => {
        await hookResult.result.current.completeSetAction(0, 0);
      });

      // Open override and change values
      act(() => {
        hookResult.result.current.openOverride(0, 0);
      });
      act(() => {
        hookResult.result.current.setOverrideWeight(200);
        hookResult.result.current.setOverrideReps(6);
      });

      await act(async () => {
        await hookResult.result.current.saveOverride();
      });

      expect(mockedUpdateSet).toHaveBeenCalledWith('existing-set-id', expect.objectContaining({
        actualWeight: 200,
        actualReps: 6,
      }));
      expect(hookResult.result.current.overrideModal).toBeNull();
      expect(hookResult.result.current.exercises[0].sets[0].actualWeight).toBe(200);
      expect(hookResult.result.current.exercises[0].sets[0].actualReps).toBe(6);
    });

    // -------------------------------------------------------------------
    // 12. saveOverride - no set.id -> logSet, marks completed_below
    // -------------------------------------------------------------------
    it('calls logSet when set has no id and marks completed_below if below target', async () => {
      const hookResult = await setupWithSession();
      mockedLogSet.mockResolvedValue('override-set-id');

      // Open override on a pending set (no id)
      act(() => {
        hookResult.result.current.openOverride(0, 0);
      });

      const targetWeight = hookResult.result.current.exercises[0].sets[0].targetWeight;
      const targetReps = hookResult.result.current.exercises[0].sets[0].targetReps;

      // Set values below target
      act(() => {
        hookResult.result.current.setOverrideWeight(targetWeight - 10);
        hookResult.result.current.setOverrideReps(targetReps - 2);
      });

      await act(async () => {
        await hookResult.result.current.saveOverride();
      });

      expect(mockedLogSet).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-1',
          status: 'completed_below',
          actualWeight: targetWeight - 10,
          actualReps: targetReps - 2,
        }),
      );

      expect(hookResult.result.current.exercises[0].sets[0].status).toBe('completed_below');
      expect(hookResult.result.current.exercises[0].sets[0].id).toBe('override-set-id');
      expect(hookResult.result.current.overrideModal).toBeNull();
    });

    it('marks completed when override values meet or exceed target', async () => {
      const hookResult = await setupWithSession();
      mockedLogSet.mockResolvedValue('override-set-id-2');

      act(() => {
        hookResult.result.current.openOverride(0, 0);
      });

      const targetWeight = hookResult.result.current.exercises[0].sets[0].targetWeight;
      const targetReps = hookResult.result.current.exercises[0].sets[0].targetReps;

      // Set values equal to target (should be 'completed')
      act(() => {
        hookResult.result.current.setOverrideWeight(targetWeight);
        hookResult.result.current.setOverrideReps(targetReps);
      });

      await act(async () => {
        await hookResult.result.current.saveOverride();
      });

      expect(hookResult.result.current.exercises[0].sets[0].status).toBe('completed');
    });

    it('does nothing when overrideModal is null', async () => {
      const hookResult = await setupWithSession();
      jest.clearAllMocks();

      await act(async () => {
        await hookResult.result.current.saveOverride();
      });

      expect(mockedUpdateSet).not.toHaveBeenCalled();
      expect(mockedLogSet).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // 13. setRPE
  // -----------------------------------------------------------------------
  describe('setRPE', () => {
    it('updates RPE on exercise and all completed sets in DB', async () => {
      const hookResult = await setupWithSession();
      let setIdCounter = 0;
      mockedLogSet.mockImplementation(async () => `rpe-set-${++setIdCounter}`);

      // Complete first two sets
      await act(async () => {
        await hookResult.result.current.completeSetAction(0, 0);
      });
      await act(async () => {
        await hookResult.result.current.completeSetAction(0, 1);
      });

      jest.clearAllMocks();

      // Set RPE
      await act(async () => {
        await hookResult.result.current.setRPE(0, 8);
      });

      // updateSet called for each completed set (2 of 3)
      expect(mockedUpdateSet).toHaveBeenCalledTimes(2);
      expect(mockedUpdateSet).toHaveBeenCalledWith('rpe-set-1', { rpe: 8 });
      expect(mockedUpdateSet).toHaveBeenCalledWith('rpe-set-2', { rpe: 8 });

      expect(hookResult.result.current.exercises[0].rpe).toBe(8);
    });

    it('does not call updateSet for pending sets', async () => {
      const hookResult = await setupWithSession();
      jest.clearAllMocks();

      // Don't complete any sets, just set RPE
      await act(async () => {
        await hookResult.result.current.setRPE(0, 7);
      });

      expect(mockedUpdateSet).not.toHaveBeenCalled();
      expect(hookResult.result.current.exercises[0].rpe).toBe(7);
    });
  });

  // -----------------------------------------------------------------------
  // 14. submitReadiness
  // -----------------------------------------------------------------------
  describe('submitReadiness', () => {
    it('calls updateReadiness and moves to warmup phase', async () => {
      const hookResult = await renderAndLoad();

      // Start session to get a sessionId
      await act(async () => {
        await hookResult.result.current.startSession();
      });

      // Adjust readiness values
      act(() => {
        hookResult.result.current.setSleep(4);
        hookResult.result.current.setSoreness(2);
        hookResult.result.current.setEnergy(5);
      });

      await act(async () => {
        await hookResult.result.current.submitReadiness();
      });

      expect(mockedUpdateReadiness).toHaveBeenCalledWith('session-1', 4, 2, 5);
      expect(hookResult.result.current.phase).toBe('warmup');
    });

    it('still moves to warmup even without sessionId', async () => {
      mockedGetActiveProgram.mockResolvedValue(null);
      mockedGetBlockForWeek.mockReturnValue(undefined);
      mockedGetTrainingDays.mockReturnValue([]);

      const hookResult = renderHook(() => useWorkoutSession());
      await waitFor(() => {
        expect(mockedGetActiveProgram).toHaveBeenCalled();
      });

      await act(async () => {
        await hookResult.result.current.submitReadiness();
      });

      expect(mockedUpdateReadiness).not.toHaveBeenCalled();
      expect(hookResult.result.current.phase).toBe('warmup');
    });
  });

  // -----------------------------------------------------------------------
  // 15. submitWarmup
  // -----------------------------------------------------------------------
  describe('submitWarmup', () => {
    it('calls updateWarmup with warmup state and moves to logging phase', async () => {
      const hookResult = await renderAndLoad();

      // Start session
      await act(async () => {
        await hookResult.result.current.startSession();
      });

      // Toggle warmup items
      act(() => {
        hookResult.result.current.toggleWarmupRope();
        hookResult.result.current.toggleWarmupAnkle();
      });

      await act(async () => {
        await hookResult.result.current.submitWarmup();
      });

      expect(mockedUpdateWarmup).toHaveBeenCalledWith('session-1', {
        rope: true,
        ankle: true,
        hipIr: false,
      });
      expect(hookResult.result.current.phase).toBe('logging');
    });
  });

  // -----------------------------------------------------------------------
  // 16. addAdhocExercise
  // -----------------------------------------------------------------------
  describe('addAdhocExercise', () => {
    it('adds exercise and resets picker state', async () => {
      const hookResult = await setupWithSession();

      const libraryExercise = {
        id: 'lateral_raise',
        name: 'Lateral Raise',
        muscleGroup: 'Shoulders',
        type: 'accessory' as const,
      };

      // Set up picker state
      act(() => {
        hookResult.result.current.setSelectedLibraryExercise(libraryExercise);
        hookResult.result.current.setShowExercisePicker(true);
        hookResult.result.current.setPickerStep('configure');
        hookResult.result.current.setAdhocSets(4);
        hookResult.result.current.setAdhocReps(15);
        hookResult.result.current.setAdhocWeight(20);
      });

      const exerciseCountBefore = hookResult.result.current.exercises.length;

      await act(async () => {
        await hookResult.result.current.addAdhocExercise();
      });

      // Exercise added
      expect(hookResult.result.current.exercises).toHaveLength(exerciseCountBefore + 1);
      const added = hookResult.result.current.exercises[exerciseCountBefore];
      expect(added.exerciseName).toBe('Lateral Raise');
      expect(added.isAdhoc).toBe(true);
      expect(added.sets).toHaveLength(4);
      expect(added.sets[0].targetWeight).toBe(20);
      expect(added.sets[0].targetReps).toBe(15);
      expect(added.expanded).toBe(false);
      expect(added.slot.category).toBe('accessory');

      // Picker state reset
      expect(hookResult.result.current.showExercisePicker).toBe(false);
      expect(hookResult.result.current.pickerStep).toBe('pick');
      expect(hookResult.result.current.pickerSearch).toBe('');
      expect(hookResult.result.current.selectedLibraryExercise).toBeNull();
      expect(hookResult.result.current.adhocSets).toBe(3);
      expect(hookResult.result.current.adhocReps).toBe(10);
      expect(hookResult.result.current.adhocWeight).toBe(0);

      // DB call
      expect(mockedEnsureExerciseExists).toHaveBeenCalledWith({
        id: 'lateral_raise',
        name: 'Lateral Raise',
        type: 'accessory',
        muscleGroups: ['Shoulders'],
      });

      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    });

    it('sets category to core for core-type exercises', async () => {
      const hookResult = await setupWithSession();

      const coreExercise = {
        id: 'plank',
        name: 'Plank',
        muscleGroup: 'Core',
        type: 'core' as const,
      };

      act(() => {
        hookResult.result.current.setSelectedLibraryExercise(coreExercise);
      });

      await act(async () => {
        await hookResult.result.current.addAdhocExercise();
      });

      const added = hookResult.result.current.exercises[hookResult.result.current.exercises.length - 1];
      expect(added.slot.category).toBe('core');
    });

    it('does nothing without a selected library exercise', async () => {
      const hookResult = await setupWithSession();
      const countBefore = hookResult.result.current.exercises.length;

      await act(async () => {
        await hookResult.result.current.addAdhocExercise();
      });

      expect(hookResult.result.current.exercises).toHaveLength(countBefore);
      expect(mockedEnsureExerciseExists).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // 17. moveExercise
  // -----------------------------------------------------------------------
  describe('moveExercise', () => {
    it('swaps exercises when moving down', async () => {
      const hookResult = await setupWithSession();
      const name0 = hookResult.result.current.exercises[0].exerciseName;
      const name1 = hookResult.result.current.exercises[1].exerciseName;

      act(() => {
        hookResult.result.current.moveExercise(0, 1);
      });

      expect(hookResult.result.current.exercises[0].exerciseName).toBe(name1);
      expect(hookResult.result.current.exercises[1].exerciseName).toBe(name0);
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });

    it('swaps exercises when moving up', async () => {
      const hookResult = await setupWithSession();
      const name0 = hookResult.result.current.exercises[0].exerciseName;
      const name1 = hookResult.result.current.exercises[1].exerciseName;

      act(() => {
        hookResult.result.current.moveExercise(1, -1);
      });

      expect(hookResult.result.current.exercises[0].exerciseName).toBe(name1);
      expect(hookResult.result.current.exercises[1].exerciseName).toBe(name0);
    });

    it('does nothing when moving first exercise up', async () => {
      const hookResult = await setupWithSession();
      const originalOrder = hookResult.result.current.exercises.map(e => e.exerciseName);
      jest.clearAllMocks();

      act(() => {
        hookResult.result.current.moveExercise(0, -1);
      });

      expect(hookResult.result.current.exercises.map(e => e.exerciseName)).toEqual(originalOrder);
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });

    it('does nothing when moving last exercise down', async () => {
      const hookResult = await setupWithSession();
      const lastIdx = hookResult.result.current.exercises.length - 1;
      const originalOrder = hookResult.result.current.exercises.map(e => e.exerciseName);
      jest.clearAllMocks();

      act(() => {
        hookResult.result.current.moveExercise(lastIdx, 1);
      });

      expect(hookResult.result.current.exercises.map(e => e.exerciseName)).toEqual(originalOrder);
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // 18. enterReorderMode
  // -----------------------------------------------------------------------
  describe('enterReorderMode', () => {
    it('collapses all exercises and sets reorderMode true', async () => {
      const hookResult = await setupWithSession();

      // First exercise starts expanded
      expect(hookResult.result.current.exercises[0].expanded).toBe(true);

      act(() => {
        hookResult.result.current.enterReorderMode();
      });

      expect(hookResult.result.current.reorderMode).toBe(true);
      hookResult.result.current.exercises.forEach(ex => {
        expect(ex.expanded).toBe(false);
      });
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
    });
  });

  // -----------------------------------------------------------------------
  // 19. saveNotes
  // -----------------------------------------------------------------------
  describe('saveNotes', () => {
    it('persists notes to DB and sets notesSaved', async () => {
      const hookResult = await setupWithSession();

      await act(async () => {
        await hookResult.result.current.saveNotes('Felt strong today');
      });

      expect(hookResult.result.current.sessionNotes).toBe('Felt strong today');
      expect(hookResult.result.current.notesSaved).toBe(true);
      expect(mockedUpdateSessionNotes).toHaveBeenCalledWith('session-1', 'Felt strong today');
    });

    it('does not call DB when no sessionId', async () => {
      mockedGetActiveProgram.mockResolvedValue(null);
      mockedGetBlockForWeek.mockReturnValue(undefined);
      mockedGetTrainingDays.mockReturnValue([]);

      const hookResult = renderHook(() => useWorkoutSession());
      await waitFor(() => {
        expect(mockedGetActiveProgram).toHaveBeenCalled();
      });

      await act(async () => {
        await hookResult.result.current.saveNotes('No session');
      });

      expect(hookResult.result.current.sessionNotes).toBe('No session');
      expect(hookResult.result.current.notesSaved).toBe(false);
      expect(mockedUpdateSessionNotes).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // 20. finishSession
  // -----------------------------------------------------------------------
  describe('finishSession', () => {
    it('calls completeSession, detects PRs, and sets phase to complete', async () => {
      const hookResult = await setupWithSession();
      mockedGetSetLogsForSession.mockResolvedValue([]);
      mockedDetectPRs.mockResolvedValue([]);

      await act(async () => {
        await hookResult.result.current.finishSession();
      });

      expect(mockedCompleteSession).toHaveBeenCalledWith('session-1', false);
      expect(mockedDetectPRs).toHaveBeenCalled();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
      expect(hookResult.result.current.phase).toBe('complete');
    });

    it('passes conditioningDone flag to completeSession', async () => {
      const hookResult = await setupWithSession();
      mockedGetSetLogsForSession.mockResolvedValue([]);
      mockedDetectPRs.mockResolvedValue([]);

      act(() => {
        hookResult.result.current.setConditioningDone(true);
      });

      await act(async () => {
        await hookResult.result.current.finishSession();
      });

      expect(mockedCompleteSession).toHaveBeenCalledWith('session-1', true);
    });

    it('does nothing without a sessionId', async () => {
      mockedGetActiveProgram.mockResolvedValue(null);
      mockedGetBlockForWeek.mockReturnValue(undefined);
      mockedGetTrainingDays.mockReturnValue([]);

      const hookResult = renderHook(() => useWorkoutSession());
      await waitFor(() => {
        expect(mockedGetActiveProgram).toHaveBeenCalled();
      });

      await act(async () => {
        await hookResult.result.current.finishSession();
      });

      expect(mockedCompleteSession).not.toHaveBeenCalled();
      expect(hookResult.result.current.phase).toBe('select');
    });
  });

  // -----------------------------------------------------------------------
  // 21. goBackToWarmup
  // -----------------------------------------------------------------------
  describe('setPhase (replaces goBackToWarmup)', () => {
    it('sets phase back to warmup', async () => {
      const hookResult = await setupWithSession();
      expect(hookResult.result.current.phase).toBe('logging');

      act(() => {
        hookResult.result.current.setPhase('warmup');
      });

      expect(hookResult.result.current.phase).toBe('warmup');
    });
  });

  // -----------------------------------------------------------------------
  // 22. closeOverride
  // -----------------------------------------------------------------------
  describe('closeOverride', () => {
    it('closes the override modal', async () => {
      const hookResult = await setupWithSession();

      // Open the modal
      act(() => {
        hookResult.result.current.openOverride(0, 0);
      });
      expect(hookResult.result.current.overrideModal).not.toBeNull();

      // Close it
      act(() => {
        hookResult.result.current.closeOverride();
      });
      expect(hookResult.result.current.overrideModal).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // 23. Warmup toggles
  // -----------------------------------------------------------------------
  describe('warmup toggles', () => {
    it('toggleWarmupRope toggles rope state', async () => {
      const hookResult = await renderAndLoad();
      expect(hookResult.result.current.warmupRope).toBe(false);

      act(() => {
        hookResult.result.current.toggleWarmupRope();
      });
      expect(hookResult.result.current.warmupRope).toBe(true);

      act(() => {
        hookResult.result.current.toggleWarmupRope();
      });
      expect(hookResult.result.current.warmupRope).toBe(false);
    });

    it('toggleWarmupAnkle toggles ankle state', async () => {
      const hookResult = await renderAndLoad();
      expect(hookResult.result.current.warmupAnkle).toBe(false);

      act(() => {
        hookResult.result.current.toggleWarmupAnkle();
      });
      expect(hookResult.result.current.warmupAnkle).toBe(true);
    });

    it('toggleWarmupHipIr toggles hip IR state', async () => {
      const hookResult = await renderAndLoad();
      expect(hookResult.result.current.warmupHipIr).toBe(false);

      act(() => {
        hookResult.result.current.toggleWarmupHipIr();
      });
      expect(hookResult.result.current.warmupHipIr).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Derived values
  // -----------------------------------------------------------------------
  describe('derived values', () => {
    it('exposes dayNames constant', async () => {
      const hookResult = await renderAndLoad();
      expect(hookResult.result.current.dayNames).toEqual({
        sunday: 'Sun', monday: 'Mon', tuesday: 'Tue',
        wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat',
      });
    });

    it('computes block and blockColor from program', async () => {
      const hookResult = await renderAndLoad();
      expect(mockedGetBlockForWeek).toHaveBeenCalled();
      expect(hookResult.result.current.blockColor).toBe('#6366f1');
    });

    it('computes trainingDays from program', async () => {
      const hookResult = await renderAndLoad();
      expect(mockedGetTrainingDays).toHaveBeenCalled();
    });

    it('blockColor defaults to indigo when no block', async () => {
      mockedGetActiveProgram.mockResolvedValue(null);
      mockedGetBlockForWeek.mockReturnValue(undefined);
      mockedGetTrainingDays.mockReturnValue([]);

      const hookResult = renderHook(() => useWorkoutSession());
      await waitFor(() => {
        expect(mockedGetActiveProgram).toHaveBeenCalled();
      });

      expect(hookResult.result.current.blockColor).toBe('#6366f1');
    });
  });
});
