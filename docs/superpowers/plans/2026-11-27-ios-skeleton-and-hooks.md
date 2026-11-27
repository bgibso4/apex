# iOS Skeleton and Hooks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `apex-ios/`: a native app that launches to an empty screen, Mac tests that run in seconds, strict lint, the agent hooks that keep those tests green, and a CI job that checks all of it.

**Architecture:** Filing-cabinet's shape, ported and cut down. One local Swift package, `ApexKit`, holds all logic; the app target is an entry point. An XcodeGen `project.yml` generates the project, and `make -C apex-ios <target>` is the only entry point. The hook scripts live in `apex-ios/scripts/hooks/` and are wired from the root `.claude/settings.json`; every one of them does nothing for work outside `apex-ios/`.

**Tech Stack:** Xcode 27.2, Swift 6.4 (Swift 6 language mode), XcodeGen 2.49, Swift Testing, SwiftLint 0.65.1, swift-format, Periphery 3.8, bats, jq, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-27-ios-agentic-foundations-design.html` (sections "The iOS project" and "Workflow"; build-order steps 2 and 3). This is plan 2 of 5. Plan 3 (design import, tokens, `make mocks`), plan 4 (the first screen with `affected`, `retest`, `gate`, the time report and the ceiling) and plan 5 (the simulator gate in CI) are each written when the one before has merged.

**Template:** `~/projects/filing-cabinet`. Where a task says "port", copy the named file and make only the listed changes. Read the source file before writing; do not rewrite it from memory.

## Global Constraints

- Everything this plan creates is under `apex-ios/`, except: `.claude/settings.json`, `.github/workflows/ios.yml`, `.github/actions/xcode-setup/action.yml`, two edits to the root `CLAUDE.md` and `.gitignore`.
- No file under `apex-rn/` or `workers/` changes.
- iOS 27.0 minimum. iPhone only, portrait only, dark only, English only. No `#available` branches.
- No accessibility work: no VoiceOver labels, no Reduce Motion paths, no Dynamic Type handling, no audits.
- Bundle ID `com.cadre.apex`. Development team `W6S6K84XVM`. Logger subsystem `com.cadre.apex`.
- Pinned simulator: an iPhone 17 on iOS 27.0, one per checkout.
- Swift 6 language mode with `NonisolatedNonsendingByDefault` and `InferIsolatedConformances`. Banned: `Task.detached`, `@unchecked Sendable`, disabling concurrency checking.
- A module exists only once it has code. This plan creates `Core` and `Screens`. `ScreenModels` and `TestSupport` arrive in plan 4.
- No third-party Swift package in this plan, so no `Package.resolved` handling. It arrives with swift-snapshot-testing in plan 4.
- No string catalogs. English literals in views.
- Left out of the port for good: `AuditTests/`, the `ax5` and `light` snapshot variants, `-ReduceMotion`, `nightly.yml`, `audit-report.sh`, the smoke list, TelemetryDeck, the eval and device-perf targets, the Controls extension, the Intents.
- From the root `.claude/` folder only `settings.json` is committed.
- No em dashes in new prose; middots as separators.
- Lint config, hook config and test tolerances are created here as the approved design describes. After this plan merges, changing them needs Ben's OK.
- Pushing, opening the pull request and merging on green CI are approved for this effort (Ben, 2026-11-27). Merge with a merge commit and delete the branch.

## Review Focus

1. **A session that only touches `apex-rn/`.** No hook may run `make fast`, format a file, or block anything, even in a checkout with no record of a green run. Pinned by Task 5 (bats: "a branch with no change under apex-ios never runs Fast").
2. **A checkout of an older branch that has no `apex-ios/`.** `make setup` installs a git pre-commit wrapper in the shared hooks folder, which every branch and worktree uses. On a branch without the script the wrapper must exit 0. Pinned by Task 6 (bats: "the wrapper passes when the script is missing").
3. **Two worktrees at once.** Each gets its own simulator and build folder, and the stop gate's lock must not make one worktree wait for the other. Pinned by Task 5 (bats: "gates in two checkouts do not share a lock") and Task 1 step 6.
4. **A stray UI import in a Mac module.** A new module must be Mac-buildable by default, without anyone remembering to add it to a list. Pinned by Task 3 (lint fixtures) and Task 7 (the Mac slice in CI).
5. **A Stop hook that errors.** An internal error in the gate must block loudly, and a missing `jq` must not trap every session. Pinned by Task 5 (the ported bats tests for both).

## File Structure

