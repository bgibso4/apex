# APEX native

A personal strength training app for iPhone. iOS 27 minimum, SwiftUI. One user. Run every command as `make -C apex-ios <target>` from the repo root.

## Map

Paths are under `apex-ios/` unless they start with `/`, which is the repo root.

```
AGENTS.md                      the single copy of the iOS rules (this file)
CLAUDE.md                      @AGENTS.md plus Claude-only notes
Makefile                       the only entry point
project.yml                    XcodeGen source of the generated (gitignored) Apex.xcodeproj
Package.resolved               the pins for the app's packages (swift-snapshot-testing and what it needs)
Signing.xcconfig               team and bundle ID
.swiftlint.yml .swift-format .periphery.yml   lint, format and dead-code config
App/ApexApp.swift              @main: reads the launch options, builds the AppModel, shows RootScreen
Packages/ApexKit/              all logic, one local package (Package.swift)
  Sources/Core/                shared vocabulary and the launch options. Mac-buildable
  Sources/ScreenModels/        AppModel and one observable model per screen: all behaviour. Mac-buildable
  Sources/TestSupport/         DesignedState, the Swift side of the state catalog, and fixtures. Mac-buildable
  Sources/Screens/             SwiftUI views, one folder per screen. iOS-only
  Sources/Screens/DesignSystem/             components built on the tokens (Card, Eyebrow, the button styles, …)
  Sources/Screens/DesignSystem/Generated/   Tokens.swift, generated from design/tokens.json
  Sources/Screens/DesignSystem/Generated/Resources/   the wordmark's font and logo mark, copied from design/export
  Tests/<Module>Tests/         Mac tests, one target per Mac-buildable module
SnapshotTests/                 the pictures (ApexSnapshotTests, hosted in the app): SnapshotHost, CPUImageMatch,
                               one <Screen>PictureTests per screen, __Snapshots__/ (the references, committed)
UITests/                       the journeys (ApexUITests): AppJourneyTests, Support/ (launchApp, the waits)
design/                        Ben's design export and what is made from it (design/README.md)
  export/                      the export as imported; replaced whole by `make design-import`
  tokens.json                  the token source, written from export/APEX README.md (and, for a value the demos
                               use that the README does not name, from the demos: issue 95)
  states.json                  the mock side of the state catalog: state name, demo page, switches to click
  mocks/<state>.png            generated reference images, committed
scripts/design-import.py       an export zip to design/export/
scripts/generate-tokens.swift  design/tokens.json to Generated/Tokens.swift
scripts/render-mocks.py        design/states.json to design/mocks/, through mock-frame.html in headless Chrome
scripts/sim-tests.sh           every simulator test run: affected, retest, gate, record
scripts/affected-tests.sh      which test classes a branch's changes can affect, from scripts/test-map.txt
scripts/build-fingerprint.sh   whether the last simulator build still matches the sources (for retest)
scripts/test-times.py          the time report, checked against scripts/gate-ceiling.txt
scripts/compare-snapshot.swift a state's recorded picture beside its mock
scripts/frames.sh              a contact sheet of frames from a simulator recording
scripts/tests/                 bats tests for the scripts above, and their fixtures
scripts/ci/                    what only CI runs: gate-plan.sh (does the gate run for this event), gate-run.sh (which
                               run passed the gate on a commit's files), and their bats tests
scripts/pre-commit             lint, only when apex-ios files are staged
scripts/pre-commit-wrapper     the git hook `make setup` installs: runs pre-commit, passes on a branch without it
scripts/test-lint-rules.sh     fixture tests for the custom lint rules (lint-fixtures/, lint-negatives/)
scripts/hooks/                 Claude Code hooks (see CLAUDE.md) and their bats tests
docs/                          iOS specs, plans and the roadmap. Created with the first product segment
/.claude/settings.json         the hook wiring
/.github/workflows/ios.yml     CI: the checks job and the gate
/.github/actions/xcode-setup/  CI: Xcode and tool setup
```

