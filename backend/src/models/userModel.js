const pool = require("../config/db");

const mapUser = (row) =>
  row
    ? {
        id: row.id,
        organizationId: row.organization_id ?? null,
        organizationName: row.organization_name ?? null,
        email: row.email,
        password: row.password,
        fullName: row.full_name,
        avatarUrl: row.avatar_url,
        isActive: Boolean(row.is_active),
        roleId: row.role_id,
        role: row.role,
        createdAt: row.created_at,
      }
    : null;

const findByEmail = async (email) => {
  const [rows] = await pool.query(
    `SELECT users.id, users.organization_id, organizations.name AS organization_name, users.email, users.password, users.full_name, users.avatar_url, users.is_active, users.role_id, roles.name AS role, users.created_at
     FROM users
     LEFT JOIN organizations ON organizations.id = users.organization_id
     INNER JOIN roles ON roles.id = users.role_id
     WHERE users.email = ?`,
    [email]
  );

  return mapUser(rows[0]);
};

const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT users.id, users.organization_id, organizations.name AS organization_name, users.email, users.password, users.full_name, users.avatar_url, users.is_active, users.role_id, roles.name AS role, users.created_at
     FROM users
     LEFT JOIN organizations ON organizations.id = users.organization_id
     INNER JOIN roles ON roles.id = users.role_id
     WHERE users.id = ?`,
    [id]
  );

  return mapUser(rows[0]);
};

const createUser = async ({
  organizationId,
  email,
  password,
  roleId,
  fullName,
  avatarUrl,
  isActive,
}) => {
  const [result] = await pool.query(
    "INSERT INTO users (organization_id, email, password, role_id, full_name, avatar_url, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      organizationId ?? null,
      email,
      password,
      roleId,
      fullName || "Food Book User",
      avatarUrl || null,
      isActive === false ? 0 : 1,
    ]
  );

  return findById(result.insertId);
};

const listUsers = async ({ organizationId, page, limit, search, status }) => {
  const offset = (page - 1) * limit;
  const clauses = ["users.organization_id = ?"];
  const values = [organizationId];

  if (search) {
    clauses.push("(users.email LIKE ? OR users.full_name LIKE ?)");
    values.push(`%${search}%`, `%${search}%`);
  }

  if (status === "active") {
    clauses.push("users.is_active = 1");
  } else if (status === "inactive") {
    clauses.push("users.is_active = 0");
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const [rows] = await pool.query(
    `SELECT users.id, users.email, roles.name AS role, users.created_at,
        users.full_name, users.avatar_url, users.is_active,
        COUNT(cashbook_entries.id) AS entry_count,
        COALESCE(SUM(CASE WHEN cashbook_entries.entry_type = 'Credit' THEN cashbook_entries.amount ELSE 0 END), 0) AS total_credit,
        COALESCE(SUM(CASE WHEN cashbook_entries.entry_type = 'Debit' THEN cashbook_entries.amount ELSE 0 END), 0) AS total_debit
     FROM users
     INNER JOIN roles ON roles.id = users.role_id
     LEFT JOIN cashbook_entries
       ON cashbook_entries.user_id = users.id
      AND cashbook_entries.organization_id = users.organization_id
     ${where}
     GROUP BY users.id, users.email, users.full_name, users.avatar_url, users.is_active, roles.name, users.created_at
     ORDER BY users.created_at DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );
  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM users ${where}`,
    values
  );

  return {
    items: rows,
    pagination: {
      page,
      limit,
      total: countRows[0].total,
      totalPages: Math.max(1, Math.ceil(countRows[0].total / limit)),
    },
  };
};

const updateUserRole = async ({ organizationId, userId, roleId }) => {
  await pool.query("UPDATE users SET role_id = ? WHERE id = ? AND organization_id = ?", [
    roleId,
    userId,
    organizationId,
  ]);
  return findById(userId);
};

const updateProfile = async ({ userId, fullName, avatarUrl }) => {
  await pool.query(
    "UPDATE users SET full_name = ?, avatar_url = ? WHERE id = ?",
    [fullName, avatarUrl || null, userId]
  );
  return findById(userId);
};

const updateManagedUser = ({
  organizationId,
  userId,
  fullName,
  avatarUrl,
  roleId,
  password,
  isActive,
}) => {
  if (password) {
    return pool
      .query(
        "UPDATE users SET full_name = ?, avatar_url = ?, role_id = ?, password = ?, is_active = ? WHERE id = ? AND organization_id = ?",
        [fullName, avatarUrl || null, roleId, password, isActive === false ? 0 : 1, userId, organizationId]
      )
      .then(() => findById(userId));
  } else {
    return pool
      .query(
        "UPDATE users SET full_name = ?, avatar_url = ?, role_id = ?, is_active = ? WHERE id = ? AND organization_id = ?",
        [fullName, avatarUrl || null, roleId, isActive === false ? 0 : 1, userId, organizationId]
      )
      .then(() => findById(userId));
  }
};

const deleteUser = async ({ organizationId, userId }) => {
  await pool.query("DELETE FROM users WHERE id = ? AND organization_id = ?", [userId, organizationId]);
};

const setUserStatus = async ({ organizationId, userId, isActive }) => {
  await pool.query("UPDATE users SET is_active = ? WHERE id = ? AND organization_id = ?", [
    isActive ? 1 : 0,
    userId,
    organizationId,
  ]);
  return findById(userId);
};

const resetUserPassword = async ({ organizationId, userId, passwordHash }) => {
  await pool.query("UPDATE users SET password = ? WHERE id = ? AND organization_id = ?", [
    passwordHash,
    userId,
    organizationId,
  ]);
  return findById(userId);
};

module.exports = {
  findByEmail,
  findById,
  createUser,
  listUsers,
  updateUserRole,
  updateProfile,
  updateManagedUser,
  deleteUser,
  setUserStatus,
  resetUserPassword,
};
