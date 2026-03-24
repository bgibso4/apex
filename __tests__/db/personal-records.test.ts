import { getDatabase, generateId } from '../../src/db/database';
import { calculateEpley } from '../../src/db/metrics';
import {
  detectPRs,
  getPRsForSession,
} from '../../src/db/personal-records';

jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn(),
  generateId: jest.fn(() => 'pr-id-123'),
}));

function createMockDb() {
  return {
    runAsync: jest.fn().mockResolvedValue({ changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
  };
}

describe('personal records', () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  describe('detectPRs', () => {
    it('detects an e1RM PR when new e1RM exceeds previous best', async () => {
      // Session sets: 225 lbs × 5 reps → e1RM = 263
      const sessionSets = [
        { exercise_id: 'bench_press', actual_weight: 225, actual_reps: 5, status: 'completed' as const },
      ];
      // No previous e1RM record
      mockDb.getFirstAsync.mockResolvedValue(null);

      const prs = await detectPRs('session-1', '2026-03-07', sessionSets);

      expect(prs.length).toBeGreaterThanOrEqual(1);
      expect(prs).toContainEqual(expect.objectContaining({
        exercise_id: 'bench_press',
        record_type: 'e1rm',
        value: calculateEpley(225, 5),
      }));

      // All INSERTs must include updated_at
      const insertCalls = mockDb.runAsync.mock.calls.filter(([sql]: [string]) => sql.includes('INSERT INTO personal_records'));
      expect(insertCalls.length).toBeGreaterThan(0);
      for (const [sql] of insertCalls) {
        expect(sql).toContain('updated_at');
      }
    });

    it('does not detect e1RM PR when below previous best', async () => {
      const sessionSets = [
        { exercise_id: 'bench_press', actual_weight: 200, actual_reps: 5, status: 'completed' as const },
      ];
      // Previous e1RM was 263
      mockDb.getFirstAsync.mockResolvedValue({ value: 263 });

      const prs = await detectPRs('session-1', '2026-03-07', sessionSets);

      const e1rmPRs = prs.filter(p => p.record_type === 'e1rm' && p.exercise_id === 'bench_press');
      expect(e1rmPRs).toHaveLength(0);
    });

    it('detects rep PR at tracked rep counts', async () => {
      const sessionSets = [
        { exercise_id: 'squat', actual_weight: 225, actual_reps: 5, status: 'completed' as const },
      ];
      // No previous rep best at 5 reps
      mockDb.getFirstAsync.mockResolvedValue(null);

      const prs = await detectPRs('session-1', '2026-03-07', sessionSets);

      expect(prs).toContainEqual(expect.objectContaining({
        exercise_id: 'squat',
        record_type: 'rep_best',
        rep_count: 5,
        value: 225,
      }));
    });

    it('ignores rep counts not in tracked list', async () => {
      const sessionSets = [
        { exercise_id: 'squat', actual_weight: 225, actual_reps: 7, status: 'completed' as const },
      ];
      mockDb.getFirstAsync.mockResolvedValue(null);

      const prs = await detectPRs('session-1', '2026-03-07', sessionSets);

      const repPRs = prs.filter(p => p.record_type === 'rep_best');
      expect(repPRs).toHaveLength(0);
    });

    it('skips sets with zero weight or reps', async () => {
      const sessionSets = [
        { exercise_id: 'pushups', actual_weight: 0, actual_reps: 15, status: 'completed' as const },
      ];
      mockDb.getFirstAsync.mockResolvedValue(null);

      const prs = await detectPRs('session-1', '2026-03-07', sessionSets);

      expect(prs).toHaveLength(0);
    });
  });

  describe('PR detection for non-standard exercises', () => {
    it('skips e1RM PR for exercises without weight+reps', async () => {
      // Exercise with inputFields = duration only — should not generate e1RM or rep PRs
      const sessionSets = [
        {
          exercise_id: 'plank',
          actual_weight: 0,
          actual_reps: 0,
          actual_duration: 60,
          status: 'completed' as const,
          input_fields: JSON.stringify([{ type: 'duration', unit: 'sec' }]),
        },
      ];
      mockDb.getFirstAsync.mockResolvedValue(null);

      const prs = await detectPRs('session-1', '2026-03-07', sessionSets);

      const e1rmPRs = prs.filter(p => p.record_type === 'e1rm');
      expect(e1rmPRs).toHaveLength(0);
      const repPRs = prs.filter(p => p.record_type === 'rep_best');
      expect(repPRs).toHaveLength(0);
    });

    it('detects duration PR for duration exercises', async () => {
      const sessionSets = [
        {
          exercise_id: 'plank',
          actual_weight: 0,
          actual_reps: 0,
          actual_duration: 60,
          status: 'completed' as const,
          input_fields: JSON.stringify([{ type: 'duration', unit: 'sec' }]),
        },
      ];
      // Previous best was 45
      mockDb.getFirstAsync.mockImplementation(async (sql: string) => {
        if (sql.includes('best_duration')) return { value: 45 };
        return null;
      });

      const prs = await detectPRs('session-1', '2026-03-07', sessionSets);

      expect(prs).toContainEqual(expect.objectContaining({
        exercise_id: 'plank',
        record_type: 'best_duration',
        value: 60,
        previous_value: 45,
      }));
    });

    it('detects time PR for distance_time exercises (lower is better)', async () => {
      const sessionSets = [
        {
          exercise_id: 'ski_erg',
          actual_weight: 0,
          actual_reps: 0,
          actual_time: 100,
          actual_distance: 500,
          status: 'completed' as const,
          input_fields: JSON.stringify([{ type: 'distance', unit: 'm' }, { type: 'time', unit: 'sec' }]),
        },
      ];
      // Previous best was 108 (slower)
      mockDb.getFirstAsync.mockImplementation(async (sql: string) => {
        if (sql.includes('best_time')) return { value: 108 };
        return null;
      });

      const prs = await detectPRs('session-1', '2026-03-07', sessionSets);

      expect(prs).toContainEqual(expect.objectContaining({
        exercise_id: 'ski_erg',
        record_type: 'best_time',
        value: 100,
        previous_value: 108,
      }));
    });

    it('detects reps PR for reps-only exercises', async () => {
      const sessionSets = [
        {
          exercise_id: 'pullups',
          actual_weight: 0,
          actual_reps: 15,
          status: 'completed' as const,
          input_fields: JSON.stringify([{ type: 'reps' }]),
        },
      ];
      // Previous best was 12
      mockDb.getFirstAsync.mockImplementation(async (sql: string) => {
        if (sql.includes('best_reps')) return { value: 12 };
        return null;
      });

      const prs = await detectPRs('session-1', '2026-03-07', sessionSets);

      expect(prs).toContainEqual(expect.objectContaining({
        exercise_id: 'pullups',
        record_type: 'best_reps',
        value: 15,
        previous_value: 12,
      }));
    });

    it('does not create duration PR when not beaten', async () => {
      const sessionSets = [
        {
          exercise_id: 'plank',
          actual_weight: 0,
          actual_reps: 0,
          actual_duration: 30,
          status: 'completed' as const,
          input_fields: JSON.stringify([{ type: 'duration', unit: 'sec' }]),
        },
      ];
      // Previous best was 45 — current 30 is worse
      mockDb.getFirstAsync.mockImplementation(async (sql: string) => {
        if (sql.includes('best_duration')) return { value: 45 };
        return null;
      });

      const prs = await detectPRs('session-1', '2026-03-07', sessionSets);

      const durationPRs = prs.filter(p => p.record_type === 'best_duration');
      expect(durationPRs).toHaveLength(0);
    });

    it('does not create time PR when slower', async () => {
      const sessionSets = [
        {
          exercise_id: 'ski_erg',
          actual_weight: 0,
          actual_reps: 0,
          actual_time: 120,
          actual_distance: 500,
          status: 'completed' as const,
          input_fields: JSON.stringify([{ type: 'distance', unit: 'm' }, { type: 'time', unit: 'sec' }]),
        },
      ];
      // Previous best was 108 — current 120 is slower
      mockDb.getFirstAsync.mockImplementation(async (sql: string) => {
        if (sql.includes('best_time')) return { value: 108 };
        return null;
      });

      const prs = await detectPRs('session-1', '2026-03-07', sessionSets);

      const timePRs = prs.filter(p => p.record_type === 'best_time');
      expect(timePRs).toHaveLength(0);
    });

    it('detects duration PR when no previous record exists', async () => {
      const sessionSets = [
        {
          exercise_id: 'plank',
          actual_weight: 0,
          actual_reps: 0,
          actual_duration: 60,
          status: 'completed' as const,
          input_fields: JSON.stringify([{ type: 'duration', unit: 'sec' }]),
        },
      ];
      mockDb.getFirstAsync.mockResolvedValue(null);

      const prs = await detectPRs('session-1', '2026-03-07', sessionSets);

      expect(prs).toContainEqual(expect.objectContaining({
        exercise_id: 'plank',
        record_type: 'best_duration',
        value: 60,
        previous_value: null,
      }));
    });

    it('weight+reps exercises still get e1RM and rep PRs', async () => {
      const sessionSets = [
        {
          exercise_id: 'bench_press',
          actual_weight: 225,
          actual_reps: 5,
          status: 'completed' as const,
          input_fields: JSON.stringify([{ type: 'weight', unit: 'lbs' }, { type: 'reps' }]),
        },
      ];
      mockDb.getFirstAsync.mockResolvedValue(null);

      const prs = await detectPRs('session-1', '2026-03-07', sessionSets);

      expect(prs).toContainEqual(expect.objectContaining({
        exercise_id: 'bench_press',
        record_type: 'e1rm',
      }));
      expect(prs).toContainEqual(expect.objectContaining({
        exercise_id: 'bench_press',
        record_type: 'rep_best',
        rep_count: 5,
      }));
    });
  });

  describe('getPRsForSession', () => {
    it('returns all PRs for a given session', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        {
          id: 'pr-1', exercise_id: 'bench_press', record_type: 'e1rm',
          rep_count: null, value: 263, previous_value: 250,
          session_id: 'session-1', date: '2026-03-07',
          exercise_name: 'Bench Press',
        },
      ]);

      const prs = await getPRsForSession('session-1');
      expect(prs).toHaveLength(1);
      expect(prs[0].exercise_id).toBe('bench_press');
    });
  });
});
