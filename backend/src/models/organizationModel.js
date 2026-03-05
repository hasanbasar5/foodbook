const pool = require("../config/db");

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "organization";

const findBySlug = async (slug) => {
  const [rows] = await pool.query(
    "SELECT id, name, slug, created_at FROM organizations WHERE slug = ?",
    [slug]
  );
  return rows[0] || null;
};

const createOrganization = async (name) => {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let suffix = 1;

  while (await findBySlug(slug)) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const [result] = await pool.query(
    "INSERT INTO organizations (name, slug) VALUES (?, ?)",
    [name, slug]
  );

  const [rows] = await pool.query(
    "SELECT id, name, slug, created_at FROM organizations WHERE id = ?",
    [result.insertId]
  );

  return rows[0];
};

module.exports = {
  createOrganization,
};
