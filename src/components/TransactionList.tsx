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

  if (loading) return <div style={styles.loading}>Loading transactions...</div>
  if (error) return <div style={styles.error}>{error}</div>
  if (transactions.length === 0) return <div style={styles.empty}>No transactions found</div>

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Recent Transactions</h2>
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
    borderBottom: '2px solid #e5e7eb',
    fontWeight: 600,
    color: '#374151',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #e5e7eb',
  },
  td: {
    padding: '12px',
    verticalAlign: 'middle',
  },
  docNumber: {
    fontFamily: 'monospace',
    fontWeight: 500,
    color: '#111827',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 500,
    textTransform: 'uppercase',
  },
  amount: {
    fontWeight: 600,
    fontFamily: 'monospace',
  },
  description: {
    color: '#6b7280',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'block',
  },
  date: {
    color: '#6b7280',
    whiteSpace: 'nowrap',
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
    borderRadius: '8px',
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#6b7280',
  },
}