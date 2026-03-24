// __tests__/sync/syncClient.test.ts
import { syncTable, syncAll } from '../../src/sync/syncClient';

jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn(),
}));

jest.mock('../../src/sync/syncStorage', () => ({
  getLastSync: jest.fn(),
  setLastSync: jest.fn(),
}));

jest.mock('../../src/health/config', () => ({
  WHOOP_WORKER_URL: 'https://test-worker.example.com',
  WHOOP_WORKER_API_KEY: 'test-api-key',
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { getDatabase } from '../../src/db/database';
import { getLastSync, setLastSync } from '../../src/sync/syncStorage';

describe('syncClient', () => {
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      getAllAsync: jest.fn().mockResolvedValue([]),
    };
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
    (getLastSync as jest.Mock).mockResolvedValue(null);
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ synced: 1, errors: 0 }),
    });
  });

  describe('syncTable', () => {
    it('skips when no changed rows', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);
      await syncTable('sessions');
      expect(mockFetch).not.toHaveBeenCalled();
      expect(setLastSync).not.toHaveBeenCalled();
    });

    it('pushes changed rows to the Worker', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        { id: 's1', program_id: 'p1', date: '2026-03-22', is_sample: 0, updated_at: '2026-03-22T10:00:00Z' },
      ]);

      await syncTable('sessions');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1/sessions');
      expect(options.method).toBe('POST');

      const body = JSON.parse(options.body);
      expect(body.app_id).toBe('apex');
      expect(body.records).toHaveLength(1);
      expect(body.records[0]).not.toHaveProperty('is_sample');
    });

    it('updates last-sync timestamp on success', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        { id: 's1', date: '2026-03-22', updated_at: '2026-03-22T10:00:00Z', is_sample: 0 },
        { id: 's2', date: '2026-03-23', updated_at: '2026-03-23T08:00:00Z', is_sample: 0 },
      ]);

      await syncTable('sessions');

      expect(setLastSync).toHaveBeenCalledWith('sessions', '2026-03-23T08:00:00Z');
    });

    it('does NOT update timestamp on failure', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        { id: 's1', date: '2026-03-22', updated_at: '2026-03-22T10:00:00Z', is_sample: 0 },
      ]);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Database error' }),
      });

      await syncTable('sessions');

      expect(setLastSync).not.toHaveBeenCalled();
    });

    it('uses epoch as default last-sync when no timestamp stored', async () => {
      (getLastSync as jest.Mock).mockResolvedValue(null);
      mockDb.getAllAsync.mockResolvedValue([]);

      await syncTable('sessions');

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.any(String),
        ['1970-01-01T00:00:00Z'],
      );
    });
  });

  describe('syncAll', () => {
    it('syncs all tables independently', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);
      await syncAll();
      // Should have queried all 9 syncable tables
      expect(mockDb.getAllAsync).toHaveBeenCalledTimes(9);
    });

    it('continues syncing other tables when one fails', async () => {
      let callCount = 0;
      mockDb.getAllAsync.mockImplementation(() => {
        callCount++;
        if (callCount === 1) throw new Error('DB error');
        return Promise.resolve([]);
      });

      await syncAll(); // Should not throw

      // Should have attempted all 9 tables despite first failure
      expect(mockDb.getAllAsync).toHaveBeenCalledTimes(9);
    });
  });
});
