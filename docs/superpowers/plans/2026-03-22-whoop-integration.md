# Whoop Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Whoop recovery/sleep/health data into APEX via a vendor-agnostic health provider system, backed by a Cloudflare Worker OAuth proxy.

**Architecture:** Three-layer design — HealthProvider interface (Whoop is first implementation) → HealthService orchestrator → vendor-agnostic UI components. Data stored in a `daily_health` SQLite table. OAuth token exchange proxied through a Cloudflare Worker to keep the Client Secret server-side. Tokens stored in `expo-secure-store`.

**Tech Stack:** Expo SDK 54, expo-secure-store, expo-auth-session, expo-sqlite, Cloudflare Workers (Wrangler CLI), TypeScript

**Spec:** `docs/superpowers/specs/2026-03-22-whoop-integration-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/types/health.ts` | DailyHealthData type, HealthProvider interface, Whoop API response types |
| `src/db/health.ts` | SQLite queries for daily_health table (upsert, getForDate, getTrend, getGaps) |
| `src/health/healthService.ts` | Orchestrator — sync, fetch, backfill, provider management |
| `src/health/providers/whoop.ts` | Whoop API client implementing HealthProvider interface |
| `src/health/providers/index.ts` | Provider registry and active provider lookup |
| `src/components/HealthCard.tsx` | Reusable recovery/health metrics display card |
| `src/hooks/useHealthData.ts` | React hook for health data access (sync on mount, provide data) |
| `workers/whoop-oauth/index.ts` | Cloudflare Worker — OAuth token exchange proxy |
| `workers/whoop-oauth/wrangler.toml` | Worker configuration |
| `__tests__/db/health.test.ts` | DB layer tests |
| `__tests__/health/healthService.test.ts` | Service layer tests |
| `__tests__/health/providers/whoop.test.ts` | Whoop provider tests |

### Modified Files
| File | Change |
|------|--------|
| `src/db/schema.ts` | Bump SCHEMA_VERSION to 11, add daily_health CREATE TABLE |
| `src/db/database.ts` | Add migration block for version 11 |
| `src/db/index.ts` | Export new health DB functions |
| `src/types/training.ts` | No changes — health types live in separate file |
| `app/settings.tsx` | Replace "Coming Soon" with connect/disconnect flow |
| `app/(tabs)/index.tsx` | Add HealthCard to home dashboard |
| `app/session/[id].tsx` | Add HealthCard to past session detail |
| `src/hooks/useWorkoutSession.ts` | Trigger health sync on session start |
| `app.json` | Add expo-secure-store and expo-auth-session plugins |
| `package.json` | Add new dependencies |

---

## Task 1: Install Dependencies & Configure

**Files:**
- Modify: `package.json`
- Modify: `app.json` (plugins array, line 21-25)

- [ ] **Step 1: Install new packages**

```bash
npx expo install expo-secure-store expo-auth-session expo-crypto expo-web-browser
```

(`expo-crypto` and `expo-web-browser` are peer deps of `expo-auth-session`)

- [ ] **Step 2: Add plugins to app.json**

In `app.json`, add to the `plugins` array (currently has expo-router, expo-sqlite, expo-asset):

```json
"plugins": [
  "expo-router",
  "expo-sqlite",
  "expo-asset",
  "expo-secure-store"
]
```

- [ ] **Step 3: Verify config is valid**

```bash
npx expo config --type public
```

Expected: No errors, plugins listed.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json app.json
git commit -m "chore: add expo-secure-store and expo-auth-session dependencies (#43)"
```

---

## Task 2: Types — Health Data & Provider Interface

**Files:**
- Create: `src/types/health.ts`

- [ ] **Step 1: Create health type definitions**

```typescript
// src/types/health.ts

/**
 * Vendor-agnostic daily health data.
 * All metrics are optional — different providers supply different fields.
 */
export interface DailyHealthData {
  date: string;             // 'YYYY-MM-DD'
  source: string;           // 'whoop', 'garmin', 'manual'

  // Core metrics
  recoveryScore?: number;   // 0-100
  sleepScore?: number;      // provider's sleep quality score
  hrvRmssd?: number;        // HRV in ms (RMSSD method)
  restingHr?: number;       // bpm

  // Secondary metrics
  strainScore?: number;     // 0-21 (Whoop scale)
  sleepDurationMin?: number;// total sleep in minutes
  spo2?: number;            // blood oxygen percentage (0-100)
  skinTempCelsius?: number; // skin temperature
  respiratoryRate?: number; // breaths per minute

  // Metadata
  rawJson?: string;         // full API response for future use
  syncedAt: string;         // ISO timestamp
}

/**
 * Stored row from daily_health table.
 */
export interface DailyHealthRow extends DailyHealthData {
  id: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Vendor-agnostic health data provider.
 * Whoop is the first implementation; Garmin, Oura, etc. can follow.
 */
export interface HealthProvider {
  id: string;               // 'whoop', 'garmin'
  name: string;             // 'WHOOP', 'Garmin'

  // Auth
  authorize(): Promise<void>;
  isConnected(): Promise<boolean>;
  disconnect(): Promise<void>;

