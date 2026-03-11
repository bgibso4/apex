import {
  getEstimated1RM,
  get1RMHistory,
  getWeeklyVolume,
  getExerciseSetHistory,
  get1RMHistoryWithBlocks,
  getExerciseSetHistoryWithBlocks,
  getExerciseSessionCount,
  getTrainingConsistency,
  getAllTimeConsistency,
  getProtocolConsistency,
  calculateEpley,
} from '../../src/db/metrics';
import type { E1RMHistoryPoint, SessionSetHistory, WeekConsistency, ProgramConsistency, ProtocolItem } from '../../src/db/metrics';
import { getDatabase, generateId } from '../../src/db/database';

jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn(),
  generateId: jest.fn(() => 'test-id'),
}));

describe('getEstimated1RM', () => {
  let mockDb: {
    getAllAsync: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      getAllAsync: jest.fn(),
    };
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  it('returns null when no data', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);

    const result = await getEstimated1RM('exercise-1');

    expect(result).toBeNull();
  });

  it('finds the best e1RM from multiple rows', async () => {
    // SQL returns: actual_weight, actual_reps, date, name
    mockDb.getAllAsync.mockResolvedValue([
      { actual_weight: 200, actual_reps: 5, date: '2026-01-15', name: 'Bench Press' },
      { actual_weight: 225, actual_reps: 3, date: '2026-01-20', name: 'Bench Press' },
      { actual_weight: 185, actual_reps: 8, date: '2026-01-10', name: 'Bench Press' },
    ]);

    const result = await getEstimated1RM('exercise-1');

    expect(result).not.toBeNull();
    expect(result!.exercise_id).toBe('exercise-1');
    expect(result!.exercise_name).toBe('Bench Press');
    expect(result!.value).toBeGreaterThan(0);
    expect(result!.from_weight).toBeDefined();
    expect(result!.from_reps).toBeDefined();
    expect(result!.date).toBeDefined();
  });

  it('returns correct shape', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { actual_weight: 315, actual_reps: 1, date: '2026-02-01', name: 'Squat' },
    ]);

    const result = await getEstimated1RM('exercise-1');

    expect(result).toEqual(
      expect.objectContaining({
        exercise_id: 'exercise-1',
        exercise_name: 'Squat',
        from_weight: 315,
        from_reps: 1,
        date: '2026-02-01',
      })
    );
  });
});

describe('get1RMHistory', () => {
  let mockDb: {
    getAllAsync: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      getAllAsync: jest.fn(),
    };
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  it('returns empty array when no data', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);

    const result = await get1RMHistory('exercise-1');

    expect(result).toEqual([]);
  });

  it('groups by session_id and takes best per session', async () => {
    // SQL returns: date, actual_weight, actual_reps, session_id
    mockDb.getAllAsync.mockResolvedValue([
      { date: '2026-01-15', actual_weight: 200, actual_reps: 5, session_id: 'session-1' },
      { date: '2026-01-15', actual_weight: 185, actual_reps: 8, session_id: 'session-1' },
      { date: '2026-01-22', actual_weight: 210, actual_reps: 4, session_id: 'session-2' },
    ]);

    const result = await get1RMHistory('exercise-1');

    // Should have one entry per session
    expect(result.length).toBeLessThanOrEqual(2);
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns sorted by date ascending', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { date: '2026-01-22', actual_weight: 210, actual_reps: 4, session_id: 'session-2' },
      { date: '2026-01-15', actual_weight: 200, actual_reps: 5, session_id: 'session-1' },
    ]);

    const result = await get1RMHistory('exercise-1');

    if (result.length >= 2) {
      for (let i = 1; i < result.length; i++) {
        expect(result[i].date >= result[i - 1].date).toBe(true);
      }
    }
  });

  it('respects limit', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { date: '2026-01-15', actual_weight: 200, actual_reps: 5, session_id: 'session-1' },
      { date: '2026-01-22', actual_weight: 210, actual_reps: 4, session_id: 'session-2' },
      { date: '2026-01-29', actual_weight: 220, actual_reps: 3, session_id: 'session-3' },
    ]);

    const result = await get1RMHistory('exercise-1', 2);

    expect(result.length).toBeLessThanOrEqual(2);
  });
});

