import { getDatabase } from '../../src/db/database';
import {
  deleteSession,
  getInProgressSession,
} from '../../src/db/sessions';

jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn(),
  generateId: jest.fn(() => 'test-id-123'),
}));

function createMockDb() {
  return {
    runAsync: jest.fn().mockResolvedValue({ changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
  };
}

describe('session operations', () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  describe('deleteSession', () => {
    it('deletes session and cascaded data', async () => {
      await deleteSession('session-1');
      // Should delete set_logs, exercise_notes, personal_records, then the session
      expect(mockDb.runAsync).toHaveBeenCalledTimes(4);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM sessions'),
        ['session-1']
      );
    });
  });

  describe('getInProgressSession', () => {
    it('returns session with started_at but no completed_at', async () => {
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'session-1',
        program_id: 'prog-1',
        started_at: '2026-03-07T06:00:00Z',
        completed_at: null,
      });
      const result = await getInProgressSession('prog-1');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('session-1');
    });

    it('returns null when no in-progress session exists', async () => {
      const result = await getInProgressSession('prog-1');
      expect(result).toBeNull();
    });
  });
});