```
apex-ios/
  AGENTS.md                      the single copy of the iOS rules
  CLAUDE.md                      @AGENTS.md plus Claude-only notes
  Makefile                       the only entry point
  project.yml                    XcodeGen source of the generated Apex.xcodeproj
  Signing.xcconfig               team and bundle ID
  .gitignore .swiftlint.yml .swift-format .periphery.yml
  App/ApexApp.swift              @main: reads launch options, shows RootScreen
  Packages/ApexKit/Package.swift
    Sources/Core/Launch/LaunchOptions.swift
    Sources/Screens/RootScreen.swift
    Tests/CoreTests/LaunchOptionsTests.swift
  scripts/
    pre-commit                   lint, only when apex-ios files are staged
    test-lint-rules.sh           fixture tests for the custom lint rules
    lint-fixtures/  lint-negatives/
    hooks/                       stop-gate.sh swift-fingerprint.sh format-on-edit.sh
                                 guard-generated.sh guard-hook-bypass.sh
    hooks/tests/hooks.bats
  docs/                          empty until the first product segment (not created here)
.claude/settings.json            hook wiring
.github/workflows/ios.yml        the checks job
.github/actions/xcode-setup/action.yml
```

---

### Task 1: The package, the project and the Mac loop

**Files:**
- Create: `apex-ios/Packages/ApexKit/Package.swift`, `apex-ios/Packages/ApexKit/Sources/Core/Launch/LaunchOptions.swift`, `apex-ios/Packages/ApexKit/Tests/CoreTests/LaunchOptionsTests.swift`
- Create: `apex-ios/project.yml`, `apex-ios/Makefile`, `apex-ios/Signing.xcconfig`, `apex-ios/.gitignore`

**Interfaces:**
- Produces: `public struct LaunchOptions: Sendable, Equatable` in module `Core`, with `public private(set) var isUITest: Bool` and `public init(arguments: [String], isDebugBuild: Bool)`.
- Produces: make targets `setup`, `sim`, `generate`, `fast`; variables `PROJECT := Apex.xcodeproj`, `DERIVED := $(CURDIR)/.build/DerivedData`, `SIM_DEVICE`, `SIM_MODEL := iPhone 17`, `SIM_OS ?= 27.0`, `SIM_DEST`, `BEAUTIFY := xcbeautify`.
- Produces: scheme `Fast` (macOS, package tests only) and the `FastTests` aggregate target. The app target and its scheme arrive in Task 2, when they have sources.

- [x] **Step 1: Branch**

```bash
git checkout main && git pull && git checkout -b feat/ios-skeleton docs/ios-skeleton-plan
```

The plan's own branch is the base, so one pull request carries the plan, the hand-off note and the work.

- [x] **Step 2: Write `Package.swift`, `project.yml`, `Signing.xcconfig`, `.gitignore` and the Makefile's first targets**

`Package.swift`: port `Packages/FilingCabinetKit/Package.swift`. Name `ApexKit`, `// swift-tools-version: 6.4`, `platforms: [.iOS(.v27), .macOS(.v27)]`, the same `moduleSettings`. No `defaultLocalization`. Products and targets, and nothing else:

| Target | Depends on | Extra settings |
|---|---|---|
| `Core` | nothing | none |
| `CoreTests` (test) | `Core` | none |

`project.yml`: port filing-cabinet's. Keep `options` (`bundleIdPrefix: com.cadre`, `deploymentTarget.iOS: "27.0"`, `createIntermediateGroups: true`), `configFiles`, the base `settings` (`SWIFT_VERSION: "6"`, `SWIFT_APPROACHABLE_CONCURRENCY: YES`, `ENABLE_USER_SCRIPT_SANDBOXING: YES`, `MARKETING_VERSION: "0.1.0"`, `CURRENT_PROJECT_VERSION: 1`), the `FastTests` aggregate target, and the `Fast` scheme. Differences:

- `name: Apex`. One package, `ApexKit` at `Packages/ApexKit`. No `SnapshotTesting`, no `TelemetryDeck`.
- No application target and no test targets yet: XcodeGen refuses a target whose source folder is missing.
- Scheme `Fast`: builds `FastTests`, tests `ApexKit/CoreTests`.

`Signing.xcconfig`: port, with `DEVELOPMENT_TEAM = W6S6K84XVM` and `APP_BUNDLE_ID = com.cadre.apex`.

`apex-ios/.gitignore`:

```
# Generated
*.xcodeproj
.build/
DerivedData/
*.xcresult

# Local only
Signing.local.xcconfig
xcuserdata/
.swiftpm/

# Local compare and screenshot output
build/
```

`Makefile`: port the head of filing-cabinet's (the simulator variables, `setup`, `sim`, `generate`, `fast`). Differences:

- `CHECKOUT := $(notdir $(shell git rev-parse --show-toplevel))` and `SIM_DEVICE ?= APEX $(CHECKOUT) iPhone 17`, so each checkout and worktree has its own simulator, created on demand by `sim`.
- `setup` checks the same six tools (`xcodegen swiftlint xcbeautify jq bats periphery`), then runs `sim generate`. The git hook install is added in Task 6.
- `generate` is `xcodegen generate --quiet` only. No token generator (plan 3), no `Package.resolved` copy, no `XCB_FLAGS`.
- `fast` runs the `Fast` scheme on `platform=macOS`. The fingerprint record is added in Task 5.

