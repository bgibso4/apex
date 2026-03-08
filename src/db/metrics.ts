/**
 * APEX — Derived metrics (1RM, volume, trends)
 * These are calculated on read, never stored.
 */

import { getDatabase } from './database';
import type { Estimated1RM } from '../types';

/** Epley formula: weight × (1 + reps / 30) */
export function calculateEpley(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight; // actual 1RM
  return Math.round(weight * (1 + reps / 30));
}

/** Get estimated 1RM for an exercise (best Epley from recent sessions) */
export async function getEstimated1RM(exerciseId: string): Promise<Estimated1RM | null> {
  const db = await getDatabase();

  // Get best set by e1RM in the last 12 weeks
  const rows = await db.getAllAsync<{
    actual_weight: number;
    actual_reps: number;
    date: string;
    name: string;
  }>(
    `SELECT sl.actual_weight, sl.actual_reps, s.date, e.name
     FROM set_logs sl
     JOIN sessions s ON s.id = sl.session_id
     JOIN exercises e ON e.id = sl.exercise_id
     WHERE sl.exercise_id = ?
       AND sl.status IN ('completed', 'completed_below')
       AND sl.actual_weight > 0
       AND sl.actual_reps > 0
     ORDER BY s.date DESC
     LIMIT 50`,
    [exerciseId]
  );

  if (rows.length === 0) return null;

  // Find the best e1RM
  let best: Estimated1RM | null = null;
  for (const row of rows) {
    const e1rm = calculateEpley(row.actual_weight, row.actual_reps);
    if (!best || e1rm > best.value) {
      best = {
        exercise_id: exerciseId,
        exercise_name: row.name,
        value: e1rm,
        from_weight: row.actual_weight,
        from_reps: row.actual_reps,
        date: row.date,
      };
    }
  }

  return best;
}

/** Get 1RM history for an exercise (for sparkline charts) */
export async function get1RMHistory(
  exerciseId: string,
  limit: number = 20
): Promise<{ date: string; e1rm: number }[]> {
  const db = await getDatabase();

  // Get the best set per session
  const rows = await db.getAllAsync<{
    date: string;
    actual_weight: number;
    actual_reps: number;
    session_id: string;
  }>(
    `SELECT s.date, sl.actual_weight, sl.actual_reps, sl.session_id
     FROM set_logs sl
     JOIN sessions s ON s.id = sl.session_id
     WHERE sl.exercise_id = ?
       AND sl.status IN ('completed', 'completed_below')
       AND sl.actual_weight > 0
       AND sl.actual_reps > 0
       AND s.completed_at IS NOT NULL
     ORDER BY s.date DESC
     LIMIT ?`,
    [exerciseId, limit * 5] // get extra rows to find per-session bests
  );

  // Group by session, take best e1RM per session
  const sessionBests = new Map<string, { date: string; e1rm: number }>();
  for (const row of rows) {
    const e1rm = calculateEpley(row.actual_weight, row.actual_reps);
    const existing = sessionBests.get(row.session_id);
    if (!existing || e1rm > existing.e1rm) {
      sessionBests.set(row.session_id, { date: row.date, e1rm });
    }
  }

  return Array.from(sessionBests.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-limit);
}

/** Data point for 1RM history with block context */
export interface E1RMHistoryPoint {
  date: string;
  e1rm: number;
  blockName: string;
}

/** Get 1RM history with block names, supporting date-range and program filtering */
export async function get1RMHistoryWithBlocks(
  exerciseId: string,
  options?: { startDate?: string; programId?: string; limit?: number }
): Promise<E1RMHistoryPoint[]> {
  const db = await getDatabase();
  const limit = options?.limit ?? 50;

  let sql = `SELECT s.date, sl.actual_weight, sl.actual_reps, sl.session_id, s.block_name
     FROM set_logs sl
     JOIN sessions s ON s.id = sl.session_id
     WHERE sl.exercise_id = ?
       AND sl.status IN ('completed', 'completed_below')
       AND sl.actual_weight > 0
       AND sl.actual_reps > 0
       AND s.completed_at IS NOT NULL`;

  const params: (string | number)[] = [exerciseId];

  if (options?.startDate) {
    sql += `\n       AND s.date >= ?`;
    params.push(options.startDate);
  }

  if (options?.programId) {
    sql += `\n       AND s.program_id = ?`;
    params.push(options.programId);
  }

  sql += `\n     ORDER BY s.date DESC\n     LIMIT ?`;
  params.push(limit * 5);

  const rows = await db.getAllAsync<{
    date: string;
    actual_weight: number;
    actual_reps: number;
    session_id: string;
    block_name: string;
  }>(sql, params);

  // Group by session, take best e1RM per session
  const sessionBests = new Map<string, E1RMHistoryPoint>();
  for (const row of rows) {
    const e1rm = calculateEpley(row.actual_weight, row.actual_reps);
    const existing = sessionBests.get(row.session_id);
    if (!existing || e1rm > existing.e1rm) {
      sessionBests.set(row.session_id, {
        date: row.date,
        e1rm,
        blockName: row.block_name,
      });
    }
  }

  return Array.from(sessionBests.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-limit);
}

/** Get weekly volume (total sets completed) for a program */
export async function getWeeklyVolume(
  programId: string
): Promise<{ week: number; totalSets: number; totalReps: number; totalTonnage: number }[]> {
  const db = await getDatabase();

  return db.getAllAsync(
    `SELECT
       s.week_number as week,
       COUNT(sl.id) as totalSets,
       SUM(sl.actual_reps) as totalReps,
       SUM(sl.actual_weight * sl.actual_reps) as totalTonnage
     FROM set_logs sl
     JOIN sessions s ON s.id = sl.session_id
     WHERE s.program_id = ?
       AND sl.status IN ('completed', 'completed_below')
     GROUP BY s.week_number
     ORDER BY s.week_number`,
    [programId]
  );
}

