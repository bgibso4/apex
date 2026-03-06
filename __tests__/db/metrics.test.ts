import { calculateEpley, calculateTargetWeight } from '../../src/db/metrics';

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
