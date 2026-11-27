# Progress — decisions log

Same rules as the other logs: every option in `Progress Explorations.dc.html` carries a stamp. **Locked** = stands · **Rejected** = turned down · **Superseded** = replaced later · **Unreviewed** = not decided. Only the owner locks or rejects. **Highest turn number wins.**

## Locked (scoping, owner 2026-11-10)

| Area | Decision |
|---|---|
| Questions | The landing answers four: am I getting stronger and on which lifts · what records are new · is anything stuck (gone flat) · am I putting in the work (weekly sets) |
| Shape | The landing is a dashboard-like page; the depth is one tap down |
| All exercises | Reachable from Progress behind a tap. It is the one Exercises screen: history for every exercise and managing exercises together (owner considered Settings, chose one screen here) |
| Exercise detail | Where the real use is: past sessions (each opens its Session detail), records and estimated 1RM, trend lines, resources (videos and links) |
| Landing lifts | The active program's main lifts are the ones shown (pinned) on the landing (owner, after turn 1). Everything else through All exercises |
| PRs | Recent PRs get their own section, not a tag on the lift tile (owner, after turn 2) |
| Order | Main lifts, then All exercises right after them (owner, after turn 2) |
| Range control | Program · 6M · 1Y · All (6a, owner, after turn 6). 6M is the default (owner, after turn 7) |
| Strength comparison | Program: the last block of the same type (Hyp, Str, Peak) at the same point; per lift, the last time that lift was in such a block; nothing to compare = no change shown. 6M and 1Y: best 3 in the range vs the best 3 before it. Drops stay grey (data rule), so a planned dip never reads as an alarm (owner aligned, after turn 9). All: open |
| Paging | Page back through periods with plain arrows either side of the dates, top right (14a, owner, after turn 14). Program pages by program |
| Period label | **Amended 26b (2026-11-25):** the arrows and dates sit under the 28px title on the right, overlapping the title's row by 10px, and scroll away with it (the tab header as every tab). Before: 6M, 1Y, All: dates top right between the arrows. Program: the program's name top right (15b), its dates at the right of the Main lifts header; nothing there on other chips. Section label just "Main lifts" (owner, after turn 16) |
| Recent PRs | Three rows, then expand in place (no new screen). **Amended 28a (2026-11-25):** at rest the header is the label "Recent PRs" only and Show all N sits at the foot; while the list is open, Show fewer is at the foot and also at the right of the header (27a had the foot only). Before: both at the foot and at the right of the header (17c) |
| Training tiles | Four tiles, keep it clean: Sets / week, Sessions / week, Avg RPE, Time / week. Time is the one that could be swapped (for hard sets per week). Not here: tonnage (owner: a dumb metric), Whoop weekly averages (Whoop already shows them). Sets per body part: maybe a different view, not these tiles (owner, after turn 17) |
| Avg RPE tile | A line (20b), 5–10 scale, styled with the bar tiles (owner, after turn 20) |
| Training charts | Bars for sets, sessions, time; RPE a line (5–10). Deloads darker, this week an outline ("so far"), dashed range average; averages over training weeks only. Weekly on Program and 6M, monthly on 1Y and All (21b, owner, after turn 21). All adapts as history grows: up to 2 years one bar per month, 2 to 6 years per quarter, over 6 years per half-year; the main-lift charts on All plot the best of each month (quarter past 2 years) the same way (owner, after turn 21) |
| Period-change motion | Chips: charts morph to the new range over 600ms ease-in-out and numbers count to their new values. Arrows: the page slides 40px in from the side you move toward, 420ms. Bars grow once, on arrival. No haptics. An exception to the 300–350ms smooth timing, for this screen (23a, owner, after turn 23) |
| Hero labels | Strength · Consistency · Protocols, one word each on every chip (owner: "probably just strength", after turn 7) |
| Training | Weekly metrics over time, each tile with its own headline number, are a crucial part of the page (owner, after turn 4) |
| Heroes | 2–3 hero metrics headline the page above the main lifts (owner). Centered, one card split into cells (owner, after turn 4); averages, rates and improvements rather than totals, since there's no other spot for them (owner, after turn 3). Final style and picks open |
| Exercise identity (build) | Every exercise is keyed by an ID, so a rename keeps its history and duplicates can be prevented |

## Open

