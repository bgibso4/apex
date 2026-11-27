# iOS Design Import, Tokens and Mocks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put Ben's design export in `apex-ios/design/`, generate the app's design tokens from it, and render a reference image for a named state with `make mocks`.

**Architecture:** Three small tools behind the Makefile, each with bats tests. `design-import` replaces `design/export/` from a zip. `generate` turns `design/tokens.json` into one Swift file that views read; lint rejects raw colours, fonts and animations outside it. `mocks` serves `apex-ios/` on a local port, loads a demo page in a 390 × 844 frame, clicks the demo's own switches to reach a state, and has headless Chrome write the image.

**Tech Stack:** Python 3 (the system one, run with `-I`) for the zip and the local server, a Swift script for the token generator, headless Google Chrome, bats, SwiftLint custom rules.

**Spec:** `docs/superpowers/specs/2026-11-27-ios-agentic-foundations-design.html` (section "Mocks"; "One catalog of designed states" in "Tests"; build-order step 4). This is plan 3 of 5. Plan 4 is the first screen with `affected`, `retest`, `gate`, `compare`, `frames`, the time report and the ceiling; plan 5 is the simulator gate in CI.

**Read first:** `apex-ios/AGENTS.md`, then `docs/superpowers/handoff.md`.

**Template:** `~/projects/filing-cabinet/scripts/generate-tokens.swift` is the generator to port and cut down. Nothing else here has a template.

## Global Constraints

- Everything this plan creates is under `apex-ios/`. No file under `apex-rn/`, `workers/`, `.claude/` or `.github/` changes.
- The export is `~/Desktop/Home screen redesign brief-project.zip`: 462 entries, 162 MB, of which `shots/` is 355 images and 140 MB. Without `shots/` it is 100 files and 21.1 MB. `shots/` never enters git.
- Three entry names contain `·` and are stored without the UTF-8 flag. Decode an unflagged name as CP437 bytes read as UTF-8; plain `unzip` stops on them.
- `design/export/` is never edited by hand. A new export arrives only through `make design-import`.
- The design system that counts is `design/export/APEX README.md`. The copy under `design/export/_ds/` is stale (it still has muted text at `#55575F`); never read values from it.
- The export's own rules hold (`design/export/CLAUDE.md`): only options stamped Locked count, the highest turn wins, and where a demo and a Motion tile differ the tile is right.
- Dark only: one value per colour. No asset catalog and no light variants.
- No Dynamic Type: type tokens are fixed sizes. Numerals are always tabular.
- No accessibility work. iPhone, portrait, English, iOS 27.0 minimum, no `#available`.
- Reference images are 1170 × 2532 pixels: the mock's 390 × 844 points at 3×. The simulator is 402 × 874 points, so mock and app are compared side by side, never pixel-matched.
- `make mocks` needs network: the demos load React 18.3.1 and Babel from unpkg at run time. It never runs in CI; the images are committed.
- No third-party package and no new brew tool. Chrome is found at `$CHROME`, else `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.
- Hook config (`.claude/settings.json`, `scripts/hooks/`) does not change. The lint rules added in Task 3 are the approved design's own build step ("a lint rule rejects raw values"); see "Open with Ben" in the hand-off note for how that pull request merges.
- No em dashes in new prose; middots as separators.
- Pushing, opening the pull request and merging on green CI are approved for this effort. Merge with a merge commit and delete the branch.

## Review Focus

1. **A re-import where the new export dropped a file.** The old file must be gone afterwards: import replaces the folder, it does not merge into it. Pinned by Task 1 (bats: "a second import removes files the new export no longer has").
2. **A zip entry that points outside the folder** (`../x`, an absolute path). Nothing is written anywhere and the import fails naming the entry. Pinned by Task 1 (bats: "an entry that escapes the folder is refused and nothing is written").
3. **A token the generator does not understand** (an unknown key, a colour that is not 6 or 8 hex digits, an unknown curve). The generator fails naming it and leaves the existing output untouched; it never drops a token silently. Pinned by Task 2 (bats: the three "fails on" tests).
4. **A demo that did not render, or a switch label that no longer exists after a re-import.** `make mocks` fails naming the state and leaves the committed image as it was; a blank or half-reached image never replaces a reference. Pinned by Task 4 (bats: "a missing switch fails, names the state and keeps the old image", "a page that never renders fails").
5. **`tokens.json` changed without regenerating, or `Tokens.swift` edited around the guard.** CI fails on the difference. Pinned by Task 2 step 8 (the drift check and its probe).

## File Structure

```
apex-ios/
  design/
    README.md                what this folder is and its four rules
    export/                  the export as imported (100 files); replaced whole by make design-import
    tokens.json              the token source, written from export/APEX README.md
    states.json              the mock side of the state catalog: state name, demo page, switches to click
    mocks/<state>.png        generated reference images, committed
  scripts/
    design-import.py         zip to design/export/
    generate-tokens.swift    tokens.json to Tokens.swift
    render-mocks.py          states.json to design/mocks/
    mock-frame.html          the page Chrome loads: one frame, the clicks, a result in the title
    tests/                   scripts.bats and its fixtures
    lint-fixtures/ lint-negatives/   new fixtures for the three raw-value rules
  Packages/ApexKit/Sources/Screens/DesignSystem/Generated/Tokens.swift   generated, committed
