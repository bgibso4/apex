# Hand-off note

The one place a fresh session learns where the work stands. Overwrite it at every hand-off. Keep it short: anything durable belongs in the design doc, a plan, or `apex-ios/AGENTS.md`.

Last updated: 2026-11-27, by the session that executed plan 3 and wrote plan 4.

## Read first, in this order

1. `docs/superpowers/specs/2026-11-27-ios-agentic-foundations-design.html` · the approved design. Ben approved it on 2026-11-27.
2. `apex-ios/AGENTS.md` · the iOS rules, then `apex-ios/CLAUDE.md` and `apex-ios/design/README.md`.
3. The plan named under "Do now".
4. Your memory index. It holds Ben's standing rules for this effort, including the approval to push, open pull requests and merge on green CI.

## Where things stand

- Plan 1 (repo split) merged as pull request #88. Plan 2 (iOS skeleton and hooks) as #90.
- Plan 3 (design export, tokens, `make mocks`) merged as pull request #94, merge commit `1f0c418`. `apex-ios/design/` holds the export (100 files), `tokens.json`, `states.json` and two reference images; `Tokens.swift` is generated; three lint rules reject raw colours, fonts and animations.
- Plan 4 is written and not started.
- Branches: only `main` and `docs/ios-first-screen-plan` exist, locally and on the remote.

## Do now

Execute `docs/superpowers/plans/2026-11-27-ios-first-screen.md` (plan 4 of 5) with `superpowers:executing-plans`, yourself, in this checkout. Tick its boxes as you go.

- You are on branch `docs/ios-first-screen-plan`, which holds plan 4, plan 3's last ticks and this note. The plan's first step branches `feat/ios-first-screen` from it, so one pull request carries all of it.
- A lead session (Herdr agent name `lead`) coordinates and talks with Ben. It writes no files in this checkout while you work. If you find unexpected changes in the working tree, stop and say so.
- **Questions for Ben go through the lead.** Never stop to wait for an answer. Take the default the design rules imply, keep going, and list the question with the default you took under NEEDS BEN in your report.
- Task 6 uses one `ios-verifier` agent and one reviewer agent. Ben's approved design calls for both.
- **Before you start, check "Open with Ben" below.** The lead may have added decisions there; if it has not, the defaults written into plan 4 stand.
- The pull request for plan 4 gets the `checks` job only: CI does not run the simulator tests until plan 5. Say so in its hand-off; the gate's evidence is local.

## Then

1. When plan 4 has merged, write plan 5 (`docs/superpowers/plans/<date>-ios-ci-gate.md`) with `superpowers:writing-plans`: build-order step 6 of the design. The simulator gate in CI (one job that builds once and runs every picture and journey through `make gate` with `--enforce`), the ceiling recorded again from CI's first measurement, the report's change against `main`, the skip for a merge whose pull request already passed on the same files, and `CPUImageMatch` only if CI shows the fault it answers. Commit it on a new branch.
2. Update this note for the next session, commit, push, report to the lead (below). Then stop.

After plan 5 the foundation is done. What follows it: `apex-ios/docs/roadmap.md`, the ordered list of product segments, written from `design/export/inventory.md`.

The five foundation plans stay beside their spec in `docs/superpowers/plans/`. Product-segment plans go in `apex-ios/docs/`.

## Numbers when plan 3 merged

| Command | Result | Wall time |
|---|---|---|
| `make -C apex-ios fast` | 4 Mac tests | 2.0 to 2.4 s warm (1.7 s before plan 3; the token generator is about 0.4 s) |
| `make -C apex-ios build` | Build Succeeded | 2.0 to 2.4 s incremental |
| `make -C apex-ios ci-checks` | 44 hook tests, 21 script tests, 43 lint fixtures, 4 Mac tests, no unused code | 35 s warm, local (18 s before) |
| `make -C apex-ios mocks` | 2 images, the same bytes every run | 1.9 s |
| CI `checks` job | green | 4 min 7 s (2 min 11 s before) |

Where CI's 4 minutes go: tool install 30 s, hook tests 20 s, script tests 39 s (the seven mock tests 29 s), lint fixtures 14 s, the Mac tests' build and run 57 s, Periphery 55 s.

