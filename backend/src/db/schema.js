/**
 * Database schema initialization.
 */
import { getPool } from './pool.js';

export async function initSchema() {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text NOT NULL UNIQUE,
        password_hash text,
        name text NOT NULL,
        role text NOT NULL CHECK (role IN ('admin', 'user')) DEFAULT 'user',
        auth_provider text NOT NULL DEFAULT 'email',
        provider_id text,
        created_at timestamptz DEFAULT now()
      );
    `);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider text DEFAULT 'email';`).catch(() => {});
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id text;`).catch(() => {});
    await client.query(`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;`).catch(() => {});
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_provider_provider_id
      ON users (auth_provider, provider_id) WHERE provider_id IS NOT NULL;
    `).catch(() => {});
    await client.query(`UPDATE users SET auth_provider = 'email' WHERE auth_provider IS NULL;`).catch(() => {});
    await client.query(`
      CREATE TABLE IF NOT EXISTS schedule_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        start_time text NOT NULL,
        end_time text NOT NULL,
        category text NOT NULL,
        emoji text,
        "order" int NOT NULL DEFAULT 0,
        is_active boolean NOT NULL DEFAULT true,
        group_id text,
        user_id uuid REFERENCES users(id),
        created_at timestamptz DEFAULT now()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        date date NOT NULL,
        type text NOT NULL CHECK (type IN ('income', 'expense')),
        amount numeric NOT NULL,
        category text NOT NULL,
        description text,
        is_recurring boolean NOT NULL DEFAULT false,
        group_id text,
        user_id uuid REFERENCES users(id),
        created_at timestamptz DEFAULT now()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS goals (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        type text NOT NULL,
        target numeric NOT NULL,
        period text NOT NULL,
        user_id uuid REFERENCES users(id),
        created_at timestamptz DEFAULT now()
      );
    `);
    await client.query(`
      ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id);
    `).catch(() => {});
    await client.query(`
      ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS recurrence text;
    `).catch(() => {});
    await client.query(`
      ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS color text;
    `).catch(() => {});
    await client.query(`
      ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS date date NOT NULL DEFAULT CURRENT_DATE;
    `).catch(() => {});
    await client.query(`
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id);
    `).catch(() => {});
    await client.query(`
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';
    `).catch(() => {});
    await client.query(`
      ALTER TABLE goals ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id);
    `).catch(() => {});

    await client.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        description text,
        type text NOT NULL,
        created_at timestamptz DEFAULT now(),
        created_by uuid REFERENCES users(id)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS group_members (
        group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id),
        role text NOT NULL CHECK (role IN ('admin', 'member')),
        joined_at timestamptz DEFAULT now(),
        PRIMARY KEY (group_id, user_id)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
    `).catch(() => {});
    await client.query(`
      CREATE TABLE IF NOT EXISTS group_invitations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        email text NOT NULL,
        invited_by_user_id uuid NOT NULL REFERENCES users(id),
        invited_at timestamptz DEFAULT now()
      );
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_group_invitations_group_email
      ON group_invitations (group_id, lower(email));
    `).catch(() => {});

    await client.query(`
      CREATE TABLE IF NOT EXISTS workouts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id),
        date date NOT NULL,
        title text NOT NULL,
        type text NOT NULL CHECK (type IN ('strength', 'cardio', 'flexibility', 'sports')),
        duration_minutes int NOT NULL,
        exercises jsonb NOT NULL DEFAULT '[]',
        notes text,
        created_at timestamptz DEFAULT now()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS food_entries (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id),
        date date NOT NULL,
        name text NOT NULL,
        calories numeric NOT NULL,
        protein numeric NOT NULL,
        carbs numeric NOT NULL,
        fats numeric NOT NULL,
        created_at timestamptz DEFAULT now()
      );
    `);
    await client.query(`ALTER TABLE food_entries ADD COLUMN IF NOT EXISTS portion_amount numeric;`).catch(() => {});
    await client.query(`ALTER TABLE food_entries ADD COLUMN IF NOT EXISTS portion_unit text;`).catch(() => {});
    await client.query(`ALTER TABLE food_entries ADD COLUMN IF NOT EXISTS serving_type text;`).catch(() => {});
    await client.query(`ALTER TABLE food_entries ADD COLUMN IF NOT EXISTS start_time text;`).catch(() => {});
    await client.query(`ALTER TABLE food_entries ADD COLUMN IF NOT EXISTS end_time text;`).catch(() => {});
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_check_ins (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id),
        date date NOT NULL,
        sleep_hours numeric,
        created_at timestamptz DEFAULT now()
      );
    `);
    await client.query(`DROP TABLE IF EXISTS foundation_foods;`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS foods (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        calories numeric NOT NULL,
        protein numeric NOT NULL,
        carbs numeric NOT NULL,
        fat numeric NOT NULL,
        created_at timestamptz DEFAULT now()
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_foods_name_lower
      ON foods (lower(name));
    `);
    await client.query(`ALTER TABLE foods ADD COLUMN IF NOT EXISTS is_liquid boolean DEFAULT false;`).catch(() => {});
    await client.query(`ALTER TABLE foods ADD COLUMN IF NOT EXISTS serving_sizes_ml jsonb;`).catch(() => {});
    await client.query(`ALTER TABLE foods ADD COLUMN IF NOT EXISTS preparation text DEFAULT 'cooked';`).catch(() => {});
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        level text NOT NULL CHECK (level IN ('action', 'error')),
        message text NOT NULL,
        details jsonb,
        user_id uuid REFERENCES users(id),
        created_at timestamptz DEFAULT now()
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_app_logs_level_created_at
      ON app_logs (level, created_at DESC);
    `).catch(() => {});

    await client.query(`CREATE INDEX IF NOT EXISTS idx_schedule_items_user_date ON schedule_items(user_id, date);`).catch(() => {});
    await client.query(`CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);`).catch(() => {});
    await client.query(`CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);`).catch(() => {});
    await client.query(`CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(user_id, date DESC);`).catch(() => {});
    await client.query(`CREATE INDEX IF NOT EXISTS idx_food_entries_user_date ON food_entries(user_id, date DESC);`).catch(() => {});
    await client.query(`CREATE INDEX IF NOT EXISTS idx_daily_check_ins_user_date ON daily_check_ins(user_id, date DESC);`).catch(() => {});

    // Password reset columns
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_hash text;`).catch(() => {});
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires timestamptz;`).catch(() => {});

    // updated_at columns for key tables
    await client.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();`).catch(() => {});
    await client.query(`ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();`).catch(() => {});
    await client.query(`ALTER TABLE workouts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();`).catch(() => {});
    await client.query(`ALTER TABLE food_entries ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();`).catch(() => {});
    await client.query(`ALTER TABLE goals ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();`).catch(() => {});

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
