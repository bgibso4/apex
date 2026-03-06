/**
 * APEX — Session & set logging data access
 */

import { getDatabase, generateId } from './database';
import type { Session, SetLog } from '../types';

/** Create a new session (when user starts a workout) */
export async function createSession(params: {
  programId: string;
  weekNumber: number;
  blockName: string;
  dayTemplateId: string;
  scheduledDay: string;
  actualDay: string;
  date: string;
}): Promise<string> {
  const db = await getDatabase();
  const id = generateId();

  await db.runAsync(
    `INSERT INTO sessions
     (id, program_id, week_number, block_name, day_template_id,
      scheduled_day, actual_day, date, started_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, params.programId, params.weekNumber, params.blockName,
      params.dayTemplateId, params.scheduledDay, params.actualDay,
      params.date, new Date().toISOString()
    ]
  );

  return id;
}

/** Update readiness check values */
export async function updateReadiness(
  sessionId: string,
  sleep: number,
  soreness: number,
  energy: number
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE sessions SET sleep = ?, soreness = ?, energy = ? WHERE id = ?",
    [sleep, soreness, energy, sessionId]
  );
}

/** Update warmup completion flags */
export async function updateWarmup(
  sessionId: string,
  warmups: { rope?: boolean; ankle?: boolean; hipIr?: boolean }
): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: (number | string)[] = [];

  if (warmups.rope !== undefined) { fields.push('warmup_rope = ?'); values.push(warmups.rope ? 1 : 0); }
  if (warmups.ankle !== undefined) { fields.push('warmup_ankle = ?'); values.push(warmups.ankle ? 1 : 0); }
  if (warmups.hipIr !== undefined) { fields.push('warmup_hip_ir = ?'); values.push(warmups.hipIr ? 1 : 0); }

  if (fields.length === 0) return;
  values.push(sessionId);

  await db.runAsync(
    `UPDATE sessions SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

/** Log a single set */
export async function logSet(params: {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  targetWeight: number;
  targetReps: number;
  actualWeight?: number;
  actualReps?: number;
  rpe?: number;
  status: SetLog['status'];
}): Promise<string> {
  const db = await getDatabase();
  const id = generateId();

  await db.runAsync(
    `INSERT INTO set_logs
     (id, session_id, exercise_id, set_number, target_weight, target_reps,
      actual_weight, actual_reps, rpe, status, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, params.sessionId, params.exerciseId, params.setNumber,
      params.targetWeight, params.targetReps,
      params.actualWeight ?? params.targetWeight,
      params.actualReps ?? params.targetReps,
      params.rpe ?? null,
      params.status,
      new Date().toISOString()
    ]
  );

  return id;
}

/** Update an existing set log (for overrides) */
export async function updateSet(
  setId: string,
  updates: { actualWeight?: number; actualReps?: number; rpe?: number; status?: SetLog['status'] }
): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: (number | string | null)[] = [];

  if (updates.actualWeight !== undefined) { fields.push('actual_weight = ?'); values.push(updates.actualWeight); }
  if (updates.actualReps !== undefined) { fields.push('actual_reps = ?'); values.push(updates.actualReps); }
  if (updates.rpe !== undefined) { fields.push('rpe = ?'); values.push(updates.rpe); }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }

  if (fields.length === 0) return;
  values.push(setId);

  await db.runAsync(
    `UPDATE set_logs SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

/** Complete a session */
export async function completeSession(
  sessionId: string,
  conditioningDone: boolean
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE sessions SET completed_at = ?, conditioning_done = ? WHERE id = ?",
    [new Date().toISOString(), conditioningDone ? 1 : 0, sessionId]
  );
}

/** Get all sessions for a given week */
export async function getSessionsForWeek(
  programId: string,
  weekNumber: number
): Promise<Session[]> {
  const db = await getDatabase();
  return db.getAllAsync<Session>(
    "SELECT * FROM sessions WHERE program_id = ? AND week_number = ? ORDER BY date",
    [programId, weekNumber]
  );
}

/** Get set logs for a session */
export async function getSetLogsForSession(sessionId: string): Promise<SetLog[]> {
  const db = await getDatabase();
  return db.getAllAsync<SetLog>(
    "SELECT * FROM set_logs WHERE session_id = ? ORDER BY exercise_id, set_number",
    [sessionId]
  );
}

/** Get the most recent sets for an exercise (for pre-fill) */
export async function getLastSessionForExercise(
  exerciseId: string,
  programId?: string
): Promise<SetLog[]> {
  const db = await getDatabase();

  // Find the most recent session that has logs for this exercise
  const lastSession = await db.getFirstAsync<{ session_id: string }>(
    `SELECT sl.session_id FROM set_logs sl
     JOIN sessions s ON s.id = sl.session_id
     WHERE sl.exercise_id = ?
     ${programId ? "AND s.program_id = ?" : ""}
     AND s.completed_at IS NOT NULL
     ORDER BY s.date DESC LIMIT 1`,
    programId ? [exerciseId, programId] : [exerciseId]
  );

  if (!lastSession) return [];

  return db.getAllAsync<SetLog>(
    "SELECT * FROM set_logs WHERE session_id = ? AND exercise_id = ? ORDER BY set_number",
    [lastSession.session_id, exerciseId]
  );
}
