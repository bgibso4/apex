#!/usr/bin/env bats

HOOKS="$BATS_TEST_DIRNAME/.."

# A repo with one commit on main, holding apex-ios/A.swift and apex-ios/.gitignore.
make_repo() {
  mkdir -p "$1/apex-ios"
  git -C "$1" init -q -b main
  git -C "$1" config user.email t@example.com
  git -C "$1" config user.name t
  printf '.build/\n' >"$1/apex-ios/.gitignore"
  printf 'let a = 1\n' >"$1/apex-ios/A.swift"
  git -C "$1" add -A
  git -C "$1" commit -q -m first
}

setup() {
  export TMPDIR="$BATS_TEST_TMPDIR"
  export CLAUDE_PROJECT_DIR="$BATS_TEST_TMPDIR/repo"
  export APEX_FAST_CMD="true"
  make_repo "$CLAUDE_PROJECT_DIR"
  cd "$CLAUDE_PROJECT_DIR"
  # Stubs append to this file whenever Fast runs.
  export RAN="$BATS_TEST_TMPDIR/ran"
}

fast_ran() { [ -s "$RAN" ]; }
fast_did_not_run() { [ ! -s "$RAN" ]; }
set_swift() { printf '%s\n' "$1" >"$CLAUDE_PROJECT_DIR/apex-ios/A.swift"; }

edit_json() { printf '{"session_id":"s1","tool_name":"Edit","tool_input":{"file_path":"%s"}}' "$1"; }
bash_json() { jq -n --arg c "$1" '{session_id:"s1",tool_name:"Bash",tool_input:{command:$c}}'; }
stop_json() { echo '{"session_id":"s1","hook_event_name":"Stop"}'; }

# A `swift` on PATH that records its arguments.
stub_swift() {
  mkdir -p "$BATS_TEST_TMPDIR/bin"
  printf '#!/bin/sh\necho "$@" >>"%s"\n' "$BATS_TEST_TMPDIR/swift-calls" >"$BATS_TEST_TMPDIR/bin/swift"
  chmod +x "$BATS_TEST_TMPDIR/bin/swift"
  PATH="$BATS_TEST_TMPDIR/bin:$PATH"
}

@test "guard blocks edits inside the xcodeproj" {
  run bash -c "'$HOOKS/guard-generated.sh' <<<'$(edit_json /r/apex-ios/Apex.xcodeproj/project.pbxproj)'"
  [ "$status" -eq 2 ]
  [[ "$output" == *"make -C apex-ios generate"* ]]
}

@test "guard blocks edits under Generated" {
  run bash -c "'$HOOKS/guard-generated.sh' <<<'$(edit_json /r/apex-ios/Packages/ApexKit/Sources/Screens/Generated/Tokens.swift)'"
  [ "$status" -eq 2 ]
}

@test "guard allows edits elsewhere" {
  run bash -c "'$HOOKS/guard-generated.sh' <<<'$(edit_json /r/apex-ios/App/Home.swift)'"
  [ "$status" -eq 0 ]
}

@test "guard allows a Generated folder outside apex-ios" {
  run bash -c "'$HOOKS/guard-generated.sh' <<<'$(edit_json /r/apex-rn/src/Generated/x.ts)'"
  [ "$status" -eq 0 ]
}

@test "guard blocks --no-verify" {
  run bash -c "'$HOOKS/guard-hook-bypass.sh' <<<'$(bash_json 'git commit --no-verify -m x')'"
  [ "$status" -eq 2 ]
}

@test "guard blocks git -c core.hooksPath" {
  run bash -c "'$HOOKS/guard-hook-bypass.sh' <<<'$(bash_json 'git -c core.hooksPath=/dev/null commit -m x')'"
  [ "$status" -eq 2 ]
}

@test "guard allows a normal commit" {
  run bash -c "'$HOOKS/guard-hook-bypass.sh' <<<'$(bash_json 'git commit -m x')'"
  [ "$status" -eq 0 ]
}

