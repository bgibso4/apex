# Tokens + Sync-Contract Codegen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `tokens.json` and `sync-contract.json` in the cadre repo the canonical sources for the APEX design language and the cloud sync contract, with generators emitting every consumer artifact (TS, Swift, CSS) and staleness tests that fail when any committed output drifts.

**Architecture:** Two canonical JSON files in `/Users/ben/projects/cadre` (`tokens/apex.json`, `contracts/sync.json`) + one zero-dependency Node generator script per file. Generated outputs are committed in cadre; staleness checks are ordinary jest tests (regenerate in-memory, compare to committed file), so `npm test` is the drift gate. The frozen RN app's legacy theme (`src/theme/colors.ts`) is untouched — the new language lives in new modules. Swift/CSS artifacts are committed in cadre and copied into consumers by their own plans (Foundation plan wires the Swift theme; Phase 1 kickoff consumes the CSS).

**Tech Stack:** Node ≥20 (no runtime deps), TypeScript 5.3, jest + ts-jest (already in cadre), git tag pinning (`github:bgibso4/cadre#vX`).

## Global Constraints

- Charter (canonical values, verbatim): `docs/superpowers/specs/…` — no; the authoritative value source is `/Users/ben/projects/apex/docs/design-system/context/design-language.html` (direction lock, 2026-07-21). Key values: field base `#090A0C`, field mid `#0C0E11`, card top `#14161B`, card bottom `#0E1013`, border `#20232A`, border light `#2C3039`, text `#EDEEF0`/`#8F9098`/`#55575F`, accent default `#659BC8` (alternate violet `#8A91C9`), onAccent `#0B0C0E`, logged moss `#6CA383`, tint alpha 10%, radius 10/6/999, halo geometry `ellipse 90% 45% at 50% -5%` with mid stop at 55%, halo stop `#141A22` for the blue accent.
- **Halo is a derived token:** `halo = mix(field.mid, accent.primary, 0.09)` per-channel linear mix, rounded — the generator computes it; a test asserts `#141A22` for the blue default. Swapping the accent regenerates the halo automatically.
- **The frozen RN app must be unaffected:** `src/theme/colors.ts`, `src/theme/spacing.ts`, and the existing `@cadre/shared/theme` export surface keep byte-identical behavior. New modules only.
- **The Worker's public behavior must be unaffected by the contract migration:** `ALLOWED_TABLES`, `isAllowedTable`, `validateRecords`, `sanitizeRecord` keep identical signatures and semantics; existing cadre jest tests for `src/api/tables.ts` must pass unmodified against the generated module (they are the port-verification harness).
- **Strict Worker validation ships log-only until cutover** (spec: "Canonical sync contract" section) — enforcement flag defaults to log mode.
- **Decision embedded in this plan (flag to Ben at review): `weight_adjustments` joins the contract and D1 schema** — the ecosystem is the stated point of D1, RPE history is ecosystem data. The frozen RN app's `SYNC_TABLES` is NOT touched (RN never pushes it; the Swift app will).
- Repos/branches: cadre work on branch `feat/tokens-contract-codegen` in `/Users/ben/projects/cadre` (new branch off main); apex Worker + pin-bump work on branch `feat/sync-contract-worker` off apex main. Commit at every task boundary. No pushes/PRs without Ben's go.
- Generated files carry a first-line header: `// GENERATED from <source> — do not edit. Regenerate: npm run tokens` (comment syntax per language).
- All emitted hex values UPPERCASE with leading `#`; tints emitted as 8-digit hex (`#659BC81A`).

---

### Task 1: `tokens/apex.json` + generator skeleton with validation

**Files:**
- Create: `/Users/ben/projects/cadre/tokens/apex.json`
- Create: `/Users/ben/projects/cadre/scripts/generate-tokens.mjs`
- Test: `/Users/ben/projects/cadre/__tests__/tokens.test.ts`

**Interfaces:**
- Produces: `tokens/apex.json` shape consumed by Tasks 2–4:

