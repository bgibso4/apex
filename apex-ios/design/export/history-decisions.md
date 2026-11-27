# History — decisions log

Same rules as `home-decisions.md` and `calendar-decisions.md`: every option in `History Explorations.dc.html` carries a stamp, shown as a tag beside its name on the page. **Locked** = stands · **Rejected** = turned down, reason recorded · **Superseded** = replaced by a later turn · **Fallback** = drop-back if the winner fails. **Highest turn number wins.**

## Inherited (locked)

| Area | Decision |
|---|---|
| Entry | The History glass button, top right on Calendar, opens this page. It replaces the old history screen as the list view (calendar-decisions) |
| Header | Pushed screen: glass back, centered title 17/700 (iOS 27 pass; was 20/800) |
| Row tap | Opens the existing session detail page (app/session/[id]). No new page |
| Chrome | iOS 27 Liquid Glass tab bar and buttons (home-decisions, app-wide) |
| Units | App-wide setting; mocks use mi + lb |

## Locked

| Area | Decision |
|---|---|
| Jobs | All three: scan recent training (newest first), find a session (search + filter chips), review a program (grouping) (scoping, turn 0) |
| Missed sessions | Not in the list at all (turn 3) · owner: a "Not logged" row does nothing for us. Supersedes the turn 1 proposal |
| Rows | Glance: session name, then sets and PRs in moss, date on the right (turn 2). Lifting rows drop the time; cardio keeps distance and time (turn 3). Owner: "100% glance view"; keep it small and clean, not bulky or wordy |
| Two sessions in a day | 9b (2026-11-25): one row each, newest first; on that day only, each row shows its time under the date (6:40 PM, 6:10 AM). Every other row keeps the date only |
| Moved sessions | A session done on a day other than its planned one carries the grey Moved tag beside its name, as on Calendar (owner 2026-11-25, turn 9) |
| Cardio | Attached: a run on the same day as a session folds into that session's row ("Run · 3.1 mi · 28 min"); a run on its own day keeps its own row. Runs were logged separately from the session, so they must never show twice (turn 2). On a day with two sessions the run folds into the first session of the day, unless one of the sessions has a run prescribed in it; then it goes with that one (owner 2026-11-25) |
| Grouping | By program, newest first (turn 2). Program header solid ("Pillars · Aug 3"), block labels dotted inside it ("Strength · Sep 7"), matching Calendar. A month change starts a new card with no label (2a). Program headers count sessions ("35 sessions"), since missed ones are gone (turn 3). Locked at close |
| Filter placement | 3b: a 44px glass button top right, opposite back; blue dot when a filter is on. Search keeps the full width (turn 4) · owner: "I like B" |
| Filter contents | Top-level groups, each collapsible, multi-select: Body part, Session, Program, Exercise (turn 5; owner: "body parts, session, program, maybe more"). Picks inside a group widen the list (OR); picks across groups narrow it (AND). Body part needs each exercise tagged with the muscles it trains |
| Filter look | 7a's styling (turn 8): flat sections, title with a count, hairlines between sections, no cards or tinted panels; options are Edit exercise's pills since All Exercises turn 9 rHa (owner 2026-11-26), replacing the 15/400 options beside a selection circle and superseding turn 4's "chips look messy". Exercise shows five, then Show all. Footer: Show N sessions, Reset (N) under it. Owner: lighter than the chunky turn 4 to 6 versions |
| Filter sheet | 8c (turn 8): the iOS large glass sheet, stopping just under the status bar, grabber, 44px glass close top left (iOS 27 pass; was top right), title centered 17/700, capsule Show N sessions, list dimmed behind, swipe down or tap outside to close. Sections collapse to one line (title, count, chevron) and open in place; Body part open to start; several can be open. Scrolls inside; Filter / Clear pinned at the top, Show N sessions pinned at the bottom (turn 5). Chips rejected (uneven sizes looked messy); the glass menu rejected |
| Search + quick pills | Keep search and quick pills: All · PRs · Upper · Lower · Runs (turn 2) · owner: "really love" the search and pills. Pills fit on one line, no sideways scroll (turn 3). Filter moves out of the pill row, icon only, no text (turn 3) |

## Open

- More filter groups beyond Body part, Session, Program, Exercise, if needed later.
- Bottom search with a folding tab bar (3c): parked as a possible app-wide pattern if something else becomes searchable.
- Cardio logging: owner may rethink logging runs inside the session instead of separately. Not a History decision.
- Search: sits at the top, full width (locked with 3b). What it matches (session names, lifts, both) to settle at build.

---

### Turn 0 · 2026-11-06 · scoping

Owner: the page does all three jobs. Cardio, row depth and grouping to be mocked side by side rather than decided in chat.

### Turn 1 · 2026-11-06 · grouping, row depth, what's listed