describe('getWeeklyVolume', () => {
  let mockDb: {
    getAllAsync: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      getAllAsync: jest.fn(),
    };
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  it('returns results from getAllAsync', async () => {
    const mockData = [
      { week: '2026-W01', total_volume: 15000 },
      { week: '2026-W02', total_volume: 16500 },
    ];
    mockDb.getAllAsync.mockResolvedValue(mockData);

    const result = await getWeeklyVolume('program-1');

    expect(result).toEqual(mockData);
  });
});

describe('getExerciseSetHistory', () => {
  let mockDb: {
    getAllAsync: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      getAllAsync: jest.fn(),
    };
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  it('returns empty array when no data', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);

    const result = await getExerciseSetHistory('exercise-1');

    expect(result).toEqual([]);
  });

  it('groups sets by date', async () => {
    // SQL returns: date, session_id, set_number, actual_weight, actual_reps, rpe
    mockDb.getAllAsync.mockResolvedValue([
      { date: '2026-01-15', session_id: 's1', set_number: 1, actual_weight: 200, actual_reps: 5, rpe: 8 },
      { date: '2026-01-15', session_id: 's1', set_number: 2, actual_weight: 200, actual_reps: 5, rpe: 8.5 },
      { date: '2026-01-22', session_id: 's2', set_number: 1, actual_weight: 210, actual_reps: 4, rpe: 9 },
    ]);

    const result = await getExerciseSetHistory('exercise-1');

    expect(result.length).toBe(2);
  });

  it('returns correct shape with sets array', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { date: '2026-01-15', session_id: 's1', set_number: 1, actual_weight: 200, actual_reps: 5, rpe: 8 },
    ]);

    const result = await getExerciseSetHistory('exercise-1');

    expect(result.length).toBe(1);
    const entry = result[0];
    expect(entry).toHaveProperty('date');
    expect(entry).toHaveProperty('sets');
    expect(Array.isArray(entry.sets)).toBe(true);
    expect(entry.sets[0]).toHaveProperty('weight');
    expect(entry.sets[0]).toHaveProperty('reps');
  });

  it('respects limit', async () => {
    const rows = [];
    for (let i = 0; i < 20; i++) {
      rows.push({
        date: `2026-01-${String(i + 1).padStart(2, '0')}`,
        session_id: `s${i}`,
        set_number: 1,
        actual_weight: 200 + i,
        actual_reps: 5,
        rpe: 8,
      });
    }
    mockDb.getAllAsync.mockResolvedValue(rows);

    const result = await getExerciseSetHistory('exercise-1', 5);

    expect(result.length).toBeLessThanOrEqual(5);
  });
});

describe('get1RMHistoryWithBlocks', () => {
  let mockDb: {
    getAllAsync: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      getAllAsync: jest.fn(),
    };
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  it('returns block_name with each data point', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { date: '2026-01-15', actual_weight: 200, actual_reps: 5, session_id: 'session-1', block_name: 'Hypertrophy' },
      { date: '2026-01-22', actual_weight: 210, actual_reps: 4, session_id: 'session-2', block_name: 'Strength' },
    ]);

    const result = await get1RMHistoryWithBlocks('exercise-1');

    expect(result.length).toBe(2);
    expect(result[0]).toHaveProperty('blockName');
    expect(result[0].blockName).toBe('Hypertrophy');
    expect(result[1].blockName).toBe('Strength');
    expect(result[0]).toHaveProperty('date');
    expect(result[0]).toHaveProperty('e1rm');
  });

  it('filters by startDate when provided', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);

    await get1RMHistoryWithBlocks('exercise-1', { startDate: '2026-01-01' });

    const call = mockDb.getAllAsync.mock.calls[0];
    const sql = call[0] as string;
    expect(sql).toContain('s.date >= ?');
    expect(call[1]).toContain('2026-01-01');
  });

  it('filters by programId when provided', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);

    await get1RMHistoryWithBlocks('exercise-1', { programId: 'prog-1' });

    const call = mockDb.getAllAsync.mock.calls[0];
    const sql = call[0] as string;
    expect(sql).toContain('s.program_id = ?');
    expect(call[1]).toContain('prog-1');
  });

  it('returns empty array when no data', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);

    const result = await get1RMHistoryWithBlocks('exercise-1');

    expect(result).toEqual([]);
  });

  it('groups by session_id and takes best e1RM per session', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { date: '2026-01-15', actual_weight: 200, actual_reps: 5, session_id: 'session-1', block_name: 'Hypertrophy' },
      { date: '2026-01-15', actual_weight: 185, actual_reps: 8, session_id: 'session-1', block_name: 'Hypertrophy' },
      { date: '2026-01-22', actual_weight: 210, actual_reps: 4, session_id: 'session-2', block_name: 'Strength' },
    ]);

    const result = await get1RMHistoryWithBlocks('exercise-1');

    expect(result.length).toBe(2);
  });

  it('returns sorted by date ascending', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { date: '2026-01-22', actual_weight: 210, actual_reps: 4, session_id: 'session-2', block_name: 'Strength' },
      { date: '2026-01-15', actual_weight: 200, actual_reps: 5, session_id: 'session-1', block_name: 'Hypertrophy' },
    ]);

    const result = await get1RMHistoryWithBlocks('exercise-1');

    expect(result[0].date).toBe('2026-01-15');
    expect(result[1].date).toBe('2026-01-22');
  });

  it('uses default limit of 50', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);

    await get1RMHistoryWithBlocks('exercise-1');

    const call = mockDb.getAllAsync.mock.calls[0];
    const params = call[1] as any[];
    // The limit * 5 (250) should be the last param
    expect(params[params.length - 1]).toBe(250);
  });
});

