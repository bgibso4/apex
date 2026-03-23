# Health API + D1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing WHOOP OAuth Worker into a full health API with D1 cloud database, sync endpoints, and observability.

**Architecture:** Hono-based CF Worker with modular routes (OAuth, sync, analytics), middleware stack (Sentry, logging, auth, CORS), D1 database for cloud storage, and a table allowlist pattern for safe generic sync endpoints.

**Tech Stack:** Cloudflare Workers, Hono, D1 (SQLite), @sentry/cloudflare, TypeScript, Vitest (for Worker tests)

**Spec:** `docs/superpowers/specs/2026-03-22-health-api-d1-design.md`

---

## File Structure

```
workers/health-api/
  src/
    index.ts                    -- Hono app entry, route registration, Sentry wrapper
    routes/
      oauth.ts                  -- /v1/auth/whoop/* (migrated from old index.ts)
      sync.ts                   -- POST/GET /v1/:table
    middleware/
      auth.ts                   -- X-API-Key validation
      logging.ts                -- Structured request/response logging + timing
      cors.ts                   -- CORS headers (GET + POST + OPTIONS)
    db/
      schema.sql                -- D1 table definitions + indexes
      queries.ts                -- Generic upsert + select-since query builders
    lib/
      tables.ts                 -- Table allowlist with column/required definitions
      types.ts                  -- Shared TypeScript types (Env, SyncRequest, etc.)
  test/
    middleware/
      auth.test.ts
    routes/
      oauth.test.ts
      sync.test.ts
    lib/
      tables.test.ts
    db/
      queries.test.ts
  wrangler.toml
  package.json
  tsconfig.json
  vitest.config.ts
```

**APEX files modified:**
- `src/health/config.ts` — Update Worker URL + OAuth paths

---

### Task 1: Scaffold the new Worker project

**Files:**
- Create: `workers/health-api/package.json`
- Create: `workers/health-api/tsconfig.json`
- Create: `workers/health-api/vitest.config.ts`
- Create: `workers/health-api/wrangler.toml`
- Create: `workers/health-api/src/lib/types.ts`
- Create: `workers/health-api/src/index.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "apex-health-api",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "vitest run",
    "test:watch": "vitest",
    "tail": "wrangler tail"
  },
  "dependencies": {
    "hono": "^4"
  },
  "devDependencies": {
    "@cloudflare/vitest-pool-workers": "^0.8",
    "@cloudflare/workers-types": "^4",
    "typescript": "^5",
    "vitest": "^3",
    "wrangler": "^4"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "lib": ["ESNext"],
    "types": ["@cloudflare/workers-types/2023-07-01", "@cloudflare/vitest-pool-workers"],
    "jsx": "react-jsx",
    "jsxImportSource": "hono/jsx",
    "noEmit": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
```

- [ ] **Step 3: Create vitest.config.ts**

```typescript
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
      },
    },
  },
});
```

- [ ] **Step 4: Create wrangler.toml**

Copy WHOOP secrets from the old Worker. The D1 database_id will be filled in after creation in a later task.

```toml
name = "apex-health-api"
main = "src/index.ts"
compatibility_date = "2024-12-01"

[vars]
WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token"

# D1 binding — database_id filled after `wrangler d1 create`
# [[d1_databases]]
# binding = "DB"
# database_name = "apex-health-db"
# database_id = "<FILL_AFTER_CREATE>"
```

- [ ] **Step 5: Create src/lib/types.ts**

```typescript
export interface Env {
  WHOOP_CLIENT_ID: string;
  WHOOP_CLIENT_SECRET: string;
  WHOOP_TOKEN_URL: string;
  APP_API_KEY: string;
  SENTRY_DSN: string;
  DB: D1Database;
}

export interface SyncPushRequest {
  app_id: string;
  records: Record<string, unknown>[];
}

export interface SyncPushResponse {
  synced: number;
  errors: number;
}

export interface SyncPullResponse {
  records: Record<string, unknown>[];
  total: number;
  has_more: boolean;
}
```

- [ ] **Step 6: Create minimal src/index.ts (Hono app skeleton)**

```typescript
import { Hono } from 'hono';
import type { Env } from './lib/types';

const app = new Hono<{ Bindings: Env }>();

app.get('/health', (c) => c.json({ status: 'ok' }));

export default app;
```

