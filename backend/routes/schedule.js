import { getPool } from '../db.js';
import { getEffectiveUserId } from '../middleware/auth.js';

const SCHEDULE_CATEGORIES = ['Work', 'Exercise', 'Meal', 'Sleep', 'Personal', 'Social', 'Other'];

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
  };
}

export async function listSchedule(req, res) {
  try {
    const userId = getEffectiveUserId(req);
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM schedule_items WHERE is_active = true AND user_id = $1 ORDER BY "order" ASC, created_at ASC',
      [userId]
    );
    res.json(result.rows.map(rowToItem));
  } catch (e) {
    console.error('list schedule error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Failed to list schedule' });
  }
}

export async function addScheduleItem(req, res) {
  try {
    const userId = getEffectiveUserId(req);
    const { title, startTime, endTime, category, emoji, order, isActive, groupId } = req.body ?? {};
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }
    const cat = SCHEDULE_CATEGORIES.includes(category) ? category : 'Other';
    const pool = getPool();
    const countResult = await pool.query('SELECT COALESCE(MAX("order"), -1) + 1 AS next_order FROM schedule_items WHERE user_id = $1', [userId]);
    const nextOrder = order !== undefined ? Number(order) : countResult.rows[0]?.next_order ?? 0;
    const result = await pool.query(
      `INSERT INTO schedule_items (title, start_time, end_time, category, emoji, "order", is_active, group_id, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        title.trim(),
        startTime ?? '09:00',
        endTime ?? '10:00',
        cat,
        emoji ?? null,
        nextOrder,
        isActive !== false,
        groupId ?? null,
        userId,
      ]
    );
    res.status(201).json(rowToItem(result.rows[0]));
  } catch (e) {
    console.error('add schedule item error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Failed to add schedule item' });
  }
}

export async function addScheduleItems(req, res) {
  try {
    const userId = getEffectiveUserId(req);
    const items = req.body?.items;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array is required' });
    }
    const pool = getPool();
    const countResult = await pool.query('SELECT COALESCE(MAX("order"), -1) + 1 AS next_order FROM schedule_items WHERE user_id = $1', [userId]);
    let order = countResult.rows[0]?.next_order ?? 0;
    const inserted = [];
    for (const it of items) {
      const title = it?.title && typeof it.title === 'string' ? it.title.trim() : '';
      if (!title) continue;
      const cat = SCHEDULE_CATEGORIES.includes(it?.category) ? it.category : 'Other';
      const result = await pool.query(
        `INSERT INTO schedule_items (title, start_time, end_time, category, emoji, "order", is_active, group_id, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8)
         RETURNING *`,
        [
          title,
          it.startTime ?? '09:00',
          it.endTime ?? '10:00',
          cat,
          it.emoji ?? null,
          order++,
          it.groupId ?? null,
          userId,
        ]
      );
      inserted.push(rowToItem(result.rows[0]));
    }
    res.status(201).json(inserted);
  } catch (e) {
    console.error('add schedule items error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Failed to add schedule items' });
  }
}

export async function updateScheduleItem(req, res) {
  try {
    const userId = getEffectiveUserId(req);
    const { id } = req.params;
    const { title, startTime, endTime, category, emoji, order, isActive, groupId } = req.body ?? {};
    if (!id) return res.status(400).json({ error: 'id is required' });
    const pool = getPool();
    const updates = [];
    const values = [];
    let i = 1;
    if (title !== undefined) { updates.push(`title = $${i}`); values.push(typeof title === 'string' ? title.trim() : title); i++; }
    if (startTime !== undefined) { updates.push(`start_time = $${i}`); values.push(startTime); i++; }
    if (endTime !== undefined) { updates.push(`end_time = $${i}`); values.push(endTime); i++; }
    if (category !== undefined) { updates.push(`category = $${i}`); values.push(SCHEDULE_CATEGORIES.includes(category) ? category : 'Other'); i++; }
    if (emoji !== undefined) { updates.push(`emoji = $${i}`); values.push(emoji ?? null); i++; }
    if (order !== undefined) { updates.push(`"order" = $${i}`); values.push(Number(order)); i++; }
    if (isActive !== undefined) { updates.push(`is_active = $${i}`); values.push(!!isActive); i++; }
    if (groupId !== undefined) { updates.push(`group_id = $${i}`); values.push(groupId ?? null); i++; }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    values.push(id, userId);
    const result = await pool.query(
      `UPDATE schedule_items SET ${updates.join(', ')} WHERE id = $${i} AND user_id = $${i + 1} RETURNING *`,
      values
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Schedule item not found' });
    res.json(rowToItem(result.rows[0]));
  } catch (e) {
    console.error('update schedule item error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Failed to update schedule item' });
  }
}

export async function deleteScheduleItem(req, res) {
  try {
    const userId = getEffectiveUserId(req);
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'id is required' });
    const pool = getPool();
    const result = await pool.query('DELETE FROM schedule_items WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Schedule item not found' });
    res.status(204).send();
  } catch (e) {
    console.error('delete schedule item error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Failed to delete schedule item' });
  }
}
