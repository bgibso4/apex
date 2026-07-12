/**
 * Tests for src/db/migrations.ts — dependency-injected migration helpers
 */

import { archiveLegacyV2Programs } from '../../src/db/migrations';

describe('archiveLegacyV2Programs (v16)', () => {
  it('archives only legacy v2 rows: matches name, requires NULL bundled_id, spares finished runs', async () => {
    const db = { runAsync: jest.fn().mockResolvedValue({ changes: 1 }) };

    await archiveLegacyV2Programs(db);

    expect(db.runAsync).toHaveBeenCalledTimes(1);
    const sql = (db.runAsync as jest.Mock).mock.calls[0][0] as string;
    // Targets archived status
    expect(sql).toMatch(/SET\s+status\s*=\s*'archived'/i);
    // Only the legacy pre-launch name
    expect(sql).toContain("name = 'Functional Athlete v2'");
    // Never touches rows the bundled refresh manages
    expect(sql).toMatch(/bundled_id\s+IS\s+NULL/i);
    // Never re-files completed/archived history
    expect(sql).toMatch(/status\s+IN\s*\(\s*'active'\s*,\s*'inactive'\s*\)/i);
  });
});
