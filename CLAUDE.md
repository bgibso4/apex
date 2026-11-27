# APEX

Two apps live in this repo and share only this root. One pull request touches one side.

| Work on | Folder | Read first |
|---|---|---|
| The native iOS app · all new work | `apex-ios/` | Not created yet. Design: `docs/superpowers/specs/2026-11-27-ios-agentic-foundations-design.html` |
| The React Native app · frozen, critical fixes only | `apex-rn/` | `apex-rn/CLAUDE.md` |
| The Cloudflare Worker | `workers/health-api/` | `docs/superpowers/specs/2026-03-22-health-api-d1-design.md` |

- This file holds no rules. Each side's rules, tools and design tokens are its own; never apply one side's to the other.
- `docs/` is shared history from before the split. New iOS specs and plans go in `apex-ios/docs/`.
- `PRIVACY.md` stays at the root: its web address may be registered elsewhere.
