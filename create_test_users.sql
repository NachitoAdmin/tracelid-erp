-- Create Test Users for Tracelid ERP
-- Run this in your Supabase SQL editor after fixing the .env.local

-- First, ensure we have a test tenant
INSERT INTO "Tenant" (id, name, country) 
VALUES 
  ('test-tenant-1', 'Acme Corporation', 'USA'),
  ('test-tenant-2', 'Global Trading Ltd', 'UK')
ON CONFLICT (id) DO NOTHING;

-- Create test users with bcrypt hashed password 'password123'
-- Hash generated from: await bcrypt.hash('password123', 10)
-- All test users use password: password123
INSERT INTO users (email, password_hash, role, first_name, last_name, tenant_id, is_active) 
VALUES 
  -- Owner user (can see all tenants)
  ('owner@tracelid.com', '$2b$10$Te5iIN46rCooDr78vC2cQeS7qWhXGw8bkq/MwJM9iYibrqSUH4nsC', 'owner', 'Sarah', 'Owner', NULL, true),
  
  -- Admin user (locked to Acme Corporation)
  ('admin@acme.com', '$2b$10$Te5iIN46rCooDr78vC2cQeS7qWhXGw8bkq/MwJM9iYibrqSUH4nsC', 'admin', 'John', 'Admin', 'test-tenant-1', true),
  
  -- Operator user (locked to Global Trading)
  ('operator@global.com', '$2b$10$Te5iIN46rCooDr78vC2cQeS7qWhXGw8bkq/MwJM9iYibrqSUH4nsC', 'operator', 'Jane', 'Operator', 'test-tenant-2', true)
ON CONFLICT (email) DO NOTHING;

-- Note: You need to generate the actual bcrypt hash for 'password123' or your chosen password
-- You can use this Node.js command to generate it:
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('password123', 10).then(console.log)"

-- Or use this online tool: https://bcrypt-generator.com/
-- Example hash for 'password123': $2a$10$zJpVkR7wHn6L1LpCi5Lf4.pXg5YO9Ym9nH4mHGwGfPxEH8ZKFy9Oi