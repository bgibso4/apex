import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { authMiddleware } from '../../src/middleware/auth';

describe('auth middleware', () => {
  const app = new Hono<{ Bindings: { APP_API_KEY: string } }>();
  app.use('*', authMiddleware);
  app.get('/test', (c) => c.json({ ok: true }));

  it('returns 401 without API key', async () => {
    const res = await app.request('/test', {}, { APP_API_KEY: 'secret' });
    expect(res.status).toBe(401);
  });

  it('returns 401 with wrong API key', async () => {
    const res = await app.request('/test', {
      headers: { 'X-API-Key': 'wrong' },
    }, { APP_API_KEY: 'secret' });
    expect(res.status).toBe(401);
  });

  it('passes with correct API key', async () => {
    const res = await app.request('/test', {
      headers: { 'X-API-Key': 'secret' },
    }, { APP_API_KEY: 'secret' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
