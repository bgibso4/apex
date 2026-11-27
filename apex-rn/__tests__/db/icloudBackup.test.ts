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

    expect(mockExecAsync).toHaveBeenCalledWith('PRAGMA wal_checkpoint(TRUNCATE)');
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
    let resolveCopy: () => void;
    mockCopyToICloud.mockImplementation(
      () => new Promise<boolean>((resolve) => { resolveCopy = () => resolve(true); })
    );

    const first = backupToICloud();
    const second = backupToICloud();

    // Flush microtasks so first reaches copyToICloud and assigns resolveCopy
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    resolveCopy!();
    await first;
    await second;

    expect(mockCopyToICloud).toHaveBeenCalledTimes(1);
  });
});
