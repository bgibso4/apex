export interface Env {
  WHOOP_CLIENT_ID: string;
  WHOOP_CLIENT_SECRET: string;
  WHOOP_TOKEN_URL: string;
  APP_API_KEY: string;
  SENTRY_DSN: string;
  DB: D1Database;
}

export interface SyncPushRequest {
  app_id: string;
  records: Record<string, unknown>[];
}

export interface SyncPushResponse {
  synced: number;
  errors: number;
}

export interface SyncPullResponse {
  records: Record<string, unknown>[];
  total: number;
  has_more: boolean;
}
