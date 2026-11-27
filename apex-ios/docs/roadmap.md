# APEX native · roadmap

The ordered list of product segments. One segment is one pull request and one session. Written on 2026-11-27 as the foundation finished, from `design/export/inventory.md` (updated 2026-11-12) and what the export holds beyond it. The order is a proposal: Ben or the lead may reorder it; a session takes the first segment that is not done.

How to read it:

- **Design** names the reference build and the log that settles questions. Only options stamped Locked count; the notes file, where there is one, lists what the demo cannot show.
- **Brings** is what the segment adds besides its screens: tables, a module, a rule that later segments use.
- A segment adds its designed states to `design/states.json`, one picture each, and a journey only when it crosses a seam nothing else covers (`AGENTS.md`, "Where tests go").
- Tick a segment here in the pull request that finishes it.

## The order, and why

The app is useful to Ben only once he can run a program and log a workout in it, so the list walks the path the data takes: choose a program, see it, train, then look back. Each screen arrives when the data it shows exists, so every picture is drawn from real records made by an earlier segment and never from a stand-in. The screens that only look back (History to Program summary) come after the one that writes sessions. Bringing over his old records and the server pieces come once the tables have stopped moving.

## Segments

| # | Segment | Design | Brings | Needs first |
|---|---|---|---|---|
| 1 | **Programs and starting one.** The Library (Active, All programs), a program's preview, Start. Home's No program card opens it | `Library Demo`, `Program Preview Demo`; `overview-decisions.md` (Library turns 1 to 4, overview turns 11 to 13) | The store: the SQL database on the phone, its first tables (programs as built-in definitions, the active program and its schedule), and how a migration is written and tested. The `Training` module's first types | nothing |
| 2 | **Program overview.** The active program: the Weeks tab, the lifts tab, a session's preview, change schedule, pause, end | `Program Overview Demo`; `overview-decisions.md` (turns 1 to 22) | Schedule rules (training days, a week's sessions), pause and end | 1 |
| 3 | **Home with a program.** Workout day and rest day, the This week card, Up next | `Home Demo`; `home-decisions.md` | Home's states that need only a program. `home.workoutDay` already has a mock. The mock shows Whoop's recovery figure, which has no data until segment 16: the session takes the design's no-data form, or files the gap | 1 |
| 4 | **The Workout tab at rest.** This week, today's session, Start Workout | `Workout Landing Demo`; `workout-decisions.md`, `workout-notes.md` | The week's states (done, missed, more than one session a day) | 2 |
| 5 | **The live workout: logging.** Sets, weights and reps, the rest timer, swapping and adding an exercise, leaving and resuming | `Workout Session Demo`; `workout-decisions.md`, `logging-decisions.md`, `workout-notes.md` | The session tables. The logging rules, on the Mac. The largest segment: split it in its plan if the picture count or the rules call for it | 4 |
| 6 | **The live workout: finishing.** Workout complete, PRs in the moment, the motion and haptics of the flow | `Workout Session Demo`, `Motion Explorations` turns 2 and 3; `motion-decisions.md` | The PR rule (estimated 1RM and rep records at 1, 3, 5, 8, 12, 15). The RPE progression that sets next week's weights. Haptics wait for one pass on the phone (inventory, #4) | 5 |
| 7 | **Home, the rest of its states.** Resume, evening, check-in, program complete | `Home Demo`; `home-decisions.md` | The next-day pain check-in (a neutral 0 to 10 scale) | 5 |
| 8 | **History.** The session list and its filter sheet | `History Demo`; `history-decisions.md` | Muscle tags per exercise, for the body part filter | 5 |
| 9 | **Session detail.** Read and edit | `Session Detail Demo`; `session-decisions.md` | Editing a finished session, and what that does to PRs | 8 |
| 10 | **Calendar.** | `Calendar Demo`; `calendar-decisions.md` | A session done on another day than planned. The follow-ups in the inventory are not designed yet (below) | 5 |
| 11 | **Bring the old records over.** Read the React Native app's database once and write its sessions, programs and runs into the new tables | none: no screen beyond a one-time step | Real history for every screen after it. Needs Ben: when, and whether it runs on his phone from the old app's file or from the Cloudflare copy | 9 |
| 12 | **Progress.** The tab's landing: Strength, Consistency, Protocols | `Progress Demo`; `progress-decisions.md` | The estimated 1RM per main lift (average of the best 3 sessions) | 9 |
| 13 | **Exercise detail.** A main lift, an accessory, rep records, sessions | `Exercise Detail Demo` and its two variants; `exercise-decisions.md`, `exercise-detail-notes.md` | Exercises keyed by ID. Link previews are still open in the notes | 12 |
| 14 | **All exercises.** The list, add an exercise, archive and restore | `All Exercises Demo`; `exercises-decisions.md` | Archive joins Exercise detail's menu | 13 |
| 15 | **Program summary.** Mid-program and ended | `Program Summary Demo`, `Program Summary Demo · Ended`; `summary-decisions.md` | Body part balance. The end of a program, from Home's earned card | 9 |
| 16 | **Backup and Whoop.** The automatic copy to Cloudflare, a way to restore from it, Whoop sign-in and the health figures Home shows | none yet for sign-in; Home's health bar is in `Home Demo` | Touches the Worker and its database: that pull request waits for Ben (`AGENTS.md`, "Merging") | 5 |
| 17 | **Cutover.** The native app replaces the React Native one on Ben's phone: TestFlight or a signed install, crash capture, the old app frozen | none | Needs 11 and 16, and Ben's go | 1 to 16 |

## Waiting on design

Not buildable yet. Each joins the list above when its reference build is locked and imported (`design/README.md`, "When a new export arrives").

| Screen | Where it stands |
|---|---|
| Run tab | In exploration: `Run Explorations`, `run-decisions.md` (scope: log by hand and trends; running only). Runs logged in a workout arrive with segment 5; the tab does not |
| Settings | Not started. Units, integrations, data, cardio focus. Segment 16's sign-in needs a home: Settings, or a default the session takes |
| Program-complete moment | Open: a takeover, or Home's earned card and the summary carry it. Until decided, segment 7 builds the card |
| Launch | Small; the wordmark is locked |
| Calendar, Home and History follow-ups | More than one session on a day; a session done on another day; Calendar's own preview of an upcoming session (inventory, "Follow-ups on finished screens") |
| Consistency pass | Every finished design checked against the rules added since. Ben has not said when |

## Deferred

Reserved in the inventory, not designed: training without a program (#71), run history (#73), logging a missed day after the fact, bottom search with a folding tab bar, GPS runs, importing very old logs.

## What every segment should know

- **The time ceiling is 40 s of test time in CI and 16 to 21 s are used**, 13 to 18 of them by the one journey. A picture costs about 1.4 s there. That is room for about 15 more pictures: Home alone has seven states. Segment 3 or 4 will reach 80%. What happens then is Ben's call and is asked of him in the foundation's last report; until he answers, the rule in `AGENTS.md` holds: say so in the hand-off at 80%, and over the ceiling speed a test up, move a behaviour to the Mac or remove a test.
- **Tables are designed with the first screen that stores the data**, never ahead of it (Ben, 2026-11-27). The phone's database is the source of truth; the Cloudflare copy is a backup.
- **A gap in a mock** becomes a GitHub issue labelled `needs-ben` with the default taken. Work goes on.
