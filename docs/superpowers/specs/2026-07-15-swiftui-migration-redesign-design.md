# APEX Native — SwiftUI Migration + Redesign

**Date:** 2026-07-15
**Status:** Approved design, pending implementation planning
**Supersedes:** `docs/plans/react-native-vs-swift.md` (March 2026, "stay on React Native")
**Closes when complete:** #61 (this effort); #66, #70, #46, #68, #67, #65 (folded into redesign); #69 (RN quick fix + Swift resolution)

## Summary

Rebuild APEX as a native SwiftUI iOS app in this repo, alongside the untouched React Native app, with a full visual + flow redesign driven by Claude Design. The RN app remains Ben's daily driver until the Swift app reaches parity plus redesigned core flows, then his live SQLite data transfers across and the RN app retires in place.

This is three efforts braided together, sequenced so each feeds the next:

1. **Art direction** — an open-ended vision phase producing a locked visual identity
2. **Full-app design** — every cutover-scope screen designed as one cohesive campaign in Claude Design
3. **Native rebuild** — a layered Swift app with the existing SQLite data, the existing Cloudflare backend, and a day-one agent-driven testing harness

## Locked Decisions

| Decision | Choice |
|---|---|
| North star | Personal-first, with App Store-ready seams (secrets out of source, clean boundaries, no architectural dead-ends). App Store is a later phase, not a rewrite. |
| Cloud | Cadre ecosystem stays. Cloudflare Worker + D1 survive as-is; Swift re-implements the sync client. CloudKit is a documented future option, not v1. |
| Redesign depth | Evolve the dark instrument-panel DNA. Open-ended art-direction exploration first; no candidate cap. |
| RN app policy | Frozen: critical bugs + trivial QoL only (#67 keyboard, #69 prompt removal are candidates). All feature/redesign work happens once, in Swift. |
| Repo | Same repo, sibling directory `apex-ios/`. The fork is logical, not physical. |
| Cutover bar | Parity + redesigned core flows. New-feature issues (#64, #71, #73, #63, #49) come after cutover, Swift-only. |
| Build sequence | Design the whole app before building: art direction → full-app design campaign → foundation + flow-by-flow implementation. A small number of deferrable views may be designed later. |
| Testing | Beacon-style visible-simulator XCUITest harness + Swift Testing unit target, both from day one. |
| Tokens | Canonical `tokens.json` with codegen to every consumer, from day one. |
| Platform | Latest stable: Swift 6.2 (strict concurrency complete), iOS 26 deployment target, Observation, Swift Testing, Swift Charts, NavigationStack, XcodeGen. Build for the future, not the past. |

## Principles

These are binding on all downstream plans, not aspirational.

**Design:** The bar is the world's most lovable software — Ive-grade restraint, clean minimalism, seamless flows. Minimal touches to complete a goal is the product's soul (one tap logs a set as prescribed). Every redesigned flow must reduce or hold interaction count versus today, never increase it. The existing tenets (optimize for the common case, state is sacred, progressive disclosure, no vanity metrics, tokens not magic numbers) all carry forward.

**Engineering:** Design like a principal engineer. SOLID first — especially dependency inversion at every boundary. DRY where duplication is real (the RN app's 34 duplicated StyleSheets are the cautionary tale). Extensibility investments are judged on reasoning, not acronyms: when an ecosystem direction is stated (tokens, sync contract), build the shared abstraction now — extraction later costs far more. When a future is speculative (CloudKit, multi-user), leave a protocol seam and stop.

**Boundaries:** Anything mocked in tests is a thing that can change in production. Views and view models depend on protocols (`WorkoutStore`, `HealthProvider`, `SyncService`, `BackupService`), never on GRDB, Whoop, or Cloudflare directly. If D1 becomes a real server or CloudKit arrives, one implementation swaps behind an unchanged protocol; tests and views don't move.

## Phase 0 — Art Direction (vision alignment)

The most human-involved phase. No candidate cap and no deadline pressure: this is the visual identity of a production app users would rely on.

- I refresh the synced **"APEX Design System"** claude.ai project (via DesignSync) with: current tokens as baseline, the audit's component inventory, and a written redesign brief — tenets, screen/flow inventory, flow fixes from the issues, and the stated direction (replace the indigo, cleaner, keep the dark minimalist DNA, keep the APEX name/wordmark/logo).
- Each round, candidate directions are pushed as **specimen pages**: palette + typography + card language + one hero screen rendered in that direction (the workout logging card — the soul of the app), so directions are judged on real content, not swatches.
- Ben explores and reacts at claude.ai/design (desktop app or web); reactions drive the next round — diverge, blend, kill, refine. Seed with 2–3, iterate without limit.
- **Explicit question for this phase:** APEX's stance on iOS 26's Liquid Glass material language — embrace, resist for the flat instrument-panel look, or blend (e.g., native materials for sheets/tab bar, flat cards for content). Decided deliberately, not by accident.
- **Exit criterion:** Ben declares the direction locked. The winning direction is codified into the design-system project foundations (colors, typography, spacing, core components) so Phase 1 inherits it automatically.

## Phase 1 — Full-App Design Campaign

Design the entire cutover-scope app as one cohesive campaign against the locked system. Designing all screens together is deliberate: Ben knows how the flows interconnect, and a single campaign maximizes consistency and cohesion.

**Screens (cutover scope):**
- Home — active / no-program / completed-program states; in-progress-session surfaced (#70)
- Workout — select → warmup (#46 expandable protocols) → logging → complete; day-selector, add-exercise, adjust modals; the #66 fixes designed in from the start (tap targets, set add/remove, add/reorder flow)
- Progress — PRs surfaced, readable trend charts (#68)
- Running — log + trends
- Exercise detail (+ progression & session history), Session detail (+ timestamp editing, #65)
- Library, Settings, Program completion (celebration + summary)
- System-wide: keyboard handling (#67), post-workout flow without the redundant save prompt (#69)

**Deferred designs (entry points reserved in navigation, screens designed later):** #64 program overview, #71 off-program training, #73 program run history, #63 history browsing, #49 weekly check-ins.

**Pipeline:** designed in Claude Design → Ben exports (manual — DesignSync reads/writes only the design-system project) → I convert the templated canvas export to static HTML → committed to `docs/mockups/` with date suffixes. **Mockups remain the implementation contract**; Phase 3 builds against them, not against memory.

## Phase 2 — Foundation (parallel with Phase 1 once direction locks)

Scaffold `apex-ios/`:

- **XcodeGen** — `project.yml` is truth, `.xcodeproj` gitignored (same regenerable-native ethos as the RN app's `ios/`).
- **Targets:** `Apex` (app), `ApexKit` (domain core), `ApexTests` (Swift Testing), `ApexUITests` (XCUITest). Two schemes: `Apex` and `Apex-UITest` (run action injects `-UITestMode`).
- **`ApexKit` port:** pure domain logic (~2,500 LOC) — models, Epley, target-weight, RPE progression engine, program/block/target resolution, PR detection, superset grouping, delta calculation, field profiles. The existing 737 tests' coverage transliterated to Swift Testing is the port-correctness harness.
- **Data layer:** GRDB opens the existing `apex.db` (WAL, foreign keys ON per connection). `schema_info.schema_version = 17` is the migration anchor; Swift migrations continue v18+. The JS migration ladder is treated as "assume ≥17" for the live device; the import path validates version for restored backups.
- **Dev/test harness from day one** (see Testing section): make targets, A11y catalog + enforcement tests, launch-arg fixture modes, allowlisted agent permissions.
- **No product UI yet** beyond a dev shell proving the stack end-to-end.

## Phase 3 — Build Flow-by-Flow

Against approved mockups, in order: design system + component library → Workout → Home → Progress → Exercise/Session detail → Running → Library/Settings → integrations (Whoop, sync, backup). Each flow is its own implementation plan and PR, with unit + UI tests landing with the flow.

## Phase 4 — Cutover

1. Parity checklist per flow against the RN app.
2. Export live `.db` from RN (existing export flow) → import into the Swift app (same file format; GRDB opens it directly).
3. Validation week: Swift app is the daily driver, RN app is the fallback. **Single-writer rule:** only the Swift app pushes to D1 during this window to avoid double-writes.
4. Retire the RN app in place — code stays in-repo, frozen.

Prefer cutting over at a program boundary rather than mid-run, but the import path must handle mid-program state regardless — it's the same restore machinery the app already needs.

## Phase 5 — Post-Cutover (Swift-only)

#64 program overview, #71 off-program training, #73 run history, #63 history browsing, #49 weekly check-ins — each gets its deferred design + build. Then App Store hardening (real auth story, per-user isolation, onboarding, empty states) when Ben chooses.

## Architecture

Three layers, dependency arrows pointing inward only:

```
┌─ UI ────────────────────────────────────────────────┐
│ SwiftUI views · one @Observable model per flow      │
│ Shared component library (Card, EyebrowLabel,       │
│ StatTile, PillButton, Chip, Swift Charts wrappers)  │
├─ Services (every boundary is a protocol) ───────────┤
│ WorkoutStore · HealthProvider · SyncService ·       │
│ BackupService                                       │
│ prod: GRDB · Whoop/ASWebAuthenticationSession ·     │
│ D1 push client · iCloud Documents                   │
│ test: seeded temp SQLite · in-memory fakes          │
├─ ApexKit (domain core, pure Swift) ─────────────────┤
│ models · Epley · progression · program resolution · │
│ PR detection · field profiles                       │
└──────────────────────────────────────────────────────┘
```

- `useWorkoutSession` (1,260 LOC React hook) is re-architected — not transliterated — as a `WorkoutSessionModel` `@Observable` state machine: phases select → warmup → logging → complete, superset round-robin advance, pre-fill, restore with staleness prompt, RPE progression orchestration.
- The shared component library is the structural fix for the RN app's biggest weakness (34 per-screen StyleSheets re-implementing the same patterns with drift).

### Canonical tokens

`tokens.json` is the single source of truth for the design language, created when Phase 0 locks (home: the `cadre` repo, as the ecosystem's shared layer). Small codegen emits:

- Swift `Theme` (Colors/Spacing/FontSize/Radii/ComponentSize) for `apex-ios`
- TS theme for `@cadre/shared` consumers (future dashboard/apps; frozen RN app keeps its old palette)
- CSS variables for the Claude Design system project and `docs/mockups/`

One source, every consumer generated; palette drift becomes structurally impossible.

### Canonical sync contract

Same problem, same solution: `sync-contract.json` in `cadre` (table allowlists, column maps, required fields) generated into TS (Worker validation) and Swift (client). Prevents the silent column-drift failure mode — the Worker sanitizes unknown columns, so drift today would drop data without erroring.

### Secrets

Worker API key and Whoop client ID move out of source into a gitignored generated env file (Beacon's `generate_ios_env.sh` pattern). Cheap now; required for App Store later.

## Server & Integrations

- **Worker + D1 unchanged** ($0/mo, UI-agnostic, in-repo at `workers/health-api/`). Whoop OAuth *requires* a server proxy regardless of any other choice (client secret cannot ship in-app) — this is load-bearing for keeping the Worker.
- **Whoop (Swift):** `ASWebAuthenticationSession` OAuth against the existing Worker token/refresh endpoints; Keychain token storage with refresh dedup (rotating-token safe; disconnect only on 401/403); Whoop v2 cycle/recovery/sleep parsing behind `HealthProvider`. 30-day backfill on connect, 7-day on app-open. Vendor-agnostic provider protocol carries over from the RN design.
- **Sync (Swift):** D1 push client behind `SyncService` — per-table `updated_at` watermarks, transforms per the sync contract, fire-and-forget after session completion and on app-open. Push-only, last-write-wins, same as today.
- **Backup:** manual `.db` export/import (share sheet / document picker) + silent post-workout iCloud Documents copy carry over. **New capability:** a real restore-from-iCloud-backup flow (onboarding/settings) — reinstall recovery exists for the first time. CloudKit stays a future option behind `BackupService`.

## Testing (day one, both targets)

**Swift Testing (unit):** `ApexKit` + data layer against temp SQLite databases, mirroring the RN suite's approach (its DB tests run against real SQLite). The 737-test coverage is the porting checklist.

**XCUITest (UI), Beacon conventions adopted wholesale:**

- Typed `A11y` identifier catalog (app-side + test-side mirror) on every interactive element, with **enforcement tests** that fail on any untagged button/field, plus `performAccessibilityAudit()`.
- `Apex-UITest` scheme; `-UITestMode` swaps protocol implementations for seeded fixtures. APEX's fixture story is simpler than Beacon's: a seeded temp SQLite database (the RN `seed.ts` generators are the prototype). State-variant launch args: `-NoProgram`, `-ActiveProgram`, `-MidWorkout`, `-CompletedProgram`, etc.
- **Headed simulator runs** — `xcodebuild test` against a Simulator destination, visible taps, watchable by Ben.
- Make targets: `ios-generate`, `ios-check`, `ios-sim`, `ios-uitest` (promoting the canonical command Beacon left buried in a doc). Agent permissions allowlisted in `.claude/settings` (`xcodebuild`, `xcrun simctl`, `xcodegen`, `xcbeautify`, `make ios-*`).
- Flaky-resistance idioms: `waitForExistence` on every query, `continueAfterFailure = false`, interruption-monitor handling, deterministic fixture delays.
- **First protected flows (the sacred ones):** start workout → log sets → kill app → restore to exact position → finish → progress reflects it. Session restore is a core product guarantee and gets E2E coverage before any polish work.

Boundary rule (binding): mocks exist only at protocol seams. A test that needs to fake something the architecture can't swap is an architecture bug.

## Issue Disposition

| Issue | Disposition |
|---|---|
| #61 Swift migration | This effort |
| #66 workout redesign, #70 session memory, #46 warmups, #68 progress, #65 timestamps | Designed into Phase 1, built in Phase 3, closed at cutover |
| #67 keyboard covers notes | Candidate trivial RN fix now (freeze exception); systematically handled in Swift |
| #69 redundant save prompt | Trivial RN fix now (freeze exception); properly resolved in Swift finish flow |
| #64 program overview, #71 off-program training, #73 run history, #63 history browsing, #49 check-ins | Phase 5 (entry points reserved in Phase 1 navigation) |
| #45 RPE auto-progression | Already built (PR #77); ports with the domain core |

## Out of Scope (v1)

- CloudKit sync/backup (protocol seam only)
- App Store release work (auth, multi-user, onboarding) — Phase 5+, Ben's call
- Web dashboard / second Cadre app (tokens + sync contract prepare for them)
- Watch app, widgets, Live Activities (motivations in #61; native platform makes them possible later)
- Pull-based sync / conflict resolution (push-only carries over)

## Sub-Project Decomposition

Each phase gets its own plan (and spec where design is non-trivial), in order:

1. **Phase 0 kickoff** — design-system refresh + redesign brief + first specimen round (no code)
2. **Foundation plan** — `apex-ios/` scaffold, GRDB layer, ApexKit port + test harness
3. **Tokens + contract codegen plan** — `tokens.json` / `sync-contract.json` in `cadre` + generators
4. **Per-flow implementation plans** — one per Phase 3 flow, written when its mockups are approved
5. **Cutover plan** — parity checklist, data transfer, validation protocol

## Existing-System Reference (audit, 2026-07-15)

Key facts the plans above rest on; full details in the session audit.

- **DB:** `apex.db`, schema v17, 14 tables, WAL, FK cascades, JSON-as-TEXT (no JSON1 functions), no triggers/FTS/views. GRDB-compatible as-is; SwiftData ruled out (cannot adopt a raw existing schema).
- **Domain:** ~2,500 LOC pure logic in `src/utils/` + compute portions of `src/db/metrics.ts`, `personal-records.ts`, `programSummary.ts`; 59 test files / ~737 cases; no e2e suite exists today despite CLAUDE.md claiming one.
- **Tokens:** centralized via `@cadre/shared/theme`; accent `indigo #6366f1`, bg ramp `#0a0a0f → #141420 → #1e1e30`; ~10 hardcoded escapes to tokenize (pain palettes ×2, resource brand hexes, SupersetGroup/WeekRow literals, settings rgba badges, ProgramTimeline white-alphas).
- **Components:** no shared style layer — 34 per-screen StyleSheets with drift; `SharedStyles` is dead code; `ReadinessForm` unused; dead `activate` route registered in `_layout.tsx`.
- **Server:** `workers/health-api/` (Hono + D1 + Sentry), static `X-API-Key` auth (key currently hardcoded in `src/health/config.ts` — moves to env), push-only sync of 9 tables, `GET /v1/:table` exists but unused by the app.
- **Whoop:** client-side v2 API fetch; Worker only proxies OAuth token/refresh; tokens in SecureStore (→ Keychain).
- **Backup:** manual export/import + silent iCloud Documents copy (native Swift module `modules/icloud-backup/` — the repo's first Swift); no reinstall-recovery path today.
- **Design source of truth:** `docs/mockups/` (July 2026 files are the current language); interaction principles in `docs/plans/2026-03-04-apex-interactions-design.md`, including the 3-layer token architecture that anticipated exactly this migration.
