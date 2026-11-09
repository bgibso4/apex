# Expo SDK 54 → 58 Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the frozen RN app from Expo SDK 54 to SDK 58 so `npm run device` works again with Xcode 27.2 (DeviceHub has replaced Simulator.app), and drop the iOS 27 patches that SDK 58 now handles itself.

**Architecture:** This is a dependency upgrade. `expo install` pins every Expo-managed package to the SDK 58 set. We then fix the code that breaks (gesture-handler v3 is the only known break), cut `plugins/withIOS27Support.js` down to whatever the SDK 58 prebuild output still needs (possibly nothing), and prove the result on Ben's iPhone.

**Tech Stack:** Expo SDK 58 (expo 58.0.23, @expo/cli ^58.1.19), React Native 0.88.1, React 19.3.0, Reanimated 4.7.1 / worklets 0.13.0, expo-router ~58.0.30, expo-sqlite ~58.0.15, react-native-gesture-handler ~3.3.0, TypeScript ~6.0.3.

**Spec:** Ben's handoff message (2026-11-08 session) plus the decision to pick SDK 58: "Ideally we go the newest versions when we can."

## Global Constraints

- Target SDK 58, the npm `latest` tag. Every Expo-managed version comes from `npx expo install --fix`. Don't hand-pick versions.
- `@cadre/shared` stays pinned at `github:bgibso4/cadre#v0.1.0`. The frozen RN app takes no cadre bump.
- `npm test` and `npm run typecheck` must pass at the end of every task.
- `ios/` stays gitignored. Every native change has to come from a config plugin or `app.json`.
- `ios.appleTeamId` stays `W6S6K84XVM`. Device UDID is `00008140-0004519C3093C01C`.
- Don't push and don't open a PR without Ben's say-so. Commit on `chore/expo-sdk-upgrade` only.
- Node: RN 0.88 declares `^22.13 || ^24.3 || >=26`. Ben upgraded the machine from 25.3.0 to Node 26.13.0 LTS (official pkg) before Task 1. Confirm `node -v` prints `v26.x` before installing anything.

## Review Focus

1. **WHOOP OAuth return after the scene change.** Expo's `ExpoAppSceneDelegate` replaces our hand-written SceneDelegate. The `apex://oauth/callback` redirect has to land on Settings and finish the token exchange, both when the app was already running and when it was cold-started. Task 3 checks the delegate's URL forwarding in source; Task 4 checks it on the device.
2. **SQLite data survives the reinstall.** Ben's live training history is on the phone. expo-sqlite 16 → 58 must open the same database file in the same location. Task 3 checks the default directory in the source and diffs it against 16.x. Before installing, Ben exports a backup from Settings.
3. **Session restore on a cold launch under the scene lifecycle.** Kill the app mid-workout and relaunch: it must reopen the Workout tab at the exact set (Task 4, on device).
4. **Running-tab swipe actions after gesture-handler v3.** Swiping a row shows Edit/Delete, opening a second row closes the first, and each action closes its row (Task 2 test plus a Task 4 device check).
5. **Backup export/import through `expo-file-system/legacy`.** The `legacy` entry point still exists in 58.0.13. Export a backup and confirm the share sheet opens with a non-empty file (Task 4, on device).

---

### Task 1: Bump dependencies to the SDK 58 set

**Files:**
- Modify: `package.json`, `package-lock.json`

**Interfaces:**
- Produces: a dependency tree that `npx expo-doctor` accepts and that installs cleanly. Later tasks assume the versions in Tech Stack.

