/**
 * Add indexes for user-scoped queries (Update 11).
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_provider_provider_id ON users (auth_provider, provider_id) WHERE provider_id IS NOT NULL;`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);`);
  pgm.sql(`CREATE UNIQUE INDEX IF NOT EXISTS idx_group_invitations_group_email ON group_invitations (group_id, lower(email));`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_foods_name_lower ON foods (lower(name));`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_app_logs_level_created_at ON app_logs (level, created_at DESC);`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_schedule_items_user_date ON schedule_items(user_id, date);`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(user_id, date DESC);`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_food_entries_user_date ON food_entries(user_id, date DESC);`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_daily_check_ins_user_date ON daily_check_ins(user_id, date DESC);`);
};

export const down = false;
