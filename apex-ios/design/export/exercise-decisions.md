# Exercise detail — decisions log

Same rules as the other logs: every option in `Exercise Detail Explorations.dc.html` carries a stamp. **Locked** = stands · **Rejected** = turned down · **Superseded** = replaced later · **Unreviewed** = not decided. Only the owner locks or rejects. **Highest turn number wins.**

## Carried in (locked elsewhere)

| Area | Decision | From |
|---|---|---|
| Entry | Main-lift tiles on Progress open it; All exercises (later) too | progress-decisions |
| Sessions | Past sessions, each opens its Session detail | progress scoping (owner) |
| Records | Est. 1RM plus rep records at 1, 3, 5, 8, 12, 15 (PR rule); the real 1-rep PR lives here | owner, after Progress turn 11 |
| Info | An info element explains the tile number (est. 1RM, average of the best 3 sessions in the range) | owner, after Progress turn 16 |
| Identity | Exercises keyed by ID (rename keeps history, duplicates prevented) | owner |
| Smoothing | Median of 3; none under 8 sessions | Progress turn 12 |

## Locked (scoping, owner 2026-11-12)

| Area | Decision |
|---|---|
| Resources | Links as rich previews (thumbnail, title, source; tap opens the app) |
| No next session | The next-session card doesn't belong on Exercise detail (owner, after turn 2) |
| Focus | Est. 1RM and the PRs are where the time and innovation go; show the date each record was achieved (owner, after turn 2) |
| Rep records | Their own section, not on the graph (owner, after turn 4) |
| Explanation | A full-width row at the foot of the est. 1RM card, collapsed by default, opens in place; no (i) button; readout labels just Now / Best (owner, after turn 7). Content: much shorter and cleaner, like Whoop's "What is …?" card |
| Direction | Strength as a trend line over time with the PRs on it (3d closest); the rep-record curve is much less useful (owner, after turn 3) |

## Open

- Lead: chart-led vs records-led (owner: show both).
- Range control: Progress's chips + paging vs chips only (owner: show both).
- Managing the exercise (rename, muscle tags, notes, archive): decide later. Owner asked what "only in All exercises" meant (explained in chat).
- Trend for accessories by exercise type (heaviest set, most reps, longest hold, best pace): proposed in Progress scoping, not decided.

## Turns

### Turn 1 · 2026-11-12 · lead and range control

Mock: Back Squat from Progress on 6M. Pushed screen, glass back, lift name as the 17/700 title. Full control: chips, then the period with arrows on a line under them (the title row holds the lift name). Trend card: est. 1RM hero + change, (i) opens the explanation in place, session dots + median line, gridlines. Records grid, Sessions (3 rows + Show all), Resources (link previews).

| Id | Option | Stamp |
|---|---|---|
| 1a | Chart-led · full range control | Unreviewed |
| 1b | Chart-led · chips only | Unreviewed |
| 1c | Records-led · full range control | Unreviewed |
| 1d | Records-led · chips only | Unreviewed |

After turn 1 (owner): similar to the current exercise screen but missing a couple of things; be a little more creative. Claude could not open the repo this session; "current" taken from the design system notes (hero metric, trend chart with block bands, time chips, session rows, type-adaptive metrics, resource links, View all progression/sessions) and the RPE auto-progression brief (progression history ↑/↓, editable increment, accessories only).

### Turn 2 · 2026-11-12 · what we missed, and more creative takes

