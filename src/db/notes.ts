import { getDatabase, generateId } from './database';

/** Upsert a note for an exercise in a session */
export async function saveExerciseNote(
  sessionId: string,
  exerciseId: string,
  note: string
): Promise<void> {
  const db = await getDatabase();
  const id = generateId();
  await db.runAsync(
    `INSERT OR REPLACE INTO exercise_notes (id, session_id, exercise_id, note, created_at)
     VALUES (
       COALESCE((SELECT id FROM exercise_notes WHERE session_id = ? AND exercise_id = ?), ?),
       ?, ?, ?, datetime('now')
     )`,
    [sessionId, exerciseId, id, sessionId, exerciseId, note]
  );
}

/** Get all exercise notes for a session, keyed by exercise_id */
export async function getExerciseNotesForSession(
  sessionId: string
): Promise<Record<string, string>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ exercise_id: string; note: string }>(
    'SELECT exercise_id, note FROM exercise_notes WHERE session_id = ?',
    [sessionId]
  );
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.exercise_id] = row.note;
  }
  return map;
}

/** Delete a note for an exercise in a session */
export async function deleteExerciseNote(
  sessionId: string,
  exerciseId: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'DELETE FROM exercise_notes WHERE session_id = ? AND exercise_id = ?',
    [sessionId, exerciseId]
  );
}
