/**
 * App log service — persist action and error logs for admin visibility.
 */
import { getPool, isDbConfigured } from '../db/index.js';
import { logger } from '../lib/logger.js';

const LOG_LIMIT = 200;

async function insertLog(level, message, details, userId) {
  if (!isDbConfigured()) {
    logger.info({ level, message, details }, 'appLog');
    return;
  }
  try {
    const pool = getPool();
    await pool.query(
      `INSERT INTO app_logs (level, message, details, user_id) VALUES ($1, $2, $3, $4)`,
      [level, message, details ? JSON.stringify(details) : null, userId ?? null]
    );
  } catch (e) {
    logger.error({ err: e }, 'appLog insert failed');
  }
}

/**
 * Log an action (e.g. user created, user deleted).
 * @param {string} message
 * @param {object} [details]
 * @param {string} [userId] - Admin/user who performed the action
 */
export async function logAction(message, details, userId) {
  await insertLog('action', message, details, userId);
}

/**
 * Log an error (e.g. voice fallback, parse failure).
 * @param {string} message
 * @param {object} [details]
 * @param {string} [userId] - User affected if any
 */
export async function logError(message, details, userId) {
  await insertLog('error', message, details, userId);
}

/**
 * List logs for admin. level is 'action' or 'error'.
 * @param {string} level
 * @returns {Promise<{ id: string, level: string, message: string, details: object|null, userId: string|null, createdAt: string }[]>}
 */
export async function listLogs(level) {
  if (!isDbConfigured()) {
    return [];
  }
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, level, message, details, user_id AS "userId", created_at AS "createdAt"
     FROM app_logs WHERE level = $1 ORDER BY created_at DESC LIMIT $2`,
    [level, LOG_LIMIT]
  );
  return result.rows.map((row) => ({
    ...row,
    details: row.details != null ? row.details : null,
  }));
}