describe('getExerciseSetHistoryWithBlocks', () => {
  let mockDb: {
    getAllAsync: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      getAllAsync: jest.fn(),
    };
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  it('returns blockName and sessionE1rm for each session', async () => {
    // Mock data ordered by date DESC (as SQL would return)
    mockDb.getAllAsync.mockResolvedValue([
      { date: '2026-01-22', session_id: 's2', set_number: 1, actual_weight: 210, actual_reps: 4, rpe: 9, block_name: 'Strength' },
      { date: '2026-01-15', session_id: 's1', set_number: 1, actual_weight: 200, actual_reps: 5, rpe: 8, block_name: 'Hypertrophy' },
      { date: '2026-01-15', session_id: 's1', set_number: 2, actual_weight: 200, actual_reps: 5, rpe: 8.5, block_name: 'Hypertrophy' },
    ]);

    const result = await getExerciseSetHistoryWithBlocks('exercise-1');

    expect(result.length).toBe(2);
    // Most recent first (descending)
    expect(result[0].date).toBe('2026-01-22');
    expect(result[0].blockName).toBe('Strength');
    expect(result[0].sessionE1rm).toBe(calculateEpley(210, 4));
    expect(result[0].sets.length).toBe(1);

    expect(result[1].date).toBe('2026-01-15');
    expect(result[1].blockName).toBe('Hypertrophy');
    expect(result[1].sessionE1rm).toBe(calculateEpley(200, 5));
    expect(result[1].sets.length).toBe(2);
  });

  it('filters by startDate when provided', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);

    await getExerciseSetHistoryWithBlocks('exercise-1', { startDate: '2026-01-01' });

    const call = mockDb.getAllAsync.mock.calls[0];
    const sql = call[0] as string;
    expect(sql).toContain('s.date >= ?');
    expect(call[1]).toContain('2026-01-01');
  });

  it('filters by programId when provided', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);

    await getExerciseSetHistoryWithBlocks('exercise-1', { programId: 'prog-1' });

    const call = mockDb.getAllAsync.mock.calls[0];
    const sql = call[0] as string;
    expect(sql).toContain('s.program_id = ?');
    expect(call[1]).toContain('prog-1');
  });

  it('computes avgRpe from non-null RPEs rounded to 1 decimal', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { date: '2026-01-15', session_id: 's1', set_number: 1, actual_weight: 200, actual_reps: 5, rpe: 7, block_name: 'Hypertrophy' },
      { date: '2026-01-15', session_id: 's1', set_number: 2, actual_weight: 200, actual_reps: 5, rpe: 8, block_name: 'Hypertrophy' },
      { date: '2026-01-15', session_id: 's1', set_number: 3, actual_weight: 200, actual_reps: 5, rpe: null, block_name: 'Hypertrophy' },
    ]);

    const result = await getExerciseSetHistoryWithBlocks('exercise-1');

    expect(result.length).toBe(1);
    // Average of 7 and 8 = 7.5 (null excluded)
    expect(result[0].avgRpe).toBe(7.5);
  });

  it('returns avgRpe null when all RPEs are null', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { date: '2026-01-15', session_id: 's1', set_number: 1, actual_weight: 200, actual_reps: 5, rpe: null, block_name: 'Hypertrophy' },
    ]);

    const result = await getExerciseSetHistoryWithBlocks('exercise-1');

    expect(result[0].avgRpe).toBeNull();
  });

  it('defaults to limit of 5', async () => {
    // Create 10 sessions
    const rows = [];
    for (let i = 0; i < 10; i++) {
      rows.push({
        date: `2026-01-${String(i + 1).padStart(2, '0')}`,
        session_id: `s${i}`,
        set_number: 1,
        actual_weight: 200,
        actual_reps: 5,
        rpe: 8,
        block_name: 'Block',
      });
    }
    mockDb.getAllAsync.mockResolvedValue(rows);

    const result = await getExerciseSetHistoryWithBlocks('exercise-1');

    expect(result.length).toBe(5);
  });

  it('returns empty array when no data', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);

    const result = await getExerciseSetHistoryWithBlocks('exercise-1');

    expect(result).toEqual([]);
  });
});