- Time range: range chips vs by program (shown in turn 1).
- Resources: links (rich previews) vs embedded videos / a learning section. Owner: "maybe that's too much and it's just links". Not decided.
- Trend line for accessories (heaviest set, most reps, longest hold, best pace by exercise type; no line under ~3 sessions): proposed, not decided.
- Duplicate prevention: how Add exercise catches a near-duplicate name (design when Add exercise is designed).
- Body part balance and recovery stay on Program summary (proposed, not decided).

## Turns

### Turn 1 · 2026-11-10 · landing page

Owner asked to see "am I getting stronger" first (option 1) and an overview dashboard (option 3); time range left to Claude to show options.

| Id | Option | Stamp |
|---|---|---|
| 1a | Strength first · range chips: a full chart card per main lift, then new records, gone flat, weekly sets, All exercises | Unreviewed |
| 1b | Strength first · by program: program menu, charts span the program with block bands | Unreviewed |
| 1c | Dashboard · range chips: stat tiles, one Strength card with sparkline rows, then the rest | Unreviewed |
| 1d | Dashboard · by program: program pills, tiles count the program, weekly sets with block bands | Unreviewed |

After turn 1 (owner): "None of these are that close." Recentering on a ranking of the metrics before the next layout. Graphs take too much room: try two columns.
- Gone flat: owner leaning against a separate section; a neutral change number on the lift ("Same", grey) may be enough. To confirm.
- New records: owner asked what it means; explained in chat. Whether it earns a section is open.
- New records (owner, after the explanation): a Recent PRs section may be nice; wants to see it mocked next to a PR tag on the lift tile.
- Owner: All exercises link is a must; some useful metrics below; the top should be headlined by 2–3 hero metrics before the main lifts. Show both options.

### Turn 2 · 2026-11-10 · hero metrics, two-column lifts, PRs section vs tag

| Id | Option | Stamp |
|---|---|---|
| 2a | Range control · 3 heroes (sessions, PRs, strength %) · main lifts 2 × 2 with a PR tag · Training tiles 2 × 2 (sets, sessions, avg RPE, time per week) · All exercises | Unreviewed |
| 2b | 2a with a Recent PRs list under the lifts instead of tags (shows accessory records too) | Unreviewed |
| 2c | No heroes · PR tags | Unreviewed |
| 2d | No heroes · Recent PRs list | Unreviewed |

Noted in the mock: change over the range can hide a stall (Overhead Press reads +14 over 6 months, flat since Sep 7).

After turn 2 (owner): "B is the closest but not great." PR section rather than the tag on the card. All exercises moves up to right after the main lifts. Hero metrics are styled terribly: smaller, cleaner text. Stamps on the page: 2b "Closest · refined in 3"; 2a, 2c "PR tag · owner prefers the section"; 2d "No heroes · owner wants heroes". Turn 1 stamped "Owner: none close".

### Turn 3 · 2026-11-10 · 2b refined, heroes restyled

Order: range · heroes · main lifts · All exercises · Recent PRs · Training. Only the hero row differs.

| Id | Hero style | Stamp |
|---|---|---|
| 3a | Plain numbers on the background, 20/700, 12px label | Unreviewed |
| 3b | One card, three cells split by hairlines, 17/700, 11px label | Unreviewed |
| 3c | One 15px line: 118 sessions · 21 PRs · +12% strength | Unreviewed |
| 3d | Three small tiles, label over a 17/700 number | Unreviewed |

After turn 3 (owner): focus on the hero metrics. Centered, like b or d. Averages, rates or improvements rather than aggregates, because there isn't another spot for them. Stamps: 3b, 3d "Style kept · refined in 4"; 3a, 3c "Not picked · owner: b or d".

### Turn 4 · 2026-11-10 · hero metrics only

| Id | Option | Stamp |
|---|---|---|
| 4a | One card, centered: +12% strength gain · 95% sessions done · 3.5 PRs / month | Unreviewed |
| 4b | Tiles, centered: same numbers as 4a | Unreviewed |
| 4c | One card, centered: +2.0% strength / month · 4.5 sessions / week · 7.8 avg RPE | Unreviewed |
| 4d | Tiles, centered: same numbers as 4c | Unreviewed |

