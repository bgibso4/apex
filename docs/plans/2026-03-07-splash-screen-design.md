# Splash Screen + Logo Font Infrastructure Design

**Date:** 2026-03-07
**Scope:** Branded splash screen on app launch + font loading infrastructure for APEX wordmark

## Context

The app currently shows a plain ActivityIndicator spinner during DB initialization. This replaces it with a branded splash screen that shows the APEX wordmark and a personal creed quote, creating a premium feel on every launch.

## Changes

### 1. SplashScreen Component

New component: `src/components/SplashScreen.tsx`

- Full-screen overlay, absolute positioned, `Colors.bg` background
- "APEX" wordmark centered vertically, large text using custom font (or system bold fallback)
- Fixed quote below in dim italic text: "Mastery is a process, not a destination. I am committed to the journey, knowing the path itself is the reward."
- Minimum display duration: 1.5 seconds (configurable constant `SPLASH_MIN_DURATION_MS`)
- `onFinished` callback prop — signals the root layout when splash is done

### 2. Configurable Transition System

The splash exit animation is driven by a `TRANSITION_STYLE` constant. Three options, swappable by changing one value:

- **`'scale-fade'` (default):** "APEX" scales 1.0 to 0.85 while fading out. Quote fades faster. ~400ms.
- **`'fade'`:** Simple opacity fade on entire splash. ~300ms.
- **`'crossfade'`:** Splash fades out while homepage fades in from partial opacity. ~500ms.

All use `react-native-reanimated`.

### 3. Root Layout Changes

Current flow: `DB loading -> spinner -> app`

New flow: `DB loading + font loading (parallel) -> SplashScreen (min 1.5s) -> transition out -> app`

1. `getDatabase()` and `expo-font loadAsync()` run in parallel
2. SplashScreen renders immediately (no spinner)
3. When both are ready AND min time has elapsed, SplashScreen calls `onFinished`
4. Root layout sets `splashDone = true`, splash animates out, Stack renders underneath

### 4. Font Infrastructure

- Create `assets/fonts/` directory (empty for now)
- Add constant: `export const APEX_FONT_FAMILY = 'System'` (placeholder in theme)
- Font loading via `expo-font` in root layout — gracefully falls back to system if no font file present
- Both the splash screen and homepage header APEX wordmark use this constant
- To add a font later: drop `.ttf` into `assets/fonts/`, update `APEX_FONT_FAMILY`, done

### 5. Mockup

Build an HTML mockup (`docs/mockups/splash-2026-03-07.html`) showing:
- The splash screen (APEX wordmark + quote, centered on dark background)
- The transition mid-state (optional, for visual reference)

## Affected Files

- `docs/mockups/splash-2026-03-07.html` (new)
- `src/components/SplashScreen.tsx` (new)
- `app/_layout.tsx` (replace spinner with SplashScreen, add font loading)
- `app/(tabs)/index.tsx` (use APEX_FONT_FAMILY for header wordmark)
- `src/theme/spacing.ts` or new `src/theme/fonts.ts` (APEX_FONT_FAMILY constant)
- `assets/fonts/` (new empty directory, ready for font drop-in)
- `package.json` (add expo-font if not already present)
