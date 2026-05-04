-- =========================================================
-- Cities table - add cover_image column
-- Tourista Studio
-- NOTE: Run this script once after adding coverImage field to City entity.
-- If column already exists, this will fail — run manually or drop first.
-- =========================================================
ALTER TABLE cities ADD COLUMN cover_image VARCHAR(500) AFTER slug;
