# Workout flow: notes for the build

The demos and mocks are the design. Build from them:

- `APEX App Demo.dc.html`: the whole loop in one phone. Workout tab › Start Workout › the live workout › Workout complete › Done › today ticked › View session.
- `Workout Landing Demo.dc.html`: the Workout tab at rest, with a This week switch for every state of the page.
- `Workout Session Demo.dc.html`: the live workout, with switches and Jump to for states that are slow to reach by hand.
- `Motion Explorations.dc.html`, turns 2 and 3: every moving moment as a live tile. Where a demo and a tile differ, the tile is right.
- `Workout Explorations.dc.html`: every option that was considered. Only options stamped Locked count; a later turn wins over an earlier one.

This page holds only what you can't see by using the demos: rules, numbers, edge cases, where the demos fall short, and what is still open. The history, with the owner's comments, is in `workout-decisions.md` (this round), `logging-decisions.md` (the earlier logging round) and `motion-decisions.md`. App-wide rules, and every size, colour and timing for this flow, are in `APEX README.md`; they are not repeated here.

## The Workout tab at rest

- The tab opens on today, also when today is a rest day. It shows this week only; there is no way to flip weeks. Other weeks belong to Calendar.
- Every day on the strip can be tapped, rest days included.
- A circle on the strip is that day's planned session, not that date. It is ticked once that session is done, whatever day it was done on, and dashed when its day has passed and it isn't done. Calendar and Home's This week card use the other meaning (a day is ticked when something was done on that date). The same week can therefore look different here and on Calendar; that is intended.
- A session has a planned day and, once logged, a real date. "Done" belongs to the session, not the day. The day card states the real date when the two differ ("Done Tue, Aug 18").
- The button follows the session's state. Today's own session: Start Workout. Any other session of this week that isn't done, past or upcoming: Do this today. A done session: View session.
- Catching up moves nothing. Doing Monday's session on Tuesday leaves Tuesday's session on Tuesday, unfinished, and it can itself be caught up later in the week. A done session can't be done again. Nothing crosses into another week.
- More than one session can be logged on a day. Do this today stays available after you have trained today. Nothing in the data or the screens may assume one session a day.
- A day's own session keeps the card. Anything else logged that day is a row in a second card straight under it: Logged today or Logged that day when the day's own session isn't done, Also logged today or Also logged that day when it is. A session row there opens that session.
- A logged row is a generic activity (name, start time, duration, distance), not a run. Do not tie it to the run records; a bike ride or any other cardio must fit later without a redesign.
- A done day shows What you did: one row an exercise, PR tagged, no warm-up or post-workout lists. Sets are written "4 × 8" when every set matched, otherwise each set ("5, 5, 5, 4 · 45 lb"), so a missed rep isn't hidden. Today, once done, looks like any other done day.
- A preview row shows sets × reps · weight with the RPE cap under it, and the percentage where the program prescribes one.
- With no program the tab shows Home's No Active Program card.
- A duration of an hour or more is written "1 h 23 m", as on Session detail.

## The live workout: how it sits in the app

- A live workout is the Workout tab. The tab bar stays; while a workout runs, the tab shows the workout, and the day view returns when it ends. Home shows its Resume card.
- Leaving the tab and coming back keeps the workout as it was.
- The clock starts when the workout starts, not at the first logged set, so the warm-up counts.
- On arrival the first unfinished exercise is open with set 1 ready and its numbers filled in from the plan: one tap logs it.
- A part the workout doesn't have gets no tab. With only exercises there are no tabs at all.
- Warm-up and Post-workout ticks are optional. They never block Continue or Finish workout and never change Finish workout's colour.
- The exercise count in the header counts finished exercises. Each member of a superset counts as one exercise.

## Logging

- The line under an exercise's name gives today's target first, then last time: "RPE ≤ 8 · Last 160 lb × 8 · 8 · 8 · 8 · RPE 8". The two RPE numbers are different facts (today's cap, last time's rating) and both stay.
- Units live in the column heading, never in a row. A value derived from others (a pace) goes in the target line, never in a column.
- The card states the target in the unit the program used: a weight if the program gives a weight, a percentage if it gives a percentage. No percentage is worked out for a weight target.
- You can't add a set in a live workout. Sets come from the program.
- The next set to log is always the earliest unlogged one. A later set can be logged out of order.
- Tapping a logged tick un-logs it, with no confirmation. The numbers stay in the row, the next-set ring moves back to it, the rest it started stops, and anything derived from it (a PR tag, an answered prompt) is worked out again.
- Rest starts when a set is logged. It is the program's rest for that exercise, or the exercise's default. Tapping the countdown skips it. When it reaches zero nothing happens by itself.
- When the open card is scrolled out of view the countdown is simply not on screen; it is still running when you scroll back. Nothing follows you down the page.
- RPE is optional. The slider has no value until touched, and an unrated exercise is still finished.
- Releasing the slider keeps the rating. The card then waits 450ms and closes, unless a prompt is showing; then it stays open until ✓ or ✕.
- A finished exercise is not locked. Tapping its closed row opens it again with its tally and rating; changing a number changes the record and never un-finishes it.
- The first time an exercise is ever done there is no weight to fill in: the weight is empty, set 1 can't be ticked until a weight is entered, and the later sets take that weight once set 1 is logged.

