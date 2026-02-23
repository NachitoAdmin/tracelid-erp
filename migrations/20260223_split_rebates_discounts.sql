-- Migration: Create separate rebates and discounts tables
-- Run this in Supabase SQL Editor

-- Create rebates table
CREATE TABLE IF NOT EXISTS rebates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    customer_id TEXT,
    product_id TEXT,
    rebate_amount DECIMAL(12,2) DEFAULT 0,
    quantity_target DECIMAL(12,2),
    quantity_unit TEXT,
    valid_from DATE,
    valid_to DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create discounts table
CREATE TABLE IF NOT EXISTS discounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    customer_id TEXT,
    product_id TEXT,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    quantity_target DECIMAL(12,2),
    quantity_unit TEXT,
    valid_from DATE,
    valid_to DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rebates_tenant ON rebates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rebates_customer ON rebates(customer_id);
CREATE INDEX IF NOT EXISTS idx_rebates_product ON rebates(product_id);

CREATE INDEX IF NOT EXISTS idx_discounts_tenant ON discounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_discounts_customer ON discounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_discounts_product ON discounts(product_id);

-- Enable RLS
ALTER TABLE rebates ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- Grant privileges
GRANT ALL PRIVILEGES ON TABLE rebates TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE discounts TO anon, authenticated, service_role;

-- Create RLS policies for service role
CREATE POLICY "Allow service role full access" ON rebates
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow service role full access" ON discounts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create RLS policies for anon/authenticated
CREATE POLICY "Allow all operations" ON rebates
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations" ON discounts
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Verify table creation
SELECT 'rebates table created' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'rebates' 
ORDER BY ordinal_position;

SELECT 'discounts table created' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'discounts' 
ORDER BY ordinal_position;
