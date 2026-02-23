-- Migration: Create journal_entries table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    account_code TEXT NOT NULL,
    debit DECIMAL(12,2) DEFAULT 0,
    credit DECIMAL(12,2) DEFAULT 0,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant ON journal_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_account ON journal_entries(account_code);

-- Enable RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Grant privileges (allows service role to access)
GRANT ALL PRIVILEGES ON TABLE journal_entries TO anon, authenticated, service_role;

-- Create RLS policy for service role (bypasses all checks)
CREATE POLICY "Allow service role full access" ON journal_entries
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create RLS policy for anon/authenticated (for direct access if needed)
CREATE POLICY "Allow all operations" ON journal_entries
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Verify table creation
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'journal_entries' 
ORDER BY ordinal_position;
