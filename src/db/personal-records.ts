import { getDatabase, generateId } from './database';
import { calculateEpley } from './metrics';

/** Rep counts we track for rep PRs */
export const PR_REP_COUNTS = [1, 3, 5, 8, 12, 15] as const;

export interface PRRecord {
  id: string;
  exercise_id: string;
  record_type: 'e1rm' | 'rep_best';
  rep_count: number | null;
  value: number;
  previous_value: number | null;
  session_id: string;
  date: string;
  exercise_name?: string;
}

interface SessionSet {
  exercise_id: string;
  actual_weight: number;
  actual_reps: number;
  status: string;
}

/**
 * Detect and save PRs for a completed session.
 * Returns the list of new PRs found.
 */
export async function detectPRs(
  sessionId: string,
  date: string,
  sessionSets: SessionSet[]
): Promise<PRRecord[]> {
  const db = await getDatabase();
  const newPRs: PRRecord[] = [];

  // Group sets by exercise
  const byExercise = new Map<string, SessionSet[]>();
  for (const set of sessionSets) {
    if (set.status !== 'completed' && set.status !== 'completed_below') continue;
    if (set.actual_weight <= 0 || set.actual_reps <= 0) continue;
    const existing = byExercise.get(set.exercise_id) ?? [];
    existing.push(set);
    byExercise.set(set.exercise_id, existing);
  }

  for (const [exerciseId, sets] of byExercise) {
    // --- e1RM PR ---
    let bestE1rm = 0;
    for (const set of sets) {
      const e1rm = calculateEpley(set.actual_weight, set.actual_reps);
      if (e1rm > bestE1rm) bestE1rm = e1rm;
    }

    if (bestE1rm > 0) {
      const previousBest = await db.getFirstAsync<{ value: number }>(
        `SELECT value FROM personal_records
         WHERE exercise_id = ? AND record_type = 'e1rm'
         ORDER BY value DESC LIMIT 1`,
        [exerciseId]
      );

      if (!previousBest || bestE1rm > previousBest.value) {
        const pr: PRRecord = {
          id: generateId(),
          exercise_id: exerciseId,
          record_type: 'e1rm',
          rep_count: null,
          value: bestE1rm,
          previous_value: previousBest?.value ?? null,
          session_id: sessionId,
          date,
        };
        newPRs.push(pr);
      }
    }

    // --- Rep PRs ---
    for (const repCount of PR_REP_COUNTS) {
      const matchingSets = sets.filter(s => s.actual_reps === repCount);
      if (matchingSets.length === 0) continue;

      const bestWeight = Math.max(...matchingSets.map(s => s.actual_weight));

      const previousBest = await db.getFirstAsync<{ value: number }>(
        `SELECT value FROM personal_records
         WHERE exercise_id = ? AND record_type = 'rep_best' AND rep_count = ?
         ORDER BY value DESC LIMIT 1`,
        [exerciseId, repCount]
      );

      if (!previousBest || bestWeight > previousBest.value) {
        const pr: PRRecord = {
          id: generateId(),
          exercise_id: exerciseId,
          record_type: 'rep_best',
          rep_count: repCount,
          value: bestWeight,
          previous_value: previousBest?.value ?? null,
          session_id: sessionId,
          date,
        };
        newPRs.push(pr);
      }
    }
  }

  // Save all new PRs
  for (const pr of newPRs) {
    await db.runAsync(
      `INSERT INTO personal_records (id, exercise_id, record_type, rep_count, value, previous_value, session_id, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [pr.id, pr.exercise_id, pr.record_type, pr.rep_count, pr.value, pr.previous_value, pr.session_id, pr.date]
    );
  }

  return newPRs;
}

/** Get all PRs for a session (with exercise names) */
export async function getPRsForSession(sessionId: string): Promise<PRRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<PRRecord>(
    `SELECT pr.*, e.name as exercise_name
     FROM personal_records pr
     LEFT JOIN exercises e ON e.id = pr.exercise_id
     WHERE pr.session_id = ?
     ORDER BY pr.record_type, pr.exercise_id`,
    [sessionId]
  );
}

/** Delete all PRs for a session (used when deleting a workout) */
export async function deletePRsForSession(sessionId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM personal_records WHERE session_id = ?', [sessionId]);
}
