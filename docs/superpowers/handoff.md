# Hand-off note

The one place a fresh session learns where the work stands. Overwrite it at every hand-off. Keep it short: anything durable belongs in the design doc, a plan, or `apex-ios/AGENTS.md`.

Last updated: 2026-11-27, by the session that executed plan 2 and wrote plan 3.

## Read first, in this order

1. `docs/superpowers/specs/2026-11-27-ios-agentic-foundations-design.html` · the approved design. Ben approved it on 2026-11-27.
2. `apex-ios/AGENTS.md` · the iOS rules, then `apex-ios/CLAUDE.md`.
3. The plan named under "Do now".
4. Your memory index. It holds Ben's standing rules for this effort, including the approval to push, open pull requests and merge on green CI.

## Where things stand

- Plan 1 (repo split) merged as pull request #88.
- Plan 2 (iOS skeleton and hooks) merged as pull request #90, merge commit `101386d`. `apex-ios/` exists: an app that launches to an empty screen, the Mac test loop, lint, the hooks, and the `checks` job in CI, green on `main`.
- Plan 3 is written and not started.

## Do now

Execute `docs/superpowers/plans/2026-11-27-ios-design-import.md` (plan 3 of 5) with `superpowers:executing-plans`, yourself, in this checkout. Tick its boxes as you go.

- You are on branch `docs/ios-design-import-plan`, which holds plan 3 and this note. The plan's first step branches `feat/ios-design-import` from it, so one pull request carries all of it.
- A lead session (Herdr agent name `lead`) coordinates and talks with Ben. It writes no files in this checkout while you work. If you find unexpected changes in the working tree, stop and say so.
- **Questions for Ben go through the lead.** Never stop to wait for an answer. Take the default the design rules imply, keep going, and list the question with the default you took under NEEDS BEN in your report.
- Task 5 uses one `ios-verifier` agent and one reviewer agent. Ben's approved design calls for both.
- **Before you start, check "Open with Ben" below.** The lead may have added decisions there; if it has not, the defaults written into plan 3 stand.

## Then

1. When plan 3 has merged, write plan 4 (`docs/superpowers/plans/<date>-ios-first-screen.md`) with `superpowers:writing-plans`: build-order step 5 of the design (the tab bar and Home with no program: screen model, picture, one journey, `compare`, `frames`, `affected`, `retest`, `gate`, the time report and the ceiling). Commit it on a new branch.
2. Update this note for the next session, commit, push, report to the lead (below). Then stop.

Then plan 5, one session: the simulator gate in CI and the skip for a merge that already passed.

The five foundation plans stay beside their spec in `docs/superpowers/plans/`. Product-segment plans, once the foundation is done, go in `apex-ios/docs/`.

## Numbers when plan 2 merged

| Command | Result | Wall time |
|---|---|---|
| `make -C apex-ios fast` | 4 Mac tests | 1.6 to 1.9 s warm |
| `make -C apex-ios build` | Build Succeeded | 1.4 s incremental; no cold time taken |
| `make -C apex-ios ci-checks` | 44 hook tests, 13 lint fixtures, 4 Mac tests, no unused code | 18 s warm, local |
| CI `checks` job | green | 2 min 11 s |

Not verified in plan 2: `make device` on Ben's phone (the unsigned device build compiles); the stop gate's block message live (it passed silently at every stop).

## What earlier sessions learned that the docs don't say

