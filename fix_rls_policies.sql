-- Fix RLS policies on customers, products, and gl_accounts tables
-- Allow all operations for authenticated users

-- Fix customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON customers;
CREATE POLICY "Allow all" ON customers 
  FOR ALL 
  USING (true);

-- Fix products table  
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON products;
CREATE POLICY "Allow all" ON products 
  FOR ALL 
  USING (true);

-- Fix gl_accounts table
ALTER TABLE gl_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON gl_accounts;
CREATE POLICY "Allow all" ON gl_accounts 
  FOR ALL 
  USING (true);

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('customers', 'products', 'gl_accounts');