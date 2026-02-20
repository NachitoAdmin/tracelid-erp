# Agent Task: Dummy Data Seeding

## Objective
Create API endpoint and data for seeding dummy data into the database.

## Files to Create/Modify
1. src/app/api/seed/route.ts - API endpoint to seed data
2. Update src/app/admin/page.tsx - Add "Seed Data" button

## Dummy Data Requirements

### Tenants (3):
1. Acme Corp (US) - password: "acme123"
2. Global Trade Ltd (GB) - password: "global456"
3. EuroMart (DE) - password: "euro789"

### Transactions per tenant (10+ each):
- Mix of SALE, RETURN, REBATE, DISCOUNT, COST
- Various amounts ($100 - $5000)
- Different dates (last 90 days)
- Descriptions like "Product sale", "Customer return", etc.

## API Endpoint
- POST /api/seed
- Only works in development or with admin key
- Clears existing data first (optional)
- Returns count of created records

Run this agent and report back when complete.
