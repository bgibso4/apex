# Workout flow: decisions

Record for `Workout Explorations.dc.html`. Stamps: **Locked** = the owner's decision · **Rejected** · **Superseded** · Unreviewed = not yet looked at. Nothing is locked unless the owner said so.

## Starting point

A revision, not a new design. July's first-round screens are in the design system under `screens/2026-07-22-workout-*-r1.html` (select, warm-up, logging, sheets, complete). No decision log was found for that round, so they are a starting point, not locks. They predate Liquid Glass, the action rules, the PR rule, post-workout protocols, and the Home, Session detail and Exercise detail designs.

Owner (2026-11-21), on seeing the July screens again: they "look terrible"; glad this is being redone. So July's look is not something to preserve; only its ideas are on the table.

Agreed order (owner, 2026-11-21): the Workout tab at rest (select) → warm-up → logging → sheets → post-workout protocols → complete → motion. One screen per turn.

Open questions carried in from the review:
- What the Workout tab is for now that Home has Start Workout, Preview session and the week card (turn 1).
- Rest day, no program, and a session in progress on this tab.
- Rest timer (absent from July's screens).
- The PR moment while logging.
- How logging's set rows relate to Session detail's edit rows.
- Leaving and resuming a session.
- Where post-workout protocols sit relative to Finish.
- How much Complete shows versus handing off to Session detail.

## Turns

### Turn 1 · 2026-11-21 · the Workout tab at rest on a workout day
Static mocks; same day as the Home Demo. Not covered: rest day, no program, session in progress, row detail.

| Option | What | Status |
|---|---|---|
| 1a | Today's session laid out: Home's today card with Start, then warm-up, exercises with targets, after. Home's Preview session opens this tab. Change session behind ••• | Unreviewed |
| 1b | The week (July's idea restyled): this week's sessions, done ticked, today open with Start and Preview session | Unreviewed |
| 1c | Home's week strip on top to move between days, then the picked day laid out as 1a; Start only on today | Unreviewed |

After turn 1 (owner): asked what other ways exist to preview a workout, change it, and see weekly progress. Answer from the logs: Preview session (Home today card, Home week card, Calendar) is locked to open the Workout tab's day view (home-decisions 4c); changing the workout is not designed anywhere in the redesign (today's app has a Change Workout sheet on this tab); weekly progress is on Home's This week card, Calendar, Home's program card and Progress (Consistency).
Owner: you should 100% be able to move between workout days here; it should not be the main path. Jobs: (1) do the regular workout (main path); (2) view other workouts in the program and potentially pick one that is not scheduled for today; (3) do a completely random workout, mainly for when not in a program: low priority, can be skipped for now.
None of 1a / 1b / 1c was picked or rejected.

### Turn 2 · 2026-11-21 · moving between days on the Workout tab
All live; the session is laid out as in 1a. Today: Start Workout. Another scheduled day: tonal "Do this today"; a done day: tonal "View session" (both placeholders, not reviewed).

| Option | What | Status |
|---|---|---|
| 2a | Home's week strip on top; tap a day to show it; a small bar marks the day shown | Unreviewed |
| 2b | Opens on today; the day line on the card is a pull-down menu of the week's sessions (rows carry a second line) | Unreviewed |
| 2c | Opens on today; a glass button top right opens a short sheet of the week's sessions | Unreviewed |

Open: what happens to the schedule when a session is done on a different day; moving beyond this week (other weeks, other blocks); job 3 (a workout outside the program, #71).

After turn 2 (owner): definitely between A and C. Try the week strip in a different spot, though after the card it would split the workout preview ("that's the dilemma"). Visually the strip is the nicest, "maybe because I don't like the sheet for the calendar". Both good options; wants variations of each. 2b not picked. Placeholders (Do this today, View session) and the open items not commented on.

### Turn 3 · 2026-11-21 · variations on the strip and on the button
All live.

| Option | What | Status |
|---|---|---|
| 3a | Strip under the today card (splits the card from its session) | Unreviewed |
| 3b | Strip at the foot of the screen under a This week header | Unreviewed |
| 3c | Strip inside the today card, as its top, above a hairline | Unreviewed |
| 3d | 2c's glass button, dropping the pull-down menu of sessions instead of a sheet | Unreviewed |
| 3e | 2c's glass button, dropping a small glass panel that holds the week strip | Unreviewed |

After turn 3 (owner): much better; leaning C or E. Would struggle to see E actually implemented, so C is the better route. It's not out of the question to want to see what the other workouts look like, so having the week strip is nice. "I think I'm gonna go with 3C": reuse the week strip, combined into the card (noted as a slightly different construct). Asked: should rest days be tappable too?
Locked: 3c. The Workout tab opens on today's session; the week strip sits across the top of the day card above a hairline; tap a day to show that day's session below (card, then warm-up, exercises, after). 3a, 3b, 3d rejected by the lock; 3e rejected (liked, doubts about building it); 2a superseded by 3c; 2b, 2c rejected.
Still not reviewed: the buttons on other days (Do this today, View session), the session layout rows, rest days on the strip, other weeks, the schedule effect of doing a session on another day.

Owner (2026-11-21): agreed, rest days on the strip are tappable and show a quiet card, no button, no session list. **Locked.**

### Turn 4 · 2026-11-21 · rest days in 3c
Today is a rest day (Wed, Aug 19), so this is also what the tab opens on. Live; every day tappable. Wording from Home's rest card (13b). A rest day with a logged run is not drawn.

| Option | What | Status |
|---|---|---|
| 4a | Rest day · Nothing planned, tomorrow's session as a footnote in the card (today only); nothing under it | Unreviewed |
| 4b | The same card without the footnote; tomorrow's session as its own tappable card under Up next | Unreviewed |

After turn 4 (owner): "I think A. I don't think we need to have tomorrow. We can maybe eventually figure out something to put there, but I don't think we need anything for today." Asked to see a rest day with a run logged.
Locked: 4a (rest-day card, nothing under it). 4b rejected (no card for tomorrow). To confirm: whether "don't need tomorrow" also removes 4a's tomorrow footnote; it is still drawn.

### Turn 5 · 2026-11-21 · a rest day with a run logged
Live. Units follow the app setting.

| Option | What | Status |
|---|---|---|
| 5a | 4a's card; "Nothing planned" becomes Calendar's run line (Run · 5.4 km · 32 min) | Unreviewed |
| 5b | 4a's card unchanged; a Logged today card under it with the run as a row | Unreviewed |

After turn 5 (owner): B, because it is more adaptable: several things in a day, or something unplanned, can extend it later. "Much better." Don't complicate it now; keep it simple as drawn in B.
Locked: 5b. A rest day keeps its card (Rest day · Nothing planned); anything logged that day appears under it in a Logged today card, one row per thing (name, time of day and duration, distance). 5a rejected. The tomorrow footnote stays as drawn in 5b ("keep it simple like you have it in B"). Not designed: what a logged row opens; rows for things other than a run.

Owner (2026-11-21), on the placeholders and 5b:
- **Locked: the day card's button by state.** Today: Start Workout. Another scheduled day: "Do this today". A done day: "View session".
- **Locked: the session preview under the card.** Three groups: the warm-up protocols, the exercises, and the post-workout protocols ("After"). A row is a name with its amount on the right. A protocol with nothing to show on the right simply has nothing there.
- **Vision for Logged today (5b), to be kept by the build:** the row is a generic logged activity, not a run. The app can only log runs today; this screen must not care about that limit. Later it should take a bike ride or any other cardio without redesign. The fields are generic to cardio: name, start time, duration, distance.
- Asked: why some exercises show a weight and some don't. Answer given: the mock follows Session detail's three kinds of exercise: weight and reps (4 × 5 · 45 lb), reps only for bodyweight (3 × 8), and time (3 × 30 sec). The distance rows (3 × 40 m) and the choice of which weight to show (the load the app would prefill) are Claude's mock data, not reviewed.

Still open on this tab: what happens to today's session and the schedule after "Do this today"; a session in progress; no program; other weeks.

## Notes for the build (things the mocks can't show)

- Logged today is activity-agnostic: name, start time, duration, distance. Do not tie the row to `run_logs`; a generic cardio record is already listed as needed in inventory.md.
- Rest days on the strip are tappable. The tab opens on today even when today is a rest day.
- Preview session (Home, Home's week card, Calendar) opens this tab on that day (home-decisions 4c).

### Discussion · 2026-11-21 · what "Do this today" does to the schedule (open, nothing decided)
Owner: swapping is an option but limiting. Floated: workouts in the program not assigned to a day, pick any for today; hesitant because programs are built around days. Wants to think it through.
Claude laid out three models: (1) fixed days with a swap; (2) no days, the week is just a list; (3) days are the plan but not a lock: any unfinished session of the week can be done today, it is logged on the day it was done, the displaced session takes the freed day by default and stays movable, and a session is missed only if the week ends without it. Claude's suggestion: (3). Not verified: how the current data model ties sessions to days.

Owner (2026-11-21), continuing the schedule discussion: doesn't see much difference between swap and model 3 if limited to a week. Not a free-for-all: you're supposed to adhere to a program. Keep it within the week (week and block as boundaries). Programs that are N days on, one off don't split evenly into weeks; not a fan personally (it changes the days he trains); not a factor now, think about later.
Owner's decision: sessions stay tied to a day. You can catch up: any session of this week that isn't done, missed or upcoming, can be done today (example: missed Monday, do Monday's on Tuesday; or miss Tuesday and Wednesday and do Tuesday's on Thursday). A session that is already done cannot be done again. Whether it is a good idea on a given day is left to the person's judgment.
**Locked:** "Do this today" is offered on every unfinished session of the current week, past or future; never on a done one; not across weeks.
To confirm (Claude's reading of the example, not stated): nothing is moved or swapped. Today's own session just stays on its day, unfinished, and can itself be caught up later in the week.
Open: how the strip and the day card show a session done on a different day than planned. Known limit: programs whose cycle isn't a week.

Owner (2026-11-21): confirmed, nothing moves or swaps. **Locked:** doing another day's session leaves today's own session on its day, unfinished, and still catchable within the week.

### Turn 6 · 2026-11-21 · a session done on a different day
Week: Monday's session missed and done on Tuesday; Tuesday's own session not done; today Thursday. Live. Cards identical in both: Monday reads "Done Tue, Aug 18" with View session; Tuesday keeps its own session with Do this today, and what was done that day sits under it in a Logged that day card (5b's pattern).

| Option | What | Status |
|---|---|---|
| 6a | A circle is that day's session: Monday ticked (its session is done), Tuesday dashed (its session isn't) | Unreviewed |
| 6b | A circle is the day: Monday dashed (nothing that day), Tuesday ticked (trained) | Unreviewed |

Whichever is picked would need to hold for Home's This week card and Calendar too (not yet raised with the owner as a decision).

After turn 6 (owner): A is the most intuitive and clearer, as long as the actual done date is shown. B is confusing: you tap a day that says done / View session but its circle is empty, and the green tick is the reverse. "Because we're tying it to a day, A makes more sense."
Locked: 6a. A circle on the strip is that day's session: ticked when that session is done, whatever day it was done on; dashed when it is past and not done. The day card always states the real date when it differs ("Done Tue, Aug 18"). What was actually done on a day appears under that day's card in Logged that day. 6b rejected.
Not yet decided: whether Home's This week card and Calendar follow the same meaning.

Notes for the build, added: a session has a planned day and, once logged, an actual date; they can differ within the week. "Done" is a property of the session, not of the day.

Owner (2026-11-21), on whether other screens follow 6a: no, Calendar is different. You can't start a workout from Calendar, so there is no need to bend the truth there: looking back at this week or any other, a day should show the workout done on that day, purely on that day. He accepts that the same week then looks different on the Workout tab (one day filled, one not). The use cases differ: Calendar = what did I do that day; Workout tab = I'm about to train, which workout should I do.
**Locked:** two meanings by purpose.
- Workout tab strip (choosing what to do): a circle is that day's planned session; ticked when that session is done, whenever it was done (6a).
- Calendar (the record): a day is ticked when a workout was done on that date, and shows that workout.
Not decided: Home's This week card (owner grouped Home and Calendar as having "different actions" but ruled only on Calendar). On Calendar, how a planned day whose session was done on another date reads (dashed "Not logged", or a pointer to the real date) is for the Calendar update.
To do later: Calendar Demo needs the caught-up case.

Owner (2026-11-21): Home's This week card should look like Calendar, exactly the same: it is a snapshot of the Calendar page and takes you there, so the two must not differ.
**Locked:** Home's This week card follows Calendar's meaning (a day is ticked when a workout was done on that date). Only the Workout tab's strip uses the session meaning (6a).
To do later: Home Demo and Calendar Demo need the caught-up case.

Owner (2026-11-21): a live workout lives inside the Workout tab: "if you're in a session, it's just the workout tab." **Locked.** The tab bar stays; while a session is running the Workout tab is the session (warm-up, logging, after), and the day view with the strip returns when it ends. Home shows its Resume card (already locked). So "session in progress" is not a separate state of the day view.
Confirmed scope: every page of the flow gets designed (warm-up, logging, sheets, post-workout protocols, complete, then motion).

### Turn 7 · 2026-11-21 · warm-up: its own step, or the top of the session
Both live. Protocol row from Session detail's edit mode (name, 28pt circle in a 44pt target) plus a detail line and steps that open in place. Timer, header and 7b's Finish Workout are placeholders.

| Option | What | Status |
|---|---|---|
| 7a | Warm-up as its own step: three protocols, then Continue to exercises (tonal until all ticked, then blue; tapping early skips; no separate Skip) | Unreviewed |
| 7b | One session screen in the preview's three groups: warm-up, exercises, after; nothing to continue or skip; post-workout protocols sit at the foot. Exercise rows are stand-ins | Unreviewed |

After turn 7 (owner): interesting; both have merit. How would B transition into the exercises? Wants the complete logging workflow in both streams, as demos; not the minute details, but designed nicely ("we'll align on some stuff later"). Expects the exercise in progress to look different from 7b's stand-in rows, given the time spent on it before.

### Turn 8 · 2026-11-21 · the whole session, both ways (working demos)
Same session and logging card in both; only the structure differs. Warm-up → exercises → after → finish.

| Option | What | Status |
|---|---|---|
| 8a | Steps: a three-part control at the top (Warm-up · Exercises · After); each step ends in one button that turns blue when the step is done | Unreviewed |
| 8b | One screen: ticking the last warm-up protocol folds the warm-up to one line and opens the first exercise; one exercise open at a time; After and Finish at the foot | Unreviewed |

First-pass placeholders, none reviewed: the logging card (sets prefilled from the plan; one tap on a set's circle logs it; the next set has a blue ring; tap the last logged set to undo; RPE pills after the last set; finishing closes the card and opens the next; PR tag on the set and on the closed card), the rest timer (a glass capsule above the tab bar, 1:30 after each set, Skip), elapsed time in the header, the finish card (Time · Sets · PRs, View session).
Not in the demos: changing weight or reps, Add set, Add exercise, notes, supersets, leaving or discarding a workout.

## Correction · 2026-11-21 · the logging round was missed

Owner, after turn 8: definitely leaning A (steps). But the logging in the demos looks different from the earlier session, the RPE selector especially; worried the earlier work is not being taken into account and that he can't see that exploration any more.
He is right. The logging screen was designed in depth in an earlier round (35 turns) that lives in a separate artifact, "App redesign round one" (https://claude.ai/artifact/5nd9MSmGizBJiEhzxAFj3s): Logging Row Explorations, Logging Assembly (everything locked through turn 35, wired together), Logging Interactive Demo, Workout Logging v2, Superset Demo, Timed Logging Demo, Add Exercise Demo, and `logging-decisions.md`. Claude only looked at the five July R1 screens in the design system and did not find this round until now.
Consequences:
- **Turn 8's logging card, RPE pills, rest capsule and finish card are void.** They were Claude's first pass and contradict locked decisions (effort is a slider with no default; rest is a bare countdown in the active card, top right; no Add set; set editing by wheel sheet; Detail · Swap · Note rail; skip asked at Finish; Finish arming; superset carousel; timed sets; swap and add-exercise sheets; and more).
- `logging-decisions.md` is copied into this project unchanged and is the source of truth for the logging screen. Its header rule ("Warm-up access: the back button, since warm-up is the previous step in the flow") already assumes warm-up is a step before logging.
- What this round still has to do for logging: bring that locked design into today's chrome (Liquid Glass tab bar, current action rules, contrast), and settle only what it left open.
- 8a vs 8b remains a question of structure only. Owner: "definitely leaning A". Not locked.

Owner (2026-11-21): wants to heavily rebuild the session on the earlier logging round. First, a quick review of the Workout landing page (the tab at rest) to make sure nothing was missed.

### Review · 2026-11-21 · the Workout tab at rest, checked against earlier work
Checked: logging-decisions.md, the July select screen, home-decisions.md, calendar-decisions.md, session-decisions.md. The earlier logging round did not design this page (it lists "Remaining five R1 screens" as to do), so nothing locked there was overridden.
Consistent with earlier locks: Preview opens this tab's day view (Home 4c); the session clock starts at Start Workout, before warm-up (logging 25d); dashed ring for a day not logged, blue ring today (Home legend); rest-day wording (Home 13b); program line as plain text; preview loads come from your own last session, no estimates (logging).
Gaps found, none decided:
1. Other weeks are required, not optional: Calendar offers Preview session on scheduled days through to the end of the program, and Preview is locked to open this tab on that day.
2. Two sessions in one day: after finishing today's session, "Do this today" on a missed one would log a second session that day. Calendar deferred multiple sessions per day.
3. Supersets in the preview: logging groups superset members in one frame; the preview list is flat rows.
4. Preview row content: logging states targets as an RPE cap (RPE ≤ 8) and, for percentage programs, a percentage; the preview shows sets × reps · weight only.
5. A done day lists the plan, not what was done.
6. States not drawn: today's session already done; no program; program complete.
7. July's list showed a focus line and "+ finisher" per session (Pull emphasis · 9 exercises + finisher); the current card shows exercises and time only.

Owner (2026-11-22): confused by the written list; review the differences in mocks.

### Turn 9 · 2026-11-22 · landing page review, the gaps drawn
One row per gap: the page as it is now beside what would change. Fragments, static. Nothing decided.

| Id | Gap | Shown | Status |
|---|---|---|---|
| 9a | Supersets in the preview | flat rows → a Superset frame (3 rounds) around its exercises | Unreviewed |
| 9b | What a row says | sets × reps · weight → adds the RPE cap; a percentage example | Unreviewed |
| 9c | A done day | lists the plan → "What you did", or just the card | Unreviewed |
| 9d | Focus line | name · count · time → adds "Pull emphasis" and "+ finisher" (is that real program data?) | Unreviewed |
| 9e | Other weeks | no way to leave this week → a week line with arrows and This week; no button on sessions in other weeks | Unreviewed |
| 9f | Second session in a day | "Do this today" still offered after training today, or replaced by a line | Unreviewed |
| 9g | Missing states | today already done; no program / program just finished (Home's locked No Active Program card) | Unreviewed |

After turn 9 (owner):
- 9a: yes, show supersets in the preview; logical and looks fine. **Locked.**
- 9b: go to "would become"; seeing the percentage and the RPE is useful. **Locked.**
- 9c: fine to have something under a done day too, since a preview is normally shown; but very simple: a high-level summary, not the detail that View session holds; tagging the PR is cool. **Locked:** a done day shows a short What you did list (one row an exercise, PR tagged), no warm-up or after lists. Row content as drawn; "not too intimate on the details".
- 9d: keep what we have now; the extra content is too much and it's unclear where it would come from. "Clean and simple, please." **Rejected.**
- 9e: thinks it should be consistent and become this; asked what Claude thinks. Leaning, not locked.
- 9f: do not limit to one workout a day, in the backend or the app, and not in the UI either. Rare for him, but it must be flexible. Needs a mock of two sessions in a day; anywhere a session card is shown it can be a list that shows several. **Locked:** more than one session can be logged on a day; "Do this today" stays available after training today.
- 9g: today already done looks like any other completed day, with View session, "100%". No Active Program card is right (it was mocked and locked on Home, 13d; this is the first time it is placed on this tab). **Locked:** both.

### Turn 10 · 2026-11-22 · two sessions in one day
Thursday's own session done in the morning; Tuesday's missed session caught up that evening. Static.

| Option | What | Status |
|---|---|---|
| 10a | Thursday's card and What you did, then an Also logged today card with the other session as a row that opens it | Unreviewed |
| 10b | A list of session cards, each with its own View session and What you did | Unreviewed |

Notes for the build, added: a day can hold more than one logged session; nothing in the data model or UI may assume one a day. This reverses Calendar's "multiple sessions per day: deferred". To draw later: the two-session day on Home's This week card, Calendar and History.

Owner (2026-11-22): doesn't follow the duplication Claude called out for 9e; show it on screen. On 10: "leaning A, but probably A, right?" 10a marked Leaning, not locked.

### Turn 11 · 2026-11-22 · the week line on the whole screen
Live: arrows move between this week and next, This week returns, days tappable; no button on sessions in other weeks.

| Option | What | Status |
|---|---|---|
| 11a | 9e as drawn: the card's first line is "Week 3 of 11", repeating the line under the title; on next week the card says Week 4 while the top line stays Week 3 | Unreviewed |
| 11b | The card names the week by its dates (Aug 17 – 23); nothing repeated | Unreviewed |

Owner (2026-11-22): 10A, lock it in ("you don't have to say leaning"). **Locked:** 10a. On a day with more than one session, the day's own session keeps the card and its What you did; every other session logged that day is a row in an Also logged today card, and the row opens that session. 10b rejected.
On the week line (9e, 11a, 11b): on the fence. Do we really need to flip through weeks here? There may be better ways to view upcoming sessions: improve Calendar so it previews an upcoming session itself, and drop week flipping from this tab. "A minor thing." Asked Claude's view. Nothing decided; 9e, 11a, 11b stay open.
Claude's view: drop it. Other weeks can only be looked at, never acted on, and looking ahead is Calendar's job. Cost: Calendar's Preview session (locked to open this tab) would need its own read-only preview for days outside this week.

Owner (2026-11-22): agreed, do that. **Locked:** the Workout tab shows the current week only; no week flipping. 9e, 11a and 11b rejected. Looking at sessions in other weeks belongs to Calendar, which gets its own read-only preview of an upcoming session (card plus warm-up, exercises, after; no Start). This changes the earlier lock that Calendar's Preview session opens the Workout tab (home-decisions 4c / calendar-decisions); Home's Preview session (always today) still opens this tab. To design with the Calendar update.
Also: "Leaning" is still a useful stamp at times; in 10a's case he simply wanted it locked.

## Workout tab at rest: where it stands (2026-11-22)
Locked: week strip in the day card, this week only (3c) · every day tappable, rest days included · rest-day card (4a) · Logged today / Also logged today card for anything else done that day, generic activity rows (5b, 10a) · buttons by state: Start Workout / Do this today / View session · catching up within the week, nothing moves, no repeats · a circle is that day's session (6a) · preview lists: warm-up, exercises, after; supersets framed (9a); rows show the RPE cap and a percentage where the program uses one (9b) · a done day shows a short What you did with PRs tagged (9c) · today-done looks like any done day · no program uses Home's No Active Program card (9g) · more than one session a day is allowed.
Not done: one assembled reference build of this page with all of the above. Deferred: a workout that isn't in the program (#71).

Owner (2026-11-22): the checklist artifact is very helpful; continue.

### Turn 12 · 2026-11-22 · the session in steps, and the end of the session
Steps (owner's lean, 8a) matches the earlier logging round for the start: a warm-up page, then the logging page whose back button returns to warm-up. The earlier round has no post-workout protocols. Fragments, static, in the earlier round's card style with today's buttons.

| Option | What | Status |
|---|---|---|
| 12a | After is its own step before Finish: exercises end in Continue; Finish Workout sits on the After page | Unreviewed |
| 12b | Finish Workout stays on the exercises page as locked; tapping it leads to the After page, then Done opens the summary | Unreviewed |
| 12c | No After page: the post-workout protocols are the last card on the exercises page, above Finish Workout | Unreviewed |

Still to confirm with this: the step structure itself (warm-up page → exercises page).

Owner (2026-11-22): add a quick consistency pass on Home and Calendar, really every designed screen, against the rules added since; maybe at the end. Recorded in inventory.md and the checklist.
Owner (2026-11-23): on turn 12, wants the full workout as an interactive demo with these options, to feel which he prefers.

### Workout Session Demo · 2026-11-23
`Workout Session Demo.dc.html`: the earlier round's Logging Assembly (everything locked through its turn 35), behaviour unchanged, with a Warm-up page in front and a switch above the phone for the three endings of turn 12 (12a, 12b, 12c). Flow: Warm-up (tick, steps open in place, Continue to exercises: quiet until all ticked, then blue) → exercises page (back returns to warm-up) → ending → a stand-in for the summary.
Unchanged from the earlier round: cards, tick states, set editing, rest countdown, effort slider and progression prompt, Detail · Swap · Note, superset, Finish arming, skip sheet and reasons, floating button, ⋯ menu.
New, not reviewed: the Warm-up page and its button; the After protocols in the three positions; in 12a the exercises button reads Continue and the After page's Finish carries the arming and the skip sheet.
Brought up to date: Liquid Glass tab bar; dimmest grey text raised to #7C7E86; 10px labels raised to 11px. Left exactly as locked, to decide separately: the outlined buttons, the 38pt glass circles, the sheets' style.
Built by `gen_session_demo.py`, which patches a copy of the earlier file; the earlier artifact is untouched.

After the Workout Session Demo (owner, 2026-11-23): the endings are okay; between A and C but not sold on either. Drawn back to turn 8, "a very interesting round", especially 8a: the Warm-up · Exercises · After tabs. You don't navigate off the page to see the other parts. With tabs it would be Continue until After, then Finish. No warm-up and no after: no tabs; only one of them: two tabs. Also likes the round ticks from turn 8 more than the current square ones; wants a refactor so those options can be seen.
12b: not picked. Nothing locked.

Workout Session Demo, second version (2026-11-23), three switches above the phone:
- Layout: Tabs (8a on the real logging screen; default) · Pages, After before Finish (12a) · Pages, After on the exercises page (12c).
- This session has: Warm-up and After · Warm-up only · After only · Neither. Tabs show only the parts that exist; none when there is only Exercises.
- Set ticks: Round (default; armed = blue ring, available = grey ring, logged = moss fill with a tick) · Square, as locked in the earlier round (26a).
In Tabs the back button is hidden on the exercises page (the tabs replace it); what a back button would do there is undecided. The tabs sit under the header and scroll with the page; whether they pin is undecided.

Owner (2026-11-23): the round ticks are a bit nicer; is there any other option? Really torn on tabs vs no tabs; leaning tabs; wants help deciding. Nothing locked.
Workout Session Demo: the Set ticks switch now has four: Round (moss fill when done) · Round, plain tick when done (no circle once logged, as the earlier rule "an outline is the app asking you to tap") · Rounded square (32pt, 10pt corners, moss fill when done) · Square, as locked.
Claude's view on tabs, given to the owner: lean tabs; the deciding question is how often the After protocols are actually done, because with tabs Finish is one tap further from the last set.

Owner (2026-11-23): in practice he usually skips the post-workout protocols ("not very good at doing them"), but a separate tab could be good. Maybe rename After: "post or something". Nothing locked.
Workout Session Demo, updated:
- New layout, now the default: Tabs · Finish on Exercises. Tabs as before, but Finish workout stays on the Exercises tab exactly as the earlier round locked it (arming, skip sheet, floating button), with a quiet secondary line under it, "Post-workout · 0 of 2", that opens the Post-workout tab; that tab also ends in Finish workout. Skipping the protocols costs no extra tap.
- The earlier Tabs layout is kept as "Tabs · Finish at the end" (Continue, then Finish on the last tab).
- "After" is renamed Post-workout throughout the demo (tab, page title, card), matching Session detail's Pre-workout / Post-workout. Not yet renamed on the landing page preview. Proposed, not locked.

Owner (2026-11-23): "Post Workout sounds good." Leaning the Round ticks too. "For tabs I think we should do tabs and I think we should make finish at the end."
**Locked:**
- The session is in tabs across the top: Warm-up · Exercises · Post-workout. You move between its parts without leaving the page.
- Finish at the end: every tab ends in Continue except the last, which ends in Finish workout. (So when there is a Post-workout tab, Finish is there, not on Exercises. "Tabs · Finish on Exercises" was not chosen.)
- A part the session doesn't have gets no tab; with only Exercises there are no tabs, and Exercises ends in Finish workout.
- The protocols after the exercises are called Post-workout (written as in Session detail), replacing "After" everywhere, including the landing page preview when it is assembled.
8a locked for the structure; 8b, 12a, 12b, 12c rejected. Set ticks: Round is Leaning, not locked.
Carried over without review, to confirm: on Exercises the Continue button keeps Finish's old states (quiet with "· N left", then blue, then the floating button when every set is logged); the skip sheet opens from Finish on the last tab; the back button is hidden; the tabs scroll with the page.
The Workout Session Demo now shows only this layout (the Layout switch is removed).

Owner (2026-11-23): should Continue and Finish be styled more like the rest of the app? They look pretty square. Not sure the pre and post protocol rows should have a chevron; restyle that piece.
Workout Session Demo, updated (nothing locked):
- Buttons switch: App style (default) · As locked earlier. App style makes the quiet state of Continue / Finish workout the README's tonal button (44pt, 10pt corners, no outline, light text) in place of the earlier round's outlined 6pt-corner button. The blue state was already the app's primary (50pt, 10pt corners).
- Protocol rows: chevron removed. Protocol steps switch: Tap the row to open (default; a protocol with a single step has nothing to open) · Always shown.
Not changed, same question still open: the other outlined controls from the earlier round (Detail · Swap · Note, Keep going on the skip sheet, the ✓ / ✕ on the progression prompt, the steppers in the set editor).

Owner (2026-11-23): tap to open "for sure"; "definitely the App style button. That's the whole point of a design system. Unifying things across the app." The button grows and changes a bit when it turns blue: correct that; the soft button looks better right now. Redesign these four as well: Detail · Swap · Note on each exercise card; Keep going on the skip sheet; the ✓ and ✕ on the "Go to 100 lb?" prompt; the − and + steppers in the set editor.
**Locked:**
- Protocol rows: no chevron; tap the row to open its steps in place.
- Continue / Finish workout use the app's button styles, not the earlier round's outlined ones.
- A button that changes state in place keeps its size: Continue / Finish workout are now the same height, corners and type when quiet and when blue (50pt, 10pt corners, 15/700); only the fill and text colour change.
Drawn in the demo under Buttons › App style, not reviewed:
- Detail · Swap · Note: three tonal buttons (44pt, 10pt corners, 14/600), plain words without the ⇄ and ✎ glyphs.
- Skip sheet: Finish workout as the full-width blue primary with Keep going as secondary text under it (the README's primary + secondary pattern), replacing the two side-by-side buttons.
- ✓ and ✕ on the prompt: two 40pt tonal circles.
- Set editor − and +: tonal, 10pt corners.
Flag: the earlier round locked the set editor as a sheet with picker wheels (11c / 13a in Logging Row Explorations); the Logging Assembly, and so this demo, shows a simpler stepper sheet. The wheels need bringing in.
Not touched: the Add reason pills on the skip sheet, the Done capsules on the sheets.

Owner on the four redesigns (2026-11-23):
- Detail · Swap · Note: "a bit tall no? Maybe let's clean them up a bit."
- Skip sheet: looks okay, but the spacing at the edges is weird: very low margins, doesn't look clean.
- Could not find the "Go to 100 lb?" prompt in the demo, so the ✓ and ✕ are still unreviewed.
- Set editor: same spacing problem as the skip sheet. **"I think this should actually be a standard sheet like the rest of the app and we can style it properly as such."** (Direction from the owner: the set editor is a standard sheet. How it is drawn below is unreviewed.)

Workout Session Demo, updated (nothing below is locked):
- Detail · Swap · Note: 34pt tonal pills (pill radius, 13/600), no hairline above them. The tap area stays 44pt in the build.
- Set editor: the app's standard short sheet (as Add link): floating glass panel 8pt in from the edges, 34pt corners, grabber, 44pt glass close top left, title "Set N" centred 17/700, blue ✓ top right. Content is what the earlier round locked and the Assembly never showed: two wheels (weight in 5 lb notches from the current value, reps in 1s) with lb / reps captions (11c), then one strip: This set / All sets on the left and ◎ / 123 on the right (13a). 123 swaps the wheels for two field cards over the system number pad, and the sheet rides on top of the pad (13c). The two segmented controls use the same control as the session tabs.
  - Behaviour drawn, for his review: ✓ keeps the change; the close button, a swipe down or a tap outside discards it (the earlier sheet had only Done and every change applied at once). All sets applies the open set's weight and reps to every set of the exercise the moment it is picked. The title no longer names the exercise.
- Skip sheet: the same standard sheet: close top left, title ("5 exercises not logged") centred, the explanation centred under it, rows at a 20pt margin, reasons as 32pt tonal pills (were outlined, 7pt corners), Finish workout as a capsule at the foot with Keep going as text under it. The reason menu takes the standard menu's size and type (220pt, 22pt corners, 16pt).
- "Jump to" row above the phone: the "Go to 100 lb?" prompt, the set editor, the skip sheet. The prompt only shows when effort is rated 6 under a cap of 7 (the far left of the slider), which is why it was hard to reach; that trigger is the earlier round's and is unchanged.
- The Buttons switch is renamed Controls and sheets; "As locked earlier" still shows the earlier rail, ✓ / ✕, stepper sheet and skip sheet.
- Still as the earlier round left them: the note sheet (Done capsule, flat panel), the 38pt glass circles in the header, the ⋯ menu.

Owner (2026-11-23): "These all look much better thank you", then, asked whether to lock all four as drawn including the two calls in the editor: **"yes lock it."**
**Locked:**
- Detail · Swap · Note as 34pt tonal pills, no hairline above.
- ✓ and ✕ on the "Go to 100 lb?" prompt as two 40pt tonal circles.
- Skip sheet as the standard sheet: close top left, count as the title, tonal reason pills, Finish workout capsule at the foot, Keep going under it.
- Set editor as the standard short sheet with the earlier round's wheels, This set / All sets and ◎ / 123 (number pad). ✓ keeps, close / swipe down / tap outside discards. Title is "Set N" with no exercise name.
These replace the earlier round's outlined rail, square ✓ / ✕, stepper sheet and two-button skip sheet. All four are in the README under Workout session.
Still open: set tick style (leaning Round); how Continue arms on the Exercises tab; the note sheet; the header's 38pt glass circles; the Warm-up and Post-workout tabs.

Owner on the tabs (2026-11-23), after the Warm-up tab was put up for review:
- The ⋯ button is only on the Exercises tab and pushes its content down, so the tabs don't line up: "That's not good." All tab screens must align.
- Agrees no back button. Asks whether there should be an end / exit workout, in a ⋯ menu on every tab, or just an X. Asked for Claude's view.
- Wants to see the tabs pinned.
- The header should be the same on every tab; a Warm-up tab under a Warm-up title makes no sense.
- Not convinced by the floating button when every exercise is done, since there is always a button at the foot.
- Bug: the floating Continue also shows on the Post-workout tab, next to Finish workout.
- Wonders whether Finish workout should be green when everything is complete, and asks what decides blue.

Workout Session Demo, updated (nothing below is locked):
- One header on every tab (the Exercises tab's): nav row with the mini title on scroll and ⋯ top right, then Pillars · Week 3, the session name, progress bar and "N of 6 exercises · clock". The Warm-up / Post-workout titles and their protocol counts are gone. Tabs sit at the same height on all three (measured).
- ⋯ is the README's 44pt glass bar button (was the earlier round's 38pt circle) and opens the standard menu (220pt, 22pt corners, 46pt rows, icon right): Add exercise · Reorder | Finish workout · Discard workout. Finish workout does what the button on the last tab does (skip sheet if exercises are unlogged). Discard workout asks with the standard confirmation dialog ("Discard this workout? Nothing you logged in it will be saved."), then leaves the session.
  - Claude's view, given when asked: a menu, not an X. The session lives in the Workout tab and the tab bar stays, so there is nothing to close; the two real exits are finishing early and throwing the workout away, and an X can't say which it is.
- Tabs switch: Stay pinned (sticky under the nav row, soft fade below) / Scroll with the page. Shown pinned by default because he asked to see it.
- All sets logged switch: Button at the foot only (default) / Floating button too, as before. Bug fixed: the floating button only ever shows on the Exercises tab.
- Finish, all logged switch: Green (default) / Blue.
- Button states as drawn:
  - Continue (Warm-up): quiet → blue when every protocol on the tab is ticked.
  - Continue (Exercises): quiet with "· N left" while any exercise has nothing logged → blue once every exercise has at least one set logged. Never green.
  - Finish workout (last tab): quiet with "· N left" (tap opens the skip sheet) → blue once every exercise has at least one set logged → green when every set of every exercise is logged. Protocols don't count toward blue or green (they are not in the skip sheet either). The first two states are the earlier round's rule (22a); green replaces the floating button as the sign that everything is done.
- Removed switches for things now locked: Controls and sheets, Protocol steps.
- Jump to gains "Every set logged".

Owner (2026-11-23): clean the demo up, removing the options for anything finalised. "I agree with the menu instead of X. I'm undecided on the pin tabs so far. The floating button though, I think we should get rid of it. I think it should be just the buttons at the bottom, and I agree with your decision for when to turn green and blue ... I don't think that the protocols should affect the greenness."
**Locked:**
- A ••• menu on every tab, not an X (Add exercise · Reorder | Finish workout · Discard workout).
- No floating button; one button at the foot of each tab. This overrides the earlier round's floating button once everything is done (22a / 24a).
- Colours: Continue grey → blue. Finish workout grey ("· N left", opens the skip sheet) → blue (every exercise has at least one set) → green (every set of every exercise logged). Protocols never affect the colour.
- All tabs share one header and line up (his requirement: "we need to align all these tab screens together").
**Undecided:** tabs pinned or scrolling (switch kept). **Leaning:** Round set ticks (switch kept).
Demo cleaned up: the Floating button and Finish colour switches are gone; what is left is Sample session, Tabs, Set ticks and Jump to. Notes under the phone cut to Locked / Still open. README (both copies) gains the header-and-menu rule and the end-buttons rule.

Owner (2026-11-23): "lock in round ticks too." **Locked:** round set ticks (grey ring → blue ring for the next set → moss fill with a tick when logged). The other three (plain tick when done, rounded square, the earlier round's square) are rejected. Set ticks switch removed from the demo; rule added to the README.

Owner (2026-11-23): "I think we also need to tweak the RPE design. It looks a little large and out of place. Especially the number."
Workout Session Demo, Effort row switch (nothing locked):
- As it was: 52pt row, the rating at 20/800 in blue, larger than the weights above it.
- Smaller number (shown by default): 44pt row; the rating at 15/700 in white, the same size as the weights and reps, centred in the tick column so it lines up under the ticks.
- Number beside the label: 44pt row; "EFFORT 8" on the left with the rating at 15/700 white, no number on the right, so the slider runs to the card edge.
The slider itself (track, five stops, 6 / 8 / 10 labels, blue thumb, no default) is unchanged in all three. Jump to gains "Effort slider".

Owner (2026-11-23): "For the RPE thing I think the smaller number is better. Let's lock that in too." **Locked:** the Effort row with the smaller number (44pt row, rating 15/700 white, centred under the tick column). "Number beside the label" and the earlier 20/800 blue number are rejected. Switch removed; rule added to the README.

Owner asked (2026-11-23): what do Add exercise and Reorder do on the Warm-up and Post-workout tabs? Answer given: nothing was designed for that. The same menu was put on every tab so the header lines up; in the earlier round both are exercise actions (Add exercise opens its own sheet, 28a-30a; Reorder is a full-screen mode for the exercise list, 34a) and neither opens in this demo yet. Open question put to him: show those two only on the Exercises tab, or keep them everywhere and jump to Exercises.

Owner (2026-11-23), on the menu away from the Exercises tab: "everything above the tabs feels like it shouldn't change when you change tabs. That's kind of the idea of a tab. So maybe it should exist? But rather than re-order and add pre/post it just does the exercises?"
**Locked:** nothing above the tabs changes between tabs. The ••• menu is identical on all of them, and Add exercise and Reorder always act on the exercise list, never on protocols. (Claude had suggested hiding the two off the Exercises tab; not taken.)
Not decided, to draw when those two screens are brought over: which tab you are on after adding or reordering from Warm-up or Post-workout. Claude's suggestion: the Exercises tab, so the result is visible.

Owner (2026-11-23): go ahead bringing Add exercise and Reorder over from the earlier round, one at a time, Add exercise first.

Workout Session Demo: Add exercise now opens from ••• on any tab (nothing locked).
Carried over from the earlier round unchanged in behaviour (28a, 29, 30, 30b, 32a, 27a): its own sheet; today only; search, then a sideways-scrolling muscle pill row with a fade at the right; Recent (logged in the last 30 days, most recent first, five at most, not already in today's session, follows the muscle filter, hidden when empty); the full list with a sort (Recent, A to Z, Most done); rows already in today's workout say so and can still be added; the selected row is tinted edge to edge, its name goes to 700, its second line becomes what you will get, and a 7pt blue dot replaces the history; Do it next and Add to end appear on selection as two equal capsules floating over the list, with space always reserved under the last row; the added card carries an Added tag and "Last 115 lb × 8", no target line. Opens clean each time, on Chest as in the earlier demo (the rule for which muscle it opens on was never written down).
Restyled to today's system: the standard large sheet (glass panel 8pt in, 34pt corners, grabber, title 17/700); search field and pills as on History (40pt pill-radius field; 32pt pills, accent outline and 10% tint when on); hairlines and type sizes from the README; Do it next as the solid blue capsule and Add to end as a glass capsule, both 50pt; Added as a small tonal pill.
Different from the earlier round, for his review:
- A 44pt glass close button top left. The earlier round chose grabber only ("no ✕ and no Cancel, since nothing is saved while you browse"); the README's sheet rule has a close button on every sheet.
- The sort is the README's pick-one menu, opened from a 36pt tonal capsule, in place of a text control that cycled on tap. It sits on the All heading only, and that heading now reads "All chest" because the capsule already names the sort (the earlier rule was that the heading names the active sort).
- After adding from the Warm-up or Post-workout tab you land on the Exercises tab, scrolled to the new card. No highlight on arrival, as elsewhere.
Demo limits: search is not wired up; an added card is a stand-in you tap to mark done (it counts toward the exercise total, "N left" and the green Finish).

Owner on Add exercise (2026-11-23), asked how it looks and whether he is happy with the three changes: "looks good." **Locked** as drawn, including the close button, the standard sort menu, and landing on the Exercises tab at the new card. Rule added to the README.

Owner asked whether Reorder had been mocked before. Yes: Logging Row Explorations turns 34 and 35 in the earlier round, 34a (one row per thing) and 35b (swipe to reveal Remove), both locked there. Both mocks sent to him.

Workout Session Demo: Reorder now opens from ••• on any tab (nothing locked).
Carried over from the earlier round (34a, 35b): finished exercises sit dimmed under Done and cannot be dragged; everything else is one 52pt row under Remaining, grab anywhere; a superset is one row with its members on a second line and moves as one; the lifted row takes an accent border and a slight tilt, and a dashed accent slot shows where it will land; removing is only for rows added this session, only here, by swiping left; no control at rest (the Added tag is the only sign).
Different from the earlier round, for his review:
- A standard large sheet instead of a full-screen mode.
- ✕ (discard) and a blue ✓ (keep) in the sheet bar instead of the Cancel and Done word capsules. (The earlier round called its Done capsule "THE Done capsule" for the set editor, note composer and reorder; the set editor already moved to ✓.)
- The swipe reveals a grey bin, and removing offers Undo in a toast, as locked for Session detail and in the README (no third hue; Undo for a single removed row). The earlier round used a dusty red Remove (#B25753).
- ✓ takes you to the Exercises tab.
How the order applies: finished exercises keep their place; the remaining ones fill the other places in the new order. Add exercise's "Do it next" now puts the card straight after the first unfinished exercise.
Demo limits: Barbell Bench Press is always the finished one.

Owner on Reorder (2026-11-23): "Looks good on all fronts. The undo toast might be unnecessary though."
**Locked:** Reorder as drawn: large sheet, ✕ discards and ✓ keeps, Done / Remaining, a superset as one row, drag with the accent outline and dashed slot, swipe an added row for a grey bin, ✓ lands on the Exercises tab.
Undo toast removed, agreeing with him: nothing in the sheet is final until ✓, and ✕ brings everything back, so the toast was a second undo. This is a stated exception to the README's "Undo after removing a single row" rule and is written into the Reorder rule there.

Owner (2026-11-23) asked what other Undo the app has. Answer given, from the README and the logs: a toast with Undo after swipe-deleting a set while editing a past session (Session detail) and after removing a saved link (Exercise detail › Resources); in the workout, the Undo beside the answer to "Go to 100 lb?" and Undo swap on the card (both the earlier round's, in place, not toasts). Anything bigger (an exercise with sets, a session, Discard workout) asks to confirm and has no Undo.

Owner asked whether Detail is done, since it only opens the exercise's detail page. Answer: the page is finished (Exercise Detail Demo, main lift and accessory) and the earlier round already said Detail links to that one page. Not yet decided or wired: how it opens from a live workout (a normal push with a back button that returns to the workout where you left it is the obvious reading; not confirmed), and the earlier round's open note about whether the page leads with something different when you arrive from a workout. Added to the checklist.

Workout Session Demo: Swap now opens from the Swap button on the open exercise card (nothing locked).
Carried over from the earlier round (17a and the swap rows of the log): one sheet, no steps; title "Swap for today" with "Incline Bench Press stays in the program" under it; search; one sideways-scrolling row of optional reasons (machine busy, it hurts, no equipment, prefer another) that rerank the list; a Suggested list (name, why it fits, your last numbers and when); one tap on a name swaps and closes. The card then shows the substitute's name with a Swapped tag, "for Incline Bench Press · machine busy" straight under the name, the original target with the substitute's own last numbers, the load from your last session on the substitute, and Swap becomes Undo swap. Today only.
Restyled: the standard large sheet; search and pills as on History; Swapped as the same small tonal tag as Added.
Different from the earlier round, for his review: a 44pt glass close button top left in place of the Cancel word on the right.
Demo limits: wired for the Incline Bench Press card only (not the superset members); search is not wired; a never-done substitute shows "–" for the weight but its first set still looks ready to log (the earlier round says it should not be until a weight is in).

Owner (2026-11-23): "swap looks good." **Locked:** Swap as drawn, including the close button in place of the Cancel word. Rule added to the README.

Workout Session Demo: the Note sheet redrawn (nothing locked).
Carried over from the earlier round: opened from Note on the card; the composer sits on top of the keyboard with the card dimmed behind; three quick phrases (felt heavy, machine busy, form cue) that add to the note; the saved note shows as a quiet line above the card's buttons and that line does not exist until there is a note.
Restyled as the README's short sheet (as Add link): floating glass panel, grabber, ✕ top left, title "Note" centred, blue ✓ top right, a text field with the accent ring while focused, the quick phrases as the app's 32pt pills. Empty field reads "Note for Incline Bench Press".
Different from the earlier round, for his review: ✕ (discard) and ✓ (save) replace the single Done capsule; the exercise name moved from the sheet's heading into the empty field's placeholder.
Demo limit: only Backspace works on the drawn keyboard.

Owner (2026-11-23) on the Note sheet: "looks great." **Locked** as drawn (short sheet on the keyboard, ✕ discards and ✓ saves, title "Note", the exercise name in the placeholder, three quick phrases). Rule added to the README.
Every sheet from the earlier logging round is now in today's sheet style and locked: set editor, skip sheet, Add exercise, Reorder, Swap, Note.

Owner (2026-11-23): "Warm up and post workout tabs are good." **Locked** as drawn. Rule added to the README.
He asked for Claude's view and the pros and cons of pinned against scrolling tabs. Given: pinned keeps every part one tap away and always in view, at the cost of about 46pt of the logging screen for a control used two or three times a workout; scrolling gives that room back and relies on Continue (and a tap on the status bar) to move between parts. Claude leans scrolling; not decided.

Owner (2026-11-23): "scrolling sounds good." **Locked:** the tabs scroll away with the page; pinned is rejected. Tabs switch removed from the demo. README updated.
The three tabs of the live workout are now fully locked. Left on the flow: Detail from a live workout, timed sets in the session, the workout complete screen, motion, the landing page's reference build, wiring into the App Demo, build notes.

## Turn 13 · After Finish workout: where you land (2026-11-23)
Checked first for earlier work: the earlier logging round did not design this screen (it notes a ~250ms green confirm on Finish, then straight to the summary, and "the moss moment on the summary screen"); Session detail lists Workout complete as one of its entries. Owner, asked whether finishing lands on its own screen or on Session detail: "not sure, let's see mocks for both options."

| Option | What it is | Status |
|---|---|---|
| 13a | Its own short screen: the earned card (Workout complete, program line, session name, time range, Time · PRs · Sets · Avg RPE), then PRs and Skipped, Done with View session under it | Unreviewed |
| 13b | Straight to that workout's Session detail, its top card turned into the earned card for this visit; close top left, ••• top right as on Session detail | Unreviewed |

Both are static whole screens in `Workout Explorations.dc.html`, same sample workout (54 min, 15 of 18 sets, two PRs, Dumbbell Curl skipped). Claude's lean, given when asked: 13a.

Owner (2026-11-23) on turn 13: "I think its own screen actually sounds good. Gives you the skipped. You can maybe have a swapped section. That's actually pretty nice. We might want to iterate a little bit on 13a though. I'm not 100% sold on everything on there."
**Locked:** finishing a workout lands on its own Workout complete screen (13a's direction). 13b (straight to Session detail) is rejected. **Not locked:** what is on that screen; he is not sold on all of 13a and has not yet said which parts.

## Turn 14 · Workout complete: adding what you swapped (2026-11-23)
Same sample workout with one swap. The top card, PRs and buttons are 13a's, unchanged; only the listing of what departed from the plan differs.

| Option | What it is | Status |
|---|---|---|
| 14a | A section each: PRs, Swapped (new exercise, "for Incline Bench Press · machine busy" under it), Skipped | Unreviewed |
| 14b | PRs, then one "Changed from the plan" card, rows tagged Swapped / Skipped (Added would be a third) | Unreviewed |

Owner (2026-11-23) on turn 14: one list is "a lot harder to understand and read"; "having them separate sections actually makes sense"; expects far more skips than swaps. Believed swap and skip were the only two kinds. On the screen from the top: the card is very like Session detail's, and he likes reusing it and making it green; does not like "Workout complete" with the check mark ("looks corny"), to be redesigned; loves the PR section; "the rest is a pretty good view." Asked what Done does and whether it should be green.
**Locked:** a section for each kind of change (14a); 14b rejected. The top card is Session detail's top card, in green. The PRs section.
Correction given to him: there is a third kind, Added (Add exercise is locked), so it needs a place too.

## Turn 15 · Workout complete: the top, Done, and added exercises (2026-11-23)
Fragments, static; everything not shown is 14a.

| Option | What it is | Status |
|---|---|---|
| 15a | Top: "Workout complete" as the screen's large title in white; the green card is exactly Session detail's | Unreviewed |
| 15b | Top: no title; the card's small label reads Workout complete in green; program and time share one line | Unreviewed |
| 15c | Top: the date in the bar and the green card; "Workout complete" is not written anywhere | Unreviewed |
| 15d | Done in blue, View session under it | Unreviewed |
| 15e | Done in green | Unreviewed |
| 15f | An Added section (name, what you did), order PRs · Added · Swapped · Skipped; a section shows only when it has rows | Unreviewed |

Answers given: Done saves nothing (the workout is saved at Finish workout); it closes the screen and returns to the Workout tab, which shows today as done. Claude's view on green: no. Green means earned here, and Done would be green on a day you skipped most of the workout; blue keeps green for the card and the PR lines. Claude's lean on the top: 15a.

Owner (2026-11-23) on turn 15: "I think I'm down for 15A. Also down to keep blue and the added looks good. I think the only thing for me to fully lock in 15A would be to see a full screen mock and to see what happens when you scroll."
**Locked:** Done is blue (15d); 15e rejected. The Added section (15f), order PRs · Added · Swapped · Skipped. **Leaning:** 15a, the title on the screen; 15b and 15c not picked.

Workout Session Demo: the stand-in summary is replaced by the real Workout complete screen (15a top, not locked).
- Title "Workout complete" at 26/800 where a tab's title sits; on scroll it fades out and the same words appear centred in the bar at 17/700 (the app's large-title behaviour), with the content fading under the bar.
- Session detail's top card in green: program line, session name, clock and time range, Time · PRs · Sets · Avg RPE.
- PRs, Added, Swapped, Skipped as sections; each shows only when it has rows. An added exercise that was never logged appears under Skipped, not Added.
- Done (blue) then View session are the last things on the page, in flow, never floating or pinned (as the session's own buttons). With all four sections Done starts below the tab bar and comes up as you scroll.
- No tabs on this screen; the tab bar stays.
- Built from the run: time from the clock, sets logged of the total, average of the RPEs given, a swap, added and skipped exercises with their reasons. PRs are sample data (Barbell Bench Press always; Lat Pulldown once it is logged).
- Jump to gains "Workout complete": a full example (54 min, 18 of 21 sets, two PRs, one added, one swapped, one skipped) so there is enough to scroll.
Demo limits: Done restarts the demo (in the app it returns to the Workout tab, today shown as done); View session is not wired.

Owner (2026-11-23) on the full Workout complete screen: "Yeah, I think it's right. I think Done has to be at the bottom, so it's kind of just the way it is, unfortunately. I don't really know what the other options we have here."
**Locked:** 15a (the title on the screen, collapsing into the bar) and the screen as built in the Workout Session Demo, with Done at the end of the page. 15b and 15c rejected. Rule added to the README.
Noted for him, not drawn: the one real alternative to Done at the foot is a close button in the top bar, always in reach. He did not ask for it.

Owner (2026-11-23): bring timed sets over ("let's do it").
Workout Session Demo: a timed exercise, Plank, is now the last exercise in the sample session (nothing locked). Switch above the phone: Hold to failure / Prescribed 0:45.
Carried over from the earlier round (timed sets, clock label, timed progression prompt, rest after a timed set, the four-slot grid): the row's button carries the state, ▶ start, ■ stop, tick logged; a hold to failure counts up until stopped, a prescribed time counts down, stops itself at zero and can be cut short with ■; stopping writes the time in as the set's value and starts the prescribed rest; the clock in the card's top right takes a small label, Hold or Rest, and the row mirrors it; tapping the rest clears it; the load slot stays empty for a bodyweight hold so Time sits where reps sit; after the last set the effort row, then "Best hold yet, 0:52. Target 1:00?" (or "All three at 0:45. Go to 1:00?"), which offers a longer target, never weight; tapping a logged tick un-logs it.
Restyled to today's locks: the round 28pt control (blue ring and tint with ▶ for the set you are on, the same ring with ■ while running, grey ring with ▶ for later sets, moss fill and tick when logged) in place of the earlier 44pt squares; the effort row with the smaller number; round ✓ / ✕; the slim Detail · Swap · Note. The clock row has a fixed height so the card does not move when the clock appears.
Demo limits: tapping a time does not open the editor (the earlier round's three-wheel time editor, 15a, is not built here); this card's Detail · Swap · Note do not open; the earlier open question, whether a running timer survives leaving the card, is still open.

Owner (2026-11-23) on timed sets: "Looks good although I'm not sure about the Best hold yet... Also it's not always a hold right?"
**Locked:** the timed card as drawn (start / stop / tick on the round control, counting up or down, stopping writes the time and starts rest, a labelled clock, the effort row after the last set).
**Open, redrawn in the demo for his review:**
- No "hold" anywhere, since a timed set can be a carry or any timed work: the clock label is Work (was Hold), with Rest unchanged; the to-failure target reads "To failure" (was "Hold to failure").
- The prompt. "Best hold yet, 0:52. Target 1:00?" is gone. A set time now gets the same prompt as a weighted exercise, "Felt easy. Go to 1:00?", on the same trigger (effort rated under the cap). Going to failure gets no prompt: there is no target to raise. Reasoning given to him: one prompt for every kind of exercise; and a "best yet" line is a kind of record, while the app's PR rule has only two kinds (est. 1RM and rep records).

Owner (2026-11-23): "Instead of Effort should it be 'RPE'?" Claude's view: yes. The same card already says RPE twice (the target "RPE ≤ 7" and last time's "RPE 7"), the collapsed card says "· RPE 7", and Session detail and Workout complete say RPE; Effort was the only other word for the same number. Changed in the demo on all three cards (Incline Bench Press, the superset, Plank); not locked until he confirms. The earlier round's label was Effort.

Owner (2026-11-23): "Do we even need a word? Can we just not do work and not have a word there? RPE looks better. I think we should keep it. I want you to make sure that the text is padded right, though... spaced out unevenly compared to the slider and the left side of the card." Asked whether the set numbers were downsized when the effort number was ("they look pretty small right now"), and, for a longer-time suggestion, what the increment is and whether it is defined on the exercise as with weights.
**Locked:** the label reads RPE, not Effort (README updated). No word on the running clock.
Done in the demo:
- Running clock has no label; Rest keeps its label on the timed card so the two clocks can be told apart (Claude's call, for his review; the rest clock on a weighted card has no label).
- RPE label column narrowed from 52pt (sized for "Effort") to the width of the word, so the gap to the slider is the same 14pt as elsewhere; the 6 / 8 / 10 labels moved with it.
- Answer on sizes: nothing but the RPE number was resized (20 to 15). Weights, reps and times have been 15/700 and the set number 11/700 since the earlier round. A Set numbers switch now compares that with 17/700 and 13/700 (the RPE number follows); not locked.
- Answer on the increment: weights have a per-exercise increment (default 5 lb), editable on Exercise detail in the current app (design-system brief "RPE auto-progression"). Two gaps: (1) the redesigned Exercise detail and its Edit exercise sheet have no place for it yet; (2) no increment for time exists anywhere; the demo's +0:15 is a placeholder. Proposed: one per-exercise increment field in Edit exercise, in lb for weighted exercises and seconds for timed ones.

Owner (2026-11-23): "Yeah, this all makes sense." On sizes: do not size up the time and weight or those columns; only the set column, whose text is a lot smaller, "just a little bit. Let's see what a little bit looks like."
Agreed from the previous message: Rest keeps its label on a timed card; the RPE label spacing; the progression increment belongs in the Edit exercise sheet, lb for weighted and seconds for timed (to be designed with the Exercise detail follow-ups).
Demo: the switch now changes only the set column, 11pt to 13pt (same weight and colour), shown at 13pt by default. Weights, reps, times and the RPE number stay at 15pt. Not locked.
Still without an explicit yes: the timed prompt ("Felt easy. Go to 1:00?" on a set time, none when going to failure).

Owner (2026-11-23): "Yep, keep rest, that's fine. And then increment goes to the edit exercise sheet agreed. I guess we should do the felt easy. And then yeah, I think the set column is better sized now."
**Locked:** Rest keeps its label on a timed card. The progression increment lives in the Edit exercise sheet (lb for weighted, seconds for timed; still to design). The timed prompt is the weighted one, "Felt easy. Go to 1:00?", on a set time rated under its cap; none when going to failure. The set column at 13pt (weights, reps and times unchanged at 15pt). Set column switch removed from the demo. README (both copies) gains the set-rows and timed-sets rules.
Timed sets are done. Not built in today's style: the earlier round's three-wheel time editor (15a), opened by tapping a time.

Owner (2026-11-23), on Detail opening the exercise page the normal way, with a back button that returns to the workout where you left it and the rest timer still running: "let's do it." **Locked.** Rule added to the README.
Demo: Detail on the Incline Bench Press and Plank cards pushes a page over the workout (glass back, the exercise name, •••) holding a stand-in card with a link to the Exercise Detail Demo; Back returns to the same tab and scroll position (checked: 120pt before and after), and the clock keeps running. Left open from the earlier round and not raised: whether the page leads with anything different when you arrive from a workout.

Owner (2026-11-23): confirmed Detail's back button returns to the workout. Asked for the time editor, redrawn "based on what we changed for the sheets today". Thinks the wrap-up (motion and so on) should come before assembling the landing page, since motion affects it.
Claude's view on the order, given to him: the landing page build first, then motion. Motion is designed on top of an assembled screen (it needs the thing that moves), and the whole-app demo needs the landing page before the flow can be wired in. Order proposed: time editor, landing page build, motion, whole-app demo, build notes. Not decided.

Workout Session Demo: the time editor (nothing locked). Tap a logged time on the last exercise.
Carried over from the earlier round (15a, wheel steps): minutes and seconds wheels with a colon between them and one "time" caption; a loaded exercise puts the rarely changed value, the weight, on a fixed 112pt wheel on the left behind a hairline, so three wheels read as two values; seconds move in 5 second notches for holds and carries, counted from the time already logged and never rounded onto a grid; captions, This set / All sets and ◎ / 123 as on the set editor.
Drawn in today's sheet, exactly as the locked set editor: floating short sheet, grabber, ✕ discards, title "Set N", blue ✓ keeps; the segmented controls of the session tabs; 123 swaps the wheels for fields over the number pad and the sheet rides on it (time typed as digits, 130 for 1:30).
To show the three-wheel version and a load column, the sample's timed exercise now has two forms on the switch: Plank, to failure (bodyweight, no load column) and Suitcase Carry, 3 × 0:45 at 70 lb (Weight in the load column, Time in the value column).
Demo limits: only logged sets open the editor; on the carry, a set not yet logged cannot have its weight changed here.

Owner (2026-11-23): "the time editor looks great and sounds good. do landing first then." **Locked:** the time editor as drawn (README updated). Order agreed: landing page build, then motion, the whole-app demo, the build notes.

### Landing page reference build · 2026-11-23
New page: Workout Landing Demo. One working phone holding every lock for the Workout tab's landing page (the summary line above: turns 1 to 11). Nothing new is locked by it.
- Tap any day on the strip; a "This week" switch above the phone changes what has happened: On plan · Missed one (Monday's session done on Tuesday, Tuesday's own not done) · Today done · Two sessions today (Thursday's in the morning, Tuesday's caught up that evening) · Rest day today (Wednesday, with a run logged) · No program.
- Start Workout and Do this today open the Workout Session Demo. View session, and a session row under Logged that day / Also logged today, open the Session Detail Demo. The Run row opens nothing (Run tab not designed).
- Applied from rules already locked, not drawn on this page before: the preview's third list is headed Post-workout (was "After"; README: called Post-workout everywhere); the header follows the large-title rule (26px, 17px inline over the first 56px of scroll, subheader folds away, soft blurred edge), as on Home.
- Drawn without a mock, for his review: a past day whose own session is done and that also had another session done on it heads the second card "Also logged that day" (the locked wordings are Logged today, Logged that day, Also logged today). Not reachable in the six sample weeks; noted so the build has an answer to confirm.
- Placeholder content, not decisions: the exercises of Monday, Tuesday, Friday and Saturday's sessions and their loads.
- Not in the demo: motion (next); other weeks (Calendar).

Owner (2026-11-24), on the landing build: Warm-up and Post-workout sections are good. In Exercises, a superset breaks the list into disjoint cards; "it looks like superset is creating its own section"; "we need to make that a little better". And the card for what else was logged that day sits above the preview on a missed day but below What you did on a done day: "I think it should be all above."
- **Changed (owner):** anything else logged on a day (Logged today, Logged that day, Also logged today) always sits straight under the day card, above the preview or What you did. This moves 10a's Also logged today card from under What you did to above it.
- **Reopened by the owner, not decided:** how a superset is marked in the preview's exercise list (9a, separate frames, was locked). Two alternatives drawn, on a switch in Workout Landing Demo, default A: A · one card for all exercises, the superset's rows joined by a grey line down their left side under a Superset / N rounds label; B · one card, the superset's rows in a darker inset panel inside it; C · separate frames, as it was. Claude's suggestion: A (one list, no box inside a box). The frame in the live workout is not touched by this.

Owner (2026-11-24), on the superset options and the header: asked how a superset looks in the live workout and whether it is disjoint there too; asked for one more option, C with its pieces joined, "not restyling it, just joining them". Header: scrolling is good, but the title must be "Apple's standard scroll to small header, which ends up being centered"; "put a note that all screens using this kind of technique need to use Apple standard." Bigger question, his: does the small header include the subheader as well?
- Answer given on the live workout: there every exercise is its own card, and the superset is a frame around its exercise cards, one more box in a stack of boxes; nothing is split. The break only happens in the preview, where the exercises are rows in one card and the frame cuts that card in three.
- Added to the switch, not decided: D · C joined (the same cards and frame, stacked with no gaps, corners squared where they meet, so the Exercises list is one block).
- **Rule (owner):** large titles use Apple's standard behaviour on every screen that has one: the large title scrolls away with the content and the title shows small and centered in the bar. README updated. Workout Landing Demo redrawn to it (small title 17/700, as the README's inline title). Not redrawn: Home (wordmark shrinking in place at the left was locked there; whether the wordmark follows this rule is to confirm), Workout complete.
- Open, on a switch in the demo, default A: the program line once you scroll. A · scrolls away with the large title; B · stays, small, under the centered title. Checked against Apple's documentation: iOS 26 supports both natively (navigationSubtitle shows in both states; ToolbarItemPlacement.largeSubtitle shows only with the large title). Claude's suggestion: A, matching Home's locked "subheader folds away" and the Workout session, where the bar keeps only the title.

Owner (2026-11-24): "for the scrolls away, I don't think we need the small title. I agree. I think that for the superset, I think A as well." "Home's word mark should also follow Apple's standard rule. I think that was before I knew that that was a standard rule, so that's why I made it that."
- **Locked:** the program line scrolls away with the large title; nothing sits under the small centered title. (Read as agreeing with A; "the small title" taken to mean the small program line under the title, since the centered small title is his own rule from the turn before. Said back to him.)
- **Locked:** superset in the preview: A, one Exercises card, the superset's rows under a Superset / N rounds label and joined by a grey line down their left side. B, C and D rejected. This replaces 9a (separate frames) for the preview; the frame in the live workout stays. Stamps updated on Workout Explorations (9a replaced; 10a changed: Also logged today above What you did).
- **Locked:** Home's wordmark follows Apple's standard large title too (scrolls away, then small and centered in the bar). Replaces the shrink in place at the left. Home Demo not redrawn yet: on the checklist under follow-ups.
- Workout Landing Demo: both switches removed. README updated (large titles; Workout tab session preview).
- Still to confirm: the "Also logged that day" wording.

Owner (2026-11-24): landing page is "good to take off"; "let's do the motion now." Also, for the future: add changes "as separate static workout explorations just to show the evolution rather than going back and changing the already locked ones", e.g. after turn 15 go to 16 and define the new locks there. "It's fine now."
- **Done:** the landing page reference build (Workout Landing Demo).
- **Working rule (owner), added to the project rules:** a change to something locked gets a new numbered turn on the Explorations page; earlier turns are not restamped. The two restamps made earlier today (9a, 10a) stay, as he said it is fine this time.
- Motion for the workout flow starts: see motion-decisions.md, turn 2.

### Turn 16 · 2026-11-24 · when a set is a PR
Found during the motion round: the live workout has nothing for the moment a logged set is a PR. Workout complete has a PRs section (locked) and the haptics table gives a new PR the success haptic; the first-pass placeholder "PR tag on the set and on the closed card" (turn 8) was never reviewed. Drawn as a new turn, fragments, static. Sample: moved up to 100 lb, so set 1 (100 lb × 8) beats 95 lb × 8.

| Id | Option | Stamp |
|---|---|---|
| 16a | Nothing during the workout; PRs wait for Workout complete | Unreviewed |
| 16b | On the set, the moment you log it: the PR tag beside the reps, staying there; the closed row carries it too | Unreviewed |
| 16c | On the finished exercise only: the tag on the closed row, nothing on the sets | Unreviewed |

Claude's suggestion: 16b. Stated on the page: unticking the set, or editing it below the record, removes the tag. Not decided here: how the tag arrives (motion), which follows the choice.

Owner (2026-11-24) on turn 16: "I think B is cool. I think it's just a very small tag and I think it's good to show it on that set you hit it. And then I'm assuming C comes with it, right? Like you would do B and C."
Answer: yes. 16b as drawn already puts the tag on the closed row as well as on the set.
**Locked:** 16b. A PR set gets the PR tag beside its reps the moment it is logged, and the finished exercise's closed row carries the tag too. Unticking or editing below the record removes it. 16a rejected; 16c is not a separate choice (its closed-row tag is part of 16b). README updated. How the tag arrives is on Motion Explorations (w18).

### Turn 17 · 2026-11-24 · the Detail, Swap and Note row
Owner, after a pass through the Session demo: "One thing that is a little weird to me is the view on the Note, Detail, and Swap buttons. They look much better than they used to but they kinda look a little funny still." Locked so far: 34px tonal pills of equal width. He did not say what is off. Claude's read, stated on the page: stretched to fill the row they read as one wide grey band under the sets, heavy for three rarely used actions, and close in look to the tab control. Drawn as a new turn, fragments, static; only the last row of the card changes; 44pt tap area kept in all.

| Id | Option | Stamp |
|---|---|---|
| 17a | As it is: three equal pills, 34px | Unreviewed |
| 17b | Pills that hug their words, 32px, together on the left | Unreviewed |
| 17c | One bar split in three by hairlines | Unreviewed |
| 17d | Plain grey words, no fills (bends the rule that a lesser action standing alone gets a tonal fill) | Unreviewed |

Claude's suggestion: 17b.

Owner (2026-11-24) on turn 17: "No, all these look terrible. A is still definitely the best. I like the little circles. It looks good like that. I think it's just that they're a little dark and don't stand out properly. I don't want to make them like bold or anything."
**Kept:** 17a, three equal pills. 17b, 17c and 17d rejected. Claude's read of the problem (too heavy) was wrong: the issue is the opposite, they are too dark to stand out.

### Turn 18 · 2026-11-24 · the same pills, a lighter surface
Shape, size and type unchanged (34px, 13/600, white). Only the surface varies. Fragments, static.

| Id | Option | Stamp |
|---|---|---|
| 18a | As it is: white at 6% (the app's tonal fill) | Unreviewed |
| 18b | A step lighter: white at 10% | Unreviewed |
| 18c | Two steps lighter: white at 14% | Unreviewed |
| 18d | White at 10% with a hairline edge (white at 10%) | Unreviewed |

Claude's suggestion: 18d. Open whichever is picked: whether the lighter fill becomes the tonal fill everywhere (View session, Do this today, the quiet Continue) or only on these pills.

Owner (2026-11-24) on turn 18: "can I see what these all look like in a full screen mock". Done two ways, nothing decided: the Workout Session Demo has a switch above the phone, "Detail · Swap · Note (turn 18, not decided)", with 18a to 18d, so each can be seen on the real Exercises tab; and a four-up image of the full screen was sent. The switch comes out of the demo once he picks.

Owner (2026-11-24), after the full-screen comparison: "im going between A and B". Not decided. 18a and 18b stamped In the running; 18c and 18d Not picked. Claude's view given: 18b, because 18a is the fill he called a little dark, and 18b is the smallest change that answers that; the cost of 18b is deciding whether the lighter fill replaces the app's quiet-button fill everywhere or is an exception for these pills.

Owner (2026-11-24): "if A matches the quiet button on the rest of the app then let's stick with it."
**Locked:** 18a. Detail, Swap and Note keep the app's quiet-button fill (white at 6%), so they match View session, Do this today and the quiet Continue. 18b, 18c and 18d rejected. Net result of turns 17 and 18: the row is unchanged from what was locked on 2026-11-23. README rule annotated. The temporary switch is out of the Workout Session Demo.

### The workout flow in the whole-app demo · 2026-11-24
Owner: "Sounds good. Start it."
APEX App Demo: the Workout tab is no longer a placeholder. Two screens added: the landing page (Workout Landing Demo) and the live workout (Workout Session Demo).
- Home › Start Workout / Preview session, and the tab bar, land on the Workout tab's landing page.
- Start Workout and Do this today fade through to the live workout (w15). Finish workout plays the Workout complete story. Done fades back to the landing page, which shows today as done and ticks today's circle as you watch (w20). Discard workout also returns to the landing page.
- View session, on the landing page and on Workout complete, pushes Session detail; Back returns. Detail on an exercise card opens the stand-in page, whose link pushes Exercise detail.
- The live workout starts fresh each time you leave it through Done or Discard.
Approximations and known gaps, for the owner: the fade-through is one fade of the whole screen, not the parts rising in one after another (the tile w15 is the reference). The sample content does not line up across the three source demos: the landing page says Upper Strength · Heavy Pull, the live workout is Athletic Power and Conditioning, and Session detail shows its own times. Session detail's tab bar highlights Home even when reached from the Workout tab. Leaving a workout in progress by tapping another tab and coming back keeps it as it was; nothing on other tabs shows that a workout is running.
Checked by running it: Home › Workout tab › Start Workout › (jump to) Workout complete › Done › today ticks › View session. The console errors seen while loading come from chart placeholders in screens that were already in the demo, not from this change.

Owner (2026-11-24), on lining up the sample workout before the build notes: "yes please".
Done for the loop you walk through: the landing page, the live workout, Workout complete and the landing page afterwards now show one session. Name: Upper Strength · Heavy Pull everywhere (the live workout was titled Athletic Power and Conditioning). Exercises: the landing page's Thursday preview and What you did now list the live workout's seven (Barbell Bench Press, Incline Bench Press, the Lat Pulldown · Face Pull · Rear Delt Fly superset, Dumbbell Curl, Plank), with PR tags on the two the complete screen names. Time: Workout complete starts at 7:02 am, the time the landing page shows once it is done; the complete screen's clock now says am or pm correctly (it always said pm).
Placeholder values added on the landing page to fill rows the live workout does not state: Barbell Bench Press 3 × 8 · 135 lb, Dumbbell Curl 3 × 12 · 30 lb.
Not lined up, said to the owner: Session detail (reached by View session) is a separate locked reference build with its own sample: the same name and date, but pull-ups, rows and presses, and 7:02 to 8:25 am. Making it match means re-authoring one side's sample data in full. Home's Today card still says 6 exercises. The session's name says Heavy Pull while the sample opens with two presses; sample content only.

Owner (2026-11-24), asked whether to rewrite the live workout's sample to match Session detail or leave the seam and move to the build notes: "yes please". Read as: rewrite it so all four screens agree.
Not done. Looking at both sides first showed it is not a sample swap:
- The rest of the app agrees with Session detail, not with the live workout: History, Calendar, Progress and Program summary all show this session's pull-ups and rows. So the live workout is the side that has to change; rewriting Session detail instead would break those.
- The app's version of the session is Weighted Pull-up 4 × 5, Barbell Row 4 × 8, Overhead Press 3 × 6, a superset of Plyo Push-up and Copenhagen Plank (a 30 second hold) for 3 rounds, and Hammer Curl 4 × 12. The live workout demo is built around a different shape: one finished card, one three-set card, a superset of three weighted exercises, one plain card and one timed card on its own.
- **Design gap found:** a timed exercise inside a superset. The locked timed set (▶, ■, the clock, rest after) is drawn only as a card of its own, and the locked superset only with weight and reps members. Nothing says how a hold works as a superset member, and his own sample program has one. The build will meet this regardless of the demo.
- The rest is demo rebuilding, not design: a four-set main card, a second plain card, new loads, prompts, PRs and swap lists.
Nothing was changed. Put to the owner: settle the timed-member question first (as a new Workout Explorations turn), then rebuild the live workout's sample on top of it; or leave the seam and note it in the build notes.

### Turn 19 · 2026-11-24 · a timed exercise inside a superset
Owner: "yes lets do it." Drawn as a new turn, fragments, static: the superset frame in round 1, Plyo Push-up just ticked, Copenhagen Plank (3 × 0:30) up next.

| Id | Option | Stamp |
|---|---|---|
| 19a | A timer, with its clock on the member: the member opens as the locked timed card (▶, ■, a set time stops itself, the tick lands); the running clock top right of the member; the frame's header keeps the rest countdown | Unreviewed |
| 19b | A timer, with its clock in the header: the same rows, the running clock in the superset's header where rest lives | Unreviewed |
| 19c | A plain tick, no timer: the row shows the target 0:30 and is ticked like a set of reps; tap the time to change it | Unreviewed |

Claude's suggestion: 19a (both locked pieces reused unchanged; a timed set works the same wherever it is; the two clocks never share a place). Same in all three: rest after the round's last member counts down in the header and starts nothing. Not offered, and said why on the page: the hold starting by itself when the previous member is ticked, since he ruled that nothing starts on its own.
Follows once decided: rebuilding the live workout's sample to the app's session so all four screens agree, then the build notes.

Owner (2026-11-24) on turn 19: "Yeah A". **Locked:** 19a. A timed exercise in a superset opens as the locked timed card (▶, ■, a set time stops itself, the tick lands), with its running clock top right of the member; the superset's header keeps the rest countdown. 19b and 19c rejected. README updated.

### The live workout's sample rebuilt to the app's session · 2026-11-24
Owner, on the timed card that stands on its own, which the app's session doesn't have: "Keep it as an extra".
Done. The Workout Session Demo now runs the session the Workout tab previews and Session detail shows: Weighted Pull-up 4 × 5 · 45 lb (the finished card, PR tag on its closed row per 16b), Barbell Row 4 × 8 · 165 lb (the open card, four sets), Overhead Press 3 × 6 · 115 lb, a superset of Plyo Push-up (8, bodyweight) and Copenhagen Plank (3 × 0:30) for 3 rounds, Hammer Curl 4 × 12 · 35 lb. Six exercises, 21 sets.
- The hold in the superset is 19a as locked: ▶, ■, a set time stops itself at zero, the tick lands and pops, the running clock top right of the member, rest stays in the superset's header. Its Time column sits where Time sits on a timed card (load column left empty, the set-rows rule); the turn 19 sketch had drawn it one column to the left.
- Plyo Push-up leaves the load column empty, per the same rule.
- The timed card on its own (Plank to failure, Suitcase Carry 0:45) is an extra on a switch above the phone, Off by default. Timed sets and Time editor in Jump to turn it on.
- Workout complete: PRs are Weighted Pull-up (5-rep record, 45 lb) and Barbell Row (Est. 1RM PR, 209 lb), the two Session detail names. Jump to › Workout complete is now that session exactly (21 / 21 sets, avg RPE 8.0, 7:02 to 8:25 am); the example with an exercise added, swapped and skipped moved to its own jump, Complete, with changes.
- The landing page's Thursday is back to the same list; its What you did rows now read as Session detail's sets do (5, 5, 5, 4 · 45 lb; 8, 8, 7), with PR on the same two.
- Whole-app demo regenerated. Checked by running it: landing › Start Workout › live › Workout complete › Done › today ticks › View session all show the same exercises, PRs, set count, average RPE and times.

Values the rebuild had to supply (sample filler, not design): Barbell Row's last session (160 lb × 8 × 4, RPE 8, which is what makes today's 209 lb a +6); the push-up's last session (8 · 8 · 7, RPE 7); the swap list for a barbell row (Dumbbell Row, Chest-Supported Row, T-Bar Row, Inverted Row); which exercises Add exercise marks as in today's workout.
Applied from rules already written, not new decisions; for the owner to confirm:
- The prompt on the open card now comes at RPE 7 or under, since its cap is RPE 8 ("rated under its cap"); the old sample's cap was 7, so it came at 6.
- The PR tag lands on the first Barbell Row set, because 165 lb × 8 already beats last time's best; the old sample earned it on the last set.
- Durations of an hour or more: Workout complete's Time tile and the landing page's done line now write "1 h 23 m", copied from Session detail's tile on the same card. They wrote minutes only ("83 min").
Not decided, left out of the demo: what "Felt easy" offers on a bodyweight reps exercise (Plyo Push-up gets no prompt); editing a logged hold inside a superset (works on the timed card of its own). The timed member's prompt uses the existing 15 second placeholder ("Go to 0:45?").
Seams that remain, by nature of the demos: logging by hand reaches Workout complete with the demo's own clock (a few minutes), while Session detail always shows the full 1 h 23 m session; the live demo's status bar reads 9:41. The Motion Explorations tiles still use the old exercise names as stand-ins. The Workout tab writes a hold as "30 sec" (as Session detail does) and the live workout as 0:30 (the timed card).

Owner (2026-11-24), after the rebuild: asked what the written rule for "Felt easy" is, and the other direction ("We need to write this rule down"). On a bodyweight reps exercise: "yeah BW probably shouldnt get a felt easy prompt so thats okay. We could maybe add reps but not too concerned here." Did not follow "editing a logged hold".
Found, and told to him: the README has no full rule, only the buttons and "rated under its cap" on the timed line. Two fuller versions exist and disagree.
- The original brief (issue #45): accessories only; all sets at target reps; RPE at or under the block's threshold (example ≤ 7); silent in a deload; ignoring it is a no and it does not ask again that session; a decrease after two missed sessions in a row.
- The earlier logging round's table: increase the first session an exercise comes in under its target RPE; decrease only after two sessions in a row more than 2 over target, or RPE 10 twice in a row; superset members get the same prompts. Drawn then as "Rough one. Drop to 90 lb?".
- Noted: the slider runs 6 to 10, so "more than 2 over" a cap of 8 can never happen.
Open, put to him: under the cap or at a separate threshold; whether every set must hit its reps; accessories only or every exercise; silent in a deload; what triggers a decrease. Nothing written into the README until he answers. The decrease prompt is not in today's demo and has not been drawn in today's style.
Recorded from his answer: no "Felt easy" prompt on a bodyweight reps exercise; offering more reps is an idea, not a decision.
Corrections to the entries above: (1) editing a logged hold inside a superset is not an open design question; 19a makes the member the timed card unchanged, so tapping a logged time to correct it applies there too. It is a demo gap only. (2) "The rest of the app agrees with Session detail" was too strong: History and Calendar list earlier Heavy Pull sessions with a different set of exercises (pull-ups and rows, then Chest-Supported Row, Face Pull, Hammer Curl, Farmer Carry), and any row tapped there opens the one Session detail sample.

Owner (2026-11-24): "Agreed with all your reommended rules for felt easy/hard. For #3, i think only accessories which is non-main lifts right? Or is there another category? Main gets progression built into the program so thats why i feel like it doesnt need it. but in a way it could also be used for that programming to help get the desired main lift RPE too. But thats less of a factor cause ideally you would have the correct starting weight. It would just help re-assess mid program i guess". On editing a logged hold in a superset: "Yes these should be editable." On the two wording and size seams going to the consistency pass: "Sounds good on the consistency pass".
**Locked, the progression prompt rule** (README, both copies):
- Accessories only: any exercise that is not one of the program's main lifts. The app has only these two kinds (main lifts are the ones the program names, pinned on Progress; everything else is an accessory). In the sample program the main lifts are Back Squat, Bench Press, Deadlift and Overhead Press, so in today's session only Overhead Press never prompts.
- Up: every set hit its target reps, and the rating is under the cap shown on the card. Offers weight plus the exercise's increment.
- Down: two sessions in a row of the same exercise with missed reps or RPE 10; never from one hard day. Offers weight minus the increment.
- Silent in a deload block. Unanswered counts as no and it does not return that session. No prompt on bodyweight reps or on a timed set to failure.
- A logged hold in a superset is editable as on a timed card (tap the time).
Written in by Claude as the plain counterpart, for him to confirm: on a set time, "every set hit its target" means every hold reached its set time.
Not decided, logged as his thinking only: using the prompt on main lifts to re-assess the weight mid-program; offering more reps on a bodyweight exercise.
Still to draw: the down prompt in today's style. Two old wordings exist ("Tough two weeks — drop to 65 next time?" in the brief; "Rough one. Drop to 90 lb?" in the earlier round, which reads as one bad day and so no longer fits the rule).
Demo: the prompt now also needs every set at its target (edit a rep count down, or cut a hold short, and it stays away). The down prompt and the main-lift exemption are not in the demo; Overhead Press is a plain tap card there.

### Turn 20 · 2026-11-24 · the prompt to drop the weight
Owner: "lets see the down prompt quickly first". A new turn, static: Barbell Row at 165 lb, the second hard session in a row (8 · 8 · 7 · 6 at RPE 10 both times), offering 160 lb.

| Id | Option | Stamp |
|---|---|---|
| 20a | One sentence that says why: "Two hard sessions in a row. Drop to 160 lb?" whichever way the sessions were hard | Unreviewed |
| 20b | The exact reason: "RPE 10 twice in a row. Drop to 160 lb?" or "Missed reps twice in a row. Drop to 160 lb?"; a mix would need a third sentence | Unreviewed |
| 20c | The twin of "Felt easy": "Felt hard. Go to 160 lb?" | Unreviewed |

Claude's suggestion: 20a (one sentence for every case, and it says why the app is asking; 20c is shortest but reads as if today alone caused it, which the rule rules out). Same in all three, carried over from the earlier round's "decrease twin fully neutral": the place and the ✓ / ✕ of "Felt easy", nothing in moss (the offered weight is white), and after ✓ a grey "↓ Next session · 160 lb" with Undo. 20a and 20b run to two lines on the card.

Owner (2026-11-24) on turn 20: "i dont want it to run 2 lines. Can we try rewording options A and B to get them to 1 line?" Stamped on the page: 20a and 20b "Two lines (owner: no) · reworded", 20c "Carried into turn 21".

### Turn 21 · 2026-11-24 · the drop prompt, on one line
Measured in the live demo: beside the ✓ and ✕ the words have about 220pt on a 390pt phone; "Felt easy. Go to 170 lb?" uses about 145. Each option is also shown with a longer weight (242.5 lb).

| Id | Option | Stamp |
|---|---|---|
| 21a | "Felt hard twice. Drop to 160 lb?" One sentence for every case; fits, long weight included | Unreviewed |
| 21b | "RPE 10 twice. Drop to 160 lb?" / "Missed reps twice. Drop to 160 lb?" The second only just fits at 160 lb and breaks at 242.5 lb or on a narrower phone; a mix still needs a third sentence | Unreviewed |
| 21c | "Felt hard. Go to 160 lb?" (20c, unchanged) | Unreviewed |

Claude's suggestion: 21a. Look unchanged from turn 20.

Owner (2026-11-24) on turn 21: "yeah i think A too". **Locked:** 21a, "Felt hard twice. Drop to 160 lb?". 21b and 21c rejected. README (both copies) updated.
The look he picked it in is the one drawn in 21a, carried over from the earlier round and said to him as such: the place and the ✓ / ✕ of "Felt easy", the offered weight in white, and after ✓ a grey "↓ Next session · 160 lb" with Undo. Recorded with the lock; he was told he can open it up.
Not decided: whether a set time gets a drop prompt too (the rule and the mock are about weight). Not in the demo: the drop prompt (it needs two sessions of history); turn 21 is the reference.

### Build notes written · 2026-11-24
Owner: "lets do it". `workout-notes.md`: only what the demos can't show, in the form of `exercise-detail-notes.md`. Rules by part of the flow (the tab at rest, the live workout, logging, PRs, the progression prompt, timed sets, supersets, editing, Swap, Add exercise and Reorder, skipping and finishing, Workout complete), the earlier logging round's rules that still stand, the parked haptic proposals, where the demos fall short of the design, what was applied without his explicit yes, and what is still open. Sizes, colours and timings stay in the README and are not repeated. `inventory.md` row 4 updated.
Left out on purpose because a later decision replaced them: the earlier round's back button and session menu, the Hold / Rest clock label, "Best hold yet", the Done capsules, the dusty red Remove, the square action buttons, the floating Finish pill, and Add exercise without a close button.
Found while writing, and listed in the notes as open rather than decided: which sets carry the PR tag when several beat the record; PRs on a swapped-in exercise; a superset's rest when the next round is started early.

### Turn 22 · 2026-11-25 · Workout tab: the large title, aligned with Home
Owner (2026-11-25), after locking Home 37c (34px wordmark on its own row under the gear): "Let's look at workout in progress and make sure that they are all aligned. Make sure we can align all the headers across what we already have and then going forward we can try and apply that same ruling."
The Workout tab's title is 26px on the top row and it has no bar buttons. Both options: 34px, subheader under it, scrolled shows "Workout" 17px centred on the top row where Home's small wordmark sits.

| Id | Option | Stamp |
|---|---|---|
| 22a | Own row under an empty buttons row, as Home (title and subheader at Home's heights: 114 and 159) | Unreviewed |
| 22b | On the top row, no empty row (44px higher; jumps 46px from Home) | Unreviewed |

Full screens on the page (`shots/workout-22a.png`, `workout-22b.png`: Home at rest, then the Workout tab at rest and scrolled 200px). Claude's suggestion: 22a. Progress tab next.
Owner (2026-11-25) on turn 22: "I'm thinking that none of the screens except the homepage should get that big size of a font. What is Apple's standard title size? Like I'm fine with making the apex one larger than the rest, but I think the other ones should probably be a bit smaller. ... I think we should have this spacing. I don't think it should move up to the top row. I think we should be uniform across the board with that, with the spacing. Keeping that top row separate for buttons if there is something and then but obviously the scroll collapses up into a small header and then you just need to pick the size as part of the thing."
**Locked:** 22a's layout for every tab: the top row kept for buttons (empty if none), the title on its own row under it, scrolling up into a small centred title. 22b rejected. 34px is Home's wordmark only; the other tabs' title size is turn 23. Answered: Apple's large title is 34pt; the next system text styles down are Title 1 (28pt) and Title 2 (22pt).

### Turn 23 · 2026-11-25 · Tab titles: the size, below Home's 34px wordmark
| Id | Option | Stamp |
|---|---|---|
| 23a | 28px (Apple's Title 1) | Unreviewed |
| 23b | 26px (today's size) | Unreviewed |
| 23c | 22px (Apple's Title 2; card titles are 20px) | Unreviewed |

Full screens on the page (`shots/workout-23-28.png`, `-26`, `-22`: Home at rest, then the Workout tab at rest and scrolled 200px), all in 22a's layout. The size applies to every tab but Home (Workout, Progress, Run later). Claude's suggestion: 23a.
Owner (2026-11-25) on turn 23: "Yeah, I think 23A makes the most sense." **Locked:** 23a, every tab's title but Home's wordmark is 28/800 (Apple's Title 1). 23b, 23c rejected. Built into the Workout Landing Demo and the whole-app demo (22a layout: title and subheader at Home's heights, 114 and 159 from the top; scrolled, "Workout" 17px centred on the top row). README (both copies) updated. The Progress tab is next: its period stepper sits beside the title today.

### Owner review · 2026-11-25 · the run-through, and Detail · Swap · Note on every exercise
Owner (2026-11-25): "I did do the full app demo review of those. And I think it looks good. I think the pass looks good." (The Session and Landing demos with the locked motion, and the workout flow in the whole-app demo: checklist w11b and w12.) "Switching between the navigation tabs at the bottom ... I think we need to think about the motion for those. I don't think that full app demo has good motion for that yet." Taken as a new item: motion for switching tabs.
Owner (2026-11-25): "every exercise in the workout, not including the pre- and post workout ones, but every exercise should have the detail swap in note. ... the one that is getting messed up right now is potentially the superset. But I still think it should have it." The rule (README, card buttons, 2026-11-23) named "the open exercise card" and never said whether superset members count; the demo left them out. **Locked:** every exercise card has Detail · Swap · Note, each superset member included, at the foot of the member while it is open; warm-up and post-workout protocols don't. Built into the Workout Session Demo and the whole-app demo (Detail opens for the members; Swap and Note open only from Barbell Row, as before). README (both copies) and `workout-notes.md` updated.


### Turn 24 · 2026-11-26 · Add exercise without the sideways-scrolling muscle pills
Owner (2026-11-26): "Then let's mock up the add exercise from the workout screen. Just to clarify though, this shouldn't be creating a new exercise. Only adding one that already exists I think." The locked sheet already adds existing exercises only; nothing creates one.
Why: the one line of muscle pills scrolls sideways; the README rule is quick pills on one line, no sideways scroll, and All exercises has since locked a filter button and roller sheet. Everything else as locked.

| Option | What | Status |
|---|---|---|
| 24a | All exercises' 44px glass filter button in the sheet's top-right slot, opening the r8c Filter sheet; applied = blue icon and dot, labels name it | Unreviewed |
| 24b | The same six pills, wrapping to two lines | Unreviewed |
| 24c | No filter, search only (a body part typed also matches) | Unreviewed |

Claude's suggestion: 24a. Open, not decided: which filter the sheet opens on (today Chest, never written down); 24a and 24c drawn opening with none.
Noticed, not changed: the sheet's rows are 15/600 with 12/600 values and its labels track +1.1px, against the README's 14/700, 12/500 and +0.6px.

Owner (2026-11-26): "And yeah 24a." **Locked:** the muscle pills go; the All exercises filter button (44px glass) in the sheet's top-right slot opens the r8c Filter sheet; applied = blue icon and dot, labels name it; Recent follows the filter. 24b, 24c rejected. README updated. Not built yet (waiting on turn 25, the same sheet). Still open: which filter it opens on; the sheet's type sizes.
Owner (2026-11-26), on the same sheet: "But what's with this list itself? Why do we have a drop down bar halfway down this list? This looks dumb" (the Recent ▾ sort button on the All label, locked 2026-11-23). Turn 25.

### Turn 25 · 2026-11-26 · Add exercise, the sort button halfway down the list
Same in all: 24a's sheet, opening with no filter; rows as today.

| Option | What | Status |
|---|---|---|
| 25a | No sort: Recent, then the rest A–Z under letter labels (as All exercises r1b); Most done goes | Unreviewed |
| 25b | Recent · A to Z · Most done as a segmented control under search, sorting one list; Recent no longer capped at five | Unreviewed |
| 25c | Sort moves into the Filter sheet (segmented control under the rollers); the list label shows the order as a note | Unreviewed |

Claude's suggestion: 25a.

Owner (2026-11-26): "25a and c are both good. Although I don't think A should be both recent and A-Z in the same list. Which is why maybe a hybrid is better?" 25a and 25c liked, 25b not picked; nothing locked.

### Turn 26 · 2026-11-26 · one order at a time (25a + 25c)
Sort (Recent · A to Z · Most done) in the Filter sheet under the rollers. A to Z = letter labels, no Recent block. Recent = whole list newest first, never-done last, one "All exercises" label with "Recent" as its note. The Recent block's last-30-days, five-at-most rule goes.

| Option | What | Status |
|---|---|---|
| 26a | Opens on Recent | Unreviewed |
| 26b | Opens on A to Z | Unreviewed |

Claude's suggestion: 26a. Open: whether a changed sort lights the filter dot (drawn: no).

Owner (2026-11-26): "Nice. Yeah this is great. But yeah recent is good. We would still have a complete list though right? Like if I search then it will show up? It's not like a subset? Same with scrolling on recent filter. Sort should not light the filter button. The sheet should open to all body parts, not one specific one like chest. And yes the text styles should align."
**Locked:** 26a (opens on Recent); 26b rejected. Every order is the complete list; only the filter narrows it; search covers everything. A changed sort does not light the filter dot. Opens on all body parts, no filter. Rows on the type scale: names 14/700 (the selected row keeps the tint and dot; its name no longer changes weight), second line and history 12/500, labels 11/700 +0.6px.
Built (gen_add26.py, in place) in the Workout Session Demo and the whole-app demo: filter button with the r8c rollers (tap a value to pick it) and Sort; ✕ cancels, ✓ applies, Reset goes back to All and Recent. Demo limits: Lift type uses a sample main-lift list; search still isn't wired.
In Recent, rows already in today's workout go to the end rather than the top (Claude's call).
Noticed, not changed: the workout header's eyebrow (Pillars · Week 3) also tracks +1.1px; the Swap sheet's reason pills sit in the same sideways-scrolling row container.

Owner (2026-11-26): "Don't worry about getting search to work in the demo. It's unneeded. Lift type is fine too. This all looks really great now too. You can lock this all in." **Locked:** the built sheet as it stands, including rows already in today's workout at the end of Recent. Search stays unwired in the demo on purpose; the sample Lift type list is fine.
Owner, on the two things noticed: "As for the 2 items you found, I think we should fix these too."
- Tracking: every 11px uppercase label in the Workout Session Demo (header eyebrow, set columns, units, protocol and sheet labels) is now +0.6px, the README eyebrow (was +1.1px; units +1px). gen_track27.py, in place; whole-app demo rebuilt.

### Turn 27 · 2026-11-26 · Swap, the reason pills without the sideways scroll
The four pills take 407px in a 332px row. Reasons stay optional and only reorder the suggestions.

| Option | What | Status |
|---|---|---|
| 27a | Wrap to two lines, same words | Rejected · owner |
| 27b | Shorter words on one line: Busy · Hurts · No equipment · Other | Not picked |
| 27c | No reasons; the suggestions keep one order | In the running · turn 28 (28a) |

Claude's suggestion: 27a.

Owner (2026-11-26): "I don't want this wraps to 2 lines." 27a rejected; 27b, 27c open. He asked whether the reason is a text box: no, four fixed pills, one pick (tap again to clear), nothing typed.

Owner (2026-11-26): "I think c or we actually do a proper spot to add a reason."

### Turn 28 · 2026-11-26 · Swap: no reason, or a proper spot for one
Today a swap reason reorders the suggestions and is recorded (card line, Workout complete). The app's existing reason control is the skip sheet's "Add reason" tonal pill opening the standard menu; 28b and 28c reuse it, in its sentence case.

| Option | What | Status |
|---|---|---|
| 28a | No reasons (27c): one order; card says "for Barbell Row" | Not picked |
| 28b | "Add reason" pill under the search, standard menu; picked reason reorders the suggestions and is recorded | Picked · placement in turn 29 |
| 28c | No reasons in the sheet; "Add reason" on the swapped card's line, same menu; recorded, reorders nothing | Not picked |

Claude's suggestion: 28b.

Owner (2026-11-26): "Can you try b but center it horizontally and place it above the search bar?" Then: "And yes when you build it align the text sizes." 28b picked; 28a, 28c not picked. Decided: the Swap sheet's rows go on the type scale when it is built.

### Turn 29 · 2026-11-26 · Swap: where "Add reason" sits
| Option | What | Status |
|---|---|---|
| 29a | 28b's pill centred under the subtitle, 12px above the search; menu centred under it | **Locked** |
| (28b) | Left, under the search, for comparison | — |

Owner (2026-11-26): "Yeah A. Lock it in." **Locked:** 29a. Built (gen_swap29.py, in place) in the Workout Session Demo and the whole-app demo: reason pills removed; "Add reason" tonal pill centred under the subtitle, 12px above the search, opening the standard pick-one menu in sentence case; a pick reorders the suggestions, shows in the pill and on the card ("for Barbell Row · Machine busy"), and in Workout complete; picking it again clears it. Swap rows' names 14/700. README updated.
