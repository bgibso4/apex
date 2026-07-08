# iCloud Backup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Silently back up the SQLite database to iCloud Documents after each completed workout session.

**Architecture:** A local Expo module (`modules/icloud-backup/`) provides one Swift method to copy a file to the iCloud container. A JS wrapper in `src/db/icloudBackup.ts` checkpoints WAL and calls the native module. An Expo config plugin adds the iCloud entitlements during prebuild.

**Tech Stack:** Expo Modules API (Swift), Expo config plugins, expo-sqlite

**Spec:** `docs/superpowers/specs/2026-03-26-icloud-backup-design.md`

---

### Task 1: Create the Expo config plugin for iCloud entitlements

**Files:**
- Create: `plugins/withICloudBackup.js`

- [ ] **Step 1: Create plugins directory and write the config plugin**

```js
// plugins/withICloudBackup.js
const { withEntitlementsPlist } = require('@expo/config-plugins');

function withICloudBackup(config) {
  return withEntitlementsPlist(config, (mod) => {
    mod.modResults['com.apple.developer.icloud-services'] = ['CloudDocuments'];
    mod.modResults['com.apple.developer.icloud-container-identifiers'] = [
      'iCloud.com.bgibso4.apex',
    ];
    mod.modResults['com.apple.developer.ubiquity-container-identifiers'] = [
      'iCloud.com.bgibso4.apex',
    ];
    return mod;
  });
}

module.exports = withICloudBackup;
```

- [ ] **Step 2: Register the plugin in app.json**

In `app.json`, add `"./plugins/withICloudBackup"` to the plugins array:

```json
"plugins": [
  "expo-router",
  "expo-sqlite",
  "expo-asset",
  "expo-secure-store",
  "expo-web-browser",
  "./plugins/withICloudBackup"
]
```

- [ ] **Step 3: Commit**

```bash
git add plugins/withICloudBackup.js app.json
git commit -m "feat: add Expo config plugin for iCloud Documents entitlements"
```

---

### Task 2: Create the native Swift module

**Files:**
- Create: `modules/icloud-backup/expo-module.config.json`
- Create: `modules/icloud-backup/ios/ICloudBackupModule.swift`

- [ ] **Step 1: Create the Expo module config**

```json
{
  "platforms": ["ios"],
  "ios": {
    "modules": ["ICloudBackupModule"]
  }
}
```

- [ ] **Step 2: Write the Swift native module**

```swift
import ExpoModulesCore
import Foundation

public class ICloudBackupModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ICloudBackup")

    AsyncFunction("copyToICloud") { (sourcePath: String, filename: String) -> Bool in
      guard let containerURL = FileManager.default.url(
        forUbiquityContainerIdentifier: "iCloud.com.bgibso4.apex"
      ) else {
        return false
      }

      let documentsURL = containerURL.appendingPathComponent("Documents")
      let destinationURL = documentsURL.appendingPathComponent(filename)

      do {
        // Create Documents directory if needed
        try FileManager.default.createDirectory(
          at: documentsURL,
          withIntermediateDirectories: true,
          attributes: nil
        )

        // Remove existing file if present
        if FileManager.default.fileExists(atPath: destinationURL.path) {
          try FileManager.default.removeItem(at: destinationURL)
        }

        // Copy the database file
        try FileManager.default.copyItem(
          at: URL(fileURLWithPath: sourcePath),
          to: destinationURL
        )

        return true
      } catch {
        return false
      }
    }
  }
}
```

- [ ] **Step 3: Register the module in app.json**

Add the modules directory to the plugins array so Expo discovers it:

```json
"plugins": [
  "expo-router",
  "expo-sqlite",
  "expo-asset",
  "expo-secure-store",
  "expo-web-browser",
  "./plugins/withICloudBackup",
  "./modules/icloud-backup"
]
```

- [ ] **Step 4: Commit**

```bash
git add modules/icloud-backup/ app.json
git commit -m "feat: add native Swift module for iCloud file copy"
```

---

### Task 3: Write the JS wrapper with tests (TDD)

