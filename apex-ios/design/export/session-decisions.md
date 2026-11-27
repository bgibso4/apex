# Session detail — decisions log

Same rules as the other logs: every option in `Session Detail Explorations.dc.html` carries a stamp, shown as a tag beside its name. **Locked** = stands · **Rejected** = turned down · **Superseded** = replaced by a later turn · **Fallback** = drop-back. **Highest turn number wins.** Only the owner locks or rejects; anything not explicitly decided stays Unreviewed / Needs review.

## Inherited (locked)

| Area | Decision |
|---|---|
| Entry | History rows, Calendar day card (View session), Workout complete |
| Header | Pushed screen: glass back, centered 17/700 title (iOS 27 pass) |
| Tokens | Muted #7C7E86, 11px minimum, sheet close leading, capsule sheet primary (iOS 27 pass) |
| PRs | App-wide rule: estimated 1RM PRs + rep records at 1, 3, 5, 8, 12, 15 |
| Units | App-wide setting; mocks use lb + mi |

## Locked

| Area | Decision |
|---|---|
| Jobs | Re-read the full log, see the highlights, check protocols. Not: compare to last time (scoping, turn 0) |
| Editing | Everything is editable, including duration, and the session can be deleted (scoping, turn 0) |
| Edit style | Edit in place: the page switches into an edit mode, not a sheet (after turn 1) · owner: "edit in place makes more sense" |
| RPE | Per exercise, never per set (owner, after turn 1) |
| Weights | No sign on added load: a weighted pull-up shows "45 lb", not "+45" (owner, after turn 1) |
| Bar behavior | Standard iOS inline title: the date stays in the bar, content scrolls under it (owner, after turn 2) |
| Content top | 24px below the nav bar, app-wide token in the design system (owner, after turn 2) |
| Top card content | Program · week · block eyebrow, session name, start–end time, Time · Sets · PRs (owner, after turn 2). Style of the time range and stat layout in turn 3 |
| That day content | Recovery, sleep, strain plus cardio that day (owner, after turn 2). Layout in turn 3 |
| Cardio | Generic record; a run is one type. Same-day cardio shows in That day as distance and time; not edited from this page (owner, after turn 3) |
| Top card | Eyebrow (program · week · block), session name, clock + time range, then Time · PRs · Sets · Avg RPE centered in quarters at 18/800 (turns 3–5) |
| Time format | Under an hour "54 min"; from an hour "1 h 23 m", hours and minutes at stat size, units small (4b) |
| Exercise header | Name; "Target 4 × 5 · RPE 8" (target RPE beside the target); actual RPE top right (owner, after turn 5) |
| Exercise sets | One row per set (turn 2a/5 rows), numbers left-aligned, never centered. Edit mode keeps the same layout; only values become fields (owner, after turn 6) |
| PR line | Moss line under a lift only when it set a PR this session; keeps the weight ("5-rep record · 45 lb", "Est. 1RM 209 lb · +6") (owner, after turn 6) |
| Set columns | 7b: 48px Set, Weight in the middle, Reps / Time in a 104px column at the right; lifts with no weight drop the Weight column and their reps / time sit next to the set number (8b) |
| Missed set | Actual number only, in grey ("4"); no "/ 5" (owner, after turn 8) |
| RPE values | Whole numbers only, no halves (owner, after turn 8). Mocks updated |
| Edit: When | Date, Start, Duration only; no End field (owner, after turn 8) |
| Edit: fields | Grey filled fields, large enough to hit without being loud; number pad for every value (owner, after turn 8) |
| Edit: protocols | Tap a circle to change it; circles big enough to hit (owner, after turn 8) |
| Edit: Add exercise | A full-width button; opens the same Add exercise sheet as the logging screen (owner, after turn 8) |
| Edit: When values | Grey pills (white text), blue only while their picker is open; pickers open inline under the row (calendar for Date, wheels for Start and Duration). Pickers must be consistent app-wide: the same date and time pickers everywhere (owner, after turn 9) |
| Edit: Add set | Full-width tonal button under each lift (owner, after turn 9) |
| Edit: focus | The tapped field always scrolls into view above the keyboard, never hidden under it; app-wide (owner, after turn 9) |
| Edit: confirm | Blue ✓ glass button top right, close top left (owner, after turn 9) |
| Edit: Add set behavior | Adds a set copying the last set's weight and reps (owner, after turn 9) |
| Edit: added exercise | Picked from the logging screen's Add exercise sheet (reused, not a new one); lands at the end with no target and one empty set (owner, after turn 9) |
| Delete session | ••• › Delete session › standard iOS confirmation (owner, after turn 9) |
| Leaving with edits | Close with unsaved changes › standard iOS "Discard changes" confirmation (owner, after turn 9) |
| Remove exercise | Trash button beside Add set; asks to confirm before removing (owner, after turn 10) |
| Missing data | No Whoop data: dashes; no protocols: section hidden (owner, after turn 10) |
| Notes (read) | Workout note: its own Notes section after That day, only when there is a note. Exercise note: at the foot of its card, under the sets, only when there is one (owner, after turn 11) |
| Notes (edit) | Workout Note field under When and exercise note fields always shown, even empty, so a note can be added (owner, after turn 11) |
| Edit: exercise card order | Sets › Add set + trash › hairline › note field (12a) |
| Edit: Done state | Grey glass ✓ until something differs from the saved session; blue once it does; back to grey if the change is undone (owner, after turn 13) |
| Deletes | Removing an exercise and deleting the session ask to confirm (standard iOS dialog). A single set deletes with swipe › trash and offers Undo, no dialog, like most iOS apps. App-wide (owner, after the demo; set confirmation tried and reversed) |
| Protocols | As in 2a: pre and post groups, done check per protocol (owner: "look good", after turn 2) |
| Bar title | The date ("Thu, Aug 20"), centered 17/700; session name lives in the top card (turn 1) · owner: "makes sense, that's good" |

