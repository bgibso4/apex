#!/usr/bin/env bats
bats_require_minimum_version 1.5.0

# scripts/ci/gate-run.sh: which CI run passed the gate on exactly a commit's files. The fixture is a small repo and a
# stub `gh` that answers from JSON files in the shape GitHub's API gives, through the script's own --jq expression,
# so the expression is under test too.
GATE_RUN="$BATS_TEST_DIRNAME/../gate-run.sh"
OTHER_TREE=0000000000000000000000000000000000000000

setup() {
  export TMPDIR="$BATS_TEST_TMPDIR"
  FIX="$BATS_TEST_TMPDIR/repo"
  mkdir -p "$FIX/bin"
  git -C "$FIX" init -q -b main
  git -C "$FIX" config user.email t@example.com
  git -C "$FIX" config user.name t
  cd "$FIX"
  printf 'a\n' >a.txt
  git add a.txt && git commit -qm base
  HEAD_SHA="$(git rev-parse HEAD)"
  TREE="$(git rev-parse 'HEAD^{tree}')"

  # Stub gh, for `gh api <path> --jq <expression>` only. $STUB/runs.json answers the list of ios.yml's runs and
  # $STUB/jobs-<id>.json a run's jobs. STUB_GH_FAIL=1 makes every call fail, as an API error does.
  export STUB="$BATS_TEST_TMPDIR/stub"
  mkdir -p "$STUB"
  echo '{"workflow_runs": []}' >"$STUB/runs.json"
  cat >"$FIX/bin/gh" <<'GH'
#!/usr/bin/env bash
[ -z "${STUB_GH_FAIL:-}" ] || { echo "gh: HTTP 502" >&2; exit 1; }
[ "$1" = api ] && [ "$3" = --jq ] && [ "$#" -eq 4 ] || { echo "unexpected: gh $*" >&2; exit 1; }
case "$2" in
repos/owner/repo/actions/workflows/ios.yml/runs\?*) file="$STUB/runs.json" ;;
repos/owner/repo/actions/runs/*/jobs) id="${2%/jobs}"; file="$STUB/jobs-${id##*/}.json" ;;
*) echo "unexpected: gh $*" >&2; exit 1 ;;
esac
jq -r "$4" "$file"
GH
  chmod +x "$FIX/bin/gh"
  export APEX_GH="$FIX/bin/gh" GITHUB_REPOSITORY=owner/repo
}

# ci_run ID TREE GATE [CONCLUSION]: one more run in GitHub's list, which is newest first, so record the newest
# first. GATE is its gate job's conclusion, or "none" for a run with no gate job. CONCLUSION is the run's own
# (default success).
ci_run() {
  local jobs='[{"name": "checks", "conclusion": "success"}]'
  [ "$3" = none ] || jobs="$(jq -c --arg gate "$3" '. + [{name: "gate", conclusion: $gate}]' <<<"$jobs")"
  echo "{\"jobs\": $jobs}" >"$STUB/jobs-$1.json"
  jq --argjson id "$1" --arg tree "$2" --arg conclusion "${4:-success}" \
    '.workflow_runs += [{id: $id, conclusion: $conclusion, head_commit: {tree_id: $tree}}]' "$STUB/runs.json" \
    >"$STUB/new"
  mv "$STUB/new" "$STUB/runs.json"
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
    echo '{"workflow_runs": []}' >"$STUB/runs.json"
    ci_run 9 "$TREE" "$gate"
    gate_run "$HEAD_SHA"
    answered_no
  done
}

@test "a run that did not conclude success does not count, whatever its gate job says" {
  for conclusion in failure cancelled; do
    echo '{"workflow_runs": []}' >"$STUB/runs.json"
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
