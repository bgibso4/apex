/**
 * APEX — Database initialization and connection
 */

import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES, SCHEMA_VERSION } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('apex.db');

  // Enable WAL mode for better performance
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Create tables
  await db.execAsync(CREATE_TABLES);

  // Check/set schema version
  const versionResult = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM schema_info WHERE key = 'schema_version'"
  );

  if (!versionResult) {
    await db.runAsync(
      "INSERT INTO schema_info (key, value) VALUES ('schema_version', ?)",
      [String(SCHEMA_VERSION)]
    );
  } else {
    const currentVersion = parseInt(versionResult.value);
    if (currentVersion < 2) {
      try {
        await db.execAsync('ALTER TABLE set_logs ADD COLUMN is_adhoc INTEGER DEFAULT 0');
      } catch {
        // Column already exists
      }
    }
    if (currentVersion < 3) {
      try {
        await db.execAsync('ALTER TABLE run_logs ADD COLUMN pain_level_24h INTEGER');
      } catch { /* already exists */ }
      try {
        await db.execAsync('ALTER TABLE run_logs ADD COLUMN distance REAL');
      } catch { /* already exists */ }
    }
    if (currentVersion < 4) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS exercise_notes (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          exercise_id TEXT NOT NULL,
          note TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL,
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
          UNIQUE(session_id, exercise_id)
        );
        CREATE TABLE IF NOT EXISTS personal_records (
          id TEXT PRIMARY KEY,
          exercise_id TEXT NOT NULL,
          record_type TEXT NOT NULL,
          rep_count INTEGER,
          value REAL NOT NULL,
          previous_value REAL,
          session_id TEXT NOT NULL,
          date TEXT NOT NULL,
          FOREIGN KEY (exercise_id) REFERENCES exercises(id),
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_exercise_notes_session ON exercise_notes(session_id);
        CREATE INDEX IF NOT EXISTS idx_personal_records_exercise ON personal_records(exercise_id, record_type, rep_count);
        CREATE INDEX IF NOT EXISTS idx_personal_records_session ON personal_records(session_id);
      `);
    }
    if (currentVersion < SCHEMA_VERSION) {
      await db.runAsync(
        "UPDATE schema_info SET value = ? WHERE key = 'schema_version'",
        [String(SCHEMA_VERSION)]
      );
    }
  }

  return db;
}

/** Delete all user data (sessions, programs, logs, etc.) but keep the schema intact */
export async function clearAllData(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM personal_records;
    DELETE FROM exercise_notes;
    DELETE FROM set_logs;
    DELETE FROM sessions;
    DELETE FROM programs;
    DELETE FROM run_logs;
    DELETE FROM weekly_checkins;
    DELETE FROM exercises;
  `);
}

/** Generate a unique ID (simple UUID v4 alternative) */
export function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const segments = [8, 4, 4, 4, 12];
  return segments
    .map(len =>
      Array.from({ length: len }, () =>
        chars[Math.floor(Math.random() * chars.length)]
      ).join('')
    )
    .join('-');
}
