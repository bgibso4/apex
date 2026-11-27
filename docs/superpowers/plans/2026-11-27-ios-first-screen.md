# iOS First Screen, End to End Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one small real screen, the tab bar and Home with no program, with the whole check loop around it: a screen model tested on the Mac, a picture, a journey, `compare`, `frames`, `affected`, `retest`, `gate`, the time report and the ceiling.

**Architecture:** Two new Mac-buildable modules. `ScreenModels` holds one observable model per screen and `AppModel`, which owns them. `TestSupport` holds `DesignedState`, the Swift side of the state catalog: each state builds the `AppModel` that shows it, and that one value drives the app (`-State`), the picture test and the preview. Two app-hosted test targets run on the simulator, pictures and journeys, always through `scripts/sim-tests.sh`, which builds once and reports test time from the result bundle against a ceiling.

**Tech Stack:** SwiftUI on iOS 27 (system `TabView`, system glass), Swift Testing for Mac tests, XCTest for simulator tests, swift-snapshot-testing pinned exact, bash and Python 3 (`-I`) scripts with bats tests, `xcresulttool`, `simctl`, `ffmpeg` (frames only).

**Spec:** `docs/superpowers/specs/2026-11-27-ios-agentic-foundations-design.html` (sections "The iOS project", "Tests", "Keeping it fast", "Mocks"; build-order step 5). This is plan 4 of 5. Plan 5 is the simulator gate in CI and the skip for a merge that already passed.

**Read first:** `apex-ios/AGENTS.md`, `docs/superpowers/handoff.md`, `apex-ios/design/README.md`. Load `principal-engineer`, and `axiom-swiftui` and `axiom-testing` before writing views and simulator tests.

**Templates** (`~/projects/filing-cabinet`, port and cut down; the hand-off note lists what to leave out): `scripts/sim-tests.sh`, `scripts/affected-tests.sh`, `scripts/test-map.txt`, `scripts/build-fingerprint.sh`, `scripts/compare-snapshot.swift`, `scripts/tests/sim-tests.bats`, `scripts/tests/affected.bats`, `SnapshotTests/SnapshotHost.swift`, `SnapshotTests/SnapshotConfig.swift`, `UITests/Support/Launch.swift`, `UITests/Support/Wait.swift`, the test targets in `project.yml`, the `Package.resolved` handling in its `Makefile`.

## Global Constraints

- Everything this plan creates is under `apex-ios/`. No file under `apex-rn/`, `workers/`, `.claude/` or `.github/` changes: the simulator tests do not run in CI until plan 5.
- Every hard rule in `apex-ios/AGENTS.md` holds. The ones this plan meets most: colours, type and animations only from the generated tokens (lint enforces it in `Screens` outside `DesignSystem/`); no bare layout number where a token exists, and a measurement with no token is a named private constant that cites its design source; no shadows; no accessibility work; an accessibility identifier only where a journey needs one; `package` access between package modules, `public` only for what the app or tests use; one primary type per file; third-party packages pinned with `exact:`.
- A value the design system names and `tokens.json` lacks is added to `tokens.json` and generated, never written in a view.
- The design that counts: `design/export/APEX README.md` (sections Color, Type, Shape and spacing, Actions, Screen header, Liquid Glass), `design/export/home-decisions.md` (the Locked table; turns 13d and 20b for this card; 37c for the header), and the demo `design/export/app/home.dc.html` in its `Ended` state. Reference image: `design/mocks/home.noProgram.png`.
- Build with the system's materials: the system `TabView` tab bar and the system glass effect. The mock's glass values describe how the mock draws it; they are not copied.
- Dark only, iPhone, portrait, English, iOS 27.0 minimum, no `#available`. No Dynamic Type.
- Behaviour is tested on the Mac through a screen model. A picture proves appearance. A journey proves wiring across the real app, and this plan adds exactly one.
- One picture per designed state. No light, no large-text variant.
- UI tests launch with `-UITest` (animations off). No test sleeps for a fixed time where it can wait for a condition.
- No lint config, hook config or tolerance changes beyond what this plan creates. The picture tolerance and the ceiling are created here, as the design's own build step; changing either later needs Ben.
- Middots in user-facing copy and in new prose; no em dashes.
- Pushing, opening the pull request and merging on green CI are approved for this effort. Merge with a merge commit, then delete the code branch and the plan branch it carried, locally and on the remote.

## Review Focus

