# Program summary — decisions log

Same rules as `home-decisions.md`, `calendar-decisions.md` and `history-decisions.md`: every option in `Program Summary Explorations.dc.html` carries a stamp, shown as a tag beside its name on the page. **Locked** = stands · **Rejected** = turned down, reason recorded · **Superseded** = replaced by a later turn · **Fallback** = drop-back if the winner fails. **Highest turn number wins.**

Built on the APEX Design System (Design System artifact "APEX Design System"): two hues (blue = now, moss = earned), biggest number wins, facts not generated verdicts, glow only on earned surfaces, type scale 34 / 20 / 14 / 13 / 11 / 10.

## Inherited (locked)

| Area | Decision |
|---|---|
| Entry | The program complete celebration card on Home (13f) opens this page; whole card is the tap target (20e) |
| What the Home card keeps | Phase bar + Adherence · PRs · Best streak. Biggest gain and other detail live here (turn 14) |
| Same finish for everyone | Moss celebration whatever the adherence (15a) |
| Phase bar | Per-week segments filled by share of sessions done; deloads as thin 3px segments (17a); adaptive past 16 weeks (turn 18) |
| Header | Pushed screen: glass back, centered 17/700 title (iOS 27 pass; was 20/800); title is the program's name |
| Chrome | iOS 27 Liquid Glass tab bar and buttons (home-decisions, app-wide) |
| Rows | Small and clean, not bulky or wordy (History) |

## Locked

