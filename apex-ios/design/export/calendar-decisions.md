# Calendar — decisions log

Same rules as `home-decisions.md`: every option in `Calendar Explorations.dc.html` carries a stamp, shown as a tag beside its name on the page. **Locked** = stands · **Rejected** = turned down, reason recorded · **Superseded** = replaced by a later turn · **Fallback** = drop-back if the winner fails. **Highest turn number wins.**

## Inherited from Home (locked)

| Area | Decision |
|---|---|
| Entry | Tapping the This week card on Home (anywhere but a day) opens Calendar (8b) |
| Home stays now | Home never moves between days. Past days live on Calendar |
| Day states | Moss done · blue ring today · ring scheduled · dashed missed · bare rest (7a/8b) |
| Actions | Turn 20 hierarchy: Blue now · Moss earned · Tonal lesser alone · secondary text only under a primary · whole-card tap = no button · no chevrons |
| Glow | Static glow only on earned cards; one-shot pulse for newly due |
| Header | Large-title pattern, glass bar buttons |
| Units (app-wide) | Set in Settings, uniform across the app, can change. Home check-in's "5.4 km" follows the setting too |

## Locked

| Area | Decision |
|---|---|
| Day placement | Card(s) under the month, same screen (8b as built). No sheet, no pushed Day screen (scoping, turn 0) |
| Month navigation | Swipe + arrows (scoping) |
| Month summary | None (scoping) |
| Rest days | Show nothing beyond what was logged (a run, if any). No recovery on rest days (scoping) |
| Past day content | Session name, time, sets · PRs · exercise list with top sets · Whoop recovery/sleep/strain · runs. Not pain rating, not program position as content (scoping) |
| Single day | 1a glance card (turn 1): eyebrow date · week · block, session name, time · sets · PRs, run line, recovery footer, Tonal View session (done) / Preview session (today, scheduled). The full log, including each lift's top set, sits behind View session. **Amended 12b (owner 2026-11-24):** no button on any day card; tapping the card opens it (a done session opens Session detail; an upcoming one opens its preview, where is turn 8) |
| Past depth | Glance on Calendar, full log one tap away (1a) |
| Future preview | Name · exercise count · about N min (1a). No button since 12b: tapping the card of today or an upcoming day pushes its own preview page (back, the date as title, the day's card, warm-up, exercises, post-workout), read-only (8a, owner 2026-11-24) |
| Open state | Today selected (1a) |
| Grid cells | Ring states + one **cardio dot** (amended turn 1). Grey dot = cardio logged that day. No planned dot (dropped: too hard to tell from the logged one, and the planned session's name already says it, e.g. "Run + Hips"). The dot is a fact, not a forecast. One dot whatever the activity (run, ride, row, swim): no per-type colors or icons, the charter holds two hues. The activity type is named in the day card ("Run · 4.2 mi · 41 min", "Ride · …"), never in the grid |
| Missed day | Planned session name + "Not logged", no action. Logging a missed day later is a possible future feature, not designed now. Also when that session was done on another day: the planned day still reads as missed and never points to the day it was done (6a, owner 2026-11-24) |
| Moved sessions | A session done on a day other than its planned one: that day is ticked and shows it, with a grey "Moved" tag beside the name (the Swapped / Added tag). No word about which day it was planned for. Two sessions that trade days are both ticked, each showing what was done (9a, 10a, owner 2026-11-24) |
| Start on Calendar | No. Start stays on Home only; owner: "too weird" (1c not picked) |
| Range | Back to the first thing logged; no empty months before it. Forward to the end of the active program and no further (owner confirmed, turn 5) |
| History list | A History glass button, top right, opens a session list on its own page. Replaces the old history screen as the list view. Page not designed yet |
| View session | Opens the existing session detail page (app/session/[id]). No new page |
| No active program | Calendar works the same. With no plan there are no scheduled rings and no missed days, only logged days and cardio |
| Multiple sessions per day | Two cards, in the order done, the second headed "Same day"; each opened by tapping it; the day's recovery on both cards (13b). A moved session carries the Moved tag (12b, 13b, owner 2026-11-24; replaces "Deferred") |
| Previous-program days | Done days from an earlier program show as a moss ring, not a fill (turn 1, owner confirmed) |
| Header | Centered inline title between back and History (2a, turn 3) |
| Back to today | "Today" text button in the month row, left of the arrows, only when off the current month (2c, turn 3). Glass pill rejected: looked bad |
| Boundary placement | Label row above the whole week the program starts in; a mid-week start never splits a week (turn 3) |
| Label spacing | Even space above and below the label row so it sits in the grid, not jammed against the next week (turn 3) |
| Boundary labels | Programs + blocks (turn 3). Program rows are the main line: brighter text, bold, solid rule, program · block · start date, no "from" ("Pillars · Hypertrophy · Aug 3", turn 4). Block rows: dimmer, lighter weight, dotted rule ("Strength · Week 6") |
| Month flip motion | Slide by direction, 28px, 260ms, cubic-bezier(.2,.8,.2,1) (turn 3) |
| Day card motion | Fade in, 240ms, ease-out, when tapping a day (turn 4) |
| Title and month row | 2f (turn 5), title amended by the iOS 27 pass: Calendar title 17/700 centered (was 20/800 −0.3px, the design-system screen title (pushed screens use it in the bar, not the 17px collapsed size). Month name 17/700 under it. Arrows 24px, weekday letters 11px, day numbers 14px in 36px rings, 50px week rows. Today link 14/600, unchanged |
| Units | App-wide setting (Settings), uniform everywhere. Distance mi/km, load lb/kg follow it; designs must never hardcode a unit. Mocks use mi + lb as the sample setting |

## Open


- Cardio focus beyond running: the app treats running as a first-class goal today (Run tab, run_logs, pain check-in). If focus can switch (cycling, etc.), the Run tab and the run-pain check-in probably follow the user's chosen focus. Not a Calendar decision; parked for a Settings / goals session.
- Engineering: `run_logs` is run-only. A generic cardio record (type, duration, distance) is needed before the dot and day card can show other activities.

---

### Turn 0 · 2026-10-03 · scoping

Codebase connected (bgibso4/apex). A logged day has: `sessions` (name, week, block, started/completed → time), `set_logs` (actual weight × reps per set, status → sets done/total), `personal_records` (value + previous_value per session), `run_logs` (date, duration, distance in mi, may have no session), `daily_health` (recovery, sleep, strain per date). Future days come from the program definition (sets × reps, loads from 1RMs).

### Turn 1 · 2026-10-03 · the single day, six stances

Same month, same data. Interactive: tap any day, flip months, chips jump to day types.

| Id | Stance | Stamp |
|---|---|---|
| 1a | Glance card: facts + run + recovery footer, Tonal View/Preview session · rings only | **Locked** · owner: "definitely A" · amended with 1b/1c/1e's dot, redefined as cardio |
| 1b | Ledger card: every lift's top set, PRs moss, run + Whoop rows; future lists sets × reps · load; whole card taps · run dot | **Not picked** |
| 1c | Stack: separate session / run / recovery cards; today gets Start Workout · run dot | **Not picked** |
| 1d | Earned day: done day wears 13c earned card + PR lines; recovery one quiet card · session letters | **Not picked** |
| 1e | Timeline: opens on nothing; rows for recovery, session, runs, each a door · run dot | **Not picked** |
| 1f | Day page: no card, time as hero numeral, full log, Whoop numbers · PR dot | **Not picked** |

### Turn 2 · 2026-10-03 · header, back to today, boundaries, motion

All on the 1a card + cardio dot. Each phone is one combination; mix per axis. Motion is a shared switch above the phones.

| Id | Header · Today · Boundary | Stamp |
|---|---|---|
| 2a | Centered inline title · glass Today pill beside History · label row per program start | unreviewed |
| 2b | Large title collapses into the bar · floating Today above tab bar · labels for programs + blocks | unreviewed |
| 2c | Title beside back, left · Today text in the month row · fact line under the month | unreviewed |

Motion: None · Crossfade (160ms) · Slide by direction (day card 14px, month 28px, 260ms, cubic-bezier(.2,.8,.2,1)). Today only appears when you're off the current month.

### Turn 3 · 2026-11-06 · the mix

| Id | Choice | Stamp |
|---|---|---|
| 2a header | Centered inline title | **Locked** |
| 2a Today pill | Glass pill beside History | **Rejected** · "does not look good" |
| 2b header + floating Today | | **Not picked** |
| 2c Today | Text in the month row | **Locked** |
| 2c fact line | Boundary as a line under the month | **Not picked** |
| Motion · month | Slide by direction | **Locked** |
| Motion · day card | Slide | **Rejected** for the day card; testing instant / fade 160 / fade 240 |
| 2d | The mix: centered title, Today in the month row, label rows with even spacing, programs-only / programs + blocks toggle | unreviewed |

Programs-only vs programs + blocks: in July and August the two look almost the same. Programs only adds the start date ("Pillars · from Aug 3"); programs + blocks drops the date, names the block ("Pillars · Hypertrophy") and adds dimmer rows where blocks change ("Strength · Week 6" in September, "Peak · Week 10" in October).

### Turn 4 · 2026-11-06 · locks, bigger month row

| Id | Choice | Stamp |
|---|---|---|
| Day card fade 240ms | | **Locked** |
| Day card instant / fade 160 | | **Not picked** |
| 2d programs + blocks | Program row solid and bold with "Program · Block · date"; block rows dimmer and dotted | **Locked** (toggle removed) |
| Label spacing | Even above and below | **Locked** · owner: "does look better" |
| 2d month row | Current size: 15px month name, 12px days in 32px rings | unreviewed |
| 2e month row | 20px heavy month name, 24px arrows, 11px weekdays, 14px days in 36px rings, 50px rows; Today unchanged | unreviewed |

### Turn 5 · 2026-11-06 · title vs month

Owner worry: in 2e the month (20/800) is bigger than the screen title (17/700). Design system: screen title 20/800 −0.3px; bar title collapses to 17 inline.

| Id | Title · Month | Stamp |
|---|---|---|
| 2d | 17/700 · 15/700 | **Superseded** by 2f |
| 2e | 17/700 · 20/800 | **Rejected** · month outranks the title |
| 2f | 20/800 · 17/700, grid at 2e size | **Locked** · owner: "looks pretty solid" |

Stamps on the page (turn 5): 2a **Header locked** · 2b **Not picked** · 2c **Today locked** · 2d **Superseded** · 2e **Rejected** · 2f **Locked**. Range forward locked: end of the active program.

### App-wide · 2026-11-06 · Liquid Glass chrome

Tab bar and glass bar buttons restyled for iOS 27 on every Calendar phone. Details in `home-decisions.md` (App-wide · Liquid Glass chrome).

### Calendar complete · 2026-11-06 · reference build

`Calendar Demo.dc.html` rebuilt as the reference build: one phone carrying every lock (2f header and month row, Today in the month row, programs + blocks labels, cardio dots, 1a day card, slide for months, 240ms fade for days, range Jul 6 to the end of the active program, Liquid Glass tab bar and buttons). It replaces the 8b demo from the Home session. Static record: Calendar Explorations turns 1 to 5.

Next: History page (opened by the History button), then the Program summary screen.

iOS 27 pass (2026-11-07): title now 17/700 centered (was 20/800); the month row stays 17/700. Grey labels #7C7E86, 11px minimum. See home-decisions.md.

## To update (from the Workout flow round, 2026-11-21 and 22; see workout-decisions.md)

- A session done on a different day than planned: Calendar ticks the date it was actually done and shows that workout; how the planned day reads is to design.
- More than one session on a day is now supported (reverses "Multiple sessions per day: Deferred" above); the day card must list them.
- Preview session: the Workout tab shows the current week only, so Calendar needs its own read-only preview of an upcoming session (no Start). Changes "Future preview" above.
- Home's This week card must always match Calendar.

### Turns 6 to 8 · 2026-11-24 · the three follow-ups from the Workout round
Owner, on the follow-ups and the consistency pass: "lets finish those up then so that we can move on". Calendar first, since Home's This week card has to match it. Static fragments (one week of the grid and the day card), newest turn on top of the page.

Turn 6 · a session done on a different day than planned. Sample: Monday's Lower Strength · Squat done on Wednesday, a rest day in the plan. Wednesday is ticked and shows the session in all three (locked); only Monday differs.

| Id | Option | Stamp |
|---|---|---|
| 6a | Monday reads as missed, as today: dashed ring, "Not logged", no link to Wednesday | Unreviewed |
| 6b | Dashed ring kept; the card says "Done Wed, Aug 19" with View session | Unreviewed |
| 6c | Monday loses its ring; the card says "Done Wed, Aug 19" with View session. A dashed ring then always means a real miss | Unreviewed |

Turn 7 · a day with two sessions. Sample: Tuesday, Monday's missed session in the morning and Tuesday's own in the evening. Same in all: one tick in the grid however many sessions; each session states its time of day.

| Id | Option | Stamp |
|---|---|---|
| 7a | A glance card for each session, each with View session | Unreviewed |
| 7b | One card for the day, a row for each session (tap a row to open it, no button), recovery once | Unreviewed |
| 7c | As on the Workout tab: the day's own session keeps the card; the other is a row in "Also logged that day" | Unreviewed |

Turn 8 · where Calendar's own read-only preview of an upcoming session appears. Sample: Friday's Lower Strength · Hinge. Not offered: a sheet (owner dislikes a sheet on Calendar).

| Id | Option | Stamp |
|---|---|---|
| 8a | Preview session pushes its own page: back, the date as title, the day's card, then warm-up, exercises, post-workout | Unreviewed |
| 8b | Preview session opens the lists in place under the day's card; the button becomes Hide preview | Unreviewed |
| 8c | No button: an upcoming day always shows the lists under its card | Unreviewed |

Claude's suggestions: 6c, 7b, 8a. Assumed in turn 8 and said on the page, for him to confirm: every upcoming day uses Calendar's own preview, this week's included.
Order proposed for the rest: Calendar (these three, then the demo and its rules check) · Home (This week card in the same cases, the header to Apple's standard, rules check) · History (two sessions a day, rules check) · Session detail (swipe-delete slide-out, rules check) · Exercise detail (increment field, main lift or accessory, the 30-session cut-off, rules check) · Program summary and Progress (rules check) · whole-app demo links and the stale README copies.

Owner (2026-11-24), on the first drawing: "im really struggling to see the difference on these 3". Taken to be turn 6. Cause: Monday was drawn selected, and the white selection ring covered the dashed ring, the only thing that differs in the grid between 6b and 6c; Wednesday's identical card was also repeated in all three. Turn 6 redrawn in place (nothing was reviewed or stamped): Wednesday's card shown once as "the same in all three"; in each option nothing is selected, the other days are dimmed, Monday's cell is repeated large with a label, the card stands on its own, and a three-line box states what differs (Monday's ring · what its card says · the button). The options themselves are unchanged.

Owner (2026-11-24) on turn 6, after confirming the example (Monday not trained, Monday's session done on Wednesday): "We want the dashed ring, which was a missed day. We didn't work out that day. And I don't want to show Wednesday's workout on Monday." **Locked:** 6a. The planned day reads as missed (dashed ring, the session's name, "Not logged") and its card does not point to the day the session was done. 6b and 6c rejected. README (both copies) updated. Home's This week card follows, since it must match Calendar.
He then asked: "what if you did Wednesday's workout on Monday and Monday's work on Wednesday? So, what would that day look like".

### Turn 9 · 2026-11-24 · two sessions that traded days
Wednesday is a rest day in the sample week, so the trade is drawn between Monday (Lower Strength · Squat) and Tuesday (Run + Hips). Follows from the locked rules, and the same in both options: both days are ticked, each showing the workout done on it; neither is dashed, since a dashed ring needs a past day with a plan and nothing logged on it. The Workout tab's strip shows the same two ticks.

| Id | Option | Stamp |
|---|---|---|
| 9a | Each day's card shows only what was done on it; nothing about the plan | Unreviewed |
| 9b | The card adds one quiet line, "Planned for Tue, Aug 18" | Unreviewed |

Claude's suggestion: 9a (6a carried through: a day never refers to another day). Noted on the page: under 9b the caught-up Wednesday of turn 6 would carry the line too.

Owner (2026-11-24) on turn 9: "Yeah, I think A as well. It definitely gets a little weird not being able to tell what day it was planned. And I don't think we need to be specific on that, but I wonder if there's a little indicator that shows on the card or on something that it wasn't your original planned workout... just a note, just a little indicator." **Locked:** 9a, each day shows the workout done on it and never which day it was planned for. 9b rejected. His indicator idea drawn as turn 10.

### Turn 10 · 2026-11-24 · a small sign that a day's session wasn't the one planned
Same trade as turn 9. The word is "Moved" in all three (other words offered on the page: Rescheduled, Caught up, Off plan). Shows on any session done on a day other than its own (turn 6's caught-up Wednesday too); nothing on a session done on its own day. Not offered: a mark in the month grid (the space under a day is the cardio dot's).

| Id | Option | Stamp |
|---|---|---|
| 10a | The app's grey tag (as Swapped and Added) beside the session name | Unreviewed |
| 10b | "Moved" leading the facts line, plain grey text | Unreviewed |
| 10c | "Moved" at the end of the date line (eyebrow) | Unreviewed |

Claude's suggestion: 10a (seen first; joins the existing tag family PR, Swapped, Added).

Owner (2026-11-24) on turn 10: "Yep, I agree. A as well." **Locked:** 10a, a grey "Moved" tag beside the session's name (the tag Swapped and Added use), on any session done on a day other than its own. 10b, 10c rejected. README (both copies) and the Locked table updated.

Turn 7 redrawn before review, the way turn 6 was: the grid once with nothing selected and Tuesday picked out, a box in each option saying what differs (cards · order · recovery · how to open one), and the locks since applied: Monday dashed (6a), the caught-up morning session tagged Moved (10a), nothing naming the day it came from (9a; 7c's row no longer says "Mon's session"). The three options are unchanged. Claude's suggestion still 7b.

Owner (2026-11-24) on turn 7: "Can I please see full screen here? It's really hard to understand what it looks like without the full screen." Done as an image (not added to the page): each option placed into the Calendar Demo's real screen (header, August grid, tab bar), Tuesday the 18th selected, Monday the 17th set to missed, shown at rest and scrolled to the end. At rest, only 7b's whole day fits above the tab bar; 7a's second card and 7c's Also logged row start under it. Nothing decided.

Owner (2026-11-24) on turn 7, after the full screens: "Honestly, I'm going between A and B." 7b is hard to tap a single session in, has no View session while a one-session day has one ("we should be consistent. If we are going to display a button on the other time when there's only one workout, then we should do it like A"), and "doesn't really look like two distinct workouts... But it does look like a unified day, which is very nice." Floated: maybe the screen doesn't need View session and you tap the card. Stamped: 7a, 7b In the running; 7c Not picked.

### Turn 11 · 2026-11-24 · two sessions in a day: distinct, easy to tap, consistent
Same Tuesday as turn 7. Each option also shows a one-session day beside it. Full-screen versions (in the Calendar Demo's screen, at rest and scrolled) sent as an image.

| Id | Option | Stamp |
|---|---|---|
| 11a | One day card; each session in its own inset panel (as superset members in their frame) with its own View session; recovery once. One-session day unchanged | Unreviewed |
| 11b | One day card; rows, each with a small "View" pill at the end; recovery once. One-session day unchanged | Unreviewed |
| 11c | No View session anywhere: two cards as 7a, each card tapped to open; the one-session day loses its button too (changes the locked 1a card) | Unreviewed |

Claude's suggestion: 11a (two distinct workouts, one day, the same View session as every other day, big targets). Its cost, seen in the full screen: tallest; at rest the second session's button sits under the tab bar. 11b is the only one whose whole day fits at rest.

Owner (2026-11-24) on turn 11: "A actually looks terrible. It's terrible. I'm actually leaning towards C now... get rid of your current 11A and you can drop 11B. And let's compare 11C versus what I believe was 7A." Stamped: 11a Rejected ("looks terrible"), 11b Rejected (dropped), 11c Leaning (owner), 7a In the running, 7b Set aside.

### Turn 12 · 2026-11-24 · two sessions in a day: 7a against 11c
Both draw two sessions as two cards; the difference is the button, and it reaches every day. Each shown with Tuesday's two sessions and a one-session day (Thu, Aug 13). Full screens (at rest, scrolled, one-session day) sent as an image.

| Id | Option | Stamp |
|---|---|---|
| 12a | 7a as drawn: two cards, View session on each; one-session days unchanged | Unreviewed |
| 12b | 11c: two cards, no buttons, tap the card; one-session days lose View session too (changes 1a) | Unreviewed |

Claude's suggestion: 12b. The app already opens rows and cards by tapping them with no button or chevron (History rows, Exercise detail's sessions, Logged today rows; the inherited rule "whole-card tap = no button"), so the day card would join them. Raised, not decided: under 12b, an upcoming day's Preview session would become a card tap too, which ties into turn 8.

Owner (2026-11-24) on turn 12: "Yeah, yeah, I feel like B as well. I think as long as we make this card tap, I think it will look great. I think it's pretty natural to want to click that anyway... Getting rid of that button cleans up a lot nice. So yeah, let's lock it in. 12B." **Locked:** 12b. No View session (or Preview session) button on any Calendar day card; tapping the card opens it. Two sessions on a day are two cards, the second headed "Same day", recovery on the first. Amends 1a. 12a, 7a, 7b, 7c rejected; 11c stamped Locked as 12b. Locked table and README (both copies) updated. Home's This week card is a snapshot that opens Calendar, so it is unaffected.

Turn 8 redrawn before review for 12b: the preview now opens by tapping an upcoming day's card. 8a, tap pushes its own page (as a done card opens Session detail) · 8b, tap opens the lists in place under the card, tap again closes · 8c, the lists always show under an upcoming day's card, which itself does nothing. Full screens sent as an image. Claude's suggestion: 8a (every card tap then does one thing, open a page; 8b would make the same tap do two different things). Assumed, for him to confirm: today's card and every upcoming day, this week's included, use Calendar's own preview.

Owner (2026-11-24) on turn 8: "Yes A as well". **Locked:** 8a. Tapping an upcoming day's card pushes its preview as its own page. 8b, 8c rejected. Locked table and README (both copies) updated. Still unconfirmed (his "Yes" may have meant it): today's card and this week's days use the same preview rather than the Workout tab; built that way in the demo.

### Calendar follow-ups built · 2026-11-24
Calendar Demo now carries 6a, 10a, 12b and 8a (`gen_calendar_demo2.py`, patched from the pre-change copy). Sample: Mon Aug 17 missed (dashed, "Not logged"); its Lower Strength · Squat done Tue Aug 18 at 6:10 AM, tagged Moved, before Tuesday's own Heavy Push at 6:40 PM under "Same day"; recovery on the first card. No day card has a button; a session card opens its session (a note in the standalone demo, Session detail in the whole-app demo); today's and upcoming cards push the preview page, whose back returns to Calendar. Jump chips: Two sessions, Missed, Upcoming added. Whole-app demo regenerated and checked: Home › Calendar › tap Tue 18's second card › Session detail.
Demo limits: Session detail is its one fixed sample whichever session is tapped; the preview page has no motion beyond the push; the warm-up and post-workout lists are the sample program's, the same every day.
Next on Calendar: the check against the rules added since it was built (c02).

Owner (2026-11-24), after the build:
- Asked whether there is a new preview page, "essentially just the same as the workout tab, except it's a preview kind of thing". Answer: yes, 8a; the Workout tab's day card and lists, read-only, no Start.
- "the preview should also look the same... We shouldn't show in some and not in others." **Confirmed:** today's card opens the same preview page as an upcoming day, never the Workout tab (built that way).
- RPE on Run + Hips: asked to make sure it is aligned. Answer: one rule for both screens, a row shows the RPE cap only where the program sets one (Workout turn 9b); the sample sets none on Run + Hips. Found while checking: the Calendar Demo and the Workout tab demo use different sample weeks (Calendar's Friday is Run + Hips with Farmer Carry 75 lb; the Workout tab's Friday is Lower Strength · Hinge). Added to the consistency pass.
- On the two-session day: "we have the [recovery] information on the first card but not on the second card. I think it should be on both, probably... the chance that you'll ever see that is very rare, and then it just looks a little more complete when it's on both, probably, although it is gonna be the same number, so it's a little bit up in the air." Not decided; drawn as turn 13.

### Turn 13 · 2026-11-24 · a two-session day: where the recovery goes
| Id | Option | Stamp |
|---|---|---|
| 13a | On the first card only (as locked in 12b and built) | Unreviewed |
| 13b | On both cards, the same numbers twice | Unreviewed |
| 13c | Once, in a small card of its own under both session cards | Unreviewed |

Full screens (the Calendar Demo's Tuesday, at rest and scrolled) sent as an image. Claude's suggestion: 13b (every done card is the same card; the repeat only shows on a rare day).

Owner (2026-11-24) on turn 13: "Yeah, yeah, it's dope. Very, very rarely you'll see it anyway, and I think it looks better." **Locked:** 13b, the day's recovery on both cards of a two-session day. 13a, 13c rejected. Built into the Calendar Demo; README (both copies) and Locked table updated.

### Calendar checked against the rules added since it was built · 2026-11-24
Checked the Calendar Demo against every app-wide rule added after 2026-11-06. Passing: pushed-screen header (inline 17/700 title, glass back and History); no chevrons; no em dashes; 11px floor and the iOS 27 greys (the 10px tab bar labels are the tab bar's, the same in every demo); missed sessions in neutral text; week circles by purpose; units; no menus, sheets, deletes or toasts in the design (the demo's notes stand in for screens it can't open).
One change, applied because it follows a locked rule: now that day cards are tapped (12b), they shrink to 98% while pressed and spring back, as Home's cards do (locked moment, Motion Explorations turn 1). Only a card that opens something does it; a missed or rest day's card does not.
Carried to the consistency pass, not a Calendar design question: the Calendar Demo's sample week differs from the Workout tab demo's.
Calendar is done for this round. Next: Home (its This week card in the same cases, the header to Apple's standard large title, then its rules check).