| Id | Option | Stamp |
|---|---|---|
| 2a | (Next-session card rejected by owner: doesn't belong here) Coach view: next session from the program (sets × reps @ weight, RPE) with the set that would beat a record; trend overlays this block vs the last same-type block (ghost line); compact records row | Unreviewed |
| 2b | Strength curve: best real set at each rep count vs the curve the est. 1RM predicts; blue gap = room for a record; table with estimates | Unreviewed |
| 2c | Timeline: sessions grouped by block, top set, est. 1RM, PR pills, your exercise notes inline | Unreviewed |
| 2d | Accessory (Hammer Curl): working weight as a step chart, auto-progression history and increment, records at the rep counts used | Unreviewed |

After turn 2 (owner): definitely not the next-session card. Likes the creativity with est. 1RM and the PRs (2b); spend most of the time and innovation here. Likes showing the date each was achieved. More renditions.

### Turn 3 · 2026-11-13 · est. 1RM and rep records, with dates

| Id | Option | Stamp |
|---|---|---|
| 3a | Curve inside the est. 1RM card, each record dot labelled with weight and date; one line names the biggest gap | Unreviewed |
| 3b | Ladder: a bar per rep count for your best, a tick for the predicted weight, weight and date on the right | Unreviewed |
| 3c | Small multiples: per rep count, the record, date and age, a step line of every time it was raised, gain since the first | Unreviewed |
| 3d | Est. 1RM line with a lane of record markers on the days they were set; latest records listed with date and age | Unreviewed |

After turn 3 (owner): 3d closest. Likes a trend line of strength over time; a curve of rep records is way less useful (3a rejected; 2b's curve superseded). Use the screen to see PRs and how strength progresses, especially main lifts. Accessories matter less; think of a view for an experienced lifter who won't make major accessory gains (still fine for less experienced lifters).

### Turn 4 · 2026-11-13 · strength over time with PRs; accessories for an experienced lifter

| Id | Option | Stamp |
|---|---|---|
| 4a | Records as circles on the est. 1RM line (rep count inside), latest records listed with date and age, Show all records | Rejected (owner: none of turn 4) |
| 4b | Line over shaded program blocks, record dots on the line, records grouped by block | Rejected (owner: none of turn 4) |
| 4c | Rep-count pills: All shows every record on the line; picking one overlays that record's step history | Rejected (owner: none of turn 4) |
| 4d | Accessory: working weight and how long it's held, tiles for reps at that weight and avg RPE, session log, records | Rejected (owner: none of turn 4) |
| 4e | Accessory: a fact sentence (same weight, reps up, RPE down), two small charts, session log, auto-progression | Rejected (owner: none of turn 4) |

After turn 4 (owner): doesn't like any of these. Not: numbers on the graph (4a's rep counts in circles), tables of PRs, PRs per program/block. Think about what the graph should show first and work backwards from there.
Claude proposed: the graph answers "am I stronger, when were my PRs, where am I against my best": est. 1RM per session (smoothed) plus best-so-far as a staircase whose steps are the PRs; no numbers on the graph, tap or drag to read a day. Owner: rep records should be a separate section.

### Turn 5 · 2026-11-16 · the graph first

| Id | Option | Stamp |
|---|---|---|
| 5a | Smoothed est. 1RM line + best-so-far staircase; readout above (now vs best), touch or drag to read a session | Unreviewed |
| 5b | 5a with a moss dot at each PR step | Superseded · refined in 6–8 (owner: no separate lock needed) |
| 5c | 5b with the gap between best and est. 1RM lightly shaded | Unreviewed |

After turn 5 (owner): leaning 5b (Claude agreed: dots answer "when were my PRs" without numbers; 5c's shading reads as an alarm in planned hypertrophy blocks). Owner agreed to two refinements, wants to see them: snap the readout to a PR when dragging near its dot; merge PR dots that crowd on long ranges. Also: when a range has no PR, consider whether the flat best line should be there.

### Turn 6 · 2026-11-16 · 5b refined, and a range with no PR

All three: snap-to-PR (12px), merged PR dots (closer than 7px, larger dot, readout lists them), chips working, All by month. They differ only when a range has no PR (Program: none since Oct 15).

| Id | Option | Stamp |
|---|---|---|
| 6a | No PR: keep the flat solid best line | Rejected |
| 6b | No PR: dashed best line with one label (Best 370 · Oct 15) | **Locked** (owner): dashed line, no label (no numbers on the graph) |
| 6c | No PR: no best line; legend says No PR in this range | Rejected |

After turn 6 (owner): do we need "Now · best 3 sessions"? Or a small section under the graph, collapsed by default, with details on the est. 1RM calculation; then no info button either.

### Turn 7 · 2026-11-16 · explanation under the graph, no (i)

Both: readout says Now / Best; no (i); explanation collapsed under the graph (est. 1RM, Now, Change, Line, Best so far, pointer to Rep records). No-PR case uses Claude's turn-6 suggestion (dashed best line, no label); not decided.

| Id | Option | Stamp |
|---|---|---|
| 7a | "How it's calculated" as a full-width row at the foot of the est. 1RM card, chevron, expands in place | **Locked** as the pattern (owner: "definitely full width"); text too detailed, refined in 8 |
| 7b | Same explanation behind a small grey text link under the legend | Rejected |

After turn 7 (owner): definitely the full-width row; cleaner still; way too much detail. Reference: Whoop's "What is Respiratory Rate?" card (title + a few plain sentences), noting Whoop's sits on a screen solely about that metric. Asked how sensitive the PR snap should be.

### Turn 8 · 2026-11-16 · shorter explanation

| Id | Option | Stamp |
|---|---|---|
| 8a | Row titled "What is est. 1RM?"; two short paragraphs (what it is; Now, the line, green dots) | **Locked**, title less bold (owner) |
| 8b | Row titled "About est. 1RM"; one paragraph, three sentences | Rejected |

After turn 8 (owner): 8a, but the "What is est. 1RM?" title not as bold (now regular weight, light grey). Open: snap sensitivity (Claude suggested 12pt, as mocked) and a light haptic when the readout snaps to a PR (new use, owner's call).
Also (owner): title vertically centred between the divider and the card's bottom edge (the row takes the card's bottom padding).

After turn 8, graph (owner): no PR in range = dashed best line (6b). Snap distance 12pt, tune on device later. Subtle haptic when the readout snaps to a PR: yes, if subtle. 6b's label dropped (owner agreed). 5b: owner says no separate lock needed; it was refined in 6–8, so Superseded.
Rep records (owner): likes the 2x3 rep records card (not formally locked). Asked whether to add a View all that opens a full list of PRs on another page.

After turn 8, also (owner): agreed with how the change % works (same rule as Progress, not from the start of the period). Wants the View all page for rep records, but only the six flagged rep counts; other counts would be noise. Show all for sessions and for PRs should each push another screen; a long list expanding in place won't look good. Program blocks on the graph were nice in the current app but its version is janky (cut-off dot legend above the chart); worth trying.

### Turn 9 · 2026-11-16 · View all and Show all as their own screens

Both phones start on the Exercise detail as it stands; Rep records gets View all, Sessions' Show all drops its count; both push (stand-in for the system push). Sessions page (same on both, unreviewed): every session newest first, a card per month.

| Option | What | Status |
|---|---|---|
| 9a | Rep records page: six rows (best, date); tap a row to open every raise of that record in place, newest first, with +lb | Closest · refined in 13–15 |
| 9b | Rep records page: a card per rep count with a small staircase of its history and every raise listed | Rejected |

### Turn 10 · 2026-11-16 · program blocks on the graph

Grey tones only. In all three, dragging adds the block to the readout's second line (Pillars · Strength · Top set …).

| Option | What | Status |
|---|---|---|
| 10a | Thin block strip between graph and months, shaded by type; name only when the full word fits; wider gap at a new program | Superseded · refined in 11 |
| 10b | Programs as alternating faint columns behind the line, name at the top when it fits; block changes as dotted rules | Rejected |
| 10c | Nothing at rest; while dragging, the block under the finger lights up and the readout names it | Superseded · refined in 11 |

After turn 10 (owner): A and C the most; narrowed to those. Worried A gets messy on All (too many small things; all blocks of all programs over two years would be terrible). Past ~10 blocks in the range, show programs instead of blocks (10 may even be high; try it). Show on 1Y and All.

### Turn 11 · 2026-11-17 · blocks, or programs past 10 blocks

Blocks counted from every session in range: Program 1 · 6M 8 · 1Y 17 → 6 programs · All 21 → 7 programs. Spans come from every session, so All's are true to the calendar.

| Option | What | Status |
|---|---|---|
| 11a | 10a strip; over 10 blocks, one segment per program (two alternating greys, name when it fits) | Superseded · combined in 12 |
| 11b | 10c drag highlight; over 10 blocks, the whole program lights up; readout still names program and block | Superseded · combined in 12 |

After turn 11 (owner): snap a little too sensitive. Asked to see A and C together (too noisy?).

### Turn 12 · 2026-11-17 · strip and drag together; gentler snap

Snap 6pt on these (was 12); still to check on device. Both open on 1Y.

| Option | What | Status |
|---|---|---|
| 12a | 11a strip at rest; while dragging, column over the graph + outlined strip segment + readout names it | **Locked** (owner) |
| 12b | 11a strip at rest; while dragging, only the strip segment is outlined + readout names it | Rejected |

After turn 12 (owner): lock 12a. Note in the design to revisit the snap: 6pt in the mocks (12pt felt too sensitive), final value set on device.
Also (owner): the legend under the graph (Est. 1RM · Best so far · PR) centred horizontally as a group. Applied on turn 12's phones.

After turn 9 (owner): neither, 9a closer. Rep records card on Exercise detail looks good and clean; a little hesitant about "No sets yet" (probably fine). Options to see: only achieved records (no notice for the rest); a table-like card, one record per row, each tappable, only achieved. View all may be a bit small to tap. Rep records page needs the most work: top shows the records in a more celebratory way (all achieved; No sets yet here if the card hides them); below, a history of every rep record set, even since beaten; a list, no graphs. Sessions: borrow the session row already designed; rows the same on Sessions page and Exercise detail; loves the month grouping. e1RM column only for main lifts? Show accessories too. Also consider Show all opening a pre-filtered History (maybe too heavy for one lift).

### Turn 13 · 2026-11-17 · the rep records card
View all: chevron + full 44pt tap area on all three.

| Option | What | Status |
|---|---|---|
| 13a | 2×3 grid, all six (No sets yet for 15) | Rejected |
| 13b | Grid, only achieved | Rejected |
| 13c | One row per achieved record (reps, weight, New, date, chevron); tap opens the page filtered to that rep count | **Locked** (owner) |

### Turn 14 · 2026-11-17 · Rep records page
Both: History list of every record set (current white, beaten grey, +lb or First), pills All · 1 · 3 · 5 · 8 · 12 narrow it.

| Option | What | Status |
|---|---|---|
| 14a | Earned card (moss wash) with all six, big weights, dot on new, No sets yet for 15; History by year | Superseded · year grouping kept in 17 |
| 14b | Earned card with the latest record as hero (+lb), others small underneath; History a card per month | Superseded · hero kept in 17 |

### Turn 15 · 2026-11-17 · Sessions
15a/15b use History's glance row with this lift's sets; each shown for Back Squat (main) and Hammer Curl (accessory, mock data), on the Sessions page and the Exercise detail card.

| Option | What | Status |
|---|---|---|
| 15a | Date right (as History); e1RM in the second line for main lifts; accessories: weight, reps per set, RPE | Superseded · row redesigned in 19 |
| 15b | Right column = e1RM (main) or top set (accessory); date in the second line | Superseded · row redesigned in 19 |
| 15c | Show all opens History filtered to the exercise (whole-session rows, no e1RM) | Rejected |

After turns 13–15 (owner): 13 leaning C; wants 13a and 13c shown with only two rep records filled. "New" for the last two weeks makes sense. 14: likes the hero (more celebratory); centre the other records horizontally; group History by year, not month. Not convinced by the rep pills (very small): try wider pills on two lines, and a different option such as a menu. 15: doesn't like opening History (15c rejected); the row needs better design; park Sessions until the rest is aligned ("doing too much at once").

### Turn 16 · 2026-11-17 · rep records card, two records set
| Option | What | Status |
|---|---|---|
| 16a | 13a grid with only 5 and 8 reps set (four No sets yet) | Rejected |
| 16b | 13c rows with only 5 and 8 reps set (two rows, New on 8) | **Locked** (13c) |
| 16c | 13c full, for comparison | **Locked** (13c) |

### Turn 17 · 2026-11-17 · Rep records page
Both: 14b's hero, other records centred under it; History by year.

| Option | What | Status |
|---|---|---|
| 17a | Filter as six 40pt pills, two lines of three, full words | Rejected |
| 17b | Filter as one button on the History header (All reps ⌄) opening an iOS pull-down menu | Superseded · menu locked in 18a |

After turns 16–17 (owner): 13c / 16b / 16c definitely the way to go (locked: one row per record you've set, New for the last two weeks, tap opens the Rep records page on that rep count). Rep records page: too noisy and celebratory? See a version less in your face. Menu rather than pills, but styled better (looked small, poorly spaced). "History" should read as the app's standard section title; it looked the same as the year under it.

### Turn 18 · 2026-11-18 · Rep records page, quieter
All three: History stays the app's section eyebrow (same as Main lifts, Exercises, Sessions) with the 24pt section gap; years become a quiet divider (12/600 grey + hairline); menu button 36pt, 14/600, 44pt tap area.

| Option | What | Status |
|---|---|---|
| 18a | Latest record on a plain card, 30pt, moss only on +lb; others centred under it | **Locked** (owner) |
| 18b | No hero: Current records as 13c rows (+ No sets yet), New on the latest | Rejected |
| 18c | Latest record as a centred line on the background, no card; others in a plain card | Rejected |

After turn 18 (owner): 18a. Rep records page locked: latest record on a plain card (30pt, moss only on +lb), other records centred under it; History eyebrow with the 24pt section gap; restyled All reps menu; History by year with the year as a quiet divider; current records white, beaten grey, +lb or First.
Owner: make sure the dropdown is consistent across the app. The only other menu is Session detail's ••• menu; the Rep records menu now uses its exact panel (220pt, radius 22, 46pt rows, 16pt text, same glass and timing). Added an app-wide Menus rule to the README.

Owner: move on (to the parked Sessions row).

### Turn 19 · 2026-11-18 · Sessions · a better row
All three lead with what you did on this lift (not the session name), no chevrons (as History), month cards kept; sets shown as 4 × 8 when all sets hit the same reps, otherwise each set (8, 8, 8, 7). Right number: e1RM for main lifts, RPE for accessories. Each shown for Back Squat and Hammer Curl on the Sessions page and the Exercise detail card.

| Option | What | Status |
|---|---|---|
| 19a | Date tile (weekday over day); title = sets · weight (+PR tag); session name (+RPE for main) under; number right | Superseded · refined in 20–21 |
| 19b | Title = weight × each set's reps (short set dimmer); date · session under; number right | Unreviewed |
| 19c | One line: date, sets · weight (+PR / Deload tags), number | Unreviewed |

After turn 19 (owner): 19a definitely looks better, the best option so far, though a little messy and cluttered. Asked what tapping a row does.

Owner: see a less cluttered 19a and the tap (Claude's proposal: open that session's Session detail, scrolled to this exercise, with a brief highlight) before moving on.

### Turn 20 · 2026-11-19 · 19a decluttered, and what a tap opens
Both: no session name; the e1RM label moves from every row to the month header (Est. 1RM; RPE for accessories). Tap a row: Session detail pushes in, scrolled to Back Squat (the row's real sets), thin accent outline fading over ~2s; back returns to the same scroll position.

| Option | What | Status |
|---|---|---|
| 20a | One line: date tile, sets · weight (+PR / Deload tags), number | Rejected |
| 20b | Two lines: sets · weight (+PR) over RPE (· Deload), number | Superseded · program added in 21 |

After turn 20 (owner): fine with two lines; likes RPE listed. Est. 1RM / RPE label in the header is good, especially on the Sessions page. On Exercise detail the header sat a little high above the card. Not the workout name, maybe the program name; draw one up. (Tap opening Session detail at the exercise: shown, not yet commented on.)

### Turn 21 · 2026-11-19 · two lines, with the program
Exercise detail Sessions header now the standard 6pt above its card. Tap behaviour as turn 20.

| Option | What | Status |
|---|---|---|
| 21a | Second line: RPE · program (· Deload); accessories: program only (RPE is the right-hand number) | **Locked** (owner) · row and tap |
| 21b | Second line: RPE · program · block | Rejected |

After turn 21 (owner): agreed, 21a. Sessions row locked: date tile; sets · weight (+PR tag); RPE · program (· Deload) under it; Est. 1RM (main) or RPE (accessory) on the right, labelled once in the header; month cards; same row on the Sessions page and the Exercise detail card. Tap opening Session detail scrolled to the exercise with a fading outline: shown in 20–21, not yet explicitly confirmed.

Tap behaviour (owner, 2026-11-19): asked to see it animated (recording sent), then asked whether it goes against the design system. Claude: the scroll is fine; the accent outline is not (accent = now; nothing glows but the newly-due pulse; 2s is outside the locked timings). Owner agreed to scroll only; 21a/21b updated, re-recorded for his judgement. Not yet locked.

Owner (2026-11-19): scroll-only tap looks good, locked. A Sessions row opens Session detail scrolled to the exercise, no highlight; back returns to the same scroll position. Added to the README (Lists).

Owner: keep going; asked what the "managing the exercise" question was (answered in chat: where rename / edit details / archive live; Claude suggests a ••• menu on Exercise detail; undecided).

### Turn 22 · 2026-11-19 · Resources
Claude's assumptions, unreviewed: links you save yourself (paste; the app fetches title and thumbnail); Add link opens a small sheet with one field; remove by swipe › trash with Undo.

| Option | What | Status |
|---|---|---|
| 22a | One card, a row per link (thumbnail + length, title, source), Add link as the last row | **Locked** (owner) |
| 22b | Two-column tiles, larger thumbnails, dashed Add link tile | Rejected |
| 22c | Empty state: the card with only Add link | Empty state of 22a |

After turn 22 (owner): likes Resources, leaning to the rows card (22a). May ship with some links already, but assume blank. Asked what Add link looks like and does; whether thumbnails are obtainable (YouTube, Instagram, TikTok); what a row looks like when one can't be retrieved.

Thumbnail research (2026-11-20): Meta removed thumbnail_url and author fields from Instagram oEmbed on 2025-11-03 (tokenless access since 2026-06-15 returns only the embed html); TikTok's oEmbed docs list no thumbnail field and mark it "deprecated soon". Claude's proposal: fetch with iOS LinkPresentation (the page's own title and image, on device, no per-site API), with a neutral fallback row.

### Turn 23 · 2026-11-20 · adding a link, rows without a thumbnail
| Option | What | Status |
|---|---|---|
| 23a | Add link: the standard sheet, one focused field with the system Paste button, URL keyboard, blue Add capsule; new row appears at the foot and fills in | Rejected · too big |
| 23b | Row states: fetched · fetching (placeholders) · no thumbnail (neutral tile with link mark) · nothing fetched (site address as title) | Superseded · redone in 26 |

After turn 23 (owner): the Add link sheet looks terrible; a full-page card isn't needed, a smaller pop-up will do. The keyboard must never overlap buttons or anything. No giant Add button; maybe Add top right. The no-thumbnail fallback rows definitely need to be reliable (23b still unreviewed in detail).

### Turn 24 · 2026-11-20 · a smaller Add link
All: Add is a ✓ (Session detail's Done ✓), no big button, every control above the keyboard.

| Option | What | Status |
|---|---|---|
| 24a | Short sheet riding on the keyboard: close, title, ✓, field with system Paste | **Locked** (owner) · as refined in 25 |
| 24b | Small floating pop-up in the upper half: close, title, ✓, field | Rejected |
| 24c | In place: the Add link row becomes the field with ✓ beside it; keyboard bar with Done | Rejected |

After turn 24 (owner): it should be A; looks pretty good. Asked what the Paste button is for (answered in chat; keep or drop undecided).
Owner: keep the Paste button. Add link (24a) fully locked. Still open on Resources: 22a (leaning) and the four row states in 23b.

Owner: before locking, since the link is usually pasted, open with the keyboard closed and the card a little smaller; touching the field brings the keyboard and lifts the card.

### Turn 25 · 2026-11-20 · Add link opens without the keyboard
One design, three moments (24a refined).

| State | What | Status |
|---|---|---|
| 25a | Just opened: short sheet at the bottom, no keyboard, placeholder "Paste or type a link", grey ✓ | **Locked** (owner, after the live demo) |
| 25b | After Paste: link filled, ✓ blue; done without the keyboard | **Locked** (owner, after the live demo) |
| 25c | Field tapped: URL keyboard rises, sheet rides up on it | **Locked** (owner, after the live demo) |

After turn 25 (owner): looks good for now, but wants to see it in an actual live demo of the screen; 24c might have been right, so compare there (Add link is therefore NOT locked; 24a's earlier lock is downgraded to leaning). 22a looks good, lock it. 23b: unclear what it showed; YouTube row good, no-thumbnail row understood; "what is the second one"; the fourth (Instagram, no title) is not great.

### Turn 26 · 2026-11-20 · what a row shows when the preview is missing
Each case on its own with when it happens (23b stacked them as if a list).

| Case | What | Status |
|---|---|---|
| 1 | Normal: thumbnail, length, title, source | **Locked** (owner, after the demo) |
| 2 | First second after adding: the link's address shown at once, then a quick fade to the real title and picture (no grey skeleton bars) | **Locked** (owner, after the demo) |
| 3 | Title but no picture: neutral tile with a link mark | **Locked** (owner, after the demo) |
| 4 | Nothing fetched: title built from the link (Instagram reel), start of the address under it; any link can be renamed (how: not designed) | **Locked** (owner, after the demo) |

After turn 26 (owner): how would renaming work? To avoid case 2, debounce-fetch as soon as the link is pasted, before saving. Will there be a name / title field too?

### Turn 27 · 2026-11-20 · preview while adding, a Title field, renaming
Fetch on paste (or ~0.5s after typing stops); ✓ live as soon as there is a link. Case 2 of turn 26 remains only if ✓ is tapped before the fetch returns.

| State | What | Status |
|---|---|---|
| 27a | After paste: sheet grows one row: thumbnail + Title field prefilled from the page | **Locked** (owner) · with a spinner while fetching |
| 27b | Nothing fetched: Title prefilled "Instagram reel" (from the link), editable before saving | **Locked** (owner) |
| 27c | Rename later: swipe a row left for Edit and trash; Edit opens the same sheet titled Edit link | Rejected |

After turn 27 (owner): not bad. Asked: loading animation while fetching? title editable when none comes back? cache the details? (Claude: yes; the Title field is always editable; fetch once at add time and store title + thumbnail, refetch only if the address is edited. Spinner not yet mocked.) The swipe to edit/delete feels different from the rest of the app (true: the only other swipe is set delete inside Session detail's edit mode, one action). Rather than a swipe, is there another way, given tap opens the link?

### Turn 28 · 2026-11-20 · edit / remove without a swipe
| Option | What | Status |
|---|---|---|
| 28a + 28b | Edit at the right of the Resources header; in edit mode each row shows a trash button and tapping a row opens Edit link; Done to finish | Rejected (owner) |
| 28c | A ••• on each row opening the standard menu (Edit link, Remove) | Rejected |

After turn 28 (owner): does not like the header Edit button (very hidden, looks like a header, small) or the trash icons on each row. 28c (••• per row) not commented on. Edit / remove for a link is still open.

Owner: asked to see what press and hold looks like.

### Turn 29 · 2026-11-20 · press and hold a link
| Option | What | Status |
|---|---|---|
| 29a | Working phone: hold a row ~0.5s; the row lifts, the rest dims and blurs, the standard menu (Edit link, Remove) opens under it; tap outside cancels; a normal tap still opens the link | Superseded · hint added in 30 |

After turn 29 (owner): seems fine; only hesitation is that press and hold isn't obvious as the way to edit or delete. Claude suggested a one-time hint; owner asked to see it.

### Turn 30 · 2026-11-20 · one-time hint
| Option | What | Status |
|---|---|---|
| 30a | Working phone: under the card, one line "Press and hold a link to edit or remove it."; shown once there is a link, gone for good after the first press and hold | **Locked** (owner) |

After turn 30 (owner): it's fine. Locked: edit / remove a link by press and hold (standard menu: Edit link, Remove), with a one-time hint line under the card that goes away after the first press and hold. Swipe (27c) and ••• per row (28c) rejected. Owner asked whether the hint is one-time or always there (one-time).

Owner: build the live demo now and judge the remaining Resources pieces there.

## Reference build · 2026-11-21
`Exercise Detail Demo.dc.html`: one working phone with every lock (range chips; est. 1RM graph with snap 6pt, merged PR dots, dashed no-PR line, block strip and drag column, programs past 10 blocks, centred legend; "What is est. 1RM?"; rep records rows and the Rep records page with the All reps menu; Sessions rows and page, tap opens Session detail scrolled to the exercise; Resources rows; press and hold with the one-time hint; Remove with Undo).
To judge in it (not locked): Add link as the short sheet that opens without the keyboard (25) vs in place (24c), by a switch above the phone; fetch on paste with a spinner in the thumbnail and the Title field (27a/27b); the missing-preview rows (26): Paste cycles a YouTube link, an Instagram link with a title but no picture, and one that returns nothing; ✓ before the fetch finishes shows the address first, then the title.
Not wired: typing, opening a link, other tabs. Not yet in the App Demo (Exercise detail there is still the placeholder).

After the live demo (owner, 2026-11-21): "looks pretty solid"; likes it; the sheet rather than in place. Add link locked as the short sheet that opens without the keyboard (25); 24c rejected. The demo's switch is removed. Liked in the demo but not individually confirmed, so left unlocked: fetch on paste with the spinner and Title field (27a/27b) and the missing-preview rows (26).
Exercise detail is now in the App Demo: any Progress main-lift tile opens it (Back Squat for every tile, for now); its back button returns to Progress.

Owner (2026-11-21), on the demo: the preview arriving in the sheet after paste with the editable Title field is good; likes the spinner while it fetches; the missing-preview rows are good, noting it won't always be Instagram. Locked. The fallback title is built from whatever the link is: Instagram reel, TikTok video, YouTube video for sites the app knows, otherwise the site's address; the demo's Paste now also cycles a TikTok link and an ordinary website that return nothing.
Exercise detail is complete apart from two deferred items: managing the exercise (rename, details, archive) and the graph for accessories.

Owner (2026-11-21): do the two deferred items now. Order: managing the exercise, then the accessory graph. Scoping answers: editable = Name, Body part tags, Equipment / type, a personal note; removing = Archive only.

### Turn 31 · 2026-11-21 · managing the exercise
One design, four moments.

| State | What | Status |
|---|---|---|
| 31a | Glass ••• top right opens the standard menu: Edit exercise, Archive. A quiet line under the title shows tags and equipment (Quads · Glutes · Barbell) | **Locked** (owner) · ••• menu with Edit exercise; Archive joins it later |
| 31b | Edit exercise sheet: Name, Body part pills (multi), Equipment (pick-one menu), Note; ✓ saves | **Locked** fields (owner) · sheet as 32b |
| 31c | Archive: standard iOS confirmation, not red; history kept; restore from All exercises (to design) | Deferred · designed with All exercises (archive needs restore and a list of archived) |
| 31d | The note shows in a Note card just above Resources; no note, no card | **Locked** (owner) · likes the note there |

After turn 31 (owner): an exercise is tied to an ID, not its name (already a build note); would almost never delete one. If Archive exists there must be un-archive and a way to see archived exercises; why archive at all? Edit exercise is fine; a glass button at the top makes sense; not convinced the sheet should be full screen ("probably right"). Asked what Equipment is and whether it is a single pick. Likes the note where it is.

### Turn 32 · 2026-11-21 · a shorter Edit exercise, and where Archive goes
Claude's suggestion: leave Archive off Exercise detail until All exercises is designed (where archived exercises are listed and restored).

| Option | What | Status |
|---|---|---|
| 32a | No menu: the glass button is a pencil that opens Edit exercise directly | Rejected · owner wants the ••• menu, not an edit button |
| 32b | Edit exercise as a sheet only as tall as its fields; no Archive | **Locked** (owner) · shorter sheet |
| 32c | The same with a quiet Archive exercise at the foot of the sheet | Rejected · Archive would go in the menu |

After turn 32 (owner): still wants the three-dot menu, not an edit button; if Archive is added later it goes in that menu. Likes 32b, the shorter sheet. Equipment as one pick sounds good.
Locked: glass ••• top right → standard menu (Edit exercise for now) → Edit exercise as a sheet only as tall as its fields: Name, Body part (multi), Equipment (one pick), Note; the note shows in a Note card above Resources. Archive deferred to the All exercises design. The quiet line under the title (Quads · Glutes · Barbell) was shown but not commented on: unreviewed. The demo has the menu, the sheet (body part pills toggle), the line and the Note card.

Owner (2026-11-21), after the demo: when editing the note in Edit exercise, the keyboard must never overlap content, least of all the text boxes; probably grow the sheet. Done in the demo: tapping Name or Note raises the sheet to full height with the keyboard, and every field sits above it. The line under the title: "never thought about the subheader, probably a good thing to have" (kept). Titles on pushed screens: considered Apple's large title that collapses on scroll; owner: keep the small centred title, Apple's own bar title, fixed while scrolling ("I think it's fine"). No change; this is already the README rule for pushed screens.

Owner (2026-11-21): Rep records' View all (a link above the card) should be consistent with Sessions' Show all. Changed in the demo: the Rep records card now ends in a Show all row, identical to Sessions; the header is just the section label. Supersedes the header View all from turn 13.

Owner (2026-11-21): both cards' rows are tappable, so drop the chevrons on Rep records; a tap must take you to the specific workout that logged that session or that rep record. Changed in the demo: Rep records rows have no chevron and open the session that set the record (Session detail scrolled to the exercise, its PR line reading e.g. "8-rep record · 285 lb"); Show all opens the Rep records page. This replaces turn 13c's "tap opens the page filtered to that rep count". Open: whether the History rows on the Rep records page should open their sessions too.

Owner (2026-11-21): yes, the History rows on the Rep records page open their sessions too. Changed in the demo: every History row opens the session that set that record (Session detail scrolled to the exercise, PR line e.g. "8-rep record · 275 lb"); back returns to the Rep records page. Closes the open question above.

### Turn 33 · 2026-11-21 · the top of the screen for an accessory (Hammer Curl)
The last deferred item. Everything below the graph is unchanged (Rep records, Sessions with RPE on the right, Note, Resources). Static mocks, same six months of mock data in each.

| Option | What | Status |
|---|---|---|
| 33a | The same graph as a main lift: est. 1RM, best so far, PR dots, What is est. 1RM? | Unreviewed |
| 33b | Weight as a step line (moves only when the weight goes up), one grey bar per session for reps across the sets; no PR dots; change shown in lb | Unreviewed |
| 33c | No graph: the screen starts at Rep records, then Sessions | Unreviewed |

After turn 33 (owner): leaning B, but there needs to be a focus on the graph: press and drag (hold) to select data points; same with the shaded block / program. Probably needs averages on longer time periods (first read the bars as RPE, then: reps "might be better than RPE"); see both.

### Turn 34 · 2026-11-21 · the accessory graph, live: reps or RPE
33b made live: drag picks the nearest session (bar turns white, rule and dot on the weight line, block column and outlined strip segment, readout names the day); range tabs work. Up to 30 sessions in range one bar per session; past that one bar per month with that month's average (30 is Claude's placeholder). Weight line never averaged. No snap or haptic (no PR dots).

| Option | What | Status |
|---|---|---|
| 34a | Bars are reps (average per set) | Unreviewed |
| 34b | Bars are RPE | Unreviewed |

33b: Leaning (owner). 33a, 33c: not commented on, still Unreviewed.

After turn 34 (owner): "yeah i think reps too". 34a: Leaning (owner). 34b: not preferred. Not yet an explicit lock; drag, block shading, monthly averages and the 30-session cut-off not commented on.

Owner (2026-11-21): "monthly averages are kinda a weak signal but there is not really another choice so yah lock it."
Locked: 34a, the accessory graph. Weight as a step line, reps (average per set) as grey bars, press and drag to pick a session with the block / program shading, monthly average bars on long ranges (owner: a weak signal, accepted for lack of a better choice), change in lb, no PR dots. 34b rejected (reps, not RPE); 33b superseded by 34a; 33a and 33c rejected by the lock. Not reviewed: the 30-session cut-off for switching to monthly bars. Not built yet: an accessory in the working demo.
Exercise detail has no deferred design items left on this screen (Archive waits for All exercises, #7).

Owner (2026-11-21): let the demo and mocks speak for themselves, but a lot of information is lost, so notes are good too; add the accessory graph to the demo.
Done: `Exercise Detail Demo · Accessory.dc.html` (Hammer Curl; graph live, cards below shown but not wired), reachable in the App Demo from the All exercises placeholder. `exercise-detail-notes.md`: only what the demos can't show (rules, numbers, edge cases, open items).

### Turn 35 · 2026-11-25 · Edit exercise: the progression step
Follow-up (checklist f13). The progression prompt (locked 2026-11-24, Workout) moves the weight by the exercise's own step; agreed home: Edit exercise; 5 lb by default, as in the current app. Owner: "sounds good, lets go." All three: "Progression step" under Equipment, 5 lb picked, one line under it ("What "Felt easy" adds and "Felt hard" takes off."), the sheet a little taller. On every exercise (main or accessory depends on the program); seconds for a timed exercise; kg for kg users. Drawn on Back Squat.

| Id | Option | Stamp |
|---|---|---|
| 35a | Capsule opening the pick-one menu, as Equipment (2.5, 5, 10, 15, 20 lb) | Unreviewed |
| 35b | Segmented: 2.5 · 5 · 10 lb | Unreviewed |
| 35c | Stepper: − 5 lb + (any multiple of 2.5) | Unreviewed |

Full screens on the page (`shots/exercise-35a…c.png`). Claude's suggestion: 35b; for a timed exercise 5 sec by default (the step hold times move in). Not decided: the timed default (the workout demo uses 15 sec as a placeholder).
Owner (2026-11-25) on turn 35: "yeah i think B too." **Locked:** 35b, Progression step in Edit exercise as a segmented control, 2.5 · 5 · 10 lb, under Equipment, 5 lb by default, with the line "What "Felt easy" adds and "Felt hard" takes off."; on every exercise; seconds for a timed exercise (5 · 10 · 15 sec), kg for kg users. 35a, 35c rejected. Built into the Exercise Detail Demo (`gen_exercise_step.py`: the segments work; the sheet is taller) and the whole-app demo. README (both copies), `exercise-detail-notes.md` and `workout-notes.md` updated. Still open: the default for a timed exercise (Claude's suggestion 5 sec; the workout demo's 15 sec is a placeholder).
Owner (2026-11-25): "5 seconds sounds fine." **Locked:** a timed exercise's progression step is 5 sec by default (5 · 10 · 15 sec). The Workout Session Demo's timed prompt now adds 5 sec (was a 15 sec placeholder). README, notes updated.

### Turn 36 · 2026-11-25 · Edit exercise: main lift or accessory
Follow-up (checklist f07). Decides the workout's progression prompt (accessories only) and Exercise detail's graph (est. 1RM or weight). Claude first proposed, in chat: the program alone decides, with no setting. Owner (2026-11-25): "i feel like this may need to be edited though on an exercise level." Both options add Lift type under Equipment in Edit exercise (segmented, with a line under it). Drawn on Back Squat.

| Id | Option | Stamp |
|---|---|---|
| 36a | Main lift · Accessory, on the exercise only; the same in every program | Unreviewed |
| 36b | From program · Main lift · Accessory; From program by default, the line says what the running program says; the other two override in every program | Unreviewed |

Full screens on the page (`shots/exercise-36a.png`, `36b`). Claude's suggestion: 36b.
Owner (2026-11-25) on turn 36: "Yeah B." **Locked:** 36b, Lift type in Edit exercise (under Equipment): From program · Main lift · Accessory, From program by default. From program: the running program decides, and the line under it says what it says ("Pillars has it as a main lift."). Main lift or Accessory overrides it in every program. Lift type decides the workout's progression prompt (accessories only) and Exercise detail's graph. 36a rejected. Built into the Exercise Detail Demo (`gen_exercise_step.py`; the overrides' lines, "A main lift in every program." / "An accessory in every program.", are Claude's wording) and the whole-app demo. README (both copies), `exercise-detail-notes.md` and `workout-notes.md` updated. Not decided: whether an override also changes which lifts Progress shows as the program's main lifts.
Owner (2026-11-25): "Just clean up the text below the Lift Type selections though. It doesnt make sense." Lines reworded in the demo: From program "Pillars treats this as a main lift."; Main lift "Always a main lift, whatever the program."; Accessory "Always an accessory, whatever the program." (The turn 36 images keep the first wording.)

### Turn 37 · 2026-11-25 · Lift type: Automatic, with the exercise's own default
Owner (2026-11-25), after the reworded lines: "So "Pillars" will just be the program name for whatever program is active? What if there is no active program?" Claude: yes, the running program's name; proposed that with no program (or a program without the lift) From program counts it as an accessory. Owner: "I dont like that. Some lifts are always main lifts i think." Claude proposed a default type on every exercise and the rename. Owner: "Sounds good."

| Id | Option | Stamp |
|---|---|---|
| 37a | Automatic · Main lift · Accessory. Every exercise has a default type: the big barbell lifts (squat, bench, deadlift, overhead press and close variants) are main lifts; everything else, and any custom exercise, an accessory. Automatic follows the running program when it includes the lift, otherwise the exercise's default. Lines: "Pillars treats this as a main lift." / "Pillars treats this as an accessory." / "A main lift by default." / "An accessory by default." / "Always a main lift, whatever the program." / "Always an accessory, whatever the program." | **Locked** |

Replaces 36b's "From program"; turn 36 left as it was. Built into the Exercise Detail Demo (label Automatic; the demo always runs Pillars, so the default lines show only in `shots/exercise-37a.png`) and the whole-app demo. README (both copies), `exercise-detail-notes.md` and `workout-notes.md` updated. Which exact lifts count as close variants is for the exercise library at build.

### Turn 38 · 2026-11-25 · Accessory graph: when the bars switch to monthly
34a's switch to monthly bars was at more than 30 sessions in range, Claude's placeholder (checklist f08). Claude described two options; owner: "yes mock please." Mocks: Hammer Curl at 6M, once a week (the demo's log) and twice a week.

| Id | Option | Stamp |
|---|---|---|
| 38a | By session count: one bar per session up to 45 sessions in range (every bar at least 4pt wide), monthly past that | **Locked** |
| 38b | By range: Program and 6M always one bar per session; 1Y and All always monthly | Rejected · 38a locked |

Claude first picked 38b. Owner then asked: "what happens if its an exercise that is not done that frequntly. what would that look like on the 6M and 1Y and All?" Every-other-week mocks added to both options (6M, 1Y, All). Claude's pick changed to 38a: under 38b a rare exercise gets monthly averages of one or two sessions, and 34a accepted monthly averages only where there is no better choice.
Owner (2026-11-25): "Yeah i think A too. I think it should be a threshold based. And that even goes for monthly too. If we are ont he All tab and we have 5 years of training, we should not be showing all monthly levels. it needs to probbaly switch to 6 months at a certain theshold too." 38a locked. The extension to monthly bars is turn 39.

### Turn 39 · 2026-11-25 · Accessory graph: past 45 months, coarser bars
Owner's words are under turn 38. Both options keep 38a's cap at every step: never more than 45 bars; monthly ends at 45 months. Mock: Hammer Curl on All, 5 years once a week (259 sessions); today's rule, for reference, is 61 monthly bars. Mock-only: invented program names before 2025, years on the axis. Not part of this turn: the weight grid's one line per weight gets dense with many weights.

| Id | Option | Stamp |
|---|---|---|
| 39a | Session → month → quarter (21 bars for 5 years; quarters last 11 years, then half-years), the same steps as Progress's weekly charts (Claude's pick) | **Locked** |
| 39b | Session → month → 6 months (11 bars for 5 years; the owner's suggestion) | Rejected · 39a locked |
Owner (2026-11-25): "Yeah Quarters sounds good. And makes sense. main lifts get that but the accessories dont . But yeah we need to fix thouse faint lines because they look terrible with a lot of steps lol. It should just but a standard graph lines i guess that dont really serve much purpose?" 39a locked. The faint lines are turn 40.

### Turn 40 · 2026-11-25 · Accessory graph: the faint lines behind the weight
Owner's words are under turn 39. Today: one unlabelled line at every weight used in range. Both options: three evenly spaced lines at round weights (steps 5 · 10 · 20 · 25 · 50 lb, the smallest covering the range in two steps), behind the weight line only; reps bars keep no scale. Main-lift graph unchanged (no numbers, 6b). Mocks: 6M (demo log) and All (5 years, quarterly).

| Id | Option | Stamp |
|---|---|---|
| 40a | Three even lines, weight labelled at the right edge (numbers only, 10pt grey) (Claude's pick) | Rejected · 40b locked |
| 40b | Three even lines, no labels | **Locked** |
Owner (2026-11-25), on turn 40: "The lines still look goofy. Maybe because we are not giving the weight line enought vertical space? Maybe we need to allow its vertical space to be larger so it can scale better?" Also asked: "Should we add the date stepper like on the Progress screen to this Exercise detail screen as well?" (Exercise detail never decided chips + paging vs chips only; turn 1.) Turn 40 not picked.

### Turn 41 · 2026-11-25 · Accessory graph: more height for the weight line
The weight line had a 36pt band at the top, with 44pt empty between it and the tallest reps bar. Both options: lines labelled as in 40a (40 still open), up to four even lines with the extra room. Reps bars unchanged.

| Id | Option | Stamp |
|---|---|---|
| 41a | Same graph height; the weight band takes the empty space (80pt, was 36pt) (Claude's pick) | **Locked** |
| 41b | Graph 40pt taller; the weight band gets 114pt; taller than a main lift's graph | Rejected · 41a locked |
Owner (2026-11-25): "Yeah 41a." 41a locked; turn 40 (labels) still open. Correction: turn 40 said the main-lift graph keeps no numbers (6b); it draws three faint lines labelled at the right edge (low, middle, high). 6b's "no numbers on the graph" is about labels on the data. Turn 40's text corrected and marked.
Owner, on the stepper: "And yeah mock up the stepper. It should be on the right side. And I think that sub header can maybe move up a bit closer to the title and the stepper can go below it instead of on the same line." Then: "But i wonder if we should apply the same large title that collapses into a small title on this screen too. I feel like we should. Then that would move the sub header to be below that large title and then not showing on the small one. Then you might be able to put the stepper on the same line as the sub header."

### Turn 42 · 2026-11-25 · Header: the period stepper, and a large title
Both: Progress 26b's arrows and dates, right-aligned. Mock: Back Squat, 6M.

| Id | Option | Stamp |
|---|---|---|
| 42a | Small title as today; sub header up 16pt; stepper on its own line under it, right | Rejected · 42b locked |
| 42b | Large title 28/800 on its own row under the buttons; sub header left and stepper right on the line under it; scrolled, the small title fades in between the buttons and the sub header is not shown (Claude's pick) | **Locked** · stepper per 43a |

Open with 42b: an exercise name too long for one line at 28pt wraps or shrinks.
Owner (2026-11-25): "Yeah no numbers was for the accessory graphs. Main lifts should have the numbers like this." 40b locked (accessory: even lines, unlabelled; main lifts keep their labelled scale). Open: how many lines; 40 drew three, the 41 mocks allowed up to four in the taller band.
Owner: "I agree with 42b but I'm a little nervous that the stepper might not always fit on this same line. Try it with longer muscle names and machines. We might need the stepper on the next line down." 42b leaning, not locked; its sub header line is turn 43.

### Turn 43 · 2026-11-25 · Header: 42b with long muscle and equipment names
Header only (graph is Back Squat's). 1Y, the widest dates. Long case: Seated Cable Row, "Lats · Rhomboids · Rear Delts · Biceps · Cable Machine".

| Id | Option | Stamp |
|---|---|---|
| 43a | Stepper always on the next line down, right (Claude's pick) | **Locked** |
| 43b | Same line when it fits, next line when not; can change with the range | Rejected · 43a locked |
| 43c | Always the same line; the sub header wraps left of the stepper | Rejected · 43a locked |
Owner (2026-11-25): "Yeah 43a. And 3 lines is probably good." 43a locked, and with it 42b (agreed pending the fit test). 40b: three lines.
Built: both Exercise detail demos (`gen_header43.py`) and the Accessory demo's graph with 40b and 41a (`gen_accessory43.py`); the whole-app demo rebuilt. In the demos the arrows don't page and the dates are Progress's sample dates following the chip. The README's pushed-screen rule said no large title on pushed screens; Exercise detail is now the exception, and whether Calendar, History and Program summary follow is open.
Owner (2026-11-25): "Yeah, we can definitely change that rule. I don't think we should be limiting ourselves for push screens to not have large titles. But yeah, we should audit all the screens that we currently do have the small titles and see if it actually makes sense to have big titles. Because I actually think this looks a lot better now, having a big title on the screen." README's pushed-screen rule changed; the audit is a checklist item.

### Turn 44 · 2026-11-25 · Header: space between the bar buttons and the large title (app-wide)
Owner: "it looks like in the screenshots you might have a little bit too narrow of a spacing between the back button and the title. That needs to be uniform. That positioning below that first row of icons, I guess, especially when the back button is there, needs to be uniform across the app. Right now that is a little too close to that button. I don't want a massive space. I don't want to lose even more space."
Measured: large titles all start at 114pt; Home's gear at 59-103pt (Apple's standard bar); pushed screens' buttons at 67-111pt, so 11pt to the title there, 19pt on Home.

| Id | Option | Stamp |
|---|---|---|
| 44a | Every bar-button row at 59-103pt like Home's gear; pushed screens' buttons and small title move up 8pt; titles stay (Claude's pick) | **Locked** |
| 44b | Buttons stay; every large title moves down 8pt, Home's wordmark too | Rejected · 44a locked |

### Turn 45 · 2026-11-25 · Header: an exercise name too long for one line
Owner: "for your open item, what happens when the exercise name is too long for one line? Can you show me both wrap and shrink?" Mock: Rear-Foot-Elevated Split Squat. The small title ends in … when it doesn't fit between the buttons.

| Id | Option | Stamp |
|---|---|---|
| 45a | Wrap onto a second line at 28pt; first line stays put, content moves down 31pt | Shown again in 46 |
| 45b | Shrink to fit one line (23.5pt here); Claude's pick, with a floor (say 22pt) below which it wraps | Shown again in 46 |
| 45c | Truncate with … at 28pt (Apple's default), for comparison | Shown again in 46 |
Owner (2026-11-25): "But you're saying iOS standard is to have the buttons eight points higher than what we have today. I want iOS standard for this. I don't want to be rolling a custom small random padding. So if that's iOS standard, then yeah, just just move them." 44a locked. Built (`gen_navrow44.py`): Exercise detail (both demos), Calendar, History, Session detail, Program summary; buttons now 59-103pt; the whole-app demo rebuilt. The small-title screens' content was not moved up (their header is in the audit, checklist f18).
Owner, on 45: "For 45, can you add an additional one? You might have to do this in a demo. But could you have it so that it is truncated but it acts as a moving title so that it scrolls horizontally, scrolls itself, and then resets and then waits for a little bit and then periodically scrolls. ... But make sure for B and C you also are showing the option for when the title is small. And well, I guess B, C, and D now."

### Turn 46 · 2026-11-25 · Header: long names again, with a marquee and the small title for each
Name: Single-Arm Dumbbell Romanian Deadlift (overflows the small title too). Turn 45's options are shown again here.

| Id | Option | Stamp |
|---|---|---|
| 46a | Wrap the large title; small title truncates (Claude's pick) | **Locked** |
| 46b | Shrink both to fit (18pt and 13pt for this name) | Rejected · 46a locked |
| 46c | Truncate both with … (Apple's default) | Rejected · 46a locked |
| 46d | Marquee both: every 10s, wait 2s, scroll to the end (~50pt/s), hold 1.8s, fade back; right edge fades. Live in `Exercise Detail Demo · Long Name.dc.html`. Timings Claude's. Reduce Motion would fall back to 46c | Rejected · 46a locked |
Owner (2026-11-25): "Yeah, yeah, I agree." then "Hey, was supposed to be A." 46a locked. Also: "don't worry about reduced motion. This app, we're not really gonna make this app super accessible. We're not gonna worry about that right now. I actually don't really care. This is a personal app and we don't really need all these additional accessibility things." README, motion-decisions and workout-notes updated: accessibility settings out of scope. `Exercise Detail Demo · Long Name.dc.html` now shows 46a instead of the marquee.

### Header audit · 2026-11-25 · every pushed screen, three ways (`Header Audit Demo.dc.html`)
Owner: "I want to see you can just do a one of those videos where it just can play on a loop of what's going on ... that loop can be doing all of the screens at once. It's one button controls the start of all the scrolls and all the screens move at once ... I would like three options ... it starts off as the small title. When you scroll up, it goes to the big title, kind of like the way Apple does all the screens today. Another option where the large title just starts always for all the screens, and then when you scroll down, it goes to the small title. And then the additional option of what all the screens are today."
Screens: Calendar, History, Program summary, Session detail, Exercise detail, Rep records, Sessions. Only the header is live; content is a picture of each demo (`shots/audit/`). Exercise detail today already is option 2. Claude has not seen the Apple behaviour in option 1 on a device; built as described.

| Id | Option | Stamp |
|---|---|---|
| H1 | Starts on the small title; pulling down brings in the large title | **Locked** |
| H2 | Starts on the large title; scrolling collapses it to the small one | Rejected · H1 locked |
| H3 | Today (small titles; Exercise detail as H2) | Rejected · H1 locked |
Owner (2026-11-25), with a screen recording of Apple's Passwords app (Passwords › Wi-Fi opens on a small title with "105 Networks" under it; pulling down brings in the large title with the subtitle under it): "I'm kind of leaning just to do option one. I think that this is what Apple's behavior is. ... Every screen should have the option of a large title, though. We should be able to see it at some point, but I think option one is probably what we want. The nice thing here too is that you can actually see we have subheaders in those titles as well. So that's a cool option for us to consider in the future if some of these would benefit from a subtitle. I don't know if many of them would, maybe only one or two of them, but it's good to know. I think the only screen that potentially will change is the exercise detail title. I think we should look at the small title being wrapping to a new line just because that could be weird to see the no full title to begin with. Let's just see one quick image of what it would look like wrapped and then we can decide on that one."
H1 leaning, not locked. Subtitles in the small title: noted for later, nothing built.

### Turn 47 · 2026-11-25 · Header: opening on the small title, with a long name

| Id | Option | Stamp |
|---|---|---|
| 47a | The small title wraps onto a second line (at most two, 17/700) when the name doesn't fit between the buttons | **Locked** |

Noted with it: opening on the small title hides Exercise detail's sub header and period stepper until you pull down.
Owner (2026-11-25): "I think the two-line small title works, right? But why are you getting rid of the stepper? Why is that hiding? I think that should be in view as well. You could maybe consider hiding the hamstrings, glutes, dumbbell like that subheader row. But even that, we should see what that looks like. Can you give me an interactive mock to be able to kind of scroll through those options?" 47a leaning.

### Turn 48 · 2026-11-25 · Header: opening small, with the stepper always in view
Interactive: `Exercise Header Options Demo.dc.html`. The stepper moves out of the large-title block into the content, so it is in view when the screen opens. As in Apple's apps, no soft edge while the page sits where it opened.

| Id | Option | Stamp |
|---|---|---|
| 48a | Sub header goes with the large title; stepper always in view (Claude's pick) | **Locked** |
| 48b | Sub header and stepper both stay in view; only the title collapses | Rejected (owner) |
| 48c | Sub header as the small title's subtitle; stepper always in view; no room with a two-line name | Rejected · 48a locked |
Owner (2026-11-25): "One thing that we need to consider though is what happens if someone makes an exercise name much longer than what two lines would be. I think I see two cases. We either wrap after two lines, like we kind of just cap it at two lines, or we actually limit the size of the title in the edit. So we can only have certain amount of characters. And then yeah, for your options here, I think I'm leaning A as well. I actually like C a lot if we could confirm that we were always on one line for the exercise name. Right? That would actually be really nice to have that as the subheader. But then you run into two issues. One, what happens when you have a long name and it wraps to two lines? And two, what happens if the subheader itself is multiple lines? You could maybe put in a small rule like if the header is more than one line, drop the subheader from that title bar. Or if the subheader is more than one line, drop it from the title bar ... And then if both of them are one line, then you can have it there; it just causes a little bit of a difference between what you see and what you expect, so it does make a bit of a weird interaction, and I think A looks fine. C just might be trying to optimize a little bit more, but definitely not B. I actually don't like B. It looks weird."
48a leaning; 48b rejected; 48c left unreviewed (his rule for it: show the subtitle only when both the name and the sub header fit on one line).

### Turn 49 · 2026-11-25 · Header: a name longer than two lines
On 48a. About 44 characters fit two lines of the small title, depending on letters and word breaks.

| Id | Option | Stamp |
|---|---|---|
| 49a | Small title capped at two lines with …; the large title shows the whole name (Claude's pick) | **Locked** |
| 49b | Name limited to 40 characters in Edit exercise, with a counter next to Name; can combine with 49a | Rejected · 49a locked |
Owner (2026-11-25): "Yeah, yeah, I think A. I don't think we need the restriction." 49a locked: no name limit; the small title stops at two lines with …, the large title shows the whole name. H1 (all screens open on the small title) and 48a are still leaning, not locked.
Owner (2026-11-25): "Yeah, I think you can lock all three." H1, 48a and 47a locked.
Built: every pushed screen opens on the small title and a pull brings in the large title (28/800) above the content; the soft edge comes in only once content scrolls under the bar. Calendar, History, Program summary, Session detail (`gen_h1screens.py`), Exercise detail with Rep records and Sessions, the accessory demo (`gen_header43.py`, rewritten), the Long Name demo (`gen_longname.py`), and the whole-app demo. Shared logic in `h1common.py`. Owner then: "let's do those other two screens"; Calendar's preview of an upcoming session and Session detail's edit mode now open the same way.

### Rules check (c07) · 2026-11-25
Owner: "Sounds good. Yeah, let's do it." Checked the Exercise Detail Demo (main page, Rep records, Sessions, the ••• menu, Edit exercise) and the accessory demo against every README rule and Exercise detail's locks.
Passing: header (H1, 44a buttons, 17/700 small title, 28/800 large title, sub header under it, stepper in view); colours (accent for now, moss for gains and PRs, grey drops, no red); cards (gradient, 10 radius, 14×16 padding); eyebrows 11/700 uppercase +0.6 #7C7E86; Show all rows 13/600 grey 44pt; session rows and rep record rows as locked; no chevrons on rows; one ••• menu (Edit exercise); Edit exercise sheet (close left, ✓ right, 17/700 title, fields as locked, picked body parts as accent outline + tint); Resources (press and hold, one-time hint, Undo toast only for a removed link); the accessory graph (40b, 41a); copy (middots, no em dashes).
Fixed: numerals weren't tabular everywhere (the graph card's change, Rep records page labels and dates, link lengths); the whole content now uses tabular numerals. The accessory graph's readout line was the muted eyebrow grey; it is body text (11/400 #8F9098).
Left as decided: "What is est. 1RM?" in light grey regular weight (owner, turn 8), although #C9CAD0 is not one of the palette's text greys.
Questions for the owner (unreviewed): (1) text under the 11px minimum: chart labels (block names 9.5, months and scale 10), date-tile weekdays, the New and PR tags, link lengths (10); (2) the Sessions rows' right-hand number is #C9CAD0, not a palette grey; (3) content top: the README token says the first card starts 24pt below the bar (128pt), but with screens opening on the small title content sits at 110-128pt depending on the screen; (4) sizes in use that the type scale doesn't list: 24/800 readout number, 30/800 latest record, 18/700 date-tile day, 15/700 record and right-hand numbers, 12/500 helper lines; (5) card gap: README 12, the demos stack cards 10 apart.

### Turn 50 · 2026-11-25 · Rules check (c07): the five questions as mocks
Owner: "For each of these questions, make them as a mock where the options are the different mocks. I need to be able to see these side by side to know the rulings."

| Id | Option | Stamp |
|---|---|---|
| r1a | Text under 11px left as it is (9.5-10px) | Rejected · r1c locked |
| r1b | Raised to 11px everywhere (tab bar labels stay system) (Claude's pick) | Rejected · r1c locked |
| r1c | The owner's call: 11px for the date-tile weekday, the New and PR tags and link lengths; the graph's labels stay (block names 9.5px, months and scale 10px) | **Locked** |
| r2a | Sessions right-hand number #C9CAD0, as today | Rejected · r2b locked |
| r2b | #8F9098, the secondary grey (Claude's pick) | **Locked** |
| r2c | #EDEEF0, white | Rejected · r2b locked |
| r3a | Content where each screen had it (110-128pt) | Rejected · r3b locked |
| r3b | Every screen at 128pt, the README token (Claude's pick) | **Locked** |
| r4a | Keep the off-scale sizes and add them to the README's scale (Claude's pick) | **Locked** |
| r4b | Snap them to the scale (24, 30 to 34; 18 to 17; 15 to 14; 12 to 11) | Rejected · r4a locked |
| r5a | Card gap 10pt, as the demos (README changes) | Moved to turn 51 |
| r5b | Card gap 12pt, the README (Claude's pick) | Moved to turn 51 (mock was wrong) |
Owner (2026-11-25), after asking the current sizes: "I think moving most of them to 11 makes sense. Especially the 10px ones. The one I dont think we should move are the graph related ones. Especially the block names. That's a very small piece down there and I do t want large text there." r1c locked and built into both Exercise detail demos; README Type amended (graph labels are the exception to the 11px minimum).
Owner (2026-11-25): "For q2 I can't even see the diff so should be fine lol. Q3: yes definitely. Make this consistent across the app. No screen should be exempt unless very explicitly overriden. Q4: what's the diff here? Q5: which ones are changing? In the future please tell me explicitly what fields to look at so I don't have to hunt for the diff."
r2b locked (read as approval of Claude's pick; the owner can't see the difference). r3b locked and built: every pushed screen opens with its first content at 128pt (Exercise detail and its accessory and long-name demos, Calendar and its preview, History, Program summary, Session detail and its edit mode). Tabs keep content under their large title (Home 37c, Workout 22a/23a). Correction: r5b's mock moved every 10pt gap, section labels included; only card-to-card gaps would change (Session detail's exercise cards 10 to 12, History's cards inside a block 8 to 12; Home and Calendar already 12; Exercise detail has no card-to-card gap). Found while measuring: on Exercise detail the Note label sits 10pt above its card, other section labels 16pt.

Owner (2026-11-25), after asking why nothing changed on screen for Q4: "Ohhh okay. Yeah that's good for q4. Standardizing the fonts is key to this design system. That should probably be in the design system too if that's not the readme you meant. Where can I view the new round of q5?"
r4a locked. README Type (both copies) gains a named-sizes line: Record large 30/800 -0.5px, Readout 24/800 -0.3px, Tile day 18/700, Record value 15/700, Helper 12/500 #8F9098. Design System: tokens.json and tokens.css gain tab-title 28/800, record-large, readout, tile-day, record-value, helper and chart-label (10/600, block names 9.5); the wordmark token moves from 26 to 34 (Home's wordmark, locked earlier); foundations/typography.html rewritten to the current scale (it still showed July's 20/800 screen title, a 10px eyebrow at +1.1 and a Dynamic Type section). Q5 moved to turn 51 with a corrected mock.

### Turn 51 · 2026-11-25 · Rules check (c07): Q5 again, the gap between cards
Only the gap between two cards stacked directly on each other changes; the mocks mark each such gap in blue with its size. Session detail: between exercise cards (10pt today). History: between the two cards inside a block (8pt today). Home and Calendar are already 12; Exercise detail has none.

| Id | Option | Stamp |
|---|---|---|
| r51a | As today: Session detail 10pt, History 8pt | Rejected · r51b locked |
| r51b | 12pt on both, the README token (Claude's pick) | **Locked** |
| r51c | Session detail 12pt; History keeps 8pt as an explicit override | Rejected · r51b locked |

Owner (2026-11-25): "Q5: yeah sure unify at 12. Probably should be in the design system too" / "And yeah fix Note spacing too."
r51b locked and built (gen_gap51.py, which patches the demos and their base copies): Session detail's exercise cards in main and edit mode (a deleted card adds no gap), the Session page inside the Exercise Detail Demo, and History's cards inside a block are 12pt apart; the extra space is a top margin on the card, so section labels keep their spacing. Measured after: every card-to-card gap in Session detail and History is 12. README (both copies) and the Design System (tokens.json, foundations/spacing.html) say every card stacked directly on another card is 12pt apart, on every screen.
Note label fixed: on Exercise detail it sat 10pt above its card; it is now 16pt, like Rep records, Sessions and Resources.
Found while measuring (not changed, for the owner): the gap from a section label to its card differs by screen: Exercise detail 16pt, Session detail 10pt, History 8pt.

### Turn 52 · 2026-11-25 · Rules check (c07): the gap from a section label to its card
Owner, asked whether to mock unifying it: "Yes." Measured today: Exercise detail 16pt, Session detail 10pt, Program summary 10pt, Progress 10pt, History 8pt, Workout tab 6pt; Home and Calendar have no labels above cards. The mocks mark each label-to-card gap in blue with its size (Exercise detail, Session detail, History, Workout tab); only that gap changes.

| Id | Option | Stamp |
|---|---|---|
| r52a | As today: 16, 10, 8 and 6pt by screen | Rejected · r52e locked |
| r52b | 10pt everywhere (Claude's pick) | Rejected · r52e locked |
| r52c | 6pt everywhere, the Workout tab's | Rejected · r52e locked |
| r52d | 16pt everywhere, Exercise detail's | Rejected · r52e locked |
| r52e | The owner's call: 8pt everywhere | **Locked** |

Owner (2026-11-25): "To be honest, I'm going between B and C. 10 points and 6 points. And I mean it's not that big of a deal, but maybe we'll just split the difference. Why not let's just do eight points everywhere."
r52e locked and built (gen_label52.py, which patches the demos and their base copies): Exercise detail 16 to 8 (and its Sessions page's month labels 6 to 8), the accessory and long-name demos, Session detail main and edit 10 to 8, Program summary 10 to 8, Progress 10 to 8, Workout tab 6 to 8. History and Calendar's day preview were already 8. Measured after: every section label sits 8pt above its card on these screens. Workout session (still on the old +1.1 eyebrow tracking) gets it in its own rules check. README (both copies) and the Design System (tokens space-label, spacing page) updated.

From Program summary turn 11 r7b (owner 2026-11-25, "12/500 on both"): every 12px text on Exercise detail is 12/500 now (row dates, Sessions row meta, gains, units under the readout, year dividers, resource lines), in the main, accessory and long-name demos. The Session page inside the demo is Session detail's and is left for its own check.

### Turn 53 · 2026-11-26 · Archive and Unarchive on the exercise page
Context: All exercises turns 12–15 (Archived screen; a row opens this page; ••• has Unarchive in place of Archive). Alerts are Apple's own.

| Id | Option | Stamp |
|---|---|---|
| 53-menu | ••• menu: Edit exercise · Archive (archive-box icon right) | **Locked** |
| 53-confirm | Archive asks with the system confirmation ("It leaves your lists and workouts. Its history and records stay; bring it back from Archived." / Archive Back Squat, blue); you stay on the page | **Locked** |
| 53-un | Archived: Edit exercise · Unarchive; no confirmation | **Locked** |
| 20a | Archived marker: tag + "Jul 2. Not in your lists or workouts." above the date range | Rejected · 20b locked |
| 20b | Archived marker: "Archived Jul 2" as the bar's subtitle (Claude's pick) | **Locked** |

Owner (2026-11-26): "Awesome these look great. And yeah 20b." **Locked:** all of turn 53 as drawn; 20a rejected. README updated.

Built (2026-11-26, gen_exarch53.py, in place): Exercise Detail Demo's ••• menu has Archive; it asks (stand-in for the system dialog), then the bar shows "Archived Nov 11" under the title and the menu offers Unarchive, which acts at once. Whole-app demo rebuilt.
