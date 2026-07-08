# iCloud Backup Design

## Context

APEX has two existing backup mechanisms:
1. **Manual export/import** (Layer 1) — user-initiated via Settings
2. **Cloudflare D1 sync** — automatic push to cloud after session completion

This adds a third redundancy layer: silent iCloud Documents backup after session completion. Write-only, no restore UI, no user interaction.

## Scope

- Copy SQLite DB to iCloud Documents container after `completeSession()`
- Fire-and-forget — never blocks the user, fails silently
- No restore flow, no UI, no settings toggle
- No new npm dependencies — Expo module + config plugin

## Architecture

Three new pieces:

### 1. Expo Config Plugin (`plugins/withICloudBackup.js`)

Modifies the Xcode project during `npx expo prebuild` to add iCloud Documents entitlements:

```
com.apple.developer.icloud-services = ["CloudDocuments"]
com.apple.developer.icloud-container-identifiers = ["iCloud.com.bgibso4.apex"]
com.apple.developer.ubiquity-container-identifiers = ["iCloud.com.bgibso4.apex"]
```

Registered in `app.json` under `plugins`. This plugin only handles entitlements — the native module code lives separately under `modules/`.

### 2. Native Module (`modules/icloud-backup/`)

A local Expo module using the Expo Modules API. Lives in a versioned `modules/` directory (not in the gitignored `ios/`), so the Swift source is tracked in git.

Structure:
```
modules/icloud-backup/
  expo-module.config.json
  ios/
    ICloudBackupModule.swift
```

**Method:** `copyToICloud(sourcePath: String, filename: String) -> Bool`

Implementation:
1. Call `FileManager.default.url(forUbiquityContainerIdentifier: "iCloud.com.bgibso4.apex")` to get the container URL
2. If container is nil (iCloud not available/signed in), return `false`
3. Create `Documents/` subdirectory in the container if needed
4. Copy (or replace) the source file to `<container>/Documents/<filename>`
5. Return `true` on success, `false` on any error

The filename parameter allows the JS layer to pass timestamped names.

### 3. JS Integration (`src/db/icloudBackup.ts`)

Co-located with existing backup code in `src/db/`.

```typescript
let isBackingUp = false;

export async function backupToICloud(): Promise<void> {
  if (isBackingUp) return; // Guard against concurrent calls
  isBackingUp = true;
  try {
    const ICloudBackup = require('../../modules/icloud-backup');
    const db = await getDatabase();
    // Checkpoint WAL to flush all data to the main .db file
    await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE)');
    // Copy to iCloud — file is consistent after checkpoint
    const dbPath = db.databasePath;
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const filename = `apex-backup-${date}.db`;
    await ICloudBackup.copyToICloud(dbPath, filename);
  } catch (e) {
    console.warn('[icloud] Backup failed:', e);
  } finally {
    isBackingUp = false;
  }
}
```

Key details:
- WAL checkpoint flushes all data to the main .db file, making it self-contained and safe to copy
- Timestamped filenames (`apex-backup-YYYY-MM-DD.db`) — one per day, overwrites same-day backups, keeps history across days
- Concurrency guard prevents duplicate concurrent calls
- `db.databasePath` returns a plain file path (not a URI) in expo-sqlite

### Integration Point

In `src/db/sessions.ts`, `completeSession()` currently calls `syncAll()`. Add `backupToICloud()` alongside it:

```typescript
export async function completeSession(sessionId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE sessions SET completed_at = ?, updated_at = datetime('now') WHERE id = ?",
    [new Date().toISOString(), sessionId]
  );

  // Background sync + backup — both fire-and-forget
  syncAll().catch((err) => console.warn('[sync] Post-session sync failed:', err));
  backupToICloud().catch((err) => console.warn('[icloud] Post-session backup failed:', err));
}
```

## File Changes

| File | Change |
|------|--------|
| `app.json` | Add `"./plugins/withICloudBackup"` to plugins array |
| `plugins/withICloudBackup.js` | New — Expo config plugin for iCloud entitlements |
| `modules/icloud-backup/expo-module.config.json` | New — Expo module config |
| `modules/icloud-backup/ios/ICloudBackupModule.swift` | New — Native Swift module |
| `src/db/icloudBackup.ts` | New — JS wrapper with WAL checkpoint + concurrency guard |
| `src/db/sessions.ts` | Add `backupToICloud()` call in `completeSession()` |

## What Doesn't Change

- Layer 1 manual export/import — works as-is
- CF D1 sync — works as-is
- No UI changes anywhere
- No new npm dependencies

## Notes

- Requires paid Apple Developer account — iCloud Documents entitlements do not work with free Apple ID signing
- `databasePath` in expo-sqlite returns a plain filesystem path (e.g., `/var/mobile/.../apex.db`), not a `file://` URI

## Testing

- **Unit test:** Mock the native module, verify `backupToICloud()` calls WAL checkpoint then native copy
- **Unit test:** Verify `completeSession()` resolves successfully when native module throws
- **Unit test:** Verify `backupToICloud()` handles undefined native module gracefully (test environment)
- **Manual test:** Complete a session on device, check Files app > iCloud Drive for `apex-backup-YYYY-MM-DD.db`
- **Failure test:** Disable iCloud on device, verify session completion still works normally

## Prerequisites

- iCloud container `iCloud.com.bgibso4.apex` registered in Apple Developer portal (done 2026-03-24)
- iCloud enabled on the App ID `com.bgibso4.apex` (done 2026-03-24)
- Paid Apple Developer account (active)

## References

- Issue: #20
- Existing backup design: `docs/plans/2026-03-08-data-backup-design.md` (Layer 2 section)
- `completeSession()`: `src/db/sessions.ts:182`
- Database singleton: `src/db/database.ts`
- Existing backup code: `src/db/backup.ts`
