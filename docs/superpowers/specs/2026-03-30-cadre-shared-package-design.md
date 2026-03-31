# @cadre/shared — Shared Package Design

**Date:** 2026-03-30
**Status:** Design approved, pending implementation planning
**Parent:** `2026-03-30-cadre-umbrella-naming-design.md`, `2026-03-22-health-ecosystem-design.md`

## Goal

Create `@cadre/shared` — a standalone repo and private npm package containing the design tokens, sync client, and API types shared across Cadre ecosystem apps (starting with Apex and the weight tracker). Refactor Apex to consume from this package instead of its local copies.

## What Exists Today

- **Apex theme system** (`src/theme/`) — colors, spacing, typography, border radii, component sizes, shared styles, font config. All React Native / JS objects.
- **Apex sync client** (`src/sync/`) — pushes local SQLite data to the D1 cloud API. Tightly coupled to Apex's database layer (`getDatabase()`, `schema_info` table) and Apex-specific table configs.
- **Worker table allowlist** (`workers/health-api/src/lib/tables.ts`) — TypeScript types and validation for the D1 API contract. Already defines `body_weights` and `body_comp_scans` tables (ready for the weight app).
- **Health config** (`src/health/config.ts`) — Worker URL and API key, hardcoded.

## What the Package Contains

### Layer 1: Design Tokens

Extracted from Apex's `src/theme/`. These are the raw token definitions — the single source of truth for visual consistency across apps.

**What moves to `@cadre/shared`:**
- `Colors` — full color token object (`colors.ts`)
- `Spacing`, `FontSize`, `BorderRadius` — layout and typography tokens (`spacing.ts`)

**What stays in each app:**
- `ComponentSize` — these are Apex-specific component dimensions (set button widths, volume bar heights, tab bar measurements). Each app defines its own component sizes locally. If overlap emerges between apps, individual tokens can be promoted to shared.
- `SharedStyles` (`shared.ts`) — React Native `StyleSheet.create()` with Apex-specific layout patterns (screen containers, cards, section labels). Each app composes its own shared styles from the tokens.
- `APEX_FONT_FAMILY`, `CUSTOM_FONTS` (`fonts.ts`) — font loading uses `require()` paths relative to the app's `assets/` directory. Each app manages its own font loading. If both apps use the same fonts, the font *names* could be a shared token, but the loading mechanism stays local.

**Exports:**
```typescript
// @cadre/shared/theme
export { Colors, type ColorKey } from './colors';
export { Spacing, FontSize, BorderRadius } from './spacing';
```

**Apex migration:** Apex's `src/theme/index.ts` re-exports from `@cadre/shared` for tokens, and keeps local exports for `ComponentSize`, `SharedStyles`, and fonts. Apex components don't need to change their imports — they still import from `src/theme`.

```typescript
// Apex src/theme/index.ts (after migration)
export { Colors, Spacing, FontSize, BorderRadius } from '@cadre/shared/theme';
export { ComponentSize } from './spacing';      // local — Apex-specific sizes
export { SharedStyles } from './shared';         // local — Apex-specific styles
export { APEX_FONT_FAMILY, CUSTOM_FONTS } from './fonts';  // local — Apex-specific fonts
```

This approach means zero changes to any Apex component file — only `src/theme/index.ts` and `src/theme/spacing.ts` change.

### Layer 2: API Types

Extracted from the Worker's `lib/tables.ts`. These types define the contract between apps and the D1 cloud API.

**What moves to `@cadre/shared`:**
- `ALLOWED_TABLES` constant — table names, column lists, required columns
- `TableName` type
- `isAllowedTable()`, `validateRecords()`, `sanitizeRecord()` utility functions

**Exports:**
```typescript
// @cadre/shared/api
export { ALLOWED_TABLES, type TableName } from './tables';
export { isAllowedTable, validateRecords, sanitizeRecord } from './tables';
```

**Consumer migration:**
- The Worker (`workers/health-api/src/lib/tables.ts`) imports from `@cadre/shared/api` instead of its local copy
- The sync client uses `TableName` for type safety

### Layer 3: Sync Engine

The current Apex sync client has two layers: a **generic sync engine** (push rows to API, track timestamps) and **Apex-specific config** (table mappings, queries, transforms). Only the engine is shared.

**What moves to `@cadre/shared`:**

A generic `SyncEngine` class that any app can instantiate with its own config:

```typescript
// @cadre/shared/sync
interface SyncEngineConfig {
  apiUrl: string;
  apiKey: string;
  appId: string;                    // e.g. 'apex', 'weight'
  getLastSync: (table: string) => Promise<string | null>;
  setLastSync: (table: string, timestamp: string) => Promise<void>;
}

interface TablePushConfig {
  table: string;                    // D1 table name
  getChangedRows: (since: string) => Promise<Record<string, unknown>[]>;
  transformRow?: (row: Record<string, unknown>) => Record<string, unknown>;
}

class SyncEngine {
  constructor(config: SyncEngineConfig);
  registerTable(config: TablePushConfig): void;
  syncAll(): Promise<void>;
  syncTable(table: string): Promise<void>;
}
```

