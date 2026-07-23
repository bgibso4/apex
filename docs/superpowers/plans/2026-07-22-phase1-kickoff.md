# Phase 1 Kickoff — Foundations Codification + Workout Flow (Wave 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Codify the locked Precision Blue direction into the claude.ai design-system foundations (replacing the indigo-era pages), then design the first campaign wave — the complete Workout flow as full-screen mockups with the folded issue fixes (#66, #46, #69, #65-entry, #67) designed in — and sync everything for Ben's review.

**Architecture:** All pages are self-contained HTML under `docs/design-system/` (repo paths mirror remote paths), authored against a shared phone-frame screen template whose `:root` is the canonical generated token block from the cadre repo. Foundations pages overwrite the stale indigo pages at the same remote paths; wave-1 screens land in a new `screens/` directory with dated round filenames; the two stale indigo component pages are deleted remotely (core components get re-extracted from the locked Workout designs at wave end). DesignSync pushes the batch; Ben reacts at claude.ai/design; reactions drive Round 2.

**Tech Stack:** Hand-written HTML/CSS (no build step), canonical tokens from `/Users/ben/projects/cadre/generated/css/apex-tokens.css`, DesignSync (claude.ai project `d6ba3f54-69ba-40fe-aa51-48b8a8d6bcd0`), git.

