/**
 * APEX — Program Definition Types
 * These match the JSON schema used for program import.
 */

import type { InputField } from './fields';

export interface ProgramDefinition {
  program: {
    id?: string;
    name: string;
    duration_weeks: number;
    created: string;
    blocks: Block[];
    weekly_template: WeeklyTemplate;
    exercise_definitions: ExerciseDefinition[];
    warmup_protocols: Record<string, WarmupProtocol>;
  };
}

export interface Block {
  name: string;
  weeks: number[];
  emphasis?: string;
  main_lift_scheme: MainLiftScheme;
  accessory_scheme?: AccessoryScheme;
  volume_modifier?: number;
  intensity_modifier?: number;
}

export interface MainLiftScheme {
  progression?: 'weekly' | 'biweekly';
  [weekKey: string]: WeekScheme | string | undefined;
}

export interface WeekScheme {
  sets: number;
  reps: number | string;
  percent: number | string;
  rpe_target: string;
}

export interface AccessoryScheme {
  rep_range: number[];
  rpe_target: string;
}

export interface WeeklyTemplate {
  [day: string]: DayTemplate | { type: 'rest' };
}

export interface DayTemplate {
  name: string;
  locked?: boolean;
  warmup: string[];
  exercises: ExerciseSlot[];
  conditioning_finisher?: string;
  run_progression?: Record<string, RunTarget>;
  notes?: string;
}

export interface ExerciseSlot {
  exercise_id: string;
  category: 'main' | 'power' | 'compound_accessory' | 'accessory' | 'core' | 'conditioning' | 'movement';
  /** Per-block targets — keyed by block name or week range */
  targets: ExerciseTarget[];
  alternatives?: string[];
  notes?: string;
  default_weight?: number;
  /** Exercises sharing the same superset_group are performed as a superset (alternating sets). */
  superset_group?: string;
}

export interface ExerciseTarget {
  weeks: number[];
  sets: number;
  reps?: number | string;
  percent?: number | string;
  rpe_target?: string;
  notes?: string;
  values?: Record<string, number>;
}

export interface RunTarget {
  duration_min: number;
  type: 'easy' | 'easy_with_pickups';
  pickups?: number;
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  type: 'main' | 'power' | 'accessory' | 'conditioning' | 'movement' | 'core';
  muscle_groups: string[];
  alternatives?: string[];
  uses_1rm?: boolean;
  one_rm?: number;
  input_fields?: InputField[];
}

export interface WarmupProtocol {
  name: string;
  duration_min: number;
  steps: WarmupStep[];
  note?: string;
}

export interface WarmupStep {
  name: string;
  prescription: string;
  notes?: string;
  progression?: string;
}
