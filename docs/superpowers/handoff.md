# Hand-off note

The one place a fresh session learns where the work stands. Overwrite it at every hand-off. Keep it short: anything durable belongs in the design doc, a plan, or (once it exists) `apex-ios/AGENTS.md`.

Last updated: 2026-11-27, by the session that executed plan 1 and wrote plan 2.

## Read first, in this order

1. `docs/superpowers/specs/2026-11-27-ios-agentic-foundations-design.html` · the approved design. Ben approved it on 2026-11-27.
2. The plan named under "Do now".
3. Your memory index. It holds Ben's standing rules for this effort, including the approval to push, open pull requests and merge on green CI.

## Where things stand

- Plan 1 (repo split) merged as pull request #88, merge commit `ef8854b`. The React Native app is in `apex-rn/`; the root `CLAUDE.md` is a pointer table; `rn.yml` runs only for `apex-rn/**`.
- Plan 2 is written and not started.

## Do now

Execute `docs/superpowers/plans/2026-11-27-ios-skeleton-and-hooks.md` (plan 2 of 5) with `superpowers:executing-plans`, yourself, in this checkout. Tick its boxes as you go.

- You are on branch `docs/ios-skeleton-plan`, which holds plan 2 and this note. The plan's first step branches `feat/ios-skeleton` from it, so one pull request carries all of it.
- A lead session (Herdr agent name `lead`) coordinates and talks with Ben. It writes no files in this checkout while you work. If you find unexpected changes in the working tree, stop and say so.
- **Questions for Ben go through the lead.** Never stop to wait for an answer. Take the default the design rules imply, keep going, and list the question with the default you took under NEEDS BEN in your report.
- **Lead's decisions on plan 2** (2026-11-27): it merges on green like any other; creating the lint and hook config is the approved design's own build step, and only later changes to them wait for Ben. Pulling the iOS `checks` job forward is right. Also add `.dev.vars` to the root `.gitignore` in this pull request (wrangler's secrets file, in a public repo).
- Task 8 uses one `ios-verifier` agent and one reviewer agent. Ben's approved design calls for both.

## Then

1. When plan 2 has merged, write plan 3 (`docs/superpowers/plans/<date>-ios-design-import.md`) with `superpowers:writing-plans`: build-order step 4 of the design (the export imported, `tokens.json` and its generator, `make mocks`). Commit it on a new branch.
2. Update this note for the next session, commit, push, report to the lead (below). Then stop.

The remaining plans, one session each: 4 · the first screen with `affected`, `retest`, `gate`, the time report and the ceiling · 5 · the simulator gate in CI and the skip for a merge that already passed.

The five foundation plans stay beside their spec in `docs/superpowers/plans/`. Product-segment plans, once the foundation is done, go in `apex-ios/docs/`.

## What earlier sessions learned that the design doc doesn't say

- **Filing-cabinet is the template.** `~/projects/filing-cabinet`: `Makefile`, `project.yml`, `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json`, `.swiftlint.yml`, `.swift-format`, `.periphery.yml`, `Signing.xcconfig`, `scripts/` (`sim-tests.sh`, `affected-tests.sh`, `test-map.txt`, `build-fingerprint.sh`, `compare-snapshot.swift`, `generate-tokens.swift`, `pre-commit`, `test-lint-rules.sh`), `scripts/hooks/` with their bats tests, `scripts/ci/gate-passed.sh`, `.github/workflows/ci.yml`, `.github/actions/xcode-setup/`, `SnapshotTests/SnapshotConfig.swift`, `UITests/Support/`. Port, don't reinvent. Leave out: `AuditTests/`, the `ax5` and `light` snapshot variants, `-ReduceMotion`, `nightly.yml`, `audit-report.sh`, the smoke list, TelemetryDeck, the eval and device-perf targets.
- **Why filing-cabinet got slow** is in its `docs/superpowers/specs/2026-11-22-test-suite-restructure-design.md`, with measured rates. Its snapshot helper waits 1 s before each picture for Liquid Glass to settle; plan 4 must measure whether APEX needs that.
- **This Mac:** Xcode 27.2, Swift 6.4.2, simulator runtimes iOS 27.0 and 27.1. XcodeGen 2.49.0, SwiftLint 0.65.1 (filing-cabinet's CI pins that version), Periphery 3.8.0; `xcbeautify`, `jq`, `bats` and `ffmpeg` are installed. Ben's phone is an iPhone 16 Pro. Filing-cabinet's CI runs on the `xcode-27` runner label.
- **CI after the split.** A pull request that touches no file under `apex-rn/` gets no checks until `ios.yml` exists, and `main` requires none. Plan 2 Task 7 adds the iOS `checks` job for that reason. `rn.yml` uses concurrency group `ci-<ref>`; an iOS workflow must use a different prefix or the two cancel each other.
- **Local state of this checkout.** The root `node_modules` is gone; `apex-rn/node_modules` is a fresh `npm ci` at Expo 58, and `apex-rn/ios/` is a fresh prebuild that built for the simulator. `.claude/launch.json` (untracked) starts the preview with `npm --prefix apex-rn run start`.
- **Do not run `npm ci` in `workers/health-api`.** Its lockfile is stale (see "Open with Ben"). The installed packages there are correct and its 26 tests pass.
- **A shell command that contains `rm -rf` on a variable path was refused** by this session's permissions. Keep deletions out of compound commands.
- **The design export** is `~/Desktop/Home screen redesign brief-project.zip` (156 MB unpacked, 130 MB of it `shots/`). One entry name is not valid UTF-8 and plain `unzip` stops on it; decode names as CP437 then UTF-8. Demos need React from unpkg at run time. `app/home.dc.html` rendered correctly in headless Chrome at 390 × 844 (`--headless=new --window-size=390,844 --virtual-time-budget=8000 --screenshot`). Other demo states are component state reached by clicks, not by address.
- **The export's own rules** are in its `CLAUDE.md`, `APEX README.md` (the design system: every colour, size and timing) and `inventory.md` (what is designed and what is left).
- **The root `.claude/` folder is untracked.** Only `settings.json` is ever committed from it (plan 2 Task 6), never `skills/`, `settings.local.json` or `launch.json`. Plan 2 Task 4 adds ignore rules for the rest.
- **`main` is protected** with no required check names and no required reviews, so merging needs no approval.
- **Arsenal's bootstrap** runs `npm ci` wherever it finds a `package-lock.json` up to three levels deep (`profiles/bootstrap-header.sh`), so it needed no change for `apex-rn/`.
- The repo is public: macOS CI runners are free.
- The local branch `docs/ios-agentic-foundations` is fully merged and still exists. It is Ben's to delete.

## Open with Ben

- Data is settled enough to build on (Ben, 2026-11-27): a SQL database on the phone is the source of truth; the Cloudflare copy is a backup only; Whoop sign-in is the one critical use of the Worker. The tables are designed with the first screen that stores data, not before.
- How Ben is asked questions while away from his Mac is undecided (the Claude app's Remote Control, or GitHub issues labelled `needs-ben`; issue 89 is a trial). The lead handles it either way.
- **The Worker's lockfile is stale, on `main`.** `workers/health-api/package-lock.json` resolves `@cadre/shared` to v0.2.0 while `package.json` pins v0.2.1. After a clean `npm ci`, 2 of its 26 tests fail, and a deploy from a clean install would ship a contract that drops `weight_increment` and the programs completion columns. It needs a lockfile refresh in its own pull request. Worker changes wait for Ben.
- Cadre's design reference is to be brought up to date from APEX's. Not started, not blocking.

## How to hand off

A worker session does not start the next session. It reports to the lead and stops; the lead starts the next one.

Inside Herdr only (`test "${HERDR_ENV:-}" = 1`). When the plan has merged and the next plan and this note are committed and pushed, or as soon as you are blocked on something you cannot resolve:

```bash
herdr agent prompt lead "<short report: pull request number, what merged, the before and after verification numbers, anything not verified, anything that needs Ben>"
```

Then stop. Never close a tab you didn't open, and never the workspace's first tab.
