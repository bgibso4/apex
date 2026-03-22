import { getDatabase } from './database';
import { DailyHealthData, DailyHealthRow } from '../types/health';

/**
 * Upsert a day's health data. Uses ON CONFLICT to preserve created_at on updates.
 */
export async function upsertDailyHealth(data: DailyHealthData): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO daily_health
      (date, source, recovery_score, sleep_score, hrv_rmssd, resting_hr,
       strain_score, sleep_duration_min, spo2, skin_temp_celsius,
       respiratory_rate, raw_json, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       source = excluded.source,
       recovery_score = excluded.recovery_score,
       sleep_score = excluded.sleep_score,
       hrv_rmssd = excluded.hrv_rmssd,
       resting_hr = excluded.resting_hr,
       strain_score = excluded.strain_score,
       sleep_duration_min = excluded.sleep_duration_min,
       spo2 = excluded.spo2,
       skin_temp_celsius = excluded.skin_temp_celsius,
       respiratory_rate = excluded.respiratory_rate,
       raw_json = excluded.raw_json,
       synced_at = excluded.synced_at,
       updated_at = datetime('now')`,
    [
      data.date,
      data.source,
      data.recoveryScore ?? null,
      data.sleepScore ?? null,
      data.hrvRmssd ?? null,
      data.restingHr ?? null,
      data.strainScore ?? null,
      data.sleepDurationMin ?? null,
      data.spo2 ?? null,
      data.skinTempCelsius ?? null,
      data.respiratoryRate ?? null,
      data.rawJson ?? null,
      data.syncedAt,
    ]
  );
}

function mapRow(row: any): DailyHealthRow {
  return {
    id: row.id,
    date: row.date,
    source: row.source,
    recoveryScore: row.recovery_score,
    sleepScore: row.sleep_score,
    hrvRmssd: row.hrv_rmssd,
    restingHr: row.resting_hr,
    strainScore: row.strain_score,
    sleepDurationMin: row.sleep_duration_min,
    spo2: row.spo2,
    skinTempCelsius: row.skin_temp_celsius,
    respiratoryRate: row.respiratory_rate,
    syncedAt: row.synced_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get health data for a specific date. Returns null if no data.
 */
export async function getDailyHealth(date: string): Promise<DailyHealthRow | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    `SELECT id, date, source, recovery_score, sleep_score, hrv_rmssd,
            resting_hr, strain_score, sleep_duration_min, spo2,
            skin_temp_celsius, respiratory_rate, synced_at,
            created_at, updated_at
     FROM daily_health WHERE date = ?`,
    [date]
  );
  return row ? mapRow(row) : null;
}

/**
 * Get health data for a date range (inclusive).
 */
export async function getDailyHealthRange(
  start: string,
  end: string
): Promise<DailyHealthRow[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    `SELECT id, date, source, recovery_score, sleep_score, hrv_rmssd,
            resting_hr, strain_score, sleep_duration_min, spo2,
            skin_temp_celsius, respiratory_rate, synced_at,
            created_at, updated_at
     FROM daily_health WHERE date BETWEEN ? AND ? ORDER BY date ASC`,
    [start, end]
  );
  return rows.map(mapRow);
}

/**
 * Find dates in a range that have no health data (for backfill).
 */
export async function getMissingDates(
  start: string,
  end: string
): Promise<string[]> {
  const db = await getDatabase();
  const existing = await db.getAllAsync(
    `SELECT date FROM daily_health WHERE date BETWEEN ? AND ? ORDER BY date ASC`,
    [start, end]
  );
  const existingSet = new Set((existing as any[]).map((r) => r.date));

  const missing: string[] = [];
  const current = new Date(start + 'T00:00:00');
  const endDate = new Date(end + 'T00:00:00');
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    if (!existingSet.has(dateStr)) {
      missing.push(dateStr);
    }
    current.setDate(current.getDate() + 1);
  }
  return missing;
}
