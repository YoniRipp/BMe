/**
 * Migration: creates user_activity_log table for per-user observability.
 * Each row represents one domain event attributed to a user (login, transaction, workout, etc.).
 * event_id UNIQUE enforces idempotency — replaying events is safe.
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS user_activity_log (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     TEXT        NOT NULL,
      event_type  TEXT        NOT NULL,
      event_id    TEXT        NOT NULL UNIQUE,
      summary     TEXT        NOT NULL,
      payload     JSONB,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_ual_user_time
      ON user_activity_log(user_id, created_at DESC);
  `);
};

export const down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS user_activity_log;`);
};
