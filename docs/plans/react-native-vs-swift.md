# React Native vs Swift: APEX Evaluation

## Context

APEX is a strength training app built with Expo/React Native, TypeScript, and SQLite. Six screens are built and functional. This document evaluates whether to continue with React Native or rewrite in Swift/SwiftUI.

## Comparison

| Dimension | React Native (Expo) | SwiftUI |
|-----------|-------------------|---------|
| **Current state** | Working app, 6 screens, data layer, tests | Complete rewrite required |
| **Visual quality** | Indistinguishable for APEX's UI (cards, lists, buttons, charts) | Marginally smoother transitions |
| **Performance** | More than adequate for a training log app | No perceptible difference for this use case |
| **Dev velocity** | Hot reload, Expo, fast iteration | Xcode-only, slower builds, no hot reload |
| **Testing** | Jest + RNTL working, 48 tests | XCTest, less ecosystem tooling |
| **Apple integrations** | Via native modules (expo-modules-api) | First-class HealthKit, Widgets, Watch |
| **Android** | Possible with same codebase | Separate app required |
| **OTA updates** | EAS Update (push JS updates without App Store review) | App Store review for every update |
| **Dependencies** | npm ecosystem, Expo SDK manages compatibility | SPM/CocoaPods, Apple manages OS compatibility |
| **Long-term maintenance** | Expo SDK upgrades ~2x/year | Xcode/iOS SDK upgrades ~1x/year |

## What SwiftUI Would Buy

1. **HealthKit integration** — read/write workout data, step counts, heart rate
2. **Apple Watch companion** — log sets from your wrist
3. **Home Screen Widgets** — show today's workout at a glance
4. **Shortcuts/Siri** — "Start my workout" voice command
5. **Native animations** — spring physics, gesture-driven transitions

## What React Native Already Does Well

1. **Fast iteration** — change code, see it instantly
2. **Cross-platform option** — Android support if ever needed
3. **OTA updates** — push fixes without App Store review
4. **Portable data layer** — SQLite schema, TypeScript types, business logic all reusable
5. **Ecosystem** — large community, many libraries

## The Migration Question

APEX's architecture makes migration feasible if ever needed:
- SQLite schema is the source of truth (portable to any platform)
- TypeScript interfaces document the data model (serve as a spec)
- Business logic (Epley formula, target weight calc, program parsing) is pure functions easily ported
- UI is the only part that would need rewriting

## Recommendation

**Stay with React Native.** The app works, the architecture is clean, and none of APEX's current or planned features (session detail, ad-hoc exercises, exercise reordering) require native iOS APIs.

**When to reconsider:**
- If HealthKit integration becomes a priority
- If you want an Apple Watch companion app
- If you want Home Screen Widgets

At that point, evaluate adding native modules via `expo-modules-api` first (keeps the React Native app, adds Swift for specific features). A full rewrite only makes sense if native-only features become the primary value proposition.
