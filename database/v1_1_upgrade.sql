ALTER TABLE users
  ADD COLUMN full_name VARCHAR(120) NOT NULL DEFAULT 'Food Book User' AFTER password,
  ADD COLUMN avatar_url MEDIUMTEXT NULL AFTER full_name,
  ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER avatar_url;

ALTER TABLE cashbook_entries
  ADD COLUMN entry_name VARCHAR(120) NOT NULL DEFAULT 'General entry' AFTER user_id,
  ADD COLUMN category VARCHAR(80) NOT NULL DEFAULT 'General' AFTER entry_name,
  ADD COLUMN payment_method ENUM('Cash', 'Online', 'Card', 'UPI') NOT NULL DEFAULT 'Cash' AFTER entry_type;
