ALTER TABLE organizations
  ADD COLUMN allowed_file_types TEXT NULL,
  ADD COLUMN allowed_mime_types TEXT NULL,
  ADD COLUMN max_file_size BIGINT NULL,
  ADD COLUMN malware_scan_enabled TINYINT(1) NOT NULL DEFAULT 0;