- [ ] **Step 7: Install dependencies**

Run: `cd workers/health-api && npm install`

- [ ] **Step 8: Verify the skeleton works**

Run: `cd workers/health-api && npx wrangler dev --local`
Test: `curl http://localhost:8787/health` → `{"status":"ok"}`
Kill the dev server.

- [ ] **Step 9: Commit**

```bash
git add workers/health-api/
git commit -m "feat: scaffold health-api Worker with Hono skeleton"
```

---

### Task 2: Middleware — Auth, CORS, Logging

**Files:**
- Create: `workers/health-api/src/middleware/auth.ts`
- Create: `workers/health-api/src/middleware/cors.ts`
- Create: `workers/health-api/src/middleware/logging.ts`
- Create: `workers/health-api/test/middleware/auth.test.ts`
- Modify: `workers/health-api/src/index.ts`

- [ ] **Step 1: Write auth middleware test**

```typescript
// test/middleware/auth.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd workers/health-api && npm test`
Expected: FAIL — `authMiddleware` not found.

- [ ] **Step 3: Implement auth middleware**

```typescript
// src/middleware/auth.ts
import { createMiddleware } from 'hono/factory';
import type { Env } from '../lib/types';

export const authMiddleware = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const apiKey = c.req.header('X-API-Key');
  if (!apiKey || apiKey !== c.env.APP_API_KEY) {
    return c.text('Unauthorized', 401);
  }
  await next();
});
```

- [ ] **Step 4: Implement CORS middleware**

```typescript
// src/middleware/cors.ts
import { cors } from 'hono/cors';

export const corsMiddleware = cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-API-Key'],
});
```

- [ ] **Step 5: Implement logging middleware**

```typescript
// src/middleware/logging.ts
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
```

- [ ] **Step 6: Run tests**

Run: `cd workers/health-api && npm test`
Expected: All auth tests PASS.

- [ ] **Step 7: Wire middleware into index.ts**

```typescript
// src/index.ts
import { Hono } from 'hono';
import type { Env } from './lib/types';
import { authMiddleware } from './middleware/auth';
import { corsMiddleware } from './middleware/cors';
import { loggingMiddleware } from './middleware/logging';

const app = new Hono<{ Bindings: Env }>();

// Middleware stack
app.use('*', corsMiddleware);
app.use('*', loggingMiddleware);

// Health check (no auth)
app.get('/health', (c) => c.json({ status: 'ok' }));

// All other routes require auth
app.use('/v1/*', authMiddleware);

export default app;
```

- [ ] **Step 8: Commit**

```bash
git add workers/health-api/src/middleware/ workers/health-api/test/middleware/ workers/health-api/src/index.ts
git commit -m "feat: add auth, CORS, and logging middleware"
```

---

### Task 3: Migrate OAuth routes

**Files:**
- Create: `workers/health-api/src/routes/oauth.ts`
- Create: `workers/health-api/test/routes/oauth.test.ts`
- Modify: `workers/health-api/src/index.ts`

- [ ] **Step 1: Write OAuth route tests**

```typescript
// test/routes/oauth.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd workers/health-api && npm test`
Expected: FAIL — `oauthRoutes` not found.

- [ ] **Step 3: Implement OAuth routes**

Migrate logic from `workers/whoop-oauth/index.ts` into Hono route format:

```typescript
// src/routes/oauth.ts
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
```

- [ ] **Step 4: Register OAuth routes in index.ts**

Add to `src/index.ts`:

```typescript
import { oauthRoutes } from './routes/oauth';

// After auth middleware setup:
app.route('/v1/auth/whoop', oauthRoutes);
```

- [ ] **Step 5: Run tests**

Run: `cd workers/health-api && npm test`
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add workers/health-api/src/routes/oauth.ts workers/health-api/test/routes/oauth.test.ts workers/health-api/src/index.ts
git commit -m "feat: migrate OAuth routes to /v1/auth/whoop/*"
```

---

### Task 4: Table allowlist

**Files:**
- Create: `workers/health-api/src/lib/tables.ts`
- Create: `workers/health-api/test/lib/tables.test.ts`

- [ ] **Step 1: Write allowlist tests**

```typescript
// test/lib/tables.test.ts
import { describe, it, expect } from 'vitest';
import { ALLOWED_TABLES, validateRecords, sanitizeRecord } from '../../src/lib/tables';

