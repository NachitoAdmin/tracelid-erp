'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Tenant {
  id: string
  name: string
  country: string
  createdAt: string
  _count?: { transactions: number }
}

interface User {
  id: string
  email: string
  role: string
  tenantId: string
  tenantName: string
}

export default function OwnerDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [tenantsRes, usersRes] = await Promise.all([
        fetch('/api/tenants'),
        fetch('/api/users'),
      ])
      
      if (tenantsRes.ok) {
        const t = await tenantsRes.json()
        setTenants(t)
      }
      
      if (usersRes.ok) {
        const u = await usersRes.json()
        setUsers(u)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const totalRevenue = tenants.reduce((sum, t) => sum + (t._count?.transactions || 0) * 1000, 0)

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>Loading Owner Dashboard...</div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <Link href="/" style={styles.backLink}>← Back to App</Link>
          <h1 style={styles.title}>👑 Owner Dashboard</h1>
        </div>
      </header>

      <main style={styles.main}>
        {/* Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{tenants.length}</div>
            <div style={styles.statLabel}>Total Tenants</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{users.length}</div>
            <div style={styles.statLabel}>Total Users</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>${(totalRevenue / 1000).toFixed(1)}k</div>
            <div style={styles.statLabel}>Est. Revenue</div>
          </div>
        </div>

        {/* Tenants Table */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🏢 All Tenants</h2>
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span>Name</span>
              <span>Country</span>
              <span>Transactions</span>
              <span>Created</span>
            </div>
            {tenants.map((t) => (
              <div key={t.id} style={styles.tableRow}>
                <span style={styles.tenantName}>{t.name}</span>
                <span>{t.country}</span>
                <span>{t._count?.transactions || 0}</span>
                <span>{new Date(t.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>👥 All Users</h2>
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span>Email</span>
              <span>Role</span>
              <span>Tenant</span>
            </div>
            {users.map((u) => (
              <div key={u.id} style={styles.tableRow}>
                <span>{u.email}</span>
                <span style={getRoleBadgeStyle(u.role)}>{u.role}</span>
                <span>{u.tenantName}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

const getRoleBadgeStyle = (role: string): React.CSSProperties => ({
  padding: '4px 10px',
  borderRadius: '4px',
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  backgroundColor: role === 'OWNER_ADMIN' ? '#FEF3C7' : role === 'TENANT_ADMIN' ? '#DBEAFE' : '#F3F4F6',
  color: role === 'OWNER_ADMIN' ? '#92400E' : role === 'TENANT_ADMIN' ? '#1E40AF' : '#374151',
})

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#F1F5F9',
    fontFamily: "'Inter', sans-serif",
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #E5E7EB',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backLink: {
    color: '#6C5CE7',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    color: '#1F2937',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    marginBottom: '32px',
  },
  statCard: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#6C5CE7',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '0.9rem',
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  sectionTitle: {
    margin: '0 0 20px 0',
    fontSize: '1.1rem',
    color: '#1F2937',
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    padding: '12px 16px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    padding: '12px 16px',
    borderBottom: '1px solid #F3F4F6',
    alignItems: 'center',
  },
  tenantName: {
    fontWeight: 600,
    color: '#1F2937',
  },
}
