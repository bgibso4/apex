// src/types/health.ts

/**
 * Vendor-agnostic daily health data.
 * All metrics are optional — different providers supply different fields.
 */
export interface DailyHealthData {
  date: string;             // 'YYYY-MM-DD'
  source: string;           // 'whoop', 'garmin', 'manual'

  // Core metrics
  recoveryScore?: number;   // 0-100
  sleepScore?: number;      // provider's sleep quality score
  hrvRmssd?: number;        // HRV in ms (RMSSD method)
  restingHr?: number;       // bpm

  // Secondary metrics
  strainScore?: number;     // 0-21 (Whoop scale)
  sleepDurationMin?: number;// total sleep in minutes
  spo2?: number;            // blood oxygen percentage (0-100)
  skinTempCelsius?: number; // skin temperature
  respiratoryRate?: number; // breaths per minute

  // Metadata
  rawJson?: string;         // full API response for future use
  syncedAt: string;         // ISO timestamp
}

/**
 * Stored row from daily_health table.
 */
export interface DailyHealthRow extends DailyHealthData {
  id: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Vendor-agnostic health data provider.
 * Whoop is the first implementation; Garmin, Oura, etc. can follow.
 */
export interface HealthProvider {
  id: string;               // 'whoop', 'garmin'
  name: string;             // 'WHOOP', 'Garmin'

  // Auth
  authorize(): Promise<void>;
  isConnected(): Promise<boolean>;
  disconnect(): Promise<void>;

  // Data
  fetchDaily(date: string): Promise<DailyHealthData | null>;
  fetchRange(start: string, end: string): Promise<DailyHealthData[]>;
}

/**
 * Whoop API response types (for type-safe parsing).
 */
export interface WhoopCycleResponse {
  id: number;
  user_id: number;
  start: string;
  end: string;
  score: {
    strain: number;
    kilojoule: number;
    average_heart_rate: number;
    max_heart_rate: number;
  } | null;
}

export interface WhoopRecoveryResponse {
  cycle_id: number;
  sleep_id: number;
  user_id: number;
  score_state: 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE';
  score: {
    user_calibrating: boolean;
    recovery_score: number;
    resting_heart_rate: number;
    hrv_rmssd_milli: number;
    spo2_percentage: number;
    skin_temp_celsius: number;
  } | null;
}

export interface WhoopSleepResponse {
  id: number;
  user_id: number;
  start: string;
  end: string;
  score_state: 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE';
  score: {
    sleep_performance_percentage: number;
    respiratory_rate: number;
    total_in_bed_time_milli: number;
    total_awake_time_milli: number;
    total_light_sleep_time_milli: number;
    total_slow_wave_sleep_time_milli: number;
    total_rem_sleep_time_milli: number;
    sleep_cycle_count: number;
    disturbance_count: number;
  } | null;
}

export interface WhoopTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface WhoopPaginatedResponse<T> {
  records: T[];
  next_token: string | null;
}