  // Data
  fetchDaily(date: string): Promise<DailyHealthData | null>;
  fetchRange(start: string, end: string): Promise<DailyHealthData[]>;
}

/**
 * Whoop API response types (for type-safe parsing).
 */
export interface WhoopCycleResponse {
  id: number;
  user_id: number;
  start: string;
  end: string;
  score: {
    strain: number;
    kilojoule: number;
    average_heart_rate: number;
    max_heart_rate: number;
  } | null;
}

export interface WhoopRecoveryResponse {
  cycle_id: number;
  sleep_id: number;
  user_id: number;
  score_state: 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE';
  score: {
    user_calibrating: boolean;
    recovery_score: number;
    resting_heart_rate: number;
    hrv_rmssd_milli: number;
    spo2_percentage: number;
    skin_temp_celsius: number;
  } | null;
}

export interface WhoopSleepResponse {
  id: number;
  user_id: number;
  start: string;
  end: string;
  score_state: 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE';
  score: {
    sleep_performance_percentage: number;
    respiratory_rate: number;
    total_in_bed_time_milli: number;
    total_awake_time_milli: number;
    total_light_sleep_time_milli: number;
    total_slow_wave_sleep_time_milli: number;
    total_rem_sleep_time_milli: number;
    sleep_cycle_count: number;
    disturbance_count: number;
  } | null;
}

export interface WhoopTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface WhoopPaginatedResponse<T> {
  records: T[];
  next_token: string | null;
}
```

- [ ] **Step 2: Verify types compile**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/health.ts
git commit -m "feat: add health data types and HealthProvider interface (#43)"
```

---

## Task 3: Database — Schema Migration & Health Queries

**Files:**
- Modify: `src/db/schema.ts` (line 6: SCHEMA_VERSION)
- Modify: `src/db/database.ts` (add migration block after line ~145)
- Create: `src/db/health.ts`
- Modify: `src/db/index.ts` (add exports)
- Create: `__tests__/db/health.test.ts`

- [ ] **Step 1: Write failing tests for health DB functions**

Create `__tests__/db/health.test.ts`:

```typescript
import { getDatabase, generateId } from '../../src/db/database';
import {
  upsertDailyHealth,
  getDailyHealth,
  getDailyHealthRange,
  getMissingDates,
} from '../../src/db/health';
import { DailyHealthData } from '../../src/types/health';

jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn(),
  generateId: jest.fn(() => 'test-id-123'),
}));

function createMockDb() {
  return {
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
    execAsync: jest.fn().mockResolvedValue(undefined),
  };
}

const sampleHealth: DailyHealthData = {
  date: '2026-03-22',
  source: 'whoop',
  recoveryScore: 78,
  sleepScore: 85,
  hrvRmssd: 45.2,
  restingHr: 52,
  strainScore: 12.5,
  sleepDurationMin: 445,
  spo2: 97.5,
  skinTempCelsius: 33.1,
  respiratoryRate: 15.2,
  rawJson: '{"test": true}',
  syncedAt: '2026-03-22T08:00:00Z',
};

describe('health DB', () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  describe('upsertDailyHealth', () => {
    it('inserts health data with correct SQL and parameters', async () => {
      await upsertDailyHealth(sampleHealth);
      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('INSERT INTO daily_health');
      expect(params).toContain('2026-03-22');
      expect(params).toContain('whoop');
      expect(params).toContain(78);
      expect(params).toContain(45.2);
    });
  });

  describe('getDailyHealth', () => {
    it('returns null when no data exists', async () => {
      const result = await getDailyHealth('2026-03-22');
      expect(result).toBeNull();
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['2026-03-22']
      );
    });

    it('returns mapped data when row exists', async () => {
      mockDb.getFirstAsync.mockResolvedValue({
        id: 1,
        date: '2026-03-22',
        source: 'whoop',
        recovery_score: 78,
        sleep_score: 85,
        hrv_rmssd: 45.2,
        resting_hr: 52,
        strain_score: 12.5,
        sleep_duration_min: 445,
        spo2: 97.5,
        skin_temp_celsius: 33.1,
        respiratory_rate: 15.2,
        synced_at: '2026-03-22T08:00:00Z',
        created_at: '2026-03-22T08:00:00Z',
        updated_at: '2026-03-22T08:00:00Z',
      });
      const result = await getDailyHealth('2026-03-22');
      expect(result).not.toBeNull();
      expect(result!.recoveryScore).toBe(78);
      expect(result!.hrvRmssd).toBe(45.2);
    });
  });

  describe('getDailyHealthRange', () => {
    it('queries with date range', async () => {
      await getDailyHealthRange('2026-03-01', '2026-03-22');
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('BETWEEN'),
        ['2026-03-01', '2026-03-22']
      );
    });
  });

  describe('getMissingDates', () => {
    it('returns dates not in daily_health', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        { date: '2026-03-20' },
        { date: '2026-03-22' },
      ]);
      const result = await getMissingDates('2026-03-20', '2026-03-22');
      expect(result).toContain('2026-03-21');
      expect(result).not.toContain('2026-03-20');
      expect(result).not.toContain('2026-03-22');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern="__tests__/db/health" --no-coverage
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Bump SCHEMA_VERSION and add CREATE TABLE**

In `src/db/schema.ts`, change line 6:

```typescript
export const SCHEMA_VERSION = 11;
```

Add to the `CREATE_TABLES` string (after the last CREATE TABLE, before the closing backtick):

```sql
CREATE TABLE IF NOT EXISTS daily_health (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  recovery_score REAL,
  sleep_score REAL,
  hrv_rmssd REAL,
  resting_hr REAL,
  strain_score REAL,
  sleep_duration_min INTEGER,
  spo2 REAL,
  skin_temp_celsius REAL,
  respiratory_rate REAL,
  raw_json TEXT,
  synced_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_daily_health_date ON daily_health(date);
```

Also add `DELETE FROM daily_health;` to the `clearAllData()` function in `src/db/database.ts` (line ~191, after the other DELETE statements).

- [ ] **Step 4: Add migration block in database.ts**

In `src/db/database.ts`, find the last migration block (currently `if (currentVersion < 10)`) and add after it:

```typescript
if (currentVersion < 11) {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS daily_health (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        source TEXT NOT NULL,
        recovery_score REAL,
        sleep_score REAL,
        hrv_rmssd REAL,
        resting_hr REAL,
        strain_score REAL,
        sleep_duration_min INTEGER,
        spo2 REAL,
        skin_temp_celsius REAL,
        respiratory_rate REAL,
        raw_json TEXT,
        synced_at TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_daily_health_date ON daily_health(date);
    `);
  } catch (e) {
    console.warn('Migration to v11 warning:', e);
  }
}
```

- [ ] **Step 5: Implement health DB functions**

Create `src/db/health.ts`:

```typescript
import { getDatabase } from './database';
import { DailyHealthData, DailyHealthRow } from '../types/health';

/**
 * Upsert a day's health data. Uses ON CONFLICT to preserve created_at on updates.
 */
export async function upsertDailyHealth(data: DailyHealthData): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO daily_health
      (date, source, recovery_score, sleep_score, hrv_rmssd, resting_hr,
       strain_score, sleep_duration_min, spo2, skin_temp_celsius,
       respiratory_rate, raw_json, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       source = excluded.source,
       recovery_score = excluded.recovery_score,
       sleep_score = excluded.sleep_score,
       hrv_rmssd = excluded.hrv_rmssd,
       resting_hr = excluded.resting_hr,
       strain_score = excluded.strain_score,
       sleep_duration_min = excluded.sleep_duration_min,
       spo2 = excluded.spo2,
       skin_temp_celsius = excluded.skin_temp_celsius,
       respiratory_rate = excluded.respiratory_rate,
       raw_json = excluded.raw_json,
       synced_at = excluded.synced_at,
       updated_at = datetime('now')`,
    [
      data.date,
      data.source,
      data.recoveryScore ?? null,
      data.sleepScore ?? null,
      data.hrvRmssd ?? null,
      data.restingHr ?? null,
      data.strainScore ?? null,
      data.sleepDurationMin ?? null,
      data.spo2 ?? null,
      data.skinTempCelsius ?? null,
      data.respiratoryRate ?? null,
      data.rawJson ?? null,
      data.syncedAt,
    ]
  );
}

function mapRow(row: any): DailyHealthRow {
  return {
    id: row.id,
    date: row.date,
    source: row.source,
    recoveryScore: row.recovery_score,
    sleepScore: row.sleep_score,
    hrvRmssd: row.hrv_rmssd,
    restingHr: row.resting_hr,
    strainScore: row.strain_score,
    sleepDurationMin: row.sleep_duration_min,
    spo2: row.spo2,
    skinTempCelsius: row.skin_temp_celsius,
    respiratoryRate: row.respiratory_rate,
    syncedAt: row.synced_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get health data for a specific date. Returns null if no data.
 */
export async function getDailyHealth(date: string): Promise<DailyHealthRow | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    `SELECT id, date, source, recovery_score, sleep_score, hrv_rmssd,
            resting_hr, strain_score, sleep_duration_min, spo2,
            skin_temp_celsius, respiratory_rate, synced_at,
            created_at, updated_at
     FROM daily_health WHERE date = ?`,
    [date]
  );
  return row ? mapRow(row) : null;
}

/**
 * Get health data for a date range (inclusive).
 */
export async function getDailyHealthRange(
  start: string,
  end: string
): Promise<DailyHealthRow[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    `SELECT id, date, source, recovery_score, sleep_score, hrv_rmssd,
            resting_hr, strain_score, sleep_duration_min, spo2,
            skin_temp_celsius, respiratory_rate, synced_at,
            created_at, updated_at
     FROM daily_health WHERE date BETWEEN ? AND ? ORDER BY date ASC`,
    [start, end]
  );
  return rows.map(mapRow);
}

/**
 * Find dates in a range that have no health data (for backfill).
 */
export async function getMissingDates(
  start: string,
  end: string
): Promise<string[]> {
  const db = await getDatabase();
  const existing = await db.getAllAsync(
    `SELECT date FROM daily_health WHERE date BETWEEN ? AND ? ORDER BY date ASC`,
    [start, end]
  );
  const existingSet = new Set((existing as any[]).map((r) => r.date));

  const missing: string[] = [];
  const current = new Date(start + 'T00:00:00');
  const endDate = new Date(end + 'T00:00:00');
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    if (!existingSet.has(dateStr)) {
      missing.push(dateStr);
    }
    current.setDate(current.getDate() + 1);
  }
  return missing;
}
```

- [ ] **Step 6: Export from db/index.ts**

Add to `src/db/index.ts`:

```typescript
export {
  upsertDailyHealth,
  getDailyHealth,
  getDailyHealthRange,
  getMissingDates,
} from './health';
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="__tests__/db/health" --no-coverage
```

Expected: All tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/db/schema.ts src/db/database.ts src/db/health.ts src/db/index.ts src/types/health.ts __tests__/db/health.test.ts
git commit -m "feat: add daily_health table with schema migration and DB queries (#43)"
```

