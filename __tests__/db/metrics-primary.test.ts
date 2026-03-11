import {
  getExercisePrimaryMetric,
  getMetricHistory,
  getGenericExerciseSetHistory,
} from '../../src/db/metrics';
import { getDatabase } from '../../src/db/database';

jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn(),
  generateId: jest.fn(() => 'test-id'),
}));

describe('getExercisePrimaryMetric', () => {
  let mockDb: {
    getAllAsync: jest.Mock;
    getFirstAsync: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      getAllAsync: jest.fn(),
      getFirstAsync: jest.fn(),
    };
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  it('returns e1RM for weight+reps exercises', async () => {
    // weight_reps fields (default / null)
    mockDb.getAllAsync.mockResolvedValue([
      { actual_weight: 225, actual_reps: 5, date: '2026-01-20', name: 'Bench Press' },
    ]);

    const result = await getExercisePrimaryMetric('bench-1', null);

    expect(result).not.toBeNull();
    expect(result!.label).toBe('Estimated 1RM');
    expect(result!.unit).toBe('lbs');
    expect(result!.value).toBe(263); // 225 * (1 + 5/30) = 262.5 -> 263
    expect(result!.detail).toContain('225');
    expect(result!.detail).toContain('5');
  });

  it('returns null for exercise with no data (weight+reps)', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);

    const result = await getExercisePrimaryMetric('bench-1', null);

    expect(result).toBeNull();
  });

  it('returns best duration for duration exercises', async () => {
    const inputFields = JSON.stringify([{ type: 'duration', unit: 'sec' }]);
    mockDb.getFirstAsync.mockResolvedValue({ best: 60 });

    const result = await getExercisePrimaryMetric('plank-1', inputFields);

    expect(result).not.toBeNull();
    expect(result!.label).toBe('Best Duration');
    expect(result!.unit).toBe('sec');
    expect(result!.value).toBe(60);
  });

  it('returns null for duration exercise with no data', async () => {
    const inputFields = JSON.stringify([{ type: 'duration', unit: 'sec' }]);
    mockDb.getFirstAsync.mockResolvedValue({ best: null });

    const result = await getExercisePrimaryMetric('plank-1', inputFields);

    expect(result).toBeNull();
  });

  it('returns best reps for reps-only exercises', async () => {
    const inputFields = JSON.stringify([{ type: 'reps' }]);
    mockDb.getFirstAsync.mockResolvedValue({ best: 25 });

    const result = await getExercisePrimaryMetric('pullup-1', inputFields);

    expect(result).not.toBeNull();
    expect(result!.label).toBe('Best Reps');
    expect(result!.unit).toBe('reps');
    expect(result!.value).toBe(25);
  });

  it('returns best time (MIN) for distance+time exercises', async () => {
    const inputFields = JSON.stringify([
      { type: 'distance', unit: 'm' },
      { type: 'time', unit: 'm:ss' },
    ]);
    mockDb.getFirstAsync.mockResolvedValue({ best: 106 });

    const result = await getExercisePrimaryMetric('erg-1', inputFields);

    expect(result).not.toBeNull();
    expect(result!.label).toBe('Best Time');
    expect(result!.unit).toBe('sec');
    expect(result!.value).toBe(106);
  });

  it('returns best distance for distance-only exercises', async () => {
    const inputFields = JSON.stringify([{ type: 'distance', unit: 'm' }]);
    mockDb.getFirstAsync.mockResolvedValue({ best: 1000 });

    const result = await getExercisePrimaryMetric('run-1', inputFields);

    expect(result).not.toBeNull();
    expect(result!.label).toBe('Best Distance');
    expect(result!.unit).toBe('m');
    expect(result!.value).toBe(1000);
  });
});

describe('getMetricHistory', () => {
  let mockDb: {
    getAllAsync: jest.Mock;
    getFirstAsync: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      getAllAsync: jest.fn(),
      getFirstAsync: jest.fn(),
    };
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  it('returns metric history grouped by session', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { date: '2026-01-10', value: 45, block_name: 'Block A' },
      { date: '2026-01-17', value: 50, block_name: 'Block A' },
    ]);

    const result = await getMetricHistory('plank-1', 'actual_duration');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ date: '2026-01-10', value: 45, blockName: 'Block A' });
    expect(result[1]).toEqual({ date: '2026-01-17', value: 50, blockName: 'Block A' });
  });

  it('passes startDate and programId filters', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);

    await getMetricHistory('ex-1', 'actual_duration', 'MAX', {
      startDate: '2026-01-01',
      programId: 'prog-1',
    });

    const sql = mockDb.getAllAsync.mock.calls[0][0] as string;
    expect(sql).toContain('s.date >= ?');
    expect(sql).toContain('s.program_id = ?');
    const params = mockDb.getAllAsync.mock.calls[0][1];
    expect(params).toContain('2026-01-01');
    expect(params).toContain('prog-1');
  });

  it('uses MIN aggregation when specified', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);

    await getMetricHistory('erg-1', 'actual_time', 'MIN');

    const sql = mockDb.getAllAsync.mock.calls[0][0] as string;
    expect(sql).toContain('MIN(sl.actual_time)');
  });
});

describe('getGenericExerciseSetHistory', () => {
  let mockDb: {
    getAllAsync: jest.Mock;
    getFirstAsync: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      getAllAsync: jest.fn(),
      getFirstAsync: jest.fn(),
    };
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  it('returns sessions with all field values', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      {
        date: '2026-01-10',
        session_id: 's1',
        set_number: 1,
        actual_weight: null,
        actual_reps: null,
        actual_duration: 45,
        actual_time: null,
        actual_distance: null,
        rpe: 7,
        block_name: 'Block A',
      },
      {
        date: '2026-01-10',
        session_id: 's1',
        set_number: 2,
        actual_weight: null,
        actual_reps: null,
        actual_duration: 40,
        actual_time: null,
        actual_distance: null,
        rpe: 8,
        block_name: 'Block A',
      },
    ]);

    const result = await getGenericExerciseSetHistory('plank-1');

    expect(result).toHaveLength(1);
    expect(result[0].sets).toHaveLength(2);
    expect(result[0].sets[0].duration).toBe(45);
    expect(result[0].sets[1].duration).toBe(40);
    expect(result[0].avgRpe).toBe(7.5);
    expect(result[0].blockName).toBe('Block A');
  });

  it('returns empty array when no sessions', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);

    const result = await getGenericExerciseSetHistory('plank-1');

    expect(result).toHaveLength(0);
  });
});
