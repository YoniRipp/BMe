/**
 * Creates user_activity_log for admin activity feed.
 * UNIQUE on event_id for idempotency (replay-safe).
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS user_activity_log (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES users(id),
      event_type text NOT NULL,
      event_id text NOT NULL UNIQUE,
      summary text NOT NULL,
      payload jsonb,
      created_at timestamptz DEFAULT now()
    );
  `);
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_created
    ON user_activity_log (user_id, created_at DESC);
  `);
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_user_activity_log_created
    ON user_activity_log (created_at DESC, id);
  `);
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_user_activity_log_event_type_created
    ON user_activity_log (event_type, created_at DESC);
  `);
};

export const down = false;
