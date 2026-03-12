/**
 * Tests for clearSampleData function.
 * Separate file because seed.test.ts mocks the database module at the top level.
 */

const mockExecAsync = jest.fn();
const mockGetFirstAsync = jest.fn();
const mockRunAsync = jest.fn();
const mockGetAllAsync = jest.fn().mockResolvedValue([]);

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue({
    execAsync: mockExecAsync,
    getFirstAsync: mockGetFirstAsync,
    runAsync: mockRunAsync,
    getAllAsync: mockGetAllAsync,
  }),
}));

describe('clearSampleData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // getDatabase needs schema_version to exist
    mockGetFirstAsync.mockResolvedValue({ value: '6' });
    mockExecAsync.mockResolvedValue(undefined);
    mockRunAsync.mockResolvedValue(undefined);
  });

  it('deletes only rows where is_sample = 1', async () => {
    const { clearSampleData } = require('../../src/db/database');

    await clearSampleData();

    // Find the DELETE call (skip PRAGMA and CREATE TABLE calls)
    const deleteCalls = mockExecAsync.mock.calls.filter(
      (call: any[]) => (call[0] as string).includes('DELETE FROM')
    );
    expect(deleteCalls.length).toBe(1);
    const sql = deleteCalls[0][0] as string;
    expect(sql).toContain('DELETE FROM personal_records WHERE is_sample = 1');
    expect(sql).toContain('DELETE FROM exercise_notes WHERE is_sample = 1');
    expect(sql).toContain('DELETE FROM set_logs WHERE is_sample = 1');
    expect(sql).toContain('DELETE FROM sessions WHERE is_sample = 1');
    expect(sql).toContain('DELETE FROM run_logs WHERE is_sample = 1');
    expect(sql).toContain('DELETE FROM programs WHERE is_sample = 1');
    expect(sql).toContain('DELETE FROM exercises WHERE is_sample = 1');
  });
});
