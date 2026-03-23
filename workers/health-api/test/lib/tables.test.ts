import { describe, it, expect } from 'vitest';
import { ALLOWED_TABLES, isAllowedTable, validateRecords, sanitizeRecord } from '../../src/lib/tables';

describe('table allowlist', () => {
  it('rejects unknown table names', () => {
    expect(isAllowedTable('fake_table')).toBe(false);
  });

  it('accepts known table names', () => {
    expect(isAllowedTable('sessions')).toBe(true);
    expect(isAllowedTable('set_logs')).toBe(true);
    expect(isAllowedTable('daily_health')).toBe(true);
    expect(isAllowedTable('body_weights')).toBe(true);
    expect(isAllowedTable('exercise_notes')).toBe(true);
    expect(isAllowedTable('session_protocols')).toBe(true);
    expect(isAllowedTable('personal_records')).toBe(true);
  });

  it('validates required columns', () => {
    const result = validateRecords('sessions', [{ id: 'abc' }]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('date');
  });

  it('passes valid records', () => {
    const result = validateRecords('sessions', [
      { id: 'abc', date: '2026-03-22', updated_at: '2026-03-22T00:00:00Z' },
    ]);
    expect(result.valid).toBe(true);
  });

  it('strips unknown columns', () => {
    const record = { id: 'abc', date: '2026-03-22', updated_at: 'now', evil_col: 'drop table' };
    const sanitized = sanitizeRecord('sessions', record);
    expect(sanitized).not.toHaveProperty('evil_col');
    expect(sanitized).toHaveProperty('id');
    expect(sanitized).toHaveProperty('date');
  });
});
