import type { TableName } from '../lib/tables';

const MAX_LIMIT = 1000;
const DEFAULT_LIMIT = 100;

/**
 * Builds one INSERT ... ON CONFLICT(id) DO UPDATE per record.
 * Returns array of { sql, params } — caller should use db.batch().
 * Note: table name comes from the validated allowlist, not user input.
 */
export function buildUpsertSQL(
  table: TableName,
  records: Record<string, unknown>[]
): { sql: string; params: unknown[] }[] {
  return records.map((record) => {
    const columns = Object.keys(record);
    const placeholders = columns.map(() => '?').join(', ');
    const updateSet = columns
      .filter((col) => col !== 'id')
      .map((col) => `${col}=excluded.${col}`)
      .join(', ');

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${updateSet}`;
    const params = columns.map((col) => record[col]);
    return { sql, params };
  });
}

export interface SelectOptions {
  since?: string;
  limit?: number;
  offset?: number;
}

/**
 * Builds a SELECT with optional since filter and pagination.
 * Returns { sql, countSql, params } — both queries use the same params.
 * Note: table name comes from the validated allowlist, not user input.
 */
export function buildSelectSQL(
  table: TableName,
  options: SelectOptions
): { sql: string; countSql: string; params: unknown[] } {
  const { since, limit = DEFAULT_LIMIT, offset = 0 } = options;
  const cappedLimit = Math.min(limit, MAX_LIMIT);
  const params: unknown[] = [];

  let where = '';
  if (since) {
    where = 'WHERE updated_at > ?';
    params.push(since);
  }

  const sql = `SELECT * FROM ${table} ${where} ORDER BY updated_at ASC LIMIT ${cappedLimit} OFFSET ${offset}`;
  const countSql = `SELECT COUNT(*) as total FROM ${table} ${where}`;

  return { sql, countSql, params };
}
