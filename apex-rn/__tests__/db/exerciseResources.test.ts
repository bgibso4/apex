import { getDatabase } from '../../src/db/database';
import {
  addExerciseResource,
  getExerciseResources,
  deleteExerciseResource,
} from '../../src/db/exerciseResources';

jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn(),
}));

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-1234'),
}));

function createMockDb(getAllRows: any[] = []) {
  return {
    runAsync: jest.fn(),
    getAllAsync: jest.fn().mockResolvedValue(getAllRows),
  };
}

describe('exercise resources', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('addExerciseResource inserts a resource link', async () => {
    const mockDb = createMockDb([
      {
        id: 'test-uuid-1234',
        exercise_id: 'bench_press',
        label: 'Form Tutorial',
        url: 'https://youtube.com/watch?v=abc',
        created_at: '2026-03-24 12:00:00',
      },
    ]);
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);

    const id = await addExerciseResource(
      'bench_press',
      'Form Tutorial',
      'https://youtube.com/watch?v=abc'
    );
    expect(id).toBe('test-uuid-1234');

    // Verify INSERT was called
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO exercise_resources'),
      expect.arrayContaining(['test-uuid-1234', 'bench_press', 'Form Tutorial', 'https://youtube.com/watch?v=abc'])
    );

    const resources = await getExerciseResources('bench_press');
    expect(resources).toHaveLength(1);
    expect(resources[0].label).toBe('Form Tutorial');
    expect(resources[0].url).toBe('https://youtube.com/watch?v=abc');
  });

  it('deleteExerciseResource removes a resource', async () => {
    const mockDb = createMockDb([]);
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);

    await deleteExerciseResource('some-id');
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM exercise_resources'),
      ['some-id']
    );

    const resources = await getExerciseResources('bench_press');
    expect(resources).toHaveLength(0);
  });

  it('getExerciseResources returns empty array for exercise with no resources', async () => {
    const mockDb = createMockDb([]);
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);

    const resources = await getExerciseResources('nonexistent');
    expect(resources).toEqual([]);
  });
});
