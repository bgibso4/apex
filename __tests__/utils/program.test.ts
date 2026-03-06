import {
  getBlockForWeek, getBlockColor, getTrainingDays,
  getTargetForWeek, getSuggestedWeight, getCurrentWeek, getTodayKey,
  DAY_ORDER, DAY_NAMES,
} from '../../src/utils/program';
import type { Block, ExerciseSlot } from '../../src/types';

// ── getBlockForWeek ──

describe('getBlockForWeek', () => {
  const blocks: Block[] = [
    { name: 'Hypertrophy', weeks: [1, 2, 3, 4], main_lift_scheme: {} },
    { name: 'Strength', weeks: [5, 6, 7, 8], main_lift_scheme: {} },
    { name: 'Deload', weeks: [9], main_lift_scheme: {} },
  ];

  it('returns the correct block for a given week', () => {
    expect(getBlockForWeek(blocks, 1)?.name).toBe('Hypertrophy');
    expect(getBlockForWeek(blocks, 4)?.name).toBe('Hypertrophy');
    expect(getBlockForWeek(blocks, 5)?.name).toBe('Strength');
    expect(getBlockForWeek(blocks, 9)?.name).toBe('Deload');
  });

  it('returns undefined for a week not in any block', () => {
    expect(getBlockForWeek(blocks, 10)).toBeUndefined();
    expect(getBlockForWeek(blocks, 0)).toBeUndefined();
  });

  it('handles empty blocks array', () => {
    expect(getBlockForWeek([], 1)).toBeUndefined();
  });
});

// ── getBlockColor ──

describe('getBlockColor', () => {
  it('returns indigo for hypertrophy blocks', () => {
    expect(getBlockColor({ name: 'Hypertrophy', weeks: [1], main_lift_scheme: {} })).toBe('#6366f1');
  });

  it('returns green for deload blocks', () => {
    expect(getBlockColor({ name: 'Deload', weeks: [1], main_lift_scheme: {} })).toBe('#22c55e');
  });

  it('returns amber for strength blocks', () => {
    expect(getBlockColor({ name: 'Strength', weeks: [1], main_lift_scheme: {} })).toBe('#f59e0b');
  });

  it('returns pink for realization blocks', () => {
    expect(getBlockColor({ name: 'Realization', weeks: [1], main_lift_scheme: {} })).toBe('#ec4899');
  });

  it('returns indigo as default fallback', () => {
    expect(getBlockColor({ name: 'Unknown Phase', weeks: [1], main_lift_scheme: {} })).toBe('#6366f1');
  });

  it('is case-insensitive', () => {
    expect(getBlockColor({ name: 'DELOAD', weeks: [1], main_lift_scheme: {} })).toBe('#22c55e');
    expect(getBlockColor({ name: 'Work Capacity / Hypertrophy', weeks: [1], main_lift_scheme: {} })).toBe('#6366f1');
  });
});

// ── getTrainingDays ──

describe('getTrainingDays', () => {
  it('returns only non-rest days in order', () => {
    const template = {
      monday: { name: 'Upper', locked: false, warmup: 'general', exercises: [], conditioning_finisher: '' },
      tuesday: { type: 'rest' as const },
      wednesday: { name: 'Lower', locked: false, warmup: 'general', exercises: [], conditioning_finisher: '' },
    };
    const result = getTrainingDays(template);
    expect(result).toHaveLength(2);
    expect(result[0].day).toBe('monday');
    expect(result[1].day).toBe('wednesday');
  });

  it('returns empty array for all rest days', () => {
    const template = {
      monday: { type: 'rest' as const },
      tuesday: { type: 'rest' as const },
    };
    expect(getTrainingDays(template)).toHaveLength(0);
  });
});

// ── getTargetForWeek ──

describe('getTargetForWeek', () => {
  const slot: ExerciseSlot = {
    exercise_id: 'back_squat',
    category: 'main',
    targets: [
      { weeks: [1, 2], sets: 4, reps: 8, percent: 70 },
      { weeks: [3, 4], sets: 3, reps: 5, percent: 80 },
    ],
  };

  it('returns the matching target for a week', () => {
    const target = getTargetForWeek(slot, 1);
    expect(target?.sets).toBe(4);
    expect(target?.reps).toBe(8);
    expect(target?.percent).toBe(70);
  });

  it('returns different target for different week', () => {
    const target = getTargetForWeek(slot, 3);
    expect(target?.sets).toBe(3);
    expect(target?.reps).toBe(5);
  });

  it('returns undefined for a week with no target', () => {
    expect(getTargetForWeek(slot, 10)).toBeUndefined();
  });
});

// ── getSuggestedWeight ──

describe('getSuggestedWeight', () => {
  const slot: ExerciseSlot = {
    exercise_id: 'back_squat',
    category: 'main',
    targets: [
      { weeks: [1], sets: 4, reps: 8, percent: 70 },
      { weeks: [2], sets: 4, reps: 8 }, // no percent
    ],
  };

  it('calculates from 1RM percentage when available', () => {
    const result = getSuggestedWeight(slot, 1, { back_squat: 300 });
    expect(result).toBe(210); // 300 * 0.70 = 210, rounded to nearest 5
  });

  it('falls back to last weight when no percentage', () => {
    const result = getSuggestedWeight(slot, 2, {}, 185);
    expect(result).toBe(185);
  });

  it('returns null when no target for week', () => {
    expect(getSuggestedWeight(slot, 10, {})).toBeNull();
  });

  it('returns null when no percentage and no last weight', () => {
    expect(getSuggestedWeight(slot, 2, {})).toBeNull();
  });
});

// ── getCurrentWeek ──

describe('getCurrentWeek', () => {
  it('returns 1 for today activation', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(getCurrentWeek(today)).toBe(1);
  });

  it('returns 2 for 7 days ago', () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    expect(getCurrentWeek(d.toISOString().split('T')[0])).toBe(2);
  });

  it('clamps to minimum of 1', () => {
    const future = new Date();
    future.setDate(future.getDate() + 7);
    expect(getCurrentWeek(future.toISOString().split('T')[0])).toBe(1);
  });

  it('clamps to maximum of 12', () => {
    const old = new Date();
    old.setDate(old.getDate() - 365);
    expect(getCurrentWeek(old.toISOString().split('T')[0])).toBe(12);
  });
});

// ── getTodayKey ──

describe('getTodayKey', () => {
  it('returns a valid day name', () => {
    const result = getTodayKey();
    expect(DAY_ORDER).toContain(result);
  });
});

// ── DAY_NAMES ──

describe('DAY_NAMES', () => {
  it('has all 7 days', () => {
    expect(Object.keys(DAY_NAMES)).toHaveLength(7);
  });

  it('has abbreviated names', () => {
    expect(DAY_NAMES.monday).toBe('Mon');
    expect(DAY_NAMES.saturday).toBe('Sat');
  });
});
