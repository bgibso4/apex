# Design

Ben's design export and what is made from it. Run commands as `make -C apex-ios <target>` from the repo root.

| Path | Is |
|---|---|
| `export/` | the export as imported: the demos, the phone-only pages in `app/`, the decision logs, the notes, the design system |
| `tokens.json` | the app's design tokens, written from `export/APEX README.md`; `make generate` turns them into Swift |
| `states.json` | the designed states that have a reference image: state name, demo page, the switches that reach it |
| `mocks/<state>.png` | the reference images, written by `make mocks` and committed |

## Rules

1. Never edit `export/` by hand. A new export arrives only through `make design-import`.
2. The design system is `export/APEX README.md`. The copy under `export/_ds/` is stale; never read values from it.
3. The export's own rules hold (`export/CLAUDE.md`): only options stamped Locked count, the highest turn wins, and where a demo and a Motion tile differ the tile is right.
4. `shots/` (the exploration screenshots, about 140 MB) is left out of git, so Explorations pages show missing images.

## Commands

- `make design-import ZIP=<path>` · replaces `export/`, lists what changed against git, re-renders `mocks/`.
- `make mocks [STATE=<name>]` · renders the reference images. Needs the network and Google Chrome.

## When a new export arrives

Ben gives the zip's path and never diffs anything himself. A session does the rest, on a new branch:

1. `make design-import ZIP=<path>`. It lists the files added (`??`), removed (` D`) and changed (` M`).
2. Read the text diffs to learn what changed: `git diff -- 'design/export/*.md'` covers the `*-decisions.md` logs, `inventory.md`, `APEX README.md` and the notes.
3. If the design system's values changed, update `tokens.json` and run `make generate`.
4. Open every image under `mocks/` that git shows as changed. A state that fails names a switch the demo no longer has: fix `states.json`.
5. Open the pull request. It lists the screens affected, as follow-up work.