## Commands

`make` is the only entry point. Run `make setup` once per checkout.

| Command | Does |
|---|---|
| `make setup` | check tools, install the git pre-commit hook, create this checkout's simulator, generate the project |
| `make generate` | writes `Generated/Tokens.swift` from `design/tokens.json`, copies the wordmark's font and logo mark into `Generated/Resources/`, then writes `Apex.xcodeproj` from `project.yml` (XcodeGen) with the pins from `Package.resolved` |
| `make build` | build the app for this checkout's simulator (`APEX <checkout folder> iPhone 17`: an iPhone 17 on iOS 27.0, created on demand; `SIM_DEVICE=` overrides) |
| `make fast` | Mac tests, no simulator. The loop agents live in |
| `make retest ONLY="<Target/Class[/test]> …"` | runs the named simulator tests with no build. Refuses when the sources changed since the last build |
| `make affected` | builds once, then runs the simulator test classes the branch's changes touch (`scripts/test-map.txt`; `BASE=<ref>`, default `origin/main`) |
| `make gate` | builds once, then runs every simulator test: what CI will run before a merge |
| `make snapshots-record` | rewrites each picture's reference that fails or is missing (`ONLY=` narrows it). It exits non-zero, as the library reports recording as a failure: run `retest` after it |
| `make compare STATE=<name>` | writes `build/compare/<name>.png`: the state's recorded picture on the left, its mock on the right |
| `make frames STATE=<name>` | records the app launching into the state and writes `build/frames/<name>.png`, 10 frames a second for `DURATION` seconds (default 2). Needs `ffmpeg` |
| `make lint` | SwiftLint and swift-format, both strict |
| `make format` | apply swift-format |
| `make unused` | Periphery dead-code scan |
| `make test-lint` | fixture tests for the SwiftLint custom rules |
| `make test-hooks` | bats tests for the hook scripts and the pre-commit script |
| `make test-scripts` | bats tests for the scripts in `scripts/` and `scripts/ci/`. The mock tests need Google Chrome |
| `make ci-checks` | everything CI's `checks` job runs: generate, a check that the committed generated files match, the test-map check, lint, hook tests, script tests, lint-rule tests, the Mac tests, Periphery |
| `make design-import ZIP=<path>` | replaces `design/export/` from a new export, lists what changed against git, runs `mocks` |
| `make mocks` | renders `design/mocks/<state>.png` for every state in `design/states.json` (`STATE=<name>` for one). Needs Google Chrome and the network; never runs in CI |
| `make run` | build, install and launch on this checkout's simulator. `STATE=<name>` opens it in a designed state |
| `make device` | build and install on a connected iPhone (`DEVICE=<name>`) |

Every simulator test run ends with a time report and appends a line to `.build/test-runs.log`. The simulator tests do not run in CI yet (plan 5): until then `make gate`, run locally, is the evidence.

A package's version changes in `project.yml`. Then build once without the Makefile's `XCB_FLAGS`, copy `Apex.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved` over `Package.resolved` and commit it.

## Module dependencies

| Module | Depends on |
|---|---|
| `Core` | nothing |
| `ScreenModels` | nothing (`Core` once it uses it) |
| `TestSupport` | `ScreenModels` |
| `Screens` | `Core`, `ScreenModels`, `TestSupport` |

A module exists only once it has code. `Training` and `Store` arrive with the plans that need them. `Screens` takes `TestSupport` for its previews, and the app for `-State`; a Release build ignores that flag.

## Launch flags

Debug builds only; a Release build ignores them. Parsed in `Core/Launch/LaunchOptions.swift`.

| Flag | Does |
|---|---|
| `-UITest` | no animations |
| `-State <name>` | opens the app in a designed state (`make run STATE=`). An unknown name stops the app with a message listing the known ones |

## Import line

