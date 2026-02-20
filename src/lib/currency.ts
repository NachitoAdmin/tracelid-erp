export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD'

export const currencies: { code: Currency; symbol: string; name: string }[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
]

export function formatCurrency(amount: number, currency: Currency = 'USD'): string {
  const currencyInfo = currencies.find(c => c.code === currency)
  const symbol = currencyInfo?.symbol || '$'
  
  // Format based on currency
  const formatter = new Intl.NumberFormat(getLocaleForCurrency(currency), {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  
  return `${symbol}${formatter.format(amount)}`
}

function getLocaleForCurrency(currency: Currency): string {
  const localeMap: Record<Currency, string> = {
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    JPY: 'ja-JP',
    CAD: 'en-CA',
    AUD: 'en-AU',
  }
  return localeMap[currency] || 'en-US'
}

export function convertCurrency(amount: number, from: Currency, to: Currency): number {
  // Simplified conversion rates (in production, use real-time API)
  const rates: Record<Currency, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 150.5,
    CAD: 1.35,
    AUD: 1.52,
  }
  
  const usdAmount = amount / rates[from]
  return usdAmount * rates[to]
}
