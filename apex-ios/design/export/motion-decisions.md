# Motion and haptics — decisions log

Same rules as the other logs: every option in `Motion Explorations.dc.html` carries a stamp. **Locked** = stands · **Rejected** = turned down · **Superseded** = replaced later · **Unreviewed** = not decided. Only the owner locks or rejects. **Highest turn number wins.**

Owner brief (2026-11-09): smooth, never jerky; crossfades sometimes, bounces sometimes; do it now for every designed screen rather than at the end; include haptics; notes plus a live page.

## System-owned (use the iOS versions, don't design)

Push and back between screens · sheets opening and closing (History filter, Add exercise) · tab switches · the keyboard · picker wheels and the inline calendar, with their own selection haptics · confirmation dialogs · ••• pull-down menus · large-title collapse and the scroll edge effect · Liquid Glass button press. Using the system versions keeps them matched to iOS 27 and to Reduce Motion.

## Already locked (earlier screens)

| Where | Motion |
|---|---|
| Home | Cards Rise on load: 12px fade-up, 420ms, 55ms stagger, cubic-bezier(.2,.8,.2,1), no overshoot (turn 30) |
| Home | Check-in slides in last (440ms, opens space above Today), then one pulse (turns 30–31) |
| Home | Check-in Save collapses the card (320ms) (turn 30) |
| Home | Header collapses over the first 56px of scroll, wordmark 26 › 17 (turn 33) |
| Calendar | Month flip slides by direction, 28px, 260ms (turn 3) |
| Calendar | Tapped day's card fades in, 240ms ease-out (turn 4) |
| App-wide | One 900ms glow pulse for something newly due, then stops (turn 31) |

## Rules (locked, owner 2026-11-09)

- Three timings. Quick: 150–200ms, color and state changes (focus, enabling ✓, fills). Smooth: a 300–350ms spring with no bounce, for anything that moves or resizes (rows in and out, expand, read ↔ edit). Snappy: about 300ms with a small bounce, only for things the person places or ticks (swipe snap-back, check pop).
- Content arriving never bounces. Text never bounces.
- Reduce Motion: slides and bounces become fades; no stagger; charts appear without growing.
- Owner 2026-11-25: accessibility settings are out of scope, so the Reduce Motion line above no longer applies: "don't worry about reduced motion. This app, we're not really gonna make this app super accessible. We're not gonna worry about that right now. I actually don't really care. This is a personal app and we don't really need all these additional accessibility things."
- Haptics follow Apple's documented meanings, stay rare, and match the strength of the motion. People can turn them off in iOS settings.

## Moments still to decide · turn 1 (Motion Explorations)

| Id | Moment · where | Options | Stamp |
|---|---|---|---|
| m1 | Read ↔ edit · Session detail | Fields grow in place (350ms smooth) · Crossfade (200ms) | **Locked: Fields grow in place** (owner: first option on every one) |
| m2 | Done ✓ lights up · Session detail edit | Color fade (180ms) · Fade + pop (small bounce). Save = success haptic | **Locked: Color fade** (owner: first option on every one) |
| m3 | Swipe a set to delete · Session detail edit | Collapse in place (220ms) · Slide out, then collapse. Drag follows finger, snaps on release. Light impact | **Locked: Collapse in place** (owner: first option on every one). Owner 2026-11-10: smoother, 300ms; the row fades and shrinks while the rows below rise with it. **Locked** as built in the demo ("looks great") |
| m4 | Add set · Session detail edit | Grow open + 600ms tint · Drop in with a settle. Light impact | **Locked: Grow open** (owner: first option on every one) |
| m5 | Remove an exercise · Session detail edit | Fade, then close · Shrink and close together | **Locked: Fade, then close** (owner: first option on every one) |
| m6 | Expand in place · Program summary rep records, History filter sections | Smooth (350ms) · Snappy (280ms, slight overshoot); chevron on the same timing | **Locked: Smooth** (owner: first option on every one) |
| m7 | Toast · Undo, Saved, Discarded, Added | Rise 10px + fade · Scale in from 94%; 3s; above keyboard or tab bar | **Locked: Rise** (owner: first option on every one). Owner 2026-11-10: toasts only for Undo; Saved, Discarded and Added dropped |
| m8 | Numbers change · Session detail after Save, any stat that updates | Digits roll (iOS numeric text, 450ms) · Crossfade; only on a real change | **Locked: Digits roll** (owner: first option on every one) |
| m9 | Charts arrive · Program summary recovery chart, Home recovery bars, phase bar | Bars grow from the axis (500ms, 40ms stagger, once per visit) · Appear | **Locked: Bars grow** (owner: first option on every one) |
| m10 | Tick a protocol · Session detail edit, any selection circle | Check pops (snappy) · Fade (150ms). Selection haptic | **Locked: Check pops** (owner: first option on every one) |
| m11 | Pressing a card · Home cards, History rows, Calendar day card | Press in to 98% + spring back · Dim only. No haptic | **Locked: Press in** (owner: first option on every one) |

