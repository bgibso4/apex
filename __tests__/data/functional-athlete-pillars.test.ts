/**
 * Validation tests for the Pillars program definition.
 * This is the machine-checkable half of the D14 audit.
 */

import pillarsJson from '../../src/data/functional-athlete-pillars.json';
import type { ProgramDefinition, DayTemplate, ExerciseSlot } from '../../src/types';

const def = (pillarsJson as unknown as ProgramDefinition).program;
const TRAINING_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const ALL_WEEKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

function slotsOf(day: string): ExerciseSlot[] {
  return (def.weekly_template[day] as DayTemplate).exercises;
}
function allSlots(): Array<{ day: string; slot: ExerciseSlot }> {
  return TRAINING_DAYS.flatMap(day => slotsOf(day).map(slot => ({ day, slot })));
}
function setsForWeek(slot: ExerciseSlot, week: number): number | null {
  const t = slot.targets.find(t => t.weeks.includes(week));
  return t ? t.sets : null;
}

describe('functional-athlete-pillars.json', () => {
  it('has correct identity, duration, and focus', () => {
    expect(def.id).toBe('functional-athlete-pillars');
    expect(def.name).toBe('Functional Athlete — Pillars');
    expect(def.duration_weeks).toBe(11);
    expect((def as any).focus).toEqual(['hips', 'core', 'back']);
  });

  it('has 6 training days and a Saturday rest day', () => {
    for (const day of TRAINING_DAYS) {
      expect(def.weekly_template[day]).toHaveProperty('exercises');
    }
    expect(def.weekly_template.saturday).toEqual({ type: 'rest' });
  });

  it('every exercise slot references a defined exercise', () => {
    const definedIds = new Set(def.exercise_definitions.map(e => e.id));
    for (const { day, slot } of allSlots()) {
      expect({ day, id: slot.exercise_id, defined: definedIds.has(slot.exercise_id) })
        .toEqual({ day, id: slot.exercise_id, defined: true });
    }
  });

  it('every slot covers all 11 weeks exactly once', () => {
    for (const { day, slot } of allSlots()) {
      for (const week of ALL_WEEKS) {
        const covering = slot.targets.filter(t => t.weeks.includes(week));
        expect({ day, id: slot.exercise_id, week, count: covering.length })
          .toEqual({ day, id: slot.exercise_id, week, count: 1 });
      }
    }
  });

  it('every main lift runs the full %1RM wave', () => {
    const expectedPercents: Record<number, number> = {
      1: 75, 2: 77, 3: 79, 4: 81, 5: 65, 6: 80, 7: 83, 8: 85, 9: 87, 10: 70, 11: 90,
    };
    const mains = allSlots().filter(({ slot }) => slot.category === 'main');
    // back squat, incline bench, barbell row, OHP, zercher, RDL
    expect(mains.length).toBe(6);
    for (const { slot } of mains) {
      for (const week of ALL_WEEKS) {
        const t = slot.targets.find(t => t.weeks.includes(week))!;
        expect(t.percent).toBe(expectedPercents[week]);
      }
    }
  });

  it('flat bench press and DB hang high pull are gone', () => {
    const ids = allSlots().map(({ slot }) => slot.exercise_id);
    expect(ids).not.toContain('bench_press');
    expect(ids).not.toContain('db_hang_high_pull');
    expect(ids).toContain('incline_bench_bb');
    expect(ids).toContain('snatch_grip_high_pull');
  });

  it('Sunday circuit is a quad-set on the shared wave, and Sunday has no finisher', () => {
    const sunday = def.weekly_template.sunday as DayTemplate;
    const circuit = sunday.exercises.filter(s => s.superset_group === 'sunday-circuit');
    expect(circuit.map(s => s.exercise_id).sort()).toEqual(
      ['farmers_carry', 'kb_swings_heavy', 'skierg_intervals', 'sprints'].sort()
    );
    const wave: Record<number, number> = { 1: 3, 2: 3, 3: 4, 4: 4, 5: 2, 6: 4, 7: 4, 8: 5, 9: 5, 10: 3, 11: 6 };
    for (const slot of circuit) {
      for (const week of ALL_WEEKS) {
        expect(setsForWeek(slot, week)).toBe(wave[week]);
      }
    }
    expect(sunday.conditioning_finisher).toBeUndefined();
  });

  it('carries are 60m on both days', () => {
    const carries = allSlots().filter(({ slot }) => slot.exercise_id === 'farmers_carry');
    expect(carries.map(c => c.day).sort()).toEqual(['sunday', 'wednesday']);
    for (const { slot } of carries) {
      for (const t of slot.targets) {
        expect(t.values).toEqual({ distance: 60 });
      }
    }
  });

  it('snatch-grip high pull is constant 4x4 at 155 (3x4 deloads)', () => {
    const slot = slotsOf('wednesday').find(s => s.exercise_id === 'snatch_grip_high_pull')!;
    expect(slot.default_weight).toBe(155);
    for (const week of ALL_WEEKS) {
      const t = slot.targets.find(t => t.weeks.includes(week))!;
      expect(t.reps).toBe(4);
      expect(t.sets).toBe(week === 5 || week === 10 ? 3 : 4);
    }
  });

  it('plyo push-up and lat pulldown sets match every week; reps never change', () => {
    const plyo = slotsOf('wednesday').find(s => s.exercise_id === 'plyo_pushup')!;
    const pulldown = slotsOf('wednesday').find(s => s.exercise_id === 'lat_pulldown')!;
    expect(plyo.superset_group).toBe('wednesday-plyo-lat');
    expect(pulldown.superset_group).toBe('wednesday-plyo-lat');
    for (const week of ALL_WEEKS) {
      expect(setsForWeek(plyo, week)).toBe(setsForWeek(pulldown, week));
      expect(plyo.targets.find(t => t.weeks.includes(week))!.reps).toBe(5);
      expect(pulldown.targets.find(t => t.weeks.includes(week))!.reps).toBe(8);
    }
  });

  it('key weights: hip thrust 225, trap bar 225, dips +70', () => {
    expect(slotsOf('thursday').find(s => s.exercise_id === 'hip_thrust')!.default_weight).toBe(225);
    expect(slotsOf('sunday').find(s => s.exercise_id === 'trap_bar_squat_to_box_jump')!.default_weight).toBe(225);
    expect(slotsOf('monday').find(s => s.exercise_id === 'dips')!.default_weight).toBe(70);
  });

  it('incline bench is promoted to a main with a 265 seed; dips gain a weight field', () => {
    const incline = def.exercise_definitions.find(e => e.id === 'incline_bench_bb')!;
    expect(incline.name).toBe('Incline Bench Press');
    expect(incline.type).toBe('main');
    expect(incline.uses_1rm).toBe(true);
    expect(incline.one_rm).toBe(265);
    const dips = def.exercise_definitions.find(e => e.id === 'dips')!;
    expect(dips.input_fields).toEqual([
      { type: 'weight', unit: 'lbs' },
      { type: 'reps' },
    ]);
  });

  it('every superset group has at least 2 members on its day', () => {
    for (const day of TRAINING_DAYS) {
      const groups = new Map<string, number>();
      for (const slot of slotsOf(day)) {
        if (slot.superset_group) {
          groups.set(slot.superset_group, (groups.get(slot.superset_group) ?? 0) + 1);
        }
      }
      for (const [group, count] of groups) {
        expect({ day, group, ok: count >= 2 }).toEqual({ day, group, ok: true });
      }
    }
  });

  it('every warmup key on every day exists in warmup_protocols', () => {
    for (const day of TRAINING_DAYS) {
      const tmpl = def.weekly_template[day] as DayTemplate;
      for (const key of tmpl.warmup) {
        expect({ day, key, defined: key in def.warmup_protocols })
          .toEqual({ day, key, defined: true });
      }
    }
  });

  it('Tuesday warmup is trimmed and the hip block is ordered: superset -> IR -> mobility last', () => {
    const tue = def.weekly_template.tuesday as DayTemplate;
    expect(tue.warmup).toEqual(['jump_rope', 'abbreviated_ankle']);
    const ids = tue.exercises.map(s => s.exercise_id);
    expect(ids[0]).toBe('easy_run');
    expect(ids[ids.length - 1]).toBe('hip_mobility_flow');
    expect(ids).toContain('copenhagen_plank');
    expect(ids).toContain('step_out_squat');
    expect(ids.indexOf('hip_ir_liftoff')).toBeGreaterThan(ids.indexOf('copenhagen_plank'));
  });
});
