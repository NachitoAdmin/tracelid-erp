#!/bin/bash
# TRACELID DEV Schema Sync Script
# Applies the migration to add missing columns to DEV database

set -e

echo "🔄 TRACELID DEV Schema Sync"
echo "============================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "prisma/schema.prisma" ]; then
    echo -e "${RED}❌ Error: Must run from erp-nextjs directory${NC}"
    echo "   cd erp-nextjs && ./sync-dev-schema.sh"
    exit 1
fi

echo "📋 Migration: Add columns to transactions table"
echo "   - category"
echo "   - product_id"
echo "   - product_name"
echo "   - customer_id"
echo "   - customer_name"
echo ""

# Check for required env vars
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not set${NC}"
    echo "   Using DEV database from .env.dev"
    export DATABASE_URL="postgresql://postgres:***REMOVED***@db.cenqqxpbnserkgdpptjw.supabase.co:5432/postgres"
fi

echo "🎯 Target: DEV database"
echo "   URL: https://cenqqxpbnserkgdpptjw.supabase.co"
echo ""

# Step 1: Backup reminder
echo -e "${YELLOW}⚠️  IMPORTANT: Backup your database before proceeding!${NC}"
echo "   Visit: https://app.supabase.com/project/cenqqxpbnserkgdpptjw/database/backups"
echo ""
read -p "Have you created a backup? (yes/no): " backup_confirm

if [ "$backup_confirm" != "yes" ]; then
    echo -e "${RED}❌ Aborting. Please create a backup first.${NC}"
    exit 1
fi

echo ""
echo "📝 Step 1: Validating Prisma schema..."
npx prisma validate

echo ""
echo "📝 Step 2: Generating Prisma client..."
npx prisma generate

echo ""
echo "📝 Step 3: Applying migration to DEV database..."
npx prisma db push

echo ""
echo -e "${GREEN}✅ Schema sync completed successfully!${NC}"
echo ""
echo "📊 Verification:"
npx prisma db execute --stdin <<EOF
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
ORDER BY ordinal_position;
EOF

echo ""
echo "🎉 DEV database is now in sync with PROD schema!"
