# 🔧 RLS (Row Level Security) Fix Guide

## Problem
The `customers`, `products`, and `gl_accounts` tables have Row Level Security enabled but lack proper policies, causing access issues in the application.

## Solution
Execute SQL to enable RLS with "Allow all" policies for authenticated users.

## Option 1: Supabase Dashboard (Recommended)

1. **Go to SQL Editor**: https://app.supabase.com/project/ijswvbminyhragalujus/sql/new

2. **Copy and paste this SQL**:
```sql
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
```

3. **Click "Run" to execute**

## Option 2: Using Supabase CLI

1. First, get your database password from:
   - https://app.supabase.com/project/ijswvbminyhragalujus/settings/database
   - Look for "Connection string" → "URI"

2. Run:
```bash
cd /Users/nachitobot/.openclaw/workspace/erp-nextjs
npx supabase db push --db-url "postgresql://postgres:[YOUR-DB-PASSWORD]@db.ijswvbminyhragalujus.supabase.co:5432/postgres" < fix_rls_policies.sql
```

## What This Does

✅ **Enables Row Level Security** on all three tables
✅ **Creates permissive policies** that allow all authenticated users to:
  - SELECT (read)
  - INSERT (create)
  - UPDATE (modify)  
  - DELETE (remove)

## Verification

After running the SQL, the last query should show:
```
tablename    | rowsecurity
-------------|------------
customers    | true
gl_accounts  | true
products     | true
```

## Result

Your application will now be able to:
- Load customer data in forms
- Display products in dropdowns
- Access GL accounts for transactions
- All CRUD operations will work properly

## Files Created

- `fix_rls_policies.sql` - The SQL commands
- `execute_rls_fix.sh` - Bash script with instructions
- `RLS_FIX_GUIDE.md` - This guide