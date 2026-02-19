/**
 * Baseline migration: creates core tables. Matches backend/src/db/schema.js.
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
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
  pgm.sql(`
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
      date date NOT NULL DEFAULT CURRENT_DATE,
      recurrence text,
      color text,
      created_at timestamptz DEFAULT now()
    );
  `);
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS transactions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      date date NOT NULL,
      type text NOT NULL CHECK (type IN ('income', 'expense')),
      amount numeric NOT NULL,
      category text NOT NULL,
      description text,
      is_recurring boolean NOT NULL DEFAULT false,
      group_id text,
      currency text NOT NULL DEFAULT 'USD',
      user_id uuid REFERENCES users(id),
      created_at timestamptz DEFAULT now()
    );
  `);
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS goals (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      type text NOT NULL,
      target numeric NOT NULL,
      period text NOT NULL,
      user_id uuid REFERENCES users(id),
      created_at timestamptz DEFAULT now()
    );
  `);
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS groups (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      description text,
      type text NOT NULL,
      created_at timestamptz DEFAULT now(),
      created_by uuid REFERENCES users(id)
    );
  `);
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS group_members (
      group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id),
      role text NOT NULL CHECK (role IN ('admin', 'member')),
      joined_at timestamptz DEFAULT now(),
      PRIMARY KEY (group_id, user_id)
    );
  `);
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS group_invitations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      email text NOT NULL,
      invited_by_user_id uuid NOT NULL REFERENCES users(id),
      invited_at timestamptz DEFAULT now()
    );
  `);
  pgm.sql(`
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
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS food_entries (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id),
      date date NOT NULL,
      name text NOT NULL,
      calories numeric NOT NULL,
      protein numeric NOT NULL,
      carbs numeric NOT NULL,
      fats numeric NOT NULL,
      portion_amount numeric,
      portion_unit text,
      serving_type text,
      start_time text,
      end_time text,
      created_at timestamptz DEFAULT now()
    );
  `);
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS daily_check_ins (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id),
      date date NOT NULL,
      sleep_hours numeric,
      created_at timestamptz DEFAULT now()
    );
  `);
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS foods (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      calories numeric NOT NULL,
      protein numeric NOT NULL,
      carbs numeric NOT NULL,
      fat numeric NOT NULL,
      is_liquid boolean DEFAULT false,
      serving_sizes_ml jsonb,
      preparation text DEFAULT 'cooked',
      created_at timestamptz DEFAULT now()
    );
  `);
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS app_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      level text NOT NULL CHECK (level IN ('action', 'error')),
      message text NOT NULL,
      details jsonb,
      user_id uuid REFERENCES users(id),
      created_at timestamptz DEFAULT now()
    );
  `);
};

export const down = false;
