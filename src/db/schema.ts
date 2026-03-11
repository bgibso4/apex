/**
 * APEX — SQLite Schema
 * All tables and indexes for the local database.
 */

export const SCHEMA_VERSION = 7;

export const CREATE_TABLES = `
-- Programs table: stores imported program definitions
CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  duration_weeks INTEGER NOT NULL,
  created_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive',
  definition_json TEXT NOT NULL,
  one_rm_values TEXT,
  activated_date TEXT,
  is_sample INTEGER DEFAULT 0
);

-- Global exercise library (cross-program)
CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  muscle_groups TEXT NOT NULL DEFAULT '[]',
  alternatives TEXT NOT NULL DEFAULT '[]',
  input_fields TEXT,
  is_sample INTEGER DEFAULT 0
);

-- Session logs
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  block_name TEXT NOT NULL,
  day_template_id TEXT NOT NULL,
  scheduled_day TEXT NOT NULL,
  actual_day TEXT NOT NULL,
  date TEXT NOT NULL,
  sleep INTEGER DEFAULT 3,
  soreness INTEGER DEFAULT 3,
  energy INTEGER DEFAULT 3,
  warmup_rope INTEGER DEFAULT 0,
  warmup_ankle INTEGER DEFAULT 0,
  warmup_hip_ir INTEGER DEFAULT 0,
  conditioning_done INTEGER DEFAULT 0,
  notes TEXT,
  started_at TEXT,
  completed_at TEXT,
  is_sample INTEGER DEFAULT 0,
  FOREIGN KEY (program_id) REFERENCES programs(id)
);

-- Set logs (the core training data)
CREATE TABLE IF NOT EXISTS set_logs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  target_weight REAL,
  target_reps INTEGER,
  actual_weight REAL,
  actual_reps INTEGER,
  target_distance REAL,
  actual_distance REAL,
  target_duration REAL,
  actual_duration REAL,
  target_time REAL,
  actual_time REAL,
  rpe REAL,
  status TEXT NOT NULL DEFAULT 'pending',
  timestamp TEXT,
  is_adhoc INTEGER DEFAULT 0,
  is_sample INTEGER DEFAULT 0,
  FOREIGN KEY (session_id) REFERENCES sessions(id),
  FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

-- Run logs
CREATE TABLE IF NOT EXISTS run_logs (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  date TEXT NOT NULL,
  duration_min REAL NOT NULL,
  pain_level INTEGER DEFAULT 0,
  pain_level_24h INTEGER,
  distance REAL,
  notes TEXT,
  included_pickups INTEGER DEFAULT 0,
  is_sample INTEGER DEFAULT 0,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Weekly check-ins
CREATE TABLE IF NOT EXISTS weekly_checkins (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  bodyweight REAL,
  dorsiflexion_left REAL,
  dorsiflexion_right REAL,
  notes TEXT,
  date TEXT NOT NULL,
  FOREIGN KEY (program_id) REFERENCES programs(id)
);

-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_info (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Exercise-level notes (per exercise per session)
CREATE TABLE IF NOT EXISTS exercise_notes (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  is_sample INTEGER DEFAULT 0,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  UNIQUE(session_id, exercise_id)
);

-- Personal records (e1RM and rep bests)
CREATE TABLE IF NOT EXISTS personal_records (
  id TEXT PRIMARY KEY,
  exercise_id TEXT NOT NULL,
  record_type TEXT NOT NULL,
  rep_count INTEGER,
  value REAL NOT NULL,
  previous_value REAL,
  session_id TEXT NOT NULL,
  date TEXT NOT NULL,
  is_sample INTEGER DEFAULT 0,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sessions_program ON sessions(program_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_week ON sessions(program_id, week_number);
CREATE INDEX IF NOT EXISTS idx_set_logs_session ON set_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_set_logs_exercise ON set_logs(exercise_id);
CREATE INDEX IF NOT EXISTS idx_run_logs_date ON run_logs(date);
CREATE INDEX IF NOT EXISTS idx_checkins_program ON weekly_checkins(program_id, week_number);
CREATE INDEX IF NOT EXISTS idx_exercise_notes_session ON exercise_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_personal_records_exercise ON personal_records(exercise_id, record_type, rep_count);
CREATE INDEX IF NOT EXISTS idx_personal_records_session ON personal_records(session_id);
`;
