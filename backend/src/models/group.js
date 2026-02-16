/**
 * Group model — data access and membership.
 * @module models/group
 */
import { getPool } from '../db/pool.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../errors.js';

function toISO(val) {
  if (!val) return undefined;
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

/**
 * Build full group shape with members and invitations.
 * @param {string} groupId
 * @returns {Promise<object|null>}
 */
async function getFullGroup(pool, groupId) {
  const gResult = await pool.query(
    'SELECT id, name, description, type, created_at FROM groups WHERE id = $1',
    [groupId]
  );
  if (gResult.rows.length === 0) return null;
  const row = gResult.rows[0];

  const membersResult = await pool.query(
    `SELECT gm.user_id AS "userId", u.email, gm.role
     FROM group_members gm
     JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = $1`,
    [groupId]
  );
  const members = membersResult.rows.map((m) => ({
    userId: m.userId,
    email: m.email,
    role: m.role,
  }));

  const invResult = await pool.query(
    `SELECT gi.email, u.email AS "invitedBy", gi.invited_at AS "invitedAt"
     FROM group_invitations gi
     JOIN users u ON u.id = gi.invited_by_user_id
     WHERE gi.group_id = $1`,
    [groupId]
  );
  const invitations = invResult.rows.map((i) => ({
    email: i.email,
    invitedBy: i.invitedBy,
    invitedAt: toISO(i.invitedAt),
  }));

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    type: row.type,
    members,
    invitations,
    createdAt: toISO(row.created_at),
  };
}

/**
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export async function findByUserId(userId) {
  const pool = getPool();
  const idResult = await pool.query(
    `SELECT g.id FROM groups g
     JOIN group_members gm ON gm.group_id = g.id
     WHERE gm.user_id = $1
     ORDER BY g.name ASC`,
    [userId]
  );
  const ids = idResult.rows.map((r) => r.id);
  if (ids.length === 0) return [];

  const groupsResult = await pool.query(
    'SELECT id, name, description, type, created_at FROM groups WHERE id = ANY($1::uuid[])',
    [ids]
  );
  const membersResult = await pool.query(
    `SELECT gm.group_id, gm.user_id AS "userId", u.email, gm.role
     FROM group_members gm
     JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = ANY($1::uuid[])`,
    [ids]
  );
  const invResult = await pool.query(
    `SELECT gi.group_id, gi.email, u.email AS "invitedBy", gi.invited_at AS "invitedAt"
     FROM group_invitations gi
     JOIN users u ON u.id = gi.invited_by_user_id
     WHERE gi.group_id = ANY($1::uuid[])`,
    [ids]
  );

  const membersByGroup = new Map();
  for (const m of membersResult.rows) {
    const list = membersByGroup.get(m.group_id) || [];
    list.push({ userId: m.userId, email: m.email, role: m.role });
    membersByGroup.set(m.group_id, list);
  }
  const invByGroup = new Map();
  for (const i of invResult.rows) {
    const list = invByGroup.get(i.group_id) || [];
    list.push({ email: i.email, invitedBy: i.invitedBy, invitedAt: toISO(i.invitedAt) });
    invByGroup.set(i.group_id, list);
  }

  const idToOrder = new Map(ids.map((id, idx) => [id, idx]));
  return groupsResult.rows
    .map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      type: row.type,
      members: membersByGroup.get(row.id) || [],
      invitations: invByGroup.get(row.id) || [],
      createdAt: toISO(row.created_at),
    }))
    .sort((a, b) => (idToOrder.get(a.id) ?? 0) - (idToOrder.get(b.id) ?? 0));
}

/**
 * @param {string} id
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
export async function findById(id, userId) {
  const pool = getPool();
  const memberRow = await pool.query(
    'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
    [id, userId]
  );
  if (memberRow.rows.length === 0) return null;
  return getFullGroup(pool, id);
}

/**
 * @param {object} params
 * @param {string} params.name
 * @param {string} [params.description]
 * @param {string} params.type
 * @param {string} params.createdByUserId
 * @returns {Promise<object>}
 */
