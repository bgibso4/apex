@AGENTS.md

# Claude Code notes

Rules, commands and the definition of done are in AGENTS.md. This file holds what is specific to Claude Code.

## Where we are

Foundation, plan 2 of 5 merged: the skeleton and the hooks. No product screen exists yet.

## Hooks (committed in the root `.claude/settings.json`, scripts in `apex-ios/scripts/hooks/`)

- **Stop / SubagentStop gate** (`stop-gate.sh`): runs `make fast` only when the branch changed Swift under `apex-ios/` and the Swift content fingerprint differs from `apex-ios/.build/apex-fast-green` (any edit method; survives commits). Failing tests and compiler errors lead the block message. After 3 failed attempts it hands back with a message. Internal errors block loudly. If `jq` is missing it fails open with a message.
- **Format on edit** (`format-on-edit.sh`): formats edited Swift files under `apex-ios/`.
- **Guards** (PreToolUse): `guard-generated.sh` blocks edits to the generated `.xcodeproj` and `Generated/` under `apex-ios/`; `guard-hook-bypass.sh` blocks the git hook-bypass flags named in AGENTS.md's hard rules.
- A green stop gate means the Mac tests pass. It does not compile `Screens` or the app: run `make build`.
- No hook acts on work outside `apex-ios/`, except the guard against bypassing git hooks, which applies to every commit.
- Hook behaviour is covered by `make test-hooks`. Changing hook config needs Ben's OK.

## Verification

Use the `ios-verifier` agent for build and test evidence (see the definition of done in AGENTS.md). Ask it for the make targets, not raw `xcodebuild test`.

## Workspace

- Personal agent tooling (XcodeBuildMCP, Axiom, SwiftUI skills) comes from arsenal via `arms apply`: local scope, never committed.
- The root `.claude/settings.json` (project hooks) IS committed, by approved exception. **Never commit** `.claude/skills/`, `skills-lock.json`, `.claude/settings.local.json`, `.claude/launch.json` or `.herdr/`.
