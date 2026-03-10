# App Icon Design

**Issue:** #13 — Design app icon
**Date:** 2026-03-10
**Status:** Complete

## Requirements

- 1024x1024 PNG, no transparency
- Recognizable at small sizes (home screen, notifications)
- Matches the app's dark, premium aesthetic

## Design Decisions

- **Style:** Monochrome — white mark on near-black (#0a0a0f) background
- **Mark type:** Lettermark — stylized "A" that doubles as a symbol
- **Feel:** Clean and precise, not aggressive. Premium tactical aesthetic (special forces, not esports)
- **Background:** Flat solid fill, no gradients or textures

## Chosen Direction

**Layered chevron "A"** (Prompt 3, Image 2 from Recraft) — angular chevron strokes forming the letter "A" with upward momentum, evoking military rank insignia. Clean lines, symmetric, reads well at all sizes.

## Winning Recraft Prompt

> Minimalist app icon, 1024x1024. A letter "A" constructed from angular chevron shapes, evoking military rank insignia and upward momentum. White mark on solid near-black background (#0a0a0f). The strokes are precise and geometric with sharp angles. Clean, symmetric, monochrome. No text, no gradients. Feels like a modern special forces unit patch.

## Implementation

Drop the 1024x1024 PNG at `assets/icon.png` — Expo generates all required iOS sizes from this single file via `app.json` config.
