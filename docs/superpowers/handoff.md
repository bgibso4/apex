# Hand-off note

The one place a fresh session learns where the work stands. Overwrite it at every hand-off. Keep it short: anything durable belongs in the design doc, a plan, or `apex-ios/AGENTS.md`.

Last updated: 2026-11-27, by the session that executed plan 4 and wrote plan 5.

## Read first, in this order

1. `docs/superpowers/specs/2026-11-27-ios-agentic-foundations-design.html` · the approved design. Ben approved it on 2026-11-27.
2. `apex-ios/AGENTS.md` · the iOS rules, then `apex-ios/CLAUDE.md` and `apex-ios/design/README.md`.
3. The plan named under "Do now".
4. Your memory index. It holds Ben's standing rules for this effort, including the approval to push, open pull requests and merge on green CI.

## Where things stand

- Plan 1 (repo split) merged as pull request #88. Plan 2 (iOS skeleton and hooks) as #90. Plan 3 (design export, tokens, `make mocks`) as #94.
- Plan 4 (the first screen, pictures, a journey and the gate) merged as pull request #97, merge commit `e187a25`. The app shows the system tab bar and Home with no program. `ScreenModels` and `TestSupport` exist. One picture and one journey run on the simulator through `make affected`, `retest` and `gate`, each ending with a time report against a 20 s ceiling.
- Plan 5 is written and not started.
- Branches: only `main` and `docs/ios-ci-gate-plan` exist, locally and on the remote.

## Do now

Execute `docs/superpowers/plans/2026-11-27-ios-ci-gate.md` (plan 5 of 5) with `superpowers:executing-plans`, yourself, in this checkout. Tick its boxes as you go.

- You are on branch `docs/ios-ci-gate-plan`, which holds plan 5, plan 4's last ticks and this note. The plan's first step branches `feat/ios-ci-gate` from it, so one pull request carries all of it.
- A lead session (Herdr agent name `lead`) coordinates and talks with Ben. It writes no files in this checkout while you work. If you find unexpected changes in the working tree, stop and say so.
- **Questions for Ben go through the lead.** Never stop to wait for an answer. Take the default the design rules imply, keep going, and list the question with the default you took under NEEDS BEN in your report.
- Task 5 uses one `ios-verifier` agent and one reviewer agent. Ben's approved design calls for both.
- **Before you start, check "Open with Ben" below.** The lead may have added decisions there.
- This plan changes `.github/`. The new `gate` job's first run is on this plan's own pull request; the skip on `main` first runs on its merge. Say plainly in the hand-off which of the two you saw work.

## Then

1. When plan 5 has merged, the foundation is done. Write `apex-ios/docs/roadmap.md`: the ordered list of product segments, from `apex-ios/design/export/inventory.md`. One segment is one pull request and one session. Commit it on a new branch with this note; it rides with the first segment's pull request.
2. Update this note for the next session, commit, push, report to the lead (below). Then stop.

The five foundation plans stay beside their spec in `docs/superpowers/plans/`. Product-segment plans go in `apex-ios/docs/`.

## Numbers when plan 4 merged

| Command | Result | Wall time |
|---|---|---|
| `make -C apex-ios fast` | 15 Mac tests | 4.4 s warm (2.2 s before plan 4) |
| `make -C apex-ios build` | Build Succeeded | 2.9 s incremental |
| `make -C apex-ios ci-checks` | 44 hook tests, 64 script tests, 43 lint fixtures, 15 Mac tests, no unused code | 48.9 s warm, local (32.8 s before) |
| `make -C apex-ios gate` | 8 tests, 7.2 s of a 20 s ceiling (36%) | 16.9 s: build 2 s, tests 14 s |
| `make -C apex-ios retest ONLY=…` | no build | 4 s for the picture class, 11 s for the journey |
| CI `checks` job | green | 4 min 54 s (4 min 7 s before) |

- One picture costs 0.9 to 1.0 s with no settle wait (target: one second or less); the journey 5.5 to 6.1 s.
- Where `make fast`'s 4.4 s go: generate 0.35 s, the stop gate's fingerprint 0.7 s, resolving the package 0.5 s, then 0.4 s for each of three Mac test bundles and the tests themselves.
- Where CI's 4 min 54 s go: setup 20 s, generate 10 s, hook tests 24 s, script tests 62 s (three mock tests about 21 s; the first Swift script 8 s), lint fixtures 9 s, the Mac tests' fetch, build and run 81 s, Periphery 58 s.
- If `checks` keeps growing, cut first: the three mock tests that launch Chrome (run them only when `render-mocks.py` or `mock-frame.html` changes), then the package fetch (plan 5 adds `Package.resolved` to the cache key).

