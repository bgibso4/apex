import { getDatabase } from '../../src/db/database';
import {
  upsertDailyHealth,
  getDailyHealth,
  getDailyHealthRange,
  getMissingDates,
} from '../../src/db/health';
import { DailyHealthData } from '../../src/types/health';

jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn(),
  generateId: jest.fn(() => 'test-id-123'),
}));

function createMockDb() {
  return {
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
    execAsync: jest.fn().mockResolvedValue(undefined),
  };
}

const sampleHealth: DailyHealthData = {
  date: '2026-03-22',
  source: 'whoop',
  recoveryScore: 78,
  sleepScore: 85,
  hrvRmssd: 45.2,
  restingHr: 52,
  strainScore: 12.5,
  sleepDurationMin: 445,
  spo2: 97.5,
  skinTempCelsius: 33.1,
  respiratoryRate: 15.2,
  rawJson: '{"test": true}',
  syncedAt: '2026-03-22T08:00:00Z',
};

describe('health DB', () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  describe('upsertDailyHealth', () => {
    it('inserts health data with correct SQL and parameters', async () => {
      await upsertDailyHealth(sampleHealth);
      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('INSERT INTO daily_health');
      expect(params).toContain('2026-03-22');
      expect(params).toContain('whoop');
      expect(params).toContain(78);
      expect(params).toContain(45.2);
    });
  });

  describe('getDailyHealth', () => {
    it('returns null when no data exists', async () => {
      const result = await getDailyHealth('2026-03-22');
      expect(result).toBeNull();
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['2026-03-22']
      );
    });

    it('returns mapped data when row exists', async () => {
      mockDb.getFirstAsync.mockResolvedValue({
        id: 1,
        date: '2026-03-22',
        source: 'whoop',
        recovery_score: 78,
        sleep_score: 85,
        hrv_rmssd: 45.2,
        resting_hr: 52,
        strain_score: 12.5,
        sleep_duration_min: 445,
        spo2: 97.5,
        skin_temp_celsius: 33.1,
        respiratory_rate: 15.2,
        synced_at: '2026-03-22T08:00:00Z',
        created_at: '2026-03-22T08:00:00Z',
        updated_at: '2026-03-22T08:00:00Z',
      });
      const result = await getDailyHealth('2026-03-22');
      expect(result).not.toBeNull();
      expect(result!.recoveryScore).toBe(78);
      expect(result!.hrvRmssd).toBe(45.2);
    });
  });

  describe('getDailyHealthRange', () => {
    it('queries with date range', async () => {
      await getDailyHealthRange('2026-03-01', '2026-03-22');
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('BETWEEN'),
        ['2026-03-01', '2026-03-22']
      );
    });
  });

  describe('getMissingDates', () => {
    it('returns dates not in daily_health', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        { date: '2026-03-20' },
        { date: '2026-03-22' },
      ]);
      const result = await getMissingDates('2026-03-20', '2026-03-22');
      expect(result).toContain('2026-03-21');
      expect(result).not.toContain('2026-03-20');
      expect(result).not.toContain('2026-03-22');
    });
  });
});
