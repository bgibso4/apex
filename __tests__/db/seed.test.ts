import { seedRunLogs, seedWorkoutSessions } from '../../src/db/seed';
import { getDatabase, generateId } from '../../src/db/database';

jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn(),
  generateId: jest.fn(() => 'test-id'),
}));

describe('seedRunLogs', () => {
  let mockDb: {
    getFirstAsync: jest.Mock;
    runAsync: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      getFirstAsync: jest.fn(),
      runAsync: jest.fn(),
    };
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  it('returns 0 when data already exists', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ count: 10 });

    const result = await seedRunLogs();

    expect(result).toBe(0);
    expect(mockDb.runAsync).not.toHaveBeenCalled();
  });

  it('calls runAsync multiple times when no existing data', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ count: 0 });
    mockDb.runAsync.mockResolvedValue({ changes: 1 });

    await seedRunLogs();

    expect(mockDb.runAsync).toHaveBeenCalled();
    expect(mockDb.runAsync.mock.calls.length).toBeGreaterThan(0);
  });

  it('returns the number of runs inserted', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ count: 0 });
    mockDb.runAsync.mockResolvedValue({ changes: 1 });

    const result = await seedRunLogs();

    expect(result).toBeGreaterThan(0);
  });
});

describe('seedWorkoutSessions', () => {
  let mockDb: {
    getFirstAsync: jest.Mock;
    runAsync: jest.Mock;
    getAllAsync: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      getFirstAsync: jest.fn(),
      runAsync: jest.fn(),
      getAllAsync: jest.fn(),
    };
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  it('returns 0 when sessions already exist', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ count: 10 });

    const result = await seedWorkoutSessions('program-1');

    expect(result).toBe(0);
    expect(mockDb.runAsync).not.toHaveBeenCalled();
  });

  it('inserts exercises and sessions when no existing data', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ count: 0 });
    mockDb.runAsync.mockResolvedValue({ changes: 1 });
    mockDb.getAllAsync.mockResolvedValue([]);

    await seedWorkoutSessions('program-1');

    expect(mockDb.runAsync).toHaveBeenCalled();
    const calls = mockDb.runAsync.mock.calls;
    expect(calls.length).toBeGreaterThan(1);
  });

  it('returns count of sessions inserted', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ count: 0 });
    mockDb.runAsync.mockResolvedValue({ changes: 1 });
    mockDb.getAllAsync.mockResolvedValue([]);

    const result = await seedWorkoutSessions('program-1');

    expect(result).toBeGreaterThan(0);
  });
});