@test "stop gate passes without running Fast when no Swift changed since green" {
  set_swift 'let a = 2'
  "$HOOKS/swift-fingerprint.sh" record "$("$HOOKS/swift-fingerprint.sh")"
  export APEX_FAST_CMD="echo ran >>'$RAN'; exit 1"
  run "$HOOKS/stop-gate.sh" <<<"$(stop_json)"
  [ "$status" -eq 0 ]
  [ -z "$output" ]
  fast_did_not_run
}

@test "stop gate runs Fast after a Swift change made by any means and blocks on failure" {
  "$HOOKS/swift-fingerprint.sh" record "$("$HOOKS/swift-fingerprint.sh")"
  set_swift 'let a = 2'
  export APEX_FAST_CMD="echo ran >>'$RAN'; echo 'Test testFoo failed'; exit 1"
  run "$HOOKS/stop-gate.sh" <<<"$(stop_json)"
  [ "$(jq -r .decision <<<"$output")" = "block" ]
  [[ "$(jq -r .reason <<<"$output")" == *"make -C apex-ios fast failed"* ]]
  fast_ran
}

@test "after a pass a second stop is a no-op" {
  set_swift 'let a = 2'
  export APEX_FAST_CMD="echo ran >>'$RAN'"
  run "$HOOKS/stop-gate.sh" <<<"$(stop_json)"
  [ "$status" -eq 0 ]
  run "$HOOKS/stop-gate.sh" <<<"$(stop_json)"
  [ "$status" -eq 0 ]
  [ "$(wc -l <"$RAN")" -eq 1 ]
}

@test "a committed change that was never verified still runs Fast" {
  "$HOOKS/swift-fingerprint.sh" record "$("$HOOKS/swift-fingerprint.sh")"
  git -C "$CLAUDE_PROJECT_DIR" checkout -q -b work
  set_swift 'let a = 3'
  git -C "$CLAUDE_PROJECT_DIR" add -A
  git -C "$CLAUDE_PROJECT_DIR" commit -q -m change
  export APEX_FAST_CMD="echo ran >>'$RAN'"
  run "$HOOKS/stop-gate.sh" <<<"$(stop_json)"
  [ "$status" -eq 0 ]
  fast_ran
}

@test "a branch with no change under apex-ios never runs Fast, with no green record" {
  git -C "$CLAUDE_PROJECT_DIR" checkout -q -b rn-work
  mkdir -p "$CLAUDE_PROJECT_DIR/apex-rn"
  printf 'export const a = 1\n' >"$CLAUDE_PROJECT_DIR/apex-rn/app.ts"
  git -C "$CLAUDE_PROJECT_DIR" add -A
  git -C "$CLAUDE_PROJECT_DIR" commit -q -m rn
  printf 'export const a = 2\n' >"$CLAUDE_PROJECT_DIR/apex-rn/app.ts"
  export APEX_FAST_CMD="echo ran >>'$RAN'; exit 1"
  run "$HOOKS/stop-gate.sh" <<<"$(stop_json)"
  [ "$status" -eq 0 ]
  [ -z "$output" ]
  fast_did_not_run
}

@test "an uncommitted Swift change under apex-ios runs Fast with no green record" {
  # A new, untracked file: the working tree counts, not only what is committed.
  printf 'let b = 1\n' >"$CLAUDE_PROJECT_DIR/apex-ios/B.swift"
  export APEX_FAST_CMD="echo ran >>'$RAN'"
  run "$HOOKS/stop-gate.sh" <<<"$(stop_json)"
  [ "$status" -eq 0 ]
  fast_ran
}

@test "on a repo with no main and no origin/main the gate treats Swift as changed" {
  git -C "$CLAUDE_PROJECT_DIR" branch -m main trunk
  export APEX_FAST_CMD="echo ran >>'$RAN'"
  run "$HOOKS/stop-gate.sh" <<<"$(stop_json)"
  [ "$status" -eq 0 ]
  fast_ran
}

