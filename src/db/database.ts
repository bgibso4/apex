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
    if (currentVersion < 5) {
      try {
        await db.execAsync('ALTER TABLE sessions ADD COLUMN notes TEXT');
      } catch { /* already exists */ }
    }
    if (currentVersion < 6) {
      await db.execAsync(`
        ALTER TABLE sessions ADD COLUMN is_sample INTEGER DEFAULT 0;
        ALTER TABLE set_logs ADD COLUMN is_sample INTEGER DEFAULT 0;
        ALTER TABLE run_logs ADD COLUMN is_sample INTEGER DEFAULT 0;
        ALTER TABLE programs ADD COLUMN is_sample INTEGER DEFAULT 0;
        ALTER TABLE exercises ADD COLUMN is_sample INTEGER DEFAULT 0;
        ALTER TABLE personal_records ADD COLUMN is_sample INTEGER DEFAULT 0;
        ALTER TABLE exercise_notes ADD COLUMN is_sample INTEGER DEFAULT 0;
      `);
    }
    if (currentVersion < 7) {
      try {
        await db.execAsync('ALTER TABLE exercises ADD COLUMN input_fields TEXT');
      } catch { /* already exists */ }
      try {
        await db.execAsync('ALTER TABLE set_logs ADD COLUMN target_distance REAL');
      } catch { /* already exists */ }
      try {
        await db.execAsync('ALTER TABLE set_logs ADD COLUMN actual_distance REAL');
      } catch { /* already exists */ }
      try {
        await db.execAsync('ALTER TABLE set_logs ADD COLUMN target_duration REAL');
      } catch { /* already exists */ }
      try {
        await db.execAsync('ALTER TABLE set_logs ADD COLUMN actual_duration REAL');
      } catch { /* already exists */ }
      try {
        await db.execAsync('ALTER TABLE set_logs ADD COLUMN target_time REAL');
      } catch { /* already exists */ }
      try {
        await db.execAsync('ALTER TABLE set_logs ADD COLUMN actual_time REAL');
      } catch { /* already exists */ }
    }
    if (currentVersion < 8) {
      try {
        await db.execAsync('ALTER TABLE sessions ADD COLUMN name TEXT');
      } catch { /* already exists */ }

      // Backfill session names from program templates
      const programs = await db.getAllAsync<{ id: string; definition: string }>(
        'SELECT id, definition FROM programs'
      );
      for (const prog of programs) {
        try {
          const def = typeof prog.definition === 'string'
            ? JSON.parse(prog.definition)
            : prog.definition;
          const tmpl = def?.program?.weekly_template;
          if (!tmpl) continue;
          const sessions = await db.getAllAsync<{ id: string; day_template_id: string }>(
            'SELECT id, day_template_id FROM sessions WHERE program_id = ? AND name IS NULL',
            [prog.id]
          );
          for (const s of sessions) {
            const dayTmpl = tmpl[s.day_template_id];
            if (dayTmpl && dayTmpl.name) {
              await db.runAsync('UPDATE sessions SET name = ? WHERE id = ?', [dayTmpl.name, s.id]);
            }
          }
        } catch { /* skip if definition can't be parsed */ }
      }
    }
    if (currentVersion < 10) {
      try {
        await db.execAsync('ALTER TABLE programs ADD COLUMN bundled_id TEXT');
      } catch { /* already exists */ }
    }
    if (currentVersion < 11) {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS daily_health (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL UNIQUE,
            source TEXT NOT NULL,
            recovery_score REAL,
            sleep_score REAL,
            hrv_rmssd REAL,
            resting_hr REAL,
            strain_score REAL,
            sleep_duration_min INTEGER,
            spo2 REAL,
            skin_temp_celsius REAL,
            respiratory_rate REAL,
            raw_json TEXT,
            synced_at TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
          );
          CREATE INDEX IF NOT EXISTS idx_daily_health_date ON daily_health(date);
        `);
      } catch (e) {
        console.warn('Migration to v11 warning:', e);
      }
    }
    // v12: Add updated_at to all syncable tables for cloud sync
    if (currentVersion < 12) {
      const syncableTables = [
        'sessions', 'set_logs', 'exercises', 'programs',
        'run_logs', 'exercise_notes', 'personal_records', 'session_protocols',
      ];
      for (const table of syncableTables) {
        try {
          await db.runAsync(`ALTER TABLE ${table} ADD COLUMN updated_at TEXT`);
        } catch {
          // Column may already exist
        }
        await db.runAsync(`UPDATE ${table} SET updated_at = datetime('now') WHERE updated_at IS NULL`);
      }
    }

    if (currentVersion < 13) {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS exercise_resources (
            id TEXT PRIMARY KEY,
            exercise_id TEXT NOT NULL,
            label TEXT NOT NULL,
            url TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
          );
          CREATE INDEX IF NOT EXISTS idx_exercise_resources_exercise ON exercise_resources(exercise_id);
        `);
      } catch (e) {
        console.warn('Migration to v13 warning:', e);
      }
    }

    // Safety net: ensure critical columns exist regardless of version
    // (handles databases where version was bumped but migrations were skipped)
    for (const col of ['notes TEXT', 'name TEXT', 'is_sample INTEGER DEFAULT 0']) {
      try {
        await db.execAsync(`ALTER TABLE sessions ADD COLUMN ${col}`);
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

/** Close the database connection and clear the singleton.
 *  Must be called before replacing the DB file (e.g., import). */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

/** Delete all user data (sessions, programs, logs, etc.) but keep the schema intact */
export async function clearAllData(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM exercise_resources;
    DELETE FROM daily_health;
    DELETE FROM personal_records;
    DELETE FROM exercise_notes;
    DELETE FROM set_logs;
    DELETE FROM session_protocols;
    DELETE FROM sessions;
    DELETE FROM programs;
    DELETE FROM run_logs;
    DELETE FROM weekly_checkins;
    DELETE FROM exercises;
  `);
}

/** Delete only sample/test data, preserving real user data */
export async function clearSampleData(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM personal_records WHERE is_sample = 1;
    DELETE FROM exercise_notes WHERE is_sample = 1;
    DELETE FROM set_logs WHERE is_sample = 1;
    DELETE FROM session_protocols WHERE session_id IN (SELECT id FROM sessions WHERE is_sample = 1);
    DELETE FROM sessions WHERE is_sample = 1;
    DELETE FROM run_logs WHERE is_sample = 1;
    DELETE FROM programs WHERE is_sample = 1;
    DELETE FROM exercises WHERE is_sample = 1;
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
