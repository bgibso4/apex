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
