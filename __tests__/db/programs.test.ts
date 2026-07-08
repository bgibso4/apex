/**
 * Tests for src/db/programs.ts — Program data access
 */

import { getDatabase, generateId } from '../../src/db/database';
import {
  getActiveProgram,
  getAllPrograms,
  importProgram,
  activateProgram,
  restartProgram,
  stopProgram,
} from '../../src/db/programs';
import { getLocalDateString } from '../../src/utils/date';
import type { ProgramDefinition } from '../../src/types';

jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn(),
  generateId: jest.fn(() => 'test-prog-id'),
}));

function createMockDb() {
  return {
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
    execAsync: jest.fn().mockResolvedValue(undefined),
  };
}

/** Minimal valid ProgramDefinition for tests */
function makeProgramDef(overrides?: Partial<ProgramDefinition['program']>): ProgramDefinition {
  return {
    program: {
      name: 'Test Program',
      duration_weeks: 12,
      created: '2026-01-01',
      blocks: [],
      weekly_template: {},
      exercise_definitions: [
        {
          id: 'squat',
          name: 'Back Squat',
          type: 'main',
          muscle_groups: ['quads', 'glutes'],
          alternatives: ['front-squat'],
        },
        {
          id: 'bench',
          name: 'Bench Press',
          type: 'main',
          muscle_groups: ['chest', 'triceps'],
        },
      ],
      warmup_protocols: {},
      ...overrides,
    },
  };
}

