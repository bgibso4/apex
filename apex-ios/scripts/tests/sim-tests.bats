#!/usr/bin/env bats
bats_require_minimum_version 1.5.0

# scripts/sim-tests.sh: what each mode runs, build once, the retest check and the run log. xcodebuild and the
# affected script are stubs. Every `[[ ]]` below ends in `|| false`: on macOS's bash 3.2 a failing `[[ ]]` that is
# not a test's last command does not fail the test.
SCRIPTS="$BATS_TEST_DIRNAME/.."

setup() {
  export TMPDIR="$BATS_TEST_TMPDIR"
  FIX="$BATS_TEST_TMPDIR/repo/apex-ios"
  mkdir -p "$FIX/scripts" "$FIX/SnapshotTests/__Snapshots__/HomePictureTests" "$FIX/docs" "$FIX/bin"
  cp "$SCRIPTS/sim-tests.sh" "$SCRIPTS/build-fingerprint.sh" "$FIX/scripts/"
  printf 'let a = 1\n' >"$FIX/A.swift"
  printf 'png\n' >"$FIX/SnapshotTests/__Snapshots__/HomePictureTests/home.noProgram.png"
  printf 'notes\n' >"$FIX/docs/notes.md"
  printf '.build/\n' >"$FIX/.gitignore"
  git -C "$FIX/.." init -q -b main
  cd "$FIX"

  # Stub xcodebuild: logs each call. build-for-testing makes the app and exits STUB_BUILD_STATUS;
  # test-without-building exits STUB_TEST_STATUS.
  export CALLS="$BATS_TEST_TMPDIR/calls"
  cat >"$FIX/bin/xcodebuild" <<'STUB'
#!/usr/bin/env bash
echo "$*" >>"$CALLS"
case " $* " in
*" build-for-testing "*)
  [ "${STUB_BUILD_STATUS:-0}" -eq 0 ] && mkdir -p "$DERIVED/Build/Products/Debug-iphonesimulator/Apex.app"
  exit "${STUB_BUILD_STATUS:-0}" ;;
*" test-without-building "*) exit "${STUB_TEST_STATUS:-0}" ;;
esac
STUB
  cat >"$FIX/bin/affected" <<'STUB'
#!/usr/bin/env bash
printf '%s' "${STUB_AFFECTED:-}"
STUB
  chmod +x "$FIX/bin/xcodebuild" "$FIX/bin/affected"
  export APEX_XCODEBUILD="$FIX/bin/xcodebuild" APEX_AFFECTED_CMD="$FIX/bin/affected" APEX_BEAUTIFY=cat
  export DERIVED="$FIX/.build/DerivedData" PROJECT=P.xcodeproj SIM_DEST="platform=iOS Simulator,name=X"
  unset ONLY BASE
}

sim() { run --separate-stderr scripts/sim-tests.sh "$@"; }
called() { grep -q -- "$1" "$CALLS" 2>/dev/null; }

@test "gate builds once, then tests without building, everything" {
  sim gate
  [ "$status" -eq 0 ]
  [ "$(wc -l <"$CALLS" | tr -d ' ')" -eq 2 ]
  sed -n 1p "$CALLS" | grep -q build-for-testing
  sed -n 2p "$CALLS" | grep -q test-without-building
  sed -n 2p "$CALLS" | grep -q -- "-resultBundlePath .build/results/gate.xcresult"
  run ! called -only-testing
}

@test "affected runs only the classes the map gives" {
  STUB_AFFECTED="$(printf 'ApexUITests/A\nApexSnapshotTests/B')" sim affected
  [ "$status" -eq 0 ]
  called "-only-testing:ApexUITests/A"
  called "-only-testing:ApexSnapshotTests/B"
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

@test "an unknown mode is a usage error" {
  sim full
  [ "$status" -eq 64 ]
  [[ "$stderr" == *"usage"* ]] || false
  [ ! -e "$CALLS" ]
}
