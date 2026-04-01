# @cadre/shared Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the `@cadre/shared` npm package with design tokens, API types, and a generic sync engine, then migrate Apex and the Worker to consume from it.

**Architecture:** Standalone git repo (`cadre-shared`) with three layers: theme tokens, API contract types, and a generic `SyncEngine` class. Apex and the Worker switch their local copies to imports from the shared package. Apex components don't change — only the barrel exports in `src/theme/index.ts` are rewired.

**Tech Stack:** TypeScript, Jest (for shared package tests), git dependency for distribution

---

## File Structure

### New: `cadre-shared/` repo

```
cadre-shared/
  src/
    theme/
      colors.ts           -- Color tokens (extracted from Apex)
      spacing.ts          -- Spacing, FontSize, BorderRadius (extracted from Apex)
      index.ts            -- Theme barrel exports
    api/
      tables.ts           -- ALLOWED_TABLES, types, validation (extracted from Worker)
      index.ts            -- API barrel exports
    sync/
      SyncEngine.ts       -- Generic sync engine class
      index.ts            -- Sync barrel exports
    index.ts              -- Root barrel export
  __tests__/
    theme/
      tokens.test.ts      -- Token export verification
    api/
      tables.test.ts      -- Table validation tests
    sync/
      SyncEngine.test.ts  -- Sync engine unit tests
  package.json
  tsconfig.json
  jest.config.js
  .gitignore
  CLAUDE.md
```

### Modified in Apex (`/Users/ben/projects/apex/`)

```
src/theme/index.ts        -- Rewire to re-export from @cadre/shared
src/theme/colors.ts       -- DELETE (moved to shared)
src/theme/spacing.ts      -- Remove Spacing, FontSize, BorderRadius; keep ComponentSize only
src/sync/syncClient.ts    -- Refactor to use SyncEngine from @cadre/shared
package.json              -- Add @cadre/shared dependency
```

### Modified in Worker (`/Users/ben/projects/apex/workers/health-api/`)

```
src/lib/tables.ts         -- Replace with import from @cadre/shared
package.json              -- Add @cadre/shared dependency
```

---

### Task 1: Initialize cadre-shared repo

**Files:**
- Create: `~/projects/cadre-shared/package.json`
- Create: `~/projects/cadre-shared/tsconfig.json`
- Create: `~/projects/cadre-shared/jest.config.js`
- Create: `~/projects/cadre-shared/.gitignore`
- Create: `~/projects/cadre-shared/src/index.ts`

- [ ] **Step 1: Create directory and initialize git repo**

```bash
mkdir -p ~/projects/cadre-shared
cd ~/projects/cadre-shared
git init
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "@cadre/shared",
  "version": "0.1.0",
  "description": "Shared tokens, types, and sync engine for the Cadre ecosystem",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./theme": "./src/theme/index.ts",
    "./api": "./src/api/index.ts",
    "./sync": "./src/sync/index.ts"
  },
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.3.0"
  },
  "private": true
}
```

Note: No build step. Consumers (Apex via Metro, Worker via wrangler) bundle the TypeScript source directly. The `exports` field points to `.ts` files because both Metro (Expo) and wrangler's esbuild resolve TypeScript from dependencies. This avoids a compile step in the shared package entirely.

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "exclude": ["node_modules", "__tests__", "dist"]
}
```

- [ ] **Step 4: Create jest.config.js**

```javascript
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts'],
};
```

- [ ] **Step 5: Create .gitignore**

```
node_modules/
dist/
coverage/
*.tsbuildinfo
```

- [ ] **Step 6: Create root barrel export**

```typescript
// src/index.ts
export * from './theme';
export * from './api';
export * from './sync';
```

- [ ] **Step 7: Install dependencies and verify**

```bash
cd ~/projects/cadre-shared
npm install
npx tsc --noEmit
```

Expected: TypeScript may warn about empty modules — that's fine, we'll populate them next.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: initialize @cadre/shared package"
```

---

### Task 2: Theme tokens

