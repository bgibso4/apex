# Home — decisions log

R2 campaign, Home screen. Same rules as the logging round: every option in `Home Explorations.dc.html` carries a stamp — **Locked** = the decision that stands · **Rejected** = turned down, reason recorded · **Superseded** = right at the time, replaced by a later turn · **Fallback** = not chosen, kept as the drop-back if the winner fails. **Precedence: the highest turn number wins.** This table is the single source of truth; build from it, not from an early stamp. Every stamp is mirrored as a badge on its option in the explorations file (solid moss = Locked, moss outline = Locked for now, blue outline = Fallback, grey = Rejected/Superseded).

Charter constraints held throughout: two hues (dusty blue = now, moss = earned), one light source, biggest number wins, no vanity metrics, glass tab bar always visible, chrome-above-the-scroll wears glass, no em dashes, no third hue. Anti-jobs: no dashboard overload, no feed, no notification pile. Baseline stays a separate app; the stack must tolerate a future data-level weight module without designing it now.

## Locked

| Area | Decision |
|---|---|
| Today card header | The workout name is always the card's title (turn 2). Never a numeral, never generated copy |
| No exercise preview list on Home | The session's lifts never leak onto the today card; preview is a door, not content (2d rejected) |
| No generated "coach" copy | No synthesized verdicts, no "as prescribed", no intelligent day-naming. Anything recovery says must be a stated fact or a deterministic threshold rule (turn 2 feedback) |
| Preview affordance | A quiet text row under Start, from 3a (restyled by turn 20, see below) |
| Preview interaction | Navigates to the Workout tab's existing day view (4c). Zero new UI. 4b sheet is the fallback if the tab jump proves disorienting |
| Program position | Stated once, as 1c's subheader under the wordmark: "Pillars · Week 3 of 11 · Hypertrophy". Removed from the week card |
| Week strip | 7a's week card (✓ done, blue ring today, hollow scheduled, bare rest) with header "This week" only. **Amended 36b (2026-11-24):** a done day shows its date in the moss circle, as Calendar; missed days dashed |
| Calendar portal | 8b: tapping the week card anywhere but a day opens a Calendar screen (month grid, flip months, day summary as its own card, View session). Tapping a day on Home opens an inline summary in the week card with a 44px outlined action (View session / Preview session) **Replaced by 35a (2026-11-24):** a day opens Calendar on that day; no summary on Home. The Calendar screen is the future home of the history browser (#63) and a linkable destination |
| Day states | Moss ✓ done · blue ring today · hollow ring scheduled · dashed ring missed · bare date rest |
| Program bar | 19b: ≤16 weeks one segment per week, >16 one bar per block (deload notch). Names under blocks for ≤4 blocks, names row below for 5+. 30px minimum per block. Fill = sessions done / planned |
| Deload weeks | 17a: 3px segment (vs 6px training weeks), same moss, fills by sessions done |
| Recovery widget tap | Whole card opens the Whoop app. "Whoop" header label stays as the source, no chevron |
| Recovery widget by state | Identical 6a in every Home state; never resized or promoted |
| Resume progress bar | 11a ii: completed segments neutral grey, current segment blue, rest track |
| Recovery widget color | Two colors only (charter holds). Whoop's green/yellow/red stay off Home: a third and fourth hue, green collides with moss = earned, and a band color is a go/don't verdict. Whoop colors may live behind the widget's tap-through |
| Recovery widget | 6a: today's number + 7-day trend (today = blue bar), fact beside the number, footer "Sleep 84%   Strain 6.2" with no time labels. Shown every day |
| Card order | Check-in (when due) → Today → Recovery → Week → Program. Locked turn 34 |
| Header | Apple's standard large title (owner 2026-11-24, README "Large titles"): the 26px wordmark and the subheader scroll away with the cards; once the wordmark has gone, a 17px wordmark shows centred in the bar over a soft blurred edge (the Workout tab's). The subheader does not come back. Glass settings button fixed top right. Replaces turn 33's shrink in place. **Amended 37c (2026-11-25):** the wordmark is 34px and sits on its own row under the gear; the small 17px wordmark shows centred on the gear's row |
| Bad-day line on today card | Removed. The recovery widget carries the bad-day fact; 4d superseded |
| Action hierarchy (app-wide) | Turn 20. Primary = filled: Blue (now), Moss (earned, only when a real case needs it, e.g. "How was your run?"), Tonal (lesser action alone). Secondary = 12f grey text, only under a primary. One primary per card; whole-card tap gets no button; no chevrons |
| Preview affordance (restyled) | 12f secondary text under Start: "Preview session", no chevron |

## History · turn 1 open questions (all settled)

> Kept as a record. Every item below was settled in turns 2–34 (module stack, header, calendar portal, recovery, program position, debrief, due-now prompt, settings, resume). Live open items for the whole redesign are in `inventory.md`.


