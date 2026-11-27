#!/usr/bin/env bash
# Content fingerprint of what the Mac tests depend on: every non-ignored Swift source under apex-ios/ and
# design/tokens.json.
#   swift-fingerprint.sh            print the current fingerprint
#   swift-fingerprint.sh current    exit 0 when it equals the recorded green fingerprint
#   swift-fingerprint.sh record FP  record FP as verified green (apex-ios/.build/apex-fast-green)
#   swift-fingerprint.sh untouched  exit 0 when none of those files differ from the merge base with main
set -euo pipefail
cd "$(git rev-parse --show-toplevel)/apex-ios"
green=".build/apex-fast-green"
# Relative to apex-ios/, so nothing outside it is ever hashed or compared.
covered=('*.swift' design/tokens.json)

fingerprint() {
	# Hash each file (path + content), then hash the sorted list. Deleted-but-tracked files are skipped.
	git ls-files -co --exclude-standard -z -- "${covered[@]}" | sort -z |
		while IFS= read -r -d '' file; do
			if [ -f "$file" ]; then
				printf '%s  %s\n' "$(shasum -a 256 <"$file" | cut -d' ' -f1)" "$file"
			fi
		done | shasum -a 256 | cut -d' ' -f1
}

# The working tree (untracked files included) against the merge base with origin/main, or main when there is no
# remote. With neither ref there is nothing to compare against, and that counts as touched.
untouched() {
	local ref base
	for ref in origin/main main; do
		git rev-parse --verify --quiet "$ref" >/dev/null || continue
		base="$(git merge-base HEAD "$ref")"
		git diff --quiet "$base" -- "${covered[@]}" || return 1
		[ -z "$(git ls-files -o --exclude-standard -- "${covered[@]}")" ]
		return
	done
	return 1
}

case "${1:-print}" in
print) fingerprint ;;
current) [ "$(cat "$green" 2>/dev/null || true)" = "$(fingerprint)" ] ;;
record)
	mkdir -p .build
	printf '%s\n' "${2:?fingerprint required}" >"$green"
	;;
untouched) untouched ;;
*) echo "usage: swift-fingerprint.sh [print|current|record FP|untouched]" >&2; exit 64 ;;
esac
