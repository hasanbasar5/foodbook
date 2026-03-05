CREATE TABLE IF NOT EXISTS organizations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_organizations_slug (slug)
);

INSERT INTO organizations (id, name, slug)
VALUES
  (1, 'Food Book Demo Organization', 'food-book-demo')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  slug = VALUES(slug);

ALTER TABLE users
  ADD COLUMN organization_id BIGINT UNSIGNED NOT NULL DEFAULT 1 AFTER id;

UPDATE users SET organization_id = 1 WHERE organization_id IS NULL OR organization_id = 0;

ALTER TABLE users
  ADD KEY idx_users_organization_id (organization_id),
  ADD CONSTRAINT fk_users_organization FOREIGN KEY (organization_id) REFERENCES organizations (id);

ALTER TABLE cashbook_entries
  ADD COLUMN organization_id BIGINT UNSIGNED NOT NULL DEFAULT 1 AFTER id;

UPDATE cashbook_entries SET organization_id = 1 WHERE organization_id IS NULL OR organization_id = 0;

ALTER TABLE cashbook_entries
  ADD KEY idx_cashbook_organization_id (organization_id),
  ADD CONSTRAINT fk_cashbook_organization FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED NOT NULL,
  actor_user_id BIGINT UNSIGNED NULL,
  actor_name VARCHAR(120) NOT NULL,
  actor_email VARCHAR(191) NOT NULL,
  actor_role VARCHAR(32) NOT NULL,
  action VARCHAR(120) NOT NULL,
  target_type VARCHAR(60) NOT NULL,
  target_id BIGINT UNSIGNED NULL,
  details JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_logs_org_created (organization_id, created_at),
  KEY idx_audit_logs_actor_user_id (actor_user_id),
  CONSTRAINT fk_audit_logs_organization FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT fk_audit_logs_actor FOREIGN KEY (actor_user_id) REFERENCES users (id) ON DELETE SET NULL
);
