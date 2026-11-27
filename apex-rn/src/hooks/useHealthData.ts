import { useState, useEffect, useCallback } from 'react';
import { DailyHealthRow } from '../types/health';
import { HealthService } from '../health/healthService';
import { getWhoopProvider } from '../health/providers';

let _service: HealthService | null = null;

function getHealthService(): HealthService {
  if (!_service) {
    _service = new HealthService(getWhoopProvider());
  }
  return _service;
}

/**
 * Hook to access health data for a specific date.
 * Optionally triggers a sync on mount.
 */
export function useHealthData(date: string, syncOnMount = false) {
  const [data, setData] = useState<DailyHealthRow | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const service = getHealthService();

      if (syncOnMount) {
        await service.syncToday();
      }

      const result = await service.getForDate(date);
      setData(result);
    } catch {
      // Non-blocking — health data is supplementary
    } finally {
      setLoading(false);
    }
  }, [date, syncOnMount]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh };
}

/**
 * Trigger a background sync + backfill. Call on app open.
 */
export async function syncHealthData(): Promise<void> {
  try {
    const provider = getWhoopProvider();
    const connected = await provider.isConnected();
    if (!connected) return;

    const service = getHealthService();
    await service.syncToday();
    await service.backfill(7);
  } catch {
    // Non-blocking
  }
}

/**
 * Run initial backfill after first connection. Call once after OAuth.
 */
export async function initialHealthBackfill(): Promise<void> {
  try {
    const service = getHealthService();
    await service.backfill(30);
  } catch {
    // Non-blocking
  }
}
