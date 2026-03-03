/**
 * Last-action tracking for insights refresh optimization.
 * Updates users.last_action_at when data-affecting mutations occur.
 * No-op when DB is not configured (e.g. in tests).
 */
import { getPool, isDbConfigured } from '../db/index.js';

export async function touchUserLastAction(userId: string): Promise<void> {
  if (!isDbConfigured()) return;
  const pool = getPool();
  await pool.query('UPDATE users SET last_action_at = now() WHERE id = $1', [userId]);
}
