interface Env {
  WHOOP_CLIENT_ID: string;
  WHOOP_CLIENT_SECRET: string;
  WHOOP_TOKEN_URL: string;
  APP_API_KEY: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
    }

    // Verify request comes from our app
    if (request.headers.get('X-API-Key') !== env.APP_API_KEY) {
      return new Response('Unauthorized', { status: 401, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === '/oauth/token') {
      return handleTokenExchange(request, env);
    }

    if (url.pathname === '/oauth/refresh') {
      return handleTokenRefresh(request, env);
    }

    return new Response('Not found', { status: 404, headers: CORS_HEADERS });
  },
};

async function handleTokenExchange(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as { code: string; redirect_uri: string };

  if (!body.code || !body.redirect_uri) {
    return new Response(
      JSON.stringify({ error: 'Missing code or redirect_uri' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  const tokenResponse = await fetch(env.WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: body.code,
      redirect_uri: body.redirect_uri,
      client_id: env.WHOOP_CLIENT_ID,
      client_secret: env.WHOOP_CLIENT_SECRET,
    }),
  });

  const data = await tokenResponse.text();
  return new Response(data, {
    status: tokenResponse.status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

async function handleTokenRefresh(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as { refresh_token: string };

  if (!body.refresh_token) {
    return new Response(
      JSON.stringify({ error: 'Missing refresh_token' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  const tokenResponse = await fetch(env.WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: body.refresh_token,
      client_id: env.WHOOP_CLIENT_ID,
      client_secret: env.WHOOP_CLIENT_SECRET,
    }),
  });

  const data = await tokenResponse.text();
  return new Response(data, {
    status: tokenResponse.status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
