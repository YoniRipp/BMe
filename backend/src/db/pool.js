/**
 * Database connection pool. Supports per-context URLs (e.g. MONEY_DATABASE_URL); falls back to DATABASE_URL.
 * @see docs/bounded-contexts.md
 */
import pg from 'pg';
import { config } from '../config/index.js';

const { Pool } = pg;

const CONTEXT_CONFIG_KEYS = {
  money: 'moneyDbUrl',
  schedule: 'scheduleDbUrl',
  body: 'bodyDbUrl',
  energy: 'energyDbUrl',
  goals: 'goalsDbUrl',
};

let defaultPool = null;
const contextPools = new Map();

function getConnectionString(context) {
  if (context && CONTEXT_CONFIG_KEYS[context]) {
    const url = config[CONTEXT_CONFIG_KEYS[context]] || config.dbUrl;
    return url || null;
  }
  return config.dbUrl || null;
}

function createPool(connectionString) {
  const connectionStringNoQuery = connectionString.split('?')[0];
  return new Pool({
    connectionString: connectionStringNoQuery,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
  });
}

/**
 * Get a pool for the given context (or default). Context: 'money' | 'schedule' | 'body' | 'energy' | 'goals'.
 * @param {string} [context] - Bounded context; if omitted, uses default DATABASE_URL.
 */
export function getPool(context) {
  const conn = getConnectionString(context);
  if (!conn) {
    throw new Error('DATABASE_URL is not set. Backend data API and MCP require a database.');
  }
  if (!context) {
    if (!defaultPool) defaultPool = createPool(conn);
    return defaultPool;
  }
  if (!contextPools.has(context)) {
    contextPools.set(context, createPool(conn));
  }
  return contextPools.get(context);
}

export function isDbConfigured() {
  return config.isDbConfigured;
}

export async function closePool() {
  if (defaultPool) {
    await defaultPool.end();
    defaultPool = null;
  }
  for (const [ctx, p] of contextPools) {
    await p.end();
  }
  contextPools.clear();
}
