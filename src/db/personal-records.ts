import { getDatabase, generateId } from './database';
import { calculateEpley } from './metrics';
import type { InputField } from '../types/fields';

/** Parse input_fields JSON string into field types set */
function parseFieldTypes(inputFields?: string | null): Set<string> {
  if (!inputFields) return new Set(['weight', 'reps']); // default: weight+reps
  try {
    const fields = JSON.parse(inputFields) as InputField[];
    return new Set(fields.map(f => f.type));
  } catch {
    return new Set(['weight', 'reps']);
  }
}

/** Rep counts we track for rep PRs */
export const PR_REP_COUNTS = [1, 3, 5, 8, 12, 15] as const;

export interface PRRecord {
  id: string;
  exercise_id: string;
  record_type: 'e1rm' | 'rep_best' | 'best_duration' | 'best_time' | 'best_reps';
  rep_count: number | null;
  value: number;
  previous_value: number | null;
  session_id: string;
  date: string;
  exercise_name?: string;
}

export interface SessionSet {
  exercise_id: string;
  actual_weight: number;
  actual_reps: number;
  status: string;
  actual_duration?: number;
  actual_time?: number;
  actual_distance?: number;
  input_fields?: string | null;
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

  // Group sets by exercise (include all completed sets, not just weight+reps)
  const byExercise = new Map<string, SessionSet[]>();
  for (const set of sessionSets) {
    if (set.status !== 'completed' && set.status !== 'completed_below') continue;
    const existing = byExercise.get(set.exercise_id) ?? [];
    existing.push(set);
    byExercise.set(set.exercise_id, existing);
  }

  for (const [exerciseId, sets] of byExercise) {
    // Determine exercise type from input_fields
    const fieldTypes = parseFieldTypes(sets[0]?.input_fields);
    const hasWeight = fieldTypes.has('weight');
    const hasReps = fieldTypes.has('reps');
    const hasDuration = fieldTypes.has('duration');
    const hasTime = fieldTypes.has('time');

    // --- e1RM + Rep PRs (only for weight+reps exercises) ---
    if (hasWeight && hasReps) {
      const weightRepSets = sets.filter(s => s.actual_weight > 0 && s.actual_reps > 0);

      // e1RM PR
      let bestE1rm = 0;
      for (const set of weightRepSets) {
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
          newPRs.push({
            id: generateId(),
            exercise_id: exerciseId,
            record_type: 'e1rm',
            rep_count: null,
            value: bestE1rm,
            previous_value: previousBest?.value ?? null,
            session_id: sessionId,
            date,
          });
        }
      }

      // Rep PRs
      for (const repCount of PR_REP_COUNTS) {
        const matchingSets = weightRepSets.filter(s => s.actual_reps === repCount);
        if (matchingSets.length === 0) continue;

        const bestWeight = Math.max(...matchingSets.map(s => s.actual_weight));

        const previousBest = await db.getFirstAsync<{ value: number }>(
          `SELECT value FROM personal_records
           WHERE exercise_id = ? AND record_type = 'rep_best' AND rep_count = ?
           ORDER BY value DESC LIMIT 1`,
          [exerciseId, repCount]
        );

        if (!previousBest || bestWeight > previousBest.value) {
          newPRs.push({
            id: generateId(),
            exercise_id: exerciseId,
            record_type: 'rep_best',
            rep_count: repCount,
            value: bestWeight,
            previous_value: previousBest?.value ?? null,
            session_id: sessionId,
            date,
          });
        }
      }
    }

    // --- Duration PR (highest duration — e.g. planks) ---
    if (hasDuration && !hasWeight) {
      const durations = sets
        .map(s => s.actual_duration ?? 0)
        .filter(d => d > 0);
      const bestDuration = Math.max(0, ...durations);

      if (bestDuration > 0) {
        const previousBest = await db.getFirstAsync<{ value: number }>(
          `SELECT value FROM personal_records
           WHERE exercise_id = ? AND record_type = 'best_duration'
           ORDER BY value DESC LIMIT 1`,
          [exerciseId]
        );

        if (!previousBest || bestDuration > previousBest.value) {
          newPRs.push({
            id: generateId(),
            exercise_id: exerciseId,
            record_type: 'best_duration',
            rep_count: null,
            value: bestDuration,
            previous_value: previousBest?.value ?? null,
            session_id: sessionId,
            date,
          });
        }
      }
    }

    // --- Time PR (lowest time — e.g. erg, faster is better) ---
    if (hasTime && !hasWeight) {
      const times = sets
        .map(s => s.actual_time ?? 0)
        .filter(t => t > 0);
      const bestTime = Math.min(...times);

      if (times.length > 0 && isFinite(bestTime)) {
        const previousBest = await db.getFirstAsync<{ value: number }>(
          `SELECT value FROM personal_records
           WHERE exercise_id = ? AND record_type = 'best_time'
           ORDER BY value ASC LIMIT 1`,
          [exerciseId]
        );

        if (!previousBest || bestTime < previousBest.value) {
          newPRs.push({
            id: generateId(),
            exercise_id: exerciseId,
            record_type: 'best_time',
            rep_count: null,
            value: bestTime,
            previous_value: previousBest?.value ?? null,
            session_id: sessionId,
            date,
          });
        }
      }
    }

    // --- Reps PR (highest reps — bodyweight exercises without weight) ---
    if (hasReps && !hasWeight) {
      const reps = sets
        .map(s => s.actual_reps ?? 0)
        .filter(r => r > 0);
      const bestReps = Math.max(0, ...reps);

      if (bestReps > 0) {
        const previousBest = await db.getFirstAsync<{ value: number }>(
          `SELECT value FROM personal_records
           WHERE exercise_id = ? AND record_type = 'best_reps'
           ORDER BY value DESC LIMIT 1`,
          [exerciseId]
        );

        if (!previousBest || bestReps > previousBest.value) {
          newPRs.push({
            id: generateId(),
            exercise_id: exerciseId,
            record_type: 'best_reps',
            rep_count: null,
            value: bestReps,
            previous_value: previousBest?.value ?? null,
            session_id: sessionId,
            date,
          });
        }
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