- [x] **Step 3: Write the failing test**

`Tests/CoreTests/LaunchOptionsTests.swift`, Swift Testing:

```swift
import Core
import Testing

struct LaunchOptionsTests {
    @Test func uiTestFlagIsReadInADebugBuild() {
        #expect(LaunchOptions(arguments: ["Apex", "-UITest"], isDebugBuild: true).isUITest)
    }

    @Test func aReleaseBuildIgnoresEveryFlag() {
        #expect(!LaunchOptions(arguments: ["Apex", "-UITest"], isDebugBuild: false).isUITest)
    }

    @Test func noFlagsMeansDefaults() {
        #expect(!LaunchOptions(arguments: ["Apex"], isDebugBuild: true).isUITest)
    }

    @Test func unknownFlagsAreIgnored() {
        #expect(!LaunchOptions(arguments: ["Apex", "-NSDocumentRevisionsDebugMode", "YES"], isDebugBuild: true).isUITest)
    }
}
```

- [x] **Step 4: Run it and watch it fail**

Run: `make -C apex-ios setup && make -C apex-ios fast`
Expected: `setup` creates the simulator and generates `Apex.xcodeproj`; `fast` fails to compile with "cannot find 'LaunchOptions' in scope".

- [x] **Step 5: Implement `LaunchOptions`**

`Sources/Core/Launch/LaunchOptions.swift`, the signature in Interfaces. `-UITest` is the only flag. Doc comment on the type: launch flags are parsed only in Debug; unknown flags are ignored.

- [x] **Step 6: Run it and watch it pass, and check the per-checkout simulator**

```bash
make -C apex-ios fast
xcrun simctl list devices 'iOS 27.0' | grep -F "APEX $(basename "$(git rev-parse --show-toplevel)") iPhone 17"
git status --short
```

Expected: 4 tests pass with no simulator booted; the grep prints one device; `git status` shows no `Apex.xcodeproj` and no `.build/`. Note the wall time of a warm `make fast` for the hand-off.

- [x] **Step 7: Commit**

```bash
git add apex-ios && git commit -m "feat(ios): ApexKit package, generated project and the Mac test loop"
```

### Task 2: An app that launches to an empty screen

**Files:**
- Create: `apex-ios/Packages/ApexKit/Sources/Screens/RootScreen.swift`, `apex-ios/App/ApexApp.swift`
- Modify: `apex-ios/Makefile`, `apex-ios/project.yml`, `apex-ios/Packages/ApexKit/Package.swift`

**Interfaces:**
- Consumes: `LaunchOptions(arguments:isDebugBuild:)` and the Makefile variables from Task 1.
- Produces: `public struct RootScreen: View` with `public init()` in module `Screens`. Plan 4 replaces its body with the tab bar.
- Produces: package target and product `Screens` (depends on `Core`, with `.defaultIsolation(MainActor.self)`); application target `Apex`; scheme `Apex`.
- Produces: make targets `build`, `run`, `device`; variables `BUNDLE_ID := com.cadre.apex`, `APP_PRODUCT`, `DEVICE_PRODUCT`, `DEVICE ?= iPhone`.

- [x] **Step 1: Add the app target, its scheme and the make targets**

`Package.swift`: add the `Screens` library product and target.

`project.yml`: add target `Apex` (application, iOS, sources `App`), depending on package products `Core` and `Screens`. Its settings: `PRODUCT_BUNDLE_IDENTIFIER: $(APP_BUNDLE_ID)`, `PRODUCT_NAME: Apex`, `GENERATE_INFOPLIST_FILE: YES`, `INFOPLIST_KEY_CFBundleDisplayName: APEX`, `INFOPLIST_KEY_UILaunchScreen_Generation: YES`, `INFOPLIST_KEY_UISupportedInterfaceOrientations: UIInterfaceOrientationPortrait`, `INFOPLIST_KEY_UIUserInterfaceStyle: Dark`, `SWIFT_DEFAULT_ACTOR_ISOLATION: MainActor`, `TARGETED_DEVICE_FAMILY: "1"`, `CODE_SIGN_STYLE: Automatic`. No `Info.plist` file until a key needs one. Add scheme `Apex`: builds `Apex`, tests `ApexKit/CoreTests`.

Makefile: port `build`, `run` and `device`. `run` boots this checkout's simulator, installs and launches; no `STATE=` yet (plan 4) and no `run-fake`. `device` is ported as written, without `READER_ARGS`. No `build-fingerprint.sh` call (plan 4).

