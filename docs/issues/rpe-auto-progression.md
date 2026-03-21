# RPE Auto-Progression for Accessories

**Repo:** bgibso4/apex
**Priority:** Low — nice to have, not blocking v1 launch
**Created:** 2026-03-21

## Feature

Accessory exercises use a fixed rep target and starting weight. Rather than pre-planning weight progressions across blocks, accessories should auto-regulate: if you hit all sets at the target reps and your RPE was at or below a threshold, the app suggests bumping weight next session.

## Proposed Behavior

1. After completing an accessory exercise, the app logs RPE (already tracked)
2. If all sets were completed at the prescribed reps AND the final set RPE is at or below the target RPE (e.g., 7 or lower):
   - Show a subtle suggestion: "Nice work — try [weight + 5 lbs] next time?"
   - If accepted, update the default weight for that exercise going forward
3. If RPE is above target, keep the same weight
4. If reps were missed, optionally suggest dropping weight

## Design Considerations

- Should be lightweight — one tap to accept/dismiss, not a modal
- Weight increment should be configurable (5 lbs for barbell, 2.5 for DBs/cables)
- History of weight bumps should be visible in exercise detail view
- Consider a "streak" indicator — e.g., "Hit target 3 weeks in a row" before suggesting increase

## Related

- Accessory exercise progression discussion during Functional Athlete v2 audit (March 2026)
- Israetel/Matthews approach: pick a weight and rep target, bump weight when it gets easy
