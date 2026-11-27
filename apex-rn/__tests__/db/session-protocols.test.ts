/**
 * Tests for session protocol DB functions (insertSessionProtocols,
 * getSessionProtocols, updateProtocolCompletion) and getFullSessionState
 * protocol integration.
 */

import { getDatabase } from '../../src/db/database';
import {
  insertSessionProtocols,
  getSessionProtocols,
  updateProtocolCompletion,
  deleteSession,
  getFullSessionState,
} from '../../src/db/sessions';

jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn(),
  generateId: jest.fn(() => 'test-id-123'),
}));

function createMockDb() {
  return {
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
    execAsync: jest.fn().mockResolvedValue(undefined),
  };
}

describe('session protocols', () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  // ---------------------------------------------------------------------------
  // insertSessionProtocols + getSessionProtocols
  // ---------------------------------------------------------------------------
  describe('insertSessionProtocols + getSessionProtocols', () => {
    it('inserts 3 protocols (2 warmup, 1 conditioning) with correct SQL and sort_order', async () => {
      const protocols = [
        { type: 'warmup', protocolKey: 'jump_rope', protocolName: 'Jump Rope (3 min)' },
        { type: 'warmup', protocolKey: 'ankle_mob', protocolName: 'Ankle Mobility' },
        { type: 'conditioning', protocolKey: null, protocolName: '10 min incline walk' },
      ];

      await insertSessionProtocols('sess-1', protocols);

      // Should have called runAsync 3 times (once per protocol)
      expect(mockDb.runAsync).toHaveBeenCalledTimes(3);

      // Verify first insert (sort_order = 0)
      const [sql0, params0] = mockDb.runAsync.mock.calls[0];
      expect(sql0).toContain('INSERT INTO session_protocols');
      expect(params0).toEqual(['sess-1', 'warmup', 'jump_rope', 'Jump Rope (3 min)', 0]);

      // Verify second insert (sort_order = 1)
      const [, params1] = mockDb.runAsync.mock.calls[1];
      expect(params1).toEqual(['sess-1', 'warmup', 'ankle_mob', 'Ankle Mobility', 1]);

      // Verify third insert (sort_order = 2, null protocolKey)
      const [, params2] = mockDb.runAsync.mock.calls[2];
      expect(params2).toEqual(['sess-1', 'conditioning', null, '10 min incline walk', 2]);
    });

    it('getSessionProtocols queries with correct SQL and returns results', async () => {
      const mockProtocols = [
        { id: 1, session_id: 'sess-1', type: 'warmup', protocol_key: 'jump_rope', protocol_name: 'Jump Rope (3 min)', completed: 0, sort_order: 0 },
        { id: 2, session_id: 'sess-1', type: 'warmup', protocol_key: 'ankle_mob', protocol_name: 'Ankle Mobility', completed: 0, sort_order: 1 },
        { id: 3, session_id: 'sess-1', type: 'conditioning', protocol_key: null, protocol_name: '10 min incline walk', completed: 0, sort_order: 2 },
      ];
      mockDb.getAllAsync.mockResolvedValue(mockProtocols);

      const result = await getSessionProtocols('sess-1');

      expect(mockDb.getAllAsync).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.getAllAsync.mock.calls[0];
      expect(sql).toContain('SELECT * FROM session_protocols WHERE session_id = ?');
      expect(sql).toContain('ORDER BY sort_order');
      expect(params).toEqual(['sess-1']);
      expect(result).toEqual(mockProtocols);
      expect(result).toHaveLength(3);
      expect(result[0].type).toBe('warmup');
      expect(result[2].type).toBe('conditioning');
      expect(result[2].protocol_key).toBeNull();
    });

    it('handles empty protocol array without calling runAsync', async () => {
      await insertSessionProtocols('sess-1', []);

      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // updateProtocolCompletion
  // ---------------------------------------------------------------------------
  describe('updateProtocolCompletion', () => {
    it('sets completed = 1 when toggled to true', async () => {
      await updateProtocolCompletion(42, true);

      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('UPDATE session_protocols SET completed = ?');
      expect(sql).toContain('WHERE id = ?');
      expect(params).toEqual([1, 42]);
    });

    it('sets completed = 0 when toggled to false', async () => {
      await updateProtocolCompletion(42, false);

      const [, params] = mockDb.runAsync.mock.calls[0];
      expect(params).toEqual([0, 42]);
    });
  });

  // ---------------------------------------------------------------------------
  // deleteSession includes session_protocols cleanup
  // ---------------------------------------------------------------------------
  describe('deleteSession cleans up session_protocols', () => {
    it('deletes session_protocols before other related data', async () => {
      await deleteSession('sess-1');

      // session_protocols should be deleted first
      expect(mockDb.runAsync).toHaveBeenCalledTimes(5);
      const [firstSql, firstParams] = mockDb.runAsync.mock.calls[0];
      expect(firstSql).toContain('DELETE FROM session_protocols WHERE session_id = ?');
      expect(firstParams).toEqual(['sess-1']);

      // Verify order: session_protocols, set_logs, exercise_notes, personal_records, sessions
      expect(mockDb.runAsync.mock.calls[1][0]).toContain('DELETE FROM set_logs');
      expect(mockDb.runAsync.mock.calls[2][0]).toContain('DELETE FROM exercise_notes');
      expect(mockDb.runAsync.mock.calls[3][0]).toContain('DELETE FROM personal_records');
      expect(mockDb.runAsync.mock.calls[4][0]).toContain('DELETE FROM sessions WHERE id = ?');
    });
  });

  // ---------------------------------------------------------------------------
  // getFullSessionState includes protocols
  // ---------------------------------------------------------------------------
  describe('getFullSessionState includes protocols', () => {
    it('returns protocols alongside session, setLogs, and exerciseNotes', async () => {
      const mockSession = {
        id: 'sess-1',
        program_id: 'prog-1',
        week_number: 2,
        started_at: '2026-03-09T10:00:00Z',
        completed_at: null,
      };
      const mockSetLogs = [
        { id: 'sl1', session_id: 'sess-1', exercise_id: 'squat', set_number: 1, status: 'completed' },
      ];
      const mockNoteRows = [
        { exercise_id: 'squat', note: 'Felt strong' },
      ];
      const mockProtocols = [
        { id: 1, session_id: 'sess-1', type: 'warmup', protocol_key: 'jump_rope', protocol_name: 'Jump Rope', completed: 1, sort_order: 0 },
        { id: 2, session_id: 'sess-1', type: 'conditioning', protocol_key: null, protocol_name: 'Walk', completed: 0, sort_order: 1 },
      ];

      mockDb.getFirstAsync.mockResolvedValue(mockSession);
      mockDb.getAllAsync
        .mockResolvedValueOnce(mockSetLogs)    // set logs query
        .mockResolvedValueOnce(mockNoteRows)   // exercise notes query
        .mockResolvedValueOnce(mockProtocols); // protocols query

      const result = await getFullSessionState('sess-1');

      expect(result).not.toBeNull();
      expect(result!.session).toEqual(mockSession);
      expect(result!.setLogs).toEqual(mockSetLogs);
      expect(result!.exerciseNotes).toEqual({ squat: 'Felt strong' });
      expect(result!.protocols).toEqual(mockProtocols);
      expect(result!.protocols).toHaveLength(2);
    });

    it('returns empty protocols array when session has none', async () => {
      const mockSession = {
        id: 'sess-2',
        program_id: 'prog-1',
        started_at: '2026-03-09T10:00:00Z',
      };

      mockDb.getFirstAsync.mockResolvedValue(mockSession);
      mockDb.getAllAsync
        .mockResolvedValueOnce([])  // no set logs
        .mockResolvedValueOnce([])  // no notes
        .mockResolvedValueOnce([]); // no protocols

      const result = await getFullSessionState('sess-2');

      expect(result).not.toBeNull();
      expect(result!.protocols).toEqual([]);
    });

    it('returns null when session not found (no protocol query made)', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await getFullSessionState('nonexistent');

      expect(result).toBeNull();
      expect(mockDb.getAllAsync).not.toHaveBeenCalled();
    });
  });
});
