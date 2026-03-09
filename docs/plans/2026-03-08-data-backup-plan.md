# Data Backup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add manual export/import backup for the SQLite database via iOS Share Sheet, with USB file sharing as a bonus.

**Architecture:** New `src/db/backup.ts` module handles WAL checkpoint, file copy, schema validation, and DB reconnection. Settings screen gets a "Backup & Data" section with Export/Import buttons. Post-session backup prompt triggers after `completeSession()` if last export was >7 days ago.

**Tech Stack:** expo-sharing, expo-document-picker, expo-file-system, expo-sqlite

---

### Task 1: Install Dependencies

**Step 1: Install packages**

Run:
```bash
npx expo install expo-sharing expo-document-picker expo-file-system
```

**Step 2: Verify installation**

Run:
```bash
cat package.json | grep -E "expo-(sharing|document-picker|file-system)"
```
Expected: All three packages listed in dependencies.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add expo-sharing, expo-document-picker, expo-file-system for backup feature"
```

---

### Task 2: Add UIFileSharingEnabled to app.json

**Files:**
- Modify: `app.json`

**Step 1: Add infoPlist config**

In `app.json`, add `infoPlist` under `expo.ios`:

```json
{
  "expo": {
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.bgibso4.apex",
      "infoPlist": {
        "UIFileSharingEnabled": true,
        "LSSupportsOpeningDocumentsInPlace": true
      }
    }
  }
}
```

**Step 2: Commit**

```bash
git add app.json
git commit -m "feat: enable iOS file sharing for USB backup access"
```

---

### Task 3: Add closeDatabase to database.ts

**Files:**
- Modify: `src/db/database.ts`
- Test: `__tests__/db/backup.test.ts`

**Step 1: Write the failing test**

Create `__tests__/db/backup.test.ts`:

```typescript
/**
 * Tests for src/db/backup.ts — Database backup & restore
 */

import { closeDatabase } from '../../src/db/database';

// We need to mock the module-level db variable
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

// Mock the database module to test closeDatabase
jest.mock('../../src/db/database', () => {
  let mockDb: any = null;

  return {
    getDatabase: jest.fn(async () => {
      if (!mockDb) {
        mockDb = {
          closeAsync: jest.fn().mockResolvedValue(undefined),
          databasePath: '/mock/path/apex.db',
          execAsync: jest.fn().mockResolvedValue(undefined),
          runAsync: jest.fn().mockResolvedValue(undefined),
          getFirstAsync: jest.fn().mockResolvedValue({ value: '4' }),
          getAllAsync: jest.fn().mockResolvedValue([]),
        };
      }
      return mockDb;
    }),
    closeDatabase: jest.fn(async () => {
      if (mockDb) {
        await mockDb.closeAsync();
        mockDb = null;
      }
    }),
    generateId: jest.fn(() => 'test-id'),
    __getMockDb: () => mockDb,
  };
});

