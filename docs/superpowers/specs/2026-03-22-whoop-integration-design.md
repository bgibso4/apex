# Whoop Integration — Spike & Design

**Date:** 2026-03-22
**Issue:** #43 — [Spike] Investigate Whoop integration for recovery & sleep data
**Status:** Design approved, ready for implementation planning

**Note:** The Worker architecture described here (single-purpose OAuth proxy) has been superseded by the broader health ecosystem design. See `2026-03-22-health-ecosystem-design.md` for the authoritative Worker architecture — WHOOP OAuth endpoints are part of a unified health API Worker that also handles data sync and analytics.

## Goal

Integrate Whoop recovery, sleep, and health data into APEX to provide a unified view of workout readiness and historical context. The integration should be vendor-agnostic so future wearables (Garmin, Oura, etc.) can slot in without rewriting the UI or data layer.

## Spike Findings

### Whoop API

- **API:** REST v2 at `https://api.prod.whoop.com`
- **Docs:** https://developer.whoop.com/api/
- **Auth:** OAuth 2.0 Authorization Code flow (confidential client)
  - Authorization URL: `https://api.prod.whoop.com/oauth/oauth2/auth`
  - Token URL: `https://api.prod.whoop.com/oauth/oauth2/token`
  - **Client Secret required for token exchange** — cannot be exposed in mobile app
  - Refresh tokens available with `offline` scope
- **Rate limits:** 100 requests/min, 10,000 requests/day (plenty for personal use)
- **No mobile SDK** — REST only
- **Scopes needed:** `read:recovery`, `read:sleep`, `read:workout`, `read:cycles`, `read:profile`, `offline`
- **Token expiry:** Access tokens expire in 1 hour (3600s) — expect a refresh on nearly every app open

### Available Data

| Endpoint | Key Data |
|----------|----------|
| Cycles (+ nested Recovery) | Recovery score (0-100), HRV (`hrv_rmssd_milli`, in ms), resting HR, SpO2 (`spo2_percentage`, 0-100), skin temp |
| Sleep | Sleep score, duration, stages, respiratory rate |
| Workouts | Strain score (0-21), duration, calories |
| Profile | Basic user info |

### HealthKit Alternative (Rejected)