| Area | Decision |
|---|---|
| Lead | Consistency: sessions done as the hero number (52/55), the phase bar, adherence · PRs · best streak (turn 2, 1a) |
| Tone | Calm report throughout. No moss border, glow or "Program complete" eyebrow on this page; the Home card already celebrated (turn 2). Moss stays only on gains and the done fill of the phase bar |
| Next step | None on the page. Home's Up next card is the one place to start what's next (turn 2) |
| Top card | 2a: plain card, sessions hero (52/55), phase bar, adherence · PRs · best streak; reuses Home's phase bar and stat row (turn 3) · owner: "pretty clean" |
| Page order | Top card · Lifts · Personal records · Cardio · Recovery · Protocols · Adherence · Body part balance (turn 4) |
| Main lifts | Heading "Main lifts" (turn 5). Only lifts this program trained; start → end, sorted by change; up in moss, down grey "−5", no change "Same" (turn 4) |
| PRs | Estimated 1RM PRs and rep records (1, 3, 5, 8, 12, 15 reps; app-wide rule). Rep records heading carries no list of counts (turn 4) |
| Body part balance | By muscle under each group (3b), working sets where the muscle is a primary mover (turn 4) |
| Cardio and Recovery | Separate sections (turn 3). No Whoop label: the app is not tied to one source (turn 4) |
| Protocols | Own section, not a row in Adherence (turn 4). Pre-workout and post-workout groups, one row per protocol the program defines (any number, varies by program). Done bar green at 75%+ of sessions, grey below (turn 5) |
| Body part bars | Always grey (turn 5) |
| Adherence | Sets, training time, missed, most missed day (turn 5) · owner: most missed is interesting, keep. "Short" cut (turn 4) |
| Recovery chart | Program averages on top as hero numbers, then one cluster of vertical bars per block (recovery, sleep, strain) (turn 6, 5a). Recovery bar green at a 67%+ average, grey below; sleep and strain grey. Bar width adapts to block count: ~60% of a block's share split over three bars, 7–18px; full block names up to four blocks, short names beyond |
| Recovery reference | Recovery and sleep on a 0–100 scale (faint lines at 0, 50, 100); strain out of the bars as a number per block, labelled Strain where it sits; legend Recovery · Sleep (turn 8). Rotated 90°: one row per block, so a longer program only adds rows (turn 9, 8b). No green: recovery the light grey bar (#A4A5AC), sleep the darker grey (#70727A since the iOS 27 pass), always (turn 9) · owner: green the whole time would hide which bar is which. Block name above its pair of bars (11px, full row; ellipsis only if it still doesn't fit); bars always the chart's full width, never sized by name length. Legend above the chart (turn 10) |
| PRs: see all | Every estimated 1RM increase is always shown, never capped (after turn 10) · owner: seeing the 1RM gains is the best part. Rep records capped at three; the rest expand in place ("Show N more" / "Show fewer"), no new page and no link to History (turn 5) |
| Cut | vs last program's finish (turn 3) · owner: not sold |

## Open

- Avg RPE: placed in Adherence as "7.9 · 7.2 → 8.6 across blocks" (turn 5); owner wanted RPE somewhere, not necessarily per block.

- Later, after the Progress screen: tapping a main lift or an estimated 1RM row opens that lift's trend on Progress; test that the flow feels right (owner).
- Held back from the brainstorm: weekly volume (vanity), average RPE per phase, run pain trend, recovery on PR days (reads as a verdict).

---

### Turn 0 · 2026-11-07 · scoping

Owner pointed to the APEX Design System. The other answers did not come through and turn 1 went ahead mocking them side by side; the owner flagged it and answered after turn 1 (see turn 2).

### Turn 1 · 2026-11-07 · what it leads with

Mock program: Pillars, 11 weeks, Aug 3 – Oct 18, 52 of 55 sessions, 14 PRs, best streak 24.

| Id | Stance | Stamp |
|---|---|---|
| 1a | Earned header (sessions hero 52/55, phase bar, adherence · PRs · streak), then Lifts start → end, PRs (5 + All 14 in History), Cardio and recovery. No next step | unreviewed |
| 1b | Calm report: a tile per main lift (finish weight as the big number, from + gain), then Consistency (sessions, streak, phase bar), PRs, Cardio and recovery. No next step | **Not picked** |
| 1c | Compact earned header, then one card per phase (dotted labels: sessions, PRs, lifts that moved most), Cardio and recovery, then Choose next program with Repeat Pillars under it | **Not picked** |

### Turn 2 · 2026-11-07 · calm report, brainstorm

Owner answers: consistency leads, all four sections, calm report throughout, no next step; asked to brainstorm other sections.

| Id | Stance | Stamp |
|---|---|---|
| 2a | Calm 1a: plain card with sessions hero, phase bar, adherence · PRs · streak; Lifts, PRs, Cardio and recovery | **Top card locked** |
| 2b | 2a + four Idea sections: sets as prescribed (612 of 651 · 39 short), body part balance (neutral bars), vs Foundations, training time and misses | **Ideas sorted in 3** · kept sets, balance, time and misses; cut vs Foundations |

### Turn 3 · 2026-11-07 · the full page, body part depth

Owner walk-through of 2b: top card good; lifts good but what about drops; PRs need tighter rules; split Recovery from Cardio; keep sets as prescribed, time and misses, body part balance (deeper?); cut vs last program; protocols belong in Adherence.

| Id | Body part balance | Stamp |
|---|---|---|
| 3a | Six groups (Legs, Back, Chest, Shoulders, Arms, Core) | **Not picked** |
| 3b | Groups with their muscles under them (quads, glutes, hamstrings, calves; lats, upper and lower back; front, rear and side delts; triceps, biceps) | **Muscles locked** |

Both: lifts sorted by change, drops grey ("−5"), unchanged "Same". PRs split into Estimated 1RM and Rep records (1, 3, 5, 8, 12, 15 only), 9 instead of 14. Cardio: runs, distance, time and pace, longest. Recovery: recovery, sleep, strain averages, recovery by phase.

### Turn 4 · 2026-11-07 · refinements, a place for blocks

| Id | Stance | Stamp |
|---|---|---|
| 4a | Refined page: trained lifts only; rep records heading plain; See all 9 in History; Recovery averages with per-phase vertical bars; Protocols card (pre: Jump Rope, Abbreviated Ankle Protocol, Dynamic Warmup; post: mock Hip Mobility, Cool-down Walk) with moss done bars; Adherence: Sets, Training time, Missed, Most missed | unreviewed |
| 4b | 4a + Blocks (Idea): est. 1RM change per main lift per block, avg RPE and avg session per block | unreviewed |

### Turn 5 · 2026-11-07 · recovery by block

Owner: "Main lifts"; PRs linking to a filtered History is too much; keep most missed; protocol bars green at 75%+ only; body parts grey; Blocks section not landing, but session length and RPE are interesting; recovery should group by block so it scales to any number of blocks, with Whoop-style green at 67%+ and grey otherwise. Turn 4 stamps: 4a **Refined in 5** · 4b **Blocks cut**.

| Id | Recovery chart | Stamp |
|---|---|---|
| 5a | Vertical: one cluster of three bars per block, block name and recovery under it | **Vertical locked** |
| 5b | Horizontal: per block, three labelled bars with values | **Not picked** |
| 5c | 5a on a six-block program (with a deload) | **Scale check** |

Also on all three: PRs show 3 + 3 and expand in place (Show all 9 / Show fewer); Avg RPE row in Adherence; Blocks section removed (avg session length already in Training time).

### Turn 6 · 2026-11-07 · recovery bars that fill the card

Owner: vertical bars, but three blocks looked sparse; fill the space without getting bulky. Asked what the number under each block was: that block's average recovery.

| Id | Stance | Stamp |
|---|---|---|
| 6a | Adaptive width (18px bars at three blocks), full block names, no number under blocks | **Width kept** |
| 6b | 6a + the block's average recovery under its name, green when the bar is green, grey otherwise | **Not picked** |
| 6c | 6a at six blocks: 8px bars, short names | **Scale check** |

### Turn 7 · 2026-11-07 · giving the bars a reference

Owner: no way to read the bars' levels (no axis, no numbers), worst at six blocks; strain is not a percentage so it can't share a percent scale.

| Id | Stance | Stamp |
|---|---|---|
| 7a | Recovery and sleep only, paired bars on a 0–100 axis (faint lines at 0, 50, 100); strain as a number row under each block; green per metric at its own line | **Picked, refining** |
| 7b | 7a + each bar's value printed above it | **Not picked** |
| 7c | 7a at six blocks | **Scale check** · labels cramp |

### Turn 8 · 2026-11-07 · lighter legend, the chart turned on its side

Owner: 7a best; too much legend text; strain row spacing odd and unclear what it belongs to; six blocks cramp, and wrapping blocks onto two lines would be messy; try 7a's bars rotated 90° (not 5b's labelled bars) so blocks stack as rows.