---

### Turn 0 · 2026-11-07 · scoping

Owner: jobs are the full log, highlights and protocols; exercise depth to be mocked side by side; edit everything (sets, duration, etc.) and delete.

### Turn 1 · 2026-11-07 · how much of the log shows

Shared: date as the bar title ("Thu, Aug 20"; the session name is too long for the bar), glass ••• top right opening Edit session / Delete session. Top card: date · week · block, session name, time range · program, Time · Sets · PRs · Avg RPE, recovery / sleep / strain, attached run. Protocols card at the end (moss check = done, empty ring = not done). Warm-up sets not shown.

| Id | Exercise depth | Stamp |
|---|---|---|
| 1a | Every working set as a row (set, lb, reps, RPE), one card per exercise, PR under its exercise | **Leaning** · owner leaning A for edit in place; refined in 2 |
| 1b | One row per exercise (sets · top set, PR tag), tap to open its sets in place; separate Personal records card | unreviewed |
| 1c | Ledger: sets written out on one line (4 × 8 · 165 lb), RPE per set under it | unreviewed |

Edit flow and delete confirmation: turn 2.

After turn 1 (owner): date title good. Top card too cluttered, clean it up. Exercise depth undecided between showing everything and collapsible; asked for pros and cons. Misses (fewer reps than prescribed) must be visible.

### Turn 2 · 2026-11-07 · read and edit in place

Shared: top card trimmed to program position, session name, time range, and Time · Sets · PRs; recovery, sleep, strain and the run moved to a "That day" card. Each exercise shows its target (4 × 5) and RPE once. A short set shows reps against the target in grey (4 / 5). Edit mode (••• › Edit session, or the Read / Edit switch above each phone): close top left, blue ✓ Done top right, title "Edit session". Top card opens into When: Date, Start, Duration (end follows). Not editable here: session name and program position (from the program), recovery / sleep / strain and the run (own sources). Protocols tick on or off. Add exercise at the end. Delete stays in the ••• menu.

| Id | Read · Edit | Stamp |
|---|---|---|
| 2a | Set rows (set, weight, reps) · rows become weight and reps fields, RPE field, Add set, swipe to delete | **Leaning** · owner: "definitely leaning A, more readable"; not perfect yet |
| 2b | Set tiles four across (reps big, weight under) · tiles tap to edit, dashed + tile adds a set | **Rejected** · owner: sloppy, looks odd with different set counts |

After turn 2 (owner): the common edit will be fixing a rep on a set. Start and end time matter most at the top: owner often forgets to end the workout, so the end time will often be wrong. Next: work top down.

### Turn 3 · 2026-11-09 · top card and That day (read)

