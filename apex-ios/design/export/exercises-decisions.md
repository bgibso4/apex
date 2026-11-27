# All exercises — decisions log

Same rules as the other logs: every option in `All Exercises Explorations.dc.html` carries a stamp, shown as a tag beside its name on the page. **Locked** = stands · **Rejected** = turned down · **Superseded** = replaced by a later turn. **Highest turn number wins.**

## Inherited (locked)

| Area | Decision |
|---|---|
| Role | The one Exercises screen: history for every exercise and managing exercises together; reachable from Progress behind a tap (progress-decisions, owner 2026-11-10) |
| Entry | Progress's All exercises card, right after the main lifts (progress-decisions) |
| Identity | An exercise is tied to an ID, not its name (Exercise turn 31) |
| Archive | Joins Exercise detail's ••• menu once this screen is designed; standard iOS confirmation, not red; history kept; no Delete (Exercise turns 31–32) |
| Header | Pushed screen: opens on the small title, large title on pull (H1); bar buttons at 59–103pt (44a) |

## Scoping · 2026-11-26

Owner's answers: order "Mock all three"; archive "Archive + Archived list (Recommended)"; new exercise "+ in the bar here (Recommended)"; row "Mock options".

---

### Turn 1 · 2026-11-26 · how the list is ordered, and what a row shows

Every mock: small title, back left, glass + right, content at 128pt, search field and body-part pills (like History and the Add exercise sheet), section labels 8pt above one card each, an Archived row at the bottom. Search, pills, + and the Archived row's look are up for review later. Sample: 48 exercises, today Wed Nov 11.

