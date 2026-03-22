import { describe, it, expect } from 'vitest';
import { buildUpsertSQL, buildSelectSQL } from '../../src/db/queries';

describe('buildUpsertSQL', () => {
  it('generates ON CONFLICT DO UPDATE statement', () => {
    const statements = buildUpsertSQL('sessions', [
      { id: 'abc', date: '2026-03-22', updated_at: 'now' },
    ]);
    expect(statements).toHaveLength(1);
    const { sql, params } = statements[0];
    expect(sql).toContain('INSERT INTO sessions');
    expect(sql).toContain('ON CONFLICT(id) DO UPDATE SET');
    expect(sql).toContain('date=excluded.date');
    expect(params).toContain('abc');
    expect(params).toContain('2026-03-22');
  });

  it('returns one statement per record', () => {
    const statements = buildUpsertSQL('sessions', [
      { id: '1', date: 'd1', updated_at: 'now' },
      { id: '2', date: 'd2', updated_at: 'now' },
    ]);
    expect(statements).toHaveLength(2);
    expect(statements[0].params).toContain('1');
    expect(statements[1].params).toContain('2');
  });
});

describe('buildSelectSQL', () => {
  it('generates basic SELECT', () => {
    const { sql, params } = buildSelectSQL('sessions', {});
    expect(sql).toContain('SELECT * FROM sessions');
    expect(sql).toContain('LIMIT');
  });

  it('filters by since', () => {
    const { sql, params } = buildSelectSQL('sessions', { since: '2026-03-01T00:00:00Z' });
    expect(sql).toContain('WHERE updated_at > ?');
    expect(params).toContain('2026-03-01T00:00:00Z');
  });

  it('respects limit and offset', () => {
    const { sql } = buildSelectSQL('sessions', { limit: 50, offset: 10 });
    expect(sql).toContain('LIMIT 50');
    expect(sql).toContain('OFFSET 10');
  });

  it('caps limit at 1000', () => {
    const { sql } = buildSelectSQL('sessions', { limit: 5000 });
    expect(sql).toContain('LIMIT 1000');
  });
});
