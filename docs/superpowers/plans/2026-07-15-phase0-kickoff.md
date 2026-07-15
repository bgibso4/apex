# Phase 0 Kickoff — Art Direction Round 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the synced "APEX Design System" claude.ai project with a redesign brief, a current-state inventory, and the first round of three art-direction specimen pages, so Ben can start reacting at claude.ai/design.

**Architecture:** All content is authored as self-contained HTML files under `docs/design-system/` (committed to the repo, mirroring the remote project's paths), then pushed to the existing claude.ai design-system project via the DesignSync tool. Specimens share one HTML template so every direction is judged on identical structure and content — only the `:root` token block and direction copy differ.

**Tech Stack:** Hand-written HTML/CSS (no build step), DesignSync tool (claude.ai project `d6ba3f54-69ba-40fe-aa51-48b8a8d6bcd0`), git.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-15-swiftui-migration-redesign-design.md` (Phase 0 section governs this plan)
- Branch: `docs/swiftui-migration-spec` (PR #78) — all commits land there
- claude.ai project: **"APEX Design System"**, projectId `d6ba3f54-69ba-40fe-aa51-48b8a8d6bcd0`, existing remote dirs: `foundations/`, `components/`, `context/`
- Local root for synced files: `/Users/ben/projects/apex/docs/design-system/` — local relative paths MUST equal remote paths (DesignSync `localDir` contract)
- Every synced preview page's **first line** is a dsCard marker: `<!-- @dsCard group="..." -->`
- Self-contained HTML only: inline CSS, system font stack, zero external requests (strict CSP on claude.ai). The APEX wordmark is Orbitron 800 in production — approximate with the system stack + letter-spacing and say so in a caption.
- All colors in template/specimens flow through CSS custom properties defined in `:root` — no raw hex below the `:root` block
- The current accent `#6366f1` (indigo) is what we're replacing — it may appear **only** in the current-state inventory page, never in a specimen
- Current baseline (for the inventory page; source: spec's Existing-System Reference + `@cadre/shared/theme`): bg `#0a0a0f`, card `#141420`, cardInset `#181824`, surface `#1e1e30`, border `#2a2a3e`, borderLight `#3a3a4e`, text `#ffffff`/`#a0a0b8`/`#6a6a80`/`#4a4a5e`, indigo `#6366f1`/`#818cf8`/`#4f46e5`, green `#22c55e`, amber `#f59e0b`, red `#ef4444`, cyan `#06b6d4` (Running), blocks: HYP=indigo, STR=amber, DEL=green, REA `#ec4899`
- Design bar (binding, from spec Principles): Ive-grade restraint; the hero composition in every specimen must demonstrate the one-tap-log common case
- Hero-card content parity: use the states and data shapes from `docs/mockups/workout-rpe-suggestion-2026-07-14.html` (read it before authoring the hero section)

---

### Task 1: Directory scaffold + shared specimen template

**Files:**
- Create: `docs/design-system/templates/specimen-template.html`
- Create: `docs/design-system/context/`, `docs/design-system/specimens/` (directories)

**Interfaces:**
- Produces: the CSS custom-property contract every specimen overrides:
  `--bg --card --card-inset --surface --border --border-lt --text --text-2 --text-dim --text-muted --accent --accent-lt --accent-dk --accent-tint --good --warn --bad --good-tint --warn-tint --bad-tint --blk-hyp --blk-str --blk-del --blk-rea --radius-card --radius-inner --radius-btn --radius-pill`
- Produces: the section skeleton every specimen fills: `#thesis`, `#palette`, `#type`, `#card-language`, `#hero`, `#stance`, `#tensions`

- [ ] **Step 1: Create the directories**

Run: `mkdir -p /Users/ben/projects/apex/docs/design-system/{templates,context,specimens}`

- [ ] **Step 2: Write the template**

Write `docs/design-system/templates/specimen-template.html`. NOTE: the template is not synced to claude.ai (only `context/` and `specimens/` are); its first line is a comment explaining that. Full content:

```html
<!-- TEMPLATE — not synced. Copy to specimens/<date>-rN-<direction>.html, replace the :root block and all [BRACKETED] copy. -->
<meta charset="utf-8">
<title>[DIRECTION NAME] — APEX Art Direction</title>
<style>
  :root {
    /* === REPLACE THIS ENTIRE BLOCK PER DIRECTION === */
    --bg:#000; --card:#111; --card-inset:#151515; --surface:#1a1a1a;
    --border:#2a2a2a; --border-lt:#3a3a3a;
    --text:#fff; --text-2:#aaa; --text-dim:#777; --text-muted:#555;
    --accent:#f0f; --accent-lt:#f6f; --accent-dk:#c0c; --accent-tint:#ff00ff1f;
    --good:#22c55e; --warn:#f59e0b; --bad:#ef4444;
    --good-tint:#22c55e1f; --warn-tint:#f59e0b1f; --bad-tint:#ef44441f;
    --blk-hyp:#f0f; --blk-str:#ff0; --blk-del:#0f0; --blk-rea:#f0f;
    --radius-card:16px; --radius-inner:12px; --radius-btn:10px; --radius-pill:999px;
    /* === END REPLACE === */
  }
  * { margin:0; box-sizing:border-box; font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif; }
  body { background:var(--bg); color:var(--text); padding:32px; max-width:760px; margin:0 auto; }
  section { margin-bottom:40px; }
  h1 { font-size:28px; font-weight:800; letter-spacing:-0.5px; }
  h2 { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.2px; color:var(--text-dim); margin-bottom:14px; }
  .thesis { color:var(--text-2); font-size:15px; line-height:1.55; margin-top:10px; }
  .swatches { display:grid; grid-template-columns:repeat(auto-fill,minmax(104px,1fr)); gap:10px; }
  .sw { border:1px solid var(--border); border-radius:var(--radius-inner); overflow:hidden; }
  .sw .chip { height:52px; }
  .sw .lbl { padding:7px 9px; font-size:10px; color:var(--text-dim); background:var(--card); }
  .sw .lbl b { display:block; color:var(--text-2); font-weight:600; font-size:11px; }
  .card { background:var(--card); border:1px solid var(--border); border-radius:var(--radius-card); padding:20px; }
  .eyebrow { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.2px; color:var(--text-dim); }
  .hero-num { font-size:40px; font-weight:800; font-variant-numeric:tabular-nums; }
  .delta { color:var(--good); font-size:13px; font-weight:600; }
  .pill { display:inline-block; padding:5px 12px; border-radius:var(--radius-pill); font-size:10px; font-weight:700;
          text-transform:uppercase; letter-spacing:0.6px; background:var(--accent-tint); color:var(--accent-lt);
          border:1px solid var(--accent-dk); }
  .btn { display:block; width:100%; text-align:center; padding:15px; border-radius:var(--radius-btn);
         background:var(--accent); color:var(--bg); font-size:16px; font-weight:700; }
  .set-row { display:flex; align-items:center; gap:12px; padding:11px 0; border-bottom:1px solid var(--border); }
  .set-row:last-child { border-bottom:none; }
  .set-n { width:24px; color:var(--text-muted); font-size:12px; font-weight:700; }
  .set-val { flex:1; font-size:15px; font-weight:600; font-variant-numeric:tabular-nums; }
  .set-done { color:var(--good); }
  .tap { min-width:56px; min-height:40px; border-radius:var(--radius-btn); border:1.5px solid var(--border-lt);
         display:flex; align-items:center; justify-content:center; font-size:15px; }
  .tap.done { background:var(--good-tint); border-color:var(--good); color:var(--good); }
  .tap.current { border-color:var(--accent); color:var(--accent); }
  .rpe { display:flex; gap:6px; margin-top:12px; }
  .rpe span { flex:1; text-align:center; padding:8px 0; border-radius:var(--radius-btn); font-size:13px;
              font-weight:600; border:1px solid var(--border); color:var(--text-dim); }
  .rpe .sel { background:var(--accent); color:var(--bg); border-color:var(--accent); }
  .suggest { display:flex; align-items:center; gap:10px; margin-top:14px; padding:10px 12px;
             background:var(--good-tint); border:1px solid var(--good); border-radius:var(--radius-inner);
             font-size:13px; color:var(--text); }
  .suggest .act { margin-left:auto; display:flex; gap:8px; }
  .suggest .act span { width:30px; height:30px; border-radius:var(--radius-pill); display:flex; align-items:center;
                       justify-content:center; border:1px solid var(--border-lt); }
  .blocks { display:flex; height:8px; border-radius:var(--radius-pill); overflow:hidden; gap:2px; margin-top:10px; }
  .blocks div { height:100%; }
  .type-row { display:flex; align-items:baseline; gap:16px; padding:9px 0; border-bottom:1px solid var(--border); }
  .type-row .spec { width:150px; font-size:10px; color:var(--text-muted); }
  ul { padding-left:18px; color:var(--text-2); font-size:14px; line-height:1.6; }
  .cap { font-size:11px; color:var(--text-muted); margin-top:8px; }
</style>

<section id="thesis">
  <div class="eyebrow">Direction [A/B/C] — Round 1</div>
  <h1>[DIRECTION NAME]</h1>
  <p class="thesis">[2–3 sentence thesis: what this direction believes, what it keeps from today's APEX, what it changes.]</p>
</section>

<section id="palette">
  <h2>Palette</h2>
  <div class="swatches">[One .sw per token: chip div with inline style="background:var(--TOKEN)" + .lbl with token name and hex — cover bg ramp, text ramp, accent ramp, semantics, blocks]</div>
</section>

<section id="type">
  <h2>Typography</h2>
  <div class="type-row"><span class="spec">Hero numeral · 40/800 tabular</span><span class="hero-num">225 <span style="font-size:16px;color:var(--text-dim)">lb</span></span></div>
  <div class="type-row"><span class="spec">Screen title · 28/800/−0.5</span><span style="font-size:28px;font-weight:800;letter-spacing:-0.5px">Progress</span></div>
  <div class="type-row"><span class="spec">Eyebrow · 11/700/caps</span><span class="eyebrow">Estimated 1RM</span></div>
  <div class="type-row"><span class="spec">Value · 17/600</span><span style="font-size:17px;font-weight:600">95 lb × 8</span></div>
  <div class="type-row"><span class="spec">Body · 15/400</span><span style="font-size:15px;color:var(--text-2)">Rest 90s between sets.</span></div>
  <p class="cap">Wordmark stays ΛPEX / Orbitron 800 (approximated here with the system stack).</p>
</section>

<section id="card-language">
  <h2>Card language</h2>
  <ul>[3–5 rules: elevation model, border treatment, radius scale, inset usage, accent-usage discipline]</ul>
</section>

<section id="hero">
  <h2>Hero — workout logging (the soul of the app)</h2>
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:baseline">
      <div>
        <div style="font-size:17px;font-weight:700">Bulgarian Split Squat</div>
        <div style="font-size:12px;color:var(--text-dim);margin-top:2px">3 × 8 @ 95 lb · RPE target ≤ 7</div>
      </div>
      <span class="pill">Accessory</span>
    </div>
    <div style="margin-top:14px">
      <div class="set-row"><span class="set-n">1</span><span class="set-val set-done">95 lb × 8</span><span class="tap done">✓</span></div>
      <div class="set-row"><span class="set-n">2</span><span class="set-val">95 lb × 8</span><span class="tap current">✓</span></div>
      <div class="set-row"><span class="set-n">3</span><span class="set-val" style="color:var(--text-dim)">95 lb × 8</span><span class="tap"> </span></div>
    </div>
    <div class="rpe"><span>5</span><span>6</span><span class="sel">7</span><span>8</span><span>9</span><span>10</span></div>
    <div class="suggest"><span style="color:var(--good);font-weight:800">↑</span> Nice work — try <b>&nbsp;100 lb&nbsp;</b> next session?
      <span class="act"><span style="color:var(--good)">✓</span><span style="color:var(--text-dim)">✕</span></span></div>
  </div>
  <div style="margin-top:16px" class="card">
    <div class="eyebrow">Squat · Estimated 1RM</div>
    <div style="display:flex;align-items:baseline;gap:12px"><span class="hero-num">315</span><span class="delta">↑ 10 this block</span></div>
    <div class="blocks">
      <div style="flex:4;background:var(--blk-hyp)"></div><div style="flex:1;background:var(--blk-del)"></div>
      <div style="flex:4;background:var(--blk-str)"></div><div style="flex:2;background:var(--blk-rea)"></div>
    </div>
  </div>
  <div style="margin-top:16px"><span class="btn">Finish Workout</span></div>
  <p class="cap">One tap on the ✓ logs the set exactly as prescribed — the common case never needs more.</p>
</section>

<section id="stance">
  <h2>Liquid Glass stance & motion</h2>
  <p class="thesis">[This direction's explicit answer to the spec's Phase 0 question: embrace / resist / blend for tab bar, sheets, and cards — plus 2–3 sentences on motion character.]</p>
</section>

<section id="tensions">
  <h2>Tensions to explore</h2>
  <ul>[3–5 honest open questions this direction raises, for Ben to react to]</ul>
</section>
```

- [ ] **Step 3: Verify the template renders**

Run: `open /Users/ben/projects/apex/docs/design-system/templates/specimen-template.html`
Expected: renders with the deliberately-garish placeholder magenta accent (proves every visual element flows through the vars), all seven sections visible, no console/network activity.

- [ ] **Step 4: Commit**

```bash
git add docs/design-system/templates/specimen-template.html
git commit -m "design: phase 0 specimen template (#61)"
```

---

### Task 2: Redesign brief page

**Files:**
- Create: `docs/design-system/context/redesign-brief.html`

**Interfaces:**
- Consumes: spec sections (Principles, Phase 0, Phase 1, Issue Disposition)
- Produces: remote page `context/redesign-brief.html` — the standing context Ben and future design sessions read first

- [ ] **Step 1: Write the brief**

First line: `<!-- @dsCard group="Context" -->`. Reuse the template's CSS approach (current-state palette in `:root` — this page documents today, so today's tokens are correct here). Content sections, with this exact substance:

1. **What this is** — APEX is being rebuilt native (SwiftUI, iOS 26) with a full visual + flow redesign. This project is the design hub: art-direction rounds land in `specimens/`, the winning direction gets codified into `foundations/`, then every screen is designed here against it. Mockups exported → converted → committed to `docs/mockups/` remain the implementation contract.
2. **The bar** — production-grade, lovable, Ive-grade restraint. Minimal touches to complete a goal; one tap logs a set as prescribed. Every redesigned flow must reduce or hold interaction count vs today.
3. **What stays** — dark-first instrument-panel DNA; APEX name + ΛPEX wordmark (Orbitron 800); uppercase eyebrow labels over large numerals; hairline-bordered flat cards; no vanity metrics; state is sacred.
4. **What changes** — the indigo `#6366f1` accent is retired; cleaner and more minimal throughout; typography refined; flows fixed (next section).
5. **Flow fixes to design in** (one line each, from the issues): #66 workout logging — mis-tap collapses row, can't add/remove sets, janky add/reorder, tiny buttons; #70 in-progress session must surface on Home; #46 expandable warmup protocol steps; #68 PRs viewable + readable trend charts; #67 keyboard must never cover note inputs; #65 editable session timestamps; #69 kill the redundant post-workout save prompt.
6. **The Liquid Glass question** (open, answer per direction): embrace, resist, or blend iOS 26's material language — for tab bar, sheets, and cards separately.
7. **Constraints** — SwiftUI/iOS 26 native (Swift Charts for all charts, Dynamic Type, `.sheet` modals); dark-only for v1; block color-coding (HYP/STR/DEL/REA) must survive in some form; Running keeps a distinct accent; 4-step text ramp and semantic good/warn/bad continue as concepts.
8. **How rounds work** — Ben reacts per specimen (keep / kill / blend + notes) in claude.ai/design; reactions produce round N+1; no cap on rounds; exit = Ben declares the direction locked, which triggers foundations codification + `tokens.json`.

- [ ] **Step 2: Verify render + marker**

Run: `head -1 docs/design-system/context/redesign-brief.html` → expected: `<!-- @dsCard group="Context" -->`
Run: `open docs/design-system/context/redesign-brief.html` → renders, self-contained.

- [ ] **Step 3: Commit**

```bash
git add docs/design-system/context/redesign-brief.html
git commit -m "design: phase 0 redesign brief (#61)"
```

---

### Task 3: Current-state inventory page

**Files:**
- Create: `docs/design-system/context/current-state-inventory.html`

**Interfaces:**
- Consumes: current token values (Global Constraints block above), component inventory below
- Produces: remote page `context/current-state-inventory.html`

- [ ] **Step 1: Regenerate the raw counts (verification of audit data, not re-derivation)**

Run: `ls /Users/ben/projects/apex/src/components/ | wc -l` (expect ~21 files) and `grep -rc "StyleSheet.create" /Users/ben/projects/apex/app /Users/ben/projects/apex/src/components | grep -v ':0' | wc -l` (expect ~34). If materially different from the audit, update the numbers in the page.

- [ ] **Step 2: Write the inventory page**

First line: `<!-- @dsCard group="Context" -->`. Current-state tokens in `:root`. Sections:

1. **Today's palette** — swatch grid of every current token with hex (from Global Constraints), indigo marked "RETIRING".
2. **Component census** — table of the 21 components with one-line purpose, flagging generic vs screen-specific. Use exactly this list: ProgressBar, TrendLineChart (+SparkLine), FocusChips, SupersetGroup, ExerciseCard (601 lines — the core logging unit), AdjustModal, MonthCalendar, ProgramTimeline, WeekRow (superseded), TodayCard, HealthCard, DaySelector, WarmupChecklist, SessionSummary (561 lines), AddExerciseModal, PainFollowUp, CompletedProgramCard, ProgramSummaryView, ProgramCompletionCelebration, SplashScreen, ReadinessForm (unused).
3. **Known debt the redesign fixes** — no shared component-style layer (~34 duplicated per-screen style blocks); ~10 hardcoded color escapes (pain palettes ×2, resource brand hexes, SupersetGroup/WeekRow literals, settings rgba badges, ProgramTimeline white-alphas); section-label drift (11px vs 10px, letterspacing 0.5 vs 1.0).
4. **Screen census** — the 15 routes with one line each (Home, Workout, Progress, Running, Library, Exercises, History, Settings, Program-complete, exercise/[id], exercise/progression, exercise/sessions, session/[id], plus modals).

- [ ] **Step 3: Verify render + marker**

Run: `head -1 docs/design-system/context/current-state-inventory.html` → `<!-- @dsCard group="Context" -->`; `open` it → renders.

- [ ] **Step 4: Commit**

```bash
git add docs/design-system/context/current-state-inventory.html
git commit -m "design: phase 0 current-state inventory (#61)"
```

---

### Task 4: Specimen A — "Forged Ember"

**Files:**
- Create: `docs/design-system/specimens/2026-07-15-r1-forged-ember.html` (copy of template, `:root` + copy replaced)

**Interfaces:**
- Consumes: template contract from Task 1
- Produces: synced card in group "Art Direction — Round 1"

- [ ] **Step 1: Copy template and replace `:root` + first line**

First line: `<!-- @dsCard group="Art Direction — Round 1" -->`. `:root`:

```css
--bg:#0B0908; --card:#161210; --card-inset:#1C1713; --surface:#231C16;
--border:#2E2621; --border-lt:#3F342C;
--text:#FAF7F4; --text-2:#B5A99E; --text-dim:#7E7268; --text-muted:#564A40;
--accent:#F97316; --accent-lt:#FB923C; --accent-dk:#C2410C; --accent-tint:#F973161f;
--good:#22C55E; --warn:#EAB308; --bad:#EF4444;
--good-tint:#22C55E1f; --warn-tint:#EAB3081f; --bad-tint:#EF44441f;
--blk-hyp:#F97316; --blk-str:#EAB308; --blk-del:#22C55E; --blk-rea:#EC4899;
--radius-card:16px; --radius-inner:12px; --radius-btn:10px; --radius-pill:999px;
```

- [ ] **Step 2: Fill the copy**

- Thesis: warmth and effort. The world shifts from blue-black to forge-black — warm near-black backgrounds, ember orange as the single hero accent. Keeps the instrument-panel readouts; trades the cool software feel for something physical, like heated metal. The gym is warm; the app should be too.
- Card rules: matte flat cards, 1px warm-hairline borders carry elevation; ember appears only on the current action and primary CTA — never decoration; insets one step warmer, not lighter.
- Stance: **blend** — Liquid Glass for chrome (tab bar, sheets) with warm tint; content cards stay matte and opaque.
- Tensions: warn-amber vs ember proximity (warning moves to gold `#EAB308` — enough separation?); does warm-black read "premium" or "brown" on OLED at low brightness?; HYP block color = accent — same overload the indigo had today, keep or break?; SF Pro Rounded for hero numerals — warmer, or too soft?

- [ ] **Step 3: Verify**

Run: `head -1 docs/design-system/specimens/2026-07-15-r1-forged-ember.html` → dsCard marker. Run: `grep -c '#6366f1' docs/design-system/specimens/2026-07-15-r1-forged-ember.html` → `0`. `open` it → all seven sections render in the ember palette; hex below `:root`: `grep -nE '#[0-9a-fA-F]{3,8}' <file> | grep -v ':root' | grep -vE '^\s*[0-9]+:\s*--'` → only `:root` lines.

- [ ] **Step 4: Commit**

```bash
git add docs/design-system/specimens/2026-07-15-r1-forged-ember.html
git commit -m "design: art direction R1 — Forged Ember (#61)"
```

---

### Task 5: Specimen B — "Graphite Mono"

**Files:**
- Create: `docs/design-system/specimens/2026-07-15-r1-graphite-mono.html`

**Interfaces:** same as Task 4.

- [ ] **Step 1: Copy template, first line dsCard marker (same group), replace `:root`**

```css
--bg:#0A0A0A; --card:#141414; --card-inset:#181818; --surface:#1F1F1F;
--border:#2A2A2A; --border-lt:#3D3D3D;
--text:#FFFFFF; --text-2:#A3A3A3; --text-dim:#737373; --text-muted:#525252;
--accent:#C8F135; --accent-lt:#D9F76A; --accent-dk:#9CBF1E; --accent-tint:#C8F1351f;
--good:#30D158; --warn:#FFD60A; --bad:#FF453A;
--good-tint:#30D1581f; --warn-tint:#FFD60A1f; --bad-tint:#FF453A1f;
--blk-hyp:#E5E5E5; --blk-str:#8A8A8A; --blk-del:#4A4A4A; --blk-rea:#C8F135;
--radius-card:16px; --radius-inner:12px; --radius-btn:10px; --radius-pill:999px;
```

- [ ] **Step 2: Fill the copy**

- Thesis: maximal restraint — the most Ive direction. Pure neutral grayscale architecture; hierarchy carried by luminance and weight, not color. One volt accent, rationed to the single next action; Apple's system semantic colors (dark palette) for outcomes only. If everything is quiet, the one loud thing is unmissable.
- Card rules: flat, hairline `#2A2A2A` borders, zero glow/shadow/gradient; luminance steps do all elevation; volt never appears twice on one screen.
- Stance: **resist** — fully flat, no materials anywhere; the discipline *is* the identity.
- Tensions: block colors become luminance-graded monochrome (+ volt for realization/peak only) — does periodization stay legible without hue-coding?; is volt too "sport brand" vs a cooler signal (white/`#0A84FF`)?; monochrome may undercut the semantic green "logged" satisfaction — is `--good` on taps enough?

- [ ] **Step 3: Verify** — same three checks as Task 4 Step 3, against this file.

- [ ] **Step 4: Commit**

```bash
git add docs/design-system/specimens/2026-07-15-r1-graphite-mono.html
git commit -m "design: art direction R1 — Graphite Mono (#61)"
```

---

### Task 6: Specimen C — "Phosphor"

**Files:**
- Create: `docs/design-system/specimens/2026-07-15-r1-phosphor.html`

**Interfaces:** same as Task 4.

- [ ] **Step 1: Copy template, first line dsCard marker (same group), replace `:root`**

```css
--bg:#060807; --card:#0E1310; --card-inset:#121815; --surface:#18211B;
--border:#243029; --border-lt:#33453B;
--text:#F2FBF5; --text-2:#9DB4A6; --text-dim:#66796E; --text-muted:#45544B;
--accent:#34D399; --accent-lt:#6EE7B7; --accent-dk:#059669; --accent-tint:#34D3991f;
--good:#34D399; --warn:#FBBF24; --bad:#F87171;
--good-tint:#34D3991f; --warn-tint:#FBBF241f; --bad-tint:#F871711f;
--blk-hyp:#34D399; --blk-str:#FBBF24; --blk-del:#94A3B8; --blk-rea:#A78BFA;
--radius-card:16px; --radius-inner:12px; --radius-btn:10px; --radius-pill:999px;
```

- [ ] **Step 2: Fill the copy**

- Thesis: the instrument-panel DNA taken to its natural conclusion — an aviation/HUD readout. Green-black world, phosphor emerald readouts, tabular/monospaced numerals (SF Mono for data readouts). APEX as cockpit: you glance, you know, you act.
- Card rules: darkest direction; borders barely-there green-tinted hairlines; data glows subtly (accent on numerals themselves, not chrome); accent doubles as `--good` — logging *is* the green moment.
- Stance: **embrace for overlays** — Liquid Glass sheets/tab bar with phosphor tint over the green-black field; cards stay flat so readouts stay legible.
- Tensions: accent==good collapses "current" vs "done" into one hue — does the hero card still read state at a glance?; Running's cyan sits close to emerald — shift Running to `#22D3EE` or give it a new identity?; SF Mono readouts: instrument-authentic or gimmick?; is green-black too close to "terminal hacker" vs premium?

- [ ] **Step 3: Verify** — same three checks as Task 4 Step 3, against this file.

- [ ] **Step 4: Commit**

```bash
git add docs/design-system/specimens/2026-07-15-r1-phosphor.html
git commit -m "design: art direction R1 — Phosphor (#61)"
```

---

### Task 7: Sync to the claude.ai design-system project

**Files:** none locally (remote writes only)

**Interfaces:**
- Consumes: the five files from Tasks 2–6
- Produces: remote paths `context/redesign-brief.html`, `context/current-state-inventory.html`, `specimens/2026-07-15-r1-{forged-ember,graphite-mono,phosphor}.html`

- [ ] **Step 1: Verify the target project**

Invoke DesignSync `get_project` with projectId `d6ba3f54-69ba-40fe-aa51-48b8a8d6bcd0`. Expected: name "APEX Design System", `type: PROJECT_TYPE_DESIGN_SYSTEM`, `canEdit: true`. STOP if not.

- [ ] **Step 2: Read remote structure**

Invoke DesignSync `list_files`. Expected: existing `foundations/…`, `components/…`, `context/…` paths from the 2026-07-14 sync. Confirm none of the five new paths already exist (if `context/redesign-brief.html` exists from prior work, it will be overwritten — that's intended; note it to Ben in Task 8).

- [ ] **Step 3: Finalize the plan and write**

Invoke DesignSync `finalize_plan` with: projectId as above; `localDir: "/Users/ben/projects/apex/docs/design-system"`; `writes: ["context/redesign-brief.html", "context/current-state-inventory.html", "specimens/*.html"]`. Then `write_files` with the planId and the five files as `{path, localPath}` pairs (localPath relative to localDir, equal to path).

- [ ] **Step 4: Verify remote**

Invoke DesignSync `list_files` again. Expected: all five paths present.

---

### Task 8: Handoff to Ben + round protocol

**Files:**
- Modify: `docs/superpowers/plans/2026-07-15-phase0-kickoff.md` (tick checkboxes)

- [ ] **Step 1: Push the branch**

Run: `git push` (branch `docs/swiftui-migration-spec`, updates PR #78). Do NOT merge.

- [ ] **Step 2: Hand off**

Tell Ben, in the final message: open **claude.ai/design → APEX Design System → Design System pane**; the "Art Direction — Round 1" group holds the three specimens; "Context" holds the brief + inventory. Ask for per-specimen reactions — **keep / kill / blend, plus anything the direction gets wrong or right** — in whatever form is easiest (notes in the app, voice-memo dump, or a message here). State the loop: reactions → Round 2 specimens (same pipeline, `specimens/<date>-r2-*.html`) → repeat without cap → Ben declares lock → foundations codification + `tokens.json` plan (spec decomposition item 3) kicks off. Remind him the Foundation plan (spec decomposition item 2) can proceed in parallel any time — it has no design dependency.

---

## Self-Review

- **Spec coverage:** Phase 0 requires: design-system refresh with tokens baseline ✓ (existing foundations stay; inventory documents baseline), regenerated component inventory ✓ (Task 3), redesign brief with tenets/flows/issue fixes/direction ✓ (Task 2), specimen pages judged on real content with hero workout card ✓ (template hero + Tasks 4–6), explicit Liquid Glass question ✓ (brief §6 + per-specimen stance), seed 2–3 directions ✓ (three), exit criterion = Ben locks ✓ (Task 8 protocol).
- **Placeholder scan:** template's `[BRACKETED]` markers are replacement targets by design and each specimen task supplies the actual replacement content; no TBDs remain.
- **Type consistency:** the CSS var contract in Task 1 matches every `:root` block in Tasks 4–6 (same 28 var names, checked).