describe('table allowlist', () => {
  it('rejects unknown table names', () => {
    expect(ALLOWED_TABLES['fake_table' as keyof typeof ALLOWED_TABLES]).toBeUndefined();
  });

  it('accepts known table names', () => {
    expect(ALLOWED_TABLES.sessions).toBeDefined();
    expect(ALLOWED_TABLES.set_logs).toBeDefined();
    expect(ALLOWED_TABLES.daily_health).toBeDefined();
  });

  it('validates required columns', () => {
    const result = validateRecords('sessions', [{ id: 'abc' }]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('date');
  });

  it('passes valid records', () => {
    const result = validateRecords('sessions', [
      { id: 'abc', date: '2026-03-22', updated_at: '2026-03-22T00:00:00Z' },
    ]);
    expect(result.valid).toBe(true);
  });

  it('strips unknown columns', () => {
    const record = { id: 'abc', date: '2026-03-22', updated_at: 'now', evil_col: 'drop table' };
    const sanitized = sanitizeRecord('sessions', record);
    expect(sanitized).not.toHaveProperty('evil_col');
    expect(sanitized).toHaveProperty('id');
    expect(sanitized).toHaveProperty('date');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd workers/health-api && npm test`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement table allowlist**

```typescript
// src/lib/tables.ts
export const ALLOWED_TABLES = {
  sessions: {
    columns: ['id', 'program_id', 'program_name', 'name', 'block_name',
              'week_number', 'day_index', 'scheduled_day', 'actual_day',
              'date', 'status', 'started_at', 'completed_at', 'sleep',
              'soreness', 'energy', 'notes', 'updated_at', 'source_app'],
    required: ['id', 'date', 'updated_at'],
  },
  set_logs: {
    columns: ['id', 'session_id', 'exercise_id', 'exercise_name', 'set_number',
              'target_weight', 'actual_weight', 'target_reps', 'actual_reps',
              'target_distance', 'actual_distance', 'target_duration', 'actual_duration',
              'target_time', 'actual_time', 'status', 'rpe', 'timestamp',
              'is_adhoc', 'updated_at'],
    required: ['id', 'session_id', 'exercise_name', 'updated_at'],
  },
  exercise_notes: {
    columns: ['id', 'session_id', 'exercise_id', 'note', 'created_at', 'updated_at'],
    required: ['id', 'session_id', 'exercise_id', 'updated_at'],
  },
  exercises: {
    columns: ['id', 'name', 'type', 'muscle_groups', 'alternatives', 'input_fields', 'updated_at'],
    required: ['id', 'name', 'updated_at'],
  },
  programs: {
    columns: ['id', 'name', 'status', 'duration_weeks', 'definition_json',
              'one_rm_values', 'started_at', 'completed_at', 'updated_at'],
    required: ['id', 'name', 'updated_at'],
  },
  run_logs: {
    columns: ['id', 'session_id', 'date', 'duration_min', 'distance',
              'pain_level', 'pain_level_24h', 'included_pickups', 'notes', 'updated_at'],
    required: ['id', 'date', 'updated_at'],
  },
  personal_records: {
    columns: ['id', 'exercise_id', 'record_type', 'rep_count', 'value',
              'previous_value', 'session_id', 'date', 'updated_at'],
    required: ['id', 'exercise_id', 'record_type', 'value', 'session_id', 'date', 'updated_at'],
  },
  session_protocols: {
    columns: ['id', 'session_id', 'type', 'protocol_key', 'protocol_name',
              'completed', 'sort_order', 'updated_at'],
    required: ['id', 'session_id', 'type', 'protocol_name', 'updated_at'],
  },
  daily_health: {
    columns: ['id', 'date', 'source', 'recovery_score', 'sleep_score',
              'hrv_rmssd', 'resting_hr', 'strain_score', 'sleep_duration_min',
              'spo2', 'skin_temp_celsius', 'respiratory_rate', 'synced_at', 'updated_at'],
    required: ['id', 'date', 'source', 'updated_at'],
  },
  body_weights: {
    columns: ['id', 'date', 'weight', 'unit', 'updated_at'],
    required: ['id', 'date', 'weight', 'updated_at'],
  },
  body_comp_scans: {
    columns: ['id', 'date', 'weight', 'skeletal_muscle_mass', 'body_fat_percent',
              'bmi', 'body_water_percent', 'notes', 'updated_at'],
    required: ['id', 'date', 'updated_at'],
  },
} as const;

export type TableName = keyof typeof ALLOWED_TABLES;

export function isAllowedTable(name: string): name is TableName {
  return name in ALLOWED_TABLES;
}

export function validateRecords(
  table: TableName,
  records: Record<string, unknown>[]
): { valid: true } | { valid: false; error: string } {
  const { required } = ALLOWED_TABLES[table];
  for (let i = 0; i < records.length; i++) {
    for (const col of required) {
      if (records[i][col] === undefined || records[i][col] === null) {
        return { valid: false, error: `Missing required column: ${col} in records[${i}]` };
      }
    }
  }
  return { valid: true };
}

export function sanitizeRecord(
  table: TableName,
  record: Record<string, unknown>
): Record<string, unknown> {
  const { columns } = ALLOWED_TABLES[table];
  const sanitized: Record<string, unknown> = {};
  for (const col of columns) {
    if (record[col] !== undefined) {
      sanitized[col] = record[col];
    }
  }
  return sanitized;
}
```

- [ ] **Step 4: Run tests**

Run: `cd workers/health-api && npm test`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add workers/health-api/src/lib/tables.ts workers/health-api/test/lib/tables.test.ts
git commit -m "feat: add table allowlist with validation and sanitization"
```

---

### Task 5: D1 schema

**Files:**
- Create: `workers/health-api/src/db/schema.sql`

- [ ] **Step 1: Create schema.sql**

Copy the full SQL schema from the spec (`docs/superpowers/specs/2026-03-22-health-api-d1-design.md`, lines 62-261) — all CREATE TABLE and CREATE INDEX statements.

- [ ] **Step 2: Verify SQL syntax**

Run: `sqlite3 :memory: < workers/health-api/src/db/schema.sql && echo "Schema OK"`
Expected: "Schema OK" with no errors.

- [ ] **Step 3: Commit**

```bash
git add workers/health-api/src/db/schema.sql
git commit -m "feat: add D1 schema with all tables and indexes"
```

---

### Task 6: Query builders (upsert + select-since)

**Files:**
- Create: `workers/health-api/src/db/queries.ts`
- Create: `workers/health-api/test/db/queries.test.ts`

- [ ] **Step 1: Write query builder tests**

```typescript
// test/db/queries.test.ts
import { describe, it, expect } from 'vitest';
import { buildUpsertSQL, buildSelectSQL } from '../../src/db/queries';

describe('buildUpsertSQL', () => {
  it('generates ON CONFLICT DO UPDATE statement', () => {
    const statements = buildUpsertSQL('sessions', [
      { id: 'abc', date: '2026-03-22', updated_at: 'now' },
    ]);
    expect(statements).toHaveLength(1);
    const { sql, params } = statements[0];
    expect(sql).toContain('INSERT INTO sessions');
    expect(sql).toContain('ON CONFLICT(id) DO UPDATE SET');
    expect(sql).toContain('date=excluded.date');
    expect(params).toContain('abc');
    expect(params).toContain('2026-03-22');
  });

  it('returns one statement per record', () => {
    const statements = buildUpsertSQL('sessions', [
      { id: '1', date: 'd1', updated_at: 'now' },
      { id: '2', date: 'd2', updated_at: 'now' },
    ]);
    expect(statements).toHaveLength(2);
    expect(statements[0].params).toContain('1');
    expect(statements[1].params).toContain('2');
  });
});

describe('buildSelectSQL', () => {
  it('generates basic SELECT', () => {
    const { sql, params } = buildSelectSQL('sessions', {});
    expect(sql).toContain('SELECT * FROM sessions');
    expect(sql).toContain('LIMIT');
  });

  it('filters by since', () => {
    const { sql, params } = buildSelectSQL('sessions', { since: '2026-03-01T00:00:00Z' });
    expect(sql).toContain('WHERE updated_at > ?');
    expect(params).toContain('2026-03-01T00:00:00Z');
  });

  it('respects limit and offset', () => {
    const { sql } = buildSelectSQL('sessions', { limit: 50, offset: 10 });
    expect(sql).toContain('LIMIT 50');
    expect(sql).toContain('OFFSET 10');
  });

  it('caps limit at 1000', () => {
    const { sql } = buildSelectSQL('sessions', { limit: 5000 });
    expect(sql).toContain('LIMIT 1000');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd workers/health-api && npm test`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement query builders**

```typescript
// src/db/queries.ts
import type { TableName } from '../lib/tables';

const MAX_LIMIT = 1000;
const DEFAULT_LIMIT = 100;

export function buildUpsertSQL(
  table: TableName,
  records: Record<string, unknown>[]
): { sql: string; params: unknown[] }[] {
  // Return array of { sql, params } — one per record to stay within D1 param limits.
  // Caller should use db.batch() to execute them together.
  return records.map((record) => {
    const columns = Object.keys(record);
    const placeholders = columns.map(() => '?').join(', ');
    const updateSet = columns
      .filter((col) => col !== 'id')
      .map((col) => `${col}=excluded.${col}`)
      .join(', ');

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${updateSet}`;
    const params = columns.map((col) => record[col]);
    return { sql, params };
  });
}

export interface SelectOptions {
  since?: string;
  limit?: number;
  offset?: number;
}

export function buildSelectSQL(
  table: TableName,
  options: SelectOptions
): { sql: string; countSql: string; params: unknown[] } {
  const { since, limit = DEFAULT_LIMIT, offset = 0 } = options;
  const cappedLimit = Math.min(limit, MAX_LIMIT);
  const params: unknown[] = [];

  let where = '';
  if (since) {
    where = 'WHERE updated_at > ?';
    params.push(since);
  }

  const sql = `SELECT * FROM ${table} ${where} ORDER BY updated_at ASC LIMIT ${cappedLimit} OFFSET ${offset}`;
  const countSql = `SELECT COUNT(*) as total FROM ${table} ${where}`;

  return { sql, countSql, params };
}
```

- [ ] **Step 4: Run tests**

Run: `cd workers/health-api && npm test`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add workers/health-api/src/db/queries.ts workers/health-api/test/db/queries.test.ts
git commit -m "feat: add generic upsert and select-since query builders"
```

---

### Task 7: Sync routes (POST + GET /v1/:table)

**Files:**
- Create: `workers/health-api/src/routes/sync.ts`
- Create: `workers/health-api/test/routes/sync.test.ts`
- Modify: `workers/health-api/src/index.ts`

- [ ] **Step 1: Write sync route tests**

```typescript
// test/routes/sync.test.ts
import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { syncRoutes } from '../../src/routes/sync';
import { authMiddleware } from '../../src/middleware/auth';

// Note: These tests use Hono's test request with a mock env.
// D1 database calls need @cloudflare/vitest-pool-workers for full integration.
// For unit tests, we test validation/rejection paths that don't hit D1.

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd workers/health-api && npm test`
Expected: FAIL — `syncRoutes` not found.

- [ ] **Step 3: Implement sync routes**

```typescript
// src/routes/sync.ts
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
```

- [ ] **Step 4: Register sync routes in index.ts**

Add to `src/index.ts`:

```typescript
import { syncRoutes } from './routes/sync';

// After OAuth route registration:
app.route('/v1', syncRoutes);
```

- [ ] **Step 5: Run tests**

Run: `cd workers/health-api && npm test`
Expected: All tests PASS (validation tests pass; D1 integration tests deferred to manual testing with `wrangler dev`).

- [ ] **Step 6: Commit**

```bash
git add workers/health-api/src/routes/sync.ts workers/health-api/test/routes/sync.test.ts workers/health-api/src/index.ts
git commit -m "feat: add sync push/pull routes with allowlist validation"
```

---

### Task 8: Sentry integration

**Files:**
- Modify: `workers/health-api/package.json`
- Modify: `workers/health-api/src/index.ts`

- [ ] **Step 1: Install Sentry**

Run: `cd workers/health-api && npm install @sentry/cloudflare`

- [ ] **Step 2: Wrap the Hono app with Sentry**

Update `src/index.ts` to wrap the export:

```typescript
import { withSentry } from '@sentry/cloudflare';

// ... existing app setup ...

export default withSentry(
  (env) => ({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 1.0,
  }),
  app
);
```

- [ ] **Step 3: Run tests to make sure nothing broke**

Run: `cd workers/health-api && npm test`
Expected: All tests still PASS.

- [ ] **Step 4: Commit**

```bash
git add workers/health-api/package.json workers/health-api/package-lock.json workers/health-api/src/index.ts
git commit -m "feat: add Sentry error tracking to health API"
```

---

### Task 9: Create D1 database and deploy

This task requires Cloudflare CLI access and manual verification.

- [ ] **Step 1: Create the D1 database**

Run: `cd workers/health-api && npx wrangler d1 create apex-health-db`

Copy the `database_id` from the output.

- [ ] **Step 2: Update wrangler.toml with D1 binding**

Uncomment and fill in the D1 section in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "apex-health-db"
database_id = "<paste-id-here>"
```

- [ ] **Step 3: Apply the schema to D1**

Run: `cd workers/health-api && npx wrangler d1 execute apex-health-db --remote --file=./src/db/schema.sql`

- [ ] **Step 4: Copy secrets from old Worker**

Run:
```bash
cd workers/health-api
echo "<your-whoop-client-id>" | npx wrangler secret put WHOOP_CLIENT_ID
echo "<your-whoop-client-secret>" | npx wrangler secret put WHOOP_CLIENT_SECRET
echo "<your-api-key>" | npx wrangler secret put APP_API_KEY
echo "<your-sentry-dsn>" | npx wrangler secret put SENTRY_DSN
```

(Get the actual values from the Cloudflare dashboard for the old `apex-whoop-oauth` Worker, or from the Sentry project settings for the DSN.)

- [ ] **Step 5: Deploy**

Run: `cd workers/health-api && npx wrangler deploy`

Note the new Worker URL from the output.

- [ ] **Step 6: Smoke test**

```bash
# Health check (no auth)
curl https://<new-worker-url>/health

# Auth check
curl -H "X-API-Key: <your-key>" https://<new-worker-url>/v1/sessions

# Push test
curl -X POST -H "X-API-Key: <your-key>" -H "Content-Type: application/json" \
  -d '{"app_id":"test","records":[{"id":"test-1","date":"2026-03-22","updated_at":"2026-03-22T00:00:00Z"}]}' \
  https://<new-worker-url>/v1/sessions

# Pull test
curl -H "X-API-Key: <your-key>" "https://<new-worker-url>/v1/sessions?limit=10"

# OAuth validation test (should return 400 missing code)
curl -X POST -H "X-API-Key: <your-key>" -H "Content-Type: application/json" \
  -d '{}' \
  https://<new-worker-url>/v1/auth/whoop/token
```

- [ ] **Step 7: Commit wrangler.toml with D1 binding**

```bash
git add workers/health-api/wrangler.toml
git commit -m "chore: add D1 database binding to wrangler.toml"
```

---

### Task 10: Update APEX to use new Worker

**Files:**
- Modify: `src/health/config.ts`
- Modify: `src/health/providers/whoop.ts` (if OAuth paths are hardcoded)

- [ ] **Step 1: Check current config**

Read `src/health/config.ts` and `src/health/providers/whoop.ts` for the current Worker URL and OAuth paths.

- [ ] **Step 2: Update Worker URL and OAuth paths**

Update `src/health/config.ts` with:
- New Worker URL (from deploy output in Task 9)
- OAuth paths changed from `/oauth/token` → `/v1/auth/whoop/token` and `/oauth/refresh` → `/v1/auth/whoop/refresh`

- [ ] **Step 3: Run APEX tests to make sure nothing broke**

Run: `npm test` (from project root)
Expected: All existing tests PASS.

- [ ] **Step 4: Build and test on device**

Run: `npm run device`
Verify: Open app → WHOOP health data still loads → Settings shows "Connected"

- [ ] **Step 5: Commit**

```bash
git add src/health/config.ts src/health/providers/whoop.ts
git commit -m "chore: update APEX to use new health-api Worker URL and OAuth paths"
```

---

### Task 11: Clean up old Worker

- [ ] **Step 1: Verify new Worker is fully working**

Confirm: APEX app connects to WHOOP via new Worker. Health data loads. Sync endpoints respond.

- [ ] **Step 2: Delete old Worker**

Run: `cd workers/health-api && npx wrangler delete --name apex-whoop-oauth`

- [ ] **Step 3: Remove old Worker directory**

Run: `rm -rf workers/whoop-oauth`

- [ ] **Step 4: Commit**

```bash
git rm -r workers/whoop-oauth/
git commit -m "chore: remove old whoop-oauth Worker (replaced by health-api)"
```
