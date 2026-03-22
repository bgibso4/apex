import { WhoopProvider } from '../../../src/health/providers/whoop';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('WhoopProvider', () => {
  let provider: WhoopProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new WhoopProvider('https://test-worker.example.com');
  });

  describe('isConnected', () => {
    it('returns false when no tokens stored', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
      expect(await provider.isConnected()).toBe(false);
    });

    it('returns true when access token exists', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('some-token');
      expect(await provider.isConnected()).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('clears all stored tokens', async () => {
      await provider.disconnect();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('whoop_access_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('whoop_refresh_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('whoop_token_expiry');
    });
  });

  describe('fetchDaily', () => {
    beforeEach(() => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        if (key === 'whoop_access_token') return 'valid-token';
        if (key === 'whoop_token_expiry') {
          return String(Date.now() + 3600000);
        }
        return null;
      });
    });

    it('fetches cycle + recovery + sleep and maps to DailyHealthData', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          records: [{
            id: 123,
            start: '2026-03-22T00:00:00Z',
            end: '2026-03-22T23:59:59Z',
            score: { strain: 12.5, kilojoule: 2000, average_heart_rate: 65, max_heart_rate: 180 },
          }],
          next_token: null,
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          records: [{
            cycle_id: 123,
            score_state: 'SCORED',
            score: {
              recovery_score: 78,
              resting_heart_rate: 52,
              hrv_rmssd_milli: 45.2,
              spo2_percentage: 97.5,
              skin_temp_celsius: 33.1,
            },
          }],
          next_token: null,
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          records: [{
            id: 456,
            start: '2026-03-21T22:00:00Z',
            end: '2026-03-22T06:30:00Z',
            score_state: 'SCORED',
            score: {
              sleep_performance_percentage: 85,
              respiratory_rate: 15.2,
              total_in_bed_time_milli: 30600000,
              total_awake_time_milli: 1800000,
              total_light_sleep_time_milli: 10800000,
              total_slow_wave_sleep_time_milli: 7200000,
              total_rem_sleep_time_milli: 7200000,
              sleep_cycle_count: 5,
              disturbance_count: 2,
            },
          }],
          next_token: null,
        }),
      });

      const result = await provider.fetchDaily('2026-03-22');

      expect(result).not.toBeNull();
      expect(result!.recoveryScore).toBe(78);
      expect(result!.sleepScore).toBe(85);
      expect(result!.hrvRmssd).toBe(45.2);
      expect(result!.restingHr).toBe(52);
      expect(result!.strainScore).toBe(12.5);
      expect(result!.spo2).toBe(97.5);
      expect(result!.skinTempCelsius).toBe(33.1);
      expect(result!.respiratoryRate).toBe(15.2);
      expect(result!.source).toBe('whoop');
    });

    it('auto-refreshes expired token before fetching', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        if (key === 'whoop_access_token') return 'expired-token';
        if (key === 'whoop_refresh_token') return 'valid-refresh';
        if (key === 'whoop_token_expiry') return String(Date.now() - 1000);
        return null;
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'new-token',
          refresh_token: 'new-refresh',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ records: [], next_token: null }),
      });

      await provider.fetchDaily('2026-03-22');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-worker.example.com/oauth/refresh',
        expect.objectContaining({ method: 'POST' })
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('whoop_access_token', 'new-token');
    });

    it('returns null when no cycle data for date', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ records: [], next_token: null }),
      });

      const result = await provider.fetchDaily('2026-03-22');
      expect(result).toBeNull();
    });
  });
});
