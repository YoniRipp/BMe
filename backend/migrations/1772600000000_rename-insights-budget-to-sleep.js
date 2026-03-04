exports.up = (pgm) => {
  pgm.sql('ALTER TABLE ai_insights RENAME COLUMN today_budget TO today_sleep');
};

exports.down = (pgm) => {
  pgm.sql('ALTER TABLE ai_insights RENAME COLUMN today_sleep TO today_budget');
};