/** Calculate suggested weight for an exercise based on 1RM and target percentage */
export function calculateTargetWeight(oneRm: number, percentage: number): number {
  const raw = oneRm * (percentage / 100);
  return Math.round(raw / 5) * 5; // Round to nearest 5 lbs
}

/** Session set history with block context */
export interface SessionSetHistory {
  date: string;
  blockName: string;
  sessionE1rm: number;
  avgRpe: number | null;
  sets: { setNumber: number; weight: number; reps: number; rpe: number | null }[];
}

/** Get exercise set history with block names, supporting date-range and program filtering */
export async function getExerciseSetHistoryWithBlocks(
  exerciseId: string,
  options?: { startDate?: string; programId?: string; limit?: number }
): Promise<SessionSetHistory[]> {
  const db = await getDatabase();
  const limit = options?.limit ?? 5;

  let sql = `SELECT s.date, sl.session_id, sl.set_number, sl.actual_weight, sl.actual_reps, sl.rpe, s.block_name
     FROM set_logs sl
     JOIN sessions s ON s.id = sl.session_id
     WHERE sl.exercise_id = ?
       AND sl.status IN ('completed', 'completed_below')
       AND sl.actual_weight > 0
       AND s.completed_at IS NOT NULL`;

  const params: (string | number)[] = [exerciseId];

  if (options?.startDate) {
    sql += `\n       AND s.date >= ?`;
    params.push(options.startDate);
  }

  if (options?.programId) {
    sql += `\n       AND s.program_id = ?`;
    params.push(options.programId);
  }

  sql += `\n     ORDER BY s.date DESC, sl.set_number ASC`;

  const rows = await db.getAllAsync<{
    date: string;
    session_id: string;
    set_number: number;
    actual_weight: number;
    actual_reps: number;
    rpe: number | null;
    block_name: string;
  }>(sql, params);

  // Group by session
  const sessionMap = new Map<string, {
    date: string;
    blockName: string;
    bestE1rm: number;
    rpeValues: number[];
    sets: { setNumber: number; weight: number; reps: number; rpe: number | null }[];
  }>();

  for (const row of rows) {
    const key = row.session_id;
    if (!sessionMap.has(key)) {
      sessionMap.set(key, {
        date: row.date,
        blockName: row.block_name,
        bestE1rm: 0,
        rpeValues: [],
        sets: [],
      });
    }
    const session = sessionMap.get(key)!;

    const e1rm = calculateEpley(row.actual_weight, row.actual_reps);
    if (e1rm > session.bestE1rm) {
      session.bestE1rm = e1rm;
    }

    if (row.rpe !== null) {
      session.rpeValues.push(row.rpe);
    }

    session.sets.push({
      setNumber: row.set_number,
      weight: row.actual_weight,
      reps: row.actual_reps,
      rpe: row.rpe,
    });
  }

  const results: SessionSetHistory[] = Array.from(sessionMap.values()).map(s => ({
    date: s.date,
    blockName: s.blockName,
    sessionE1rm: s.bestE1rm,
    avgRpe: s.rpeValues.length > 0
      ? Math.round((s.rpeValues.reduce((a, b) => a + b, 0) / s.rpeValues.length) * 10) / 10
      : null,
    sets: s.sets,
  }));

  // Already sorted desc by date from SQL ORDER BY
  return results.slice(0, limit);
}

/** Count distinct sessions where an exercise was logged */
export async function getExerciseSessionCount(exerciseId: string): Promise<number> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(DISTINCT sl.session_id) as count
     FROM set_logs sl
     JOIN sessions s ON s.id = sl.session_id
     WHERE sl.exercise_id = ?
       AND sl.status IN ('completed', 'completed_below')
       AND s.completed_at IS NOT NULL`,
    [exerciseId]
  );

  return row?.count ?? 0;
}

/** Get recent set history for an exercise (for exercise detail page) */
export async function getExerciseSetHistory(
  exerciseId: string,
  limit: number = 30
): Promise<{
  date: string;
  sets: { setNumber: number; weight: number; reps: number; rpe: number | null }[];
}[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    date: string;
    session_id: string;
    set_number: number;
    actual_weight: number;
    actual_reps: number;
    rpe: number | null;
  }>(
    `SELECT s.date, sl.session_id, sl.set_number, sl.actual_weight, sl.actual_reps, sl.rpe
     FROM set_logs sl
     JOIN sessions s ON s.id = sl.session_id
     WHERE sl.exercise_id = ?
       AND sl.status IN ('completed', 'completed_below')
       AND sl.actual_weight > 0
       AND s.completed_at IS NOT NULL
     ORDER BY s.date DESC, sl.set_number ASC
     LIMIT ?`,
    [exerciseId, limit * 5]
  );

  // Group by date
  const grouped = new Map<string, { date: string; sets: { setNumber: number; weight: number; reps: number; rpe: number | null }[] }>();
  for (const row of rows) {
    const key = row.date;
    if (!grouped.has(key)) {
      grouped.set(key, { date: key, sets: [] });
    }
    grouped.get(key)!.sets.push({
      setNumber: row.set_number,
      weight: row.actual_weight,
      reps: row.actual_reps,
      rpe: row.rpe,
    });
  }

  return Array.from(grouped.values()).slice(0, limit);
}