Not verified in plans 2 and 3: `make device` on Ben's phone; the stop gate's block message live; any type, spacing or motion token in a picture (no view uses one yet).

## What earlier sessions learned that the docs don't say

- **The hooks are live the moment `.claude/settings.json` changes,** in the running session and in subagents. The bypass guard reads every Bash command: any command whose text outside a `-m` message contains the no-verify flag or the hooks-path setting is refused, read-only ones and `echo` included.
- **Claude Code's own safety check** refuses a compound shell command it cannot parse when it thinks a removal might be in it. A heredoc followed by `&&` and more commands was refused though it removed nothing. Keep a heredoc in a call of its own, edit files with the Edit tool, and keep any `rm` on one explicit path in its own call.
- **`gh pr checks --watch` straight after a push** can print "no checks reported" and exit 0 before the run registers. That is not green. Find the run with `gh run list --branch <branch>`, use `gh run watch <id> --exit-status`, then read `gh run view <id> --log` for the counts.
- **bash 3.2 (the only bash on this Mac):** a failing `[[ ]]` that is not a bats test's last command does not fail the test: end each with `|| false`. A leading `!` never fails a test: use `run` and check `$status`. `${var/#old/new}` anchors at the start: escape the `#`.
- **A pull request that touches neither `apex-ios/` nor `apex-rn/` gets no checks,** so a docs-only pull request cannot merge itself. Plans and this note ride with the next code pull request.
- **`ci-checks` starts with the drift check.** It fails while a regenerated `Generated/` file is staged or unstaged: commit, then run it.
- **`make fast` fails when a package test target is missing from the `Fast` scheme** (`check-fast-scheme`). Add a new test target to `project.yml` in the same change.
- **swift-format's 120 columns apply to generated Swift too.** The token generator breaks colour lines for that reason.
- **Python on a CI runner:** `http.server`'s own server looks up the host name when it starts and took 35 s a start there. `render-mocks.py` uses a plain `socketserver` server. `python3` on this Mac is Homebrew's 3.15; the system one is 3.9.6; the scripts run on both.
- **The lint rules are strict on purpose, and loosening one waits for Ben.** `withAnimation` and `.animation` must be given `Tokens.Motion.<name>` directly: a variable or a choice between two tokens is flagged. `Font.custom`, `Color(…)` and any `Animation` built in place are allowed only under `Screens/DesignSystem/`. `.primary` and `.secondary` are flagged only inside a style modifier.
- **`design/export/CLAUDE.md` is loaded by Claude Code as instructions** whenever an agent reads that folder. Its design rules hold; its instructions for recording decisions do not apply here (AGENTS.md says so).
- **The demos, for `make mocks` and for building screens:** each page carries its screen in a hidden template before any script runs, and renders the real one after React loads from unpkg. Switches are outside the screen. Home's program state has three switches, `Active`, `Paused` and `Ended`; `Ended` is the "No Active Program" card, and its two buttons only show a toast in the demo ("Opens Programs", "to design"). The check-in card is on by default. The wordmark is the logo mark (`logo-mark.png`) and "PEX" in Exo 2 ExtraBold (`Exo2-ExtraBold.ttf`), both at the top of the export.
- **`xcrun xcresulttool get test-results tests --path <bundle> --compact`** works on this Xcode and gives a tree whose `Test Case` nodes carry `durationInSeconds`, `nodeIdentifier` and `result`. Plan 4's time report reads it.
- **CI installs Homebrew's XcodeGen** (2.48.0 on 2026-11-27; this Mac has 2.49.0). Only SwiftLint's version is checked. Homebrew disables its `periphery` formula on 2027-08-12; the install step fails then.
- **Seen and not explained:** twice in about ten local runs `make test-scripts` took 23 s and 119 s (10 s is normal), once stalling 72 s inside an import test that launches neither Chrome nor Swift. CI showed nothing like it. If it comes back, time each test with `bats --timing`.
- **Left from plan 3's review, all minor, for whoever touches them next:** no timeout on the Chrome call in `render-mocks.py`; a traceback on bad JSON in `states.json`, and a duplicate state name wins silently; more than about 16 clicks for one state fails with no reason given; one bats test repeats `make lint`; the token generator accepts `true` as a number and names that are not kebab-case (the build then fails); a zip with a wrapper folder would import `shots/`; Chrome's version is not pinned, so an update may change every mock's bytes.
- **Left from plan 2's review:** two worktrees with the same folder name share a simulator name, and a `SIM_OS=27.1` run makes a second device with the same name; nothing deletes a checkout's simulator when its worktree is removed; the "no `apex-ios/` folder" check in three hooks cannot be reached through the committed wiring; `fetch-depth: 0` and the package cache in CI have no consumer until plans 4 and 5.
- **Filing-cabinet is the template** (`~/projects/filing-cabinet`). Plan 4 names the files it ports. Left for plan 5: `scripts/ci/gate-passed.sh`, the simulator half of `.github/workflows/ci.yml`, `SnapshotTests/CPUImageMatch.swift`. Leave out for good: `AuditTests/`, the `ax5` and `light` snapshot variants, `-ReduceMotion`, `nightly.yml`, `audit-report.sh`, the smoke list, TelemetryDeck, the eval and device-perf targets.
- **Why filing-cabinet got slow** is in its `docs/superpowers/specs/2026-11-22-test-suite-restructure-design.md`, with measured rates. Its snapshot helper waits 1 s before each picture for Liquid Glass to settle; plan 4 measures whether APEX needs that.
- **This Mac:** Xcode 27.2, Swift 6.4.2, simulator runtimes iOS 27.0 and 27.1. XcodeGen 2.49.0, SwiftLint 0.65.1 (CI checks that version), Periphery 3.8.0; `xcbeautify`, `jq`, `bats`, `ffmpeg` and Google Chrome are installed. Ben's phone is an iPhone 16 Pro.
- **Local state of this checkout.** `apex-rn/node_modules` is a fresh `npm ci` at Expo 58. `make -C apex-ios setup` has run: the git pre-commit hook is installed and the simulator `APEX apex iPhone 17` exists. `.claude/launch.json` (untracked, ignored) starts the React Native preview. The export zip is `~/Desktop/Home screen redesign brief-project.zip`.
- **Do not run `npm ci` in `workers/health-api`.** Its lockfile is stale (see "Open with Ben").
- **`main` is protected** with no required check names and no required reviews, so merging needs no approval. The repo is public: macOS CI runners are free.