```json
{
  "version": 1,
  "language": "precision-blue",
  "color": {
    "field":  { "base": "#090A0C", "mid": "#0C0E11" },
    "halo":   { "geometry": "ellipse 90% 45% at 50% -5%", "midStopPct": 55, "mixWeight": 0.09 },
    "card":   { "top": "#14161B", "bottom": "#0E1013" },
    "border": { "default": "#20232A", "light": "#2C3039" },
    "text":   { "primary": "#EDEEF0", "secondary": "#8F9098", "muted": "#55575F" },
    "accent": { "primary": "#659BC8", "onAccent": "#0B0C0E", "alternates": { "violet": "#8A91C9" } },
    "state":  { "logged": "#6CA383" },
    "alpha":  { "tint": 0.1 }
  },
  "radius": { "card": 10, "nested": 6, "pill": 999 },
  "type": {
    "screenTitle": { "size": 20, "weight": 800, "tracking": -0.3 },
    "cardName":    { "size": 14, "weight": 700 },
    "heroNumeral": { "size": 34, "weight": 800, "tabular": true },
    "value":       { "size": 13, "weight": 600, "tabular": true },
    "body":        { "size": 11, "weight": 400 },
    "eyebrow":     { "size": 10, "weight": 700, "tracking": 1.1, "uppercase": true }
  }
}
```

- Produces (from the script): `loadTokens(path)` → validated object with computed `derived: { halo: "#141A22", tints: { accent: "#659BC81A", logged: "#6CA3831A" } }`; `mix(hexA, hexB, w)`; script is import-safe (`main()` only when executed directly) so jest imports its functions.

- [ ] **Step 1: Write the failing tests**

In `__tests__/tokens.test.ts`:

```ts
import { loadTokens, mix } from '../scripts/generate-tokens.mjs';

describe('tokens', () => {
  const t = loadTokens('tokens/apex.json');
  it('derives the halo from field.mid + accent at mixWeight', () => {
    expect(t.derived.halo).toBe('#141A22');
    expect(mix('#0C0E11', '#659BC8', 0.09)).toBe('#141A22');
  });
  it('derives 10% tints as 8-digit hex', () => {
    expect(t.derived.tints.accent).toBe('#659BC81A');
    expect(t.derived.tints.logged).toBe('#6CA3831A');
  });
  it('rejects a tokens file missing a required group', () => {
    expect(() => loadTokens('__tests__/fixtures/tokens-missing-card.json')).toThrow(/color\.card/);
  });
});
```

Also create the fixture `__tests__/fixtures/tokens-missing-card.json` (copy of apex.json with `color.card` deleted).

- [ ] **Step 2: Run tests, verify they fail** — `cd /Users/ben/projects/cadre && npx jest tokens` → FAIL (module not found).

- [ ] **Step 3: Implement** — write `tokens/apex.json` exactly as the shape above; write `generate-tokens.mjs` with `mix` (per-channel `round(a + (b−a)·w)`), `loadTokens` (parse, validate required paths `color.field/halo/card/border/text/accent/state/alpha`, `radius`, `type` — throw naming the missing path; compute `derived`), and an inert `main()` guard. ts-jest must transpile the `.mjs` import — if jest can't resolve it, add `moduleFileExtensions`/`transform` for mjs in `jest.config.js` (smallest working change; note it in the commit).

- [ ] **Step 4: Run tests, verify pass** — `npx jest tokens` → 3 passing. Also `npm run typecheck` stays clean.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: canonical tokens/apex.json + validated loader with derived halo/tints"`

---

### Task 2: TypeScript emitter → `src/theme/apexNative.ts`

**Files:**
- Modify: `/Users/ben/projects/cadre/scripts/generate-tokens.mjs` (add `emitTs(tokens)` + write step in `main()`)
- Create (generated): `/Users/ben/projects/cadre/src/theme/apexNative.ts`
- Modify: `/Users/ben/projects/cadre/src/theme/index.ts` (add `export * as ApexNative from './apexNative';` — additive only)
- Modify: `/Users/ben/projects/cadre/package.json` (add script `"tokens": "node scripts/generate-tokens.mjs"`)
- Test: `/Users/ben/projects/cadre/__tests__/tokens-emit-ts.test.ts`

