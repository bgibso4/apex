// src/sync/syncClient.ts
import { SyncEngine } from '@cadre/shared/sync';
import { getDatabase } from '../db/database';
import { SYNC_TABLES, getSyncQuery, transformRow, type SyncTableName } from './syncConfig';
import { getLastSync, setLastSync } from './syncStorage';
import { WHOOP_WORKER_URL, WHOOP_WORKER_API_KEY } from '../health/config';

const engine = new SyncEngine({
  apiUrl: WHOOP_WORKER_URL,
  apiKey: WHOOP_WORKER_API_KEY,
  appId: 'apex',
  getLastSync,
  setLastSync,
});

// Register each Apex table with its local query and transform logic
for (const [table] of Object.entries(SYNC_TABLES)) {
  engine.registerTable({
    table,
    getChangedRows: async (since: string) => {
      const db = await getDatabase();
      const query = getSyncQuery(table as SyncTableName);
      return db.getAllAsync<Record<string, unknown>>(query, [since]);
    },
    transformRow: (row) => transformRow(table as SyncTableName, row),
  });
}

export const syncAll = () => engine.syncAll();
export const syncTable = (table: string) => engine.syncTable(table);
