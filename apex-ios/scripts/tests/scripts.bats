#!/usr/bin/env bats

# Tests for the design tools in scripts/. Every `[[ ]]` below ends in `|| false`: on macOS's bash 3.2 a failing
# `[[ ]]` that is not a test's last command does not fail the test.
SCRIPTS="$BATS_TEST_DIRNAME/.."

setup() {
  cd "$BATS_TEST_TMPDIR"
}

# --- design-import ---

# make_zip ZIP NAME…: a zip with one small entry per name.
make_zip() {
  python3 -I -c 'import sys, zipfile
with zipfile.ZipFile(sys.argv[1], "w") as archive:
    for name in sys.argv[2:]:
        archive.writestr(name, "content")' "$@"
}

import_export() { run python3 -I "$SCRIPTS/design-import.py" "$@"; }

@test "import writes every entry except shots/" {
  make_zip export.zip a.html app/b.html shots/c.png
  import_export export.zip dest
  [ "$status" -eq 0 ]
  [ "$output" = "imported 2 files, 1 skipped (shots/)" ]
  [ -f dest/a.html ]
  [ -f dest/app/b.html ]
  [ ! -e dest/shots ]
}

@test "an entry name stored as CP437 comes out as UTF-8" {
  # Written under an ASCII name of the same length, then renamed in the raw bytes: the UTF-8 flag (0x800) stays clear.
  make_zip export.zip "Demo XX Ended.html"
  python3 -I -c 'import pathlib, sys
path = pathlib.Path(sys.argv[1])
path.write_bytes(path.read_bytes().replace(b"Demo XX", "Demo ·".encode()))' export.zip
  import_export export.zip dest
  [ "$status" -eq 0 ]
  [ -f "dest/Demo · Ended.html" ]
}

@test "a second import removes files the new export no longer has" {
  make_zip first.zip a.html old.html
  make_zip second.zip a.html
  import_export first.zip dest
  [ -f dest/old.html ]
  import_export second.zip dest
  [ "$status" -eq 0 ]
  [ -f dest/a.html ]
  [ ! -e dest/old.html ]
}

@test "an entry that escapes the folder is refused and nothing is written" {
  for name in ../evil.html /evil.html; do
    rm -rf work && mkdir -p work/dest && touch work/dest/keep.html
    make_zip export.zip ok.html "$name"
    import_export export.zip work/dest
    [ "$status" -eq 1 ]
    [[ "$output" == *"error: $name"* ]] || false
    [ "$(ls -A work)" = dest ]
    [ "$(ls -A work/dest)" = keep.html ]
  done
}

@test "a missing zip fails with a message" {
  import_export nope.zip dest
  [ "$status" -eq 1 ]
  [[ "$output" == error:*nope.zip* ]] || false
  [ ! -e dest ]
}

# --- generate-tokens ---

# One token of each kind.
TOKENS='{
  "color": { "card-top": "#14161B", "accent-tint": "#659BC81A" },
  "type": { "hero-numeral": { "size": 34, "weight": 800, "tracking": -0.5 }, "body": { "size": 9.5, "weight": 400 } },
  "spacing": { "card-gap": 12 },
  "radius": { "card": 10 },
  "size": { "tap-target": 44 },
  "motion": {
    "animation": {
      "quick": { "curve": "easeOut", "duration": 0.18 },
      "smooth": { "curve": "spring", "duration": 0.35, "bounce": 0 },
      "month-flip": { "curve": "bezier", "duration": 0.26, "control": [0.2, 0.8, 0.2, 1] }
    },
    "duration": { "toast-hold": 3 },
    "distance": { "month-flip": 28 }
  }
}'

# generate [JSON]: runs the generator on JSON (default: $TOKENS), from tokens.json to Tokens.swift in the test folder.
generate() {
  printf '%s\n' "${1:-$TOKENS}" >tokens.json
  run swift "$SCRIPTS/generate-tokens.swift" tokens.json Tokens.swift
}

# has_line TEXT: Tokens.swift has a line that is exactly TEXT after its indentation.
has_line() { grep -qxE " *$(printf '%s' "$1" | sed 's/[][().*+?^$|\\/]/\\&/g')" Tokens.swift; }

# fails_untouched JSON TEXT: the generator rejects JSON, names TEXT, and leaves an earlier Tokens.swift as it was.
fails_untouched() {
  generate
  cp Tokens.swift before.swift
  generate "$1"
  [ "$status" -ne 0 ]
  [[ "$output" == error:*"$2"* ]] || false
  cmp Tokens.swift before.swift
}

@test "the generator writes every token kind" {
  generate
  [ "$status" -eq 0 ]
  [ "$(head -1 Tokens.swift)" = "// GENERATED · run make generate. Source: design/tokens.json. Do not edit." ]
  has_line "static let cardTop = SwiftUI.Color("
  has_line ".sRGB, red: 0x14 / 255, green: 0x16 / 255, blue: 0x1B / 255, opacity: 1)"
  has_line "static let heroNumeral = Font.system(size: 34, weight: .heavy).monospacedDigit()"
  has_line "static let heroNumeralTracking: CGFloat = -0.5"
  has_line "static let body = Font.system(size: 9.5, weight: .regular).monospacedDigit()"
  run grep bodyTracking Tokens.swift
  [ "$status" -eq 1 ]
  has_line "static let cardGap: CGFloat = 12"
  has_line "static let card: CGFloat = 10"
  has_line "static let tapTarget: CGFloat = 44"
  has_line "static let quick = Animation.easeOut(duration: 0.18)"
  has_line "static let smooth = Animation.spring(duration: 0.35, bounce: 0)"
  has_line "static let monthFlip = Animation.timingCurve(0.2, 0.8, 0.2, 1, duration: 0.26)"
  has_line "static let toastHold: TimeInterval = 3"
  has_line "static let monthFlip: CGFloat = 28"
}

@test "an 8-digit colour carries its alpha" {
  generate
  has_line ".sRGB, red: 0x65 / 255, green: 0x9B / 255, blue: 0xC8 / 255, opacity: 0x1A / 255)"
}

@test "a second run changes nothing" {
  generate
  cp Tokens.swift first.swift
  generate
  cmp Tokens.swift first.swift
}

@test "the generator fails on an unknown key and leaves the output as it was" {
  fails_untouched "${TOKENS/\"tracking\": -0.5/\"lineHeight\": 40}" lineHeight
}

@test "the generator fails on a colour that is not 6 or 8 hex digits" {
  fails_untouched "${TOKENS/\#14161B/#14161}" "#14161"
}

@test "the generator fails on an unknown curve" {
  fails_untouched "${TOKENS/easeOut/bounceOut}" bounceOut
}

@test "the committed Tokens.swift passes swift format lint --strict" {
  cd "$SCRIPTS/.."
  generated=Packages/ApexKit/Sources/Screens/DesignSystem/Generated/Tokens.swift
  [ -f "$generated" ]
  swift format lint --strict "$generated"
}
