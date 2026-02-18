# ERP Next.js - Deployment Summary

## 📋 Project Information

| Property | Value |
|----------|-------|
| **Project Name** | erp-nextjs |
| **Framework** | Next.js 14.1.0 |
| **Database** | PostgreSQL (Supabase) |
| **ORM** | Prisma 5.8.0 |
| **Location** | `/Users/nachitobot/.openclaw/workspace/erp-nextjs/` |

---

## 🔗 Supabase Configuration (Existing)

| Variable | Value |
|----------|-------|
| **Supabase URL** | `https://ijswvbminyhragalujus.supabase.co` |
| **Supabase Anon Key** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlqc3d2Ym1pbnlocmFnYWx1anVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNTUxMzksImV4cCI6MjA4NjgzMTEzOX0.l7GGcVO2xpsBFLLs63Zd75VfyxCu95b6RnxcSZQM0js` |

### Database Connection String Format:
```
postgresql://postgres:[DB_PASSWORD]@db.ijswvbminyhragalujus.supabase.co:5432/postgres
```

**Note**: You need to get the database password from Supabase Dashboard:
1. Go to https://app.supabase.com/project/ijswvbminyhragalujus/settings/database
2. Copy the connection string with your password

---

## 🚀 Deployment Steps (Manual)

### Step 1: Create GitHub Repository

**Via Web Interface:**
1. Visit: https://github.com/new
2. Repository name: `erp-nextjs`
3. Description: `Next.js ERP application with multi-tenancy support`
4. Visibility: Public (or Private)
5. **DO NOT** initialize with README
6. Click **Create repository**

**Then push local code:**
```bash
cd /Users/nachitobot/.openclaw/workspace/erp-nextjs
git remote add origin https://github.com/YOUR_USERNAME/erp-nextjs.git
git branch -M main
git push -u origin main
```

**Expected GitHub Repo URL:** `https://github.com/YOUR_USERNAME/erp-nextjs`

---

### Step 2: Deploy to Vercel

**Via Vercel Dashboard:**
1. Visit: https://vercel.com/new
2. Click **Import Git Repository**
3. Select your `erp-nextjs` repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Build Command**: `prisma generate && next build`
   - **Install Command**: `npm install`
5. Click **Deploy**

---

### Step 3: Configure Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Value | Environments |
|----------|-------|--------------|
| `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@db.ijswvbminyhragalujus.supabase.co:5432/postgres` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ijswvbminyhragalujus.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |

**Important:** After adding environment variables, redeploy the project.

---

### Step 4: Run Database Migrations

**Option A: Local (recommended)**
```bash
cd /Users/nachitobot/.openclaw/workspace/erp-nextjs
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.ijswvbminyhragalujus.supabase.co:5432/postgres"
npx prisma db push
```

**Option B: Via Supabase SQL Editor**
1. Go to https://app.supabase.com/project/ijswvbminyhragalujus/sql
2. Run the SQL from `prisma/schema.prisma` or use existing SQL files:
   - `supabase_multitenancy.sql`
   - `supabase_transactions.sql`
   - `supabase_document_numbering.sql`

---

## 📁 Project Structure

```
erp-nextjs/
├── prisma/
│   └── schema.prisma          # Database schema with Tenant, Transaction, DocumentCounter
├── src/
│   ├── app/
│   │   ├── page.tsx           # Home page
│   │   ├── layout.tsx         # Root layout
│   │   ├── admin/
│   │   │   └── page.tsx       # Admin dashboard
│   │   └── api/
│   │       ├── tenants/
│   │       │   └── route.ts   # Tenant API
│   │       └── transactions/
│   │           └── route.ts   # Transaction API
│   ├── components/
│   │   ├── AnalyticsDashboard.tsx
│   │   ├── SaleForm.tsx
│   │   └── TransactionList.tsx
│   └── lib/
│       ├── prisma.ts          # Prisma client
│       └── utils.ts           # Utilities
├── package.json
├── next.config.js
├── vercel.json                # Vercel build configuration
├── tsconfig.json
└── .env.example               # Environment variables template
```

---

## 🔧 Build Configuration

**vercel.json:**
```json
{
  "version": 2,
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

**package.json scripts:**
```json
{
  "build": "next build",
  "db:push": "prisma db push",
  "postinstall": "prisma generate"
}
```

---

## 📊 Database Schema

### Tenant
- `id` (UUID, PK)
- `name` (String)
- `country` (String)
- `createdAt`, `updatedAt` (DateTime)

### Transaction
- `id` (UUID, PK)
- `documentNumber` (String, Unique)
- `transactionType` (Enum: SALE, RETURN, REBATE, DISCOUNT, COST)
- `amount` (Decimal)
- `description` (String?)
- `tenantId` (UUID, FK)
- `createdAt`, `updatedAt` (DateTime)

### DocumentCounter
- `id` (UUID, PK)
- `tenantId` (UUID, FK)
- `prefix` (String)
- `year` (Int)
- `lastNumber` (Int)
- `createdAt`, `updatedAt` (DateTime)

---

## ✅ Post-Deployment Checklist

- [ ] GitHub repository created and code pushed
- [ ] Vercel project linked to GitHub
- [ ] Environment variables configured in Vercel
- [ ] Database migrations applied (`prisma db push`)
- [ ] Production deployment successful
- [ ] Homepage loads correctly
- [ ] API endpoints respond (test `/api/tenants`)
- [ ] Admin panel accessible (`/admin`)

---

## 🔗 Expected URLs After Deployment

| Resource | URL Pattern |
|----------|-------------|
| GitHub Repo | `https://github.com/YOUR_USERNAME/erp-nextjs` |
| Vercel Deployment | `https://erp-nextjs-XXXX.vercel.app` |
| Admin Panel | `https://erp-nextjs-XXXX.vercel.app/admin` |
| API Base | `https://erp-nextjs-XXXX.vercel.app/api` |

---

## 🛠️ Available Scripts

**Local Development:**
```bash
cd /Users/nachitobot/.openclaw/workspace/erp-nextjs
npm install
npm run dev          # Start dev server on http://localhost:3000
npm run db:studio    # Open Prisma Studio
npm run db:push      # Push schema to database
```

**Automated Deployment (requires CLI auth):**
```bash
/Users/nachitobot/.openclaw/workspace/deploy-erp.sh
```

---

## 📚 Additional Resources

- **Full Deployment Guide**: `/Users/nachitobot/.openclaw/workspace/DEPLOYMENT_GUIDE.md`
- **Supabase Dashboard**: https://app.supabase.com/project/ijswvbminyhragalujus
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Prisma Documentation**: https://www.prisma.io/docs

---

## ⚠️ Important Notes

1. **Database Password Required**: You need to obtain the database password from Supabase dashboard to complete the `DATABASE_URL` environment variable.

2. **Pooled Connections**: For serverless environments like Vercel, consider using Supabase's pooled connection string with `?pgbouncer=true` suffix.

3. **Git Authentication**: The local repository is ready to push. You just need to add the remote and push to GitHub.

4. **Environment Variables**: The `.env.example` file contains the Supabase public URL and anon key. The database password needs to be added manually.

---

**Generated**: 2026-02-18
**Status**: Ready for deployment (GitHub + Vercel setup required)
