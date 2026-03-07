# Splash Screen + Font Infrastructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the loading spinner with a branded splash screen showing "APEX" + personal creed quote, with configurable exit transitions and font loading infrastructure.

**Architecture:** A new `SplashScreen` component renders as a full-screen overlay in the root layout. It runs parallel with DB and font initialization, stays visible for a minimum duration, then animates out with a configurable transition. Font infrastructure is set up with a placeholder constant ready for a custom font drop-in.

**Tech Stack:** React Native, TypeScript, react-native-reanimated, expo-font, expo-splash-screen

**Design doc:** `docs/plans/2026-03-07-splash-screen-design.md`

---

### Task 1: Build Splash Screen Mockup

**Files:**
- Create: `docs/mockups/splash-2026-03-07.html`

**Step 1: Create the mockup**

Build an HTML mockup with two phone frames:

**Phone 1: Splash Screen**
- Full `#0a0a0f` background
- "APEX" centered vertically, large (40-48px), `font-weight: 800`, `letter-spacing: 4px`, white
- Below the wordmark (with ~20px gap): the creed quote in `#6a6a80`, 14px, italic, centered, max-width ~280px, `line-height: 1.5`
- Quote text: "Mastery is a process, not a destination. I am committed to the journey, knowing the path itself is the reward."
- No tab bar, no status bar icons — just the brand moment
- Dynamic island at top (consistent with other mockups)

**Phone 2: Mid-Transition (scale-fade)**
- Same layout but "APEX" is slightly smaller (scale ~0.9) and at ~50% opacity
- Quote is at ~30% opacity
- Faint hint of the homepage content appearing underneath (optional, just to illustrate the transition concept)

Use the same phone frame CSS from `docs/mockups/home-2026-03-07.html`.

**Step 2: Commit**

```bash
git add docs/mockups/splash-2026-03-07.html
git commit -m "Add splash screen mockup"
```

---

### Task 2: Font Infrastructure

**Files:**
- Create: `assets/fonts/.gitkeep`
- Create: `src/theme/fonts.ts`
- Modify: `src/theme/index.ts`

**Step 1: Create fonts directory**

```bash
mkdir -p assets/fonts
touch assets/fonts/.gitkeep
```

**Step 2: Create font constants file**

Create `src/theme/fonts.ts`:

```tsx
/**
 * APEX Design System -- Font Tokens
 *
 * To add a custom font for the APEX wordmark:
 * 1. Drop the .ttf file into assets/fonts/
 * 2. Update APEX_FONT_FAMILY to match the font's PostScript name
 * 3. Add the file to CUSTOM_FONTS map below
 */

/** Font family for the APEX wordmark. 'System' = platform default. */
export const APEX_FONT_FAMILY = 'System';

/**
 * Custom fonts to load via expo-font.
 * Key = font name used in styles, Value = require() path.
 * Leave empty until a custom font is added.
 */
export const CUSTOM_FONTS: Record<string, any> = {
  // Example when adding a font:
  // 'BebasNeue': require('../../assets/fonts/BebasNeue-Regular.ttf'),
};
```

**Step 3: Export from theme index**

Read `src/theme/index.ts` and add the export. It likely re-exports from other theme files. Add:

```tsx
export { APEX_FONT_FAMILY, CUSTOM_FONTS } from './fonts';
```

**Step 4: Run tests**

Run: `npm test -- --no-coverage`
Expected: All pass (no behavior change).

**Step 5: Commit**

```bash
git add assets/fonts/.gitkeep src/theme/fonts.ts src/theme/index.ts
git commit -m "Add font infrastructure with placeholder for custom APEX font"
```

---

### Task 3: SplashScreen Component

**Files:**
- Create: `src/components/SplashScreen.tsx`
- Create: `__tests__/components/SplashScreen.test.tsx`

**Step 1: Write failing tests**

Create `__tests__/components/SplashScreen.test.tsx`:

```tsx
import React from 'react';
import { render, screen, act } from '@testing-library/react-native';
import { SplashScreen } from '../../src/components/SplashScreen';

describe('SplashScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders APEX wordmark', () => {
    render(<SplashScreen isReady={false} onFinished={jest.fn()} />);
    expect(screen.getByText('APEX')).toBeTruthy();
  });

  it('renders the creed quote', () => {
    render(<SplashScreen isReady={false} onFinished={jest.fn()} />);
    expect(screen.getByText(/mastery is a process/i)).toBeTruthy();
  });

  it('does not call onFinished before minimum duration even if ready', () => {
    const onFinished = jest.fn();
    render(<SplashScreen isReady={true} onFinished={onFinished} />);

    // Advance less than minimum duration
    act(() => { jest.advanceTimersByTime(500); });
    expect(onFinished).not.toHaveBeenCalled();
  });

  it('calls onFinished after minimum duration when ready', () => {
    const onFinished = jest.fn();
    render(<SplashScreen isReady={true} onFinished={onFinished} />);

    act(() => { jest.advanceTimersByTime(1600); });
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('waits for isReady even after minimum duration', () => {
    const onFinished = jest.fn();
    const { rerender } = render(<SplashScreen isReady={false} onFinished={onFinished} />);

    // Past minimum duration but not ready
    act(() => { jest.advanceTimersByTime(2000); });
    expect(onFinished).not.toHaveBeenCalled();

    // Now set ready
    rerender(<SplashScreen isReady={true} onFinished={onFinished} />);
    act(() => { jest.advanceTimersByTime(100); });
    expect(onFinished).toHaveBeenCalledTimes(1);
  });
});
```

**Step 2: Run to verify failure**

