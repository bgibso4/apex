# Hand-off note

The one place a fresh session learns where the work stands. Overwrite it at every hand-off. Keep it short: anything durable belongs in the design doc, a plan, `apex-ios/docs/roadmap.md` or `apex-ios/AGENTS.md`.

Last updated: 2026-11-27, by the session that executed plan 5 (worker `ci-gate`). It folds in the report of the device-lab worker.

## Read first, in this order

1. `docs/superpowers/specs/2026-11-27-ios-agentic-foundations-design.html` · the approved design. Ben approved it on 2026-11-27.
2. `apex-ios/AGENTS.md` · the iOS rules, then `apex-ios/CLAUDE.md` and `apex-ios/design/README.md`.
3. `apex-ios/docs/roadmap.md` · the ordered product segments.
4. Ben's standing rules for this effort, including the approval to push, open pull requests and merge on green CI. A session in a worktree does not load them by itself: read `~/.claude/projects/-Users-ben-projects-apex/memory/MEMORY.md`, then the files it lists under Feedback and the two it names "iOS data stack" and "Lead/worker sessions in Herdr".

## Where things stand

- **The foundation is done.** Plan 1 (repo split) merged as pull request #88, plan 2 (skeleton and hooks) as #90, plan 3 (design export, tokens, `make mocks`) as #94, plan 4 (the first screen, pictures, a journey, the local gate) as #97, plan 5 (the simulator gate in CI) as #99, merge commit `88c77bc`.
- **The device lab** merged as #100 (issue 96): a Debug-only sheet for trying a token's value on the phone. Ben has not seen it on the phone yet. The one command, from `main`, phone connected and unlocked: `make -C apex-ios device STATE=lab.motion`. The build on his phone is from before the lab's review fixes.
- **CI on a pull request** runs three jobs: `checks` (as before), `plan` (6 s: does the gate run, and which run holds `main`'s test times) and `gate` (every picture and journey, on the simulator, with the time ceiling enforced). On a push to `main` the gate is skipped only when a run already passed it on exactly the same files.
- **The skip on `main` works.** The push run for #99's merge (46084531493) said "same files as run 46083158020, which passed the gate: the gate is skipped", skipped `gate`, and `checks` was green in 3 min 49 s.
- **Branches:** `main`, and `docs/ios-roadmap`, which holds this note and the roadmap and has no pull request of its own.

## Do now

Build the first segment in `apex-ios/docs/roadmap.md` that is not ticked: segment 1, Programs and starting one. It brings the store (the SQL database on the phone), so read "iOS data stack" in the memory files first.

- **You are in your own Herdr worktree** (Ben, 2026-11-27: one worktree per worker); the lead (Herdr agent `lead`) sits in the main checkout at `~/projects/apex`. Your branch `feat/ios-programs` already exists and is checked out. First command: `make -C apex-ios setup`, which makes this worktree's own simulator. If you find changes in your working tree that you did not make, stop and say so.
- **The store is the one part of this segment the mocks do not decide, and every later segment builds on it** (the lead, 2026-11-27). Before the plan's tasks, compare the ways to hold a SQL database on the phone (at least GRDB, SwiftData, and SQLite behind a thin layer of your own) against Ben's rules: the phone's SQL database is the source of truth, migrations are tested on the Mac, tests stay fast, Swift 6. Look the options up (Axiom's data skills, current documentation); do not go from memory. Put the comparison and your choice at the top of the plan and under NEEDS BEN in your report, with the default taken. Do not wait for an answer.
- **Two points about data the lead has not settled with Ben.** Take these defaults and say so in your report. (a) July's spec (`docs/superpowers/specs/2026-07-15-swiftui-migration-redesign-design.md`) says no schema changes until cutover; the redesign needs other shapes (exercises keyed by ID, muscle tags, more than one session a day). Default: the native app has its own schema, shaped for the redesign, and the old database is read once in roadmap segment 11. (b) A backup counts only if it can be restored. Backup and restore are segment 16, not yours: build nothing for them now.
- **If the plan shows more than one pull request of work, split it:** the store with the Library first, then the preview and Start. Say so in your report; the lead updates the roadmap.
- **Ben has not yet seen the roadmap's order.** Segment 1 stays first whatever he changes.
- **The roadmap and this note have no pull request and ride with yours:** your branch starts from `docs/ios-roadmap`. When yours has merged, delete `docs/ios-roadmap` on the remote too. For later hand-offs: a pull request that touches neither `apex-ios/` nor `apex-rn/` gets no checks and cannot merge itself, so a note or a root-level plan alone always rides with code.
- Write the segment's plan with `superpowers:writing-plans` at `apex-ios/docs/plans/`, commit it, execute it yourself with `superpowers:executing-plans`. The design export is the approved brief: do not wait for a design approval. A gap in a mock becomes a `needs-ben` issue with the default taken.
- Before a merge: one `ios-verifier` agent for the evidence and one fresh reviewer agent. Then tick the segment in the roadmap, rewrite this note, report to the lead.
- **Check "Open with Ben" below before you start.** The ceiling question there decides how many pictures the next segments can add.

