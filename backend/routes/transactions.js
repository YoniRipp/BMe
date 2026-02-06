import { getPool } from '../db.js';
import { getEffectiveUserId } from '../middleware/auth.js';

function rowToTransaction(row) {
  return {
    id: row.id,
    date: row.date,
    type: row.type,
    amount: Number(row.amount),
    category: row.category,
    description: row.description ?? undefined,
    isRecurring: row.is_recurring,
    groupId: row.group_id ?? undefined,
  };
}

export async function listTransactions(req, res) {
  try {
    const userId = getEffectiveUserId(req);
    const { month, type } = req.query ?? {};
    const pool = getPool();
    let query = 'SELECT * FROM transactions WHERE user_id = $1';
    const params = [userId];
    let i = 2;
    if (month) {
      query += ` AND date >= $${i}::date AND date < ($${i}::date + interval '1 month')`;
      params.push(month);
      i++;
    }
    if (type && (type === 'income' || type === 'expense')) {
      query += ` AND type = $${i}`;
      params.push(type);
      i++;
    }
    query += ' ORDER BY date DESC, created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows.map(rowToTransaction));
  } catch (e) {
    console.error('list transactions error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Failed to list transactions' });
  }
}

export async function addTransaction(req, res) {
  try {
    const userId = getEffectiveUserId(req);
    const { date, type, amount, category, description, isRecurring, groupId } = req.body ?? {};
    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({ error: 'type must be income or expense' });
    }
    if (typeof amount !== 'number' || amount < 0) {
      return res.status(400).json({ error: 'amount must be a non-negative number' });
    }
    const pool = getPool();
    const d = date ? new Date(date) : new Date();
    const result = await pool.query(
      `INSERT INTO transactions (date, type, amount, category, description, is_recurring, group_id, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        d.toISOString().slice(0, 10),
        type,
        amount,
        category ?? 'Other',
        description ?? null,
        isRecurring === true,
        groupId ?? null,
        userId,
      ]
    );
    res.status(201).json(rowToTransaction(result.rows[0]));
  } catch (e) {
    console.error('add transaction error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Failed to add transaction' });
  }
}

export async function updateTransaction(req, res) {
  try {
    const { id } = req.params;
    const { date, type, amount, category, description, isRecurring, groupId } = req.body ?? {};
    if (!id) return res.status(400).json({ error: 'id is required' });
    const pool = getPool();
    const updates = [];
    const values = [];
    let i = 1;
    if (date !== undefined) { updates.push(`date = $${i}::date`); values.push(date); i++; }
    if (type !== undefined) {
      if (type !== 'income' && type !== 'expense') return res.status(400).json({ error: 'type must be income or expense' });
      updates.push(`type = $${i}`); values.push(type); i++;
    }
    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount < 0) return res.status(400).json({ error: 'amount must be a non-negative number' });
      updates.push(`amount = $${i}`); values.push(amount); i++;
    }
    if (category !== undefined) { updates.push(`category = $${i}`); values.push(category); i++; }
    if (description !== undefined) { updates.push(`description = $${i}`); values.push(description ?? null); i++; }
    if (isRecurring !== undefined) { updates.push(`is_recurring = $${i}`); values.push(!!isRecurring); i++; }
    if (groupId !== undefined) { updates.push(`group_id = $${i}`); values.push(groupId ?? null); i++; }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    const userId = getEffectiveUserId(req);
    values.push(id, userId);
    const result = await pool.query(
      `UPDATE transactions SET ${updates.join(', ')} WHERE id = $${i} AND user_id = $${i + 1} RETURNING *`,
      values
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Transaction not found' });
    res.json(rowToTransaction(result.rows[0]));
  } catch (e) {
    console.error('update transaction error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Failed to update transaction' });
  }
}

export async function deleteTransaction(req, res) {
  try {
    const userId = getEffectiveUserId(req);
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'id is required' });
    const pool = getPool();
    const result = await pool.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Transaction not found' });
    res.status(204).send();
  } catch (e) {
    console.error('delete transaction error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Failed to delete transaction' });
  }
}

export async function getBalance(req, res) {
  try {
    const userId = getEffectiveUserId(req);
    const { month } = req.query ?? {};
    const pool = getPool();
    let query = 'SELECT type, SUM(amount)::numeric AS total FROM transactions WHERE user_id = $1';
    const params = [userId];
    if (month) {
      query += ` AND date >= $2::date AND date < ($2::date + interval '1 month')`;
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
    res.json({ balance: income - expenses, income, expenses });
  } catch (e) {
    console.error('get balance error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Failed to get balance' });
  }
}