Owner after turn 2: keep Apple's inline title; more space under the bar (app-wide token); top card content is right, but the time range could be styled better and the stats should be centered in equal columns; maybe add something like average RPE; That day centered too, with a view without cardio; cardio is generic (a run is one type), so how does it attach and what if there are several? Exercise count in the section header: owner torn, left as is. Exercises next.

Shared: content starts 24px under the bar. That day: Recovery · Sleep · Strain centered in thirds, then one row per cardio activity logged that day (type, distance, time); none = no rows. Shown here, edited where it was logged. Switch above each phone: No cardio · Run · Run + ride.

| Id | Top card | Stamp |
|---|---|---|
| 3a | Time range on one line with a clock icon; Time · Sets · PRs centered in thirds | **Clock line locked** · owner: "I kind of like the clock" |
| 3b | Start and End as two labelled values; Time · Sets · PRs · Avg RPE centered in quarters | **Start / End rejected** · owner: don't need it · **Avg RPE kept** |

### Turn 4 · 2026-11-09 · smaller stats, long sessions

Owner after turn 3: 3a's clock line; no separate Start / End; add Avg RPE; stats too big and blocky, bring them near the That day size but still a step above; check longer sessions (120 min, a forgotten 880 min). All: stats 18/800 (were 22), That day values 15/700 (were 17), four stats centered in quarters. Switch above each phone: 54 min · 2 hours · forgot to end (7:02 am to 9:42 pm).

| Id | Time format | Stamp |
|---|---|---|
| 4a | Always minutes: 54 min, 120 min, 880 min | **Rejected** · B chosen |
| 4b | Minutes under an hour, then hours: 54 min, 1 h 23 m, 2 h, 14 h 40 m (hours and minutes both at stat size, units small) | **Locked · time format** · owner: "we can just call option B" |
| 4c | Always h:mm: 0:54, 2:00, 14:40 | **Rejected** · owner: "C is out" |

After turn 4 (owner): sizing better. 4c out; A vs B undecided, added a typical 1 h 23 m (83 min) case to the switch.

### Turn 5 · 2026-11-09 · stat order

Owner after turn 4: going with B; Time and Sets side by side look cluttered (both long, with extra characters), so swap a short stat between them. Opens on 1 h 23 m.

| Id | Order | Stamp |
|---|---|---|
| 5a | Time · PRs · Sets · Avg RPE | **Locked** · owner: "long, short, long, short" |
| 5b | Time · Avg RPE · Sets · PRs | **Rejected** |

### Turn 6 · 2026-11-09 · exercise cards

Owner after turn 5: cards too long; target RPE beside the target; support bodyweight (reps only) and timed (seconds) lifts; misses grey, try the actual number alone. PR line explained: appears only when the lift set a PR in this session (app-wide rule), with the gain. Switch above each phone: miss shows 4 · miss shows 4 / 5.

| Id | Card shape | Stamp |
|---|---|---|
| 6a | Sets as columns (up to six across), weight and reps as rows; fixed height per lift type | **Rejected** · owner: sloppier than the turn 5 rows |
| 6b | Identical sets grouped into one row (1–4 · 165 lb · 8); a miss splits off | **Rejected** · owner: sloppier than the turn 5 rows |
| 6c | Every set a row, tightened: no header, no hairlines, 28px rows, units beside numbers | **Rejected** · owner: sloppier than the turn 5 rows |

### Turn 7 · 2026-11-09 · rows back, better spacing

Owner after turn 6: back to the rows; columns too bunched (Set and Weight close, Reps halfway with nothing to its right); keep numbers left-aligned; edit must not jump. All lifts share Set · Weight · Reps (or Time); bodyweight shows BW under Weight. Read and edit share columns and 42px rows. Switches above each phone: Read / Edit and Miss: 4 / Miss: 4 / 5.

| Id | Columns | Stamp |
|---|---|---|
| 7a | Even thirds | **Rejected** |
| 7b | 48px set column, Weight in the middle, Reps in a 104px column at the right | **Locked** · picked through 8b, which is built on it |

After turn 7 (owner): no BW when a lift has no weight; miss style still open (owner will decide).

### Turn 8 · 2026-11-09 · lifts with no weight

7b's columns. Plyo Push-up (reps) and Copenhagen Plank (seconds) have no weight.

