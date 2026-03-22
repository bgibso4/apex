import { HealthService } from '../../src/health/healthService';
import { HealthProvider, DailyHealthData } from '../../src/types/health';
import * as healthDb from '../../src/db/health';

jest.mock('../../src/db/health');

const mockProvider: HealthProvider = {
  id: 'test',
  name: 'Test',
  authorize: jest.fn(),
  isConnected: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn(),
  fetchDaily: jest.fn(),
  fetchRange: jest.fn(),
};

const sampleData: DailyHealthData = {
  date: '2026-03-22',
  source: 'test',
  recoveryScore: 78,
  syncedAt: '2026-03-22T08:00:00Z',
};

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new HealthService(mockProvider);
  });

  describe('syncToday', () => {
    it('fetches today data and upserts to DB', async () => {
      (mockProvider.fetchDaily as jest.Mock).mockResolvedValue(sampleData);
      await service.syncToday();
      expect(mockProvider.fetchDaily).toHaveBeenCalled();
      expect(healthDb.upsertDailyHealth).toHaveBeenCalledWith(sampleData);
    });

    it('does nothing when provider returns null', async () => {
      (mockProvider.fetchDaily as jest.Mock).mockResolvedValue(null);
      await service.syncToday();
      expect(healthDb.upsertDailyHealth).not.toHaveBeenCalled();
    });

    it('does not throw on fetch error (non-blocking)', async () => {
      (mockProvider.fetchDaily as jest.Mock).mockRejectedValue(new Error('Network'));
      await expect(service.syncToday()).resolves.not.toThrow();
    });
  });

  describe('backfill', () => {
    it('fetches missing dates and upserts each', async () => {
      (healthDb.getMissingDates as jest.Mock).mockResolvedValue(['2026-03-20', '2026-03-21']);
      (mockProvider.fetchDaily as jest.Mock).mockResolvedValue(sampleData);
      await service.backfill(30);
      expect(mockProvider.fetchDaily).toHaveBeenCalledTimes(2);
      expect(healthDb.upsertDailyHealth).toHaveBeenCalledTimes(2);
    });
  });

  describe('getForDate', () => {
    it('reads from DB', async () => {
      (healthDb.getDailyHealth as jest.Mock).mockResolvedValue(sampleData);
      const result = await service.getForDate('2026-03-22');
      expect(result).toEqual(sampleData);
      expect(healthDb.getDailyHealth).toHaveBeenCalledWith('2026-03-22');
    });
  });
});
