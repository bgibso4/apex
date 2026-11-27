# Project rules

## Action hierarchy (app-wide, locked turn 20)
Two roles. Every card follows these.

**Primary · filled button**, one of three fills by meaning:
- **Blue** #659BC8, text #0B0C0E, 50px, radius 10, 15px/700. The thing to do now (Start Workout, Resume, Choose a program).
- **Moss** #6CA383, text #0B0C0E, 50px. Confirms something earned. Use only when a real case needs it (e.g. answering "How was your run?"). Never force it in.
- **Tonal** rgba(237,238,240,0.06) fill, text #EDEEF0, 44px, 14px/600, no border. A lesser action with no other button on the card (View session, Preview session in day summaries).

**Secondary · text**: 14px/600 #8F9098, centered, 44px tap row, no chevron. Only ever directly under a primary.

Rules:
1. One primary per card, at most.
2. Fill comes from meaning: blue = now, moss = earned, tonal = lesser.
3. Secondary text only sits under a primary. A lesser action standing alone becomes Tonal.
4. If the whole card is tappable, it gets no button.
5. No chevrons on buttons or secondary text.

## Glow (locked turn 31)
- Static glow only on earned cards (moss tint wash, border moss ~40%).
- One brief pulse may announce something newly due. It plays once on arrival, then stops. Never loops.
- One addition (owner 2026-11-24): when Workout complete arrives, a point of moss light runs one lap around the earned card's edge, once (1.5s).
- Nothing else glows.

## Recording decisions (owner 2026-11-24)
- When something already locked changes later, do not go back and restamp or edit the earlier turn. Add a new numbered turn to that screen's Explorations page (after 15 comes 16), static is fine, that shows the new lock and what it replaces. The earlier turn stays as it was; the highest turn number wins. This keeps the page a true history of how the design evolved.
- Options (owner 2026-11-24): every new moment or screen put up for review gets at least two options to compare, even when one of them simply applies a rule already locked. Say which one you would pick.