@test "a subagent stop with an already-green fingerprint passes" {
  set_swift 'let a = 2'
  "$HOOKS/swift-fingerprint.sh" record "$("$HOOKS/swift-fingerprint.sh")"
  export APEX_FAST_CMD="echo ran >>'$RAN'; exit 1"
  run "$HOOKS/stop-gate.sh" <<<'{"session_id":"s1","agent_id":"a1","hook_event_name":"SubagentStop"}'
  [ "$status" -eq 0 ]
  [ -z "$output" ]
  fast_did_not_run
}

@test "a deleted tracked Swift file that sorts last still runs Fast and blocks on failure" {
  printf 'let z = 1\n' >"$CLAUDE_PROJECT_DIR/apex-ios/Z.swift"
  git -C "$CLAUDE_PROJECT_DIR" add -A
  git -C "$CLAUDE_PROJECT_DIR" commit -q -m files
  "$HOOKS/swift-fingerprint.sh" record "$("$HOOKS/swift-fingerprint.sh")"
  rm "$CLAUDE_PROJECT_DIR/apex-ios/Z.swift"
  export APEX_FAST_CMD="echo ran >>'$RAN'; echo 'error: broken'; exit 1"
  run "$HOOKS/stop-gate.sh" <<<"$(stop_json)"
  [ "$status" -eq 0 ]
  [ "$(jq -r .decision <<<"$output")" = "block" ]
  fast_ran
}

@test "an unexpected internal error blocks with a stop gate error" {
  printf '#!/bin/sh\nexit 1\n' >"$BATS_TEST_TMPDIR/broken.sh"
  chmod +x "$BATS_TEST_TMPDIR/broken.sh"
  export APEX_FINGERPRINT_CMD="$BATS_TEST_TMPDIR/broken.sh"
  run "$HOOKS/stop-gate.sh" <<<"$(stop_json)"
  [ "$status" -eq 0 ]
  [ "$(jq -r .decision <<<"$output")" = "block" ]
  [[ "$(jq -r .reason <<<"$output")" == *"stop gate error"* ]]
  [ -z "$(find "$TMPDIR" -maxdepth 1 -name 'apex-fast.lock.*')" ]
}

@test "a subagent keeps its own attempt counter" {
  set_swift 'let a = 4'
  export APEX_FAST_CMD="exit 1"
  run "$HOOKS/stop-gate.sh" <<<'{"session_id":"s1","agent_id":"a1","hook_event_name":"SubagentStop"}'
  [ "$(jq -r .decision <<<"$output")" = "block" ]
  [ -e "$TMPDIR/apex-stop-a1" ]
  [ ! -e "$TMPDIR/apex-stop-s1" ]
}

@test "block reason leads with the failing test, ANSI stripped" {
  set_swift 'let a = 5'
  export APEX_FAST_CMD="printf 'noise\n\033[31mFailing tests:\033[0m\n    HomeTests.testGreeting\n\nmore noise\n'; exit 1"
  run "$HOOKS/stop-gate.sh" <<<"$(stop_json)"
  [ "$(jq -r .reason <<<"$output" | head -n1)" = "    HomeTests.testGreeting" ]
  [[ "$(jq -r .reason <<<"$output")" != *$'\033'* ]]
}

@test "guard blocks a short flag after a backslash line continuation" {
  run "$HOOKS/guard-hook-bypass.sh" <<<"$(bash_json $'git commit -m x \\\n  -n')"
  [ "$status" -eq 2 ]
}

@test "guard ignores flags in other commands of the same line" {
  run "$HOOKS/guard-hook-bypass.sh" <<<"$(bash_json 'git commit -m x; head -n1 file')"
  [ "$status" -eq 0 ]
}

@test "stop gate blocks when tests fail and includes the output" {
  set_swift 'let a = 6'
  export APEX_FAST_CMD="echo 'Test testFoo failed'; exit 1"
  run "$HOOKS/stop-gate.sh" <<<"$(stop_json)"
  [ "$status" -eq 0 ]
  [ "$(jq -r .decision <<<"$output")" = "block" ]
  [[ "$(jq -r .reason <<<"$output")" == *"Test testFoo failed"* ]]
}

