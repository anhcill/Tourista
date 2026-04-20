-- Fix refresh_tokens table: thêm AUTO_INCREMENT cho cột id
-- Chạy lệnh này trên Railway MySQL

ALTER TABLE refresh_tokens
  MODIFY COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;

-- Verify
SHOW COLUMNS FROM refresh_tokens WHERE Field = 'id';
