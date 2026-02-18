'use client'

import { useState } from 'react'

interface SaleFormProps {
  tenantId: string
  onSuccess?: () => void
}

const transactionTypes = ['SALE', 'RETURN', 'REBATE', 'DISCOUNT', 'COST']

export default function SaleForm({ tenantId, onSuccess }: SaleFormProps) {
  const [transactionType, setTransactionType] = useState('SALE')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          transactionType,
          amount: parseFloat(amount),
          description,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create transaction')
      }

      const data = await response.json()
      setSuccess(`Transaction created: ${data.documentNumber}`)
      setAmount('')
      setDescription('')
      onSuccess?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>💰 New Transaction</h2>
      
      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>Transaction Type</label>
          <select
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
            style={styles.select}
          >
            {transactionTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Amount</label>
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
          <label style={styles.label}>Description</label>
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
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: 500,
    color: '#4a4a6a',
  },
  select: {
    padding: '12px 16px',
    borderRadius: '12px',
    border: '2px solid #e8e8f0',
    fontSize: '1rem',
    backgroundColor: '#fff',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  input: {
    padding: '12px 16px',
    borderRadius: '12px',
    border: '2px solid #e8e8f0',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  textarea: {
    padding: '12px 16px',
    borderRadius: '12px',
    border: '2px solid #e8e8f0',
    fontSize: '1rem',
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
  },
  button: {
    padding: '14px 20px',
    backgroundColor: '#22c55e',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: 600,
    marginTop: '8px',
    boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)',
    transition: 'all 0.2s',
  },
  error: {
    padding: '14px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: '12px',
    marginBottom: '20px',
    fontSize: '0.9rem',
    border: '1px solid #fecaca',
  },
  success: {
    padding: '14px',
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
    borderRadius: '12px',
    marginBottom: '20px',
    fontSize: '0.9rem',
    border: '1px solid #bbf7d0',
  },
}