- **The module stack itself** (hypothesis 1): 1a/1d/1e execute it; 1b argues a near-single-object Coach screen; 1c argues the conservative no-stack translation.
- **Wordmark header** (P2): stays painted in flow on 1a/1c/1d/1e; 1b kills it and pins a glass gear as the only chrome.
- **Calendar form** (hypothesis 3): 1a's week-strip card is the portal (both owner-verified jobs must survive the split); 1c keeps the full month grid inline as the counter. Whichever wins, adherence-at-a-glance and tap-a-day history both survive or the design is a regression.
- **Recovery as one coach line** (hypothesis 4): register chosen in scoping = shows the math ("Recovery 78% · Hypertrophy wk 3 · as prescribed"). 1c counters with the raw three-column bar.
- **Freeform-train door #71 on workout days**: 1a argues no, 1b argues a quiet text door, 1c argues a sibling button beside Start. Scoping answer: let designs argue it.
- **Program position**: stated once. In the week card header (1a), as the screen's eyebrow (1c), or beside the dot row (1b).
- **Session debrief** (M5): 1d shows the evening state of the stack; expires at midnight per the module contract.
- **Due-now prompt grammar** (M8/#49): 1e stress-tests hierarchy under load; prompt sits below the today band, one tap to answer, dismissible, never stacks.
- **Settings**: gear rides the wordmark row painted (1a/1c/1d/1e) vs pinned glass circle (1b).
- **Resume as hero** (hypothesis 2): counter-designs deliberately deferred to the state (c) turn, where the state exists; requested in scoping and will get the banner-above-hero counter there.

## History · turn 1 deferred list (all done)

> Kept as a record. States (b)–(e) were designed in turns 10–19, the Calendar portal in calendar-decisions.md, and the reserved entry points (#64, #71, #73, #49) are tracked in `inventory.md`.


- States (b) rest day, (c) resume, (d) no program, (e) program complete: next turns.
- Calendar portal screen itself (the history browser absorbing #63): designed when the split wins.
- Entry points reserved, not designed: #64 program overview, #71 off-program training, #73 run history, #49 weekly check-ins.

---

### Turn 1 · 2026-08-18 · state (a), workout day

Content held true across frames: Pillars program, Week 3 of 11, Hypertrophy block, Thursday Aug 20, session "Upper Strength · Heavy Pull", 6 exercises, about 55 min, Whoop recovery 78%, training Mon/Tue/Thu/Fri/Sat. All copy middot-separated, no em dashes (the data file's em-dash session name is rendered with a middot).

| Id | Stance | Stamp |
|---|---|---|
| 1a | Governed stack, hypotheses executed straight | unreviewed |
| 1b | The Coach: state-led, wordmark gone, stack collapsed | unreviewed |
| 1c | The Ledger: conservative translation, month grid + raw health bar | **Locked (partial)** · program subheader only; rest of the frame not adopted |
| 1d | The stack at 21:18: session debrief in the hero seat | unreviewed |
| 1e | The stack under load: due-now prompt competing with the hero | unreviewed |

### Process change after turn 1 (owner call)

Full-screen assemblies first was the wrong grain. From turn 2 on we work **card by card**: design each element in isolation, stamp it, then assembly turns decide order and what gets dropped. Component order: today card → week strip / calendar → coach line → header + wordmark → debrief → due-now prompt → assembly. Turn 1's frames stay on the board as history and as the first assembly reference.

### Turn 2 · 2026-08-18 · today card, isolated

Constants: one Start action inside the card, session + planning facts, recovery 78%. Variants argue what the card leads with.

| Id | Stance | Stamp |
|---|---|---|
| 2a | Baseline: eyebrow date, name title, meta, coach line, Start | **Fallback** · liked most, but the coach line's "as prescribed" verdict is rejected with the coach concept; superseded by turn 3's riffs |
| 2b | Statement-led: coach verdict as title, session as fact row | **Rejected** · infeasible; the app cannot honestly generate day-naming copy, and the workout name must be the header |
| 2c | Instrument: workload numeral 34px hero, name demoted | **Rejected** · the workout name is the header, exercise count doesn't earn 34px |
| 2d | Preview anatomy: first three lifts leak in, no coach line seat | **Rejected** · takes too much space; preview stays a door |
| 2e | Queue purist floor: name + Start only | **Rejected** · too plain; wants a little more info, better styled |
| 2f | Two doors: 2a plus quiet Preview beside Start | **Superseded** · the preview concept survives, the giant sibling button does not; explored small in turn 3 |

### Turn 3 · 2026-08-18 · today card, riffs on 2a + 2f

The coach demoted to facts or a threshold rule; preview explored small. 3d is the feasibility answer to "what if I'm not recovered": silent normal days, one deterministic line + a door into the existing adjust flow on bad days, Start never changes.

| Id | Stance | Stamp |
|---|---|---|
| 3a | Facts only (Recovery 78% · Sleep 84%) + preview text row under Start | **Locked (preview row)** · the preview row wins; recovery treatment still open between 3a and 3d, resolved by turn 4's door question |
| 3b | Card body is the preview door, recovery off the card entirely | **Rejected** · preview row from 3a preferred |
| 3c | Small bordered Preview button centered under Start | **Rejected** · text row beats a button |
| 3d | Threshold rule: silent normal days, fact line + adjust door under ~40% | **Open** · in contention with 3a; hinges on what the door does (turn 4) |
| 3e | Preview as inline link on the meta row | **Rejected** · too small a target, row wins |

### Turn 4 · 2026-08-18 · two interactions designed

Codebase fact: AdjustModal.tsx is a per-set weight/reps editor, not a day-level adjust — 3d's door would be a new feature. Preview interaction and bad-day behavior each get three candidates.

| Id | Stance | Stamp |
|---|---|---|
| 4a | Preview discloses in place (⌄/⌃), read-only list folds out under the button | **Rejected** · too little info, card swings in size |
| 4b | Preview opens a detent sheet, logging-sheet grammar, last-time loads shown | **Fallback** · strong for a glance, but overlaying Home felt odd and it duplicates the day view |
| 4c | Preview navigates to the Workout tab's existing day view (zero new UI) | **Locked** · more info, zero build, one source of truth for the session |
| 4d | Bad-day line is a fact, no door; RPE caps are the adjustment mechanism | **Superseded** · the bad-day fact moved into the recovery widget (6a) |
| 4e | Bad-day door opens a deterministic adjust sheet (drop a set / cut loads 10% / proceed), new feature priced honestly | **Rejected (for now)** · over-engineering at this stage |
| 4f | Bad-day door opens a read-only context sheet (why the number is low), never writes | **Rejected (for now)** · over-engineering; its content may seed the recovery widget |

### After turn 4 · 2026-09-26 · owner call

Recovery reopened as its own module. The owner wants the Whoop recovery readout on Home daily, which 3d's silent-normal-day rule removed. Next turn designs a recovery widget: one number vs Recovery/Sleep/Strain, today vs 7-day trend, bad-day state (decides whether 4d's line stays on the today card), placement in the stack. Open: whether Whoop's green/yellow/red may appear against the two-hue charter.

### Turn 5 · 2026-09-26 · recovery widget

Recovery as its own daily module. Three shapes, each in two color rules (two-hue charter vs muted Whoop bands: green ≥67, yellow 34–66, red ≤33). Each option shows all three bands: 78% green, 34% yellow, 22% red. Placement deferred to assembly. If a widget wins, 4d's line moves off the today card.

| Id | Stance | Stamp |
|---|---|---|
| 5a | One number + fact + bar vs 30-day avg · two colors | **Rejected** · too little; owner leaning 5c/5e |
| 5b | One number · Whoop colors | **Rejected** · Whoop colors off Home |
| 5c | Recovery · Sleep · Strain · two colors | **Superseded** · by 6a |
| 5d | Recovery · Sleep · Strain · Whoop color on recovery only | **Rejected** · Whoop colors off Home |
| 5e | 7-day trend, today blue · two colors | **Superseded** · by 6a |
| 5f | 7-day trend, bars in band colors | **Rejected** · Whoop colors off Home |

### Turn 6 · 2026-09-26 · recovery widget, 5c × 5e hybrids

| Id | Stance | Stamp |
|---|---|---|
| 6a | 5e trend leads, sleep + strain as a one-line footer | **Locked** · time labels ("last night", "so far today") dropped as noise |
| 6b | 5c three numbers lead, small 7-day recovery strip underneath | **Rejected** · 6a preferred |

Owner note after 6a lock: concerned about the widget's height; judge in assembly with the full Home together.

### Turn 7 · 2026-09-26 · week strip

Same week across options (M T done, W rest, T today, F S scheduled, S rest). Whole card is the single tap target into the calendar portal. Heights noted per option.

| Id | Stance | Stamp |
|---|---|---|
| 7a | Baseline week card from 1a, ~100px | **Locked** · minus the "3 of 11 · Hypertrophy" header text |
| 7b | Compact one row, letters in cells, no header, ~52px | **Rejected** |
| 7c | 7a + tomorrow's session line, ~145px | **Rejected** |
| 7d | Merged with recovery: shared Mon–Sun columns, bars + adherence dots, ~175px vs ~260px stacked; reopens 6a | **Fallback** · if 6a reads too big in assembly |
| 7e | Floor: bare dot row, no card, ~44px | **Rejected** |

Owner clarification: the size concern is 6a itself; judge in assembly.

### Turn 8 · 2026-09-26 · week tap behavior (Calendar Demo.dc.html)

Home in the demo = everything locked so far. New "missed" day state (dashed ring) introduced for adherence.

| Id | Stance | Stamp |
|---|---|---|
| 8a | Week card expands into the month in place; flip months; tap a day for inline summary | **Fallback** · faster, but no room for full history, destabilizes Home height, not linkable |
| 8b | Week card opens a Calendar screen (month grid, flip, tap a day for summary + View session) | **Locked** · whole card (except days) opens Calendar; days this week open an inline summary on Home |
| 8c | No month; page the strip week by week, tap a day for inline summary | **Rejected** · owner torn between 8a and 8b only |

Turn 8 revision (owner): whole card is the tap target (except day cells); tapping a day opens an inline summary in week or month view on Home, with a real 44px outlined action (View session for done days, Preview session for today/scheduled); "Tap a day" prompts removed; 8b keeps the day summary as its own card on the Calendar screen. Legend confirmed: dashed ring = missed, bare date = rest.

### Turn 9 · 2026-09-26 · first assembly, state (a) workout morning

All locked parts together. Three cards fit above the tab bar (~610 of ~770px). Only order varies, plus the merged 7d card.

| Id | Stance | Stamp |
|---|---|---|
| 9a | Today → Recovery → Week | **Locked for now** · revisit in the final assembly once every card is defined |
| 9b | Recovery → Today → Week | unreviewed |
| 9c | Today → Week → Recovery | unreviewed |
| 9d | Today → merged week + recovery (7d) | unreviewed |

Owner direction after turn 9: design every Home state first, then extra widgets. Widgets picked for later: Resume, session debrief, due-now prompts, recent PR/progression highlight, program progress. Not picked: #71 train-without-program on workout days, tomorrow's session, last run, bodyweight. Order not yet chosen; turn 10 uses 9a as the working order.

### Turn 10 · 2026-09-26 · every Home state, first pass

Recovery (6a) and week (7a) are constant modules; hero card + subheader change per state.

| Id | State | Stamp |
|---|---|---|
| 10a | Resume: exercise 3 of 6, elapsed, segment progress, Resume Workout | **Locked** · progress bar colors revisited in 11a (two colors felt like a lot) |
| 10b | Rest day: "Rest day" + tomorrow's session line, no action | **Superseded** · didn't read as a rest day |
| 10c | Evening: 1d debrief minus progression line, View session secondary | **Superseded** · try moss outline + whole card tappable |
| 10d | No program: Browse programs + quiet log-without-program door; week shows logged only | **Superseded** · too much text, state not clear at a glance |
| 10e | Program complete: sessions done / planned, PRs, Choose next program | **Superseded** · not celebratory enough |

### Turn 11 · 2026-09-26 · state revisions

| Id | Stance | Stamp |
|---|---|---|
| 11a | Resume bar single-color: i blue fill · ii grey done + blue current · iii continuous blue | **Locked · ii** |
| 11b | Rest day painted large, no card | **Superseded** · keep a card, make it calmer (13a/b) |
| 11c | Rest day: recovery takes the hero seat, tomorrow moves into week card | **Rejected** · recovery widget never changes by state |
| 11d | Evening: thin moss outline, whole card opens session, no button | **Superseded** · drop chevron, adopt 11f grammar (13c) |
| 11e | No program: "No program" title, one button, one link, subheader removed | **Superseded** · too plain (13d) |
| 11f | Program complete: moss border + glow, 32px name, 11 moss week segments, sessions + PRs | **Liked** · soften border; test split (13e/f) |

### Turn 12 · 2026-09-26 · secondary actions (app-wide)

Current small grey "Label ›" text fails contrast and reads as an afterthought. Winner becomes the rule across the app.

| Id | Stance | Stamp |
|---|---|---|
| 12a | Current small grey text + › | unreviewed |
| 12b | Outlined 44px button | unreviewed |
| 12c | Tonal 44px button, soft fill | unreviewed |
| 12d | Blue text button, no chevron | unreviewed |
| 12e | Card-foot row, full width, hairline above | unreviewed |
| 12f | 12a fixed: 14px #8F9098 text, no chevron, 44px tap row | **Locked** · as the secondary style, only under a primary (turn 20) |

### Turn 13 · 2026-09-26 · state revisions round 2

Earned cards (evening, program complete) share 11f's grammar: centered moss eyebrow, big title, stat row, faint moss glow, moss border at ~40%.

| Id | Stance | Stamp |
|---|---|---|
| 13a | Rest day: calm flat card, left-aligned, no button | **Rejected** · owner switched to 13b |
| 13b | Rest day: calm card, centered, faint cool glow, tomorrow as footnote | **Locked** · keeps the top card the same size as other days · glow removed turn 32 (32b) |
| 13c | Evening: 11f grammar, Time · Sets · PR, whole card opens session, no chevron | **Locked** · stats at 17px/600 neutral so they don't compete |
| 13d | "No Active Program" + what ended + one line, Choose a program, "Log a workout without a program" | **Locked** · copy "Pick one to get started on your goal."; secondary style pending turn 12 |
| 13e | Program complete, one card, softer border | **Rejected** · split preferred |
| 13f | Program complete split: celebration card (taps to summary) + neutral "Up next" action card | **Locked (structure)** · celebration card contents still open |

### Turn 14 · 2026-09-26 · program complete card contents

Structure from 13f. Stats at 13c weight.

| Id | Stance | Stamp |
|---|---|---|
| 14a | Baseline: plain bar, sessions + PRs | **Superseded** · turn 15 |
| 14b | Phase-labeled bar (Hypertrophy · Strength · Peak), adherence % + PRs | **Superseded** · turn 15 |
| 14c | 14b + one biggest gain (before → after) | **Superseded** · turn 15 |
| 14d | 14b + top three gains as ledger rows | **Superseded** · turn 15 |
| 14e | Plain bar, adherence · best streak · total sets | **Superseded** · turn 15 |

Owner call on 14: card keeps the phase bar + Adherence · PRs · Best streak. Biggest gain (and other detail) moves to the Program summary screen the card opens.

### Turn 15 · 2026-09-26 · program complete across adherence levels

Week segments fill by share of that week's sessions done. States shown: 95%, 75%, 44%.

| Id | Stance | Stamp |
|---|---|---|
| 15a | Same moss celebration for every finish | **Locked** · no penalty for low adherence; bar revisited in turn 16 |
| 15b | Moss only at ≥80% adherence; below, neutral "Program finished" | **Rejected** |
| 15c | 15b + under 50%: sessions done replaces PRs/streak, one line naming the best phase | **Rejected** |

### Turn 16 · 2026-09-26 · program bar stress test

Tested at 4 wk (1 phase), 8 wk (1-week peak), 11 wk (two deloads), 26 wk (5 phases). Deload = thin 2px line. Single-phase programs show no labels.

| Id | Stance | Stamp |
|---|---|---|
| 16a | One segment per week always; short labels for 1–2 wk phases; breaks past ~26 wk | **Superseded** · 19b |
| 16b | One pill per phase, width by weeks, fill by adherence, deload notch | **Superseded** · 19b |
| 16c | Adaptive: per-week ≤12 wk, per-phase beyond; labels as a legend row (no week counts, owner call) | **Superseded** · 19b |

### Turn 17 · 2026-09-26 · deload treatment

Deloads fill by sessions done (3 per deload week). Shown done / 2 of 3 / skipped.

| Id | Stance | Stamp |
|---|---|---|
| 17a | Thin 3px segment, same moss | **Locked** · shape, not shade, marks a deload; holds up with many blocks |
| 17b | Full 6px, ~45% moss on darker track | **Rejected** · lighter fill hard to tell apart across many blocks |

### Turn 18 · 2026-09-26 · program bar in full Home context

16a/b/c in the full program-complete Home at 11 and 26 weeks. 18a = 16a, 18b = 16b, 18c = 16c; stamp here decides turn 16.

| Id | Stance | Stamp |
|---|---|---|
| 18a | Per-week, labels under phases | **Rejected** |
| 18b | Per-phase, labels under phases | **Rejected** |
| 18c | Adaptive, legend row | **Superseded** · 19b |
| 18d | 18a per-week bar at every length + names row below (no week counts) | **Rejected** |

Owner call on 18: adaptive (18c) preferred; no names row for short programs; threshold 16 weeks.

### Turn 19 · 2026-09-26 · adaptive bar, 16-week threshold

| Id | Stance | Stamp |
|---|---|---|
| 19a | ≤16 wk: per-week segments, names under phases. >16 wk: per-phase bars, names row below | **Superseded** · 19b |
| 19b | Bar adapts on weeks (≤16 per-week); names adapt on block count (≤4 under blocks, 5+ row below), independently | **Locked** |

### Turn 20 · 2026-09-27 · action hierarchy (app-wide) · Locked

Primary = filled: Blue (now, 50px), Moss (earned, 50px, no Home case yet), Tonal (lesser action alone, 44px soft fill from 12c). Secondary = 12f text, only under a primary. Rules: one primary per card; fill by meaning; lone lesser action → Tonal; whole-card tap → no button; no chevrons.

| Id | Content | Stamp |
|---|---|---|
| 20a | The system: 4 styles, 5 rules | **Locked** |
| 20b | Primary + secondary: Today card, No Active Program | **Locked** |
| 20c | Primary alone: Resume, Up next | **Locked** |
| 20d | Tonal: week card day summary, Calendar day summary (were outlined) | **Locked** |
| 20e | Card-tap, no button: rest, evening, program complete, recovery, week | **Locked** |

### Turn 21 · 2026-09-28 · due-now check-in (run pain + weekly feel)

One module, two questions. Run: "How's the pain today?" 0 to 10, 18 to 48h after a run with no delayed rating, program-independent (fixes the PainFollowUp bug), neutral scale (no traffic-light gradient), no default. Week: "How did the week feel?" 1 to 5, after the week's last scheduled session. Answered on the card. Save = moss. One at a time, run first. Always below the today card.

| Id | Stance | Stamp |
|---|---|---|
| 21a | Number row (44px cells), dimmed moss Save until picked, "Not now" secondary | unreviewed |
| 21b | Neutral slider, no thumb until touched, hero numeral | **picked** |
| 21c | Number row, tap saves, "Not now" Tonal, brief saved confirmation | unreviewed |
| 21d | In place under today card + module contract | unreviewed |

### Turn 22 · 2026-09-30 · check-in locked

- **Locked:** 21b slider. Grey track, no default, moss Save dimmed until set, "Not now" secondary.
- **Locked:** slot is directly under the today card.
- **Cut:** weekly "How did the week feel?".
- **Locked:** generic check-in module (eyebrow, question, context line, scale, trigger, exit). Ships with run pain only: 0 to 10, 18 to 48h after a run with no delayed rating, program-independent. One at a time.

### Turn 23 · 2026-09-30 · program progress card

Own card under Week. 19b bar mid-program; current week blue, fills by sessions done; whole card opens Program screen, no button.

| Id | Stance | Stamp |
|---|---|---|
| 23a | Bar only, done weeks moss | unreviewed |
| 23b | Bar only, done weeks grey (Resume bar grammar), moss saved for finish | unreviewed |
| 23c | Bar + running stats (adherence · PRs · sessions) | **Liked** · adherence; explore vertical bars (turn 24) |
| 23d | Bar + next phase/deload line | unreviewed |
| 23e | In place at bottom; raises "Week 3 of 11" duplication with subheader | unreviewed |

### Turn 24 · 2026-09-30 · program progress, vertical bars

One column per week, bottom-up fill, moss done / blue current, deload = half height. Adherence kept from 23c.

| Id | Stance | Stamp |
|---|---|---|
| 24a | Fill columns + stat row | **picked** |
| 24b | Stacked session cells + stat row | unreviewed |
| 24c | Adherence hero numeral + thin columns | close second · doesn't scale to long programs |
| 24d | Fill columns, adherence in header, footer line | unreviewed |

### Turn 25 · 2026-09-30 · Home Demo round (Home Demo.dc.html)

- Header: wordmark up to 22px. Settings is an iOS glass circle button (44px).
- Check-in too tall at 22a (~300px). Compact options: 25a number row, tap saves, ✕ (~130px) · 25b one-line prompt, card opens slider sheet (~66px) · 25c slim inline slider, Save slides in once touched (~120/180px). unreviewed
- Program card: vertical preferred over horizontal. Stress test presets 4 wk/1 block, 8/3, 11/3, 12/4, 16/5, 26/5. Names: none for 1 block, under for 2–4, row below for 5. Dense spacing past 16 wk. unreviewed

### Turn 26 · 2026-10-02 · program card locked

- **Locked:** program card = 24a, vertical fill columns + stat row (adherence · PRs · sessions). Vertical beats horizontal.
- **Locked:** subheader keeps the week: "Pillars · Week 3 of 11 · Hypertrophy".
- **Locked:** header settings = iOS liquid glass circle button. Wordmark size TBD on device (may go bigger).
- 5-block names: row below, evenly spaced with middots, current phase brighter. Engineering to verify label spacing in real implementation.
- Check-in compact redesign parked until after the program card. Next: back to check-in.

### Turn 27 · 2026-10-02 · check-in compact, full screen (Home Explorations)

Turn 26 in Explorations is the static record of the Home Demo locks (26a full screen, 26b length stress test).

| Id | Stance | Stamp |
|---|---|---|
| 27a | Tap row 0–10, one tap saves, ✕ dismiss (~130px) | unreviewed |
| 27b | One-line prompt, opens sheet with 22a slider (~66px) | **Liked** · direction; prompt doesn't read tappable (turn 28) |
| 27c | Slim slider, moss Save slides in once touched (~120/180px) | unreviewed |
| 27d | Slim slider, release saves, Undo replaces ✕ (~110px fixed) | unreviewed |

- **Locked (turn 26 amend):** program card header = grey "Program" eyebrow, "Week N of M" right in 11/600 #55575F (matches Recovery's "Whoop"). Program name only in the subheader.
- Eyebrow stays "Program". If a historical multi-program card is ever added, rename this one to "Current program" then.

### Turn 28 · 2026-10-02 · check-in prompt affordance (27b direction)

✕ moves into the sheet as "Not now" in all options. Sheet = 22a unchanged.

| Id | Stance | Stamp |
|---|---|---|
| 28a | Tonal "Rate" button (button-only tap) | **Liked** · runner-up |
| 28b | Empty scale preview (grey track, 0·5·10 ticks), whole card taps | unreviewed |
| 28c | Dashed empty "– / 10" field, whole card taps | unreviewed |
| 28d | Blue due treatment (tint, dot, blue "Rate" text) · flags tint rule | **Liked** · competing with Start may be intended |

### Turn 29 · 2026-10-02 · check-in placement: above today?

User wants the check-in seen before starting the workout. Breaks the brief's "below the today hero, never above" rule; testing it.

| Id | Stance | Stamp |
|---|---|---|
| 29a | 28a Tonal on top | unreviewed |
| 29b | 28d Blue on top | **picked** |
| 29c | Blue strip + filled blue "Rate" on top (two blue primaries on screen) | unreviewed |
| 29d | 28d Blue below (brief placement, reference) | unreviewed |

### Turn 30 · 2026-10-02 · check-in locked + motion (Home Demo)

- **Locked:** check-in = 29b. Blue due card ABOVE the today card (overrides brief's "never above"; user wants pain rated before the workout). Whole card tappable, opens the 22a sheet. "Rate" is blue text, not a button.
- **Sheet exits:** Save → card collapses, gone. Not now / handle / scrim → sheet closes, card stays until the 48h window ends. No separate permanent dismiss on Home.
- **Motion (in demo, unreviewed):** card load None / Rise (12px fade, 55ms stagger) / Spring (18px, 3px overshoot). Check-in arrival With the rest / Slides in last / Slide + 2 dot pulses. Save collapses the card.
- **Locked (motion):** cards load with Rise (12px fade-up, 420ms, 55ms stagger, cubic-bezier(.2,.8,.2,1), no overshoot). Check-in slides in last (440ms, opens space above Today) then its blue dot pulses twice and stops. Save collapses the card (320ms). Dot pulse is the one sanctioned exception to "nothing else glows".

### Turn 31 · 2026-10-03 · glow rule tightened

- **Locked:** static glow only on earned cards. One brief pulse may announce something newly due: once on arrival, then stops. Written to APEX README.md and CLAUDE.md.
- **Locked:** check-in dot pulse drops to a single pulse.
- **Resolved (turn 32):** 13b blue wash removed → 32b flat #0E1013. Glow rule has no exceptions beyond earned cards + the one-shot due pulse.

### Turn 33 · 2026-10-03 · header scroll + wordmark

- **Locked:** header collapses on scroll (iOS 26 large-title pattern). Wordmark 26px at rest → 17px inline; subheader folds away over the first 56px; glass settings button fixed top right throughout.
- **Locked:** soft scroll edge (blurred fade, no hard bar line), matching native Liquid Glass.
- Wordmark size to confirm on device.
- **Locked (turn 33, owner sign-off):** header = collapses on scroll, soft edge, 26px → 17px wordmark. Settings = glass circle button, 44px, fixed top right. Build note: use the system glass material so it respects the iOS 27 transparency slider.

### Turn 34 · 2026-10-03 · card order locked · Home complete

- **Locked:** Check-in (when due) → Today → Recovery → This week → Program. Urgency first, slowest-changing last.
- Home screen complete. Reference build: Home Demo.dc.html. Static record: Home Explorations turns 26–33.
- Next sessions: Program summary screen (from program complete card), Calendar screen (8b).

### Open question · 2026-10-03 · Home as a "day in time" (Whoop model)

Idea: Home shows one day, today by default, and you can go back to past days. **Decided:** Home stays "now"; no day navigation on Home. How the Calendar handles a single day is open. Owner isn't sold on making it look like Home. Decide in the Calendar session.

### App-wide · 2026-11-06 · Liquid Glass chrome (iOS 27)

Applied to every phone on every page (Home Explorations, Home Demo, Today Card Demo, Calendar Explorations, Calendar Demo). Earlier frames now show the new bar too.

- **Tab bar:** a floating Liquid Glass capsule, 62px tall, 20px in from the screen edges, 26px above the bottom, over the content (no full-width bar, no top hairline). Content scrolls under it with a soft scroll-edge fade. Filled SF Symbol-style icons (house, dumbbell, trend arrow, runner) over sentence-case 10/600 labels (was uppercase 10/700 glyphs). Selected tab sits on a lighter glass lens, icon and label in accent #659BC8; others #EDEEF0. Home indicator light, below the bar. Build: system `TabView`, which renders this natively.
- **Glass recipe (bar buttons + tab bar), iOS 27:** brighter specular top edge (white 34%), darkened outer edge (1px black 55%), blur 24 · saturate 1.8. Back and History/Settings stay 44px glass circles with an icon only, which is the iOS 26/27 pattern. Build: system glass material so the iOS 27 transparency slider (ultra clear → fully tinted) applies.
- Stamp: **applied, awaiting owner review**.

### App-wide · 2026-11-06 · tab bar softened

Owner: the bar looked heavy. Capsule fill flattened to a single glass tone (no top-to-bottom gradient), bottom scroll fade cut from 128px to 92px and lightened. Buttons unchanged.

### App-wide · 2026-11-07 · what counts as a PR

Owner: two kinds of PR only. (1) Estimated 1RM PR: a lift's estimated 1RM goes above its previous best. (2) Rep record: the heaviest weight for 1, 3, 5, 8, 12 or 15 reps; no other rep counts. A set counts toward every tracked rep count at or below its reps (225 × 6 can set the 5-, 3- and 1-rep records if it beats them). Judged on one completed working set, not the whole exercise; warm-ups never count. Estimated 1RM plays no part in rep records (owner, 2026-11-07). Applies everywhere PRs show (Home, Workout complete, Calendar day card, History, Program summary).

### App-wide · 2026-11-07 · iOS 27 pass (ios27-audit.md, iOS 27 Compare)

Locked by owner after a now-vs-proposed review:
- Muted text #55575F → #7C7E86 (4.5:1 on cards). Text never below 11px; caps labels at 11px use +0.6px tracking. Tab bar labels stay system size.
- Pushed screens (Calendar, History, Program summary): title centered in the bar at 17/700, the standard iOS inline title. Large left-aligned title under the back button tried and declined (empty row; large titles are for top-level screens). Home's 26 → 17 wordmark unchanged.
- Sheets: glass close top left, title centered 17/700, primary at the foot is a capsule.
- Two-series grey charts: light #A4A5AC unchanged, dark #5E6069 → #70727A (3:1 on the track). Round 1's brighter pair (#C4C5CB / #7C7E86) rejected as too bright.
Applied to all demos and the APEX Design System README. Explorations pages left as the historical record.


### Housekeeping · 2026-11-07 · Home tags

51 options on the Home Explorations page had no badge. Tagged **Locked** only where this log says so outright: 12f (turn 12/20), 20a–e (turn 20), 21b (turn 22), 24a (turn 26), 29b (turn 30). The other 42 are tagged **Needs review** for the owner: 1a, 1b, 1d, 1e · 9a–d · 12a–e · 21a, 21c, 21d · 22a–c · 23a–e · 24b–d · 26a, 26b · 27a–d · 28a–d · 29a, 29c, 29d · 32a, 32c. Stamps in the tables above are unchanged.

Owner rules (2026-11-07): when a turn has a locked option, the others in that turn are rejected; when a component was iterated over several turns and the last turn locked one, the earlier options are superseded by it. Applied: **Rejected** 1a, 1b, 1d, 1e (1c) · 12a–e (12f) · 21a, 21c, 21d (21b) · 24b–d (24a) · 29a, 29c, 29d (29b) · 32a, 32c (32b). **Superseded · 24a** 23a–e. **Superseded · 29b** 22a, 22b, 27a–d, 28a–d. Still **Needs review**: 9a–d (no locked option; turn 34 locked the order without options), 22c (check-in module spec; the module contract was locked in turn 22, so superseded may be wrong), 26a, 26b (turn 26 is the static record of Home Demo locks, not an iteration).

Owner (2026-11-07): 9a **Locked** (its Today → Recovery → Week order is the Home Demo's, with Check-in above and Program below from turns 30 and 26); 9b–d **Superseded · 9a**. 22c **Locked** (module contract; owner: low-value screen). 26a, 26b tagged **Record · Home Demo locks**: a static copy of the demo, nothing to decide. Every Home option now has a tag.

Owner 2026-11-10: toasts only for Undo (app-wide). The check-in no longer shows a "Saved · pain N of 10" toast; the card collapsing is the confirmation. Demo-only notes for unbuilt screens stay.

### Turn 35 · 2026-11-24 · This week: what tapping a day does, now that Calendar has changed
Owner, on the follow-ups: "Sounds good. Let's continue." Home's This week card must match Calendar, which changed on 2026-11-24 (Calendar turns 6a, 10a, 12b, 13b: missed day stays dashed even if done elsewhere; Moved tag; no button on a day card, tap it; two sessions as two cards, recovery on both). The grid follows on its own (sample week: Monday dashed, Tuesday one tick).
Found: turn 8's revision locked an inline day summary on Home with a View session / Preview session button (tonal since 20d), but the Home Demo never built it; tapping anywhere on the card, days included, opens Calendar. Not recorded as a decision either way.

| Id | Option | Stamp |
|---|---|---|
| 35a | A day opens Calendar with that day selected; anywhere else opens it on today. No summary on Home | Unreviewed |
| 35b | Turn 8's inline summary, in line with Calendar's card: no button, tap to open, two sessions as two panels with recovery on both, the Moved tag | Unreviewed |

Full screens (the Calendar Demo's sample week) on the page as images in `shots/`. Claude's suggestion: 35a (day detail in one place; Home's height never changes; no second copy of Calendar's day card to keep in step).
Noticed, not raised as a question yet: Home's week card marks a done day with a ✓ (7a) while Calendar shows the date in a filled circle; the owner said the card should look exactly like Calendar (2026-11-21).

Owner (2026-11-24) on turn 35: "Yeah, I think this should just be A." **Locked:** 35a. Tapping a day on This week opens Calendar with that day selected; anywhere else on the card opens it on today; no day summary on Home. Replaces turn 8's inline summary (never built). 35b rejected. Locked table and README (both copies) updated.
Built: Home Demo's This week card uses the Calendar Demo's sample week (Mon 17 missed, dashed; Tue 18 one tick) and each day is its own target (`gen_home_week.py`). Whole-app demo: a day opens Calendar on that day, the rest of the card on today (checked: Tue opens on Tue 18 with its two sessions; the card opens on today).

### Turn 36 · 2026-11-24 · This week: how a done day is marked
Raised after 35a, from the owner's 2026-11-21 statement that Home's This week card should look exactly like Calendar. The only remaining difference: Home marks a done day with a tick in the moss circle (7a), Calendar shows the date in it. Full screens (the Calendar Demo's sample week) on the page as images in `shots/`.

| Id | Option | Stamp |
|---|---|---|
| 36a | A tick, as locked (7a) | Unreviewed |
| 36b | The date in the moss circle, as Calendar | Unreviewed |

Claude's suggestion: 36b (the row reads as a strip of Calendar; the fill already says done there).

Owner (2026-11-24) on turn 36: "Yeah, yeah, I think B especially if you get to the end of the week, you would not even know the numbers at all. So I think B makes most sense there. I think the workout screen it looks fine to do that because you just more care about what you've been doing this week." **Locked:** 36b, a done day on Home's This week card shows its date in the moss circle, as Calendar. 36a rejected. Stated by the owner: the Workout tab's strip keeps its tick. Built into the Home Demo; Locked table and README (both copies) updated.

### Header built · 2026-11-24
Owner (2026-11-24), on building Apple's standard large title into Home and then checking Home against the newer rules: "Sounds good, let's do it."
Built into the Home Demo (`gen_home_week.py`), as the README's large-title rule (owner 2026-11-24) states: the wordmark (26px) and the subheader scroll away with the cards; once the wordmark has gone, a 17px wordmark fades in centred in the bar over the same soft blurred edge as the Workout tab; the glass settings button stays top right. The header switch in the notes panel now offers Apple standard (default) and Old: shrinks in place. Turn 33's lock stays on the page as history; the Locked table has a Header row. Checked at rest and scrolled 30, 60 and 300px: the wordmark and subheader sit where the Workout tab's large title and subheader sit (within 1px).

### Home checked against the rules added since it was built · 2026-11-24
Checked the Home Demo against every app-wide rule added after it was built. Passing: large-title header (above); no chevrons; no em dashes; 11px floor and the iOS 27 greys (the 10px tab bar labels are the tab bar's, the same in every demo); week circles by purpose (35a, 36b: date in the moss circle, missed day dashed, as Calendar); action hierarchy (one primary per card, whole-card taps carry no button); every tappable card shrinks to 98% while pressed and springs back; no menus, sheets, deletes or toasts in the design (the demo's toasts stand in for screens it can't open).
No changes needed.
Carried to the consistency pass, not changed: the recovery card's number is 30/800 and the line under it 11.5/600, neither on the README's type scale (hero numeral 34/800, body 11).
Home is done for this round. Next: History (two sessions on one day, then its rules check).

### Turn 37 · 2026-11-25 · Header: where the wordmark sits, and how big
Owner (2026-11-25), on the built header: "Apple's standard is to have it strictly below because I think when you scroll it actually looks a lot nicer when that header collapses into the center small when it was below. It would be nice to see what it looks like on a demo right now." And: "I wonder if we should actually make this font bigger ... Apex is just not standing out quite enough." He also asked for the logo as the A; the demo already had it (a screenshot was missing the image file) and it is in every option.

| Id | Option | Stamp |
|---|---|---|
| 37a | Same line as the gear · 26px (as built) | Unreviewed |
| 37b | Own row under the gear (Apple's strict layout) · 26px | Unreviewed |
| 37c | Own row under the gear · 34px (Apple's large-title size, our hero numeral size) | Unreviewed |
| 37d | Same line as the gear · 34px | Unreviewed |

Full screens at rest and scrolled 200px on the page (`shots/home-37a…d.png`). Home Demo: the Header switch gains "Below the gear" and Wordmark size gains 34px; the locked default (same line, 26px) is unchanged. Claude's suggestion: 37c. If a below option is chosen, the Workout tab's large title follows (README "Large titles").
Owner (2026-11-25) on turn 37: "Yeah, yeah, I think we should do 34 and probably below the gear." **Locked:** 37c, the wordmark 34px on its own row under the gear; scrolled, the small 17px wordmark shows centred on the gear's row. 37a, 37b, 37d rejected. Built into the Home Demo (opens on 37c; the switches keep the other layouts for comparison) and the whole-app demo. Locked table and README (both copies) updated. Not decided: the Workout tab's title (26px, no bar buttons) and the Progress tab's (26px, pinned beside its period stepper).
