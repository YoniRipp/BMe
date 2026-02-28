/**
 * User admin routes. Require auth + admin.
 */
import bcrypt from 'bcrypt';
import { Router } from 'express';
import { getPool } from '../db/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { logAction } from '../services/appLog.js';

const SALT_ROUNDS = 10;

function rowToUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    createdAt: row.created_at,
  };
}

async function listUsers(req, res) {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users ORDER BY created_at ASC'
    );
    res.json(result.rows.map(rowToUser));
  } catch (e) {
    console.error('list users error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Could not list users. Please try again.' });
  }
}

async function createUser(req, res) {
  try {
    const { email, password, name, role } = req.body ?? {};
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'email is required' });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'password must be at least 8 characters' });
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      return res.status(400).json({ error: 'password must contain at least one uppercase letter, one lowercase letter, and one digit' });
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const r = role === 'admin' ? 'admin' : 'user';
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, created_at`,
      [email.trim().toLowerCase(), password_hash, name.trim(), r]
    );
    await logAction('User created', { email: result.rows[0].email, role: r }, req.user.id);
    res.status(201).json(rowToUser(result.rows[0]));
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error('create user error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Could not create user. Please try again.' });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, role, password } = req.body ?? {};
    if (!id) return res.status(400).json({ error: 'id is required' });
    const pool = getPool();
    const updates = [];
    const values = [];
    let i = 1;
    if (name !== undefined) { updates.push(`name = $${i}`); values.push(typeof name === 'string' ? name.trim() : name); i++; }
    if (role !== undefined) { updates.push(`role = $${i}`); values.push(role === 'admin' ? 'admin' : 'user'); i++; }
    if (password !== undefined && typeof password === 'string') {
      if (password.length < 8) {
        return res.status(400).json({ error: 'password must be at least 8 characters' });
      }
      if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
        return res.status(400).json({ error: 'password must contain at least one uppercase letter, one lowercase letter, and one digit' });
      }
      const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
      updates.push(`password_hash = $${i}`); values.push(password_hash); i++;
    }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    values.push(id);
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, email, name, role, created_at`,
      values
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    await logAction('User updated', { targetId: id, email: result.rows[0].email, fields: { name: name !== undefined, role: role !== undefined, password: password !== undefined } }, req.user.id);
    res.json(rowToUser(result.rows[0]));
  } catch (e) {
    console.error('update user error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Could not update user. Please try again.' });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'id is required' });
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    const pool = getPool();
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, email', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    await logAction('User deleted', { targetId: id, targetEmail: result.rows[0].email }, req.user.id);
    res.status(204).send();
  } catch (e) {
    console.error('delete user error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Could not delete user. Please try again.' });
  }
}

/**
 * GET /api/admin/users/:userId/activity
 * Returns paginated user activity timeline from user_activity_log.
 * Query params:
 *   limit  - number of rows (default 50, max 200)
 *   before - ISO timestamp cursor for pagination (exclusive)
 */
async function getUserActivity(req, res) {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit ?? '50', 10) || 50, 200);
    const before = req.query.before;

    const pool = getPool();
    const params = [userId, limit];
    let whereClause = 'WHERE user_id = $1';
    if (before) {
      whereClause += ' AND created_at < $3';
      params.push(before);
    }

    const result = await pool.query(
      `SELECT id, event_type AS "eventType", event_id AS "eventId", summary, payload, created_at AS "createdAt"
       FROM user_activity_log
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $2`,
      params
    );

    const events = result.rows;
    const nextCursor = events.length === limit ? events[events.length - 1].createdAt : null;
    res.json({ events, nextCursor });
  } catch (e) {
    console.error('getUserActivity error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Could not get user activity. Please try again.' });
  }
}

const router = Router();
const withAdmin = [requireAuth, requireAdmin];

router.get('/api/users', withAdmin, listUsers);
router.post('/api/users', withAdmin, createUser);
router.patch('/api/users/:id', withAdmin, updateUser);
router.delete('/api/users/:id', withAdmin, deleteUser);
router.get('/api/admin/users/:userId/activity', withAdmin, getUserActivity);

export default router;
