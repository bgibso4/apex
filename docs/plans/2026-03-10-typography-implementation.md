# APEX Wordmark Typography Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add custom fonts for the APEX wordmark on the splash screen, with the logo mark as the "A" and easy font swapping.

**Architecture:** Download 4 Google Font .ttf files, register them in the existing font system (`src/theme/fonts.ts`), update the splash screen to render logo mark image + "PEX" text. Font swapping is a one-line change to `APEX_FONT_FAMILY`.

**Tech Stack:** expo-font, React Native Image, Google Fonts (Orbitron, Anton, Oswald, Barlow Condensed)

---

### Task 1: Download font files

**Files:**
- Create: `assets/fonts/Orbitron-ExtraBold.ttf`
- Create: `assets/fonts/Anton-Regular.ttf`
- Create: `assets/fonts/Oswald-Bold.ttf`
- Create: `assets/fonts/BarlowCondensed-ExtraBold.ttf`

**Step 1: Download all 4 fonts from Google Fonts**

```bash
# Orbitron ExtraBold (800)
curl -L "https://github.com/google/fonts/raw/main/ofl/orbitron/static/Orbitron-ExtraBold.ttf" -o assets/fonts/Orbitron-ExtraBold.ttf

# Anton Regular (400 — only weight available)
curl -L "https://github.com/google/fonts/raw/main/ofl/anton/Anton-Regular.ttf" -o assets/fonts/Anton-Regular.ttf

# Oswald Bold (700)
curl -L "https://github.com/google/fonts/raw/main/ofl/oswald/static/Oswald-Bold.ttf" -o assets/fonts/Oswald-Bold.ttf

# Barlow Condensed ExtraBold (800)
curl -L "https://github.com/google/fonts/raw/main/ofl/barlowcondensed/BarlowCondensed-ExtraBold.ttf" -o assets/fonts/BarlowCondensed-ExtraBold.ttf
```

**Step 2: Verify all files downloaded**

```bash
ls -la assets/fonts/*.ttf
```

Expected: 4 .ttf files, each > 10KB.

**Step 3: Commit**

```bash
git add assets/fonts/
git commit -m "feat: add wordmark font candidates (Orbitron, Anton, Oswald, Barlow Condensed)"
```

---

### Task 2: Register fonts in the font system

**Files:**
- Modify: `src/theme/fonts.ts`

**Step 1: Update fonts.ts to register all 4 fonts and default to Orbitron**

Replace the entire contents of `src/theme/fonts.ts` with:

```typescript
/**
 * APEX Design System -- Font Tokens
 *
 * To swap the APEX wordmark font, change APEX_FONT_FAMILY below.
 * Available options: 'Orbitron-ExtraBold', 'Anton-Regular', 'Oswald-Bold', 'BarlowCondensed-ExtraBold', 'System'
 */

/** Font family for the APEX wordmark. 'System' = platform default. */
export const APEX_FONT_FAMILY = 'Orbitron-ExtraBold';

/**
 * Custom fonts to load via expo-font.
 * Key = font name used in styles, Value = require() path.
 */
export const CUSTOM_FONTS: Record<string, any> = {
  'Orbitron-ExtraBold': require('../../assets/fonts/Orbitron-ExtraBold.ttf'),
  'Anton-Regular': require('../../assets/fonts/Anton-Regular.ttf'),
  'Oswald-Bold': require('../../assets/fonts/Oswald-Bold.ttf'),
  'BarlowCondensed-ExtraBold': require('../../assets/fonts/BarlowCondensed-ExtraBold.ttf'),
};
```

**Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit --pretty 2>&1 | head -20
```

Expected: No errors related to fonts.ts.

**Step 3: Commit**

```bash
git add src/theme/fonts.ts
git commit -m "feat: register 4 wordmark font candidates in font system"
```

---

### Task 3: Update splash screen to use logo mark + font

**Files:**
- Modify: `src/components/SplashScreen.tsx`

**Step 1: Update the splash screen wordmark rendering**

The splash screen currently renders `<Text>APEX</Text>`. Change it to render the logo mark image as the "A" followed by "PEX" in the custom font.

In `SplashScreen.tsx`, add the Image import:

```typescript
import { View, Text, Image, StyleSheet } from 'react-native';
```

Replace the wordmark `<Text>` block (lines 107-111):

```tsx
<Animated.View style={[wordmarkAnimatedStyle, styles.wordmarkRow]}>
  <Image
    source={require('../../assets/logo-mark.png')}
    style={styles.logoMark}
    resizeMode="contain"
  />
  <Text style={[styles.wordmark, fontFamily && { fontFamily }]}>
    PEX
  </Text>
</Animated.View>
```

Add these styles to the StyleSheet:

```typescript
wordmarkRow: {
  flexDirection: 'row',
  alignItems: 'center',
},
logoMark: {
  width: 38,
  height: 44,
  marginRight: 2,
},
```

Update the existing `wordmark` style — remove `letterSpacing: 4` and set it to `letterSpacing: 3` (tighter since the logo mark provides visual spacing for the "A"):

```typescript
wordmark: {
  color: Colors.text,
  fontSize: 44,
  fontWeight: '800',
  letterSpacing: 3,
  marginBottom: Spacing.xl,
},
```

Note: The `marginBottom` should move from `wordmark` to `wordmarkRow`:

```typescript
wordmarkRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: Spacing.xl,
},
wordmark: {
  color: Colors.text,
  fontSize: 44,
  fontWeight: '800',
  letterSpacing: 3,
},
```

**Step 2: Test on device or simulator**

```bash
npm run device
```

Verify: Splash screen shows logo mark + "PEX" in Orbitron. The mark should visually align with the text cap height.

**Step 3: Commit**

```bash
git add src/components/SplashScreen.tsx
git commit -m "feat: update splash screen to use logo mark + custom font wordmark"
```

---

### Task 4: Fine-tune logo mark sizing

**Files:**
- Modify: `src/components/SplashScreen.tsx`

**Step 1: Test on device and adjust**

After seeing it on the actual device, adjust `logoMark` width/height and `marginRight` until the mark's visual weight matches the "PEX" text cap height. The values in Task 3 are starting points — the actual image aspect ratio may need different values.

Also try each font by changing `APEX_FONT_FAMILY` in `src/theme/fonts.ts`:
- `'Orbitron-ExtraBold'`
- `'Anton-Regular'`
- `'Oswald-Bold'`
- `'BarlowCondensed-ExtraBold'`

Pick the winner and leave it set.

**Step 2: Commit**

```bash
git add src/components/SplashScreen.tsx src/theme/fonts.ts
git commit -m "feat: fine-tune wordmark logo mark sizing and select font"
```

---

### Task 5: Run tests and verify

**Step 1: Run the full test suite**

```bash
npm test
```

Expected: All existing tests pass. The splash screen changes are visual — no new test failures expected.

**Step 2: Final device test**

```bash
npm run device
```

Verify:
- Splash screen shows logo mark + "PEX" in chosen font
- Animation still works (scale-fade exit)
- Creed text still shows in system font
- App loads normally after splash

**Step 3: Final commit if any adjustments**

```bash
git add -A
git commit -m "feat: complete wordmark typography implementation"
```
