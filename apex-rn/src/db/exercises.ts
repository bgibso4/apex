/**
 * APEX — Exercise queries (merges DB + built-in library)
 */

import * as Crypto from 'expo-crypto';

import { getDatabase } from './database';
import { EXERCISE_LIBRARY, MUSCLE_GROUPS } from '../data/exercise-library';

/** Map granular program muscle groups (e.g., "lats", "quads") to display groups */
const MUSCLE_GROUP_MAP: Record<string, typeof MUSCLE_GROUPS[number]> = {
  chest: 'Chest', upper_chest: 'Chest',
  lats: 'Back', upper_back: 'Back', lower_back: 'Back', traps: 'Back',
  shoulders: 'Shoulders', lateral_delts: 'Shoulders', rear_delts: 'Shoulders',
  quads: 'Quads',
  hamstrings: 'Hamstrings & Glutes', glutes: 'Hamstrings & Glutes', adductors: 'Hamstrings & Glutes', abductors: 'Hamstrings & Glutes',
  calves: 'Calves', ankles: 'Calves',
  biceps: 'Arms', triceps: 'Arms', grip: 'Arms',
  core: 'Abs',
  cardio: 'Conditioning', full_body: 'Conditioning', legs: 'Conditioning',
  hips: 'Movement', coordination: 'Movement',
};

function resolveDisplayGroup(rawGroups: string[]): string {
  // If already a display group (title-case, in MUSCLE_GROUPS), use it directly
  const asConst = MUSCLE_GROUPS as readonly string[];
  for (const g of rawGroups) {
    if (asConst.includes(g)) return g;
  }
  // Otherwise, map the first recognized granular group
  for (const g of rawGroups) {
    const mapped = MUSCLE_GROUP_MAP[g.toLowerCase()];
    if (mapped) return mapped;
  }
  return 'Conditioning'; // fallback
}
import type { InputField } from '../types/fields';

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

  // Build library lookup for display group resolution
  const libraryMap = new Map(EXERCISE_LIBRARY.map(e => [e.id, e]));

  // Build map from DB rows
  const exerciseMap = new Map<string, ExerciseListItem>();
  for (const r of rows) {
    const rawGroups = JSON.parse(r.muscle_groups || '[]') as string[];
    // Use library's display group if available, otherwise map from granular groups
    const libEntry = libraryMap.get(r.id);
    const displayGroup = libEntry
      ? libEntry.muscleGroup
      : resolveDisplayGroup(rawGroups);

    exerciseMap.set(r.id, {
      id: r.id,
      name: r.name,
      type: r.type,
      muscleGroups: [displayGroup],
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

/**
 * Insert a new user-created exercise with collision-safe ID generation.
 * Derives a snake_case ID from the name; appends a short UUID suffix on collision.
 */
export async function insertExercise(params: {
  name: string;
  type: string;
  muscleGroup: string;
  inputFields?: InputField[];
}): Promise<string> {
  const db = await getDatabase();
  let id = params.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  // Check for ID collision — append short UUID suffix if needed
  const existing = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM exercises WHERE id = ?', [id]
  );
  if (existing) {
    id = `${id}_${Crypto.randomUUID().slice(0, 8)}`;
  }

  await db.runAsync(
    `INSERT INTO exercises (id, name, type, muscle_groups, input_fields)
     VALUES (?, ?, ?, ?, ?)`,
    [id, params.name, params.type, JSON.stringify([params.muscleGroup]),
     params.inputFields ? JSON.stringify(params.inputFields) : null]
  );
  return id;
}
