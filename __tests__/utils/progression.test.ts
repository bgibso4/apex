import {
  getMostCommonWeight, parseRpeThreshold, evaluateProgression, resolveWorkingWeight,
} from '../../src/utils/progression';
import type { ProgressionSetInput } from '../../src/utils/progression';

const doneSets = (weight: number, reps = 10, targetReps = 10, count = 3): ProgressionSetInput[] =>
  Array.from({ length: count }, () => ({ status: 'completed' as const, weight, reps, targetReps }));

const BASE = {
  category: 'accessory' as string | undefined,
  rpe: 7,
  rpeThreshold: 7 as number | null,
  increment: 5,
  currentSets: doneSets(70),
  lastSessionSets: [] as { status: string; actual_weight?: number | null }[],
};

describe('parseRpeThreshold', () => {
  it('parses the lower bound of a range', () => expect(parseRpeThreshold('7-8')).toBe(7));
  it('parses a single value', () => expect(parseRpeThreshold('8')).toBe(8));
  it('returns null for missing/garbage', () => {
    expect(parseRpeThreshold(undefined)).toBeNull();
    expect(parseRpeThreshold(null)).toBeNull();
    expect(parseRpeThreshold('moderate')).toBeNull();
  });
});

describe('getMostCommonWeight', () => {
  it('returns the modal weight', () => {
    expect(getMostCommonWeight([
      { actual_weight: 70 }, { actual_weight: 70 }, { actual_weight: 75 },
    ])).toBe(70);
  });
  it('ignores null/zero and returns undefined when empty', () => {
    expect(getMostCommonWeight([{ actual_weight: null }, { actual_weight: 0 }])).toBeUndefined();
  });
});

describe('evaluateProgression — increase', () => {
  it('suggests +increment when all sets hit target reps and RPE ≤ threshold', () => {
    expect(evaluateProgression(BASE)).toEqual({
      kind: 'increase', currentWeight: 70, suggestedWeight: 75,
    });
  });
  it('uses the exercise increment', () => {
    expect(evaluateProgression({ ...BASE, increment: 10 })!.suggestedWeight).toBe(80);
  });
  it('does not suggest when RPE above threshold', () => {
    expect(evaluateProgression({ ...BASE, rpe: 8 })).toBeNull();
  });
  it('does not suggest for non-accessories', () => {
    expect(evaluateProgression({ ...BASE, category: 'main' })).toBeNull();
    expect(evaluateProgression({ ...BASE, category: undefined })).toBeNull();
  });
  it('is silent when the block has no RPE target (deload)', () => {
    expect(evaluateProgression({ ...BASE, rpeThreshold: null })).toBeNull();
  });
  it('does not suggest when any set missed reps', () => {
    const sets = [...doneSets(70, 10, 10, 2), { status: 'completed_below' as const, weight: 70, reps: 8, targetReps: 10 }];
    expect(evaluateProgression({ ...BASE, currentSets: sets })).toBeNull();
  });
  it('does not suggest when any set was skipped', () => {
    const sets = [...doneSets(70, 10, 10, 2), { status: 'skipped' as const, weight: 70, targetReps: 10 }];
    expect(evaluateProgression({ ...BASE, currentSets: sets })).toBeNull();
  });
  it('treats sets without a target-rep prescription as hit', () => {
    const sets: ProgressionSetInput[] = [{ status: 'completed', weight: 70, reps: 12 }];
    expect(evaluateProgression({ ...BASE, currentSets: sets })).not.toBeNull();
  });
});

describe('evaluateProgression — decrease', () => {
  const missNow = [...doneSets(70, 10, 10, 2), { status: 'completed_below' as const, weight: 70, reps: 7, targetReps: 10 }];
  const missLast = [{ status: 'completed_below', actual_weight: 70 }, { status: 'completed', actual_weight: 70 }];

  it('suggests -increment after misses in two consecutive sessions at the same weight', () => {
    expect(evaluateProgression({ ...BASE, rpe: 9, currentSets: missNow, lastSessionSets: missLast }))
      .toEqual({ kind: 'decrease', currentWeight: 70, suggestedWeight: 65 });
  });
  it('one bad session is ignored', () => {
    const cleanLast = [{ status: 'completed', actual_weight: 70 }];
    expect(evaluateProgression({ ...BASE, rpe: 9, currentSets: missNow, lastSessionSets: cleanLast })).toBeNull();
    expect(evaluateProgression({ ...BASE, rpe: 9, currentSets: missNow, lastSessionSets: [] })).toBeNull();
  });
  it('different weights between the two sessions → no suggestion', () => {
    const heavierLast = [{ status: 'completed_below', actual_weight: 75 }];
    expect(evaluateProgression({ ...BASE, rpe: 9, currentSets: missNow, lastSessionSets: heavierLast })).toBeNull();
  });
  it('skipped sets do not count as misses', () => {
    const skippedNow = [...doneSets(70, 10, 10, 2), { status: 'skipped' as const, weight: 70, targetReps: 10 }];
    expect(evaluateProgression({ ...BASE, rpe: 9, currentSets: skippedNow, lastSessionSets: missLast })).toBeNull();
  });
  it('silent during deload', () => {
    expect(evaluateProgression({ ...BASE, rpe: 9, rpeThreshold: null, currentSets: missNow, lastSessionSets: missLast })).toBeNull();
  });
  it('never suggests a non-positive weight', () => {
    const light = [{ status: 'completed_below' as const, weight: 5, reps: 5, targetReps: 10 }];
    const lightLast = [{ status: 'completed_below', actual_weight: 5 }];
    expect(evaluateProgression({ ...BASE, rpe: 9, currentSets: light, lastSessionSets: lightLast })).toBeNull();
  });
});

describe('resolveWorkingWeight', () => {
  const lastSets = [{ session_id: 'sess-X', actual_weight: 70 }, { session_id: 'sess-X', actual_weight: 70 }];

  it('%1RM weight always wins', () => {
    expect(resolveWorkingWeight({
      percentWeight: 185, adjustment: { new_weight: 75, session_id: 'sess-X' }, lastSets,
    })).toBe(185);
  });
  it('an adjustment accepted in the most recent completed session wins (not yet trained)', () => {
    expect(resolveWorkingWeight({
      percentWeight: 0, adjustment: { new_weight: 75, session_id: 'sess-X' }, lastSets,
    })).toBe(75);
  });
  it('a session completed after the adjustment supersedes it (manual edits win)', () => {
    expect(resolveWorkingWeight({
      percentWeight: 0, adjustment: { new_weight: 75, session_id: 'sess-OLD' }, lastSets,
    })).toBe(70);
  });
  it('adjustment applies when there is no history yet', () => {
    expect(resolveWorkingWeight({
      percentWeight: 0, adjustment: { new_weight: 75, session_id: 'sess-X' }, lastSets: [],
    })).toBe(75);
  });
  it('falls back: last weight → default → 0', () => {
    expect(resolveWorkingWeight({ percentWeight: 0, adjustment: null, lastSets })).toBe(70);
    expect(resolveWorkingWeight({ percentWeight: 0, adjustment: null, lastSets: [], defaultWeight: 60 })).toBe(60);
    expect(resolveWorkingWeight({ percentWeight: 0, adjustment: null, lastSets: [] })).toBe(0);
  });
});
