# iOS CI Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run every picture and journey in CI before a pull request can merge, fail a pull request whose simulator tests go over the time ceiling, show each run's change against `main`, and skip the simulator job on a merge whose pull request already passed on the same files.

**Architecture:** One new CI job, `gate`, runs `make -C apex-ios gate ENFORCE=1` on a macOS runner: the same script agents run locally, with the time ceiling enforced. A small job before it, `plan`, decides whether `gate` runs: always on a pull request, and on a push to `main` only when no earlier run passed the gate on exactly the same files. One script, `scripts/ci/gate-run.sh`, answers "which run passed the gate on this tree?"; both the skip and the comparison against `main` use it. Each gate run uploads its test results as an artifact, and that artifact is `main`'s number for the next pull request.

**Tech Stack:** GitHub Actions (`xcode-27` runner for the simulator, `ubuntu-latest` for `plan`), `gh` for the GitHub API, bash 3.2 and Python 3 (`-I`) with bats tests, `xcrun simctl bootstatus`.

**Spec:** `docs/superpowers/specs/2026-11-27-ios-agentic-foundations-design.html` (sections "Tests" → "What runs when", "Keeping it fast", "Workflow" → "When an agent may merge"; build-order step 6). This is plan 5 of 5: the last plan of the foundation.

**Read first:** `apex-ios/AGENTS.md`, `docs/superpowers/handoff.md`, `.github/workflows/ios.yml`, `.github/actions/xcode-setup/action.yml`, `apex-ios/scripts/sim-tests.sh`, `apex-ios/scripts/test-times.py`. Load `principal-engineer`.

**Templates** (`~/projects/filing-cabinet`, port and cut down): `scripts/ci/gate-passed.sh`, `scripts/ci/tests/gate-passed.bats`, the `plan` and `ci` jobs of `.github/workflows/ci.yml`, the `ci-sim` target of its `Makefile` (only its simulator boot and the comments that say what CI taught it).

## Global Constraints

- This plan changes files under `apex-ios/` and `.github/` only. Nothing under `apex-rn/`, `workers/` or `.claude/` changes. No lint config and no hook config changes.
- Every hard rule in `apex-ios/AGENTS.md` holds.
- CI starts as one simulator job that builds once. It is split only if the ceiling forces it (spec, "What runs when").
- The ceiling is checked in CI, against CI's own timings. Locally `make gate` prints the same report and never fails on time (spec, "Keeping it fast").
- The ceiling is recorded again from CI's first measurement, at twice the measured test time rounded up to the next 10 s. That is the design's own build step. After this plan, changing `scripts/gate-ceiling.txt` or the picture tolerance needs Ben.
- A run is never skipped on a guess: when GitHub cannot be asked, or the answer is unclear, the gate runs.
- A pull request merges only when every check is green, none skipped, none re-run until it passed by luck. A flaky test found here is a bug to find that day: time it, read its result bundle, fix the cause.
- Slow and flaky tests are what Ben most wants kept out. Every step that adds time to `make fast`, `make ci-checks` or a CI job says how much in the hand-off.
- bash 3.2 is the only bash on the Mac and on the runner's default path: no associative arrays, no `mapfile`; end each `[[ ]]` in a bats test with `|| false`; use `run` and `$status`, never a leading `!`.
- Middots in new prose; no em dashes.
- Pushing, opening the pull request and merging on green CI are approved for this effort. Merge with a merge commit, then delete the code branch and the plan branch it carried, locally and on the remote.

## Review Focus

1. **A merge whose files differ from what the pull request tested.** A pull request that was behind `main` when it merged gives `main` a tree no run tested: the gate must run. Pinned by Task 2 ("a run on a different tree does not count").
2. **GitHub cannot be asked.** An API error, a missing token or an empty answer must run the gate, never skip it. Pinned by Task 2 ("when gh fails the answer is no").
3. **A run that did not pass the gate counted as one that did.** A cancelled run, a failed one, or one whose `gate` job was skipped must never let `main` skip, and must never be `main`'s number. Pinned by Task 2 ("a run whose gate job did not succeed does not count").
4. **Over the ceiling in CI.** With `ENFORCE=1` the gate exits non-zero over the ceiling; without it, never. A missing number for `main` changes one line of the report and never the exit status. Pinned by Task 1 (three tests).
5. **A gate job that ran nothing.** A simulator that never booted, or a build that produced no tests, must fail the job. `sim-tests.sh` already fails when no test ran; Task 3 step 5 proves it once in CI by reading the failed run.