Three phones, each a different starting mix; per-phone switches (Group · Rows · Cardio) mix any combination. Same data as Calendar (Foundations from Jul 6, Pillars from Aug 3, today Aug 20).

| Id | Group · Rows · Cardio | Stamp |
|---|---|---|
| 1a | Month · glance · own rows | **Glance locked** · month grouping and own-row runs not picked |
| 1b | Program · glance + top lifts · lifting only | **Program locked** · top lifts and lifting only rejected |
| 1c | Week · one line · attached | **Attached locked** · week grouping not picked, one line rejected |

### Turn 2 · 2026-11-06 · program groups with month breaks, filter sheet

Today moved to Thu Sep 24 in these mocks so Pillars crosses a month (Aug → Sep) and a block (Hypertrophy → Strength, Sep 7). Program header solid ("Pillars · Aug 3"), blocks dotted ("Strength · Sep 7"), a month change inside a block starts a new card.

| Id | Month break | Stamp |
|---|---|---|
| 2a | New card, no label | **Month break locked** |
| 2b | New card with a grey month caption | **Not picked** |

Filter: a "Filter" pill at the end of the quick pills opens a glass sheet: Body part (Chest, Back, Shoulders, Arms, Legs, Core) and Session (Upper, Lower, Full body, Foundations), multi-select, combined with the quick pill. The pill shows the count when active ("Filter · 1"). Primary button "Show N sessions" (blue), Clear in the sheet header.

### Turn 3 · 2026-11-06 · leaner rows, Filter and Search placement

Owner references: Under Armour (search floating above the tab bar; on scroll the tab bar folds into a circle beside it), Lifetime (small icons and text read clean). Applied to all three: no time on lifting rows, no missed sessions, session counts in headers, pills on one line, silent month break, blocks dotted.

| Id | Filter / Search | Stamp |
|---|---|---|
| 3a | Filter icon (40px) beside the search field, blue dot when active | **Not picked** |
| 3b | Filter as a 44px glass button top right, opposite back | **Locked** |
| 3c | Search capsule above the tab bar; on scroll the tab bar folds into a Home circle left of it; filter icon inside the search capsule | **Parked** · app-wide idea, revisit if search spreads |

### Turn 4 · 2026-11-06 · how the filter looks

Owner: keep Body part and Session; the chips look messy at all different sizes. All on 3b.

| Id | Filter style | Stamp |
|---|---|---|
| 4a | Sheet with equal tiles: body parts 3 × 2, sessions 2 × 2, picked = accent tint; Show N sessions | unreviewed |
| 4b | Sheet with iOS checklist rows, blue checkmark on the right | unreviewed |
| 4c | Liquid Glass pull-down menu from the button, checkmarks on the left, filters live, Clear filters at the bottom | unreviewed |

### Turn 5 · 2026-11-06 · filter as collapsible groups

Owner: leaning 4b, but structured like a clothing store's filter: top-level groups that expand into their options; half-screen, scrollable. 4c "terrible".

Stamps for turn 4: 4a **Not picked** · 4b **Rows kept in 5** · 4c **Rejected**.

| Id | Inside an open group | Stamp |
|---|---|---|
| 5a | Checklist rows (4b), blue check on the right | unreviewed |
| 5b | Equal tiles (4a), 2 or 3 across | unreviewed |

Each group row shows its pick on the right in blue ("Chest", "Chest +1") or "Any" in grey, with a chevron that turns down when open. Several groups can be open at once.

### Turn 6 · 2026-11-06 · telling groups from their options

Stamps for turn 5: 5a **Picked, refining** · 5b **Not picked**. On all three: group rows 16/700; options 14px, #A4A5AC, medium, white and semibold once picked.

| Id | How options sit under their group | Stamp |
|---|---|---|
| 6a | Indented 16px, dividers start at the indent | unreviewed |
| 6b | In a recessed darker well inside the group card | unreviewed |
| 6c | Leading selection circles (fill blue with a check when picked), no trailing checkmarks | unreviewed |

Turn 6 phones open with Body part and Session expanded on a full-height sheet.

### Turn 7 · 2026-11-06 · a lighter filter

Owner: everything so far is chunky and heavy; take Nike's filter as a cue for simplicity, without copying it. Turn 6 stamps: 6a, 6b **Superseded** · 6c **Circles kept in 7**.

Shared: full-screen page over the list (status bar stays). "Filter" 20/800 left, 44px glass close top right. No cards or tinted panels: sections are a 15/600 title with a count ("Body part (1)") and a hairline between sections. Options are 15/400 text beside a 20px selection circle (grey ring; blue fill with a check when picked), 40px rows, no dividers. Footer: blue Show N sessions, Reset (N) as secondary text under it.

| Id | Sections | Stamp |
|---|---|---|
| 7a | All open; Exercise shows five, then Show all | unreviewed |
| 7b | Collapsible: title, count and chevron; Body part open to start | unreviewed |

