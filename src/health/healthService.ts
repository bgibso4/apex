import { HealthProvider, DailyHealthRow } from '../types/health';
import {
  upsertDailyHealth,
  getDailyHealth,
  getDailyHealthRange,
  getMissingDates,
} from '../db/health';

export class HealthService {
  constructor(private provider: HealthProvider) {}

  async syncToday(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await this.provider.fetchDaily(today);
      if (data) {
        await upsertDailyHealth(data);
      }
    } catch (e) {
      console.warn('Health sync failed (non-blocking):', e);
    }
  }

  async backfill(days: number): Promise<void> {
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);

      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];

      const missing = await getMissingDates(startStr, endStr);

      for (const date of missing) {
        try {
          const data = await this.provider.fetchDaily(date);
          if (data) {
            await upsertDailyHealth(data);
          }
        } catch (e) {
          console.warn(`Backfill failed for ${date}:`, e);
        }
      }
    } catch (e) {
      console.warn('Backfill failed (non-blocking):', e);
    }
  }

  async getForDate(date: string): Promise<DailyHealthRow | null> {
    return getDailyHealth(date);
  }

  async getTrend(days: number): Promise<DailyHealthRow[]> {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return getDailyHealthRange(
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0]
    );
  }
}
