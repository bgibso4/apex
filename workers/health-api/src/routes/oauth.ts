import { Hono } from 'hono';
import type { Env } from '../lib/types';

export const oauthRoutes = new Hono<{ Bindings: Env }>();

oauthRoutes.post('/token', async (c) => {
  const body = await c.req.json<{ code?: string; redirect_uri?: string }>();

  if (!body.code || !body.redirect_uri) {
    return c.json({ error: 'Missing code or redirect_uri' }, 400);
  }

  const tokenResponse = await fetch(c.env.WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: body.code,
      redirect_uri: body.redirect_uri,
      client_id: c.env.WHOOP_CLIENT_ID,
      client_secret: c.env.WHOOP_CLIENT_SECRET,
    }),
  });

  const data = await tokenResponse.text();
  return c.body(data, tokenResponse.status as 200, {
    'Content-Type': 'application/json',
  });
});

oauthRoutes.post('/refresh', async (c) => {
  const body = await c.req.json<{ refresh_token?: string }>();

  if (!body.refresh_token) {
    return c.json({ error: 'Missing refresh_token' }, 400);
  }

  const tokenResponse = await fetch(c.env.WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: body.refresh_token,
      client_id: c.env.WHOOP_CLIENT_ID,
      client_secret: c.env.WHOOP_CLIENT_SECRET,
    }),
  });

  const data = await tokenResponse.text();
  return c.body(data, tokenResponse.status as 200, {
    'Content-Type': 'application/json',
  });
});
