#!/usr/bin/env bats

# scripts/test-times.py: the time report every simulator run ends with, and what makes it fail. The fixtures are
# hand-written in the shape `xcrun xcresulttool get test-results tests --compact` gives. Every `[[ ]]` below ends in
# `|| false`: on macOS's bash 3.2 a failing `[[ ]]` that is not a test's last command does not fail the test.
SCRIPTS="$BATS_TEST_DIRNAME/.."
TIMES="$SCRIPTS/tests/fixtures/times"

setup() {
  cd "$BATS_TEST_TMPDIR"
}

# report FIXTURE CEILING [flags…]: the report for a fixture against a ceiling file holding CEILING seconds.
report() {
  printf '# Recorded for a test.\n%s\n' "$2" >ceiling.txt
  run python3 -I "$SCRIPTS/test-times.py" "$TIMES/$1.json" ceiling.txt "${@:3}"
}

@test "the report gives the total, the share of the ceiling and the slowest five" {
  report seven 100
  [ "$status" -eq 0 ]
  [ "${lines[0]}" = "test time: 28.0 s of a 100 s ceiling (28%) · 7 tests" ]
  [ "${lines[1]}" = "slowest:" ]
  [ "${lines[2]}" = "   7.0 s  PictureTests/test7()" ]
  [ "${lines[6]}" = "   3.0 s  PictureTests/test3()" ]
  [ "${#lines[@]}" -eq 7 ]
}

@test "over 80 percent warns and passes" {
  report seven 30 --enforce
  [ "$status" -eq 0 ]
  [[ "$output" == *$'\nwarning: '*"80%"* ]] || false
  report seven 40 --enforce
  [[ "$output" != *"warning:"* ]] || false
}

@test "over the ceiling passes locally and fails with --enforce" {
  report seven 20
  [ "$status" -eq 0 ]
  [[ "$output" == *$'\nerror: '*"over the ceiling"* ]] || false
  report seven 20 --enforce
  [ "$status" -eq 1 ]
  [[ "$output" == *$'\nerror: '*"over the ceiling"* ]] || false
}

@test "a test over 60 s fails" {
  report slow 1000
  [ "$status" -eq 1 ]
  [[ "$output" == *"error: JourneyTests/testLong() took 61.0 s"*"60 s"* ]] || false
}

@test "a failed test fails the report" {
  report failed 1000
  [ "$status" -eq 1 ]
  [[ "$output" == *"error: JourneyTests/testBroken() did not pass (Failed)"* ]] || false
  [[ "$output" == *"2 tests"* ]] || false
}

@test "a skipped test fails the report" {
  report skipped 1000
  [ "$status" -eq 1 ]
  [[ "$output" == *"error: JourneyTests/testLeftOut() did not pass (Skipped)"* ]] || false
}

@test "a result with no tests fails" {
  report empty 1000
  [ "$status" -eq 1 ]
  [[ "$output" == *"error: no test ran"* ]] || false
}

@test "a ceiling file with no number, or no ceiling file, fails" {
  printf '# Only a comment.\n' >ceiling.txt
  run python3 -I "$SCRIPTS/test-times.py" "$TIMES/seven.json" ceiling.txt
  [ "$status" -eq 1 ]
  [[ "$output" == "error: ceiling.txt must hold one number"* ]] || false
  run python3 -I "$SCRIPTS/test-times.py" "$TIMES/seven.json" missing.txt
  [ "$status" -eq 1 ]
  [[ "$output" == "error: missing.txt must hold one number"* ]] || false
}

@test "with main's results the report gives the change against main" {
  report seven 100 --main "$TIMES/main.json"
  [ "$status" -eq 0 ]
  [ "${lines[0]}" = "test time: 28.0 s of a 100 s ceiling (28%) · 7 tests" ]
  [ "${lines[1]}" = "change against main: +1.5 s (main 26.5 s)" ]
  [ "${lines[2]}" = "slowest:" ]
}

@test "a change that is faster than main shows a minus" {
  report main 100 --main "$TIMES/seven.json"
  [ "$status" -eq 0 ]
  [ "${lines[1]}" = "change against main: -1.5 s (main 28.0 s)" ]
}

@test "missing results for main say unknown and change nothing else" {
  report seven 20 --enforce
  [ "$status" -eq 1 ]
  without="$output"
  report seven 20 --enforce --main no-such-file.json
  [ "$status" -eq 1 ]
  [ "${lines[1]}" = "change against main: unknown (no gate results for main)" ]
  [ "$(printf '%s\n' "$output" | sed 2d)" = "$without" ]
  report seven 100 --main no-such-file.json
  [ "$status" -eq 0 ]
}

@test "results for main that cannot be read say unknown too" {
  for content in 'not json' '[]' '{"testNodes": ["text"]}' '{"testNodes": [{"nodeType": "Test Case", "durationInSeconds": "3"}]}'; do
    printf '%s\n' "$content" >main.json
    report seven 100 --main main.json
    [ "$status" -eq 0 ]
    [ "${lines[1]}" = "change against main: unknown (no gate results for main)" ]
  done
}

@test "nested suites are walked" {
  report nested 100
  [ "$status" -eq 0 ]
  [ "${lines[0]}" = "test time: 6.0 s of a 100 s ceiling (6%) · 3 tests" ]
  [ "${lines[2]}" = "   3.0 s  InnerTests/testInner()" ]
}
