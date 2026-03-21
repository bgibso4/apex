/**
 * APEX — Training Log Types
 * These represent the user-generated data (what gets logged).
 */

export interface Program {
  id: string;
  name: string;
  duration_weeks: number;
  created_date: string;
  status: 'inactive' | 'active' | 'completed' | 'archived';
  definition_json: string;
  activated_date?: string;
  bundled_id?: string;
}

export interface Exercise {
  id: string;
  name: string;
  type: string;
  muscle_groups: string; // JSON array stored as string
  alternatives: string;  // JSON array stored as string
  input_fields?: string; // JSON array of InputField stored as string
}

export interface Session {
  id: string;
  program_id: string;
  name?: string;
  week_number: number;
  block_name: string;
  day_template_id: string;
  scheduled_day: string;
  actual_day: string;
  date: string;
  sleep: number;         // 1-5
  soreness: number;      // 1-5
  energy: number;        // 1-5
  notes?: string;
  started_at: string;
  completed_at?: string;
}

export interface SessionProtocol {
  id: number;
  session_id: string;
  type: 'warmup' | 'conditioning';
  protocol_key: string | null;
  protocol_name: string;
  completed: boolean;
  sort_order: number;
}

export interface SetLog {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  target_weight?: number;
  target_reps?: number;
  actual_weight?: number;
  actual_reps?: number;
  target_distance?: number;
  actual_distance?: number;
  target_duration?: number;
  actual_duration?: number;
  target_time?: number;
  actual_time?: number;
  rpe?: number;
  status: 'pending' | 'completed' | 'completed_below' | 'skipped';
  timestamp?: string;
  is_adhoc?: boolean;
}

export interface RunLog {
  id: string;
  session_id: string;
  date: string;
  duration_min: number;
  distance?: number;     // miles
  pain_level: number;    // 0-10 (acute, during/right after)
  pain_level_24h?: number; // 0-10 (delayed, next day)
  notes?: string;
  included_pickups: boolean;
}

export interface WeeklyCheckin {
  id: string;
  program_id: string;
  week_number: number;
  bodyweight?: number;
  dorsiflexion_left?: number;
  dorsiflexion_right?: number;
  notes?: string;
  date: string;
}

/** Derived metric — calculated on read, not stored */
export interface Estimated1RM {
  exercise_id: string;
  exercise_name: string;
  value: number;        // lbs
  from_weight: number;
  from_reps: number;
  date: string;
}
