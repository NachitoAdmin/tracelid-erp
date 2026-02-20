-- Add category column to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category TEXT;

-- Create index for faster category queries
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
