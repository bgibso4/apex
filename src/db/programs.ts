/**
 * APEX — Program data access functions
 */

import { getDatabase, generateId } from './database';
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
      `INSERT OR REPLACE INTO exercises (id, name, type, muscle_groups, alternatives)
       VALUES (?, ?, ?, ?, ?)`,
      [ex.id, ex.name, ex.type, JSON.stringify(ex.muscle_groups), JSON.stringify(ex.alternatives || [])]
    );
  }

  return id;
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
    [JSON.stringify(oneRmValues), new Date().toISOString().split('T')[0], programId]
  );
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
