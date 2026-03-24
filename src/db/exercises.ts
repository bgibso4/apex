/**
 * APEX — Exercise queries (merges DB + built-in library)
 */

import { getDatabase } from './database';
import { EXERCISE_LIBRARY } from '../data/exercise-library';

export interface ExerciseListItem {
  id: string;
  name: string;
  type: string;
  muscleGroups: string[];
  inputFields: string | null;
  hasLoggedSets: boolean;
}

/**
 * Get all known exercises by merging DB exercises with the in-code library.
 * DB entries take precedence over library entries with the same ID.
 */
export async function getAllExercises(): Promise<ExerciseListItem[]> {
  const db = await getDatabase();

  // Get all DB exercises with logged-set status
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    type: string;
    muscle_groups: string;
    input_fields: string | null;
    has_logged: number;
  }>(`
    SELECT e.id, e.name, e.type, e.muscle_groups, e.input_fields,
      CASE WHEN sl.exercise_id IS NOT NULL THEN 1 ELSE 0 END as has_logged
    FROM exercises e
    LEFT JOIN (SELECT DISTINCT exercise_id FROM set_logs WHERE status = 'completed') sl
      ON sl.exercise_id = e.id
  `);

  // Build map from DB rows (DB takes precedence)
  const exerciseMap = new Map<string, ExerciseListItem>();
  for (const r of rows) {
    exerciseMap.set(r.id, {
      id: r.id,
      name: r.name,
      type: r.type,
      muscleGroups: JSON.parse(r.muscle_groups || '[]'),
      inputFields: r.input_fields,
      hasLoggedSets: r.has_logged === 1,
    });
  }

  // Merge in-code library entries (only if not already in DB)
  for (const lib of EXERCISE_LIBRARY) {
    if (!exerciseMap.has(lib.id)) {
      exerciseMap.set(lib.id, {
        id: lib.id,
        name: lib.name,
        type: lib.type,
        muscleGroups: [lib.muscleGroup],
        inputFields: lib.inputFields ? JSON.stringify(lib.inputFields) : null,
        hasLoggedSets: false,
      });
    }
  }

  // Sort by name
  return Array.from(exerciseMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}
