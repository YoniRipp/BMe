/**
 * Add health sync tables and source/external_id columns to existing tables.
 * Supports syncing data from Apple Health (HealthKit) and Google Health Connect.
 */
export const shorthands = undefined;

export const up = (pgm) => {
  // Health sync state — tracks per-user sync progress per data type
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS health_sync_state (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      platform text NOT NULL CHECK (platform IN ('apple_health', 'health_connect')),
      data_type text NOT NULL,
      last_synced_at timestamptz NOT NULL DEFAULT now(),
      enabled boolean DEFAULT true,
      created_at timestamptz DEFAULT now(),
      UNIQUE (user_id, platform, data_type)
    );
  `);

  // Health metrics — steps, heart rate, calories burned (data that doesn't fit existing tables)
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS health_metrics (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date date NOT NULL,
      metric_type text NOT NULL CHECK (metric_type IN ('steps', 'heart_rate_avg', 'heart_rate_resting', 'active_calories', 'total_calories_burned')),
      value numeric NOT NULL,
      source text NOT NULL DEFAULT 'manual',
      external_id text,
      created_at timestamptz DEFAULT now(),
      UNIQUE (user_id, date, metric_type, source)
    );
  `);

  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_health_metrics_user_date ON health_metrics (user_id, date DESC);`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_health_sync_state_user ON health_sync_state (user_id);`);

  // Add source and external_id to existing tables for deduplication
  pgm.sql(`ALTER TABLE workouts ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';`);
  pgm.sql(`ALTER TABLE workouts ADD COLUMN IF NOT EXISTS external_id text;`);
  pgm.sql(`ALTER TABLE food_entries ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';`);
  pgm.sql(`ALTER TABLE food_entries ADD COLUMN IF NOT EXISTS external_id text;`);
  pgm.sql(`ALTER TABLE daily_check_ins ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';`);
  pgm.sql(`ALTER TABLE daily_check_ins ADD COLUMN IF NOT EXISTS external_id text;`);
};

export const down = (pgm) => {
  pgm.sql(`ALTER TABLE daily_check_ins DROP COLUMN IF EXISTS external_id;`);
  pgm.sql(`ALTER TABLE daily_check_ins DROP COLUMN IF EXISTS source;`);
  pgm.sql(`ALTER TABLE food_entries DROP COLUMN IF EXISTS external_id;`);
  pgm.sql(`ALTER TABLE food_entries DROP COLUMN IF EXISTS source;`);
  pgm.sql(`ALTER TABLE workouts DROP COLUMN IF EXISTS external_id;`);
  pgm.sql(`ALTER TABLE workouts DROP COLUMN IF EXISTS source;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_health_sync_state_user;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_health_metrics_user_date;`);
  pgm.sql(`DROP TABLE IF EXISTS health_metrics;`);
  pgm.sql(`DROP TABLE IF EXISTS health_sync_state;`);
};
