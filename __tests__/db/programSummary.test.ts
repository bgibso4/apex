/**
 * Tests for src/db/programSummary.ts — Program completion summary builder
 */

import { getDatabase } from '../../src/db/database';
import { buildProgramSummary } from '../../src/db/programSummary';
import type { ProgramDefinition } from '../../src/types';

// Mock the database module
jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn(),
  generateId: jest.fn(() => 'test-id'),
}));

// Mock get1RMHistoryWithBlocks but keep getDeltaExcludingDeload REAL
jest.mock('../../src/db/metrics', () => {
  const actual = jest.requireActual('../../src/db/metrics');
  return {
    ...actual,
    get1RMHistoryWithBlocks: jest.fn(),
  };
});

import { get1RMHistoryWithBlocks } from '../../src/db/metrics';

function createMockDb() {
  return {
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
    execAsync: jest.fn().mockResolvedValue(undefined),
  };
}

/** Minimal ProgramDefinition with 2 training days and 1 main lift */
function makeTestDefinition(): ProgramDefinition {
  return {
    program: {
      name: 'Test Completion Program',
      duration_weeks: 11,
      created: '2026-01-01',
      blocks: [
        { name: 'Hypertrophy', weeks: [1, 2, 3, 4], main_lift_scheme: {} },
        { name: 'Strength', weeks: [5, 6, 7, 8, 9, 10, 11], main_lift_scheme: {} },
      ],
      weekly_template: {
        monday: {
          name: 'Monday Lower',
          warmup: [],
          exercises: [
            {
              exercise_id: 'back_squat',
              category: 'main',
              targets: [{ weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], sets: 3, reps: 5 }],
            },
            {
              exercise_id: 'rdl',
              category: 'accessory',
              targets: [{ weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], sets: 3, reps: 10 }],
            },
          ],
        },
        wednesday: {
          name: 'Wednesday Upper',
          warmup: [],
          exercises: [
            {
              exercise_id: 'bench_press',
              category: 'main',
              targets: [{ weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], sets: 3, reps: 5 }],
            },
          ],
        },
        sunday: { type: 'rest' },
        tuesday: { type: 'rest' },
        thursday: { type: 'rest' },
        friday: { type: 'rest' },
        saturday: { type: 'rest' },
      },
      exercise_definitions: [
        {
          id: 'back_squat',
          name: 'Back Squat',
          type: 'main',
          muscle_groups: ['quads', 'glutes'],
        },
        {
          id: 'bench_press',
          name: 'Bench Press',
          type: 'main',
          muscle_groups: ['chest', 'triceps'],
        },
        {
          id: 'rdl',
          name: 'Romanian Deadlift',
          type: 'accessory',
          muscle_groups: ['hamstrings'],
        },
      ],
      warmup_protocols: {},
    },
  };
}

function makeProgramRow(def: ProgramDefinition) {
  return {
    id: 'prog-abc',
    name: 'Test Completion Program',
    duration_weeks: 11,
    status: 'completed',
    definition_json: JSON.stringify(def),
    created_date: '2026-01-01',
    activated_date: '2026-03-01',
    completed_date: '2026-05-15',
    completion_seen: 0,
  };
}

