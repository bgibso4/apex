/**
 * APEX — Derived metrics (1RM, volume, trends)
 * These are calculated on read, never stored.
 */

import { getDatabase } from './database';
import type { Estimated1RM } from '../types';
import type { ProgramDefinition, DayTemplate } from '../types';
import { getBlockForWeek, getTargetForWeek } from '../utils/program';
import { InputField, getFieldsForExercise, supportsE1RM } from '../types/fields';

const VALID_METRIC_COLUMNS = new Set([
  'actual_weight', 'actual_reps', 'actual_distance',
  'actual_duration', 'actual_time',
]);

/** Epley formula: weight × (1 + reps / 30) */
export function calculateEpley(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight; // actual 1RM
  return Math.round(weight * (1 + reps / 30));
}

/** Get estimated 1RM for an exercise (best Epley from recent sessions) */
export async function getEstimated1RM(exerciseId: string): Promise<Estimated1RM | null> {
  const db = await getDatabase();

  // Get best set by e1RM in the last 12 weeks
  const rows = await db.getAllAsync<{
    actual_weight: number;
    actual_reps: number;
    date: string;
    name: string;
  }>(
    `SELECT sl.actual_weight, sl.actual_reps, s.date, e.name
     FROM set_logs sl
     JOIN sessions s ON s.id = sl.session_id
     JOIN exercises e ON e.id = sl.exercise_id
     WHERE sl.exercise_id = ?
       AND sl.status IN ('completed', 'completed_below')
       AND sl.actual_weight > 0
       AND sl.actual_reps > 0
     ORDER BY s.date DESC
     LIMIT 50`,
    [exerciseId]
  );

  if (rows.length === 0) return null;

  // Find the best e1RM
  let best: Estimated1RM | null = null;
  for (const row of rows) {
    const e1rm = calculateEpley(row.actual_weight, row.actual_reps);
    if (!best || e1rm > best.value) {
      best = {
        exercise_id: exerciseId,
        exercise_name: row.name,
        value: e1rm,
        from_weight: row.actual_weight,
        from_reps: row.actual_reps,
        date: row.date,
      };
    }
  }

  return best;
}

/** Get 1RM history for an exercise (for sparkline charts) */
export async function get1RMHistory(
  exerciseId: string,
  limit: number = 20
): Promise<{ date: string; e1rm: number }[]> {
  const db = await getDatabase();

  // Get the best set per session
  const rows = await db.getAllAsync<{
    date: string;
    actual_weight: number;
    actual_reps: number;
    session_id: string;
  }>(
    `SELECT s.date, sl.actual_weight, sl.actual_reps, sl.session_id
     FROM set_logs sl
     JOIN sessions s ON s.id = sl.session_id
     WHERE sl.exercise_id = ?
       AND sl.status IN ('completed', 'completed_below')
       AND sl.actual_weight > 0
       AND sl.actual_reps > 0
       AND s.completed_at IS NOT NULL
     ORDER BY s.date DESC
     LIMIT ?`,
    [exerciseId, limit * 5] // get extra rows to find per-session bests
  );

  // Group by session, take best e1RM per session
  const sessionBests = new Map<string, { date: string; e1rm: number }>();
  for (const row of rows) {
    const e1rm = calculateEpley(row.actual_weight, row.actual_reps);
    const existing = sessionBests.get(row.session_id);
    if (!existing || e1rm > existing.e1rm) {
      sessionBests.set(row.session_id, { date: row.date, e1rm });
    }
  }

  return Array.from(sessionBests.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-limit);
}

/** Data point for 1RM history with block context */
export interface E1RMHistoryPoint {
  date: string;
  e1rm: number;
  blockName: string;
}

