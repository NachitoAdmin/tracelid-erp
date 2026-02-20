# E2E Testing for DEV Environment

## Setup
```bash
npm install
npx playwright install chromium
```

## Run Tests
```bash
# Headless (CI)
npm run test:e2e

# With UI (local debugging)
npm run test:e2e:ui
```

## Test Coverage
- ✅ Basic Load (DEV banner, no console errors)
- ✅ Tenant Selection (by name)
- ✅ Seed Demo Data
- ✅ Transaction Creation (SALE with product/customer)
- ✅ Language Switch
- ✅ Dark Mode Toggle
- ✅ Analytics Page (VPM, categories, customers)

## DEV URL
Tests run against: `https://erp-nextjs-k5qnqj5pm-nachitoadmins-projects.vercel.app`

**NEVER runs against production.**
