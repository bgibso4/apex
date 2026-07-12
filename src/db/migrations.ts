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