## File Structure

```
.github/workflows/ios.yml               gains the plan and gate jobs
.github/actions/xcode-setup/action.yml  the package cache key also covers Package.resolved
apex-ios/
  Makefile                              boot waits for the simulator by its ID; gate takes ENFORCE and MAIN_RESULTS
  scripts/sim-tests.sh                  passes --enforce and --main to the report
  scripts/test-times.py                 gains --main: the change against main
  scripts/gate-ceiling.txt              recorded again, from CI
  scripts/ci/gate-run.sh                which run passed the gate on a commit's tree
  scripts/ci/tests/gate-run.bats        its tests
  scripts/tests/test-times.bats, sim-tests.bats, affected.bats   new cases
  AGENTS.md, CLAUDE.md                  what CI runs, and that the foundation is done
```

---

### Task 1: The report in CI: `--enforce` and the change against `main`

**Files:**
- Modify: `apex-ios/scripts/test-times.py`, `apex-ios/scripts/sim-tests.sh`, `apex-ios/Makefile`, `apex-ios/scripts/tests/test-times.bats`, `apex-ios/scripts/tests/sim-tests.bats`
- Create: `apex-ios/scripts/tests/fixtures/times/main.json`

**Interfaces:**
- Produces: `test-times.py TESTS_JSON CEILING_FILE [--enforce] [--main MAIN_TESTS_JSON]`. `MAIN_TESTS_JSON` has the same shape as `TESTS_JSON`. With `--main`, the report gains one line after the first: `change against main: +1.5 s (main 26.5 s)`, the sign always shown, one decimal. When the file is missing or unreadable the line is `change against main: unknown (no gate results for main)` and the exit status is unchanged.
- Produces: `sim-tests.sh` reads `ENFORCE` and `MAIN_RESULTS` from the environment: `ENFORCE=1` adds `--enforce`, a non-empty `MAIN_RESULTS` adds `--main "$MAIN_RESULTS"`. The Makefile's `SIM_TESTS` passes both through, so CI runs `make gate ENFORCE=1 MAIN_RESULTS=<path>`.
- Produces: every run leaves its tests JSON at `.build/results/<mode>.xcresult.json` (it does today); Task 3 uploads `gate.xcresult.json`.

- [x] **Step 1: Branch**

```bash
git checkout main && git pull && git checkout -b feat/ios-ci-gate docs/ios-ci-gate-plan
make -C apex-ios setup && /usr/bin/time -p make -C apex-ios fast && /usr/bin/time -p make -C apex-ios ci-checks && /usr/bin/time -p make -C apex-ios gate
```

Note the three times (when plan 4 merged: `fast` 4.4 s, `ci-checks` 48.9 s, `gate` 16.9 s wall and 7.2 s of test time). Task 5 compares against them.

- [x] **Step 2: Write the failing tests**

`main.json`: six tests in one suite, 26.5 s in all (the `seven` fixture is 28.0 s).

```
test-times.bats (add)
  @test "with main's results the report gives the change against main"
    # seven against main.json, ceiling 100 -> line 2 is "change against main: +1.5 s (main 26.5 s)"; exit 0
  @test "a change that is faster than main shows a minus"
    # main.json against seven.json as main -> "change against main: -1.5 s (main 28.0 s)"
  @test "missing results for main say unknown and change nothing else"
    # --main no-such-file.json -> "change against main: unknown (no gate results for main)"; exit 0; the rest of the report as without --main
sim-tests.bats (add)
  @test "ENFORCE=1 fails a run over the ceiling"
    # ceiling file 20, STUB_RESULTS=seven: `ENFORCE=1 sim gate` exits 1; `sim gate` exits 0
  @test "MAIN_RESULTS reaches the report"
    # MAIN_RESULTS="$TIMES/main.json" sim gate -> output contains "change against main: +1.5 s"
```

- [x] **Step 3: Run them and watch them fail**

Run: `make -C apex-ios test-scripts`
Expected: the 64 earlier tests pass, the 5 new ones fail.

- [x] **Step 4: Implement, run, commit**

