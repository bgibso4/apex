/**
 * Tests for src/db/runs.ts — Run log data access
 */

import { getDatabase, generateId } from '../../src/db/database';
import {
  logRun,
  getRunLogs,
  getPainTrend,
  getRunStats,
  updateRunPain24h,
  getPendingPainFollowUp,
} from '../../src/db/runs';

jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn(),
  generateId: jest.fn(() => 'test-run-id'),
}));

function createMockDb() {
  return {
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
    execAsync: jest.fn().mockResolvedValue(undefined),
  };
}

describe('runs', () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  // ---------------------------------------------------------------------------
  // logRun
  // ---------------------------------------------------------------------------
  describe('logRun', () => {
    it('inserts a run with all fields and returns generated id', async () => {
      const id = await logRun({
        sessionId: 'sess-1',
        date: '2026-03-01',
        durationMin: 30,
        distance: 3.1,
        painLevel: 2,
        notes: 'felt good',
        includedPickups: true,
      });

      expect(id).toBe('test-run-id');
      expect(generateId).toHaveBeenCalled();
      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);

      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('INSERT INTO run_logs');
      expect(params).toEqual([
        'test-run-id',
        'sess-1',
        '2026-03-01',
        30,
        3.1,
        2,
        'felt good',
        1, // includedPickups → 1
      ]);
    });

    it('inserts with distance parameter', async () => {
      await logRun({
        date: '2026-03-02',
        durationMin: 25,
        distance: 2.5,
        painLevel: 3,
        includedPickups: false,
      });

      const [, params] = mockDb.runAsync.mock.calls[0];
      expect(params[4]).toBe(2.5); // distance
    });

    it('defaults optional fields to null when omitted', async () => {
      await logRun({
        date: '2026-03-03',
        durationMin: 20,
        painLevel: 1,
        includedPickups: false,
      });

      const [, params] = mockDb.runAsync.mock.calls[0];
      expect(params[1]).toBeNull(); // sessionId → null
      expect(params[4]).toBeNull(); // distance → null
      expect(params[6]).toBeNull(); // notes → null
      expect(params[7]).toBe(0);    // includedPickups → 0
    });
  });

  // ---------------------------------------------------------------------------
  // getRunLogs
  // ---------------------------------------------------------------------------
  describe('getRunLogs', () => {
    it('queries with default limit of 20', async () => {
      const mockRows = [
        { id: 'r1', date: '2026-03-01' },
        { id: 'r2', date: '2026-02-28' },
      ];
      mockDb.getAllAsync.mockResolvedValue(mockRows);

      const result = await getRunLogs();

      expect(mockDb.getAllAsync).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.getAllAsync.mock.calls[0];
      expect(sql).toContain('SELECT * FROM run_logs');
      expect(sql).toContain('ORDER BY date DESC');
      expect(sql).toContain('LIMIT ?');
      expect(params).toEqual([20]);
      expect(result).toEqual(mockRows);
    });

    it('passes custom limit', async () => {
      await getRunLogs(5);

      const [, params] = mockDb.getAllAsync.mock.calls[0];
      expect(params).toEqual([5]);
    });
  });

  // ---------------------------------------------------------------------------
  // getPainTrend
  // ---------------------------------------------------------------------------
  describe('getPainTrend', () => {
    it('returns correct aliased fields', async () => {
      const mockRows = [
        { date: '2026-03-01', painLevel: 3, painLevel24h: 2, durationMin: 30, distance: 3.0 },
      ];
      mockDb.getAllAsync.mockResolvedValue(mockRows);

      const result = await getPainTrend(10);

      const [sql, params] = mockDb.getAllAsync.mock.calls[0];
      expect(sql).toContain('pain_level as painLevel');
      expect(sql).toContain('pain_level_24h as painLevel24h');
      expect(sql).toContain('duration_min as durationMin');
      expect(sql).toContain('ORDER BY date DESC');
      expect(params).toEqual([10]);
      expect(result).toEqual(mockRows);
    });

    it('uses default limit of 12', async () => {
      await getPainTrend();

      const [, params] = mockDb.getAllAsync.mock.calls[0];
      expect(params).toEqual([12]);
    });
  });

  // ---------------------------------------------------------------------------
  // getRunStats
  // ---------------------------------------------------------------------------
  describe('getRunStats', () => {
    it('calls multiple queries and returns aggregated stats', async () => {
      mockDb.getFirstAsync
        .mockResolvedValueOnce({ count: 15 })     // total
        .mockResolvedValueOnce({ total: 42.3 })    // miles
        .mockResolvedValueOnce({ avg: 3.2 })       // recent pain
        .mockResolvedValueOnce({ avg: 4.1 })       // prev pain
        .mockResolvedValueOnce({ avg: 9.5 })       // recent pace
        .mockResolvedValueOnce({ avg: 10.2 });     // prev pace

      const result = await getRunStats();

      expect(mockDb.getFirstAsync).toHaveBeenCalledTimes(6);
      expect(result).toEqual({
        totalRuns: 15,
        totalMiles: 42.3,
        avgPain: 3.2,
        avgPainPrev: 4.1,
        avgPace: 9.5,
        avgPacePrev: 10.2,
      });
    });

    it('returns defaults when queries return null', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await getRunStats();

      expect(result).toEqual({
        totalRuns: 0,
        totalMiles: 0,
        avgPain: 0,
        avgPainPrev: 0,
        avgPace: null,
        avgPacePrev: null,
      });
    });

    it('returns null pace when avg is zero/falsy', async () => {
      mockDb.getFirstAsync
        .mockResolvedValueOnce({ count: 5 })
        .mockResolvedValueOnce({ total: 10 })
        .mockResolvedValueOnce({ avg: 2 })
        .mockResolvedValueOnce({ avg: 3 })
        .mockResolvedValueOnce({ avg: 0 })       // falsy pace
        .mockResolvedValueOnce({ avg: null });    // null pace

      const result = await getRunStats();

      expect(result.avgPace).toBeNull();
      expect(result.avgPacePrev).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // updateRunPain24h
  // ---------------------------------------------------------------------------
  describe('updateRunPain24h', () => {
    it('calls UPDATE with correct params', async () => {
      await updateRunPain24h('run-123', 4);

      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('UPDATE run_logs SET pain_level_24h = ?');
      expect(sql).toContain('WHERE id = ?');
      expect(params).toEqual([4, 'run-123']);
    });
  });

  // ---------------------------------------------------------------------------
  // getPendingPainFollowUp
  // ---------------------------------------------------------------------------
  describe('getPendingPainFollowUp', () => {
    it('queries with date range filter and returns run', async () => {
      const mockRun = { id: 'run-old', date: '2026-03-04', pain_level: 3 };
      mockDb.getFirstAsync.mockResolvedValue(mockRun);

      const result = await getPendingPainFollowUp();

      expect(mockDb.getFirstAsync).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.getFirstAsync.mock.calls[0];
      expect(sql).toContain('pain_level_24h IS NULL');
      expect(sql).toContain('date <= ?');
      expect(sql).toContain('date >= ?');
      expect(sql).toContain('ORDER BY date DESC LIMIT 1');
      // params should be [cutoffRecent, cutoffOld] — two date strings
      expect(params).toHaveLength(2);
      expect(typeof params[0]).toBe('string');
      expect(typeof params[1]).toBe('string');
      expect(result).toEqual(mockRun);
    });

    it('returns null when no pending follow-up', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await getPendingPainFollowUp();

      expect(result).toBeNull();
    });
  });
});