| Id | Stance | Stamp |
|---|---|---|
| 8a | 7a with legend "Recovery · Sleep" only; Strain label in the axis column, right under the block names | **Not picked** |
| 8b | Rotated: one row per block (name left, recovery and sleep bars stacked tight, strain at the row's end under a Strain header), 0–50–100 scale across the top | **Rotation locked** · names truncated |
| 8c | 8b at six blocks | **Scale check** |

### Turn 9 · 2026-11-07 · rotated chart, no green, names that fit

Owner: drop the green; the rotated chart (8b) is the one, but "Hypertrophy" gets cut off; try the legend under the chart.

| Id | Labels | Stamp |
|---|---|---|
| 9a | Block name above its pair of bars, full width; legend under the chart | **Labels locked** · legend back on top |
| 9b | Left column, sentence case 11px so names fit in 86px; legend under the chart | **Rejected** · bars shouldn't shrink for a long name |
| 9c | 9a at six blocks | **Scale check** |

### Turn 10 · 2026-11-07 · the recovery chart, locked

| Id | Stance | Stamp |
|---|---|---|
| 10a | Names above bars, legend above, full-width bars, strain column, no green | **Locked** |
| 10b | Six blocks with long names ("Intensification and Overreach") | **Scale check** |

### Program summary complete · 2026-11-07 · reference build

`Program Summary Demo.dc.html` is the reference build: one phone with every lock (calm top card, main lifts, PRs expanding in place, cardio, the 10a recovery chart, protocols, adherence, body part balance by muscle). Static record: Program Summary Explorations turns 1 to 10. Post-workout protocol names in the mocks are placeholders; real ones come from each program.

After turn 10 (owner): every estimated 1RM increase always shown; only rep records collapse. Demo's top card PR count corrected to 9 to match the section under the PR rule.

iOS 27 pass (2026-11-07): title 17/700 centered; recovery chart sleep bar #70727A (recovery bar unchanged). Grey labels #7C7E86, 11px minimum. See home-decisions.md.

### Turn 11 · 2026-11-25 · Rules check (c04): seven questions as mocks
Owner, after the Exercise detail rulings: "Sounds good. Let's move on." Checked against every README rule and Exercise turns 50-52.
Passing: header (H1, back button row, 17/700 small title, 28/800 large title); content at 128pt; section labels 8pt above their cards; no cards stacked directly on each other; cards (gradient, 10 radius); 11px minimum; colours (moss gains, grey Same and drops, no red); copy (middots; the date range's en dash is not an em dash); Show 2 more expands in place; every est. 1RM gain shown.
Fixed (README: numerals always tabular): the date range, "Estimated 1RM" and "Show 2 more" weren't tabular; the whole content now is (gen_sum11.py, as on Exercise detail).
Each mock outlines the fields in question in blue.

| Id | Option | Stamp |
|---|---|---|
| r1a | Section labels #8F9098, as today | Rejected · r1b locked |
| r1b | #7C7E86, the eyebrow grey every other screen uses (Claude's pick) | **Locked** |
| r2a | Right-hand notes (Start → end, By block, Sessions done, Working sets) sentence case 11/600, as today | Rejected · r2b locked |
| r2b | Uppercase 11/700 +0.6, like Exercise detail's EST. 1RM and the Workout tab's ABOUT 12 MIN (Claude's pick) | **Locked** |
| r3a | Recovery averages (71%, 82%, 11.4) 20/800, as today, added to the scale | Rejected · r3b locked |
| r3b | 24/800, the Readout size (Claude's pick) | **Locked** |
| r4a | Top-card numbers (95%, 9, 24) 15/600, as today, added to the scale | Rejected · r4b locked |
| r4b | 15/700, the Record value style (Claude's pick) | **Locked** |
| r5a | Body part sub-rows #A4A5AC 13/500, as today | Rejected · r5c locked |
| r5b | #8F9098, 13/500 stays | Rejected · r5c locked |
| r5c | #8F9098 at 13/600, the Value style (Claude's pick) | **Locked** |
| r6a | Show 2 more as a tonal button 14/600 white, as today | Rejected · r6b locked |
| r6b | A Show all row: centred 13/600 #8F9098, 44pt, hairline above (Claude's pick) | **Locked** |
| r7a | 12/600 dates and strain numbers as today; add "Meta 12/600" to the scale (Claude's pick) | Rejected · r7b locked |
| r7b | 12/500, the Helper weight (Exercise detail's dates would change too) | **Locked** |

Owner (2026-11-25): "Q1: B / Q2: yeah uppercase should be fine / Q3: B Sounds good / Q4: B sounds good here too / Q5: C / Q6: Yes definately B / Q7: I think both should use the correct scale." Asked which he meant for Q7: "12/500 on both (r7b)".
All seven built (gen_rules11.py): section labels #7C7E86; the right-hand notes uppercase 11/700 +0.6 (START → END, BY BLOCK, SESSIONS DONE, WORKING SETS); recovery averages 24/800; top-card numbers 15/700; body part rows #8F9098 13/600; Show 2 more / Show fewer drawn as the Show all row (13/600 #8F9098, 44pt, hairline above; the Personal records card loses its 14px foot padding so the row sits at the foot); every 12px text 12/500. r7b also applied to Exercise detail (main, accessory, long name), except the Session page inside that demo, which is Session detail's.
Not asked, for later: "/ 55" beside the hero is 20/700; the block names under the phase bar track +0.9 (eyebrows are +0.6); both come from Home's top card.