Only `Screens` imports SwiftUI or UIKit. Every other module builds for macOS, so its tests run in `make fast`. Two checks hold the line:

- The `no_ui_imports_in_mac_modules` lint rule rejects either import, in any spelling, in every module but `Screens`. It goes by path and names no modules, so a new module is covered from its first file.
- The Mac slice (`make fast`, also in CI) compiles for macOS every module the `Fast` scheme's tests reach, so UIKit or an iOS-only API fails to build. SwiftUI compiles on macOS: only the lint rule catches that one.

A new test target must be added to the `Fast` scheme in `project.yml` (`ScreensTests` is the one exception: it runs on the simulator). `make fast` fails until it is.

## Where tests go

- **Mac tests prove behaviour:** every rule, state change and edge case, through the screen models and domain logic. They run in `make fast`, in milliseconds each.
- **Pictures prove appearance:** one image per designed state, on the simulator. About 0.9 s each.
- **Journeys prove wiring:** the real app, launched, with a real database on disk, moving between screens, killed and restored. Most screens add none. The one today takes about 6 s.

A behaviour is tested through its screen model on the Mac, never by a journey.

Which simulator run, when (wall time measured on 2026-11-27 with 8 tests):

| When | Run | Took |
|---|---|---|
| Fixing one test | `make retest ONLY=…` | 4 s for a picture class, 11 s for the journey |
| End of a task | `make affected` | 12 to 16 s |
| Before a pull request | `make gate` | 16 s |

Simulator tests are XCTest classes; Mac tests use Swift Testing. A UI test launches with `launchApp()` (`-UITest`) and waits for a condition with `appears(within:)`, `disappears(within:)` or `satisfies(_:within:)`, never for a fixed time.

## Designed states

A state Ben designed has one name, such as `home.noProgram`. `design/states.json` maps the name to its demo page and the switches that reach it, and `make mocks` writes `design/mocks/<name>.png`: 390 × 844 points at 3×. The simulator is 402 × 874 points, so mock and app are compared side by side, never pixel-matched. A state that clicks cannot reach gets a hand-captured image in the same folder, named in the commit.

The Swift side is `DesignedState` in `TestSupport`: one case per state, with the same name, that builds the `AppModel` the mock shows. That one value drives `make run STATE=`, the state's picture and its preview. To add a state:

1. Add it to `design/states.json` and run `make mocks`.
2. Add the `DesignedState` case and its `appModel()`. `make fast` fails until the state has a mock image and its screen has a picture test class.
3. A new screen adds `SnapshotTests/<Screen>PictureTests.swift`, one test that calls `SnapshotHost.assertStates(ofScreen:)`, and its rows in `scripts/test-map.txt`. A new state on an existing screen needs no test change.
4. `make snapshots-record`, then `make retest ONLY=ApexSnapshotTests/<Screen>PictureTests`, then `make compare STATE=<name>` and open the image.

A reference is `SnapshotTests/__Snapshots__/<Screen>PictureTests/state.<name>.png`, with the dot in the name written as a hyphen. A changed reference is named in its commit with the reason. Record a reference on a freshly booted simulator (`xcrun simctl shutdown "<simulator>"`, then `make snapshots-record`): fresh simulators draw the same picture byte for byte, and CI's is always fresh. A picture is compared at a perceptual precision of 0.98, through `CPUImageMatch` first (its file says why), with the app's animations off.

## Keeping it fast

- The simulator tests have a ceiling on their total test time, in `scripts/gate-ceiling.txt`, with how it was recorded. Today it is recorded from Ben's Mac; plan 5 records it again from CI.
- Every simulator run prints the report: the total, its share of the ceiling and the five slowest tests. Over 80% it warns. Over the ceiling it says so, and fails only when `test-times.py` is given `--enforce`: no local run passes that flag, and CI will from plan 5.
- A run is never green when no test ran, a test did not pass or was skipped, or one test took over 60 s.
- Over the ceiling: speed a test up, move the behaviour to a Mac test, or remove the test. Raising the ceiling needs Ben.
- Keep the simulator booted: the test targets boot it and leave it running, because a run that finds it shut down takes about 40 s longer.

