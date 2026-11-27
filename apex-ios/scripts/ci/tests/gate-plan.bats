#!/usr/bin/env bats
bats_require_minimum_version 1.5.0

# scripts/ci/gate-plan.sh: what CI's plan job decides. Whether the gate runs, and which run holds main's test times.
# It goes through the real gate-run.sh; the repo and the stub gh are in github.bash. Every `[[ ]]` below ends in
# `|| false`: on macOS's bash 3.2 a failing `[[ ]]` that is not a test's last command does not fail the test.
GATE_PLAN="$BATS_TEST_DIRNAME/../gate-plan.sh"
load github

setup() {
  github_fixture
  export GITHUB_OUTPUT="$BATS_TEST_TMPDIR/outputs" GITHUB_SHA="$HEAD_SHA"
  : >"$GITHUB_OUTPUT"
}

# plan EVENT: the decision for an event on the fixture's second commit.
plan() { GITHUB_EVENT_NAME="$1" run --separate-stderr "$GATE_PLAN"; }

# What the job's outputs hold, in the order written.
outputs() { tr '\n' ' ' <"$GITHUB_OUTPUT"; }

@test "a push to main whose files passed the gate skips it and says which run" {
  ci_run 9 "$TREE" success
  plan push
  [ "$status" -eq 0 ]
  [ "$(outputs)" = "gate=false " ]
  [[ "$output" == *"same files as run 9, which passed the gate"* ]] || false
}

@test "a push to main whose files no run passed runs the gate" {
  ci_run 9 "$OTHER_TREE" success
  ci_run 8 "$TREE" skipped
  plan push
  [ "$status" -eq 0 ]
  [ "$(outputs)" = "gate=true main_run= " ]
}

@test "a pull request runs the gate even when its files already passed" {
  ci_run 9 "$TREE" success
  plan pull_request
  [ "$status" -eq 0 ]
  [ "$(outputs)" = "gate=true main_run= " ]
}

@test "main's run is the one that passed the gate on the first parent's files" {
  ci_run 7 "$PARENT_TREE" success
  for event in pull_request push; do
    : >"$GITHUB_OUTPUT"
    plan "$event"
    [ "$status" -eq 0 ]
    [ "$(outputs)" = "gate=true main_run=7 " ]
  done
}

@test "when GitHub cannot be asked the gate runs" {
  ci_run 9 "$TREE" success
  ci_run 7 "$PARENT_TREE" success
  for event in pull_request push; do
    : >"$GITHUB_OUTPUT"
    STUB_GH_FAIL=1 plan "$event"
    [ "$status" -eq 0 ]
    [ "$(outputs)" = "gate=true main_run= " ]
  done
}

@test "any other event runs the gate" {
  ci_run 9 "$TREE" success
  plan workflow_dispatch
  [ "$status" -eq 0 ]
  [ "$(outputs)" = "gate=true main_run= " ]
}

@test "a commit with no parent has no main to compare with, and the gate runs" {
  GITHUB_SHA="$PARENT_SHA"
  plan pull_request
  [ "$status" -eq 0 ]
  [ "$(outputs)" = "gate=true main_run= " ]
}
