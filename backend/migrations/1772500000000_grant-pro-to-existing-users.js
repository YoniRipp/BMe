/**
 * Grants Pro subscription status to all existing users.
 * One-time migration: users who signed up before payment integration get Pro for free.
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.sql(`
    UPDATE users
    SET subscription_status = 'pro'
    WHERE subscription_status IS NULL OR subscription_status != 'pro';
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    UPDATE users
    SET subscription_status = 'free'
    WHERE subscription_status = 'pro'
      AND ls_customer_id IS NULL
      AND ls_subscription_id IS NULL;
  `);
};