- [x] **Step 2: Run the build and watch it fail**

Run: `make -C apex-ios build`
Expected: fails at `generate` or at compile, because `App/` and `Sources/Screens/` have no sources yet.

- [x] **Step 3: Write `RootScreen` and `ApexApp`**

- `RootScreen`: an empty screen. Body is `Color.black.ignoresSafeArea()`. One comment: the field colour comes from the generated tokens in plan 3.
- `ApexApp`: `@main`, a `WindowGroup` showing `RootScreen()` with `.preferredColorScheme(.dark)`. In `init`, build `LaunchOptions(arguments: CommandLine.arguments, isDebugBuild:)` with the flag from `#if DEBUG`, and when `isUITest` call `UIView.setAnimationsEnabled(false)`.

- [x] **Step 4: Build, launch and look at it**

```bash
make -C apex-ios build
make -C apex-ios run
mkdir -p apex-ios/build && xcrun simctl io "APEX $(basename "$(git rev-parse --show-toplevel)") iPhone 17" screenshot apex-ios/build/launch.png
```

Expected: both succeed. Open `apex-ios/build/launch.png` with the Read tool: a black screen with the status bar, no crash dialog. List the path in the hand-off.

- [x] **Step 5: Prove the device build compiles**

Run: `xcodebuild build -project apex-ios/Apex.xcodeproj -scheme Apex -destination 'generic/platform=iOS' -derivedDataPath apex-ios/.build/DerivedData CODE_SIGNING_ALLOWED=NO | xcbeautify`
Expected: build succeeds. `make device` itself needs Ben's phone and stays unverified; say so in the hand-off.

- [x] **Step 6: Commit**

```bash
git add apex-ios && git commit -m "feat(ios): app target that launches to an empty screen"
```

### Task 3: Lint, format and dead code

**Files:**
- Create: `apex-ios/.swiftlint.yml`, `apex-ios/.swift-format`, `apex-ios/.periphery.yml`, `apex-ios/scripts/test-lint-rules.sh`
- Create: `apex-ios/scripts/lint-fixtures/{no_print,try_optional_needs_reason,no_shared_in_package,disable_needs_reason,no_ui_imports_in_mac_modules}.swift`, `apex-ios/scripts/lint-negatives/{no_print_member,no_ui_imports_in_mac_modules_in_screens,no_ui_imports_in_mac_modules_in_screens_tests}.swift`
- Modify: `apex-ios/Makefile`

**Interfaces:**
- Consumes: the Makefile from Tasks 1 and 2.
- Produces: make targets `lint`, `format`, `test-lint`, `unused`, `unused-run`; variable `SWIFT_DIRS := App Packages/ApexKit/Sources Packages/ApexKit/Tests`.

- [x] **Step 1: Write the fixtures and the fixture runner first**

Port `scripts/test-lint-rules.sh` and the fixtures for the five rules kept. Changes to the runner: the rule list is the five above; a fixture named `*_in_screens` is linted at `Packages/ApexKit/Sources/Screens`, `*_in_screens_tests` at `Packages/ApexKit/Tests/ScreensTests`, any other `no_ui_imports_in_mac_modules*` fixture at `Packages/ApexKit/Sources/NewModule` (a module name no list mentions), the rest at `Packages/Fixture/Sources`.

- [x] **Step 2: Run it and watch it fail**

Run: `apex-ios/scripts/test-lint-rules.sh`
Expected: every positive fixture prints FAIL, since no config exists.

- [x] **Step 3: Write the lint and format config**

- `.swift-format`: port unchanged.
- `.swiftlint.yml`: port. `excluded` keeps `**/Generated/**`, `**/.build`, `scripts/lint-fixtures`, `scripts/lint-negatives`. Same `opt_in_rules` and `disabled_rules`. Custom rules: keep `no_print` (message names subsystem `com.cadre.apex`), `try_optional_needs_reason`, `no_shared_in_package`, `disable_needs_reason`. Drop `localized_needs_bundle` and `analytics_token_enum_only`.
- `no_ui_imports_in_mac_modules`: regex `^import (SwiftUI|UIKit)\b`, applied to every path under `Packages/ApexKit/Sources/` and `Packages/ApexKit/Tests/` except `Sources/Screens/` and `Tests/ScreensTests/`. Express the exception so that a new module is covered without being listed (a negative lookahead in `included`, or `excluded`). Message: "Only Screens may import SwiftUI or UIKit: every other module builds for macOS so its tests run in make fast."
- `.periphery.yml`: port with `project: Apex.xcodeproj`, `schemes: [Apex]`. Drop `retain_unused_imported_modules`.
- Makefile: port `lint`, `format`, `test-lint`, `unused` and `unused-run` (without `$(XCB_FLAGS)`).

