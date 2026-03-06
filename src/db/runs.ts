/**
 * APEX — Run log data access
 */

import { getDatabase, generateId } from './database';
import type { RunLog } from '../types';

/** Log a run */
export async function logRun(params: {
  sessionId?: string;
  date: string;
  durationMin: number;
  painLevel: number;
  notes?: string;
  includedPickups: boolean;
}): Promise<string> {
  const db = await getDatabase();
  const id = generateId();

  await db.runAsync(
    `INSERT INTO run_logs (id, session_id, date, duration_min, pain_level, notes, included_pickups)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, params.sessionId ?? null, params.date, params.durationMin, params.painLevel, params.notes ?? null, params.includedPickups ? 1 : 0]
  );

  return id;
}

/** Get all run logs, most recent first */
export async function getRunLogs(limit: number = 20): Promise<RunLog[]> {
  const db = await getDatabase();
  return db.getAllAsync<RunLog>(
    "SELECT * FROM run_logs ORDER BY date DESC LIMIT ?",
    [limit]
  );
}

/** Get pain trend (for chart) */
export async function getPainTrend(limit: number = 12): Promise<{ date: string; painLevel: number; durationMin: number }[]> {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT date, pain_level as painLevel, duration_min as durationMin
     FROM run_logs ORDER BY date DESC LIMIT ?`,
    [limit]
  );
}
