'use client'

import { useEffect, useState } from 'react'
import { useCurrency } from '@/lib/CurrencyContext'
import { formatCurrency } from '@/lib/currency'

interface Transaction {
  id: string
  transaction_type: string
  category: string
  amount: number
  description: string
  createdAt: string
}

interface AnalyticsDashboardProps {
  tenantId: string
  refreshTrigger?: number
}

export default function AnalyticsDashboard({ tenantId, refreshTrigger }: AnalyticsDashboardProps) {
  const { currency } = useCurrency()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTransactions()
  }, [tenantId, refreshTrigger])

  const fetchTransactions = async () => {
    if (!tenantId) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
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

  const calculateStats = () => {
    let sales = 0, returns = 0, discounts = 0, costs = 0
    
    transactions.forEach((t) => {
      const amount = t.amount
      switch (t.transaction_type) {
        case 'SALE': sales += amount; break
        case 'RETURN': returns += amount; break
        case 'REBATE':
        case 'DISCOUNT': discounts += amount; break
        case 'COST': costs += amount; break
      }
    })
    
    const net = sales - Math.abs(returns) - Math.abs(discounts) - Math.abs(costs)
    
    return { sales, returns, discounts, net, count: transactions.length }
  }

  const stats = calculateStats()

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📊 Analytics Dashboard</h2>
      
      <div style={styles.grid}>
        <div style={{ ...styles.stat, borderLeftColor: '#22c55e' }}>
          <div style={{ ...styles.statValue, color: '#22c55e' }}>{formatCurrency(stats.sales, currency)}</div>
          <div style={styles.statLabel}>Sales</div>
        </div>
        
        <div style={{ ...styles.stat, borderLeftColor: '#f97316' }}>
          <div style={{ ...styles.statValue, color: '#f97316' }}>{formatCurrency(stats.returns, currency)}</div>
          <div style={styles.statLabel}>Returns</div>
        </div>
        
        <div style={{ ...styles.stat, borderLeftColor: '#14b8a6' }}>
          <div style={{ ...styles.statValue, color: '#14b8a6' }}>{formatCurrency(stats.discounts, currency)}</div>
          <div style={styles.statLabel}>Discounts</div>
        </div>
        
        <div style={{ ...styles.stat, borderLeftColor: stats.net >= 0 ? '#3b82f6' : '#ef4444' }}>
          <div style={{ ...styles.statValue, color: stats.net >= 0 ? '#3b82f6' : '#ef4444' }}>{formatCurrency(stats.net, currency)}</div>
          <div style={styles.statLabel}>Net</div>
        </div>
      </div>

      <div style={styles.footer}>
        <span style={styles.footerLabel}>Total Transactions:</span>
        <span style={styles.footerValue}>{stats.count}</span>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#6B7280',
  },
  title: {
    margin: '0 0 20px 0',
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#1F2937',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  },
  stat: {
    backgroundColor: '#F9FAFB',
    padding: '16px 12px',
    borderRadius: '10px',
    textAlign: 'center',
    borderLeft: '3px solid',
  },
  statValue: {
    fontSize: '1rem',
    fontWeight: 700,
    fontFamily: 'monospace',
    marginBottom: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  statLabel: {
    fontSize: '0.7rem',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
  },
  footerLabel: {
    fontSize: '0.85rem',
    color: '#6B7280',
  },
  footerValue: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#1F2937',
  },
}