## Haptics (locked, owner 2026-11-09)

| Haptic | When |
|---|---|
| Success | Saving an edit (✓); saving the check-in; later, finishing a workout and a new PR |
| Light impact | A set deleted by swipe; Add set; a set or exercise returning on Undo |
| Selection | Ticking a protocol; History quick pills and filter options; the check-in slider stepping through numbers. Pickers, wheels and the calendar play their own |
| None | Navigation, scrolling, opening sheets and menus, typing, toasts, charts, pressing cards. Destructive dialogs use only the system's |

## Not covered yet

Screens not designed (Progress, Exercise detail, the workout flow, Run, Library, Exercises, Settings, program complete, launch) get their motion when they're designed, using these rules. The workout flow will need the most: rest timer, set completion, PR moment, workout complete.

After turn 1 (owner, 2026-11-09): the first option on all eleven moments, keep it simple. The proposed rules and the haptics table are still unreviewed.
Owner (2026-11-09): rules and haptics table locked ("makes sense"). Existing demos pick up the locked motion when each screen is next revisited.

## Retrofit list · demos still missing motion (done below)

Owner (2026-11-09, from the APEX App Demo): another motion pass on the existing demos, not urgent. First one seen: the History filter sheet just appears; it should rise like an iOS sheet with the list dimming behind it (system sheet motion).

Others in the same family, found in the demos (all should follow the locked rules and system motion):
- Session detail: the ••• menu, the confirmation dialogs and the Add exercise sheet appear instantly (system menu, dialog and sheet motion).
- Session detail: the number pad and text keyboard appear instantly (system keyboard rise).
- History: quick pills and filter picks swap the list instantly (rows should ease in and out, smooth).
- Program summary: "Show N more" (expand in place, smooth, locked m6) and chart bars (grow, locked m9).
- Session detail: Save back to read (numbers roll, locked m8), read ↔ edit (fields grow in place, locked m1).

### Retrofit done · 2026-11-09

Applied to the reference builds (and so to the APEX App Demo):
- History: the filter sheet rises from the bottom (420ms, iOS sheet curve) over a fading dim, and sinks back on close (300ms). After a filter or quick pill changes, the list eases in (320ms smooth).
- Home: This week, Recovery and Program cards press in to 98% and spring back; recovery bars grow up from the base after the cards rise.
- Program summary: "Show N more" grows open (350ms smooth); recovery chart bars draw out from the axis (500ms, 40ms stagger) the first time the chart scrolls into view.
- Session detail: ••• menu scales in from its corner; confirmations rise over a fading dim; Add exercise sheet rises; number pad and text keyboard slide up; read ↔ edit fades and the edit fields fill in place; changed top-card numbers roll in after Save (only the ones that changed); toasts rise; Add set grows the new row open; a removed exercise fades, then the gap closes; protocol checks pop in.
Approximations in the mocks: springs are CSS curves; the read ↔ edit morph is a fade plus fields filling in, because the read and edit layouts differ above the exercises.

### Toasts · owner 2026-11-10

Toasts are kept for one job only: Undo after a set is deleted by swipe (no confirmation there, so Undo is the safety net). Saved, Discarded, Added and the other confirmation toasts are gone because the screen already shows the result (read mode, rolling numbers, success haptic, the new row). Removed from the Session detail demo (Changes saved, Changes discarded, exercise added, exercise removed) and the Home check-in (Saved · pain N of 10; the card collapsing shows it). Demo-only notes that stand in for screens not built yet ("Opens Settings", "Back to History") are not app toasts and stay in the standalone demos. In the APEX App Demo, Delete session now goes back to the previous screen.

### Set delete smoothing · owner 2026-11-10

Owner: deleting a set jerked; the row should fade and shrink vertically while the rows below rise gradually, not slow but smooth. Now: the row's height closes over 300ms (ease in-out) as its content fades (200ms) and squashes slightly, and the rows below move up in step with it. Cause of the jerk in the demo: once the row was removed, the rows below re-ran their own height animation. Fixed, and the same fix makes Undo grow the set back open (300ms) and Add set grow the new row open over its full 300ms.
Owner 2026-11-10, after trying it: "looks great", lock it. **Locked:** set delete = height closes over 300ms (ease in-out), content fades over 200ms and squashes slightly, rows below rise in step; Undo grows the set back open over 300ms.

### Progress period changes · owner 2026-11-12

Locked (Progress Explorations 23a): changing the range chip morphs the charts over 600ms ease-in-out and counts every number to its new value; the arrows slide the period in 40px from the side you move toward, 420ms. Charts grow once on arrival, not on every change. No haptics. A deliberate exception to the 300–350ms smooth timing, for this screen.

## Turn 2 · the workout flow (started 2026-11-24)