---

## Task 4: Cloudflare Worker — OAuth Proxy

**Files:**
- Create: `workers/whoop-oauth/index.ts`
- Create: `workers/whoop-oauth/wrangler.toml`
- Create: `workers/whoop-oauth/package.json`

- [ ] **Step 1: Create the worker directory**

```bash
mkdir -p workers/whoop-oauth
```

- [ ] **Step 2: Create wrangler.toml**

Create `workers/whoop-oauth/wrangler.toml`:

```toml
name = "apex-whoop-oauth"
main = "index.ts"
compatibility_date = "2024-12-01"

[vars]
WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token"
```

Note: `WHOOP_CLIENT_ID` and `WHOOP_CLIENT_SECRET` are set via `wrangler secret put` — never in config files.

- [ ] **Step 3: Create package.json**

Create `workers/whoop-oauth/package.json`:

```json
{
  "name": "apex-whoop-oauth",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy"
  },
  "devDependencies": {
    "wrangler": "^3.0.0"
  }
}
```

- [ ] **Step 4: Create the Worker**

Create `workers/whoop-oauth/index.ts`:

```typescript
interface Env {
  WHOOP_CLIENT_ID: string;
  WHOOP_CLIENT_SECRET: string;
  WHOOP_TOKEN_URL: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
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
  const body = await request.json<{ code: string; redirect_uri: string }>();

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
  const body = await request.json<{ refresh_token: string }>();

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
```

- [ ] **Step 5: Install worker dependencies and test locally**

```bash
cd workers/whoop-oauth && npm install && npx wrangler dev --test-scheduled
```

Verify the worker starts without errors. Test with curl:

```bash
curl -X POST http://localhost:8787/oauth/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "test", "redirect_uri": "apex://oauth"}'
```

Expected: 400 or error from Whoop (since "test" is not a real code) — but the worker responds, proving routing works.

