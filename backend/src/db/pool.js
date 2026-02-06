/**
 * Database connection pool.
 */
import pg from 'pg';
import { config } from '../config/index.js';

const { Pool } = pg;
let pool = null;

export function getPool() {
  if (!pool) {
    if (!config.dbUrl) {
      throw new Error('DATABASE_URL is not set. Backend data API and MCP require a database.');
    }
    const connectionStringNoQuery = config.dbUrl.split('?')[0];
    pool = new Pool({
      connectionString: connectionStringNoQuery,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

export function isDbConfigured() {
  return config.isDbConfigured;
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
