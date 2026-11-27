# APEX redesign — inventory

Where every screen stands, and what is left. Screen list from the design system's current-state inventory (13 routes today) plus what the redesign added. Updated 2026-11-12.

## Checklist

The owner's running checklist of what is left lives in its own artifact, "APEX Redesign Checklist" (https://claude.ai/artifact/8oVrbCS9UCAxuEgJdUdEqP, 2026-11-22). Items are rows in its database (collection `items`; sections in `meta/sections`). Whenever something here is finished, added or dropped, update the matching row there too.

## Done — designed, locked, with a reference build

| Screen | Reference build | Log |
|---|---|---|
| Home (all states: workout day, rest, resume, evening, no program, program complete, check-in) | Home Demo | home-decisions.md |
| Calendar | Calendar Demo | calendar-decisions.md |
| History (session list + filter sheet) | History Demo | history-decisions.md |
| Program summary | Program Summary Demo | summary-decisions.md |
| Session detail (read + edit) | Session Detail Demo | session-decisions.md |
| Progress tab (landing) | Progress Demo | progress-decisions.md |
| App-wide chrome: Liquid Glass tab bar and bar buttons, action hierarchy, PR rule | (in every demo) | home-decisions.md |

## Whole-app demo

`APEX App Demo.dc.html` strings every reference build into one phone (owner, 2026-11-09). Each demo is copied to `app/<screen>.dc.html` showing only its phone, with its navigation taps tagged; the shell pushes and pops them like iOS and fills undesigned screens with placeholders. Rebuilt by `gen_app.py` whenever a screen is locked: every new reference build gets added and wired in, and its placeholder removed.

## To design — screens

