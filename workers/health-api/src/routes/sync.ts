import { Hono } from 'hono';
import type { Env } from '../lib/types';
import { isAllowedTable, validateRecords, sanitizeRecord } from '../lib/tables';
import { buildUpsertSQL, buildSelectSQL } from '../db/queries';

export const syncRoutes = new Hono<{ Bindings: Env }>();

// Push: POST /v1/:table
syncRoutes.post('/:table', async (c) => {
  const table = c.req.param('table');

  if (!isAllowedTable(table)) {
    return c.json({ error: `Unknown table: ${table}` }, 400);
  }

  const body = await c.req.json<{ app_id?: string; records?: Record<string, unknown>[] }>();

  if (!body.records || body.records.length === 0) {
    return c.json({ error: 'No records provided' }, 400);
  }

  if (!body.app_id) {
    return c.json({ error: 'Missing app_id' }, 400);
  }

  const validation = validateRecords(table, body.records);
  if (!validation.valid) {
    return c.json({ error: validation.error }, 400);
  }

  const sanitized = body.records.map((r) => sanitizeRecord(table, r));
  const statements = buildUpsertSQL(table, sanitized);

  try {
    // D1 batch() supports ~100 statements max. Chunk if needed.
    const CHUNK_SIZE = 90; // Leave room for sync_log statement
    const start = Date.now();

    for (let i = 0; i < statements.length; i += CHUNK_SIZE) {
      const chunk = statements.slice(i, i + CHUNK_SIZE);
      const batch = chunk.map(({ sql, params }) =>
        c.env.DB.prepare(sql).bind(...params)
      );

      // Add sync_log update to the last chunk
      if (i + CHUNK_SIZE >= statements.length) {
        batch.push(
          c.env.DB.prepare(
            `INSERT INTO sync_log (app_id, table_name, last_synced_at, rows_synced)
             VALUES (?, ?, datetime('now'), ?)
             ON CONFLICT(app_id, table_name) DO UPDATE SET
               last_synced_at=excluded.last_synced_at,
               rows_synced=excluded.rows_synced`
          ).bind(body.app_id, table, sanitized.length)
        );
      }

      await c.env.DB.batch(batch);
    }

    const ms = Date.now() - start;

    if (ms > 100) {
      console.warn(JSON.stringify({ slow_batch: true, table, records: sanitized.length, duration_ms: ms }));
    }

    console.log(JSON.stringify({
      sync: 'push', table, app_id: body.app_id, records_count: sanitized.length, duration_ms: ms,
    }));

    return c.json({ synced: sanitized.length, errors: 0 });
  } catch (err) {
    console.error(JSON.stringify({ error: 'D1 batch failed', table, message: String(err) }));
    return c.json({ error: 'Database error' }, 500);
  }
});

// Pull: GET /v1/:table
syncRoutes.get('/:table', async (c) => {
  const table = c.req.param('table');

  if (!isAllowedTable(table)) {
    return c.json({ error: `Unknown table: ${table}` }, 400);
  }

  const since = c.req.query('since');
  const limit = parseInt(c.req.query('limit') || '100', 10);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  const { sql, countSql, params } = buildSelectSQL(table, { since, limit, offset });

  try {
    const start = Date.now();
    const [dataResult, countResult] = await c.env.DB.batch([
      c.env.DB.prepare(sql).bind(...params),
      c.env.DB.prepare(countSql).bind(...params),
    ]);
    const ms = Date.now() - start;

    if (ms > 100) {
      console.warn(JSON.stringify({ slow_query: true, table, duration_ms: ms }));
    }

    const records = dataResult.results || [];
    const total = (countResult.results?.[0] as { total: number })?.total || 0;

    return c.json({
      records,
      total,
      has_more: offset + records.length < total,
    });
  } catch (err) {
    console.error(JSON.stringify({ error: 'D1 query failed', table, message: String(err) }));
    return c.json({ error: 'Database error' }, 500);
  }
});
