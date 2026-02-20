-- Add password column to Tenant table
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS password TEXT;

-- Verify column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Tenant';
