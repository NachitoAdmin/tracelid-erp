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
  const [tenantInput, setTenantInput] = useState('')
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
        setTenantInput(data[0].id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSetTenant = () => {
    if (tenantInput.trim()) {
      setSelectedTenantId(tenantInput.trim())
    }
  }

  const handleTransactionSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const selectedTenant = tenants.find(t => t.id === selectedTenantId)

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading...</div>
      </div>
    )
  }

  if (tenants.length === 0) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.emptyState}>
          <h1 style={styles.emptyTitle}>Welcome to ERP System</h1>
          <p style={styles.emptyText}>No tenants found. Please create a tenant in the admin panel first.</p>
          <a href="/admin" style={styles.link}>Go to Admin →</a>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.pageContainer}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>NachitoBot ERP</h1>
        <p style={styles.headerSubtitle}>Advanced Business Intelligence & Analytics</p>
        <div style={styles.statusBadge}>🟢 Live</div>
      </header>

      {/* Tenant Bar */}
      <div style={styles.tenantBar}>
        <div style={styles.tenantInputGroup}>
          <label style={styles.tenantLabel}>Tenant ID:</label>
          <input
            type="text"
            value={tenantInput}
            onChange={(e) => setTenantInput(e.target.value)}
            style={styles.tenantInput}
            placeholder="Enter tenant ID..."
          />
          <button onClick={handleSetTenant} style={styles.setTenantBtn}>
            Set Tenant
          </button>
        </div>
        {selectedTenant && (
          <div style={styles.currentTenantBadge}>
            Current: {selectedTenant.name} ({selectedTenant.country})
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
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
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  pageContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    paddingBottom: '40px',
  },
  loadingContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: '1.5rem',
    color: '#fff',
    fontWeight: 500,
  },
  header: {
    textAlign: 'center',
    padding: '40px 20px 30px',
    color: '#fff',
  },
  headerTitle: {
    margin: 0,
    fontSize: '2.5rem',
    fontWeight: 700,
    color: '#fff',
    textShadow: '0 2px 10px rgba(0,0,0,0.2)',
  },
  headerSubtitle: {
    margin: '10px 0 0 0',
    fontSize: '1.1rem',
    color: 'rgba(255,255,255,0.9)',
    fontWeight: 400,
  },
  statusBadge: {
    display: 'inline-block',
    marginTop: '15px',
    padding: '6px 16px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: 500,
    backdropFilter: 'blur(10px)',
  },
  tenantBar: {
    maxWidth: '1200px',
    margin: '0 auto 30px',
    padding: '20px 24px',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: '16px',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
  },
  tenantInputGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  tenantLabel: {
    color: '#fff',
    fontWeight: 500,
    fontSize: '0.95rem',
  },
  tenantInput: {
    padding: '10px 16px',
    borderRadius: '10px',
    border: '2px solid rgba(255,255,255,0.3)',
    fontSize: '0.95rem',
    backgroundColor: 'rgba(255,255,255,0.9)',
    minWidth: '200px',
    outline: 'none',
  },
  setTenantBtn: {
    padding: '10px 20px',
    backgroundColor: '#fff',
    color: '#667eea',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  currentTenantBadge: {
    padding: '8px 16px',
    backgroundColor: 'rgba(255,255,255,0.25)',
    color: '#fff',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  mainContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
    gap: '24px',
    marginBottom: '24px',
  },
  column: {
    minWidth: 0,
  },
  fullWidth: {
    marginBottom: '24px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '100px 20px',
    color: '#fff',
  },
  emptyTitle: {
    fontSize: '2rem',
    fontWeight: 600,
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '1.1rem',
    opacity: 0.9,
    marginBottom: '24px',
  },
  link: {
    display: 'inline-block',
    padding: '14px 28px',
    backgroundColor: '#fff',
    color: '#667eea',
    borderRadius: '12px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '1rem',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
  },
}
