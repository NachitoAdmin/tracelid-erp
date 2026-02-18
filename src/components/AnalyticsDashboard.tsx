'use client'

import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils'

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

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading analytics...</div>
      </div>
    )
  }
  if (!analytics) return null

  const stats = [
    { label: 'Sales', value: analytics.totalSales, color: '#22c55e', borderColor: '#22c55e' },
    { label: 'Returns', value: analytics.totalReturns, color: '#f97316', borderColor: '#f97316' },
    { label: 'Discounts', value: analytics.totalDiscounts, color: '#14b8a6', borderColor: '#14b8a6' },
    { label: 'Net', value: analytics.netRevenue, color: '#3b82f6', borderColor: '#3b82f6' },
  ]

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📊 Analytics Dashboard</h2>
      
      <div style={styles.statsRow}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ ...styles.statCard, borderTopColor: stat.borderColor }}>
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
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '28px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
  },
  title: {
    margin: '0 0 24px 0',
    fontSize: '1.35rem',
    fontWeight: 600,
    color: '#1a1a2e',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '20px 16px',
    textAlign: 'center',
    borderTop: '4px solid',
    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
  },
  statValue: {
    fontSize: '1.4rem',
    fontWeight: 700,
    marginBottom: '6px',
    fontFamily: 'monospace',
  },
  statLabel: {
    fontSize: '0.8rem',
    color: '#6b7280',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  summary: {
    padding: '16px 20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '16px',
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: '0.9rem',
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#1a1a2e',
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#6b7280',
  },
}

// Responsive styles via media query would be in globals.css