## Definition of done

**A task is done** when:
1. the app builds (`make build`),
2. `make fast` passes,
3. lint and format are clean (`make lint`),
4. for a task that touches a screen, `make affected` is green,
5. for anything visual, the hand-off lists the image paths the agent actually opened. For a designed state that includes its `make compare` image.

**A branch is done** when CI is green on its pull request and the second agent's review has passed.

Anything not checked is stated plainly in the hand-off ("didn't verify X because Y").

## Merging

A pull request merges without Ben when all of these hold:

1. Every CI check is green. None skipped, none re-run until it passed by luck. A pull request with no checks reported is not green.
2. The second agent's review has passed.
3. The hand-off lists the images the agent opened, and states plainly anything it didn't verify.

It merges with a merge commit and the branch is deleted. While CI runs, the next segment may start on top of the open branch.

What still waits for Ben:

- Any change to lint config, hook config, test tolerances or the time ceiling. That pull request stays open until he says yes.
- Anything that touches production: the Worker, its database, secrets.
- Force-pushes and anything that rewrites `main`. Never done.

## When the mock doesn't cover it

Build what the design rules imply, open a GitHub issue labelled `needs-ben` with the default taken, and keep going. The same goes for anything only Ben can judge, such as how a motion feels on the phone. Work never waits on the answer.

## Hard rules

- Lint config, hook config, test tolerances and the time ceiling change only with Ben's OK. Never widen a threshold to make something pass.
- Never hand-edit the generated `.xcodeproj` or any `Generated/` file; change the source (`project.yml`, `design/tokens.json`) and `make generate`.
- Colours, type and animations only from the generated tokens; lint rejects raw ones in `Screens` outside `DesignSystem/`. Spacing and radii too: no bare layout number where a token exists, and a measurement with no token is a named private constant that cites its design source.
- `design/export/` is never edited by hand; `design/export/APEX README.md` is the design system and `_ds/` is stale. `design/export/CLAUDE.md` came with the export: its design rules hold here, its instructions for recording decisions are for the design tool and are not followed in this repo.
- Only options stamped Locked count; the highest turn wins; where a demo and a Motion tile differ the tile is right.
- No shadows.
- Never bypass git hooks: no `--no-verify`, no `git commit -n` (or any short-flag cluster containing `n`), no `-c core.hooksPath=…`. The Bash guard blocks these, and any Bash command whose non-message text contains them. If the pre-commit hook fails, fix the cause; never skip it.
- Every new piece of logic gets unit tests; every bug fix gets a regression test.
- iPhone, portrait, dark only, English only. No `#available` branches (iOS 27 minimum).
- No accessibility work: no VoiceOver labels, Reduce Motion paths, Dynamic Type handling or audits. An accessibility identifier is added only where a journey needs one.
- One pull request touches one side. Nothing under `apex-rn/` changes in an iOS pull request.
- Swift 6 language mode, Approachable Concurrency. Banned: `Task.detached`, `@unchecked Sendable`, disabling concurrency checking.
- `package` access between package modules; `public` only for what the app or tests use.
- User-facing copy uses middots (" · ") and never em dashes.
- Log with `os.Logger` (subsystem `com.cadre.apex`, category = module); never `print()`. `try?` only with a comment saying why.
- One primary type per file. Inject collaborators; no singletons. Protocols only at real seams.
- Third-party packages are pinned with `exact:`.
- Periphery suppressions are per declaration (`// periphery:ignore - <reason>`), never file- or config-wide.

## Read next

- The approved design: `docs/superpowers/specs/2026-11-27-ios-agentic-foundations-design.html` (repo root)
- Where the work stands: `docs/superpowers/handoff.md` (repo root)
- The design folder, and what to do when a new export arrives: `design/README.md`