**Files:**
- Create: `~/projects/cadre-shared/src/theme/colors.ts`
- Create: `~/projects/cadre-shared/src/theme/spacing.ts`
- Create: `~/projects/cadre-shared/src/theme/index.ts`
- Create: `~/projects/cadre-shared/__tests__/theme/tokens.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/theme/tokens.test.ts
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import type { ColorKey } from '../../src/theme';

describe('Theme Tokens', () => {
  describe('Colors', () => {
    it('exports background colors', () => {
      expect(Colors.bg).toBe('#0a0a0f');
      expect(Colors.card).toBe('#141420');
      expect(Colors.surface).toBe('#1e1e30');
    });

    it('exports text colors', () => {
      expect(Colors.text).toBe('#ffffff');
      expect(Colors.textSecondary).toBe('#a0a0b8');
      expect(Colors.textDim).toBe('#6a6a80');
    });

    it('exports accent colors', () => {
      expect(Colors.indigo).toBe('#6366f1');
      expect(Colors.green).toBe('#22c55e');
      expect(Colors.amber).toBe('#f59e0b');
      expect(Colors.red).toBe('#ef4444');
    });

    it('exports all expected keys', () => {
      const keys = Object.keys(Colors);
      expect(keys).toContain('bg');
      expect(keys).toContain('text');
      expect(keys).toContain('indigo');
      expect(keys).toContain('hypertrophy');
      expect(keys).toContain('cyan');
    });

    it('ColorKey type covers all keys', () => {
      const key: ColorKey = 'bg';
      expect(Colors[key]).toBeDefined();
    });
  });

  describe('Spacing', () => {
    it('exports base spacing scale', () => {
      expect(Spacing.xs).toBe(4);
      expect(Spacing.sm).toBe(8);
      expect(Spacing.md).toBe(12);
      expect(Spacing.lg).toBe(16);
    });

    it('exports layout tokens', () => {
      expect(Spacing.screenTop).toBe(88);
      expect(Spacing.screenHorizontal).toBe(24);
      expect(Spacing.cardPadding).toBe(24);
    });
  });

  describe('FontSize', () => {
    it('exports font size scale', () => {
      expect(FontSize.body).toBe(13);
      expect(FontSize.md).toBe(14);
      expect(FontSize.title).toBe(19);
      expect(FontSize.screenTitle).toBe(32);
      expect(FontSize.hero).toBe(40);
    });
  });

  describe('BorderRadius', () => {
    it('exports border radius scale', () => {
      expect(BorderRadius.sm).toBe(6);
      expect(BorderRadius.button).toBe(8);
      expect(BorderRadius.lg).toBe(14);
      expect(BorderRadius.pill).toBe(99);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ~/projects/cadre-shared
npx jest __tests__/theme/tokens.test.ts
```

Expected: FAIL — modules don't exist yet.

- [ ] **Step 3: Create colors.ts**

```typescript
// src/theme/colors.ts
export const Colors = {
  // Backgrounds
  bg: '#0a0a0f',
  card: '#141420',
  cardHover: '#1a1a2e',
  cardInset: '#181824',
  cardDeep: '#111118',
  surface: '#1e1e30',

  // Borders
  border: '#2a2a3e',
  borderLight: '#3a3a4e',

  // Text
  text: '#ffffff',
  textSecondary: '#a0a0b8',
  textDim: '#6a6a80',
  textMuted: '#4a4a5e',

  // Primary / Accent
  indigo: '#6366f1',
  indigoDark: '#4f46e5',
  indigoLight: '#818cf8',
  indigoMuted: '#6366f120',

  // Semantic Colors
  green: '#22c55e',
  greenMuted: '#22c55e20',
  amber: '#f59e0b',
  amberMuted: '#f59e0b20',
  red: '#ef4444',
  redMuted: '#ef444420',

  // Block Colors (periodization)
  hypertrophy: '#6366f1',
  deload: '#22c55e',
  strength: '#f59e0b',
  realization: '#ec4899',

  // Special
  cyan: '#06b6d4',
  cyanMuted: '#06b6d420',

  // Completed states
  greenFaint: '#22c55e18',
  greenBorderFaint: '#22c55e30',

  // Active card border
  indigoBorderFaint: '#6366f130',

  // Block segment backgrounds
  hypertrophyMuted: '#6366f130',
  strengthMuted: '#f59e0b30',
  realizationMuted: '#ec489930',
  deloadMuted: '#22c55e30',
} as const;

export type ColorKey = keyof typeof Colors;
```

- [ ] **Step 4: Create spacing.ts**

```typescript
// src/theme/spacing.ts
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,

  // Layout tokens
  screenTop: 88,
  screenBottom: 40,
  screenHorizontal: 24,

  // Content gap patterns
  contentGap: 24,
  cardPadding: 24,
  cardPaddingCompact: 20,
  sectionGap: 20,
} as const;

export const FontSize = {
  xs: 10,
  sm: 12,
  body: 13,
  md: 14,
  base: 15,
  lg: 16,
  xl: 18,
  title: 19,
  subtitle: 20,
  xxl: 22,
  sectionTitle: 24,
  xxxl: 28,
  screenTitle: 32,
  hero: 40,

  chartLabel: 9,
  tabLabel: 10,
  sectionLabel: 11,
  logo: 36,
} as const;

export const BorderRadius = {
  xs: 3,
  sm: 6,
  button: 8,
  md: 10,
  cardInner: 12,
  lg: 14,
  xl: 18,
  modal: 20,
  pill: 99,
} as const;
```

