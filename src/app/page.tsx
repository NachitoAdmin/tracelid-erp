'use client'

import { useEffect, useState } from 'react'
import SaleForm from '@/components/SaleForm'
import TransactionList from '@/components/TransactionList'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'

interface Tenant {
  id: string
  name: string
  country: string
  _count: {
    transactions: number
  }
}

export default function Home() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/tenants')
      if (!response.ok) throw new Error('Failed to fetch tenants')
      const data = await response.json()
      setTenants(data)
      if (data.length > 0 && !selectedTenantId) {
        setSelectedTenantId(data[0].id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleTransactionSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const selectedTenant = tenants.find(t => t.id === selectedTenantId)

  if (loading) {
    return <div style={styles.loading}>Loading...</div>
  }

  if (tenants.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <h1>Welcome to ERP System</h1>
          <p>No tenants found. Please create a tenant in the admin panel first.</p>
          <a href="/admin" style={styles.link}>Go to Admin →</a>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>ERP System</h1>
        <div style={styles.tenantSelector}>
          <label style={styles.label}>Tenant:</label>
          <select
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
            style={styles.select}
          >
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name} ({tenant.country})
              </option>
            ))}
          </select>
          <a href="/admin" style={styles.adminLink}>Admin →</a>
        </div>
      </header>

      {selectedTenant && (
        <div style={styles.tenantInfo}>
          <span style={styles.tenantBadge}>
            {selectedTenant.name} • {selectedTenant.country} • {selectedTenant._count.transactions} transactions
          </span>
        </div>
      )}

      <div style={styles.grid}>
        <div style={styles.column}>
          <SaleForm
            tenantId={selectedTenantId}
            onSuccess={handleTransactionSuccess}
          />
        </div>
        <div style={styles.column}>
          <AnalyticsDashboard
            tenantId={selectedTenantId}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>

      <div style={styles.fullWidth}>
        <TransactionList
          tenantId={selectedTenantId}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    margin: 0,
    fontSize: '1.875rem',
    fontWeight: 700,
    color: '#111827',
  },
  tenantSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#374151',
  },
  select: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.875rem',
    backgroundColor: '#fff',
    minWidth: '200px',
  },
  adminLink: {
    color: '#3b82f6',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  tenantInfo: {
    marginBottom: '24px',
  },
  tenantBadge: {
    display: 'inline-block',
    padding: '8px 16px',
    backgroundColor: '#eff6ff',
    color: '#1e40af',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '24px',
    marginBottom: '24px',
  },
  column: {
    minWidth: 0,
  },
  fullWidth: {
    marginBottom: '24px',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '1.125rem',
    color: '#6b7280',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  link: {
    display: 'inline-block',
    marginTop: '16px',
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 500,
  },
}