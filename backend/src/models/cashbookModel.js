const pool = require("../config/db");

const buildFilters = ({ organizationId, userId, scope, fromDate, toDate, selectedUserId }) => {
  const clauses = [];
  const values = [];

  if (organizationId) {
    clauses.push("cashbook_entries.organization_id = ?");
    values.push(organizationId);
  } else {
    clauses.push("cashbook_entries.user_id = ?");
    values.push(userId);
  }

  if (scope === "own" && organizationId) {
    clauses.push("cashbook_entries.user_id = ?");
    values.push(userId);
  }

  if (scope === "all" && selectedUserId && organizationId) {
    clauses.push("cashbook_entries.user_id = ?");
    values.push(selectedUserId);
  }

  if (fromDate) {
    clauses.push("cashbook_entries.date >= ?");
    values.push(fromDate);
  }

  if (toDate) {
    clauses.push("cashbook_entries.date <= ?");
    values.push(toDate);
  }

  return {
    where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    values,
  };
};

const createEntry = async ({
  userId,
  organizationId,
  entryName,
  category,
  amount,
  date,
  description,
  entryType,
  paymentMethod,
}) => {
  const [result] = await pool.query(
    `INSERT INTO cashbook_entries (organization_id, user_id, entry_name, category, amount, date, description, entry_type, payment_method)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [organizationId, userId, entryName, category, amount, date, description, entryType, paymentMethod]
  );

  const [rows] = await pool.query(
    `SELECT cashbook_entries.*, users.email, users.full_name
     FROM cashbook_entries
     INNER JOIN users ON users.id = cashbook_entries.user_id
     WHERE cashbook_entries.id = ?`,
    [result.insertId]
  );

  return rows[0];
};

const getEntryById = async (id, organizationId) => {
  const values = [id];
  let where = "cashbook_entries.id = ?";

  if (organizationId) {
    where += " AND cashbook_entries.organization_id = ?";
    values.push(organizationId);
  }

  const [rows] = await pool.query(
    `SELECT cashbook_entries.*, users.email, users.full_name
     FROM cashbook_entries
     INNER JOIN users ON users.id = cashbook_entries.user_id
     WHERE ${where}`,
    values
  );

  return rows[0] || null;
};

const listEntries = async ({
  organizationId,
  userId,
  scope,
  page,
  limit,
  fromDate,
  toDate,
  selectedUserId,
}) => {
  const offset = (page - 1) * limit;
  const filters = buildFilters({ organizationId, userId, scope, fromDate, toDate, selectedUserId });
  const [rows] = await pool.query(
    `SELECT cashbook_entries.id, cashbook_entries.user_id, cashbook_entries.entry_name, cashbook_entries.category,
        cashbook_entries.amount, cashbook_entries.date, cashbook_entries.description, cashbook_entries.entry_type,
        cashbook_entries.payment_method, cashbook_entries.created_at, users.email, users.full_name
     FROM cashbook_entries
     INNER JOIN users ON users.id = cashbook_entries.user_id
     ${filters.where}
     ORDER BY cashbook_entries.date DESC, cashbook_entries.created_at DESC
     LIMIT ? OFFSET ?`,
    [...filters.values, limit, offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM cashbook_entries
     ${filters.where}`,
    filters.values
  );

  const [summaryRows] = await pool.query(
    `SELECT
        COALESCE(SUM(CASE WHEN cashbook_entries.entry_type = 'Credit' THEN cashbook_entries.amount ELSE 0 END), 0) AS total_credit,
        COALESCE(SUM(CASE WHEN cashbook_entries.entry_type = 'Debit' THEN cashbook_entries.amount ELSE 0 END), 0) AS total_debit
     FROM cashbook_entries
     ${filters.where}`,
    filters.values
  );

  const summary = summaryRows[0] || { total_credit: 0, total_debit: 0 };

  return {
    items: rows,
    summary: {
      totalCredit: Number(summary.total_credit || 0),
      totalDebit: Number(summary.total_debit || 0),
      balance: Number(summary.total_credit || 0) - Number(summary.total_debit || 0),
    },
    pagination: {
      page,
      limit,
      total: countRows[0].total,
      totalPages: Math.max(1, Math.ceil(countRows[0].total / limit)),
    },
  };
};

const updateEntry = async ({
  id,
  entryName,
  category,
  amount,
  date,
  description,
  entryType,
  paymentMethod,
}) => {
  await pool.query(
    `UPDATE cashbook_entries
     SET entry_name = ?, category = ?, amount = ?, date = ?, description = ?, entry_type = ?, payment_method = ?
     WHERE id = ?`,
    [entryName, category, amount, date, description, entryType, paymentMethod, id]
  );

  return getEntryById(id);
};

const deleteEntry = async (id) => {
  await pool.query("DELETE FROM cashbook_entries WHERE id = ?", [id]);
};

const getAdminSummary = async ({ organizationId, selectedUserId }) => {
  const filters = ["cashbook_entries.organization_id = ?"];
  const values = [organizationId];
  if (selectedUserId) {
    filters.push("cashbook_entries.user_id = ?");
    values.push(selectedUserId);
  }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const [summaryRows] = await pool.query(
    `SELECT
        COUNT(*) AS total_entries,
        COALESCE(SUM(CASE WHEN cashbook_entries.entry_type = 'Credit' THEN cashbook_entries.amount ELSE 0 END), 0) AS total_credit,
        COALESCE(SUM(CASE WHEN cashbook_entries.entry_type = 'Debit' THEN cashbook_entries.amount ELSE 0 END), 0) AS total_debit
     FROM cashbook_entries
     ${where}`,
    values
  );

  const [userSummaryRows] = await pool.query(
    `SELECT users.id AS user_id, users.email,
        COUNT(cashbook_entries.id) AS entry_count,
        COALESCE(SUM(CASE WHEN cashbook_entries.entry_type = 'Credit' THEN cashbook_entries.amount ELSE 0 END), 0) AS total_credit,
        COALESCE(SUM(CASE WHEN cashbook_entries.entry_type = 'Debit' THEN cashbook_entries.amount ELSE 0 END), 0) AS total_debit
     FROM users
     LEFT JOIN cashbook_entries ON cashbook_entries.user_id = users.id AND cashbook_entries.organization_id = users.organization_id
     WHERE users.organization_id = ?
     GROUP BY users.id, users.email
     ORDER BY users.email ASC`
    ,
    [organizationId]
  );

  return {
    summary: {
      totalEntries: Number(summaryRows[0].total_entries || 0),
      totalCredit: Number(summaryRows[0].total_credit || 0),
      totalDebit: Number(summaryRows[0].total_debit || 0),
      balance:
        Number(summaryRows[0].total_credit || 0) -
        Number(summaryRows[0].total_debit || 0),
    },
    users: userSummaryRows,
  };
};

module.exports = {
  createEntry,
  getEntryById,
  listEntries,
  updateEntry,
  deleteEntry,
  getAdminSummary,
};