- [x] **Step 4: Run everything and watch it pass**

```bash
make -C apex-ios test-lint
make -C apex-ios format && git diff --stat
make -C apex-ios lint
make -C apex-ios unused
```

Expected: every fixture prints PASS, including the three negatives; `format` changes nothing after a second run; `lint` and `unused` exit 0 with no findings. If Periphery reports a declaration, remove the declaration or make it used. Never add a file-wide or config-wide exemption.

- [x] **Step 5: Commit**

```bash
git add apex-ios && git commit -m "feat(ios): strict lint, format and dead-code checks with rule fixtures"
```

### Task 4: The rules files

**Files:**
- Create: `apex-ios/AGENTS.md`, `apex-ios/CLAUDE.md`
- Modify: `CLAUDE.md` (root, the `apex-ios/` row), `.gitignore` (root)

**Interfaces:**
- Consumes: the make targets of Tasks 1 to 3 and, by name, those of Tasks 5 to 7 (`test-hooks`, `ci-checks`).
- Produces: `apex-ios/AGENTS.md`, which every later plan and segment reads first and extends.

- [x] **Step 1: Write `apex-ios/AGENTS.md`**

Port filing-cabinet's `AGENTS.md` section by section. State only what is true when this plan merges; later plans add their own rows.

- **Title and one paragraph:** APEX native: a personal strength training app for iPhone, iOS 27 minimum, SwiftUI. One user. Run every command as `make -C apex-ios <target>` from the repo root.
- **Map:** the File Structure block above, one line each.
- **Commands:** a table of `setup generate build fast lint format unused test-lint test-hooks ci-checks run device`, each with what it does. One line under it: `affected`, `retest`, `gate`, `mocks`, `compare`, `frames` and `design-import` arrive in plans 3 and 4.
- **Module dependencies:** `Core` · nothing. `Screens` · `Core`. One line: `ScreenModels` and `TestSupport` arrive with the first screen; `Training` and `Store` with the plans that need them.
- **Launch flags:** `-UITest` · no animations. Debug builds only.
- **Import line:** only `Screens` imports SwiftUI or UIKit; everything else builds for macOS; the lint rule and CI's Mac slice both catch a stray import.
- **Where tests go:** the three layers from the spec's "Tests" section in three lines (Mac tests for behaviour, pictures for appearance, journeys for wiring), and the rule that a behaviour is tested through its screen model on the Mac, never by a journey.
- **Definition of done:** a task is done when the app builds, `make fast` passes, lint and format are clean, and for anything visual the hand-off lists the image paths the agent opened. A branch is done when CI is green on its pull request and the second agent's review has passed. Anything not checked is stated plainly in the hand-off.
- **Merging:** the three conditions from the spec's "When an agent may merge", then "What still waits for you", verbatim in meaning.
- **When the mock doesn't cover it:** build what the design rules imply, open a GitHub issue labelled `needs-ben` with the default taken, keep going.
- **Hard rules:** port the list, with these changes. Keep: Ben's OK for lint config, hook config and tolerances; never hand-edit generated files; never bypass git hooks (same wording); unit tests for new logic and a regression test for each bug fix; Swift 6 and the banned constructs; `package` access between modules and `public` only for what the app or tests use; `os.Logger` with subsystem `com.cadre.apex`, never `print()`; `try?` only with a reason; one primary type per file, inject collaborators, no singletons, protocols only at real seams; third-party packages pinned with `exact:`; Periphery suppressions per declaration. Change: "iPhone, portrait, dark only, English only. No `#available` branches." Add: "No accessibility work: no VoiceOver labels, Reduce Motion paths, Dynamic Type handling or audits. An accessibility identifier is added only where a journey needs one." Add: "One pull request touches one side. Nothing under `apex-rn/` changes in an iOS pull request." Add: "User-facing copy uses middots and never em dashes." Drop: the New York font rule, localization, the Scan button, snapshot references (plan 4 adds its own), tokens (plan 3 adds its own), HEIC, personal documents.
- **Read next:** the design doc path, and `docs/superpowers/handoff.md`.

- [x] **Step 2: Write `apex-ios/CLAUDE.md`**

First line `@AGENTS.md`. Then, ported from filing-cabinet's `CLAUDE.md`:

- **Where we are:** "Foundation, plan 2 of 5 merged: the skeleton and the hooks. No product screen exists yet."
- **Hooks:** the four bullets describing the stop gate, format on edit and the two guards, with script names, the green record's path (`apex-ios/.build/apex-fast-green`), the three-attempt hand-back, and "a green stop gate means the Mac tests pass; it does not compile `Screens` or the app: run `make build`". Add: "No hook acts on work outside `apex-ios/`, except the guard against bypassing git hooks, which applies to every commit." Hook behaviour is covered by `make test-hooks`. Changing hook config needs Ben's OK.
- **Verification:** use the `ios-verifier` agent for build and test evidence; ask it for the make targets, not raw `xcodebuild test`.
- **Workspace:** personal agent tooling comes from arsenal and is never committed; the root `.claude/settings.json` is committed by approved exception.

