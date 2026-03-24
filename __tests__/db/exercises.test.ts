import { getAllExercises } from '../../src/db/exercises';
import { EXERCISE_LIBRARY } from '../../src/data/exercise-library';

jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn(),
}));

import { getDatabase } from '../../src/db/database';

function createMockDb(rows: any[] = []) {
  return {
    getAllAsync: jest.fn().mockResolvedValue(rows),
  };
}

describe('getAllExercises', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns exercises from DB merged with built-in library', async () => {
    (getDatabase as jest.Mock).mockResolvedValue(createMockDb());

    const all = await getAllExercises();
    // Built-in library has 116 exercises, with empty DB we get all of them
    expect(all.length).toBe(EXERCISE_LIBRARY.length);
    // Should include a known library exercise even if not in DB
    expect(all.find(e => e.id === 'pec_dec')).toBeDefined();
  });

  it('marks exercises with logged sets correctly', async () => {
    const dbRows = [
      {
        id: 'bench_press',
        name: 'Bench Press',
        type: 'main',
        muscle_groups: '["Chest"]',
        input_fields: null,
        has_logged: 1,
      },
    ];
    (getDatabase as jest.Mock).mockResolvedValue(createMockDb(dbRows));

    const all = await getAllExercises();
    const bench = all.find(e => e.id === 'bench_press');
    expect(bench).toBeDefined();
    expect(bench!.hasLoggedSets).toBe(true);

    // Library-only exercise should have hasLoggedSets = false
    const pecDec = all.find(e => e.id === 'pec_dec');
    expect(pecDec).toBeDefined();
    expect(pecDec!.hasLoggedSets).toBe(false);
  });

  it('DB exercises override library entries with same ID', async () => {
    const dbRows = [
      {
        id: 'bench_press',
        name: 'Bench Press (Custom)',
        type: 'main',
        muscle_groups: '["Chest", "Shoulders"]',
        input_fields: null,
        has_logged: 0,
      },
    ];
    (getDatabase as jest.Mock).mockResolvedValue(createMockDb(dbRows));

    const all = await getAllExercises();
    const bench = all.find(e => e.id === 'bench_press');
    expect(bench).toBeDefined();
    // DB entry should take precedence — custom name preserved
    expect(bench!.name).toBe('Bench Press (Custom)');
    expect(bench!.muscleGroups).toEqual(['Chest', 'Shoulders']);
  });

  it('includes DB-only exercises not in library', async () => {
    const dbRows = [
      {
        id: 'custom_exercise_123',
        name: 'My Custom Exercise',
        type: 'accessory',
        muscle_groups: '["Arms"]',
        input_fields: null,
        has_logged: 0,
      },
    ];
    (getDatabase as jest.Mock).mockResolvedValue(createMockDb(dbRows));

    const all = await getAllExercises();
    expect(all.length).toBe(EXERCISE_LIBRARY.length + 1);
    expect(all.find(e => e.id === 'custom_exercise_123')).toBeDefined();
  });

  it('returns exercises sorted by name', async () => {
    (getDatabase as jest.Mock).mockResolvedValue(createMockDb());

    const all = await getAllExercises();
    const names = all.map(e => e.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });
});
