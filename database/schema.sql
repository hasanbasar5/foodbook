CREATE DATABASE IF NOT EXISTS foodbook;
USE foodbook;

CREATE TABLE IF NOT EXISTS organizations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_organizations_slug (slug)
);

CREATE TABLE IF NOT EXISTS roles (
  id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(32) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_name (name)
);

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED NULL DEFAULT NULL,
  email VARCHAR(191) NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(120) NOT NULL DEFAULT 'Food Book User',
  avatar_url MEDIUMTEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  role_id TINYINT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_organization_id (organization_id),
  KEY idx_users_role_id (role_id),
  CONSTRAINT fk_users_organization FOREIGN KEY (organization_id) REFERENCES organizations (id),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_refresh_token_hash (token_hash),
  KEY idx_refresh_tokens_user_id (user_id),
  KEY idx_refresh_tokens_expires_at (expires_at),
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cashbook_entries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED NULL DEFAULT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  entry_name VARCHAR(120) NOT NULL,
  category VARCHAR(80) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  description VARCHAR(255) NOT NULL,
  entry_type ENUM('Debit', 'Credit') NOT NULL,
  payment_method ENUM('Cash', 'Online', 'Card', 'UPI') NOT NULL DEFAULT 'Cash',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_cashbook_organization_id (organization_id),
  KEY idx_cashbook_user_date (user_id, date),
  KEY idx_cashbook_date (date),
  KEY idx_cashbook_type (entry_type),
  CONSTRAINT fk_cashbook_organization FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT fk_cashbook_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

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

INSERT INTO organizations (id, name, slug)
VALUES
  (1, 'Food Book Demo Organization', 'food-book-demo')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  slug = VALUES(slug);

INSERT INTO roles (id, name)
VALUES
  (1, 'USER'),
  (2, 'ADMIN'),
  (3, 'SUPER_ADMIN')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO users (organization_id, email, password, full_name, is_active, role_id)
VALUES
  (1, 'user@foodbook.app', '$2b$12$SjDmhKwPUF/uJhvzVMXCaeCJsSBEsSwjg3r/ZYpu89dysmEo2oxje', 'Default User', 1, 1),
  (1, 'admin@foodbook.app', '$2b$12$SjDmhKwPUF/uJhvzVMXCaeCJsSBEsSwjg3r/ZYpu89dysmEo2oxje', 'Default Admin', 1, 2),
  (1, 'superadmin@foodbook.app', '$2b$12$SjDmhKwPUF/uJhvzVMXCaeCJsSBEsSwjg3r/ZYpu89dysmEo2oxje', 'Default Super Admin', 1, 3)
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  is_active = VALUES(is_active),
  role_id = VALUES(role_id);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS organization_id BIGINT UNSIGNED NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(120) NOT NULL DEFAULT 'Food Book User',
  ADD COLUMN IF NOT EXISTS avatar_url MEDIUMTEXT NULL,
  ADD COLUMN IF NOT EXISTS is_active TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE cashbook_entries
  ADD COLUMN IF NOT EXISTS organization_id BIGINT UNSIGNED NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS entry_name VARCHAR(120) NOT NULL DEFAULT 'General entry',
  ADD COLUMN IF NOT EXISTS category VARCHAR(80) NOT NULL DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS payment_method ENUM('Cash', 'Online', 'Card', 'UPI') NOT NULL DEFAULT 'Cash';