## PRs during the workout

- The tag sits beside the reps of the set that set the record, from the moment it is ticked.
- Unticking that set, or editing it below the record, removes the tag at once.
- The app has two kinds of PR, est. 1RM and rep records. Workout complete names the kind.

## The progression prompt

The rule is in the README (Workout session, when the progression prompt shows). What matters for the build:

- Accessories only. An exercise's Lift type, in Edit exercise, says which it is: Automatic (the default) follows the running program when it includes the lift, otherwise the exercise's own default type (the big barbell lifts are main lifts); Main lift or Accessory overrides it.
- Up needs both: every set at its target reps, and a rating under the cap on the card. A cap of 8 means a rating of 6 or 7.
- Down needs two sessions in a row of the same exercise with missed reps or RPE 10. One hard day never triggers it. Both sessions count whichever way they were hard.
- The amount is the exercise's own progression step, set in Edit exercise (2.5 · 5 · 10 lb, 5 lb by default; 5 · 10 · 15 sec for a set time, 5 sec by default).
- ✓ changes next session's weight and nothing today. Undo is offered on the line that replaces the prompt.
- Leaving it unanswered is a no. It is not asked again that session.
- Never shown on a main lift, on a bodyweight reps exercise, on a timed set to failure, or in a deload block.
- If a set is edited or un-logged after the prompt was answered, work the answer out again.
- "Felt hard twice. Drop to 160 lb?" must stay on one line. The words have about 220pt beside the two buttons on a 390pt phone, and the sentence was chosen to fit with a weight as long as "242.5 lb". Check it on the narrowest phone the app supports.

## Timed sets

- Only one set can run at a time. While one runs, no other set can be started.
- A set time counts down and logs itself at zero with the set time as its value. Stopped early, it logs the time actually done. To failure counts up until stopped.
- Rest after a timed set is prescribed like any other rest. The app never works a rest out from how long you held.
- Only the rest is labelled on the clock. Nothing says "hold", since timed work can be a carry.
- A logged time is corrected by tapping it. The wheels count from the value already logged and never round it onto a grid, so opening the editor can't change a recorded time.
- Seconds move in steps of 5 for holds and carries and 1 for other timed work. This is a property of the exercise.

## Supersets

- One member is open at a time. Logging its set for the round closes it and opens the next member; after the last member of a round, rest counts down in the superset's header and the first member opens.
- The set number is the round number.
- A closed member can be tapped to open it. It can't be logged while closed.
- On the last round a member stays open after its final set so it can be rated, then hands on.
- A timed member is the timed card, unchanged: its running clock sits top right of the member, and the header keeps the rest countdown. The hold never starts by itself.
- A superset is one row in Reorder and moves as one.
- Each member has Detail · Swap · Note at its foot while it is open, like any exercise card. Swap swaps that member only, for today.

## Editing a set or a time

- ✓ keeps the change. Close, a swipe down or a tap outside discards it.
- All sets copies the open set's values to every set of that exercise.
- Typing a time takes digits only: 130 is 1:30.

## Swap

- Today only. The program is never changed from here, and the next session prescribes the original again.
- The swap is logged as a substitution under the original exercise.
- Sets, reps and the RPE cap stay the original's. The weight comes from your own last session on the substitute. No weight is ever estimated.
- With a percentage target, the percentage stays and applies to your max on the substitute, rounded to the nearest 5 lb.
- A substitute you have never done shows no weight: the weight is empty and the first set is the one you fill in. Those rows sort last in the list.
- A reason is optional. Picking one reorders the list and is recorded with the swap.

## Add exercise and Reorder

- Add exercise is today only. The sheet opens clean every time: no remembered filter, sort, selection or scroll position.
- Recent means logged in the last 30 days, whatever brought it into a workout (the program, a swap or an add).
- An added exercise takes its sets, weight and reps from your last session on it, and has no target line. One never done arrives with an empty weight.
- Do it next places the card straight after the exercise you are on.
- After adding or reordering from any tab you are on the Exercises tab, at the result.
- Only exercises added this session can be removed, and only in Reorder. A program exercise you won't do is skipped by not doing it.

## Skipping and finishing

