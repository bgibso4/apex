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
    if (currentVersion < SCHEMA_VERSION) {
      await db.runAsync(
        "UPDATE schema_info SET value = ? WHERE key = 'schema_version'",
        [String(SCHEMA_VERSION)]
      );
    }
  }

  return db;
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