1. **A state added to the catalog with a piece missing.** A `DesignedState` with no image in `design/mocks/`, or on a screen with no picture test class, must fail `make fast` naming the state. Pinned by Task 1 (`everyDesignedStateHasAReferenceImage`) and Task 4 (`everyScreenHasAPictureTestClass`).
2. **`make retest` after the sources changed.** It must refuse and say to rebuild; it never runs stale code and reports green. Pinned by Task 3 (bats: "retest refuses when the sources changed since the last build").
3. **A changed path no map rule matches, or a map that has drifted.** An unmatched path runs every simulator test, so a gap costs time and never coverage; a map naming a class that does not exist, or a test class missing from the map, fails the check. Pinned by Task 3 (bats: "a path no rule matches runs everything", the two `--check-map` tests).
4. **A gate run that proves nothing.** No test ran, a test failed, or one test took over 60 s: the run is never reported green. Pinned by Task 5 (bats: "a result with no tests fails", "a failed test fails the report", "a test over 60 s fails").
5. **`-State` misuse.** A Release build ignores the flag. A Debug build given an unknown name stops with a message that lists the known names; it never shows some other state under that name. Pinned by Task 1 (Core tests for the flag) and Task 2 step 6 (the unknown-name run).

## File Structure

```
apex-ios/
  Package.resolved                      pins for the app's packages (swift-snapshot-testing and what it needs)
  Packages/ApexKit/
    Sources/Core/Launch/LaunchOptions.swift      gains stateName
    Sources/ScreenModels/AppTab.swift            the four tabs
    Sources/ScreenModels/AppModel.swift          selected tab, the screen models
    Sources/ScreenModels/Home/HomeModel.swift    Home's model
    Sources/ScreenModels/Home/EndedProgram.swift
    Sources/TestSupport/DesignedState.swift      the Swift side of the state catalog
    Sources/Screens/RootScreen.swift             the tab view
    Sources/Screens/Home/HomeScreen.swift        and the no-program card beside it
    Sources/Screens/DesignSystem/                components built on the tokens: only what Home needs
    Sources/Screens/DesignSystem/Generated/Resources/   the wordmark font and logo mark, copied from design/export by make generate
    Tests/ScreenModelsTests/  Tests/TestSupportTests/
  SnapshotTests/                        ApexSnapshotTests: SnapshotHost, one <Screen>PictureTests per screen, __Snapshots__/
  UITests/                              ApexUITests: AppJourneyTests, Support/Launch.swift, Support/Wait.swift
  scripts/
    sim-tests.sh                        every simulator run: affected, retest, gate
    affected-tests.sh  test-map.txt     which test classes a changed path can affect
    build-fingerprint.sh                whether the last simulator build still matches the sources
    test-times.py  gate-ceiling.txt     the time report and the ceiling it checks
    compare-snapshot.swift              app picture beside mock
    frames.sh                           a contact sheet of frames from a simulator recording
    tests/                              bats tests and fixtures for the scripts above
```

Module dependencies after this plan: `Core` nothing · `ScreenModels` nothing (or `Core` once it uses it) · `TestSupport` `ScreenModels` · `Screens` `Core`, `ScreenModels`, `TestSupport`. `Screens` takes `TestSupport` for its previews; the fixtures are small and dead-stripped from a Release build where nothing names them. Filing-cabinet keeps its test support out of Release with a linker trick: do not port it until size or leakage is a real problem.

---

### Task 1: Models and the state catalog

**Files:**
- Create: `Sources/ScreenModels/AppTab.swift`, `AppModel.swift`, `Home/HomeModel.swift`, `Home/EndedProgram.swift`; `Sources/TestSupport/DesignedState.swift`; `Tests/ScreenModelsTests/HomeModelTests.swift`; `Tests/TestSupportTests/DesignedStateTests.swift`
- Modify: `Packages/ApexKit/Package.swift`, `project.yml` (the `Fast` scheme), `Sources/Core/Launch/LaunchOptions.swift`, `Tests/CoreTests/LaunchOptionsTests.swift`

**Interfaces:**
- Produces, in `ScreenModels` (all `public`, main-actor isolated where observable):

