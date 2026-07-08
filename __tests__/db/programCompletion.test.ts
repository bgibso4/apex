/**
 * Tests for program completion DB functions:
 *   markProgramComplete, markCompletionSeen, getMostRecentCompletedProgram (programs.ts)
 *   getCompletedFinalDaySession (sessions.ts)
 */

import { getDatabase } from '../../src/db/database';
import {
  markProgramComplete,
  markCompletionSeen,
  getMostRecentCompletedProgram,
  backfillActiveProgramCompletion,
} from '../../src/db/programs';
import { getCompletedFinalDaySession } from '../../src/db/sessions';
import { getLocalDateString } from '../../src/utils/date';

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

describe('program completion DB', () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  // ---------------------------------------------------------------------------
  // markProgramComplete
  // ---------------------------------------------------------------------------
  describe('markProgramComplete', () => {
    it('flips status to completed, stamps completed_date, sets completion_seen=0', async () => {
      await markProgramComplete('p1');

      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain("status = 'completed'");
      expect(sql).toContain('completed_date = ?');
      expect(sql).toContain('completion_seen = 0');
      expect(sql).toContain('updated_at');
      expect(sql).toContain('WHERE id = ?');
      expect(params[0]).toBe(getLocalDateString());
      expect(params[1]).toBe('p1');
    });

    it('resets card_dismissed so the completed card shows on Home', async () => {
      await markProgramComplete('p1');

      const [sql] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('card_dismissed = 0');
    });
  });

  // ---------------------------------------------------------------------------
  // markCompletionSeen
  // ---------------------------------------------------------------------------
  describe('markCompletionSeen', () => {
    it('sets completion_seen=1 for the given program', async () => {
      await markCompletionSeen('p1');

      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('completion_seen = 1');
      expect(sql).toContain('updated_at');
      expect(sql).toContain('WHERE id = ?');
      expect(params).toEqual(['p1']);
    });
  });

  // ---------------------------------------------------------------------------
  // getMostRecentCompletedProgram
  // ---------------------------------------------------------------------------
  describe('getMostRecentCompletedProgram', () => {
    it('returns null when no completed program exists', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await getMostRecentCompletedProgram();

      expect(result).toBeNull();
      const [sql] = mockDb.getFirstAsync.mock.calls[0];
      expect(sql).toContain("status = 'completed'");
      expect(sql).toContain('card_dismissed = 0'); // retired cards never resurface
      expect(sql).toContain('ORDER BY completed_date DESC');
      expect(sql).toContain('LIMIT 1');
    });

    it('returns program with parsed definition when a completed program exists', async () => {
      const definition = { program: { name: 'Test' } };
      const dbRow = {
        id: 'p1',
        name: 'Test Program',
        status: 'completed',
        completed_date: '2026-06-01',
        definition_json: JSON.stringify(definition),
      };
      mockDb.getFirstAsync.mockResolvedValue(dbRow);

      const result = await getMostRecentCompletedProgram();

      expect(result).not.toBeNull();
      expect(result!.id).toBe('p1');
      expect(result!.definition).toEqual(definition);
    });
  });

  // ---------------------------------------------------------------------------
  // getCompletedFinalDaySession
  // ---------------------------------------------------------------------------
  describe('getCompletedFinalDaySession', () => {
    it('queries by program, scheduled_day, and week_number >= durationWeeks, completed only', async () => {
      const mockSession = { id: 's1', week_number: 12, scheduled_day: 'friday' };
      mockDb.getFirstAsync.mockResolvedValue(mockSession);

      const result = await getCompletedFinalDaySession('p1', 'friday', 11);

      expect(result).toEqual(mockSession);
      const [sql, params] = mockDb.getFirstAsync.mock.calls[0];
      expect(sql).toContain('program_id = ?');
      expect(sql).toContain('scheduled_day = ?');
      expect(sql).toContain('week_number >= ?');
      expect(sql).toContain('completed_at IS NOT NULL');
      expect(sql).toContain('ORDER BY week_number DESC');
      expect(sql).toContain('LIMIT 1');
      expect(params).toEqual(['p1', 'friday', 11]);
    });

    it('returns null when final day session not logged', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await getCompletedFinalDaySession('p1', 'friday', 11);

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // backfillActiveProgramCompletion
  // ---------------------------------------------------------------------------
  describe('backfillActiveProgramCompletion', () => {
    const validDefinitionJson = JSON.stringify({
      program: {
        name: 'P',
        duration_weeks: 11,
        weekly_template: {
          monday: { name: 'A', warmup: [], exercises: [] },
          friday: { name: 'C', warmup: [], exercises: [] },
        },
      },
    });

    const activeRow = {
      id: 'p1',
      name: 'P',
      status: 'active',
      definition_json: validDefinitionJson,
    };

    const sessionRow = {
      id: 's1',
      program_id: 'p1',
      week_number: 11,
      scheduled_day: 'friday',
      completed_at: '2026-06-07T20:00:00.000Z',
    };

    it('completes the program when the final training day is already logged', async () => {
      // getActiveProgram uses status = 'active'; getCompletedFinalDaySession uses FROM sessions
      mockDb.getFirstAsync.mockImplementation((sql: string) => {
        if (sql.includes("status = 'active'")) return Promise.resolve(activeRow);
        if (sql.includes('FROM sessions')) return Promise.resolve(sessionRow);
        return Promise.resolve(null);
      });

      const result = await backfillActiveProgramCompletion();

      expect(result).toBe(true);
      // markProgramComplete should have called runAsync with an UPDATE containing status = 'completed'
      const updateCalls = (mockDb.runAsync.mock.calls as [string, unknown[]][])
        .filter(([sql]) => sql.includes("status = 'completed'"));
      expect(updateCalls.length).toBeGreaterThan(0);
    });

    it('returns false and does not UPDATE when there is no active program', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null); // no active program

      const result = await backfillActiveProgramCompletion();

      expect(result).toBe(false);
      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });

    it('returns false and does not UPDATE when the final day is not yet logged', async () => {
      mockDb.getFirstAsync.mockImplementation((sql: string) => {
        if (sql.includes("status = 'active'")) return Promise.resolve(activeRow);
        if (sql.includes('FROM sessions')) return Promise.resolve(null); // not logged
        return Promise.resolve(null);
      });

      const result = await backfillActiveProgramCompletion();

      expect(result).toBe(false);
      const updateCalls = (mockDb.runAsync.mock.calls as [string, unknown[]][])
        .filter(([sql]) => sql.includes("status = 'completed'"));
      expect(updateCalls.length).toBe(0);
    });
  });
});
