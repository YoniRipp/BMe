/**
 * Update exercise images with real exercise demonstration photos from yuhonas/free-exercise-db.
 * Source: https://github.com/yuhonas/free-exercise-db (public domain, free to use)
 * Images show actual exercise form and technique — replacing generic stock photos.
 * 113 out of 118 exercises matched; 5 keep existing Pexels images (Pec Deck, Cable Pullover,
 * Hip Abduction, Woodchop, Burpee — not in the free-exercise-db dataset).
 */
export const shorthands = undefined;

const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

export const up = (pgm) => {
  const exerciseImages = [
    // ── Chest ──────────────────────────────────────────────────────────────
    ['Bench Press',              BASE + 'Barbell_Bench_Press_-_Medium_Grip/0.jpg'],
    ['Incline Bench Press',      BASE + 'Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg'],
    ['Decline Bench Press',      BASE + 'Decline_Barbell_Bench_Press/0.jpg'],
    ['Dumbbell Bench Press',     BASE + 'Dumbbell_Bench_Press/0.jpg'],
    ['Incline Dumbbell Press',   BASE + 'Incline_Dumbbell_Press/0.jpg'],
    ['Cable Fly',                BASE + 'Flat_Bench_Cable_Flyes/0.jpg'],
    ['Push-up',                  BASE + 'Pushups/0.jpg'],
    ['Dip',                      BASE + 'Bench_Dips/0.jpg'],
    ['Chest Dip',                BASE + 'Dips_-_Chest_Version/0.jpg'],
    ['Dumbbell Fly',             BASE + 'Decline_Dumbbell_Flyes/0.jpg'],
    ['Close-Grip Bench Press',   BASE + 'Smith_Machine_Close-Grip_Bench_Press/0.jpg'],
    ['Landmine Press',           BASE + 'Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg'],
    ['Chest Press Machine',      BASE + 'Cable_Chest_Press/0.jpg'],
    ['Machine Fly',              BASE + 'Reverse_Machine_Flyes/0.jpg'],
    ['Decline Dumbbell Press',   BASE + 'Decline_Dumbbell_Bench_Press/0.jpg'],

    // ── Back ───────────────────────────────────────────────────────────────
    ['Deadlift',                 BASE + 'Axle_Deadlift/0.jpg'],
    ['Barbell Row',              BASE + 'Bent_Over_Barbell_Row/0.jpg'],
    ['T-Bar Row',                BASE + 'Lying_T-Bar_Row/0.jpg'],
    ['Pull-up',                  BASE + 'Band_Assisted_Pull-Up/0.jpg'],
    ['Chin-up',                  BASE + 'Chin-Up/0.jpg'],
    ['Lat Pulldown',             BASE + 'Close-Grip_Front_Lat_Pulldown/0.jpg'],
    ['Seated Cable Row',         BASE + 'Seated_Cable_Rows/0.jpg'],
    ['Single-Arm Dumbbell Row',  BASE + 'One-Arm_Dumbbell_Row/0.jpg'],
    ['Hyperextension',           BASE + 'Hyperextensions_Back_Extensions/0.jpg'],
    ['Straight-Arm Pulldown',    BASE + 'Straight-Arm_Pulldown/0.jpg'],
    ['Inverted Row',             BASE + 'Inverted_Row/0.jpg'],
    ['Machine Row',              BASE + 'Smith_Machine_Bent_Over_Row/0.jpg'],
    ['Rack Pull',                BASE + 'Rack_Pull_with_Bands/0.jpg'],
    ['Pendlay Row',              BASE + 'Bent_Over_Barbell_Row/0.jpg'],
    ['Meadows Row',              BASE + 'One-Arm_Dumbbell_Row/0.jpg'],
    ['Dumbbell Pullover',        BASE + 'Bent-Arm_Dumbbell_Pullover/0.jpg'],

    // ── Legs ───────────────────────────────────────────────────────────────
    ['Squat',                    BASE + 'Barbell_Full_Squat/0.jpg'],
    ['Front Squat',              BASE + 'Front_Squat_Clean_Grip/0.jpg'],
    ['Hack Squat',               BASE + 'Hack_Squat/0.jpg'],
    ['Goblet Squat',             BASE + 'Goblet_Squat/0.jpg'],
    ['Bulgarian Split Squat',    BASE + 'Barbell_Side_Split_Squat/0.jpg'],
    ['Romanian Deadlift',        BASE + 'Romanian_Deadlift/0.jpg'],
    ['Sumo Deadlift',            BASE + 'Sumo_Deadlift/0.jpg'],
    ['Leg Press',                BASE + 'Leg_Press/0.jpg'],
    ['Leg Curl',                 BASE + 'Ball_Leg_Curl/0.jpg'],
    ['Leg Extension',            BASE + 'Leg_Extensions/0.jpg'],
    ['Lunge',                    BASE + 'Barbell_Lunge/0.jpg'],
    ['Walking Lunge',            BASE + 'Barbell_Walking_Lunge/0.jpg'],
    ['Good Morning',             BASE + 'Good_Morning/0.jpg'],
    ['Calf Raise',               BASE + 'Barbell_Seated_Calf_Raise/0.jpg'],
    ['Standing Calf Raise',      BASE + 'Rocking_Standing_Calf_Raise/0.jpg'],
    ['Seated Calf Raise',        BASE + 'Seated_Calf_Raise/0.jpg'],
    ['Hip Thrust',               BASE + 'Barbell_Hip_Thrust/0.jpg'],
    ['Glute Bridge',             BASE + 'Barbell_Glute_Bridge/0.jpg'],
    ['Step Up',                  BASE + 'Barbell_Step_Ups/0.jpg'],
    ['Smith Machine Squat',      BASE + 'Smith_Machine_Squat/0.jpg'],
    ['Belt Squat',               BASE + 'Barbell_Full_Squat/0.jpg'],
    ['Nordic Hamstring Curl',    BASE + 'Seated_Band_Hamstring_Curl/0.jpg'],
    ['Sissy Squat',              BASE + 'Weighted_Sissy_Squat/0.jpg'],
    ['Hip Adduction',            BASE + 'Band_Hip_Adductions/0.jpg'],

    // ── Shoulders ──────────────────────────────────────────────────────────
    ['Overhead Press',           BASE + 'Smith_Machine_Overhead_Shoulder_Press/0.jpg'],
    ['Dumbbell Shoulder Press',  BASE + 'Dumbbell_Shoulder_Press/0.jpg'],
    ['Arnold Press',             BASE + 'Kettlebell_Arnold_Press/0.jpg'],
    ['Machine Shoulder Press',   BASE + 'Machine_Shoulder_Military_Press/0.jpg'],
    ['Lateral Raise',            BASE + 'Cable_Seated_Lateral_Raise/0.jpg'],
    ['Cable Lateral Raise',      BASE + 'Cable_Seated_Lateral_Raise/0.jpg'],
    ['Front Raise',              BASE + 'Front_Raise_And_Pullover/0.jpg'],
    ['Shrugs',                   BASE + 'Cable_Shrugs/0.jpg'],
    ['Upright Row',              BASE + 'Dumbbell_One-Arm_Upright_Row/0.jpg'],
    ['Face Pull',                BASE + 'Face_Pull/0.jpg'],
    ['Rear Delt Fly',            BASE + 'Cable_Rear_Delt_Fly/0.jpg'],
    ['Reverse Pec Deck',         BASE + 'Reverse_Flyes/0.jpg'],
    ['Behind-the-Neck Press',    BASE + 'Neck_Press/0.jpg'],
    ['Lu Raise',                 BASE + 'Cable_Seated_Lateral_Raise/0.jpg'],

    // ── Arms ───────────────────────────────────────────────────────────────
    ['Bicep Curl',               BASE + 'Dumbbell_Alternate_Bicep_Curl/0.jpg'],
    ['Barbell Curl',             BASE + 'Barbell_Curl/0.jpg'],
    ['Hammer Curl',              BASE + 'Alternate_Hammer_Curl/0.jpg'],
    ['Preacher Curl',            BASE + 'Preacher_Curl/0.jpg'],
    ['Concentration Curl',       BASE + 'Concentration_Curls/0.jpg'],
    ['Cable Curl',               BASE + 'High_Cable_Curls/0.jpg'],
    ['EZ-Bar Curl',              BASE + 'EZ-Bar_Curl/0.jpg'],
    ['Incline Dumbbell Curl',    BASE + 'Incline_Dumbbell_Curl/0.jpg'],
    ['Reverse Curl',             BASE + 'Standing_Dumbbell_Reverse_Curl/0.jpg'],
    ['Wrist Curl',               BASE + 'Cable_Wrist_Curl/0.jpg'],
    ['Spider Curl',              BASE + 'Spider_Curl/0.jpg'],
    ['Skull Crusher',            BASE + 'Band_Skull_Crusher/0.jpg'],
    ['Tricep Extension',         BASE + 'Cable_One_Arm_Tricep_Extension/0.jpg'],
    ['Rope Pushdown',            BASE + 'Triceps_Pushdown_-_Rope_Attachment/0.jpg'],
    ['Overhead Tricep Extension', BASE + 'Cable_One_Arm_Tricep_Extension/0.jpg'],
    ['Tricep Kickback',          BASE + 'Tricep_Dumbbell_Kickback/0.jpg'],
    ['Diamond Push-up',          BASE + 'Close-Grip_Push-Up_off_of_a_Dumbbell/0.jpg'],
    ['Dip Machine',              BASE + 'Dip_Machine/0.jpg'],
    ['Cable Overhead Tricep Extension', BASE + 'Cable_One_Arm_Tricep_Extension/0.jpg'],

    // ── Core ───────────────────────────────────────────────────────────────
    ['Plank',                    BASE + 'Plank/0.jpg'],
    ['Side Plank',               BASE + 'Plank/0.jpg'],
    ['Russian Twist',            BASE + 'Russian_Twist/0.jpg'],
    ['Hanging Leg Raise',        BASE + 'Hanging_Leg_Raise/0.jpg'],
    ['Cable Crunch',             BASE + 'Cable_Crunch/0.jpg'],
    ['Ab Wheel Rollout',         BASE + 'Barbell_Ab_Rollout/0.jpg'],
    ['Dead Bug',                 BASE + 'Dead_Bug/0.jpg'],
    ['Mountain Climber',         BASE + 'Mountain_Climbers/0.jpg'],
    ['Bicycle Crunch',           BASE + 'Bicycling/0.jpg'],
    ['Sit-up',                   BASE + 'Sit-Up/0.jpg'],
    ['V-Up',                     BASE + '3_4_Sit-Up/0.jpg'],
    ['Pallof Press',             BASE + 'Pallof_Press/0.jpg'],
    ['Decline Sit-up',           BASE + 'Sit-Up/0.jpg'],
    ['Toe Touch',                BASE + 'Standing_Toe_Touches/0.jpg'],

    // ── Full Body / Cardio ─────────────────────────────────────────────────
    ['Running',                  BASE + 'Running_Treadmill/0.jpg'],
    ['Cycling',                  BASE + 'Bicycling/0.jpg'],
    ['Rowing Machine',           BASE + 'Rowing_Stationary/0.jpg'],
    ['Jump Rope',                BASE + 'Rope_Jumping/0.jpg'],
    ['Kettlebell Swing',         BASE + 'One-Arm_Kettlebell_Swings/0.jpg'],
    ['Clean and Press',          BASE + 'Clean_and_Press/0.jpg'],
    ['Power Clean',              BASE + 'Power_Clean/0.jpg'],
    ['Box Jump',                 BASE + 'Box_Jump_Multiple_Response/0.jpg'],
    ['Battle Ropes',             BASE + 'Battling_Ropes/0.jpg'],
    ['Farmer Walk',              BASE + 'Farmers_Walk/0.jpg'],
    ['Hanging Crunches',         BASE + 'Crunches/0.jpg'],
  ];

  for (const [name, url] of exerciseImages) {
    const safeName = name.replace(/'/g, "''");
    pgm.sql(`UPDATE exercises SET image_url = '${url}' WHERE lower(name) = lower('${safeName}');`);
  }
};

export const down = (pgm) => {
  // Revert to Pexels images from previous migration
  pgm.sql(`UPDATE exercises SET image_url = NULL WHERE image_url LIKE '%raw.githubusercontent.com/yuhonas%';`);
};
