# Device Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A screen in Debug builds where Ben tries a few values of one design token on his phone and says which he wants. First exhibit: the snappy spring's bounce (issue 93).

**Architecture:** The lab is a sheet over the app's root, driven by a Debug-only `LabModel` on `AppModel`. It opens two ways: the launch state `lab.<exhibit>` and a long press on Home's wordmark. A lab is a list of exhibits (`LabExhibit`); an exhibit shows real moments from the design and a control over one `LabTrial`, which holds the values to try and starts on the token's own. The token generator gives each spring, in Debug builds only, its bounce as a number and the same spring with another bounce, so the exhibit animates only with `Tokens.Motion`.

**Tech Stack:** SwiftUI, Observation, Swift Testing (Mac tests), XCTest (one journey step), bats (generator test).

**Spec:** GitHub issue 96 (the approved brief) and the `device-lab` part of `docs/superpowers/handoff.md`. The foundation's design is `docs/superpowers/specs/2026-11-27-ios-agentic-foundations-design.html`.

## Global Constraints

- Debug builds only. Every file under a `Lab/` folder is wrapped whole in `#if DEBUG`; every use outside those folders sits in an `#if DEBUG` block. `make unused` stays clean.
- The lab is not a designed state: no `DesignedState` case, no mock, no picture, nothing in `design/states.json`.
- Every value from tokens. The lab overrides only the value on trial. The values to try are data in `ScreenModels`, never numbers in a view. A measurement with no token is a named private constant that cites its design source.
- No lint config, hook config, test tolerance or time ceiling changes.
- Only `apex-ios/` changes. `docs/superpowers/handoff.md` is not edited.
- Every hard rule in `apex-ios/AGENTS.md` holds: no accessibility work, middots in copy, one primary type per file, Swift Testing for Mac tests.
- Simulator test time is added only for something no other check covers, and its cost is reported.

## Defaults taken (each goes in the report)