Whoop syncs to Apple HealthKit, but critical metrics are missing: no recovery score, no HRV (Apple uses SDNN vs Whoop's RMSSD), no strain score. The most valuable data requires the direct API.

### Backend Requirement

Whoop's OAuth flow requires the Client Secret server-side. A lightweight Cloudflare Worker proxy handles only the token exchange. The app calls the Whoop API directly for data using the access token.

## Chosen Approach: CF Worker OAuth Proxy + Direct API

A Cloudflare Worker (~50 lines) handles OAuth token exchange and refresh. The app stores tokens in secure storage and fetches data directly from Whoop's API. All health data is stored in a vendor-agnostic SQLite table.

**Why this approach:**
- Full access to all Whoop metrics (recovery score, HRV, sleep score, strain)
- CF Worker free tier: 100k requests/day (we'll use ~15/day)
- No user data passes through the worker — only auth tokens
- Minimal infrastructure, near-zero maintenance

## Data Model

### `daily_health` Table

One row per calendar day, vendor-agnostic:

```sql
CREATE TABLE daily_health (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,        -- 'YYYY-MM-DD', one row per day
  source TEXT NOT NULL,             -- 'whoop', 'garmin', 'manual'

  -- Core metrics
  recovery_score REAL,             -- 0-100
  sleep_score REAL,                -- sleep performance score
  hrv_rmssd REAL,                  -- HRV in ms (RMSSD method)
  resting_hr REAL,                 -- bpm

  -- Secondary metrics
  strain_score REAL,               -- 0-21 (previous day's strain)
  sleep_duration_min INTEGER,      -- total sleep in minutes
  spo2 REAL,                       -- blood oxygen %
  skin_temp_celsius REAL,          -- skin temperature
  respiratory_rate REAL,           -- breaths per minute

  -- Metadata
  raw_json TEXT,                   -- full API response for future analytics
  synced_at TEXT NOT NULL,         -- ISO timestamp of when data was fetched
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

**Key decisions:**
- `date` is UNIQUE — upsert on sync, latest write wins
- All metric columns nullable — different providers supply different fields
- `raw_json` stores full API response so we never need to re-fetch history for new metrics (avoid SELECT * in queries — exclude `raw_json` unless needed)
- `source` tracks where data came from
- Sessions reference health data by joining on date (no foreign key needed)

**Whoop field mapping notes:**
- `hrv_rmssd_milli` → `hrv_rmssd` (already in ms, store directly)
- `spo2_percentage` → `spo2` (0-100 percentage, store directly)
- Recovery is a sub-resource of Cycles — fetch the cycle for a date, then extract `score` from the nested recovery object

**New dependencies required:**
- `expo-secure-store` — encrypted keychain storage for OAuth tokens (requires native module + prebuild)
- `expo-auth-session` — OAuth browser flow (requires native module + prebuild)

**Database migration:**
- Bump `SCHEMA_VERSION` to 11 in `src/db/database.ts`
- Add migration block: `if (currentVersion < 11) { CREATE TABLE daily_health ... }`
- Also add to `CREATE_TABLES` constant for fresh installs

## Architecture

```
┌─────────────────────────────────────┐
│            UI Components            │  Provider-agnostic
│  (Home card, Session detail, etc.)  │  Reads from daily_health table
├─────────────────────────────────────┤
│          Health Service             │  Orchestration layer
│  sync(), getForDate(), getTrend()   │  Talks to provider + DB
├─────────────────────────────────────┤
│        Health Provider Interface    │  Vendor abstraction
│  ┌──────────┐  ┌──────────┐        │
│  │  Whoop   │  │  Garmin  │  ...   │  Each implements same interface
│  │ Provider │  │ Provider │        │
│  └──────────┘  └──────────┘        │
├─────────────────────────────────────┤
│     Cloudflare Worker (OAuth)       │  Only handles token exchange
└─────────────────────────────────────┘
```

### HealthProvider Interface

```typescript
interface HealthProvider {
  id: string;                    // 'whoop', 'garmin'
  name: string;                  // 'WHOOP', 'Garmin'

  // Auth
  authorize(): Promise<void>;    // Kick off OAuth flow
  isConnected(): Promise<boolean>;
  disconnect(): Promise<void>;

  // Data
  fetchDaily(date: string): Promise<DailyHealthData>;
  fetchRange(start: string, end: string): Promise<DailyHealthData[]>;
}
```

### Health Service

The orchestrator between providers and the database:

- `sync()` — called on app open + session start. Fetches today's data and backfills any gaps since last sync. Upserts into `daily_health`.
- `getForDate(date)` — reads from SQLite. Used by session detail view.
- `getTrend(days)` — reads last N days from SQLite. For future analytics.
- Tracks which provider is active (stored in AsyncStorage/settings).

### Token Storage

- Access token + refresh token stored in `expo-secure-store` (encrypted on-device keychain)
- Never stored in SQLite or plain AsyncStorage
- Client Secret lives only in the CF Worker environment variables

## OAuth Flow

### Connection (one-time)

1. User taps "Connect" in Settings > Integrations > WHOOP
2. App opens Whoop OAuth page via `expo-auth-session`
3. User logs in and grants permissions
4. Whoop redirects back with authorization code
5. App sends code to CF Worker → Worker exchanges for tokens using Client Secret → returns tokens
6. App stores tokens in `expo-secure-store`
7. Settings shows green "Connected" badge
8. Initial sync: backfill last 30 days of health data

### Token Refresh

- On any API call, check token expiry first
- If expired, auto-refresh via CF Worker (which injects Client Secret)
- If refresh fails (token revoked), prompt user to re-connect in Settings

## Sync Behavior

- **On app open:** Fetch today's data + any gaps since last sync (check `daily_health` for missing dates)
- **On session start:** Fresh fetch for today — ensures recovery data shown is current
- **Non-blocking:** App opens instantly, health data populates asynchronously. Skeleton/placeholder on home card until loaded.
- **Offline:** Show last cached data from SQLite. No error states — just stale data with a subtle "last synced" timestamp.

## UI Surfaces

All UI work requires an HTML mockup reviewed and approved before implementation.

### 1. Home Dashboard — Recovery Card

- New card on the home screen
- Shows: recovery score (color-coded green/yellow/red), sleep score, HRV, RHR
- Subtle source indicator (Whoop icon or label)
- When not connected: card is not shown (no upsell clutter)

### 2. Pre-Workout — Readiness Context

- When starting a session, show today's recovery data alongside the manual readiness form
- Complements (does not replace) the manual sleep/soreness/energy form
- Recovery score displayed prominently for informed intensity decisions

### 3. Session Detail (Past Workouts)

- Read-only section showing health snapshot for that session's date
- Joins `daily_health` on session date
- Same metrics as home card but in historical context
- If no health data for that date (pre-integration), section not shown

### 4. Settings > Integrations

- Current "Coming Soon" badge → "Connect" button → green "Connected" badge
- Disconnect option
- Toggles: "Show on Dashboard", "Show at Workout Start"

## Cloudflare Worker

Single-purpose OAuth proxy. Two endpoints:

- `POST /oauth/token` — exchanges authorization code for tokens (injects Client Secret)
- `POST /oauth/refresh` — refreshes expired access token (injects Client Secret)

Environment variables: `WHOOP_CLIENT_ID`, `WHOOP_CLIENT_SECRET`

No user data stored. No database. Stateless.

## Error Handling

- **Token expired:** Auto-refresh silently. If refresh fails → "Reconnect" prompt in Settings
- **API down / network error:** Show cached data, fail silently. No error banners mid-workout
- **Rate limited (429):** Back off, retry once (not a realistic concern at our volume)
- **Account disconnected:** Clear tokens, revert Settings to "Connect" state, hide health cards gracefully
- **Partial data:** Some days may be missing metrics (Whoop not worn). UI shows "—" for missing values

**Principle: Health data is supplementary. The app must never break or degrade because Whoop is unavailable.**

## Testing Strategy

- **Unit tests:** HealthProvider interface, Whoop API client (mocked responses), daily_health DB queries, token refresh logic
- **Integration tests:** Full sync flow with mocked Whoop API, backfill logic, upsert behavior
- **E2E:** Connect flow (mocked OAuth), verify data appears on home card and session detail
- **CF Worker:** Tested locally with `wrangler dev` before deploying

## Token Refresh — User Experience

Token refresh is fully automatic and invisible to the user. The flow:

1. App detects access token is expired (1-hour lifetime) before making an API call
2. App sends refresh token to CF Worker
3. Worker exchanges it for a new access/refresh token pair (using Client Secret)
4. App stores new tokens in secure store, continues the API call
5. User sees nothing — data just loads

**When manual action is required (rare):**
- Refresh token revoked (user disconnected app from Whoop's side, or Whoop forces re-auth)
- App shows a "Reconnect" prompt in Settings > Integrations
- One tap to re-authorize via OAuth flow
- No data is lost — `daily_health` table retains all previously synced data

## Cost Analysis (PERT Estimate)

### Cloudflare Worker (OAuth Proxy)

| | Free Tier Included | Our Usage |
|---|---|---|
| Requests | 100,000/day | ~15-30/day |
| CPU time | 10ms/request | <1ms CPU time/request (wall-clock ~200-500ms due to Whoop API round-trip, but CF only bills CPU) |

**Optimistic:** $0/month — we stay well within free tier indefinitely. A personal app doing 15-30 requests/day is 0.03% of the free allocation.

**Pessimistic:** $0/month — even if usage 10x'd (multiple devices, aggressive polling), 300 requests/day is still 0.3% of free tier. You would need ~3,300x current usage to exceed it. The paid tier ($5/month) kicks in at 10M requests/month — effectively unreachable for a personal app.

**PERT estimate: $0/month**

### Whoop API

| | Limit | Our Usage |
|---|---|---|
| Rate limit | 100 requests/min | ~2-3/sync |
| Daily limit | 10,000 requests/day | ~15-30/day |

**Optimistic:** $0 — Whoop API is free for registered developers. No per-request charges.

**Pessimistic:** $0 — There is no paid tier. The API is free. The only risk is if Whoop deprecates or restricts the API in the future, which would affect data availability but not cost.

**PERT estimate: $0**

### Whoop Developer Account

**Cost:** Free — registration at developer.whoop.com, no fees.

### New Dependencies (App Side)

| Package | Cost |
|---|---|
| `expo-secure-store` | Free (MIT) |
| `expo-auth-session` | Free (MIT) |

### Total Ongoing Cost

| Scenario | Monthly Cost |
|---|---|
| **Optimistic** | $0 |
| **Most likely** | $0 |
| **Pessimistic** | $0 |

The entire integration runs on free tiers with enormous headroom. The only scenario with cost is if Cloudflare changes their free tier terms, in which case the paid Worker plan is $5/month.

## Future Considerations

- **Analytics:** HRV/recovery trends over time, correlation with workout performance (data is stored, UI TBD)
- **Additional providers:** Garmin, Oura, Apple Watch — implement `HealthProvider` interface
- **Auto-adjust intensity:** Suggest lighter workout when recovery is low (future feature)
- **R2 backup:** If CF Worker is already deployed, adding encrypted DB backup to R2 is incremental (see issue #20)
