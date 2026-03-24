/**
 * APEX — Exercise resources (external links: tutorials, videos, etc.)
 */

import { getDatabase } from './database';
import * as Crypto from 'expo-crypto';

export interface ExerciseResource {
  id: string;
  exerciseId: string;
  label: string;
  url: string;
  createdAt: string;
}

/** Get all resources for an exercise */
export async function getExerciseResources(exerciseId: string): Promise<ExerciseResource[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    exercise_id: string;
    label: string;
    url: string;
    created_at: string;
  }>(
    'SELECT id, exercise_id, label, url, created_at FROM exercise_resources WHERE exercise_id = ? ORDER BY created_at ASC',
    [exerciseId]
  );
  return rows.map(row => ({
    id: row.id,
    exerciseId: row.exercise_id,
    label: row.label,
    url: row.url,
    createdAt: row.created_at,
  }));
}

/** Add a resource link to an exercise */
export async function addExerciseResource(
  exerciseId: string,
  label: string,
  url: string
): Promise<string> {
  const db = await getDatabase();
  const id = Crypto.randomUUID();
  await db.runAsync(
    `INSERT INTO exercise_resources (id, exercise_id, label, url)
     VALUES (?, ?, ?, ?)`,
    [id, exerciseId, label, url]
  );
  return id;
}

/** Delete a resource by ID */
export async function deleteExerciseResource(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM exercise_resources WHERE id = ?', [id]);
}