/** Get 1RM history with block names, supporting date-range and program filtering */
export async function get1RMHistoryWithBlocks(
  exerciseId: string,
  options?: { startDate?: string; programId?: string; limit?: number }
): Promise<E1RMHistoryPoint[]> {
  const db = await getDatabase();
  const limit = options?.limit ?? 50;

  let sql = `SELECT s.date, sl.actual_weight, sl.actual_reps, sl.session_id, s.block_name
     FROM set_logs sl
     JOIN sessions s ON s.id = sl.session_id
     WHERE sl.exercise_id = ?
       AND sl.status IN ('completed', 'completed_below')
       AND sl.actual_weight > 0
       AND sl.actual_reps > 0
       AND s.completed_at IS NOT NULL`;

  const params: (string | number)[] = [exerciseId];

  if (options?.startDate) {
    sql += `\n       AND s.date >= ?`;
    params.push(options.startDate);
  }

  if (options?.programId) {
    sql += `\n       AND s.program_id = ?`;
    params.push(options.programId);
  }

  sql += `\n     ORDER BY s.date DESC\n     LIMIT ?`;
  params.push(limit * 5);

  const rows = await db.getAllAsync<{
    date: string;
    actual_weight: number;
    actual_reps: number;
    session_id: string;
    block_name: string;
  }>(sql, params);

  // Group by session, take best e1RM per session
  const sessionBests = new Map<string, E1RMHistoryPoint>();
  for (const row of rows) {
    const e1rm = calculateEpley(row.actual_weight, row.actual_reps);
    const existing = sessionBests.get(row.session_id);
    if (!existing || e1rm > existing.e1rm) {
      sessionBests.set(row.session_id, {
        date: row.date,
        e1rm,
        blockName: row.block_name,
      });
    }
  }

  return Array.from(sessionBests.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-limit);
}

/** Get weekly volume (total sets completed) for a program */
export async function getWeeklyVolume(
  programId: string
): Promise<{ week: number; totalSets: number; totalReps: number; totalTonnage: number }[]> {
  const db = await getDatabase();

  return db.getAllAsync(
    `SELECT
       s.week_number as week,
       COUNT(sl.id) as totalSets,
       SUM(sl.actual_reps) as totalReps,
       SUM(sl.actual_weight * sl.actual_reps) as totalTonnage
     FROM set_logs sl
     JOIN sessions s ON s.id = sl.session_id
     WHERE s.program_id = ?
       AND sl.status IN ('completed', 'completed_below')
     GROUP BY s.week_number
     ORDER BY s.week_number`,
    [programId]
  );
}

/** Calculate suggested weight for an exercise based on 1RM and target percentage */
export function calculateTargetWeight(oneRm: number, percentage: number): number {
  const raw = oneRm * (percentage / 100);
  return Math.round(raw / 5) * 5; // Round to nearest 5 lbs
}

/** Session set history with block context */
export interface SessionSetHistory {
  date: string;
  blockName: string;
  sessionE1rm: number;
  avgRpe: number | null;
  sets: { setNumber: number; weight: number; reps: number; rpe: number | null }[];
}

/** Get exercise set history with block names, supporting date-range and program filtering */
export async function getExerciseSetHistoryWithBlocks(
  exerciseId: string,
  options?: { startDate?: string; programId?: string; limit?: number }
): Promise<SessionSetHistory[]> {
  const db = await getDatabase();
  const limit = options?.limit ?? 5;

  let sql = `SELECT s.date, sl.session_id, sl.set_number, sl.actual_weight, sl.actual_reps, sl.rpe, s.block_name
     FROM set_logs sl
     JOIN sessions s ON s.id = sl.session_id
     WHERE sl.exercise_id = ?
       AND sl.status IN ('completed', 'completed_below')
       AND sl.actual_weight > 0
       AND s.completed_at IS NOT NULL`;

  const params: (string | number)[] = [exerciseId];

  if (options?.startDate) {
    sql += `\n       AND s.date >= ?`;
    params.push(options.startDate);
  }

  if (options?.programId) {
    sql += `\n       AND s.program_id = ?`;
    params.push(options.programId);
  }

  sql += `\n     ORDER BY s.date DESC, sl.set_number ASC`;

  const rows = await db.getAllAsync<{
    date: string;
    session_id: string;
    set_number: number;
    actual_weight: number;
    actual_reps: number;
    rpe: number | null;
    block_name: string;
  }>(sql, params);

  // Group by session
  const sessionMap = new Map<string, {
    date: string;
    blockName: string;
    bestE1rm: number;
    rpeValues: number[];
    sets: { setNumber: number; weight: number; reps: number; rpe: number | null }[];
  }>();

  for (const row of rows) {
    const key = row.session_id;
    if (!sessionMap.has(key)) {
      sessionMap.set(key, {
        date: row.date,
        blockName: row.block_name,
        bestE1rm: 0,
        rpeValues: [],
        sets: [],
      });
    }
    const session = sessionMap.get(key)!;

    const e1rm = calculateEpley(row.actual_weight, row.actual_reps);
    if (e1rm > session.bestE1rm) {
      session.bestE1rm = e1rm;
    }

    if (row.rpe !== null) {
      session.rpeValues.push(row.rpe);
    }

    session.sets.push({
      setNumber: row.set_number,
      weight: row.actual_weight,
      reps: row.actual_reps,
      rpe: row.rpe,
    });
  }

  const results: SessionSetHistory[] = Array.from(sessionMap.values()).map(s => ({
    date: s.date,
    blockName: s.blockName,
    sessionE1rm: s.bestE1rm,
    avgRpe: s.rpeValues.length > 0
      ? Math.round((s.rpeValues.reduce((a, b) => a + b, 0) / s.rpeValues.length) * 10) / 10
      : null,
    sets: s.sets,
  }));

  // Already sorted desc by date from SQL ORDER BY
  return results.slice(0, limit);
}

