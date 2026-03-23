import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { syncRoutes } from '../../src/routes/sync';
import { authMiddleware } from '../../src/middleware/auth';

const mockEnv = { APP_API_KEY: 'test-key' };
const headers = { 'X-API-Key': 'test-key', 'Content-Type': 'application/json' };

describe('sync routes', () => {
  const app = new Hono();
  app.use('*', authMiddleware);
  app.route('/v1', syncRoutes);

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
});
