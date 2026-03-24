// src/sync/syncClient.ts
import { getDatabase } from '../db/database';
import { SYNC_TABLES, getSyncQuery, transformRow, type SyncTableName } from './syncConfig';
import { getLastSync, setLastSync } from './syncStorage';
import { WHOOP_WORKER_URL, WHOOP_WORKER_API_KEY } from '../health/config';

const EPOCH = '1970-01-01T00:00:00Z';

/**
 * Sync a single table: query changed rows, transform, push to Worker.
 */
export async function syncTable(table: SyncTableName): Promise<void> {
  const db = await getDatabase();
  const lastSync = await getLastSync(table) ?? EPOCH;
  const query = getSyncQuery(table);

  const rows = await db.getAllAsync<Record<string, unknown>>(query, [lastSync]);

  if (rows.length === 0) return;

  const records = rows.map((row) => transformRow(table, row));

  const response = await fetch(`${WHOOP_WORKER_URL}/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': WHOOP_WORKER_API_KEY,
    },
    body: JSON.stringify({
      app_id: 'apex',
      records,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.warn(`[sync] Failed to push ${table}: ${response.status}`, errorBody);
    return;
  }

  // Update last-sync to max updated_at of pushed rows
  const maxUpdatedAt = rows.reduce((max, row) => {
    const val = row.updated_at as string;
    return val > max ? val : max;
  }, '');

  if (maxUpdatedAt) {
    await setLastSync(table, maxUpdatedAt);
  }
}

/**
 * Sync all tables. Tables are independent — one failure doesn't block others.
 */
export async function syncAll(): Promise<void> {
  const tables = Object.keys(SYNC_TABLES) as SyncTableName[];

  for (const table of tables) {
    try {
      await syncTable(table);
    } catch (err) {
      console.warn(`[sync] Error syncing ${table}:`, err);
    }
  }
}