/** Per-week training consistency */
export interface WeekConsistency {
  week: number;
  completed: number;
  planned: number;
}

/** Get training consistency per week for a program */
export async function getTrainingConsistency(
  programId: string,
  trainingDaysPerWeek: number
): Promise<WeekConsistency[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{ week: number; completed: number }>(
    `SELECT
       s.week_number as week,
       COUNT(*) as completed
     FROM sessions s
     WHERE s.program_id = ?
       AND s.completed_at IS NOT NULL
     GROUP BY s.week_number
     ORDER BY s.week_number`,
    [programId]
  );

  return rows.map(row => ({
    week: row.week,
    completed: row.completed,
    planned: trainingDaysPerWeek,
  }));
}

/** Per-program training consistency */
export interface ProgramConsistency {
  programId: string;
  programName: string;
  completed: number;
  planned: number;
}

/** Get all-time training consistency across programs */
export async function getAllTimeConsistency(
  trainingDaysPerWeek: number
): Promise<ProgramConsistency[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    programId: string;
    programName: string;
    completed: number;
    duration_weeks: number;
  }>(
    `SELECT
       p.id as programId,
       p.name as programName,
       COUNT(s.id) as completed,
       p.duration_weeks
     FROM programs p
     LEFT JOIN sessions s ON s.program_id = p.id AND s.completed_at IS NOT NULL
     WHERE p.status IN ('active', 'completed')
     GROUP BY p.id
     ORDER BY p.activated_date ASC`
  );

  return rows.map(row => ({
    programId: row.programId,
    programName: row.programName,
    completed: row.completed,
    planned: row.duration_weeks * trainingDaysPerWeek,
  }));
}

/** Count distinct sessions where an exercise was logged */
export async function getExerciseSessionCount(
  exerciseId: string,
  options?: { startDate?: string; programId?: string }
): Promise<number> {
  const db = await getDatabase();

  let sql = `SELECT COUNT(DISTINCT sl.session_id) as count
     FROM set_logs sl
     JOIN sessions s ON s.id = sl.session_id
     WHERE sl.exercise_id = ?
       AND sl.status IN ('completed', 'completed_below')
       AND s.completed_at IS NOT NULL`;

  const params: (string | number)[] = [exerciseId];

  if (options?.startDate) {
    sql += `\n       AND s.date >= ?`;
    params.push(options.startDate);
  }

  if (options?.programId) {
    sql += `\n       AND s.program_id = ?`;
    params.push(options.programId);
  }

  const row = await db.getFirstAsync<{ count: number }>(sql, params);
  return row?.count ?? 0;
}

/** Protocol item for warmup/finisher consistency tracking */
export interface ProtocolItem {
  name: string;
  completed: number;
  total: number;
}

