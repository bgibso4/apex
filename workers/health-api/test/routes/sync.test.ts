import { describe, it, expect, beforeAll, vi } from 'vitest';
import { env } from 'cloudflare:test';
import { Hono } from 'hono';
import { syncRoutes } from '../../src/routes/sync';
import { authMiddleware } from '../../src/middleware/auth';
import schemaSql from '../../src/db/schema.sql?raw';

const mockEnv = { APP_API_KEY: 'test-key' };
const headers = { 'X-API-Key': 'test-key', 'Content-Type': 'application/json' };

// D1's exec() runs one statement per line and rejects comment-only lines, so
// schema.sql (multi-line CREATE TABLE blocks with `--` comments) needs to be
// flattened into one statement per line before the test DB can load it.
function toExecScript(sql: string): string {
  const withoutComments = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join(' ');
  return withoutComments
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map((statement) => `${statement};`)
    .join('\n');
}

describe('sync routes', () => {
  const app = new Hono();
  app.use('*', authMiddleware);
  app.route('/v1', syncRoutes);

  beforeAll(async () => {
    await env.DB.exec(toExecScript(schemaSql));
  });

  it('POST /v1/:table rejects unknown table', async () => {
    const res = await app.request('/v1/evil_table', {
      method: 'POST',
      headers,
      body: JSON.stringify({ app_id: 'apex', records: [] }),
    }, mockEnv);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Unknown table');
  });

  it('POST /v1/:table rejects empty records', async () => {
    const res = await app.request('/v1/sessions', {
      method: 'POST',
      headers,
      body: JSON.stringify({ app_id: 'apex', records: [] }),
    }, mockEnv);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('No records');
  });

  it('POST /v1/:table rejects missing required columns', async () => {
    const res = await app.request('/v1/sessions', {
      method: 'POST',
      headers,
      body: JSON.stringify({ app_id: 'apex', records: [{ id: 'abc' }] }),
    }, mockEnv);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Missing required');
  });

  it('POST /v1/:table rejects missing app_id', async () => {
    const res = await app.request('/v1/sessions', {
      method: 'POST',
      headers,
      body: JSON.stringify({ records: [{ id: 'a', date: 'd', updated_at: 'u' }] }),
    }, mockEnv);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('app_id');
  });

  it('GET /v1/:table rejects unknown table', async () => {
    const res = await app.request('/v1/evil_table', {
      headers: { 'X-API-Key': 'test-key' },
    }, mockEnv);
    expect(res.status).toBe(400);
  });

  it('POST /v1/:table drops unknown columns and warns in log mode (default)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const res = await app.request('/v1/sessions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        app_id: 'apex',
        records: [
          { id: 'contract-log-1', date: '2026-07-22', updated_at: '2026-07-22T00:00:00Z', evil_col: 'nope' },
        ],
      }),
    }, { ...mockEnv, DB: env.DB });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ synced: 1, errors: 0 });
    expect(warnSpy).toHaveBeenCalledWith('[contract] dropped', { table: 'sessions', column: 'evil_col' });

    const row = await env.DB.prepare('SELECT * FROM sessions WHERE id = ?').bind('contract-log-1').first();
    expect(row).toBeTruthy();
    expect(row).not.toHaveProperty('evil_col');

    warnSpy.mockRestore();
  });

  it('POST /v1/:table rejects unknown columns with 422 in enforce mode', async () => {
    const res = await app.request('/v1/sessions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        app_id: 'apex',
        records: [
          { id: 'contract-enforce-1', date: '2026-07-22', updated_at: '2026-07-22T00:00:00Z', evil_col: 'nope' },
        ],
      }),
    }, { ...mockEnv, DB: env.DB, CONTRACT_MODE: 'enforce' });

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(JSON.stringify(body)).toContain('evil_col');

    const row = await env.DB.prepare('SELECT * FROM sessions WHERE id = ?').bind('contract-enforce-1').first();
    expect(row).toBeNull();
  });

  it('POST /v1/programs persists completion tracking columns without dropping them', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const res = await app.request('/v1/programs', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        app_id: 'apex',
        records: [
          {
            id: 'prog-completion-1',
            name: 'Pillars',
            updated_at: '2026-07-22T00:00:00Z',
            completed_date: '2026-07-20',
            completion_seen: 1,
            card_dismissed: 0,
          },
        ],
      }),
    }, { ...mockEnv, DB: env.DB });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ synced: 1, errors: 0 });
    expect(warnSpy).not.toHaveBeenCalledWith('[contract] dropped', expect.objectContaining({ table: 'programs' }));

    const row = await env.DB.prepare('SELECT * FROM programs WHERE id = ?').bind('prog-completion-1').first();
    expect(row).toMatchObject({
      id: 'prog-completion-1',
      completed_date: '2026-07-20',
      completion_seen: 1,
      card_dismissed: 0,
    });

    warnSpy.mockRestore();
  });

  it('POST /v1/exercises persists weight_increment', async () => {
    const res = await app.request('/v1/exercises', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        app_id: 'apex',
        records: [
          {
            id: 'ex-increment-1',
            name: 'Bench Press',
            updated_at: '2026-07-22T00:00:00Z',
            weight_increment: 2.5,
          },
        ],
      }),
    }, { ...mockEnv, DB: env.DB });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ synced: 1, errors: 0 });

    const row = await env.DB.prepare('SELECT * FROM exercises WHERE id = ?').bind('ex-increment-1').first();
    expect(row).toMatchObject({ id: 'ex-increment-1', weight_increment: 2.5 });
  });

  it('POST /v1/weight_adjustments persists a valid record', async () => {
    const res = await app.request('/v1/weight_adjustments', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        app_id: 'apex',
        records: [
          {
            id: 'wa-1',
            exercise_id: 'ex-1',
            program_id: 'prog-1',
            session_id: 'sess-1',
            old_weight: 135,
            new_weight: 145,
            reason: 'easy',
            created_at: '2026-07-22T00:00:00Z',
          },
        ],
      }),
    }, { ...mockEnv, DB: env.DB });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ synced: 1, errors: 0 });

    const row = await env.DB.prepare('SELECT * FROM weight_adjustments WHERE id = ?').bind('wa-1').first();
    expect(row).toMatchObject({ id: 'wa-1', exercise_id: 'ex-1', reason: 'easy' });
  });
});
