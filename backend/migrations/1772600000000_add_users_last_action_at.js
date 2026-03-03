/**
 * Add last_action_at to users for insights refresh optimization.
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_action_at timestamptz;`);
};

export const down = (pgm) => {
  pgm.sql(`ALTER TABLE users DROP COLUMN IF EXISTS last_action_at;`);
};
