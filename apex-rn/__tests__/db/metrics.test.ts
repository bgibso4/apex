import { calculateEpley, calculateTargetWeight, getSeed1RM } from '../../src/db/metrics';
import { getDatabase } from '../../src/db/database';

jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn(),
}));

function createMockDb() {
  return {
    getAllAsync: jest.fn().mockResolvedValue([]),
  };
}

describe('calculateEpley', () => {
  it('returns the weight itself for a 1-rep max', () => {
    expect(calculateEpley(315, 1)).toBe(315);
  });

  it('calculates correctly for multi-rep sets', () => {
    // 225 × (1 + 5/30) = 225 × 1.167 = 262.5 → 263 (rounded)
    expect(calculateEpley(225, 5)).toBe(263);
  });

  it('returns 0 for zero weight', () => {
    expect(calculateEpley(0, 5)).toBe(0);
  });

  it('returns 0 for zero reps', () => {
    expect(calculateEpley(225, 0)).toBe(0);
  });

  it('returns 0 for negative inputs', () => {
    expect(calculateEpley(-100, 5)).toBe(0);
    expect(calculateEpley(225, -3)).toBe(0);
  });

  it('handles high rep ranges', () => {
    // 135 × (1 + 15/30) = 135 × 1.5 = 202.5 → 203
    expect(calculateEpley(135, 15)).toBe(203);
  });

  it('handles very heavy singles', () => {
    expect(calculateEpley(500, 1)).toBe(500);
  });
});

describe('calculateTargetWeight', () => {
  it('calculates percentage of 1RM rounded to nearest 5', () => {
    // 300 × 0.70 = 210
    expect(calculateTargetWeight(300, 70)).toBe(210);
  });

  it('rounds to nearest 5 lbs', () => {
    // 315 × 0.72 = 226.8 → 225
    expect(calculateTargetWeight(315, 72)).toBe(225);
  });

  it('rounds up when closer to upper 5', () => {
    // 300 × 0.73 = 219 → 220
    expect(calculateTargetWeight(300, 73)).toBe(220);
  });

  it('handles 100%', () => {
    expect(calculateTargetWeight(300, 100)).toBe(300);
  });

  it('handles small percentages', () => {
    // 300 × 0.50 = 150
    expect(calculateTargetWeight(300, 50)).toBe(150);
  });
});

describe('getSeed1RM', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the max Epley e1RM across returned sets', async () => {
    const mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
    mockDb.getAllAsync.mockResolvedValue([
      { actual_weight: 315, actual_reps: 3 },  // Epley 347
      { actual_weight: 275, actual_reps: 8 },  // Epley 348 (the max)
      { actual_weight: 225, actual_reps: 8 },  // deload — loses to the max
    ]);

    const seed = await getSeed1RM('back_squat');

    expect(seed).toBe(348);
  });

  it('returns null when no qualifying sets exist', async () => {
    const mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
    mockDb.getAllAsync.mockResolvedValue([]);

    expect(await getSeed1RM('incline_bench_bb')).toBeNull();
  });

  it('bounds the window: last 60 days AND last 10 sessions containing the exercise, qualifying sets only', async () => {
    const mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
    mockDb.getAllAsync.mockResolvedValue([]);

    await getSeed1RM('back_squat');

    const [sql, params] = mockDb.getAllAsync.mock.calls[0];
    expect(sql).toContain("date('now', '-60 days')");
    expect(sql).toContain('LIMIT 10');
    expect(sql).toContain("status IN ('completed', 'completed_below')");
    expect(sql).toContain('actual_weight > 0');
    expect(sql).toContain('actual_reps > 0');
    expect(params).toEqual(['back_squat', 'back_squat']);
  });
});