describe('closeDatabase', () => {
  it('should close the database and clear the singleton', async () => {
    const { getDatabase, closeDatabase } = require('../../src/db/database');

    // Open the database
    const db = await getDatabase();
    expect(db).toBeTruthy();

    // Close it
    await closeDatabase();

    // Verify closeAsync was called
    expect(db.closeAsync).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/db/backup.test.ts -v`
Expected: Test should pass with the mock (this validates the test structure). The real implementation test comes next.

**Step 3: Add closeDatabase to database.ts**

Add to `src/db/database.ts` after the `getDatabase` function:

```typescript
/** Close the database connection and clear the singleton.
 *  Must be called before replacing the DB file (e.g., import). */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
```

**Step 4: Export from index**

In `src/db/index.ts`, update the database export line:

```typescript
export { getDatabase, generateId, clearAllData, closeDatabase } from './database';
```

**Step 5: Run tests**

Run: `npx jest __tests__/db/backup.test.ts -v`
Expected: PASS

**Step 6: Commit**

```bash
git add src/db/database.ts src/db/index.ts __tests__/db/backup.test.ts
git commit -m "feat: add closeDatabase for safe DB replacement during import"
```

---

### Task 4: Create backup module — exportDatabase

**Files:**
- Create: `src/db/backup.ts`
- Test: `__tests__/db/backup.test.ts` (append)

**Step 1: Write the failing test for exportDatabase**

Add to `__tests__/db/backup.test.ts`:

```typescript
import { exportDatabase } from '../../src/db/backup';

jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn().mockResolvedValue(undefined),
  isAvailableAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('expo-file-system', () => ({
  cacheDirectory: 'file:///mock/cache/',
  copyAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn().mockResolvedValue({
    databasePath: '/mock/path/apex.db',
    execAsync: jest.fn().mockResolvedValue(undefined),
    runAsync: jest.fn().mockResolvedValue(undefined),
    getFirstAsync: jest.fn().mockResolvedValue(null),
  }),
  generateId: jest.fn(() => 'test-id'),
}));

describe('exportDatabase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should checkpoint WAL, copy DB, and open share sheet', async () => {
    const { getDatabase } = require('../../src/db/database');
    const FileSystem = require('expo-file-system');
    const Sharing = require('expo-sharing');

    await exportDatabase();

    const db = await getDatabase();

    // Should checkpoint WAL
    expect(db.execAsync).toHaveBeenCalledWith('PRAGMA wal_checkpoint(TRUNCATE);');

    // Should copy the DB file
    expect(FileSystem.copyAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '/mock/path/apex.db',
      })
    );

    // Should open share sheet
    expect(Sharing.shareAsync).toHaveBeenCalled();
  });

  it('should save last export timestamp', async () => {
    const { getDatabase } = require('../../src/db/database');
    const db = await getDatabase();

    await exportDatabase();

    // Should upsert the last_export_at setting
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('last_export_at'),
      expect.any(Array)
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/db/backup.test.ts --testNamePattern="exportDatabase" -v`
Expected: FAIL — `Cannot find module '../../src/db/backup'`

**Step 3: Implement exportDatabase**

Create `src/db/backup.ts`:

```typescript
/**
 * APEX — Database backup & restore
 *
 * Layer 1: Manual export/import via iOS Share Sheet.
 * Layer 2 (future): Automatic iCloud Documents backup.
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getDatabase } from './database';

/** Export the database via the iOS Share Sheet.
 *  Checkpoints WAL, copies to a temp file, opens share sheet. */
export async function exportDatabase(): Promise<void> {
  const db = await getDatabase();

  // Flush WAL into main DB file
  await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE);');

  // Copy to cache directory with timestamped name
  const date = new Date().toISOString().slice(0, 10);
  const exportFileName = `apex-backup-${date}.db`;
  const exportPath = `${FileSystem.cacheDirectory}${exportFileName}`;

  await FileSystem.copyAsync({
    from: db.databasePath,
    to: exportPath,
  });

  // Open iOS Share Sheet
  await Sharing.shareAsync(exportPath, {
    UTI: 'public.database',
    dialogTitle: 'Export APEX Backup',
  });

  // Record the export timestamp
  await db.runAsync(
    `INSERT OR REPLACE INTO schema_info (key, value) VALUES ('last_export_at', ?)`,
    [new Date().toISOString()]
  );
}

/** Get the last export timestamp, or null if never exported. */
export async function getLastExportTimestamp(): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM schema_info WHERE key = 'last_export_at'"
  );
  return row?.value ?? null;
}

/** Check if a backup reminder should be shown (>7 days since last export). */
export async function shouldShowBackupReminder(): Promise<boolean> {
  const lastExport = await getLastExportTimestamp();
  if (!lastExport) return true; // Never exported

  const daysSince = (Date.now() - new Date(lastExport).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince > 7;
}
```

**Step 4: Run tests**

Run: `npx jest __tests__/db/backup.test.ts --testNamePattern="exportDatabase" -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/db/backup.ts __tests__/db/backup.test.ts
git commit -m "feat: add exportDatabase with WAL checkpoint and share sheet"
```

---

### Task 5: Add importDatabase to backup module

**Files:**
- Modify: `src/db/backup.ts`
- Test: `__tests__/db/backup.test.ts` (append)

**Step 1: Write the failing test**

Add to `__tests__/db/backup.test.ts`:

```typescript
import { importDatabase } from '../../src/db/backup';

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///mock/picked-backup.db', name: 'apex-backup-2026-03-08.db' }],
  }),
}));

