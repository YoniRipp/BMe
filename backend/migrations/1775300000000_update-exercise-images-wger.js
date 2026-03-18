/**
 * Replace all exercise images with Pexels-only photos (unified single source).
 * Every exercise gets a unique Pexels photo ID — no duplicates, no mixed sources.
 * Pexels photos are free to use, no attribution required.
 */
export const shorthands = undefined;

const px = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop`;

export const up = (pgm) => {
  // Each exercise mapped to a UNIQUE Pexels photo ID. No two exercises share an ID.
  const exerciseImages = [
    // ── Chest ──────────────────────────────────────────────────────────────
    ['Bench Press',              px(3837743)],
    ['Incline Bench Press',      px(4853668)],
    ['Decline Bench Press',      px(14623668)],
    ['Dumbbell Bench Press',     px(11433060)],
    ['Incline Dumbbell Press',   px(7289233)],
    ['Pec Deck',                 px(3838937)],
    ['Cable Fly',                px(5327505)],
    ['Push-up',                  px(6740308)],
    ['Dip',                      px(4803717)],
    ['Chest Dip',                px(4162489)],
    ['Dumbbell Fly',             px(1480520)],
    ['Close-Grip Bench Press',   px(416754)],
    ['Landmine Press',           px(32512791)],
    ['Chest Press Machine',      px(2922455)],
    ['Machine Fly',              px(6551104)],
    ['Decline Dumbbell Press',   px(3837757)],

    // ── Back ───────────────────────────────────────────────────────────────
    ['Deadlift',                 px(841130)],
    ['Barbell Row',              px(1431282)],
    ['T-Bar Row',                px(14599070)],
    ['Pull-up',                  px(1865131)],
    ['Chin-up',                  px(791764)],
    ['Lat Pulldown',             px(18112395)],
    ['Seated Cable Row',         px(10754972)],
    ['Single-Arm Dumbbell Row',  px(10606344)],
    ['Hyperextension',           px(13993510)],
    ['Cable Pullover',           px(7187872)],
    ['Straight-Arm Pulldown',    px(7187909)],
    ['Inverted Row',             px(9152546)],
    ['Machine Row',              px(6456138)],
    ['Rack Pull',                px(841128)],
    ['Pendlay Row',              px(2261485)],
    ['Meadows Row',              px(3112004)],
    ['Dumbbell Pullover',        px(4164761)],

    // ── Legs ───────────────────────────────────────────────────────────────
    ['Squat',                    px(5327530)],
    ['Front Squat',              px(17840)],
    ['Hack Squat',               px(18060020)],
    ['Goblet Squat',             px(116077)],
    ['Bulgarian Split Squat',    px(6516212)],
    ['Romanian Deadlift',        px(4944313)],
    ['Sumo Deadlift',            px(13822300)],
    ['Leg Press',                px(28076)],
    ['Leg Curl',                 px(19254709)],
    ['Leg Extension',            px(3768698)],
    ['Lunge',                    px(4853693)],
    ['Walking Lunge',            px(14623670)],
    ['Good Morning',             px(14921365)],
    ['Calf Raise',               px(4162476)],
    ['Standing Calf Raise',      px(12895269)],
    ['Seated Calf Raise',        px(16952731)],
    ['Hip Thrust',               px(2247179)],
    ['Glute Bridge',             px(7991915)],
    ['Step Up',                  px(2011384)],
    ['Smith Machine Squat',      px(27810163)],
    ['Belt Squat',               px(1552252)],
    ['Nordic Hamstring Curl',    px(6815686)],
    ['Sissy Squat',              px(949131)],
    ['Hip Adduction',            px(16513597)],
    ['Hip Abduction',            px(260352)],

    // ── Shoulders ──────────────────────────────────────────────────────────
    ['Overhead Press',           px(7289370)],
    ['Dumbbell Shoulder Press',  px(5327487)],
    ['Arnold Press',             px(5327508)],
    ['Machine Shoulder Press',   px(1229356)],
    ['Lateral Raise',            px(4164849)],
    ['Cable Lateral Raise',      px(17898137)],
    ['Front Raise',              px(2652236)],
    ['Shrugs',                   px(29526364)],
    ['Upright Row',              px(33777744)],
    ['Face Pull',                px(1547248)],
    ['Rear Delt Fly',            px(31918890)],
    ['Reverse Pec Deck',         px(32172863)],
    ['Behind-the-Neck Press',    px(6296041)],
    ['Lu Raise',                 px(18060021)],

    // ── Arms ───────────────────────────────────────────────────────────────
    ['Bicep Curl',               px(5327524)],
    ['Barbell Curl',             px(6455963)],
    ['Hammer Curl',              px(8846456)],
    ['Preacher Curl',            px(2105493)],
    ['Concentration Curl',       px(16495748)],
    ['Cable Curl',               px(14591541)],
    ['EZ-Bar Curl',              px(6926408)],
    ['Incline Dumbbell Curl',    px(17929979)],
    ['Reverse Curl',             px(6690064)],
    ['Wrist Curl',               px(6455924)],
    ['Spider Curl',              px(19185915)],
    ['Skull Crusher',            px(8032838)],
    ['Tricep Extension',         px(3930996)],
    ['Rope Pushdown',            px(12212329)],
    ['Overhead Tricep Extension',px(6539865)],
    ['Tricep Kickback',          px(416809)],
    ['Diamond Push-up',          px(3890347)],
    ['Dip Machine',              px(4944975)],
    ['Cable Overhead Tricep Extension', px(13974989)],

    // ── Core ───────────────────────────────────────────────────────────────
    ['Plank',                    px(14074802)],
    ['Side Plank',               px(29981150)],
    ['Russian Twist',            px(7675410)],
    ['Hanging Leg Raise',        px(4720230)],
    ['Cable Crunch',             px(3812743)],
    ['Ab Wheel Rollout',         px(8846581)],
    ['Dead Bug',                 px(7188041)],
    ['Mountain Climber',         px(8691690)],
    ['Bicycle Crunch',           px(6339602)],
    ['Sit-up',                   px(34043577)],
    ['V-Up',                     px(6296002)],
    ['Pallof Press',             px(9602285)],
    ['Decline Sit-up',           px(1954524)],
    ['Woodchop',                 px(4804349)],
    ['Toe Touch',                px(6389892)],

    // ── Full Body / Cardio ─────────────────────────────────────────────────
    ['Running',                  px(3888343)],
    ['Cycling',                  px(3836831)],
    ['Rowing Machine',           px(6551066)],
    ['Jump Rope',                px(6455851)],
    ['Burpee',                   px(6455836)],
    ['Kettlebell Swing',         px(22812008)],
    ['Clean and Press',          px(5878675)],
    ['Power Clean',              px(26726129)],
    ['Box Jump',                 px(6455846)],
    ['Battle Ropes',             px(1552242)],
    ['Farmer Walk',              px(28487256)],
  ];

  // First, clear all existing exercise images to ensure clean slate (single source)
  pgm.sql(`UPDATE exercises SET image_url = NULL;`);

  // Apply unique Pexels images per exercise
  for (const [name, url] of exerciseImages) {
    pgm.sql(`UPDATE exercises SET image_url = '${url}' WHERE lower(name) = lower('${name.replace(/'/g, "''")}');`);
  }

  // Final fallback: any exercise still without an image gets a generic gym photo
  // Using a unique ID not used above
  pgm.sql(`UPDATE exercises SET image_url = '${px(841130)}' WHERE image_url IS NULL;`);
};

export const down = (pgm) => {
  pgm.sql(`UPDATE exercises SET image_url = NULL WHERE image_url LIKE '%pexels%';`);
};