1. **The way in by hand:** press and hold the APEX wordmark on Home. No visible control, so Home's picture is unchanged. It can move into Settings when Settings is designed.
2. **The lab is a sheet** over the app, closed by swiping down. `STATE=lab.motion` opens the same sheet at the Motion exhibit.
3. **The exhibit shows the two real moments** the design gives the snappy timing to: a set's tick (motion-decisions m10 and w1: the ring fills moss over the quick timing, the check pops in) and a row that follows the finger and snaps back on release (m3). Replay is the gesture itself: tap the tick again (it fades out, as w4 says), then tick it.
4. **Bounce values:** 0, 0.1, 0.15, 0.2, 0.3 (the issue's). The token's own value is always among them and is where the trial starts.
5. **The generator gives every spring token the Debug-only pair,** not just `snappy`: one rule, no list of tokens on trial.
6. **One simulator test step,** on the existing journey: the long press opens the lab. Nothing else exercises the only way in that works away from the Mac.

## Review Focus

1. **A lab file that compiles into Release.** Pinned by Task 2 (`everyLabFileIsDebugOnly`) and proved once by a Release build in Task 4.
2. **The token's value is not among the values to try** (after Ben picks, say, 0.12). The trial must still start on it and offer it. Pinned by Task 2.
3. **A lab state with a wrong exhibit name** (`lab.nope`). The app must stop with the message that lists the known names, lab states included. Pinned by Task 2 (`LabExhibit(stateName:)` is nil) and checked by hand in Task 3.
4. **The long press swallowing touches** on Home or the tab bar. The existing journey runs with the door attached; Task 3 runs the whole gate.
5. **Home's picture changing.** Task 3 runs `HomePictureTests` against the unchanged reference.

## File Structure

| File | Is |
|---|---|
| `scripts/generate-tokens.swift` (modify) | adds the Debug-only block to `Tokens.Motion` |
| `scripts/tests/scripts.bats` (modify) | the generator test for that block |
| `Packages/ApexKit/Sources/ScreenModels/Lab/LabTrial.swift` | one token value on trial, and the snappy bounce trial |
| `Packages/ApexKit/Sources/ScreenModels/Lab/LabExhibit.swift` | the exhibits, their titles and launch state names |
| `Packages/ApexKit/Sources/ScreenModels/Lab/LabModel.swift` | whether the lab is open, and at which exhibit |
| `Packages/ApexKit/Sources/ScreenModels/AppModel.swift` (modify) | `lab`, Debug only |
| `Packages/ApexKit/Tests/ScreenModelsTests/Lab/` | `LabTrialTests`, `LabExhibitTests`, `LabModelTests`, `LabDebugOnlyTests` |
| `Packages/ApexKit/Sources/Screens/Lab/LabScreen.swift` | the list of exhibits and the way to each |
| `Packages/ApexKit/Sources/Screens/Lab/MotionExhibit.swift` | the snappy spring: the bounce control over the two moments |
| `Packages/ApexKit/Sources/Screens/Lab/SetTick.swift` | a set's tick circle |
| `Packages/ApexKit/Sources/Screens/Lab/SnapBackRow.swift` | a row that follows the finger and snaps back |
| `Packages/ApexKit/Sources/Screens/Lab/LabDoor.swift` | the sheet on the root and the long press that opens it |
| `RootScreen.swift`, `Home/HomeScreen.swift`, `App/ApexApp.swift` (modify) | one `#if DEBUG` hook each |
| `scripts/test-map.txt`, `Makefile`, `AGENTS.md`, `UITests/AppJourneyTests.swift` (modify) | map rows, `device STATE=`, the docs, the journey step |

---

### Task 1: The generator gives each spring its bounce and a way to try another

**Files:** `scripts/generate-tokens.swift`, `scripts/tests/scripts.bats`, `Packages/ApexKit/Sources/Screens/DesignSystem/Generated/Tokens.swift` (regenerated).

**Produces:** in Debug builds, for a spring token `snappy`: `Tokens.Motion.snappyBounce: Double` and `Tokens.Motion.snappy(bounce: Double) -> Animation`.

- [ ] **Step 1: the failing test.** In `scripts.bats`, after "the generator writes every token kind":

```bash
@test "a spring gets its bounce and a way to try another, in Debug builds only" {
  generate
  has_line "static let smoothBounce: Double = 0"
  has_line "static func smooth(bounce: Double) -> Animation { .spring(duration: 0.35, bounce: bounce) }"
  # Both sit between #if DEBUG and #endif, and no other curve gets the pair.
  [ "$(sed -n '/#if DEBUG/,/#endif/p' Tokens.swift | grep -c 'Bounce\|(bounce: Double)')" -eq 2 ]
  [ "$(grep -c 'Bounce\|(bounce: Double)' Tokens.swift)" -eq 2 ]
}
```

- [ ] **Step 2:** `bats scripts/tests/scripts.bats -f "a spring gets"` fails.
- [ ] **Step 3: implement.** A function `springTrials(_:) -> String?` builds the block from the spring tokens (nil when there is none); it goes into `Motion` through `enumeration`'s `nested` slot, ahead of `Duration`. The block opens with a comment saying it is for the device lab.
- [ ] **Step 4:** the bats file passes, the committed-file format test included; `make generate` rewrites `Tokens.swift`.
- [ ] **Step 5:** commit.

### Task 2: The lab's models

**Files:** the three `ScreenModels/Lab/` files, `AppModel.swift`, the four test files.

**Produces:**

```swift
public nonisolated struct LabTrial: Equatable, Sendable {
    public let token: Double        // the token's own value
    public let options: [Double]    // ascending, no repeats, the token's among them
    public var tried: Double        // starts on the token's
    public init(token: Double, candidates: [Double])
    public static func snappyBounce(token: Double) -> LabTrial   // candidates 0, 0.1, 0.15, 0.2, 0.3
}

public nonisolated enum LabExhibit: String, CaseIterable, Sendable {
    case motion
    public var title: String        // "Motion"
    public var summary: String      // one line on what it tries
    public var stateName: String    // "lab.motion"
    public init?(stateName: String)
}

@Observable public final class LabModel {
    public var isOpen = false
    public var path: [LabExhibit] = []
    public init()
    public func open(at exhibit: LabExhibit)   // path = [exhibit], isOpen = true
}

// AppModel, Debug only
public let lab = LabModel()
```

- [ ] **Step 1: the failing tests** (Swift Testing, each file wrapped in `#if DEBUG`):
  - `LabTrialTests`: `aTrialStartsOnTheTokensValue`; `theOptionsAreInOrderWithNoRepeats` (candidates `[0.3, 0, 0.15, 0.3]`, token 0.15 gives `[0, 0.15, 0.3]`); `aTokenValueNobodyListedIsStillOffered` (token 0.12 with the snappy candidates gives `[0, 0.1, 0.12, 0.15, 0.2, 0.3]` and `tried == 0.12`); `theSnappyBounceTrialOffersTheIssuesValues`.
  - `LabExhibitTests`: `anExhibitsStateNameIsLabThenItsName` (`.motion.stateName == "lab.motion"`); `anExhibitIsFoundByItsStateName`; `anyOtherNameIsNoExhibit` (`"lab.nope"`, `"lab"`, `"motion"`, `"home.noProgram"`).
  - `LabModelTests`: `theLabStartsClosedAtItsList`; `openingAtAnExhibitShowsItOverTheList`; `theAppsLabStartsClosed` (`AppModel(home:)`).
  - `LabDebugOnlyTests.everyLabFileIsDebugOnly`: every `.swift` file under `Sources/ScreenModels/Lab` and `Sources/Screens/Lab` has `#if DEBUG` as its first line and `#endif` as its last; fails when either folder is empty.
- [ ] **Step 2:** `make fast` fails to build.
- [ ] **Step 3:** implement. `LabDebugOnlyTests` stays red until Task 3 adds `Screens/Lab`.
- [ ] **Step 4:** `make fast`: everything but `everyLabFileIsDebugOnly` passes.
- [ ] **Step 5:** commit with Task 3 (the stop gate wants `make fast` green).

### Task 3: The lab's screens and its two ways in

**Files:** the five `Screens/Lab/` files, `RootScreen.swift`, `HomeScreen.swift`, `ApexApp.swift`, `scripts/test-map.txt`, `UITests/AppJourneyTests.swift`.

**Consumes:** Task 1's `Tokens.Motion.snappyBounce` and `snappy(bounce:)`; Task 2's types.

- [ ] **Step 1: `LabDoor.swift`.** `View.labSheet(_ lab: LabModel)` puts `LabScreen` in a sheet bound to `lab.isOpen` and the model in the environment; `View.opensLab()` sets `isOpen` on a long press. `RootScreen` calls the first after `.tint`, `HomeScreen` the second on `Wordmark()`.
- [ ] **Step 2: `LabScreen.swift`.** A `NavigationStack` on `model.path`, title "Device Lab": one `Card` per `LabExhibit.allCases` (title in `cardName`, summary in `value`, secondary colour) as a `NavigationLink(value:)`, on `ScreenField`. `.motion` leads to `MotionExhibit`.
- [ ] **Step 3: `MotionExhibit.swift`, `SetTick.swift`, `SnapBackRow.swift`.** State: `LabTrial.snappyBounce(token: Tokens.Motion.snappyBounce)` and the set of ticked rows. A card of three set rows (`SnapBackRow`), each ending in a `SetTick`; under it a segmented picker over `trial.options` and one helper line naming the token's value. The tick is the design's (APEX README, "Workout session, set ticks": a 28 pt circle in a 44 pt tap area, grey ring, moss fill with a dark tick): the fill animates with `Tokens.Motion.quick`, the check arrives with `Tokens.Motion.snappy(bounce:)` and leaves with `quick`. The row's offset follows a horizontal drag and returns to zero with `Tokens.Motion.snappy(bounce:)`.
- [ ] **Step 4: `ApexApp.model(stateName:)`.** In Debug, a name that is a lab state returns the real app with `lab.open(at:)`; the unknown-name message also lists the lab's state names.
- [ ] **Step 5: `scripts/test-map.txt`.** `Packages/ApexKit/Sources/ScreenModels/Lab/ ALL` and `Packages/ApexKit/Sources/Screens/Lab/ ALL`, with a comment: the door is on Home and the sheet on the root.
- [ ] **Step 6: the journey.** At the end of `AppJourneyTests`'s one test: `app.staticTexts["PEX"].press(forDuration: 1)`, then `app.staticTexts["Motion"].appears(within: 5)`. The test's name says so.
- [ ] **Step 7: verify.** `make build`, `make fast` (all green now), `make lint`, `make gate` three times (report the test time against the 20 s ceiling, before and after), `make run STATE=lab.motion` with a screenshot opened, `make frames STATE=lab.motion`, `make run STATE=lab.nope` stops with the message.
- [ ] **Step 8:** commit Tasks 2 and 3.

### Task 4: The phone, Release, the docs

**Files:** `Makefile`, `AGENTS.md`.

- [ ] **Step 1: `make device STATE=`.** The launch line passes `-State $(STATE)` when `STATE` is set and `--terminate-existing`, so a second run lands in the state.
- [ ] **Step 2: Release.** Build the Release configuration for the simulator without signing; `nm` on the app binary shows no symbol containing `Lab`. Report the command and the count.
- [ ] **Step 3: the phone.** `make device STATE=lab.motion DEVICE=<the phone>`. If the phone cannot be reached, record exactly what was not verified and the one command Ben runs.
- [ ] **Step 4: `AGENTS.md`.** The map (the `Lab/` folders), `make device`'s row, the launch-flags row, a "Device lab" section (what it is, the two ways in, how to add an exhibit, why it has no picture), and whatever `make device` needed from a person.
- [ ] **Step 5:** `make ci-checks`; commit.

### Task 5: Evidence, review, merge, report

- [ ] One `ios-verifier` agent: `make build`, `make fast`, `make lint`, `make gate`, `make unused`.
- [ ] One fresh reviewer agent on the branch; fix what it finds.
- [ ] Bring in `origin/main`, run the checks again, push, open the pull request, watch CI by run id, merge with a merge commit, delete the remote branch.
- [ ] Report to the lead with `herdr agent prompt lead`, then stop.
