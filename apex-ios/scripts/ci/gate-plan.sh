#!/usr/bin/env bash
# What CI's `plan` job decides (.github/workflows/ios.yml): whether the simulator gate runs, and which run holds
# main's test times for the report's "change against main".
#   gate-plan.sh   appends `gate=true` or `gate=false`, and with true `main_run=<run ID, or nothing>`, to
#                  $GITHUB_OUTPUT, and says why on stdout
# The gate runs on every event but one: a push to main whose files a run already passed the gate on
# (scripts/ci/gate-run.sh). That is a merge of a pull request that was up to date with main. A run is never skipped
# on a guess: when GitHub cannot be asked, the gate runs.
# main is the commit's first parent. On a push to main that is main before the merge. On a pull request GITHUB_SHA
# is the pull request merged into main, so it is the main this run is tested against.
# Reads GITHUB_EVENT_NAME, GITHUB_SHA and GITHUB_OUTPUT, and what gate-run.sh reads. Needs the commit's history
# (fetch-depth: 0).
set -uo pipefail
gate_run="$(dirname "$0")/gate-run.sh"

if [ "$GITHUB_EVENT_NAME" = push ] && passed="$("$gate_run" "$GITHUB_SHA")"; then
	echo "same files as run $passed, which passed the gate: the gate is skipped"
	echo "gate=false" >>"$GITHUB_OUTPUT"
	exit 0
fi

if main_run="$("$gate_run" "$GITHUB_SHA^1")"; then
	echo "the gate runs. main's test times are in run $main_run"
else
	echo "the gate runs. main has no gate results, so the report will say the change against main is unknown"
fi
{
	echo "gate=true"
	echo "main_run=$main_run"
} >>"$GITHUB_OUTPUT"
