'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { useCurrency } from '@/lib/CurrencyContext'
import { translateType } from '@/lib/i18n'

interface SaleFormProps {
  tenantId: string
  onSuccess?: () => void
}

const transactionTypes = ['SALE', 'RETURN', 'REBATE', 'DISCOUNT', 'COST']

export default function SaleForm({ tenantId, onSuccess }: SaleFormProps) {
  const { t, language } = useLanguage()
  const { currency } = useCurrency()
  const [transactionType, setTransactionType] = useState('SALE')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [productId, setProductId] = useState('')
  const [productName, setProductName] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!tenantId) {
      setError('❌ No tenant selected. Please select a tenant first.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          transactionType,
          amount: parseFloat(amount),
          description,
          productId: productId || null,
          productName: productName || null,
          customerId: customerId || null,
          customerName: customerName || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to create transaction')
      }

      setSuccess(`✅ Transaction created: ${data.document_number || data.documentNumber || 'Success'}`)
      setAmount('')
      setDescription('')
      setProductId('')
      setProductName('')
      setCustomerId('')
      setCustomerName('')
      onSuccess?.()
    } catch (err: any) {
      setError(`❌ ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>💰 {t('newTransaction')}</h2>
      
      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>{t('transactionType')}</label>
          <select
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
            style={styles.select}
          >
            {transactionTypes.map((type) => (
              <option key={type} value={type}>
                {translateType(language, type)}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Product ID</label>
          <input
            type="text"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            style={styles.input}
            placeholder="Enter product ID..."
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Product Name</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            style={styles.input}
            placeholder="Enter product name..."
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Customer ID</label>
          <input
            type="text"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            style={styles.input}
            placeholder="Enter customer ID..."
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Customer Name</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            style={styles.input}
            placeholder="Enter customer name..."
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>{t('amount')} ({currency})</label>
          <input
            type="number"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={styles.input}
            placeholder="0.00"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>{t('description')}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={styles.textarea}
            placeholder="Optional description..."
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !tenantId}
          style={{
            ...styles.button,
            opacity: loading || !tenantId ? 0.6 : 1,
            cursor: loading || !tenantId ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Creating...' : '➕ Create Transaction'}
        </button>
      </form>
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 500,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  select: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    fontSize: '0.95rem',
    backgroundColor: '#fff',
    outline: 'none',
    color: '#1F2937',
  },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    fontSize: '0.95rem',
    outline: 'none',
    color: '#1F2937',
  },
  textarea: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    fontSize: '0.95rem',
    resize: 'vertical',
    outline: 'none',
    color: '#1F2937',
    fontFamily: 'inherit',
  },
  button: {
    padding: '12px 20px',
    backgroundColor: '#6C5CE7',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: 600,
    marginTop: '8px',
  },
  error: {
    padding: '12px',
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '0.9rem',
  },
  success: {
    padding: '12px',
    backgroundColor: '#F0FDF4',
    color: '#16A34A',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '0.9rem',
  },
}