@test "stop gate blocks when make fast exits non-zero with no test output" {
  set_swift 'let a = 7'
  export APEX_FAST_CMD="exit 65"
  run "$HOOKS/stop-gate.sh" <<<"$(stop_json)"
  [ "$status" -eq 0 ]
  [ "$(jq -r .decision <<<"$output")" = "block" ]
}

@test "stop gate hands back after 3 failures" {
  set_swift 'let a = 8'
  export APEX_FAST_CMD="echo boom; exit 1"
  for _ in 1 2; do
    run "$HOOKS/stop-gate.sh" <<<"$(stop_json)"
    [ "$(jq -r .decision <<<"$output")" = "block" ]
  done
  run "$HOOKS/stop-gate.sh" <<<"$(stop_json)"
  [ "$status" -eq 0 ]
  [[ "$(jq -r .systemMessage <<<"$output")" == *"still failing after 3 attempts"* ]]
  [[ "$(jq -r .systemMessage <<<"$output")" == *"make -C apex-ios fast"* ]]
  [ ! -e "$TMPDIR/apex-stop-s1" ]
}

nojq_path() {
  local bin="$BATS_TEST_TMPDIR/nojq"
  mkdir -p "$bin"
  for tool in bash cat tr mktemp dirname; do ln -sf "$(command -v $tool)" "$bin/$tool"; done
  echo "$bin"
}

@test "stop gate fails open with a message when jq is missing" {
  local bin
  bin="$(nojq_path)"
  run env PATH="$bin" "$bin/bash" "$HOOKS/stop-gate.sh" <<<"$(stop_json)"
  [ "$status" -eq 0 ]
  [[ "$output" == *"jq missing: Fast gate skipped. Install it: brew install jq"* ]]
}

@test "guards still fail closed with a message when jq is missing" {
  local bin
  bin="$(nojq_path)"
  for script in format-on-edit guard-generated guard-hook-bypass; do
    run env PATH="$bin" "$bin/bash" "$HOOKS/$script.sh" <<<"$(stop_json)"
    [ "$status" -eq 2 ]
    [[ "$output" == *"jq missing: brew install jq"* ]]
  done
}

@test "every hook passes when the checkout has no apex-ios folder" {
  export CLAUDE_PROJECT_DIR="$BATS_TEST_TMPDIR/old-branch"
  mkdir -p "$CLAUDE_PROJECT_DIR"
  git -C "$CLAUDE_PROJECT_DIR" init -q -b main
  cd "$CLAUDE_PROJECT_DIR"
  export APEX_FAST_CMD="echo ran >>'$RAN'; exit 1"
  run "$HOOKS/stop-gate.sh" <<<"$(stop_json)"
  [ "$status" -eq 0 ]
  [ -z "$output" ]
  fast_did_not_run
  # Even for a generated-looking path, and even without jq: nothing in such a checkout is these hooks' business.
  local bin
  bin="$(nojq_path)"
  for script in stop-gate format-on-edit guard-generated; do
    run env PATH="$bin" "$bin/bash" "$HOOKS/$script.sh" <<<"$(edit_json /r/apex-ios/Apex.xcodeproj/project.pbxproj)"
    [ "$status" -eq 0 ]
    [ -z "$output" ]
  done
}

@test "guard blocks commit -n, short-flag clusters and case variants" {
  for c in 'git commit -n -m x' 'git commit -anm x' 'git commit -nm "msg"' 'git -c core.hookspath=/dev/null commit' 'git commit --NO-VERIFY'; do
    run "$HOOKS/guard-hook-bypass.sh" <<<"$(bash_json "$c")"
    [ "$status" -eq 2 ]
  done
}

@test "guard allows commit -m and git log -n" {
  for c in 'git commit -m "fix"' 'git log -n 3' 'git commit --amend -m x' 'git commit -am "fix"'; do
    run "$HOOKS/guard-hook-bypass.sh" <<<"$(bash_json "$c")"
    [ "$status" -eq 0 ]
  done
}

