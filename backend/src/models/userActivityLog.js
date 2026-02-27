/**
 * User activity log model. Reads from user_activity_log.
 * Cursor pagination: (created_at, id) for keyset.
 */
import { getPool } from '../db/index.js';

const MAX_LIMIT = 100;
const MAX_DAYS = 90;

/**
 * List activity with cursor pagination, time range, and filters.
 * @param {{ limit?: number; before?: string; from: string; to: string; userId?: string; eventType?: string }} opts
 * @returns {{ events: Array<{id:string,eventType:string,eventId:string,summary:string,payload:object,createdAt:string,userId:string,userEmail:string,userName:string}>; nextCursor?: string }}
 */
export async function listActivity(opts) {
  const { limit = 50, before, from, to, userId, eventType } = opts ?? {};

  if (!from || !to) {
    throw new Error('from and to (ISO UTC) are required');
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new Error('from and to must be valid ISO 8601 dates');
  }
  const daysDiff = (toDate - fromDate) / (1000 * 60 * 60 * 24);
  if (daysDiff > MAX_DAYS) {
    throw new Error(`Time range cannot exceed ${MAX_DAYS} days`);
  }
  if (daysDiff <= 0) {
    throw new Error('to must be after from');
  }

  const cappedLimit = Math.min(Math.max(1, Number(limit) || 50), MAX_LIMIT);

  let cursorCreatedAt = null;
  let cursorId = null;
  if (before) {
    try {
      const decoded = JSON.parse(Buffer.from(before, 'base64url').toString('utf8'));
      cursorCreatedAt = decoded.c;
      cursorId = decoded.i;
    } catch {
      // ignore invalid cursor
    }
  }

  const pool = getPool();
  const conditions = ['a.created_at >= $1', 'a.created_at <= $2'];
  const values = [from, to];
  let paramIndex = 3;

  if (userId) {
    conditions.push(`a.user_id = $${paramIndex}`);
    values.push(userId);
    paramIndex++;
  }
  if (eventType) {
    conditions.push(`a.event_type LIKE $${paramIndex}`);
    values.push(`${eventType}%`);
    paramIndex++;
  }
  if (cursorCreatedAt && cursorId) {
    conditions.push(`(a.created_at, a.id) < ($${paramIndex}::timestamptz, $${paramIndex + 1}::uuid)`);
    values.push(cursorCreatedAt, cursorId);
    paramIndex += 2;
  }

  const whereClause = conditions.join(' AND ');
  const limitVal = cappedLimit + 1;
  const result = await pool.query(
    `
    SELECT a.id, a.user_id, a.event_type, a.event_id, a.summary, a.payload, a.created_at,
           u.email AS user_email, u.name AS user_name
    FROM user_activity_log a
    LEFT JOIN users u ON u.id = a.user_id
    WHERE ${whereClause}
    ORDER BY a.created_at DESC, a.id DESC
    LIMIT ${limitVal}
  `,
    values
  );
  const rows = result.rows;
  const hasMore = rows.length > cappedLimit;
  const slice = hasMore ? rows.slice(0, cappedLimit) : rows;

  const events = slice.map((r) => ({
    id: r.id,
    eventType: r.event_type,
    eventId: r.event_id,
    summary: r.summary,
    payload: r.payload ?? null,
    createdAt: r.created_at,
    userId: r.user_id ?? null,
    userEmail: r.user_email ?? null,
    userName: r.user_name ?? null,
  }));

  let nextCursor;
  if (hasMore && slice.length > 0) {
    const last = slice[slice.length - 1];
    const createdAt = last.created_at instanceof Date ? last.created_at.toISOString() : last.created_at;
    nextCursor = Buffer.from(JSON.stringify({ c: createdAt, i: last.id }), 'utf8').toString('base64url');
  }

  return { events, nextCursor };
}
