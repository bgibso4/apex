import { getLastSync, setLastSync } from '../../src/sync/syncStorage';

jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn(),
}));

import { getDatabase } from '../../src/db/database';

describe('syncStorage', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      getFirstAsync: jest.fn(),
      runAsync: jest.fn(),
    };
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  describe('getLastSync', () => {
    it('returns null when no timestamp stored', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);
      const result = await getLastSync('sessions');
      expect(result).toBeNull();
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        'SELECT value FROM schema_info WHERE key = ?',
        ['sync_last_sessions'],
      );
    });

    it('returns stored timestamp', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ value: '2026-03-22T10:00:00Z' });
      const result = await getLastSync('sessions');
      expect(result).toBe('2026-03-22T10:00:00Z');
    });
  });

  describe('setLastSync', () => {
    it('upserts timestamp into schema_info', async () => {
      await setLastSync('sessions', '2026-03-22T10:00:00Z');
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO schema_info'),
        ['sync_last_sessions', '2026-03-22T10:00:00Z'],
      );
    });
  });
});