**Campaign roadmap (context, not tasked here):** Wave 1 = foundations + Workout flow (this plan). Wave 2 = Home (3 states + #70 in-progress surfacing). Wave 3 = Progress (#68) + Exercise/Session detail (#65). Wave 4 = Running. Wave 5 = Library, Settings, Program completion + reserved nav entry points (#64/#71/#73/#63/#49). Each subsequent wave gets its own plan after the prior wave locks, per the spec's pipelining rule.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-15-swiftui-migration-redesign-design.md` — Phase 1 section governs this plan.
- Charter is BINDING: `docs/design-system/context/design-language.html` — the seven laws, the locked structure table, and the locked typography scale. Read it before authoring anything.
- Canonical tokens: copy the entire `:root` block VERBATIM from `/Users/ben/projects/cadre/generated/css/apex-tokens.css` — never retype a hex. The halo background recipe is that file's comment line: `radial-gradient(ellipse 90% 45% at 50% -5%, var(--halo) 0%, var(--field-mid) 55%, var(--field-base) 100%)`.
- Two hues only: `--accent` (now) and `--logged` (earned), plus their generated 10%-alpha tints. **A third hue is a defect.** Negative/cautionary states (weight-down suggestions, destructive actions, misses) are carried by neutral text, weight, and copy — not by a red/amber hue. If a screen genuinely cannot work under this rule, STOP and surface it to Ben as a charter question; never silently add a hue.
- Typography (charter, exact): screen titles 20px/800/−0.3px; card names 14px/700; hero numerals 34px/800 `tabular-nums`; values 13px/600 `tabular-nums`; eyebrows 10px/700/uppercase/+1.1px tracking; system font stack; Orbitron 800 reserved for the ΛPEX wordmark (approximate with system stack + letter-spacing, caption it).
- Radii: 10px cards, 6px nested, 999px pills. Hairline borders `--border`, top edge `--border-lt` only (the machined highlight).
- Branch: `design/phase1-campaign` off current `main`. Commit per task. Push + open PR at handoff; NEVER merge without Ben.
- Every synced page's first line is a dsCard marker. Foundations pages: `<!-- @dsCard group="Foundations" -->`. Wave-1 screen pages: `<!-- @dsCard group="Workout Flow — R1" -->`.
- Local root for synced files: `/Users/ben/projects/apex/docs/design-system/` — local relative path MUST equal remote path (DesignSync `localDir` contract). `templates/` is never synced.
- Self-contained HTML: inline CSS only, zero external requests (strict CSP on claude.ai). `backdrop-filter` is allowed (no network).
- `#6366f1` (retired indigo) must not appear in any new or rewritten file.
- Tap targets: every interactive element ≥ 44×44 CSS px. The one-tap-log common case must be visibly demonstrated in the logging screen.
- All colors flow through the `:root` custom properties — the only hex literals in any file are on `--token:` definition lines.
- Content parity sources (implementers read before authoring — data shapes and states must be real, not invented): `docs/mockups/workout-rpe-suggestion-2026-07-14.html` (logging card, RPE row, suggestion states), `docs/mockups/superset-workout-logging-2026-03-17.html` (superset grouping), `docs/mockups/warmup-timer-2026-03-10.html` (warmup protocol content), `docs/mockups/workout-complete-edit-2026-03-11.html` (summary content + timestamp editing), `docs/mockups/workout-select-titles-v3-2026-03-12.html` (select state), `app/(tabs)/workout.tsx` (real screen states).
- **Amendment 2026-07-23 (canonical alignment):** the canonical `tokens/apex.json` `type` block pins eyebrow 10px and body 11px; the plan originally carried 9.5px/13px. Canonical governs. Template + foundations pages aligned in the fix commit; Tasks 5–10 must use eyebrow-form 10px and body-role 11px. `type.value.size` stays 13.

---

### Task 1: Branch + phone-frame screen template

**Files:**
- Create: `docs/design-system/templates/screen-template.html`
- Create: `docs/design-system/screens/` (directory)

**Interfaces:**
- Produces: the shared CSS contract every wave-1 screen copies: the verbatim token `:root` (+ mockup-chrome-only `--page`), classes `.frame .screen .statusbar .content .card .card-name .eyebrow .screen-title .num-hero .val .set-row .set-n .set-val .tap .pill .btn-primary .btn-quiet .suggest .tabbar .tabbar.glass .tab .cap .home-ind`
- Produces: the two-frame page layout (`.stage` flex row) so one file can show multiple states side by side.

- [x] **Step 1: Check out the campaign branch (already created with this plan committed) and create the directory**

```bash
cd /Users/ben/projects/apex && git checkout design/phase1-campaign
mkdir -p docs/design-system/screens
```

- [x] **Step 2: Write the template**

Write `docs/design-system/templates/screen-template.html` with exactly this content (the `:root` token block below was copied verbatim from `generated/css/apex-tokens.css` — re-verify against the file before writing):

```html
<!-- TEMPLATE — not synced. Copy to screens/<date>-<name>-r<N>.html, keep the :root verbatim, replace [BRACKETED] content. -->
<meta charset="utf-8">
<title>[SCREEN NAME] — APEX Wave 1</title>
<style>
  :root {
    /* === CANONICAL — from cadre generated/css/apex-tokens.css. Do not edit here. === */
    --field-base:#090A0C;
    --field-mid:#0C0E11;
    --halo:#141A22;
    --card-top:#14161B;
    --card-base:#0E1013;
    --border:#20232A;
    --border-lt:#2C3039;
    --text:#EDEEF0;
    --text-2:#8F9098;
    --text-muted:#55575F;
    --accent:#659BC8;
    --on-accent:#0B0C0E;
    --logged:#6CA383;
    --accent-tint:#659BC81A;
    --logged-tint:#6CA3831A;
    --r-card:10px;
    --r-nested:6px;
    --r-pill:999px;
    /* === mockup chrome only (not app tokens) === */
    --page:#050506;
  }
  * { margin:0; box-sizing:border-box; font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif; }
  body { background:var(--page); padding:36px 24px; }
  .pagehead { max-width:900px; margin:0 auto 24px; }
  .pagehead h1 { color:var(--text); font-size:20px; font-weight:800; letter-spacing:-0.3px; }
  .pagehead p { color:var(--text-2); font-size:13px; line-height:1.55; margin-top:6px; max-width:640px; }
  .stage { display:flex; gap:28px; justify-content:center; flex-wrap:wrap; align-items:flex-start; }
  .frame { width:390px; border:1px solid var(--border); border-radius:44px; overflow:hidden; flex-shrink:0; }
  .frame-label { color:var(--text-muted); font-size:10px; font-weight:700; text-transform:uppercase;
                 letter-spacing:1.1px; text-align:center; margin:10px 0 8px; }
  .screen { min-height:844px; display:flex; flex-direction:column;
            background:radial-gradient(ellipse 90% 45% at 50% -5%, var(--halo) 0%, var(--field-mid) 55%, var(--field-base) 100%); }
  .statusbar { height:54px; display:flex; align-items:flex-end; justify-content:space-between;
               padding:0 28px 6px; color:var(--text); font-size:13px; font-weight:600; }
  .content { flex:1; padding:8px 20px 24px; }
  .screen-title { color:var(--text); font-size:20px; font-weight:800; letter-spacing:-0.3px; }
  .eyebrow { color:var(--text-muted); font-size:9.5px; font-weight:700; text-transform:uppercase; letter-spacing:1.1px; }
  .card { background:linear-gradient(180deg, var(--card-top) 0%, var(--card-base) 100%);
          border:1px solid var(--border); border-top-color:var(--border-lt);
          border-radius:var(--r-card); padding:14px 16px; }
  .card-name { color:var(--text); font-size:14px; font-weight:700; }
  .num-hero { color:var(--text); font-size:34px; font-weight:800; font-variant-numeric:tabular-nums; letter-spacing:-0.5px; }
  .val { color:var(--text); font-size:13px; font-weight:600; font-variant-numeric:tabular-nums; }
  .set-row { display:flex; align-items:center; gap:12px; min-height:48px; border-bottom:1px solid var(--border); }
  .set-row:last-child { border-bottom:none; }
  .set-n { width:20px; color:var(--text-muted); font-size:11px; font-weight:700; font-variant-numeric:tabular-nums; }
  .set-val { flex:1; }
  .tap { min-width:44px; min-height:44px; border-radius:var(--r-nested); border:1px solid var(--border-lt);
         display:flex; align-items:center; justify-content:center; color:var(--text-muted); font-size:15px; }
  .tap.done { background:var(--logged-tint); border-color:var(--logged); color:var(--logged); }
  .tap.current { border-color:var(--accent); color:var(--accent); }
  .pill { display:inline-block; padding:4px 10px; border-radius:var(--r-pill); font-size:9.5px; font-weight:700;
          text-transform:uppercase; letter-spacing:0.8px; color:var(--text-2); border:1px solid var(--border-lt); }
  .pill.now { background:var(--accent-tint); color:var(--accent); border-color:var(--accent); }
  .btn-primary { display:flex; align-items:center; justify-content:center; min-height:50px; border-radius:var(--r-card);
                 background:var(--accent); color:var(--on-accent); font-size:15px; font-weight:700; }
  .btn-quiet { display:flex; align-items:center; justify-content:center; min-height:44px; border-radius:var(--r-nested);
               border:1px solid var(--border-lt); color:var(--text-2); font-size:13px; font-weight:600; }
  .suggest { display:flex; align-items:center; gap:10px; padding:10px 12px; margin-top:12px;
             background:var(--logged-tint); border:1px solid var(--logged); border-radius:var(--r-nested);
             color:var(--text); font-size:13px; }
  .tabbar { display:flex; align-items:stretch; border-top:1px solid var(--border);
            background:var(--field-base); padding-bottom:8px; }
  .tabbar.glass { background:rgba(12,14,17,0.72); backdrop-filter:blur(18px) saturate(1.1); }
  .tab { flex:1; min-height:56px; display:flex; flex-direction:column; align-items:center; justify-content:center;
         gap:3px; color:var(--text-muted); font-size:9.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; }
  .tab.active { color:var(--accent); }
  .tab .ic { font-size:18px; }
  .home-ind { width:130px; height:5px; border-radius:var(--r-pill); background:var(--border-lt); margin:6px auto 8px; }
  .cap { color:var(--text-muted); font-size:11px; line-height:1.5; max-width:640px; margin:20px auto 0; text-align:center; }
</style>

<div class="pagehead">
  <h1>[SCREEN NAME]</h1>
  <p>[2–3 sentences: what this screen does, which issue fixes are designed in, what Ben should judge.]</p>
</div>

<div class="stage">
  <div>
    <div class="frame"><div class="screen">
      <div class="statusbar"><span>9:41</span><span>100%</span></div>
      <div class="content">[SCREEN CONTENT]</div>
      <div class="tabbar">
        <div class="tab"><span class="ic">⌂</span>Home</div>
        <div class="tab active"><span class="ic">◉</span>Workout</div>
        <div class="tab"><span class="ic">↗</span>Progress</div>
        <div class="tab"><span class="ic">➜</span>Run</div>
      </div>
      <div class="home-ind"></div>
    </div></div>
    <div class="frame-label">[STATE LABEL]</div>
  </div>
</div>

<p class="cap">[Caption: interaction notes — what is one tap, what is disclosed on demand.]</p>
```

- [x] **Step 3: Verify the template renders**

Run: `open /Users/ben/projects/apex/docs/design-system/templates/screen-template.html`
Expected: one phone frame on near-black page; halo visible at top of screen; card/tab styles resolve; zero network requests.
Run: `grep -nE '#[0-9a-fA-F]{3,8}' docs/design-system/templates/screen-template.html | grep -vE '^\s*[0-9]+:\s*(/\*.*|--)'` → no output (hex only on token-definition lines).

- [x] **Step 4: Commit**

```bash
git add docs/design-system/templates/screen-template.html
git commit -m "design: phase 1 phone-frame screen template (#61)"
```

---

### Task 2: Foundations — colors (rewrite in Precision Blue)

**Files:**
- Create (overwrites remote page at same path): `docs/design-system/foundations/colors.html`

**Interfaces:**
- Consumes: template `:root` contract (Task 1), charter color model
- Produces: remote `foundations/colors.html` — the standing color reference every future design session reads

- [x] **Step 1: Write the page**

First line `<!-- @dsCard group="Foundations" -->`. Use the template's CSS conventions (verbatim `:root`, page styles adapted for a document rather than a phone frame). Content sections, this exact substance:

1. **The model** — neutral field + exactly two hues. Accent `#659BC8` = *now* (current set, selection, primary CTA); moss `#6CA383` = *earned* (logged, complete, positive delta). Tints are always 10%-alpha derivatives, never hand-picked. If a third hue appears, the design is wrong. Negative/cautionary states use neutral text + copy, never a hue.
2. **The neutral ramp** — swatch rows for field-base/field-mid/halo/card-top/card-base/border/border-lt/text/text-2/text-muted with hex + role (roles from the charter's locked-values table).
3. **The light** — the one-light rule rendered live: a demo block showing the halo gradient recipe and a card with the vertical gradient + `--border-lt` top edge; the CSS recipes printed as code beneath each.
4. **The accent parameter** — accent is a token, not a decision: default dusty blue `#659BC8` (confirmed v8), alternate dusty violet `#8A91C9` (halo follows: blue → `#141A22`, violet → `#161821`). Render the same mini logging card twice, once per accent, labeled "one-line token swap". The violet card's `:root`-scoped override lives in a locally-scoped `<style>` var override, not new hex in components.
5. **Provenance** — tokens are generated from `tokens/apex.json` in the cadre repo (`npm run tokens`); this page and every screen copy the generated `:root` verbatim; the retired indigo system survives only in `context/current-state-inventory.html`.

- [x] **Step 2: Verify**

Run: `head -1 docs/design-system/foundations/colors.html` → `<!-- @dsCard group="Foundations" -->`
Run: `grep -c '6366f1' docs/design-system/foundations/colors.html` → `0`
Run: `open docs/design-system/foundations/colors.html` → renders; the two accent-variant cards visibly differ only in accent/halo.
Hex-discipline check from Task 1 Step 3 (violet alternate values `#8A91C9`/`#161821` are allowed ONLY as var overrides/swatch-data, still on `--`-prefixed or swatch-inline-var lines — if the implementer needs them as data attributes, define `--accent-alt:#8A91C9; --halo-alt:#161821;` in `:root` and reference vars).

- [x] **Step 3: Commit**

```bash
git add docs/design-system/foundations/colors.html
git commit -m "design: foundations colors codified to Precision Blue (#61)"
```

---

### Task 3: Foundations — typography (rewrite)

**Files:**
- Create (overwrites remote): `docs/design-system/foundations/typography.html`

**Interfaces:** consumes template contract; produces remote `foundations/typography.html`.

- [x] **Step 1: Write the page**

First line `<!-- @dsCard group="Foundations" -->`. Content:

1. **Scale** — live rendered rows, largest first, each with spec label: hero numeral 34/800 tabular −0.5 ("315 lb"); screen title 20/800/−0.3 ("Workout"); card name 14/700 ("Bench Press"); value 13/600 tabular ("185 lb × 5"); body 13/400 `--text-2`; eyebrow 9.5/700/caps/+1.1 ("Estimated 1RM"); index/muted 11/700 `--text-muted`.
2. **Laws in type** — biggest number wins (hierarchy by size/weight, never color); numerals always tabular; titles tracked tight, eyebrows tracked wide — the signature tension.
3. **Wordmark** — ΛPEX, Orbitron 800, reserved exclusively for the wordmark; approximated here with system stack + letter-spacing (caption says so).
4. **Dynamic Type** — these are reference sizes at default scale; SwiftUI text styles map at build time and must scale.

- [x] **Step 2: Verify** — marker check, indigo check, hex-discipline check, `open` renders.

- [x] **Step 3: Commit**

```bash
git add docs/design-system/foundations/typography.html
git commit -m "design: foundations typography codified (#61)"
```

---

### Task 4: Foundations — surfaces & spacing (rewrite)

**Files:**
- Create (overwrites remote): `docs/design-system/foundations/spacing.html`

**Interfaces:** consumes template contract; produces remote `foundations/spacing.html`.

- [x] **Step 1: Write the page**

First line `<!-- @dsCard group="Foundations" -->`. Content:

1. **Radii** — 10 card / 6 nested / 999 pill, rendered on live shapes; "tight, machined."
2. **Depth** — the complete elevation model: halo (room) + card gradient with `--border-lt` top edge (object); depth sums, never stacks; no shadows, no glows.
3. **Spacing scale (PROPOSED — confirmed through wave-1 screens, flagged as such on the page)** — 4-pt base: 4/8/12/16/20/24; screen horizontal padding 20; card padding 14×16; inter-card gap 12; section gap 24; set-row min-height 48; tap targets ≥44.
4. **Hairlines** — 1px `--border` everywhere; `--border-lt` only ever on a top edge.

- [x] **Step 2: Verify** — marker, indigo, hex-discipline checks; `open` renders.

- [x] **Step 3: Commit**

```bash
git add docs/design-system/foundations/spacing.html
git commit -m "design: foundations surfaces + spacing codified (#61)"
```

---

### Task 5: Screen — Workout logging (the hero)

**Files:**
- Create: `docs/design-system/screens/2026-07-22-workout-logging-r1.html`

**Interfaces:**
- Consumes: template (Task 1) copied whole; content parity sources (Global Constraints) — READ `workout-rpe-suggestion-2026-07-14.html` and `superset-workout-logging-2026-03-17.html` first
- Produces: the wave's reference implementation of the card language — later tasks match its idioms

- [x] **Step 1: Author the screen**

First line `<!-- @dsCard group="Workout Flow — R1" -->`. Three frames side by side (`.stage`), real Pillars-shaped data from the parity sources:

- **Frame 1 — mid-session common case:** header (session eyebrow + screen title + progress), one collapsed completed exercise card (moss states), the active exercise card expanded: card name + prescription line (`3 × 8 @ 95 lb · RPE ≤ 7`), set rows with one-tap ✓ (done=moss, current=accent-outlined, pending=neutral), RPE row appearing after last set, Finish button quiet until all sets touched. Every `#66` fix visible: ≥44pt taps, an explicit `+ Add set` row at the bottom of the set list, per-row overflow affordance (`···` ≥44pt) implying remove/edit without accidental collapse — tapping a row NEVER collapses the card (state the rule in the caption).
- **Frame 2 — RPE suggestion moment:** same card with the post-log suggestion chip (moss tint): `↑ Felt easy — 100 lb next session?` with ✓/✕ affordances (44pt), matching the states in `workout-rpe-suggestion-2026-07-14.html`. Include the weight-DOWN variant in neutral styling (no third hue) beneath it, labeled.
- **Frame 3 — superset grouping:** two exercises visually grouped per `superset-workout-logging-2026-03-17.html`, alternating set order legible, group boundary carried by structure (bracket/inset), not color.

Caption: the one-tap law ("logging as prescribed is one tap — everything else is disclosure"), the no-collapse rule, where notes live (collapsed, keyboard-safe per #67 — input anchors above keyboard when opened).

- [x] **Step 2: Verify** — marker, indigo, hex-discipline checks. `open` → three frames render; visually confirm: no third hue anywhere, all interactive elements ≥44px, halo + card top-light present, biggest number on screen is the working weight.

- [x] **Step 3: Commit**

```bash
git add docs/design-system/screens/2026-07-22-workout-logging-r1.html
git commit -m "design: wave 1 — workout logging screen R1 (#61 #66)"
```

---

### Task 6: Screen — Workout select + block identity options

**Files:**
- Create: `docs/design-system/screens/2026-07-22-workout-select-r1.html`

**Interfaces:** consumes template + `workout-select-titles-v3-2026-03-12.html` + `app/(tabs)/workout.tsx` (select state); produces the block-identity decision input (charter open question #4).

- [x] **Step 1: Author the screen**

First line `<!-- @dsCard group="Workout Flow — R1" -->`. Two frames:

- **Frame 1 — day select:** week context (eyebrow: block + week), day cards for the week with day name, focus summary, done/today/upcoming states (moss check / accent ring / neutral), start CTA on today's card. Day-selector affordance consistent with current app behavior.
- **Frame 2 — the same screen rendered with the three block-identity treatments stacked as labeled variants** (this is the decision aid): **A** text designation only (eyebrow `STRENGTH · WEEK 5`); **B** luminance step (block name carries a brighter text step, no hue); **C** accent-tinted marker (small accent-tint chip). All three obey the two-hue budget. Caption asks Ben to pick or blend.

- [x] **Step 2: Verify** — standard checks (marker, indigo, hex-discipline, render, 44pt).

- [x] **Step 3: Commit**

```bash
git add docs/design-system/screens/2026-07-22-workout-select-r1.html
git commit -m "design: wave 1 — workout select + block identity options R1 (#61)"
```

---

### Task 7: Screen — Warmup with expandable protocols (#46)

**Files:**
- Create: `docs/design-system/screens/2026-07-22-workout-warmup-r1.html`

**Interfaces:** consumes template + `warmup-timer-2026-03-10.html` (protocol content, timer placement); produces the #46 design.

- [x] **Step 1: Author the screen**

First line `<!-- @dsCard group="Workout Flow — R1" -->`. Two frames:

- **Frame 1 — collapsed (common case):** warmup card with protocol name rows + one-tap complete checks (moss when done), timer affordance where the current mockup places it, skip affordance (quiet).
- **Frame 2 — one protocol expanded (#46):** the protocol's steps disclosed inline (step rows with set/rep/duration values from the parity mockup), expansion is progressive disclosure — collapsed stays the default. Caption: expanding never blocks logging; a protocol is completable from collapsed state.

- [x] **Step 2: Verify** — standard checks.

- [x] **Step 3: Commit**

```bash
git add docs/design-system/screens/2026-07-22-workout-warmup-r1.html
git commit -m "design: wave 1 — warmup expandable protocols R1 (#61 #46)"
```

---

### Task 8: Screen — Workout complete (#69, #65 entry)

**Files:**
- Create: `docs/design-system/screens/2026-07-22-workout-complete-r1.html`

**Interfaces:** consumes template + `workout-complete-edit-2026-03-11.html`; produces the #69 single-step finish design.

- [x] **Step 1: Author the screen**

First line `<!-- @dsCard group="Workout Flow — R1" -->`. Two frames:

- **Frame 1 — summary:** session headline numbers (duration, volume, sets — hero numerals, biggest number wins), per-exercise result rows (moss where logged as/above prescription, neutral otherwise, deltas in moss when positive), PR callout row if earned (moss, quiet — the instrument never cheers, per law 1), single primary `Done` action. **#69: finishing is ONE action** — no redundant save prompt; the caption states "Finish Workout on the logging screen commits the session; this screen is confirmation + review, its Done just dismisses."
- **Frame 2 — timestamp edit affordance (#65 entry):** the same summary with the started/completed times row in edit state (tappable values, keyboard-safe), showing where #65 lives.

- [x] **Step 2: Verify** — standard checks.

- [x] **Step 3: Commit**

```bash
git add docs/design-system/screens/2026-07-22-workout-complete-r1.html
git commit -m "design: wave 1 — workout complete R1 (#61 #69 #65)"
```

---

### Task 9: Screens — Add-exercise + Adjust sheets (#67 rule)

**Files:**
- Create: `docs/design-system/screens/2026-07-22-workout-sheets-r1.html`

**Interfaces:** consumes template + `app/(tabs)/workout.tsx` (AdjustModal/AddExerciseModal states); produces the sheet treatment every later modal follows.

- [x] **Step 1: Author the screen**

First line `<!-- @dsCard group="Workout Flow — R1" -->`. Two frames, each a phone frame with the logging screen dimmed beneath a bottom sheet (sheet = card language on `--card-top`, grabber, 10px top radii):

- **Frame 1 — Adjust sheet:** weight/reps steppers with ≥44pt +/− targets, current value as the hero numeral, apply-to-remaining-sets toggle, primary apply button. Stepper increments honor `weight_increment`.
- **Frame 2 — Add-exercise sheet with keyboard up (#67):** search field + result rows; render the iOS keyboard as a blocked-out region and show the input anchored ABOVE it — the visual statement of the keyboard law: an input is never occluded. Caption states the rule binds every screen in the app.

- [x] **Step 2: Verify** — standard checks.

- [x] **Step 3: Commit**

```bash
git add docs/design-system/screens/2026-07-22-workout-sheets-r1.html
git commit -m "design: wave 1 — adjust + add-exercise sheets R1 (#61 #67)"
```

---

### Task 10: Page — Tab bar stance (Liquid Glass decision aid)

**Files:**
- Create: `docs/design-system/screens/2026-07-22-tabbar-stance-r1.html`

**Interfaces:** consumes template; produces the decision input for the charter's open Liquid Glass question (content cards stay painted-light — locked; this decides system chrome only).

- [x] **Step 1: Author the page**

First line `<!-- @dsCard group="Workout Flow — R1" -->`. Two frames of the SAME logging screen (reuse Task 5 frame-1 content, abbreviated), differing only in chrome:

- **Frame A — flat chrome:** `.tabbar` opaque `--field-base`, hairline top border. Label: "Resist — the instrument is one continuous painted surface."
- **Frame B — glass chrome:** `.tabbar.glass` (blur + translucency) over scrolled content (show content sliding under it). Label: "Blend — native glass for chrome only; cards stay painted."

Caption: the charter locks painted-light content cards either way; this choice covers tab bar + sheets; native SwiftUI gets the real material — this HTML approximates. Ask Ben to pick.

- [x] **Step 2: Verify** — standard checks; confirm the two frames' content is pixel-identical except chrome.

- [x] **Step 3: Commit**

```bash
git add docs/design-system/screens/2026-07-22-tabbar-stance-r1.html
git commit -m "design: wave 1 — tab bar stance comparison R1 (#61)"
```

---

### Task 11: Sync to claude.ai

**Files:** none locally (remote writes/deletes only)

**Interfaces:**
- Consumes: Tasks 2–10 outputs
- Produces: remote `foundations/{colors,typography,spacing}.html` (overwritten), `screens/2026-07-22-*.html` (6 new); remote deletes `components/buttons-pills.html`, `components/exercise-card.html` (stale indigo — re-extracted from locked wave-1 designs later)

- [x] **Step 1: Verify target** — DesignSync `get_project` projectId `d6ba3f54-69ba-40fe-aa51-48b8a8d6bcd0` → "APEX Design System", `canEdit: true`. STOP if not.

- [x] **Step 2: Read remote structure** — DesignSync `list_files`; confirm the three foundations paths + two components paths exist (they will be overwritten/deleted), and no `screens/` paths exist yet.

- [x] **Step 3: Finalize + write + delete** — `finalize_plan` with `localDir: "/Users/ben/projects/apex/docs/design-system"`, `writes: ["foundations/*.html", "screens/2026-07-22-*.html"]`, `deletes: ["components/buttons-pills.html", "components/exercise-card.html"]`. Then `write_files` (9 files as `{path, localPath}`, localPath = path) and `delete_files` (the 2 stale pages).

- [x] **Step 4: Verify remote** — `list_files` → all 9 present, 2 gone.

---

### Task 12: Handoff + round protocol

**Files:**
- Modify: `docs/superpowers/plans/2026-07-22-phase1-kickoff.md` (tick checkboxes)
- Modify: `.superpowers/sdd/progress.md` (ledger)

- [x] **Step 1: Push + PR**

```bash
git push -u origin design/phase1-campaign
gh pr create --title "design: Phase 1 wave 1 — foundations + workout flow R1 (#61)" --body "..."
```

Do NOT merge.

- [x] **Step 2: Hand off**

Final message tells Ben: claude.ai/design → APEX Design System → **Foundations** group (the codified system replacing indigo) + **Workout Flow — R1** group (6 pages). Decisions requested this round: (1) block identity A/B/C, (2) tab bar flat vs glass, (3) per-screen reactions keep/kill/blend. Round loop: reactions → R2 files (`screens/<date>-<name>-r2.html`, new dated files — versioning rule) → repeat → Ben declares Workout flow locked → locked screens convert to `docs/mockups/` dated HTML (the implementation contract) + core component pages re-extracted → Wave 2 (Home) plan. Note: Foundation plan (apex-ios scaffold) can run in parallel any time — no design dependency.

---

## Self-Review

- **Spec coverage:** Phase 1 wave 1 requires: foundations codification from the lock (Tasks 2–4 — the Phase 0 exit carry-over), Workout flow with #66 (Task 5), #46 (Task 7), #69 + #65 entry (Task 8), #67 rule (Task 9), day-selector/add-exercise/adjust modals (Tasks 6, 9), Liquid Glass decided at tab-bar design (Task 10), pipeline to `docs/mockups/` stated in round protocol (Task 12), versioned dated filenames throughout ✓. Home/#70 and remaining flows are later waves by design (roadmap section).
- **Placeholder scan:** template `[BRACKETED]` markers are replacement targets by design; each screen task specifies its actual content and parity sources; no TBDs.
- **Type consistency:** class contract in Task 1 matches usage in Tasks 5–10 (`.stage/.frame/.screen/.tap/.suggest/.tabbar.glass` etc.); token names match `generated/css/apex-tokens.css` exactly (`--accent`, `--logged`, `--r-card`…).
- **Charter consistency:** typography values match the charter verbatim; two-hue discipline enforced by grep + the no-third-hue constraint; halo/card recipes match the generated CSS comment.