describe('getExerciseSessionCount', () => {
  let mockDb: {
    getFirstAsync: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      getFirstAsync: jest.fn(),
    };
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  it('returns the count of distinct sessions', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ count: 7 });

    const result = await getExerciseSessionCount('exercise-1');

    expect(result).toBe(7);
  });

  it('returns 0 when no sessions found', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ count: 0 });

    const result = await getExerciseSessionCount('exercise-1');

    expect(result).toBe(0);
  });
});

describe('getTrainingConsistency', () => {
  let mockDb: {
    getAllAsync: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      getAllAsync: jest.fn(),
    };
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  it('returns per-week completed vs planned', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { week: 1, completed: 3 },
      { week: 2, completed: 2 },
      { week: 3, completed: 4 },
    ]);

    const result = await getTrainingConsistency('program-1', 4);

    expect(result).toEqual([
      { week: 1, completed: 3, planned: 4 },
      { week: 2, completed: 2, planned: 4 },
      { week: 3, completed: 4, planned: 4 },
    ]);
  });

  it('returns empty array when no sessions', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);

    const result = await getTrainingConsistency('program-1', 3);

    expect(result).toEqual([]);
  });

  it('passes programId to query', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);

    await getTrainingConsistency('prog-abc', 4);

    const call = mockDb.getAllAsync.mock.calls[0];
    expect(call[1]).toContain('prog-abc');
  });

  it('uses trainingDaysPerWeek for planned value', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { week: 1, completed: 2 },
    ]);

    const result = await getTrainingConsistency('program-1', 5);

    expect(result[0].planned).toBe(5);
  });
});

describe('getAllTimeConsistency', () => {
  let mockDb: {
    getAllAsync: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      getAllAsync: jest.fn(),
    };
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  it('returns per-program consistency stats with correct planned calculation', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { programId: 'prog-1', programName: 'Strength Block', completed: 10, duration_weeks: 4 },
      { programId: 'prog-2', programName: 'Hypertrophy Block', completed: 8, duration_weeks: 3 },
    ]);

    const result = await getAllTimeConsistency(4);

    expect(result).toEqual([
      { programId: 'prog-1', programName: 'Strength Block', completed: 10, planned: 16 },
      { programId: 'prog-2', programName: 'Hypertrophy Block', completed: 8, planned: 12 },
    ]);
  });

  it('returns empty array when no programs', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);

    const result = await getAllTimeConsistency(3);

    expect(result).toEqual([]);
  });

  it('handles programs with zero completed sessions', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { programId: 'prog-1', programName: 'New Program', completed: 0, duration_weeks: 6 },
    ]);

    const result = await getAllTimeConsistency(4);

    expect(result).toEqual([
      { programId: 'prog-1', programName: 'New Program', completed: 0, planned: 24 },
    ]);
  });

  it('passes trainingDaysPerWeek correctly for planned calculation', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { programId: 'prog-1', programName: 'Test', completed: 5, duration_weeks: 4 },
    ]);

    const result = await getAllTimeConsistency(3);

    expect(result[0].planned).toBe(12); // 4 weeks * 3 days
  });
});

