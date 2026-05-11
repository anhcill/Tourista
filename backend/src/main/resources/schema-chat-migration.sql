-- Migration: Add flow_type column to session_recommendation_states
-- This column tracks whether the active recommendation flow is TOUR or HOTEL
-- to prevent intent mismatches when user responds to hotel prompt.

-- Only add column if it doesn't already exist (ignore error if already there)
DROP PROCEDURE IF EXISTS add_flow_type_column;

DELIMITER //
CREATE PROCEDURE add_flow_type_column()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'session_recommendation_states'
          AND COLUMN_NAME = 'flow_type'
    ) THEN
        ALTER TABLE session_recommendation_states
        ADD COLUMN flow_type VARCHAR(20) AFTER conversation_id;
    END IF;
END //
DELIMITER ;

CALL add_flow_type_column();
DROP PROCEDURE IF EXISTS add_flow_type_column;