describe('buildProgramSummary', () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  describe('basic summary fields', () => {
    it('returns program name, dates, and week count', async () => {
      const def = makeTestDefinition();
      const programRow = makeProgramRow(def);

      mockDb.getFirstAsync.mockImplementation((sql: string) => {
        if (sql.includes('FROM programs')) return Promise.resolve(programRow);
        if (sql.includes('COUNT(*)')) return Promise.resolve({ n: 38 });
        return Promise.resolve(null);
      });
      mockDb.getAllAsync.mockResolvedValue([]);
      (get1RMHistoryWithBlocks as jest.Mock).mockResolvedValue([]);

      const summary = await buildProgramSummary('prog-abc');

      expect(summary.programId).toBe('prog-abc');
      expect(summary.programName).toBe('Test Completion Program');
      expect(summary.startDate).toBe('2026-03-01');
      expect(summary.endDate).toBe('2026-05-15');
      expect(summary.weeks).toBe(11);
    });
  });

  describe('adherence calculation', () => {
    it('calculates sessions, planned, and adherence correctly', async () => {
      const def = makeTestDefinition();
      const programRow = makeProgramRow(def);

      // 11 weeks × 2 training days (monday + wednesday) = 22 planned
      mockDb.getFirstAsync.mockImplementation((sql: string) => {
        if (sql.includes('FROM programs')) return Promise.resolve(programRow);
        if (sql.includes('COUNT(*)')) return Promise.resolve({ n: 38 });
        return Promise.resolve(null);
      });
      mockDb.getAllAsync.mockResolvedValue([]);
      (get1RMHistoryWithBlocks as jest.Mock).mockResolvedValue([]);

      const summary = await buildProgramSummary('prog-abc');

      expect(summary.sessionsCompleted).toBe(38);
      expect(summary.sessionsPlanned).toBe(22); // 11 weeks × 2 training days
      expect(summary.adherencePct).toBe(Math.round((38 / 22) * 100)); // 173
    });
  });

  describe('main lift gains', () => {
    it('computes startE1rm, endE1rm, deltaLb, deltaPct using real getDeltaExcludingDeload', async () => {
      const def = makeTestDefinition();
      const programRow = makeProgramRow(def);

      mockDb.getFirstAsync.mockImplementation((sql: string) => {
        if (sql.includes('FROM programs')) return Promise.resolve(programRow);
        if (sql.includes('COUNT(*)')) return Promise.resolve({ n: 38 });
        return Promise.resolve(null);
      });
      mockDb.getAllAsync.mockResolvedValue([]);

      // back_squat: 2 non-deload points → gain of 40 lbs (13%)
      // bench_press: single-point history → excluded (< 2 non-deload points)
      (get1RMHistoryWithBlocks as jest.Mock).mockImplementation(
        (exerciseId: string) => {
          if (exerciseId === 'back_squat') {
            return Promise.resolve([
              { date: '2026-03-01', e1rm: 300, blockName: 'Hypertrophy' },
              { date: '2026-05-01', e1rm: 340, blockName: 'Strength' },
            ]);
          }
          if (exerciseId === 'bench_press') {
            // Only one point — should be excluded from gains
            return Promise.resolve([
              { date: '2026-03-05', e1rm: 225, blockName: 'Hypertrophy' },
            ]);
          }
          return Promise.resolve([]);
        }
      );

      const summary = await buildProgramSummary('prog-abc');

      // back_squat should appear in gains
      expect(summary.gains).toHaveLength(1);
      const squat = summary.gains[0];
      expect(squat.exerciseId).toBe('back_squat');
      expect(squat.name).toBe('Back Squat');
      expect(squat.startE1rm).toBe(300);
      expect(squat.endE1rm).toBe(340);
      expect(squat.deltaLb).toBe(40);
      expect(squat.deltaPct).toBe(13); // Math.round(40/300*100) = 13
    });

    it('excludes lifts whose non-deload history is all-deload or single-point', async () => {
      const def = makeTestDefinition();
      const programRow = makeProgramRow(def);

      mockDb.getFirstAsync.mockImplementation((sql: string) => {
        if (sql.includes('FROM programs')) return Promise.resolve(programRow);
        if (sql.includes('COUNT(*)')) return Promise.resolve({ n: 10 });
        return Promise.resolve(null);
      });
      mockDb.getAllAsync.mockResolvedValue([]);

      (get1RMHistoryWithBlocks as jest.Mock).mockImplementation(
        (exerciseId: string) => {
          if (exerciseId === 'back_squat') {
            // All deload blocks — getDeltaExcludingDeload returns null → excluded
            return Promise.resolve([
              { date: '2026-03-01', e1rm: 300, blockName: 'Deload' },
              { date: '2026-04-01', e1rm: 280, blockName: 'Deload Week' },
            ]);
          }
          if (exerciseId === 'bench_press') {
            // Single non-deload point — excluded
            return Promise.resolve([
              { date: '2026-03-05', e1rm: 225, blockName: 'Hypertrophy' },
            ]);
          }
          return Promise.resolve([]);
        }
      );

      const summary = await buildProgramSummary('prog-abc');
      expect(summary.gains).toHaveLength(0);
    });
  });

  describe('gains sorted by deltaLb descending', () => {
    it('sorts gains by deltaLb descending when multiple lifts have gains', async () => {
      // Build a definition with both back_squat and bench_press on separate days
      // but we need both to have ≥2 non-deload points
      const def = makeTestDefinition();
      const programRow = makeProgramRow(def);

      mockDb.getFirstAsync.mockImplementation((sql: string) => {
        if (sql.includes('FROM programs')) return Promise.resolve(programRow);
        if (sql.includes('COUNT(*)')) return Promise.resolve({ n: 20 });
        return Promise.resolve(null);
      });
      mockDb.getAllAsync.mockResolvedValue([]);

      (get1RMHistoryWithBlocks as jest.Mock).mockImplementation(
        (exerciseId: string) => {
          if (exerciseId === 'back_squat') {
            return Promise.resolve([
              { date: '2026-03-01', e1rm: 300, blockName: 'Hypertrophy' },
              { date: '2026-05-01', e1rm: 340, blockName: 'Strength' }, // +40
            ]);
          }
          if (exerciseId === 'bench_press') {
            return Promise.resolve([
              { date: '2026-03-05', e1rm: 200, blockName: 'Hypertrophy' },
              { date: '2026-05-05', e1rm: 250, blockName: 'Strength' }, // +50
            ]);
          }
          return Promise.resolve([]);
        }
      );

      const summary = await buildProgramSummary('prog-abc');
      expect(summary.gains).toHaveLength(2);
      // bench_press has +50 delta, squat has +40 → bench first
      expect(summary.gains[0].exerciseId).toBe('bench_press');
      expect(summary.gains[0].deltaLb).toBe(50);
      expect(summary.gains[1].exerciseId).toBe('back_squat');
      expect(summary.gains[1].deltaLb).toBe(40);
    });
  });

  describe('personal records', () => {
    it('maps PR rows to SummaryPR with rounded values and correct fields', async () => {
      const def = makeTestDefinition();
      const programRow = makeProgramRow(def);

      mockDb.getFirstAsync.mockImplementation((sql: string) => {
        if (sql.includes('FROM programs')) return Promise.resolve(programRow);
        if (sql.includes('COUNT(*)')) return Promise.resolve({ n: 38 });
        return Promise.resolve(null);
      });

      const fakePrRows = [
        {
          exercise_id: 'back_squat',
          name: 'Back Squat',
          record_type: 'e1rm',
          value: 342.7,
          rep_count: 3,
          week_number: 9,
          date: '2026-05-01',
        },
      ];
      mockDb.getAllAsync.mockResolvedValue(fakePrRows);
      (get1RMHistoryWithBlocks as jest.Mock).mockResolvedValue([]);

      const summary = await buildProgramSummary('prog-abc');

      expect(summary.prs).toHaveLength(1);
      const pr = summary.prs[0];
      expect(pr.exerciseId).toBe('back_squat');
      expect(pr.name).toBe('Back Squat');
      expect(pr.recordType).toBe('e1rm');
      expect(pr.value).toBe(343); // Math.round(342.7)
      expect(pr.repCount).toBe(3);
      expect(pr.weekNumber).toBe(9);
      expect(pr.date).toBe('2026-05-01');
    });

    it('falls back to exercise_id when PR name join is null', async () => {
      const def = makeTestDefinition();
      const programRow = makeProgramRow(def);

      mockDb.getFirstAsync.mockImplementation((sql: string) => {
        if (sql.includes('FROM programs')) return Promise.resolve(programRow);
        if (sql.includes('COUNT(*)')) return Promise.resolve({ n: 5 });
        return Promise.resolve(null);
      });

      const fakePrRows = [
        {
          exercise_id: 'unknown_lift',
          name: null,
          record_type: 'e1rm',
          value: 200,
          rep_count: null,
          week_number: 3,
          date: '2026-03-15',
        },
      ];
      mockDb.getAllAsync.mockResolvedValue(fakePrRows);
      (get1RMHistoryWithBlocks as jest.Mock).mockResolvedValue([]);

      const summary = await buildProgramSummary('prog-abc');

      expect(summary.prs[0].name).toBe('unknown_lift');
    });
  });

  describe('error handling', () => {
    it('throws when program is not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      await expect(buildProgramSummary('missing')).rejects.toThrow('Program missing not found');
    });
  });
});
