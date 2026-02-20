'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import SaleForm from '@/components/SaleForm'
import TransactionList from '@/components/TransactionList'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import CurrencySelector from '@/components/CurrencySelector'
import TenantLogin from '@/components/TenantLogin'
import ChatBot from '@/components/ChatBot'
import { useLanguage } from '@/lib/LanguageContext'

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} })

interface Tenant {
  id: string
  name: string
  country: string
  password?: string
  _count: {
    transactions: number
  }
}

export default function Home() {
  const { t } = useLanguage()
  const [theme, setTheme] = useState('light')
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [tenantInput, setTenantInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showLogin, setShowLogin] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [authenticatedTenants, setAuthenticatedTenants] = useState<Set<string>>(new Set())
  
  const envName = process.env.NEXT_PUBLIC_ENV_NAME || 'production'
  const isDev = envName === 'development'

  useEffect(() => {
    const saved = localStorage.getItem('tracelid-theme')
    if (saved) setTheme(saved)
    fetchTenants()
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('tracelid-theme', newTheme)
  }

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/tenants')
      if (!response.ok) throw new Error('Failed to fetch tenants')
      const data = await response.json()
      
      // Handle both array response and object with tenants property
      const tenantList = Array.isArray(data) ? data : (data.tenants || [])
      
      setTenants(tenantList)
      if (tenantList.length > 0 && !selectedTenantId) {
        const firstTenant = tenantList[0]
        setSelectedTenantId(firstTenant.id)
        setTenantInput(firstTenant.id)
        // Auto-save first tenant
        localStorage.setItem('tracelid-selected-tenant', firstTenant.id)
        localStorage.setItem('tracelid-selected-tenant-name', firstTenant.name)
        console.log(`Auto-selected tenant: ${firstTenant.name} (${firstTenant.id})`)
      }
    } catch (err) {
      console.error('Error fetching tenants:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSetTenant = () => {
    const tenant = tenants.find(t => t.id === tenantInput.trim())
    if (!tenant) {
      console.error('Tenant not found:', tenantInput)
      return
    }

    console.log(`Selected tenant: ${tenant.name} (${tenant.id})`)
    
    // Save to localStorage for analytics page
    localStorage.setItem('tracelid-selected-tenant', tenant.id)
    localStorage.setItem('tracelid-selected-tenant-name', tenant.name)

    if (tenant.password && !authenticatedTenants.has(tenant.id)) {
      setShowLogin(true)
      setLoginError('')
      return
    }

    setSelectedTenantId(tenantInput.trim())
    // Trigger refresh of child components
    setRefreshTrigger(prev => prev + 1)
  }

  const handleLogin = async (password: string) => {
    const tenant = tenants.find(t => t.id === tenantInput.trim())
    if (!tenant) return

    const response = await fetch('/api/tenants/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: tenant.id, password })
    })

    if (response.ok) {
      setAuthenticatedTenants(prev => new Set(prev).add(tenant.id))
      setShowLogin(false)
      setSelectedTenantId(tenantInput.trim())
      setLoginError('')
    } else {
      setLoginError('Invalid password')
    }
  }

  const handleTransactionSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const selectedTenant = tenants.find(t => t.id === selectedTenantId)

  const isDark = theme === 'dark'
  const bgColor = isDark ? '#111827' : '#F1F5F9'
  const cardBg = isDark ? '#1F2937' : '#FFFFFF'
  const textColor = isDark ? '#F9FAFB' : '#1F2937'
  const borderColor = isDark ? '#374151' : '#E5E7EB'
  const inputBg = isDark ? '#374151' : '#F9FAFB'

  if (loading) {
    return (
      <div style={{...styles.page, backgroundColor: bgColor}}>
        <div style={{...styles.loading, color: isDark ? '#9CA3AF' : '#6B7280'}}>Loading...</div>
      </div>
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div style={{...styles.page, backgroundColor: bgColor}}>
        {isDev && (
          <div style={styles.devBanner}>
            🚧 DEV ENVIRONMENT - {envName.toUpperCase()} 🚧
          </div>
        )}
        <header style={{...styles.header, backgroundColor: cardBg, borderBottomColor: borderColor}}>
          <div style={styles.headerContent}>
            <div style={styles.logo}>
              <svg width="160" height="44" viewBox="0 0 200 50">
                <defs>
                  <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6C5CE7" />
                    <stop offset="100%" stopColor="#A78BFA" />
                  </linearGradient>
                </defs>
                <circle cx="25" cy="25" r="20" fill="none" stroke="url(#logoGrad)" strokeWidth="3" />
                <polyline points="14,30 20,22 26,28 36,16" fill="none" stroke="url(#logoGrad)" strokeWidth="3" strokeLinecap="round" />
                <path d="M25 25 L25 11 A14 14 0 0 1 36 18 Z" fill="#6C5CE7" opacity="0.3" />
                <line x1="40" y1="40" x2="50" y2="50" stroke="url(#logoGrad)" strokeWidth="5" strokeLinecap="round" />
                <text x="65" y="34" fontSize="24" fontWeight="700" fill={textColor}>Tracelid</text>
              </svg>
            </div>
            
            <div style={styles.headerRight}>
              <div style={styles.headerControl}>
                <span style={{...styles.headerLabel, color: isDark ? '#9CA3AF' : '#6B7280'}}>Language</span>
                <LanguageSwitcher />
              </div>
              <div style={styles.headerControl}>
                <span style={{...styles.headerLabel, color: isDark ? '#9CA3AF' : '#6B7280'}}>Currency</span>
                <CurrencySelector />
              </div>
              <button onClick={toggleTheme} style={{...styles.themeBtn, backgroundColor: isDark ? '#374151' : '#F3F4F6', color: textColor}}>
                {isDark ? '☀️' : '🌙'}
              </button>
              <a href="/admin" style={{...styles.headerBtnSecondary, color: isDark ? '#9CA3AF' : '#6B7280'}}>Admin</a>
              <a href="/register" style={{...styles.headerBtnSecondary, color: isDark ? '#9CA3AF' : '#6B7280'}}>Register</a>
              <a href="/analytics" style={styles.headerBtnPrimary}>Analytics</a>
            </div>
          </div>
        </header>

        <main style={styles.main}>
          <div style={{...styles.tenantBar, backgroundColor: cardBg, borderColor}}>
            <div style={styles.tenantLeft}>
              <span style={{...styles.tenantLabel, color: isDark ? '#9CA3AF' : '#9CA3AF'}}>TENANT</span>
              
              {/* Tenant Dropdown */}
              <select
                value={selectedTenantId}
                onChange={(e) => {
                  const tenantId = e.target.value
                  setTenantInput(tenantId)
                  const tenant = tenants.find(t => t.id === tenantId)
                  if (tenant) {
                    console.log(`Selected tenant: ${tenant.name} (${tenant.id})`)
                    localStorage.setItem('tracelid-selected-tenant', tenant.id)
                    localStorage.setItem('tracelid-selected-tenant-name', tenant.name)
                    
                    if (tenant.password && !authenticatedTenants.has(tenant.id)) {
                      setShowLogin(true)
                      setLoginError('')
                    } else {
                      setSelectedTenantId(tenantId)
                      setRefreshTrigger(prev => prev + 1)
                    }
                  }
                }}
                style={{
                  ...styles.tenantSelect,
                  backgroundColor: inputBg,
                  borderColor,
                  color: textColor
                }}
              >
                <option value="">-- Select a tenant --</option>
                {tenants.map(tenant => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name} ({tenant.country}) {tenant.password ? '🔒' : ''}
                  </option>
                ))}
              </select>
              
              {selectedTenant && (
                <span style={{...styles.tenantInfo, color: isDark ? '#9CA3AF' : '#6B7280'}}>
                  {selectedTenant._count?.transactions || 0} transactions
                </span>
              )}
            </div>
            
            <div style={styles.tenantRight}>
              <button 
                onClick={() => document.getElementById('tenantIdInput')?.classList.toggle('hidden')}
                style={{...styles.advancedBtn, color: isDark ? '#9CA3AF' : '#6B7280'}}
                title="Advanced: Enter tenant ID manually"
              >
                ⚙️
              </button>
            </div>
            
            <div id="tenantIdInput" className="hidden" style={styles.tenantInputGroup}>
              <span style={{...styles.tenantLabel, color: isDark ? '#9CA3AF' : '#9CA3AF'}}>ID (Advanced)</span>
              <input
                type="text"
                value={tenantInput}
                onChange={(e) => setTenantInput(e.target.value)}
                style={{...styles.tenantInput, backgroundColor: inputBg, borderColor, color: textColor}}
                placeholder="Tenant ID..."
              />
              <button onClick={handleSetTenant} style={styles.tenantBtn}>Set</button>
            </div>
          </div>

          <div style={styles.grid}>
            <div style={{...styles.card, backgroundColor: cardBg, borderColor}}>
              <SaleForm tenantId={selectedTenantId} onSuccess={handleTransactionSuccess} />
            </div>
            <div style={{...styles.card, backgroundColor: cardBg, borderColor}}>
              <AnalyticsDashboard tenantId={selectedTenantId} refreshTrigger={refreshTrigger} />
            </div>
          </div>

          <div style={{...styles.card, backgroundColor: cardBg, borderColor}}>
            <TransactionList tenantId={selectedTenantId} refreshTrigger={refreshTrigger} />
          </div>
        </main>

        {showLogin && selectedTenant && (
          <TenantLogin
            tenantName={selectedTenant.name}
            onLogin={handleLogin}
            onCancel={() => setShowLogin(false)}
            error={loginError}
          />
        )}

        <ChatBot />
      </div>
    </ThemeContext.Provider>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '1.1rem',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    borderBottom: '1px solid',
  },
  devBanner: {
    backgroundColor: '#F59E0B',
    color: '#fff',
    textAlign: 'center',
    padding: '8px',
    fontWeight: 700,
    fontSize: '0.85rem',
    letterSpacing: '1px',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    height: '68px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  headerLabel: {
    fontSize: '0.75rem',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  themeBtn: {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  headerBtnSecondary: {
    padding: '8px 14px',
    textDecoration: 'none',
    fontSize: '0.85rem',
    fontWeight: 500,
    borderRadius: '6px',
  },
  headerBtnPrimary: {
    padding: '8px 16px',
    backgroundColor: '#6C5CE7',
    color: '#fff',
    textDecoration: 'none',
    fontSize: '0.85rem',
    fontWeight: 600,
    borderRadius: '6px',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  tenantBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderRadius: '12px',
    marginBottom: '32px',
    border: '1px solid',
    flexWrap: 'wrap',
    gap: '12px',
  },
  tenantLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },
  tenantLabel: {
    fontSize: '0.7rem',
    fontWeight: 600,
    letterSpacing: '1px',
  },
  tenantSelect: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '0.95rem',
    minWidth: '250px',
    outline: 'none',
    cursor: 'pointer',
  },
  tenantInfo: {
    fontSize: '0.85rem',
    marginLeft: '8px',
  },
  tenantRight: {
    display: 'flex',
    alignItems: 'center',
  },
  tenantName: {
    fontSize: '1rem',
    fontWeight: 600,
  },
  advancedBtn: {
    padding: '6px 10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  tenantInputGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  tenantInput: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid',
    fontSize: '0.85rem',
    minWidth: '200px',
    outline: 'none',
  },
  tenantBtn: {
    padding: '8px 16px',
    backgroundColor: '#6C5CE7',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '32px',
    marginBottom: '32px',
  },
  card: {
    borderRadius: '12px',
    border: '1px solid',
    overflow: 'hidden',
  },
}