```

---

### Task 1: Import the export

**Files:**
- Create: `apex-ios/scripts/design-import.py`, `apex-ios/scripts/tests/scripts.bats`, `apex-ios/design/README.md`, `apex-ios/design/export/**` (by running the tool)
- Modify: `apex-ios/Makefile`

**Interfaces:**
- Produces: `scripts/design-import.py ZIP DEST`. Exit 0 and one line `imported N files, M skipped (shots/)`; exit 1 with `error: …` on stderr.
- Produces: make targets `design-import` (`ZIP=` required) and `test-scripts` (`bats scripts/tests`); `test-scripts` joins `ci-checks` after `test-hooks`.

- [ ] **Step 1: Branch**

```bash
git checkout main && git pull && git checkout -b feat/ios-design-import docs/ios-design-import-plan
make -C apex-ios setup && /usr/bin/time -p make -C apex-ios fast
```

Note the warm `make fast` time (it was 1.6 to 1.9 s when plan 2 merged). Task 2 compares against it.

- [ ] **Step 2: Write the failing tests**

`scripts/tests/scripts.bats`. A helper builds a fixture zip with Python's `zipfile` in `$BATS_TEST_TMPDIR`. Every `[[ ]]` ends in `|| false` (see the note at the top of `scripts/hooks/tests/hooks.bats`).

```
@test "import writes every entry except shots/"
  # zip: a.html, app/b.html, shots/c.png  ->  DEST has a.html and app/b.html, no shots; output "imported 2 files, 1 skipped (shots/)"
@test "an entry name stored as CP437 comes out as UTF-8"
  # entry written with the bytes of "Demo · Ended.html" and flag bit 0x800 clear  ->  DEST/"Demo · Ended.html" exists
@test "a second import removes files the new export no longer has"
  # import zip1 (a.html, old.html), then zip2 (a.html)  ->  old.html is gone
@test "an entry that escapes the folder is refused and nothing is written"
  # zip with ok.html and ../evil.html, DEST already holding keep.html
  # ->  exit 1, stderr names ../evil.html, keep.html still there, no ok.html, no evil.html beside DEST
@test "a missing zip fails with a message"
```

- [ ] **Step 3: Run them and watch them fail**

Run: `bats apex-ios/scripts/tests`
Expected: 5 failures, the script does not exist.

- [ ] **Step 4: Write `design-import.py`**

Signature in Interfaces. Order matters for Review Focus 1 and 2: read and check every entry name first; then extract into a new temporary folder beside `DEST`; only then replace `DEST` with it. Skip directory entries and anything under `shots/`. Refuse a name that is absolute or has a `..` part. Python standard library only.

- [ ] **Step 5: Run the tests, add the make targets, import the real export**

Makefile: `design-import` fails with a usage line when `ZIP` is empty, else runs `python3 -I scripts/design-import.py "$(ZIP)" design/export`. Add `test-scripts` and put it in `ci-checks`.

```bash
make -C apex-ios test-scripts
make -C apex-ios design-import ZIP="$HOME/Desktop/Home screen redesign brief-project.zip"
find apex-ios/design/export -type f | wc -l
du -sh apex-ios/design/export
ls apex-ios/design/export | grep -c '·'
git status --short --ignored apex-ios/design/export | grep '^!!' ; echo "ignored files: exit $?"
```

Expected: 5 tests pass; "imported 100 files, 355 skipped (shots/)"; 100 files; about 21 MB; 3 names with a middot; no ignored file (exit 1 from grep). An ignored file would mean a root or `apex-ios` ignore rule is silently dropping part of the export: narrow the rule's cause, never the export.

- [ ] **Step 6: Write `design/README.md`**

Under 30 lines. What each of `export/`, `tokens.json`, `states.json` and `mocks/` is; the four rules (never edit `export/`; `APEX README.md` is the design system and `_ds/` is stale; the export's own rules, quoted from the Global Constraints above; `shots/` is left out, so Explorations pages show missing images); the two commands (`make design-import ZIP=`, `make mocks`).

- [ ] **Step 7: Commit**

```bash
git add apex-ios && git commit -m "feat(ios): design-import and the design export in apex-ios/design"
```

### Task 2: Tokens

**Files:**
- Create: `apex-ios/design/tokens.json`, `apex-ios/scripts/generate-tokens.swift`, `apex-ios/Packages/ApexKit/Sources/Screens/DesignSystem/Generated/Tokens.swift` (generated)
- Modify: `apex-ios/Makefile`, `apex-ios/scripts/tests/scripts.bats`, `apex-ios/Packages/ApexKit/Sources/Screens/RootScreen.swift`

**Interfaces:**
- Produces: `swift scripts/generate-tokens.swift [INPUT [OUTPUT]]`, defaulting to `design/tokens.json` and the `Generated/Tokens.swift` path above. Deterministic: a second run changes nothing.
- Produces, in module `Screens` (internal): `enum Tokens` with nested `Color` (`SwiftUI.Color`), `Typography` (`Font`, plus `<name>Tracking: CGFloat` where a style has tracking), `Spacing`, `Radius`, `Size` (all `CGFloat`), and `Motion` (`Animation`) with nested `Duration` (`TimeInterval`) and `Distance` (`CGFloat`). A token named `card-top` becomes `cardTop`.
- Produces: `make generate` runs the generator, then XcodeGen. `ci-checks` starts with `generate` and fails when the generated file differs from the committed one.

`tokens.json` is APEX's own format, six objects keyed by token name:

| Object | Value | Becomes |
|---|---|---|
| `color` | `"#RRGGBB"` or `"#RRGGBBAA"` | `Color(.sRGB, red:green:blue:opacity:)` |
| `type` | `{"size": 34, "weight": 800, "tracking": -0.5}` (tracking optional) | `Font.system(size:weight:).monospacedDigit()`; weights 400 500 600 700 800 only |
| `spacing`, `radius`, `size` | a number, in points | `CGFloat` |
| `motion.animation` | `{"curve": "easeOut" \| "easeInOut" \| "linear" \| "spring" \| "bezier", "duration": seconds, "bounce": n, "control": [x1, y1, x2, y2]}`; `bounce` only with `spring`, `control` only with `bezier` | `Animation` |
| `motion.duration` | seconds | `TimeInterval` |
| `motion.distance` | points | `CGFloat` |

The first values, all from `design/export/APEX README.md` (sections Color, Type, Shape and spacing, Actions, Motion):

- **color:** `field-base` #090A0C · `field-mid` #0C0E11 · `halo` #141A22 · `card-top` #14161B · `card-base` #0E1013 · `border` #20232A · `border-top` #2C3039 · `text` #EDEEF0 · `text-secondary` #8F9098 · `text-muted` #7C7E86 · `accent` #659BC8 · `on-accent` #0B0C0E · `moss` #6CA383 · `accent-tint` #659BC81A · `moss-tint` #6CA3831A · `tonal-fill` #EDEEF00F
- **type** (size/weight, tracking): `hero-numeral` 34/800 −0.5 · `tab-title` 28/800 · `record-large` 30/800 −0.5 · `readout` 24/800 −0.3 · `tile-day` 18/700 · `screen-title` 17/700 · `button` 15/700 · `record-value` 15/700 · `card-name` 14/700 · `button-secondary` 14/600 · `value` 13/600 · `helper` 12/500 · `body` 11/400 · `eyebrow` 11/700 +0.6 · `graph-label` 10/400 · `graph-block` 9.5/400
- **spacing:** `screen-padding` 20 · `card-padding-vertical` 14 · `card-padding-horizontal` 16 · `card-gap` 12 · `section-label-gap` 8 · `section-gap` 24
- **radius:** `card` 10 · `nested` 6 · `pill` 999
- **size:** `button-primary` 50 · `button-tonal` 44 · `tap-target` 44
- **motion.animation:** `quick` easeOut 0.18 · `smooth` spring 0.35 bounce 0 · `snappy` spring 0.30 bounce 0.15 · `month-flip` bezier 0.26 control 0.2, 0.8, 0.2, 1 · `content-swap` easeOut 0.24
- **motion.duration:** `toast-hold` 3 · `number-roll` 0.45 · `chart-bars` 0.5 · `chart-bar-stagger` 0.04 · `tint-fade` 0.6
- **motion.distance:** `month-flip` 28 · `toast-rise` 10

The README gives the three timings as ranges (quick 150 to 200 ms, smooth 300 to 350 ms, snappy about 300 ms with a small bounce). The single values above are the ones its locked moments use (180 ms colour fades, 350 ms smooth spring). The bounce of 0.15 is a default Ben has not seen: open a GitHub issue labelled `needs-ben` and `iOS` saying so, and keep going. The workout flow's own moments (Motion section, "Workout flow") are not tokens yet: the segment that builds that screen adds them.

- [ ] **Step 1: Write the failing tests**

Add to `scripts.bats`. A helper writes a small `tokens.json` to `$BATS_TEST_TMPDIR` and runs the generator with both paths.

```
@test "the generator writes every token kind"
  # one token of each kind  ->  output contains, each on its own line:
  #   static let cardTop = SwiftUI.Color(.sRGB, red: 0x14 / 255, green: 0x16 / 255, blue: 0x1B / 255, opacity: 1)
  #   a Font line for heroNumeral with size: 34 and weight: .heavy, and  static let heroNumeralTracking: CGFloat = -0.5
  #   static let cardGap: CGFloat = 12
  #   static let smooth = Animation.spring(duration: 0.35, bounce: 0)
  #   static let toastHold: TimeInterval = 3
@test "an 8-digit colour carries its alpha"
  # "#659BC81A"  ->  the line ends  opacity: 0x1A / 255)
@test "a second run changes nothing"
@test "the generator fails on an unknown key and leaves the output as it was"
  # a type style with "lineHeight"  ->  exit non-zero, stderr names lineHeight, the output file from an earlier run is byte-identical
@test "the generator fails on a colour that is not 6 or 8 hex digits"
@test "the generator fails on an unknown curve"
@test "the committed Tokens.swift passes swift format lint --strict"
```

- [ ] **Step 2: Run them and watch them fail**

Run: `make -C apex-ios test-scripts`
Expected: the 5 import tests pass, the 7 new ones fail.

- [ ] **Step 3: Write `tokens.json` and the generator**

Port the reading helpers, `camelCased`, `write` and the overall shape of filing-cabinet's generator; drop the asset catalog, the symbols, the text-style table and everything light or dark. Read and check the whole file before writing anything (Review Focus 3). The output's first line is `// GENERATED · run make generate. Source: design/tokens.json. Do not edit.` Weight names: 400 `.regular`, 500 `.medium`, 600 `.semibold`, 700 `.bold`, 800 `.heavy`.

- [ ] **Step 4: Wire it in**

- Makefile `generate`: `swift scripts/generate-tokens.swift` before `xcodegen generate --quiet`.
- `ci-checks`: runs `generate` first, then fails with "generated files differ from the committed ones: run make -C apex-ios generate and commit" when `git status --porcelain -- Packages/ApexKit/Sources/Screens/DesignSystem/Generated` prints anything.
- `RootScreen`: the body's colour becomes `Tokens.Color.fieldBase`; delete the comment that said it would.

- [ ] **Step 5: Run everything**

```bash
make -C apex-ios test-scripts
make -C apex-ios generate && git status --short apex-ios
make -C apex-ios lint
make -C apex-ios build && make -C apex-ios run
xcrun simctl io "APEX $(basename "$PWD") iPhone 17" screenshot apex-ios/build/launch-tokens.png
/usr/bin/time -p make -C apex-ios fast
```

Expected: 12 tests pass; `generate` leaves only the new files; lint clean; the app builds and runs. Open `apex-ios/build/launch-tokens.png` with the Read tool: a near-black screen (#090A0C) with the status bar. Compare the warm `make fast` time with Step 1 of Task 1. If the generator adds more than 1 s, make `generate` skip it when `Tokens.swift` is newer than both `tokens.json` and the script, keep `ci-checks` running it always, and say so in the hand-off.

- [ ] **Step 6: Commit**

```bash
git add apex-ios && git commit -m "feat(ios): design tokens generated from design/tokens.json"
```

- [ ] **Step 7: Check the guard and the stop gate already cover this**

```bash
echo '{"tool_input":{"file_path":"'"$PWD"'/apex-ios/Packages/ApexKit/Sources/Screens/DesignSystem/Generated/Tokens.swift"}}' | CLAUDE_PROJECT_DIR="$PWD" apex-ios/scripts/hooks/guard-generated.sh; echo "guard exit $?"
a="$(apex-ios/scripts/hooks/swift-fingerprint.sh)"; printf ' ' >> apex-ios/design/tokens.json; b="$(apex-ios/scripts/hooks/swift-fingerprint.sh)"; git checkout apex-ios/design/tokens.json; [ "$a" != "$b" ] && echo "fingerprint sees tokens.json"
```

Expected: `guard exit 2`; "fingerprint sees tokens.json". Both were built in plan 2; no hook changes.

- [ ] **Step 8: Prove the drift check fails**

Change `card` in `tokens.json` from 10 to 11 without running `generate`, run `make -C apex-ios ci-checks`. Expected: it fails with the "generated files differ" message. Then `git checkout apex-ios/design/tokens.json && make -C apex-ios generate && git status --short` shows nothing.

### Task 3: Lint rejects raw values

**Files:**
- Modify: `apex-ios/.swiftlint.yml`, `apex-ios/scripts/test-lint-rules.sh`
- Create: the fixtures named below under `apex-ios/scripts/lint-fixtures/` and `apex-ios/scripts/lint-negatives/`

**Interfaces:**
- Consumes: `Tokens` from Task 2; the fixture runner from plan 2.
- Produces: custom rules `no_raw_color`, `no_raw_font`, `no_raw_animation`, each applied to `Packages/ApexKit/Sources/Screens/` except `Packages/ApexKit/Sources/Screens/DesignSystem/`, severity error.

- [ ] **Step 1: Write the fixtures and extend the runner**

Runner: add the three rules to its list. A fixture of these rules is linted at `Packages/ApexKit/Sources/Screens/Home`; one named `*_in_design_system` at `Packages/ApexKit/Sources/Screens/DesignSystem`; one named `*_in_core` at `Packages/ApexKit/Sources/Core`. Put these `case` arms before the existing ones.

| Rule | Positive fixtures (one violation each) | Negative fixtures |
|---|---|---|
| `no_raw_color` | `Color(red: 0.1, green: 0.1, blue: 0.1)` · `_named`: `Color.black` · `_style`: `.foregroundStyle(.white)` · `_hex`: `Color(hex: "#090A0C")` | `_token`: `Tokens.Color.fieldBase` and `Color.clear` · `_in_design_system`: the first positive · `_in_core`: a `struct Color` of its own used as `Color.black` |
| `no_raw_font` | `.font(.system(size: 14))` · `_style`: `.font(.title2)` · `_explicit`: `Font.system(size: 14, weight: .bold)` | `_token`: `.font(Tokens.Typography.cardName)` · `_in_design_system`: the first positive |
| `no_raw_animation` | `.animation(.easeOut(duration: 0.2), value: x)` · `_preset`: `.animation(.smooth, value: x)` · `_with`: `withAnimation(.spring(duration: 0.3)) { }` · `_bare`: `withAnimation { }` | `_token`: `withAnimation(Tokens.Motion.smooth) { }` and `.animation(Tokens.Motion.quick, value: x)` · `_in_design_system`: the first positive |

Messages: "Colours come from Tokens.Color (design/tokens.json), never a raw value." · "Type comes from Tokens.Typography (design/tokens.json)." · "Animate only with Tokens.Motion (design/tokens.json)."

- [ ] **Step 2: Run it and watch the positives fail**

Run: `make -C apex-ios test-lint`
Expected: the 11 new positive fixtures print FAIL; the 13 from plan 2 still pass.

- [ ] **Step 3: Write the three rules**

Regexes are yours; the fixtures decide. Spacing and radius numbers get no lint rule (a regex cannot tell a spacing from a count): AGENTS.md carries that one as a review rule in Task 5.

- [ ] **Step 4: Run everything**

```bash
make -C apex-ios test-lint && make -C apex-ios lint
```

Expected: 31 fixtures pass (11 new positives, 7 new negatives, 13 from plan 2); lint is clean on the real sources, which proves `RootScreen` no longer holds a raw colour.

- [ ] **Step 5: Commit**

```bash
git add apex-ios && git commit -m "feat(ios): lint rejects raw colours, fonts and animations outside the design system"
```

### Task 4: `make mocks`

**Files:**
- Create: `apex-ios/scripts/render-mocks.py`, `apex-ios/scripts/mock-frame.html`, `apex-ios/design/states.json`, `apex-ios/design/mocks/home.workoutDay.png`, `apex-ios/design/mocks/home.noProgram.png` (generated), `apex-ios/scripts/tests/fixtures/mock/page.html`, `apex-ios/scripts/tests/fixtures/mock/states.json`
- Modify: `apex-ios/Makefile`, `apex-ios/scripts/tests/scripts.bats`

**Interfaces:**
- Produces: `design/states.json`:

```json
{
  "states": [
    { "name": "home.workoutDay", "page": "design/export/app/home.dc.html" },
    { "name": "home.noProgram", "page": "design/export/app/home.dc.html", "clicks": ["Ended"] }
  ]
}
```

`page` is a path under `apex-ios/`. `clicks` are the exact texts of the demo's own switches, clicked in order. Plan 4's Swift side of the catalog uses the same `name`s.

- Produces: `scripts/render-mocks.py STATES OUT_DIR [NAME…]` (run from `apex-ios/`; no names means every state). Exit 0 and one line per image written; exit 1 with `error: <state>: <reason>` on stderr.
- Produces: make target `mocks` (`STATE=<name>` renders one); `design-import` runs `mocks` after a successful import.

How it works, proved by hand on 2026-11-27 with this export: a page that holds one borderless 390 × 844 `<iframe>` waits for `[data-screen-label]` to appear in the framed document, clicks each named switch (the leaf element whose trimmed text equals the name; the phone-only pages hide the switches with CSS but keep them in the document), waits 600 ms after each, and then sets its own `document.title` to `done`, or to `missing:<text>` or `no-render`. It must be served over HTTP from the same origin as the demo (from `file://` the frame is another origin and cannot be reached), so the script runs `http.server` on `127.0.0.1` with a free port for the length of the run. One Chrome call per state does both jobs:

```
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=390,844 --force-device-scale-factor=3 \
  --virtual-time-budget=10000 --screenshot=<tmp>.png --dump-dom "http://127.0.0.1:<port>/scripts/mock-frame.html?page=/<page>&click=<text>…"
```

The dumped DOM's `<title>` is the result. That run took 0.8 to 0.9 s a state, and two runs gave byte-identical 1170 × 2532 images.

- [ ] **Step 1: Write the failing tests**

The fixture page needs no network: a `<div data-screen-label="x">` filling the page, grey, and a hidden `<span>` with the text `Blue` whose click turns the div blue. The fixture `states.json` has `fixture.grey` (no clicks), `fixture.blue` (`["Blue"]`), `fixture.broken` (`["Nope"]`) and `fixture.empty` (a page with no `data-screen-label`).

```
@test "mocks writes a 1170 x 2532 image for a state"
  # render fixture.grey  ->  OUT/fixture.grey.png exists; sips reports 1170 and 2532
@test "a switch click reaches a different state"
  # render fixture.grey and fixture.blue  ->  the two files differ (cmp)
@test "rendering twice gives the same bytes"
@test "a missing switch fails, names the state and keeps the old image"
  # OUT/fixture.broken.png holds the bytes "old"  ->  exit 1, stderr has "fixture.broken" and "Nope", the file still holds "old"
@test "a page that never renders fails"
  # fixture.empty  ->  exit 1, stderr has "fixture.empty"
@test "an unknown state name fails"
```

- [ ] **Step 2: Run them and watch them fail**

Run: `make -C apex-ios test-scripts`
Expected: the 12 earlier tests pass, the 6 new ones fail.

- [ ] **Step 3: Write `mock-frame.html` and `render-mocks.py`**

As described above. The image is written to a temporary file and moved over the old one only when the title is `done` (Review Focus 4). Stop the server on every exit path. A missing Chrome is `error: Google Chrome not found (set CHROME=…)`.

- [ ] **Step 4: Run the tests and render the real states**

Makefile: `mocks` runs `python3 -I scripts/render-mocks.py design/states.json design/mocks $(STATE)`; `design-import` ends with `$(MAKE) --no-print-directory mocks`.

```bash
make -C apex-ios test-scripts
make -C apex-ios mocks && make -C apex-ios mocks && git status --short apex-ios/design/mocks
```

Expected: 18 tests pass; two images, and the second run changes nothing (`git status` shows them only as new). Open both with the Read tool. `home.workoutDay.png`: the APEX wordmark, a CHECK-IN DUE card, "Upper Strength · Heavy Pull" with a blue Start Workout button, the Recovery and This week cards, the glass tab bar. `home.noProgram.png`: the same, with "No Active Program" and a blue "Choose a program" button in place of the workout card. List both paths in the hand-off.

- [ ] **Step 5: See whether the tests run in CI**

The mocks tests need Chrome on the runner. After the push in Task 5, read the `checks` log: if the six mocks tests fail because Chrome is missing, move them to their own file `scripts/tests/mocks.bats` run by a new `test-mocks` target that `ci-checks` does not call, record it as a ruling, and say in the hand-off that they run locally only. Do not skip them silently inside a test.

- [ ] **Step 6: Commit**

```bash
git add apex-ios && git commit -m "feat(ios): make mocks renders reference images for named states"
```

### Task 5: Rules, then ship

**Files:**
- Modify: `apex-ios/AGENTS.md`, `apex-ios/CLAUDE.md`

- [ ] **Step 1: Update the rules files**

`AGENTS.md`, stating only what is true when this merges:

- **Map:** add `design/` (four lines, from this plan's File Structure), `scripts/design-import.py`, `scripts/generate-tokens.swift`, `scripts/render-mocks.py` with `mock-frame.html`, `scripts/tests/`, and `Sources/Screens/DesignSystem/Generated/`.
- **Commands:** add `design-import ZIP=`, `mocks [STATE=]`, `test-scripts`; `generate` now also writes the tokens; `ci-checks` gains the drift check and `test-scripts`. The "arrive in plans 3 and 4" line loses `mocks` and `design-import`.
- **New section "Designed states":** a state has one name (`home.noProgram`); `design/states.json` maps it to its demo and the switches that reach it; `make mocks` writes `design/mocks/<name>.png`; a state that cannot be reached by clicks gets a hand-captured image in the same folder, named in the commit. The Swift side of the catalog arrives with the first screen.
- **Hard rules, add:** "Colours, type and animations only from the generated tokens; lint rejects raw ones in `Screens` outside `DesignSystem/`. Spacing and radii too: no bare layout number where a token exists, and a measurement with no token is a named private constant that cites its design source." · "`design/export/` is never edited by hand; `design/export/APEX README.md` is the design system and `_ds/` is stale." · "Only options stamped Locked count; the highest turn wins; where a demo and a Motion tile differ the tile is right." · "No shadows."
- **Hard rules, change:** the generated-files rule names both sources: `project.yml` and `design/tokens.json`.
- **Read next:** add `design/README.md`.

`CLAUDE.md`: "Where we are" becomes "Foundation, plan 3 of 5 merged: the design export, tokens and `make mocks`. No product screen exists yet."

Verify: `grep -c '—' apex-ios/AGENTS.md apex-ios/CLAUDE.md apex-ios/design/README.md` prints 0 three times. Commit: `docs(ios): rules for the design folder, tokens and designed states`.

- [ ] **Step 2: Evidence from `ios-verifier`**

One agent: `make -C apex-ios fast`, `make -C apex-ios build`, `make -C apex-ios ci-checks`, each PASS or FAIL with wall times, the bats and fixture counts, and whether `git status --short` is clean afterwards.

- [ ] **Step 3: Push and open the pull request**

```bash
git push -u origin feat/ios-design-import
gh pr create --base main --title "apex-ios: design export, tokens and make mocks" --body-file <the hand-off>
```

The hand-off lists: the make targets added, `make fast` and `ci-checks` times before and after, the three images opened (`apex-ios/build/launch-tokens.png`, the two mocks), the `needs-ben` issue for the snappy bounce, whether the mocks tests ran in CI, and anything not verified.

- [ ] **Step 4: Review**

One fresh reviewer agent on the most capable model reads the branch diff against this plan and the spec's "Mocks" section. Leave `design/export/` out of the diff it reads (`git diff main...HEAD -- . ':!apex-ios/design/export'`); it checks the export only by count and size. Fix what it finds; re-run the affected steps.

- [ ] **Step 5: Merge on green**

Wait for the `checks` job on the last commit (a watch started before the run registers reports "no checks" and exits 0: that is not green). Read its log for the test counts. Then `gh pr merge --merge --delete-branch`, `git checkout main && git pull`.

- [ ] **Step 6: Hand off**

Follow `docs/superpowers/handoff.md`: write plan 4, update the note, report to the lead, stop.