| Id | Option | Stamp |
|---|---|---|
| r1a | Recent first: This week, Last 30 days, Earlier, Not logged yet; newest first (Claude's pick) | Rejected · owner: B or C |
| r1b | A–Z, a section per letter, a letter index down the right edge | **Locked** |
| r1c | By body part: Legs, Back, Chest, Shoulders, Arms, Core; A–Z inside; under the first body part | Rejected · r1b locked |
| r2a | Row: last done under the name, best on the right (Claude's pick) | **Locked** |
| r2b | Row: body part and equipment under the name, nothing on the right | Rejected · r2a locked |
| r2c | Row: name only, 44pt | Rejected · r2a locked |

Owner (2026-11-26): "For Q2 I agree, A. For q1 it's going to be B or C. How do the muscle group chips work at the top though? Is this the same format we have as another screen? I don't if it would be better to redesign that piece. Just cause that horizontal scroll is maybe a bit weird."

### Turn 2 · 2026-11-26 · the body-part filter

Answered: a chip shows only that body part's exercises (first body part); All shows everything. Same pills as History's quick pills and the Add exercise sheet; seven don't fit across 350pt, so the line scrolls. Whatever is picked here, History and the Add exercise sheet would follow (a later question). Mocks on r1b's A–Z list; each shows the list as it opens and filtered to Legs.

| Id | Option | Stamp |
|---|---|---|
| r3a | Pills on one line scrolling sideways, as today | Superseded · filter moved to the bar (turn 3, r4a) |
| r3b | Pills wrapping onto two lines | Superseded · filter moved to the bar (turn 3, r4a) |
| r3c | A Body part menu button beside the search field; the standard menu; blue with the group's name while on (Claude's pick) | Superseded · filter moved to the bar (turn 3, r4a) |

Owner (2026-11-26), on turn 2: "What if the add button is a floating action button at the bottom right and the top right is actually a filter button? Then we could just put the filter up there. It does make it an additional tap though."

### Turn 3 · 2026-11-26 · filter in the bar, and where New exercise goes

Correction to turn 2: History's quick pills fit on one line and don't scroll (README: quick filter pills on one line, no sideways scroll); only the workout's Add exercise sheet has a scrolling muscle-pill line, which contradicts that rule. r3a broke an existing rule; the Add exercise sheet needs a look whatever is picked.
Filter in the bar = History's (turns 4–8): 44pt glass button top right, blue dot while on, full-width search, History's filter sheet; for exercises the sheet holds Body part, Equipment, Lift type (Claude's guesses, open). Costs a tap (open, pick, Show). r4a's always-there + fails the floating-glass rule's transient test (Logging turn 32a), so it would be an exception.

| Id | Option | Stamp |
|---|---|---|
| r4a | Filter top right; 56pt glass + floating bottom right above the tab bar (owner's idea) | **Locked** · exception to the floating-glass rule, owner's call |
| r4b | Filter and + side by side top right (Claude's pick) | Rejected · r4a locked |
| r4c | Filter top right; a blue New exercise row as the first card under the search | Rejected · r4a locked |

Owner (2026-11-26), on turn 3: "I think r4a. I know that breaks the rule but I think that's a nice spot for it. And the filter sheet looks super weird. I know this is what we have as another sheet but it looks out of place on our app I think. I like the filter being there though."

### Turn 4 · 2026-11-26 · what the filter opens

The turn 3 sheet is History's (History turns 5–8); if a new look is picked, History's filter follows (a later question). Sections Body part, Equipment, Lift type in every option (Claude's guesses, open).

| Id | Option | Stamp |
|---|---|---|
| r5a | History's filter sheet, as turn 3 | Rejected · owner: none of these |
| r5b | A short sheet like Edit exercise: pills under eyebrow labels, ✓ applies, Reset at the foot (Claude's pick) | Rejected · owner: none of these |
| r5c | The standard pull-down menu; each group opens its own list with ✓ | Rejected · owner: none of these |

Owner (2026-11-26), on turn 4: "I don't like any of these filters. What if we had a custom drop down or roller for each of them instead? This would still be on the sheet though."

### Turn 5 · 2026-11-26 · a drop-down or a roller per group

All on the short sheet (close, Filter, ✓, Reset). One pick per group with these controls (History's multi-pick goes). Controls the app already has: Edit exercise's Equipment drop-down, the standard menu, the set editor's wheel; values in grey pills, blue while open (README pickers).

| Id | Option | Stamp |
|---|---|---|
| r6a | A label and a drop-down per group (Edit exercise's Equipment), opening the standard menu (Claude's pick) | Rejected · owner: C closer |
| r6b | A row per group, value on the right; tapping opens a wheel under that row | Rejected · owner: C closer |
| r6c | One roller with three columns, captions under (like the set editor) | Closer · refined in turn 6 |

Owner (2026-11-26), on turn 5: "List order should be alphabetical. Idk about these filters though. C was closer to what i was thinking but still not great." r1b locked: A–Z, a section per letter, the letter index down the right edge.

### Turn 6 · 2026-11-26 · the roller, three ways

All show Legs and Barbell picked, Lift type on All.

| Id | Option | Stamp |
|---|---|---|
| r7a | Three rollers side by side, each in its own panel, label on top, own band (Claude's pick) | Very close · cleaned up in turn 7 |
| r7b | Three full-width rollers stacked under their labels | Rejected · r7a closest |
| r7c | Three sideways rollers, the pick centred in a pill | Rejected · r7a closest |

Owner (2026-11-26), on turn 6: "R7a is very close to what I was thinking. But I think we can clean it up."

### Turn 7 · 2026-11-26 · r7a, cleaned up

All three drop the panels; labels sit above their rollers. They differ in the highlight band and the column separation.

| Id | Option | Stamp |
|---|---|---|
| r8a | One band across all three, like the set editor (Claude's pick) | Rejected · r8c locked |
| r8b | A band per roller, gaps between | Rejected · r8c locked |
| r8c | One band, hairlines between the columns | **Locked** |

Owner (2026-11-26): "Oh yeah r8c is great." r8c locked: the filter opens the short sheet (close, Filter, blue ✓, Reset) with three rollers side by side (Body part, Equipment, Lift type), labels above, one band across all three, hairlines between; one pick per group. Equipment and Lift type values are Claude's sample lists, to confirm.
Open: History's filter sheet would follow this look so the app has one filter (owner's question to ask); the workout's Add exercise sheet has a sideways-scrolling pill line against the README rule.
Still to design: New exercise (the floating +), the Archived list, Archive in Exercise detail's ••• menu.

Owner (2026-11-26): "Yeah values can be defined by a config list later. Let's see what the history one would look like with this styling? Let's see the add workout mock too" (asked which: "New exercise (the + here)"). The rollers' values come from a config list, defined later.

### Turn 8 · 2026-11-26 · History's filter in the new style, and New exercise

| Id | Option | Stamp |
|---|---|---|
| hH1 | History: Body part, Session, Program as three columns; Exercise as its own full-width roller (Claude's pick) | Rejected · owner: "gross for history" |
| hH2 | History: two rows of two (Body part + Session; Program + wider Exercise) | Rejected · owner: "gross for history" |
| hH3 | History: four columns in one row (names clip) | Rejected · owner: "gross for history" |
| r9a | New exercise: Edit exercise's fields, empty; ✓ grey until a name (Claude's pick) | **Locked** |
| r9b | New exercise: name, body part, equipment; lift type and step on defaults | Rejected · r9a locked |
| r10a | Duplicates: matches under the name as you type, tap to open (Claude's pick) | **Locked** |
| r10b | Duplicates: a warning on ✓ (Open, or Add anyway) | **Locked** with r10a · exact name only |

With rollers History loses multi-pick within a group (today Legs and Back together).

Owner (2026-11-26): "Oh yeah that's gross for history. What does history look like today?" Rollers out for History. Shown: History today (History turns 4–8), the large sheet with collapsible sections, multi-pick circles, Show N sessions, Reset.

Owner (2026-11-26), on keeping History's sheet or restyling it: "Yeah let's mock that restyle please."

### Turn 9 · 2026-11-26 · History's filter, restyled with pills

Both keep four groups, multi-pick (OR inside, AND across) and the live count; both swap the circles for Edit exercise's pills. rHb is close to turn 4 r5b (turned down for All exercises).

| Id | Option | Stamp |
|---|---|---|
| rHa | Today's sheet, pills in place of circles; sections open and close; Show N sessions and Reset (Claude's pick) | **Locked** |
| rHb | Edit exercise's sheet: every group open under a label, Exercise shows six then Show all, ✓ applies, count above Reset | Rejected · rHa locked |

Owner (2026-11-26): "9a for the new exercises. The already in your list is pretty cool. But the warning is also kinda important." Asked when the warning shows: "Exact name only (Recommended)".
Locked: New exercise = Edit exercise's sheet, empty, ✓ grey until a name (r9a). Matches show under the name while typing, with when each was last logged; tapping one opens it (r10a). On ✓ an exact name match warns: "Bench Press already exists", Open Bench Press / Add anyway (r10b); a close but different name saves without a warning.
Still to design: the Archived list, Archive in Exercise detail's ••• menu.

Owner (2026-11-26): "RhA is also I think what we want." rHa locked and built (gen_hist9.py) in the History Demo and the whole-app demo: History's sheet keeps its sections, counts, multi-pick, Show N sessions and Reset; options are Edit exercise's pills instead of circles. README and history-decisions updated.

Owner (2026-11-26): "We should have a limit on the number of matching exercises displayed though."

### Turn 10 · 2026-11-26 · New exercise: how many matches show

Sample "Press" (8 of 48 match). Order: names starting with what's typed first, then most recently logged.

| Id | Option | Stamp |
|---|---|---|
| r11a | Three, nothing more | Picked · open to r11b (turn 11) |
| r11b | Three, then "5 more · keep typing to narrow" (Claude's pick) | In the running · turn 11 |
| r11c | Five | Not picked |

Owner on turn 10 (2026-11-26): "R11a. But let's make sure we clean up the list. It looks kinda out of place there." Then: "Well I could be persuaded for r11b if we clean things up too." **Not locked.** r11a picked, r11b still in the running, r11c not picked. Decided in turn 11 on the cleaned-up look.

### Turn 11 · 2026-11-26 · "Already in your list" cleaned up
What looked out of place in turn 10: a fainter fill (4% against the sheet's 6%), a sentence-case label inside the box instead of an uppercase label above, 8px under the field, the count line inside the box.
Same in all: uppercase section label above, 8px to the block, names 14/700, last logged 12/500 #7C7E86, 44px rows, tap opens the exercise; the count (when shown) as helper text 12/500 #8F9098, "5 more. Keep typing to narrow it down."

| Option | What | Status |
|---|---|---|
| r12a | A group in the field fill (6%, 10px corners), hairlines between rows | Unreviewed |
| r12b | Plain rows, no fill, hairlines above, between and below | Unreviewed |
| r12c | Inside the name field: the field grows to hold the matches under its ring | Unreviewed |
| r12a-3 | r12a without the count line (r11a in the r12a look) | Unreviewed |

Claude's suggestion: r12a, keeping the count (r11b).

Owner (2026-11-26): "R12a yeah this looks great." **Locked:** r12a as drawn, with the count (so turn 10's r11b): label above, three matches in the field fill, "5 more. Keep typing to narrow it down." as helper text. r12b, r12c rejected; r12a-3 rejected (r12a keeps the count). README updated.

### Turn 12 · 2026-11-26 · the Archived list
Locked already: Archive in Exercise detail's ••• menu, standard confirmation, history kept, no Delete. Sample: three archived. In all options a tap opens the exercise's page, with Unarchive in its ••• (next turn).

| Id | Option | Stamp |
|---|---|---|
| 13a | Its own screen, pushed from the Archived row at the foot of All exercises; one card A–Z (Claude's pick) | **Locked** · own screen |
| 13b | As 13a plus swipe left for Unarchive | **Locked** · swipe; look in turn 13 |
| 13c | No screen: an Archived section at the foot of All exercises, names greyed | Rejected · own screen |
| 14b | Row second line "Archived Jul 2" instead of last logged (Claude's pick for Q2) | **Locked** |

Q3 (proposal, not decided): archived exercises leave Add exercise, Swap suggestions and program pickers; history, graphs and records stay. Open: whether New exercise's "Already in your list" shows archived matches.

Owner (2026-11-26): "Q1: yeah I think it should be its own screen too. Should we display any of them on the All Exercises or just directly have a box that takes you to this page? For unarchiving I think it makes sense to swipe although the swipe needs to be improved. It looks a little funny right now. Should these archived exercises be able to be clicked? I'd imagine so because it still has all the data so you should be able to view them. But instead of "Archive" being in their menu it's "Unarchive". I think yeah on the backend we will have a list of all exercises that have a field archived or not and all these regular app functions will probably use that list and just filter for non-archived exercises. And yeah I think New Exercises should show them. So not use the archive flag."
**Locked:** Archived is its own screen (13a); swipe left to unarchive (13b; look redrawn in turn 13); 13c rejected. Rows open the exercise's page; its ••• has Unarchive in place of Archive. One exercise list with an archived flag; the app's functions use the non-archived ones. New exercise's "Already in your list" ignores the flag (shows archived matches). Q2 (row second line, 13a vs 14b) not answered.

### Turn 13 · 2026-11-26 · the swipe, the way in, an archived match
| Id | Option | Stamp |
|---|---|---|
| 15a | Swipe: flush blue action, clipped by the card's corner | Rejected · 15b locked |
| 15b | Swipe: blue Unarchive capsule inside the card (Claude's pick) | **Locked** |
| 15c | Swipe: 44px blue icon circle | Rejected · 15b locked |
| 16a | Way in: one "Archived 3 ›" row at the foot, hidden at 0 (Claude's pick) | **Locked** · height in turn 14 |
| 16b | Way in: the row with the archived names under it | Rejected · 16a locked |
| 17a | New exercise: archived match tagged "Archived" in place of its date | **Locked** |
Proposal, not drawn: an archived exact-name match warns "Pec Deck is archived" (Open Pec Deck / Add anyway).

Owner (2026-11-26): "Yeah I think 15b too. The capsule looks pretty good. Not perfect but pretty good. 16a is my pick too. Maybe make that card slightly taller though so it's a little more prominent. Not a lot but a bit more. Archived tag in the list sounds good too. That's probably a good thing to add too. And yea we should say when it was archived for the date label. So I guess "archived" should be an object not a flag on the data model so that it can support things like this."
**Locked:** 15b, 16a (height: turn 14), 17a, 14b. Data model: archived is an object (at least when), not a boolean. Still a proposal: the archived exact-name warning ("Pec Deck is archived").

### Turn 14 · 2026-11-26 · the Archived row, a little taller
| Id | Option | Stamp |
|---|---|---|
| 18a | 52px | Rejected · 18b locked |
| 18b | 56px, the exercise rows' height (Claude's pick) | **Locked** |

Owner (2026-11-26): "18b yeah." **Locked:** the Archived row is 56px. "I need to see the warnings your proposing. I can't visualize it right now."

### Turn 15 · 2026-11-26 · ✓ on a name matching an archived exercise
| Id | Option | Stamp |
|---|---|---|
| 19a | "Pec Deck is archived": Unarchive Pec Deck / Add anyway; unarchive closes New exercise and opens its page (Claude's pick) | **Locked** |
| 19b | "Pec Deck is archived": Open Pec Deck / Add anyway | Rejected · 19a locked |
| 19c | Same alert as an active duplicate ("already exists") | Rejected · 19a locked |

Owner (2026-11-26): "Yeah A is cool. Let's just make sure this is apples default glass popup when creating this. Not trying to roll our own popup." **Locked:** 19a. App-wide rule added to the README: alerts and confirmations are always Apple's system ones in the default glass look, never custom-drawn.

### Built · 2026-11-26
All Exercises Demo.dc.html (gen_allex_demo.py): everything locked in turns 1–15 on one phone. A–Z with letter labels and index; filter top right (r8c rollers, ✓ applies, Reset; applied = blue icon and dot); floating + opens New exercise (r9a) with "Already in your list" (three, then the count; archived matches tagged), ✓ grey until a name, the duplicate alerts (r10b active, 19a archived); the 56px Archived row opens Archived (rows "Archived Jul 2"; drag left for the Unarchive capsule). The name is filled by buttons under the phone (no keyboard); search, Equipment's menu and the note are not wired; alerts stand in for Apple's. In the whole-app demo it replaces the placeholder: Progress › All exercises; Back Squat opens Exercise detail, Hammer Curl the accessory page; Back returns to Progress.

Owner (2026-11-26), on the line once drawn at the top of Archived ("Hidden from workouts, Add exercise and Swap. History and records are kept."): "Yeah keep the working out of it. We don't need it." Archived has no explanatory line. All exercises marked done on the checklist (s01).