Run: `make -C apex-ios test-scripts && make -C apex-ios gate`
Expected: 69 script tests pass; the local gate prints no "change against main" line and exits 0.

```bash
git add apex-ios && git commit -m "feat(ios): the time report enforces the ceiling on request and shows the change against main"
```

### Task 2: Which run passed the gate on these files

**Files:**
- Create: `apex-ios/scripts/ci/gate-run.sh`, `apex-ios/scripts/ci/tests/gate-run.bats`
- Modify: `apex-ios/Makefile` (`test-scripts` runs `bats scripts/tests scripts/ci/tests`)

**Interfaces:**
- Produces: `scripts/ci/gate-run.sh <sha>` prints the database ID of a workflow run of `ios.yml` and exits 0 when that run concluded `success`, its job named `gate` concluded `success`, and its head commit's tree is `<sha>`'s tree. It exits 1 and prints nothing on stdout otherwise, with one `warning:` line on stderr saying why. It looks at pull request runs and push runs alike, newest first, 50 at most.
- It reads `GITHUB_REPOSITORY` and calls the API through `gh` (`GH_TOKEN`; the job needs `actions: read`). `APEX_GH` is the seam for the tests.
- Why the tree: a pull request's run tests the pull request merged into `main`. When the pull request was up to date with `main`, its merge commit has the head's tree, so those files were already tested.

- [x] **Step 1: Write the failing tests**

Port `gate-passed.bats`: a fixture repo, a stub `gh` that answers from files.

```
@test "a successful run with a successful gate job on the same tree is found"      # prints its ID, exit 0
@test "a run on a different tree does not count"                                   # exit 1
@test "a run whose gate job did not succeed does not count"                        # conclusions failure, cancelled, skipped, and no gate job at all
@test "the newest matching run wins"
@test "when gh fails the answer is no"                                             # exit 1, a warning on stderr, nothing on stdout
@test "a sha that is no commit here is no"
```

- [x] **Step 2: Run them and watch them fail**

Run: `make -C apex-ios test-scripts`
Expected: the 69 earlier tests pass; the 6 new ones fail, the script does not exist.

- [x] **Step 3: Write the script, run, commit**

Run: `make -C apex-ios test-scripts`
Expected: 75 pass. Then, against the real repository, find plan 4's merge: `GITHUB_REPOSITORY=bgibso4/apex apex-ios/scripts/ci/gate-run.sh origin/main` exits 1 with a warning (no run has a `gate` job yet).

```bash
git add apex-ios && git commit -m "feat(ios): find the CI run that passed the gate on a commit's files"
```

### Task 3: The gate job

**Files:**
- Modify: `.github/workflows/ios.yml`, `.github/actions/xcode-setup/action.yml`, `apex-ios/Makefile`

**Interfaces:**
- Consumes: `make gate ENFORCE=1 MAIN_RESULTS=<path>` from Task 1; `gate-run.sh` from Task 2.
- Produces: job `plan` (`ubuntu-latest`, `fetch-depth: 0`, `permissions: actions: read, contents: read`) with two outputs: `gate` (`true` or `false`) and `main_run` (a run ID or empty).
  - On a pull request: `gate=true`; `main_run` is `gate-run.sh <base sha>`'s answer, empty when there is none.
  - On a push to `main`: `gate=false` when `gate-run.sh "$GITHUB_SHA"` finds a run, and the step says which run; otherwise `gate=true` and `main_run` is `gate-run.sh "$GITHUB_SHA^1"`'s answer.
- Produces: job `gate`, named exactly `gate` (`gate-run.sh` looks for that name), `needs: plan`, `if: needs.plan.outputs.gate == 'true'`, `runs-on: xcode-27`, `timeout-minutes: 30`, the same `env` as `checks`.
  - Steps: checkout; `xcode-setup`; when `main_run` is set, `gh run download <id> -n gate-results -D apex-ios/.build/main-results` (a failure here is not an error: the report says unknown); `make -C apex-ios gate ENFORCE=1 MAIN_RESULTS=.build/main-results/gate.xcresult.json`, its output also kept in `apex-ios/.build/gate.log` (`set -o pipefail`, `tee`); in a step that always runs, the report (that log from its `test time:` line to its end) appended to `$GITHUB_STEP_SUMMARY` inside a code block; upload `apex-ios/.build/results/gate.xcresult.json` as the artifact `gate-results`, always; on failure, upload `apex-ios/.build/results/gate.xcresult` and the pictures the library wrote for failed comparisons as `gate-failures`.
