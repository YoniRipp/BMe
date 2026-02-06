/**
 * Schedule model — data access only.
 * @module models/schedule
 */
import { getPool } from '../db/pool.js';

function rowToItem(row) {
  return {
    id: row.id,
    title: row.title,
    startTime: row.start_time,
    endTime: row.end_time,
    category: row.category,
    emoji: row.emoji ?? undefined,
    order: row.order,
    isActive: row.is_active,
    groupId: row.group_id ?? undefined,
    recurrence: row.recurrence ?? undefined,
  };
}

/**
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export async function findByUserId(userId) {
  const pool = getPool();
  const result = await pool.query(
    'SELECT * FROM schedule_items WHERE is_active = true AND user_id = $1 ORDER BY start_time ASC, end_time ASC',
    [userId]
  );
  return result.rows.map(rowToItem);
}

/**
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.title
 * @param {string} [params.startTime]
 * @param {string} [params.endTime]
 * @param {string} [params.category]
 * @param {string} [params.emoji]
 * @param {number} [params.order]
 * @param {boolean} [params.isActive]
 * @param {string} [params.groupId]
 * @param {string} [params.recurrence]
 */
export async function create(params) {
  const pool = getPool();
  const { userId, title, startTime = '09:00', endTime = '10:00', category = 'Other', emoji, order, isActive = true, groupId, recurrence } = params;
  const countResult = await pool.query('SELECT COALESCE(MAX("order"), -1) + 1 AS next_order FROM schedule_items WHERE user_id = $1', [userId]);
  const nextOrder = order !== undefined ? Number(order) : countResult.rows[0]?.next_order ?? 0;
  const result = await pool.query(
    `INSERT INTO schedule_items (title, start_time, end_time, category, emoji, "order", is_active, group_id, user_id, recurrence)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [title.trim(), startTime, endTime, category, emoji ?? null, nextOrder, isActive, groupId ?? null, userId, recurrence ?? null]
  );
  return rowToItem(result.rows[0]);
}

/**
 * @param {string} userId
 * @param {object[]} items
 * @param {string} items[].title
 * @param {string} [items[].startTime]
 * @param {string} [items[].endTime]
 * @param {string} [items[].category]
 * @param {string} [items[].emoji]
 * @param {string} [items[].groupId]
 * @param {string} [items[].recurrence]
 */
export async function createBatch(userId, items) {
  const pool = getPool();
  const valid = items
    .filter((it) => it?.title && typeof it.title === 'string' && it.title.trim())
    .map((it) => ({
      title: it.title.trim(),
      startTime: it.startTime ?? '09:00',
      endTime: it.endTime ?? '10:00',
      category: it.category ?? 'Other',
      emoji: it.emoji ?? null,
      groupId: it.groupId ?? null,
      recurrence: it.recurrence ?? null,
    }));
  if (valid.length === 0) return [];
  const countResult = await pool.query('SELECT COALESCE(MAX("order"), -1) + 1 AS next_order FROM schedule_items WHERE user_id = $1', [userId]);
  let order = countResult.rows[0]?.next_order ?? 0;
  const values = [];
  const placeholders = [];
  let i = 1;
  for (const it of valid) {
    placeholders.push(`($${i}, $${i + 1}, $${i + 2}, $${i + 3}, $${i + 4}, $${i + 5}, true, $${i + 6}, $${i + 7}, $${i + 8})`);
    values.push(it.title, it.startTime, it.endTime, it.category, it.emoji, order++, it.groupId, userId, it.recurrence);
    i += 9;
  }
  const result = await pool.query(
    `INSERT INTO schedule_items (title, start_time, end_time, category, emoji, "order", is_active, group_id, user_id, recurrence)
     VALUES ${placeholders.join(', ')}
     RETURNING *`,
    values
  );
  return result.rows.map(rowToItem);
}

/**
 * @param {string} id
 * @param {string} userId
 * @param {object} updates
 */
export async function update(id, userId, updates) {
  const pool = getPool();
  const { title, startTime, endTime, category, emoji, order, isActive, groupId, recurrence } = updates;
  const updatesList = [];
  const values = [];
  let i = 1;
  if (title !== undefined) { updatesList.push(`title = $${i}`); values.push(typeof title === 'string' ? title.trim() : title); i++; }
  if (startTime !== undefined) { updatesList.push(`start_time = $${i}`); values.push(startTime); i++; }
  if (endTime !== undefined) { updatesList.push(`end_time = $${i}`); values.push(endTime); i++; }
  if (category !== undefined) { updatesList.push(`category = $${i}`); values.push(category); i++; }
  if (emoji !== undefined) { updatesList.push(`emoji = $${i}`); values.push(emoji ?? null); i++; }
  if (order !== undefined) { updatesList.push(`"order" = $${i}`); values.push(Number(order)); i++; }
  if (isActive !== undefined) { updatesList.push(`is_active = $${i}`); values.push(!!isActive); i++; }
  if (groupId !== undefined) { updatesList.push(`group_id = $${i}`); values.push(groupId ?? null); i++; }
  if (recurrence !== undefined) { updatesList.push(`recurrence = $${i}`); values.push(recurrence ?? null); i++; }
  if (updatesList.length === 0) return null;
  values.push(id, userId);
  const result = await pool.query(
    `UPDATE schedule_items SET ${updatesList.join(', ')} WHERE id = $${i} AND user_id = $${i + 1} RETURNING *`,
    values
  );
  return result.rowCount > 0 ? rowToItem(result.rows[0]) : null;
}

/**
 * @param {string} id
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export async function deleteById(id, userId) {
  const pool = getPool();
  const result = await pool.query('DELETE FROM schedule_items WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
  return result.rowCount > 0;
}
