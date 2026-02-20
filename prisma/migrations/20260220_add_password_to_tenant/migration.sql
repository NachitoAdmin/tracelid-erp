-- Migration: Add password column to Tenant table
-- Created: 2026-02-20

-- Add password column
ALTER TABLE "Tenant" 
ADD COLUMN IF NOT EXISTS password TEXT;

-- Verify column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Tenant' 
ORDER BY ordinal_position;
