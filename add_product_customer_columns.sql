-- Add product and customer columns to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS product_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS customer_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions';