**What stays in each app:**
- **Table configs** — Each app defines its own tables, queries, and transforms. Apex keeps its `syncConfig.ts` with all the JOIN queries, column exclusions, ID transforms, etc. The weight app will define its own (much simpler — just `body_weights` and `body_comp_scans`).
- **Storage implementation** — Each app implements `getLastSync`/`setLastSync` using its own local DB. Apex uses `schema_info`. The weight app can use whatever it wants.
- **Trigger hooks** — `useSyncOnOpen` stays in each app (it's a one-liner that calls `syncAll`).

**Apex migration:** Apex's `src/sync/syncClient.ts` is replaced by instantiating `SyncEngine` from `@cadre/shared` and registering its tables:

```typescript
// Apex src/sync/syncClient.ts (after migration)
import { SyncEngine } from '@cadre/shared/sync';
import { SYNC_TABLES, getSyncQuery, transformRow } from './syncConfig';
import { getLastSync, setLastSync } from './syncStorage';
import { WHOOP_WORKER_URL, WHOOP_WORKER_API_KEY } from '../health/config';

const engine = new SyncEngine({
  apiUrl: WHOOP_WORKER_URL,
  apiKey: WHOOP_WORKER_API_KEY,
  appId: 'apex',
  getLastSync,
  setLastSync,
});

// Register each Apex table with its query and transform logic
for (const [table, config] of Object.entries(SYNC_TABLES)) {
  engine.registerTable({
    table,
    getChangedRows: async (since) => {
      const db = await getDatabase();
      return db.getAllAsync(getSyncQuery(table as SyncTableName), [since]);
    },
    transformRow: (row) => transformRow(table as SyncTableName, row),
  });
}

export const syncAll = () => engine.syncAll();
export const syncTable = (table: string) => engine.syncTable(table);
```

Apex's `syncConfig.ts`, `syncStorage.ts`, and `useSyncOnOpen.ts` are unchanged.

### Layer 4: UI Primitives (empty on day one)

Starts empty. Components are promoted here from apps when real duplication is discovered — not before.

**Promotion rule:** You build a component in the weight app. If it's functionally identical to something in Apex, move it to shared. Don't pre-guess.

**Likely candidates** (based on ecosystem design, but NOT pre-built):
- Trend line chart (both apps show time-series trends)
- Numeric keypad (Apex uses one for weight entry, weight app's primary input)

**Exports (when populated):**
```typescript
// @cadre/shared/components
// Nothing yet — components promoted here as needed
```

## Package Structure

```
cadre-shared/
  src/
    theme/
      colors.ts           -- Color tokens
      spacing.ts          -- Spacing, FontSize, BorderRadius
      index.ts            -- Theme exports
    api/
      tables.ts           -- ALLOWED_TABLES, types, validation
      index.ts            -- API exports
    sync/
      SyncEngine.ts       -- Generic sync engine class
      index.ts            -- Sync exports
    components/           -- Empty on day one
      index.ts
    index.ts              -- Root barrel export
  package.json
  tsconfig.json
  CLAUDE.md               -- Ecosystem context for AI assistants
```

## Package Distribution

**Method:** Git dependency via npm.

```json
// In Apex's package.json
{
  "dependencies": {
    "@cadre/shared": "git+https://github.com/bgibso4/cadre-shared.git#v0.1.0"
  }
}
```

**Why git dependency over GitHub Packages / npm publish:**
- Zero infrastructure — no registry, no tokens, no CI publish pipeline
- Version pinning via git tags (`#v0.1.0`, `#v0.2.0`)
- `npm install` just works
- Upgrade path: if this ever needs proper publishing, switch to GitHub Packages later

**Why not a local file path (`file:../cadre-shared`):**
- Breaks on CI and when cloning fresh
- Makes the dependency invisible in lockfiles

## What Changes in Apex

| File | Change |
|------|--------|
| `package.json` | Add `@cadre/shared` dependency |
| `src/theme/index.ts` | Re-export `Colors`, `Spacing`, `FontSize`, `BorderRadius` from `@cadre/shared/theme` |
| `src/theme/spacing.ts` | Remove `Spacing`, `FontSize`, `BorderRadius` (keep `ComponentSize` only) |
| `src/theme/colors.ts` | Remove (fully moved to shared) |
| `src/sync/syncClient.ts` | Refactor to use `SyncEngine` from `@cadre/shared/sync` |
| `tsconfig.json` | Ensure module resolution finds `@cadre/shared` subpath exports |

**No changes to:** Any component file, any screen, `syncConfig.ts`, `syncStorage.ts`, `useSyncOnOpen.ts`, `shared.ts`, `fonts.ts`.

## What Changes in the Worker

| File | Change |
|------|--------|
| `package.json` | Add `@cadre/shared` dependency |
| `src/lib/tables.ts` | Remove local definitions, import from `@cadre/shared/api` |

## Testing

- **Shared package tests:** Unit tests for `SyncEngine` (mock fetch, verify payloads, timestamp tracking, error handling). Token exports are just objects — no logic to test.
- **Apex regression:** Run Apex's existing test suite after migration. All tests should pass with zero changes (imports unchanged from component perspective).
- **Worker regression:** Run Worker's existing test suite after migration.

## Non-Goals

- **No shared navigation or app shell** — each app owns its routing and layout
- **No shared state management** — each app manages its own local state
- **No pre-built UI primitives** — promoted from apps when duplication is real
- **No shared font loading** — each app loads its own fonts from its own assets
- **No CI/CD for the shared package** — git tags are sufficient for a personal project
- **No web (CSS) token format yet** — added when the dashboard is built, using a build step that generates CSS variables from the JS token objects