- Produces: `checks` is unchanged and still runs on every trigger.
- Produces: `make boot` boots by the simulator's ID and returns only when it has finished booting: `xcrun simctl bootstatus <udid> -b`, the ID found as the `sim` target finds the device (`xcrun simctl list devices 'iOS $(SIM_OS)'`, the line `    $(SIM_DEVICE) (`). The CI image has an iPhone 17 for more than one iOS version, so a name alone is ambiguous; and filing-cabinet's UI test runner once started before the simulator's accessibility had loaded and failed before any test ran.
- Produces: the package cache key also hashes `apex-ios/Package.resolved`.

What filing-cabinet's CI learned that this job does not copy yet: its build names no device (`generic/platform=iOS Simulator`) and runs while the simulator boots, because an `xcodebuild` that asked a freshly booted CoreSimulator for its destination once waited 3 to 5 minutes. Step 4 measures whether APEX meets that; port it only if it does.

- [ ] **Step 1: `make boot` by ID**

Run locally: `xcrun simctl shutdown "APEX $(basename "$PWD") iPhone 17"; /usr/bin/time -p make -C apex-ios boot; /usr/bin/time -p make -C apex-ios boot`
Expected: the first returns when the simulator is booted (about 20 to 40 s), the second in under a second. Then `make -C apex-ios gate` is green.

- [ ] **Step 2: Write the two jobs and the cache key**

Check the workflow before pushing: `python3 -c 'import yaml,sys; yaml.safe_load(open(".github/workflows/ios.yml"))'` (or `ruby -ryaml`), and read it once against the Interfaces above.

- [ ] **Step 3: Commit, push, open the pull request as a draft**

```bash
git add .github apex-ios && git commit -m "ci(ios): the simulator gate, and the skip for a merge that already passed"
git push -u origin feat/ios-ci-gate
gh pr create --draft --base main --title "apex-ios: the simulator gate in CI" --body "Draft: measuring CI's first gate run."
```

Find the run with `gh run list --branch feat/ios-ci-gate`, watch it with `gh run watch <id> --exit-status`.
Expected: `plan` says the gate runs and that `main` has no gate results; `gate` builds once, runs 8 tests, prints the report with `change against main: unknown (no gate results for main)`, uploads `gate-results`, and is green.

- [ ] **Step 4: Measure the job**

From `gh run view <id> --log`, note for the hand-off: the job's wall time and its split (tool install, simulator boot, `build-for-testing`, `test-without-building`, upload); the gate's test time; one picture's seconds and the journey's seconds against the local 1.0 s and 6.1 s; and `checks`' wall time and split against 4 min 54 s (plan 4; its split is in the hand-off note).
If `build-for-testing` waits more than 60 s before its first compile line, port filing-cabinet's boot-alongside build (the `ci-sim` target) into `sim-tests.sh` behind the same modes, with a bats test, and measure again.
If the picture test fails on CI though it passes locally, read the uploaded `gate-failures` first: `CPUImageMatch.swift` says what was measured on Ben's Mac. A reference is recorded on a freshly booted simulator; do not re-record to make CI pass before knowing what differs.

- [ ] **Step 5: Prove a run that ran nothing fails**

Run locally: `make -C apex-ios retest ONLY=ApexUITests/NoSuchTests`
Expected: exit non-zero, with `error: no test ran` or xcodebuild's own error. The gate goes through the same script, so no CI run is spent on this.

### Task 4: The ceiling from CI, and loose ends from plan 4's review

**Files:**
- Modify: `apex-ios/scripts/gate-ceiling.txt`, `apex-ios/scripts/affected-tests.sh`, `apex-ios/scripts/test-times.py`, `apex-ios/scripts/test-map.txt`, their bats tests

- [ ] **Step 1: Record the ceiling again**

Take the test time from Task 3's first green gate run in CI. The ceiling is twice that, rounded up to the next 10 s. Rewrite the file's comment: the date, the run's URL, the measurement, the rule. If the number is the same as today's, still rewrite the comment: the file must say it came from CI.

