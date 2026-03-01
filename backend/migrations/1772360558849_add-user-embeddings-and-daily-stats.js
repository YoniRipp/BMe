/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Creates user_embeddings (pgvector) and user_daily_stats.
 * Note: user_embeddings requires the pgvector extension; migration fails if not installed.
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.sql(`CREATE EXTENSION IF NOT EXISTS vector;`);
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS user_embeddings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      record_type text NOT NULL,
      record_id text NOT NULL,
      content_text text NOT NULL,
      embedding vector(768),
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      UNIQUE (record_id, record_type)
    );
  `);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_user_embeddings_user_type ON user_embeddings (user_id, record_type);`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_user_embeddings_hnsw ON user_embeddings USING hnsw (embedding vector_cosine_ops);`);

  pgm.sql(`
    CREATE TABLE IF NOT EXISTS user_daily_stats (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date date NOT NULL,
      total_calories numeric DEFAULT 0,
      total_income numeric DEFAULT 0,
      total_expenses numeric DEFAULT 0,
      workout_count int DEFAULT 0,
      sleep_hours numeric,
      updated_at timestamptz DEFAULT now(),
      UNIQUE (user_id, date)
    );
  `);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_user_daily_stats_user_date ON user_daily_stats (user_id, date DESC);`);
};

export const down = false;

