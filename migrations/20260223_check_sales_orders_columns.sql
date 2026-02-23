-- Check sales_orders table columns
-- Run this in Supabase SQL Editor to see exact columns

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sales_orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;
