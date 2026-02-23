-- Migration: Create product_costs and rebates_discounts tables
-- Run this in Supabase SQL Editor

-- Create product_costs table
CREATE TABLE IF NOT EXISTS product_costs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    cost_amount DECIMAL(12,2) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create rebates_discounts table
CREATE TABLE IF NOT EXISTS rebates_discounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    customer_id TEXT,
    product_id TEXT,
    rebate_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    valid_from DATE,
    valid_to DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_costs_tenant ON product_costs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_costs_product ON product_costs(product_id);
CREATE INDEX IF NOT EXISTS idx_product_costs_date ON product_costs(date);

CREATE INDEX IF NOT EXISTS idx_rebates_discounts_tenant ON rebates_discounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rebates_discounts_customer ON rebates_discounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_rebates_discounts_product ON rebates_discounts(product_id);

-- Enable RLS
ALTER TABLE product_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rebates_discounts ENABLE ROW LEVEL SECURITY;

-- Grant privileges
GRANT ALL PRIVILEGES ON TABLE product_costs TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE rebates_discounts TO anon, authenticated, service_role;

-- Create RLS policies for service role
CREATE POLICY "Allow service role full access" ON product_costs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow service role full access" ON rebates_discounts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create RLS policies for anon/authenticated
CREATE POLICY "Allow all operations" ON product_costs
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations" ON rebates_discounts
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Verify table creation
SELECT 'product_costs table created' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'product_costs' 
ORDER BY ordinal_position;

SELECT 'rebates_discounts table created' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'rebates_discounts' 
ORDER BY ordinal_position;
