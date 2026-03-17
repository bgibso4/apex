# Workout Header Redesign

## Goal

Redesign the workout screen's select phase to use a fixed "Workout" page title (consistent with Progress/Running screens) with workout details in a collapsible info card below.

## Current State

- Workout name renders as the large page title (screenTitle size)
- Long names wrap to a second line, looking sloppy
- Week/block label and "Change workout" sit below as separate elements
- Exercise list renders as standalone rows outside any card
- Inconsistent with other tab screens which use fixed titles

## Design

### Fixed Page Title

Add "Workout" as a fixed `screenTitle`-sized heading at the top, matching the pattern used by Progress and Running tabs.

### Info Card

All workout details move into a single bordered card (`Colors.card` background, `Colors.border` border, `BorderRadius.lg` radius):

**Top section:**
- Workout name (FontSize.xl, weight 700) with "Change" link aligned right
- Divider line

**Context row:**
- "WEEK 1 · HYPERTROPHY" (indigo, uppercase) on left
- Today badge (green dot + "Mon — Today") on right

**Exercise toggle row:**
- "N exercises + conditioning finisher" text as tappable row
- Chevron on right, rotates on expand
- Separated from context row by a divider

**Expanded state:**
- Exercise rows render inside the card with `Colors.bg` background for contrast
- Each row shows exercise name and set/rep target
- Collapsed by default

### Start Session Button

Remains below the card, outside the card boundary.

### Rest Day

When no template is selected (rest day), the info card is not rendered. The existing rest day empty state (moon icon + text) remains, centered on screen.

### Logging/Warmup/Complete Phases

No changes — this redesign only affects the select phase.

## Mockups

- `docs/mockups/workout-header-redesign-2026-03-16.html` — initial 3-option exploration
- `docs/mockups/workout-header-collapsible-2026-03-16.html` — chevron vs text toggle
- `docs/mockups/workout-header-collapsible-v2-2026-03-16.html` — approved design (exercise count as toggle row)
