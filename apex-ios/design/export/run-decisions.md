# Run tab — decisions log

Same rules as the other logs: every option in `Run Explorations.dc.html` carries a stamp. **Locked** = stands · **Rejected** = turned down · **Superseded** = replaced by a later turn. Only the owner locks or rejects. **Highest turn number wins.**

## Scoping · 2026-11-26
Today's app: (tabs)/running, "the swappable 4th tab": pain tracking, run logging and trends across Log / Trends sub-tabs.
Owner's answers: scope "Log by hand + trends (Recommended)"; cardio "Running only (Recommended)"; fields besides distance and time "Pain, Run type, Notes, Effort (RPE)"; program runs "In the Workout tab (Recommended)" (logged in the session, shown in the Run tab afterwards).
Ben (2026-11-26): "I think eventually adding a GPS here will be really, really nice. I think eventually it would be great to just start a run that's treadmill or outside, and when you do an outside, you can do a GPS run ... but I don't think that's a P1. ... we can put that in the GitHub issues and do that later."
Ben (2026-11-26): "sometimes I will have running as a focus, sometimes I'll have other things as a focus. And that probably should be changed in the settings. And that would allow us to monitor and configure the tab that's at the bottom of the screen such that you might have a biking tab down there or something. It would probably be a similar looking tab ... but we would design that in the future ... maybe one day I start focusing on boxing."
Later, not designed now: live runs (treadmill / outside with GPS) — GitHub issue to file (could not be filed from this session: the GitHub token here is invalid); a cardio focus setting in Settings that swaps the 4th tab (cycling, boxing). Constraint taken from it: the Run tab's layout should suit another focus.
Inherited: pain is a neutral 0–10 scale, no traffic-light colours (Home turn 21); the next-day pain check-in lives on Home; cardio on a session day goes with that session in History and Calendar (README data rule).

### Turn 1 · 2026-11-26 · how the tab is laid out
Miles; today Thu Aug 20; sample content. Row: date tile, "type · distance", then time · pace · pain; a program run carries its session's name as a tag.

| Id | Option | Stamp |
|---|---|---|
| 1a | One page: This week card (distance so far, last 8 weeks as bars, Runs · Time · Pace, blue Log a run), Recent runs, Trends (Claude's pick) | In the running · turn 2 |
| 1b | Same top card, then a Runs / Trends switch (Runs by month; Trends = the four charts) | Not carried on |
| 1c | Trends first as Progress: range control, three totals, four charts, Recent runs; Log a run = glass + top right | Not carried on · its range control moves to the Trends screen |
Open: miles or km (mocks disagree: Summary and History mi; Home check-in and Calendar km). Next: a run's detail, the Log a run sheet, the full list.

Ben (2026-11-26): "I typically only run once a week. ... I think overall it's looking quite good right now. But yeah, I think the trends are also a very critical part of this. I like seeing the distance per week, the runs per week, pace, pain. ... There are actually two pain metrics: pain during the run and pain later ... so that's 5 metrics. I really want to be able to view this over time. ... What this might turn into is clicking one of these trends and then you're now on this trends view screen and you can pick your trend and you can view it over time and you've got the program 6 month 1 year all and you've got the date stepper there as well."
Facts taken: about one run a week; five trends (distance / week, runs / week, pace, pain during, pain next day); trends over time with the range control and stepper. No layout picked; 1a carried on.

### Turn 2 · 2026-11-26 · one run a week; two pains; the Trends screen
Rows show both pains ("Pain 3 · next day 3"). Tiles open the Trends screen.

| Id | Option | Stamp |
|---|---|---|
| 2a | Top card = Last run (distance, type, how long ago, last 8 runs as bars, Time · Pace · Pain); four tiles, Pain with two lines (Claude's pick for Q1 and Q2) | **Locked** |
| 2b | Top card = This week (turn 1's) | Not picked · 2a |
| 2c | 2a with pain as two tiles (five tiles, Pace full width) | Not picked · 2a |
| 4a | Trends screen: one trend with a picker pill, large graph, Fastest · Last run · Change, runs in range | Ben leaning · picker reworked in turn 3 |
| 4b | Trends screen: all trends stacked on the same dates, one range control (Claude's pick) | In the running · Ben leaning 4a |
Both Trends screens: pushed, titled Trends; Program · 6M · 1Y · All and the date stepper; press and drag to read. Open: miles or km.

Ben (2026-11-26; stray dictation left out): "I think 2A for question [one] makes sense. I think in the last run up there is probably good. ... those vertical bars, what do those represent? And ... if it's a few days later and we have logged the pain, after the fact pain, will that also show up in the top card?" "For question two, I think it should be pain in the same tiles. I think that's fine." "I think B. I was actually gonna lean A. Well, A's not bad though, because then you can use the drag that we have before, and that's actually pretty nice. So I'm actually maybe leaning A, but I don't like the drop-down menu for the different metrics. I think that needs to be wider and better padded."
**Locked:** 2a: Last run on top; pain as one tile with two lines (so four trends). 4a leaning; picker to rework.
Answered: the bars = distance of the last eight runs, newest blue; the next-day rating shows in the card and the row once saved ("Pain 2 · next day 3").

### Turn 3 · 2026-11-26 · the trend picker; the Last run card
| Id | Option | Stamp |
|---|---|---|
| 5a | Trends screen picker: four full-width tabs, each with its average for the range, the open one filled (Claude's pick) | Unreviewed |
| 5b | Trends screen picker: a full-width 48pt row opening the standard menu | Unreviewed |
| 6a | Last run card with both pains; bars without a caption | Unreviewed |
| 6b | Same, with "Distance, last 8 runs" under the bars (Claude's pick) | Unreviewed |
Open: miles or km.
