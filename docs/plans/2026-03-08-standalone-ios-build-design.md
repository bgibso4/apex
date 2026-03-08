# Standalone iOS Build (No Expo Dev Server)

**Date:** 2026-03-08
**Issue:** #2

## Problem

The app requires a laptop running the Expo dev server to use, making it unusable at the gym.

## Approach

Use `expo run:ios` to build a standalone app that installs directly on an iPhone via Xcode's toolchain. No Apple Developer account needed — uses free Apple ID with ad-hoc signing (7-day re-sign cycle).

### Why this approach

- One command to build and install
- Stays in the Expo ecosystem (no ejection)
- `ios/` directory is fully regenerable via `npx expo prebuild`
- All functionality works offline (SQLite is local)
- Simplest path with fewest moving parts

### Alternatives considered

- **Full Xcode manual build** — More manual steps, no advantage for this use case
- **EAS Build (local)** — Overkill for personal use, finicky with free Apple ID

## Build Process

1. `npx expo prebuild --platform ios` — generates native `ios/` directory from `app.json`
2. `npx expo run:ios --device` — builds via Xcode toolchain and installs on connected iPhone
3. First time: Xcode prompts to sign in with Apple ID and select a team
4. First time on phone: Settings > General > VPN & Device Management > trust developer certificate

## Weekly Re-sign

Free Apple ID signatures expire after 7 days. To re-sign:

1. Connect iPhone (USB or wireless after initial pairing)
2. Run `npm run device`
3. App reinstalls with fresh signature; SQLite data persists

## Convenience Scripts

Added to `package.json`:

- `npm run prebuild` — generate/regenerate native `ios/` project
- `npm run device` — build and install to connected iPhone
- `npm run device:clean` — full clean rebuild (prebuild + install)

## .gitignore

The `ios/` directory is already gitignored. It's ~50MB of generated Xcode project files, fully regenerable from `npx expo prebuild`.

## App Icon

Using a placeholder icon (white block "A" on dark background) for now. Proper icon design tracked in #13.

## Data Persistence

SQLite data lives in the app's documents directory and persists across reinstalls. No additional work needed.

## Wireless Deployment

After initial USB pairing, enable "Connect via network" in Xcode's Devices window. Subsequent builds can deploy wirelessly.
