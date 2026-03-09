/**
 * APEX — Database backup & restore
 *
 * Layer 1: Manual export/import via iOS Share Sheet.
 * Layer 2 (future): Automatic iCloud Documents backup.
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as SQLite from 'expo-sqlite';
import { getDatabase, closeDatabase } from './database';

/** Export the database via the iOS Share Sheet.
 *  Checkpoints WAL, copies to a temp file, opens share sheet. */
export async function exportDatabase(): Promise<void> {
  const db = await getDatabase();

  // Flush WAL into main DB file
  await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE);');

  // Copy to cache directory with timestamped name
  const date = new Date().toISOString().slice(0, 10);
  const exportFileName = `apex-backup-${date}.db`;
  const exportPath = `${FileSystem.cacheDirectory}${exportFileName}`;

  await FileSystem.copyAsync({
    from: db.databasePath,
    to: exportPath,
  });

  // Open iOS Share Sheet
  await Sharing.shareAsync(exportPath, {
    UTI: 'public.database',
    dialogTitle: 'Export APEX Backup',
  });

  // Record the export timestamp
  await db.runAsync(
    `INSERT OR REPLACE INTO schema_info (key, value) VALUES ('last_export_at', ?)`,
    [new Date().toISOString()]
  );
}

/** Get the last export timestamp, or null if never exported. */
export async function getLastExportTimestamp(): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM schema_info WHERE key = 'last_export_at'"
  );
  return row?.value ?? null;
}

/** Check if a backup reminder should be shown (>7 days since last export). */
export async function shouldShowBackupReminder(): Promise<boolean> {
  const lastExport = await getLastExportTimestamp();
  if (!lastExport) return true;

  const daysSince = (Date.now() - new Date(lastExport).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince > 7;
}

/** Import a database backup from the iOS document picker.
 *  Returns false if user cancelled, true on success, throws on error. */
export async function importDatabase(): Promise<boolean> {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.length) {
    return false;
  }

  const asset = result.assets[0];

  // Validate file extension
  if (!asset.name.toLowerCase().endsWith('.db')) {
    throw new Error('Selected file is not a valid database backup (.db)');
  }

  // Validate schema before replacing
  await validateBackupSchema(asset.uri);

  // Get the current DB path before closing
  const db = await getDatabase();
  const dbPath = db.databasePath;

  // Close current connection
  await closeDatabase();

  // Replace the database file
  await FileSystem.copyAsync({
    from: asset.uri,
    to: dbPath,
  });

  // Reopen the database (will run migrations if needed)
  await getDatabase();

  return true;
}

/** Validate that an imported file has the expected APEX schema. */
async function validateBackupSchema(uri: string): Promise<void> {
  const validationPath = `${FileSystem.cacheDirectory}apex-validation-temp.db`;
  await FileSystem.copyAsync({ from: uri, to: validationPath });

  let validationDb: SQLite.SQLiteDatabase | null = null;
  try {
    validationDb = await SQLite.openDatabaseAsync(validationPath, {
      useNewConnection: true,
    });

    const row = await validationDb.getFirstAsync<{ value: string }>(
      "SELECT value FROM schema_info WHERE key = 'schema_version'"
    );

    if (!row) {
      throw new Error('Backup file is not a valid APEX database (no schema version found)');
    }

    const version = parseInt(row.value);
    const { SCHEMA_VERSION } = require('./schema');

    if (version > SCHEMA_VERSION) {
      throw new Error(
        `Backup is from a newer version of APEX (v${version} > v${SCHEMA_VERSION}). Update the app first.`
      );
    }
  } catch (err: any) {
    if (err.message.includes('APEX')) throw err;
    throw new Error('Backup file is not a valid APEX database');
  } finally {
    if (validationDb) {
      await validationDb.closeAsync();
    }
    try {
      await FileSystem.deleteAsync(validationPath, { idempotent: true });
    } catch { /* ignore cleanup errors */ }
  }
}
