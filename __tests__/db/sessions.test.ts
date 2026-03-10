/**
 * Tests for src/db/sessions.ts — Session & set logging data access
 */

import { getDatabase, generateId } from '../../src/db/database';
import {
  createSession,
  updateReadiness,
  updateWarmup,
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
  // updateWarmup
  // ---------------------------------------------------------------------------
  describe('updateWarmup', () => {
    it('builds dynamic SET clause for all warmup fields', async () => {
      await updateWarmup('sess-1', { rope: true, ankle: false, hipIr: true });

      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('warmup_rope = ?');
      expect(sql).toContain('warmup_ankle = ?');
      expect(sql).toContain('warmup_hip_ir = ?');
      expect(sql).toContain('WHERE id = ?');
      expect(params).toEqual([1, 0, 1, 'sess-1']);
    });

    it('handles partial updates (only rope)', async () => {
      await updateWarmup('sess-2', { rope: true });

      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('warmup_rope = ?');
      expect(sql).not.toContain('warmup_ankle');
      expect(sql).not.toContain('warmup_hip_ir');
      expect(params).toEqual([1, 'sess-2']);
    });

    it('does nothing when warmups object is empty', async () => {
      await updateWarmup('sess-3', {});

      expect(mockDb.runAsync).not.toHaveBeenCalled();
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
      expect(params[8]).toBe(8.5);            // rpe
      expect(params[9]).toBe('completed');    // status
      expect(typeof params[10]).toBe('string'); // timestamp
      expect(params[11]).toBe(0);             // is_adhoc
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
      expect(params[8]).toBeNull(); // rpe defaults to null
      expect(params[11]).toBe(0);   // isAdhoc defaults to 0
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
      expect(params[11]).toBe(1); // is_adhoc → 1
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
    it('sets completed_at and conditioning_done = 1', async () => {
      await completeSession('sess-1', true);

      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('UPDATE sessions SET completed_at = ?, conditioning_done = ?');
      expect(sql).toContain('WHERE id = ?');
      expect(typeof params[0]).toBe('string'); // ISO timestamp
      expect(params[1]).toBe(1); // conditioning_done true → 1
      expect(params[2]).toBe('sess-1');
    });

    it('sets conditioning_done = 0 when false', async () => {
      await completeSession('sess-2', false);

      const [, params] = mockDb.runAsync.mock.calls[0];
      expect(params[1]).toBe(0);
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
      expect(sql).toContain('ORDER BY exercise_id, set_number');
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
    it('uses INSERT OR IGNORE with serialized muscle groups', async () => {
      await ensureExerciseExists({
        id: 'lateral-raise',
        name: 'Lateral Raise',
        type: 'accessory',
        muscleGroups: ['shoulders', 'deltoids'],
      });

      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('INSERT OR IGNORE INTO exercises');
      expect(params[0]).toBe('lateral-raise');
      expect(params[1]).toBe('Lateral Raise');
      expect(params[2]).toBe('accessory');
      expect(params[3]).toBe(JSON.stringify(['shoulders', 'deltoids']));
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

    it('returns session, set logs, and exercise notes', async () => {
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

      mockDb.getFirstAsync.mockResolvedValue(mockSession);
      mockDb.getAllAsync
        .mockResolvedValueOnce(mockSetLogs)
        .mockResolvedValueOnce(mockNoteRows);

      const result = await getFullSessionState('sess-1');

      expect(result).not.toBeNull();
      expect(result!.session).toEqual(mockSession);
      expect(result!.setLogs).toEqual(mockSetLogs);
      expect(result!.exerciseNotes).toEqual({
        squat: 'Felt strong',
        bench: 'Slight pain',
      });

      // Verify queries
      const [sessionSql, sessionParams] = mockDb.getFirstAsync.mock.calls[0];
      expect(sessionSql).toContain('SELECT * FROM sessions WHERE id = ?');
      expect(sessionParams).toEqual(['sess-1']);

      const [setLogSql, setLogParams] = mockDb.getAllAsync.mock.calls[0];
      expect(setLogSql).toContain('SELECT * FROM set_logs WHERE session_id = ?');
      expect(setLogSql).toContain('ORDER BY exercise_id, set_number');
      expect(setLogParams).toEqual(['sess-1']);

      const [notesSql, notesParams] = mockDb.getAllAsync.mock.calls[1];
      expect(notesSql).toContain('SELECT exercise_id, note FROM exercise_notes WHERE session_id = ?');
      expect(notesParams).toEqual(['sess-1']);
    });

    it('returns empty set logs and notes when session has none', async () => {
      const mockSession = {
        id: 'sess-2',
        program_id: 'prog-1',
        started_at: '2026-03-09T10:00:00Z',
      };
      mockDb.getFirstAsync.mockResolvedValue(mockSession);
      mockDb.getAllAsync
        .mockResolvedValueOnce([])  // no set logs
        .mockResolvedValueOnce([]); // no notes

      const result = await getFullSessionState('sess-2');

      expect(result).not.toBeNull();
      expect(result!.session).toEqual(mockSession);
      expect(result!.setLogs).toEqual([]);
      expect(result!.exerciseNotes).toEqual({});
    });
  });
});
