import { getAllExercises, insertExercise } from '../../src/db/exercises';
import { EXERCISE_LIBRARY } from '../../src/data/exercise-library';

jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn(),
}));

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'abcd1234-5678-90ab-cdef-1234567890ab'),
}));

import { getDatabase } from '../../src/db/database';

function createMockDb(rows: any[] = []) {
  return {
    getAllAsync: jest.fn().mockResolvedValue(rows),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    runAsync: jest.fn().mockResolvedValue({}),
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
    expect(all.find((e: any) => e.id === 'pec_dec')).toBeDefined();
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
    const bench = all.find((e: any) => e.id === 'bench_press');
    expect(bench).toBeDefined();
    expect(bench!.hasLoggedSets).toBe(true);

    // Library-only exercise should have hasLoggedSets = false
    const pecDec = all.find((e: any) => e.id === 'pec_dec');
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
    const bench = all.find((e: any) => e.id === 'bench_press');
    expect(bench).toBeDefined();
    // DB entry should take precedence for name, but display group comes from library
    expect(bench!.name).toBe('Bench Press (Custom)');
    expect(bench!.muscleGroups).toEqual(['Chest']);
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
    expect(all.find((e: any) => e.id === 'custom_exercise_123')).toBeDefined();
  });

  it('returns exercises sorted by name', async () => {
    (getDatabase as jest.Mock).mockResolvedValue(createMockDb());

    const all = await getAllExercises();
    const names = all.map((e: any) => e.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });
});

describe('insertExercise', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inserts a new exercise into the exercises table', async () => {
    const mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);

    await insertExercise({ name: 'Cable Lateral Raise', type: 'accessory', muscleGroup: 'Shoulders' });

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO exercises'),
      ['cable_lateral_raise', 'Cable Lateral Raise', 'accessory', '["Shoulders"]', null],
    );
  });

  it('generates a snake_case ID from the name', async () => {
    const mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);

    const id = await insertExercise({ name: 'Cable Lateral Raise', type: 'accessory', muscleGroup: 'Shoulders' });
    expect(id).toBe('cable_lateral_raise');
  });

  it('appends UUID suffix when derived ID collides with existing exercise', async () => {
    const mockDb = createMockDb();
    mockDb.getFirstAsync.mockResolvedValue({ id: 'bench_press' });
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);

    const id = await insertExercise({ name: 'Bench Press!', type: 'main', muscleGroup: 'Chest' });
    expect(id).not.toBe('bench_press');
    expect(id).toMatch(/^bench_press_[a-z0-9]+$/);
  });

  it('passes inputFields as JSON when provided', async () => {
    const mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);

    const fields = [{ key: 'weight', label: 'Weight', unit: 'lbs' }, { key: 'reps', label: 'Reps' }];
    await insertExercise({ name: 'Custom Lift', type: 'accessory', muscleGroup: 'Arms', inputFields: fields as any });

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO exercises'),
      ['custom_lift', 'Custom Lift', 'accessory', '["Arms"]', JSON.stringify(fields)],
    );
  });
});