Added to Motion Explorations as a new turn above turn 1 (owner 2026-11-24: new decisions get a new numbered turn; earlier turns are left as they were). The live version of every moment is in Workout Session Demo; the turn is the record. Taken in seven groups, one at a time: 1 Logging a set · 2 Finishing an exercise · 3 Timed sets · 4 Moving through the workout · 5 Finishing the workout · 6 Changing the plan · 7 The landing page.

Superseded by the owner's rule of 2026-11-24 (large titles use Apple's standard): "Home: header collapses over the first 56px of scroll, wordmark 26 › 17" in the Already locked table. Large-title behaviour was already listed as system-owned.

### Group 1 · logging a set (built 2026-11-24, in review)

| Id | Moment | Motion | Stamp |
|---|---|---|---|
| w1 | Tick a set | Ring fills moss over 180ms; the check pops in with a small bounce, 320ms (the m10 pop) | Follows a locked rule |
| w2 | The row settles | Logged numbers dim, the next set's ring turns blue; 180ms colour fades; nothing moves | Follows a locked rule |
| w3 | Rest countdown | Fades in top right over 200ms on log, counts down each second, fades out when it ends or is tapped; always in the layout, so no shift (the earlier round locked "starts on log, no layout shift"). Same on a superset's header | Looks good (owner 2026-11-24), from the page; not yet tried in the demo |
| w4 | Untick the last set | Fill and check fade out over 180ms, no pop; the countdown fades with them | Looks good (owner 2026-11-24), from the page; not yet tried in the demo |
| w5 | Haptic, logging a set | Proposed: light impact. Alternative: selection, as for ticking a protocol. Not in the haptics table | Unreviewed |
| w6 | Haptic, rest runs out | Proposed: one haptic at zero; type and strength to settle on a device. Alternative: nothing | Unreviewed |

Demo: a line above the phone names the haptic that would play, marked proposed. Rest is 2:00 on the weighted card and 1:00 on the superset, so the rest-over cue takes that long to appear. Not built yet: the timed card's rest (group 3). Related and not part of motion: the earlier round's wish for the rest countdown to live on the lock screen.

Owner (2026-11-24): went over all the motion on the Explorations page, without a full test in the demo: "everything looks good", except m3 (below). On the two haptic questions (w5, w6): "I need to see both options. I don't really know what you're saying here. Can you maybe put it in the motion explorations?"
- w3 and w4 marked "Looks good (owner), not yet tried in the demo". Not stamped Locked, since he said he had not tested them in the demo.
- w5 and w6 are now live tiles in turn 2, each with its two options to switch between: w5 A · Light impact / B · Selection tick; w6 A · A firm tap at zero / B · Nothing. A browser cannot play a haptic, so each tile names the haptic when it would play, shows a three-bar strength meter (drawn, relative), and says in a sentence what each one is and where the app already uses it. Both Unreviewed. Claude's suggestion: A on both.

## Turn 3 · m3 changed (2026-11-24)

Owner: "I want to do slide out then collapse for m3. It's not that big of a deal but I think that looks better."
**Locked:** a set deleted by swipe slides off to the left (180ms), then the gap closes over 300ms while the rows below rise with it (the close keeps the smoothing locked on 2026-11-10). Light impact, as before. Undo is unchanged: the set grows back open over 300ms. This replaces turn 1's "Collapse in place". Recorded as a new turn 3 with a live tile; turn 1 is left as it was. README updated.
Not yet updated to the new motion: Session Detail Demo and the APEX App Demo still collapse the row in place (on the checklist, follow-ups).

### Haptics parked · owner 2026-11-24

Owner tried to feel w5 and w6 on his phone from the page; a web page cannot play haptics (the page only names them). Given a scratch SwiftUI screen (HapticTest.swift) to feel them on a device. His decision: "we should just park the haptics until later", "right before we start implementing", "do them all at the end", which will also show "how many haptics we're actually adding into the app".
**Parked:** every haptic decision for the workout flow, w5 and w6 included. They are decided in one pass on a real phone, right before the build, together with a count of all haptics in the app. Until then new groups list their haptic ideas as proposals only and ask nothing. The haptics table locked on 2026-11-09 stands. On the checklist.
Proposals collected for that pass so far: logging a set (light impact, or the selection tick) · rest runs out (a firm tap, or nothing).

### Group 2 · finishing an exercise (built 2026-11-24, in review)

| Id | Moment | Motion | Stamp |
|---|---|---|---|
| w7 | The RPE row arrives | Grows open under the last set over 350ms, no bounce | Follows a locked rule |
| w8 | The progression prompt arrives | Grows open under the slider over 300ms | Follows a locked rule |
| w9 | The card closes | Body fades out (180ms) while the height closes to the one-line row over 350ms; the name stays put and dims; "3/3 ✓ · RPE 8" fades in (250ms); cards below rise with it | Unreviewed |
| w10 | A card opens | Grows back open over 350ms, the reverse of closing; the next exercise opens the same way | Unreviewed |
| w11 | The header keeps up | Progress bar fill glides to its new length (350ms); the exercise count rolls (m8) | Follows a locked rule |