describe('importDatabase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject files without .db extension', async () => {
    const DocumentPicker = require('expo-document-picker');
    DocumentPicker.getDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///mock/data.json', name: 'data.json' }],
    });

    await expect(importDatabase()).rejects.toThrow('not a valid');
  });

  it('should handle user cancellation', async () => {
    const DocumentPicker = require('expo-document-picker');
    DocumentPicker.getDocumentAsync.mockResolvedValueOnce({
      canceled: true,
      assets: null,
    });

    const result = await importDatabase();
    expect(result).toBe(false);
  });

  it('should close DB, copy imported file, and reopen', async () => {
    const { closeDatabase, getDatabase } = require('../../src/db/database');
    const FileSystem = require('expo-file-system');

    await importDatabase();

    // Should close the database before replacing
    expect(closeDatabase).toHaveBeenCalled();

    // Should copy the imported file to the DB path
    expect(FileSystem.copyAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'file:///mock/picked-backup.db',
      })
    );

    // Should reopen the database
    expect(getDatabase).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/db/backup.test.ts --testNamePattern="importDatabase" -v`
Expected: FAIL — `importDatabase is not a function`

**Step 3: Implement importDatabase**

Add to `src/db/backup.ts`:

```typescript
import * as DocumentPicker from 'expo-document-picker';
import * as SQLite from 'expo-sqlite';
import { getDatabase, closeDatabase } from './database';

/** Import a database backup from the iOS document picker.
 *  Returns false if user cancelled, true on success, throws on error. */
export async function importDatabase(): Promise<boolean> {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.length) {
    return false;
  }

  const asset = result.assets[0];

  // Validate file extension
  if (!asset.name.toLowerCase().endsWith('.db')) {
    throw new Error('Selected file is not a valid database backup (.db)');
  }

  // Validate schema before replacing
  await validateBackupSchema(asset.uri);

  // Get the current DB path before closing
  const db = await getDatabase();
  const dbPath = db.databasePath;

  // Close current connection
  await closeDatabase();

  // Replace the database file
  await FileSystem.copyAsync({
    from: asset.uri,
    to: dbPath,
  });

  // Reopen the database (will run migrations if needed)
  await getDatabase();

  return true;
}

/** Validate that an imported file has the expected APEX schema.
 *  Opens it as a separate connection, checks for schema_info table. */
async function validateBackupSchema(uri: string): Promise<void> {
  // Copy to a temp location for validation
  const validationPath = `${FileSystem.cacheDirectory}apex-validation-temp.db`;
  await FileSystem.copyAsync({ from: uri, to: validationPath });

  let validationDb: SQLite.SQLiteDatabase | null = null;
  try {
    validationDb = await SQLite.openDatabaseAsync(validationPath, {
      useNewConnection: true,
    });

    // Check schema_info table exists and has a version
    const row = await validationDb.getFirstAsync<{ value: string }>(
      "SELECT value FROM schema_info WHERE key = 'schema_version'"
    );

    if (!row) {
      throw new Error('Backup file is not a valid APEX database (no schema version found)');
    }

    const version = parseInt(row.value);
    const { SCHEMA_VERSION } = require('./schema');

    if (version > SCHEMA_VERSION) {
      throw new Error(
        `Backup is from a newer version of APEX (v${version} > v${SCHEMA_VERSION}). Update the app first.`
      );
    }
  } catch (err: any) {
    if (err.message.includes('APEX')) throw err;
    throw new Error('Backup file is not a valid APEX database');
  } finally {
    if (validationDb) {
      await validationDb.closeAsync();
    }
    // Clean up temp file
    try {
      await FileSystem.deleteAsync(validationPath, { idempotent: true });
    } catch { /* ignore cleanup errors */ }
  }
}
```

**Step 4: Run tests**

Run: `npx jest __tests__/db/backup.test.ts --testNamePattern="importDatabase" -v`
Expected: PASS

**Step 5: Export from index**

In `src/db/index.ts`, add:

```typescript
export { exportDatabase, importDatabase, getLastExportTimestamp, shouldShowBackupReminder } from './backup';
```

**Step 6: Commit**

```bash
git add src/db/backup.ts src/db/index.ts __tests__/db/backup.test.ts
git commit -m "feat: add importDatabase with schema validation and document picker"
```

---

### Task 6: Add shouldShowBackupReminder tests

**Files:**
- Test: `__tests__/db/backup.test.ts` (append)

**Step 1: Write tests**

Add to `__tests__/db/backup.test.ts`:

```typescript
import { shouldShowBackupReminder, getLastExportTimestamp } from '../../src/db/backup';

