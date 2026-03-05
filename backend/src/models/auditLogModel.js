const pool = require("../config/db");

const createAuditLog = async ({
  organizationId,
  actorUserId,
  actorRole,
  action,
  targetType,
  targetId,
  details,
}) => {
  if (!organizationId) {
    return;
  }

  await pool.query(
    `INSERT INTO audit_logs
      (organization_id, actor_user_id, actor_name, actor_email, actor_role, action, target_type, target_id, details)
     VALUES (
      ?, ?,
      COALESCE((SELECT full_name FROM users WHERE id = ?), 'Deleted user'),
      COALESCE((SELECT email FROM users WHERE id = ?), 'unknown@foodbook.app'),
      ?, ?, ?, ?, ?
     )`,
    [
      organizationId,
      actorUserId,
      actorUserId,
      actorUserId,
      actorRole,
      action,
      targetType,
      targetId || null,
      details ? JSON.stringify(details) : null,
    ]
  );
};

const listAuditLogs = async ({ organizationId, limit = 20 }) => {
  const [rows] = await pool.query(
    `SELECT audit_logs.id, audit_logs.action, audit_logs.target_type, audit_logs.target_id,
        audit_logs.details, audit_logs.created_at, audit_logs.actor_role,
        audit_logs.actor_name, audit_logs.actor_email
     FROM audit_logs
     WHERE audit_logs.organization_id = ?
     ORDER BY audit_logs.created_at DESC
     LIMIT ?`,
    [organizationId, limit]
  );

  return rows.map((row) => ({
    ...row,
    details: row.details ? JSON.parse(row.details) : null,
  }));
};

module.exports = {
  createAuditLog,
  listAuditLogs,
};