- [ ] **Step 2: Three small fixes, each with a test that fails first**

```
affected.bats (add)
  @test "a changed path with a non-ASCII name is matched by its rule"
    # a tracked file "design/Demo · Ended.html" changes -> nothing runs (design/ is NONE), not ALL.
    # Fix: git -c core.quotePath=false on the two git calls that list paths.
test-times.bats (add)
  @test "a ceiling that is not a positive number fails"
    # 0, -5, nan and inf each: exit 1, "error: … must hold one number" (no traceback)
test-map.txt
  .swiftlint.yml, .swift-format, .periphery.yml and .gitignore to NONE: none of them is read by the simulator build.
  affected.bats "check-map passes on the committed map" still passes.
```

Run: `make -C apex-ios test-scripts`
Expected: 77 pass.

- [ ] **Step 3: Commit and push**

```bash
git add apex-ios && git commit -m "feat(ios): the gate's ceiling recorded from CI; three fixes from plan 4's review"
git push
```

Expected in CI: the gate's report shows the new ceiling and a share under 80%.

### Task 5: Rules, numbers, then ship

**Files:**
- Modify: `apex-ios/AGENTS.md`, `apex-ios/CLAUDE.md`

- [ ] **Step 1: Update the rules files**

`AGENTS.md`, stating only what is true when this merges:

- **Map:** `scripts/ci/`, and `/.github/workflows/ios.yml` as "CI: the checks job and the gate".
- **Commands:** `gate` takes `ENFORCE=1` and `MAIN_RESULTS=`; `boot` waits until the simulator has booted. Replace "The simulator tests do not run in CI yet (plan 5)" with what CI runs and when.
- **Where tests go:** the table gains CI's rows with the measured times: a pull request runs `checks` and `gate`; a push to `main` runs `checks`, and `gate` only when no run passed it on the same files.
- **Keeping it fast:** the ceiling is CI's number and CI enforces it; the report shows the change against `main`; what to do over 80% and over the ceiling.
- **Merging:** "every CI check is green" now names both jobs; a pull request whose `gate` job did not run is not green.

`CLAUDE.md`: "Where we are" becomes "The foundation is done (plans 1 to 5). Product segments follow `apex-ios/docs/roadmap.md`."

Verify: `grep -c '—' apex-ios/AGENTS.md apex-ios/CLAUDE.md` prints 0 twice. Commit: `docs(ios): what CI runs, and that the foundation is done`.

- [ ] **Step 2: Evidence from `ios-verifier`**

One agent, the make targets only: `fast`, `build`, `ci-checks`, `gate`, each PASS or FAIL with wall times; the Mac, bats and fixture counts; the gate's report copied whole; whether `git status --short` is clean afterwards.

- [ ] **Step 3: Review**

One fresh reviewer agent on the most capable model reads the branch diff against this plan and the spec sections named at the top. Give it the Review Focus list verbatim. Fix what it finds, each fix with a test that failed first.

- [ ] **Step 4: Mark the pull request ready and write its hand-off**

The hand-off lists: what CI now runs and when; `fast`, `ci-checks`, CI `checks` and CI `gate` times before and after, with each job's split; the gate's report from CI copied whole; the ceiling and the run it was recorded from; whether the boot-alongside build was needed; anything not verified, plainly. Two things cannot be verified before the merge and must be said: the skip on `main` (it first runs on this pull request's own merge) and the change against `main` (it first has a number on the next pull request).

- [ ] **Step 5: Merge on green, then watch `main`**

Wait for both jobs on the last commit with `gh run watch <id> --exit-status`. Then `gh pr merge --merge --delete-branch`, `git checkout main && git pull`, delete `docs/ios-ci-gate-plan` locally and on the remote.
Then find the push run on `main` (`gh run list --branch main --limit 3`).
Expected: `plan` says "same files as run <id>, which passed the gate", `gate` is skipped, `checks` is green. If the gate ran instead, read `plan`'s log: a pull request that was behind `main` is the honest reason; anything else is a bug in `gate-run.sh` to fix that day.

- [ ] **Step 6: Hand off**

Follow `docs/superpowers/handoff.md`. The foundation is done: the next session writes `apex-ios/docs/roadmap.md`, the ordered list of product segments, from `apex-ios/design/export/inventory.md`.