- [ ] **Step 6: Commit**

```bash
git add workers/
git commit -m "feat: add Cloudflare Worker for Whoop OAuth token proxy (#43)"
```

- [ ] **Step 7: Deploy (requires user action)**

> **User action required:** Register a Whoop developer app at developer.whoop.com, then:
>
> ```bash
> cd workers/whoop-oauth
> npx wrangler secret put WHOOP_CLIENT_ID
> npx wrangler secret put WHOOP_CLIENT_SECRET
> npx wrangler deploy
> ```
>
> Note the deployed URL (e.g., `https://apex-whoop-oauth.<your-subdomain>.workers.dev`). This URL is needed in Task 5.

---

## Task 5: Whoop Provider — OAuth & API Client

**Files:**
- Create: `src/health/providers/whoop.ts`
- Create: `src/health/providers/index.ts`
- Create: `__tests__/health/providers/whoop.test.ts`

- [ ] **Step 1: Write failing tests for Whoop provider**

Create `__tests__/health/providers/whoop.test.ts`:

```typescript
import { WhoopProvider } from '../../../src/health/providers/whoop';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('WhoopProvider', () => {
  let provider: WhoopProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new WhoopProvider('https://test-worker.example.com');
  });

  describe('isConnected', () => {
    it('returns false when no tokens stored', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
      expect(await provider.isConnected()).toBe(false);
    });

    it('returns true when access token exists', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('some-token');
      expect(await provider.isConnected()).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('clears all stored tokens', async () => {
      await provider.disconnect();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('whoop_access_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('whoop_refresh_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('whoop_token_expiry');
    });
  });

  describe('fetchDaily', () => {
    beforeEach(() => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        if (key === 'whoop_access_token') return 'valid-token';
        if (key === 'whoop_token_expiry') {
          return String(Date.now() + 3600000); // 1 hour from now
        }
        return null;
      });
    });

    it('fetches cycle + recovery + sleep and maps to DailyHealthData', async () => {
      // Mock cycle response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          records: [{
            id: 123,
            start: '2026-03-22T00:00:00Z',
            end: '2026-03-22T23:59:59Z',
            score: { strain: 12.5, kilojoule: 2000, average_heart_rate: 65, max_heart_rate: 180 },
          }],
          next_token: null,
        }),
      });

      // Mock recovery response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          records: [{
            cycle_id: 123,
            score_state: 'SCORED',
            score: {
              recovery_score: 78,
              resting_heart_rate: 52,
              hrv_rmssd_milli: 45.2,
              spo2_percentage: 97.5,
              skin_temp_celsius: 33.1,
            },
          }],
          next_token: null,
        }),
      });

      // Mock sleep response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          records: [{
            id: 456,
            start: '2026-03-21T22:00:00Z',
            end: '2026-03-22T06:30:00Z',
            score_state: 'SCORED',
            score: {
              sleep_performance_percentage: 85,
              respiratory_rate: 15.2,
              total_in_bed_time_milli: 30600000,
              total_awake_time_milli: 1800000,
              total_light_sleep_time_milli: 10800000,
              total_slow_wave_sleep_time_milli: 7200000,
              total_rem_sleep_time_milli: 7200000,
              sleep_cycle_count: 5,
              disturbance_count: 2,
            },
          }],
          next_token: null,
        }),
      });

      const result = await provider.fetchDaily('2026-03-22');

      expect(result).not.toBeNull();
      expect(result!.recoveryScore).toBe(78);
      expect(result!.sleepScore).toBe(85);
      expect(result!.hrvRmssd).toBe(45.2);
      expect(result!.restingHr).toBe(52);
      expect(result!.strainScore).toBe(12.5);
      expect(result!.spo2).toBe(97.5);
      expect(result!.skinTempCelsius).toBe(33.1);
      expect(result!.respiratoryRate).toBe(15.2);
      expect(result!.source).toBe('whoop');
    });

    it('auto-refreshes expired token before fetching', async () => {
      // Token is expired
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        if (key === 'whoop_access_token') return 'expired-token';
        if (key === 'whoop_refresh_token') return 'valid-refresh';
        if (key === 'whoop_token_expiry') return String(Date.now() - 1000); // expired
        return null;
      });

      // Mock refresh response from CF Worker
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'new-token',
          refresh_token: 'new-refresh',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
      });

      // Mock cycle response (empty — just testing that refresh happened)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ records: [], next_token: null }),
      });

      await provider.fetchDaily('2026-03-22');

      // Verify refresh was called
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-worker.example.com/oauth/refresh',
        expect.objectContaining({ method: 'POST' })
      );
      // Verify new tokens were stored
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('whoop_access_token', 'new-token');
    });

    it('returns null when no cycle data for date', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ records: [], next_token: null }),
      });

      const result = await provider.fetchDaily('2026-03-22');
      expect(result).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern="__tests__/health/providers/whoop" --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement Whoop provider**

Create `src/health/providers/whoop.ts`:

```typescript
import * as SecureStore from 'expo-secure-store';
import {
  HealthProvider,
  DailyHealthData,
  WhoopCycleResponse,
  WhoopRecoveryResponse,
  WhoopSleepResponse,
  WhoopTokenResponse,
  WhoopPaginatedResponse,
} from '../../types/health';

const WHOOP_API = 'https://api.prod.whoop.com/developer';
const STORE_KEYS = {
  accessToken: 'whoop_access_token',
  refreshToken: 'whoop_refresh_token',
  tokenExpiry: 'whoop_token_expiry',
};

export class WhoopProvider implements HealthProvider {
  id = 'whoop';
  name = 'WHOOP';

  constructor(private workerUrl: string) {}

  // --- Auth ---

  async authorize(): Promise<void> {
    // Implemented in Task 6 (Settings UI) via expo-auth-session
    throw new Error('Use authorizeWithCode() after OAuth redirect');
  }