Demo: built on the Incline Bench Press card only. The superset's members and the other cards still switch instantly, and the count does not roll. No haptic proposed for finishing an exercise.
Raised, not designed: what happens in the live workout when a logged set is a PR. Nothing is drawn for it (the first-pass placeholder "PR tag on the set and on the closed card" was never reviewed; the haptics table mentions a success haptic for a new PR). To take as its own question.

### Where motion is reviewed · owner 2026-11-24

Owner: "Should group two also be in the motion explorations? I think that's easier than me trying to remember where to go for everything in the live demo."
Agreed and done: every moment of the workout flow is a live tile on Motion Explorations turn 2, with its own controls, so nothing has to be set up or found. Groups 1 and 2 are now tiles (w1–w4 logging a set · w7, w8 the RPE row and the prompt · w9, w10 the card closing and opening · w11 the header). Later groups are built there first. The Workout Session Demo carries the same motion for one run-through in place once all seven groups are agreed; it is no longer where review happens.
Stamps unchanged: w1, w2, w7, w8, w11 follow locked rules; w3, w4 "Looks good (owner), reviewed as text" before the live tile existed; w9, w10 Unreviewed.

Owner (2026-11-24): "Are these w7 to w11 supposed to have other options, or are we just having one option?"
Answer given: one each. w7, w8 and w11 apply rules already locked (smooth grow, no bounce; the m8 digit roll), so there is nothing to choose. w9 and w10 are the only place a new choice was made, and only one treatment had been drawn. A second is now on the tile to compare: A · Fade while it closes (the body fades as the height closes, one movement, 350ms) · B · Fade, then close (the body fades first, 150ms, then the card closes, 300ms; the pattern locked for a removed exercise, m5). Opening is each one in reverse. Unreviewed. Claude's suggestion: A.

Owner (2026-11-24): "I think these all look good. And I'll go with A on w9, w10." Asked: "did we review the motion on the RPE slider itself?"
- **Locked:** w9 and w10 = A · Fade while it closes: the body fades out (180ms) as the card closes to its one-line row (350ms), the name stays put and dims, "3/3 ✓ · RPE n" fades in once closed (250ms), the card below moves with it; opening is the reverse. B (fade, then close) rejected.
- w7, w8 and w11 seen live and approved with the rest ("these all look good"); they follow locked rules.
- Answer on the slider: no, it had not been reviewed. The w7 tile used buttons in place of a real slider, and the earlier round locked what the slider does (no dot until first touch; letting go saves the rating and closes the card) but never its motion ("Slider thumb materialize + snap" and "Card collapse after effort release: timing" were on that round's to-do list). Two tiles added to group 2, both Unreviewed:
  - w12 · The RPE slider: A · Hops between numbers (the dot only sits on a number and hops, 120ms each; how the demo behaves today, minus the easing) · B · Follows your finger (moves freely, settles on the nearest number on release, 220ms with a small settle). In both the dot fades in at 60% size and grows to full on first touch (150ms), the line fills blue up to it, and the number changes at each stop. Claude's suggestion: A.
  - w13 · After you let go: A · A short beat (450ms), then the card closes · B · Closes at once (how the demo behaves today). Claude's suggestion: A.
- For the parked haptics pass: a selection tick per number on the RPE slider (the check-in slider already has one in the locked table).
- From the earlier round's motion to-do list, to carry into the remaining groups: superset member handoff as one motion, the open member closing while the next opens (with A these run together over 350ms; to build with group 2's motion) · Finish button arming · the Workout complete moment · reorder lift and drop.

Owner (2026-11-24): "for w12, let's do A and also A for w13. Just a short beat. I don't know how long, half a second, just under half a second, yeah. Just so that you can actually see it a little bit, doesn't look like it just glitched."
- **Locked:** w12 = A · the RPE dot hops between numbers (120ms each), fading in and growing on first touch (150ms), the line filling blue up to it. B (follows your finger) rejected.
- **Locked:** w13 = A · after you let go, the card waits a short beat, just under half a second (450ms), then closes. B (closes at once) rejected.
- Group 2 is complete. Still to raise on its own: what happens when a set is a PR.

### Group 3 · timed sets (built 2026-11-24, in review)

One live tile, w14, Unreviewed. No options: each step is a quick fade or the tick pop already locked.
| Step | Motion |
|---|---|
| Start | ▶ fades to ■ (150ms); the clock fades in at the top right (200ms); the time in the row runs |
| Stop | ■ becomes the green tick with the w1 pop; the time stays in the row and dims (180ms); the top right becomes the rest countdown and the word Rest fades in (200ms); the next ring turns blue |
| A set time reaching zero | Stops itself the same way |
The last timed set brings in the RPE row and closes the card as in group 2. For the parked haptics pass: starting, stopping, a set time running out.

