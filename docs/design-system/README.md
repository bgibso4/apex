# APEX Design System

Dark, precise, iOS. Two hues on a neutral field. If a screen disagrees with `foundations/`, the screen is wrong.

## Files
- `foundations/` colors, typography, spacing (source of truth)
- `context/` briefs, research, design-language history
- `references/` art-direction rounds (history only)
- `screens/` round-specific mockups. The `*-r1` Workout screens (July) are history, not approved: logging is governed by `drafts/2026-08-05-logging/logging-decisions.md`, which supersedes them
- `drafts/` raw Claude Design exports and decision logs, newest round wins

## Color
- **Accent #659BC8** = now. **Moss #6CA383** = earned. No third hue, ever. Errors and misses are neutral text.
- Neutrals: field #090A0C / #0C0E11 · card #14161B → #0E1013 · border #20232A, top edge #2C3039 · text #EDEEF0 / #8F9098 / #55575F · on-accent #0B0C0E
- Tints: 10% alpha of the hue (#659BC81A, #6CA3831A)
- Light: halo `radial-gradient(ellipse 90% 45% at 50% -5%, #141A22, #0C0E11 55%, #090A0C)` behind the header; cards use the vertical gradient + lighter top edge. No shadows.
- Earned cards only: moss tint wash at the top, `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(108,163,131,0.13), transparent 70%)` over the card gradient, border moss at ~40%. Nothing else glows.


## Type
System stack (SF). Wordmark font is the only exception.
- Hero numeral 34/800, -0.5px · Screen title 20/800, -0.3px · Card name 14/700 · Value 13/600 · Body 11/400 #8F9098 · Eyebrow 10/700 uppercase +1.1px #55575F
- Numerals always tabular. Biggest number wins; hierarchy by size and weight, never color.

## Shape and spacing
- Radius: card 10 · nested 6 · pill 999
- Screen padding 20 · card padding 14×16 · card gap 12 · section gap 24 · tap target ≥44

## Actions
**Primary**, filled, one per card max, fill by meaning:
- **Blue** #659BC8, 50px, 15/700, text #0B0C0E. The thing to do now.
- **Moss** #6CA383, 50px. Confirms something earned. Only when a real case needs it.
- **Tonal** rgba(237,238,240,0.06), 44px, 14/600 #EDEEF0, no border. Lesser action alone on a card.

**Secondary**: text 14/600 #8F9098, 44px tap row, centered. Only directly under a primary.

Rules: one primary per card · lone lesser action → Tonal · whole card tappable → no button · no chevrons on buttons or secondary text.

## Copy
Middots (·) as separators. No em dashes. Facts, not generated verdicts.