| Id | No-weight lifts | Stamp |
|---|---|---|
| 8a | Weight column left empty (no header, no BW); reps / time stay in the same spot as other lifts | **Rejected** |
| 8b | Weight column dropped; reps / time move left next to the set number | **Locked** · owner: "I think B" |

### Turn 9 · 2026-11-09 · edit mode, interactive

One working phone. Switches above it: confirm as a blue ✓ or a Save button; When values as blue text or grey pills (blue only while their picker is open); Add set as left text, full-width tonal button, or right pill. Fields 40px. Tapping a number opens the iOS number pad (decimal for weight) with the value selected so typing replaces it; ↑ ↓ step between fields, Done closes; RPE adds a 6–10 quick row. Date opens an inline calendar, Start and Duration open wheels; "Ends" updates. Swipe a set left to reveal Delete (grey, not red), the row collapses, a toast offers Undo. Add exercise opens a stand-in sheet. Protocol circles 28px in 50px rows.

| Id | Stance | Stamp |
|---|---|---|
| 9a | Interactive edit mode with the three switches | **Locked** · blue ✓, grey pills, full-width Add set (owner, after turns 9 and 10) |

After turn 9 (owner): grey pills, inline pickers and full-width Add set locked; confirm (blue ✓ vs Save) still open. Delete looked cramped next to reps: now an icon-only trash button (52px, row slides 64px). RPE quick row dropped (pointless on a number pad). The bar above the keys (↑ ↓, field name, Done) is the standard SwiftUI keyboard toolbar, not a custom keyboard; the keys stay the system number pad. The app is native iOS (SwiftUI), not React Native. Focused fields now scroll to the middle of the space between the nav bar and the keyboard.

Keyboard bar label (owner, after turn 9): the field name between the arrows and Done is a nice-to-have, not critical. Drop it if it causes trouble on device (SwiftUI keyboard toolbar quirks since iOS 26) or if long names don't fit. Arrows and Done are what matter.

### Turn 10 · 2026-11-09 · loose ends

