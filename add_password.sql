-- Add password column to Tenant table
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS password TEXT;

-- Update RLS to allow password checks
CREATE POLICY IF NOT EXISTS "Allow password check" ON "Tenant"
  FOR SELECT USING (true);