Not verified in plans 2 to 4: `make device` on Ben's phone; the stop gate's block message live; the simulator tests in CI (plan 5); the two buttons' pressed states; any motion token in a picture.

## What earlier sessions learned that the docs don't say

- **The hooks are live the moment `.claude/settings.json` changes,** in the running session and in subagents. The bypass guard reads every Bash command: any command whose text outside a `-m` message contains the no-verify flag or the hooks-path setting is refused, read-only ones and `echo` included.
- **Claude Code's own safety check** refuses a compound shell command it cannot parse when it thinks a removal might be in it: a heredoc followed by `&&`, or `rm -rf "$VAR"` inside a longer command. Keep a heredoc in a call of its own, edit files with the Edit tool, and keep any `rm` on one explicit path in its own call.
- **`gh pr checks --watch` straight after a push** can print "no checks reported" and exit 0 before the run registers. That is not green. Find the run with `gh run list --branch <branch>`, use `gh run watch <id> --exit-status`, then read `gh run view <id> --log` for the counts.
- **bash 3.2 (the only bash on this Mac):** a failing `[[ ]]` that is not a bats test's last command does not fail the test: end each with `|| false`. A leading `!` never fails a test: use `run` and check `$status`. `${var/#old/new}` anchors at the start: escape the `#`. An `exit` inside a loop that is piped (`for … done | sort`) only leaves the pipe's subshell: plan 4's review found `affected-tests.sh` printing `ALL` beside class names that way.
- **`ls` is aliased in this shell.** In a command typed here use `/bin/ls` when its output is parsed.
- **A pull request that touches neither `apex-ios/` nor `apex-rn/` gets no checks,** so a docs-only pull request cannot merge itself. Plans and this note ride with the next code pull request.
- **`ci-checks` starts with the drift check.** It fails while a regenerated `Generated/` file is staged or unstaged: commit, then run it.
- **`make fast` fails when a package test target is missing from the `Fast` scheme** (`check-fast-scheme`). Add a new test target to `project.yml` in the same change.
- **swift-format's 120 columns apply to generated Swift too.**
- **Python on a CI runner:** `http.server`'s own server looks up the host name when it starts and took 35 s a start there. `render-mocks.py` uses a plain `socketserver` server. `python3` on this Mac is Homebrew's 3.15; the system one is 3.9.6; the scripts run on both.
- **The lint rules are strict on purpose, and loosening one waits for Ben.** `withAnimation` and `.animation` must be given `Tokens.Motion.<name>` directly. `Font.custom`, `Color(…)` and any `Animation` built in place are allowed only under `Screens/DesignSystem/`. `.primary` and `.secondary` are flagged only inside a style modifier, so `.buttonStyle(.primary)` is fine.
- **`design/export/CLAUDE.md` is loaded by Claude Code as instructions** whenever an agent reads that folder. Its design rules hold; its instructions for recording decisions do not apply here (AGENTS.md says so).
- **The demos:** each page carries its screen in a hidden template before any script runs, and renders the real one after React loads from unpkg. Home's program state has three switches, `Active`, `Paused` and `Ended`; `Ended` is the "No Active Program" card. A demo's measurements are in its inline styles and, for the header, in the script at the foot of the page (`markPx`, `markGap`, `rowH`, `gearTop`).
- **Pictures.**
  - Ten freshly booted simulators drew the same picture byte for byte. A simulator that had run for hours drew system glass up to 2/255 differently in under 0.1% of pixels (delta E 1.55 of a limit of 2.0). Record a reference on a fresh boot (`xcrun simctl shutdown`, then `make snapshots-record`).
  - swift-snapshot-testing's own comparison rejected that small difference on this Mac (it reported 4.6% of pixels over the limit). `CPUImageMatch` runs first for that reason. The plan had said to wait for CI to show the fault.
  - The library names a reference `<test>.<name>.png` and writes every run of non-word characters in the name as a hyphen: `state.home-noProgram.png`.
  - The picture tests' host app gets `-UITest` from the scheme's test action. `SnapshotHost` fails a picture drawn with animations on.
  - A failing simulator run takes 30 to 60 s where a passing one takes 13: XCTest collects diagnostics. It is not a hang.