```swift
public enum AppTab: String, CaseIterable, Sendable { case home, workout, progress, run }   // title: "Home", "Workout", "Progress", "Run"
public struct EndedProgram: Equatable, Sendable { public init(name: String, endedOn: Date) }
@Observable public final class HomeModel {
    public init(lastEnded: EndedProgram?, calendar: Calendar)
    public var noProgramEyebrow: String? { get }   // "Pillars ended Aug 20"; nil when no program has ever ended
}
@Observable public final class AppModel {
    public var selectedTab: AppTab
    public let home: HomeModel
    public init(selectedTab: AppTab = .home, home: HomeModel)
}
```

- Produces, in `TestSupport`:

```swift
public enum DesignedState: String, CaseIterable, Sendable {
    case homeNoProgram = "home.noProgram"
    public var screen: String { get }              // the part before the dot: "home"
    @MainActor public func appModel() -> AppModel  // the app as the mock shows it
}
```

`homeNoProgram` is the demo's `Ended` state: `EndedProgram(name: "Pillars", endedOn:)` noon on 2026-08-20 GMT, a Gregorian calendar in GMT. The eyebrow style uppercases it in the view; the model returns sentence case.

- Produces, in `Core`: `LaunchOptions.stateName: String?`, the value after `-State`, Debug builds only.

- [x] **Step 1: Branch**

```bash
git checkout main && git pull && git checkout -b feat/ios-first-screen docs/ios-first-screen-plan
make -C apex-ios setup && /usr/bin/time -p make -C apex-ios fast && /usr/bin/time -p make -C apex-ios ci-checks
```

Note both warm times (when plan 3 merged: `fast` 2.0 to 2.4 s, `ci-checks` 35 s). Task 6 compares against them.

- [x] **Step 2: Add the modules and write the failing tests**

`Package.swift`: targets `ScreenModels` and `TestSupport`, test targets `ScreenModelsTests` and `TestSupportTests`, with `moduleSettings`; main-actor default isolation only where the module's code needs it. Add both test targets to the `Fast` scheme in `project.yml`.

```
HomeModelTests
  theEyebrowNamesTheProgramThatEndedAndItsDay     // Pillars, 2026-08-20 12:00 GMT, GMT calendar -> "Pillars ended Aug 20"
  thereIsNoEyebrowWhenNoProgramHasEnded           // lastEnded nil -> nil
  theDayIsTheCalendarsNotGMTs                     // 2026-08-21 02:00 GMT, calendar in America/Toronto -> "… ended Aug 20"
DesignedStateTests
  everyDesignedStateHasAReferenceImage            // for each case: apex-ios/design/mocks/<rawValue>.png exists (path from #filePath); the failure names the state
  aStatesScreenIsTheNameBeforeTheDot              // .homeNoProgram.screen == "home"
  homeNoProgramIsTheMocksEndedState               // appModel(): selectedTab .home, home.noProgramEyebrow == "Pillars ended Aug 20"
LaunchOptionsTests (add)
  theStateNameFollowsItsFlag                      // ["Apex", "-State", "home.noProgram"], debug -> "home.noProgram"
  aStateFlagWithNoValueIsNoState                  // ["Apex", "-State"] -> nil
  aReleaseBuildIgnoresTheStateFlag
```

- [x] **Step 3: Run them and watch them fail**

Run: `make -C apex-ios fast`
Expected: it does not compile (the types do not exist). Stub the types with wrong return values, run again, and see the 9 new tests fail on their assertions with the 4 old ones passing.

- [x] **Step 4: Write the models**

Signatures in Interfaces. The eyebrow's date is month and day in English, formatted in the model's calendar and its time zone.

- [x] **Step 5: Run everything and commit**