## Numbers when plan 5 merged

Local numbers are from Ben's Mac with 8 simulator tests, 26 Mac tests, 47 hook tests, 96 script tests, 43 lint fixtures.

| Command | Result | Wall time | Before plan 5 |
|---|---|---|---|
| `make -C apex-ios fast` | 26 Mac tests | 4.6 s warm | 4.4 s (15 tests) |
| `make -C apex-ios build` | Build Succeeded | 2.9 s incremental | 2.9 s |
| `make -C apex-ios ci-checks` | green | 52.5 s | 48.9 s, 53.7 s after the lab |
| `make -C apex-ios gate` | 8 tests, 7.7 s of test time | 20 s: build 4 s, boot 0 s, tests 15 s | 16.9 s, 7.2 s of test time |
| CI `checks` | green | 4 min 32 s to 5 min 50 s over five runs on the pull request; 3 min 49 s on `main` | 4 min 54 s |
| CI `gate` | green, 15.7 to 20.9 s of test time over four runs | 7 min 22 s to 10 min 16 s of work; one run waited 3 min 15 s more for its runner | did not exist |
| CI `plan` | green | 6 s | did not exist |

- **The ceiling is 40 s** of test time, recorded from CI's first measurement (15.7 s, run 46055171364; twice, rounded up to the next 10 s). CI's measurements so far: 15.7 s, 19.0 s, 16.9 s and 20.9 s (52% at most; the last two with the lab's step in the journey). The journey is 13 to 18 s of that in CI (6.7 s locally); a picture 1.3 to 1.5 s (0.9 to 1.0 s locally).
- **Where the `gate` job's time goes** (run 46077897942, 7 min 22 s): tools 33 s, generate 8 s, build 62 s, the simulator's first boot 77 s, then 219 s in `test-without-building`, of which about 180 s is `xcodebuild` waiting on the freshly booted simulator before its Test action starts, 30 to 45 s launching the two test hosts, and about 20 s of tests. Report and uploads 10 s. The slowest run (46083158020, 10 min 16 s) had build 88 s, boot 88 s and 364 s in `test-without-building`: the wait before the first test was about 5 min.
- **Where `checks`' time goes** (same run, 4 min 40 s): setup 36 s, generate 18 s, lint 2 s, hook tests 26 s, script tests 70 s (62 s before plan 5: 32 more bats tests, each making a small git repo), lint fixtures 11 s, the Mac tests 46 s, Periphery 58 s.
- **`scripts/hooks/swift-fingerprint.sh`** takes 0.03 s where it took 0.75 s (74 files), in every `make fast` and every stop-gate check. Same value: `hooks.bats` pins it.
- **If CI must get shorter, try in this order:** (1) the 3 min wait after the boot: boot the simulator alongside a build that names no device, as filing-cabinet's `ci-sim` does (its Makefile says what CI taught it); worth about 75 s, at the price of a build path only CI uses. (2) In `checks`, run the three mock tests that launch Chrome only when `render-mocks.py` or `mock-frame.html` changes. (3) The `gate` job installs SwiftLint, bats and Periphery it never uses (about 11 s).

Not verified, plainly:

- **The change against `main` with a number.** Every gate run so far said "unknown (no gate results for main)", correctly: no run had passed the gate on `main`'s files. The step that downloads `main`'s results with the job's own token has never run in CI. The reviewer ran the same download and report by hand with Ben's token and got `change against main: -2.1 s (main 19.0 s)`. It first runs on the next iOS pull request. If it fails, the line says unknown and nothing else changes.
- **A failed picture in CI.** None has failed there, so what lands in the `gate-failures` artifact's `snapshot-artifacts` folder is not yet seen. The result bundle, which holds the reference, the failure and the difference, is uploaded too.
- **From the device lab:** what the phone's screen shows, and the merged build on the phone. The launch-state wiring in `ApexApp` has no automated test (`lab.motion` opens the exhibit; `lab.nope` stops with a message that lists the known states: checked by hand). Each use of the lab outside its folders sits in `#if DEBUG`, but nothing checks that and no Release build runs in CI: build Release once after changing the lab's wiring.
- **From plans 2 to 4, still:** the stop gate's block message live; the two buttons' pressed states; any motion token in a picture.

## What earlier sessions learned that the docs don't say

- **CI's macOS runner after a simulator's first boot.** Everything that goes through Xcode's tools is slow for minutes. In run 46052910220, which booted first, `swift scripts/generate-tokens.swift` took 212 s where it takes 8 s, and the build about 8 min where it takes one. So `sim-tests.sh` builds first and boots after. `xcodebuild` then still waits 3 to 5 min before its Test action starts; no test time counts that wait. `simctl bootstatus -b` itself takes 77 to 123 s there, most of it data migration.
- **xcbeautify holds its output back when piped.** In a CI log a whole build arrives with one timestamp. For where time goes, read the `test-runs:` line (build, boot and test seconds), `make`'s own echoed lines, and the result bundle: `xcrun xcresulttool get log --path <bundle> --type action --compact` gives each launch and suite with its start time.
- **The runner's bash is 3.2 too** (`/bin/bash -e` for every `run:` block of a macOS job). It reads a quote character inside `"${var:-…}"` as an open string: run 46055171364 failed on an apostrophe there. Before pushing a workflow change, extract each `run:` block (`ruby -ryaml`) and run `/bin/bash -n` on it.
- **A job's log cannot be read while the job runs** (`gh run view --log` and the API both answer not found). Cancelling a run to read it loses nothing but the steps after the cancel; `gate-failures` is uploaded on cancel as well as on failure.
- **This Mac sleeps when left** (maintenance sleep), and a local run then stalls for a quarter of an hour: a `make ci-checks` took 2,097 s that way. Wrap long local runs in `caffeinate -is`.
- **Never edit a script a background run is using.** bash reads a script as it goes: a `make gate` died with a syntax error because `sim-tests.sh` changed under it.
- **GitHub's API gives a run's tree directly** (`head_commit.tree_id`), and a pull request's run carries the head commit's tree, not the test merge's. `gate-run.sh` rests on both.
- **Package caches saved on a pull request are not shared with other pull requests.** The `gate` job's own cache cost 8 s to restore and 15 s to save for no faster build, so only `checks` caches.
- **The hooks are live the moment `.claude/settings.json` changes,** in the running session and in subagents. The bypass guard reads every Bash command: any command whose text outside a `-m` message contains the no-verify flag or the hooks-path setting is refused, read-only ones and `echo` included.
- **Claude Code's own safety check** refuses a compound shell command it cannot parse when it thinks a removal might be in it: a heredoc followed by `&&`, or `rm -rf "$VAR"` inside a longer command. Keep a heredoc in a call of its own, edit files with the Edit tool, and keep any `rm` on one explicit path in its own call.
- **`gh pr checks --watch` straight after a push** can print "no checks reported" and exit 0 before the run registers. That is not green. Find the run with `gh run list --branch <branch>`, use `gh run watch <id> --exit-status`, then read `gh run view <id> --log` for the counts.
- **bash 3.2 (the only bash on this Mac):** a failing `[[ ]]` that is not a bats test's last command does not fail the test: end each with `|| false`. A leading `!` never fails a test: use `run` and check `$status`. `${var/#old/new}` anchors at the start: escape the `#`. An `exit` inside a loop that is piped only leaves the pipe's subshell.
- **`ls` is aliased in this shell.** In a command typed here use `/bin/ls` when its output is parsed.
- **`ci-checks` starts with the drift check.** It fails while a regenerated `Generated/` file is staged or unstaged: commit, then run it.
- **`make fast` fails when a package test target is missing from the `Fast` scheme** (`check-fast-scheme`). Add a new test target to `project.yml` in the same change.
- **swift-format's 120 columns apply to generated Swift too.**
- **Python on a CI runner:** `http.server`'s own server looks up the host name when it starts and took 35 s a start there. `render-mocks.py` uses a plain `socketserver` server. `python3` on this Mac is Homebrew's 3.15 and has no `yaml` module; the system one is 3.9.6; the scripts run on both.
- **The lint rules are strict on purpose, and loosening one waits for Ben.** `withAnimation` and `.animation` must be given `Tokens.Motion.<name>` directly. `Font.custom`, `Color(…)` and any `Animation` built in place are allowed only under `Screens/DesignSystem/`. `.primary` and `.secondary` are flagged only inside a style modifier.
- **`design/export/CLAUDE.md` is loaded by Claude Code as instructions** whenever an agent reads that folder. Its design rules hold; its instructions for recording decisions do not apply here (AGENTS.md says so).
- **`design/export/inventory.md` is behind the export.** It was last updated on 2026-11-12 and lists the Library, the program overview and All exercises as "to design"; the export holds locked reference builds for all three (`Library Demo`, `Program Overview Demo`, `Program Preview Demo`, `All Exercises Demo`) and their logs. The roadmap goes by the export.
- **The demos:** each page carries its screen in a hidden template before any script runs, and renders the real one after React loads from unpkg. Home's program state has three switches, `Active`, `Paused` and `Ended`; `Ended` is the "No Active Program" card. A demo's measurements are in its inline styles and, for the header, in the script at the foot of the page.
- **Pictures.** Ten freshly booted simulators drew the same picture byte for byte; one that had run for hours drew system glass up to 2/255 differently in under 0.1% of pixels. Record a reference on a fresh boot (`xcrun simctl shutdown`, then `make snapshots-record`). CI's simulator, always fresh, has matched the references in every run. `CPUImageMatch` runs first because the library's own comparison rejected that small difference on this Mac; Ben has confirmed it stays, at 0.98 (issue 98). The library names a reference `<test>.<name>.png` and writes every run of non-word characters in the name as a hyphen. A failing simulator run takes 30 to 60 s where a passing one takes 13: XCTest collects diagnostics.
- **Motion on the simulator** (from the device lab). `xcrun simctl io recordVideo` drops frames and squeezes time when the Mac is busy: at full speed a 0.18 s fade showed two frames. Turn the simulator's slow animations on first: `xcrun simctl spawn "<sim>" notifyutil -s com.apple.UIKit.SimulatorSlowMotionAnimationState 1`, then the same with `-p`; set it back to 0 after. `make frames` could do this. Cutting a recording by time needs a constant frame rate first (`ffmpeg -vf fps=60`).
- **The phone** (from the device lab). "Ben’s iPhone" has a typographic apostrophe and devicectl matches the whole name: `make device` finds the paired phone itself. devicectl reads an app's `-State` as its own `-t` unless a `--` comes before the bundle ID. A paired phone that is out of reach still lists as paired; the install then fails with CoreDevice error 4016. `xcodebuild` once printed "Failed to load credentials … missing Xcode-Username" for one Xcode account; the build still signed. Nothing was asked of a person for the install: no trust prompt, no signing step.
- **No tool here can tap the simulator.** Axiom's xcui needs AXe, which is not installed. The device-lab worker used a scratch UI test, never committed.
- **SwiftUI and Swift on this toolchain.** The system navigation bar is 54 pt tall on iOS 27; the mocks draw a 44 pt row. `Image(_:bundle:)` reads only asset catalogs; a loose PNG in a package's resources loads through `UIImage(named:in:with:)`. `Exo2-ExtraBold.ttf` is a variable font named "Exo 2"; ExtraBold is its instance `Exo2-Regular_ExtraBold`. A generic type cannot hold a static stored property. A Swift script run with `swift file.swift` does not take bare regex literals. xcbeautify prints only "recorded an issue with 1 argument(s)" for a failing parameterised Swift Testing case, and loses Swift Testing's summary line: count the ✔ lines. `ScreenModels` has main-actor default isolation; its plain value types are marked `nonisolated`.
- **CI installs Homebrew's XcodeGen.** Only SwiftLint's version is checked. Homebrew disables its `periphery` formula on 2027-08-12; the install step fails then.
- **Left from plan 5's review, all minor.**
  - A `plan` job that fails or times out makes the run red and skips the gate, where the design says an unclear answer runs it. On `main` that leaves a tree untested until someone re-runs. The reviewer's fix: `if: ${{ !cancelled() && needs.plan.outputs.gate != 'false' }}` on the `gate` job. Not taken before the merge because it could not be proven without breaking `plan` on purpose. First follow-up.
  - Only `ENFORCE=1` enforces; `ENFORCE=true` in a later workflow edit would silently not.
  - The `gate` job's timeout is 30 min for an 8 min job; a hung `simctl bootstatus` has no timeout of its own.
  - `gate-run.sh`'s known gap (its header): a pull request tested while behind `main` by a commit, that commit reverted on `main`, then the pull request merged with no new push, skips the gate on a tree its run did not test.
  - `build-fingerprint.sh` would read a file name that starts with a dash as `shasum` options, as `swift-fingerprint.sh` did until this plan's review.
  - A name with a backslash or a newline gives `swift-fingerprint.sh` another value than the old loop did (it still follows content). No such file exists.
- **Left from plan 4's review, still open:** a Mac-test-only edit makes `retest` refuse; `--check-map` reads only top-level files in `UITests/` and `SnapshotTests/`; the resource copy in `make generate` passes when a source file is missing; `frames.sh` has no `trap` for its recorder; `test-times.py` counts a test with no `durationInSeconds` as 0 s; at delta E 2 a picture cannot tell `field-base` from `field-mid` or `card-base` from `field-mid`; references are 16-bit Display P3 PNGs of 1.4 MB each, compared in 8-bit sRGB; `launchApp(_ flags:)` has no caller that passes flags; `"com.cadre.apex"` is written in two files; `AppTab.title` is `public` though only `Screens` uses it. (Plan 5 took three: non-ASCII paths, a ceiling that is no positive number, the four config files in the map.)
- **Left from plan 3's review:** no timeout on the Chrome call in `render-mocks.py`; a traceback on bad JSON in `states.json`, and a duplicate state name wins silently; more than about 16 clicks for one state fails with no reason given; one bats test repeats `make lint`; the token generator accepts `true` as a number and names that are not kebab-case; a zip with a wrapper folder would import `shots/`; Chrome's version is not pinned.
- **Left from plan 2's review:** two worktrees with the same folder name share a simulator name; nothing deletes a checkout's simulator when its worktree is removed; the "no `apex-ios/` folder" check in three hooks cannot be reached through the committed wiring.
- **Filing-cabinet is the template** (`~/projects/filing-cabinet`). Left out for good: `AuditTests/`, the `ax5` and `light` snapshot variants, `-ReduceMotion`, `nightly.yml`, `audit-report.sh`, the smoke list, TelemetryDeck, the eval and device-perf targets. Why it got slow is in its `docs/superpowers/specs/2026-11-22-test-suite-restructure-design.md`.
- **This Mac:** Xcode 27.2, Swift 6.4.2, simulator runtimes iOS 27.0 and 27.1. XcodeGen 2.49.0, SwiftLint 0.65.1 (CI checks that version), Periphery 3.8.0; `xcbeautify`, `jq`, `bats`, `ffmpeg` and Google Chrome are installed; no `actionlint`. Ben's phone is an iPhone 16 Pro.
- **`main` is protected** with no required check names and no required reviews, so GitHub itself does not stop a merge without the gate: the merge rule in `AGENTS.md` is the guard. The repo is public: macOS CI runners are free.

## Open with Ben

- **The ceiling will be reached within two or three segments.** It is 40 s and CI uses 16 to 21 s today, 13 to 18 of them the one journey. A picture costs about 1.4 s in CI: room for about 15 more, and Home alone has seven states. The design's rule (twice the first measurement) gave a ceiling sized for 8 tests; the design's own model works in minutes (its slider starts at 6). Asked of Ben in issue 101 (the lead recommends: each new picture of a designed state adds 2 s to the ceiling, nothing else raises it). Until he answers, the rule in `AGENTS.md` holds and the ceiling does not move.
- **Issue 98, closed, yes to both** (Ben, 2026-11-27): `CPUImageMatch` stays and the tolerance stays 0.98; `swift-fingerprint.sh` was made faster in pull request #99 with tests that pin its output.
- **Issue 93, open:** the "snappy" spring's bounce is 0.15, a default nobody has seen on a phone. The device lab exists for this: Ben picks a value there, then one number changes in `tokens.json`. The lab offers 0, 0.1, 0.15, 0.2, 0.3, 0.4 and 0.5; the mock's tick pop overshoots about 14%, which this spring reaches only near 0.47, so if he wants the demo's look exactly that is keyframes, not this token.
- **To verify on the phone** (labelled `verify-on-device`, never blocking): the bounce on the tick and on the row; whether a drag to the right on a lab row takes him back; whether pressing and holding the wordmark ever gets in the way once Home scrolls. Is press and hold on the wordmark an acceptable way in for now? Default: yes.
- **Issue 95, open:** seven defaults taken on Home where the mock is silent or disagrees with the design system. The ones that would change code: card padding (14 × 16 from the tokens, where the demo draws 16 all round), and the two tokens added from the demos (`card-title`, `accent-pressed`).
- **Required checks on `main`.** None are set. Making `checks` and `gate` required would have GitHub hold the merge rule, but a skipped `gate` on a docs-only change would then block that merge. Not changed: a repository setting is Ben's.
- **Bringing the old records over** (roadmap, segment 11): when, and from the old app's file on the phone or from the Cloudflare copy.
- **Tokens, not hardcoded values** (Ben, 2026-11-27): "I don't want to be hard coding anything. The code needs to be very reusable." Load `principal-engineer` before writing code.
- **Slow and flaky tests are what Ben most wants kept out** (lead, 2026-11-27). Report both CI jobs' splits in every hand-off, and say what you would cut if they keep growing. A stall or a flake is a bug to find that day, not something to re-run past.
- **Re-imports must be easy for Ben** (2026-11-27): `design/README.md`, "When a new export arrives".
- **Branches must not pile up** (Ben, 2026-11-27). When your code pull request merges, delete its branch and any docs branch it carried, locally and on the remote.
- Data is settled enough to build on (Ben, 2026-11-27): a SQL database on the phone is the source of truth; the Cloudflare copy is a backup only; Whoop sign-in is the one critical use of the Worker. The tables are designed with the first screen that stores data, not before.
- How Ben is asked questions while away from his Mac is the lead's to handle (GitHub issues labelled `needs-ben` for now).
- **Finished sessions leave nothing behind** (Ben, 2026-11-27): delete your merged branches on the remote before you report; the lead then removes your worktree, its local branch and your Herdr space. Delete any scratch folder you made (for example under `.superpowers/`) yourself, one explicit path per `rm` call.
- A follow-up for arsenal, not this repo: worktree cleanup could delete the worktree's `APEX <folder> iPhone 17` simulator.
- Cadre's design reference is to be brought up to date from APEX's. Not started, not blocking.

## How to hand off

A worker session does not start the next session. It reports to the lead and stops; the lead starts the next one.

Inside Herdr only (`test "${HERDR_ENV:-}" = 1`). When the segment has merged and this note and the roadmap are committed and pushed, or as soon as you are blocked on something you cannot resolve:

```bash
herdr agent prompt lead "<short report: pull request number, what merged, the before and after verification numbers, anything not verified, anything that needs Ben>"
```

Then stop. Never close a tab you didn't open, and never the workspace's first tab.