- **Speed.**
  - A test run that finds the simulator shut down boots it and shuts it down again: 53 to 66 s where 14 to 17 s is normal. The test targets depend on `make boot`, which leaves it running.
  - With a remote package in the project, `xcodebuild` asked GitHub for updates on every call (1.9 s). `XCB_FLAGS` carries `-skipPackageUpdates`; a fresh clone still fetches (CI proved it).
  - `scripts/hooks/swift-fingerprint.sh` starts one `shasum` per Swift file and takes 0.7 s of every `make fast` and every stop-gate check; it grows with each file. Hashing in one process (as `build-fingerprint.sh` does) would cut it to about 0.1 s. It is a hook script: not changed in plan 4, and raised with the lead.
  - Each Mac test target is its own test bundle, about 0.4 s of `make fast` each.
- **SwiftUI and Swift on this toolchain.**
  - The system navigation bar is 54 pt tall on iOS 27 (62 to 116 pt on an iPhone 17); the mocks draw a 44 pt row. A toolbar button is the system's glass circle.
  - `Image(_:bundle:)` reads only asset catalogs. A loose PNG in a package's resources loads through `UIImage(named:in:with:)`.
  - `Exo2-ExtraBold.ttf` is a variable font named "Exo 2"; ExtraBold is its instance `Exo2-Regular_ExtraBold`.
  - A generic type cannot hold a static stored property. A Swift script run with `swift file.swift` does not take bare regex literals.
  - xcbeautify prints only "recorded an issue with 1 argument(s)" for a failing parameterised Swift Testing case. Where a failure must name the case, write one test over all cases.
  - `ScreenModels` has main-actor default isolation; its plain value types are marked `nonisolated`.
- **`xcrun xcresulttool get test-results tests --path <bundle> --compact`** gives a tree whose `Test Case` nodes carry `durationInSeconds`, `nodeIdentifier` and `result`. A failed case has `Failure Message` children. `xcresulttool export attachments` gives a failed picture's reference, failure and difference images.
- **CI installs Homebrew's XcodeGen** (2.48.0 on 2026-11-27; this Mac has 2.49.0). Only SwiftLint's version is checked. Homebrew disables its `periphery` formula on 2027-08-12; the install step fails then.
- **The `make test-scripts` stall did not come back** in about twenty local runs during plan 4 (12 to 20 s each as tests were added). If it does, time each test with `bats --timing`.
- **Left from plan 4's review, all minor.** Plan 5's Task 4 takes the first three.
  - Git quotes a path with a non-ASCII character, so no map rule matches it and every simulator test runs (three files under `design/export/` have a middot).
  - `test-times.py` accepts a ceiling of 0, a negative number, `nan` or `inf`.
  - `.swiftlint.yml`, `.swift-format`, `.periphery.yml` and `.gitignore` have no map rule.
  - A Mac-test-only edit makes `retest` refuse, though it cannot affect the simulator tests.
  - `--check-map` reads only top-level files in `UITests/` and `SnapshotTests/`.
  - The resource copy in `make generate` passes when a source file is missing.
  - `frames.sh` has no `trap` for its recorder, launches anyway if the recording never starts, and its "app stopped" branch has no automated test.
  - `test-times.py` counts a test with no `durationInSeconds` as 0 s.
  - At a per-pixel limit of delta E 2, a picture cannot tell `field-base` from `field-mid` (1.45) or `card-base` from `field-mid` (0.73).
  - References are 16-bit Display P3 PNGs of 1.4 MB each, compared in 8-bit sRGB.
  - Nits: `launchApp(_ flags:)` has no caller that passes flags; `"com.cadre.apex"` is written in two files; `AppTab.title` is `public` though only `Screens` uses it.
