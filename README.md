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

## Quick Start

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your DATABASE_URL with Supabase password
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

Visit http://localhost:3000

## Deployment to Vercel

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `erp-nextjs`
3. Click **Create repository**
4. Push local code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/erp-nextjs.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy to Vercel

1. Go to https://vercel.com/new
2. Import your `erp-nextjs` repository
3. Configure environment variables:
   - `DATABASE_URL` - Supabase connection string
   - `NEXT_PUBLIC_SUPABASE_URL` - `https://ijswvbminyhragalujus.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - From `.env.example`
4. Click **Deploy**

### Step 3: Run Database Migrations

```bash
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.ijswvbminyhragalujus.supabase.co:5432/postgres"
npx prisma db push
```

See [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) for detailed instructions.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tenants` | List all tenants |
| POST | `/api/tenants` | Create a new tenant |
| GET | `/api/transactions?tenantId=xxx` | List transactions for tenant |
| POST | `/api/transactions` | Create a new transaction |

## Project Structure

```
erp-nextjs/
├── prisma/
│   └── schema.prisma          # Database schema
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
├── vercel.json                # Vercel configuration
└── tsconfig.json
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Yes |

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio

## Supabase Configuration

- **Project URL**: https://ijswvbminyhragalujus.supabase.co
- **Dashboard**: https://app.supabase.com/project/ijswvbminyhragalujus

## License

MIT