/**
 * Validation tests for the Pillars Hypertrophy program — the Pillars
 * hypertrophy block run as a standalone 6-week program: weeks 1-4 are
 * Pillars weeks 1-4, week 5 repeats week 3 (one step back), week 6 repeats week 4.
 */

import hypertrophyJson from '../../src/data/pillars-hypertrophy.json';
import pillarsJson from '../../src/data/functional-athlete-pillars.json';
import { BUNDLED_PROGRAMS } from '../../src/data/bundled-programs';
import { calculateTargetWeight } from '../../src/db/metrics';
import type { ProgramDefinition, DayTemplate, ExerciseSlot } from '../../src/types';

const def = (hypertrophyJson as unknown as ProgramDefinition).program;
const pillars = (pillarsJson as unknown as ProgramDefinition).program;
const TRAINING_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const ALL_WEEKS = [1, 2, 3, 4, 5, 6];
const NEW_SLOTS = ['hip_flexor_curl'];

function slotsOf(program: typeof def, day: string): ExerciseSlot[] {
  return (program.weekly_template[day] as DayTemplate).exercises;
}
function targetFor(slot: ExerciseSlot, week: number) {
  const { weeks, ...rest } = slot.targets.find(t => t.weeks.includes(week))!;
  return rest;
}

describe('pillars-hypertrophy.json', () => {
  it('has its own identity and a 6-week duration', () => {
    expect(def.id).toBe('pillars-hypertrophy');
    expect(def.name).toBe('Pillars — Hypertrophy');
    expect(def.duration_weeks).toBe(6);
  });

  it('is registered as a bundled program', () => {
    expect(BUNDLED_PROGRAMS.map(p => p.program.id)).toContain('pillars-hypertrophy');
  });

  it('every slot references a defined exercise and covers weeks 1-6 exactly once', () => {
    const definedIds = new Set(def.exercise_definitions.map(e => e.id));
    for (const day of TRAINING_DAYS) {
      for (const slot of slotsOf(def, day)) {
        expect({ day, id: slot.exercise_id, defined: definedIds.has(slot.exercise_id) })
          .toEqual({ day, id: slot.exercise_id, defined: true });
        for (const week of ALL_WEEKS) {
          const count = slot.targets.filter(t => t.weeks.includes(week)).length;
          expect({ day, id: slot.exercise_id, week, count })
            .toEqual({ day, id: slot.exercise_id, week, count: 1 });
        }
      }
    }
  });

  it('main lifts are 4x8 and land on the agreed weights from the 2026-11-08 seeds', () => {
    // Percents are per lift, tuned so each run starts where Ben chose. Seeds are the
    // max Epley e1RMs from his last 60 days as of 2026-11-08 (what activation computes).
    const plan: Record<string, { seed: number; weights: number[] }> = {
      back_squat:       { seed: 320.8, weights: [255, 260, 265, 270, 265, 270] },
      incline_bench_bb: { seed: 269.5, weights: [210, 215, 220, 225, 220, 225] },
      barbell_row:      { seed: 250.8, weights: [185, 190, 195, 200, 195, 200] },
      overhead_press:   { seed: 180.8, weights: [135, 140, 145, 145, 145, 145] },
      zercher_squat:    { seed: 274.2, weights: [210, 215, 220, 230, 220, 230] },
      romanian_deadlift:{ seed: 259.7, weights: [195, 200, 205, 210, 205, 210] },
    };
    const mains = TRAINING_DAYS.flatMap(d => slotsOf(def, d)).filter(s => s.category === 'main');
    expect(mains.map(s => s.exercise_id).sort()).toEqual(Object.keys(plan).sort());
    for (const slot of mains) {
      const { seed, weights } = plan[slot.exercise_id];
      ALL_WEEKS.forEach((week, i) => {
        const t = targetFor(slot, week);
        expect([slot.exercise_id, week, t.sets, t.reps, calculateTargetWeight(seed, t.percent as number)])
          .toEqual([slot.exercise_id, week, 4, 8, weights[i]]);
      });
    }
  });

  it('weeks 1-4 match Pillars weeks 1-4 for every carried-over slot (main-lift percents aside)', () => {
    for (const day of TRAINING_DAYS) {
      const carried = slotsOf(def, day).filter(s => !NEW_SLOTS.includes(s.exercise_id));
      const original = slotsOf(pillars, day);
      expect(carried.map(s => s.exercise_id)).toEqual(original.map(s => s.exercise_id));
      carried.forEach((slot, i) => {
        for (const week of [1, 2, 3, 4]) {
          const { percent: _a, ...mine } = targetFor(slot, week);
          const { percent: _b, ...theirs } = targetFor(original[i], week);
          expect(mine).toEqual(theirs);
        }
      });
    }
  });

  it('week 5 repeats week 3 and week 6 repeats week 4 for every slot', () => {
    for (const day of TRAINING_DAYS) {
      for (const slot of slotsOf(def, day)) {
        expect(targetFor(slot, 5)).toEqual(targetFor(slot, 3));
        expect(targetFor(slot, 6)).toEqual(targetFor(slot, 4));
      }
    }
  });

  it('adds Hip Flexor Curl on Thursday right after the hip thrust', () => {
    const ids = slotsOf(def, 'thursday').map(s => s.exercise_id);
    expect(ids[ids.indexOf('hip_thrust') + 1]).toBe('hip_flexor_curl');
    const exercise = def.exercise_definitions.find(e => e.id === 'hip_flexor_curl')!;
    expect(exercise.name).toBe('Hip Flexor Curl');
    const slot = slotsOf(def, 'thursday').find(s => s.exercise_id === 'hip_flexor_curl')!;
    expect(slot.default_weight).toBe(40);
  });

  it('has no deload block — Christmas is the deload', () => {
    expect(def.blocks.map(b => b.name)).toEqual(['Hypertrophy']);
    expect(def.blocks[0].weeks).toEqual(ALL_WEEKS);
  });
});