**Interfaces:**
- Produces: `ApexNative` TS module exporting `Colors` (flat: `fieldBase, fieldMid, halo, cardTop, cardBottom, border, borderLight, textPrimary, textSecondary, textMuted, accent, onAccent, logged, accentTint, loggedTint` — all string hex), `Radius`, `Type`, `HaloGeometry` (the geometry string + midStopPct). Legacy `Colors` from `colors.ts` is untouched and still the default `./theme` export.

- [ ] **Step 1: Failing test**

```ts
import { loadTokens, emitTs } from '../scripts/generate-tokens.mjs';
import * as fs from 'fs';

it('committed apexNative.ts matches a fresh emit (staleness gate)', () => {
  const fresh = emitTs(loadTokens('tokens/apex.json'));
  expect(fs.readFileSync('src/theme/apexNative.ts', 'utf8')).toBe(fresh);
});
it('emitted module exposes the derived halo', async () => {
  const m = await import('../src/theme/apexNative');
  expect(m.Colors.halo).toBe('#141A22');
  expect(m.Colors.accentTint).toBe('#659BC81A');
});
```

- [ ] **Step 2: Verify fail** — `npx jest tokens-emit-ts` → FAIL (no emitTs / no file).
- [ ] **Step 3: Implement** — `emitTs` builds the module as a template string (header line first), deterministic key order; `main()` writes it; run `npm run tokens` to produce the committed file; wire the index re-export.
- [ ] **Step 4: Verify pass** — `npx jest tokens-emit-ts` → 2 passing; `npm test` fully green (legacy theme tests untouched); `npm run typecheck` clean.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: TS emitter — generated ApexNative theme module + staleness test"`

---

### Task 3: Swift emitter → `generated/swift/ApexTheme.swift`

**Files:**
- Modify: `scripts/generate-tokens.mjs` (add `emitSwift(tokens)`)
- Create (generated): `/Users/ben/projects/cadre/generated/swift/ApexTheme.swift`
- Test: `/Users/ben/projects/cadre/__tests__/tokens-emit-swift.test.ts`

**Interfaces:**
- Produces: a self-contained SwiftUI file: `enum ApexTheme` with nested `enum Colors` (static `Color` values via a private `Color(hex:)` init emitted in the same file, including alpha variants), `enum Radius` (CGFloat), `enum Type` (size/weight/tracking constants), plus `Colors.halo` and a `haloGradient(center:)` helper comment documenting the geometry. Consumed later by the Foundation plan (copied into `apex-ios`), not compiled here.

- [ ] **Step 1: Failing test** — same staleness pattern as Task 2 (`emitSwift` vs committed file) plus content assertions: output contains `static let accent = Color(hex: 0x659BC8)`, `static let halo = Color(hex: 0x141A22)`, `static let accentTint = Color(hex: 0x659BC8, alpha: 0.1)`, and the generated-file header as line 1.
- [ ] **Step 2: Verify fail** — `npx jest tokens-emit-swift` → FAIL.
- [ ] **Step 3: Implement** — emit hex as `0xRRGGBB` integers (no string parsing at runtime); include the `Color(hex:alpha:)` extension in-file so the artifact is drop-in; regenerate via `npm run tokens`.
- [ ] **Step 4: Verify pass** — `npx jest tokens-emit-swift` green; eyeball the Swift file compiles-by-inspection (no Swift toolchain in cadre — the Foundation plan owns compile verification; note this limitation in the file header).
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: Swift emitter — generated ApexTheme.swift artifact"`

---

### Task 4: CSS emitter → `generated/css/apex-tokens.css`

**Files:**
- Modify: `scripts/generate-tokens.mjs` (add `emitCss(tokens)`)
- Create (generated): `/Users/ben/projects/cadre/generated/css/apex-tokens.css`
- Test: `/Users/ben/projects/cadre/__tests__/tokens-emit-css.test.ts`

**Interfaces:**
- Produces: a `:root { … }` block with custom properties named exactly as the v5–v8 reference pages evolved them: `--field-base --field-mid --halo --card-top --card-base --border --border-lt --text --text-2 --text-muted --accent --on-accent --logged --accent-tint --logged-tint --r-card --r-nested --r-pill`, plus a comment line carrying the halo geometry string. Phase 1's design-system foundations pages and mockup templates paste this block verbatim.