Owner after turn 9: blue ✓; Add set fine; added-exercise flow fine; standard delete and discard confirmations; idea: Done greyed until an edit, blue after; removing a whole exercise needs a home (RPE holds the card's top right); missing Whoop could be a dash; no protocols: section "should be empty"; recalculation after save agreed (build note).

| Id | Stance | Stamp |
|---|---|---|
| 10a | Edit mode: grey ✓ until something changes, then blue; close with changes opens Discard Changes / Keep Editing. Remove exercise switch: trash button beside Add set · swipe the exercise name · "Remove exercise" text under Add set. Removing fades the card, toast with Undo | **Locked: trash beside Add set**, with a confirmation before removing (owner, after turn 10). Grey-until-edited ✓ and Discard dialog shown, owner not yet ruled on the grey ✓ |
| 10b | Read page: Whoop no data = dashes (cardio row stays; no Whoop and no cardio hides the card). Protocols none: hidden, or the section with "None in this program". ••• › Delete session › confirmation | **Locked:** no Whoop data = dashes; no protocols = section hidden (owner, after turn 10) |

Note: both confirmations are system dialogs, so iOS draws Discard Changes and Delete Session in system red, the one place red appears.

Build note: after a save, PRs, Sets and Avg RPE recalculate from the edited numbers; a PR can appear or disappear (owner agreed).

### Turn 11 · 2026-11-09 · notes

Owner after turn 10: notes exist on the workout and on each exercise and were missed; show them in read and edit. Mock: a workout note, notes on Weighted Pull-up and Overhead Press. Read shows a note only when there is one (lines icon, grey text, no label); edit always shows the fields ("Add a note" when empty), normal text keyboard, field scrolls into view.

| Id | Placement | Stamp |
|---|---|---|
| 11a | Workout note closes the top card; exercise note under the name and target. Edit: same spots | **Rejected** |
| 11b | Workout note in its own Notes card after That day; exercise note at the foot of the card. Edit: Note under When; exercise note above Add set | **Locked for read** · edit order revisited in 12 |

### Turn 12 · 2026-11-09 · notes, actions first

Owner after turn 11: 11b; in edit, try Add set and the trash above the exercise note so the note acts as the card's closing separator.

| Id | Edit card order | Stamp |
|---|---|---|
| 12a | Sets › Add set + trash › hairline › note field. Read as 11b; workout-note switch shows the Notes card disappearing when empty | **Locked** (owner, after turn 12) |

### Turn 13 · 2026-11-09 · Done until edited

Owner after turn 12: 12a locked; couldn't see the grey ✓ in 10a, wants it on its own plus an opinion. One phone, edit mode: grey glass ✓ that does nothing until something changes; any change turns it blue; undoing the change turns it grey again; saving resets it; close with changes asks to discard.

| Id | Stance | Stamp |
|---|---|---|
| 13a | Done greyed until an edit | **Locked** · owner: "looks better, roll with it" |

### Session detail complete · 2026-11-09 · reference build

`Session Detail Demo.dc.html` is the reference build: one working phone with every lock. Read: date title, top card (clock line; Time · PRs · Sets · Avg RPE, 4b time), That day, Notes only when present, exercise rows (7b / 8b) with grey misses, target and RPE header, PR line, note at the foot, protocols. ••• › Edit session / Delete session (confirmation). Edit: When as grey pills with inline calendar and wheels, Note field, number pad with the value selected, keyboard bar (↑ ↓, Done; field name optional), scroll-into-view, swipe a set to its trash, full-width Add set beside the remove-exercise trash (confirmation), exercise note closing each card, Add exercise (logging screen's sheet), protocol toggles, grey ✓ until changed, Discard Changes on close. Saving returns to read and recalculates sets, PRs and Avg RPE. Static record: Session Detail Explorations turns 1 to 13.

After the demo (owner): every delete confirms, including a single set. Demo updated: swipe › trash › "Delete set 2 of Barbell Row?" › Delete Set; the Undo toast is gone since the dialog replaces it.

Owner reversed the set confirmation: swipe-to-delete on a single set needs no dialog; Undo toast restored. Exercise and session still confirm.

Owner 2026-11-10: toasts only for Undo after a swipe-deleted set. Demo no longer shows Changes saved, Changes discarded, exercise added or exercise removed toasts.

Owner 2026-11-10: set delete made smoother (300ms; row fades and shrinks as the rows below rise). Undo and Add set grow the row open. Owner: "looks great", **locked**.

### Swipe-delete built · 2026-11-25
Owner (2026-11-25): "Let's go to the session detail now." Built Motion Explorations 3 (owner 2026-11-24, "slide out then collapse for m3") into the Session Detail Demo (`gen_session_f15.py`) and the whole-app demo: the swiped set slides out to the left (180ms, ease-in), then its gap closes over 300ms while the rows below rise; the Undo toast follows. Replaces collapse in place.

### Session detail checked against the rules added since it was built · 2026-11-25
Checked the Session Detail Demo against every app-wide rule added after it was built. Passing: pushed-screen header (glass back, 17/700 title, one glass action, the ••• system menu); 11px floor and the iOS 27 greys (the 10px tab bar labels are the tab bar's; the 9px letters under the number-pad keys are the system keyboard's); no em dashes; chevrons only on the back button and the keyboard bar's previous / next, both system; toasts only for Undo (set deleted). The demo's "Back to History" and "Session deleted · back to History" notes stand in for navigation it can't do; the app shows no toast there.
No changes needed beyond the swipe-delete. Already listed as demo limits: Session detail is one fixed sample, and its tab bar highlights Home even when reached from the Workout tab.

### Turn 14 · 2026-11-25 · no Undo after a swiped set
Owner (2026-11-25): "Yeah, the swipe to delete looks fine. Looks good. ... I don't think we need the undo because you can just discard changes by exiting out ... So I actually don't know if we need the undo." Claude agreed (edit works on a draft; nothing is saved until ✓; closing with changes asks to discard; iOS edit modes don't offer Undo per row) and asked. Owner: "yup drop it."

| Id | Option | Stamp |
|---|---|---|
| 14a | Swipe › trash removes the set with no toast and no Undo; a wrong delete is put back by closing without saving, or with Add set | **Locked** |

Replaces the 2026-11-10 lock (toasts only for Undo after a swipe-deleted set). Built into the Session Detail Demo (`gen_session_f15.py`) and the whole-app demo; `shots/session-14a.png` on the page. README (both copies): Deletes, Toasts (now only a removed link), haptics (a set returning on Undo dropped) and the m3 locked moment updated.

