/**
 * Tests for src/db/migrations.ts — dependency-injected migration helpers
 */

import { archiveLegacyV2Programs, ensureProgressionSchema } from '../../src/db/migrations';

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

describe('ensureProgressionSchema (v17)', () => {
  it('adds exercises.weight_increment and creates weight_adjustments + index', async () => {
    const db = { execAsync: jest.fn().mockResolvedValue(undefined) };

    await ensureProgressionSchema(db);

    const sql = (db.execAsync as jest.Mock).mock.calls.map(c => c[0] as string).join('\n');
    expect(sql).toMatch(/ALTER TABLE exercises ADD COLUMN weight_increment REAL/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS weight_adjustments/);
    expect(sql).toMatch(/reason TEXT NOT NULL CHECK \(reason IN \('easy','misses'\)\)/);
    expect(sql).toMatch(/CREATE INDEX IF NOT EXISTS idx_weight_adjustments_exercise/);
  });

  it('swallows ALTER failure when the column already exists', async () => {
    const db = {
      execAsync: jest.fn()
        .mockRejectedValueOnce(new Error('duplicate column name'))
        .mockResolvedValue(undefined),
    };
    await expect(ensureProgressionSchema(db)).resolves.toBeUndefined();
    expect(db.execAsync).toHaveBeenCalledTimes(3); // failed ALTER + table + index
  });
});
