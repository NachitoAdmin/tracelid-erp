'use client'

import { useCurrency } from '@/lib/CurrencyContext'
import { currencies } from '@/lib/currency'

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency()

  return (
    <div style={styles.container}>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as any)}
        style={styles.select}
      >
        {currencies.map((curr) => (
          <option key={curr.code} value={curr.code}>
            {curr.symbol} {curr.code} - {curr.name}
          </option>
        ))}
      </select>
    </div>
  )
}

const styles = {
  container: {
    display: 'inline-block',
  },
  select: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '2px solid rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.9)',
    fontSize: '0.9rem',
    cursor: 'pointer',
    outline: 'none',
  },
}
