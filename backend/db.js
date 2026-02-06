import pg from 'pg';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
let pool = null;

export function getPool() {
  if (!pool) {
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL is not set. Backend data API and MCP require a database.');
    }
    const connectionStringNoQuery = DATABASE_URL.split('?')[0];
    pool = new Pool({
      connectionString: connectionStringNoQuery,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function initSchema() {
  const client = await getPool().connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        name text NOT NULL,
        role text NOT NULL CHECK (role IN ('admin', 'user')) DEFAULT 'user',
        created_at timestamptz DEFAULT now()
      );
    `);
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
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id);
    `).catch(() => {});
    await client.query(`
      ALTER TABLE goals ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id);
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
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_check_ins (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id),
        date date NOT NULL,
        sleep_hours numeric,
        created_at timestamptz DEFAULT now()
      );
    `);
  } finally {
    client.release();
  }
}

export function isDbConfigured() {
  return !!DATABASE_URL;
}