- [x] **Step 3: Update the root files**

Root `CLAUDE.md`: the `apex-ios/` row's "Read first" cell becomes `` `apex-ios/AGENTS.md` ``. No other change.

Root `.gitignore`: append

```

# Agent tooling: only .claude/settings.json is tracked
.claude/*
!.claude/settings.json
skills-lock.json
.herdr/
```

- [x] **Step 4: Verify**

```bash
git check-ignore -q .claude/launch.json && git check-ignore -q .claude/skills/x && git check-ignore -q .claude/settings.local.json && echo "local tooling ignored"
git check-ignore -q .claude/settings.json; echo "settings.json ignored? exit $?"
grep -c '—' apex-ios/AGENTS.md apex-ios/CLAUDE.md
for t in setup generate build fast lint format unused test-lint test-hooks ci-checks run device; do grep -q "make $t\|\`$t\`" apex-ios/AGENTS.md || echo "missing $t"; done
```

Expected: "local tooling ignored"; exit 1 for `settings.json`; both counts 0; no "missing" line.

- [x] **Step 5: Commit**

```bash
git add apex-ios/AGENTS.md apex-ios/CLAUDE.md CLAUDE.md .gitignore
git commit -m "docs(ios): AGENTS.md and CLAUDE.md for apex-ios; root pointer and ignore rules"
```

### Task 5: The hook scripts

**Files:**
- Create: `apex-ios/scripts/hooks/{stop-gate.sh,swift-fingerprint.sh,format-on-edit.sh,guard-generated.sh,guard-hook-bypass.sh}`, `apex-ios/scripts/hooks/tests/hooks.bats`
- Modify: `apex-ios/Makefile`

**Interfaces:**
- Consumes: `make fast` from Task 1.
- Produces: the five scripts, each reading Claude Code's hook JSON on stdin. Environment: `CLAUDE_PROJECT_DIR` is the repo root; `APEX_FAST_CMD` (default `make fast`) and `APEX_FINGERPRINT_CMD` override the gate's commands in tests.
- Produces: `swift-fingerprint.sh [print|current|record FP]`, with the green record at `apex-ios/.build/apex-fast-green`.
- Produces: make target `test-hooks`; `fast` now records the fingerprint on success.

- [x] **Step 1: Write the bats tests first**

Port `scripts/hooks/tests/hooks.bats` (28 tests). Changes to the setup: the temporary repo gets an `apex-ios/` folder holding `A.swift` and a `.gitignore` with `.build/`; it has one commit on `main` so a merge base exists; `APEX_FAST_CMD` replaces `FC_FAST_CMD`. The ported test "a committed change that was never verified still runs Fast" makes its commit on a branch off `main`, so the merge-base check sees it. Paths in the guard tests become `/r/apex-ios/Apex.xcodeproj/project.pbxproj` and `/r/apex-ios/Packages/ApexKit/Sources/Screens/Generated/Tokens.swift`. Drop the string-catalog half of the last test; keep `design/tokens.json`.

Add these tests:

```
@test "a branch with no change under apex-ios never runs Fast, with no green record"
  # setup's repo, no .build/apex-fast-green; edit apex-rn/app.ts only
  # stop gate: status 0, no output, fast did not run
@test "an uncommitted Swift change under apex-ios runs Fast with no green record"
@test "on a repo with no main and no origin/main the gate treats Swift as changed"
@test "gates in two checkouts do not share a lock"
  # two temp repos; the first gate's Fast command sleeps 2 s; the second gate finishes in under 1 s
@test "format on edit ignores a Swift file outside apex-ios"
  # file /r/apex-rn/x.swift: status 0 and swift format is not called (stub swift on PATH)
@test "guard allows a Generated folder outside apex-ios"
  # /r/apex-rn/src/Generated/x.ts: status 0
@test "every hook passes when the checkout has no apex-ios folder"
  # CLAUDE_PROJECT_DIR is a repo without apex-ios: stop gate, format and guard-generated exit 0
```

- [x] **Step 2: Run them and watch them fail**

Run: `bats apex-ios/scripts/hooks/tests`
Expected: every test fails, the scripts do not exist.

- [x] **Step 3: Port the five scripts**

Each is a port of the file with the same name. Changes:

