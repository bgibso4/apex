import { getDatabase } from '../db/database';

const KEY_PREFIX = 'sync_last_';

export async function getLastSync(table: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM schema_info WHERE key = ?',
    [KEY_PREFIX + table],
  );
  return row?.value ?? null;
}

export async function setLastSync(table: string, timestamp: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO schema_info (key, value) VALUES (?, ?)',
    [KEY_PREFIX + table, timestamp],
  );
}
