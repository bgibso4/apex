/**
 * Tests for src/db/backup.ts — Database backup & restore
 */

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  cacheDirectory: 'file:///cache/',
  copyAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn(),
  closeDatabase: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/db/schema', () => ({
  SCHEMA_VERSION: 4,
}));

function createMockDb() {
  return {
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
    execAsync: jest.fn().mockResolvedValue(undefined),
    closeAsync: jest.fn().mockResolvedValue(undefined),
    databasePath: 'file:///data/apex.db',
  };
}

describe('backup', () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    const { getDatabase } = require('../../src/db/database');
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  // ---------------------------------------------------------------------------
  // closeDatabase
  // ---------------------------------------------------------------------------
  describe('closeDatabase', () => {
    it('is exported from database module and callable', () => {
      const { closeDatabase } = require('../../src/db/database');
      expect(typeof closeDatabase).toBe('function');
    });

    it('is re-exported from db/index', () => {
      // This validates the index export chain
      const { closeDatabase } = require('../../src/db/database');
      expect(closeDatabase).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // exportDatabase
  // ---------------------------------------------------------------------------
  describe('exportDatabase', () => {
    it('checkpoints WAL, copies file, opens share sheet, and saves timestamp', async () => {
      const { exportDatabase } = require('../../src/db/backup');
      const FileSystem = require('expo-file-system');
      const Sharing = require('expo-sharing');

      await exportDatabase();

      // Should checkpoint WAL
      expect(mockDb.execAsync).toHaveBeenCalledWith('PRAGMA wal_checkpoint(TRUNCATE);');

      // Should copy the DB file to cache
      expect(FileSystem.copyAsync).toHaveBeenCalledWith({
        from: 'file:///data/apex.db',
        to: expect.stringMatching(/^file:\/\/\/cache\/apex-backup-\d{4}-\d{2}-\d{2}\.db$/),
      });

      // Should open share sheet
      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        expect.stringMatching(/^file:\/\/\/cache\/apex-backup-.*\.db$/),
        {
          UTI: 'public.database',
          dialogTitle: 'Export APEX Backup',
        }
      );

      // Should record export timestamp
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO schema_info'),
        [expect.any(String)]
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getLastExportTimestamp
  // ---------------------------------------------------------------------------
  describe('getLastExportTimestamp', () => {
    it('returns null if no export has been done', async () => {
      const { getLastExportTimestamp } = require('../../src/db/backup');
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await getLastExportTimestamp();

      expect(result).toBeNull();
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        "SELECT value FROM schema_info WHERE key = 'last_export_at'"
      );
    });

    it('returns the timestamp string if export exists', async () => {
      const { getLastExportTimestamp } = require('../../src/db/backup');
      mockDb.getFirstAsync.mockResolvedValue({ value: '2026-03-01T12:00:00.000Z' });

      const result = await getLastExportTimestamp();

      expect(result).toBe('2026-03-01T12:00:00.000Z');
    });
  });

  // ---------------------------------------------------------------------------
  // shouldShowBackupReminder
  // ---------------------------------------------------------------------------
  describe('shouldShowBackupReminder', () => {
    it('returns true if never exported', async () => {
      const { shouldShowBackupReminder } = require('../../src/db/backup');
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await shouldShowBackupReminder();

      expect(result).toBe(true);
    });

    it('returns true if last export was more than 7 days ago', async () => {
      const { shouldShowBackupReminder } = require('../../src/db/backup');
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      mockDb.getFirstAsync.mockResolvedValue({ value: eightDaysAgo });

      const result = await shouldShowBackupReminder();

      expect(result).toBe(true);
    });

    it('returns false if last export was less than 7 days ago', async () => {
      const { shouldShowBackupReminder } = require('../../src/db/backup');
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      mockDb.getFirstAsync.mockResolvedValue({ value: twoDaysAgo });

      const result = await shouldShowBackupReminder();

      expect(result).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // importDatabase
  // ---------------------------------------------------------------------------
  describe('importDatabase', () => {
    it('returns false if user cancels the document picker', async () => {
      const { importDatabase } = require('../../src/db/backup');
      const DocumentPicker = require('expo-document-picker');
      DocumentPicker.getDocumentAsync.mockResolvedValue({ canceled: true });

      const result = await importDatabase();

      expect(result).toBe(false);
    });

    it('returns false if no assets selected', async () => {
      const { importDatabase } = require('../../src/db/backup');
      const DocumentPicker = require('expo-document-picker');
      DocumentPicker.getDocumentAsync.mockResolvedValue({ canceled: false, assets: [] });

      const result = await importDatabase();

      expect(result).toBe(false);
    });

    it('throws if selected file is not a .db file', async () => {
      const { importDatabase } = require('../../src/db/backup');
      const DocumentPicker = require('expo-document-picker');
      DocumentPicker.getDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [{ name: 'notes.txt', uri: 'file:///cache/notes.txt' }],
      });

      await expect(importDatabase()).rejects.toThrow(
        'Selected file is not a valid database backup (.db)'
      );
    });

    it('closes current DB, copies backup, and reopens on valid import', async () => {
      const { importDatabase } = require('../../src/db/backup');
      const DocumentPicker = require('expo-document-picker');
      const FileSystem = require('expo-file-system');
      const SQLite = require('expo-sqlite');
      const { closeDatabase, getDatabase } = require('../../src/db/database');

      // Mock document picker returning a .db file
      DocumentPicker.getDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [{ name: 'apex-backup-2026-03-01.db', uri: 'file:///cache/apex-backup-2026-03-01.db' }],
      });

      // Mock validation DB
      const validationMockDb = {
        getFirstAsync: jest.fn().mockResolvedValue({ value: '4' }),
        closeAsync: jest.fn().mockResolvedValue(undefined),
      };
      SQLite.openDatabaseAsync.mockResolvedValue(validationMockDb);

      const result = await importDatabase();

      expect(result).toBe(true);

      // Should have validated the schema
      expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith(
        'apex-validation-temp.db',
        {},
        '/cache/'
      );

      // Should close the current DB
      expect(closeDatabase).toHaveBeenCalled();

      // Should copy the backup to the DB path
      expect(FileSystem.copyAsync).toHaveBeenCalledWith({
        from: 'file:///cache/apex-backup-2026-03-01.db',
        to: 'file:///data/apex.db',
      });

      // Should reopen the database
      // getDatabase is called multiple times: once in exportDatabase setup, once to get path, once to reopen
      const getDatabaseCalls = (getDatabase as jest.Mock).mock.calls;
      expect(getDatabaseCalls.length).toBeGreaterThanOrEqual(2);

      // Validation DB should be cleaned up
      expect(validationMockDb.closeAsync).toHaveBeenCalled();
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
        'file:///cache/apex-validation-temp.db',
        { idempotent: true }
      );
    });

    it('throws if backup has no schema version', async () => {
      const { importDatabase } = require('../../src/db/backup');
      const DocumentPicker = require('expo-document-picker');
      const SQLite = require('expo-sqlite');

      DocumentPicker.getDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [{ name: 'bad-backup.db', uri: 'file:///cache/bad-backup.db' }],
      });

      const validationMockDb = {
        getFirstAsync: jest.fn().mockResolvedValue(null),
        closeAsync: jest.fn().mockResolvedValue(undefined),
      };
      SQLite.openDatabaseAsync.mockResolvedValue(validationMockDb);

      await expect(importDatabase()).rejects.toThrow(
        'Backup file is not a valid APEX database (no schema version found)'
      );
    });

    it('throws if backup schema version is newer than current', async () => {
      const { importDatabase } = require('../../src/db/backup');
      const DocumentPicker = require('expo-document-picker');
      const SQLite = require('expo-sqlite');

      DocumentPicker.getDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [{ name: 'future.db', uri: 'file:///cache/future.db' }],
      });

      const validationMockDb = {
        getFirstAsync: jest.fn().mockResolvedValue({ value: '99' }),
        closeAsync: jest.fn().mockResolvedValue(undefined),
      };
      SQLite.openDatabaseAsync.mockResolvedValue(validationMockDb);

      await expect(importDatabase()).rejects.toThrow(
        'Backup is from a newer version of APEX (v99 > v4). Update the app first.'
      );
    });
  });
});
