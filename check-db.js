-- Make client_id nullable for anonymous chat conversations
ALTER TABLE conversations MODIFY COLUMN client_id BIGINT NULL;
