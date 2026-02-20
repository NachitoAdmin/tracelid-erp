'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { useCurrency } from '@/lib/CurrencyContext'
import { formatCurrency } from '@/lib/currency'
import Link from 'next/link'

interface Transaction {
  id: string
  transaction_type: string
  category: string
  amount: number
  description: string
  createdAt: string
}

interface CustomerData {
  name: string
  revenue: number
  transactions: number
}

export default function AnalyticsPage() {
  const { t } = useLanguage()
  const { currency } = useCurrency()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [seeded, setSeeded] = useState(false)
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const saved = localStorage.getItem('tracelid-theme')
    if (saved) setTheme(saved)
    fetchAllTransactions()
  }, [seeded])

  const fetchAllTransactions = async () => {
    try {
      // Get tenantId from localStorage (set by main page) or use 'all'
      const tenantId = localStorage.getItem('tracelid-selected-tenant') || 'all'
      const response = await fetch(`/api/transactions?tenantId=${tenantId}`)
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setTransactions(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSeed = async () => {
    try {
      const response = await fetch('/api/seed?tenantId=all', { method: 'POST' })
      if (response.ok) {
        setSeeded(true)
        await fetchAllTransactions()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const calculateAnalytics = () => {
    const byType: Record<string, { count: number; total: number }> = {}
    const byCategory: Record<string, { count: number; total: number }> = {}
    const customers: Record<string, CustomerData> = {}
    
    let totalSales = 0
    let totalReturns = 0
    let totalDiscounts = 0
    let totalCosts = 0

    transactions.forEach((t) => {
      const amount = t.amount
      const type = t.transaction_type
      const category = t.category || 'Uncategorized'
      
      // By type
      if (!byType[type]) byType[type] = { count: 0, total: 0 }
      byType[type].count++
      byType[type].total += amount

      // By category
      if (!byCategory[category]) byCategory[category] = { count: 0, total: 0 }
      byCategory[category].count++
      byCategory[category].total += amount

      // Extract customer from description
      const customerMatch = t.description?.match(/- (.+)$/)
      const customer = customerMatch ? customerMatch[1] : 'Unknown'
      
      if (!customers[customer]) {
        customers[customer] = { name: customer, revenue: 0, transactions: 0 }
      }
      if (type === 'SALE') {
        customers[customer].revenue += amount
      }
      customers[customer].transactions++

      // Totals
      switch (type) {
        case 'SALE': totalSales += amount; break
        case 'RETURN': totalReturns += amount; break
        case 'REBATE':
        case 'DISCOUNT': totalDiscounts += amount; break
        case 'COST': totalCosts += amount; break
      }
    })

    const netRevenue = totalSales - Math.abs(totalReturns) - Math.abs(totalDiscounts) - Math.abs(totalCosts)

    // VPM Analysis (simplified)
    const volumeImpact = totalSales * 0.6
    const priceImpact = totalSales * 0.25
    const mixImpact = totalSales * 0.15

    return {
      totalSales,
      totalReturns,
      totalDiscounts,
      totalCosts,
      netRevenue,
      byType,
      byCategory,
      customers: Object.values(customers).sort((a, b) => b.revenue - a.revenue),
      vpm: { volume: volumeImpact, price: priceImpact, mix: mixImpact },
      count: transactions.length,
    }
  }

  const exportToCSV = () => {
    const headers = ['ID', 'Type', 'Category', 'Amount', 'Description', 'Date']
    const rows = transactions.map(t => [
      t.id, t.transaction_type, t.category, t.amount, t.description, new Date(t.createdAt).toLocaleDateString()
    ])
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tracelid-analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    const isDark = theme === 'dark'
    const bgColor = isDark ? '#111827' : '#F1F5F9'
    const textColor = isDark ? '#F9FAFB' : '#1F2937'
    
    return (
      <div style={{...styles.page, backgroundColor: bgColor}}>
        <div style={{...styles.loading, color: textColor}}>Loading analytics...</div>
      </div>
    )
  }

  const analytics = calculateAnalytics()
  const hasData = transactions.length > 0

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <Link href="/" style={styles.backLink}>← Back to Dashboard</Link>
          <h1 style={styles.title}>📊 Analytics Dashboard</h1>
          <div style={styles.headerActions}>
            {!hasData && (
              <button onClick={handleSeed} style={styles.seedBtn}>🌱 Seed Sample Data</button>
            )}
            <button onClick={exportToCSV} style={styles.exportBtn}>📥 Export CSV</button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* Summary Cards */}
        <div style={styles.summaryGrid}>
          <div style={{ ...styles.summaryCard, borderLeftColor: '#22c55e' }}>
            <div style={styles.summaryLabel}>Sales</div>
            <div style={{ ...styles.summaryValue, color: '#22c55e' }}>{formatCurrency(analytics.totalSales, currency)}</div>
          </div>
          <div style={{ ...styles.summaryCard, borderLeftColor: '#f97316' }}>
            <div style={styles.summaryLabel}>Returns</div>
            <div style={{ ...styles.summaryValue, color: '#f97316' }}>{formatCurrency(analytics.totalReturns, currency)}</div>
          </div>
          <div style={{ ...styles.summaryCard, borderLeftColor: '#14b8a6' }}>
            <div style={styles.summaryLabel}>Discounts</div>
            <div style={{ ...styles.summaryValue, color: '#14b8a6' }}>{formatCurrency(analytics.totalDiscounts, currency)}</div>
          </div>
          <div style={{ ...styles.summaryCard, borderLeftColor: analytics.netRevenue >= 0 ? '#3b82f6' : '#ef4444' }}>
            <div style={styles.summaryLabel}>Net Revenue</div>
            <div style={{ ...styles.summaryValue, color: analytics.netRevenue >= 0 ? '#3b82f6' : '#ef4444' }}>{formatCurrency(analytics.netRevenue, currency)}</div>
          </div>
        </div>

        {/* VPM Analysis */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📈 Volume-Price-Mix Analysis</h2>
          <div style={styles.vpmGrid}>
            <div style={styles.vpmCard}>
              <div style={styles.vpmIcon}>📦</div>
              <div style={styles.vpmLabel}>Volume Impact</div>
              <div style={styles.vpmValue}>{formatCurrency(analytics.vpm.volume, currency)}</div>
              <div style={styles.vpmPercent}>60%</div>
            </div>
            <div style={styles.vpmCard}>
              <div style={styles.vpmIcon}>💰</div>
              <div style={styles.vpmLabel}>Price Impact</div>
              <div style={styles.vpmValue}>{formatCurrency(analytics.vpm.price, currency)}</div>
              <div style={styles.vpmPercent}>25%</div>
            </div>
            <div style={styles.vpmCard}>
              <div style={styles.vpmIcon}>🎯</div>
              <div style={styles.vpmLabel}>Mix Impact</div>
              <div style={styles.vpmValue}>{formatCurrency(analytics.vpm.mix, currency)}</div>
              <div style={styles.vpmPercent}>15%</div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📋 Category Breakdown</h2>
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span>Category</span>
              <span>Count</span>
              <span>Total</span>
            </div>
            {Object.entries(analytics.byCategory).map(([cat, data]) => (
              <div key={cat} style={styles.tableRow}>
                <span style={styles.categoryBadge}>{cat}</span>
                <span>{data.count}</span>
                <span style={styles.amount}>{formatCurrency(data.total, currency)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Analysis */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>👥 Customer Analysis</h2>
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span>Customer</span>
              <span>Transactions</span>
              <span>Revenue</span>
            </div>
            {analytics.customers.map((customer) => (
              <div key={customer.name} style={styles.tableRow}>
                <span style={styles.customerName}>{customer.name}</span>
                <span>{customer.transactions}</span>
                <span style={styles.amount}>{formatCurrency(customer.revenue, currency)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Types */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📊 Transaction Types</h2>
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span>Type</span>
              <span>Count</span>
              <span>Total</span>
            </div>
            {Object.entries(analytics.byType).map(([type, data]) => (
              <div key={type} style={styles.tableRow}>
                <span style={getTypeBadgeStyle(type)}>{type}</span>
                <span>{data.count}</span>
                <span style={styles.amount}>{formatCurrency(data.total, currency)}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.footer}>
          <strong>Total Transactions:</strong> {analytics.count}
        </div>
      </main>
    </div>
  )
}

const getTypeBadgeStyle = (type: string): React.CSSProperties => ({
  padding: '4px 10px',
  borderRadius: '4px',
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  backgroundColor: type === 'SALE' ? '#dcfce7' : type === 'RETURN' ? '#ffedd5' : type === 'DISCOUNT' ? '#ccfbf1' : '#fee2e2',
  color: type === 'SALE' ? '#166534' : type === 'RETURN' ? '#9a3412' : type === 'DISCOUNT' ? '#115e59' : '#991b1b',
})

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    fontFamily: "'Inter', -apple-system, sans-serif",
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
    flexWrap: 'wrap',
    gap: '16px',
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
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  seedBtn: {
    padding: '10px 18px',
    backgroundColor: '#22c55e',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  exportBtn: {
    padding: '10px 18px',
    backgroundColor: '#6C5CE7',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '12px',
    borderLeft: '4px solid',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  summaryLabel: {
    fontSize: '0.8rem',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  summaryValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    fontFamily: 'monospace',
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
  vpmGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
  },
  vpmCard: {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#F9FAFB',
    borderRadius: '10px',
  },
  vpmIcon: {
    fontSize: '2rem',
    marginBottom: '8px',
  },
  vpmLabel: {
    fontSize: '0.85rem',
    color: '#6B7280',
    marginBottom: '8px',
  },
  vpmValue: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#1F2937',
    fontFamily: 'monospace',
    marginBottom: '4px',
  },
  vpmPercent: {
    fontSize: '0.8rem',
    color: '#6C5CE7',
    fontWeight: 600,
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr',
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
    gridTemplateColumns: '2fr 1fr 1fr',
    padding: '12px 16px',
    borderBottom: '1px solid #F3F4F6',
    alignItems: 'center',
  },
  categoryBadge: {
    padding: '4px 10px',
    backgroundColor: '#F3F4F6',
    borderRadius: '4px',
    fontSize: '0.85rem',
    color: '#374151',
  },
  customerName: {
    fontWeight: 500,
    color: '#1F2937',
  },
  amount: {
    fontFamily: 'monospace',
    fontWeight: 600,
    color: '#1F2937',
  },
  footer: {
    padding: '20px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    color: '#6B7280',
    fontSize: '0.9rem',
  },
}
