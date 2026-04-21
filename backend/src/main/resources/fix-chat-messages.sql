-- Script fix: Add AUTO_INCREMENT to chat_messages.id
-- Run this SQL in your MySQL database (e.g., via phpMyAdmin or mysql CLI)

-- Step 1: Check current state
-- DESCRIBE chat_messages;

-- Step 2: If id column exists but doesn't have AUTO_INCREMENT, run:
ALTER TABLE chat_messages MODIFY COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;

-- If the above fails because there's data, you may need to:
-- 1. Make sure there are no FK constraints referencing chat_messages.id (there shouldn't be)
-- 2. Then run the ALTER

-- Step 3: Verify
-- SHOW COLUMNS FROM chat_messages WHERE Field = 'id';
-- You should see: Extra = 'auto_increment'
