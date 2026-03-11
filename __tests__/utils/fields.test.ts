import {
  FIELD_PROFILES,
  getFieldsForExercise,
  getTargetColumn,
  getActualColumn,
  supportsE1RM,
  FIELD_LABELS,
  FIELD_STEPS,
  FIELD_KEYBOARD,
  InputField,
  FieldType,
} from '../../src/types/fields';
import { EXERCISE_LIBRARY } from '../../src/data/exercise-library';

describe('FIELD_PROFILES', () => {
  it('weight_reps has weight and reps fields', () => {
    expect(FIELD_PROFILES.weight_reps).toEqual([
      { type: 'weight', unit: 'lbs' },
      { type: 'reps', unit: undefined },
    ]);
  });

  it('reps_only has only reps field', () => {
    expect(FIELD_PROFILES.reps_only).toEqual([
      { type: 'reps', unit: undefined },
    ]);
  });

  it('weight_distance has weight and distance fields', () => {
    expect(FIELD_PROFILES.weight_distance).toEqual([
      { type: 'weight', unit: 'lbs' },
      { type: 'distance', unit: 'm' },
    ]);
  });

  it('distance_time has distance and time fields', () => {
    expect(FIELD_PROFILES.distance_time).toEqual([
      { type: 'distance', unit: 'm' },
      { type: 'time', unit: 'm:ss' },
    ]);
  });

  it('duration has only duration field', () => {
    expect(FIELD_PROFILES.duration).toEqual([
      { type: 'duration', unit: 'sec' },
    ]);
  });
});

describe('getFieldsForExercise', () => {
  const DEFAULT_FIELDS = FIELD_PROFILES.weight_reps;

  it('returns default fields for null', () => {
    expect(getFieldsForExercise(null)).toEqual(DEFAULT_FIELDS);
  });

  it('returns default fields for undefined', () => {
    expect(getFieldsForExercise(undefined)).toEqual(DEFAULT_FIELDS);
  });

  it('parses a JSON string into InputField array', () => {
    const fields: InputField[] = [
      { type: 'distance', unit: 'm' },
      { type: 'time', unit: 'm:ss' },
    ];
    const json = JSON.stringify(fields);
    expect(getFieldsForExercise(json)).toEqual(fields);
  });

  it('returns array as-is when passed an InputField array', () => {
    const fields: InputField[] = [
      { type: 'weight', unit: 'lbs' },
      { type: 'reps', unit: undefined },
    ];
    expect(getFieldsForExercise(fields)).toBe(fields);
  });
});

describe('getTargetColumn', () => {
  const fieldTypes: FieldType[] = ['weight', 'reps', 'distance', 'duration', 'time'];

  it.each(fieldTypes)('maps %s to target_%s', (fieldType) => {
    expect(getTargetColumn(fieldType)).toBe(`target_${fieldType}`);
  });
});

describe('getActualColumn', () => {
  const fieldTypes: FieldType[] = ['weight', 'reps', 'distance', 'duration', 'time'];

  it.each(fieldTypes)('maps %s to actual_%s', (fieldType) => {
    expect(getActualColumn(fieldType)).toBe(`actual_${fieldType}`);
  });
});

describe('FIELD_LABELS', () => {
  it('has correct labels for all field types', () => {
    expect(FIELD_LABELS.weight).toBe('Weight');
    expect(FIELD_LABELS.reps).toBe('Reps');
    expect(FIELD_LABELS.distance).toBe('Distance');
    expect(FIELD_LABELS.duration).toBe('Duration');
    expect(FIELD_LABELS.time).toBe('Time');
  });
});

describe('FIELD_STEPS', () => {
  it('has correct step values', () => {
    expect(FIELD_STEPS.weight).toBe(5);
    expect(FIELD_STEPS.reps).toBe(1);
    expect(FIELD_STEPS.distance).toBe(5);
    expect(FIELD_STEPS.duration).toBe(5);
    expect(FIELD_STEPS.time).toBe(5);
  });
});

describe('FIELD_KEYBOARD', () => {
  it('uses decimal-pad for weight and distance', () => {
    expect(FIELD_KEYBOARD.weight).toBe('decimal-pad');
    expect(FIELD_KEYBOARD.distance).toBe('decimal-pad');
  });

  it('uses number-pad for reps, duration, and time', () => {
    expect(FIELD_KEYBOARD.reps).toBe('number-pad');
    expect(FIELD_KEYBOARD.duration).toBe('number-pad');
    expect(FIELD_KEYBOARD.time).toBe('number-pad');
  });
});

describe('supportsE1RM', () => {
  it('returns true when fields include both weight and reps', () => {
    expect(supportsE1RM(FIELD_PROFILES.weight_reps)).toBe(true);
  });

  it('returns false for reps-only', () => {
    expect(supportsE1RM(FIELD_PROFILES.reps_only)).toBe(false);
  });

  it('returns false for duration', () => {
    expect(supportsE1RM(FIELD_PROFILES.duration)).toBe(false);
  });

  it('returns false for distance_time', () => {
    expect(supportsE1RM(FIELD_PROFILES.distance_time)).toBe(false);
  });
});

// ── Exercise Library integration with InputFields ──

describe('Exercise library inputFields integration', () => {
  it('bodyweight exercises have reps-only inputFields', () => {
    const bodyweightIds = ['push_ups', 'pull_ups', 'dips', 'broad_jump'];
    for (const id of bodyweightIds) {
      const ex = EXERCISE_LIBRARY.find(e => e.id === id);
      expect(ex).toBeDefined();
      expect(ex!.inputFields).toEqual([{ type: 'reps' }]);
    }
  });

  it('weighted pull-up does NOT have inputFields (defaults to weight+reps)', () => {
    const ex = EXERCISE_LIBRARY.find(e => e.id === 'weighted_pullup');
    expect(ex).toBeDefined();
    expect(ex!.inputFields).toBeUndefined();
  });

  it('plank has duration inputFields', () => {
    const ex = EXERCISE_LIBRARY.find(e => e.id === 'plank');
    expect(ex).toBeDefined();
    expect(ex!.inputFields).toEqual([{ type: 'duration', unit: 'sec' }]);
  });

  it('core bodyweight exercises have reps-only inputFields', () => {
    const coreBodyweight = ['hanging_leg_raise', 'ab_wheel', 'russian_twist', 'dead_bug'];
    for (const id of coreBodyweight) {
      const ex = EXERCISE_LIBRARY.find(e => e.id === id);
      expect(ex).toBeDefined();
      expect(ex!.inputFields).toEqual([{ type: 'reps' }]);
    }
  });

  it('main/accessory exercises without inputFields default to weight+reps via getFieldsForExercise', () => {
    const standardExercises = ['bench_press', 'back_squat', 'barbell_row', 'overhead_press'];
    for (const id of standardExercises) {
      const ex = EXERCISE_LIBRARY.find(e => e.id === id);
      expect(ex).toBeDefined();
      expect(ex!.inputFields).toBeUndefined();
      // getFieldsForExercise returns weight+reps default for undefined
      const fields = getFieldsForExercise(ex!.inputFields);
      expect(fields).toEqual(FIELD_PROFILES.weight_reps);
    }
  });

  it('exercises with inputFields are returned as-is by getFieldsForExercise', () => {
    const ex = EXERCISE_LIBRARY.find(e => e.id === 'plank');
    expect(ex).toBeDefined();
    const fields = getFieldsForExercise(ex!.inputFields);
    expect(fields).toEqual([{ type: 'duration', unit: 'sec' }]);
  });
});
