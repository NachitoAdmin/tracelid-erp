# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev              # Start dev server on localhost:3000

# Production build
npm run build
npm run start

# Linting
npm run lint

# E2E tests (Playwright)
npm run test:e2e         # Headless
npm run test:e2e:ui      # With UI

# Database (Prisma)
npm run db:generate      # Regenerate Prisma client after schema changes
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Prisma Studio GUI
```

## Architecture

**Stack**: Next.js 14 App Router + TypeScript, Prisma 5 ORM, PostgreSQL (Supabase), Vercel deployment.

**Multi-tenancy**: All data is scoped by `tenantId`. Every database query must filter by tenant. Document numbers are auto-generated sequentially per tenant/year using the `DocumentCounter` model (e.g., `INV-2025-00001`).

**Auth**: JWT stored in HTTP-only cookies + user/tenant data mirrored in `localStorage`. Three roles: `owner`, `admin`, `operator`. The middleware (`src/middleware.ts`) is intentionally minimal — auth is enforced client-side and in API route handlers.

**API routes** live in `src/app/api/`. Key routes:
- `auth/login`, `auth/logout`, `auth/me`, `auth/register`
- `tenants/` — list/create; `tenants/verify` — tenant password check
- `transactions/` — CRUD; types: `SALE | RETURN | REBATE | DISCOUNT | COST`
- `users/` — admin-only user management
- `master-data/upload` — bulk CSV upload

**Frontend state**: React Context API for language (`LanguageContext`) and currency (`CurrencyContext`). All other state is local to components or in `localStorage`.

**Components** are in `src/components/`. They use `'use client'` and mostly inline CSS with `React.CSSProperties`. **Lib utilities** are in `src/lib/`: `auth.ts` (JWT/bcrypt helpers), `i18n.ts` (5-language translations), `currency.ts` (formatting).

**Prisma schema** is the source of truth for data models. After editing `prisma/schema.prisma`, run `db:generate` then `db:push`.

## Environment

Required env vars (see `.env.example`):
- `DATABASE_URL` — Supabase PostgreSQL connection string
- `JWT_SECRET` — used for signing auth tokens
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_ENV_NAME` — `production` or `development`

Two deployed environments: production (`tracelid.com`) and a separate dev Vercel project. Schema sync between them via `sync-dev-schema.sh`.
