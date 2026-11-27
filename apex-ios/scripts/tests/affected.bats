#!/usr/bin/env bats
bats_require_minimum_version 1.5.0

# scripts/affected-tests.sh: changed paths to the simulator test classes to run. The fixture is a small repo with
# its own map, so these tests do not move when the real map does; the last test checks the committed map.
SCRIPTS="$BATS_TEST_DIRNAME/.."
AFFECTED="$SCRIPTS/affected-tests.sh"

setup() {
  export TMPDIR="$BATS_TEST_TMPDIR"
  FIX="$BATS_TEST_TMPDIR/repo/apex-ios"
  mkdir -p "$FIX/scripts" "$FIX/UITests" "$FIX/SnapshotTests"
  cat >"$FIX/scripts/test-map.txt" <<'MAP'
# A comment.
*.md NONE
docs/ NONE
scripts/ NONE
Sources/Core/ ALL
Sources/Screens/Home/ AppJourneyTests HomePictureTests
MAP
  printf 'final class AppJourneyTests: XCTestCase {}\n' >"$FIX/UITests/AppJourneyTests.swift"
  printf 'final class HomePictureTests: XCTestCase {}\n' >"$FIX/SnapshotTests/HomePictureTests.swift"
  git -C "$FIX/.." init -q -b main
  git -C "$FIX/.." config user.email t@example.com
  git -C "$FIX/.." config user.name t
  git -C "$FIX/.." add -A
  git -C "$FIX/.." commit -qm base
  git -C "$FIX/.." switch -qc work
  cd "$FIX"
}

# Commits a change to each path given (creating it if needed). Paths are relative to apex-ios/.
change() {
  for path in "$@"; do
    mkdir -p "$(dirname "$path")"
    printf 'changed %s\n' "$RANDOM" >>"$path"
  done
  git add -A . && git commit -qm change
}

affected() { run --separate-stderr "$AFFECTED" "$@"; }

@test "a change under a mapped folder runs that folder's classes" {
  change Sources/Screens/Home/HomeScreen.swift
  affected main
  [ "$status" -eq 0 ]
  [ "$output" = "$(printf 'ApexSnapshotTests/HomePictureTests\nApexUITests/AppJourneyTests')" ]
}

@test "a path no rule matches runs everything" {
  change Sources/Screens/Home/HomeScreen.swift Sources/Elsewhere/New.swift
  affected main
  [ "$status" -eq 0 ]
  [ "$output" = ALL ]
  [[ "$stderr" == *"no rule for Sources/Elsewhere/New.swift"* ]] || false
}

@test "a changed test file runs the classes it declares" {
  change UITests/AppJourneyTests.swift
  affected main
  [ "$output" = "ApexUITests/AppJourneyTests" ]
}

@test "a changed reference image runs its class" {
  change SnapshotTests/__Snapshots__/HomePictureTests/home.noProgram.png
  affected main
  [ "$output" = "ApexSnapshotTests/HomePictureTests" ]
}

@test "an uncommitted change counts" {
  mkdir -p Sources/Screens/Home && printf 'new\n' >Sources/Screens/Home/New.swift
  affected main
  [ "$output" = "$(printf 'ApexSnapshotTests/HomePictureTests\nApexUITests/AppJourneyTests')" ]
}

@test "a deleted test file beside other changes runs everything, and prints nothing else" {
  change Sources/Screens/Home/HomeScreen.swift
  # The deleted class sorts after one that still exists, so that one is found first.
  git rm -q SnapshotTests/HomePictureTests.swift && git commit -qm delete
  affected main
  [ "$status" -eq 0 ]
  [ "$output" = ALL ]
  [[ "$stderr" == *"no test file declares HomePictureTests"* ]] || false
}

@test "a file moved from one screen's folder to another runs both screens' classes" {
  printf 'Sources/Screens/Run/ RunPictureTests\n' >>scripts/test-map.txt
  printf 'final class RunPictureTests: XCTestCase {}\n' >SnapshotTests/RunPictureTests.swift
  mkdir -p Sources/Screens/Home Sources/Screens/Run
  printf 'struct Shared {}\nlet a = 1\nlet b = 2\nlet c = 3\n' >Sources/Screens/Home/Shared.swift
  git add -A . && git commit -qm base2 && git branch -qf main HEAD
  git mv Sources/Screens/Home/Shared.swift Sources/Screens/Run/Shared.swift
  printf 'let d = 4\n' >>Sources/Screens/Run/Shared.swift
  git add -A . && git commit -qm move
  affected main
  [ "$output" = "$(printf 'ApexSnapshotTests/HomePictureTests\nApexSnapshotTests/RunPictureTests\nApexUITests/AppJourneyTests')" ]
}

@test "docs and scripts run nothing" {
  change docs/roadmap.md scripts/frames.sh AGENTS.md
  affected main
  [ "$status" -eq 0 ]
  [ -z "$output" ]
}

@test "a change outside apex-ios runs nothing" {
  mkdir -p ../apex-rn && printf 'x\n' >../apex-rn/app.ts && printf 'x\n' >../untracked.swift
  git add ../apex-rn && git commit -qm outside
  affected main
  [ "$status" -eq 0 ]
  [ -z "$output" ]
}

@test "a changed path with a non-ASCII name is matched by its rule" {
  change "docs/Demo · Ended.html"
  printf 'new\n' >"docs/Demo · Untracked.html"
  affected main
  [ "$status" -eq 0 ]
  [ -z "$output" ]
  [[ "$stderr" == *"docs/Demo · Ended.html → nothing"* ]] || false
  [[ "$stderr" == *"docs/Demo · Untracked.html → nothing"* ]] || false
}

@test "the committed map runs nothing for the lint, format and dead-code configs and .gitignore" {
  cp "$SCRIPTS/test-map.txt" scripts/test-map.txt
  change .swiftlint.yml .swift-format .periphery.yml .gitignore
  affected main
  [ "$status" -eq 0 ]
  [ -z "$output" ]
}

@test "check-map fails on a class that does not exist" {
  printf 'Sources/Screens/Run/ RunPictureTests\n' >>scripts/test-map.txt
  affected --check-map
  [ "$status" -eq 1 ]
  [[ "$output" == *"RunPictureTests"* ]] || false
}

@test "check-map fails on a test class the map leaves out" {
  printf 'final class RunJourneyTests: XCTestCase {}\n' >UITests/RunJourneyTests.swift
  affected --check-map
  [ "$status" -eq 1 ]
  [[ "$output" == *"RunJourneyTests is not in the map"* ]] || false
}

@test "check-map passes on the committed map" {
  cd "$SCRIPTS/.."
  affected --check-map
  [ "$status" -eq 0 ]
}