  /**
   * Exchange an authorization code for tokens via the CF Worker.
   */
  async authorizeWithCode(code: string, redirectUri: string): Promise<void> {
    const response = await fetch(`${this.workerUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    const tokens: WhoopTokenResponse = await response.json();
    await this.storeTokens(tokens);
  }

  async isConnected(): Promise<boolean> {
    const token = await SecureStore.getItemAsync(STORE_KEYS.accessToken);
    return token !== null;
  }

  async disconnect(): Promise<void> {
    await SecureStore.deleteItemAsync(STORE_KEYS.accessToken);
    await SecureStore.deleteItemAsync(STORE_KEYS.refreshToken);
    await SecureStore.deleteItemAsync(STORE_KEYS.tokenExpiry);
  }

  // --- Data ---

  async fetchDaily(date: string): Promise<DailyHealthData | null> {
    const token = await this.getValidToken();
    if (!token) return null;

    const startISO = `${date}T00:00:00.000Z`;
    const endISO = `${date}T23:59:59.999Z`;

    // Fetch cycle (contains strain)
    const cycles = await this.apiGet<WhoopPaginatedResponse<WhoopCycleResponse>>(
      token,
      `/v1/cycle?start=${startISO}&end=${endISO}&limit=1`
    );

    if (!cycles.records.length) return null;

    const cycle = cycles.records[0];

    // Fetch recovery (contains recovery score, HRV, RHR, SpO2, skin temp)
    const recoveries = await this.apiGet<WhoopPaginatedResponse<WhoopRecoveryResponse>>(
      token,
      `/v1/recovery?start=${startISO}&end=${endISO}&limit=1`
    );

    // Fetch sleep (contains sleep score, respiratory rate, duration)
    const sleeps = await this.apiGet<WhoopPaginatedResponse<WhoopSleepResponse>>(
      token,
      `/v1/sleep?start=${startISO}&end=${endISO}&limit=1`
    );

    const recovery = recoveries.records[0]?.score ?? null;
    const sleep = sleeps.records[0]?.score ?? null;

    // Calculate sleep duration: total in bed minus awake time
    let sleepDurationMin: number | undefined;
    if (sleep) {
      const totalSleepMs =
        sleep.total_light_sleep_time_milli +
        sleep.total_slow_wave_sleep_time_milli +
        sleep.total_rem_sleep_time_milli;
      sleepDurationMin = Math.round(totalSleepMs / 60000);
    }

    const rawJson = JSON.stringify({ cycle, recovery: recoveries.records[0], sleep: sleeps.records[0] });

    return {
      date,
      source: 'whoop',
      recoveryScore: recovery?.recovery_score,
      sleepScore: sleep?.sleep_performance_percentage,
      hrvRmssd: recovery?.hrv_rmssd_milli,
      restingHr: recovery?.resting_heart_rate,
      strainScore: cycle.score?.strain,
      sleepDurationMin: sleepDurationMin,
      spo2: recovery?.spo2_percentage,
      skinTempCelsius: recovery?.skin_temp_celsius,
      respiratoryRate: sleep?.respiratory_rate,
      rawJson,
      syncedAt: new Date().toISOString(),
    };
  }

  async fetchRange(start: string, end: string): Promise<DailyHealthData[]> {
    // Fetch day-by-day for simplicity. Whoop API pagination makes
    // bulk fetching more complex with minimal benefit at our volume.
    const results: DailyHealthData[] = [];
    const current = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');

    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const data = await this.fetchDaily(dateStr);
      if (data) results.push(data);
      current.setDate(current.getDate() + 1);
    }
    return results;
  }

  // --- Private helpers ---

  private async getValidToken(): Promise<string | null> {
    const expiry = await SecureStore.getItemAsync(STORE_KEYS.tokenExpiry);
    const accessToken = await SecureStore.getItemAsync(STORE_KEYS.accessToken);

    if (!accessToken) return null;

    // If token is expired or expiring in next 60s, refresh
    if (expiry && Number(expiry) < Date.now() + 60000) {
      const refreshed = await this.refreshToken();
      return refreshed;
    }

    return accessToken;
  }

  private async refreshToken(): Promise<string | null> {
    const refreshToken = await SecureStore.getItemAsync(STORE_KEYS.refreshToken);
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${this.workerUrl}/oauth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        // Refresh failed — token revoked, user needs to reconnect
        await this.disconnect();
        return null;
      }

      const tokens: WhoopTokenResponse = await response.json();
      await this.storeTokens(tokens);
      return tokens.access_token;
    } catch {
      return null;
    }
  }

  private async storeTokens(tokens: WhoopTokenResponse): Promise<void> {
    await SecureStore.setItemAsync(STORE_KEYS.accessToken, tokens.access_token);
    await SecureStore.setItemAsync(STORE_KEYS.refreshToken, tokens.refresh_token);
    await SecureStore.setItemAsync(
      STORE_KEYS.tokenExpiry,
      String(Date.now() + tokens.expires_in * 1000)
    );
  }

  private async apiGet<T>(token: string, path: string): Promise<T> {
    const response = await fetch(`${WHOOP_API}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Whoop API error: ${response.status} on ${path}`);
    }

    return response.json();
  }
}
```

- [ ] **Step 4: Create provider registry**

Create `src/health/config.ts` (worker URL config — update after deploying CF Worker in Task 4 Step 7):

```typescript
// Update this after deploying the Cloudflare Worker (Task 4 Step 7).
// e.g., 'https://apex-whoop-oauth.your-subdomain.workers.dev'
export const WHOOP_WORKER_URL = 'https://apex-whoop-oauth.CHANGEME.workers.dev';
```

Create `src/health/providers/index.ts`:

```typescript
import { HealthProvider } from '../../types/health';
import { WhoopProvider } from './whoop';
import { WHOOP_WORKER_URL } from '../config';

const providers: Record<string, HealthProvider> = {
  whoop: new WhoopProvider(WHOOP_WORKER_URL),
};

export function getProvider(id: string): HealthProvider | undefined {
  return providers[id];
}

export function getWhoopProvider(): WhoopProvider {
  return providers.whoop as WhoopProvider;
}
```

> **Important:** After deploying the CF Worker in Task 4 Step 7, update the URL in `src/health/config.ts` with the actual deployed URL and commit the change.

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="__tests__/health/providers/whoop" --no-coverage
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/health/ __tests__/health/
git commit -m "feat: add Whoop provider with OAuth and API client (#43)"
```

---

## Task 6: Health Service — Sync Orchestration

**Files:**
- Create: `src/health/healthService.ts`
- Create: `src/hooks/useHealthData.ts`
- Create: `__tests__/health/healthService.test.ts`

- [ ] **Step 1: Write failing tests for health service**

Create `__tests__/health/healthService.test.ts`:

```typescript
import { HealthService } from '../../src/health/healthService';
import { HealthProvider, DailyHealthData } from '../../src/types/health';
import * as healthDb from '../../src/db/health';

jest.mock('../../src/db/health');

const mockProvider: HealthProvider = {
  id: 'test',
  name: 'Test',
  authorize: jest.fn(),
  isConnected: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn(),
  fetchDaily: jest.fn(),
  fetchRange: jest.fn(),
};

const sampleData: DailyHealthData = {
  date: '2026-03-22',
  source: 'test',
  recoveryScore: 78,
  syncedAt: '2026-03-22T08:00:00Z',
};

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new HealthService(mockProvider);
  });

