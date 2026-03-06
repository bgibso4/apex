import { EXERCISE_LIBRARY, MUSCLE_GROUPS } from '../../src/data/exercise-library';

describe('Exercise Library', () => {
  it('has exercises for every muscle group', () => {
    for (const group of MUSCLE_GROUPS) {
      const exercises = EXERCISE_LIBRARY.filter(e => e.muscleGroup === group);
      expect(exercises.length).toBeGreaterThan(0);
    }
  });

  it('has unique exercise IDs', () => {
    const ids = EXERCISE_LIBRARY.map(e => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('has no empty names or IDs', () => {
    for (const ex of EXERCISE_LIBRARY) {
      expect(ex.id.length).toBeGreaterThan(0);
      expect(ex.name.length).toBeGreaterThan(0);
    }
  });

  it('only uses valid exercise types', () => {
    const validTypes = ['main', 'accessory', 'core', 'conditioning'];
    for (const ex of EXERCISE_LIBRARY) {
      expect(validTypes).toContain(ex.type);
    }
  });

  it('has at least 40 exercises', () => {
    expect(EXERCISE_LIBRARY.length).toBeGreaterThanOrEqual(40);
  });
});
