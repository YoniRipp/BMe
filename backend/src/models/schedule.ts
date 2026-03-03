/**
 * Schedule model — data access only.
 * @module models/schedule
 */
import { getPool } from '../db/pool.js';

type QueryParam = string | number | boolean | null | undefined;

function toDateStr(val: unknown): string | undefined {
  if (!val) return undefined;
  const d = new Date(val as string);
  return isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
}

function rowToItem(row: Record<string, unknown>) {
  return {
    id: row.id,
    date: toDateStr(row.date),
    title: row.title,
    startTime: row.start_time,
    endTime: row.end_time,
    category: row.category,
    emoji: row.emoji ?? undefined,
    order: row.order,
    isActive: row.is_active,
    groupId: row.group_id ?? undefined,
    recurrence: row.recurrence ?? undefined,
    color: row.color ?? undefined,
  };
}

/**
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export async function findByUserId(userId: string) {
  const pool = getPool('schedule');
  const result = await pool.query(
    'SELECT id, date, title, start_time, end_time, category, emoji, "order", is_active, group_id, recurrence, color FROM schedule_items WHERE is_active = true AND user_id = $1 ORDER BY date ASC, start_time ASC, end_time ASC',
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
 * @param {string} [params.color]
 */
function normalizeDate(dateVal: unknown): string {
  if (dateVal == null || dateVal === '') return new Date().toISOString().slice(0, 10);
  const d = new Date(dateVal as string);
  return isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
}

export async function create(params: Record<string, unknown>) {
  const pool = getPool('schedule');
  const { userId, title, startTime = '09:00', endTime = '10:00', category = 'Other', emoji, order, isActive = true, groupId, recurrence, color, date } = params;
  const dateStr = normalizeDate(date);
  const countResult = await pool.query('SELECT COALESCE(MAX("order"), -1) + 1 AS next_order FROM schedule_items WHERE user_id = $1', [userId]);
  const nextOrder = order !== undefined ? Number(order) : countResult.rows[0]?.next_order ?? 0;
  const result = await pool.query(
    `INSERT INTO schedule_items (date, title, start_time, end_time, category, emoji, "order", is_active, group_id, user_id, recurrence, color)
     VALUES ($1::date, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id, date, title, start_time, end_time, category, emoji, "order", is_active, group_id, recurrence, color`,
    [dateStr, (title as string).trim(), startTime, endTime, category, emoji ?? null, nextOrder, isActive, groupId ?? null, userId, recurrence ?? null, color ?? null]
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
 * @param {string} [items[].color]
 */
export async function createBatch(userId: string, items: Record<string, unknown>[]) {
  const pool = getPool('schedule');
  const todayStr = new Date().toISOString().slice(0, 10);
  const valid = items
    .filter((it) => it?.title && typeof it.title === 'string' && it.title.trim())
    .map((it) => ({
      date: it.date != null && it.date !== '' ? normalizeDate(it.date) : todayStr,
      title: (it.title as string).trim(),
      startTime: (it.startTime as string) ?? '09:00',
      endTime: (it.endTime as string) ?? '10:00',
      category: (it.category as string) ?? 'Other',
      emoji: it.emoji ?? null,
      groupId: it.groupId ?? null,
      recurrence: it.recurrence ?? null,
      color: it.color ?? null,
    }));
  if (valid.length === 0) return [];
  const countResult = await pool.query('SELECT COALESCE(MAX("order"), -1) + 1 AS next_order FROM schedule_items WHERE user_id = $1', [userId]);
  let order = countResult.rows[0]?.next_order ?? 0;
  const values: QueryParam[] = [];
  const placeholders: string[] = [];
  let i = 1;
  for (const it of valid) {
    placeholders.push(`($${i}::date, $${i + 1}, $${i + 2}, $${i + 3}, $${i + 4}, $${i + 5}, $${i + 6}, true, $${i + 7}, $${i + 8}, $${i + 9}, $${i + 10})`);
    values.push(it.date, it.title, it.startTime, it.endTime, it.category, it.emoji as QueryParam, order++, it.groupId as QueryParam, userId, it.recurrence as QueryParam, it.color as QueryParam);
    i += 11;
  }
  const result = await pool.query(
    `INSERT INTO schedule_items (date, title, start_time, end_time, category, emoji, "order", is_active, group_id, user_id, recurrence, color)
     VALUES ${placeholders.join(', ')}
     RETURNING id, date, title, start_time, end_time, category, emoji, "order", is_active, group_id, recurrence, color`,
    values
  );
  return result.rows.map(rowToItem);
}

/**
 * @param {string} id
 * @param {string} userId
 * @param {object} updates
 */
export async function update(id: string, userId: string, updates: Record<string, unknown>) {
  const pool = getPool('schedule');
  const { title, startTime, endTime, category, emoji, order, isActive, groupId, recurrence, color, date } = updates;
  const updatesList: string[] = [];
  const values: QueryParam[] = [];
  let i = 1;
  if (date !== undefined) { updatesList.push(`date = $${i}::date`); values.push(normalizeDate(date)); i++; }
  if (title !== undefined) { updatesList.push(`title = $${i}`); values.push(typeof title === 'string' ? title.trim() : title as QueryParam); i++; }
  if (startTime !== undefined) { updatesList.push(`start_time = $${i}`); values.push(startTime as QueryParam); i++; }
  if (endTime !== undefined) { updatesList.push(`end_time = $${i}`); values.push(endTime as QueryParam); i++; }
  if (category !== undefined) { updatesList.push(`category = $${i}`); values.push(category as QueryParam); i++; }
  if (emoji !== undefined) { updatesList.push(`emoji = $${i}`); values.push((emoji ?? null) as QueryParam); i++; }
  if (order !== undefined) { updatesList.push(`"order" = $${i}`); values.push(Number(order)); i++; }
  if (isActive !== undefined) { updatesList.push(`is_active = $${i}`); values.push(!!isActive); i++; }
  if (groupId !== undefined) { updatesList.push(`group_id = $${i}`); values.push((groupId ?? null) as QueryParam); i++; }
  if (recurrence !== undefined) { updatesList.push(`recurrence = $${i}`); values.push((recurrence ?? null) as QueryParam); i++; }
  if (color !== undefined) { updatesList.push(`color = $${i}`); values.push((color ?? null) as QueryParam); i++; }
  if (updatesList.length === 0) return null;
  values.push(id, userId);
  const result = await pool.query(
    `UPDATE schedule_items SET ${updatesList.join(', ')} WHERE id = $${i} AND user_id = $${i + 1} RETURNING id, date, title, start_time, end_time, category, emoji, "order", is_active, group_id, recurrence, color`,
    values
  );
  return (result.rowCount ?? 0) > 0 ? rowToItem(result.rows[0]) : null;
}

/**
 * @param {string} id
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export async function deleteById(id: string, userId: string) {
  const pool = getPool('schedule');
  const result = await pool.query('DELETE FROM schedule_items WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
  return (result.rowCount ?? 0) > 0;
}
