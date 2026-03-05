ALTER TABLE audit_logs
  ADD COLUMN actor_name VARCHAR(120) NOT NULL DEFAULT 'Food Book User' AFTER actor_user_id,
  ADD COLUMN actor_email VARCHAR(191) NOT NULL DEFAULT 'unknown@foodbook.app' AFTER actor_name;

UPDATE audit_logs
LEFT JOIN users ON users.id = audit_logs.actor_user_id
SET
  audit_logs.actor_name = COALESCE(users.full_name, audit_logs.actor_name),
  audit_logs.actor_email = COALESCE(users.email, audit_logs.actor_email);

ALTER TABLE audit_logs
  DROP FOREIGN KEY fk_audit_logs_actor;

ALTER TABLE audit_logs
  MODIFY actor_user_id BIGINT UNSIGNED NULL;

ALTER TABLE audit_logs
  ADD CONSTRAINT fk_audit_logs_actor
  FOREIGN KEY (actor_user_id) REFERENCES users (id) ON DELETE SET NULL;