### Workout Session Demo · to bring in line at the end

Review now happens on the tiles, so the demo is synced once, after all seven groups, for the run-through. Outstanding: the slider's hop easing and first-touch grow (w12); the 450ms beat before the card closes (w13; the demo closes at once); the superset's members and the other cards opening and closing (w9, w10; only Incline animates); the exercise count rolling (w11); the timed card's fades (w14).

Owner (2026-11-24) on w14: "this looks pretty good. Just to confirm though, when the rest timer finishes, it doesn't automatically start, right? It shouldn't. And then the last timed set when it completes, it should pop up the slider. It doesn't look like it's doing that today."
- **Confirmed (owner):** rest running out never starts the next set. The countdown fades away and the next ▶ waits for a tap. (Consistent with the earlier round: rest is information, not a gate.) The tile already behaved this way; now stated on it.
- Fixed on the tile: the last timed set now brings in the RPE row (grows open under the sets, 350ms, as w7), with a working slider. The tile had only described this in a note. The Workout Session Demo already showed the RPE row after the last timed set.
- w14 otherwise "looks pretty good" (owner); not stamped Locked until he has seen the fixed tile.

Owner (2026-11-24): "Nice. Yeah, 14 is locked." **Locked:** w14, the timed set (start, stop, a set time stopping itself, rest starting nothing, the last set bringing in the RPE row). Group 3 complete.

### Group 4 · moving through the workout (built 2026-11-24, in review)

| Id | Moment | Options | Stamp |
|---|---|---|---|
| w15 | Start Workout, landing page to session | A · Fades through: the landing page fades out (150ms) and the session's parts rise in one after another (12px, 420ms, 55ms apart; Home's locked arrival) · B · Slides up over it: the session covers the landing page from the bottom (420ms), like a full-screen sheet. Either way the tab bar stays and the clock starts on the tap | Unreviewed. Claude's suggestion: A |
| w16 | Switching tabs, and Continue | A · Slides the way you are going: the new tab's content comes in 28px from the side you move toward with a fade, 260ms (Calendar's locked month flip) · B · Fades in place (200ms). In both the control's highlight glides to the picked tab (system control) and the new tab starts at its top | Unreviewed. Claude's suggestion: A |
| w17 | The button turns ready | Continue fades from tonal to blue, Finish workout to moss, 180ms; same size and shape (locked), the plain fade of m2 | Follows a locked rule |

Not surfaced as an option: the earlier round's to-do list floated a left-to-right fill sweep for Finish becoming ready; the locked rule for a control becoming ready is the plain fade (m2), so w17 follows that.
Ticking a protocol and opening its steps are already locked (m10, m6).
Order from here: group 4, then the open question of what happens when a set is a PR (a design question, to go on Workout Explorations as a new turn), then group 5.

Owner (2026-11-24): "A for both 15 and 16, and then yeah, 17 looks good."
- **Locked:** w15 = A · Start Workout fades through: the landing page fades out (150ms) and the session's parts rise in one after another (12px, 420ms, 55ms apart). B (slides up over it) rejected.
- **Locked:** w16 = A · tabs and Continue slide the way you are going: the new tab's content comes in 28px from that side with a fade, 260ms; the control's highlight glides to the tab. B (fades in place) rejected.
- w17 approved ("looks good"); it follows the locked m2 fade.
- Group 4 complete. Next: the PR question, drawn as Workout Explorations turn 16.

### w18 · a PR tag arrives (added 2026-11-24, after Workout Explorations turn 16 locked 16b)

Live tile in group 2, Unreviewed. The tick fills and pops first, as for any set; the tag follows 150ms later. A · Fades in (180ms), nothing else · B · Fades in with one soft moss pulse spreading from the tag (900ms, once); this would be a new use of the pulse, which the glow rule keeps for something newly due. Unticking removes the tag at once. The closed row's tag arrives with the row. Claude's suggestion: A. For the parked haptics pass: the locked table already gives a new PR the success haptic; whether it replaces or follows the set's own tap is to settle then.

Owner (2026-11-24): could not find w18 on the page. It was the last tile of group 2, below the tiles he had already reviewed. Added a "Waiting on you" box pinned to the very top of Motion Explorations: it lists whatever is open, says where it is, and has a button that scrolls to it. Kept up to date with every change from here on.

Owner (2026-11-24) on w18: "I think A is fine. I don't want to do too much action here. It's a pretty small moment anyway." **Locked:** w18 = A · the PR tag fades in beside the reps (180ms), 150ms after the tick; nothing else moves. B (with a pulse) rejected. Group 2 complete.

### Group 5 · finishing the workout (built 2026-11-24, in review)