- **The hooks are live the moment `.claude/settings.json` changes,** in the running session and in subagents. The bypass guard reads every Bash command: any command whose text outside a `-m` message contains the no-verify flag or the hooks-path setting is refused, read-only ones and `echo` included.
- **Claude Code's own safety check** refuses a long compound shell command it cannot parse when it thinks a removal might be in it. Keep heredocs and multi-step commands apart, and deletions out of compound commands.
- **`gh pr checks --watch` straight after a push** can print "no checks reported" and exit 0 before the run registers. That is not green. Use `gh run watch <id> --exit-status`, then read the log for the test counts.
- **bash 3.2 (the only bash on this Mac):** a failing `[[ ]]` that is not a bats test's last command does not fail the test. End each one with `|| false`.
- **A pull request that touches neither `apex-ios/` nor `apex-rn/` gets no checks,** so a docs-only pull request cannot merge itself. Plans and this note ride with the next code pull request.
- **`make fast` fails when a package test target is missing from the `Fast` scheme** (`check-fast-scheme`). Add a new test target to `project.yml` in the same change.
- **CI installs Homebrew's XcodeGen** (2.48.0 on 2026-11-27; this Mac has 2.49.0). Only SwiftLint's version is checked. Homebrew disables its `periphery` formula on 2027-08-12; the install step fails then.
- **Left from plan 2's review, for whoever touches them next:** two worktrees with the same folder name share a simulator name, and a `SIM_OS=27.1` run makes a second device with the same name; nothing deletes a checkout's simulator when its worktree is removed; the "no `apex-ios/` folder" check in three hooks cannot be reached through the committed wiring (kept, three lines); `fetch-depth: 0` and the package cache in CI have no consumer until plans 4 and 5.
- **Filing-cabinet is the template** (`~/projects/filing-cabinet`). Still to port, in plans 4 and 5: `scripts/sim-tests.sh`, `affected-tests.sh`, `test-map.txt`, `build-fingerprint.sh`, `compare-snapshot.swift`, `SnapshotTests/SnapshotConfig.swift`, `UITests/Support/`, `scripts/ci/gate-passed.sh`, the simulator half of `.github/workflows/ci.yml`. Leave out: `AuditTests/`, the `ax5` and `light` snapshot variants, `-ReduceMotion`, `nightly.yml`, `audit-report.sh`, the smoke list, TelemetryDeck, the eval and device-perf targets.
- **Why filing-cabinet got slow** is in its `docs/superpowers/specs/2026-11-22-test-suite-restructure-design.md`, with measured rates. Its snapshot helper waits 1 s before each picture for Liquid Glass to settle; plan 4 must measure whether APEX needs that.
- **For plan 4, from the Home demo** (`app/home.dc.html` in the export): its program state has three values, reached by the hidden switches `Active`, `Paused` and `Ended`; `Ended` is the "No Active Program" card. The check-in card is on by default. The wordmark is drawn in Exo 2 ExtraBold, which is in the export and would need bundling with the app (a `UIAppFonts` key means the app gets an `Info.plist` file).
- **This Mac:** Xcode 27.2, Swift 6.4.2, simulator runtimes iOS 27.0 and 27.1. XcodeGen 2.49.0, SwiftLint 0.65.1 (CI checks that version), Periphery 3.8.0; `xcbeautify`, `jq`, `bats`, `ffmpeg` and Google Chrome are installed. Ben's phone is an iPhone 16 Pro.
- **Local state of this checkout.** `apex-rn/node_modules` is a fresh `npm ci` at Expo 58. `make -C apex-ios setup` has run: the git pre-commit hook is installed and the simulator `APEX apex iPhone 17` exists. `.claude/launch.json` (untracked, ignored) starts the React Native preview.
- **Do not run `npm ci` in `workers/health-api`.** Its lockfile is stale (see "Open with Ben").
- **`main` is protected** with no required check names and no required reviews, so merging needs no approval. The repo is public: macOS CI runners are free.
- The local branches `docs/ios-agentic-foundations` and `docs/ios-skeleton-plan` (also on the remote) are fully merged and still exist. They are Ben's to delete.

## Open with Ben

Three come from plan 3. Each has the default the plan takes if nobody answers.

- **The design export goes into a public repo.** Plan 3 commits 100 files (21 MB): every demo, the Explorations pages and the decision logs, which quote Ben. The approved design says the export lives in `apex-ios/design/`, so the default is to commit it. Once pushed it is public for good. If Ben would rather keep any of it private, say so before the plan 3 session starts.
- **Plan 3 adds three lint rules** (raw colours, fonts and animations). The design names that rule, so the default follows the lead's ruling on plan 2: creating it is the design's own build step and the pull request merges on green; only later changes to lint config wait for Ben.
- **No colour assets.** The design says the generator writes "Swift and colour assets". The app is dark only, so plan 3 generates one Swift file and no asset catalog. A launch-screen colour asset, if wanted, arrives with the launch screen.
- Plan 3 also opens a `needs-ben` issue for one motion default (the "snappy" spring's bounce, 0.15), which only Ben can judge on the phone.
- Data is settled enough to build on (Ben, 2026-11-27): a SQL database on the phone is the source of truth; the Cloudflare copy is a backup only; Whoop sign-in is the one critical use of the Worker. The tables are designed with the first screen that stores data, not before.
- How Ben is asked questions while away from his Mac is undecided (the Claude app's Remote Control, or GitHub issues labelled `needs-ben`; issue 89 is a trial). The lead handles it either way.
- **The Worker's lockfile is stale, on `main`.** `workers/health-api/package-lock.json` resolves `@cadre/shared` to v0.2.0 while `package.json` pins v0.2.1. After a clean `npm ci`, 2 of its 26 tests fail, and a deploy from a clean install would ship a contract that drops `weight_increment` and the programs completion columns. It needs a lockfile refresh in its own pull request. Worker changes wait for Ben.
- A follow-up for arsenal, not this repo: worktree cleanup could delete the worktree's `APEX <folder> iPhone 17` simulator.
- Cadre's design reference is to be brought up to date from APEX's. Not started, not blocking.

## How to hand off

A worker session does not start the next session. It reports to the lead and stops; the lead starts the next one.

Inside Herdr only (`test "${HERDR_ENV:-}" = 1`). When the plan has merged and the next plan and this note are committed and pushed, or as soon as you are blocked on something you cannot resolve:

```bash
herdr agent prompt lead "<short report: pull request number, what merged, the before and after verification numbers, anything not verified, anything that needs Ben>"
```

Then stop. Never close a tab you didn't open, and never the workspace's first tab.