/** Get warmup/finisher protocol consistency for a program (or all time) */
export async function getProtocolConsistency(
  programId: string | null
): Promise<ProtocolItem[]> {
  const db = await getDatabase();

  let sql = `SELECT
       COUNT(*) as total,
       SUM(warmup_rope) as warmup_rope_count,
       SUM(warmup_ankle) as warmup_ankle_count,
       SUM(warmup_hip_ir) as warmup_hip_ir_count,
       SUM(conditioning_done) as conditioning_done_count
     FROM sessions
     WHERE completed_at IS NOT NULL`;

  const params: string[] = [];

  if (programId !== null) {
    sql += `\n       AND program_id = ?`;
    params.push(programId);
  }

  const row = await db.getFirstAsync<{
    total: number;
    warmup_rope_count: number;
    warmup_ankle_count: number;
    warmup_hip_ir_count: number;
    conditioning_done_count: number;
  }>(sql, params);

  const total = row?.total ?? 0;

  return [
    { name: 'Jump Rope', completed: row?.warmup_rope_count ?? 0, total },
    { name: 'Ankle Protocol', completed: row?.warmup_ankle_count ?? 0, total },
    { name: 'Hip IR Work', completed: row?.warmup_hip_ir_count ?? 0, total },
    { name: 'Conditioning', completed: row?.conditioning_done_count ?? 0, total },
  ];
}

/** Get recent set history for an exercise (for exercise detail page) */
export async function getExerciseSetHistory(
  exerciseId: string,
  limit: number = 30
): Promise<{
  date: string;
  sets: { setNumber: number; weight: number; reps: number; rpe: number | null }[];
}[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    date: string;
    session_id: string;
    set_number: number;
    actual_weight: number;
    actual_reps: number;
    rpe: number | null;
  }>(
    `SELECT s.date, sl.session_id, sl.set_number, sl.actual_weight, sl.actual_reps, sl.rpe
     FROM set_logs sl
     JOIN sessions s ON s.id = sl.session_id
     WHERE sl.exercise_id = ?
       AND sl.status IN ('completed', 'completed_below')
       AND sl.actual_weight > 0
       AND s.completed_at IS NOT NULL
     ORDER BY s.date DESC, sl.set_number ASC
     LIMIT ?`,
    [exerciseId, limit * 5]
  );

  // Group by date
  const grouped = new Map<string, { date: string; sets: { setNumber: number; weight: number; reps: number; rpe: number | null }[] }>();
  for (const row of rows) {
    const key = row.date;
    if (!grouped.has(key)) {
      grouped.set(key, { date: key, sets: [] });
    }
    grouped.get(key)!.sets.push({
      setNumber: row.set_number,
      weight: row.actual_weight,
      reps: row.actual_reps,
      rpe: row.rpe,
    });
  }

  return Array.from(grouped.values()).slice(0, limit);
}

/** Planned volume per week from a program definition */
export interface PlannedWeekVolume {
  week: number;
  plannedSets: number;
  blockName: string;
}

/** Calculate planned sets per week from a program definition (pure function, no DB access) */
export function getPlannedWeeklyVolume(
  definition: ProgramDefinition,
  durationWeeks: number
): PlannedWeekVolume[] {
  const { blocks, weekly_template } = definition.program;
  const result: PlannedWeekVolume[] = [];

  for (let week = 1; week <= durationWeeks; week++) {
    const block = getBlockForWeek(blocks, week);
    let plannedSets = 0;

    for (const dayEntry of Object.values(weekly_template)) {
      // Skip rest days
      if ('type' in dayEntry && dayEntry.type === 'rest') continue;

      const day = dayEntry as DayTemplate;
      for (const slot of day.exercises) {
        const target = getTargetForWeek(slot, week);
        if (target) {
          plannedSets += target.sets;
        }
      }
    }

    result.push({
      week,
      plannedSets,
      blockName: block?.name ?? '',
    });
  }

  return result;
}

/** An exercise that has at least one completed set_log */
export interface LoggedExercise {
  id: string;
  name: string;
  muscleGroups: string[];
}

