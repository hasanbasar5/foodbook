const pool = require("../config/db");

const createLoginEvent = async ({
  userId = null,
  organizationId = null,
  email,
  eventType = "LOGIN",
  status,
  ipAddress,
  userAgent,
  failureReason = null,
}) => {
  await pool.query(
    `INSERT INTO login_events
      (user_id, organization_id, email, event_type, status, ip_address, user_agent, failure_reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, organizationId, email, eventType, status, ipAddress || null, userAgent || null, failureReason]
  );
};

const getOwnerLoginStats = async () => {
  const [summaryRows] = await pool.query(
    `SELECT
        COUNT(*) AS total_events,
        SUM(CASE WHEN event_type = 'REGISTER' AND status = 'SUCCESS' THEN 1 ELSE 0 END) AS total_registrations,
        SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) AS successful_logins,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failed_logins,
        COUNT(DISTINCT CASE WHEN status = 'SUCCESS' AND created_at >= NOW() - INTERVAL 1 DAY THEN email END) AS active_users_1d,
        COUNT(DISTINCT CASE WHEN status = 'SUCCESS' AND created_at >= NOW() - INTERVAL 7 DAY THEN email END) AS active_users_7d,
        COUNT(DISTINCT CASE WHEN status = 'SUCCESS' AND created_at >= NOW() - INTERVAL 30 DAY THEN email END) AS active_users_30d
     FROM login_events`
  );

  const [recentRows] = await pool.query(
    `SELECT login_events.id, login_events.user_id, login_events.organization_id, login_events.email,
        login_events.event_type,
        login_events.status, login_events.ip_address, login_events.user_agent, login_events.failure_reason,
        login_events.created_at, users.full_name, organizations.name AS organization_name
     FROM login_events
     LEFT JOIN users ON users.id = login_events.user_id
     LEFT JOIN organizations ON organizations.id = login_events.organization_id
     ORDER BY login_events.created_at DESC
     LIMIT 50`
  );

  const [lastLoginRows] = await pool.query(
    `SELECT latest.email, latest.user_id, latest.organization_id, latest.created_at,
        users.full_name, organizations.name AS organization_name
     FROM (
       SELECT email, MAX(created_at) AS created_at,
              MAX(user_id) AS user_id, MAX(organization_id) AS organization_id
       FROM login_events
       WHERE status = 'SUCCESS'
       GROUP BY email
     ) AS latest
     LEFT JOIN users ON users.id = latest.user_id
     LEFT JOIN organizations ON organizations.id = latest.organization_id
     ORDER BY latest.created_at DESC
     LIMIT 50`
  );

  return {
    summary: {
      totalEvents: Number(summaryRows[0]?.total_events || 0),
      totalRegistrations: Number(summaryRows[0]?.total_registrations || 0),
      successfulLogins: Number(summaryRows[0]?.successful_logins || 0),
      failedLogins: Number(summaryRows[0]?.failed_logins || 0),
      activeUsers1d: Number(summaryRows[0]?.active_users_1d || 0),
      activeUsers7d: Number(summaryRows[0]?.active_users_7d || 0),
      activeUsers30d: Number(summaryRows[0]?.active_users_30d || 0),
    },
    items: recentRows,
    lastLogins: lastLoginRows,
  };
};

module.exports = {
  createLoginEvent,
  getOwnerLoginStats,
};
