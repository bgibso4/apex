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
