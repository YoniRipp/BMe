/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Add Stripe subscription columns to users table.
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id text;`);
  pgm.sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'free';`);
  pgm.sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id text;`);
  pgm.sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamptz;`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;`);
};

export const down = false;
