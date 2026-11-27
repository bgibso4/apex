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
  distance?: number;
  painLevel: number;
  notes?: string;
  includedPickups: boolean;
}): Promise<string> {
  const db = await getDatabase();
  const id = generateId();

  await db.runAsync(
    `INSERT INTO run_logs (id, session_id, date, duration_min, distance, pain_level, notes, included_pickups, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [id, params.sessionId ?? null, params.date, params.durationMin, params.distance ?? null, params.painLevel, params.notes ?? null, params.includedPickups ? 1 : 0]
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

/** Get pain trend (for chart) — returns both acute and 24h pain */
export async function getPainTrend(limit: number = 12): Promise<{
  date: string;
  painLevel: number;
  painLevel24h: number | null;
  durationMin: number;
  distance: number | null;
}[]> {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT date, pain_level as painLevel, pain_level_24h as painLevel24h,
            duration_min as durationMin, distance
     FROM run_logs ORDER BY date DESC LIMIT ?`,
    [limit]
  );
}

/** Get running stats for trends overview */
export async function getRunStats(): Promise<{
  totalRuns: number;
  totalMiles: number;
  avgPain: number;
  avgPainPrev: number;
  avgPace: number | null;
  avgPacePrev: number | null;
}> {
  const db = await getDatabase();

  const total = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM run_logs"
  );

  const miles = await db.getFirstAsync<{ total: number }>(
    "SELECT COALESCE(SUM(distance), 0) as total FROM run_logs WHERE distance IS NOT NULL"
  );

  // Recent avg pain (last 6 runs)
  const recentPain = await db.getFirstAsync<{ avg: number }>(
    "SELECT COALESCE(AVG(pain_level), 0) as avg FROM (SELECT pain_level FROM run_logs ORDER BY date DESC LIMIT 6)"
  );

  // Previous avg pain (6 runs before that)
  const prevPain = await db.getFirstAsync<{ avg: number }>(
    "SELECT COALESCE(AVG(pain_level), 0) as avg FROM (SELECT pain_level FROM run_logs ORDER BY date DESC LIMIT 6 OFFSET 6)"
  );

  // Recent avg pace (last 6 runs with distance)
  const recentPace = await db.getFirstAsync<{ avg: number | null }>(
    `SELECT AVG(duration_min / distance) as avg
     FROM (SELECT duration_min, distance FROM run_logs WHERE distance > 0 ORDER BY date DESC LIMIT 6)`
  );

  // Previous avg pace
  const prevPace = await db.getFirstAsync<{ avg: number | null }>(
    `SELECT AVG(duration_min / distance) as avg
     FROM (SELECT duration_min, distance FROM run_logs WHERE distance > 0 ORDER BY date DESC LIMIT 6 OFFSET 6)`
  );

  return {
    totalRuns: total?.count ?? 0,
    totalMiles: Math.round((miles?.total ?? 0) * 10) / 10,
    avgPain: Math.round((recentPain?.avg ?? 0) * 10) / 10,
    avgPainPrev: Math.round((prevPain?.avg ?? 0) * 10) / 10,
    avgPace: recentPace?.avg ? Math.round(recentPace.avg * 10) / 10 : null,
    avgPacePrev: prevPace?.avg ? Math.round(prevPace.avg * 10) / 10 : null,
  };
}

/** Delete a run log entry */
export async function deleteRun(runId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM run_logs WHERE id = ?', [runId]);
}

/** Update a run log entry */
export async function updateRun(runId: string, params: {
  durationMin: number;
  distance?: number;
  painLevel: number;
  notes?: string;
  includedPickups: boolean;
}): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE run_logs SET duration_min = ?, distance = ?, pain_level = ?, notes = ?, included_pickups = ?, updated_at = datetime('now') WHERE id = ?`,
    [params.durationMin, params.distance ?? null, params.painLevel, params.notes ?? null, params.includedPickups ? 1 : 0, runId]
  );
}

/** Update the 24h follow-up pain level for a run */
export async function updateRunPain24h(runId: string, painLevel: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE run_logs SET pain_level_24h = ?, updated_at = datetime('now') WHERE id = ?",
    [painLevel, runId]
  );
}

/** Get the most recent run that needs a 24h follow-up pain check.
 *  Returns a run if it was logged 18-48 hours ago and has no pain_level_24h yet. */
export async function getPendingPainFollowUp(): Promise<RunLog | null> {
  const db = await getDatabase();
  const now = new Date();
  // 18 hours ago
  const cutoffRecent = new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString().split('T')[0];
  // 48 hours ago
  const cutoffOld = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString().split('T')[0];

  return db.getFirstAsync<RunLog>(
    `SELECT * FROM run_logs
     WHERE pain_level_24h IS NULL
       AND date <= ?
       AND date >= ?
     ORDER BY date DESC LIMIT 1`,
    [cutoffRecent, cutoffOld]
  );
}
