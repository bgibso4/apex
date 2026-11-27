# APEX native

A personal strength training app for iPhone. iOS 27 minimum, SwiftUI. One user. Run every command as `make -C apex-ios <target>` from the repo root.

## Map

Paths are under `apex-ios/` unless they start with `/`, which is the repo root.

```
AGENTS.md                      the single copy of the iOS rules (this file)
CLAUDE.md                      @AGENTS.md plus Claude-only notes
Makefile                       the only entry point
project.yml                    XcodeGen source of the generated (gitignored) Apex.xcodeproj
Signing.xcconfig               team and bundle ID
.swiftlint.yml .swift-format .periphery.yml   lint, format and dead-code config
App/ApexApp.swift              @main: reads the launch options, shows RootScreen
Packages/ApexKit/              all logic, one local package (Package.swift)
  Sources/Core/                shared vocabulary and the launch options. Mac-buildable
  Sources/Screens/             SwiftUI views. iOS-only
  Sources/Screens/DesignSystem/Generated/   Tokens.swift, generated from design/tokens.json
  Tests/CoreTests/             Mac tests for Core
design/                        Ben's design export and what is made from it (design/README.md)
  export/                      the export as imported (100 files); replaced whole by `make design-import`
  tokens.json                  the token source, written from export/APEX README.md
  states.json                  the mock side of the state catalog: state name, demo page, switches to click
  mocks/<state>.png            generated reference images, committed
scripts/design-import.py       an export zip to design/export/
scripts/generate-tokens.swift  design/tokens.json to Generated/Tokens.swift
scripts/render-mocks.py        design/states.json to design/mocks/, through mock-frame.html in headless Chrome
scripts/tests/                 bats tests for those three scripts, and their fixtures
scripts/pre-commit             lint, only when apex-ios files are staged
scripts/pre-commit-wrapper     the git hook `make setup` installs: runs pre-commit, passes on a branch without it
scripts/test-lint-rules.sh     fixture tests for the custom lint rules (lint-fixtures/, lint-negatives/)
scripts/hooks/                 Claude Code hooks (see CLAUDE.md) and their bats tests
docs/                          iOS specs, plans and the roadmap. Created with the first product segment
/.claude/settings.json         the hook wiring
/.github/workflows/ios.yml     CI: the checks job
/.github/actions/xcode-setup/  CI: Xcode and tool setup
```

## Commands

`make` is the only entry point. Run `make setup` once per checkout.

| Command | Does |
|---|---|
| `make setup` | check tools, install the git pre-commit hook, create this checkout's simulator, generate the project |
| `make generate` | writes `Generated/Tokens.swift` from `design/tokens.json`, then `Apex.xcodeproj` from `project.yml` (XcodeGen) |
| `make build` | build the app for this checkout's simulator (`APEX <checkout folder> iPhone 17`: an iPhone 17 on iOS 27.0, created on demand; `SIM_DEVICE=` overrides) |
| `make fast` | Mac tests, no simulator. The loop agents live in |
| `make lint` | SwiftLint and swift-format, both strict |
| `make format` | apply swift-format |
| `make unused` | Periphery dead-code scan |
| `make test-lint` | fixture tests for the SwiftLint custom rules |
| `make test-hooks` | bats tests for the hook scripts and the pre-commit script |
| `make test-scripts` | bats tests for the design scripts. The mock tests need Google Chrome |
| `make ci-checks` | everything CI's `checks` job runs: generate, a check that the committed generated files match, lint, hook tests, script tests, lint-rule tests, the Mac tests, Periphery |
| `make design-import ZIP=<path>` | replaces `design/export/` from a new export, lists what changed against git, runs `mocks` |
| `make mocks` | renders `design/mocks/<state>.png` for every state in `design/states.json` (`STATE=<name>` for one). Needs Google Chrome and the network; never runs in CI |
| `make run` | build, install and launch on this checkout's simulator |
| `make device` | build and install on a connected iPhone (`DEVICE=<name>`) |

`affected`, `retest`, `gate`, `compare` and `frames` arrive in plan 4.

## Module dependencies

| Module | Depends on |
|---|---|
| `Core` | nothing |
| `Screens` | `Core` |

A module exists only once it has code. `ScreenModels` and `TestSupport` arrive with the first screen; `Training` and `Store` with the plans that need them.

## Launch flags

Debug builds only; a Release build ignores them. Parsed in `Core/Launch/LaunchOptions.swift`.

| Flag | Does |
|---|---|
| `-UITest` | no animations |

## Import line

Only `Screens` imports SwiftUI or UIKit. Every other module builds for macOS, so its tests run in `make fast`. Two checks hold the line:

- The `no_ui_imports_in_mac_modules` lint rule rejects either import, in any spelling, in every module but `Screens`. It goes by path and names no modules, so a new module is covered from its first file.
- The Mac slice (`make fast`, also in CI) compiles for macOS every module the `Fast` scheme's tests reach, so UIKit or an iOS-only API fails to build. SwiftUI compiles on macOS: only the lint rule catches that one.

A new test target must be added to the `Fast` scheme in `project.yml` (`ScreensTests` is the one exception: it runs on the simulator). `make fast` fails until it is.

## Where tests go

- **Mac tests prove behaviour:** every rule, state change and edge case, through the screen models and domain logic. They run in `make fast`, in milliseconds each.
- **Pictures prove appearance:** one image per designed state, on the simulator.
- **Journeys prove wiring:** the real app, launched, with a real database on disk, moving between screens, killed and restored.

A behaviour is tested through its screen model on the Mac, never by a journey. Pictures and journeys arrive with the first screen; today only the Mac layer exists.

## Designed states

A state Ben designed has one name, such as `home.noProgram`. `design/states.json` maps the name to its demo page and the switches that reach it, and `make mocks` writes `design/mocks/<name>.png`: 390 × 844 points at 3×. The simulator is 402 × 874 points, so mock and app are compared side by side, never pixel-matched. A state that clicks cannot reach gets a hand-captured image in the same folder, named in the commit. The Swift side of the catalog (fixture, picture test, preview, `make run STATE=`) arrives with the first screen and uses the same names.

## Definition of done

**A task is done** when:
1. the app builds (`make build`),
2. `make fast` passes,
3. lint and format are clean (`make lint`),
4. for anything visual, the hand-off lists the image paths the agent actually opened.

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

- Lint config, hook config and test tolerances change only with Ben's OK. Never widen a threshold to make something pass.
- Never hand-edit the generated `.xcodeproj` or any `Generated/` file; change the source (`project.yml`, `design/tokens.json`) and `make generate`.
- Colours, type and animations only from the generated tokens; lint rejects raw ones in `Screens` outside `DesignSystem/`. Spacing and radii too: no bare layout number where a token exists, and a measurement with no token is a named private constant that cites its design source.
- `design/export/` is never edited by hand; `design/export/APEX README.md` is the design system and `_ds/` is stale.
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