describe('getProtocolConsistency', () => {
  let mockDb: {
    getAllAsync: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      getAllAsync: jest.fn(),
    };
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  it('returns completion rate per protocol item grouped by protocol_name', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { name: 'Jump Rope', total: 10, completed: 8 },
      { name: 'Ankle Protocol', total: 10, completed: 6 },
      { name: 'Hip IR Work', total: 10, completed: 7 },
      { name: 'Conditioning', total: 10, completed: 5 },
    ]);

    const result = await getProtocolConsistency('prog-1');

    expect(result).toEqual([
      { name: 'Jump Rope', completed: 8, total: 10 },
      { name: 'Ankle Protocol', completed: 6, total: 10 },
      { name: 'Hip IR Work', completed: 7, total: 10 },
      { name: 'Conditioning', completed: 5, total: 10 },
    ]);
  });

  it('queries all programs when programId is null (SQL should NOT contain program_id)', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);

    await getProtocolConsistency(null);

    const call = mockDb.getAllAsync.mock.calls[0];
    const sql = call[0] as string;
    expect(sql).not.toContain('program_id');
  });

  it('handles zero sessions gracefully', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);

    const result = await getProtocolConsistency('prog-1');

    expect(result).toEqual([]);
  });

  it('filters by programId when provided', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);

    await getProtocolConsistency('prog-abc');

    const call = mockDb.getAllAsync.mock.calls[0];
    const sql = call[0] as string;
    expect(sql).toContain('program_id');
    expect(call[1]).toContain('prog-abc');
  });
});

describe('getLoggedExercises', () => {
  const { getLoggedExercises } = require('../../src/db/metrics');

  let mockDb: {
    getAllAsync: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      getAllAsync: jest.fn(),
    };
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  it('returns distinct exercises that have been logged, with muscleGroups parsed from JSON', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { id: 'ex-1', name: 'Bench Press', muscle_groups: '["chest","triceps"]' },
      { id: 'ex-2', name: 'Squat', muscle_groups: '["quads","glutes"]' },
    ]);

    const result = await getLoggedExercises();

    expect(result).toEqual([
      { id: 'ex-1', name: 'Bench Press', muscleGroups: ['chest', 'triceps'] },
      { id: 'ex-2', name: 'Squat', muscleGroups: ['quads', 'glutes'] },
    ]);
  });

  it('returns empty array when no exercises have been logged', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);

    const result = await getLoggedExercises();

    expect(result).toEqual([]);
  });

  it('queries with correct SQL (DISTINCT, JOIN, status filter, ORDER BY name)', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);

    await getLoggedExercises();

    const call = mockDb.getAllAsync.mock.calls[0];
    const sql = call[0] as string;
    expect(sql).toContain('DISTINCT');
    expect(sql).toContain('set_logs');
    expect(sql).toContain("'completed'");
    expect(sql).toContain("'completed_below'");
    expect(sql).toContain('ORDER BY');
    expect(sql).toContain('name');
  });

  it('handles empty muscle_groups JSON gracefully', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { id: 'ex-1', name: 'Cable Fly', muscle_groups: '[]' },
    ]);

    const result = await getLoggedExercises();

    expect(result[0].muscleGroups).toEqual([]);
  });
});

describe('getProgramBoundaries', () => {
  const { getProgramBoundaries } = require('../../src/db/metrics');

  let mockDb: {
    getAllAsync: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      getAllAsync: jest.fn(),
    };
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  it('returns program name and date boundaries', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { id: 'prog-1', name: 'Strength Block', activated_date: '2026-01-01', duration_weeks: 8 },
      { id: 'prog-2', name: 'Hypertrophy Block', activated_date: '2026-03-01', duration_weeks: 6 },
    ]);

    const result = await getProgramBoundaries();

    expect(result).toEqual([
      { programId: 'prog-1', programName: 'Strength Block', startDate: '2026-01-01', durationWeeks: 8 },
      { programId: 'prog-2', programName: 'Hypertrophy Block', startDate: '2026-03-01', durationWeeks: 6 },
    ]);
  });

  it('returns empty array when no programs match', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);

    const result = await getProgramBoundaries();

    expect(result).toEqual([]);
  });

  it('queries for active/completed programs with activated_date, ordered by activated_date ASC', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);

    await getProgramBoundaries();

    const call = mockDb.getAllAsync.mock.calls[0];
    const sql = call[0] as string;
    expect(sql).toContain("'active'");
    expect(sql).toContain("'completed'");
    expect(sql).toContain('activated_date');
    expect(sql).toContain('ORDER BY');
  });
});

