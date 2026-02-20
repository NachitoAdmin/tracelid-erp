'use client'

import { useEffect, useState, createContext } from 'react'
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

interface User {
  id: string
  email: string
  role: 'owner' | 'admin' | 'operator'
  firstName: string
  lastName: string
  tenant: {
    id: string
    name: string
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
  const [user, setUser] = useState<User | null>(null)
  
  const envName = process.env.NEXT_PUBLIC_ENV_NAME || 'production'
  const isDev = envName === 'development'

  useEffect(() => {
    const saved = localStorage.getItem('tracelid-theme')
    if (saved) setTheme(saved)
    
    // Get user from localStorage
    const userData = localStorage.getItem('tracelid-user')
    let parsedUser = null
    
    if (userData) {
      try {
        parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        // If admin/operator, auto-select their tenant
        if (parsedUser?.role && parsedUser.role !== 'owner' && parsedUser.tenant?.id) {
          setSelectedTenantId(parsedUser.tenant.id)
          setTenantInput(parsedUser.tenant.id)
          localStorage.setItem('tracelid-selected-tenant', parsedUser.tenant.id)
          localStorage.setItem('tracelid-selected-tenant-name', parsedUser.tenant.name)
        }
      } catch (e) {
        console.error('Failed to parse user data')
      }
    }
    
    // Only fetch tenants for owner role
    if (!parsedUser || parsedUser.role === 'owner') {
      fetchTenants()
    } else {
      setLoading(false)
    }
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
      
      const tenantList = Array.isArray(data) ? data : (data.tenants || [])
      
      setTenants(tenantList)
      if (tenantList.length > 0 && !selectedTenantId) {
        const firstTenant = tenantList[0]
        setSelectedTenantId(firstTenant.id)
        setTenantInput(firstTenant.id)
        localStorage.setItem('tracelid-selected-tenant', firstTenant.id)
        localStorage.setItem('tracelid-selected-tenant-name', firstTenant.name)
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

    localStorage.setItem('tracelid-selected-tenant', tenant.id)
    localStorage.setItem('tracelid-selected-tenant-name', tenant.name)

    if (tenant.password && !authenticatedTenants.has(tenant.id)) {
      setShowLogin(true)
      setLoginError('')
      return
    }

    setSelectedTenantId(tenantInput.trim())
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

  const handleLogout = () => {
    localStorage.removeItem('tracelid-user')
    localStorage.removeItem('tracelid-selected-tenant')
    localStorage.removeItem('tracelid-selected-tenant-name')
    window.location.href = '/login'
  }

  const selectedTenant = tenants.find(t => t.id === selectedTenantId) || user?.tenant
  const isOwner = user?.role === 'owner'
  const isAdmin = user?.role === 'admin'
  const isOperator = user?.role === 'operator'

  const isDark = theme === 'dark'
  const bgColor = isDark ? '#111827' : '#F1F5F9'
  const cardBg = isDark ? '#1F2937' : '#FFFFFF'
  const textColor = isDark ? '#F9FAFB' : '#1F2937'
  const borderColor = isDark ? '#374151' : '#E5E7EB'
  const inputBg = isDark ? '#374151' : '#F9FAFB'

  // Role badge colors
  const roleColors: Record<string, string> = {
    owner: '#8B5CF6', // Purple
    admin: '#10B981', // Green
    operator: '#F59E0B', // Orange
  }

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
            
            <div style={styles.headerCenter}>
              {/* Tenant Name with Role */}
              {selectedTenant?.name && (
                <div style={styles.headerItem}>
                  <span style={{...styles.headerLabel, color: isDark ? '#9CA3AF' : '#6B7280'}}>TENANT</span>
                  <span style={{...styles.headerValue, color: textColor}}>
                    {selectedTenant.name} {'country' in selectedTenant ? `(${(selectedTenant as any).country})` : ''}
                    {user?.role && (
                      <span style={{...styles.roleTag, backgroundColor: roleColors[user.role] || '#6B7280'}}>
                        {user.role.toUpperCase()}
                      </span>
                    )}
                  </span>
                </div>
              )}
              
              {/* User Name */}
              {user && (
                <div style={styles.headerItem}>
                  <span style={{...styles.headerLabel, color: isDark ? '#9CA3AF' : '#6B7280'}}>USER</span>
                  <span style={{...styles.headerValue, color: textColor}}>
                    {user.firstName} {user.lastName}
                  </span>
                </div>
              )}
            </div>
            
            <div style={styles.headerRight}>
              <div style={styles.headerControlCompact}>
                <LanguageSwitcher />
              </div>
              <div style={styles.headerControlCompact}>
                <CurrencySelector />
              </div>
              <button onClick={toggleTheme} style={{...styles.themeBtnCompact, backgroundColor: isDark ? '#374151' : '#F3F4F6', color: textColor}}>
                {isDark ? '☀️' : '🌙'}
              </button>
              
              {/* Master Data button - ALWAYS VISIBLE */}
              <a href="/master-data" style={{...styles.headerBtnCompact, background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)'}}>
                📊 Master
              </a>
              
              <a href="/analytics" style={{...styles.headerBtnCompact, background: 'linear-gradient(135deg, #6C5CE7 0%, #764ba2 100%)'}}>📈 Analytics</a>
              
              {/* Logout button */}
              <button onClick={handleLogout} style={{...styles.headerBtnCompact, background: '#EF4444'}}>
                🚪 Logout
              </button>
            </div>
          </div>
        </header>

        <main style={styles.main}>
          {/* Tenant Bar - Show for Owner role */}
          {isOwner && (
            <div style={{...styles.tenantBar, backgroundColor: cardBg, borderColor}}>
              <div style={styles.tenantLeft}>
                <span style={{...styles.tenantLabel, color: isDark ? '#9CA3AF' : '#9CA3AF'}}>TENANT</span>
                
                <select
                  value={selectedTenantId}
                  onChange={(e) => {
                    const tenantId = e.target.value
                    setTenantInput(tenantId)
                    const tenant = tenants.find(t => t.id === tenantId)
                    if (tenant) {
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
                
                {selectedTenant && '_count' in selectedTenant && (
                  <span style={{...styles.tenantInfo, color: isDark ? '#9CA3AF' : '#6B7280'}}>
                    {(selectedTenant as any)._count?.transactions || 0} transactions
                  </span>
                )}
              </div>
              
              <div style={styles.tenantRight}>
                <button 
                  onClick={() => document.getElementById('tenantIdInput')?.classList.toggle('hidden')}
                  style={{...styles.advancedBtn, color: isDark ? '#9CA3AF' : '#6B7280'}}
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
          )}
          
          {/* For Admin/Operator - Show tenant name without selector */}
          {(isAdmin || isOperator) && user?.tenant && (
            <div style={{...styles.tenantBar, backgroundColor: cardBg, borderColor}}>
              <div style={styles.tenantLeft}>
                <span style={{...styles.tenantLabel, color: isDark ? '#9CA3AF' : '#9CA3AF'}}>TENANT</span>
                <span style={{...styles.tenantName, color: textColor}}>
                  {user.tenant.name}
                </span>
              </div>
            </div>
          )}

          <div style={styles.grid}>
            <div style={{...styles.card, backgroundColor: cardBg, borderColor}}>
              <SaleForm tenantId={selectedTenantId || user?.tenant?.id || ''} onSuccess={handleTransactionSuccess} />
            </div>
            <div style={{...styles.card, backgroundColor: cardBg, borderColor}}>
              <AnalyticsDashboard tenantId={selectedTenantId || user?.tenant?.id || ''} refreshTrigger={refreshTrigger} />
            </div>
          </div>

          <div style={{...styles.card, backgroundColor: cardBg, borderColor}}>
            <TransactionList tenantId={selectedTenantId || user?.tenant?.id || ''} refreshTrigger={refreshTrigger} />
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
  devBanner: {
    background: 'linear-gradient(90deg, #F59E0B, #EF4444)',
    color: 'white',
    textAlign: 'center',
    padding: '8px',
    fontWeight: 600,
    fontSize: '0.875rem',
  },
  header: {
    borderBottom: '1px solid',
    padding: '16px 24px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
  },
  headerCenter: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1,
    justifyContent: 'center',
  },
  headerItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '1px',
  },
  headerValue: {
    fontSize: '0.9rem',
    fontWeight: 600,
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
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  headerLabel: {
    fontSize: '0.625rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  themeBtn: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  headerBtnPrimary: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #6C5CE7, #A78BFA)',
    color: 'white',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '0.875rem',
  },
  headerBtnSecondary: {
    padding: '8px 12px',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: '0.875rem',
    borderRadius: '6px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  headerControlCompact: {
    display: 'flex',
    alignItems: 'center',
  },
  themeBtnCompact: {
    padding: '6px 10px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  headerBtnCompact: {
    padding: '6px 12px',
    color: 'white',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '0.8rem',
    whiteSpace: 'nowrap',
  },
  logoutBtnCompact: {
    padding: '6px 10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  roleBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
  },
  roleTag: {
    padding: '2px 8px',
    borderRadius: '10px',
    color: 'white',
    fontSize: '0.65rem',
    fontWeight: 600,
    marginLeft: '8px',
  },
  main: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px',
  },
  tenantBar: {
    border: '1px solid',
    borderRadius: '12px',
    padding: '16px 20px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
  },
  tenantLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  tenantLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  tenantSelect: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '0.9rem',
    minWidth: '200px',
  },
  tenantName: {
    fontSize: '1rem',
    fontWeight: 600,
  },
  tenantInfo: {
    fontSize: '0.8rem',
  },
  tenantRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  advancedBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '4px',
  },
  tenantInputGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px dashed #E5E7EB',
  },
  tenantInput: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '0.9rem',
    fontFamily: 'monospace',
  },
  tenantBtn: {
    padding: '8px 16px',
    background: '#6C5CE7',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
    marginBottom: '24px',
  },
  card: {
    border: '1px solid',
    borderRadius: '16px',
    padding: '24px',
  },
}
