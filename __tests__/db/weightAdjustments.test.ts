import { getDatabase, generateId } from '../../src/db/database';
import {
  recordAdjustment, getLatestAdjustment, getAdjustmentHistory,
  getWeightIncrement, setWeightIncrement, DEFAULT_WEIGHT_INCREMENT,
} from '../../src/db/weightAdjustments';

jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn(),
  generateId: jest.fn(() => 'adj-id-1'),
}));

function createMockDb() {
  return {
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
  };
}

describe('weightAdjustments', () => {
  let mockDb: ReturnType<typeof createMockDb>;
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  it('recordAdjustment inserts a row and returns the generated id', async () => {
    const id = await recordAdjustment({
      exerciseId: 'dips', programId: 'prog-1', sessionId: 'sess-1',
      oldWeight: 70, newWeight: 75, reason: 'easy',
    });
    expect(id).toBe('adj-id-1');
    const [sql, values] = mockDb.runAsync.mock.calls[0];
    expect(sql).toMatch(/INSERT INTO weight_adjustments/);
    expect(values).toEqual(['adj-id-1', 'dips', 'prog-1', 'sess-1', 70, 75, 'easy']);
  });

  it('getLatestAdjustment returns the newest row for the exercise', async () => {
    const row = {
      id: 'a', exercise_id: 'dips', program_id: 'p', session_id: 's',
      old_weight: 70, new_weight: 75, reason: 'easy', created_at: '2026-07-14',
    };
    mockDb.getFirstAsync.mockResolvedValue(row);
    const result = await getLatestAdjustment('dips');
    expect(result).toEqual(row);
    const [sql, values] = mockDb.getFirstAsync.mock.calls[0];
    expect(sql).toMatch(/ORDER BY created_at DESC, id DESC LIMIT 1/);
    expect(values).toEqual(['dips']);
  });

  it('getAdjustmentHistory passes LIMIT only when given', async () => {
    await getAdjustmentHistory('dips', 3);
    expect(mockDb.getAllAsync.mock.calls[0][0]).toMatch(/LIMIT \?/);
    expect(mockDb.getAllAsync.mock.calls[0][1]).toEqual(['dips', 3]);

    await getAdjustmentHistory('dips');
    expect(mockDb.getAllAsync.mock.calls[1][0]).not.toMatch(/LIMIT/);
    expect(mockDb.getAllAsync.mock.calls[1][1]).toEqual(['dips']);
  });

  it('getWeightIncrement falls back to the default when unset', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ weight_increment: null });
    expect(await getWeightIncrement('dips')).toBe(DEFAULT_WEIGHT_INCREMENT);
    mockDb.getFirstAsync.mockResolvedValue({ weight_increment: 10 });
    expect(await getWeightIncrement('lat_pulldown')).toBe(10);
    mockDb.getFirstAsync.mockResolvedValue(null); // unknown exercise
    expect(await getWeightIncrement('ghost')).toBe(DEFAULT_WEIGHT_INCREMENT);
  });

  it('setWeightIncrement updates the exercise row', async () => {
    await setWeightIncrement('dips', 10);
    const [sql, values] = mockDb.runAsync.mock.calls[0];
    expect(sql).toMatch(/UPDATE exercises SET weight_increment = \? WHERE id = \?/);
    expect(values).toEqual([10, 'dips']);
  });
});