  describe('syncToday', () => {
    it('fetches today data and upserts to DB', async () => {
      (mockProvider.fetchDaily as jest.Mock).mockResolvedValue(sampleData);
      await service.syncToday();
      expect(mockProvider.fetchDaily).toHaveBeenCalled();
      expect(healthDb.upsertDailyHealth).toHaveBeenCalledWith(sampleData);
    });

    it('does nothing when provider returns null', async () => {
      (mockProvider.fetchDaily as jest.Mock).mockResolvedValue(null);
      await service.syncToday();
      expect(healthDb.upsertDailyHealth).not.toHaveBeenCalled();
    });

    it('does not throw on fetch error (non-blocking)', async () => {
      (mockProvider.fetchDaily as jest.Mock).mockRejectedValue(new Error('Network'));
      await expect(service.syncToday()).resolves.not.toThrow();
    });
  });

  describe('backfill', () => {
    it('fetches missing dates and upserts each', async () => {
      (healthDb.getMissingDates as jest.Mock).mockResolvedValue(['2026-03-20', '2026-03-21']);
      (mockProvider.fetchDaily as jest.Mock).mockResolvedValue(sampleData);
      await service.backfill(30);
      expect(mockProvider.fetchDaily).toHaveBeenCalledTimes(2);
      expect(healthDb.upsertDailyHealth).toHaveBeenCalledTimes(2);
    });
  });

