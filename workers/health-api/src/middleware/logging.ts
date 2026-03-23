import { createMiddleware } from 'hono/factory';
import type { Env } from '../lib/types';

export const loggingMiddleware = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;

  console.log(JSON.stringify({
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration_ms: ms,
  }));
});
