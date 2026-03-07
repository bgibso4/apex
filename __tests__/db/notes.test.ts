import { getDatabase, generateId } from '../../src/db/database';
import {
  saveExerciseNote,
  getExerciseNotesForSession,
  deleteExerciseNote,
} from '../../src/db/notes';

jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn(),
  generateId: jest.fn(() => 'note-id-123'),
}));

function createMockDb() {
  return {
    runAsync: jest.fn().mockResolvedValue({ changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
  };
}

describe('exercise notes', () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  describe('saveExerciseNote', () => {
    it('upserts a note for a session+exercise pair', async () => {
      await saveExerciseNote('session-1', 'bench_press', 'Left shoulder tight');
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE'),
        expect.arrayContaining(['session-1', 'bench_press', 'Left shoulder tight'])
      );
    });
  });

  describe('getExerciseNotesForSession', () => {
    it('returns all notes for a session keyed by exercise_id', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        { exercise_id: 'bench_press', note: 'Shoulder tight' },
        { exercise_id: 'squat', note: 'Felt strong' },
      ]);
      const result = await getExerciseNotesForSession('session-1');
      expect(result).toEqual({
        bench_press: 'Shoulder tight',
        squat: 'Felt strong',
      });
    });

    it('returns empty object when no notes exist', async () => {
      const result = await getExerciseNotesForSession('session-1');
      expect(result).toEqual({});
    });
  });

  describe('deleteExerciseNote', () => {
    it('deletes a note by session and exercise', async () => {
      await deleteExerciseNote('session-1', 'bench_press');
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        ['session-1', 'bench_press']
      );
    });
  });
});
