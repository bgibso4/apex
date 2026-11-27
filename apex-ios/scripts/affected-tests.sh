#!/usr/bin/env bash
# The simulator test classes a branch's changes can affect (`make affected`, `make retest`).
#   affected-tests.sh [BASE]       print the test identifiers to run, one per line (Target/Class), or ALL, or nothing
#   affected-tests.sh --check-map  exit 1 when scripts/test-map.txt names a class that does not exist, or a test
#                                  class is missing from it
# Changed paths: everything under apex-ios/ since the merge base with BASE (default origin/main), committed or not,
# plus untracked files. A change outside apex-ios/ affects nothing. Rules are in scripts/test-map.txt. The
# reasoning goes to stderr.
set -euo pipefail
export LC_ALL=C
cd "$(git rev-parse --show-toplevel)/apex-ios"
map="scripts/test-map.txt"
test_dirs=(UITests SnapshotTests)

# The map's rules as "prefix<TAB>targets", comments and blank lines dropped.
rules() { awk '!/^[[:space:]]*(#|$)/ { p = $1; $1 = ""; sub(/^ /, ""); print p "\t" $0 }' "$map"; }

# The *Tests classes a test source file declares or extends.
types_in_file() {
	[ -f "$1" ] || return 0
	sed -nE 's/^([[:space:]]*@[A-Za-z]+[[:space:]]+)*(final[[:space:]]+)?(class|extension)[[:space:]]+([A-Za-z0-9_]+Tests)([^A-Za-z0-9_].*)?$/\4/p' "$1"
}

# The test target that declares a class (ApexUITests, ApexSnapshotTests), or nothing.
target_of() {
	local dir
	for dir in "${test_dirs[@]}"; do
		if grep -lqE "^([[:space:]]*@[A-Za-z]+[[:space:]]+)*(final[[:space:]]+)?class[[:space:]]+$1([^A-Za-z0-9_]|$)" "$dir"/*.swift 2>/dev/null; then
			echo "Apex$dir"
			return
		fi
	done
}

# Map rules matching one path: prints their targets (classes, ALL or NONE), one per line; nothing when no rule matches.
map_targets() {
	local prefix targets
	while IFS=$'\t' read -r prefix targets; do
		case "$1" in
		"$prefix"*) ;;
		*) [ "$prefix" = "*.md" ] && [[ "$1" == *.md ]] || continue ;;
		esac
		printf '%s\n' $targets
	done < <(rules)
}

# What one changed path runs: classes, ALL, or nothing.
targets_for() {
	local path="$1" found=""
	case "$path" in
	SnapshotTests/__Snapshots__/*) found="$(echo "$path" | cut -d/ -f3)" ;;
	UITests/Support/*) ;;
	UITests/* | SnapshotTests/*)
		found="$(types_in_file "$path")"
		# A deleted test file: its name says which class it held.
		[ -n "$found" ] || [ -f "$path" ] || found="$(basename "$path" .swift | cut -d+ -f1)"
		;;
	esac
	[ -n "$found" ] || found="$(map_targets "$path")"
	if [ -z "$found" ]; then
		echo "no rule for $path: running everything" >&2
		echo ALL
		return
	fi
	found="$(echo "$found" | awk '!seen[$0]++')"
	local runs
	runs="$(echo "$found" | grep -vx NONE | tr '\n' ' ' | sed 's/ $//')"
	echo "$path → ${runs:-nothing}" >&2
	echo "$found" | grep -vx NONE || true
}

check_map() {
	local status=0 class mapped declared
	mapped="$(rules | cut -f2 | tr ' ' '\n' | grep -vx -e ALL -e NONE -e '' | sort -u)"
	for class in $mapped; do
		[ -n "$(target_of "$class")" ] || { echo "the map names $class, which no test file declares"; status=1; }
	done
	declared="$(for dir in "${test_dirs[@]}"; do for f in "$dir"/*.swift; do types_in_file "$f"; done; done | sort -u)"
	for class in $declared; do
		grep -qx "$class" <<<"$mapped" || { echo "$class is not in the map ($map)"; status=1; }
	done
	return $status
}

if [ "${1:-}" = "--check-map" ]; then
	check_map
	exit
fi

merge_base="$(git merge-base "${1:-origin/main}" HEAD)"
# --relative: only paths under apex-ios/, written from it. --no-renames: a moved file counts under its old path too.
# core.quotePath=false: git otherwise prints a path with a non-ASCII character quoted and escaped, and no rule
# matches that.
changed="$({
	git -c core.quotePath=false diff --name-only --relative --no-renames "$merge_base"
	git -c core.quotePath=false ls-files --others --exclude-standard
} | sort -u)"

# The classes to run, or ALL alone as soon as anything asks for everything.
picked=""
while IFS= read -r path; do
	[ -n "$path" ] || continue
	for target in $(targets_for "$path"); do
		if [ "$target" = ALL ]; then
			echo ALL
			exit 0
		fi
		picked+="$target"$'\n'
	done
done <<<"$changed"

ids=""
for class in $(echo "$picked" | sort -u); do
	target="$(target_of "$class")"
	if [ -z "$target" ]; then
		echo "no test file declares $class: running everything" >&2
		echo ALL
		exit 0
	fi
	ids+="$target/$class"$'\n'
done
printf '%s' "$ids" | sort