- [ ] **Step 5: Create theme barrel export**

```typescript
// src/theme/index.ts
export { Colors, type ColorKey } from './colors';
export { Spacing, FontSize, BorderRadius } from './spacing';
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd ~/projects/cadre-shared
npx jest __tests__/theme/tokens.test.ts
```

Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
cd ~/projects/cadre-shared
git add -A
git commit -m "feat: add design tokens (colors, spacing, typography, radii)"
```

---

### Task 3: API types and validation

**Files:**
- Create: `~/projects/cadre-shared/src/api/tables.ts`
- Create: `~/projects/cadre-shared/src/api/index.ts`
- Create: `~/projects/cadre-shared/__tests__/api/tables.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/api/tables.test.ts
import {
  ALLOWED_TABLES,
  isAllowedTable,
  validateRecords,
  sanitizeRecord,
  type TableName,
} from '../../src/api';

describe('API Tables', () => {
  describe('ALLOWED_TABLES', () => {
    it('defines all expected tables', () => {
      const tables = Object.keys(ALLOWED_TABLES);
      expect(tables).toContain('sessions');
      expect(tables).toContain('set_logs');
      expect(tables).toContain('exercises');
      expect(tables).toContain('programs');
      expect(tables).toContain('run_logs');
      expect(tables).toContain('exercise_notes');
      expect(tables).toContain('personal_records');
      expect(tables).toContain('session_protocols');
      expect(tables).toContain('daily_health');
      expect(tables).toContain('body_weights');
      expect(tables).toContain('body_comp_scans');
      expect(tables).toHaveLength(11);
    });

    it('each table has columns and required arrays', () => {
      for (const [name, config] of Object.entries(ALLOWED_TABLES)) {
        expect(config.columns).toBeInstanceOf(Array);
        expect(config.required).toBeInstanceOf(Array);
        expect(config.columns.length).toBeGreaterThan(0);
        expect(config.required.length).toBeGreaterThan(0);
        // Every required column must be in columns list
        for (const req of config.required) {
          expect(config.columns).toContain(req);
        }
      }
    });
  });

  describe('isAllowedTable', () => {
    it('returns true for valid tables', () => {
      expect(isAllowedTable('sessions')).toBe(true);
      expect(isAllowedTable('body_weights')).toBe(true);
    });

    it('returns false for unknown tables', () => {
      expect(isAllowedTable('users')).toBe(false);
      expect(isAllowedTable('')).toBe(false);
      expect(isAllowedTable('drop_table')).toBe(false);
    });
  });

  describe('validateRecords', () => {
    it('passes when all required columns present', () => {
      const result = validateRecords('sessions', [
        { id: '1', date: '2026-03-30', updated_at: '2026-03-30T00:00:00Z' },
      ]);
      expect(result).toEqual({ valid: true });
    });

    it('fails when required column is missing', () => {
      const result = validateRecords('sessions', [
        { id: '1', updated_at: '2026-03-30T00:00:00Z' },
      ]);
      expect(result).toEqual({
        valid: false,
        error: 'Missing required column: date in records[0]',
      });
    });

    it('fails when required column is null', () => {
      const result = validateRecords('sessions', [
        { id: '1', date: null, updated_at: '2026-03-30T00:00:00Z' },
      ]);
      expect(result).toEqual({
        valid: false,
        error: 'Missing required column: date in records[0]',
      });
    });

    it('reports correct index for invalid record', () => {
      const result = validateRecords('sessions', [
        { id: '1', date: '2026-03-30', updated_at: '2026-03-30T00:00:00Z' },
        { id: '2', updated_at: '2026-03-30T00:00:00Z' },
      ]);
      expect(result).toEqual({
        valid: false,
        error: 'Missing required column: date in records[1]',
      });
    });
  });

  describe('sanitizeRecord', () => {
    it('strips unknown columns', () => {
      const result = sanitizeRecord('body_weights', {
        id: '1',
        date: '2026-03-30',
        weight: 185.5,
        unit: 'lbs',
        updated_at: '2026-03-30T00:00:00Z',
        is_sample: 0,
        extra_junk: 'should be stripped',
      });
      expect(result).toEqual({
        id: '1',
        date: '2026-03-30',
        weight: 185.5,
        unit: 'lbs',
        updated_at: '2026-03-30T00:00:00Z',
      });
      expect(result).not.toHaveProperty('is_sample');
      expect(result).not.toHaveProperty('extra_junk');
    });

    it('omits allowed columns not present in input', () => {
      const result = sanitizeRecord('body_weights', {
        id: '1',
        date: '2026-03-30',
        weight: 185.5,
        updated_at: '2026-03-30T00:00:00Z',
      });
      expect(result).not.toHaveProperty('unit');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ~/projects/cadre-shared
npx jest __tests__/api/tables.test.ts
```

Expected: FAIL — module doesn't exist yet.

- [ ] **Step 3: Create tables.ts**

```typescript
// src/api/tables.ts
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
  records: Record<string, unknown>[],
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
  record: Record<string, unknown>,
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

- [ ] **Step 4: Create API barrel export**

```typescript
// src/api/index.ts
export {
  ALLOWED_TABLES,
  type TableName,
  isAllowedTable,
  validateRecords,
  sanitizeRecord,
} from './tables';
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd ~/projects/cadre-shared
npx jest __tests__/api/tables.test.ts
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
cd ~/projects/cadre-shared
git add -A
git commit -m "feat: add API table types and validation"
```

---

### Task 4: Sync engine

**Files:**
- Create: `~/projects/cadre-shared/src/sync/SyncEngine.ts`
- Create: `~/projects/cadre-shared/src/sync/index.ts`
- Create: `~/projects/cadre-shared/__tests__/sync/SyncEngine.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/sync/SyncEngine.test.ts
import { SyncEngine, type SyncEngineConfig, type TablePushConfig } from '../../src/sync';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

function createEngine(overrides?: Partial<SyncEngineConfig>): SyncEngine {
  return new SyncEngine({
    apiUrl: 'https://api.example.com',
    apiKey: 'test-key',
    appId: 'test-app',
    getLastSync: jest.fn().mockResolvedValue(null),
    setLastSync: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  });
}

function createTableConfig(overrides?: Partial<TablePushConfig>): TablePushConfig {
  return {
    table: 'body_weights',
    getChangedRows: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('SyncEngine', () => {
  describe('registerTable', () => {
    it('registers a table for syncing', () => {
      const engine = createEngine();
      engine.registerTable(createTableConfig());
      // No error thrown = success
    });
  });

  describe('syncTable', () => {
    it('skips push when no changed rows', async () => {
      const engine = createEngine();
      engine.registerTable(createTableConfig({
        getChangedRows: jest.fn().mockResolvedValue([]),
      }));

      await engine.syncTable('body_weights');

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('pushes changed rows to the API', async () => {
      const setLastSync = jest.fn().mockResolvedValue(undefined);
      const engine = createEngine({ setLastSync });

      const rows = [
        { id: '1', date: '2026-03-30', weight: 185.5, updated_at: '2026-03-30T08:00:00Z' },
        { id: '2', date: '2026-03-29', weight: 186.0, updated_at: '2026-03-29T08:00:00Z' },
      ];

      engine.registerTable(createTableConfig({
        getChangedRows: jest.fn().mockResolvedValue(rows),
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ synced: 2, errors: 0 }),
      });

      await engine.syncTable('body_weights');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/body_weights',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'test-key',
          },
          body: JSON.stringify({
            app_id: 'test-app',
            records: rows,
          }),
        },
      );
    });

    it('updates last sync timestamp to max updated_at on success', async () => {
      const setLastSync = jest.fn().mockResolvedValue(undefined);
      const engine = createEngine({ setLastSync });

      const rows = [
        { id: '1', updated_at: '2026-03-29T08:00:00Z' },
        { id: '2', updated_at: '2026-03-30T08:00:00Z' },
        { id: '3', updated_at: '2026-03-28T08:00:00Z' },
      ];

      engine.registerTable(createTableConfig({
        getChangedRows: jest.fn().mockResolvedValue(rows),
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ synced: 3, errors: 0 }),
      });

      await engine.syncTable('body_weights');

      expect(setLastSync).toHaveBeenCalledWith('body_weights', '2026-03-30T08:00:00Z');
    });

    it('does not update last sync timestamp on API failure', async () => {
      const setLastSync = jest.fn().mockResolvedValue(undefined);
      const engine = createEngine({ setLastSync });

      engine.registerTable(createTableConfig({
        getChangedRows: jest.fn().mockResolvedValue([
          { id: '1', updated_at: '2026-03-30T08:00:00Z' },
        ]),
      }));

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Database error' }),
      });

      await engine.syncTable('body_weights');

      expect(setLastSync).not.toHaveBeenCalled();
    });

    it('passes last sync timestamp to getChangedRows', async () => {
      const getLastSync = jest.fn().mockResolvedValue('2026-03-29T00:00:00Z');
      const getChangedRows = jest.fn().mockResolvedValue([]);
      const engine = createEngine({ getLastSync });

      engine.registerTable(createTableConfig({ getChangedRows }));

      await engine.syncTable('body_weights');

      expect(getLastSync).toHaveBeenCalledWith('body_weights');
      expect(getChangedRows).toHaveBeenCalledWith('2026-03-29T00:00:00Z');
    });

    it('uses epoch when no last sync timestamp exists', async () => {
      const getLastSync = jest.fn().mockResolvedValue(null);
      const getChangedRows = jest.fn().mockResolvedValue([]);
      const engine = createEngine({ getLastSync });

      engine.registerTable(createTableConfig({ getChangedRows }));

      await engine.syncTable('body_weights');

      expect(getChangedRows).toHaveBeenCalledWith('1970-01-01T00:00:00Z');
    });

    it('applies transformRow when provided', async () => {
      const engine = createEngine();

      const rows = [
        { id: 1, date: '2026-03-30', weight: 185.5, updated_at: '2026-03-30T08:00:00Z' },
      ];

      engine.registerTable(createTableConfig({
        getChangedRows: jest.fn().mockResolvedValue(rows),
        transformRow: (row) => ({
          ...row,
          id: `weight-${row.date}`,
        }),
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ synced: 1, errors: 0 }),
      });

      await engine.syncTable('body_weights');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.records[0].id).toBe('weight-2026-03-30');
    });

    it('throws for unregistered table', async () => {
      const engine = createEngine();

      await expect(engine.syncTable('unknown_table')).rejects.toThrow(
        'Table "unknown_table" is not registered',
      );
    });
  });

  describe('syncAll', () => {
    it('syncs all registered tables', async () => {
      const engine = createEngine();

      const getChangedRows1 = jest.fn().mockResolvedValue([]);
      const getChangedRows2 = jest.fn().mockResolvedValue([]);

      engine.registerTable({ table: 'body_weights', getChangedRows: getChangedRows1 });
      engine.registerTable({ table: 'body_comp_scans', getChangedRows: getChangedRows2 });

      await engine.syncAll();

      expect(getChangedRows1).toHaveBeenCalled();
      expect(getChangedRows2).toHaveBeenCalled();
    });

    it('continues syncing other tables when one fails', async () => {
      const engine = createEngine();

      const getChangedRows1 = jest.fn().mockRejectedValue(new Error('DB error'));
      const getChangedRows2 = jest.fn().mockResolvedValue([]);

      engine.registerTable({ table: 'body_weights', getChangedRows: getChangedRows1 });
      engine.registerTable({ table: 'body_comp_scans', getChangedRows: getChangedRows2 });

      // Should not throw
      await engine.syncAll();

      expect(getChangedRows2).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ~/projects/cadre-shared
npx jest __tests__/sync/SyncEngine.test.ts
```

Expected: FAIL — module doesn't exist yet.

- [ ] **Step 3: Create SyncEngine.ts**

```typescript
// src/sync/SyncEngine.ts
const EPOCH = '1970-01-01T00:00:00Z';

export interface SyncEngineConfig {
  apiUrl: string;
  apiKey: string;
  appId: string;
  getLastSync: (table: string) => Promise<string | null>;
  setLastSync: (table: string, timestamp: string) => Promise<void>;
}

export interface TablePushConfig {
  table: string;
  getChangedRows: (since: string) => Promise<Record<string, unknown>[]>;
  transformRow?: (row: Record<string, unknown>) => Record<string, unknown>;
}

export class SyncEngine {
  private config: SyncEngineConfig;
  private tables = new Map<string, TablePushConfig>();

  constructor(config: SyncEngineConfig) {
    this.config = config;
  }

  registerTable(tableConfig: TablePushConfig): void {
    this.tables.set(tableConfig.table, tableConfig);
  }

  async syncTable(table: string): Promise<void> {
    const tableConfig = this.tables.get(table);
    if (!tableConfig) {
      throw new Error(`Table "${table}" is not registered`);
    }

    const lastSync = await this.config.getLastSync(table) ?? EPOCH;
    const rows = await tableConfig.getChangedRows(lastSync);

    if (rows.length === 0) return;

    const records = tableConfig.transformRow
      ? rows.map((row) => tableConfig.transformRow!(row))
      : rows;

    const response = await fetch(`${this.config.apiUrl}/v1/${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey,
      },
      body: JSON.stringify({
        app_id: this.config.appId,
        records,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.warn(`[sync] Failed to push ${table}: ${response.status}`, errorBody);
      return;
    }

    const maxUpdatedAt = rows.reduce((max, row) => {
      const val = row.updated_at as string;
      return val > max ? val : max;
    }, '');

    if (maxUpdatedAt) {
      await this.config.setLastSync(table, maxUpdatedAt);
    }
  }

  async syncAll(): Promise<void> {
    for (const table of this.tables.keys()) {
      try {
        await this.syncTable(table);
      } catch (err) {
        console.warn(`[sync] Error syncing ${table}:`, err);
      }
    }
  }
}
```

- [ ] **Step 4: Create sync barrel export**

```typescript
// src/sync/index.ts
export { SyncEngine, type SyncEngineConfig, type TablePushConfig } from './SyncEngine';
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd ~/projects/cadre-shared
npx jest __tests__/sync/SyncEngine.test.ts
```

Expected: All tests PASS.

- [ ] **Step 6: Run full test suite**

```bash
cd ~/projects/cadre-shared
npx jest
```

Expected: All tests PASS across all 3 test files.

- [ ] **Step 7: Run typecheck**

```bash
cd ~/projects/cadre-shared
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 8: Commit**

```bash
cd ~/projects/cadre-shared
git add -A
git commit -m "feat: add SyncEngine for generic cloud sync"
```

---

### Task 5: CLAUDE.md and tag v0.1.0

**Files:**
- Create: `~/projects/cadre-shared/CLAUDE.md`

- [ ] **Step 1: Create CLAUDE.md**

```markdown
# @cadre/shared — Cadre Ecosystem Shared Package

## What This Is

Shared code consumed by all apps in the Cadre ecosystem. Contains design tokens, cloud API types, and a generic sync engine.

**Consumers:**
- **Apex** — iOS workout logging app (`apex` repo)
- **Weight app** — iOS weight/body comp tracker (TBD repo)
- **Health API Worker** — Cloudflare Worker + D1 (`workers/health-api/` in Apex repo, will move)

## Package Structure

```
src/
  theme/     -- Design tokens: Colors, Spacing, FontSize, BorderRadius
  api/       -- Cloud API contract: table schemas, validation, types
  sync/      -- SyncEngine: generic push-to-cloud sync class
  components/ -- UI primitives (empty — promoted from apps when duplication is real)
```

## Key Decisions

- **No build step.** Consumers (Metro, wrangler) bundle TypeScript source directly.
- **Git dependency.** Apps install via `git+https://github.com/...#tag`. No registry.
- **Tokens are the source of truth.** Apps import tokens from here, not local copies.
- **SyncEngine is generic.** Each app provides its own table configs, queries, and transforms.
- **Components are earned.** Nothing goes in `src/components/` until two apps need it.

## Testing

```bash
npm test          # Run all tests
npm run typecheck # TypeScript check
```

## Versioning

Git tags: `v0.1.0`, `v0.2.0`, etc. Tag a new version when making changes that consumers need.
```

- [ ] **Step 2: Create empty components directory**

```typescript
// src/components/index.ts
// UI primitives promoted here when real duplication is found between apps.
// Empty on day one — see CLAUDE.md for the promotion rule.
```

- [ ] **Step 3: Commit and tag**

```bash
cd ~/projects/cadre-shared
git add -A
git commit -m "docs: add CLAUDE.md and empty components layer"
git tag v0.1.0
```

---

### Task 6: Create GitHub repo and push

- [ ] **Step 1: Create remote repo and push**

```bash
cd ~/projects/cadre-shared
gh repo create cadre-shared --private --source=. --push
git push origin --tags
```

- [ ] **Step 2: Verify repo exists**

```bash
gh repo view cadre-shared
```

Expected: Shows the private repo with description.

- [ ] **Step 3: Commit** (nothing to commit — just verification)

---

### Task 7: Migrate Apex theme to @cadre/shared

**Files:**
- Modify: `/Users/ben/projects/apex/package.json`
- Modify: `/Users/ben/projects/apex/src/theme/index.ts`
- Modify: `/Users/ben/projects/apex/src/theme/spacing.ts`
- Delete: `/Users/ben/projects/apex/src/theme/colors.ts`

- [ ] **Step 1: Install @cadre/shared in Apex**

```bash
cd /Users/ben/projects/apex
npm install git+https://github.com/bgibso4/cadre-shared.git#v0.1.0
```

Verify it appears in `package.json` dependencies.

- [ ] **Step 2: Update src/theme/index.ts**

Replace the entire file with:

```typescript
// src/theme/index.ts
// Shared tokens from @cadre/shared — single source of truth
export { Colors, Spacing, FontSize, BorderRadius } from '@cadre/shared/theme';
export type { ColorKey } from '@cadre/shared/theme';

// Apex-specific tokens and styles
export { ComponentSize } from './spacing';
export { SharedStyles } from './shared';
export { APEX_FONT_FAMILY, CUSTOM_FONTS } from './fonts';
```

- [ ] **Step 3: Update src/theme/spacing.ts — keep only ComponentSize**

Replace the entire file with:

```typescript
// src/theme/spacing.ts
// Spacing, FontSize, and BorderRadius are now in @cadre/shared.
// This file only contains Apex-specific component size tokens.

/** Component size tokens for tap targets and interactive elements */
export const ComponentSize = {
  buttonSmall: 28,
  buttonMedium: 36,
  buttonLarge: 44,
  setButtonWidth: 56,
  setButtonHeight: 36,
  dayDotSize: 28,
  warmupCheckSize: 24,
  conditioningCheckSize: 28,
  modalWidth: 300,
  progressBarHeight: 4,
  timelineHeight: 32,
  timelineHeightSmall: 24,
  chartHeight: 120,
  chartHeightSmall: 80,
  tabBarHeight: 84,
  tabBarPaddingBottom: 28,
  tabBarPaddingTop: 8,

  // Volume bar chart
  volumeBarHeight: 20,
  volumeBarInnerHeight: 12,
  volumeNumsWidth: 55,
  volumeWeekLabelWidth: 24,

  // Legend / indicator dots
  legendDotSize: 8,
  bandDotSize: 6,
} as const;
```

- [ ] **Step 4: Delete src/theme/colors.ts**

```bash
cd /Users/ben/projects/apex
rm src/theme/colors.ts
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /Users/ben/projects/apex
npx tsc --noEmit
```

Expected: No errors. All component files still import from `../theme` or `../../src/theme` which re-exports from `@cadre/shared`.

If there are module resolution issues with `@cadre/shared/theme` subpath exports, add to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@cadre/shared/*": ["./node_modules/@cadre/shared/src/*"]
    }
  }
}
```

- [ ] **Step 6: Run Apex test suite**

```bash
cd /Users/ben/projects/apex
npm test
```

Expected: All existing tests pass — no component imports changed.

- [ ] **Step 7: Commit**

```bash
cd /Users/ben/projects/apex
git add package.json package-lock.json src/theme/index.ts src/theme/spacing.ts
git rm src/theme/colors.ts
git commit -m "refactor: migrate theme tokens to @cadre/shared"
```

---

### Task 8: Migrate Apex sync client to use SyncEngine

**Files:**
- Modify: `/Users/ben/projects/apex/src/sync/syncClient.ts`

- [ ] **Step 1: Run existing sync tests to verify green baseline**

```bash
cd /Users/ben/projects/apex
npx jest __tests__/sync/
```

Expected: All sync tests pass. Note the test structure — `syncClient.test.ts` mocks `../../src/db/database` and global `fetch`.

- [ ] **Step 2: Rewrite src/sync/syncClient.ts to use SyncEngine**

Replace the entire file with:

```typescript
// src/sync/syncClient.ts
import { SyncEngine } from '@cadre/shared/sync';
import { getDatabase } from '../db/database';
import { SYNC_TABLES, getSyncQuery, transformRow, type SyncTableName } from './syncConfig';
import { getLastSync, setLastSync } from './syncStorage';
import { WHOOP_WORKER_URL, WHOOP_WORKER_API_KEY } from '../health/config';

const engine = new SyncEngine({
  apiUrl: WHOOP_WORKER_URL,
  apiKey: WHOOP_WORKER_API_KEY,
  appId: 'apex',
  getLastSync,
  setLastSync,
});

// Register each Apex table with its local query and transform logic
for (const [table, config] of Object.entries(SYNC_TABLES)) {
  engine.registerTable({
    table,
    getChangedRows: async (since: string) => {
      const db = await getDatabase();
      const query = getSyncQuery(table as SyncTableName);
      return db.getAllAsync<Record<string, unknown>>(query, [since]);
    },
    transformRow: (row) => transformRow(table as SyncTableName, row),
  });
}

export const syncAll = () => engine.syncAll();
export const syncTable = (table: string) => engine.syncTable(table);
```

- [ ] **Step 3: Run sync tests**

```bash
cd /Users/ben/projects/apex
npx jest __tests__/sync/
```

The existing sync tests mock `../../src/db/database` and `global.fetch`. Since `SyncEngine` uses global `fetch` internally, the mocks should still intercept correctly. `syncConfig.test.ts` and `syncStorage.test.ts` are untouched and should pass.

`syncClient.test.ts` may need updates if it mocks the old `syncClient` internals directly. If tests fail:
- Tests that mock `getDatabase` and `fetch` and then call `syncAll()`/`syncTable()` should still work because the engine calls the same functions.
- Tests that check internal implementation details of the old `syncClient` may need adjustment to test the public API (`syncAll`, `syncTable`) instead.

Expected: All sync tests pass. If `syncClient.test.ts` fails, adjust the mocking to align with the new module structure (the getDatabase mock path is unchanged, fetch is still global).

- [ ] **Step 4: Run full Apex test suite**

```bash
cd /Users/ben/projects/apex
npm test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/ben/projects/apex
git add src/sync/syncClient.ts
git commit -m "refactor: migrate sync client to use SyncEngine from @cadre/shared"
```

---

### Task 9: Migrate Worker to use @cadre/shared API types

**Files:**
- Modify: `/Users/ben/projects/apex/workers/health-api/package.json`
- Modify: `/Users/ben/projects/apex/workers/health-api/src/lib/tables.ts`

- [ ] **Step 1: Run Worker tests to verify green baseline**

```bash
cd /Users/ben/projects/apex/workers/health-api
npm test
```

Expected: All Worker tests pass.

- [ ] **Step 2: Install @cadre/shared in Worker**

```bash
cd /Users/ben/projects/apex/workers/health-api
npm install git+https://github.com/bgibso4/cadre-shared.git#v0.1.0
```

- [ ] **Step 3: Replace src/lib/tables.ts with re-export from @cadre/shared**

Replace the entire file with:

```typescript
// src/lib/tables.ts
// API contract types and validation from @cadre/shared — single source of truth.
export {
  ALLOWED_TABLES,
  type TableName,
  isAllowedTable,
  validateRecords,
  sanitizeRecord,
} from '@cadre/shared/api';
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/ben/projects/apex/workers/health-api
npx tsc --noEmit
```

If there are module resolution issues (wrangler uses esbuild which resolves TypeScript), add to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@cadre/shared/*": ["./node_modules/@cadre/shared/src/*"]
    }
  }
}
```

Expected: No errors.

- [ ] **Step 5: Run Worker tests**

```bash
cd /Users/ben/projects/apex/workers/health-api
npm test
```

Expected: All tests pass — the exports are identical, just sourced from a different location.

- [ ] **Step 6: Commit**

```bash
cd /Users/ben/projects/apex
git add workers/health-api/package.json workers/health-api/package-lock.json workers/health-api/src/lib/tables.ts
git commit -m "refactor: migrate Worker API types to @cadre/shared"
```

---

### Task 10: Final verification and cleanup

**Files:**
- None new — verification only

- [ ] **Step 1: Run full Apex test suite**

```bash
cd /Users/ben/projects/apex
npm test
```

Expected: All tests pass.

- [ ] **Step 2: Run Worker test suite**

```bash
cd /Users/ben/projects/apex/workers/health-api
npm test
```

Expected: All tests pass.

- [ ] **Step 3: Run Apex typecheck**

```bash
cd /Users/ben/projects/apex
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Verify no leftover local duplicates**

```bash
# colors.ts should be gone
ls /Users/ben/projects/apex/src/theme/colors.ts 2>/dev/null && echo "ERROR: colors.ts still exists" || echo "OK: colors.ts removed"

# spacing.ts should only have ComponentSize
grep -c "export const" /Users/ben/projects/apex/src/theme/spacing.ts
# Expected: 1 (just ComponentSize)

# Worker tables.ts should be a thin re-export
wc -l /Users/ben/projects/apex/workers/health-api/src/lib/tables.ts
# Expected: ~7 lines
```

- [ ] **Step 5: Commit any final adjustments if needed**

If all verifications pass and no adjustments were needed, skip this step.
