# Health Ecosystem — System Design

**Date:** 2026-03-22
**Status:** Design approved, pending implementation planning

## Problem

APEX is a focused workout logging app. The user now wants to track additional health data — body composition (InBody scans), daily weight, wearable metrics (WHOOP) — and see cross-cutting analytics across all of it. Adding all of this to APEX risks bloating a clean, minimal app beyond usability.

## Decision

Build a modular ecosystem of small, focused apps that each do one thing well, connected by a shared cloud layer. A web dashboard provides cross-cutting analytics.

**Philosophy:**
- **Mobile apps = input devices.** Fast, single-purpose, gym-proof. Log and go.
- **Dashboard = reflection device.** Desktop, sit-down, think about trends and correlations.
- **Cloud layer = glue.** Every app syncs there. Dashboard reads from there.

## System Overview

| Component | Repo | Purpose | Platform |
|-----------|------|---------|----------|
| **APEX** | `apex` (existing) | Workout logging, programs, lift progression | iOS (Expo) |
| **Weight/Body Comp App** | TBD | Daily weight tracking, InBody scans, simple trends | iOS (Expo) |
| **Dashboard** | TBD | Cross-cutting analytics, correlations, long-term trends | Web (CF Pages) |
| **API / Cloud Layer** | TBD | CF Worker + D1. Central data store, sync endpoints, WHOOP OAuth | Cloudflare |
| **Shared Package** | TBD | API types, sync client, ecosystem CLAUDE.md context | npm (private) |

Names TBD — will be decided when each piece is built.

### Data Flow

```
┌──────────┐  ┌──────────┐
│   APEX   │  │  Weight  │  ... future apps
│ (SQLite) │  │ (SQLite) │
└────┬─────┘  └────┬─────┘
     │ sync        │ sync
     ▼             ▼
┌─────────────────────────┐
│   Cloud API (Worker)    │◄──── WHOOP API (+ future providers)
│   D1 Database           │
└────────────┬────────────┘
             │ read
             ▼
┌─────────────────────────┐
│   Dashboard (CF Pages)  │
└─────────────────────────┘
```

### Key Principles

- **Local-first** — Each app works fully offline with its own SQLite. Cloud sync is background, non-blocking, fails silently.
- **Apps own input, dashboard owns insight** — Apps are fast logging tools. Dashboard is where you sit and think.
- **API is the contract** — Apps are decoupled from each other. They only share the API surface.
- **Extensible by default** — New apps register with the API, new data types get new endpoints. No rewrites needed.

### Non-Goals

- **Not multi-user.** Single user, single account. No sharing, no social features, no permissions model.
- **Not real-time sync.** Eventual consistency is fine. Data syncs on app open and after writes, not via live WebSocket streams.
- **Not a data editing dashboard.** The web dashboard is strictly read-only. All data entry happens in the mobile apps. If editing is ever added, the conflict resolution model must be revisited.
- **Not a replacement for wearable apps.** WHOOP/Garmin/etc. apps still exist. This ecosystem consumes their data, not replaces their UX.

## Cloud Layer (CF Worker + D1)

### Why Cloudflare D1

Evaluated: D1, Supabase, Turso, PocketBase, Firebase, R2+SQLite.

D1 wins because:
1. **Already in the ecosystem** — WHOOP OAuth Worker is planned, D1 is a binding in the same `wrangler.toml`
2. **No free-tier gotchas** — Supabase pauses databases after 1 week of inactivity (reliability dealbreaker). D1 just runs.
3. **$0/month** — Free tier: 5M reads/day, 100K writes/day, 5GB storage
4. **Same SQL dialect** — Apps already use SQLite. D1 is SQLite. Same mental model.
5. **One deploy** — Worker + D1 + Pages dashboard, all from `wrangler`

Runner-up: Supabase (better DX, Postgres power, but $25/month to avoid auto-pause).

### D1 Schema

Domain-oriented tables — not a mirror of each app's schema:

```sql
-- From APEX
sessions
set_logs
exercises
programs
run_logs

-- From Weight/Body Comp app
body_weights
body_comp_scans

-- From wearable integrations
daily_health

-- Sync tracking
sync_log          -- last sync timestamp per app per table
```

### Authentication

The API is exposed to the internet and must be authenticated, even for single-user.

- **Mechanism:** API key (long random string) sent via `Authorization: Bearer <key>` header
- **Server-side:** Key stored as a Worker environment variable (Cloudflare secret). Worker rejects requests without a valid key.
- **Client-side:** Key stored in each app's environment config (not in source control). For Expo apps, this can be an environment variable baked at build time.
- **Why not OAuth/JWT for the sync API:** Overkill for single-user. An API key is simple, has no expiry to manage, and is trivially rotatable via `wrangler secret put`.
- **WHOOP OAuth endpoints are separate** — they handle WHOOP's auth flow, not the sync API's auth.

### API Design

```
POST   /v1/:table            -- upsert records (batch)
GET    /v1/:table?since=     -- get records, optionally since timestamp
POST   /v1/auth/whoop/token  -- OAuth token exchange
POST   /v1/auth/whoop/refresh -- OAuth token refresh
GET    /v1/analytics/...     -- dashboard-specific query endpoints
```