  describe('getForDate', () => {
    it('reads from DB', async () => {
      (healthDb.getDailyHealth as jest.Mock).mockResolvedValue(sampleData);
      const result = await service.getForDate('2026-03-22');
      expect(result).toEqual(sampleData);
      expect(healthDb.getDailyHealth).toHaveBeenCalledWith('2026-03-22');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern="__tests__/health/healthService" --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement health service**

Create `src/health/healthService.ts`:

```typescript
import { HealthProvider, DailyHealthData, DailyHealthRow } from '../types/health';
import {
  upsertDailyHealth,
  getDailyHealth,
  getDailyHealthRange,
  getMissingDates,
} from '../db/health';

export class HealthService {
  constructor(private provider: HealthProvider) {}

  /**
   * Sync today's health data from the provider. Non-blocking — errors are swallowed.
   */
  async syncToday(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await this.provider.fetchDaily(today);
      if (data) {
        await upsertDailyHealth(data);
      }
    } catch (e) {
      console.warn('Health sync failed (non-blocking):', e);
    }
  }

  /**
   * Backfill missing days from the last N days.
   */
  async backfill(days: number): Promise<void> {
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);

      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];

      const missing = await getMissingDates(startStr, endStr);

      for (const date of missing) {
        try {
          const data = await this.provider.fetchDaily(date);
          if (data) {
            await upsertDailyHealth(data);
          }
        } catch (e) {
          console.warn(`Backfill failed for ${date}:`, e);
        }
      }
    } catch (e) {
      console.warn('Backfill failed (non-blocking):', e);
    }
  }

  /**
   * Get health data for a specific date from the local DB.
   */
  async getForDate(date: string): Promise<DailyHealthRow | null> {
    return getDailyHealth(date);
  }

  /**
   * Get health data trend for the last N days.
   */
  async getTrend(days: number): Promise<DailyHealthRow[]> {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return getDailyHealthRange(
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0]
    );
  }
}
```

- [ ] **Step 4: Create the React hook**

Create `src/hooks/useHealthData.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { DailyHealthRow } from '../types/health';
import { HealthService } from '../health/healthService';
import { getWhoopProvider } from '../health/providers';

let _service: HealthService | null = null;

function getHealthService(): HealthService {
  if (!_service) {
    _service = new HealthService(getWhoopProvider());
  }
  return _service;
}

/**
 * Hook to access health data for a specific date.
 * Optionally triggers a sync on mount.
 */
export function useHealthData(date: string, options?: { syncOnMount?: boolean }) {
  const [data, setData] = useState<DailyHealthRow | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const service = getHealthService();

      if (options?.syncOnMount) {
        await service.syncToday();
      }

      const result = await service.getForDate(date);
      setData(result);
    } catch {
      // Non-blocking — health data is supplementary
    } finally {
      setLoading(false);
    }
  }, [date, options?.syncOnMount]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh };
}

/**
 * Trigger a background sync + backfill. Call on app open.
 */
export async function syncHealthData(): Promise<void> {
  try {
    const provider = getWhoopProvider();
    const connected = await provider.isConnected();
    if (!connected) return;

    const service = getHealthService();
    await service.syncToday();
    // Backfill gaps from last 7 days (not full 30 on every open)
    await service.backfill(7);
  } catch {
    // Non-blocking
  }
}

/**
 * Run initial backfill after first connection. Call once after OAuth.
 */
export async function initialHealthBackfill(): Promise<void> {
  try {
    const service = getHealthService();
    await service.backfill(30);
  } catch {
    // Non-blocking
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="__tests__/health/healthService" --no-coverage
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/health/healthService.ts src/hooks/useHealthData.ts __tests__/health/healthService.test.ts
git commit -m "feat: add HealthService orchestrator and useHealthData hook (#43)"
```

---

## Task 7: Settings UI — Connect/Disconnect Whoop

**Files:**
- Modify: `app/settings.tsx` (lines 280-296: integrations section)

> **Prerequisite:** Create an HTML mockup for the updated settings integrations section before implementing. Get user approval.

- [ ] **Step 1: Create HTML mockup for settings integrations**

Create `docs/mockups/settings-whoop-2026-03-22.html` showing three states:
1. Disconnected — "Connect" button
2. Connecting — loading spinner
3. Connected — green "Connected" badge + "Disconnect" option

Open for user review:
```bash
open docs/mockups/settings-whoop-2026-03-22.html
```

**Wait for user approval before proceeding.**

- [ ] **Step 2: Implement the settings integration section**

In `app/settings.tsx`, add the following imports and state:

```typescript
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { getWhoopProvider } from '../src/health/providers';
import { initialHealthBackfill } from '../src/hooks/useHealthData';
import { WHOOP_WORKER_URL } from '../src/health/config';

// Ensure browser redirect completes cleanly on iOS
WebBrowser.maybeCompleteAuthSession();

// Whoop OAuth discovery document
const WHOOP_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://api.prod.whoop.com/oauth/oauth2/auth',
  tokenEndpoint: `${WHOOP_WORKER_URL}/oauth/token`, // proxied through CF Worker
};

// Whoop Client ID (safe to embed — the secret stays in the Worker)
const WHOOP_CLIENT_ID = 'YOUR_WHOOP_CLIENT_ID'; // TODO: Replace after registering at developer.whoop.com
```

Inside the component, add state and the OAuth request hook:

```typescript
const [whoopConnected, setWhoopConnected] = useState(false);
const [whoopLoading, setWhoopLoading] = useState(false);

const redirectUri = AuthSession.makeRedirectUri({ scheme: 'apex' });

const [request, response, promptAsync] = AuthSession.useAuthRequest(
  {
    clientId: WHOOP_CLIENT_ID,
    scopes: ['read:recovery', 'read:sleep', 'read:workout', 'read:cycles', 'read:profile', 'offline'],
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
  },
  WHOOP_DISCOVERY
);

// Check connection status on mount
useEffect(() => {
  getWhoopProvider().isConnected().then(setWhoopConnected);
}, []);

// Handle OAuth redirect response
useEffect(() => {
  if (response?.type === 'success' && response.params.code) {
    (async () => {
      setWhoopLoading(true);
      try {
        await getWhoopProvider().authorizeWithCode(response.params.code, redirectUri);
        setWhoopConnected(true);
        initialHealthBackfill(); // fire-and-forget 30-day backfill
      } catch (e) {
        Alert.alert('Connection Failed', 'Could not connect to WHOOP. Please try again.');
      } finally {
        setWhoopLoading(false);
      }
    })();
  }
}, [response]);

const handleWhoopConnect = async () => {
  setWhoopLoading(true);
  try {
    await promptAsync();
  } catch {
    setWhoopLoading(false);
  }
};

const handleWhoopDisconnect = () => {
  Alert.alert('Disconnect WHOOP', 'This will stop syncing health data. Your existing data will be kept.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Disconnect', style: 'destructive', onPress: async () => {
      await getWhoopProvider().disconnect();
      setWhoopConnected(false);
    }},
  ]);
};
```

Replace the INTEGRATIONS section JSX (lines 280-296) with the three visual states (Disconnected / Loading / Connected) per the approved mockup. The visual layout depends on mockup approval, but the above logic is the complete OAuth flow.

> **Note:** `WHOOP_CLIENT_ID` must be replaced after registering at developer.whoop.com. The redirect URI uses the existing `apex` scheme from `app.json`.

- [ ] **Step 3: Test manually**

Build and run on device:
```bash
npm run device
```

Verify:
- Settings shows "Connect" button for WHOOP
- Tapping Connect opens Whoop OAuth page (will fail without deployed worker — expected)
- UI handles the error gracefully

- [ ] **Step 4: Commit**

```bash
git add app/settings.tsx docs/mockups/settings-whoop-2026-03-22.html
git commit -m "feat: add Whoop connect/disconnect flow in settings (#43)"
```

> **Note on Settings toggles:** The spec mentions "Show on Dashboard" and "Show at Workout Start" toggles. These are deferred to a fast-follow PR — the initial integration always shows the HealthCard when data exists. Adding toggles is trivial (AsyncStorage boolean + conditional render) once the core integration is working.

---

## Task 8: Home Dashboard — Health Card

**Files:**
- Create: `src/components/HealthCard.tsx`
- Modify: `app/(tabs)/index.tsx` (insert after ProgramTimeline, ~line 315)

> **Prerequisite:** Create an HTML mockup for the HealthCard component. Get user approval.

- [ ] **Step 1: Create HTML mockup for HealthCard**

Create `docs/mockups/health-card-2026-03-22.html` showing:
- Recovery score (large, color-coded: green 67-100, yellow 34-66, red 0-33)
- Sleep score
- HRV and RHR as secondary metrics
- Subtle "WHOOP" source label
- Card style matching existing TodayCard (Colors.card background, border, borderRadius)

Open for user review:
```bash
open docs/mockups/health-card-2026-03-22.html
```

**Wait for user approval before proceeding.**

- [ ] **Step 2: Implement HealthCard component**

Create `src/components/HealthCard.tsx`. The exact layout depends on the approved mockup, but the component should:

- Accept `data: DailyHealthRow | null` and `loading: boolean` props
- Show skeleton/placeholder while loading
- Show nothing (return null) if no data and not loading
- Display recovery score with color coding
- Display sleep score, HRV, RHR as secondary metrics
- Use design tokens: `Colors.card`, `Colors.green`, `Colors.amber`, `Colors.red`, `Spacing.*`, `FontSize.*`
- Show "—" for any null metric values

- [ ] **Step 3: Add HealthCard to home screen**

In `app/(tabs)/index.tsx`, after the ProgramTimeline section (~line 315):

```typescript
import { useHealthData, syncHealthData } from '../../src/hooks/useHealthData';
import HealthCard from '../../src/components/HealthCard';

// Inside the component, get today's date:
const today = new Date().toISOString().split('T')[0];
const { data: healthData, loading: healthLoading } = useHealthData(today, { syncOnMount: true });

// In the JSX, after ProgramTimeline and before PainFollowUp:
{healthData && (
  <Animated.View entering={FadeInDown.delay(250).duration(500)}>
    <HealthCard data={healthData} loading={healthLoading} />
  </Animated.View>
)}
```

- [ ] **Step 4: Trigger sync on app open**

In `app/(tabs)/index.tsx`, in the existing `useEffect` or `onRefresh`:

```typescript
import { syncHealthData } from '../../src/hooks/useHealthData';

// In the refresh handler or mount effect:
syncHealthData(); // fire-and-forget, non-blocking
```

- [ ] **Step 5: Test manually**

```bash
npm run device
```

Verify: Home screen loads without errors. HealthCard is not visible (no data yet — expected until Whoop is connected).

- [ ] **Step 6: Commit**

```bash
git add src/components/HealthCard.tsx app/\(tabs\)/index.tsx
git commit -m "feat: add HealthCard to home dashboard with sync on open (#43)"
```

---

## Task 9: Session Detail — Health Snapshot

> Reuses the `HealthCard` component from Task 8 — no separate mockup needed.

**Files:**
- Modify: `app/session/[id].tsx`

- [ ] **Step 1: Read session detail screen**

Read `app/session/[id].tsx` to understand the current layout and where to insert the health snapshot.

- [ ] **Step 2: Add health data to session detail**

Import and use the `useHealthData` hook with the session's date:

```typescript
import { useHealthData } from '../../src/hooks/useHealthData';
import HealthCard from '../../src/components/HealthCard';

// Inside the component, using the session's date:
const { data: healthData, loading: healthLoading } = useHealthData(session.date);

// In the JSX, after the session header/readiness section:
{healthData && (
  <HealthCard data={healthData} loading={healthLoading} />
)}
```

- [ ] **Step 3: Test manually**

Verify: Past session detail shows health card if data exists for that date. No card shown for pre-integration dates.

- [ ] **Step 4: Commit**

```bash
git add app/session/\\[id\\].tsx
git commit -m "feat: show health snapshot on past session detail (#43)"
```

---

## Task 10: Pre-Workout Readiness — Health Context

> Reuses the `HealthCard` component from Task 8 — no separate mockup needed.

**Files:**
- Modify: `src/hooks/useWorkoutSession.ts` (session start, ~line 452)
- Modify: `app/(tabs)/workout.tsx` — find the `ReadinessForm` component usage and add HealthCard above it

- [ ] **Step 1: Trigger fresh sync on session start**

In `src/hooks/useWorkoutSession.ts`, in the `startSession` function (~line 456), add a non-blocking sync:

```typescript
import { syncHealthData } from './useHealthData';

// Inside startSession, after createSession:
syncHealthData(); // Fresh pull for today, non-blocking
```

- [ ] **Step 2: Show health data alongside readiness form**

In the workout screen where `ReadinessForm` is displayed, add the HealthCard above or beside it:

```typescript
import { useHealthData } from '../../src/hooks/useHealthData';
import HealthCard from '../../src/components/HealthCard';

const today = new Date().toISOString().split('T')[0];
const { data: healthData, loading: healthLoading } = useHealthData(today, { syncOnMount: true });

// In the readiness section JSX:
{healthData && <HealthCard data={healthData} loading={healthLoading} />}
<ReadinessForm ... />
```

- [ ] **Step 3: Test manually**

Verify: When starting a session, recovery data shows above/alongside the readiness form.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useWorkoutSession.ts app/\(tabs\)/workout.tsx
git commit -m "feat: show health context at session start alongside readiness form (#43)"
```

---

## Task 11: End-to-End Test & Final Verification

- [ ] **Step 1: Run full test suite**

```bash
npm test --no-coverage
```

Expected: All tests pass, no regressions.

- [ ] **Step 2: Verify TypeScript compiles clean**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Manual E2E on device**

Build and deploy:
```bash
npm run device
```

Verify the full flow:
1. Settings > WHOOP shows "Connect" button
2. Home screen loads normally (no health card when disconnected)
3. Start a workout — readiness form shows, no health card (disconnected)
4. Past session detail — no health section for pre-integration dates
5. No crashes, no degraded performance

- [ ] **Step 4: Final commit (if any cleanup needed)**

```bash
git add -A
git commit -m "chore: cleanup and final verification for Whoop integration (#43)"
```

---

## Summary

| Task | What | New Files | Key Test |
|------|------|-----------|----------|
| 1 | Dependencies & config | — | Config validates |
| 2 | Types | `src/types/health.ts` | Compiles |
| 3 | DB schema + queries | `src/db/health.ts` | `__tests__/db/health.test.ts` |
| 4 | CF Worker | `workers/whoop-oauth/` | Local wrangler dev |
| 5 | Whoop provider | `src/health/providers/whoop.ts` | `__tests__/health/providers/whoop.test.ts` |
| 6 | Health service + hook | `src/health/healthService.ts`, `src/hooks/useHealthData.ts` | `__tests__/health/healthService.test.ts` |
| 7 | Settings UI | Modify `app/settings.tsx` | **Mockup first** |
| 8 | Home HealthCard | `src/components/HealthCard.tsx` | **Mockup first** |
| 9 | Session detail | Modify `app/session/[id].tsx` | Manual verify |
| 10 | Pre-workout | Modify workout screen | Manual verify |
| 11 | E2E verification | — | Full test suite + device |

**Tasks 7 and 8 require mockup approval before implementation.**