- [ ] **Step 1: Failing test** — staleness pattern + assertions: contains `--accent:#659BC8;`, `--halo:#141A22;`, `--accent-tint:#659BC81A;`, `--r-card:10px;`, and the geometry comment.
- [ ] **Step 2: Verify fail** → **Step 3: Implement** → **Step 4: Verify pass** (`npx jest tokens-emit-css`; full `npm test` green) — same cycle as Task 3.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: CSS emitter — generated apex-tokens.css custom-property block"`

---

### Task 5: `contracts/sync.json` + generated tables module (API-identical)

**Files:**
- Create: `/Users/ben/projects/cadre/contracts/sync.json`
- Create: `/Users/ben/projects/cadre/scripts/generate-contract.mjs`
- Create (generated): `/Users/ben/projects/cadre/src/api/tables.generated.ts`
- Modify: `/Users/ben/projects/cadre/src/api/index.ts` (re-export from `./tables.generated` instead of `./tables`)
- Delete: `/Users/ben/projects/cadre/src/api/tables.ts` (after parity proven)
- Modify: `package.json` (script `"contract": "node scripts/generate-contract.mjs"`)
- Test: existing `__tests__/` tables tests (unmodified — the parity harness) + new `__tests__/contract.test.ts` (staleness gate, same pattern as Task 2)

**Interfaces:**
- Produces: `contracts/sync.json` — `{ "version": 1, "tables": { "<name>": { "columns": [...], "required": [...] } } }`, transcribed 1:1 from today's `src/api/tables.ts` `ALLOWED_TABLES`, **plus one addition**: `weight_adjustments` with columns `["id","exercise_id","program_id","session_id","old_weight","new_weight","reason","created_at"]`, required `["id","exercise_id","old_weight","new_weight","reason"]` (from apex `src/db/schema.ts` v17 table).
- Produces: `tables.generated.ts` exporting `ALLOWED_TABLES`, `isAllowedTable`, `validateRecords`, `sanitizeRecord` with identical signatures/semantics (the three functions move verbatim from `tables.ts`; only the data literal is generated).

