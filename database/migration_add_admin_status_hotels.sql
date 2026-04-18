-- ============================================================
-- Migration: Add admin_status column to hotels table
-- Run this script ONCE on your existing database
-- ============================================================

USE tourista;

START TRANSACTION;

-- Add admin_status column if it doesn't exist
SET @dbname = DATABASE();
SET @tablename = 'hotels';
SET @columnname = 'admin_status';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    'ALTER TABLE hotels ADD COLUMN admin_status ENUM("PENDING","APPROVED","REJECTED","SUSPENDED") NOT NULL DEFAULT "APPROVED" AFTER is_trending'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

COMMIT;

SELECT 'Migration completed: admin_status column added to hotels table' AS result;
