/**
 * APEX — Program utility functions
 * Helpers for working with program definitions at runtime.
 */

import type { Program, ProgramDefinition, Block, DayTemplate, ExerciseSlot, ExerciseTarget } from '../types';
import { calculateTargetWeight } from '../db/metrics';
import { getBlockColorMap } from './blockColors';

/** Day order for the weekly template */
export const DAY_ORDER = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

/** Day display names (abbreviated) */
export const DAY_NAMES: Record<string, string> = {
  sunday: 'Sun', monday: 'Mon', tuesday: 'Tue',
  wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat',
};

/** Get the current block for a given week number */
export function getBlockForWeek(blocks: Block[], weekNumber: number): Block | undefined {
  return blocks.find(b => b.weeks.includes(weekNumber));
}

/** Get block color based on emphasis/name */
export function getBlockColor(block: Block): string {
  const map = getBlockColorMap([block]);
  return map[block.name] ?? '#6366f1';
}

/** Get training days (non-rest) from the weekly template */
export function getTrainingDays(template: ProgramDefinition['program']['weekly_template']): {
  day: string;
  template: DayTemplate;
}[] {
  return DAY_ORDER
    .filter(day => {
      const t = template[day];
      return t && !('type' in t && t.type === 'rest');
    })
    .map(day => ({ day, template: template[day] as DayTemplate }));
}

/** The last non-rest training day of the week (rest days trimmed). null if none. */
export function getLastTrainingDay(definition: ProgramDefinition): string | null {
  const days = getTrainingDays(definition.program.weekly_template);
  return days.length ? days[days.length - 1].day : null;
}

/**
 * Whether a just-completed session is the program's final scheduled workout:
 * the last training day of the final week. Uses `>=` so legacy rows created
 * under the old max-12 week clamp (and behind-schedule users) still match.
 */
export function isFinalTrainingSession(
  definition: ProgramDefinition,
  weekNumber: number,
  scheduledDay: string
): boolean {
  const lastDay = getLastTrainingDay(definition);
  if (!lastDay) return false;
  return weekNumber >= definition.program.duration_weeks && scheduledDay === lastDay;
}

/** Get the exercise targets for a specific week */
export function getTargetForWeek(slot: ExerciseSlot, weekNumber: number): ExerciseTarget | undefined {
  return slot.targets.find(t => t.weeks.includes(weekNumber));
}

/** Calculate the suggested weight for an exercise in a given week */
export function getSuggestedWeight(
  slot: ExerciseSlot,
  weekNumber: number,
  oneRmValues: Record<string, number>,
  lastWeight?: number
): number | null {
  const target = getTargetForWeek(slot, weekNumber);
  if (!target) return null;

  // Priority 1: percentage of 1RM
  if (target.percent && oneRmValues[slot.exercise_id]) {
    const pct = typeof target.percent === 'string'
      ? parseFloat(target.percent)
      : target.percent;
    if (!isNaN(pct)) {
      return calculateTargetWeight(oneRmValues[slot.exercise_id], pct);
    }
  }

  // Priority 2: last session weight
  if (lastWeight) return lastWeight;

  // Priority 3: no suggestion
  return null;
}

/** One selectable program in the library catalog (may span multiple runs). */
export interface ProgramCatalogEntry {
  /** Representative row: the active run, else the most recent run */
  program: Program;
  isActive: boolean;
  /** How to start this program — null when it's already the active one */
  action: { type: 'activate' | 'restart'; programId: string } | null;
}

/**
 * Collapse program rows (one per run) into a catalog of selectable programs.
 * Identity is bundled_id, falling back to name for legacy rows. A never-run
 * inactive row is activated directly; a program whose runs are all finished
 * starts again via restart (fresh run row).
 */
export function buildProgramCatalog(programs: Program[]): ProgramCatalogEntry[] {
  const groups = new Map<string, Program[]>();
  for (const p of programs) {
    const key = p.bundled_id ?? p.name;
    const group = groups.get(key);
    if (group) group.push(p);
    else groups.set(key, [p]);
  }

  const entries: ProgramCatalogEntry[] = [];
  for (const group of groups.values()) {
    const newestFirst = [...group].sort((a, b) =>
      b.created_date.localeCompare(a.created_date)
    );
    const active = newestFirst.find(p => p.status === 'active');
    const inactive = newestFirst.find(p => p.status === 'inactive');

    if (active) {
      entries.push({ program: active, isActive: true, action: null });
    } else if (inactive) {
      entries.push({
        program: inactive,
        isActive: false,
        action: { type: 'activate', programId: inactive.id },
      });
    } else {
      // No active/inactive row — every row in this group is completed or
      // archived. Restart is only offered when the latest run finished
      // (completed) or the program is bundled (so a stopped/archived run
      // can still be relaunched from its shipped definition). An archived,
      // non-bundled group (e.g. the v16-archived legacy draft) has no
      // startable definition to restart from, so it's dropped from the
      // catalog entirely — the row itself stays in the DB, just untappable.
      const latest = newestFirst[0];
      if (latest.status === 'completed' || latest.bundled_id) {
        entries.push({
          program: latest,
          isActive: false,
          action: { type: 'restart', programId: latest.id },
        });
      }
    }
  }

  return entries.sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return b.program.created_date.localeCompare(a.program.created_date);
  });
}

/** Current week number from activation date, clamped to the program's length. */
export function getCurrentWeek(activatedDate: string, durationWeeks: number): number {
  const start = new Date(activatedDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(durationWeeks, diffWeeks + 1));
}

/** Get today's day of week as a template key */
export function getTodayKey(): string {
  return DAY_ORDER[new Date().getDay()];
}

/** True if a bundled definition already has a row (by bundled_id, name fallback for legacy rows) */
export function isBundledProgramImported(
  programs: Pick<Program, 'bundled_id' | 'name'>[],
  def: ProgramDefinition
): boolean {
  const bundledId = def.program.id;
  const name = def.program.name;
  return programs.some(p => (bundledId && p.bundled_id === bundledId) || p.name === name);
}
