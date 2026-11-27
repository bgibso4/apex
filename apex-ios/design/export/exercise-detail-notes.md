# Exercise detail: notes for the build

The demos and mocks are the design. Build from them:

- `Exercise Detail Demo.dc.html`: a main lift (Back Squat), everything working.
- `Exercise Detail Demo · Accessory.dc.html`: an accessory (Hammer Curl), the graph working.
- `Exercise Detail Demo · Long Name.dc.html`: a name too long for one line (46a); otherwise the Back Squat demo.
- `Exercise Detail Explorations.dc.html`: every option that was considered. Only options stamped Locked count.

This page holds only what you can't see by using the demos: rules, numbers, edge cases and things still open. The full history, with the owner's comments, is in `exercise-decisions.md`. App-wide rules are in `APEX README.md`.

## Header

- The screen opens on the small title (17/700) between the back and ••• buttons; pulling down brings in the large title (28/800) with the sub header (body parts · equipment) under it. Every pushed screen in the app works this way (Header Audit Demo, H1). Rep records and Sessions open the same way with their own titles (no sub header).
- The period stepper is in the content, on its own line on the right above the chips, so it is in view when the screen opens (turns 43a, 48a).
- The screen opens with the stepper line at 128pt, the app's content top (turn 50 r3b).
- The stepper is Progress's: plain arrows either side of the period's dates (the program's name on Program); › is dim on the latest period.
- While the page sits where it opened the bar has no soft edge; the edge comes in once content scrolls under it.
- The back and ••• buttons sit at 59-103pt, iOS's navigation bar, like every bar button in the app (turn 44a).
- Long names: the small title runs onto a second line and stops there, ending in … (47a, 49a); the large title wraps onto as many lines as it needs (46a, 49a). No limit on the name's length.
- In the demos the arrows don't page, and the dates are Progress's sample dates.

## Main-lift graph (est. 1RM)

- Line: est. 1RM per session, smoothed. Second line: best so far, as a staircase; each step is a PR, marked with a moss dot.
- No numbers on the data (6b). You read values by pressing and dragging; the readout is above the graph. The scale is three faint lines labelled at the right edge: low, middle, high.
- PR dots closer than 7pt merge into one; the readout then lists the PRs in that group.
- A range with no PR: the best line is dashed, with no label.
- Dragging snaps to a PR dot within 6pt in the mocks. 12pt was too sensitive. A thumb is less precise than a mouse, so settle the distance on a device.
- Haptic: one subtle tap when the drag snaps to a PR. This is the only haptic on any chart. Strength to settle on a device.
- Change % uses the same rule as the Progress tab: best 3 sessions in range against the best 3 before the range; Program compares with the last block of the same type; All compares with the best 3 of the first 4 sessions.
- "What is est. 1RM?" is a collapsed row that opens in place.

## Program blocks on the graph

- A strip under the graph, one segment per block, in greys by block type (deload nearly blank). A block's name shows only when the whole word fits.
- More than 10 blocks in range: the strip shows programs instead of blocks.
- While dragging: a faint column over the graph for that block or program, its strip segment outlined, and the readout names program · block.

## Accessory graph

- The card is Weight, not est. 1RM. A step line for the weight used; one grey bar per session for the average reps per set. No PR dots, no best-so-far line. The corner shows the change in lb ("Same weight" when it hasn't changed).
- Press and drag picks the nearest session: white bar, rule and dot on the weight line, block or program lit as on a main lift. No snapping, no haptic.
- Long ranges: one bar per month (or quarter, half-year) with that period's average reps; the readout gives sessions, average reps and average RPE. The weight line is never averaged. The owner called monthly averages a weak signal, accepted because there's no better choice.
- The switch is threshold based (Exercise turn 38a): one bar per session up to 45 sessions in range (every bar stays at least 4pt wide), one bar per month past that; past 45 months one bar per quarter, and past 45 quarters one per half-year (turn 39a). Never more than 45 bars. The same range can therefore look different on two exercises: an exercise done twice a week goes monthly on 6M, one done every other week stays per session on All.
- The weight line has the space from the top of the graph down to just above the tallest reps bar (80pt, was 36pt; turn 41a). The graph is the same height as a main lift's.
- Behind the weight line: three faint even lines at round weights (steps of 5, 10, 20, 25 or 50 lb, the smallest that covers the range in two steps), no labels (turn 40b). No numbers on an accessory graph; a main lift keeps its labelled scale.
- Main lift or accessory: the exercise's Lift type (below) decides which graph it gets.
- RPE as the bars was tried and rejected (it barely moves and reads backwards).

## Rep records

- Tracked rep counts: 1, 3, 5, 8, 12, 15. The card shows only records that exist, one row each. "New" marks a record from the last two weeks.
- A row opens the session that set that record, scrolled to the exercise. No chevrons. The card ends in a Show all row.
- Rep records page: the latest record on top, the other records under it, then History by year. Every History row also opens its session. Beaten records are grey; each shows the gain in lb, or First.
- In the demo, record dates don't always match a logged session, so some rows open the nearest session. In the app a record always belongs to a real session.

## Sessions

- Row: date tile; sets · weight, written "4 × 8" when every set matched, otherwise each set, so a missed rep isn't hidden; PR tag; then RPE · program (· Deload).
- Right-hand number: est. 1RM for a main lift, RPE for an accessory, labelled once in the header; 15/700 in the secondary grey #8F9098 (turn 50 r2b).
- A row opens Session detail scrolled to this exercise. No highlight on arrival.
- Show all goes to its own screen. Long lists never expand in place.

## Resources (links)

- Press and hold a row for Edit link / Remove. No swipe, no per-row buttons, no Edit button in the header. Remove shows an Undo toast.
- The hint "Press and hold a link to edit or remove it." shows until the first press and hold, then never again.
- Preview (title and thumbnail) is fetched once, on paste, and stored. Never refetched when the screen opens. Typing a link waits about half a second before fetching.
- While fetching: a spinner where the thumbnail goes. Confirming before the fetch finishes saves the row with the address first; the preview fades in.
- The Title field is prefilled from the fetch and can be edited.
- No picture: a neutral tile with a link mark. No title: built from the link (Instagram reel, TikTok video, YouTube video, otherwise the site's address), with the start of the address under it.
- Proposed, not decided: Apple's LinkPresentation for the fetch. Instagram and TikTok previews are unreliable through their own services.
- Add link is a short sheet, only as tall as its content. It opens without the keyboard. Nothing is ever under the keyboard.

## Managing the exercise

- ••• at the top right opens the standard menu. Today it holds Edit exercise only.
- Archive is deferred: it needs restore and a list of archived exercises, to be designed with All exercises. It then joins this menu. There is no Delete.
- Exercises are keyed by ID, so a rename keeps the history.
- Edit exercise: Name, Body part (several), Equipment (one), Lift type, Progression step, Note. Tapping a text field raises the sheet to full height with the keyboard, so no field is covered.
- Lift type: Automatic · Main lift · Accessory, Automatic by default. Every exercise has a default type: the big barbell lifts (squat, bench, deadlift, overhead press and close variants) are main lifts; everything else, and any custom exercise, an accessory. Automatic follows the running program when it includes the lift, otherwise that default. Main lift or Accessory overrides it in every program. The line under it: "Pillars treats this as a main lift." / "… as an accessory." / "A main lift by default." / "An accessory by default." / "Always a main lift, whatever the program." / "Always an accessory, whatever the program."
- Progression step: 2.5 · 5 · 10 lb (kg for kg users), 5 lb by default; seconds for a timed exercise (5 · 10 · 15 sec, 5 sec by default). Every exercise has one, since an exercise can be a main lift in one program and an accessory in another; only accessories use it, in the workout's Felt easy and Felt hard prompts.
- The note shows in a Note card above Resources. No note, no card.

## Still open

- Snap distance and haptic strength: settle on a device.
- Whether a Lift type override also changes which lifts Progress shows as the program's main lifts.
- On Automatic, which graph an exercise shows after you move to a program that treats it differently (it would switch between est. 1RM and weight).
- Which lifts count as close variants of the big barbell lifts (the exercise library).
- Archive, restore and the archived list (with All exercises, #7).
- Which service fetches link previews.
