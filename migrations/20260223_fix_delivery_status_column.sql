-- Migration: Update delivery_status column to VARCHAR(50)
-- Run this in Supabase SQL Editor

-- Check current column type
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'delivery_status' AND column_name = 'delivery_status';

-- Alter column to VARCHAR(50) to accommodate status values
ALTER TABLE delivery_status ALTER COLUMN delivery_status TYPE VARCHAR(50);

-- Verify the change
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'delivery_status' AND column_name = 'delivery_status';

-- Status values used in the application:
-- 'pending'     (7 chars)
-- 'in_transit'  (10 chars)  
-- 'delivered'   (9 chars)