| Id | Moment | Options | Stamp |
|---|---|---|---|
| w19 | Finish workout, into Workout complete | In both: the workout fades out (150ms) and Workout complete's parts rise in order (title, green card, sections, Done), the w15 arrival; numbers do not count up (m8: digits roll only on a real change). A · Rises in, nothing more · B · then the green card glows once (a soft moss glow swelling and fading, about a second) | Unreviewed. Claude's suggestion: B |
| w20 | Done, back to the Workout tab | In both: Workout complete fades out and the landing page rises in, the day card already reading Done. A · Today gets ticked as you watch: the page arrives with today as a blue "20", then the circle fills moss and the tick pops (m10 pop) about 750ms after the tap · B · Today is already ticked on arrival | Unreviewed. Claude's suggestion: A |

The success haptic for finishing a workout is in the locked table (shown on the w19 tile). The untouched-exercises sheet and the push to Session detail are system motion.
The "Waiting on you" box at the top of the page now lists w19 and w20.

Owner (2026-11-24) on group 5: "I'm leaning B [on w19], but I wanted to see if we can do it differently. Can we change up the pulse? Maybe do a different type of pulse. More of a radiating one. It'd be cool if you actually did a pulse, but it went around the circle or around the card in a wave. Just a few different pulses. Because I agree, I think we should do a pulse here because this is kind of the biggest thing here. And maybe even highlight specific PRs as well, like if we do a PR, maybe PR should be radiated. For 20, I like A for sure. You can lock in A for 20."
- **Locked:** w20 = A · today gets ticked as you watch (the landing page arrives with today as a blue "20"; about 750ms after the tap the circle fills moss and the tick pops). B rejected.
- w19: **leaning a pulse** (owner), which one not chosen. The tile now offers: A · No pulse · B · Swell (the glow he saw: swells around the card and fades, 1s) · C · Radiate (two rings spread out from the card's edge and fade, 1.1s) · D · Around the edge (a point of light runs one lap of the card's border, 1.5s) · E · Sweep across (a band of light crosses the card left to right, 1s). All start about 0.7s after the tap, once the card has landed. Play again repeats it.
- New, from his idea, not decided: PR rows pulse too. A second switch on the tile: each PR's moss label sends out one small ring in turn (0.9s each, 250ms apart, just after the card's pulse), or the rows stay still. Note for him: this is the tag ring he turned down for the in-workout PR tag (w18 B); there it was a small moment, here it is the celebration screen.
- This widens the glow rule (the pulse was only for something newly due). To write into the README once the choice is made.

Owner (2026-11-24) on w19: "I don't like C, but I'm kind of open to the others. But I wonder if this workout complete should actually kind of be almost a mini story. You start with this workout card and you don't display all the content immediately. You do the animation and then you slide in the PRs or you drop them in... some sort of animation to pop them in and then after that you display everything else. Then it kind of presents things one at a time, not really slowly, nice and smooth, and you shouldn't feel like you're waiting for anything."
- C (Radiate) **rejected**. A (no pulse) dropped from the tile: he wants a pulse here. B, D, E remain.
- w19 rebuilt as a short story, in progress, nothing locked. Three beats, about two seconds from the tap to Done, each starting before the last has finished so nothing waits:
  1. 0.12s: the title and the green card rise in (the w15 arrival); 0.65s: the card's pulse (B swell 1s · D one lap of the edge 1.5s · E sweep 1s).
  2. 1.05s: the PRs section appears; its rows come in one at a time (1.15s, 1.31s; 320ms each), each PR label sending out one small ring 200ms after it lands.
  3. 1.65s: everything else (Added, Swapped, Skipped) and Done rise in together.
  A tap anywhere on the screen jumps to the end. With no PRs, beat 2 is skipped.
- Switches on the tile: the pulse (B, D, E) · how the PRs arrive (rising in, 10px · sliding in from the right, 24px) · pacing (one at a time · all at once, as before, to compare).
- Held to the locked rules: content arriving never bounces, so the PRs rise or slide but do not drop with a bounce or pop; numbers do not count up.

Owner (2026-11-24) on the w19 story: "I would like you to tweak the swell. It's very abrupt ending. I think a nice smoother swell might actually be the play. But it just grows a little bit and then boop." "I think the PRs rising in is good, but I wonder if we should maybe do a little bit different of an animation, kind of like animate that drop-in better. And then we don't need the pulse on the PR label itself. You can take a little bit more time on the PR coming in and then we can get rid of the pulse there."
Changed on the tile, nothing locked:
- B · Swell is now two seconds instead of one, and no longer shrinks back: the glow blooms for about 0.75s, then keeps drifting outward while it fades over the remaining 1.25s, so there is no visible end. He is leaning B ("might actually be the play"); D and E stay on the tile until he decides.
- PR rows: the ring on the label is **removed** (owner). Each row now takes 520ms (was 320ms) on a softer landing curve, travelling 14px, and the second follows 240ms after the first. The switch offers Rising in (from below) or Dropping in (from above; no overshoot, since content arriving never bounces). Sliding in from the side is dropped: he said rising is good.
- The story now runs about two and a half seconds from the tap to Done (was about two).

