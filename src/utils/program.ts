/**
 * APEX — Program utility functions
 * Helpers for working with program definitions at runtime.
 */

import type { ProgramDefinition, Block, DayTemplate, ExerciseSlot, ExerciseTarget } from '../types';
import { calculateTargetWeight } from '../db/metrics';

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
  const name = block.name.toLowerCase();
  if (name.includes('hypertrophy') || name.includes('work capacity')) return '#6366f1';
  if (name.includes('deload')) return '#22c55e';
  if (name.includes('strength')) return '#f59e0b';
  if (name.includes('realization') || name.includes('peak')) return '#ec4899';
  return '#6366f1';
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

/** Get the current week number based on program activation date */
export function getCurrentWeek(activatedDate: string): number {
  const start = new Date(activatedDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(12, diffWeeks + 1));
}

/** Get today's day of week as a template key */
export function getTodayKey(): string {
  return DAY_ORDER[new Date().getDay()];
}
