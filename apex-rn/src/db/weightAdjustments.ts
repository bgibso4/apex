/**
 * APEX — Weight adjustment event log (RPE auto-progression, issue #45)
 * One row per ACCEPTED suggestion. Dismissals write nothing.
 */
import { getDatabase, generateId } from './database';
import type { WeightAdjustment } from '../types';

export const DEFAULT_WEIGHT_INCREMENT = 5;

export async function recordAdjustment(params: {
  exerciseId: string;
  programId: string;
  sessionId: string;
  oldWeight: number;
  newWeight: number;
  reason: 'easy' | 'misses';
}): Promise<string> {
  const db = await getDatabase();
  const id = generateId();
  await db.runAsync(
    `INSERT INTO weight_adjustments
       (id, exercise_id, program_id, session_id, old_weight, new_weight, reason)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, params.exerciseId, params.programId, params.sessionId,
     params.oldWeight, params.newWeight, params.reason]
  );
  return id;
}

export async function getLatestAdjustment(exerciseId: string): Promise<WeightAdjustment | null> {
  const db = await getDatabase();
  return await db.getFirstAsync<WeightAdjustment>(
    `SELECT * FROM weight_adjustments WHERE exercise_id = ?
     ORDER BY created_at DESC, id DESC LIMIT 1`,
    [exerciseId]
  );
}

export async function getAdjustmentHistory(
  exerciseId: string,
  limit?: number
): Promise<WeightAdjustment[]> {
  const db = await getDatabase();
  const sql = `SELECT * FROM weight_adjustments WHERE exercise_id = ?
     ORDER BY created_at DESC, id DESC${limit != null ? ' LIMIT ?' : ''}`;
  return db.getAllAsync<WeightAdjustment>(sql, limit != null ? [exerciseId, limit] : [exerciseId]);
}

export async function getWeightIncrement(exerciseId: string): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ weight_increment: number | null }>(
    'SELECT weight_increment FROM exercises WHERE id = ?',
    [exerciseId]
  );
  return row?.weight_increment ?? DEFAULT_WEIGHT_INCREMENT;
}

export async function setWeightIncrement(exerciseId: string, increment: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE exercises SET weight_increment = ? WHERE id = ?',
    [increment, exerciseId]
  );
}
