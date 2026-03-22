export const ALLOWED_TABLES = {
  sessions: {
    columns: ['id', 'program_id', 'program_name', 'name', 'block_name',
              'week_number', 'day_index', 'scheduled_day', 'actual_day',
              'date', 'status', 'started_at', 'completed_at', 'sleep',
              'soreness', 'energy', 'notes', 'updated_at', 'source_app'],
    required: ['id', 'date', 'updated_at'],
  },
  set_logs: {
    columns: ['id', 'session_id', 'exercise_id', 'exercise_name', 'set_number',
              'target_weight', 'actual_weight', 'target_reps', 'actual_reps',
              'target_distance', 'actual_distance', 'target_duration', 'actual_duration',
              'target_time', 'actual_time', 'status', 'rpe', 'timestamp',
              'is_adhoc', 'updated_at'],
    required: ['id', 'session_id', 'exercise_name', 'updated_at'],
  },
  exercise_notes: {
    columns: ['id', 'session_id', 'exercise_id', 'note', 'created_at', 'updated_at'],
    required: ['id', 'session_id', 'exercise_id', 'updated_at'],
  },
  exercises: {
    columns: ['id', 'name', 'type', 'muscle_groups', 'alternatives', 'input_fields', 'updated_at'],
    required: ['id', 'name', 'updated_at'],
  },
  programs: {
    columns: ['id', 'name', 'status', 'duration_weeks', 'definition_json',
              'one_rm_values', 'started_at', 'completed_at', 'updated_at'],
    required: ['id', 'name', 'updated_at'],
  },
  run_logs: {
    columns: ['id', 'session_id', 'date', 'duration_min', 'distance',
              'pain_level', 'pain_level_24h', 'included_pickups', 'notes', 'updated_at'],
    required: ['id', 'date', 'updated_at'],
  },
  personal_records: {
    columns: ['id', 'exercise_id', 'record_type', 'rep_count', 'value',
              'previous_value', 'session_id', 'date', 'updated_at'],
    required: ['id', 'exercise_id', 'record_type', 'value', 'session_id', 'date', 'updated_at'],
  },
  session_protocols: {
    columns: ['id', 'session_id', 'type', 'protocol_key', 'protocol_name',
              'completed', 'sort_order', 'updated_at'],
    required: ['id', 'session_id', 'type', 'protocol_name', 'updated_at'],
  },
  daily_health: {
    columns: ['id', 'date', 'source', 'recovery_score', 'sleep_score',
              'hrv_rmssd', 'resting_hr', 'strain_score', 'sleep_duration_min',
              'spo2', 'skin_temp_celsius', 'respiratory_rate', 'synced_at', 'updated_at'],
    required: ['id', 'date', 'source', 'updated_at'],
  },
  body_weights: {
    columns: ['id', 'date', 'weight', 'unit', 'updated_at'],
    required: ['id', 'date', 'weight', 'updated_at'],
  },
  body_comp_scans: {
    columns: ['id', 'date', 'weight', 'skeletal_muscle_mass', 'body_fat_percent',
              'bmi', 'body_water_percent', 'notes', 'updated_at'],
    required: ['id', 'date', 'updated_at'],
  },
} as const;

export type TableName = keyof typeof ALLOWED_TABLES;

export function isAllowedTable(name: string): name is TableName {
  return name in ALLOWED_TABLES;
}

export function validateRecords(
  table: TableName,
  records: Record<string, unknown>[]
): { valid: true } | { valid: false; error: string } {
  const { required } = ALLOWED_TABLES[table];
  for (let i = 0; i < records.length; i++) {
    for (const col of required) {
      if (records[i][col] === undefined || records[i][col] === null) {
        return { valid: false, error: `Missing required column: ${col} in records[${i}]` };
      }
    }
  }
  return { valid: true };
}

export function sanitizeRecord(
  table: TableName,
  record: Record<string, unknown>
): Record<string, unknown> {
  const { columns } = ALLOWED_TABLES[table];
  const sanitized: Record<string, unknown> = {};
  for (const col of columns) {
    if (record[col] !== undefined) {
      sanitized[col] = record[col];
    }
  }
  return sanitized;
}