describe('programs', () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  // ---------------------------------------------------------------------------
  // getActiveProgram
  // ---------------------------------------------------------------------------
  describe('getActiveProgram', () => {
    it('returns null when no active program', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await getActiveProgram();

      expect(mockDb.getFirstAsync).toHaveBeenCalledTimes(1);
      const [sql] = mockDb.getFirstAsync.mock.calls[0];
      expect(sql).toContain("status = 'active'");
      expect(sql).toContain('LIMIT 1');
      expect(result).toBeNull();
    });

    it('parses definition_json and returns program with definition', async () => {
      const definition: ProgramDefinition = makeProgramDef();
      const dbRow = {
        id: 'prog-1',
        name: 'Test Program',
        duration_weeks: 12,
        status: 'active',
        definition_json: JSON.stringify(definition),
        created_date: '2026-01-01',
      };
      mockDb.getFirstAsync.mockResolvedValue(dbRow);

      const result = await getActiveProgram();

      expect(result).not.toBeNull();
      expect(result!.id).toBe('prog-1');
      expect(result!.definition).toEqual(definition);
      expect(result!.definition.program.name).toBe('Test Program');
      expect(result!.definition.program.exercise_definitions).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------------------
  // getAllPrograms
  // ---------------------------------------------------------------------------
  describe('getAllPrograms', () => {
    it('queries all programs ordered by created_date DESC', async () => {
      const mockPrograms = [
        { id: 'p2', name: 'Newer', created_date: '2026-02-01' },
        { id: 'p1', name: 'Older', created_date: '2026-01-01' },
      ];
      mockDb.getAllAsync.mockResolvedValue(mockPrograms);

      const result = await getAllPrograms();

      expect(mockDb.getAllAsync).toHaveBeenCalledTimes(1);
      const [sql] = mockDb.getAllAsync.mock.calls[0];
      expect(sql).toContain('SELECT * FROM programs');
      expect(sql).toContain('ORDER BY created_date DESC');
      expect(result).toEqual(mockPrograms);
    });

    it('returns empty array when no programs', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      const result = await getAllPrograms();

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // importProgram
  // ---------------------------------------------------------------------------
  describe('importProgram', () => {
    it('inserts program row and returns generated id', async () => {
      const definition = makeProgramDef();

      const id = await importProgram(definition);

      expect(id).toBe('test-prog-id');
      expect(generateId).toHaveBeenCalled();

      // First runAsync call is the program INSERT
      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('INSERT INTO programs');
      expect(sql).toContain('updated_at');
      expect(sql).toContain("datetime('now')");
      expect(params[0]).toBe('test-prog-id');
      expect(params[1]).toBe('Test Program');
      expect(params[2]).toBe(12);
      expect(params[3]).toBe('2026-01-01');
      expect(params[4]).toBe(JSON.stringify(definition));
    });

    it('upserts each exercise definition', async () => {
      const definition = makeProgramDef();

      await importProgram(definition);

      // 1 program INSERT + 2 exercise INSERT OR REPLACE
      expect(mockDb.runAsync).toHaveBeenCalledTimes(3);

      // First exercise: squat
      const [sql1, params1] = mockDb.runAsync.mock.calls[1];
      expect(sql1).toContain('INSERT INTO exercises');
      expect(sql1).toContain('input_fields');
      expect(sql1).toContain('updated_at');
      expect(sql1).toContain("datetime('now')");
      expect(params1[0]).toBe('squat');
      expect(params1[1]).toBe('Back Squat');
      expect(params1[2]).toBe('main');
      expect(params1[3]).toBe(JSON.stringify(['quads', 'glutes']));
      expect(params1[4]).toBe(JSON.stringify(['front-squat']));
      expect(params1[5]).toBeNull(); // no input_fields

      // Second exercise: bench
      const [sql2, params2] = mockDb.runAsync.mock.calls[2];
      expect(sql2).toContain('INSERT INTO exercises');
      expect(params2[0]).toBe('bench');
      expect(params2[1]).toBe('Bench Press');
      expect(params2[4]).toBe(JSON.stringify([])); // no alternatives → []
      expect(params2[5]).toBeNull(); // no input_fields
    });

    it('stores input_fields when exercise definition includes them', async () => {
      const definition = makeProgramDef({
        exercise_definitions: [
          {
            id: 'plank',
            name: 'Plank',
            type: 'core',
            muscle_groups: ['core'],
            input_fields: [{ type: 'duration', unit: 'sec' }],
          },
        ],
      });

      await importProgram(definition);

      const [, params] = mockDb.runAsync.mock.calls[1];
      expect(params[0]).toBe('plank');
      expect(params[5]).toBe(JSON.stringify([{ type: 'duration', unit: 'sec' }]));
    });

    it('handles program with no exercises', async () => {
      const definition = makeProgramDef({ exercise_definitions: [] });

      await importProgram(definition);

      // Only 1 call: program INSERT, no exercise inserts
      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
    });

    it('stores status as inactive', async () => {
      const definition = makeProgramDef();

      await importProgram(definition);

      const [sql] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain("'inactive'");
    });
  });

  // ---------------------------------------------------------------------------
  // activateProgram
  // ---------------------------------------------------------------------------
  describe('activateProgram', () => {
    it('archives any existing active program (abandoned, not completed)', async () => {
      await activateProgram('prog-2');

      // Locate the deactivation call (SQL targets WHERE status = 'active')
      const deactivateCall = mockDb.runAsync.mock.calls.find(([sql]: [string]) =>
        sql.includes("WHERE status = 'active'")
      );
      expect(deactivateCall).toBeDefined();
      const [sql1, params1] = deactivateCall!;
      expect(sql1).toContain("UPDATE programs SET status = 'archived'");
      expect(sql1).toContain('updated_at');
      // Stamp the end date on the superseded program
      expect(sql1).toContain('COALESCE(completed_date');
      expect(params1).toEqual([getLocalDateString()]);
    });

    it('retires any completed-program cards (starting fresh dismisses old glory)', async () => {
      await activateProgram('prog-2');

      const dismissCall = mockDb.runAsync.mock.calls.find(([sql]: [string]) =>
        sql.includes('card_dismissed = 1')
      );
      expect(dismissCall).toBeDefined();
      expect(dismissCall![0]).toContain("WHERE status = 'completed'");
    });

    it('activates the specified program', async () => {
      await activateProgram('prog-2');

      const activateCall = mockDb.runAsync.mock.calls.find(([sql]: [string]) =>
        sql.includes("SET status = 'active'")
      );
      expect(activateCall).toBeDefined();
      const [sql2, params2] = activateCall!;
      expect(sql2).toContain('one_rm_values = NULL');
      expect(sql2).toContain('activated_date = ?');
      expect(sql2).toContain('WHERE id = ?');
      expect(sql2).toContain('updated_at');
      expect(typeof params2[0]).toBe('string'); // date string
      expect(params2[1]).toBe('prog-2');
    });
  });

  // ---------------------------------------------------------------------------
  // restartProgram
  // ---------------------------------------------------------------------------
  describe('restartProgram', () => {
    const sourceRow = {
      id: 'prog-old',
      name: 'Functional Athlete',
      duration_weeks: 11,
      created_date: '2026-03-21',
      status: 'completed',
      definition_json: '{"program":{"name":"Functional Athlete"}}',
      one_rm_values: null,
      activated_date: '2026-03-21',
      is_sample: 0,
      bundled_id: 'functional-athlete',
      completed_date: '2026-06-09',
      completion_seen: 1,
    };

    it('copies the source program into a fresh inactive row (new id, new created_date)', async () => {
      mockDb.getFirstAsync.mockResolvedValue(sourceRow);

      const newId = await restartProgram('prog-old');

      expect(newId).toBe('test-prog-id');
      expect(newId).not.toBe(sourceRow.id);

      // Reads the source program by id
      const [selectSql, selectParams] = mockDb.getFirstAsync.mock.calls[0];
      expect(selectSql).toContain('FROM programs WHERE id = ?');
      expect(selectParams).toEqual(['prog-old']);

      // Inserts a new row copying the definition — NOT an UPDATE of the old row
      const insertCall = mockDb.runAsync.mock.calls.find(([sql]: [string]) =>
        sql.includes('INSERT INTO programs')
      );
      expect(insertCall).toBeDefined();
      const [insertSql, insertParams] = insertCall!;
      expect(insertSql).toContain("'inactive'");
      expect(insertParams[0]).toBe('test-prog-id');
      expect(insertParams[1]).toBe('Functional Athlete');
      expect(insertParams[2]).toBe(11);
      expect(insertParams[3]).toBe(getLocalDateString()); // fresh run, created today
      expect(insertParams[4]).toBe(sourceRow.definition_json);
      expect(insertParams[5]).toBe('functional-athlete');
    });

    it('activates the new row, not the old one (old sessions stay off the new run)', async () => {
      mockDb.getFirstAsync.mockResolvedValue(sourceRow);

      await restartProgram('prog-old');

      // Any currently active program gets archived (abandoned, not completed)
      const deactivateCall = mockDb.runAsync.mock.calls.find(([sql]: [string]) =>
        sql.includes("WHERE status = 'active'")
      );
      expect(deactivateCall).toBeDefined();
      expect(deactivateCall![0]).toContain("status = 'archived'");

      // The activation targets the NEW id — never 'prog-old'
      const activateCall = mockDb.runAsync.mock.calls.find(([sql]: [string]) =>
        sql.includes("SET status = 'active'")
      );
      expect(activateCall).toBeDefined();
      const [activateSql, activateParams] = activateCall!;
      expect(activateSql).toContain('activated_date = ?');
      expect(activateParams[activateParams.length - 1]).toBe('test-prog-id');

      // The old row is never switched back to active
      for (const [sql, params] of mockDb.runAsync.mock.calls) {
        if (sql.includes("SET status = 'active'")) {
          expect(params[params.length - 1]).not.toBe('prog-old');
        }
      }
    });

    it('throws when the source program does not exist', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      await expect(restartProgram('missing')).rejects.toThrow();
      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // stopProgram
  // ---------------------------------------------------------------------------
  describe('stopProgram', () => {
    it('archives the program when keeping data (stopped ≠ completed)', async () => {
      await stopProgram('prog-1', false);

      const archiveCall = mockDb.runAsync.mock.calls.find(([sql]: [string]) =>
        sql.includes("UPDATE programs SET status = 'archived'")
      );
      expect(archiveCall).toBeDefined();
      const [sql, params] = archiveCall!;
      expect(sql).toContain('WHERE id = ?');
      expect(sql).toContain('updated_at');
      // Stamp the end date (manual stop ≠ natural completion)
      expect(sql).toContain('COALESCE(completed_date');
      expect(params).toEqual([getLocalDateString(), 'prog-1']);
    });

    it('retires any completed-program cards when keeping data', async () => {
      await stopProgram('prog-1', false);

      const dismissCall = mockDb.runAsync.mock.calls.find(([sql]: [string]) =>
        sql.includes('card_dismissed = 1')
      );
      expect(dismissCall).toBeDefined();
      expect(dismissCall![0]).toContain("WHERE status = 'completed'");
    });

    it('does not delete any session data when keeping data', async () => {
      await stopProgram('prog-1', false);

      for (const [sql] of mockDb.runAsync.mock.calls) {
        expect(sql).not.toContain('DELETE');
      }
    });

    it('deletes all related data when deleteData is true', async () => {
      await stopProgram('prog-1', true);

      // Should have multiple DELETE calls + one UPDATE
      const calls = mockDb.runAsync.mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(7);

      // Verify cascade order: personal_records, exercise_notes, set_logs, unlink run_logs, session_protocols, sessions, weekly_checkins
      const sqls = calls.map(([sql]: [string]) => sql);

      expect(sqls[0]).toContain('DELETE FROM personal_records');
      expect(sqls[1]).toContain('DELETE FROM exercise_notes');
      expect(sqls[2]).toContain('DELETE FROM set_logs');
      expect(sqls[3]).toContain('UPDATE run_logs SET session_id = NULL');
      expect(sqls[4]).toContain('DELETE FROM session_protocols');
      expect(sqls[5]).toContain('DELETE FROM sessions');
      expect(sqls[6]).toContain('DELETE FROM weekly_checkins');

      // All statements reference the program_id
      for (let i = 0; i < 7; i++) {
        const params = calls[i][1];
        expect(params).toEqual(['prog-1']);
      }
    });

    it('sets status to inactive and clears activated_date when deleting data', async () => {
      await stopProgram('prog-1', true);

      const inactiveCall = mockDb.runAsync.mock.calls.find(([sql]: [string]) =>
        sql.includes("UPDATE programs SET status = 'inactive'")
      );
      expect(inactiveCall).toBeDefined();
      const [sql, params] = inactiveCall!;
      expect(sql).toContain('activated_date = NULL');
      expect(sql).toContain('WHERE id = ?');
      expect(sql).toContain('updated_at');
      expect(params).toEqual(['prog-1']);
    });

    it('retires any completed-program cards when deleting data (old cards must not resurface)', async () => {
      await stopProgram('prog-1', true);

      const dismissCall = mockDb.runAsync.mock.calls.find(([sql]: [string]) =>
        sql.includes('card_dismissed = 1')
      );
      expect(dismissCall).toBeDefined();
      expect(dismissCall![0]).toContain("WHERE status = 'completed'");
    });
  });
});
