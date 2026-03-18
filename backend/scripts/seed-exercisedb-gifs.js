#!/usr/bin/env node
/**
 * One-time script: fetch exercise GIFs from ExerciseDB (RapidAPI) and generate
 * a migration file with the hardcoded GIF URLs.
 *
 * Usage:
 *   RAPIDAPI_KEY=your_key_here node scripts/seed-exercisedb-gifs.js
 *
 * Get a free API key at: https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb
 *   - Sign up free, subscribe to the Basic plan (500 req/day, free forever)
 *   - Copy your "X-RapidAPI-Key" from the API page
 *
 * Output:
 *   Writes migrations/1775500000000_update-exercise-gifs-rapidapi.js
 *   which you can then run via: npm run migrate:up
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
if (!RAPIDAPI_KEY) {
  console.error('Error: RAPIDAPI_KEY environment variable is required.');
  console.error('Usage: RAPIDAPI_KEY=your_key node scripts/seed-exercisedb-gifs.js');
  process.exit(1);
}

// Our 116 exercises that we want to find GIFs for
const OUR_EXERCISES = [
  // Chest
  'Bench Press','Incline Bench Press','Decline Bench Press','Dumbbell Bench Press',
  'Incline Dumbbell Press','Pec Deck','Cable Fly','Push-up','Dip','Chest Dip',
  'Dumbbell Fly','Close-Grip Bench Press','Landmine Press','Chest Press Machine',
  'Machine Fly','Decline Dumbbell Press',
  // Back
  'Deadlift','Barbell Row','T-Bar Row','Pull-up','Chin-up','Lat Pulldown',
  'Seated Cable Row','Single-Arm Dumbbell Row','Hyperextension','Cable Pullover',
  'Straight-Arm Pulldown','Inverted Row','Machine Row','Rack Pull','Pendlay Row',
  'Meadows Row','Dumbbell Pullover',
  // Legs
  'Squat','Front Squat','Hack Squat','Goblet Squat','Bulgarian Split Squat',
  'Romanian Deadlift','Sumo Deadlift','Leg Press','Leg Curl','Leg Extension',
  'Lunge','Walking Lunge','Good Morning','Calf Raise','Standing Calf Raise',
  'Seated Calf Raise','Hip Thrust','Glute Bridge','Step Up','Smith Machine Squat',
  'Belt Squat','Nordic Hamstring Curl','Sissy Squat','Hip Adduction','Hip Abduction',
  // Shoulders
  'Overhead Press','Dumbbell Shoulder Press','Arnold Press','Machine Shoulder Press',
  'Lateral Raise','Cable Lateral Raise','Front Raise','Shrugs','Upright Row',
  'Face Pull','Rear Delt Fly','Reverse Pec Deck','Behind-the-Neck Press','Lu Raise',
  // Arms
  'Bicep Curl','Barbell Curl','Hammer Curl','Preacher Curl','Concentration Curl',
  'Cable Curl','EZ-Bar Curl','Incline Dumbbell Curl','Reverse Curl','Wrist Curl',
  'Spider Curl','Skull Crusher','Tricep Extension','Rope Pushdown',
  'Overhead Tricep Extension','Tricep Kickback','Diamond Push-up','Dip Machine',
  'Cable Overhead Tricep Extension',
  // Core
  'Plank','Side Plank','Russian Twist','Hanging Leg Raise','Cable Crunch',
  'Ab Wheel Rollout','Dead Bug','Mountain Climber','Bicycle Crunch','Sit-up',
  'V-Up','Pallof Press','Decline Sit-up','Woodchop','Toe Touch',
  // Full Body / Cardio
  'Running','Cycling','Rowing Machine','Jump Rope','Burpee','Kettlebell Swing',
  'Clean and Press','Power Clean','Box Jump','Battle Ropes','Farmer Walk',
  'Hanging Crunches',
];

/**
 * Score how well two exercise names match (0–100).
 * Higher = better match.
 */
function matchScore(ourName, dbName) {
  const a = ourName.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  const b = dbName.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  if (a === b) return 100;
  if (b.includes(a) || a.includes(b)) return 85;
  const aWords = a.split(' ').filter(w => w.length > 2);
  const bWords = b.split(' ').filter(w => w.length > 2);
  const matches = aWords.filter(w => bWords.some(d => d.includes(w) || w.includes(d)));
  return (matches.length / Math.max(aWords.length, 1)) * 65;
}

async function fetchAllExercises() {
  console.log('Fetching exercises from ExerciseDB API...');
  const url = 'https://exercisedb.p.rapidapi.com/exercises?limit=1300&offset=0';
  const res = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API request failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  console.log(`Fetched ${data.length} exercises from API.`);
  return data;
}

async function main() {
  const apiExercises = await fetchAllExercises();

  const matched = [];
  const unmatched = [];

  for (const ourName of OUR_EXERCISES) {
    let best = null;
    let bestScore = 0;
    for (const ex of apiExercises) {
      const score = matchScore(ourName, ex.name);
      if (score > bestScore) {
        bestScore = score;
        best = ex;
      }
    }

    const MIN_SCORE = 50;
    if (best && bestScore >= MIN_SCORE && best.gifUrl) {
      matched.push({ ourName, apiName: best.name, gifUrl: best.gifUrl, score: bestScore });
      console.log(`  ✓ "${ourName}" → "${best.name}" (${bestScore.toFixed(0)}) ${best.gifUrl}`);
    } else {
      unmatched.push(ourName);
      console.log(`  ✗ "${ourName}" → no match (best: ${best ? best.name : 'none'}, score: ${bestScore.toFixed(0)})`);
    }
  }

  console.log(`\nMatched: ${matched.length}/${OUR_EXERCISES.length}`);
  console.log(`Unmatched (keeping existing Pexels images): ${unmatched.join(', ')}`);

  // Generate migration file
  const migrationPath = path.join(__dirname, '../migrations/1775500000000_update-exercise-gifs-rapidapi.js');

  const lines = matched.map(({ ourName, gifUrl }) => {
    const safeName = ourName.replace(/'/g, "''");
    const safeUrl = gifUrl.replace(/'/g, "''");
    return `    ['${safeName}', '${safeUrl}'],`;
  });

  const content = `/**
 * Update exercise images with GIF URLs from ExerciseDB (RapidAPI).
 * Generated by scripts/seed-exercisedb-gifs.js — do not edit manually.
 * GIFs are hosted on exercisedb CDN and show animated exercise demonstrations.
 * ${matched.length} exercises updated, ${unmatched.length} kept existing images.
 */
export const shorthands = undefined;

export const up = (pgm) => {
  const exerciseGifs = [
${lines.join('\n')}
  ];

  for (const [name, url] of exerciseGifs) {
    pgm.sql(\`UPDATE exercises SET image_url = '\${url}' WHERE lower(name) = lower('\${name.replace(/'/g, "''")}');\`);
  }
};

export const down = (pgm) => {
  // Revert to free-exercise-db static images (previous migration)
  pgm.sql(\`UPDATE exercises SET image_url = NULL WHERE image_url LIKE '%exercisedb%' OR image_url LIKE '%cdn.exercisedb%';\`);
};
`;

  fs.writeFileSync(migrationPath, content);
  console.log(`\nMigration written to: ${migrationPath}`);
  console.log('Run it with: npm run migrate:up');
}

main().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