Run: `make -C apex-ios fast && make -C apex-ios lint && make -C apex-ios build`
Expected: 13 Mac tests pass; lint clean; the app still builds (nothing uses the new modules yet, so `make unused` may report them: that is Task 2's to clear, do not suppress).

```bash
git add apex-ios && git commit -m "feat(ios): screen models and the designed-state catalog"
```

### Task 2: The tab bar and Home with no program

**Files:**
- Create: `Sources/Screens/Home/HomeScreen.swift` and its card; the components under `Sources/Screens/DesignSystem/`; `Sources/Screens/DesignSystem/Generated/Resources/Exo2-ExtraBold.ttf` and `logo-mark.png` (by `make generate`)
- Modify: `Sources/Screens/RootScreen.swift`, `App/ApexApp.swift`, `Package.swift` (Screens: dependencies and resources), `Makefile` (`generate`, `run`), `design/tokens.json` when a token is missing

**Interfaces:**
- Consumes: `AppModel`, `HomeModel`, `AppTab` and `DesignedState` from Task 1; `Tokens`.
- Produces: `public struct RootScreen: View { public init(model: AppModel) }`.
- Produces: `make run STATE=<name>` launches the app with `-State <name>`; without `STATE` it launches the real app.
- Produces: `make generate` also copies the wordmark's font and the logo mark from `design/export/` into `DesignSystem/Generated/Resources/`, only when they differ (a rewritten file would recompile `Screens` on every build). The drift check in `ci-checks` and the guard hook cover that folder already.

What is on screen, top to bottom (measure against the demo; `home.noProgram.png` shows it):

- **The field:** `field-base` with the halo behind the header (README, Color, "Light").
- **The gear:** a 44 pt system-glass circle, fixed top right. It does nothing yet (Settings is not designed).
- **The wordmark:** the logo mark and "PEX" in Exo 2 ExtraBold at 34 pt, on its own row under the gear. The collapse to a small centred wordmark on scroll belongs to the Home segment, when Home has enough content to scroll.
- **The card:** the eyebrow when there is one, "No Active Program", "Pick one to get started on your goal.", a blue primary "Choose a program", and under it the secondary text "Log a workout without a program". Neither action has anywhere to go yet (the demo itself says "Opens Programs" and "to design"): they are real buttons with empty actions and a comment naming what will wire them.
- **The tab bar:** the system's, four tabs in `AppTab` order, a filled symbol over its title. Workout, Progress and Run show the bare field.
- **Not built here:** the check-in, Recovery, This week and program cards. They need data that does not exist yet.

- [ ] **Step 1: Resources and the root**

`RootScreen(model:)` is a `TabView` bound to `model.selectedTab`. `ApexApp` builds the model: in a Debug build with `-State <name>`, `DesignedState(rawValue:)` then `appModel()`, and an unknown name stops the app with a message listing every `DesignedState` name; otherwise `AppModel(home: HomeModel(lastEnded: nil, calendar: .current))`. Register the font once, where the wordmark component lives.

- [ ] **Step 2: Build the components and the screen**

Only the components this screen needs, each in `DesignSystem/`, each reading tokens. A `#Preview("home.noProgram")` beside `HomeScreen` renders `RootScreen(model: DesignedState.homeNoProgram.appModel())`.

- [ ] **Step 3: Checks**

Run: `make -C apex-ios fast && make -C apex-ios lint && make -C apex-ios unused && make -C apex-ios build`
Expected: all pass, with no Periphery suppression added.

- [ ] **Step 4: Look at it**

```bash
make -C apex-ios run STATE=home.noProgram
xcrun simctl io "APEX $(basename "$PWD") iPhone 17" screenshot apex-ios/build/home.noProgram-run.png
make -C apex-ios run && xcrun simctl io "APEX $(basename "$PWD") iPhone 17" screenshot apex-ios/build/home-live.png
```

Open both with the Read tool beside `design/mocks/home.noProgram.png`. The first has the "PILLARS ENDED AUG 20" eyebrow; the second has none. Header, card, buttons, type and spacing match the mock; the cards not built are absent; the tab bar is the system's. Fix what differs before going on.

- [ ] **Step 5: Ask Ben what the mock does not cover**

One GitHub issue labelled `needs-ben` and `iOS`, with the defaults taken: the card with no eyebrow when no program has ever ended; the two buttons and the gear doing nothing until their destinations exist; Home showing only this card until the other cards' data exists. Keep going.

- [ ] **Step 6: Prove the unknown state stops**

Run: `make -C apex-ios run STATE=home.nope`, then read the app's log (`xcrun simctl spawn "<simulator>" log show --last 1m --predicate 'subsystem == "com.cadre.apex"'` or the crash message).
Expected: the app stops; the message names `home.nope` and lists `home.noProgram`.

- [ ] **Step 7: Commit**

```bash
git add apex-ios && git commit -m "feat(ios): the tab bar and Home with no program"
```

### Task 3: The simulator runner and one journey

**Files:**
- Create: `UITests/AppJourneyTests.swift`, `UITests/Support/Launch.swift`, `UITests/Support/Wait.swift`, `scripts/sim-tests.sh`, `scripts/affected-tests.sh`, `scripts/test-map.txt`, `scripts/build-fingerprint.sh`, `scripts/tests/sim-tests.bats`, `scripts/tests/affected.bats`
- Modify: `project.yml` (the target `ApexUITests`, the `Apex` scheme), `Makefile`

**Interfaces:**
- Produces: make targets `affected` (`BASE=<ref>`, default `origin/main`), `retest` (`ONLY="<Target/Class[/test]> …"`), `gate`. All three go through `scripts/sim-tests.sh <mode>`.
- Produces: `sim-tests.sh` writes the run's result bundle to `.build/results/<mode>.xcresult` (removed before each run) and appends one line to `.build/test-runs.log`: time, mode, scope, build seconds, test seconds, exit status. Task 5 reads the bundle.
- Produces: `scripts/affected-tests.sh [BASE]` prints test identifiers one per line, `ALL`, or nothing; `--check-map` exits 1 when `test-map.txt` names a class that does not exist or a test class is missing from it.
- Produces: `scripts/build-fingerprint.sh` (`print` · `current` · `record FP` · `forget`), as filing-cabinet's.
- Produces: the `Apex` scheme's test action lists `ApexUITests` (Task 4 adds `ApexSnapshotTests`). `CoreTests` leaves it: Mac tests run in `Fast`.
- The seams for bats are environment variables named `APEX_XCODEBUILD`, `APEX_AFFECTED_CMD`, `APEX_BEAUTIFY`.

What changes from filing-cabinet's scripts: three modes (`affected`, `retest`, `gate`), where `gate` is its `full ALL=1` with no argument and no policy text; no snapshot variants; no smoke set and no shared set; no string-catalog and no identifier rules in `affected-tests.sh`. Paths are relative to `apex-ios/`, and a changed path outside `apex-ios/` affects nothing.

- [ ] **Step 1: Write the failing bats tests**

Port from filing-cabinet's two bats files, keeping these (rename nothing that still fits):

```
sim-tests.bats
  @test "gate builds once, then tests without building, everything"
  @test "affected runs only the classes the map gives"
  @test "affected with nothing to run says so and builds nothing"
  @test "retest runs without building"
  @test "retest refuses when the sources changed since the last build"
  @test "retest refuses when there is no build"
  @test "a failed build records no fingerprint and runs no test"
  @test "every run appends one line to the run log"
  @test "an unknown mode is a usage error"
affected.bats
  @test "a change under a mapped folder runs that folder's classes"
  @test "a path no rule matches runs everything"
  @test "a changed test file runs the classes it declares"
  @test "a changed reference image runs its class"
  @test "docs and scripts run nothing"
  @test "a change outside apex-ios runs nothing"
  @test "check-map fails on a class that does not exist"
  @test "check-map fails on a test class the map leaves out"
  @test "check-map passes on the committed map"
```

- [ ] **Step 2: Run them and watch them fail**

Run: `make -C apex-ios test-scripts`
Expected: the 21 tests from plan 3 pass; the 18 new ones fail, the scripts do not exist.

- [ ] **Step 3: Write the scripts, the targets and the map**

`test-map.txt` starts with: `*.md`, `docs/`, `design/`, `scripts/`, `Packages/ApexKit/Tests/` to `NONE`; `design/tokens.json`, `scripts/generate-tokens.swift`, `Makefile`, `project.yml`, `Package.resolved`, `App/`, `Packages/ApexKit/Package.swift`, `Sources/Core/`, `Sources/TestSupport/`, `Sources/ScreenModels/App`, `Sources/Screens/DesignSystem/`, `Sources/Screens/RootScreen.swift`, `UITests/Support/` to `ALL`; `Sources/ScreenModels/Home/` and `Sources/Screens/Home/` to `AppJourneyTests` (the journey reads Home's card; Task 4 adds `HomePictureTests` to both rows). Add `affected-tests.sh --check-map` to `ci-checks`, and `UITests` to `SWIFT_DIRS`. `make build` and every other target that builds into the derived data folder calls `build-fingerprint.sh forget` first.

- [ ] **Step 4: Write the journey**

`AppJourneyTests.testTheAppLaunchesToHomeAndTheTabsSwitch`: launch the real app (`-UITest`, no `-State`); "No Active Program" appears; tap Workout, Progress, Run in the tab bar, each becoming the selected tab with the Home card gone; tap Home, the card is back. Find elements by their text and the tab bar's own buttons: no identifier is needed. `Support/Launch.swift` is one function, `launchApp(_ flags: [String] = []) -> XCUIApplication`; do not port the relaunch machinery until a class has several journeys. `Support/Wait.swift` keeps `appears(within:)` and `disappears(within:)` and what they need.

- [ ] **Step 5: Run everything**

```bash
make -C apex-ios test-scripts
make -C apex-ios gate
make -C apex-ios retest ONLY=ApexUITests/AppJourneyTests
make -C apex-ios affected
```

Expected: 39 bats tests pass. `gate` builds once and runs the journey, and its summary line gives build and test seconds. `retest` runs it again with no build. `affected` on this branch runs everything, because the branch touches `project.yml`. Note the journey's seconds from each.

- [ ] **Step 6: Prove the journey can fail**

Change the expected text in the journey to "No Active Programme", run `make -C apex-ios retest ONLY=ApexUITests/AppJourneyTests`. Expected: retest refuses (the sources changed). Run `make -C apex-ios affected`. Expected: the journey fails on that line. Restore the text, run `affected` again, green.

- [ ] **Step 7: Commit**

```bash
git add apex-ios && git commit -m "feat(ios): the simulator test runner (affected, retest, gate) and the launch journey"
```

### Task 4: Pictures and `make compare`

**Files:**
- Create: `SnapshotTests/SnapshotHost.swift`, `SnapshotTests/HomePictureTests.swift`, `SnapshotTests/__Snapshots__/…` (recorded), `scripts/compare-snapshot.swift`, `Package.resolved`
- Modify: `Tests/TestSupportTests/DesignedStateTests.swift`, `project.yml` (the target `ApexSnapshotTests`, hosted in the app; the package; the `Apex` scheme), `Makefile`, `scripts/test-map.txt`

**Interfaces:**
- Consumes: `DesignedState` and `RootScreen` from Tasks 1 and 2; the runner from Task 3.
- Produces: `SnapshotHost.assertStates(ofScreen: String, file:line:)`, main-actor: draws `RootScreen(model: state.appModel())` for every `DesignedState` whose `screen` matches, each in a new window in the host app's scene, and asserts it against its reference, named by the state. It fails when no state matches.
- Produces: one class per screen, by convention `<Screen>PictureTests` in `SnapshotTests/<Screen>PictureTests.swift`, holding one test: `testStates`, which calls `assertStates(ofScreen:)`. Adding a state to an existing screen needs no test change.
- Produces: make targets `snapshots-record` (`ONLY=` narrows it; rewrites only references that fail or are missing) and `compare STATE=<name>`, which writes `build/compare/<name>.png`, the app's reference on the left and `design/mocks/<name>.png` on the right at the same height, and prints the path.

The swift-snapshot-testing pin is the newest release, `exact`. The tracked `Package.resolved` is copied into the generated project by `make generate`, and every `xcodebuild` call and Periphery's build pass `-onlyUsePackageVersionsFromResolvedFile`, as in filing-cabinet. `SnapshotTests` joins `SWIFT_DIRS`; `SnapshotTests/SnapshotHost.swift` joins the map as `ALL` and `HomePictureTests` joins the two Home rows.

The tolerance is filing-cabinet's: every pixel within a perceptual precision of 0.98. Do not port `CPUImageMatch`: it answers a fault seen only on GitHub's runners, and plan 5 ports it if CI shows that fault.

- [ ] **Step 1: Write the failing Mac test**

```
DesignedStateTests (add)
  everyScreenHasAPictureTestClass     // for each distinct screen: apex-ios/SnapshotTests/<Screen>PictureTests.swift exists ("home" -> HomePictureTests.swift); the failure names the screen
```

Run: `make -C apex-ios fast`. Expected: it fails naming `home`.

- [ ] **Step 2: Write the host and the Home picture class, and record**

Port `SnapshotHost` without variants, text sizes or scrolling. Start with no settle wait beyond its "frames stopped moving" loop.

```bash
make -C apex-ios fast
make -C apex-ios snapshots-record
make -C apex-ios retest ONLY=ApexSnapshotTests/HomePictureTests
```

Expected: the Mac test passes; a reference appears under `SnapshotTests/__Snapshots__/HomePictureTests/` (recording reports a failure, as the library does); retest is green. Open the reference with the Read tool.

- [ ] **Step 3: Measure what the glass needs**

The tab bar and the gear are system glass, which settles over a few frames. Run `make -C apex-ios retest ONLY=ApexSnapshotTests/HomePictureTests` ten times. If all ten pass, the wait stays at zero. If any fails, raise the settle time through 0.25, 0.5 and 1 s, re-recording each time, to the smallest value that passes ten of ten. Record in the hand-off: the settle time chosen and the seconds one picture costs (the test's duration in the run's output). The spec's target is one second or less a picture.

- [ ] **Step 4: Prove the picture can fail**

Change the card's title to "No Active Programs", run `make -C apex-ios affected`. Expected: `HomePictureTests` fails and the journey fails. Restore it; `affected` is green.

- [ ] **Step 5: Write `compare` and look**

Port `compare-snapshot.swift`: it takes the state's name, finds the one reference under `SnapshotTests/__Snapshots__/` whose file name ends in `<name>.png`, and fails naming the state when there is none or `design/mocks/<name>.png` is missing.

Run: `make -C apex-ios compare STATE=home.noProgram`, open `apex-ios/build/compare/home.noProgram.png`.
Expected: app on the left, mock on the right. List in the hand-off what matches and every difference you can see, with the reason for each (a card not built yet, system glass against drawn glass, 402 against 390 points wide).

- [ ] **Step 6: Commit**

```bash
git add apex-ios && git commit -m "feat(ios): one picture per designed state, and make compare"
```

### Task 5: The time report, the ceiling and `make frames`

**Files:**
- Create: `scripts/test-times.py`, `scripts/gate-ceiling.txt`, `scripts/frames.sh`, `scripts/tests/fixtures/times/*.json`
- Modify: `scripts/sim-tests.sh`, `scripts/tests/scripts.bats` (or a new `scripts/tests/test-times.bats`), `Makefile`

**Interfaces:**
- Consumes: `.build/results/<mode>.xcresult` from Task 3.
- Produces: `scripts/test-times.py TESTS_JSON CEILING_FILE [--enforce]`, where `TESTS_JSON` is the output of `xcrun xcresulttool get test-results tests --path <bundle> --compact`. Every node with `"nodeType": "Test Case"` is one test; its time is `durationInSeconds`, its name `nodeIdentifier`, its outcome `result`.
- Produces: `scripts/gate-ceiling.txt`: `#` comment lines saying when and from what measurement it was recorded, then one line, the ceiling in whole seconds.
- Produces: `sim-tests.sh` ends every run that ran tests by printing the report; `gate` exits non-zero when the report does.
- Produces: `make frames STATE=<name>` (`DURATION=<seconds>`, default 2) writes `build/frames/<name>.png` and prints the path.

The report, on stdout:

```
test time: 14.2 s of a 60 s ceiling (24%) · 2 tests
slowest:
   9.8 s  AppJourneyTests/testTheAppLaunchesToHomeAndTheTabsSwitch()
   4.4 s  HomePictureTests/testStates()
```

It lists at most five. Over 80% of the ceiling it adds a line starting `warning:`. Over the ceiling it adds a line starting `error:` and exits 1 only with `--enforce`: CI passes that flag in plan 5, and locally the gate never fails on time. It always exits 1, with an `error:` line naming the cause, when no test ran, when any test's `result` is not `Passed`, and when one test took over 60 s. The change against `main` is plan 5's: it needs `main`'s number from CI.

- [ ] **Step 1: Write the failing tests**

Fixtures are small hand-written JSON files in the shape above (take one real output from Task 3's bundle as the model).

```
@test "the report gives the total, the share of the ceiling and the slowest five"
  # 7 tests, 1 s to 7 s, ceiling 100  ->  "test time: 28.0 s of a 100 s ceiling (28%) · 7 tests"; five lines, 7 s first; exit 0
@test "over 80 percent warns and passes"
@test "over the ceiling passes locally and fails with --enforce"
@test "a test over 60 s fails"
  # one test of 61 s, ceiling 1000  ->  exit 1, stderr or stdout names the test and 60 s
@test "a failed test fails the report"
@test "a result with no tests fails"
@test "a ceiling file with no number fails"
@test "nested suites are walked"
  # test cases three levels down, as xcresulttool nests them
```

- [ ] **Step 2: Run them and watch them fail**

Run: `make -C apex-ios test-scripts`
Expected: the 39 earlier tests pass, the 8 new ones fail.

- [ ] **Step 3: Write `test-times.py` and wire it into `sim-tests.sh`**

Python standard library only, run with `-I`.

- [ ] **Step 4: Record the ceiling**

Run `make -C apex-ios gate` three times. The ceiling is twice the largest test time of the three, rounded up to the next 10 s. Write it to `gate-ceiling.txt` with the three measurements in its comment. This is a local number; plan 5 records it again from CI's first run, which is still the design's own build step.

Run: `make -C apex-ios test-scripts && make -C apex-ios gate`
Expected: 47 bats tests pass; the gate ends with the report, under 80%, exit 0.

- [ ] **Step 5: Write `frames` and look**

`frames.sh STATE DURATION`: install the built app, start `xcrun simctl io <simulator> recordVideo`, launch with `-State`, wait, stop the recording with an interrupt, and have `ffmpeg` tile it at 10 frames a second into one image. It fails with the install command when `ffmpeg` is missing. This state has no motion of its own, so the sheet proves the tool: it shows the launch settling into Home.

Run: `make -C apex-ios frames STATE=home.noProgram`, open `apex-ios/build/frames/home.noProgram.png`.
Expected: about 20 frames in order, the last ones the finished screen.

- [ ] **Step 6: Commit**

```bash
git add apex-ios && git commit -m "feat(ios): the gate's time report and ceiling, and make frames"
```

### Task 6: Rules, numbers, then ship

**Files:**
- Modify: `apex-ios/AGENTS.md`, `apex-ios/CLAUDE.md`

- [ ] **Step 1: Update the rules files**

`AGENTS.md`, stating only what is true when this merges:

- **Map:** the new modules, `SnapshotTests/`, `UITests/`, `Package.resolved`, each new script, `DesignSystem/Generated/Resources/`.
- **Commands:** `affected`, `retest ONLY=`, `gate`, `snapshots-record`, `compare STATE=`, `frames STATE=`, `run STATE=`. Remove the "arrive in plan 4" line.
- **Module dependencies:** the table from this plan's File Structure.
- **Launch flags:** `-State <name>`.
- **Where tests go:** drop "today only the Mac layer exists"; add the run policy: `retest` while fixing, `affected` at the end of a task, `gate` before a pull request, with the seconds each took here.
- **Designed states:** the Swift side: a state is a `DesignedState` case; `make fast` fails until it has a mock image and its screen has a `<Screen>PictureTests` class; a new screen adds that class and its `test-map.txt` rows.
- **Keeping it fast** (new, short): the ceiling and where it lives, the 60 s limit on one test, the report every run prints, and that raising the ceiling needs Ben.
- **Definition of done:** a task that touches a screen adds `make affected` green and, for a designed state, the `compare` image opened.

`CLAUDE.md`: "Where we are" becomes "Foundation, plan 4 of 5 merged: the first screen (the tab bar and Home with no program) and the simulator test loop. CI runs the simulator tests from plan 5."

Verify: `grep -c '—' apex-ios/AGENTS.md apex-ios/CLAUDE.md` prints 0 twice. Commit: `docs(ios): rules for screen models, pictures, journeys and the gate`.

- [ ] **Step 2: Evidence from `ios-verifier`**

One agent, the make targets only: `fast`, `build`, `ci-checks`, `gate`, each PASS or FAIL with wall times; the Mac, bats and fixture counts; the gate's time report copied whole; whether `git status --short` is clean afterwards.

- [ ] **Step 3: Push and open the pull request**

```bash
git push -u origin feat/ios-first-screen
gh pr create --base main --title "apex-ios: the first screen, pictures, a journey and the gate" --body-file <the hand-off>
```

The hand-off lists: the make targets added; `fast`, `ci-checks` and CI `checks` times before and after; the gate's build seconds, test seconds and report; the settle time and the cost of one picture against the one-second target; the journey's seconds; the ceiling and how it was set; the images opened (`build/home.noProgram-run.png`, `build/home-live.png`, the recorded reference, `build/compare/home.noProgram.png`, `build/frames/home.noProgram.png`) with the differences from the mock; the `needs-ben` issue; and plainly that CI did not run the simulator tests, so the gate's evidence is local.

- [ ] **Step 4: Review**

One fresh reviewer agent on the most capable model reads the branch diff against this plan and the spec sections named at the top, leaving reference images out of the diff it reads. Fix what it finds, each fix with a test that failed first; re-run the affected steps.

- [ ] **Step 5: Merge on green**

Wait for the `checks` job on the last commit with `gh run watch <id> --exit-status`, and read its log for the counts. Then `gh pr merge --merge --delete-branch`, `git checkout main && git pull`, and delete `docs/ios-first-screen-plan` locally and on the remote.

- [ ] **Step 6: Hand off**

Follow `docs/superpowers/handoff.md`: write plan 5, update the note, report to the lead, stop.