describe('getPlannedWeeklyVolume', () => {
  const { getPlannedWeeklyVolume } = require('../../src/db/metrics');
  type ProgramDefinition = import('../../src/types/program').ProgramDefinition;

  it('calculates planned sets per week from definition with two training days', () => {
    const definition: ProgramDefinition = {
      program: {
        name: 'Test Program',
        duration_weeks: 4,
        created: '2026-01-01',
        blocks: [
          { name: 'Hypertrophy', weeks: [1, 2, 3, 4], main_lift_scheme: {} },
        ],
        weekly_template: {
          monday: {
            name: 'Upper',
            locked: false,
            warmup: 'standard',
            exercises: [
              {
                exercise_id: 'bench',
                category: 'main' as const,
                targets: [{ weeks: [1, 2, 3, 4], sets: 4, reps: 8 }],
              },
              {
                exercise_id: 'row',
                category: 'accessory' as const,
                targets: [{ weeks: [1, 2, 3, 4], sets: 3, reps: 10 }],
              },
            ],
          },
          wednesday: { type: 'rest' as const },
          friday: {
            name: 'Lower',
            locked: false,
            warmup: 'standard',
            exercises: [
              {
                exercise_id: 'squat',
                category: 'main' as const,
                targets: [{ weeks: [1, 2, 3, 4], sets: 5, reps: 5 }],
              },
            ],
          },
        },
        exercise_definitions: [],
        warmup_protocols: {},
      },
    };

    const result = getPlannedWeeklyVolume(definition, 4);

    expect(result).toHaveLength(4);
    // Each week: bench(4) + row(3) + squat(5) = 12 sets
    for (const week of result) {
      expect(week.plannedSets).toBe(12);
      expect(week.blockName).toBe('Hypertrophy');
    }
    expect(result[0].week).toBe(1);
    expect(result[3].week).toBe(4);
  });

  it('handles different targets per week/block (varying set counts across blocks)', () => {
    const definition: ProgramDefinition = {
      program: {
        name: 'Periodized Program',
        duration_weeks: 6,
        created: '2026-01-01',
        blocks: [
          { name: 'Volume', weeks: [1, 2, 3], main_lift_scheme: {} },
          { name: 'Intensity', weeks: [4, 5, 6], main_lift_scheme: {} },
        ],
        weekly_template: {
          tuesday: {
            name: 'Main Day',
            locked: false,
            warmup: 'standard',
            exercises: [
              {
                exercise_id: 'deadlift',
                category: 'main' as const,
                targets: [
                  { weeks: [1, 2, 3], sets: 5, reps: 8 },
                  { weeks: [4, 5, 6], sets: 3, reps: 3 },
                ],
              },
              {
                exercise_id: 'pull_up',
                category: 'accessory' as const,
                targets: [
                  { weeks: [1, 2, 3], sets: 4, reps: 10 },
                  { weeks: [4, 5, 6], sets: 2, reps: 5 },
                ],
              },
            ],
          },
          sunday: { type: 'rest' as const },
        },
        exercise_definitions: [],
        warmup_protocols: {},
      },
    };

    const result = getPlannedWeeklyVolume(definition, 6);

    expect(result).toHaveLength(6);
    // Weeks 1-3 (Volume): deadlift(5) + pull_up(4) = 9
    expect(result[0]).toEqual({ week: 1, plannedSets: 9, blockName: 'Volume' });
    expect(result[1]).toEqual({ week: 2, plannedSets: 9, blockName: 'Volume' });
    expect(result[2]).toEqual({ week: 3, plannedSets: 9, blockName: 'Volume' });
    // Weeks 4-6 (Intensity): deadlift(3) + pull_up(2) = 5
    expect(result[3]).toEqual({ week: 4, plannedSets: 5, blockName: 'Intensity' });
    expect(result[4]).toEqual({ week: 5, plannedSets: 5, blockName: 'Intensity' });
    expect(result[5]).toEqual({ week: 6, plannedSets: 5, blockName: 'Intensity' });
  });
});
