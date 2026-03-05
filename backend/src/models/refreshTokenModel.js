const pool = require("../config/db");

const createRefreshToken = async ({ userId, tokenHash, expiresAt }) => {
  await pool.query(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    [userId, tokenHash, expiresAt]
  );
};

const findRefreshToken = async (tokenHash) => {
  const [rows] = await pool.query(
    `SELECT refresh_tokens.id, refresh_tokens.user_id, refresh_tokens.token_hash, refresh_tokens.expires_at,
        users.email, roles.name AS role
     FROM refresh_tokens
     INNER JOIN users ON users.id = refresh_tokens.user_id
     INNER JOIN roles ON roles.id = users.role_id
     WHERE refresh_tokens.token_hash = ?`,
    [tokenHash]
  );

  return rows[0] || null;
};

const deleteRefreshToken = async (tokenHash) => {
  await pool.query("DELETE FROM refresh_tokens WHERE token_hash = ?", [tokenHash]);
};

const deleteUserRefreshTokens = async (userId) => {
  await pool.query("DELETE FROM refresh_tokens WHERE user_id = ?", [userId]);
};

module.exports = {
  createRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  deleteUserRefreshTokens,
};
