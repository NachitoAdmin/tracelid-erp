export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getTransactionTypeColor(type: string): string {
  const colors: Record<string, string> = {
    SALE: '#22c55e',
    RETURN: '#f97316',
    REBATE: '#3b82f6',
    DISCOUNT: '#8b5cf6',
    COST: '#ef4444',
  }
  return colors[type] ?? '#6b7280'
}

export function getTransactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    SALE: 'Sale',
    RETURN: 'Return',
    REBATE: 'Rebate',
    DISCOUNT: 'Discount',
    COST: 'Cost',
  }
  return labels[type] ?? type
}