Run: `npm test -- --testPathPattern="SplashScreen" --no-coverage`
Expected: FAIL (component doesn't exist).

**Step 3: Implement SplashScreen**

Create `src/components/SplashScreen.tsx`:

```tsx
/**
 * APEX -- Branded Splash Screen
 * Shown on app launch while DB and fonts initialize.
 */

import { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Colors, FontSize, Spacing } from '../theme';
import { APEX_FONT_FAMILY } from '../theme/fonts';

/** Transition style for the splash exit animation */
export type TransitionStyle = 'fade' | 'scale-fade' | 'crossfade';

/** Change this to swap the exit transition */
const TRANSITION_STYLE: TransitionStyle = 'scale-fade';

/** Minimum time the splash screen is visible (ms) */
const SPLASH_MIN_DURATION_MS = 1500;

/** Transition animation duration (ms) */
const TRANSITION_DURATION_MS = 400;

const CREED = 'Mastery is a process, not a destination. I am committed to the journey, knowing the path itself is the reward.';

export interface SplashScreenProps {
  /** Whether the app is ready (DB + fonts loaded) */
  isReady: boolean;
  /** Called when splash is done (min time elapsed + ready + transition complete) */
  onFinished: () => void;
}

export function SplashScreen({ isReady, onFinished }: SplashScreenProps) {
  const minTimeElapsed = useRef(false);
  const hasTriggeredExit = useRef(false);

  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const quoteOpacity = useSharedValue(1);

  const startExitAnimation = useCallback(() => {
    if (hasTriggeredExit.current) return;
    hasTriggeredExit.current = true;

    const duration = TRANSITION_DURATION_MS;

    if (TRANSITION_STYLE === 'fade') {
      opacity.value = withTiming(0, { duration }, () => {
        runOnJS(onFinished)();
      });
    } else if (TRANSITION_STYLE === 'scale-fade') {
      quoteOpacity.value = withTiming(0, { duration: duration * 0.6 });
      scale.value = withTiming(0.85, { duration });
      opacity.value = withTiming(0, { duration }, () => {
        runOnJS(onFinished)();
      });
    } else if (TRANSITION_STYLE === 'crossfade') {
      opacity.value = withTiming(0, { duration: duration * 1.2 }, () => {
        runOnJS(onFinished)();
      });
    }
  }, [onFinished, opacity, scale, quoteOpacity]);

  const tryExit = useCallback(() => {
    if (minTimeElapsed.current && isReady) {
      startExitAnimation();
    }
  }, [isReady, startExitAnimation]);

  // Minimum duration timer
  useEffect(() => {
    const timer = setTimeout(() => {
      minTimeElapsed.current = true;
      tryExit();
    }, SPLASH_MIN_DURATION_MS);
    return () => clearTimeout(timer);
  }, [tryExit]);

  // Watch for isReady changes
  useEffect(() => {
    if (isReady) {
      tryExit();
    }
  }, [isReady, tryExit]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const wordmarkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const quoteAnimatedStyle = useAnimatedStyle(() => ({
    opacity: quoteOpacity.value,
  }));

  const fontFamily = APEX_FONT_FAMILY === 'System' ? undefined : APEX_FONT_FAMILY;

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <View style={styles.content}>
        <Animated.View style={wordmarkAnimatedStyle}>
          <Text style={[styles.wordmark, fontFamily && { fontFamily }]}>
            APEX
          </Text>
        </Animated.View>
        <Animated.View style={quoteAnimatedStyle}>
          <Text style={styles.creed}>{CREED}</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.bg,
    zIndex: 100,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  wordmark: {
    color: Colors.text,
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: 4,
    marginBottom: Spacing.xl,
  },
  creed: {
    color: Colors.textDim,
    fontSize: FontSize.md,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 280,
  },
});
```

**Step 4: Run tests**

Run: `npm test -- --testPathPattern="SplashScreen" --no-coverage`
Expected: All 5 pass.

Then: `npm test -- --no-coverage`
Expected: Full suite passes.

**Step 5: Commit**

```bash
git add src/components/SplashScreen.tsx __tests__/components/SplashScreen.test.tsx
git commit -m "Add SplashScreen component with configurable exit transitions"
```

---

### Task 4: Wire SplashScreen into Root Layout

**Files:**
- Modify: `app/_layout.tsx`

**Step 1: Read the current file**

Read `app/_layout.tsx`. Currently it:
1. Initializes DB in a useEffect
2. Shows ActivityIndicator while `!dbReady`
3. Renders the Stack when ready

**Step 2: Rewrite root layout**

Replace the contents of `app/_layout.tsx`:

```tsx
/**
 * APEX -- Root Layout
 * Sets up the dark theme, loads fonts, and shows splash screen.
 */

import { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import * as Font from 'expo-font';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { Colors } from '../src/theme';
import { CUSTOM_FONTS } from '../src/theme/fonts';
import { getDatabase } from '../src/db';
import { SplashScreen } from '../src/components/SplashScreen';

// Prevent the native splash from auto-hiding — we control it
ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    (async () => {
      // Run DB init and font loading in parallel
      await Promise.all([
        getDatabase(),
        Object.keys(CUSTOM_FONTS).length > 0
          ? Font.loadAsync(CUSTOM_FONTS)
          : Promise.resolve(),
      ]);

      // Hide the native splash screen (our custom one takes over)
      await ExpoSplashScreen.hideAsync().catch(() => {});

      setAppReady(true);
    })();
  }, []);

  const handleSplashFinished = useCallback(() => {
    setSplashDone(true);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <StatusBar style="light" />
      {splashDone && (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.bg },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="library"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen name="settings" />
          <Stack.Screen
            name="activate"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
        </Stack>
      )}
      {!splashDone && (
        <SplashScreen
          isReady={appReady}
          onFinished={handleSplashFinished}
        />
      )}
    </View>
  );
}
```

Key changes:
- `ExpoSplashScreen.preventAutoHideAsync()` keeps the native splash until we're ready
- DB and fonts load in parallel
- Native splash hides once both are done, our custom SplashScreen takes over
- Stack only renders after `splashDone` — prevents any flash of content behind the splash
- SplashScreen renders on top when `!splashDone`

**Step 3: Run tests**

Run: `npm test -- --no-coverage`
Expected: All pass.

**Step 4: Commit**

```bash
git add app/_layout.tsx
git commit -m "Wire SplashScreen into root layout with parallel font/DB loading"
```

---

### Task 5: Use APEX_FONT_FAMILY in Homepage Header

**Files:**
- Modify: `app/(tabs)/index.tsx`

**Step 1: Read the file and update the APEX wordmark style**

In `app/(tabs)/index.tsx`, the `apexTitle` style currently uses system font. Import `APEX_FONT_FAMILY` and apply it conditionally:

1. Add import:
```tsx
import { APEX_FONT_FAMILY } from '../../src/theme/fonts';
```

2. In the header JSX, add conditional fontFamily to the Text:
```tsx
<Text style={[
  styles.apexTitle,
  APEX_FONT_FAMILY !== 'System' && { fontFamily: APEX_FONT_FAMILY },
]}>
  APEX
</Text>
```

**Step 2: Run tests**

Run: `npm test -- --no-coverage`
Expected: All pass.

**Step 3: Commit**

```bash
git add "app/(tabs)/index.tsx"
git commit -m "Use APEX_FONT_FAMILY constant for homepage wordmark"
```

---

### Task 6: Final Verification

**Step 1: Run full test suite**

Run: `npm test -- --no-coverage`
Expected: All tests pass.

**Step 2: Visual review**

Open the app in Expo Go / iOS simulator. Verify:
- [ ] App launches with branded splash screen (APEX + creed quote)
- [ ] Splash stays visible for ~1.5 seconds minimum
- [ ] Scale-fade transition plays when dismissing
- [ ] Homepage renders after splash finishes
- [ ] Homepage still has staggered fade-in animation (from previous work)
- [ ] APEX wordmark on homepage uses same font as splash (system bold for now)
- [ ] No flash of white/content before splash appears

**Step 3: Test transition swap**

In `src/components/SplashScreen.tsx`, temporarily change `TRANSITION_STYLE` to `'fade'`, reload, verify it works. Change to `'crossfade'`, verify. Revert to `'scale-fade'`.

**Step 4: Commit any tweaks**

```bash
git add -A
git commit -m "Splash screen: branded launch with scale-fade transition and font infrastructure"
```