The `/v1/:table` pattern is generic but **validated** — the Worker maintains an allowlist of valid table names and rejects requests for unknown tables. Adding a new data type requires a D1 migration and adding the table name to the allowlist.

### Sync Model

- **Direction: apps push, dashboard pulls.** Mobile apps only write to the cloud (push). The dashboard only reads from the cloud (pull). There is no app-to-app sync or cloud-to-app sync. Each app's local SQLite is its authoritative data source.
  - **Exception — reinstall recovery:** If an app is reinstalled, it could pull its own data back from D1 as a one-time restore. This is a future consideration, not a v1 requirement.
- **Push-based** — Apps push changes after local SQLite writes (debounced, batched)
- **Timestamp-based** — Each row has `updated_at`. Apps track their last successful sync timestamp per table. Push: "here's everything I changed since my last sync."
- **Conflict resolution: last-write-wins** — Sufficient for single-user with push-only apps. If the dashboard ever gains write capabilities, this must be revisited.
- **Offline resilient** — Sync fails silently. Retries on next app open. Local SQLite is always the source of truth for the app.
- **Sync logic lives in the shared package's client library**, not in the API URL structure
- **`sync_log` table** — The Worker maintains a `sync_log` table in D1 tracking the last successful sync timestamp per app per table. Updated by the Worker after each successful push.

## How APEX Changes

Minimal additions — APEX stays focused:

1. **Schema migration: add `updated_at`** — The sync model requires `updated_at` columns on all syncable tables (`sessions`, `set_logs`, `exercises`, `programs`, `run_logs`, `weekly_checkins`). This is a schema migration that backfills existing rows with `datetime('now')` and adds triggers or application-level updates to maintain the timestamp on writes.
2. **Sync client** — Background push to cloud after local SQLite writes. Uses shared package. Non-blocking, fails silently.
3. **WHOOP integration** — Proceeds per existing spec (`2026-03-22-whoop-integration-design.md`). Additionally syncs `daily_health` to cloud. Note: the WHOOP spec describes a "single-purpose OAuth proxy" Worker, but this ecosystem spec expands the Worker's role to include data sync. The WHOOP OAuth endpoints become part of the broader health API Worker, not a separate deployment.
4. **No new screens, tabs, or cards** for body comp or weight. That's the other app's domain.

## Weight / Body Comp App

Simple, fast, single-purpose. Two modes:

### Daily Weight Logging
- Open app → keypad → type weight → done
- Simple trend chart (7d, 30d, 90d) with moving average
- Inspired by the "Weigh In" app's simplicity

### InBody Scan Logging (occasional)
- Tap to log a scan
- Enter key metrics: weight, skeletal muscle mass, body fat %, BMI, body water
- Timestamped history list — tap for details
- Trend charts for key metrics over time

**This app gets its own dedicated brainstorm** — specifics will be designed then, with Weigh In as the reference model.

## Dashboard

Web app on CF Pages. Desktop-first. Cross-cutting analytics:

- **1RM trends overlaid with body weight** — strength vs size
- **Body comp changes vs training phases** — lean mass gain during hypertrophy blocks
- **Recovery vs performance** — WHOOP recovery correlation with workout intensity
- **Weight trend vs program compliance** — are you gaining/losing as expected?
- **Timeline view** — unified activity feed across all apps

**Gets its own dedicated brainstorm** — analytics and visualizations deserve focused design.

## Repo Architecture

**Approach: Separate repos, shared package (Approach B)**

Each app is its own repo. A private npm package contains:
- TypeScript types for the cloud API contract
- Sync client library
- CLAUDE.md ecosystem context (maps relationships, API contracts, cross-cutting decisions)
- Shared design tokens (optional, incremental — note: Expo apps use JS token objects, web dashboard uses CSS variables, so shared tokens need a format-agnostic definition that can be consumed by both)

**Why:** Each app stays lean and independent. Clear boundaries. Can evolve at different speeds. The API is the real contract — the shared package is a convenience.

**Start simple:** Begin with just API types in the shared package. Pull in shared sync logic and design tokens incrementally as patterns emerge.

## Implementation Order

Each piece gets its own brainstorm → spec → plan → implementation cycle:

1. **Cloud API + D1** — Foundation. Nothing works without it.
2. **APEX sync client** — Get existing workout data flowing to the cloud.
3. **WHOOP integration** — Already spec'd. Adds health data to the pipeline.
4. **Weight/Body Comp app** — New app, own brainstorm.
5. **Dashboard** — Reads from everything. Built last when there's data to visualize.

## Cost Analysis

| Component | Monthly Cost |
|-----------|-------------|
| CF Worker (API) | $0 (free tier: 100K req/day) |
| CF D1 (database) | $0 (free tier: 5M reads/day, 5GB) |
| CF Pages (dashboard) | $0 (free tier: unlimited sites) |
| WHOOP API | $0 (free for developers) |
| Shared npm package | $0 (GitHub Packages or local) |
| **Total** | **$0/month** |

Paid Worker plan ($5/month) available if free tier is ever exceeded — extremely unlikely for personal use.