describe('shouldShowBackupReminder', () => {
  it('should return true if never exported', async () => {
    const { getDatabase } = require('../../src/db/database');
    const db = await getDatabase();
    db.getFirstAsync.mockResolvedValueOnce(null);

    const result = await shouldShowBackupReminder();
    expect(result).toBe(true);
  });

  it('should return true if last export was >7 days ago', async () => {
    const { getDatabase } = require('../../src/db/database');
    const db = await getDatabase();
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    db.getFirstAsync.mockResolvedValueOnce({ value: eightDaysAgo });

    const result = await shouldShowBackupReminder();
    expect(result).toBe(true);
  });

  it('should return false if last export was <7 days ago', async () => {
    const { getDatabase } = require('../../src/db/database');
    const db = await getDatabase();
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    db.getFirstAsync.mockResolvedValueOnce({ value: twoDaysAgo });

    const result = await shouldShowBackupReminder();
    expect(result).toBe(false);
  });
});
```

**Step 2: Run tests**

Run: `npx jest __tests__/db/backup.test.ts --testNamePattern="shouldShowBackupReminder" -v`
Expected: PASS

**Step 3: Commit**

```bash
git add __tests__/db/backup.test.ts
git commit -m "test: add shouldShowBackupReminder tests"
```

---

### Task 7: Update Settings screen — Backup & Data section

**Files:**
- Modify: `app/settings.tsx`

**Step 1: Update the Settings screen**

Replace the existing DATA section in `app/settings.tsx` with a "BACKUP & DATA" section. The export button shows last export date. Import shows a confirmation dialog.

In `app/settings.tsx`:

1. Add imports at top:
```typescript
import { exportDatabase, importDatabase, getLastExportTimestamp } from '../src/db';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
```

2. Add state and data loading inside the component:
```typescript
const [lastExport, setLastExport] = useState<string | null>(null);

useFocusEffect(
  useCallback(() => {
    getLastExportTimestamp().then(setLastExport);
  }, [])
);
```

3. Replace `handleExportData`:
```typescript
const handleExportData = async () => {
  try {
    await exportDatabase();
    const timestamp = await getLastExportTimestamp();
    setLastExport(timestamp);
  } catch (err: any) {
    Alert.alert('Export Failed', err.message ?? 'Could not export database');
  }
};
```

4. Add `handleImportData`:
```typescript
const handleImportData = () => {
  Alert.alert(
    'Import Backup',
    'This will replace ALL current data with the backup. This cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Import',
        style: 'destructive',
        onPress: async () => {
          try {
            const success = await importDatabase();
            if (success) {
              Alert.alert('Import Complete', 'Your data has been restored from the backup.');
            }
          } catch (err: any) {
            Alert.alert('Import Failed', err.message ?? 'Could not import database');
          }
        },
      },
    ],
  );
};
```

5. Replace the DATA section JSX with:
```tsx
{/* Backup & Data Section */}
<View style={styles.section}>
  <Text style={styles.sectionLabel}>BACKUP & DATA</Text>
  <View style={styles.group}>
    {/* Export Backup */}
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.7}
      onPress={handleExportData}
    >
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>Export Backup</Text>
        <Text style={styles.rowHint}>
          {lastExport
            ? `Last: ${new Date(lastExport).toLocaleDateString()}`
            : 'Save your data to Files, AirDrop, etc.'}
        </Text>
      </View>
      <Ionicons name="share-outline" size={18} color={Colors.indigo} />
    </TouchableOpacity>

    <View style={styles.rowDivider} />

    {/* Import Backup */}
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.7}
      onPress={handleImportData}
    >
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>Import Backup</Text>
        <Text style={styles.rowHint}>
          Restore from a previously exported .db file
        </Text>
      </View>
      <Ionicons name="download-outline" size={18} color={Colors.indigo} />
    </TouchableOpacity>
  </View>
