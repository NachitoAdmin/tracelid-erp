-- Add category column to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category TEXT;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions';
