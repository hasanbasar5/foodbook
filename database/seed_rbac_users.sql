INSERT INTO users (email, password, full_name, is_active, role_id)
VALUES
  ('user@foodbook.app', '$2b$12$SjDmhKwPUF/uJhvzVMXCaeCJsSBEsSwjg3r/ZYpu89dysmEo2oxje', 'Default User', 1, 1),
  ('admin@foodbook.app', '$2b$12$SjDmhKwPUF/uJhvzVMXCaeCJsSBEsSwjg3r/ZYpu89dysmEo2oxje', 'Default Admin', 1, 2),
  ('superadmin@foodbook.app', '$2b$12$SjDmhKwPUF/uJhvzVMXCaeCJsSBEsSwjg3r/ZYpu89dysmEo2oxje', 'Default Super Admin', 1, 3)
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  is_active = VALUES(is_active),
  role_id = VALUES(role_id);

-- Password for all seeded accounts: password123
