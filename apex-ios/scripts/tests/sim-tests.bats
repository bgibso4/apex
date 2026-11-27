#!/usr/bin/env bats
bats_require_minimum_version 1.5.0

# scripts/sim-tests.sh: what each mode runs, build once, the retest check, the run log and the time report.
# xcodebuild, xcresulttool and the affected script are stubs. Every `[[ ]]` below ends in `|| false`: on macOS's bash 3.2 a failing `[[ ]]` that is
# not a test's last command does not fail the test.
SCRIPTS="$BATS_TEST_DIRNAME/.."

setup() {
  export TMPDIR="$BATS_TEST_TMPDIR"
  FIX="$BATS_TEST_TMPDIR/repo/apex-ios"
  mkdir -p "$FIX/scripts" "$FIX/SnapshotTests/__Snapshots__/HomePictureTests" "$FIX/docs" "$FIX/bin"
  cp "$SCRIPTS/sim-tests.sh" "$SCRIPTS/build-fingerprint.sh" "$SCRIPTS/test-times.py" "$FIX/scripts/"
  printf '# For the tests.\n100\n' >"$FIX/scripts/gate-ceiling.txt"
  printf 'let a = 1\n' >"$FIX/A.swift"
  printf 'png\n' >"$FIX/SnapshotTests/__Snapshots__/HomePictureTests/home.noProgram.png"
  printf 'notes\n' >"$FIX/docs/notes.md"
  printf '.build/\n' >"$FIX/.gitignore"
  git -C "$FIX/.." init -q -b main
  cd "$FIX"

  # Stub xcodebuild: logs each call. build-for-testing makes the app and exits STUB_BUILD_STATUS;
  # test-without-building logs the record mode it was given and exits STUB_TEST_STATUS.
  export CALLS="$BATS_TEST_TMPDIR/calls"
  cat >"$FIX/bin/xcodebuild" <<'STUB'
#!/usr/bin/env bash
echo "$*" >>"$CALLS"
case " $* " in
*" build-for-testing "*)
  [ "${STUB_BUILD_STATUS:-0}" -eq 0 ] && mkdir -p "$DERIVED/Build/Products/Debug-iphonesimulator/Apex.app"
  exit "${STUB_BUILD_STATUS:-0}" ;;
*" test-without-building "*)
  echo "record=${TEST_RUNNER_SNAPSHOT_TESTING_RECORD:-unset}" >>"$CALLS"
  exit "${STUB_TEST_STATUS:-0}" ;;
esac
STUB
  cat >"$FIX/bin/affected" <<'STUB'
#!/usr/bin/env bash
printf '%s' "${STUB_AFFECTED:-}"
STUB
  # Stub xcresulttool: prints the test results of STUB_RESULTS, one of the time report's fixtures.
  cat >"$FIX/bin/xcresulttool" <<'STUB'
#!/usr/bin/env bash
cat "$TIMES/${STUB_RESULTS:-seven}.json"
STUB
  chmod +x "$FIX/bin/xcodebuild" "$FIX/bin/affected" "$FIX/bin/xcresulttool"
  export TIMES="$SCRIPTS/tests/fixtures/times"
  export APEX_XCODEBUILD="$FIX/bin/xcodebuild" APEX_AFFECTED_CMD="$FIX/bin/affected" APEX_BEAUTIFY=cat
  export APEX_XCRESULTTOOL="$FIX/bin/xcresulttool"
  export DERIVED="$FIX/.build/DerivedData" PROJECT=P.xcodeproj SIM_DEST="platform=iOS Simulator,name=X"
  unset ONLY BASE
}

sim() { run --separate-stderr scripts/sim-tests.sh "$@"; }
called() { grep -q -- "$1" "$CALLS" 2>/dev/null; }

@test "gate builds once, then tests without building, everything" {
  sim gate
  [ "$status" -eq 0 ]
  [ "$(grep -c build-for-testing "$CALLS")" -eq 1 ]
  sed -n 1p "$CALLS" | grep -q build-for-testing
  sed -n 2p "$CALLS" | grep -q test-without-building
  sed -n 2p "$CALLS" | grep -q -- "-resultBundlePath .build/results/gate.xcresult"
  called "record=unset"
  run ! called -only-testing
}

@test "affected runs only the classes the map gives" {
  STUB_AFFECTED="$(printf 'ApexUITests/A\nApexSnapshotTests/B')" sim affected
  [ "$status" -eq 0 ]
  called "-only-testing:ApexUITests/A"
  called "-only-testing:ApexSnapshotTests/B"
}

@test "ALL among the classes still runs everything" {
  STUB_AFFECTED="$(printf 'ApexUITests/A\nALL')" sim affected
  [ "$status" -eq 0 ]
  called test-without-building
  run ! called -only-testing
  [ "$(cut -f3 .build/test-runs.log)" = ALL ]
}

