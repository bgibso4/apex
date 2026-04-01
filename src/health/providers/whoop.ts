import * as SecureStore from 'expo-secure-store';
import {
  HealthProvider,
  DailyHealthData,
  WhoopCycleResponse,
  WhoopRecoveryResponse,
  WhoopSleepResponse,
  WhoopTokenResponse,
  WhoopPaginatedResponse,
} from '../../types/health';
import { WHOOP_WORKER_API_KEY } from '../config';

const WHOOP_API = 'https://api.prod.whoop.com/developer';
const STORE_KEYS = {
  accessToken: 'whoop_access_token',
  refreshToken: 'whoop_refresh_token',
  tokenExpiry: 'whoop_token_expiry',
};

export class WhoopProvider implements HealthProvider {
  id = 'whoop';
  name = 'WHOOP';

  constructor(private workerUrl: string) {}

  // --- Auth ---

  async authorize(): Promise<void> {
    // Implemented in Settings UI via expo-auth-session
    throw new Error('Use authorizeWithCode() after OAuth redirect');
  }

  /**
   * Exchange an authorization code for tokens via the CF Worker.
   */
  async authorizeWithCode(code: string, redirectUri: string): Promise<void> {
    const response = await fetch(`${this.workerUrl}/v1/auth/whoop/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': WHOOP_WORKER_API_KEY },
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    const tokens: WhoopTokenResponse = await response.json();
    await this.storeTokens(tokens);
  }

  async isConnected(): Promise<boolean> {
    const token = await SecureStore.getItemAsync(STORE_KEYS.accessToken);
    return token !== null;
  }

  async disconnect(): Promise<void> {
    await SecureStore.deleteItemAsync(STORE_KEYS.accessToken);
    await SecureStore.deleteItemAsync(STORE_KEYS.refreshToken);
    await SecureStore.deleteItemAsync(STORE_KEYS.tokenExpiry);
  }

  // --- Data ---

  async fetchDaily(date: string): Promise<DailyHealthData | null> {
    const token = await this.getValidToken();
    if (!token) return null;

    const startISO = `${date}T00:00:00.000Z`;
    const endISO = `${date}T23:59:59.999Z`;

    // Fetch today's cycle for current strain (updates throughout the day)
    const cycles = await this.apiGet<WhoopPaginatedResponse<WhoopCycleResponse>>(
      token,
      `/v2/cycle?start=${startISO}&end=${endISO}&limit=1`
    );

    const cycle = cycles.records[0] ?? null;

    // Fetch today's recovery (contains recovery score, HRV, RHR, SpO2, skin temp)
    const recoveries = await this.apiGet<WhoopPaginatedResponse<WhoopRecoveryResponse>>(
      token,
      `/v2/recovery?start=${startISO}&end=${endISO}&limit=1`
    );

    // Fetch today's sleep (contains sleep score, respiratory rate, duration)
    const sleeps = await this.apiGet<WhoopPaginatedResponse<WhoopSleepResponse>>(
      token,
      `/v2/activity/sleep?start=${startISO}&end=${endISO}&limit=1`
    );

    const recovery = recoveries.records[0]?.score ?? null;
    const sleep = sleeps.records[0]?.score ?? null;

    // If no recovery or sleep data, nothing useful to show
    if (!recovery && !sleep) return null;

    // Calculate sleep duration from actual sleep stages (excludes awake time)
    let sleepDurationMin: number | undefined;
    if (sleep) {
      const totalSleepMs =
        sleep.total_light_sleep_time_milli +
        sleep.total_slow_wave_sleep_time_milli +
        sleep.total_rem_sleep_time_milli;
      sleepDurationMin = Math.round(totalSleepMs / 60000);
    }

    const rawJson = JSON.stringify({ cycle, recovery: recoveries.records[0], sleep: sleeps.records[0] });

    return {
      date,
      source: 'whoop',
      recoveryScore: recovery?.recovery_score,
      sleepScore: sleep?.sleep_performance_percentage,
      hrvRmssd: recovery?.hrv_rmssd_milli,
      restingHr: recovery?.resting_heart_rate,
      strainScore: cycle?.score?.strain,
      sleepDurationMin: sleepDurationMin,
      spo2: recovery?.spo2_percentage,
      skinTempCelsius: recovery?.skin_temp_celsius,
      respiratoryRate: sleep?.respiratory_rate,
      rawJson,
      syncedAt: new Date().toISOString(),
    };
  }

  async fetchRange(start: string, end: string): Promise<DailyHealthData[]> {
    const results: DailyHealthData[] = [];
    const current = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');

    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const data = await this.fetchDaily(dateStr);
      if (data) results.push(data);
      current.setDate(current.getDate() + 1);
    }
    return results;
  }

  // --- Private helpers ---

  private async getValidToken(): Promise<string | null> {
    const expiry = await SecureStore.getItemAsync(STORE_KEYS.tokenExpiry);
    const accessToken = await SecureStore.getItemAsync(STORE_KEYS.accessToken);

    if (!accessToken) return null;

    // If token is expired or expiring in next 60s, refresh
    if (expiry && Number(expiry) < Date.now() + 60000) {
      const refreshed = await this.refreshToken();
      return refreshed;
    }

    return accessToken;
  }

  private async refreshToken(): Promise<string | null> {
    const refreshToken = await SecureStore.getItemAsync(STORE_KEYS.refreshToken);
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${this.workerUrl}/v1/auth/whoop/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': WHOOP_WORKER_API_KEY },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        await this.disconnect();
        return null;
      }

      const tokens: WhoopTokenResponse = await response.json();
      await this.storeTokens(tokens);
      return tokens.access_token;
    } catch {
      return null;
    }
  }

  private async storeTokens(tokens: WhoopTokenResponse): Promise<void> {
    await SecureStore.setItemAsync(STORE_KEYS.accessToken, tokens.access_token);
    await SecureStore.setItemAsync(STORE_KEYS.refreshToken, tokens.refresh_token);
    await SecureStore.setItemAsync(
      STORE_KEYS.tokenExpiry,
      String(Date.now() + tokens.expires_in * 1000)
    );
  }

  private async apiGet<T>(token: string, path: string): Promise<T> {
    const response = await fetch(`${WHOOP_API}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Whoop API error: ${response.status} on ${path}`);
    }

    return response.json();
  }
}