- [ ] **Step 0: Record the SDK 54 baseline:** before touching anything, run `npm test 2>&1 | tail -5` and save the passed/total counts to the scratchpad. Task 2 compares against them.
- [ ] **Step 1: Bump expo:** `npx expo install expo@^58.0.0`. Expected: `package.json` shows `"expo": "~58.0.23"` (or newer 58.x).
- [ ] **Step 2: Align every Expo-managed package:** `npx expo install --fix`. Expected: no "should be updated" lines left. `react-native` is 0.88.x, `react` 19.3.0, `react-native-gesture-handler` ~3.3.0, `react-native-worklets` 0.13.x.
- [ ] **Step 3: Align devDependencies that `--fix` doesn't touch:** run `npx expo install --dev typescript @types/react react-test-renderer babel-preset-expo eslint-config-expo` so they match SDK 58 (TS ~6.0.3, @types/react ~19.3.0, react-test-renderer 19.3.0). Keep `@testing-library/react-native` on ^13 unless Task 2 shows it breaks with React 19.3. v14 swaps in a different renderer package, which is a separate change.
- [ ] **Step 4: Health check:** `npx expo-doctor`. Expected: no failures. Fix whatever it reports, either through `expo install` or by adding to `expo.install.exclude` with a reason in the commit message.
- [ ] **Step 5: Commit** `package.json package-lock.json` with message `chore: upgrade Expo SDK 54 → 58 (RN 0.88, React 19.3)`. Tests may still be red at this point; Task 2 fixes them. Note any failures in the commit body.

### Task 2: Get `tsc` and `npm test` green on the new versions

**Files:**
- Modify: `app/(tabs)/running.tsx:13,269-270,431-443`. Swipeable migration: gesture-handler v3 no longer exports `Swipeable` from the package root.
- Modify: other files only where `tsc` or tests point to a real break from the upgrade
- Test: `__tests__/components/RunSwipeRow.test.tsx` only if the swipe list can be rendered in isolation. Otherwise rely on `tsc` plus Review Focus #4 on the device.

**Interfaces:**
- Consumes: Task 1's dependency tree.
- Produces: `npm run typecheck` and `npm test` both exit 0.

- [ ] **Step 1: Get the baseline:** run `npm run typecheck` and `npm test`, and save the failure list in the scratchpad. Expected: `running.tsx` fails with "has no exported member 'Swipeable'". Everything else is still unknown.
- [ ] **Step 2: Migrate the Swipeable.** Change the import to `import Swipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';` and retype both refs as `SwipeableMethods` (`useRef<SwipeableMethods | null>`, `Record<string, SwipeableMethods>`). The props `renderRightActions`, `overshootRight`, `onSwipeableWillOpen` and `ref` keep their names in v3. Behavior stays the same.
- [ ] **Step 3: Fix the remaining failures one by one.** For each, find the cause in the package's CHANGELOG and make the smallest change that fixes it. If a test fails because a mock is out of date (for example the `__mocks__/react-native-svg.ts` mapper, or a missing gesture-handler `jestSetup`), fix the mock, not the assertion. If a fix touches app behavior, write a failing test first.
- [ ] **Step 4: Verify:** `npm run typecheck && npm test`. Expected: both exit 0, and the passing-test count is no lower than the SDK 54 baseline from Task 1 Step 0.
- [ ] **Step 5: Commit** the touched files with message `fix: adapt app to SDK 58 (gesture-handler v3 Swipeable, …)`.

### Task 3: Cut `withIOS27Support` down to what SDK 58 still needs

**Files:**
- Modify or delete: `plugins/withIOS27Support.js`
- Modify or delete: `__tests__/utils/withIOS27Support.test.ts`
- Modify: `app.json` (`expo.plugins`), only if the plugin is deleted
- Check: `plugins/withICloudBackup.js` still applies cleanly to the SDK 58 template

**Interfaces:**
- Consumes: SDK 58's prebuild template, which already includes `SceneDelegate: ExpoAppSceneDelegate`, `UIApplicationSceneManifest`, and an AppDelegate that doesn't create a window.
- Produces: a `npx expo prebuild --clean --platform ios` that succeeds with no manual edits afterwards.