### Turn 8 · 2026-11-06 · 7a's filter as a sheet

Owner: going with 7a's content; unsure whether a full page or a sheet. Turn 7 stamps: 7a **Content locked** · 7b **Not picked**.

| Id | Container | Stamp |
|---|---|---|
| 8a | Large glass sheet (772px, stops under the status bar), grabber, glass close, list dimmed behind | **Not picked** |
| 8b | Two-thirds glass sheet (560px), History's header and pills visible above it | **Not picked** |
| 8c | 8a's large sheet with collapsible sections (title, count, chevron), Body part open to start, several can be open | **Locked** · owner: collapsible is better |

### History complete · 2026-11-06 · reference build

`History Demo.dc.html` is the reference build: one phone with every lock (header with glass back and filter, search, one-line quick pills, program groups with dotted blocks and silent month breaks, glance rows, runs attached, no missed sessions, the 8c filter sheet). Static record: History Explorations turns 1 to 8.

Build notes: body-part filtering needs each exercise tagged with the muscles it trains; runs attach to a same-day session at read time (they are logged separately today).

iOS 27 pass (2026-11-07): title 17/700 centered; filter sheet close moved top left, sheet title centered 17/700, Show N sessions is a capsule. Grey labels #7C7E86, 11px minimum. See home-decisions.md.

### Turn 9 · 2026-11-25 · a day with two sessions
Follow-up (checklist f05), after Calendar 12b/13b (two sessions = two cards, the second "Same day") and 10a (a grey Moved tag on a session done on another day than planned). Owner: "Sounds good let's do it." Sample in History's own week: Mon Sep 21's Lower Strength · Squat done Tue Sep 22 at 6:10 AM; Tue's Upper Strength · Heavy Push at 6:40 PM; Monday has no row (missed sessions aren't listed, turn 3).

| Id | Option | Stamp |
|---|---|---|
| 9a | Two rows, newest first, the date on both | Unreviewed |
| 9b | Two rows, newest first, the time under the date on that day only | Unreviewed |

In both: the Moved tag beside the moved session's name, carried over from Calendar's rule and flagged for the owner to confirm for History. Full screens (`shots/history-9a.png`, `9b`) drawn over the History Demo. Claude's suggestion: 9b.
Not drawn, open: a run on a day with two sessions. The Cardio rule folds a same-day run into "that session's row"; with two sessions it doesn't say which.
Owner (2026-11-25) on turn 9: "Yeah B. And the moved tag looks good there too." **Locked:** 9b, and the Moved tag on History rows. 9a rejected. Built into the History Demo (`gen_history_demo9.py`: Mon Sep 21's Squat done Tue Sep 22 at 6:10 AM with the Moved tag; Tue's Heavy Push at 6:40 PM; Monday has no row) and the whole-app demo. Locked table and README (both copies) updated. Which row a run folds into on a two-session day: decided below.

### History checked against the rules added since it was built · 2026-11-25
Checked the History Demo against every app-wide rule added after 2026-11-07. Passing: pushed-screen header (glass back, 17/700 title, one glass action); 11px floor and the iOS 27 greys (the 10px tab bar labels are the tab bar's); no em dashes; chevrons only on the filter sheet's collapsible sections, which the README allows; the filter sheet is the standard large glass sheet with close top left; Moved tag (9b); no menus, deletes or toasts in the design (the demo's notes stand in for screens it can't open).
No changes needed. Carried to the consistency pass, not a History question: History's sample (today Thu Sep 24) differs from Calendar's and the Workout tab's (today Thu Aug 20).
Owner (2026-11-25) on the run on a two-session day: "Just log the run with the first session of the day. Doesn't really matter too much. Unless the workout itself had a run prescribed in it then clearly those are supposed to be tied together." **Locked:** a run on a day with two sessions folds into the first session of the day; if one of the sessions has a run prescribed in it, the run goes with that session. Cardio row in the Locked table updated. Not in the demo's sample (no run on Tue Sep 22).
Owner (2026-11-25): "So write that as a rule." Written into the README's Data rules (both copies), for History and Calendar: a run on a day with a session goes with that session; with two sessions, the first of the day, unless one has a run prescribed. Calendar already shows a day's runs on its first card.
Owner (2026-11-25): "That rule applies to any cardio too btw." README rule reworded from a run to any cardio (a run, a ride, a row, anything logged as cardio).

### From All Exercises turn 9 · 2026-11-26 · the filter's options as pills
Owner, on the filter sheet: it "looks super weird ... out of place on our app" (said of the same sheet for All exercises); on the restyle: "RhA is also I think what we want." The sheet keeps 8c's frame, sections with counts, multi-pick (OR inside, AND across), Show N sessions and Reset; each option is now Edit exercise's pill (13/600, accent outline and 10% tint when picked) in place of the 15/400 text beside a selection circle. Built in the History Demo and the whole-app demo (gen_hist9.py).
