/**
 * APEX — Program data access functions
 */

import { getDatabase, generateId } from './database';
import { getLocalDateString } from '../utils/date';
import type { Program } from '../types';
import type { ProgramDefinition } from '../types';

/** Get the currently active program (there can only be one) */
export async function getActiveProgram(): Promise<(Program & { definition: ProgramDefinition }) | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Program>(
    "SELECT * FROM programs WHERE status = 'active' LIMIT 1"
  );
  if (!row) return null;

  const definition = JSON.parse(row.definition_json) as ProgramDefinition;
  return { ...row, definition };
}

/** Get all programs (for Program Library) */
export async function getAllPrograms(): Promise<Program[]> {
  const db = await getDatabase();
  return db.getAllAsync<Program>(
    "SELECT * FROM programs ORDER BY created_date DESC"
  );
}

/** Import a new program from a JSON definition */
export async function importProgram(definition: ProgramDefinition): Promise<string> {
  const db = await getDatabase();
  const id = generateId();
  const { name, duration_weeks, created } = definition.program;

  await db.runAsync(
    `INSERT INTO programs (id, name, duration_weeks, created_date, status, definition_json)
     VALUES (?, ?, ?, ?, 'inactive', ?)`,
    [id, name, duration_weeks, created, JSON.stringify(definition)]
  );

  // Upsert exercise definitions into global library
  for (const ex of definition.program.exercise_definitions) {
    await db.runAsync(
      `INSERT OR REPLACE INTO exercises (id, name, type, muscle_groups, alternatives, input_fields)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        ex.id, ex.name, ex.type,
        JSON.stringify(ex.muscle_groups),
        JSON.stringify(ex.alternatives || []),
        ex.input_fields ? JSON.stringify(ex.input_fields) : null,
      ]
    );
  }

  return id;
}

/** Refresh an already-imported program's definition and exercise metadata.
 *  Updates definition_json and re-upserts exercise input_fields without
 *  touching activation state, sessions, or set logs. */
export async function refreshBundledProgram(definition: ProgramDefinition): Promise<boolean> {
  const db = await getDatabase();
  const { name } = definition.program;

  // Find existing program by name
  const existing = await db.getFirstAsync<{ id: string }>(
    "SELECT id FROM programs WHERE name = ?",
    [name]
  );
  if (!existing) return false;

  // Update the definition JSON
  await db.runAsync(
    "UPDATE programs SET definition_json = ? WHERE id = ?",
    [JSON.stringify(definition), existing.id]
  );

  // Re-upsert exercise definitions (updates input_fields for existing exercises)
  for (const ex of definition.program.exercise_definitions) {
    await db.runAsync(
      `INSERT OR REPLACE INTO exercises (id, name, type, muscle_groups, alternatives, input_fields)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        ex.id, ex.name, ex.type,
        JSON.stringify(ex.muscle_groups),
        JSON.stringify(ex.alternatives || []),
        ex.input_fields ? JSON.stringify(ex.input_fields) : null,
      ]
    );
  }

  return true;
}

/** Activate a program with the user's 1RM values */
export async function activateProgram(
  programId: string,
  oneRmValues: Record<string, number>
): Promise<void> {
  const db = await getDatabase();

  // Deactivate any currently active program
  await db.runAsync(
    "UPDATE programs SET status = 'completed' WHERE status = 'active'"
  );

  // Activate this one
  await db.runAsync(
    `UPDATE programs SET status = 'active', one_rm_values = ?, activated_date = ?
     WHERE id = ?`,
    [JSON.stringify(oneRmValues), getLocalDateString(), programId]
  );
}

/** Stop an active program, optionally deleting all associated data */
export async function stopProgram(
  programId: string,
  deleteData: boolean
): Promise<void> {
  const db = await getDatabase();

  if (deleteData) {
    // Cascade delete in FK dependency order — wrapped in transaction for atomicity
    await db.execAsync('BEGIN TRANSACTION');
    try {
      await db.runAsync(
        `DELETE FROM personal_records WHERE session_id IN
         (SELECT id FROM sessions WHERE program_id = ?)`,
        [programId]
      );
      await db.runAsync(
        `DELETE FROM exercise_notes WHERE session_id IN
         (SELECT id FROM sessions WHERE program_id = ?)`,
        [programId]
      );
      await db.runAsync(
        `DELETE FROM set_logs WHERE session_id IN
         (SELECT id FROM sessions WHERE program_id = ?)`,
        [programId]
      );
      // Unlink any run_logs from deleted sessions (preserve run data)
      await db.runAsync(
        `UPDATE run_logs SET session_id = NULL WHERE session_id IN
         (SELECT id FROM sessions WHERE program_id = ?)`,
        [programId]
      );
      await db.runAsync(
        `DELETE FROM session_protocols WHERE session_id IN
         (SELECT id FROM sessions WHERE program_id = ?)`,
        [programId]
      );
      await db.runAsync(
        'DELETE FROM sessions WHERE program_id = ?',
        [programId]
      );
      await db.runAsync(
        'DELETE FROM weekly_checkins WHERE program_id = ?',
        [programId]
      );
      await db.runAsync(
        "UPDATE programs SET status = 'inactive', activated_date = NULL WHERE id = ?",
        [programId]
      );
      await db.execAsync('COMMIT');
    } catch (e) {
      await db.execAsync('ROLLBACK');
      throw e;
    }
  } else {
    await db.runAsync(
      "UPDATE programs SET status = 'completed' WHERE id = ?",
      [programId]
    );
  }
}

/** Get 1RM values for the active program */
export async function getOneRmValues(programId: string): Promise<Record<string, number>> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ one_rm_values: string | null }>(
    "SELECT one_rm_values FROM programs WHERE id = ?",
    [programId]
  );
  if (!row?.one_rm_values) return {};
  return JSON.parse(row.one_rm_values);
}
