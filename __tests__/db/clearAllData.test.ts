/**
 * Tests for clearAllData function.
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

describe('clearAllData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // getDatabase needs schema_version to exist
    mockGetFirstAsync.mockResolvedValue({ value: '17' });
    mockExecAsync.mockResolvedValue(undefined);
    mockRunAsync.mockResolvedValue(undefined);
  });

  it('deletes every user data table, including weight_adjustments', async () => {
    const { clearAllData } = require('../../src/db/database');

    await clearAllData();

    // Find the DELETE call (skip PRAGMA and CREATE TABLE calls)
    const deleteCalls = mockExecAsync.mock.calls.filter(
      (call: any[]) => (call[0] as string).includes('DELETE FROM')
    );
    expect(deleteCalls.length).toBe(1);
    const sql = deleteCalls[0][0] as string;
    expect(sql).toContain('DELETE FROM exercise_resources');
    expect(sql).toContain('DELETE FROM daily_health');
    expect(sql).toContain('DELETE FROM personal_records');
    expect(sql).toContain('DELETE FROM exercise_notes');
    expect(sql).toContain('DELETE FROM set_logs');
    expect(sql).toContain('DELETE FROM session_protocols');
    expect(sql).toContain('DELETE FROM sessions');
    expect(sql).toContain('DELETE FROM programs');
    expect(sql).toContain('DELETE FROM run_logs');
    expect(sql).toContain('DELETE FROM weekly_checkins');
    expect(sql).toContain('DELETE FROM weight_adjustments');
    expect(sql).toContain('DELETE FROM exercises');
  });
});
