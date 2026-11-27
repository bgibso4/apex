import { getDatabase } from './database';

let isBackingUp = false;

export async function backupToICloud(): Promise<void> {
  if (isBackingUp) return;
  isBackingUp = true;

  try {
    const ICloudBackup = require('../../modules/icloud-backup');
    const db = await getDatabase();

    // Checkpoint WAL to flush all data to the main .db file
    await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE)');

    // Copy to iCloud — the file is consistent after checkpoint
    const dbPath = db.databasePath;
    const date = new Date().toISOString().slice(0, 10);
    const filename = `apex-backup-${date}.db`;
    await ICloudBackup.copyToICloud(dbPath, filename);
  } catch (e) {
    console.warn('[icloud] Backup failed:', e);
  } finally {
    isBackingUp = false;
  }
}
