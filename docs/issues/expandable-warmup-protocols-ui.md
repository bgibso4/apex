# Expandable Warmup Protocol Details in Workout Screen

**Repo:** bgibso4/apex
**Priority:** Medium — improves usability for warmup compliance
**Created:** 2026-03-21

## Problem

The warmup protocols (Full Ankle, Abbreviated Ankle, Full Ankle + Mobility, Dynamic Warmup) contain detailed step-by-step instructions in the program JSON (`warmup_protocols` → `steps` array), including exercise names, prescriptions, notes, and progressions. However, the app currently only shows the protocol name (e.g., "Full Ankle Protocol") with no way to see what exercises are included.

This means the user has to memorize the protocol or reference external notes. During a workout, this causes friction — especially for the ankle protocols which have 5-8 specific exercises with progression notes.

## Proposed Solution

Add an expandable/collapsible section in the workout screen's warmup area. When collapsed, it shows just the protocol name and duration (current behavior). When tapped, it expands to show:

1. Each step's name and prescription (e.g., "Plantar Fascia Roll — 30 sec/foot")
2. Notes for each step (e.g., "Lacrosse ball or golf ball on hard surface")
3. Progression notes where applicable (e.g., "Wk 1-4: seated → Wk 5-8: standing → Wk 9-12: single-leg")

The Dynamic Warmup protocol is special — it contains a menu of options for both upper and lower body days. The UI should make it clear these are pick-from options, not a required sequence.

## Data Structure

The data is already in the JSON at `program.warmup_protocols.[protocol_id].steps[]`. Each step has:
- `name` (string) — exercise name
- `prescription` (string) — sets/reps/duration
- `notes` (string, optional) — form cues or context
- `progression` (string, optional) — how it changes across the program

No schema changes needed — just a UI component to render this data.

## Design Considerations

- Collapsed by default (progressive disclosure — clean at first glance)
- Tap to expand, tap again to collapse
- Should feel lightweight — not a full modal, just an inline expansion
- Consider a small chevron icon to indicate expandability
- On the Dynamic Warmup protocol, visually separate "Lower body" and "Upper body" exercise groups
- Progression notes could be week-aware (show the current week's variant)

## Related

- Warmup protocol audit during Functional Athlete v2 program review (March 2026)
- Dynamic Warmup protocol added with session-specific exercise options
