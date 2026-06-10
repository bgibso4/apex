/**
 * APEX — Program completion summary builder.
 * Aggregates the data shown on the celebration → summary → Home completed card.
 */
import { getDatabase } from './database';
import { get1RMHistoryWithBlocks } from './metrics';
import { getDeltaExcludingDeload } from '../utils/deltaCalculation';
import { getTrainingDays } from '../utils/program';
import type { Program, ProgramDefinition } from '../types';

export interface LiftGain {
  exerciseId: string;
  name: string;
  startE1rm: number;
  endE1rm: number;
  deltaLb: number;       // excludes deload weeks
  deltaPct: number;
}

export interface SummaryPR {
  exerciseId: string;
  name: string;
  recordType: string;
  value: number;        // e1RM or weight
  repCount: number | null;
  weekNumber: number | null;
  date: string;
  weightLb: number | null;  // actual weight of the PR-setting set
  reps: number | null;      // actual reps of the PR-setting set
}

export interface ProgramSummary {
  programId: string;
  programName: string;
  startDate: string | null;     // activated_date
  endDate: string | null;       // completed_date
  weeks: number;
  sessionsCompleted: number;
  sessionsPlanned: number;
  adherencePct: number;
  gains: LiftGain[];            // main lifts only
  prs: SummaryPR[];
}

export async function buildProgramSummary(programId: string): Promise<ProgramSummary> {
  const db = await getDatabase();
  const prog = await db.getFirstAsync<Program>('SELECT * FROM programs WHERE id = ?', [programId]);
  if (!prog) throw new Error(`Program ${programId} not found`);
  const def = JSON.parse(prog.definition_json) as ProgramDefinition;
  const trainingDaysPerWeek = getTrainingDays(def.program.weekly_template).length;

  const sessionRow = await db.getFirstAsync<{ n: number }>(
    "SELECT COUNT(*) as n FROM sessions WHERE program_id = ? AND completed_at IS NOT NULL",
    [programId]
  );
  const sessionsCompleted = sessionRow?.n ?? 0;
  const sessionsPlanned = def.program.duration_weeks * trainingDaysPerWeek;
  const adherencePct = sessionsPlanned > 0
    ? Math.round((sessionsCompleted / sessionsPlanned) * 100)
    : 0;

  const mainSlots = new Map<string, string>(); // exerciseId -> name
  for (const day of getTrainingDays(def.program.weekly_template)) {
    for (const slot of day.template.exercises) {
      if (slot.category === 'main') {
        const exDef = def.program.exercise_definitions.find(e => e.id === slot.exercise_id);
        mainSlots.set(slot.exercise_id, exDef?.name ?? slot.exercise_id);
      }
    }
  }
  const gains: LiftGain[] = [];
  for (const [exerciseId, name] of mainSlots) {
    const history = await get1RMHistoryWithBlocks(exerciseId, { programId, limit: 100 });
    const nonDeload = history.filter(h => !/deload/i.test(h.blockName));
    if (nonDeload.length < 2) continue;
    const startE1rm = Math.round(nonDeload[0].e1rm);
    const endE1rm = Math.round(nonDeload[nonDeload.length - 1].e1rm);
    const deltaLb = getDeltaExcludingDeload(history) ?? 0;
    gains.push({
      exerciseId, name, startE1rm, endE1rm,
      deltaLb: Math.round(deltaLb),
      deltaPct: startE1rm > 0 ? Math.round((deltaLb / startE1rm) * 100) : 0,
    });
  }
  gains.sort((a, b) => b.deltaLb - a.deltaLb);

  const prRows = await db.getAllAsync<{
    exercise_id: string; session_id: string; name: string; record_type: string;
    value: number; rep_count: number | null; week_number: number; date: string;
  }>(
    `SELECT pr.exercise_id, pr.session_id, e.name as name, pr.record_type, pr.value, pr.rep_count,
            s.week_number, pr.date
     FROM personal_records pr
     JOIN sessions s ON s.id = pr.session_id
     LEFT JOIN exercises e ON e.id = pr.exercise_id
     WHERE s.program_id = ? AND pr.record_type = 'e1rm'
     ORDER BY pr.value DESC`,
    [programId]
  );
  const prs: SummaryPR[] = [];
  for (const r of prRows) {
    const bestSet = await db.getFirstAsync<{ actual_weight: number; actual_reps: number }>(
      `SELECT actual_weight, actual_reps FROM set_logs
       WHERE session_id = ? AND exercise_id = ?
         AND status IN ('completed','completed_below')
         AND actual_weight > 0 AND actual_reps > 0
       ORDER BY (actual_weight * (1 + actual_reps / 30.0)) DESC
       LIMIT 1`,
      [r.session_id, r.exercise_id]
    );
    prs.push({
      exerciseId: r.exercise_id,
      name: r.name ?? r.exercise_id,
      recordType: r.record_type,
      value: Math.round(r.value),
      repCount: r.rep_count,
      weekNumber: r.week_number,
      date: r.date,
      weightLb: bestSet?.actual_weight ?? null,
      reps: bestSet?.actual_reps ?? null,
    });
  }

  return {
    programId,
    programName: prog.name,
    startDate: prog.activated_date ?? null,
    endDate: prog.completed_date ?? null,
    weeks: def.program.duration_weeks,
    sessionsCompleted,
    sessionsPlanned,
    adherencePct,
    gains,
    prs,
  };
}
