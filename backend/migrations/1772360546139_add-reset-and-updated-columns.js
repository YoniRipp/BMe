/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Add password reset columns to users and updated_at to key tables.
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_hash text;`);
  pgm.sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires timestamptz;`);
  pgm.sql(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();`);
  pgm.sql(`ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();`);
  pgm.sql(`ALTER TABLE workouts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();`);
  pgm.sql(`ALTER TABLE food_entries ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();`);
  pgm.sql(`ALTER TABLE goals ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();`);
};

export const down = false;