## Open with Ben

- **Issue 93, open:** the "snappy" spring's bounce is 0.15, a default nobody has seen on a phone. One number in `tokens.json` when he answers.
- **Plan 4's defaults,** which stand unless the lead writes otherwise here:
  - Home shows only the "No Active Program" card until the other cards' data exists; the card has no eyebrow when no program has ever ended; its two buttons and the gear do nothing until their destinations exist. Plan 4 opens one `needs-ben` issue for these.
  - The gate's ceiling is first recorded from this Mac (twice the measured test time), and recorded again from CI's first run in plan 5. Both are the design's own build step; any later change waits for Ben.
  - The picture tolerance starts at filing-cabinet's value (perceptual precision 0.98).
  - `TestSupport` (fixtures) is linked into the app, so previews and `-State` can use it. Filing-cabinet keeps its own out of Release builds with a linker trick; not ported until it matters.
- **Tokens, not hardcoded values** (Ben, 2026-11-27): "I don't want to be hard coding anything. The code needs to be very reusable." He wants the principal-engineer rules (DRY, YAGNI, SOLID, simplicity) held hardest now, while the foundation is laid. Load that skill before writing code.
- **Re-imports must be easy for Ben** (2026-11-27). Done in plan 3: `design/README.md`, "When a new export arrives". He gives the zip's path; a session does the rest and reports the screens affected.
- **Branches must not pile up** (Ben, 2026-11-27). When your code pull request merges, delete its branch and the plan branch it carried, locally and on the remote.
- Data is settled enough to build on (Ben, 2026-11-27): a SQL database on the phone is the source of truth; the Cloudflare copy is a backup only; Whoop sign-in is the one critical use of the Worker. The tables are designed with the first screen that stores data, not before.
- How Ben is asked questions while away from his Mac is the lead's to handle (GitHub issues labelled `needs-ben` for now).
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
