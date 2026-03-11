/**
 * Tests for src/db/sessions.ts — Session & set logging data access
 */

import { getDatabase, generateId } from '../../src/db/database';
import {
  createSession,
  updateReadiness,
  insertSessionProtocols,
  getSessionProtocols,
  updateProtocolCompletion,
  logSet,
  updateSet,
  deleteSet,
  completeSession,
  updateSessionNotes,
  getSessionsForWeek,
  getSessionsForDateRange,
  getSetLogsForSession,
  getSessionById,
  getCompletedSessionForDay,
  getExerciseNames,
  ensureExerciseExists,
  getLastSessionForExercise,
  getFullSessionState,
} from '../../src/db/sessions';

jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn(),
  generateId: jest.fn(() => 'test-id-123'),
}));

function createMockDb() {
  return {
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
    execAsync: jest.fn().mockResolvedValue(undefined),
  };
}

describe('sessions', () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  // ---------------------------------------------------------------------------
  // createSession
  // ---------------------------------------------------------------------------
  describe('createSession', () => {
    it('generates ID, calls INSERT, and returns the id', async () => {
      const id = await createSession({
        programId: 'prog-1',
        weekNumber: 3,
        blockName: 'Hypertrophy',
        dayTemplateId: 'day-a',
        scheduledDay: 'Monday',
        actualDay: 'Monday',
        date: '2026-03-01',
      });

      expect(id).toBe('test-id-123');
      expect(generateId).toHaveBeenCalled();
      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);

      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('INSERT INTO sessions');
      expect(params[0]).toBe('test-id-123'); // id
      expect(params[1]).toBe('prog-1');       // program_id
      expect(params[2]).toBe(3);              // week_number
      expect(params[3]).toBe('Hypertrophy');  // block_name
      expect(params[4]).toBe('day-a');        // day_template_id
      expect(params[5]).toBe('Monday');       // scheduled_day
      expect(params[6]).toBe('Monday');       // actual_day
      expect(params[7]).toBe('2026-03-01');   // date
      expect(typeof params[8]).toBe('string'); // started_at ISO string
    });
  });

  // ---------------------------------------------------------------------------
  // updateReadiness
  // ---------------------------------------------------------------------------
  describe('updateReadiness', () => {
    it('calls UPDATE with sleep, soreness, energy', async () => {
      await updateReadiness('sess-1', 4, 2, 5);

      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('UPDATE sessions SET sleep = ?, soreness = ?, energy = ?');
      expect(sql).toContain('WHERE id = ?');
      expect(params).toEqual([4, 2, 5, 'sess-1']);
    });
  });

  // ---------------------------------------------------------------------------
  // insertSessionProtocols
  // ---------------------------------------------------------------------------
  describe('insertSessionProtocols', () => {
    it('inserts each protocol item with correct sort_order', async () => {
      await insertSessionProtocols('sess-1', [
        { type: 'warmup', protocolKey: 'rope', protocolName: 'Jump Rope' },
        { type: 'warmup', protocolKey: 'ankle', protocolName: 'Ankle Protocol' },
        { type: 'conditioning', protocolKey: null, protocolName: 'EMOM 10min' },
      ]);

      expect(mockDb.runAsync).toHaveBeenCalledTimes(3);

      const [sql0, params0] = mockDb.runAsync.mock.calls[0];
      expect(sql0).toContain('INSERT INTO session_protocols');
      expect(params0).toEqual(['sess-1', 'warmup', 'rope', 'Jump Rope', 0]);

      const [, params1] = mockDb.runAsync.mock.calls[1];
      expect(params1).toEqual(['sess-1', 'warmup', 'ankle', 'Ankle Protocol', 1]);

      const [, params2] = mockDb.runAsync.mock.calls[2];
      expect(params2).toEqual(['sess-1', 'conditioning', null, 'EMOM 10min', 2]);
    });

    it('does nothing when protocols array is empty', async () => {
      await insertSessionProtocols('sess-2', []);

      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // getSessionProtocols
  // ---------------------------------------------------------------------------
  describe('getSessionProtocols', () => {
    it('queries protocols ordered by sort_order', async () => {
      const mockProtocols = [
        { id: 1, session_id: 'sess-1', type: 'warmup', protocol_key: 'rope', protocol_name: 'Jump Rope', completed: false, sort_order: 0 },
      ];
      mockDb.getAllAsync.mockResolvedValue(mockProtocols);

      const result = await getSessionProtocols('sess-1');

      const [sql, params] = mockDb.getAllAsync.mock.calls[0];
      expect(sql).toContain('SELECT * FROM session_protocols');
      expect(sql).toContain('ORDER BY sort_order');
      expect(params).toEqual(['sess-1']);
      expect(result).toEqual(mockProtocols);
    });
  });

  // ---------------------------------------------------------------------------
  // updateProtocolCompletion
  // ---------------------------------------------------------------------------
  describe('updateProtocolCompletion', () => {
    it('sets completed = 1 when true', async () => {
      await updateProtocolCompletion(42, true);

      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('UPDATE session_protocols SET completed = ?');
      expect(sql).toContain('WHERE id = ?');
      expect(params).toEqual([1, 42]);
    });

    it('sets completed = 0 when false', async () => {
      await updateProtocolCompletion(42, false);

      const [, params] = mockDb.runAsync.mock.calls[0];
      expect(params).toEqual([0, 42]);
    });
  });

  // ---------------------------------------------------------------------------
  // logSet
  // ---------------------------------------------------------------------------
  describe('logSet', () => {
    it('inserts with all params and returns generated id', async () => {
      const id = await logSet({
        sessionId: 'sess-1',
        exerciseId: 'squat',
        setNumber: 1,
        targetWeight: 225,
        targetReps: 5,
        actualWeight: 230,
        actualReps: 4,
        rpe: 8.5,
        status: 'completed',
        isAdhoc: false,
      });

      expect(id).toBe('test-id-123');
      expect(generateId).toHaveBeenCalled();
      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);

      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('INSERT INTO set_logs');
      expect(params[0]).toBe('test-id-123'); // id
      expect(params[1]).toBe('sess-1');       // session_id
      expect(params[2]).toBe('squat');        // exercise_id
      expect(params[3]).toBe(1);              // set_number
      expect(params[4]).toBe(225);            // target_weight
      expect(params[5]).toBe(5);              // target_reps
      expect(params[6]).toBe(230);            // actual_weight
      expect(params[7]).toBe(4);              // actual_reps
      // params[8..13] = distance/duration/time targets+actuals (all null)
      expect(params[14]).toBe(8.5);            // rpe
      expect(params[15]).toBe('completed');    // status
      expect(typeof params[16]).toBe('string'); // timestamp
      expect(params[17]).toBe(0);             // is_adhoc
    });

    it('defaults actualWeight and actualReps to target values', async () => {
      await logSet({
        sessionId: 'sess-1',
        exerciseId: 'bench',
        setNumber: 2,
        targetWeight: 185,
        targetReps: 8,
        status: 'completed',
      });

      const [, params] = mockDb.runAsync.mock.calls[0];
      expect(params[6]).toBe(185); // actual_weight defaults to target
      expect(params[7]).toBe(8);   // actual_reps defaults to target
      expect(params[14]).toBeNull(); // rpe defaults to null
      expect(params[17]).toBe(0);   // isAdhoc defaults to 0
    });

    it('sets is_adhoc to 1 when true', async () => {
      await logSet({
        sessionId: 'sess-1',
        exerciseId: 'curl',
        setNumber: 1,
        targetWeight: 30,
        targetReps: 12,
        status: 'completed',
        isAdhoc: true,
      });

      const [, params] = mockDb.runAsync.mock.calls[0];
      expect(params[17]).toBe(1); // is_adhoc → 1
    });

    it('inserts with targetDistance and actualDistance', async () => {
      await logSet({
        sessionId: 'sess-1',
        exerciseId: 'farmers-carry',
        setNumber: 1,
        status: 'completed',
        targetDistance: 40,
        actualDistance: 45,
      });

      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('target_distance');
      expect(sql).toContain('actual_distance');
      // target_weight and target_reps should be null when not provided
      expect(params).toContain(null); // target_weight
      expect(params).toContain(40);   // target_distance
      expect(params).toContain(45);   // actual_distance
    });

    it('inserts with targetDuration and actualDuration', async () => {
      await logSet({
        sessionId: 'sess-1',
        exerciseId: 'plank',
        setNumber: 1,
        status: 'completed',
        targetDuration: 60,
        actualDuration: 55,
      });

      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('target_duration');
      expect(sql).toContain('actual_duration');
      expect(params).toContain(60);  // target_duration
      expect(params).toContain(55);  // actual_duration
    });

    it('inserts with targetTime and actualTime', async () => {
      await logSet({
        sessionId: 'sess-1',
        exerciseId: 'sprint',
        setNumber: 1,
        status: 'completed',
        targetTime: 12.5,
        actualTime: 13.1,
      });

      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('target_time');
      expect(sql).toContain('actual_time');
      expect(params).toContain(12.5);  // target_time
      expect(params).toContain(13.1);  // actual_time
    });

    it('falls back actual values to target values for new fields', async () => {
      await logSet({
        sessionId: 'sess-1',
        exerciseId: 'farmers-carry',
        setNumber: 1,
        status: 'completed',
        targetDistance: 40,
        targetDuration: 60,
        targetTime: 12.5,
      });

      const [, params] = mockDb.runAsync.mock.calls[0];
      // actual_distance falls back to target_distance
      expect(params).toContain(40);   // actual_distance = target_distance
      expect(params).toContain(60);   // actual_duration = target_duration
      expect(params).toContain(12.5); // actual_time = target_time
    });

    it('handles logSet with no weight/reps (distance-only exercise)', async () => {
      const id = await logSet({
        sessionId: 'sess-1',
        exerciseId: 'farmers-carry',
        setNumber: 1,
        status: 'completed',
        targetDistance: 40,
      });

      expect(id).toBe('test-id-123');
      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('INSERT INTO set_logs');
      // target_weight and target_reps should be null
      const targetWeightIdx = 4;
      const targetRepsIdx = 5;
      expect(params[targetWeightIdx]).toBeNull();
      expect(params[targetRepsIdx]).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // updateSet
  // ---------------------------------------------------------------------------
  describe('updateSet', () => {
    it('builds dynamic SET clause from updates', async () => {
      await updateSet('set-1', {
        actualWeight: 240,
        actualReps: 3,
        rpe: 9,
        status: 'completed_below',
      });

      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('UPDATE set_logs SET');
      expect(sql).toContain('actual_weight = ?');
      expect(sql).toContain('actual_reps = ?');
      expect(sql).toContain('rpe = ?');
      expect(sql).toContain('status = ?');
      expect(sql).toContain('WHERE id = ?');
      expect(params).toEqual([240, 3, 9, 'completed_below', 'set-1']);
    });

    it('handles partial updates (only rpe)', async () => {
      await updateSet('set-2', { rpe: 7 });

      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('rpe = ?');
      expect(sql).not.toContain('actual_weight');
      expect(sql).not.toContain('actual_reps');
      expect(sql).not.toContain('status');
      expect(params).toEqual([7, 'set-2']);
    });

    it('does nothing with empty updates', async () => {
      await updateSet('set-3', {});

      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });

    it('updates actualDistance', async () => {
      await updateSet('set-4', { actualDistance: 50 });

      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('actual_distance = ?');
      expect(params).toEqual([50, 'set-4']);
    });

    it('updates actualDuration', async () => {
      await updateSet('set-5', { actualDuration: 45 });

      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('actual_duration = ?');
      expect(params).toEqual([45, 'set-5']);
    });

    it('updates actualTime', async () => {
      await updateSet('set-6', { actualTime: 11.8 });

      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('actual_time = ?');
      expect(params).toEqual([11.8, 'set-6']);
    });

    it('updates multiple new fields together', async () => {
      await updateSet('set-7', { actualDistance: 50, actualDuration: 45, actualTime: 11.8 });

      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('actual_distance = ?');
      expect(sql).toContain('actual_duration = ?');
      expect(sql).toContain('actual_time = ?');
      expect(params).toEqual([50, 45, 11.8, 'set-7']);
    });
  });

  // ---------------------------------------------------------------------------
  // deleteSet
  // ---------------------------------------------------------------------------
  describe('deleteSet', () => {
    it('calls DELETE with correct id', async () => {
      await deleteSet('set-99');

      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('DELETE FROM set_logs WHERE id = ?');
      expect(params).toEqual(['set-99']);
    });
  });

  // ---------------------------------------------------------------------------
  // completeSession
  // ---------------------------------------------------------------------------
  describe('completeSession', () => {
    it('sets completed_at timestamp', async () => {
      await completeSession('sess-1');

      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('UPDATE sessions SET completed_at = ?');
      expect(sql).toContain('WHERE id = ?');
      expect(typeof params[0]).toBe('string'); // ISO timestamp
      expect(params[1]).toBe('sess-1');
    });
  });

  // ---------------------------------------------------------------------------
  // updateSessionNotes
  // ---------------------------------------------------------------------------
  describe('updateSessionNotes', () => {
    it('updates notes for session', async () => {
      await updateSessionNotes('sess-1', 'Great workout');

      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('UPDATE sessions SET notes = ?');
      expect(sql).toContain('WHERE id = ?');
      expect(params).toEqual(['Great workout', 'sess-1']);
    });
  });

  // ---------------------------------------------------------------------------
  // getSessionsForWeek
  // ---------------------------------------------------------------------------
  describe('getSessionsForWeek', () => {
    it('queries by program and week, ordered by date', async () => {
      const mockSessions = [
        { id: 's1', program_id: 'prog-1', week_number: 2, date: '2026-03-01' },
      ];
      mockDb.getAllAsync.mockResolvedValue(mockSessions);

      const result = await getSessionsForWeek('prog-1', 2);

      expect(mockDb.getAllAsync).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.getAllAsync.mock.calls[0];
      expect(sql).toContain('SELECT * FROM sessions');
      expect(sql).toContain('program_id = ?');
      expect(sql).toContain('week_number = ?');
      expect(sql).toContain('ORDER BY date');
      expect(params).toEqual(['prog-1', 2]);
      expect(result).toEqual(mockSessions);
    });
  });

  // ---------------------------------------------------------------------------
  // getSessionsForDateRange
  // ---------------------------------------------------------------------------
  describe('getSessionsForDateRange', () => {
    it('queries by program and date range', async () => {
      const mockSessions = [{ id: 's1' }];
      mockDb.getAllAsync.mockResolvedValue(mockSessions);

      const result = await getSessionsForDateRange('prog-1', '2026-03-01', '2026-03-31');

      const [sql, params] = mockDb.getAllAsync.mock.calls[0];
      expect(sql).toContain('program_id = ?');
      expect(sql).toContain('date >= ?');
      expect(sql).toContain('date <= ?');
      expect(sql).toContain('ORDER BY date');
      expect(params).toEqual(['prog-1', '2026-03-01', '2026-03-31']);
      expect(result).toEqual(mockSessions);
    });
  });

  // ---------------------------------------------------------------------------
  // getSetLogsForSession
  // ---------------------------------------------------------------------------
  describe('getSetLogsForSession', () => {
    it('queries by session id, ordered by exercise_id and set_number', async () => {
      const mockLogs = [
        { id: 'sl1', session_id: 'sess-1', exercise_id: 'bench', set_number: 1 },
        { id: 'sl2', session_id: 'sess-1', exercise_id: 'bench', set_number: 2 },
      ];
      mockDb.getAllAsync.mockResolvedValue(mockLogs);

      const result = await getSetLogsForSession('sess-1');

      const [sql, params] = mockDb.getAllAsync.mock.calls[0];
      expect(sql).toContain('SELECT * FROM set_logs');
      expect(sql).toContain('session_id = ?');
      expect(sql).toContain('ORDER BY rowid, set_number');
      expect(params).toEqual(['sess-1']);
      expect(result).toEqual(mockLogs);
    });
  });

  // ---------------------------------------------------------------------------
  // getSessionById
  // ---------------------------------------------------------------------------
  describe('getSessionById', () => {
    it('queries by id and returns session', async () => {
      const mockSession = { id: 'sess-1', program_id: 'prog-1' };
      mockDb.getFirstAsync.mockResolvedValue(mockSession);

      const result = await getSessionById('sess-1');

      const [sql, params] = mockDb.getFirstAsync.mock.calls[0];
      expect(sql).toContain('SELECT * FROM sessions WHERE id = ?');
      expect(params).toEqual(['sess-1']);
      expect(result).toEqual(mockSession);
    });

    it('returns null when not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await getSessionById('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // getCompletedSessionForDay
  // ---------------------------------------------------------------------------
  describe('getCompletedSessionForDay', () => {
    it('filters by program, week, day, and completed', async () => {
      const mockSession = { id: 'sess-1', completed_at: '2026-03-01T12:00:00Z' };
      mockDb.getFirstAsync.mockResolvedValue(mockSession);

      const result = await getCompletedSessionForDay('prog-1', 2, 'Monday');

      const [sql, params] = mockDb.getFirstAsync.mock.calls[0];
      expect(sql).toContain('program_id = ?');
      expect(sql).toContain('week_number = ?');
      expect(sql).toContain('scheduled_day = ?');
      expect(sql).toContain('completed_at IS NOT NULL');
      expect(sql).toContain('ORDER BY date DESC LIMIT 1');
      expect(params).toEqual(['prog-1', 2, 'Monday']);
      expect(result).toEqual(mockSession);
    });

    it('returns null when no completed session exists', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await getCompletedSessionForDay('prog-1', 1, 'Friday');

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // getExerciseNames
  // ---------------------------------------------------------------------------
  describe('getExerciseNames', () => {
    it('returns empty object for empty array', async () => {
      const result = await getExerciseNames([]);

      expect(result).toEqual({});
      expect(mockDb.getAllAsync).not.toHaveBeenCalled();
    });

    it('builds IN clause and returns name map', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        { id: 'squat', name: 'Back Squat' },
        { id: 'bench', name: 'Bench Press' },
      ]);

      const result = await getExerciseNames(['squat', 'bench']);

      const [sql, params] = mockDb.getAllAsync.mock.calls[0];
      expect(sql).toContain('SELECT id, name FROM exercises');
      expect(sql).toContain('WHERE id IN (?,?)');
      expect(params).toEqual(['squat', 'bench']);
      expect(result).toEqual({
        squat: 'Back Squat',
        bench: 'Bench Press',
      });
    });

    it('builds correct placeholders for single id', async () => {
      mockDb.getAllAsync.mockResolvedValue([{ id: 'curl', name: 'Bicep Curl' }]);

      await getExerciseNames(['curl']);

      const [sql, params] = mockDb.getAllAsync.mock.calls[0];
      expect(sql).toContain('IN (?)');
      expect(params).toEqual(['curl']);
    });
  });

  // ---------------------------------------------------------------------------
  // ensureExerciseExists
  // ---------------------------------------------------------------------------
  describe('ensureExerciseExists', () => {
    it('uses INSERT OR REPLACE with serialized muscle groups', async () => {
      await ensureExerciseExists({
        id: 'lateral-raise',
        name: 'Lateral Raise',
        type: 'accessory',
        muscleGroups: ['shoulders', 'deltoids'],
      });

      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('INSERT OR REPLACE INTO exercises');
      expect(sql).toContain('input_fields');
      expect(params[0]).toBe('lateral-raise');
      expect(params[1]).toBe('Lateral Raise');
      expect(params[2]).toBe('accessory');
      expect(params[3]).toBe(JSON.stringify(['shoulders', 'deltoids']));
      expect(params[4]).toBe('[]'); // alternatives default
      expect(params[5]).toBeNull(); // input_fields default
    });

    it('stores input_fields when provided', async () => {
      const inputFields = [{ type: 'reps' as const }];
      await ensureExerciseExists({
        id: 'hanging-leg-raise',
        name: 'Hanging Leg Raise',
        type: 'core',
        muscleGroups: ['core'],
        inputFields,
      });

      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
      const [, params] = mockDb.runAsync.mock.calls[0];
      expect(params[5]).toBe(JSON.stringify(inputFields));
    });
  });

  // ---------------------------------------------------------------------------
  // getLastSessionForExercise
  // ---------------------------------------------------------------------------
  describe('getLastSessionForExercise', () => {
    it('returns empty array when no prior session found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await getLastSessionForExercise('squat');

      expect(mockDb.getFirstAsync).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.getFirstAsync.mock.calls[0];
      expect(sql).toContain('sl.exercise_id = ?');
      expect(sql).toContain('s.completed_at IS NOT NULL');
      expect(params).toEqual(['squat']);
      expect(result).toEqual([]);
      // Should not query for set logs
      expect(mockDb.getAllAsync).not.toHaveBeenCalled();
    });

    it('performs two-step query: find session then get sets', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ session_id: 'sess-prev' });
      const mockSetLogs = [
        { id: 'sl1', session_id: 'sess-prev', exercise_id: 'squat', set_number: 1 },
        { id: 'sl2', session_id: 'sess-prev', exercise_id: 'squat', set_number: 2 },
      ];
      mockDb.getAllAsync.mockResolvedValue(mockSetLogs);

      const result = await getLastSessionForExercise('squat');

      // First call: find the session
      expect(mockDb.getFirstAsync).toHaveBeenCalledTimes(1);
      // Second call: get set logs
      expect(mockDb.getAllAsync).toHaveBeenCalledTimes(1);
      const [sql2, params2] = mockDb.getAllAsync.mock.calls[0];
      expect(sql2).toContain('session_id = ?');
      expect(sql2).toContain('exercise_id = ?');
      expect(sql2).toContain('ORDER BY set_number');
      expect(params2).toEqual(['sess-prev', 'squat']);
      expect(result).toEqual(mockSetLogs);
    });

    it('filters by programId when provided', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      await getLastSessionForExercise('bench', 'prog-1');

      const [sql, params] = mockDb.getFirstAsync.mock.calls[0];
      expect(sql).toContain('s.program_id = ?');
      expect(params).toEqual(['bench', 'prog-1']);
    });

    it('omits programId filter when not provided', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      await getLastSessionForExercise('bench');

      const [sql, params] = mockDb.getFirstAsync.mock.calls[0];
      expect(sql).not.toContain('s.program_id = ?');
      expect(params).toEqual(['bench']);
    });
  });

  // ---------------------------------------------------------------------------
  // getFullSessionState
  // ---------------------------------------------------------------------------
  describe('getFullSessionState', () => {
    it('returns null when session is not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await getFullSessionState('nonexistent');

      expect(result).toBeNull();
      expect(mockDb.getFirstAsync).toHaveBeenCalledTimes(1);
      // Should not query for set logs or notes
      expect(mockDb.getAllAsync).not.toHaveBeenCalled();
    });

    it('returns session, set logs, exercise notes, and protocols', async () => {
      const mockSession = {
        id: 'sess-1',
        program_id: 'prog-1',
        week_number: 2,
        started_at: '2026-03-09T10:00:00Z',
        completed_at: null,
      };
      const mockSetLogs = [
        { id: 'sl1', session_id: 'sess-1', exercise_id: 'squat', set_number: 1, status: 'completed' },
        { id: 'sl2', session_id: 'sess-1', exercise_id: 'squat', set_number: 2, status: 'completed' },
        { id: 'sl3', session_id: 'sess-1', exercise_id: 'bench', set_number: 1, status: 'completed' },
      ];
      const mockNoteRows = [
        { exercise_id: 'squat', note: 'Felt strong' },
        { exercise_id: 'bench', note: 'Slight pain' },
      ];
      const mockProtocols = [
        { id: 1, session_id: 'sess-1', type: 'warmup', protocol_key: 'rope', protocol_name: 'Jump Rope', completed: true, sort_order: 0 },
      ];

      mockDb.getFirstAsync.mockResolvedValue(mockSession);
      mockDb.getAllAsync
        .mockResolvedValueOnce(mockSetLogs)
        .mockResolvedValueOnce(mockNoteRows)
        .mockResolvedValueOnce(mockProtocols);

      const result = await getFullSessionState('sess-1');

      expect(result).not.toBeNull();
      expect(result!.session).toEqual(mockSession);
      expect(result!.setLogs).toEqual(mockSetLogs);
      expect(result!.exerciseNotes).toEqual({
        squat: 'Felt strong',
        bench: 'Slight pain',
      });
      expect(result!.protocols).toEqual(mockProtocols);

      // Verify queries
      const [sessionSql, sessionParams] = mockDb.getFirstAsync.mock.calls[0];
      expect(sessionSql).toContain('SELECT * FROM sessions WHERE id = ?');
      expect(sessionParams).toEqual(['sess-1']);

      const [setLogSql, setLogParams] = mockDb.getAllAsync.mock.calls[0];
      expect(setLogSql).toContain('SELECT * FROM set_logs WHERE session_id = ?');
      expect(setLogSql).toContain('ORDER BY rowid, set_number');
      expect(setLogParams).toEqual(['sess-1']);

      const [notesSql, notesParams] = mockDb.getAllAsync.mock.calls[1];
      expect(notesSql).toContain('SELECT exercise_id, note FROM exercise_notes WHERE session_id = ?');
      expect(notesParams).toEqual(['sess-1']);
    });

    it('returns empty set logs, notes, and protocols when session has none', async () => {
      const mockSession = {
        id: 'sess-2',
        program_id: 'prog-1',
        started_at: '2026-03-09T10:00:00Z',
      };
      mockDb.getFirstAsync.mockResolvedValue(mockSession);
      mockDb.getAllAsync
        .mockResolvedValueOnce([])  // no set logs
        .mockResolvedValueOnce([])  // no notes
        .mockResolvedValueOnce([]); // no protocols

      const result = await getFullSessionState('sess-2');

      expect(result).not.toBeNull();
      expect(result!.session).toEqual(mockSession);
      expect(result!.setLogs).toEqual([]);
      expect(result!.exerciseNotes).toEqual({});
      expect(result!.protocols).toEqual([]);
    });
  });
});
