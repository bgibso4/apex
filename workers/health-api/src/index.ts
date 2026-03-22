import { Hono } from 'hono';
import type { Env } from './lib/types';
import { authMiddleware } from './middleware/auth';
import { corsMiddleware } from './middleware/cors';
import { loggingMiddleware } from './middleware/logging';
import { oauthRoutes } from './routes/oauth';

const app = new Hono<{ Bindings: Env }>();

// Middleware stack
app.use('*', corsMiddleware);
app.use('*', loggingMiddleware);

// Health check (no auth)
app.get('/health', (c) => c.json({ status: 'ok' }));

// All other routes require auth
app.use('/v1/*', authMiddleware);

app.route('/v1/auth/whoop', oauthRoutes);

export default app;
