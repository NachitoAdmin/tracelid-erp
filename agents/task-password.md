# Agent Task: Tenant Password Protection

## Objective
Add password protection for tenant access.

## Files to Modify
1. prisma/schema.prisma - Add password field to Tenant
2. src/app/api/tenants/route.ts - Add password verification
3. Create src/components/TenantLogin.tsx - Login modal
4. src/app/page.tsx - Integrate login flow

## Requirements

### Database Schema
```prisma
model Tenant {
  // ... existing fields
  password String? // Hashed password
}
```

### Login Flow
1. User enters tenant ID
2. If tenant has password, show login modal
3. Verify password against stored hash
4. Store auth token in session/localStorage
5. Allow access to tenant data

### Security
- Passwords stored as bcrypt hashes
- JWT token for session (optional)
- Rate limiting on login attempts

Run this agent and report back when complete.