- There is no Skip button anywhere. Finish workout is always available and never refuses; it only asks.
- The skip sheet lists exercises with no set logged. One with some sets logged is never listed: it was done, with less of it.
- A reason is per exercise and optional. Tapping the chosen reason again clears it.
- Finish workout saves the workout. Done on Workout complete saves nothing and only leaves the screen.
- Discard workout asks first, with the standard confirmation, and saves nothing.

## Workout complete

- The top card is Session detail's top card, drawn as the earned card. Its numbers must match what Session detail then shows for that workout.
- In the demo, Sets counts logged sets over planned sets (an added exercise adds to both) and Avg RPE averages the exercises that were rated. Whatever the app does, the two screens must agree.
- A section appears only when it has rows.
- The arrival plays once, takes about 2.5s, and a tap anywhere skips to the finished screen.

## Motion

Every timing is in the README (Workout flow, and Locked moments). The tiles on Motion Explorations are the reference. Reduce Motion and other accessibility settings are out of scope (owner 2026-11-25; README).

## Haptics

Parked. Every haptic in this flow is decided in one pass on a real phone before the build, with a count of all haptics in the app. `HapticTest.swift` is a scratch screen for feeling them. Until then only the app-wide table in the README stands: success for finishing a workout and for a new PR, selection for ticking a protocol. Proposals waiting for that pass:

- Logging a set: light impact, or selection.
- Rest reaching zero: one firm tap, or nothing.
- Each step of the RPE slider: a selection tick (the check-in slider already has one).
- A timed set: starting, stopping, a set time running out.
- Reorder: picking a row up and dropping it.

## Where the demos fall short

Things the demos do differently from the design. Build the design.

- Start Workout is one fade of the whole screen in the whole-app demo. The design is the landing page fading out and the workout's parts rising in one after another (tile w15).
- Only the Barbell Row card opens and closes with motion; the other cards and superset members switch at once (tiles w9, w10).
- Overhead Press and Hammer Curl are tap-to-finish stand-ins, not real cards. Swap and Note open only from the Barbell Row card; the superset members show all three, but only Detail opens.
- The exercise count doesn't roll (w11). The timed card's ▶ / ■ and clock don't fade (w14). Reorder drags without the lift and settle (w23). A tap doesn't skip the Workout complete arrival.
- The drop prompt isn't in the demo. Workout Explorations turn 21 is the reference.
- Tapping a logged hold inside the superset does nothing. It should open the time editor, as on a timed card.
- A never-done substitute shows a dash for its weight. It should be empty.
- Search isn't wired in Add exercise or Swap, and only Backspace works on the drawn keyboard.
- The main-lift exemption isn't shown: the sample's only main lift, Overhead Press, is a stand-in card.
- The live workout always starts with 4:12 on the clock and Weighted Pull-up already done.
- Session detail is one fixed sample. Whatever you log, View session shows the full 1 h 23 m session, and every row in History or Calendar opens the same one.
- History and Calendar list earlier Heavy Pull sessions with a different set of exercises.
- Session detail's tab bar highlights Home even when it was reached from the Workout tab.
- The status bar reads 9:41 in the live workout and 7:52 elsewhere.
- Motion Explorations tiles use an older sample's exercise names.
- The landing page's Run row opens nothing (the Run tab isn't designed).

## Applied, not yet confirmed by the owner

- On a set time, "every set hit its target" is read as every hold reaching its set time.
- Durations of an hour or more on Workout complete and the Workout tab, written as Session detail writes them.
- The heading "Also logged that day" for a past day with a second session.
- The look of the drop prompt (white weight, grey line after ✓), carried over from the earlier round and recorded with the wording he picked.
- The rest countdown fading in and out, and a tick fading out when un-logged (tiles w3 and w4): he said they look good from the description, before the live tiles existed. Never stamped Locked.

## Still open

- The haptics pass.
- Whether a set time gets a drop prompt.
- Ideas the owner raised and did not decide: the prompt on main lifts, to re-check the weight mid-program; offering more reps on a bodyweight exercise.
- What happens to a running timed set when you leave its card, for example by opening Detail.
- When more than one set of an exercise beats the old record, which sets carry the PR tag. The demo tags only the best one.
- PRs on a swapped-in exercise. The demo shows none.
- What a superset's rest does if you log the next round before it ends. In the demo it keeps counting.
- The rest countdown on the lock screen while the phone is locked or the app is in the background. The owner asked for it in the earlier round; a 2:00 rest outlasts the screen. Not designed.
- Any sign on the other tabs that a workout is running, beyond Home's Resume card.
- A workout that isn't in the program (#71).
- What a logged row other than a session opens, and rows for things other than a run.
- Programs whose cycle isn't a week.
- Distance exercises (their column, and wheels that snap to real intervals) were designed in the earlier round and have not been redrawn in today's style.
- For the consistency pass: a hold is written "30 sec" on the Workout tab and Session detail and 0:30 in the live workout; the unit text in the Time tile is a little smaller on Workout complete than on Session detail.
