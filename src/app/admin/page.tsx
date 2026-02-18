'use client'

import { useEffect, useState } from 'react'

interface Tenant {
  id: string
  name: string
  country: string
  createdAt: string
  _count: {
    transactions: number
  }
}

export default function AdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', country: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/tenants')
      if (!response.ok) throw new Error('Failed to fetch tenants')
      const data = await response.json()
      setTenants(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create tenant')
      }

      setFormData({ name: '', country: '' })
      setShowForm(false)
      fetchTenants()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Admin Panel</h1>
        <a href="/" style={styles.backLink}>← Back to ERP</a>
      </header>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Tenants</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            style={styles.addButton}
          >
            {showForm ? 'Cancel' : '+ Add Tenant'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={styles.form}>
            {error && <div style={styles.error}>{error}</div>}
            
            <div style={styles.formRow}>
              <div style={styles.formField}>
                <label style={styles.label}>Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={styles.input}
                  placeholder="Company Name"
                />
              </div>
              
              <div style={styles.formField}>
                <label style={styles.label}>Country</label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  style={styles.input}
                  placeholder="US"
                />
              </div>
              
              <button
                type="submit"
                disabled={submitting}
                style={{
                  ...styles.submitButton,
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'Creating...' : 'Create Tenant'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div style={styles.loading}>Loading tenants...</div>
        ) : tenants.length === 0 ? (
          <div style={styles.empty}>No tenants found. Create one to get started.</div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Country</th>
                  <th style={styles.th}>Transactions</th>
                  <th style={styles.th}>Created</th>
                  <th style={styles.th}>ID</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id} style={styles.tr}>
                    <td style={styles.td}><strong>{tenant.name}</strong></td>
                    <td style={styles.td}>{tenant.country}</td>
                    <td style={styles.td}>{tenant._count.transactions}</td>
                    <td style={styles.td}>
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                    <td style={styles.td}>
                      <code style={styles.code}>{tenant.id.slice(0, 8)}...</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
    backgroundColor: '#0f0f0f',
    minHeight: '100vh',
    color: '#e5e5e5',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
  },
  title: {
    margin: 0,
    fontSize: '1.875rem',
    fontWeight: 700,
    color: '#ffffff',
  },
  backLink: {
    color: '#60a5fa',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
    border: '1px solid #2a2a2a',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#ffffff',
  },
  addButton: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
  },
  form: {
    marginBottom: '24px',
    padding: '20px',
    backgroundColor: '#252525',
    borderRadius: '8px',
    border: '1px solid #333',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  formField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
    minWidth: '150px',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#a1a1aa',
  },
  input: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #3f3f46',
    fontSize: '0.875rem',
    backgroundColor: '#0f0f0f',
    color: '#e5e5e5',
  },
  submitButton: {
    padding: '8px 16px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
  },
  error: {
    padding: '12px',
    backgroundColor: '#450a0a',
    color: '#fca5a5',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '0.875rem',
    border: '1px solid #7f1d1d',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.875rem',
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '2px solid #333',
    fontWeight: 600,
    color: '#a1a1aa',
  },
  tr: {
    borderBottom: '1px solid #2a2a2a',
  },
  td: {
    padding: '12px',
    verticalAlign: 'middle',
    color: '#d4d4d8',
  },
  code: {
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    color: '#a1a1aa',
    backgroundColor: '#252525',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#71717a',
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#71717a',
  },
}
