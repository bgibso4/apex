/**
 * Tests for src/db/programs.ts — Program data access
 */

import { getDatabase, generateId } from '../../src/db/database';
import {
  getActiveProgram,
  getAllPrograms,
  importProgram,
  activateProgram,
  getOneRmValues,
  stopProgram,
} from '../../src/db/programs';
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
      expect(sql1).toContain('INSERT OR REPLACE INTO exercises');
      expect(sql1).toContain('input_fields');
      expect(params1[0]).toBe('squat');
      expect(params1[1]).toBe('Back Squat');
      expect(params1[2]).toBe('main');
      expect(params1[3]).toBe(JSON.stringify(['quads', 'glutes']));
      expect(params1[4]).toBe(JSON.stringify(['front-squat']));
      expect(params1[5]).toBeNull(); // no input_fields

      // Second exercise: bench
      const [sql2, params2] = mockDb.runAsync.mock.calls[2];
      expect(sql2).toContain('INSERT OR REPLACE INTO exercises');
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
    it('deactivates existing active program first', async () => {
      const oneRm = { squat: 315, bench: 225 };

      await activateProgram('prog-2', oneRm);

      expect(mockDb.runAsync).toHaveBeenCalledTimes(2);

      // First call: deactivate
      const [sql1] = mockDb.runAsync.mock.calls[0];
      expect(sql1).toContain("UPDATE programs SET status = 'completed'");
      expect(sql1).toContain("WHERE status = 'active'");
    });

    it('activates the specified program with 1RM values', async () => {
      const oneRm = { squat: 315, bench: 225 };

      await activateProgram('prog-2', oneRm);

      // Second call: activate
      const [sql2, params2] = mockDb.runAsync.mock.calls[1];
      expect(sql2).toContain("SET status = 'active'");
      expect(sql2).toContain('one_rm_values = ?');
      expect(sql2).toContain('activated_date = ?');
      expect(sql2).toContain('WHERE id = ?');
      expect(params2[0]).toBe(JSON.stringify(oneRm));
      expect(typeof params2[1]).toBe('string'); // date string
      expect(params2[2]).toBe('prog-2');
    });

    it('handles empty 1RM values', async () => {
      await activateProgram('prog-3', {});

      const [, params] = mockDb.runAsync.mock.calls[1];
      expect(params[0]).toBe(JSON.stringify({}));
    });
  });

  // ---------------------------------------------------------------------------
  // getOneRmValues
  // ---------------------------------------------------------------------------
  describe('getOneRmValues', () => {
    it('parses JSON and returns record of 1RM values', async () => {
      const oneRm = { squat: 315, bench: 225, deadlift: 405 };
      mockDb.getFirstAsync.mockResolvedValue({
        one_rm_values: JSON.stringify(oneRm),
      });

      const result = await getOneRmValues('prog-1');

      expect(mockDb.getFirstAsync).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.getFirstAsync.mock.calls[0];
      expect(sql).toContain('SELECT one_rm_values FROM programs');
      expect(sql).toContain('WHERE id = ?');
      expect(params).toEqual(['prog-1']);
      expect(result).toEqual(oneRm);
    });

    it('returns empty object when one_rm_values is null', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ one_rm_values: null });

      const result = await getOneRmValues('prog-2');

      expect(result).toEqual({});
    });

    it('returns empty object when row is null', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await getOneRmValues('nonexistent');

      expect(result).toEqual({});
    });
  });

  // ---------------------------------------------------------------------------
  // stopProgram
  // ---------------------------------------------------------------------------
  describe('stopProgram', () => {
    it('sets status to completed when keeping data', async () => {
      await stopProgram('prog-1', false);

      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain("UPDATE programs SET status = 'completed'");
      expect(sql).toContain('WHERE id = ?');
      expect(params).toEqual(['prog-1']);
    });

    it('does not delete any session data when keeping data', async () => {
      await stopProgram('prog-1', false);

      // Only one call: the status update
      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
      const [sql] = mockDb.runAsync.mock.calls[0];
      expect(sql).not.toContain('DELETE');
    });

    it('deletes all related data when deleteData is true', async () => {
      await stopProgram('prog-1', true);

      // Should have multiple DELETE calls + one UPDATE
      const calls = mockDb.runAsync.mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(6);

      // Verify cascade order: personal_records, exercise_notes, set_logs, unlink run_logs, sessions, weekly_checkins
      const sqls = calls.map(([sql]: [string]) => sql);

      expect(sqls[0]).toContain('DELETE FROM personal_records');
      expect(sqls[1]).toContain('DELETE FROM exercise_notes');
      expect(sqls[2]).toContain('DELETE FROM set_logs');
      expect(sqls[3]).toContain('UPDATE run_logs SET session_id = NULL');
      expect(sqls[4]).toContain('DELETE FROM sessions');
      expect(sqls[5]).toContain('DELETE FROM weekly_checkins');

      // All statements reference the program_id
      for (let i = 0; i < 6; i++) {
        const params = calls[i][1];
        expect(params).toEqual(['prog-1']);
      }
    });

    it('sets status to inactive and clears activated_date when deleting data', async () => {
      await stopProgram('prog-1', true);

      const calls = mockDb.runAsync.mock.calls;
      const lastCall = calls[calls.length - 1];
      const [sql, params] = lastCall;

      expect(sql).toContain("UPDATE programs SET status = 'inactive'");
      expect(sql).toContain('activated_date = NULL');
      expect(sql).toContain('WHERE id = ?');
      expect(params).toEqual(['prog-1']);
    });
  });
});