@test "guard ignores flags mentioned inside a commit message" {
  for c in 'git commit -m "mention --no-verify here"' 'git commit -m "catch commit -n"' "git commit -m 'core.hookspath -n'" 'git commit -am "git commit -n"'; do
    run "$HOOKS/guard-hook-bypass.sh" <<<"$(bash_json "$c")"
    [ "$status" -eq 0 ]
  done
}

@test "guard still blocks a bypass flag alongside a commit message" {
  for c in 'git commit -m "msg" --no-verify' 'git commit -nm "msg"' 'git commit -m "x" -n'; do
    run "$HOOKS/guard-hook-bypass.sh" <<<"$(bash_json "$c")"
    [ "$status" -eq 2 ]
  done
}

@test "concurrent stop gates serialize on the lock" {
  set_swift 'let b = 2'
  export APEX_FAST_CMD="echo start >>'$TMPDIR/log'; sleep 1; echo end >>'$TMPDIR/log'; exit 1"
  "$HOOKS/stop-gate.sh" <<<'{"session_id":"s1"}' &
  "$HOOKS/stop-gate.sh" <<<'{"session_id":"s2"}' &
  wait
  [ "$(wc -l <"$TMPDIR/log")" -eq 4 ]
  # Serialized means the log reads start, end, start, end.
  [ "$(paste -sd' ' "$TMPDIR/log")" = "start end start end" ]
}

@test "gates in two checkouts do not share a lock" {
  local other="$BATS_TEST_TMPDIR/other" first
  make_repo "$other"
  set_swift 'let a = 9'
  printf 'let a = 9\n' >"$other/apex-ios/A.swift"
  APEX_FAST_CMD="sleep 2" "$HOOKS/stop-gate.sh" <<<'{"session_id":"s1"}' &
  first=$!
  sleep 0.3
  run env CLAUDE_PROJECT_DIR="$other" APEX_FAST_CMD="echo ran >>'$RAN'" "$HOOKS/stop-gate.sh" <<<'{"session_id":"s2"}'
  # The second checkout's gate ran Fast and finished while the first still held its own lock.
  kill -0 "$first"
  wait "$first"
  [ "$status" -eq 0 ]
  fast_ran
}

@test "format on edit formats a Swift file under apex-ios" {
  stub_swift
  run "$HOOKS/format-on-edit.sh" <<<"$(edit_json "$CLAUDE_PROJECT_DIR/apex-ios/A.swift")"
  [ "$status" -eq 0 ]
  grep -qF "apex-ios/A.swift" "$BATS_TEST_TMPDIR/swift-calls"
}

@test "format on edit ignores a Swift file outside apex-ios" {
  stub_swift
  mkdir -p "$CLAUDE_PROJECT_DIR/apex-rn"
  printf 'let x = 1\n' >"$CLAUDE_PROJECT_DIR/apex-rn/x.swift"
  run "$HOOKS/format-on-edit.sh" <<<"$(edit_json "$CLAUDE_PROJECT_DIR/apex-rn/x.swift")"
  [ "$status" -eq 0 ]
  [ ! -e "$BATS_TEST_TMPDIR/swift-calls" ]
}

@test "the fingerprint changes when design/tokens.json changes" {
  mkdir -p "$CLAUDE_PROJECT_DIR/apex-ios/design"
  printf '{}\n' >"$CLAUDE_PROJECT_DIR/apex-ios/design/tokens.json"
  before="$("$HOOKS/swift-fingerprint.sh")"
  printf '{"a":1}\n' >"$CLAUDE_PROJECT_DIR/apex-ios/design/tokens.json"
  [ "$before" != "$("$HOOKS/swift-fingerprint.sh")" ]
}

@test "the fingerprint ignores Swift outside apex-ios" {
  before="$("$HOOKS/swift-fingerprint.sh")"
  mkdir -p "$CLAUDE_PROJECT_DIR/apex-rn"
  printf 'let x = 1\n' >"$CLAUDE_PROJECT_DIR/apex-rn/x.swift"
  [ "$before" = "$("$HOOKS/swift-fingerprint.sh")" ]
}