- [ ] **Step 1: Transcribe + write the staleness test first** — author `contracts/sync.json` from `tables.ts` (mechanical, column-for-column) + the `weight_adjustments` block above; write `__tests__/contract.test.ts` staleness test (emit vs committed) and a content test: `expect(ALLOWED_TABLES.weight_adjustments.required).toContain('reason')`.
- [ ] **Step 2: Verify fail** — `npx jest contract` → FAIL.
- [ ] **Step 3: Implement** — `generate-contract.mjs` (loader validates every table has non-empty `columns` ⊇ `required`; emitter produces the data literal + verbatim function bodies); run `npm run contract`; rewire `src/api/index.ts`; delete `tables.ts` only after Step 4 proves parity.
- [ ] **Step 4: Verify pass** — full `npm test`: ALL existing tables tests green against the generated module (zero test edits — if any test needs editing, STOP: that's a parity break, report DONE_WITH_CONCERNS), `npm run typecheck` clean.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: canonical sync contract + generated tables module (API-identical, adds weight_adjustments)"`

---

### Task 6: Worker — D1 schema for `weight_adjustments` + strict-mode flag (apex repo)

**Files:**
- Modify: `/Users/ben/projects/apex/workers/health-api/src/db/schema.sql` (add `weight_adjustments` table mirroring apex v17: TEXT id PK, exercise_id, program_id, session_id, old_weight REAL, new_weight REAL, reason TEXT CHECK(reason IN ('easy','misses')), created_at)
- Modify: `/Users/ben/projects/apex/workers/health-api/src/routes/sync.ts` (strict-mode branch)
- Modify: `/Users/ben/projects/apex/workers/health-api/wrangler.toml` (add `[vars] CONTRACT_MODE = "log"`)
- Test: the Worker's existing vitest suite + new cases in its sync route test file

**Interfaces:**
- Consumes: `@cadre/shared/api` (unchanged API, now generated — Worker code does not change imports)
- Produces: behavior — `CONTRACT_MODE=log` (default): current sanitize-and-accept, but log a structured line for every dropped column/record (`console.warn('[contract] dropped', {table, column})`); `CONTRACT_MODE=enforce`: reject the batch with 422 listing violations. Enforce is enabled only at cutover (spec rule).

- [ ] **Step 1: Failing tests** — in the Worker's sync route test file: (a) posting a record with an unknown column in log mode → 200, record stored sans column, warn called with the column name; (b) same post with `CONTRACT_MODE: 'enforce'` in the test env → 422 with the column named in the body; (c) posting a valid `weight_adjustments` record → 200, row persisted.
- [ ] **Step 2: Verify fail** — `cd workers/health-api && npx vitest run sync` → new cases FAIL.
- [ ] **Step 3: Implement** — schema.sql table + the mode branch in the sync route (read `env.CONTRACT_MODE ?? 'log'`); note in the plan-executor's report that the live D1 database needs `wrangler d1 execute apex-health-db --file src/db/schema.sql --remote` (or the ALTER equivalent) at deploy time — deployment itself is NOT part of this task (Ben deploys).
- [ ] **Step 4: Verify pass** — full Worker vitest suite green.
- [ ] **Step 5: Commit** (apex repo, branch `feat/sync-contract-worker`) — `git add workers/health-api && git commit -m "feat: weight_adjustments in D1 schema + contract strict-mode flag, log-only default (#61)"`

---

### Task 7: Docs, tag, and pin bump

**Files:**
- Modify: `/Users/ben/projects/cadre/CLAUDE.md` (document: canonical files, `npm run tokens` / `npm run contract`, the staleness-tests-are-the-gate rule, the accent-swap procedure: edit one value in `tokens/apex.json` → `npm run tokens` → commit → tag)
- Modify: `/Users/ben/projects/apex/package.json` (dependency `"@cadre/shared": "github:bgibso4/cadre#v0.2.0"`)
- Modify: `/Users/ben/projects/apex/docs/superpowers/specs/2026-07-15-swiftui-migration-redesign-design.md` (Canonical tokens + Canonical sync contract sections: one-line status updates pointing at the now-real files)

**Interfaces:**
- Consumes: everything above, merged to cadre main and tagged `v0.2.0` (tag/merge is Ben's call — the task prepares and verifies, stops before push)

- [ ] **Step 1: Docs** — write the CLAUDE.md sections; update the two spec sections.
- [ ] **Step 2: Local pin verification** — in apex: `npm install /Users/ben/projects/cadre` (temporary local link), run `npm test` (full RN suite) → must be fully green, proving the generated api module + additive theme export break nothing in the frozen app. Then restore the package.json line to the `#v0.2.0` git ref (which resolves after Ben tags).
- [ ] **Step 3: Verify** — `git -C /Users/ben/projects/cadre status` clean, all cadre tests green (`npm test`), apex suite green from Step 2.
- [ ] **Step 4: Commit** — cadre: `git commit -am "docs: codegen workflow + accent-swap procedure"`; apex: `git add package.json docs/superpowers/specs && git commit -m "chore: pin @cadre/shared v0.2.0 + spec status for canonical tokens/contract (#61)"`
- [ ] **Step 5: Hand to Ben** — cadre branch ready for his push/PR/tag `v0.2.0`; apex branch `feat/sync-contract-worker` ready for PR. NO pushes without his approval.

---

## Self-Review

- **Spec coverage:** decomposition item 3 requires: where generators run (cadre, `npm run tokens`/`contract`) ✓; which outputs are committed in each consumer (all committed in cadre; Swift copied by Foundation plan, CSS by Phase 1 — stated) ✓; how consumers pin (git tag `#v0.2.0`, local-link verification step) ✓; regenerate-and-diff staleness check (jest staleness tests, `npm test` is the gate) ✓ including the sync contract ✓. Spec's Worker log-only rule ✓ (Task 6). `weight_adjustments` explicit decision ✓ (include; flagged to Ben). Charter's derived-halo rule ✓ (mix 0.09, tested).
- **Placeholder scan:** none — every step has content, commands, or exact assertions.
- **Type consistency:** `loadTokens/mix/emitTs/emitSwift/emitCss` names consistent across Tasks 1–4; `ALLOWED_TABLES/isAllowedTable/validateRecords/sanitizeRecord` preserved verbatim in Task 5; `CONTRACT_MODE` values `log|enforce` consistent in Task 6.
