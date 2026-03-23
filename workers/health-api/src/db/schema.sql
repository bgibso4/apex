-- ============================================================
-- Health API — D1 Schema
-- ============================================================

-- Workout data (from APEX)

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  program_id INTEGER,
  program_name TEXT,
  name TEXT,
  block_name TEXT,
  week_number INTEGER,
  day_index INTEGER,
  scheduled_day INTEGER,
  actual_day INTEGER,
  date TEXT NOT NULL,
  status TEXT,
  started_at TEXT,
  completed_at TEXT,
  sleep INTEGER,
  soreness INTEGER,
  energy INTEGER,
  notes TEXT,
  updated_at TEXT NOT NULL,
  source_app TEXT DEFAULT 'apex'
);

CREATE TABLE set_logs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  exercise_id INTEGER,
  exercise_name TEXT NOT NULL,
  set_number INTEGER,
  target_weight REAL,
  actual_weight REAL,
  target_reps INTEGER,
  actual_reps INTEGER,
  target_distance REAL,
  actual_distance REAL,
  target_duration REAL,
  actual_duration REAL,
  target_time REAL,
  actual_time REAL,
  status TEXT,
  rpe REAL,
  timestamp TEXT,
  is_adhoc INTEGER DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE exercise_notes (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  muscle_groups TEXT,
  alternatives TEXT,
  input_fields TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE programs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT,
  duration_weeks INTEGER,
  definition_json TEXT,
  one_rm_values TEXT,
  started_at TEXT,
  completed_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE run_logs (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  date TEXT NOT NULL,
  duration_min REAL,
  distance REAL,
  pain_level INTEGER,
  pain_level_24h INTEGER,
  included_pickups INTEGER DEFAULT 0,
  notes TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE personal_records (
  id TEXT PRIMARY KEY,
  exercise_id TEXT NOT NULL,
  record_type TEXT NOT NULL,
  rep_count INTEGER,
  value REAL NOT NULL,
  previous_value REAL,
  session_id TEXT NOT NULL,
  date TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE session_protocols (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  type TEXT NOT NULL,
  protocol_key TEXT,
  protocol_name TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  updated_at TEXT NOT NULL
);

-- Health data (from APEX / WHOOP)

CREATE TABLE daily_health (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  recovery_score REAL,
  sleep_score REAL,
  hrv_rmssd REAL,
  resting_hr REAL,
  strain_score REAL,
  sleep_duration_min INTEGER,
  spo2 REAL,
  skin_temp_celsius REAL,
  respiratory_rate REAL,
  synced_at TEXT,
  updated_at TEXT NOT NULL
);

-- Weight / Body Comp (from future weight app)

CREATE TABLE body_weights (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  weight REAL NOT NULL,
  unit TEXT DEFAULT 'lbs',
  updated_at TEXT NOT NULL
);

CREATE TABLE body_comp_scans (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  weight REAL,
  skeletal_muscle_mass REAL,
  body_fat_percent REAL,
  bmi REAL,
  body_water_percent REAL,
  notes TEXT,
  updated_at TEXT NOT NULL
);

-- Sync tracking

CREATE TABLE sync_log (
  app_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  last_synced_at TEXT NOT NULL,
  rows_synced INTEGER,
  PRIMARY KEY (app_id, table_name)
);

-- Indexes

CREATE INDEX idx_sessions_date ON sessions(date);
CREATE INDEX idx_sessions_updated ON sessions(updated_at);
CREATE INDEX idx_set_logs_session ON set_logs(session_id);
CREATE INDEX idx_set_logs_updated ON set_logs(updated_at);
CREATE INDEX idx_exercises_updated ON exercises(updated_at);
CREATE INDEX idx_programs_updated ON programs(updated_at);
CREATE INDEX idx_run_logs_date ON run_logs(date);
CREATE INDEX idx_run_logs_updated ON run_logs(updated_at);
CREATE INDEX idx_personal_records_exercise ON personal_records(exercise_id);
CREATE INDEX idx_personal_records_date ON personal_records(date);
CREATE INDEX idx_personal_records_updated ON personal_records(updated_at);
CREATE INDEX idx_daily_health_date ON daily_health(date);
CREATE INDEX idx_daily_health_updated ON daily_health(updated_at);
CREATE INDEX idx_body_weights_date ON body_weights(date);
CREATE INDEX idx_body_weights_updated ON body_weights(updated_at);
CREATE INDEX idx_body_comp_scans_date ON body_comp_scans(date);
CREATE INDEX idx_body_comp_scans_updated ON body_comp_scans(updated_at);
CREATE INDEX idx_exercise_notes_session ON exercise_notes(session_id);
CREATE INDEX idx_exercise_notes_updated ON exercise_notes(updated_at);
CREATE INDEX idx_session_protocols_session ON session_protocols(session_id);
CREATE INDEX idx_session_protocols_updated ON session_protocols(updated_at);
