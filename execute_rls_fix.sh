#!/bin/bash

# RLS Fix Script for Supabase DEV Database
# This script executes SQL to fix Row Level Security policies

echo "🔧 Fixing RLS policies on customers, products, and gl_accounts tables..."
echo ""
echo "⚠️  IMPORTANT: This script requires the real SUPABASE_SERVICE_KEY"
echo "   If you haven't updated it yet, please:"
echo "   1. Go to https://app.supabase.com/project/ijswvbminyhragalujus/settings/api"
echo "   2. Copy the 'service_role' key"
echo "   3. Update SUPABASE_SERVICE_KEY in .env.local"
echo ""

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check if service key is set
if [[ "$SUPABASE_SERVICE_KEY" == *"placeholder"* ]]; then
    echo "❌ Error: SUPABASE_SERVICE_KEY contains 'placeholder'"
    echo "Please update it with the real service role key first!"
    exit 1
fi

echo "📋 Manual execution instructions:"
echo "=================================="
echo ""
echo "Please go to your Supabase SQL Editor:"
echo "https://app.supabase.com/project/ijswvbminyhragalujus/sql/new"
echo ""
echo "And execute the following SQL:"
echo ""
cat fix_rls_policies.sql
echo ""
echo "=================================="
echo ""
echo "This will:"
echo "✅ Enable Row Level Security on customers, products, and gl_accounts tables"
echo "✅ Create 'Allow all' policies for authenticated users"
echo "✅ Allow your application to read/write these tables"

# Alternative: Direct API approach (if you have the service key)
echo ""
echo "Alternatively, if you have updated the service key, you can use the Supabase CLI:"
echo "npx supabase db push --db-url postgresql://postgres:[YOUR-DB-PASSWORD]@db.ijswvbminyhragalujus.supabase.co:5432/postgres < fix_rls_policies.sql"