</View>

{/* Dev Tools Section */}
<View style={styles.section}>
  <Text style={styles.sectionLabel}>DEV TOOLS</Text>
  <View style={styles.group}>
    {/* Seed Data */}
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.7}
      onPress={handleSeedData}
    >
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>Load Sample Data</Text>
        <Text style={styles.rowHint}>
          Pre-populate runs and sessions for testing
        </Text>
      </View>
      <Ionicons name="flask-outline" size={18} color={Colors.cyan} />
    </TouchableOpacity>

    <View style={styles.rowDivider} />

    {/* Clear Data */}
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>Clear All Data</Text>
        <Text style={styles.rowHint}>
          Delete all sessions, programs, and history
        </Text>
      </View>
      <TouchableOpacity
        style={styles.dangerButton}
        onPress={handleClearData}
        activeOpacity={0.7}
      >
        <Text style={styles.dangerButtonText}>Reset</Text>
      </TouchableOpacity>
    </View>
  </View>
</View>
```

**Step 2: Run the full test suite**

Run: `npm test`
Expected: All tests pass (settings screen doesn't have unit tests, but nothing should break)

**Step 3: Commit**

```bash
git add app/settings.tsx
git commit -m "feat: add Backup & Data section to Settings with export/import"
```

---

### Task 8: Add post-session backup prompt

**Files:**
- Modify: `app/(tabs)/workout.tsx` (or the session completion handler)

This task adds a prompt after `completeSession()` that asks the user to export if it's been >7 days since their last backup.

**Step 1: Find the session completion handler**

Look in `app/(tabs)/workout.tsx` or `src/hooks/useWorkoutSession.ts` for where `completeSession()` is called. Add the backup prompt after it.

**Step 2: Add the prompt**

After the session completion logic, add:

```typescript
import { shouldShowBackupReminder, exportDatabase } from '../../src/db';

// After completeSession() succeeds:
const needsBackup = await shouldShowBackupReminder();
if (needsBackup) {
  Alert.alert(
    'Back Up Your Data?',
    "It's been a while since your last backup.",
    [
      { text: 'Dismiss', style: 'cancel' },
      {
        text: 'Export Now',
        onPress: async () => {
          try {
            await exportDatabase();
          } catch { /* silently fail — non-critical */ }
        },
      },
    ],
  );
}
```

**Step 3: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add app/(tabs)/workout.tsx src/hooks/useWorkoutSession.ts
git commit -m "feat: add post-session backup reminder when export is stale"
```

---

### Task 9: Run full test suite and verify

**Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Verify the full feature manually**

Checklist:
- [ ] Settings shows "Backup & Data" section with Export and Import buttons
- [ ] Export taps → WAL checkpoint → Share Sheet opens with `.db` file
- [ ] Import taps → confirmation dialog → document picker → validates `.db` → replaces DB → app reloads
- [ ] Post-session prompt appears after completing a workout (if >7 days since last export)
- [ ] USB file sharing works (DB visible in Finder when connected)
- [ ] "Last: [date]" shows correctly after an export

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address issues found during manual verification"
```
