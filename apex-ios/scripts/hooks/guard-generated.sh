#!/usr/bin/env bash
# PreToolUse (Edit|Write|MultiEdit): generated files under apex-ios/ are never edited by hand.
set -euo pipefail
# A checkout without apex-ios/ (an older branch) is none of this hook's business.
[ -d "${CLAUDE_PROJECT_DIR:-$PWD}/apex-ios" ] || exit 0
command -v jq >/dev/null || { echo "jq missing: brew install jq" >&2; exit 2; }
file="$(jq -r '.tool_input.file_path // empty')"
case "$file" in
*/apex-ios/*.xcodeproj/* | */apex-ios/*/Generated/*)
	echo "Blocked: $file is generated. Change its source (project.yml, the tokens source) and run 'make -C apex-ios generate'." >&2
	exit 2
	;;
esac
exit 0