/** Get distinct exercises that have at least one completed set_log */
export async function getLoggedExercises(): Promise<LoggedExercise[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    muscle_groups: string;
  }>(
    `SELECT DISTINCT e.id, e.name, e.muscle_groups
     FROM exercises e
     JOIN set_logs sl ON sl.exercise_id = e.id
     WHERE sl.status IN ('completed', 'completed_below')
     ORDER BY e.name ASC`
  );

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    muscleGroups: JSON.parse(row.muscle_groups),
  }));
}

/** Program boundary info for timeline overlays */
export interface ProgramBoundary {
  programId: string;
  programName: string;
  startDate: string;
  durationWeeks: number;
}

/** Get program boundaries (active/completed programs with activation dates) */
export async function getProgramBoundaries(): Promise<ProgramBoundary[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    activated_date: string;
    duration_weeks: number;
  }>(
    `SELECT id, name, activated_date, duration_weeks
     FROM programs
     WHERE status IN ('active', 'completed')
       AND activated_date IS NOT NULL
     ORDER BY activated_date ASC`
  );

  return rows.map(row => ({
    programId: row.id,
    programName: row.name,
    startDate: row.activated_date,
    durationWeeks: row.duration_weeks,
  }));
}

/**
 * Get the best value for a column from completed sets.
 */
async function getBestValue(
  exerciseId: string,
  column: string,
  agg: 'MAX' | 'MIN' = 'MAX'
): Promise<number | null> {
  if (!VALID_METRIC_COLUMNS.has(column)) throw new Error(`Invalid metric column: ${column}`);
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ best: number | null }>(
    `SELECT ${agg}(${column}) as best FROM set_logs
     WHERE exercise_id = ? AND status IN ('completed', 'completed_below')
     AND ${column} IS NOT NULL`,
    [exerciseId]
  );
  return row?.best ?? null;
}

/** Primary metric result for an exercise */
export interface ExercisePrimaryMetric {
  value: number;
  label: string;
  unit?: string;
  detail?: string;
}

/**
 * Get the primary metric for an exercise based on its field types.
 */
export async function getExercisePrimaryMetric(
  exerciseId: string,
  inputFieldsJson: string | null
): Promise<ExercisePrimaryMetric | null> {
  const fields = getFieldsForExercise(inputFieldsJson);

  if (supportsE1RM(fields)) {
    const e1rm = await getEstimated1RM(exerciseId);
    return e1rm ? {
      value: e1rm.value,
      label: 'Estimated 1RM',
      unit: 'lbs',
      detail: `Based on ${e1rm.from_weight} \u00D7 ${e1rm.from_reps} on ${e1rm.date}`,
    } : null;
  }

  const types = fields.map(f => f.type);

  if (types.includes('duration')) {
    const best = await getBestValue(exerciseId, 'actual_duration');
    return best ? { value: best, label: 'Best Duration', unit: 'sec' } : null;
  }

  if (types.includes('time')) {
    const best = await getBestValue(exerciseId, 'actual_time', 'MIN');
    return best ? { value: best, label: 'Best Time', unit: 'sec' } : null;
  }

  if (types.includes('reps') && !types.includes('weight')) {
    const best = await getBestValue(exerciseId, 'actual_reps');
    return best ? { value: best, label: 'Best Reps', unit: 'reps' } : null;
  }

  if (types.includes('distance')) {
    const best = await getBestValue(exerciseId, 'actual_distance');
    return best ? { value: best, label: 'Best Distance', unit: 'm' } : null;
  }

  return null;
}

/** Metric history data point */
export interface MetricHistoryPoint {
  date: string;
  value: number;
  blockName: string;
}

/**
 * Get history of a metric value per session for charting.
 */