- [ ] **Step 1: Remove the scene parts.** The SDK 58 template removes the `LAUNCH_WINDOW_BLOCK` anchor, so as written the plugin would now throw. Delete `addSceneDelegate`, `addSceneManifest`, their mods, and their tests. Template comparison: AppDelegate says "The window is created and React Native is started by `SceneDelegate`".
- [ ] **Step 2: Check URL forwarding in the source.** Read `node_modules/expo/ios/**/ExpoAppSceneDelegate*.swift` (or wherever it lives in expo-modules-core). Confirm that `scene(_:willConnectTo:options:)` handles `connectionOptions.urlContexts`, and that `scene(_:openURLContexts:)` forwards to the app delegate subscribers (the RCTLinkingManager path). Record the file and line numbers in the commit body. If either is missing, keep a minimal `withAppDelegate`-style patch that subclasses the template's `SceneDelegate` extension point, and test it the same way the old `addSceneDelegate` tests did.
- [ ] **Step 3: Check the SQLite location in the source** (Review Focus #2). Compare the default database directory in `node_modules/expo-sqlite/ios/` against expo-sqlite 16.0.10 (`npm pack expo-sqlite@16.0.10` into the scratchpad). Expected: same directory. If it differs, **stop and tell Ben before anything is installed on the phone.**
- [ ] **Step 4: Decide the pod bump from evidence.** Temporarily take `raisePodDeploymentTargets` out of the plugin chain. Run `npx expo prebuild --clean --platform ios` and then `grep -h "IPHONEOS_DEPLOYMENT_TARGET" ios/Pods/Pods.xcodeproj/project.pbxproj | sort -u`. react-native-svg 15.16.0 now declares iOS 15.1. If no target is below 15.0, delete the plugin, its test, and the `"./plugins/withIOS27Support"` entry in `app.json`. If some target is still below 15.0, keep only `raisePodDeploymentTargets` and its tests, and update the file header comment to name the pod that still needs it.
- [ ] **Step 5: Verify that prebuild is reproducible:** run `npx expo prebuild --clean --platform ios` twice. Expected: both succeed, there's no `[withIOS27Support]` or `withICloudBackup` error, `ios/APEX/SceneDelegate.swift` exists, and `npm test && npm run typecheck` pass.
- [ ] **Step 6: Commit** the plugin, test and app.json changes with message `refactor: drop iOS 27 scene patch now that SDK 58 ships UIScene support`.

### Task 4: Build to the iPhone and smoke-test it

**Files:**
- None, unless the build fails, in which case fix through a plugin or `app.json` and go back to Task 3 Step 5.

**Interfaces:**
- Consumes: Task 3's clean prebuild.
- Produces: the build and install evidence, plus Ben's smoke-test results.

- [ ] **Step 1: Back up first.** Ask Ben to export a backup from Settings on the phone's *current* build before anything gets installed (Review Focus #2).
- [ ] **Step 2: Build and install with the real command.** Dispatch the `ios-verifier` agent to run `npm run device -- --device 00008140-0004519C3093C01C` (sandbox off, because signing needs the keychain). Expected: it gets past the Simulator check where SDK 54 died ("Can't determine id of Simulator app"), the Release build succeeds, and the app installs. If `expo run:ios` fails for a reason unrelated to our code, use the fallback recipe in memory `project_device_build_stale_ios.md` (`xcodebuild … -destination id=<UDID>` + `xcrun devicectl device install app`) to separate CLI problems from app problems, and report both results.
- [ ] **Step 3: Launch check:** `xcrun devicectl device process launch --device 00008140-0004519C3093C01C com.bgibso4.apex`. Expected: the process is running 10 s later, with no new `.ips` crash in `xcrun devicectl device info files … CrashReporter`.
- [ ] **Step 4: Ben runs the smoke checklist** (only Ben can tap the phone). Pass means:
  - Launch: Home renders with his existing program and history (proves the data survived).
  - Logging a set: start today's workout, tap a set as prescribed, and it checks off with a haptic.
  - Session restore: with the workout in progress, swipe the app away, relaunch, and it lands on the Workout tab at the same set.
  - WHOOP OAuth: Settings → Connect WHOOP → browser → approve → back in APEX as "connected", and today's strain loads.
  - Running swipe: swipe a run row, Edit opens the form, and opening a second row closes the first.
  - Backup export: the share sheet opens with a non-empty `.json`.
- [ ] **Step 5: Update the docs.** Change "Expo SDK 54" to "Expo SDK 58" in `CLAUDE.md` (Tech Stack). Update memory `project_device_build_stale_ios.md`: `npm run device` works again on SDK 58, and the plugin status is whatever Task 3 decided. Commit `CLAUDE.md` with message `docs: note Expo SDK 58`.
- [ ] **Step 6: Report to Ben.** Give the test and tsc counts, the prebuild and device evidence, and the smoke results. Ask whether to push and open a PR. Mention that the base branch `fix/ios27-sdk-build` is still unpushed, and that its scene patch becomes moot once this branch lands.
