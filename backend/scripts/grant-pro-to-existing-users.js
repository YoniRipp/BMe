#!/usr/bin/env node
/**
 * One-time script: grants Pro subscription status to all existing users.
 * Run: node scripts/grant-pro-to-existing-users.js
 * (Ensure DATABASE_URL is set, e.g. via .env.development)
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(root, '.env') });
const mode = process.env.NODE_ENV || 'development';
dotenv.config({ path: path.join(root, `.env.${mode}`) });

const conn = process.env.DATABASE_URL;
if (!conn) {
  console.error('DATABASE_URL is not set. Set it in .env or .env.development');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: conn });

async function main() {
  const result = await pool.query(`
    UPDATE users
    SET subscription_status = 'pro'
    WHERE subscription_status IS NULL OR subscription_status != 'pro'
    RETURNING id, email;
  `);
  console.log(`Granted Pro to ${result.rowCount} user(s).`);
  if (result.rows.length > 0) {
    result.rows.forEach((r) => console.log(`  - ${r.email}`));
  }
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
