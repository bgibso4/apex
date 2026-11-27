#!/usr/bin/env bash
# Every simulator test run goes through here (`make affected`, `make retest`, `make gate`, `make snapshots-record`).
#   sim-tests.sh affected  the classes the branch's changes touch (scripts/affected-tests.sh, BASE=origin/main)
#   sim-tests.sh retest    ONLY, or the affected classes, without building; refuses when the sources changed since
#                          the last good build
#   sim-tests.sh gate      every simulator test: what CI runs before a merge
#   sim-tests.sh record    the pictures (ONLY narrows them), rewriting each reference that fails or is missing. The
#                          library reports a rewritten reference as a failure: run retest to confirm green
# affected, gate and record build once (build-for-testing), record the build fingerprint (even when tests then fail, so
# retest works next), then run test-without-building. The run's result bundle is .build/results/<mode>.xcresult.
# Every run appends a line to .build/test-runs.log: time, mode, scope, build seconds, test seconds, exit status.
# Reads ONLY BASE SIM_DEST XCB_FLAGS PROJECT DERIVED from the environment (the Makefile exports them).
# APEX_XCODEBUILD, APEX_AFFECTED_CMD and APEX_BEAUTIFY are seams for the bats tests.
set -uo pipefail
cd "$(git rev-parse --show-toplevel)/apex-ios" || exit
mode="${1:-}"
xcodebuild="${APEX_XCODEBUILD:-xcodebuild}"
affected="${APEX_AFFECTED_CMD:-scripts/affected-tests.sh}"
beautify="${APEX_BEAUTIFY:-xcbeautify}"
fingerprint="scripts/build-fingerprint.sh"
app="$DERIVED/Build/Products/Debug-iphonesimulator/Apex.app"
results=".build/results/$mode.xcresult"

# The test identifiers to run, one per line, or ALL, or nothing.
case "$mode" in
gate) scope=ALL ;;
record)
	scope="${ONLY:-ApexSnapshotTests}"
	export TEST_RUNNER_SNAPSHOT_TESTING_RECORD=failed # reaches the tests as SNAPSHOT_TESTING_RECORD
	;;
affected | retest)
	scope="${ONLY:-}"
	if [ -z "$scope" ] || [ "$mode" = affected ]; then
		scope="$("$affected" "${BASE:-origin/main}")" || exit
	fi
	;;
*)
	echo "usage: sim-tests.sh affected|retest|gate|record" >&2
	exit 64
	;;
esac
scope="$(echo $scope)" # one line, space-separated
if [ -z "$scope" ]; then
	echo "nothing to run: the changes touch no app code or tests."
	exit 0
fi

args=()
if [ "$scope" != ALL ]; then
	for id in $scope; do args+=("-only-testing:$id"); done
fi
common=(${XCB_FLAGS:-} -project "$PROJECT" -scheme Apex -derivedDataPath "$DERIVED" -destination "$SIM_DEST")

build_seconds=0
status=0
if [ "$mode" = retest ]; then
	if [ ! -d "$app" ] || ! "$fingerprint" current; then
		echo "error: the sources changed since the last build (or there is none), so retest would run stale code." >&2
		echo "Rebuild with make affected." >&2
		exit 2
	fi
else
	start=$SECONDS
	before="$("$fingerprint")"
	"$fingerprint" forget # products change from here on; only a good build records again
	"$xcodebuild" build-for-testing "${common[@]}" | "$beautify"
	status=$?
	build_seconds=$((SECONDS - start))
	[ "$status" -eq 0 ] && "$fingerprint" record "$before"
fi

test_seconds=0
if [ "$status" -eq 0 ]; then
	start=$SECONDS
	rm -rf "$results" # xcodebuild refuses a result bundle path that exists
	"$xcodebuild" test-without-building "${common[@]}" -resultBundlePath "$results" ${args[@]+"${args[@]}"} | "$beautify"
	status=$?
	test_seconds=$((SECONDS - start))
fi

mkdir -p .build
printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$mode" "$scope" "$build_seconds" "$test_seconds" \
	"$status" >>.build/test-runs.log
count="$(echo "$scope" | wc -w | tr -d ' ')"
[ "$scope" = ALL ] && what="everything" || what="$count test ids"
echo "test-runs: $mode · $what · build ${build_seconds} s · tests ${test_seconds} s · exit $status"
exit "$status"
