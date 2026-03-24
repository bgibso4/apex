/**
 * APEX — Session & set logging data access
 */

import { getDatabase, generateId } from './database';
import type { Session, SetLog, SessionProtocol } from '../types';
import type { InputField } from '../types/fields';
import { syncAll } from '../sync/syncClient';

/** Create a new session (when user starts a workout) */
export async function createSession(params: {
  programId: string;
  name?: string;
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
     (id, program_id, name, week_number, block_name, day_template_id,
      scheduled_day, actual_day, date, started_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      id, params.programId, params.name ?? null, params.weekNumber, params.blockName,
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
    "UPDATE sessions SET sleep = ?, soreness = ?, energy = ?, updated_at = datetime('now') WHERE id = ?",
    [sleep, soreness, energy, sessionId]
  );
}

/** Insert protocol items for a session */
export async function insertSessionProtocols(
  sessionId: string,
  protocols: { type: string; protocolKey: string | null; protocolName: string }[]
): Promise<void> {
  const db = await getDatabase();
  for (let i = 0; i < protocols.length; i++) {
    const p = protocols[i];
    await db.runAsync(
      `INSERT INTO session_protocols (session_id, type, protocol_key, protocol_name, sort_order, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [sessionId, p.type, p.protocolKey, p.protocolName, i]
    );
  }
}

/** Get all protocol items for a session */
export async function getSessionProtocols(sessionId: string): Promise<SessionProtocol[]> {
  const db = await getDatabase();
  return db.getAllAsync<SessionProtocol>(
    'SELECT * FROM session_protocols WHERE session_id = ? ORDER BY sort_order',
    [sessionId]
  );
}

/** Toggle completion of a single protocol item */
export async function updateProtocolCompletion(
  protocolId: number,
  completed: boolean
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE session_protocols SET completed = ?, updated_at = datetime('now') WHERE id = ?",
    [completed ? 1 : 0, protocolId]
  );
}

/** Log a single set */
export async function logSet(params: {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  targetWeight?: number;
  targetReps?: number;
  actualWeight?: number;
  actualReps?: number;
  targetDistance?: number;
  actualDistance?: number;
  targetDuration?: number;
  actualDuration?: number;
  targetTime?: number;
  actualTime?: number;
  rpe?: number;
  status: SetLog['status'];
  isAdhoc?: boolean;
}): Promise<string> {
  const db = await getDatabase();
  const id = generateId();

  await db.runAsync(
    `INSERT INTO set_logs
     (id, session_id, exercise_id, set_number, target_weight, target_reps,
      actual_weight, actual_reps, target_distance, actual_distance,
      target_duration, actual_duration, target_time, actual_time,
      rpe, status, timestamp, is_adhoc, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      id, params.sessionId, params.exerciseId, params.setNumber,
      params.targetWeight ?? null, params.targetReps ?? null,
      params.actualWeight ?? params.targetWeight ?? null,
      params.actualReps ?? params.targetReps ?? null,
      params.targetDistance ?? null,
      params.actualDistance ?? params.targetDistance ?? null,
      params.targetDuration ?? null,
      params.actualDuration ?? params.targetDuration ?? null,
      params.targetTime ?? null,
      params.actualTime ?? params.targetTime ?? null,
      params.rpe ?? null,
      params.status,
      new Date().toISOString(),
      params.isAdhoc ? 1 : 0,
    ]
  );

  return id;
}

/** Update an existing set log (for overrides) */
export async function updateSet(
  setId: string,
  updates: {
    actualWeight?: number;
    actualReps?: number;
    actualDistance?: number;
    actualDuration?: number;
    actualTime?: number;
    rpe?: number;
    status?: SetLog['status'];
  }
): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: (number | string | null)[] = [];

  if (updates.actualWeight !== undefined) { fields.push('actual_weight = ?'); values.push(updates.actualWeight); }
  if (updates.actualReps !== undefined) { fields.push('actual_reps = ?'); values.push(updates.actualReps); }
  if (updates.actualDistance !== undefined) { fields.push('actual_distance = ?'); values.push(updates.actualDistance); }
  if (updates.actualDuration !== undefined) { fields.push('actual_duration = ?'); values.push(updates.actualDuration); }
  if (updates.actualTime !== undefined) { fields.push('actual_time = ?'); values.push(updates.actualTime); }
  if (updates.rpe !== undefined) { fields.push('rpe = ?'); values.push(updates.rpe); }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
  fields.push("updated_at = datetime('now')");

  if (fields.length === 1) return; // only updated_at — no real changes
  values.push(setId);

  await db.runAsync(
    `UPDATE set_logs SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

/** Delete a set log (for uncompleting a set) */
export async function deleteSet(setId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM set_logs WHERE id = ?', [setId]);
}

/** Complete a session */
export async function completeSession(sessionId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE sessions SET completed_at = ?, updated_at = datetime('now') WHERE id = ?",
    [new Date().toISOString(), sessionId]
  );

  // Trigger background sync after completing a session
  syncAll().catch((err) => {
    console.warn('[sync] Post-session sync failed:', err);
  });
}

/** Update session notes */
export async function updateSessionNotes(sessionId: string, notes: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("UPDATE sessions SET notes = ?, updated_at = datetime('now') WHERE id = ?", [notes, sessionId]);
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

/** Get all sessions for a program within a date range (inclusive) */
export async function getSessionsForDateRange(
  programId: string,
  startDate: string,
  endDate: string
): Promise<Session[]> {
  const db = await getDatabase();
  return db.getAllAsync<Session>(
    "SELECT * FROM sessions WHERE program_id = ? AND date >= ? AND date <= ? ORDER BY date",
    [programId, startDate, endDate]
  );
}

/** Get all completed sessions across all programs within a date range */
export async function getAllSessionsForDateRange(
  startDate: string,
  endDate: string
): Promise<Session[]> {
  const db = await getDatabase();
  return db.getAllAsync<Session>(
    "SELECT * FROM sessions WHERE date >= ? AND date <= ? AND completed_at IS NOT NULL ORDER BY date",
    [startDate, endDate]
  );
}

/** Get set logs for a session */
export async function getSetLogsForSession(sessionId: string): Promise<SetLog[]> {
  const db = await getDatabase();
  return db.getAllAsync<SetLog>(
    "SELECT * FROM set_logs WHERE session_id = ? ORDER BY rowid, set_number",
    [sessionId]
  );
}

/** Get a single session by ID */
export async function getSessionById(sessionId: string): Promise<Session | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Session>(
    "SELECT * FROM sessions WHERE id = ?",
    [sessionId]
  );
}

/** Get completed session for a specific program, week, and day */
export async function getCompletedSessionForDay(
  programId: string,
  weekNumber: number,
  scheduledDay: string
): Promise<Session | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Session>(
    `SELECT * FROM sessions
     WHERE program_id = ? AND week_number = ? AND scheduled_day = ?
     AND completed_at IS NOT NULL
     ORDER BY date DESC LIMIT 1`,
    [programId, weekNumber, scheduledDay]
  );
}

/** Get exercise names for a list of exercise IDs */
export async function getExerciseNames(
  exerciseIds: string[]
): Promise<Record<string, string>> {
  if (exerciseIds.length === 0) return {};
  const db = await getDatabase();
  const placeholders = exerciseIds.map(() => '?').join(',');
  const rows = await db.getAllAsync<{ id: string; name: string }>(
    `SELECT id, name FROM exercises WHERE id IN (${placeholders})`,
    exerciseIds
  );
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.id] = row.name;
  }
  return map;
}

/** Get exercise names and input_fields for a list of exercise IDs */
export async function getExerciseInfo(
  exerciseIds: string[]
): Promise<Record<string, { name: string; inputFields: string | null }>> {
  if (exerciseIds.length === 0) return {};
  const db = await getDatabase();
  const placeholders = exerciseIds.map(() => '?').join(',');
  const rows = await db.getAllAsync<{ id: string; name: string; input_fields: string | null }>(
    `SELECT id, name, input_fields FROM exercises WHERE id IN (${placeholders})`,
    exerciseIds
  );
  const result: Record<string, { name: string; inputFields: string | null }> = {};
  for (const row of rows) {
    result[row.id] = { name: row.name, inputFields: row.input_fields };
  }
  return result;
}

/** Ensure an exercise exists in the exercises table (for ad-hoc additions) */
export async function ensureExerciseExists(exercise: {
  id: string;
  name: string;
  type: string;
  muscleGroups?: string[];
  alternatives?: string[];
  inputFields?: InputField[];
}): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO exercises (id, name, type, muscle_groups, alternatives, input_fields, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      exercise.id, exercise.name, exercise.type,
      JSON.stringify(exercise.muscleGroups ?? []),
      JSON.stringify(exercise.alternatives ?? []),
      exercise.inputFields ? JSON.stringify(exercise.inputFields) : null,
    ]
  );
}

/** Delete a session and all related data */
export async function deleteSession(sessionId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM session_protocols WHERE session_id = ?', [sessionId]);
  await db.runAsync('DELETE FROM set_logs WHERE session_id = ?', [sessionId]);
  await db.runAsync('DELETE FROM exercise_notes WHERE session_id = ?', [sessionId]);
  await db.runAsync('DELETE FROM personal_records WHERE session_id = ?', [sessionId]);
  await db.runAsync('DELETE FROM sessions WHERE id = ?', [sessionId]);
}

/** Get an in-progress session (started but not completed) for a program */
export async function getInProgressSession(
  programId: string
): Promise<Session | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Session>(
    `SELECT * FROM sessions
     WHERE program_id = ? AND started_at IS NOT NULL AND completed_at IS NULL
     ORDER BY started_at DESC LIMIT 1`,
    [programId]
  );
}

/** Get recent completed sessions across all programs */
export async function getRecentCompletedSessions(limit: number = 10): Promise<Session[]> {
  const db = await getDatabase();
  return db.getAllAsync<Session>(
    `SELECT * FROM sessions WHERE completed_at IS NOT NULL
     ORDER BY date DESC LIMIT ?`,
    [limit]
  );
}

/** Get all completed sessions with program name, ordered newest first */
export async function getAllCompletedSessions(): Promise<(Session & { program_name: string })[]> {
  const db = await getDatabase();
  return db.getAllAsync<Session & { program_name: string }>(
    `SELECT s.*, p.name as program_name FROM sessions s
     JOIN programs p ON p.id = s.program_id
     WHERE s.completed_at IS NOT NULL
     ORDER BY s.date DESC`
  );
}

/** Get full session state (session + set logs + exercise notes + protocols) for restoration */
export async function getFullSessionState(sessionId: string): Promise<{
  session: Session;
  setLogs: SetLog[];
  exerciseNotes: Record<string, string>;
  protocols: SessionProtocol[];
} | null> {
  const db = await getDatabase();
  const session = await db.getFirstAsync<Session>(
    "SELECT * FROM sessions WHERE id = ?",
    [sessionId]
  );
  if (!session) return null;

  const setLogs = await db.getAllAsync<SetLog>(
    "SELECT * FROM set_logs WHERE session_id = ? ORDER BY rowid, set_number",
    [sessionId]
  );

  const noteRows = await db.getAllAsync<{ exercise_id: string; note: string }>(
    "SELECT exercise_id, note FROM exercise_notes WHERE session_id = ?",
    [sessionId]
  );
  const exerciseNotes: Record<string, string> = {};
  for (const row of noteRows) {
    exerciseNotes[row.exercise_id] = row.note;
  }

  const protocols = await getSessionProtocols(sessionId);

  return { session, setLogs, exerciseNotes, protocols };
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
