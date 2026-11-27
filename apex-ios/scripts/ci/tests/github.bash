# What the tests of scripts/ci/ share: a small repo and a stub `gh` that answers from JSON files in the shape
# GitHub's API gives, through the calling script's own --jq expression, so the expression is under test too.

OTHER_TREE=0000000000000000000000000000000000000000

# A repo with two commits on main, entered. PARENT_SHA and PARENT_TREE are the first commit's, HEAD_SHA and TREE the
# second's. And the stub gh, with no runs recorded.
github_fixture() {
  export TMPDIR="$BATS_TEST_TMPDIR"
  FIX="$BATS_TEST_TMPDIR/repo"
  mkdir -p "$FIX/bin"
  git -C "$FIX" init -q -b main
  git -C "$FIX" config user.email t@example.com
  git -C "$FIX" config user.name t
  cd "$FIX"
  printf 'a\n' >a.txt
  git add a.txt && git commit -qm parent
  PARENT_SHA="$(git rev-parse HEAD)"
  PARENT_TREE="$(git rev-parse 'HEAD^{tree}')"
  printf 'b\n' >a.txt
  git add a.txt && git commit -qm head
  HEAD_SHA="$(git rev-parse HEAD)"
  TREE="$(git rev-parse 'HEAD^{tree}')"

  # Stub gh, for `gh api <path> --jq <expression>` only. $STUB/runs.json answers the list of ios.yml's runs and
  # $STUB/jobs-<id>.json a run's jobs. STUB_GH_FAIL=1 makes every call fail, as an API error does.
  export STUB="$BATS_TEST_TMPDIR/stub"
  mkdir -p "$STUB"
  no_ci_runs
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

# Forget every run recorded so far.
no_ci_runs() { echo '{"workflow_runs": []}' >"$STUB/runs.json"; }

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