Owner (2026-11-24): "I'll go with Option D. Also, PRs rising and one at a time you can lock in too."
**Locked:** w19, Workout complete as a short story: the title and earned card rise in; D · a point of moss light runs one lap around the card's edge (1.5s); the PRs rise in one at a time (520ms each, 240ms apart, no ring on the labels); then everything else and Done. About 2.5s from the tap, a tap skips it. B (swell), C (radiate), E (sweep), PRs dropping in, and all at once are rejected. Group 5 complete. The glow rule gains this one addition (README, project rules). README motion section now summarises groups 1 to 5.

### Groups 6 and 7 (built 2026-11-24, in review; no options)

| Id | Moment | Motion | Stamp |
|---|---|---|---|
| w21 | An added exercise arrives | The card grows open in place (300ms) with a blue tint fading over 600ms; cards below move down (m4's arrival). Removing one in Reorder uses turn 3's swipe-delete | Follows a locked rule |
| w22 | A swap | Name and line fade over to the new exercise in place (240ms) with the Swapped tag; Undo fades back | Follows a locked rule |
| w23 | Reorder | The picked-up row lifts (2% larger, shadow) and follows the finger; others glide out of the way (250ms); on release it drops into its slot with a small settle (280ms) | Unreviewed |
| w24 | Switching days on the landing page | The white mark under the strip glides to the tapped day (250ms); the card and lists fade in for that day (240ms, Calendar's locked fade) | Unreviewed |

Owner (2026-11-24) on groups 6 and 7: "None of these have alternatives. We should have at least 2 options for each."
- **Working rule (owner), added to the project rules:** every moment or screen up for review gets at least two options, even where one just applies a locked rule.
- All four tiles now have A and B, all Unreviewed, Claude's suggestion A on each:
  - w21 added exercise: A · grows open with a tint (300ms, tint fading 600ms; m4) · B · a gap opens (280ms), then the card rises into it (300ms), no tint.
  - w22 swap: A · fades over in place (240ms) · B · rolls up into place from 10px below (280ms).
  - w23 reorder: A · lifts (2% larger, deeper shadow) and settles with a small bounce (280ms) · B · stays flat with a soft shadow and glides in with no bounce (250ms).
  - w24 switching days: A · the card fades in place (240ms) · B · it slides in from the side of the tapped day (28px, 260ms). The mark under the strip glides in both.
- Earlier single-treatment tiles he approved as they were (w7, w8, w11, w14, w17) are left alone unless he asks.

Owner (2026-11-24): "21: A · 22: B · 23: A · 24: B."
**Locked:** w21 = A (grows open with a tint) · w22 = B (the new name and line roll up into place; A, fades over, rejected) · w23 = A (lifts and settles) · w24 = B (the card slides in from the side of the tapped day; A, fades in place, rejected; the mark glides either way). The other option on each is rejected.
All seven groups of the workout flow are now decided. README motion section updated. Open: the haptics pass (parked), and bringing the demos in line for a run-through (list above, plus: the PR tag and its fade, the tab slide, the Workout complete story, the added-card arrival, the swap roll, the reorder lift and settle in the Session demo; the day slide and mark glide in the Landing demo; Start Workout and Done cross from one demo page to the other, so those two transitions only play once the flow is in the whole-app demo).

### Demos brought in line · 2026-11-24

Owner: "Sounds good. Do it."
Workout Session Demo now carries: the RPE dot hopping and growing in on first touch (w12, Incline and superset sliders) · the 450ms beat before a card closes (w13, Incline and superset) · the PR tag on the set and the closed row (16b, w18; in the sample, set 3 at 95 lb × 8 beats last time's 7 reps, and any set above 95 lb counts) · tabs and Continue sliding the way you go (w16; the header stays still) · end buttons fading to ready (w17) · Workout complete as the short story with the light around the card's edge and the PRs rising in one at a time (w19) · an added exercise growing open with a tint (w21) · a swap rolling the new name up (w22). Already there from before: logging a set, the rest countdown, the RPE row and prompt, the Incline card closing and opening.
Workout Landing Demo now carries: the mark under the strip gliding, and the day's card and lists sliding in from the side of the tapped day (w24).
Not built in the demos (the tiles on Motion Explorations are the reference for these): the exercise count rolling (w11) · the timed card's icon and clock fades (w14) · the superset's members and the other cards closing and opening (w9, w10; only Incline animates) · the reorder lift and settle (w23; the sheet drags as before) · a tap skipping the Workout complete story · Start Workout (w15) and Done (w20), which cross from one demo page to the other and wait for the whole-app demo.
Checked by running the flow: Warm-up to Exercises, three sets, the PR tag, rating, the beat, the card closing, then Workout complete; and tapping days on the landing page. No script errors.

Owner (2026-11-24), after a pass through the Session demo: "The animation for the completion circles on the Warm-up and Post are different than the Exercises. They should have the same motion animation across these. Rest is looking pretty good so far. I didn't do a deep pass but looks decent otherwise."
- **Rule (owner):** a tick moves the same everywhere in the workout: protocol ticks on Warm-up and Post-workout fill and pop exactly like set ticks (fill 180ms, check pop 320ms). Fixed in the Workout Session Demo; the protocol ticks had only a plain colour change there. This is what m10 and w1 already said; the demo had not followed it on those two tabs.

## Turn 4 · switching tabs on the tab bar (2026-11-25)
Owner (2026-11-25), after the whole-app run-through: "switching between the navigation tabs at the bottom, home workout programs. I think we need to think about the motion for those. I don't think that full app demo has good motion for that yet." Locked 2026-11-09 (System-owned, above): tab switches use the iOS version. The whole-app demo swaps the screen and jumps the highlight. Three live tiles; in all three the glass highlight slides to the picked tab (380ms, small spring) and the tab bar never moves.

| Id | Option | Stamp |
|---|---|---|
| 4a | iOS standard: the screen changes at once | Unreviewed |
| 4b | Quick crossfade: the new tab fades in over the old, 200ms (custom tab container) | Unreviewed |
| 4c | Slides the way you go: in 28px from that side with a fade, 260ms, as the workout's tabs (w16) (custom tab container) | Unreviewed |

Tiles use full-screen images of Home, Workout and Progress as built; Run is a placeholder. Claude's suggestion: 4a (the locked rule; what was missing in the demo is the sliding highlight); 4b if instant feels abrupt.
Owner (2026-11-25): "Yeah 4a is cool then if this is standard." **Locked:** 4a, tab switches stay the iOS behaviour (as locked 2026-11-09): the new tab's screen is there at once and the glass highlight slides to the picked tab. 4b, 4c rejected. Built into the whole-app demo (the highlight slides from the old tab to the new one, 380ms; the screen switches at once). README Motion section updated.
Built 2026-11-25: m3 (slide out, then the gap closes) is in the Session Detail Demo and the whole-app demo.
Owner 2026-11-25 (Session Detail turn 14): no Undo toast after a swiped set, so m3 ends when the gap has closed.

### Turn 5 · 2026-11-26 · program overview, Programs, preview, program actions
Ben: "Yeah, we definately will need to improve the motion on these pages/transitions" … "Motion pass quickly". Applied from locked rules: iOS sheet rise/sink; dialogs rise over a fading dim and sink; week rows open/close in place (m6, 350ms, chevron same timing); week bars grow from the left once per visit (m9); Programs cards press in (m11); menus scale from the corner. Haptics: none new; Change schedule Save = success.

| Id | Moment | Built (Claude's pick) | Alternative | Stamp |
|---|---|---|---|---|
| p1 | End Program → the summary | Pushes in like any screen; the overview is taken out of the stack under it, so Back goes Home | Crossfade in place (420ms, as Start Workout’s fade-through) | **Locked** |
| p2 | Pause / Resume on the overview | The paused card grows open at the top (smooth 350ms, its content fading in just after); Resume fades it, then closes it; this week’s bar and Ends change at once | Crossfade the whole top (200ms) | **Locked** |
| p3 | Home changing state (paused, ended, resumed) | The new top card fades in (240ms, as Calendar’s day card) | Rise (12px fade-up, as Home on load) | **Locked** |
| p4 | Weeks | Progression | The new tab’s content comes in 28px from the side you move toward (260ms), as the workout tabs | Crossfade (200ms) | **Locked** |
| p5 | Programs on arrival | Cards rise in (12px, 420ms, 55ms apart), as Home on load; their week bars grow in after | Appear with the push, no stagger | **Locked** |
| p6 | Change schedule, picking a day | Your week’s day labels change at once (a quick state change) | Day labels roll (10px, 280ms, as Swap’s name roll) | **Locked** |
Where to look: p1: APEX App Demo only: Jump to › Program overview, then ••• › End program › End Program. · p2: Program Overview Demo: ••• › Pause program › Pause Program, then Resume program on the card. · p3: Home Demo: the Active / Paused / Ended buttons beside the phone (or the Program state switch in the APEX App Demo). · p4: Program Overview Demo or Program Preview Demo: the Weeks | Progression switch under the top card. · p5: Library Demo: reload the page to replay (or APEX App Demo: Program overview › ••• › Browse programs). · p6: Program Overview Demo: ••• › Change schedule, then tap the day pills.
Ben: "just do it on the motion explorations like you did for all the rest. We did it so that you can watch it and reset it right on the screen here. I don't want to be flipping between all these". Turn 5 is now live on Motion Explorations: one phone per moment (p1–p6), both options as pills, replay/reset buttons (gen_motion5.py).
Ben: "Honestly, all of the built ones are the ones I want, so we're good, I think." **Locked:** p1–p6 as built.
