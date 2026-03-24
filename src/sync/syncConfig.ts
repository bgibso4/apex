// src/sync/syncConfig.ts

export type SyncTableName =
  | 'sessions' | 'set_logs' | 'exercises' | 'programs' | 'run_logs'
  | 'exercise_notes' | 'personal_records' | 'session_protocols' | 'daily_health';

interface TableSyncConfig {
  /** Columns to strip before pushing */
  excludeColumns: string[];
  /** Local column -> D1 column renames */
  columnRenames?: Record<string, string>;
  /** Generate a text ID from row data (for tables with integer autoincrement PKs) */
  idTransform?: (row: Record<string, unknown>) => string;
  /**
   * Custom SQL query for sync (replaces default SELECT *).
   * Must include WHERE updated_at > ? AND (is_sample IS NULL OR is_sample = 0) filtering.
   * The ? placeholder is for the last-sync timestamp.
   */
  customQuery?: string;
}

export const SYNC_TABLES: Record<SyncTableName, TableSyncConfig> = {
  sessions: {
    excludeColumns: ['is_sample', 'day_template_id'],
    customQuery: `
      SELECT s.*, p.name AS program_name
      FROM sessions s
      LEFT JOIN programs p ON s.program_id = p.id
      WHERE s.updated_at > ? AND (s.is_sample IS NULL OR s.is_sample = 0)
    `,
  },
  set_logs: {
    excludeColumns: ['is_sample'],
    customQuery: `
      SELECT sl.*, e.name AS exercise_name
      FROM set_logs sl
      LEFT JOIN exercises e ON sl.exercise_id = e.id
      WHERE sl.updated_at > ? AND (sl.is_sample IS NULL OR sl.is_sample = 0)
    `,
  },
  exercises: {
    excludeColumns: ['is_sample'],
  },
  programs: {
    excludeColumns: ['is_sample', 'bundled_id', 'created_date'],
    columnRenames: { activated_date: 'started_at' },
  },
  run_logs: {
    excludeColumns: ['is_sample'],
  },
  exercise_notes: {
    excludeColumns: ['is_sample'],
    // Note: created_at is NOT excluded — it's retained in D1 per spec
  },
  personal_records: {
    excludeColumns: ['is_sample'],
  },
  session_protocols: {
    excludeColumns: ['is_sample'],
    idTransform: (row) =>
      `apex-proto-${row.session_id}-${row.type}-${row.sort_order}`,
  },
  daily_health: {
    excludeColumns: ['raw_json', 'created_at'],
    idTransform: (row) => `apex-health-${row.date}`,
  },
};

const DEFAULT_QUERY = (table: string) => `
  SELECT * FROM ${table}
  WHERE updated_at > ? AND (is_sample IS NULL OR is_sample = 0)
`;

/**
 * Get the SQL query for fetching changed rows from a syncable table.
 */
export function getSyncQuery(table: SyncTableName): string {
  return SYNC_TABLES[table].customQuery ?? DEFAULT_QUERY(table);
}

/**
 * Transform a local DB row into the shape expected by the D1 cloud schema.
 * Strips excluded columns, applies renames, generates IDs where needed.
 */
export function transformRow(
  table: SyncTableName,
  row: Record<string, unknown>,
): Record<string, unknown> {
  const config = SYNC_TABLES[table];
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    if (config.excludeColumns.includes(key)) continue;

    const renamedKey = config.columnRenames?.[key] ?? key;
    result[renamedKey] = value;
  }

  // Apply ID transform if needed (overwrites integer autoincrement ID)
  if (config.idTransform) {
    result.id = config.idTransform(row);
  }

  return result;
}
