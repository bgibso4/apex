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
