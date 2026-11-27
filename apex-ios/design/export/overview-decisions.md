# Library and program overview — decisions log

Same rules as the other logs: every option in `Program Overview Explorations.dc.html` carries a stamp. **Locked** = stands · **Rejected** = turned down · **Superseded** = replaced by a later turn. **Highest turn number wins.**

## Scoping · 2026-11-26
Owner's answers: order "Overview first (Recommended)"; programs "Built-in programs only"; placement "Mostly pushed from home. But when a program is active we should also have a way of getting to the library not just the program overview"; actions "End or pause, Preview any session, Change schedule, See the program structure".
Inherited: Home's program card opens the overview mid-program and the Program summary at the end; Up next and No program open the Library (inventory #6, #64).

### Turn 1 · 2026-11-26 · how the program is laid out
Sample: Pillars, 11 weeks (Hypertrophy 1–5, Strength 6–9, Peak 10–11), Aug 3 – Oct 18, Mon Tue Thu Fri Sat; today Thu Aug 20, week 3. Same in all: top card (Week 3 of 11 · Hypertrophy, a bar per week by block, dates, days). A session tap previews it.

| Id | Option | Stamp |
|---|---|---|
| 1a | This week, then every week grouped by block; a week opens in place (Claude's pick) | **Locked** · as the Weeks tab |
| 1b | One week at a time with arrows | Not picked · 1a |
| 1c | Grid: a row per week, a dot per training day | Not picked · 1a |
| 1-menu | ••• : Change schedule · Pause program · End program, then Browse programs (Claude's pick for library access) | **Locked** |

Owner (2026-11-26): "These actually all look kinda cool but we're not displaying enough info in any of them. I want the progression details and stuff for the program also viewable. Doesn't need to be in your face but we should be able to see it." Nothing locked; menu not commented on.

### Turn 2 · 2026-11-26 · where the progression shows
Progression as the app works: main lifts follow the plan (sets, reps, weight per week from est. 1RM); accessories step up on Felt easy under the block's RPE cap; deloads never step up. All numbers sample.

| Id | Option | Stamp |
|---|---|---|
| 2a | On 1a: a grey prescription line under each session, a scheme line under each block label, "How Pillars progresses" at the foot (Claude's pick) | Rejected · 1a's cleaner rows |
| 2b | Weeks / Progression switch under the top card; Progression lists each block's main lifts first → last working week | **Locked** · the switch; contents in turn 3 |
| 2c | Tap a block in the top card: sheet with its main lifts week by week and its rules | In the running · turn 3 |

Owner (2026-11-26): "So I actually like 1a rather than 2a. They are cleaner rows especially on the "This week". I do like the progression and week tabs though. I think that's a good way to do it. Then for the rest of it, I'd like to see more of 2b and c. I think the 2b should be cleaned up and less clutter. But C is an interesting option to view the block or exercises. Like see a few variations for these. Also the top card looks okay but I don't like the last row in it. Not sure what we're trying to say with it."
**Locked:** Weeks | Progression switch under the top card; Weeks = 1a. 2a rejected.

### Turn 3 · 2026-11-26 · Progression tab, its detail, the top card's last line
| Id | Option | Stamp |
|---|---|---|
| 3a | Progression: a row per main lift (this week + step line across the program), then the blocks as rows (Claude's pick) | **Locked** |
| 3b | Progression: 2b cleaned (scheme on the block label, first → last working weight only) | Not picked · 3a |
| 3c | Progression: the current block as a lifts × weeks table, rules under, arrows to other blocks | Not picked · 3a |
| 4a | Detail: a block's plan sheet (table + rules rows) | Unreviewed |
| 4b | Detail: a lift across the program (bar per week, blocks under, week by week) | **Locked** · opens from a lift; look in turn 4 |
| 5a | Top card: no last line | Not picked · 5c |
| 5b | Top card: "8 weeks left · ends Sun Oct 18" (Claude's pick) | Not picked · 5c |
| 5c | Top card: Started · Ends · Days stats | **Locked** · centred, turn 6 |
Claude's pick for Q2: both 4a and 4b, each from its own row in 3a.

Owner (2026-11-26): "I think 3a and a version of 4b together. When you click a specific exercise that sheet should show up. But I think we can tweak that sheet a little. Maybe some visual block separators? Maybe see what it looks like without the graph on that sheet too?"
**Locked:** 3a is the Progression tab; tapping a lift opens its sheet (4b). Not answered yet: 4a (what a block row opens), the top card's last line (5a/5b/5c), turn 1's ••• menu.

### Turn 4 · 2026-11-26 · the lift sheet
Large sheet. Same in all: weeks grouped by block, a card per block, scheme on the label's right, this week tinted, done grey, deloads marked.

| Id | Option | Stamp |
|---|---|---|
| 6a | Graph with bars grouped by block, dotted separators, block names; then the week cards | Rejected · no graph |
| 6b | No graph: the week cards only (Claude's pick) | **Locked** · spacing in turn 5 |
| 6c | No graph, a small weight bar on each row | Rejected · no graph |

Owner (2026-11-26): "Yeah I agree. I don't think we need a graph here so B. Are we spacing things correctly though with that top of the sheet and the glass button?" **Locked:** 6b.

### Turn 5 · 2026-11-26 · the lift sheet on the standard sheet's spacing
Answer given: no. 6b was hand-drawn: sheet top 64 (standard 62), flat ✕ (missing the glass recipe), 12px line under the title with 4px gap (Swap: 13px #8F9098 straight under), 26px to the first label (standard: content 12px under that line). 5a copies the Swap sheet's top.

| Id | Option | Stamp |
|---|---|---|
| 7a | 6b on the standard large sheet (Swap's top; renamed from 5a) | **Locked** |
Final pass note: the 13px line under a sheet title (Swap too) is off the type scale (12/500 would be on it).

Owner (2026-11-26): "Cool yeah fixed version looks good." **Locked:** 7a. "Three dot menu sounds good. Is browse the last option in the list? Is that what you're suggesting?" Answer: yes, last, in its own group under a divider. **Locked:** the menu as drawn (Change schedule · Pause program · End program | Browse programs).
Asked: "What does the block rows even give us? Do we need them?" and whether the top card's last line has mocks (turn 3, 5a/5b/5c, resent).

Owner (2026-11-26): "I actually like 5c the most. Let's maybe center these metrics like we have the 3 metrics on the progression page. Arguably could have browse programs as a separate card at the bottom but maybe not. Let's see what those block rows mocks look like. And let's see the full Progression tab and well as the full Weeks tab. I don't think I fully understand what they look like right now."
**Locked:** 5c, drawn centred as Progress's three metrics. Browse programs stays in the menu.

### Turn 6 · 2026-11-26 · the stats centred, both tabs in full
| Id | Option | Stamp |
|---|---|---|
| 8a | Stats inside the top card, under the bars (Claude's pick) | **Locked** |
| 8b | Stats as their own card under the top card | Rejected · 8a |
| 6-prog | Progression without block rows (Claude's pick) | In the running · turn 7 |
| 6-progb | Progression with block rows (each opens 4a) | Rejected · as drawn; redone in turn 7 |
Full views shown: Weeks (1a), Progression both ways, the 4a sheet.

Owner (2026-11-26): "Yeah 8a. For the full weeks view. What does clicking a week do? And yeah I think the block view on the progressions is not adding anything. We can either re do it (without the exercise detail in it because I think it's unneeded here since we have exercise sheet already. What would adding the accessory on the progression sheet look like though?" **Locked:** 8a. Block rows opening the lift table rejected. Answered: a week opens in place (1a), a session previews.

### Turn 7 · 2026-11-26 · block rows redone, accessories
| Id | Option | Stamp |
|---|---|---|
| 9a | No block rows (Claude's pick) | Rejected · block rows stay (11a) |
| 9b | Block rows opening a rules-only sheet | Superseded · turn 8 |
| 10a | Accessories section listing all eight (this week's sets and weight; change since start) | Rejected · block rows stay |
| 10b | One Accessories row opening a sheet of them (Claude's pick) | **Locked** · with the block rows |

Owner (2026-11-26): "I think definitely 10b. I'm a little torn on keeping the blocks too. It might be useful if we have the right metrics there." Then: "Sorry I shouldn't say 10b for sure. If we don't have the blocks then 10a might be the play." Nothing locked: 10b with block rows, 10a without.

### Turn 8 · 2026-11-26 · block rows with metrics, or no blocks
| Id | Option | Stamp |
|---|---|---|
| 11a | Block rows: current block's progress (Week 3 of 5 · 12 of 25 sessions, bar), others' start dates; sheet = So far (sessions, avg RPE, est. 1RM change) + The plan; with 10b (Claude's pick) | **Locked** · metrics being defined |
| 11b | Block rows: weeks · scheme · RPE cap; same sheet; with 10b | Rejected · 11a |
| 11c | No block rows; accessories listed (10a) | Rejected · 11a |

Owner (2026-11-26): "Yeah 11a looks great. I just want to be sure these metrics on the block are right. What would the last 2, accessories and deload be? Like how would we calculate that? Is deload tied to the block?"
**Locked:** 11a with 10b. Answered: Accessories and Deload in The plan are the program's data, not calculations; the step-up rule is the app's.
Open (owner's call): deload as a week inside a block (Home's bar, this page) or its own block (Exercise detail's strip); So far definitions. Noticed: top card draws deload weeks full height; Home's bar (17a) draws them thin.

Owner (2026-11-26): "Yeah I think having deload as part of the block makes sense. But I'm not sure if we should visually unify it everywhere. I feel like sometimes it earns a different view. But yes please fix the top cards deload week."
**Locked:** a deload is a week inside a block (data model); how it is drawn may differ by place (Exercise detail's strip unchanged).

### Turn 9 · 2026-11-26 · deload weeks on the top card; the whole page
Top card: deload weeks half height (4px vs 8px), centred, same colours (follows Home 17a). Both tabs shown in full as locked. Open: So far definitions (sessions done ÷ planned so far; avg of RPEs logged in the block; avg change in main lifts' est. 1RM since the block started).

Owner (2026-11-26): "The est 1rm I'm not sure if it makes sense on a block level…like what is this? And actually can I see what you are proposing on the Exercise detail screen to change the deload viewing?"

### Turn 10 · 2026-11-26 · the block's third metric; deloads on Exercise detail's strip
Explained: Est. 1RM was the average change of the main lifts' est. 1RM since the block started; weak at block level.

| Id | Option | Stamp |
|---|---|---|
| 12a | So far: Sessions · Avg RPE · PRs (Claude's pick) | **Locked** |
| 12b | So far: Sessions · Avg RPE · Sets a week | Rejected · 12a |
| 12c | So far: Sessions · Avg RPE only | Rejected · 12a |
| 10a | Exercise detail strip: deload stays its own segment (Claude's pick) | **Locked** |
| 10b | Strip: deload joined to its block as a faint tail | Rejected · 10a |
| 10c | Strip: deload joined as a half-height tail | Rejected · 10a |

Owner (2026-11-26): "Yeah I think 12a and 10a as well." **Locked:** So far = Sessions (done ÷ planned so far) · Avg RPE (of the RPEs logged in the block) · PRs (set in the block); Exercise detail strip unchanged. README updated. Program overview design complete.

### Built · 2026-11-26
Program Overview Demo.dc.html (gen_overview_demo.py): everything locked in turns 1–10 on one phone. Top card (thin deload weeks, Started · Ends · Days a week); Weeks | Progression; Weeks: This week, then every week by block, a week opens in place; Progression: main lifts (each opens its lift sheet), the Accessories row (opens its sheet), Blocks with progress (each opens So far + The plan). ••• menu (actions show a note; Browse programs waits for the Library). Session preview not wired. In the whole-app demo it replaces the placeholder: Home's program card opens it; Back returns to Home.
Fixed on the way: the standard sheet's title no longer blocks taps on the ✕ (pointer-events: none, as the built sheets).

### Turn 11 · 2026-11-26 · the preview state; training days
**Locked (from Library turn 2):** a program not running opens the overview in a preview state. Drawn (Summit): goal + line instead of Week N, bars without progress, no ••• menu, Weeks tab without This week (weeks show sessions, open to days). Same day tiles drawn on running Pillars.

| Id | Option | Stamp |
|---|---|---|
| 13a | Day tiles under the bars; three stats (preview Weeks · Days a week · Level; running Started · Ends · Days a week) | Not picked · 13b |
| 13b | Day tiles under the bars; Days a week dropped (preview Weeks · Level; running Started · Ends) (Claude's pick) | **Locked** |
| 14a | Start program pinned above the tab bar (Claude's pick) | **Locked** |
| 14b | Start program at the end of the page, in the flow | Not picked · 14a |
Open: preview's Progression tab and lift sheets, weights from current est. 1RMs or percentages. Start while another program runs → Apple system alert (wording not set).

Ben (2026-11-26): "I like 13b as well. And lets pin the start program button, so 14a." **Locked:** 13b (day tiles under the bars on both states; Days a week stat dropped: preview Weeks · Level, running Started · Ends), 14a (Start program pinned above the tab bar).

### Turn 12 · 2026-11-26 · the preview's Progression tab
Ben: "Ouu interesting on the progression...probably? can i see what that would look like?" Drawn on Summit (13b, 14a). Sample est. 1RMs.

| Id | Option | Stamp |
|---|---|---|
| 15a | Pounds from your est. 1RM (tab line and sheet) (Claude's pick) | **Locked** · the tab |
| 15b | Percentages of est. 1RM | Not picked |
| 15c | Pounds, with the percentage dimmer beside them | **Locked** · the sheet |
Not drawn: a lift with no est. 1RM.

Ben: "I think it should probably be 15A, but with the sheet of 15C. I think we should have the percentages visible as well." Not locked ("probably"): to confirm.

### Turn 13 · 2026-11-26 · the preview top card's first lines
Ben: "I don't know if I like the sentence that we have in the card on 15. It seems kind of weird. ... did we always have the sentence there?" Answer: no; it came with the preview (turn 11) in place of Week N.

| Id | Option | Stamp |
|---|---|---|
| 16a | As drawn: goal, sentence 15/600 | **Locked** |
| 16b | Sentence quieter, 12/500 grey | Not picked · 16a |
| 16c | No sentence, goal eyebrow only | Not picked · 16a |
| 16d | No sentence; headline "Strength · 4 blocks" in the running card's shape (Claude's pick) | Not picked · 16a |
Ben: "Okay, I'm actually leaning A." (read as 16a; leaning, not locked)
Ben: "I think you can do 16A. I was leaning it because I don't want to have a title in this card that's not the program title. ... I don't want a big strength title because that just doesn't make sense for progression." **Locked:** 16a. Progression (15a tab / 15c sheet): Ben will come back to it.

### Turn 14 · 2026-11-26 · End program
Ben: "there is a bunch of additional things we havent designed yet too (change schedule, pause program, and end program" then "lets do it" (End program first). Sample: Pillars ended in week 3 of 11, Thu Aug 20.

| Id | Option | Stamp |
|---|---|---|
| 17a | Confirmation: Apple's confirmation dialog from the bottom, red "End Pillars", Cancel (Claude's pick) | **Locked** · button "End Program" (turn 15) |
| 17b | Confirmation: Apple's alert, Cancel / End | Not picked · 17a |
| 18a | Land on Home's No Active Program (13d, today's style) (Claude's pick) | Not picked · 18b |
| 18b | Land on the Program summary of the part done, then Home | **Locked** |
| 18c | Land on Programs, nothing Active | Not picked · 18b |
Open: is ending final (Claude: yes; Pause is for coming back; picking it again starts at week 1)? Does Home's "Pillars ended Aug 20" open the partial summary?

Ben: "Yeah 17a. But i dont think we should use hte program name here. just End Program i think." "I think the program summary yeah. So 18b" "End should be final yes. Thats what pause is for." **Locked:** 17a (button "End Program", no program name); 18b; ending is final (picking it again starts at week 1).
Ben: "If we went with 18a (and actually maybe goo no matter what), i think we should actually have a new version of the program summary card when there is no active program and have it show a little summary like the active one does and is clickable to view the summary in full"

### Turn 15 · 2026-11-26 · the dialog's wording; Home after ending
| Id | Option | Stamp |
|---|---|---|
| 17c | "End program?" / "End Program", no name | **Locked** |
| 19a | Ended card in the program card's place at the foot; top card keeps "Pillars ended Aug 20" (Claude's pick) | **Locked** |
| 19b | Ended card second, under the No Active Program card, which drops the ended line | Not picked · 19a |
| 19c | One card: ended summary, then No Active Program | Not picked · 19a |
Same in all: Home's program card (bars by share done, all moss; Adherence · PRs · Sessions), eyebrow = program name, "Ended Aug 20"; whole card opens the full summary.

Ben: "yeah 19a. And yeah pretty much all the same. The ended in the top right is good." **Locked:** 19a. 17c's wording not yet answered.
Asked: "if the program ended early we should have this affect its adherance i think? What do you think?" Claude: adherence = sessions done ÷ sessions planned up to the day it ended (as mid-program, frozen at the end); the early end shows in Sessions (12 / 55), the bar and "Ended".
Asked: "What does the back button do on the Program Summary?" Claude: the summary replaces the overview (an ended program has no overview), so Back goes to Home.
Ben: "Agreed on both. And yes i think End Program twice is okay. Althouth the title could maybe be the program name but im concerned about name length causing issues" **Locked:** 17c; adherence for an ended program counts up to the day it ended; the summary replaces the overview after End Program, Back goes Home.

### Turn 16 · 2026-11-26 · Pause program
Ben: "sounds good. lets start pause". Proposed meaning (Claude, not decided): schedule stops; nothing due or missed while paused; resume picks up at the next session not done; later dates move by the time paused; paused days don't count against adherence; the menu's Pause program reads Resume program while paused. Sample: Pillars paused Thu Aug 20 for a week → resumes Aug 27, ends Oct 25.

| Id | Option | Stamp |
|---|---|---|
| 20a | Apple's dialog with lengths: 1 Week, 2 Weeks, Until I Resume; resumes on its own (Claude's pick) | Not picked · 20b |
| 20b | Apple's dialog, one button: paused until you resume | **Locked** |
| 20c | Sheet: 1 week · 2 weeks · On a date · Later, resume and new end shown | Not picked · 20b |
| 21a | Overview while paused: grey "Paused" tag in the top card; resume from the menu | Not picked · 21b |
| 21b | Overview while paused: Paused card on top (resumes date, what's next, Resume now) (Claude's pick) | **Locked** · open-ended (turn 17) |
Next: Home while paused.

Ben: "20b. I dont think it will very often be paused for even intervals like 1 or 2 weeks." "But yeah 21b and this card should probably be added to the home page too when a program is paused. What happens when you pause though? Like nothing progresses and you just resume from the same spot later? What happens if you are pausing for like 5 days?" **Locked:** 20b, 21b.

### Turn 17 · 2026-11-26 · pause: open-ended, resuming, Home
Proposed rule (Claude, open): nothing progresses; on resume the unfinished week carries on over your next training days, the next program week starts the Monday after; weeks stay Mon–Sun; end moves by whole weeks. 5 days (Thu Aug 20 → Tue Aug 25): Tue 25 / Thu 27 / Fri 28, week 4 Mon Aug 31, ends Oct 25. Alternative (exact-day shift) rejected by Claude: lands on non-training days.

| Id | Option | Stamp |
|---|---|---|
| 21c | 21b open-ended: "Paused · Since Thu, Aug 20", what's next, Resume program; Ends "—", undone sessions undated | Restyled · turn 18 |
| 22a | Home: paused card in Today's place (Resume program, log without a program) (Claude's pick) | **Locked** |
| 22b | Home: Today "Nothing planned · Pillars is paused"; Resume at the program card's foot | Not picked · 22a |

Ben: "for the pause, I think that makes sense. I'm gonna focus on the logic first. So you're basically saying if we were doing week 4, we got halfway through week 4 and had to pause, we can come back and train those other days. And then when we start the next week, it is week 4 again, right? Like you just kind of restart a partial week is that what you're saying" "that resume program button on 21C ... is unlike any other button we have in our repertoire. I think we need to restyle it. I'm not in love with our main big blue button, but I feel like it probably is what we need here on 21C as well. And for 22, definitely 22A." **Locked:** 22a. Noted: Ben is not in love with the main blue button (app-wide); not reopened.

### Turn 18 · 2026-11-26 · the resume button; the partial week
| Id | Option | Stamp |
|---|---|---|
| 21d | 21c with Resume program as the main blue button | Text trimmed · turn 19 |
Partial week (Claude's answer, open): not a restart; done sessions stay done, the rest of week 4 is trained over the next training days, then the next Monday is week 5. Alternative: start week 4 over on the next Monday (redo done sessions).

Ben: "I'm just not understanding what you're saying. ... Most of my workout programs start on a Sunday. ... Now it is Monday. Technically, I have trained for this week on Monday and Tuesday. ... what happens about that Monday and Tuesday now? ... How do we deal with these partial weeks?" On restart: "the 3-week is less of an issue ... I just don't think it's how the programs are going to get managed. The big one is I was away for a few days. ... I'm not actually gonna pause the program for 1 or 2 days." On the card: "we've got pause and we've got since. ... it looks good. But then we have picks up with upper strength, heavy pull, nothing is due. Well paused. I think this is too much."

### Turn 19 · 2026-11-26 · the week you come back to; card text
Diagram (shots/overview-t19-weeks.png): Sun–Sat program weeks, sessions 1–6 Sun–Fri; did 1–3, away Wed–Sun, back Monday.

| Id | Option | Stamp |
|---|---|---|
| A | Carry on right away: 4–6 Mon–Wed, free Thu–Sat, week 5 on Sunday | Rejected |
| B | Back on its own day: Mon–Tue free, 4–6 Wed–Fri, week 5 on Sunday (Claude's pick) | **Locked** |
| C | Carry on, weeks move: week 5 starts Thursday from then on | Rejected |
| 21e | Paused card: "Paused · Since Thu, Aug 20" and the button only (Claude's pick) | Not picked · 21f |
| 21f | Paused card: adds "Next: Upper Strength · Heavy Pull" | **Locked** |
Open: back after the day you left off (e.g. Friday) under B. No restart rule (Ben: you'd end the program).
Ben: "A and C are 100% not what we want. B is a possibility, but you're missing another key one ... redoing a full week. ... that one would get weird ... 'You missed Sunday's workout, so now you're gonna wait a whole other week to restart.' No. So yeah, B is probably the one. ... those free days. Would that just be log a workout without a program kind of thing? ... for 21 F better than E?" Restart-the-week considered and dropped by Ben.
Claude's answer: free days are ordinary days with nothing planned (Home's rest-day card, Workout tab's rest day); training then is a workout logged without the program, or doing the next session early from the Workout tab (its effect on the schedule is still an open Workout item). 21f is better on Home, where there is no session list under the card; Claude now picks 21f.
Ben: "That last sentence wasn't a question. I like F better than E." **Locked:** 21f (Home's paused card follows it).
Ben: "Yes, you can lock in B." On back-after-the-day: "I don't think I'm going to pause the workout if I just am unable to attend for a couple days. ... If you're doing a 16-week program and I'm gone for a week, that's a great pause. ... if someone wanted to pause for some reason in those scenarios, I think it should just round to the next week. I should still be B. Then you just have free days for Friday, Saturday, Sunday, Monday, Tuesday. ... we might as well just keep it consistent."
**Locked (pause rule):** you pick up at the session you left off, on its own weekday, the next time that weekday comes round; days before it are free; nothing is skipped because of a pause; later weeks move by whole weeks; no restart.

Ben: "Sounds good, and yes, paused. Do not count against adherence." **Locked:** paused days don't count against adherence. Pause designed (turns 16–19).

### Turn 20 · 2026-11-26 · Change schedule
Standard large sheet from ••• › Change schedule. Same in all: pick exactly as many days as the program's sessions a week; Save (main blue). Proposed: a change starts next week.

| Id | Option | Stamp |
|---|---|---|
| 23a | Days only; sessions fill them in order; Your week shows the result (Claude's pick) | Rejected · the days are the program's |
| 23b | Days, then a day picker per session | Rejected · the days are the program's |
| 23c | Days, plus Week starts on (Sun/Mon) and This week / Next week | Reworked · turn 21 (Ben leaning C) |
Open: where the week's first day lives (this sheet per program, app-wide setting, or set by the program). Ben: most of his programs start on a Sunday.

Ben: "When I build a program, I'm going to build it such that it's designed so that the rest days are perfect and I'm spacing out the right muscle groups. So going in and changing the day that the workout is done or changing which days I want a workout, that's not really what I want. ... it's just picking the day of the week it starts. ... pick between more than just Sunday and Monday and also scheduling it to start that next week is good. So I'm leaning more C ... We have a visualization that shows you if you select this day, these are the days you're going to train ... Just keep it simple." On non-weekly programs: "I actually don't want to get into that at all." Out of scope: every program is a 7-day week.

### Turn 21 · 2026-11-26 · Change schedule = the week's start day
Same in both: any of the seven days; starts next week; Save.

| Id | Option | Stamp |
|---|---|---|
| 24a | Seven day pills (selected = filter-pill style), then Your week: all seven days, session or Rest (Claude's pick) | **Locked** · sized in turn 22 |
| 24b | "Week starts on" menu row (Apple menu), then training days as day tiles + a line | Not picked · 24a |

Ben: "Yeah, 24A. The only thing is this card, I don't think we need this card to be a full screen sheet. So I would maybe like resize it a little bit. But other than that, it looks good for A." **Locked:** 24a.

### Turn 22 · 2026-11-26 · Change schedule sheet size
| Id | Option | Stamp |
|---|---|---|
| 24c | 24a in a sheet sized to its content; standard header with subtitle; 44pt rows (Claude's pick) | **Locked** |
| 24d | Sized to fit, tighter: no subtitle, 38pt rows | Not picked · 24c |
Ben: "Yeah, 24C. ... You're always gonna have 7 days, so it's set to this." **Locked:** 24c (the sheet is a fixed height: always seven rows). All three actions designed (turns 14–22).

## Library

### Library turn 1 · 2026-11-26 · the list of programs (Library Explorations.dc.html)
Drawn while Pillars runs ("Week 3 of 11" tag, blue tint). Six sample programs. A program opens its preview (next turn).

| Id | Option | Stamp |
|---|---|---|
| L1a | A card per program: name, line, Weeks · Days a week · Level as centred metrics | In the running · turn 2 |
| L1b | Grouped by goal (Strength, General, Hybrid), a row each: name, weeks · days · level (Claude's pick) | Not picked |
| L1c | One list (running first, then A–Z), the line under the name, filter top right | Not picked |
Q2: title "Programs" (Claude's pick) or "Library".
Ben: "Mostly A format but it needs a lot of work. We need cards and they probably should be moderately big"

### Library turn 2 · 2026-11-26 · bigger program cards
Each card: goal, name, line (Pillars keeps "Week 3 of 11"), then a picture of the program. Bars = overview top card (deload weeks half height, progress only on the running program).

| Id | Option | Stamp |
|---|---|---|
| L2a | Block bars, then Weeks · Days a week · Level behind a hairline, ~205pt (Claude's pick) | In the running · turn 3 |
| L2b | Training-day tiles, then weeks · about N min a session · level, ~170pt | Unreviewed |
| L2c | 24pt name, bars, day tiles, facts line, ~225pt | Unreviewed |
Open: "about N min a session" would be a new per-program field (not decided). Title Programs vs Library still open.

Ben: "I guess the question is, what happens when you click one of these cards? Is there going to be abother program detail screen for non-active programs? That will influence my decision"
Offered: A the overview in a preview state (Claude's pick) · B a separate lighter detail screen · C a sheet first.
Ben: "Yes "the program overview in a preview state" is what i want. So i agree i am leaning 2a. But now seeing 2b and c i feel like having the training days of the week specified is a good thing to have somewhere so maybe on the program detail page we just locked"
**Locked:** tapping a program in the Library opens the program overview in a preview state. L2a: leaning, not locked. Training days → overview turn 11.
Ben (2026-11-26): "And going back, yeah i think 2a on the library is what im leaning". L2a still leaning (not locked).

Ben (2026-11-26): "lets do one more pass at 2a." "Programs as the title." **Locked:** title Programs.

### Library turn 3 · 2026-11-26 · one more pass at 2a
Each option changes one thing from 2a. Training days live on the overview (13b), not the card.

| Id | Option | Stamp |
|---|---|---|
| L3a | Stats become one line: weeks · days a week · level | Not picked · L3b |
| L3b | Level in the eyebrow (Strength · Intermediate); stats Weeks · Days a week (Claude's pick) | **Locked** |
| L3c | Running program alone under Running, then All programs (cards as 2a); combines with 3a or 3b | **Locked** · as L4a |
Ben: "for number three, I don't know. Yeah, I feel like 3B is good, but I don't understand what you're saying with the list itself. Are you trying to group by the different types of program? Like how does this get classified as a running program?" Answer: 3c's "Running" meant the program you're on now (Pillars), not running as a sport; ambiguous in an app with a Run tab. L3b: Ben likes, to confirm.
Ben: "I see what you meant by running now. Okay, instead of running, let's use the word active." "Put the level in the title. It's good." "we'll have beginner, intermediate, advanced. ... we'll probably have more than just three types of levels, ... more than three strength hypertrophy that kind of stuff."
**Locked:** L3b. Data: goal and level are open lists (more than three of each). The word for the program you're on is "Active", not "Running".

### Library turn 4 · 2026-11-26 · 3b cards and the active program
| Id | Option | Stamp |
|---|---|---|
| L4a | "Active" label over Pillars, then "All programs" (Claude's pick) | **Locked** |
| L4b | No labels; Pillars first with its tag | Not picked · L4a |

Ben (2026-11-26): "4a yes. I like having the active in a separate section. And yes lock that 15 pair" **Locked:** L4a; overview 15a (tab: pounds from your est. 1RM) with 15c's lift sheet (pounds, the percentage dimmer beside them).

### Built · 2026-11-26 · Programs and the preview
Ben: "yup lets do it"
- Library Demo.dc.html (gen_library_demo.py): Programs, as locked in Library turns 1–4 (Active, then All programs; 3b cards). Pillars → its overview, Summit → its preview, the others a note.
- Program Preview Demo.dc.html (gen_library_demo.py): Summit, as locked in overview turns 11–13 (16a + 13b top card, 14a pinned Start, 15a tab, 15c lift sheets, block sheets with The plan only). Start shows a stand-in alert.
- Program Overview Demo: top card now has the day tiles and Started · Ends (13b).
- App demo: Browse programs → Programs → Pillars (overview) or Summit (preview). Home's Up next / No program → Programs waits on those Home states.
- README: Program overview rule updated (day tiles, two stats); new Programs and Program preview rules.
Stand-ins / to come: alert wording; when a started program begins; a main lift with no est. 1RM; the Accessories sheet for a program not started.

### Built · 2026-11-26 · the program actions
Ben: "Sounds great, let's do it."
- Program Overview Demo: ••• › Change schedule (24a in a fitted sheet, live pills), Pause program (dialog → paused card, grey week, Ends "—", undated sessions; menu reads Resume program), End program (dialog; a note here, the ended summary in the app).
- Home Demo: program state switch (Active / Paused / Ended) in the side panel; paused card in Today's place; No Active Program + the ended card at the foot; Fri/Sat unplanned once paused or ended.
- Program Summary Demo · Ended.dc.html: the top card for the part done (Aug 3 – Aug 20 · Ended, 12 / 55, bar to week 3, 86%); the rest is still the finished sample.
- App demo: End Program swaps the overview for the ended summary (Back → Home in its ended state); Pause / Resume sync Home and the overview; Home's Choose a program → Programs, its ended card → the summary; a Program state switch in the side panel.
- README: Program actions rule.
