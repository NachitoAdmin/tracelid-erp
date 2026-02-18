# ERP Next.js Application

A complete ERP system built with Next.js 14+, Prisma ORM, and Supabase.

## Features

- **Multi-tenancy**: Complete tenant isolation for multi-company support
- **Document Numbering**: Auto-generated document numbers (INV-2025-00001 format)
- **Transaction Types**: SALE, RETURN, REBATE, DISCOUNT, COST
- **Real-time Analytics**: Dashboard with revenue breakdown
- **Vercel Ready**: Optimized for Vercel deployment

## Tech Stack

- Next.js 14+ (App Router)
- Prisma ORM
- PostgreSQL (Supabase)
- TypeScript

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create `.env.local`:
   ```
   DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"
   ```

3. **Generate Prisma client**:
   ```bash
   npm run db:generate
   ```

4. **Push schema to database**:
   ```bash
   npm run db:push
   ```

5. **Run development server**:
   ```bash
   npm run dev
   ```

## Deployment to Vercel

1. Push to GitHub
2. Connect repository to Vercel
3. Add `DATABASE_URL` environment variable
4. Deploy

## API Endpoints

- `GET /api/tenants` - List all tenants
- `POST /api/tenants` - Create a new tenant
- `GET /api/transactions?tenantId=xxx` - List transactions for tenant
- `POST /api/transactions` - Create a new transaction

## Project Structure

```
/erp-nextjs
├── src/
│   ├── app/
│   │   ├── api/transactions/route.ts
│   │   ├── api/tenants/route.ts
│   │   ├── page.tsx (main ERP UI)
│   │   └── admin/page.tsx
│   ├── components/
│   │   ├── SaleForm.tsx
│   │   ├── TransactionList.tsx
│   │   └── AnalyticsDashboard.tsx
│   └── lib/
│       ├── prisma.ts
│       └── utils.ts
├── prisma/
│   └── schema.prisma
└── package.json
```