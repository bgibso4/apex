# APEX Phone Deployment Guide

## Prerequisites

- Xcode installed (latest from App Store)
- iPhone connected via USB-C
- Apple ID (free) or paid Apple Developer account

## Steps

### 1. Generate native iOS project

```bash
npx expo prebuild --platform ios
```

This creates the `ios/` directory with the native Xcode project.

### 2. Open in Xcode

```bash
open ios/apex.xcworkspace
```

### 3. Configure signing

1. Select the **apex** target in Xcode
2. Go to **Signing & Capabilities** tab
3. Check **Automatically manage signing**
4. Select your Team (your Apple ID or a developer account)

### 4. Build to device

1. Select your connected iPhone as the build target (top toolbar)
2. Press **Cmd+R** to build and run

The app will install and run standalone on your phone.

## Signing Options

### Option A: Free Apple ID

- Sign into Xcode with your personal Apple ID
- App must be re-signed every **7 days** (reconnect phone + rebuild)
- Limited to 3 apps per Apple ID

### Option B: Paid Developer Account ($99/year)

- App runs indefinitely, no re-signing needed
- Can distribute via TestFlight
- Required for App Store submission

### Option C: Friend's Developer Account

If someone you know has a paid account:
1. Have them add your device UDID to their account
2. Use their team/provisioning profile in Xcode
3. App runs indefinitely on your phone

## Rebuilding After Code Changes

For development, `expo start` with the dev client gives you hot reload:

```bash
npx expo start --dev-client
```

For a fresh standalone build (no dev server needed):

```bash
npx expo prebuild --platform ios --clean
open ios/apex.xcworkspace
# Build in Xcode (Cmd+R)
```

## Troubleshooting

- **"Untrusted Developer"** on iPhone: Go to Settings > General > VPN & Device Management > trust your developer certificate
- **Build fails with signing error**: Make sure you selected the right team in Xcode signing settings
- **Pod install fails**: Run `cd ios && pod install --repo-update && cd ..`