export async function create(params) {
  const pool = getPool();
  const { name, description, type, createdByUserId } = params;
  const result = await pool.query(
    `INSERT INTO groups (name, description, type, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [name.trim(), description?.trim() || null, type.trim(), createdByUserId]
  );
  const groupId = result.rows[0].id;
  await pool.query(
    `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'admin')`,
    [groupId, createdByUserId]
  );
  return getFullGroup(pool, groupId);
}

/**
 * @param {string} id
 * @param {string} userId
 * @returns {Promise<boolean>} true if user is admin
 */
async function isAdmin(pool, id, userId) {
  const r = await pool.query(
    "SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2 AND role = 'admin'",
    [id, userId]
  );
  return r.rows.length > 0;
}

/**
 * @param {string} id
 * @param {string} userId
 * @param {object} updates
 * @param {string} [updates.name]
 * @param {string} [updates.description]
 * @param {string} [updates.type]
 * @returns {Promise<object>}
 */
export async function update(id, userId, updates) {
  const pool = getPool();
  const admin = await isAdmin(pool, id, userId);
  if (!admin) throw new ForbiddenError('Only group admins can update the group');
  const setClauses = [];
  const values = [];
  let i = 1;
  if (updates.name !== undefined) {
    setClauses.push(`name = $${i++}`);
    values.push(updates.name.trim());
  }
  if (updates.description !== undefined) {
    setClauses.push(`description = $${i++}`);
    values.push(updates.description?.trim() || null);
  }
  if (updates.type !== undefined) {
    setClauses.push(`type = $${i++}`);
    values.push(updates.type.trim());
  }
  if (setClauses.length === 0) return findById(id, userId);
  values.push(id);
  await pool.query(
    `UPDATE groups SET ${setClauses.join(', ')} WHERE id = $${i}`,
    values
  );
  return getFullGroup(pool, id);
}

/**
 * @param {string} id
 * @param {string} userId
 */
export async function remove(id, userId) {
  const pool = getPool();
  const admin = await isAdmin(pool, id, userId);
  if (!admin) throw new ForbiddenError('Only group admins can delete the group');
  await pool.query('UPDATE schedule_items SET group_id = NULL WHERE group_id = $1', [id]);
  await pool.query('UPDATE transactions SET group_id = NULL WHERE group_id = $1', [id]);
  await pool.query('DELETE FROM groups WHERE id = $1', [id]);
}

/**
 * @param {string} groupId
 * @param {string} userId
 * @param {string} email
 * @returns {Promise<object>}
 */
export async function addInvitation(groupId, userId, email) {
  const pool = getPool();
  const admin = await isAdmin(pool, groupId, userId);
  if (!admin) throw new ForbiddenError('Only group admins can invite');
  const emailNorm = email.trim().toLowerCase();
  const memberCheck = await pool.query(
    `SELECT 1 FROM group_members gm JOIN users u ON u.id = gm.user_id WHERE gm.group_id = $1 AND lower(u.email) = $2`,
    [groupId, emailNorm]
  );
  if (memberCheck.rows.length > 0) throw new ConflictError('Already a member');
  const invCheck = await pool.query(
    'SELECT 1 FROM group_invitations WHERE group_id = $1 AND lower(email) = $2',
    [groupId, emailNorm]
  );
  if (invCheck.rows.length > 0) throw new ConflictError('Already invited');
  const insertResult = await pool.query(
    `INSERT INTO group_invitations (group_id, email, invited_by_user_id) VALUES ($1, $2, $3) RETURNING id`,
    [groupId, emailNorm, userId]
  );
  const group = await getFullGroup(pool, groupId);
  const invitationId = insertResult.rows[0]?.id ?? null;
  return { group, invitationId };
}

/**
 * @param {string} groupId
 * @param {string} userId
 * @param {string} email
 * @returns {Promise<object>}
 */
export async function cancelInvitation(groupId, userId, email) {
  const pool = getPool();
  const admin = await isAdmin(pool, groupId, userId);
  if (!admin) throw new ForbiddenError('Only group admins can cancel invitations');
  const emailNorm = email.trim().toLowerCase();
  await pool.query(
    'DELETE FROM group_invitations WHERE group_id = $1 AND lower(email) = $2',
    [groupId, emailNorm]
  );
  return getFullGroup(pool, groupId);
}

/**
 * Get invitation by id (token) for public join page. Returns { groupId, groupName, email } or null.
 * @param {string} token - group_invitations.id
 * @returns {Promise<{ groupId: string, groupName: string, email: string }|null>}
 */
export async function findInvitationByToken(token) {
  if (!token || typeof token !== 'string') return null;
  const pool = getPool();
  const result = await pool.query(
    `SELECT gi.group_id AS "groupId", g.name AS "groupName", gi.email
     FROM group_invitations gi
     JOIN groups g ON g.id = gi.group_id
     WHERE gi.id = $1`,
    [token.trim()]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    groupId: row.groupId,
    groupName: row.groupName,
    email: row.email?.trim().toLowerCase() ?? '',
  };
}

/**
 * Accept an invitation by token (invitation id). Caller must be authenticated and email must match.
 * @param {string} token - group_invitations.id
 * @param {string} userId
 * @param {string} userEmail
 * @returns {Promise<object>} group
 */
export async function acceptInvitationByToken(token, userId, userEmail) {
  if (!token || typeof token !== 'string') throw new NotFoundError('Invitation not found');
  const pool = getPool();
  const invResult = await pool.query(
    'SELECT group_id AS "groupId", email FROM group_invitations WHERE id = $1',
    [token.trim()]
  );
  if (invResult.rows.length === 0) throw new NotFoundError('Invitation not found');
  const groupId = invResult.rows[0].groupId;
  const invEmailNorm = (invResult.rows[0].email || '').trim().toLowerCase();
  const userEmailNorm = (userEmail || '').trim().toLowerCase();
  if (userEmailNorm !== invEmailNorm) {
    throw new ForbiddenError('Invitation email does not match your account');
  }
  const userRow = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
  if (userRow.rows.length === 0) throw new NotFoundError('User not found');
  await pool.query('DELETE FROM group_invitations WHERE id = $1', [token.trim()]);
  await pool.query(
    `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'member')
     ON CONFLICT (group_id, user_id) DO NOTHING`,
    [groupId, userId]
  );
  return getFullGroup(pool, groupId);
}

/**
 * @param {string} groupId
 * @param {string} userId
 * @param {string} userEmail
 * @returns {Promise<object>}
 */
export async function acceptInvitation(groupId, userId, userEmail) {
  const pool = getPool();
  const emailNorm = (userEmail || '').trim().toLowerCase();
  const inv = await pool.query(
    'SELECT id FROM group_invitations WHERE group_id = $1 AND lower(email) = $2',
    [groupId, emailNorm]
  );
  if (inv.rows.length === 0) throw new NotFoundError('Invitation not found');
  const userRow = await pool.query('SELECT id, email FROM users WHERE id = $1', [userId]);
  if (userRow.rows.length === 0) throw new NotFoundError('User not found');
  if (userRow.rows[0].email.trim().toLowerCase() !== emailNorm) {
    throw new ForbiddenError('Invitation email does not match your account');
  }
  await pool.query('DELETE FROM group_invitations WHERE group_id = $1 AND lower(email) = $2', [groupId, emailNorm]);
  await pool.query(
    `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'member')
     ON CONFLICT (group_id, user_id) DO NOTHING`,
    [groupId, userId]
  );
  return getFullGroup(pool, groupId);
}

/**
 * @param {string} groupId
 * @param {string} userId} caller
 * @param {string} targetUserId
 * @returns {Promise<object>}
 */
export async function removeMember(groupId, userId, targetUserId) {
  const pool = getPool();
  const isCallerAdmin = await isAdmin(pool, groupId, userId);
  const isSelf = userId === targetUserId;
  if (!isCallerAdmin && !isSelf) throw new ForbiddenError('Only admins can remove other members');
  const adminCount = await pool.query(
    "SELECT COUNT(*) AS n FROM group_members WHERE group_id = $1 AND role = 'admin'",
    [groupId]
  );
  const targetRole = await pool.query(
    'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, targetUserId]
  );
  if (targetRole.rows.length === 0) throw new NotFoundError('Member not found');
  if (targetRole.rows[0].role === 'admin' && Number(adminCount.rows[0].n) <= 1) {
    throw new ForbiddenError('Cannot remove the last admin');
  }
  await pool.query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, targetUserId]);
  return getFullGroup(pool, groupId);
}
