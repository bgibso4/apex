# Hand-off note

The one place a fresh session learns where the work stands. Overwrite it at every hand-off. Keep it short: anything durable belongs in the design doc, a plan, or (once it exists) `apex-ios/AGENTS.md`.

Last updated: 2026-11-27, by the session that wrote the design and plan 1.

## Read first, in this order

1. `docs/superpowers/specs/2026-11-27-ios-agentic-foundations-design.html` · the approved design. Ben approved it on 2026-11-27.
2. The plan named under "Do now".
3. Your memory index. It holds Ben's standing rules for this effort, including the approval to push, open pull requests and merge on green CI.

## Do now

Execute `docs/superpowers/plans/2026-11-27-repo-split.md` (plan 1 of 5) with `superpowers:executing-plans`, yourself, in this checkout. Tick its boxes as you go.

- You are on branch `docs/ios-agentic-foundations`, which holds the design doc, plan 1 and this note. The plan's first step branches `chore/repo-split` from here, so one pull request carries all of it.
- Another session is talking with Ben about the data model in the same checkout. It writes no files here. If you find unexpected changes in the working tree, stop and say so.
- Task 4 step 2 and Task 5 step 2 each use one agent (`ios-verifier`, then one reviewer). Ben's approved design calls for both.

## Then

1. When plan 1 has merged, write plan 2 (`docs/superpowers/plans/<date>-ios-skeleton-and-hooks.md`) with `superpowers:writing-plans`: build-order steps 2 and 3 of the design. Commit it on a new branch.
2. Update this note for the next session, commit, and hand off (commands below). Then stop.

The remaining plans, one session each: 3 · design import, tokens, `make mocks` · 4 · the first screen with `affected`, `retest`, `gate`, the time report and the ceiling · 5 · iOS CI.

## What the earlier session learned that the design doc doesn't say

- **Filing-cabinet is the template.** `~/projects/filing-cabinet`: `Makefile`, `project.yml`, `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json`, `.swiftlint.yml`, `.swift-format`, `.periphery.yml`, `Signing.xcconfig`, `scripts/` (`sim-tests.sh`, `affected-tests.sh`, `test-map.txt`, `build-fingerprint.sh`, `compare-snapshot.swift`, `generate-tokens.swift`, `pre-commit`), `scripts/hooks/` with their bats tests, `scripts/ci/gate-passed.sh`, `.github/workflows/ci.yml`, `SnapshotTests/SnapshotConfig.swift`, `UITests/Support/`. Port, don't reinvent. Leave out: `AuditTests/`, the `ax5` and `light` snapshot variants, `-ReduceMotion`, `nightly.yml`, `audit-report.sh`, the smoke list, TelemetryDeck, the eval and device-perf targets.
- **Why filing-cabinet got slow** is in its `docs/superpowers/specs/2026-11-22-test-suite-restructure-design.md`, with measured rates. Its snapshot helper waits 1 s before each picture for Liquid Glass to settle; plan 4 must measure whether APEX needs that.
- **This Mac:** Xcode 27.2, Swift 6.4, simulator runtimes iOS 27.0 and 27.1. `xcodegen`, `swiftlint`, `xcbeautify`, `jq`, `bats`, `periphery` and `ffmpeg` are installed. Ben's phone is an iPhone 16 Pro.
- **The design export** is `~/Desktop/Home screen redesign brief-project.zip` (156 MB unpacked, 130 MB of it `shots/`). One entry name is not valid UTF-8 and plain `unzip` stops on it; decode names as CP437 then UTF-8. Demos need React from unpkg at run time. `app/home.dc.html` rendered correctly in headless Chrome at 390 × 844 (`--headless=new --window-size=390,844 --virtual-time-budget=8000 --screenshot`). Other demo states are component state reached by clicks, not by address.
- **The export's own rules** are in its `CLAUDE.md`, `APEX README.md` (the design system: every colour, size and timing) and `inventory.md` (what is designed and what is left).
- **The root `.claude/` folder is untracked.** Only `settings.json` is ever committed from it (plan 2), never `skills/`, `settings.local.json` or `launch.json`.
- **`main` is protected** with no required check names and no required reviews, so a path-filtered workflow blocks nothing and merging needs no approval.
- **Arsenal's bootstrap** finds `package-lock.json` up to three levels deep, so it needs no change for `apex-rn/`.
- The repo is public: macOS CI runners are free.

## Open with Ben

- The data model and backend design round is in progress in another session. No screen that stores data is planned until it is approved.
- Cadre's design reference is to be brought up to date from APEX's. Not started, not blocking.

## How to hand off

Inside Herdr only (`test "${HERDR_ENV:-}" = 1`). Read ids from the JSON; never guess them.

```bash
herdr tab create --workspace "$HERDR_WORKSPACE_ID" --cwd "$PWD" --label "<segment name>" --no-focus   # pane id: .result.root_pane.pane_id
herdr agent start <short-name> --kind claude --pane <pane id> -- --permission-mode auto
herdr agent prompt <short-name> "Read docs/superpowers/handoff.md in this repo and follow it."
```

Leave earlier tabs open for Ben to close. Never close a tab you didn't open, and never the workspace's first tab.