- **All:** `fc-` becomes `apex-` in temp-file, counter and lock names; `FC_` becomes `APEX_` in environment names. A script whose `${CLAUDE_PROJECT_DIR:-$PWD}/apex-ios` does not exist exits 0 before anything else.
- **`swift-fingerprint.sh`:** runs with `apex-ios` as its working folder, so the hashed list is `git ls-files -co --exclude-standard -z -- '*.swift' design/tokens.json` under `apex-ios/` only. Green record at `.build/apex-fast-green` inside `apex-ios/`.
- **`stop-gate.sh`:** changes to `apex-ios/` after reading stdin. Before the fingerprint check, a new early exit: when nothing the fingerprint covers differs between the working tree (untracked files included) and the merge base with `origin/main` (or `main` when there is no remote), exit 0 without running anything. When neither ref exists, carry on to the fingerprint check. The lock folder's name ends in a checksum of the checkout's absolute path, so two checkouts never wait on each other. The block and hand-back messages say `make -C apex-ios fast`.
- **`format-on-edit.sh`:** formats only a file whose path matches `*/apex-ios/*.swift`.
- **`guard-generated.sh`:** blocks `*/apex-ios/*.xcodeproj/*` and `*/apex-ios/*/Generated/*`. The message names `project.yml`, the tokens source and `make -C apex-ios generate`.
- **`guard-hook-bypass.sh`:** unchanged. It applies to every commit in the repo.

Makefile: add `test-hooks` (`bats scripts/hooks/tests`), and change `fast` to take the fingerprint before the run and record it after a pass, as filing-cabinet's does.

- [x] **Step 4: Run them and watch them pass**

```bash
make -C apex-ios test-hooks
make -C apex-ios fast && apex-ios/scripts/hooks/swift-fingerprint.sh current && echo "green recorded"
```

Expected: 35 tests pass; "green recorded" prints.

- [x] **Step 5: Commit**

```bash
git add apex-ios && git commit -m "feat(ios): stop gate, format on edit and guards, with bats tests"
```

### Task 6: Wire the hooks

**Files:**
- Create: `.claude/settings.json`, `apex-ios/scripts/pre-commit`
- Modify: `apex-ios/Makefile` (`setup`), `apex-ios/scripts/hooks/tests/hooks.bats`

**Interfaces:**
- Consumes: the five scripts and `make lint`.
- Produces: the committed hook wiring. From the next session on, every agent in this repo runs under it.

- [x] **Step 1: Write the failing tests**

Add to `hooks.bats`:

```
@test "pre-commit runs lint when a file under apex-ios is staged"
  # stub make on PATH that records its arguments; stage apex-ios/A.swift; run scripts/pre-commit: make was called with lint
@test "pre-commit does nothing when only other files are staged"
  # stage apex-rn/x.ts: status 0, make not called
@test "the wrapper passes when the script is missing"
  # run the exact wrapper text make setup writes, in a repo with no apex-ios/scripts/pre-commit: status 0
@test "settings.json wires every hook script and each one exists"
  # jq every .hooks[][].hooks[].command out of the real .claude/settings.json; each names a file under apex-ios/scripts/hooks that exists and is executable
```

Run: `make -C apex-ios test-hooks`. Expected: the four new tests fail.

- [x] **Step 2: Write the wiring**

- `.claude/settings.json`: port filing-cabinet's. Same events, matchers and timeouts (`PreToolUse` Edit|Write|MultiEdit and Bash, `PostToolUse` Edit|Write|MultiEdit, `Stop` and `SubagentStop` with `timeout: 1200`). Each command is `"$CLAUDE_PROJECT_DIR"/apex-ios/scripts/hooks/<script>`. Nothing else in the file.
- `apex-ios/scripts/pre-commit`: from the repo root, exit 0 unless `git diff --cached --name-only -- apex-ios` prints something; then `make --no-print-directory -C apex-ios lint`. No snapshot listing (plan 4).
- `setup` in the Makefile: install the wrapper as filing-cabinet does, into the shared hooks folder. The wrapper's text: find `"$(git rev-parse --show-toplevel)/apex-ios/scripts/pre-commit"`, exit 0 when it is not an executable file, else `exec` it.

- [x] **Step 3: Run the tests and install**

```bash
make -C apex-ios test-hooks
make -C apex-ios setup
git add .claude/settings.json apex-ios && git commit -m "feat(ios): wire the hooks and the pre-commit lint"
```

Expected: 39 tests pass; the commit runs the pre-commit hook, which runs lint (files under `apex-ios/` are staged) and passes.

- [x] **Step 4: Prove the pre-commit hook blocks**

Add `let x = try? JSONSerialization.data(withJSONObject: [])` with no comment to `LaunchOptions.swift`, stage it, run `git commit -m probe`. Expected: the commit is refused with `try_optional_needs_reason`. Then `git restore --staged --worktree apex-ios/Packages/ApexKit/Sources/Core/Launch/LaunchOptions.swift`.

- [x] **Step 5: Note what is not proved**

