USE railway;
START TRANSACTION;

SET @dbname = DATABASE();
SET @tablename = 'reviews';
SET @columnname = 'admin_status';

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    'ALTER TABLE reviews ADD COLUMN admin_status ENUM("PENDING","APPROVED","REJECTED") NOT NULL DEFAULT "APPROVED" AFTER is_published'
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

COMMIT;

SELECT 'Migration completed: admin_status column added to reviews' AS result;
