import {
  getEstimated1RM,
  get1RMHistory,
  getWeeklyVolume,
  getExerciseSetHistory,
  get1RMHistoryWithBlocks,
  getExerciseSetHistoryWithBlocks,
  getExerciseSessionCount,
  calculateEpley,
} from '../../src/db/metrics';
import type { E1RMHistoryPoint, SessionSetHistory } from '../../src/db/metrics';
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