Claude Code reads hook settings when a session starts, so this session may never run under the new hooks. The bats suite is the proof. If the stop gate does fire in this session, say what it did in the hand-off; if it does not, say "not seen live" there.

### Task 7: The checks job in CI

**Files:**
- Create: `.github/workflows/ios.yml`, `.github/actions/xcode-setup/action.yml`
- Modify: `apex-ios/Makefile`

**Interfaces:**
- Consumes: `lint`, `test-hooks`, `test-lint`, `unused-run`, the `Fast` scheme.
- Produces: make target `ci-checks`. Workflow `iOS` with one job named `checks`. Plan 5 adds the simulator gate, the time ceiling and the skip for a merge that already passed.

Why now and not in plan 5: with the path filter on `rn.yml`, a pull request that touches no React Native file gets no checks at all, and "merge when CI is green" would mean nothing until plan 5. The checks job is the cheap half of filing-cabinet's CI; the simulator half stays in plan 5.

- [x] **Step 1: Add `ci-checks` to the Makefile**

Port `ci-checks`, cut down to: `generate`, then `lint test-hooks test-lint`, then `xcodebuild test` of the `Fast` scheme on `platform=macOS` (the Mac slice: it compiles every Mac module and runs its tests, so a stray UI import fails here), then `unused-run`. No generated-file drift check (plan 3), no changed-snapshots listing, no `check-resolved`.

Run: `make -C apex-ios ci-checks`. Expected: exit 0. Note the wall time.

- [x] **Step 2: Write the workflow**

`.github/actions/xcode-setup/action.yml`: port. Keep "Select Xcode 27", "Install tools" and the SwiftLint 0.65.1 version check. Keep "Cache Swift packages" with paths under `apex-ios/.build/` and key hashing `apex-ios/Packages/ApexKit/Package.swift` and `apex-ios/project.yml`. Drop the `job` input and the compilation cache step.

`.github/workflows/ios.yml`:

- `name: iOS`
- Triggers: `pull_request` (branches `main`) and `push` to `main`, each with `paths: ['apex-ios/**', '.claude/settings.json', '.github/workflows/ios.yml', '.github/actions/xcode-setup/**']`.
- `concurrency.group: ios-${{ github.ref }}`, `cancel-in-progress: true`. The prefix must differ from `rn.yml`'s `ci-`, or the two workflows cancel each other.
- `permissions: contents: read`.
- One job, id and name `checks`, `runs-on: xcode-27`, `timeout-minutes: 30`, `env: CODE_SIGNING_ALLOWED: "NO"` and `SIM_DEVICE: iPhone 17` (the image's own simulator; Periphery builds for it).
- Steps: `actions/checkout@v7` with `fetch-depth: 0`; the `xcode-setup` action; `make -C apex-ios ci-checks`.

- [x] **Step 3: Verify the file locally**

```bash
ruby -ryaml -e 'y = YAML.load_file(".github/workflows/ios.yml"); on = y["on"] || y[true]; puts y["jobs"].keys.join(","); puts on["pull_request"]["paths"].inspect; puts y["concurrency"]["group"]'
```

Expected: `checks`, the four paths, and a group starting `ios-`.

- [x] **Step 4: Commit**

```bash
git add .github apex-ios/Makefile && git commit -m "ci(ios): checks job for apex-ios (lint, hook tests, Mac tests, dead code)"
```

The real proof is the run on the pull request in Task 8. If the `xcode-27` runner label or a tool install fails there, fix the workflow on the branch; that is this task's work, not a blocker.

### Task 8: Ship

- [x] **Step 1: Evidence from `ios-verifier`**

One agent. Ask it to run, from the repo root, `make -C apex-ios fast`, `make -C apex-ios build` and `make -C apex-ios ci-checks`, and to return PASS or FAIL for each with wall times and any errors.

- [x] **Step 2: Push and open the pull request**

```bash
git push -u origin feat/ios-skeleton
gh pr create --base main --title "apex-ios: skeleton, hooks and the checks job" --body-file <the hand-off>
```

The hand-off lists: the make targets that exist, the wall times of `fast` and `ci-checks`, the image opened (`apex-ios/build/launch.png`), and what was not verified: `make device` on Ben's phone, and the stop gate seen live (unless it was).

- [x] **Step 3: Review**

One fresh reviewer agent reads the branch diff against this plan and the spec sections named at the top. Fix what it finds; re-run the affected verification steps.

- [ ] **Step 4: Merge on green**

```bash
gh pr checks --watch
gh pr merge --merge --delete-branch
```

Only when the `checks` job passed and the review passed. A pull request with no checks reported is not green: find out why the workflow did not start. Then `git checkout main && git pull`.

- [ ] **Step 5: Hand off**

Follow `docs/superpowers/handoff.md`: write plan 3, update the note, report to the lead, stop.
