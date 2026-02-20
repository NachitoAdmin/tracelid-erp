# Tracelid Development Environment Setup

## Overview
This document outlines the development environment setup for Tracelid ERP.

## Production (UNCHANGED)
- **URL**: https://www.tracelid.com
- **Vercel Project**: erp-nextjs (prj_7duv8VQYmRssdtYoPTS9GnvqyGn0)
- **Supabase**: ijswvbminyhragalujus (Production DB)
- **Status**: ✅ LIVE - DO NOT MODIFY

## Development Environment

### 1. Vercel Dev Project
- **Project Name**: erp-nextjs-dev
- **Project ID**: prj_7JR1WnO2Plf1hJIupBupgZaDquZZ
- **Current URL**: https://erp-nextjs-jqbv317l2-nachitoadmins-projects.vercel.app
- **Status**: ⚠️ Needs environment variables

### 2. Required: Supabase Dev Database
You need to create a separate Supabase project for development:

**Steps:**
1. Go to https://app.supabase.com
2. Click "New Project"
3. Name: `tracelid-dev`
4. Set a secure database password
5. Wait for project creation

### 3. Database Schema Migration
Run this SQL in the new dev Supabase project:

```sql
-- Create Tenant table
CREATE TABLE "Tenant" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  password TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  document_number TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  category TEXT,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  product_id TEXT,
  product_name TEXT,
  customer_id TEXT,
  customer_name TEXT,
  tenant_id TEXT NOT NULL REFERENCES "Tenant"(id),
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Create document_counters table
CREATE TABLE document_counters (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId" TEXT NOT NULL,
  prefix TEXT NOT NULL,
  year INTEGER NOT NULL,
  last_number INTEGER DEFAULT 0,
  UNIQUE("tenantId", prefix, year)
);

-- Enable RLS
ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_counters ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all" ON "Tenant" FOR ALL USING (true);
CREATE POLICY "Allow all" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow all" ON document_counters FOR ALL USING (true);

-- Create dev tenant
INSERT INTO "Tenant" (id, name, country) 
VALUES ('dev-tenant-001', 'Dev Company', 'US');
```

### 4. Vercel Dev Environment Variables
After creating the Supabase dev project, set these in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://[your-dev-project].supabase.co
SUPABASE_SERVICE_KEY=[your-dev-service-key]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-dev-anon-key]
NEXT_PUBLIC_ENV_NAME=development
SEED_ENABLED=true
```

### 5. Dev Environment Features
The dev environment should have:
- ✅ "DEV ENVIRONMENT" banner at top
- ✅ "Seed Demo Data" button visible
- ✅ All features from production
- ✅ Isolated database (no prod data)

## Next Steps for You:
1. Create Supabase dev project (step 2 above)
2. Run the SQL migration (step 3)
3. Get the dev project credentials
4. Set Vercel environment variables (step 4)
5. I'll configure the dev banner and seed button

## Promotion Process
```
Dev Testing → Approval → Deploy to Production
     ↑                              ↓
   Fix issues                  Monitor
```

**Production remains untouched until you approve.**