**Files:**
- Create: `src/db/icloudBackup.ts`
- Create: `__tests__/db/icloudBackup.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/db/icloudBackup.test.ts
import { backupToICloud } from '../../src/db/icloudBackup';

// Mock the native module
const mockCopyToICloud = jest.fn();
jest.mock('../../modules/icloud-backup', () => ({
  copyToICloud: mockCopyToICloud,
}));

// Mock the database
const mockExecAsync = jest.fn();
const mockDb = {
  execAsync: mockExecAsync,
  databasePath: '/var/mobile/Containers/Data/Application/xxx/Documents/SQLite/apex.db',
};
jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn(() => Promise.resolve(mockDb)),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockCopyToICloud.mockResolvedValue(true);
  mockExecAsync.mockResolvedValue(undefined);
});

describe('backupToICloud', () => {
  it('should checkpoint WAL and copy DB to iCloud', async () => {
    await backupToICloud();

    // Should checkpoint WAL to flush data to main db file
    expect(mockExecAsync).toHaveBeenCalledWith('PRAGMA wal_checkpoint(TRUNCATE)');
    // Should copy to iCloud with timestamped filename
    expect(mockCopyToICloud).toHaveBeenCalledWith(
      mockDb.databasePath,
      expect.stringMatching(/^apex-backup-\d{4}-\d{2}-\d{2}\.db$/)
    );
  });

  it('should checkpoint before copying', async () => {
    const callOrder: string[] = [];
    mockExecAsync.mockImplementation((sql: string) => {
      callOrder.push(sql);
      return Promise.resolve(undefined);
    });
    mockCopyToICloud.mockImplementation(() => {
      callOrder.push('copy');
      return Promise.resolve(true);
    });

    await backupToICloud();

    expect(callOrder).toEqual([
      'PRAGMA wal_checkpoint(TRUNCATE)',
      'copy',
    ]);
  });

  it('should fail silently when native module throws', async () => {
    mockCopyToICloud.mockRejectedValue(new Error('iCloud unavailable'));

    // Should not throw
    await expect(backupToICloud()).resolves.toBeUndefined();
  });

  it('should fail silently when database throws', async () => {
    mockExecAsync.mockRejectedValue(new Error('DB error'));

    await expect(backupToICloud()).resolves.toBeUndefined();
  });

  it('should succeed silently when native module returns false', async () => {
    mockCopyToICloud.mockResolvedValue(false);

    await expect(backupToICloud()).resolves.toBeUndefined();
  });

  it('should guard against concurrent calls', async () => {
    // Create a slow copy that we control
    let resolveCopy: () => void;
    mockCopyToICloud.mockImplementation(
      () => new Promise<boolean>((resolve) => { resolveCopy = () => resolve(true); })
    );

    // Start first backup
    const first = backupToICloud();
    // Start second backup immediately — should be skipped
    const second = backupToICloud();

    // Resolve the first
    resolveCopy!();
    await first;
    await second;

    // Native module should only have been called once
    expect(mockCopyToICloud).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/db/icloudBackup.test.ts --no-coverage`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/db/icloudBackup.ts
import { getDatabase } from './database';

let isBackingUp = false;

export async function backupToICloud(): Promise<void> {
  if (isBackingUp) return;
  isBackingUp = true;

  try {
    const ICloudBackup = require('../../modules/icloud-backup');
    const db = await getDatabase();

    // Checkpoint WAL to flush all data to the main .db file
    await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE)');

    // Copy to iCloud — the file is consistent after checkpoint
    const dbPath = db.databasePath;
    const date = new Date().toISOString().slice(0, 10);
    const filename = `apex-backup-${date}.db`;
    await ICloudBackup.copyToICloud(dbPath, filename);
  } catch (e) {
    console.warn('[icloud] Backup failed:', e);
  } finally {
    isBackingUp = false;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/db/icloudBackup.test.ts --no-coverage`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/db/icloudBackup.ts __tests__/db/icloudBackup.test.ts
git commit -m "feat: add iCloud backup JS wrapper with WAL checkpoint and concurrency guard"
```

---

### Task 4: Integrate with completeSession

**Files:**
- Modify: `src/db/sessions.ts:182-193`

- [ ] **Step 1: Add backupToICloud call to completeSession**

In `src/db/sessions.ts`, add the import at the top alongside the existing sync import:

```typescript
import { backupToICloud } from './icloudBackup';
```

Then update `completeSession()` to call `backupToICloud()`:

```typescript
export async function completeSession(sessionId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE sessions SET completed_at = ?, updated_at = datetime('now') WHERE id = ?",
    [new Date().toISOString(), sessionId]
  );

  // Background sync + backup — both fire-and-forget
  syncAll().catch((err) => {
    console.warn('[sync] Post-session sync failed:', err);
  });
  backupToICloud().catch((err) => {
    console.warn('[icloud] Post-session backup failed:', err);
  });
}
```

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: All tests pass (existing tests should not be affected)

- [ ] **Step 3: Commit**

```bash
git add src/db/sessions.ts
git commit -m "feat: trigger iCloud backup after session completion"
```

---

### Task 5: Manual device testing

**Files:** None (verification only)

- [ ] **Step 1: Rebuild the app with new entitlements**

Run: `npm run device:clean`

This regenerates the native project with the iCloud entitlements and the new native module, then builds and installs to the connected iPhone.

- [ ] **Step 2: Verify entitlements in Xcode**

Open `ios/APEX.xcworkspace` and check Signing & Capabilities. The iCloud capability should appear with the `iCloud.com.bgibso4.apex` container.

- [ ] **Step 3: Complete a workout session on device**

Start and complete a session. Check the console logs (if available) for `[icloud]` messages.

- [ ] **Step 4: Verify backup in Files app**

On the iPhone, open Files > iCloud Drive. Look for an `apex-backup-YYYY-MM-DD.db` file. If it's there, the backup is working.

- [ ] **Step 5: Test failure case**

Go to Settings > Apple ID > iCloud and turn off iCloud Drive. Complete another session. Verify the session completes normally without errors — the backup should fail silently.
