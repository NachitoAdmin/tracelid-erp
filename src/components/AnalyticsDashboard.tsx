'use client'

import { useEffect, useState } from 'react'
import { formatCurrency, getTransactionTypeColor, getTransactionTypeLabel } from '@/lib/utils'

interface Transaction {
  id: string
  transactionType: string
  amount: string
}

interface AnalyticsDashboardProps {
  tenantId: string
  refreshTrigger?: number
}

interface Analytics {
  totalSales: number
  totalReturns: number
  totalRebates: number
  totalDiscounts: number
  totalCosts: number
  netRevenue: number
  transactionCount: number
  byType: Record<string, { count: number; total: number }>
}

export default function AnalyticsDashboard({ tenantId, refreshTrigger }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [tenantId, refreshTrigger])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/transactions?tenantId=${tenantId}`)
      if (!response.ok) throw new Error('Failed to fetch transactions')
      const transactions: Transaction[] = await response.json()

      const byType: Record<string, { count: number; total: number }> = {}
      let totalSales = 0
      let totalReturns = 0
      let totalRebates = 0
      let totalDiscounts = 0
      let totalCosts = 0

      transactions.forEach((t) => {
        const amount = parseFloat(t.amount)
        const type = t.transactionType

        if (!byType[type]) {
          byType[type] = { count: 0, total: 0 }
        }
        byType[type].count++
        byType[type].total += amount

        switch (type) {
          case 'SALE':
            totalSales += amount
            break
          case 'RETURN':
            totalReturns += amount
            break
          case 'REBATE':
            totalRebates += amount
            break
          case 'DISCOUNT':
            totalDiscounts += amount
            break
          case 'COST':
            totalCosts += amount
            break
        }
      })

      const netRevenue = totalSales + totalReturns - totalRebates - totalDiscounts - totalCosts

      setAnalytics({
        totalSales,
        totalReturns,
        totalRebates,
        totalDiscounts,
        totalCosts,
        netRevenue,
        transactionCount: transactions.length,
        byType,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div style={styles.loading}>Loading analytics...</div>
  if (!analytics) return null

  const stats = [
    { label: 'Total Sales', value: analytics.totalSales, color: '#22c55e' },
    { label: 'Total Returns', value: analytics.totalReturns, color: '#f97316' },
    { label: 'Total Rebates', value: analytics.totalRebates, color: '#3b82f6' },
    { label: 'Total Discounts', value: analytics.totalDiscounts, color: '#8b5cf6' },
    { label: 'Total Costs', value: analytics.totalCosts, color: '#ef4444' },
    { label: 'Net Revenue', value: analytics.netRevenue, color: analytics.netRevenue >= 0 ? '#059669' : '#dc2626' },
  ]

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Analytics Dashboard</h2>
      
      <div style={styles.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.label} style={styles.statCard}>
            <div style={{ ...styles.statValue, color: stat.color }}>
              {formatCurrency(stat.value)}
            </div>
            <div style={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={styles.summary}>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Total Transactions:</span>
          <span style={styles.summaryValue}>{analytics.transactionCount}</span>
        </div>
      </div>

      {Object.keys(analytics.byType).length > 0 && (
        <div style={styles.breakdown}>
          <h3 style={styles.breakdownTitle}>Breakdown by Type</h3>
          <div style={styles.breakdownGrid}>
            {Object.entries(analytics.byType).map(([type, data]) => (
              <div key={type} style={styles.breakdownItem}>
                <div style={styles.breakdownHeader}>
                  <span
                    style={{
                      ...styles.breakdownBadge,
                      backgroundColor: getTransactionTypeColor(type) + '20',
                      color: getTransactionTypeColor(type),
                    }}
                  >
                    {getTransactionTypeLabel(type)}
                  </span>
                  <span style={styles.breakdownCount}>{data.count} txns</span>
                </div>
                <div style={styles.breakdownAmount}>{formatCurrency(data.total)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  title: {
    margin: '0 0 20px 0',
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#111827',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#6b7280',
  },
  summary: {
    padding: '16px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: '0.875rem',
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#111827',
  },
  breakdown: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '20px',
  },
  breakdownTitle: {
    margin: '0 0 16px 0',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#374151',
  },
  breakdownGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },
  breakdownItem: {
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    padding: '12px',
  },
  breakdownHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  breakdownBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 500,
    textTransform: 'uppercase',
  },
  breakdownCount: {
    fontSize: '0.75rem',
    color: '#6b7280',
  },
  breakdownAmount: {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: '#111827',
    fontFamily: 'monospace',
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#6b7280',
  },
}