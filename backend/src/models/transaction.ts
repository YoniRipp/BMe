/**
 * Transaction model — data access only.
 */
import { getPool } from '../db/pool.js';

function rowToTransaction(row) {
  return {
    id: row.id,
    date: row.date,
    type: row.type,
    amount: Number(row.amount),
    currency: row.currency ?? 'USD',
    category: row.category,
    description: row.description ?? undefined,
    isRecurring: row.is_recurring,
    groupId: row.group_id ?? undefined,
  };
}

export async function findByUserId(
  userId: string,
  opts: { month?: string; type?: string; limit?: number; offset?: number } = {}
) {
  const { month, type, limit = 500, offset = 0 } = opts;
  const pool = getPool('money');
  const conditions = ['user_id = $1'];
  const params: (string | number)[] = [userId];
  let i = 2;
  if (month) {
    conditions.push(`date >= $${i}::date AND date < ($${i}::date + interval '1 month')`);
    params.push(month);
    i++;
  }
  if (type && (type === 'income' || type === 'expense')) {
    conditions.push(`type = $${i}`);
    params.push(type);
    i++;
  }
  const where = conditions.join(' AND ');
  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM transactions WHERE ${where}`,
    params
  );
  const total = countResult.rows[0]?.total ?? 0;
  params.push(limit, offset);
  const result = await pool.query(
    `SELECT id, date, type, amount, currency, category, description, is_recurring, group_id FROM transactions WHERE ${where} ORDER BY date DESC, created_at DESC LIMIT $${i} OFFSET $${i + 1}`,
    params
  );
  return { items: result.rows.map(rowToTransaction), total };
}

export async function create(params) {
  const pool = getPool('money');
  const { userId, date, type, amount, currency, category, description, isRecurring, groupId } = params;
  const d = date ? new Date(date) : new Date();
  const curr = currency && String(currency).length === 3 ? String(currency).toUpperCase() : 'USD';
  const result = await pool.query(
    `INSERT INTO transactions (date, type, amount, currency, category, description, is_recurring, group_id, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, date, type, amount, currency, category, description, is_recurring, group_id`,
    [d.toISOString().slice(0, 10), type, amount, curr, category ?? 'Other', description ?? null, isRecurring === true, groupId ?? null, userId]
  );
  return rowToTransaction(result.rows[0]);
}

export async function update(id, userId, updates) {
  const pool = getPool('money');
  const entries = [];
  const values = [];
  let i = 1;
  if (updates.date !== undefined) { entries.push(`date = $${i}::date`); values.push(updates.date); i++; }
  if (updates.type !== undefined) { entries.push('type = $' + i); values.push(updates.type); i++; }
  if (updates.amount !== undefined) { entries.push('amount = $' + i); values.push(updates.amount); i++; }
  if (updates.category !== undefined) { entries.push('category = $' + i); values.push(updates.category); i++; }
  if (updates.description !== undefined) { entries.push('description = $' + i); values.push(updates.description ?? null); i++; }
  if (updates.isRecurring !== undefined) { entries.push('is_recurring = $' + i); values.push(!!updates.isRecurring); i++; }
  if (updates.groupId !== undefined) { entries.push('group_id = $' + i); values.push(updates.groupId ?? null); i++; }
  if (updates.currency !== undefined) { entries.push('currency = $' + i); values.push(updates.currency && String(updates.currency).length === 3 ? String(updates.currency).toUpperCase() : 'USD'); i++; }
  if (entries.length === 0) return null;
  values.push(id, userId);
  const result = await pool.query(
    `UPDATE transactions SET ${entries.join(', ')} WHERE id = $${i} AND user_id = $${i + 1} RETURNING id, date, type, amount, currency, category, description, is_recurring, group_id`,
    values
  );
  return result.rowCount > 0 ? rowToTransaction(result.rows[0]) : null;
}

export async function deleteById(id, userId) {
  const pool = getPool('money');
  const result = await pool.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
  return result.rowCount > 0;
}

export async function getBalance(userId, month) {
  const pool = getPool('money');
  let query = 'SELECT type, SUM(amount)::numeric AS total FROM transactions WHERE user_id = $1';
  const params = [userId];
  if (month) {
    query += ' AND date >= $2::date AND date < ($2::date + interval \'1 month\')';
    params.push(month);
  }
  query += ' GROUP BY type';
  const result = await pool.query(query, params);
  let income = 0;
  let expenses = 0;
  for (const row of result.rows) {
    const t = Number(row.total);
    if (row.type === 'income') income = t;
    else if (row.type === 'expense') expenses = t;
  }
  return { balance: income - expenses, income, expenses };
}
