-- Costs/Expenses table migration
CREATE TABLE IF NOT EXISTS costs_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  category TEXT,
  amount DECIMAL(12,2),
  vendor_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

GRANT ALL PRIVILEGES ON TABLE costs_expenses TO anon, authenticated, service_role;

-- Optional: Create an index on tenant_id for faster queries
CREATE INDEX IF NOT EXISTS idx_costs_expenses_tenant_id ON costs_expenses(tenant_id);

-- Optional: Create an index on date for sorting
CREATE INDEX IF NOT EXISTS idx_costs_expenses_date ON costs_expenses(date DESC);
