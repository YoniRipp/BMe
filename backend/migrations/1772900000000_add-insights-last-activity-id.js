/**
 * Add last_activity_id to ai_insights — links each insight to the activity
 * log entry it was generated against for cache invalidation.
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS last_activity_id uuid;`);
};

export const down = (pgm) => {
  pgm.sql(`ALTER TABLE ai_insights DROP COLUMN IF EXISTS last_activity_id;`);
};
