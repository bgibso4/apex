# Standalone iOS Build Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable the app to run as a standalone iOS app on a physical iPhone without needing the Expo dev server.

**Architecture:** Use `expo run:ios` to prebuild the native `ios/` directory and build/install directly to a connected device via Xcode's toolchain. Free Apple ID signing with 7-day re-sign cycle. Convenience npm scripts wrap the commands.

**Tech Stack:** Expo SDK 54, Xcode (local), free Apple ID signing

---

### Task 1: Add convenience npm scripts

**Files:**
- Modify: `package.json:6-14` (scripts section)

**Step 1: Add the build scripts to package.json**

Add these three scripts to the `"scripts"` section:

```json
"prebuild": "npx expo prebuild --platform ios",
"device": "npx expo run:ios --device",
"device:clean": "npx expo prebuild --clean --platform ios && npx expo run:ios --device"
```

**Step 2: Verify scripts are valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('package.json'))" && echo "Valid JSON"`
Expected: `Valid JSON`

**Step 3: Commit**

```bash
git add package.json
git commit -m "feat: add convenience scripts for device builds"
```

---

### Task 2: Update placeholder app icon

**Files:**
- Modify: `assets/icon.png` (replace with generated placeholder)

The placeholder icon (white block "A" on dark `#0a0a0f` background, 1024x1024) has already been generated during the design phase. Verify it's in place.

**Step 1: Verify icon exists and is valid**

Run: `file assets/icon.png`
Expected: `assets/icon.png: PNG image data, 1024 x 1024`

**Step 2: Commit**

```bash
git add assets/icon.png
git commit -m "feat: add placeholder app icon for home screen"
```

---

### Task 3: Prebuild the native iOS project

**Step 1: Run expo prebuild**

Run: `npx expo prebuild --platform ios`

This generates the `ios/` directory with Xcode project files configured from `app.json`. Expected output includes "Config synced" and the creation of `ios/apex.xcworkspace`.

**Step 2: Verify ios/ directory was generated**

Run: `ls ios/apex.xcworkspace`
Expected: `contents.xcworkspacedata`

**Step 3: Install CocoaPods dependencies**

Run: `cd ios && pod install && cd ..`

Note: If CocoaPods is not installed, run `sudo gem install cocoapods` first.

Expected: `Pod installation complete!` with a list of installed pods.

**Step 4: Verify ios/ is gitignored**

Run: `git status ios/`
Expected: No files shown (already gitignored)

---

### Task 4: Build and install on device

**Prerequisites:**
- iPhone connected via USB
- iPhone unlocked and trusting this computer (tap "Trust" on the phone if prompted)

**Step 1: Build and install**

Run: `npx expo run:ios --device`

- Xcode will prompt to sign in with your Apple ID (first time only)
- Select your personal team for signing
- The app builds and installs on the connected iPhone
- This takes a few minutes on first build

**Step 2: Trust the developer certificate on iPhone**

On your iPhone:
1. Open Settings > General > VPN & Device Management
2. Find your Apple ID under "Developer App"
3. Tap it and tap "Trust"

**Step 3: Launch the app**

Tap the APEX icon on your home screen. Verify:
- App launches without a dev server running
- All tabs load (Home, Workout, Progress, Running)
- Navigation works
- App works in airplane mode (fully offline)

---

### Task 5: Enable wireless deployment (optional)

**Prerequisites:**
- iPhone and Mac on the same Wi-Fi network
- iPhone previously connected via USB

**Step 1: Open Xcode Devices window**

In Xcode: Window > Devices and Simulators (Cmd+Shift+2)

**Step 2: Enable network**

Select your iPhone in the left sidebar. Check "Connect via network". A network icon appears next to the device after a moment.

**Step 3: Test wireless build**

Disconnect USB. Run: `npm run device`

The build should deploy wirelessly. This is slower than USB but means you don't need a cable for weekly re-signs.

---

### Task 6: Document the weekly re-sign process

**Files:**
- The design doc and CLAUDE.md have already been updated during the design phase. Verify they're committed.

**Step 1: Commit documentation updates**

```bash
git add CLAUDE.md docs/plans/2026-03-08-standalone-ios-build-design.md
git commit -m "docs: add standalone iOS build design and update CLAUDE.md with deploy instructions"
```

---

## Summary of Weekly Re-sign Process

When the app stops launching (after 7 days):
1. Connect iPhone (USB or wireless)
2. Run `npm run device`
3. App reinstalls with fresh signature, data preserved
