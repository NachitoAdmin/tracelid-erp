'use client'

import { useEffect, useState } from 'react'
import { formatCurrency, formatDateTime, getTransactionTypeColor, getTransactionTypeLabel } from '@/lib/utils'

interface Transaction {
  id: string
  documentNumber: string
  transactionType: string
  amount: string
  description: string | null
  createdAt: string
  tenant: {
    name: string
    country: string
  }
}

interface TransactionListProps {
  tenantId: string
  refreshTrigger?: number
}

export default function TransactionList({ tenantId, refreshTrigger }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTransactions()
  }, [tenantId, refreshTrigger])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/transactions?tenantId=${tenantId}`)
      if (!response.ok) throw new Error('Failed to fetch transactions')
      const data = await response.json()
      setTransactions(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading transactions...</div>
      </div>
    )
  }
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
      </div>
    )
  }
  if (transactions.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>No transactions found</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📋 Recent Transactions</h2>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Document #</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} style={styles.tr}>
                <td style={styles.td}>
                  <span style={styles.docNumber}>{t.documentNumber}</span>
                </td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.badge,
                      backgroundColor: getTransactionTypeColor(t.transactionType) + '20',
                      color: getTransactionTypeColor(t.transactionType),
                    }}
                  >
                    {getTransactionTypeLabel(t.transactionType)}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.amount,
                    color: ['SALE', 'RETURN'].includes(t.transactionType) ? '#16a34a' : '#dc2626'
                  }}>
                    {formatCurrency(t.amount)}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={styles.description}>{t.description || '-'}</span>
                </td>
                <td style={styles.td}>
                  <span style={styles.date}>{formatDateTime(t.createdAt)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
  },
  th: {
    textAlign: 'left',
    padding: '14px 12px',
    borderBottom: '2px solid #e8e8f0',
    fontWeight: 600,
    color: '#4a4a6a',
    whiteSpace: 'nowrap',
    fontSize: '0.85rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tr: {
    borderBottom: '1px solid #f0f0f5',
    transition: 'background-color 0.2s',
  },
  td: {
    padding: '14px 12px',
    verticalAlign: 'middle',
  },
  docNumber: {
    fontFamily: 'monospace',
    fontWeight: 600,
    color: '#667eea',
    fontSize: '0.9rem',
  },
  badge: {
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  amount: {
    fontWeight: 600,
    fontFamily: 'monospace',
    fontSize: '0.95rem',
  },
  description: {
    color: '#6b7280',
    maxWidth: '250px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'block',
  },
  date: {
    color: '#6b7280',
    whiteSpace: 'nowrap',
    fontSize: '0.85rem',
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#6b7280',
  },
  error: {
    padding: '20px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: '16px',
    border: '1px solid #fecaca',
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#6b7280',
  },
}
