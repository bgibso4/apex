/** Mock for expo-sqlite — returns no-op database for unit tests */

const mockStatement = {
  executeAsync: jest.fn().mockResolvedValue({ rows: [] }),
  getFirstAsync: jest.fn().mockResolvedValue(null),
  getAllAsync: jest.fn().mockResolvedValue([]),
};

const mockDb = {
  prepareAsync: jest.fn().mockResolvedValue(mockStatement),
  runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
  getFirstAsync: jest.fn().mockResolvedValue(null),
  getAllAsync: jest.fn().mockResolvedValue([]),
  execAsync: jest.fn().mockResolvedValue(undefined),
  withTransactionAsync: jest.fn(async (fn: () => Promise<void>) => fn()),
};

export function openDatabaseSync() {
  return mockDb;
}

export function useSQLiteContext() {
  return mockDb;
}

export { mockDb, mockStatement };