| # | Screen | Today's route | Why it matters / links waiting on it |
|---|---|---|---|
| 3 | Exercise detail + progression + sessions | exercise/[id], exercise/progression, exercise/sessions | Reference build: Exercise Detail Demo (2026-11-21), in the App Demo; record in Exercise Detail Explorations / exercise-decisions.md (turns 1 to 30). Still open: confirm the Add link preview / Title field / spinner and the missing-preview rows; accessory graph locked (34a, 2026-11-21), reference build Exercise Detail Demo · Accessory; build notes in exercise-detail-notes.md. Archive (and restore, and seeing archived exercises) to be designed with All exercises (#7); it then joins Exercise detail's ••• menu. Per-lift trend, history; what Progress and summary rows open. Include an info element explaining the main-lift tile number (estimated 1RM, average of the best 3 sessions) (owner, 2026-11-12) |
| 4 | Workout flow revision | (tabs)/workout | Reference builds (2026-11-24): Workout Landing Demo (the tab at rest), Workout Session Demo (the live workout, Workout complete), both wired into the App Demo as one loop. Record in Workout Explorations / workout-decisions.md (turns 1 to 21), the earlier round in logging-decisions.md, motion in Motion Explorations turns 2 and 3 / motion-decisions.md. Build notes in workout-notes.md, which lists where the demos fall short and what is still open. Haptics for the flow are parked for one pass on a device before the build |
| 5 | Run tab | (tabs)/running | Log / Trends, pain tracking. Ties to the cardio questions below |
| 6 | Library / choose a program + program overview (#64) | library | Where Home's Up next and No program cards send you |
| 7 | Exercises list + add exercise | exercises, AddExerciseModal | Also where muscle tags would be managed. Owner 2026-11-10: this is the All exercises screen under Progress (history + management in one); exercises keyed by ID |
| 8 | Settings | settings | Units, integrations (Whoop), data, cardio focus |
| 9 | Program-complete moment | program-complete | Today a full-screen celebration then the summary. Decide: keep a takeover, or let Home's earned card + summary carry it |
| 10 | Launch / splash | SplashScreen | Small; wordmark is locked |

## Follow-ups on finished screens (from later decisions, as of 2026-11-22)

| Screen | What needs adding | Source |
|---|---|---|
| Calendar | A session done on a different day than planned; a day with more than one session; its own read-only preview of an upcoming session (the Workout tab shows this week only) | workout-decisions.md, calendar-decisions.md "To update" |
| Home | This week card must match Calendar in those same cases | workout-decisions.md |
| History | A day with more than one session | workout-decisions.md |
| Exercise detail | Archive, restore and the archived list (with All exercises, #7); how an exercise is classed main lift or accessory; the 30-session cut-off for monthly bars; snap distance and haptic on device; which service fetches link previews | exercise-detail-notes.md |
| App Demo | Link Program summary's lifts and Session detail's exercises to Exercise detail (the Workout flow was wired in 2026-11-24) | APEX App Demo |
| Design system | Two stale README copies in uploads/ still show as sections (offer to move aside, unanswered) | |

## Consistency pass (owner, 2026-11-22)

Every finished screen gets a quick check against the design rules added since it was built, starting with Home and Calendar (the most used). Owner unsure whether to do it now or at the end. Rules added after the early screens include: one pull-down menu style; Show all rows and no chevrons on tappable rows; toasts only for Undo; short sheets and nothing under the keyboard; the two meanings of week circles; more than one session a day. Screens: Home, Calendar, History, Program summary, Session detail, Progress, Exercise detail.

## Deferred features (reserved, not designed)

- #71 Train without a program (off-program sessions).
- #73 Run history (may fold into the Run tab).
- Logging a missed day after the fact (Calendar).
- Multiple sessions on one day: now required (owner, 2026-11-22; see workout-decisions.md). Drawn on the Workout tab (turn 10); still to draw on Home's week card, Calendar and History.
- Bottom search with a folding tab bar (History 3c): only if search spreads across the app.

## Open decisions

- Animations and haptics across every designed screen (owner, 2026-11-09): in progress in Motion Explorations / motion-decisions.md.
- Cardio: focus beyond running (cycling etc.) and whether Run tab / pain check-in follow it; log runs inside the session vs separately (Calendar, History).
- History search: what it matches (session names, lifts, both).
- History filter: more groups beyond Body part, Session, Program, Exercise.
- Program summary → Progress lift link: test once Progress exists.
- Progress metric explanations (owner, 2026-11-11, later): how Strength, Consistency and Protocols are worked out, in a tap-to-open section or its own screen. GitHub issue #87 (https://github.com/bgibso4/apex/issues/87). Issues for the new app get the iOS label.

- Import old workout logs (owner has very historical logs; later, not critical). Would give Progress's All range real history.

## Build notes (engineering, not design)

- PR rule (app-wide): estimated 1RM PRs + rep records at 1, 3, 5, 8, 12, 15 from a single completed working set; a set counts toward every tracked rep count at or below its reps.
- Muscle tags per exercise (primary movers) for History's body part filter and the summary's body part balance.
- Exercises keyed by ID (owner, 2026-11-10): renames keep history; duplicates can be prevented.
- Generic cardio record (type, duration, distance); `run_logs` is run-only today.
- Runs attach to a same-day session at read time in History.
- System Liquid Glass materials and TabView so the iOS 27 transparency slider applies.

## iOS 27 pass (done 2026-11-07)

- Audit in ios27-audit.md; review page iOS 27 Compare. Contrast, 11px floor, sheet close leading, capsule sheet button, inline 17/700 pushed titles, sleep bar #70727A applied to all demos and the design system.

## Housekeeping (done 2026-11-07)

- home-decisions.md: turn 1's "Open" and "Deferred" sections relabelled as settled history.
- APEX Design System README: added pushed-screen header, Liquid Glass (glass recipe, tab bar, sheets), lists/search/filters, charts, data rules (PR), motion and copy rules. The project's copy (APEX README.md) synced.
- Motion retrofit on existing demos (owner, 2026-11-09): done, see motion-decisions.md.