After turn 4 (owner): a or c, the one-card style for sure (tiles 4b, 4d not picked). Numbers still to settle: strength increase stays ("for sure"); session adherence stays but reworded; PRs a month doubtful (depends on the range chip, and maybe not a great metric), maybe protocol adherence instead. The Training metrics at the bottom are crucial: over-time charts, each with its own headline number (this week's or the range average, undecided).

Owner (2026-11-11): agrees with Consistency 95% (sessions logged of planned), dropping PRs a month, Protocols as the third hero, and the Training tiles' headline (range average as the big number, this week under it) except where noted. Does not like strength as start-of-range vs end-of-range: programs start lower and build to a strong finish, so it is always skewed. Comparing to the previous period of the same length doesn't seem great either. Open. Also wants to consider a Program time chip at the top; thinking it through.
Owner ideas on strength (2026-11-11, not decided): average of the period vs average of history before would be skewed by ramp strategy and dilute peaks; maybe a "top X%" instead of a pure peak for better signal. Early in a program, two strategies: be honest and blank the metric with a notice, or compare against the same share of progress through historical programs (or the last program), e.g. 20% through vs the first 20%. Unsure whether to switch to the full comparison at some threshold or only at the final week.

Owner (2026-11-11): aligned with the strength proposal; compare to the last program (not an average of past programs). Labels: cleaned up, too wordy.
- Strength (aligned): each main lift's best 3 sessions (not a percentage of sessions), percent change, averaged across the main lifts. Program chip: best 3 so far vs the best 3 from the same share of the last program; no threshold, it becomes the full comparison on the last day. Time chips: best 3 in the range vs the best 3 before it; hidden on All. Week 1: blank until each lift has about 2 sessions. Proposed, not confirmed: cap "before" at about 12 months.
- Heroes: Strength · Consistency (sessions logged of planned) · Protocols. PRs a month dropped.
- Training tiles: range average as the big number, This week under it.

### Turn 5 · 2026-11-11 · Program chip, strength rule, short labels

Stamps on turn 4: 4a, 4c "Card style locked · numbers in 5"; 4b, 4d "Tiles not picked".

| Id | Option | Stamp |
|---|---|---|
| 5a | Program chip first and default; heroes +6% Strength · 100% Consistency · 92% Protocols; lift tiles change on the same rule; Training tiles show the 12 program weeks with future weeks as an empty track | Unreviewed |
| 5b | 5a with the strength label "vs last program" | Owner: the label needs "Strength" in it |
| 5c | 6M chip: +9% Strength vs the best 3 before the range | Unreviewed |
| 5d | Week 1: strength blank, one line saying when it shows | Unreviewed |

After turn 5 (owner): Program takes too much space in the range control; maybe abbreviate (Prgm, Prg, Prgrm) or drop one of the time pills.

### Turn 6 · 2026-11-11 · range control

| Id | Option | Stamp |
|---|---|---|
| 6a | Drop 3M: Program · 6M · 1Y · All (Program already covers about three months) | **Locked** (owner) |
| 6b | Drop All: Program · 3M · 6M · 1Y | Rejected |
| 6c | Abbreviated, five segments: Prgm · 3M · 6M · 1Y · All | Rejected |

After turn 6 (owner): 6a. "Strength" has to be in the hero label; without it you have no idea what the number is.
Owner: "yeah maybe stng vs last".

### Turn 7 · 2026-11-11 · strength label

| Id | Option | Stamp |
|---|---|---|
| 7a | "Strength vs last" (Program chip) | Superseded · label is just "Strength" |
| 7b | "Stng vs last" | Rejected · owner meant the word spelled out |
| 7c | Time chip with the matching "Strength vs best" | Superseded · label is just "Strength" |

After turn 7 (owner): 6M should be the default. "Stng" was shorthand; the label spells out Strength. Label still undecided: "Strength vs last" on every chip, or just "Strength" (not sure "vs last" is too long).

Owner: probably just "Strength". Follow-up (not now): a way to explain these metrics, either a section that drops down when tapped or a new screen with more info. Tracked as GitHub issue #87.

### Turn 8 · 2026-11-11 · everything decided so far, on one screen

| Id | Option | Stamp |
|---|---|---|
| 8a | Current state, 6M default: range control · hero card · main lifts 2 × 2 · All exercises · Recent PRs · Training tiles (average as the big number, This week under it) | Unreviewed |
| 8b | Same screen on the Program chip | Unreviewed |

Still open: main-lift tiles (change number, chart detail), Training tiles (which four metrics, chart style), Recent PRs (how many, what Show all opens), metric explanations (#87, later).

After turn 8 (owner): move on to the main-lift tiles. Wants other tile designs, and the explorations should let him flip through Program · 6M · 1Y · All to see how each range affects the tiles.

### Turn 9 · 2026-11-12 · main-lift tiles, working range control

Each phone's range control works: the hero card and the four tiles change with it. Change follows the strength rule (Program: vs the same point in the last program; 6M, 1Y: best 3 vs the best 3 before the range). All: tiles show change since the first log (May 2024), hero strength blank; open.

| Id | Option | Stamp |
|---|---|---|
| 9a | Current tile (turn 8) for reference: name, number, change, line, first and last dates | Unreviewed |
| 9b | Chart-forward: soft-filled chart edge to edge at the foot, name and change on one line, no dates | Unreviewed |
| 9c | Bars: best estimated 1RM in each of 10 slices of the range | Unreviewed |
| 9d | Number first: 26px number, change with what it's against, slim sparkline, all-time best at the foot | Unreviewed |

After turn 9 (owner): leaning 9a or 9b. Asked what the tile numbers mean and compare against; the mock's big number (latest session) and change (best-3 rule) were measured differently. Owner worried about under- and over-alarming: a hypertrophy or mobility program lowers strength by design. Aligned on block-type matching for Program and the peak rule for 6M and 1Y. All: careful with "first log vs now" (only about six months of data in the app); maybe the lowest or highest of the first four logs. Owner has very old workout logs that could be imported later (not critical now). Revisit the tiles on the agreed rules.

### Turn 10 · 2026-11-12 · tiles on the agreed rules

Big number: best estimated 1RM of the last couple of weeks, same on every chip. Change: same rule as the hero (hero = average of the four tiles). Chart: the range. All shown as best 3 overall vs the best 3 of the first 4 sessions (Claude's proposal, not decided).

| Id | Option | Stamp |
|---|---|---|
| 10a | 9a layout, change in % | Unreviewed |
| 10b | 9b layout, change in % | Unreviewed |
| 10c | 9a layout, change in lb | Unreviewed |
| 10d | 9b layout, change in lb | Unreviewed |

After turn 10 (owner): why is the big number "the last couple of weeks" on every chip, including 6M and 1Y? Program was agreed on a different mechanism. Wants to see deloads and drops, and what 1Y looks like with about 70 data points.

### Turn 11 · 2026-11-12 · tiles on realistic data

Big number now follows the chip and is the same measurement the change uses: best 3 sessions in the range (Program: best 3 so far in the current program). Change vs the chip's baseline (Program: last block of the same type at the same point; 6M, 1Y: best 3 before; All: best 3 of the first 4 sessions, proposal). Mock: every session since Jun 2025, six programs with typed blocks, a deload at the end of each, a two-week holiday gap, Bench missing two weeks in March and coming back lighter, Overhead Press flat since Sep 7; about 70 sessions per lift in 1Y.

| Id | Option | Stamp |
|---|---|---|
| 11a | Every session joined as a line | Unreviewed |
| 11b | Session dots plus a line through the best of the last 3 sessions | Unreviewed |
| 11c | Chart-forward (9b layout), best-of-3 line filled, no dates | Unreviewed |

After turn 11 (owner): leans 11c. Big number: "probably should be average" of the best 3, provided the actual rep PRs (1-rep and every tracked rep count) stay visible in Exercise detail, which tiles open (that is the plan: Exercise detail shows the records at 1, 3, 5, 8, 12, 15). Asked how the line in 11b and 11c is smoothed and what smoothing does with few data points.
Owner: a smoothing threshold is needed; is 8 high enough? Likely to tune on device once real data is in. The chips no longer show their dates (fine, redundant on every chip), but the date range needs to show somewhere, e.g. near the top: the time range, not necessarily the program name.

### Turn 12 · 2026-11-12 · smoothing threshold, date range

Smoothing: rolling median of 3 sessions; under 8 sessions no smoothing (dots joined by a plain line). 8 is a starting value to tune on device (build: keep it a single constant).

| Id | Option | Stamp |
|---|---|---|
| 12a | 11c with the median line; dates centered under the range control | Unreviewed |
| 12b | 11b (dots + median line); dates under the control | Unreviewed |
| 12c | 12a with the dates at the right of the Main lifts header instead | Unreviewed |
After turn 12 (owner): the range applies to everything on the screen, so not above the main lifts (12c out); under the chips feels a bit odd; try the top right above the chips (no action button there now).

### Turn 13 · 2026-11-12 · dates in the title row

| Id | Option | Stamp |
|---|---|---|
| 13a | Dates at the right end of the title row, 13px grey #8F9098, change with the chip | Unreviewed |
| 13b | Same, 12px muted #7C7E86 | Unreviewed |

Note: they'd fold away with the large title on scroll; an action button there later would need the dates to move.
After turn 13 (owner): dates in the title row are fine; if an action button ever comes, shift everything down. Owner wants to page through periods (like Whoop, and Calendar's arrows): 6M defaults to the latest six months and can go back. "I don't think it's a visual niche. I think this could be useful."

### Turn 14 · 2026-11-12 · paging back through periods

Arrows either side of the dates, top right. Switching chips returns to the latest period. Earlier windows keep the agreed rule from their own start (best 3 in the window vs the best 3 before it); "–" when there's nothing before. Program pages by program, name before its months; current program as turn 11, a finished program vs the whole program before it; the first program shows "–". All doesn't page.

| Id | Option | Stamp |
|---|---|---|
| 14a | Plain chevrons beside the dates | **Locked** (owner: "definitely the plain arrows") |
| 14b | Chevrons in small glass circles | Rejected |

Seen in the mock: long program labels (Strength B · Dec '25 – Mar '26) crowd the title row, worst with 14b's circles.

After turn 14 (owner): plain arrows. Program name and dates can't both sit up top. Try: dates only up top with the program name elsewhere (not changing the look much from 6M and 1Y); Program with only the name up top, no dates; Program with the name up top and the dates on the charts (clickable between Program and 6M).

### Turn 15 · 2026-11-12 · program name vs dates on Program

| Id | Option | Stamp |
|---|---|---|
| 15a | Dates only up top on every chip; on Program the name sits at the right of the Main lifts header | Unreviewed |
| 15b | Program: name only up top, no dates | Unreviewed |
| 15c | Program: name up top, first and last session dates under each tile's chart; 6M and 1Y unchanged | Unreviewed |

After turn 15 (owner): likes 15b most (program name up top on Program), but no date anywhere; maybe the dates go at the right of the Main lifts header instead of "Best 3 sessions · est. 1RM", and est. 1RM stays somewhere.

### Turn 16 · 2026-11-12 · 15b with the program's dates in the Main lifts header

| Id | Option | Stamp |
|---|---|---|
| 16a | Label "Main lifts · est. 1RM" on every chip; on Program the program's dates at the right of the header; empty on 6M and 1Y | **Locked**, with the label just "Main lifts" (owner) |
| 16b | "Main lifts" label; right side "Oct 28 – Nov 11 · est. 1RM" on Program, "est. 1RM" on 6M and 1Y | Superseded |

After turn 16 (owner): "this is good". Drop est. 1RM from the Main lifts label (wordy). Exercise detail (opened from a tile) gets an info element explaining the number: estimated 1RM, the average of the best 3 sessions.

After turn 16 (owner): keep working down the screen. Recent PRs: maybe three rows; expand in place, not a new screen; wants something to re-collapse it.

### Turn 17 · 2026-11-12 · Recent PRs

| Id | Option | Stamp |
|---|---|---|
| 17a | Three rows; "Show all 21" opens the rest in place; the same foot button becomes "Show fewer"; collapsing scrolls the header back into view | Rejected |
| 17b | 17a with a chevron beside the label that flips | Rejected |
| 17c | 17a plus Show all / Show fewer at the right of the section header, to close from the top | **Locked** (owner: "probably valid… kinda duplicative, but not the end of the world") |
| 17d | Three rows, "Show 5 more" in steps, "Show fewer" beside it once open | Rejected |

After turn 17 (owner): Training = four tiles: sets, sessions, average RPE, training time per week. Training time is the only one that might be swapped, for hard sets per week (owner unsure what hard sets adds). Body part sets maybe a separate view.

### Turn 18 · 2026-11-12 · Training tiles, chart styles

Four tiles (Sets / week, Sessions / week, Avg RPE, Time / week); big number = range average over full weeks; This week under it. Chips work.

| Id | Option | Stamp |
|---|---|---|
| 18a | Weekly bars (RPE as a line); Program shows its 12 weeks with the rest as an empty track | Unreviewed |
| 18b | 18a plus a dashed line at the range average | Unreviewed |
| 18c | Weekly bars up to 6M, monthly bars on 1Y and All | Unreviewed |
| 18d | All four as lines with the dashed average | Unreviewed |

Seen in the mock: the partial current week always ends the chart with a drop (2 of 5 sessions on a Wednesday); open how to draw it.
After turn 18 (owner): likes the bars; 18b also looks good; deloads will affect these. Asked why Avg RPE isn't bars.

### Turn 19 · 2026-11-12 · Training: bars everywhere, deloads, this week

Both: 18b; deload weeks a darker bar; this week an outline with "so far"; averages over training weeks only (no deloads, gaps or this week).

| Id | Option | Stamp |
|---|---|---|
| 19a | Avg RPE as bars from zero (nearly level) | Unreviewed |
| 19b | Avg RPE as bars from 6 (shows the climb; lengths not proportional) | Unreviewed |
After turn 19 (owner): 19b, or even the line; the line looked a little out of place but might represent RPE better.

### Turn 20 · 2026-11-12 · Avg RPE, bars or line

| Id | Option | Stamp |
|---|---|---|
| 20a | RPE bars from 6 (19b) | Rejected |
| 20b | RPE line on the 6–10 scale, styled with the bar tiles: same weekly spacing, dashed average, empty track on Program; deloads as dim dots below, the gap breaks the line, this week a hollow dot | **Locked**, scale 5–10 so the lowest weeks sit off the axis (owner) |

After turn 20 (owner): likes 20b; the line looks better. Scale 5–10 (not 6), so there is space above the bottom rule.

### Turn 21 · 2026-11-12 · Training on 1Y and All: weeks or months

| Id | Option | Stamp |
|---|---|---|
| 21a | Weekly bars on every chip (52 on 1Y, 74 on All); deloads and the holiday gap stay visible | Rejected |
| 21b | Monthly bars on 1Y and All (average of each month's training weeks; deloads and gaps drop out); this month an outline | **Locked** (owner: calmer; paging 6M back gives the weekly detail) |

After turn 21 (owner): 21b. Monthly is calmer, and paging 6M back gives the weekly detail anyway. All is unbounded (four years of use = a lot of months): another threshold?
Owner: the rule works, except over six years use six months, not a year.

## Reference build · 2026-11-12

`Progress Demo.dc.html`: everything locked above on one working phone (chips, paging, top-right label, hero, main-lift tiles, All exercises, Recent PRs 17c, Training 21b with the 20b RPE line). Added to the APEX App Demo as the Progress tab; main-lift tiles open Exercise detail and All exercises opens the list (both placeholders until designed). Bars grow on arrival (m9), tiles and the All exercises row press in (m11), Recent PRs expand smooth (m6), period changes fade (240ms).

Owner (2026-11-12): the count in the Recent PRs header ("14 this program") was added without his call; removed. The header carries only Show all / Show fewer (as in 17c), nothing when there are 3 or fewer.

Owner (2026-11-12): should the charts animate when the chip changes or the arrows are used? Claude proposed: arrows slide by direction (Calendar's locked month flip, 28px, 260ms); chips morph the charts and roll the numbers; crossfade (200ms) where the bar count changes a lot; no haptics. Noted: the Progress Demo currently fades the page and regrows the bars on every change, against "charts grow once per visit".

### Turn 22 · 2026-11-12 · motion when the period changes

| Id | Option | Stamp |
|---|---|---|
| 22a | (Superseded by 23a) Arrows slide by direction (260ms); chips morph the charts (bars resize and re-space, lines reshape, average line moves, 350ms) and roll the numbers | Unreviewed |
| 22b | Chips and arrows both crossfade (200ms) | Rejected |
After turn 22 (owner): 22a definitely better than 22b; curious about a smoother, slower rolling transition.

### Turn 23 · 2026-11-12 · slower, smoother period changes

Both keep 22a's idea; numbers count to their new value; ease-in-out. Past the locked 300–350ms smooth timing, so choosing one would change that rule for this screen.

| Id | Option | Stamp |
|---|---|---|
| 23a | Chips 600ms morph + counting numbers; arrows 40px slide, 420ms | **Locked** (owner: "I like the 600ms the most") |
| 23b | Chips 900ms; arrows 600ms | Rejected |

After turn 23 (owner): 600ms (23a). Progress Demo rebuilt data-driven with this motion (and the App Demo with it).

### Turn 24 · 2026-11-25 · Progress tab: the header, as every tab
Every tab now has one header (owner 2026-11-25, Workout turns 22a and 23a): the top row kept for buttons, the 28px title on its own row under it, scrolling up into a small centred title; the subheader does not come back. The Period label row (dates between the arrows top right, after turns 15 and 16) no longer fits beside the title.

| Id | Option | Stamp |
|---|---|---|
| 24a | Arrows and dates under the title, where the other tabs' subheader sits | Unreviewed |
| 24b | Arrows and dates centred under the period chips | Unreviewed |

Full screens on the page (`shots/progress-24a.png`, `24b`: the Workout tab as built, then Progress at rest and scrolled 200px; drawn over the Progress Demo). Claude's suggestion: 24b.
Owner (2026-11-25) on turn 24: "I don't like any of these. We need to redesign this. ... I don't like when it's in the middle, stuck in the middle there. It looks terrible. And for A, if it were to actually work, probably would need to be on the right side as well, not on the left side. ... I don't like this. This date arrow selector." 24a and 24b rejected.

### Turn 25 · 2026-11-25 · Progress tab: the period control, redesigned
All on the right of the title's own row (scrolls away with it), header as every tab, chips unchanged.

| Id | Option | Stamp |
|---|---|---|
| 25a | Arrows and dates at the right of the title row (today's control, one row lower) | Unreviewed |
| 25b | 36pt tonal capsule with the dates and a chevron, opening the pick-one system menu of periods (as Rep records) | Unreviewed |
| 25c | Glass calendar button in the top row opening the same menu; dates as plain grey text at the right of the title row | Unreviewed |

Full screens on the page (`shots/progress-25a…c.png`: at rest, menu open, scrolled 200px; drawn over the Progress Demo). Claude's suggestion: 25b. Picking from a menu would use the chips' motion, not the arrows' slide (Period-change motion row).
Owner (2026-11-25) on turn 25: "I'm going between A and B right now. For A, I think you can just tweak this a little bit, like maybe make sure that text is on the right side, but also at the bottom vertically. ... It's a little bit weird also to have it in that same row as the header. Can you also do an option where it sits below the header and maybe even partially ... a partial row maybe. And then for B, this is not bad, but I don't like the chevron first of all and I don't like that this pops opened a drop down menu. I think we would need some sort of custom animation there instead to then flip through the months or the different periods. But yeah, I think we can roll that C." 25a and 25b reworked in turn 26; 25c read as ruled out (stamped with his words).

### Turn 26 · 2026-11-25 · Progress tab: 25a and 25b, reworked
| Id | Option | Stamp |
|---|---|---|
| 26a | Arrows and dates on the title row, on the title's baseline, right-aligned | Unreviewed |
| 26b | Arrows and dates under the title on the right, overlapping the title's row by 10px (part of a row) | Unreviewed |
| 26c | Capsule with the dates, no chevron; tap opens a small wheel of periods (newest at the bottom) | Unreviewed |
| 26d | Capsule with the dates, no chevron; tap unrolls the periods sideways into a row under the title (newest on the right) | Unreviewed |

Full screens on the page (`shots/progress-26a…d.png`: 26a and 26b on 6M and Program; 26c and 26d at rest and open). Motion for 26c and 26d described only; a Motion Explorations tile once one is picked. Claude's suggestion: 26b (the owner found the title row a little weird for it); 26d if the arrows go.
Owner (2026-11-25) on turn 26: "Yeah, yeah, it's too B." **Locked:** 26b, the arrows and dates (the program's name on Program) under the title on the right, on part of a row (overlapping the title's row by 10px), scrolling away with the title. 26a, 26c, 26d rejected. The arrows keep their slide. Built into the Progress Demo (`gen_progress_header.py`, the tab header as every tab: 28px title at the Workout title's height, 17px small title on scroll over the soft edge) and the whole-app demo. Locked table and README (both copies) updated.

### Turn 27 · 2026-11-25 · Recent PRs: the header, clean
Owner (2026-11-25), noticing turn 17 again: "I think a mistake was made on that one. I think we should just have it in the below the PRs and then the header. I see any other options you had was like, oh, 21 in six months. I think you just ... get rid of anything there and just keep the header clean. Just have recent PRs and get rid of the show wall and don't have anything else. So I want you to just make a new round ... 27 for the Progress Explorations and lock that in, please."

| Id | Option | Stamp |
|---|---|---|
| 27a | Header "Recent PRs" only; Show all N opens the rest in place from the foot of the card, which then reads Show fewer | **Locked** (owner's call) |

Replaces 17c; turn 17 left as it was. Built into the Progress Demo (`gen_progress_header.py`) and the whole-app demo; `shots/progress-27a.png` on the page. Matches the README rule (a card's Show all is a centred row at its foot; no link in the section header). Not touched: Training's header still shows its week count at the right ("27 weeks"), and Main lifts shows the program's dates on Program (16a); the owner's words were about Recent PRs.

### Turn 28 · 2026-11-25 · Recent PRs: Show fewer at the top, only while open
Owner (2026-11-25), right after 27a: "Ohhhhhh I remember why we had it in the header lol. It was because on a long list you might not want to scroll all the way down…that may or may not be good. What are your thoughts?" Claude: at rest the header button only repeats the foot; open, a 29-row list is about three screens, and closing it from the top helps; suggested the header stays clean at rest and shows Show fewer only while open. Owner: "Sounds good let's lock that in."

| Id | Option | Stamp |
|---|---|---|
| 28a | Header label only at rest; while open, Show fewer at the right of the header as well as at the foot | **Locked** |

Built into the Progress Demo (`gen_progress_header.py`) and the whole-app demo; checked that the header's Show fewer closes the list. `shots/progress-28a.png` on the page. Turn 27 left as it was.

### Turn 29 · 2026-11-25 · Rules check (c06): seven questions as mocks
Owner: "Yeah, let's do the rules check. I think it'll be good to kind of get that done because that will effectively complete our consistency pass once we align on all those."
Passing: tab layout (top row kept, 28/800 title); section labels 8pt above their cards; 11px minimum (graph labels allowed); colours (moss gains, no red); copy; Recent PRs expanding in place, Show fewer at the top while open (28a).
Fixed, following locked rules (gen_prog29.py, in place): numerals tabular across the page (6M, 1Y, the PR lines and Show all 29 weren't); 12px text 12/500 (tile names and gains, the PR lines, All exercises' line; Program summary 11 r7b); TRAINING's note reads 27 WEEKS, uppercase like the label (Program summary 11 r2b).
Each mock outlines the fields in question in blue (Q1 marks the gaps with blue bands).

| Id | Option | Stamp |
|---|---|---|
| r1a | Tiles 10pt apart both ways, All exercises 10pt under them, as today | Rejected · r1b locked |
| r1b | 12pt both ways and under the tiles (Claude's pick) | **Locked** |
| r1c | 12pt between rows and under the tiles; 10pt between columns | Rejected · r1b locked |
| r2a | Training averages (67, 4.8, 7.7, 5 h 00) 20/800, as today, added to the scale | Rejected · r2c locked |
| r2b | 24/800, like the Main lifts tiles (Claude's pick) | Rejected · r2c locked · owner: "a bit big" |
| r2c | 18/700, Tile day, the next size down (Claude's pick after the owner's question) | **Locked** |
| r2d | 17/700, Screen title | Rejected · r2c locked |
| r3a | Recent PRs names 14/600 and values 14/700, as today | Rejected · r3c locked |
| r3b | Names 14/700 (Card name), values 15/700 (Record value) (Claude's pick) | Rejected · r3c locked |
| r3c | The owner's call: names 14/700, values stay 14/700 | **Locked** |
| r4a | All exercises title 15/600, as today | Rejected · r4b locked |
| r4b | 14/700, Card name (Claude's pick) | **Locked** |
| r5a | Strength, Consistency, Protocols sentence case 11/600, as today | **Locked** |
| r5b | Uppercase 11/700 +0.6, like Program summary and Session detail (Claude's pick) | Rejected · r5a locked |
| r6a | Units (lb, avg, avg of 5) 11/600, as today | Rejected · r6b locked |
| r6b | 12/500, like Exercise detail's lb (Claude's pick) | **Locked** |
| r7a | Top numbers (+10%, 95%, 88%) 17/700, as today | Rejected · r7b locked |
| r7b | 15/700, like Program summary's top card (Claude's pick) | **Locked** |

Owner (2026-11-25): "Q1: B / Q2: These feel a bit big at 24. What is the size below it in the system? / Q3: B Sounds good but i think the green values should be 14/700 as well / Q4: B Sounds good / Q5: I dont think these should be uppercase tbh / Q6: B sounds good / Q7: B sounds good."
Built (gen_rules29.py, in place) in the Progress Demo and the whole-app demo: r1b tiles 12pt apart both ways and 12pt above All exercises (Main lifts and Training); r3c names 14/700, values unchanged at 14/700; r4b All exercises 14/700; r5a no change; r6b lb, avg, avg of 5 at 12/500; r7b +10%, 95%, 88% at 15/700.
Q2 open: below the Readout (24/800) the scale has Tile day 18/700, Screen title 17/700, Record value 15/700. r2c and r2d mock the first two.
Owner (2026-11-25), on Q2: "yeah 18/700 looks good." r2c locked and built: Training averages 18/700. Turn 29 settled.