@test "affected with nothing to run says so and builds nothing" {
  STUB_AFFECTED="" sim affected
  [ "$status" -eq 0 ]
  [[ "$output" == *"nothing to run"* ]] || false
  [ ! -e "$CALLS" ]
}

@test "retest runs without building" {
  sim gate
  rm "$CALLS"
  ONLY="ApexUITests/A/testB" sim retest
  [ "$status" -eq 0 ]
  run ! called build-for-testing
  called test-without-building
  called "-only-testing:ApexUITests/A/testB"
}

@test "retest with no ONLY runs the affected classes" {
  sim gate
  rm "$CALLS"
  STUB_AFFECTED="ApexUITests/C" sim retest
  [ "$status" -eq 0 ]
  called "-only-testing:ApexUITests/C"
}

@test "retest refuses when the sources changed since the last build" {
  sim gate
  rm "$CALLS"
  printf 'let a = 2\n' >A.swift
  ONLY="ApexUITests/A" sim retest
  [ "$status" -eq 2 ]
  [[ "$stderr" == *"changed since the last build"* ]] || false
  [[ "$stderr" == *"make affected"* ]] || false
  [ ! -e "$CALLS" ]
}

@test "retest refuses when there is no build" {
  ONLY="ApexUITests/A" sim retest
  [ "$status" -eq 2 ]
  [[ "$stderr" == *"make affected"* ]] || false
  [ ! -e "$CALLS" ]
}

@test "a changed reference image or doc does not make the build stale" {
  sim gate
  rm "$CALLS"
  printf 'new png\n' >SnapshotTests/__Snapshots__/HomePictureTests/home.noProgram.png
  printf 'more notes\n' >>docs/notes.md
  ONLY="ApexSnapshotTests/HomePictureTests" sim retest
  [ "$status" -eq 0 ]
  run ! called build-for-testing
}

@test "record builds, then rewrites only the pictures that fail or are missing" {
  sim record
  [ "$status" -eq 0 ]
  sed -n 1p "$CALLS" | grep -q build-for-testing
  called "-only-testing:ApexSnapshotTests"
  called "record=failed"
  scripts/build-fingerprint.sh current
}

@test "record takes ONLY to narrow it" {
  ONLY="ApexSnapshotTests/HomePictureTests" sim record
  called "-only-testing:ApexSnapshotTests/HomePictureTests"
  run ! called "-only-testing:ApexSnapshotTests "
}

@test "a failed build records no fingerprint and runs no test" {
  sim gate
  STUB_BUILD_STATUS=65 sim gate
  [ "$status" -eq 65 ]
  run scripts/build-fingerprint.sh current
  [ "$status" -ne 0 ]
  [ "$(grep -c test-without-building "$CALLS")" -eq 1 ]
}

@test "a failed test fails the run, and the build stays good for retest" {
  STUB_TEST_STATUS=65 sim gate
  [ "$status" -eq 65 ]
  scripts/build-fingerprint.sh current
}

@test "every run appends one line to the run log" {
  sim gate
  ONLY="ApexUITests/A" sim retest
  [ "$(wc -l <.build/test-runs.log | tr -d ' ')" -eq 2 ]
  [ "$(awk -F'\t' '{ print NF }' .build/test-runs.log | sort -u)" = 6 ]
  [ "$(sed -n 1p .build/test-runs.log | cut -f2,3)" = "$(printf 'gate\tALL')" ]
  [ "$(sed -n 2p .build/test-runs.log | cut -f2,3,4,6)" = "$(printf 'retest\tApexUITests/A\t0\t0')" ]
  [[ "$output" == *"test-runs: retest"* ]] || false
}

@test "a run that ran tests ends with the time report" {
  sim gate
  [ "$status" -eq 0 ]
  [[ "$output" == *"test time: 28.0 s of a 100 s ceiling (28%) · 7 tests"* ]] || false
  ONLY="ApexUITests/A" sim retest
  [[ "$output" == *"test time: 28.0 s"* ]] || false
}

@test "a run whose report fails is not green, though xcodebuild passed" {
  STUB_RESULTS=empty sim gate
  [ "$status" -eq 1 ]
  [[ "$output" == *"error: no test ran"* ]] || false
  [ "$(cut -f6 .build/test-runs.log)" = 1 ]
}

@test "a failed run keeps xcodebuild's status and still prints the report" {
  STUB_TEST_STATUS=65 STUB_RESULTS=failed sim gate
  [ "$status" -eq 65 ]
  [[ "$output" == *"did not pass (Failed)"* ]] || false
}

@test "an unknown mode is a usage error" {
  sim full
  [ "$status" -eq 64 ]
  [[ "$stderr" == *"usage"* ]] || false
  [ ! -e "$CALLS" ]
}
