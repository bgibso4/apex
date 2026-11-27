# Design

Ben's design export and what is made from it. Run commands as `make -C apex-ios <target>` from the repo root.

| Path | Is |
|---|---|
| `export/` | the export as imported: the demos, the phone-only pages in `app/`, the decision logs, the notes, the design system |
| `tokens.json` | the app's design tokens, written from `export/APEX README.md`, and from the demos for a value they use that the README does not name (`card-title`, `accent-pressed`); `make generate` turns them into Swift |
| `states.json` | the designed states that have a reference image: state name, demo page, the switches that reach it |
| `mocks/<state>.png` | the reference images, written by `make mocks` and committed |

## Rules

The rules for this folder are among the hard rules in `AGENTS.md`: `export/` is never edited by hand, which file is the design system, and how the export's decisions are read. One fact belongs here only: `shots/` (the exploration screenshots, about 140 MB) is left out of git, so Explorations pages show missing images.

## Commands

- `make design-import ZIP=<path>` · replaces `export/`, lists what changed against git, re-renders `mocks/`.
- `make mocks [STATE=<name>]` · renders the reference images. Needs the network and Google Chrome.

## When a new export arrives

Ben gives the zip's path and never diffs anything himself. A session does the rest, on a new branch:

1. `make design-import ZIP=<path>`. It lists the files added (`??`), removed (` D`) and changed (` M`). A file marked `!!` matches an ignore rule and would never reach git: narrow the rule, never the export.
2. Read the text diffs to learn what changed. From the repo root: `git add -A apex-ios/design/export`, then `git diff --cached -- 'apex-ios/design/export/*.md'`. That covers the `*-decisions.md` logs, `inventory.md`, `APEX README.md` and the notes, new files included.
3. If the design system's values changed, update `tokens.json` and run `make generate`.
4. Open every image under `mocks/` that git shows as changed. A state that fails says why: a switch the demo no longer has (fix `states.json`), or a demo that never rendered (check the network).
5. Open the pull request. It lists the screens affected, as follow-up work.
