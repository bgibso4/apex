#!/usr/bin/env bash
# Content fingerprint of everything that goes into the simulator build, so `make retest` can tell whether the last
# build still matches the sources. Leaves out what the build does not read: docs, Markdown, the design folder (but
# not design/tokens.json), scripts other than the token generator, and the pictures' reference images (the tests
# read those from disk when they run).
#   build-fingerprint.sh            print the current fingerprint
#   build-fingerprint.sh current    exit 0 when it equals the one recorded after the last good build
#   build-fingerprint.sh record FP  record FP (apex-ios/.build/apex-test-build)
#   build-fingerprint.sh forget     drop the record (`make build` and `make snapshots-record` call this first)
set -euo pipefail
cd "$(git rev-parse --show-toplevel)/apex-ios"
recorded=".build/apex-test-build"

fingerprint() {
	git ls-files -co --exclude-standard -z | sort -z |
		while IFS= read -r -d '' file; do
			case "$file" in
			design/tokens.json | scripts/generate-tokens.swift) ;;
			docs/* | design/* | scripts/* | SnapshotTests/__Snapshots__/* | *.md) continue ;;
			esac
			[ -f "$file" ] && printf '%s\0' "$file"
		done | xargs -0 shasum -a 256 | shasum -a 256 | cut -d' ' -f1
}

case "${1:-print}" in
print) fingerprint ;;
current) [ "$(cat "$recorded" 2>/dev/null || true)" = "$(fingerprint)" ] ;;
forget) rm -f "$recorded" ;;
record)
	mkdir -p .build
	printf '%s\n' "${2:?fingerprint required}" >"$recorded"
	;;
*) echo "usage: build-fingerprint.sh [print|current|record FP|forget]" >&2; exit 64 ;;
esac
