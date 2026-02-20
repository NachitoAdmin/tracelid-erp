'use client'

import { useEffect, useState } from 'react'
import { formatCurrency, formatDateTime, getTransactionTypeColor, getTransactionTypeLabel } from '@/lib/utils'

interface Transaction {
  id: string
  document_number?: string
  documentNumber?: string
  transaction_type?: string
  transactionType?: string
  amount: string | number
  description: string | null
  product_name?: string
  product_id?: string
  customer_name?: string
  customer_id?: string
  createdAt?: string
  createdat?: string
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
              <th style={styles.th}>Product</th>
              <th style={styles.th}>Customer</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => {
              const docNumber = t.document_number || t.documentNumber || 'N/A'
              const transType = t.transaction_type || t.transactionType || 'UNKNOWN'
              return (
                <tr key={t.id} style={styles.tr}>
                  <td style={styles.td}>
                    <span style={styles.docNumber}>{docNumber}</span>
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor: getTransactionTypeColor(transType) + '20',
                        color: getTransactionTypeColor(transType),
                      }}
                    >
                      {getTransactionTypeLabel(transType)}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {t.product_name ? (
                      <div>
                        <div style={styles.primaryText}>{t.product_name}</div>
                        {t.product_id && <div style={styles.secondaryText}>ID: {t.product_id}</div>}
                      </div>
                    ) : (
                      <span style={styles.muted}>-</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    {t.customer_name ? (
                      <div>
                        <div style={styles.primaryText}>{t.customer_name}</div>
                        {t.customer_id && <div style={styles.secondaryText}>ID: {t.customer_id}</div>}
                      </div>
                    ) : (
                      <span style={styles.muted}>-</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.amount,
                      color: ['RETURN', 'DISCOUNT', 'REBATE', 'COST'].includes(transType) ? '#dc2626' : '#16a34a'
                    }}>
                      {formatCurrency(
                        ['RETURN', 'DISCOUNT', 'REBATE', 'COST'].includes(transType) 
                          ? -Math.abs(parseFloat(t.amount as string)) 
                          : t.amount
                      )}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.date}>{formatDateTime(t.createdAt || t.createdat)}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
  },
  title: {
    margin: '0 0 20px 0',
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#1F2937',
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
    padding: '12px',
    borderBottom: '2px solid #E5E7EB',
    fontWeight: 600,
    color: '#6B7280',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tr: {
    borderBottom: '1px solid #F3F4F6',
  },
  td: {
    padding: '12px',
    verticalAlign: 'middle',
  },
  docNumber: {
    fontFamily: 'monospace',
    fontWeight: 600,
    color: '#6C5CE7',
    fontSize: '0.85rem',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  primaryText: {
    fontWeight: 500,
    color: '#1F2937',
  },
  secondaryText: {
    fontSize: '0.8rem',
    color: '#9CA3AF',
  },
  muted: {
    color: '#9CA3AF',
  },
  amount: {
    fontWeight: 600,
    fontFamily: 'monospace',
  },
  date: {
    color: '#6B7280',
    fontSize: '0.85rem',
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#6B7280',
  },
  error: {
    padding: '20px',
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    borderRadius: '8px',
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#6B7280',
  },
}
