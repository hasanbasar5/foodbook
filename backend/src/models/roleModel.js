const pool = require("../config/db");

const findRoleByName = async (name) => {
  const [rows] = await pool.query("SELECT id, name FROM roles WHERE name = ?", [
    name,
  ]);
  return rows[0] || null;
};

module.exports = {
  findRoleByName,
};
