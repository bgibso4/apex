// __tests__/sync/syncConfig.test.ts
import { SYNC_TABLES, transformRow } from '../../src/sync/syncConfig';

describe('syncConfig', () => {
  describe('SYNC_TABLES', () => {
    it('defines 9 syncable tables', () => {
      expect(Object.keys(SYNC_TABLES)).toHaveLength(9);
    });

    it('includes all expected tables', () => {
      const expected = [
        'sessions', 'set_logs', 'exercises', 'programs', 'run_logs',
        'exercise_notes', 'personal_records', 'session_protocols',
        'daily_health',
      ];
      for (const table of expected) {
        expect(SYNC_TABLES).toHaveProperty(table);
      }
    });
  });

  describe('transformRow', () => {
    it('strips is_sample from all tables', () => {
      const row = { id: '1', date: '2026-03-22', is_sample: 0, updated_at: 'now' };
      const result = transformRow('sessions', row);
      expect(result).not.toHaveProperty('is_sample');
    });

    it('strips day_template_id from sessions', () => {
      const row = { id: '1', date: '2026-03-22', day_template_id: 'dt1', updated_at: 'now' };
      const result = transformRow('sessions', row);
      expect(result).not.toHaveProperty('day_template_id');
    });

    it('strips raw_json and created_at from daily_health', () => {
      const row = { id: 1, date: '2026-03-22', source: 'whoop', raw_json: '{}', created_at: 'x', updated_at: 'now' };
      const result = transformRow('daily_health', row);
      expect(result).not.toHaveProperty('raw_json');
      expect(result).not.toHaveProperty('created_at');
    });

    it('generates deterministic ID for daily_health', () => {
      const row = { id: 1, date: '2026-03-22', source: 'whoop', updated_at: 'now' };
      const result = transformRow('daily_health', row);
      expect(result.id).toBe('apex-health-2026-03-22');
    });

    it('generates deterministic ID for session_protocols', () => {
      const row = { id: 5, session_id: 'sess-1', type: 'warmup', protocol_key: 'foam_roll', protocol_name: 'Foam Roll', sort_order: 0, updated_at: 'now' };
      const result = transformRow('session_protocols', row);
      expect(result.id).toBe('apex-proto-sess-1-warmup-0');
    });

    it('handles null protocol_key in session_protocols', () => {
      const row = { id: 5, session_id: 'sess-1', type: 'warmup', protocol_key: null, protocol_name: 'Custom', sort_order: 2, updated_at: 'now' };
      const result = transformRow('session_protocols', row);
      expect(result.id).toBe('apex-proto-sess-1-warmup-2');
    });

    it('renames activated_date to started_at for programs', () => {
      const row = { id: 'p1', name: 'Test', status: 'active', activated_date: '2026-01-01', updated_at: 'now' };
      const result = transformRow('programs', row);
      expect(result).toHaveProperty('started_at', '2026-01-01');
      expect(result).not.toHaveProperty('activated_date');
    });

    it('strips bundled_id and created_date from programs', () => {
      const row = { id: 'p1', name: 'Test', bundled_id: 'b1', created_date: '2026-01-01', updated_at: 'now' };
      const result = transformRow('programs', row);
      expect(result).not.toHaveProperty('bundled_id');
      expect(result).not.toHaveProperty('created_date');
    });

    it('keeps created_at for exercise_notes', () => {
      const row = { id: 'n1', session_id: 's1', exercise_id: 'e1', note: 'test', created_at: '2026-01-01', is_sample: 0, updated_at: 'now' };
      const result = transformRow('exercise_notes', row);
      expect(result).toHaveProperty('created_at', '2026-01-01');
      expect(result).not.toHaveProperty('is_sample');
    });
  });
});