export async function getMetricHistory(
  exerciseId: string,
  column: string,
  agg: 'MAX' | 'MIN' = 'MAX',
  options?: { startDate?: string; programId?: string; limit?: number }
): Promise<MetricHistoryPoint[]> {
  if (!VALID_METRIC_COLUMNS.has(column)) throw new Error(`Invalid metric column: ${column}`);
  const db = await getDatabase();
  const conditions = [`sl.exercise_id = ?`, `sl.status IN ('completed', 'completed_below')`, `sl.${column} IS NOT NULL`];
  const params: (string | number)[] = [exerciseId];

  if (options?.startDate) {
    conditions.push('s.date >= ?');
    params.push(options.startDate);
  }
  if (options?.programId) {
    conditions.push('s.program_id = ?');
    params.push(options.programId);
  }

  const rows = await db.getAllAsync<{ date: string; value: number; block_name: string }>(
    `SELECT s.date, ${agg}(sl.${column}) as value, s.block_name
     FROM set_logs sl JOIN sessions s ON sl.session_id = s.id
     WHERE ${conditions.join(' AND ')}
     GROUP BY s.id
     ORDER BY s.date ASC
     ${options?.limit ? `LIMIT ${options.limit}` : ''}`,
    params
  );

  return rows.map(r => ({ date: r.date, value: r.value, blockName: r.block_name }));
}

/** Session set history for non-weight exercises */
export interface GenericSessionSetHistory {
  date: string;
  blockName: string;
  bestMetricValue: number | null;
  avgRpe: number | null;
  sets: {
    setNumber: number;
    weight: number | null;
    reps: number | null;
    duration: number | null;
    time: number | null;
    distance: number | null;
    rpe: number | null;
  }[];
}

/** Get exercise set history with all field values (generic, not weight-only) */
export async function getGenericExerciseSetHistory(
  exerciseId: string,
  options?: { startDate?: string; programId?: string; limit?: number }
): Promise<GenericSessionSetHistory[]> {
  const db = await getDatabase();
  const limit = options?.limit ?? 5;

  let sql = `SELECT s.date, sl.session_id, sl.set_number,
       sl.actual_weight, sl.actual_reps, sl.actual_duration, sl.actual_time, sl.actual_distance,
       sl.rpe, s.block_name
     FROM set_logs sl
     JOIN sessions s ON s.id = sl.session_id
     WHERE sl.exercise_id = ?
       AND sl.status IN ('completed', 'completed_below')
       AND s.completed_at IS NOT NULL`;

  const params: (string | number)[] = [exerciseId];

  if (options?.startDate) {
    sql += `\n       AND s.date >= ?`;
    params.push(options.startDate);
  }

  if (options?.programId) {
    sql += `\n       AND s.program_id = ?`;
    params.push(options.programId);
  }

  sql += `\n     ORDER BY s.date DESC, sl.set_number ASC`;

  const rows = await db.getAllAsync<{
    date: string;
    session_id: string;
    set_number: number;
    actual_weight: number | null;
    actual_reps: number | null;
    actual_duration: number | null;
    actual_time: number | null;
    actual_distance: number | null;
    rpe: number | null;
    block_name: string;
  }>(sql, params);

  // Group by session
  const sessionMap = new Map<string, {
    date: string;
    blockName: string;
    rpeValues: number[];
    sets: GenericSessionSetHistory['sets'];
  }>();

  for (const row of rows) {
    const key = row.session_id;
    if (!sessionMap.has(key)) {
      sessionMap.set(key, {
        date: row.date,
        blockName: row.block_name,
        rpeValues: [],
        sets: [],
      });
    }
    const session = sessionMap.get(key)!;

    if (row.rpe !== null) {
      session.rpeValues.push(row.rpe);
    }

    session.sets.push({
      setNumber: row.set_number,
      weight: row.actual_weight,
      reps: row.actual_reps,
      duration: row.actual_duration,
      time: row.actual_time,
      distance: row.actual_distance,
      rpe: row.rpe,
    });
  }

  const results: GenericSessionSetHistory[] = Array.from(sessionMap.values()).map(s => ({
    date: s.date,
    blockName: s.blockName,
    bestMetricValue: null, // computed by caller based on exercise type
    avgRpe: s.rpeValues.length > 0
      ? Math.round((s.rpeValues.reduce((a, b) => a + b, 0) / s.rpeValues.length) * 10) / 10
      : null,
    sets: s.sets,
  }));

  return results.slice(0, limit);
}
