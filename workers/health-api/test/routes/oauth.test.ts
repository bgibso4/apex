import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { oauthRoutes } from '../../src/routes/oauth';
import { authMiddleware } from '../../src/middleware/auth';

const mockEnv = {
  APP_API_KEY: 'test-key',
  WHOOP_CLIENT_ID: 'test-client-id',
  WHOOP_CLIENT_SECRET: 'test-secret',
  WHOOP_TOKEN_URL: 'https://api.prod.whoop.com/oauth/oauth2/token',
};

describe('oauth routes', () => {
  const app = new Hono();
  app.use('*', authMiddleware);
  app.route('/v1/auth/whoop', oauthRoutes);

  it('POST /v1/auth/whoop/token returns 400 without code', async () => {
    const res = await app.request('/v1/auth/whoop/token', {
      method: 'POST',
      headers: { 'X-API-Key': 'test-key', 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }, mockEnv);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Missing');
  });

  it('POST /v1/auth/whoop/refresh returns 400 without refresh_token', async () => {
    const res = await app.request('/v1/auth/whoop/refresh', {
      method: 'POST',
      headers: { 'X-API-Key': 'test-key', 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }, mockEnv);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Missing');
  });
});