- **Left from plan 3's review:** no timeout on the Chrome call in `render-mocks.py`; a traceback on bad JSON in `states.json`, and a duplicate state name wins silently; more than about 16 clicks for one state fails with no reason given; one bats test repeats `make lint`; the token generator accepts `true` as a number and names that are not kebab-case; a zip with a wrapper folder would import `shots/`; Chrome's version is not pinned.
- **Left from plan 2's review:** two worktrees with the same folder name share a simulator name, and a `SIM_OS=27.1` run makes a second device with the same name; nothing deletes a checkout's simulator when its worktree is removed; the "no `apex-ios/` folder" check in three hooks cannot be reached through the committed wiring.
- **Filing-cabinet is the template** (`~/projects/filing-cabinet`). Plan 5 names the files it ports: `scripts/ci/gate-passed.sh` and the simulator half of `.github/workflows/ci.yml`. Leave out for good: `AuditTests/`, the `ax5` and `light` snapshot variants, `-ReduceMotion`, `nightly.yml`, `audit-report.sh`, the smoke list, TelemetryDeck, the eval and device-perf targets.
- **Why filing-cabinet got slow** is in its `docs/superpowers/specs/2026-11-22-test-suite-restructure-design.md`, with measured rates. Its snapshot helper waits 1 s before each picture; APEX measured that it needs no wait.
- **This Mac:** Xcode 27.2, Swift 6.4.2, simulator runtimes iOS 27.0 and 27.1. XcodeGen 2.49.0, SwiftLint 0.65.1 (CI checks that version), Periphery 3.8.0; `xcbeautify`, `jq`, `bats`, `ffmpeg` and Google Chrome are installed. Ben's phone is an iPhone 16 Pro.
- **Local state of this checkout.** `apex-rn/node_modules` is a fresh `npm ci` at Expo 58. `make -C apex-ios setup` has run: the git pre-commit hook is installed and the simulator `APEX apex iPhone 17` exists and is booted. `.claude/launch.json` (untracked, ignored) starts the React Native preview. The export zip is `~/Desktop/Home screen redesign brief-project.zip`.
- **`main` is protected** with no required check names and no required reviews, so merging needs no approval. The repo is public: macOS CI runners are free.

## Open with Ben

- **Issue 93, open:** the "snappy" spring's bounce is 0.15, a default nobody has seen on a phone. One number in `tokens.json` when he answers.
- **Issue 95, open:** seven defaults taken on Home where the mock is silent or disagrees with the design system. The ones that would change code: card padding (14 × 16 from the tokens, where the demo draws 16 all round), and the two tokens added from the demos (`card-title`, `accent-pressed`).
- **`CPUImageMatch` was ported against plan 4's text.** The tolerance is unchanged (0.98) and the check passes nothing a correct comparison would fail. In pull request 97 and in the report to the lead. Not yet asked of Ben in an issue.
- **Tokens, not hardcoded values** (Ben, 2026-11-27): "I don't want to be hard coding anything. The code needs to be very reusable." He wants the principal-engineer rules held hardest now. Load that skill before writing code.
- **Slow and flaky tests are what Ben most wants kept out** (lead, 2026-11-27). Report the `checks` job's split in every hand-off, and say what you would cut if it keeps growing. A stall or a flake is a bug to find that day, not something to re-run past.
- **Re-imports must be easy for Ben** (2026-11-27): `design/README.md`, "When a new export arrives".
- **Branches must not pile up** (Ben, 2026-11-27). When your code pull request merges, delete its branch and the plan branch it carried, locally and on the remote.
- Data is settled enough to build on (Ben, 2026-11-27): a SQL database on the phone is the source of truth; the Cloudflare copy is a backup only; Whoop sign-in is the one critical use of the Worker. The tables are designed with the first screen that stores data, not before.
- How Ben is asked questions while away from his Mac is the lead's to handle (GitHub issues labelled `needs-ben` for now).
- **When you report done, expect a clean-up message** (Ben, 2026-11-27): delete your merged branches locally and on the remote, then the lead closes your tab.
- A follow-up for arsenal, not this repo: worktree cleanup could delete the worktree's `APEX <folder> iPhone 17` simulator.
- Cadre's design reference is to be brought up to date from APEX's. Not started, not blocking.

## How to hand off

A worker session does not start the next session. It reports to the lead and stops; the lead starts the next one.

Inside Herdr only (`test "${HERDR_ENV:-}" = 1`). When the plan has merged and the next plan and this note are committed and pushed, or as soon as you are blocked on something you cannot resolve:

```bash
herdr agent prompt lead "<short report: pull request number, what merged, the before and after verification numbers, anything not verified, anything that needs Ben>"
```

Then stop. Never close a tab you didn't open, and never the workspace's first tab.
