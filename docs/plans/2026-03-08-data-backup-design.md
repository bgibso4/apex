# Data Backup Design

## Problem

All workout data lives in local SQLite only. If the app is deleted, the device is lost, or data corrupts, training history is gone permanently. This is unacceptable for a tool tracking months/years of training data. Especially critical with free Apple ID signing requiring weekly reinstalls.

## Solution: Two-Layer Backup System

### Layer 1: Manual Export/Import (Free — build now)

Works with a free Apple ID. No entitlements or paid accounts needed.

**Export flow:**
1. User taps "Export Backup" in Settings (or prompted after session completion)
2. App runs `PRAGMA wal_checkpoint(TRUNCATE)` to flush WAL into main DB
3. Copies `apex.db` to temp file: `apex-backup-YYYY-MM-DD.db`
4. Opens iOS Share Sheet — user picks destination (Files, AirDrop, iCloud Drive, etc.)
5. Stores last export timestamp for prompt logic

**Import flow:**
1. User taps "Import Backup" in Settings
2. Confirmation dialog: "This will replace all current data. Continue?"
3. iOS document picker opens (type `*/*`, validated to `.db` extension)
4. App validates the file: opens as separate DB, checks `schema_info` table and version
5. Closes current DB connection, sets singleton to `null`
6. Replaces local DB file with imported file
7. Reopens DB connection (runs migrations if imported version is older)
8. Success message, app reloads state

**Post-session prompt:**
- After `completeSession()`, check if last export was >7 days ago
- If so, show dismissible prompt: "Back up your data?" with Export / Dismiss
- Store `last_export_timestamp` in a `user_settings` table or `schema_info`

**USB access:**
- Set `UIFileSharingEnabled: true` and `LSSupportsOpeningDocumentsInPlace: true` in `app.json` under `expo.ios.infoPlist`
- Makes app's Documents folder visible in Finder when connected via USB

**Settings UI:**
```
Backup & Data
  Export Backup          Last: Mar 8, 2026
  Import Backup

  [USB Access enabled — visible in Finder]
```

### Layer 2: Automatic iCloud Backup (Paid account — add later)

Requires Apple Developer Program ($99/year). Lights up as a transparent upgrade.

**Backup flow:**
- After `completeSession()`, checkpoint WAL and copy DB to iCloud Documents container
- iOS handles syncing to iCloud in the background
- iCloud container identifier: `iCloud.com.bgibso4.apex`

**Restore flow:**
- On app launch, if local DB is empty/missing and iCloud has a backup, prompt to restore
- If both exist with data, local is authoritative — no conflict resolution needed

**Configuration:**
- Add iCloud Documents entitlement via Expo config plugin
- Configured in `app.json`, regenerated via `npm run prebuild`

**Detection:**
- On launch, check if iCloud entitlement is available
- If available, enable automatic backup; if not, Layer 1 still works

## Technical Details

### Dependencies (Layer 1)

All need explicit installation for SDK 54:

```bash
npx expo install expo-sharing expo-document-picker expo-file-system
```

### Key APIs

**expo-sqlite (already installed):**
- `db.databasePath` — full path to the DB file
- `db.execAsync('PRAGMA wal_checkpoint(TRUNCATE)')` — flush WAL before copy
- `db.closeAsync()` — close connection before replacing file
- `SQLite.openDatabaseAsync('apex.db')` — reopen after import

**expo-file-system (SDK 54):**
- `FileSystem.copyAsync()` is deprecated in SDK 54
- Use new `File` class API: `new File(src).copy(new File(dest))`
- Or use legacy import: `import * as FileSystem from 'expo-file-system/legacy'`

**expo-sharing:**
- `Sharing.shareAsync(fileUri, { UTI: 'public.database' })` — opens Share Sheet

**expo-document-picker:**
- `DocumentPicker.getDocumentAsync({ type: '*/*' })` — no `.db` MIME type exists
- Result: `{ canceled: boolean, assets: [{ uri, name, mimeType, size }] }`
- Validate `.db` extension in code after selection

### Database singleton reset

After `closeAsync()`, the module-level `db` variable in `src/db/database.ts` must be set to `null` so `getDatabase()` creates a fresh connection on next call.

### Schema validation on import

- Open imported file as a separate DB connection
- Check `schema_info` table exists and version is ≤ current app version
- If version is older, run migrations after import
- If version is newer (from a future app version), reject with error message

### app.json changes (Layer 1)

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIFileSharingEnabled": true,
        "LSSupportsOpeningDocumentsInPlace": true
      }
    }
  }
}
```

## Prerequisites

- **Layer 1:** None — works with free Apple ID
- **Layer 2:** Apple Developer Program ($99/year)
  - Also unlocks: 90-day signing (no more weekly re-sign), TestFlight, App Store distribution
  - Individual account converts to Organization later at no extra cost
  - $99/year covers unlimited team members under an org account

## Design Principles

- **Local DB is always authoritative** during normal use
- **No sync, no conflict resolution** — backup is a point-in-time copy
- **Layer 1 is fully functional alone** — Layer 2 is a transparent upgrade
- **Non-intrusive prompts** — backup reminders are dismissible, never forced
- **Validate before overwriting** — schema check on import, confirmation dialog on replace

## References

- GitHub Issue: #3
- Expo SQLite docs: https://docs.expo.dev/versions/latest/sdk/sqlite/
- Expo Sharing docs: https://docs.expo.dev/versions/latest/sdk/sharing/
- Expo Document Picker docs: https://docs.expo.dev/versions/latest/sdk/document-picker/
- Expo File System docs: https://docs.expo.dev/versions/latest/sdk/file-system/
