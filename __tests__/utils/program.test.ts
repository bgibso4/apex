import {
  getBlockForWeek, getBlockColor, getTrainingDays,
  getTargetForWeek, getSuggestedWeight, getCurrentWeek, getTodayKey,
  DAY_ORDER, DAY_NAMES,
  getLastTrainingDay, isFinalTrainingSession,
  buildProgramCatalog, isBundledProgramImported,
} from '../../src/utils/program';
import type { Block, ExerciseSlot, Program } from '../../src/types';
import type { ProgramDefinition } from '../../src/types';

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
      monday: { name: 'Upper', locked: false, warmup: ['general'], exercises: [], conditioning_finisher: '' },
      tuesday: { type: 'rest' as const },
      wednesday: { name: 'Lower', locked: false, warmup: ['general'], exercises: [], conditioning_finisher: '' },
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
    expect(getCurrentWeek(today, 11)).toBe(1);
  });
  it('returns 2 for 8 days ago', () => {
    const d = new Date(); d.setDate(d.getDate() - 8);
    expect(getCurrentWeek(d.toISOString().split('T')[0], 11)).toBe(2);
  });
  it('clamps to minimum of 1', () => {
    const future = new Date(); future.setDate(future.getDate() + 7);
    expect(getCurrentWeek(future.toISOString().split('T')[0], 11)).toBe(1);
  });
  it('clamps to the program duration (no overflow past the final week)', () => {
    const old = new Date(); old.setDate(old.getDate() - 365);
    expect(getCurrentWeek(old.toISOString().split('T')[0], 11)).toBe(11);
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

// ── getLastTrainingDay / isFinalTrainingSession ──

function makeDef(durationWeeks = 11): ProgramDefinition {
  const day = (name: string) => ({ name, warmup: [], exercises: [] });
  return {
    program: {
      name: 'Test', duration_weeks: durationWeeks, created: '2026-01-01',
      blocks: [], exercise_definitions: [], warmup_protocols: {},
      weekly_template: {
        sunday: { type: 'rest' },
        monday: day('A'), tuesday: { type: 'rest' }, wednesday: day('B'),
        thursday: { type: 'rest' }, friday: day('C'),
        saturday: { type: 'rest' },
      },
    },
  } as ProgramDefinition;
}

describe('getLastTrainingDay', () => {
  it('returns the last non-rest day in week order, trimming trailing rest days', () => {
    expect(getLastTrainingDay(makeDef())).toBe('friday');
  });
});

describe('isFinalTrainingSession', () => {
  it('is true on the last training day of the final week', () => {
    expect(isFinalTrainingSession(makeDef(11), 11, 'friday')).toBe(true);
  });
  it('is true when week_number exceeds duration (legacy max-12 clamp)', () => {
    expect(isFinalTrainingSession(makeDef(11), 12, 'friday')).toBe(true);
  });
  it('is false on an earlier training day of the final week', () => {
    expect(isFinalTrainingSession(makeDef(11), 11, 'wednesday')).toBe(false);
  });
  it('is false before the final week', () => {
    expect(isFinalTrainingSession(makeDef(11), 10, 'friday')).toBe(false);
  });
});

// ── buildProgramCatalog ──

describe('buildProgramCatalog', () => {
  const row = (overrides: Partial<Program>): Program => ({
    id: 'p1',
    name: 'Functional Athlete',
    duration_weeks: 11,
    created_date: '2026-03-21',
    status: 'inactive',
    definition_json: '{}',
    ...overrides,
  });

  it('groups runs of the same program into one catalog entry (by bundled_id)', () => {
    const catalog = buildProgramCatalog([
      row({ id: 'run-1', status: 'completed', bundled_id: 'fa', created_date: '2026-03-21' }),
      row({ id: 'run-2', status: 'active', bundled_id: 'fa', created_date: '2026-07-07' }),
    ]);

    expect(catalog).toHaveLength(1);
    expect(catalog[0].program.id).toBe('run-2');
    expect(catalog[0].isActive).toBe(true);
    expect(catalog[0].action).toBeNull();
  });

  it('falls back to name as identity when bundled_id is missing', () => {
    const catalog = buildProgramCatalog([
      row({ id: 'run-1', status: 'completed' }),
      row({ id: 'run-2', status: 'completed', created_date: '2026-07-01' }),
      row({ id: 'other', name: 'Functional Athlete v2', status: 'inactive' }),
    ]);

    expect(catalog).toHaveLength(2);
    const names = catalog.map(e => e.program.name);
    expect(names).toContain('Functional Athlete');
    expect(names).toContain('Functional Athlete v2');
  });

  it('offers activate when the program has a never-run (inactive) row', () => {
    const catalog = buildProgramCatalog([
      row({ id: 'run-1', status: 'inactive', bundled_id: 'fa' }),
    ]);

    expect(catalog[0].isActive).toBe(false);
    expect(catalog[0].action).toEqual({ type: 'activate', programId: 'run-1' });
  });

  it('offers restart from the most recent run when all runs are completed', () => {
    const catalog = buildProgramCatalog([
      row({ id: 'run-old', status: 'completed', bundled_id: 'fa', created_date: '2026-01-01' }),
      row({ id: 'run-new', status: 'completed', bundled_id: 'fa', created_date: '2026-03-21' }),
    ]);

    expect(catalog).toHaveLength(1);
    expect(catalog[0].program.id).toBe('run-new');
    expect(catalog[0].isActive).toBe(false);
    expect(catalog[0].action).toEqual({ type: 'restart', programId: 'run-new' });
  });

  it('puts the active program first, then newest programs', () => {
    const catalog = buildProgramCatalog([
      row({ id: 'v2', name: 'Functional Athlete v2', status: 'completed', created_date: '2026-06-01' }),
      row({ id: 'v3', name: 'Functional Athlete v3', status: 'inactive', created_date: '2026-07-07' }),
      row({ id: 'v1', name: 'Functional Athlete', status: 'active', created_date: '2026-03-21' }),
    ]);

    expect(catalog.map(e => e.program.id)).toEqual(['v1', 'v3', 'v2']);
  });
});

// ── isBundledProgramImported ──

describe('isBundledProgramImported', () => {
  const def = {
    program: { id: 'functional-athlete-pillars', name: 'Functional Athlete — Pillars' },
  } as any;

  it('matches by bundled_id', () => {
    const programs = [{ bundled_id: 'functional-athlete-pillars', name: 'Renamed Later' }] as any[];
    expect(isBundledProgramImported(programs, def)).toBe(true);
  });

  it('falls back to name match for legacy rows without bundled_id', () => {
    const programs = [{ bundled_id: null, name: 'Functional Athlete — Pillars' }] as any[];
    expect(isBundledProgramImported(programs, def)).toBe(true);
  });

  it('returns false when neither matches', () => {
    const programs = [{ bundled_id: 'functional-athlete', name: 'Functional Athlete' }] as any[];
    expect(isBundledProgramImported(programs, def)).toBe(false);
  });
});
