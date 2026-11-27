/**
 * APEX — Migration helpers
 * Dependency-injected (db handle passed in) so they are unit-testable
 * without expo-sqlite. Called from database.ts migration blocks.
 */

export interface MigrationDb {
  runAsync(sql: string, params?: unknown): Promise<unknown>;
}

/**
 * v16: Archive orphaned pre-launch "Functional Athlete v2" rows.
 * That row holds the obsolete 12-week draft; it predates bundled_id, so the
 * launch-time refresh can never match it (bundled_id NULL, name mismatch) —
 * leaving it activatable by accident. Archiving (not deleting) keeps the row
 * and any attached sessions recoverable.
 */
export async function archiveLegacyV2Programs(db: MigrationDb): Promise<void> {
  await db.runAsync(`
    UPDATE programs SET status = 'archived', updated_at = datetime('now')
    WHERE name = 'Functional Athlete v2'
      AND bundled_id IS NULL
      AND status IN ('active', 'inactive')
  `);
}

/** v17: RPE auto-progression — per-exercise increment + accepted-adjustment event log */
export async function ensureProgressionSchema(
  db: { execAsync: (sql: string) => Promise<unknown> }
): Promise<void> {
  try {
    await db.execAsync('ALTER TABLE exercises ADD COLUMN weight_increment REAL');
  } catch { /* already exists */ }
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS weight_adjustments (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      program_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      old_weight REAL NOT NULL,
      new_weight REAL NOT NULL,
      reason TEXT NOT NULL CHECK (reason IN ('easy','misses')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_weight_adjustments_exercise ON weight_adjustments(exercise_id, created_at DESC)'
  );
}
