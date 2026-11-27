#!/usr/bin/env bash
# PostToolUse (Edit|Write|MultiEdit): format the edited Swift file in place. Only files under apex-ios/.
set -euo pipefail
# A checkout without apex-ios/ (an older branch) is none of this hook's business.
[ -d "${CLAUDE_PROJECT_DIR:-$PWD}/apex-ios" ] || exit 0
command -v jq >/dev/null || { echo "jq missing: brew install jq" >&2; exit 2; }
file="$(jq -r '.tool_input.file_path // empty')"
case "$file" in
*/apex-ios/*.swift) [ -f "$file" ] && swift format -i "$file" ;;
esac
exit 0
