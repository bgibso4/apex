#!/usr/bin/env bats
bats_require_minimum_version 1.5.0

# scripts/ci/gate-run.sh: which CI run passed the gate on exactly a commit's files. The repo and the stub gh are
# in github.bash.
GATE_RUN="$BATS_TEST_DIRNAME/../gate-run.sh"
load github

setup() {
  github_fixture
}

gate_run() { run --separate-stderr "$GATE_RUN" "$@"; }

# The answer is no: exit 1, nothing on stdout, one warning on stderr (after gh's own error, when it gave one).
answered_no() {
  [ "$status" -eq 1 ]
  [ -z "$output" ]
  [ "$(printf '%s\n' "$stderr" | grep -c '^warning: ')" -eq 1 ]
}

@test "a successful run with a successful gate job on the same tree is found" {
  ci_run 9 "$TREE" success
  gate_run "$HEAD_SHA"
  [ "$status" -eq 0 ]
  [ "$output" = 9 ]
  [ -z "$stderr" ]
}

@test "a run on a different tree does not count" {
  ci_run 9 "$OTHER_TREE" success
  gate_run "$HEAD_SHA"
  answered_no
}

@test "a run whose gate job did not succeed does not count" {
  for gate in failure cancelled skipped none; do
    no_ci_runs
    ci_run 9 "$TREE" "$gate"
    gate_run "$HEAD_SHA"
    answered_no
  done
}

@test "a run that did not conclude success does not count, whatever its gate job says" {
  for conclusion in failure cancelled; do
    no_ci_runs
    ci_run 9 "$TREE" success "$conclusion"
    gate_run "$HEAD_SHA"
    answered_no
  done
}

@test "the newest matching run wins" {
  ci_run 15 "$TREE" skipped
  ci_run 14 "$OTHER_TREE" success
  ci_run 12 "$TREE" success
  ci_run 9 "$TREE" success
  gate_run "$HEAD_SHA"
  [ "$status" -eq 0 ]
  [ "$output" = 12 ]
}

@test "when gh fails the answer is no" {
  ci_run 9 "$TREE" success
  STUB_GH_FAIL=1 gate_run "$HEAD_SHA"
  answered_no
  rm "$STUB/jobs-9.json" # the list answers, the jobs call fails
  gate_run "$HEAD_SHA"
  answered_no
}

@test "a sha that is no commit here is no" {
  ci_run 9 "$TREE" success
  gate_run 1111111111111111111111111111111111111111
  answered_no
  gate_run
  [ "$status" -ne 0 ]
  [ -z "$output" ]
}

@test "no runs at all is no" {
  gate_run "$HEAD_SHA"
  answered_no
}
