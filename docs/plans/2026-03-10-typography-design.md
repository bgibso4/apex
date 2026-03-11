# APEX Typography Design

**Date:** 2026-03-10
**Status:** Complete

## Decision

Use a custom Google Font for the APEX wordmark only. All other app text remains system font (San Francisco on iOS).

## Scope

**Wordmark only** — the "APEX" branding on the splash screen. The wordmark is composed of the chevron logo mark (as the "A") + "PEX" in the chosen font.

Everything else (screen titles, headings, body text, labels) stays system font.

## Font Candidates

All fonts are free via Google Fonts. The implementation supports one-line swapping between them.

1. **Orbitron 800** (current favorite) — Wide, uniform strokes, precision-engineered feel. Matches the chevron mark's geometric weight well.
2. **Anton 400** — Bold condensed, strong and commanding. High impact in small space.
3. **Oswald 700** — Condensed sans, clean and authoritative. A bit lighter than Anton.
4. **Barlow Condensed 800** — Tall, tight, modern. Good balance of weight and readability.

## Implementation

### Font loading
- Download all 4 .ttf files to `assets/fonts/`
- Register them in `src/theme/fonts.ts` via `CUSTOM_FONTS` map
- Load via expo-font in `app/_layout.tsx` (existing pattern)

### Swapping fonts
Change `APEX_FONT_FAMILY` in `src/theme/fonts.ts` to any registered font name. One line change.

### Splash screen update
- Render the logo mark image (transparent PNG) as the "A"
- Render "PEX" in the active `APEX_FONT_FAMILY`
- Replace the current plain text "APEX" approach

### Assets
- `assets/icon.png` — App icon (1024x1024, dark background)
- `assets/logo-mark.png` — Transparent chevron mark for inline use
