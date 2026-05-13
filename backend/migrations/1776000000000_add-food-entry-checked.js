export const up = (pgm) => {
  pgm.sql("ALTER TABLE food_entries ADD COLUMN IF NOT EXISTS checked boolean NOT NULL DEFAULT false");
};

export const down = (pgm) => {
  pgm.sql("ALTER TABLE food_entries DROP COLUMN IF EXISTS checked");
};
