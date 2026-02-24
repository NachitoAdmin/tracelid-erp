'use client'

import { useEffect, useState, createContext } from 'react'
import Link from 'next/link'
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
  _count?: {
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

interface Stats {
  salesOrders: number
  pendingDeliveries: number
  unpaidInvoices: number
  totalReceivables: number
}

export default function Home() {
  const { t } = useLanguage()
  const [theme, setTheme] = useState('light')
  const [isMobile, setIsMobile] = useState(false)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [tenantInput, setTenantInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [authenticatedTenants, setAuthenticatedTenants] = useState<Set<string>>(new Set())
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<Stats>({
    salesOrders: 0,
    pendingDeliveries: 0,
    unpaidInvoices: 0,
    totalReceivables: 0
  })
  
  const envName = process.env.NEXT_PUBLIC_ENV_NAME || 'production'
  const isDev = envName === 'development'

  useEffect(() => {
    const saved = localStorage.getItem('tracelid-theme')
    if (saved) setTheme(saved)
    
    // Check if mobile
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    const userData = localStorage.getItem('tracelid-user')
    let parsedUser = null
    
    if (userData) {
      try {
        parsedUser = JSON.parse(userData)
        setUser(parsedUser)
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
    
    if (!parsedUser || parsedUser.role === 'owner') {
      const savedTenantId = localStorage.getItem('tracelid-selected-tenant')
      if (savedTenantId) {
        setSelectedTenantId(savedTenantId)
        setTenantInput(savedTenantId)
      }
      fetchTenants()
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedTenantId) {
      fetchStats(selectedTenantId)
    }
  }, [selectedTenantId])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('tracelid-theme', newTheme)
  }

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem('tracelid-token')
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`
      
      const response = await fetch('/api/tenants', { headers })
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

  const fetchStats = async (tenantId: string) => {
    try {
      const token = localStorage.getItem('tracelid-token')
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`
      
      const [salesRes, deliveryRes, receivablesRes] = await Promise.all([
        fetch(`/api/sales-orders?tenantId=${tenantId}`, { headers }),
        fetch(`/api/delivery-status?tenantId=${tenantId}&status=pending`, { headers }),
        fetch(`/api/receivables?tenantId=${tenantId}&paid=false`, { headers })
      ])
      
      const sales = salesRes.ok ? await salesRes.json() : []
      const deliveries = deliveryRes.ok ? await deliveryRes.json() : []
      const receivables = receivablesRes.ok ? await receivablesRes.json() : []
      
      setStats({
        salesOrders: sales.length,
        pendingDeliveries: deliveries.length,
        unpaidInvoices: receivables.length,
        totalReceivables: receivables.reduce((sum: number, r: any) => sum + (r.amount || 0), 0)
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
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
  const mutedColor = isDark ? '#9CA3AF' : '#6B7280'

  const roleColors: Record<string, string> = {
    owner: '#8B5CF6',
    admin: '#10B981',
    operator: '#F59E0B',
  }

  if (loading) {
    return (
      <div style={{...styles.page, backgroundColor: bgColor}}>
        <div style={{...styles.loading, color: mutedColor}}>Loading...</div>
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
        
        {/* Header */}
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
              {selectedTenant?.name && (
                <div style={styles.headerItem}>
                  <span style={{...styles.headerLabel, color: mutedColor}}>TENANT</span>
                  <span style={{...styles.headerValue, color: textColor}}>
                    {selectedTenant.name}
                    {user?.role && (
                      <span style={{...styles.roleTag, backgroundColor: roleColors[user.role]}}>
                        {user.role.toUpperCase()}
                      </span>
                    )}
                  </span>
                </div>
              )}
              
              {user && (
                <div style={styles.headerItem}>
                  <span style={{...styles.headerLabel, color: mutedColor}}>USER</span>
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
              
              {(isOwner || isAdmin) && (
                <a href="/master-data" style={{...styles.headerBtnCompact, background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)'}}>
                  {isMobile ? 'Data' : 'Master Data'}
                </a>
              )}
              
              <a href="/financial-analysis" style={{...styles.headerBtnCompact, background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)'}}>
                {isMobile ? 'Finance' : 'Financial'}
              </a>
              
              <a href="/analytics" style={{...styles.headerBtnCompact, background: 'linear-gradient(135deg, #6C5CE7 0%, #764ba2 100%)'}}>
                {isMobile ? 'Stats' : 'Analytics'}
              </a>
              
              <button onClick={handleLogout} style={{...styles.headerBtnCompact, background: '#EF4444'}}>
                Logout
              </button>
            </div>
          </div>
        </header>

        <main style={styles.main}>
          {/* Tenant Bar */}
          {isOwner && (
            <div style={{...styles.tenantBar, backgroundColor: cardBg, borderColor}}>
              <div style={styles.tenantLeft}>
                <span style={{...styles.tenantLabel, color: '#9CA3AF'}}>TENANT</span>
                <select
                  value={selectedTenantId}
                  onChange={(e) => {
                    const tenantId = e.target.value
                    setTenantInput(tenantId)
                    const tenant = tenants.find(t => t.id === tenantId)
                    if (tenant) {
                      localStorage.setItem('tracelid-selected-tenant', tenant.id)
                      localStorage.setItem('tracelid-selected-tenant-name', tenant.name)
                      
                      const userData = localStorage.getItem('tracelid-user')
                      const userRole = userData ? JSON.parse(userData).role : user?.role
                      console.log('User role:', userRole, 'Bypass password:', userRole === 'owner')
                      
                      if (tenant.password && !authenticatedTenants.has(tenant.id) && userRole !== 'owner') {
                        setShowLogin(true)
                        setLoginError('')
                      } else {
                        setSelectedTenantId(tenantId)
                      }
                    }
                  }}
                  style={{...styles.tenantSelect, backgroundColor: inputBg, borderColor, color: textColor}}
                >
                  <option value="">-- Select a tenant --</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.country}) {tenant.password ? '🔒' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          {(isAdmin || isOperator) && user?.tenant && (
            <div style={{...styles.tenantBar, backgroundColor: cardBg, borderColor}}>
              <div style={styles.tenantLeft}>
                <span style={{...styles.tenantLabel, color: '#9CA3AF'}}>TENANT</span>
                <span style={{...styles.tenantName, color: textColor}}>{user.tenant.name}</span>
              </div>
            </div>
          )}

          {/* Welcome Card */}
          <div style={{...styles.welcomeCard, backgroundColor: cardBg, borderColor}}>
            <h1 style={{...styles.welcomeTitle, color: textColor}}>Welcome to Tracelid ERP</h1>
            <p style={{...styles.welcomeSubtitle, color: mutedColor}}>
              Manage your sales orders, deliveries, invoices, and receivables in one place.
            </p>
          </div>

          {/* Stats Grid */}
          <div style={styles.statsGrid}>
            <div style={{...styles.statCard, backgroundColor: cardBg, borderColor}}>
              <div style={styles.statIcon}>📋</div>
              <div style={{...styles.statValue, color: '#6C5CE7'}}>{stats.salesOrders}</div>
              <div style={{...styles.statLabel, color: mutedColor}}>Sales Orders</div>
            </div>
            <div style={{...styles.statCard, backgroundColor: cardBg, borderColor}}>
              <div style={styles.statIcon}>🚚</div>
              <div style={{...styles.statValue, color: '#F59E0B'}}>{stats.pendingDeliveries}</div>
              <div style={{...styles.statLabel, color: mutedColor}}>Pending Deliveries</div>
            </div>
            <div style={{...styles.statCard, backgroundColor: cardBg, borderColor}}>
              <div style={styles.statIcon}>📄</div>
              <div style={{...styles.statValue, color: '#EF4444'}}>{stats.unpaidInvoices}</div>
              <div style={{...styles.statLabel, color: mutedColor}}>Unpaid Invoices</div>
            </div>
            <div style={{...styles.statCard, backgroundColor: cardBg, borderColor}}>
              <div style={styles.statIcon}>💰</div>
              <div style={{...styles.statValue, color: '#10B981'}}>${stats.totalReceivables.toFixed(2)}</div>
              <div style={{...styles.statLabel, color: mutedColor}}>Total Receivables</div>
            </div>
          </div>

          {/* Navigation Cards */}
          <div style={styles.navGrid}>
            <Link href="/sales-orders" style={{textDecoration: 'none'}}>
              <div style={{...styles.navCard, backgroundColor: cardBg, borderColor}}>
                <div style={{...styles.navIcon, backgroundColor: '#6C5CE720', color: '#6C5CE7'}}>📋</div>
                <h3 style={{...styles.navTitle, color: textColor}}>Sales Orders</h3>
                <p style={{...styles.navDesc, color: mutedColor}}>
                  Create and manage sales orders. Track order status from pending to delivered.
                </p>
                <span style={{...styles.navLink, color: '#6C5CE7'}}>Go to Sales Orders →</span>
              </div>
            </Link>
            
            <Link href="/delivery-status" style={{textDecoration: 'none'}}>
              <div style={{...styles.navCard, backgroundColor: cardBg, borderColor}}>
                <div style={{...styles.navIcon, backgroundColor: '#F59E0B20', color: '#F59E0B'}}>🚚</div>
                <h3 style={{...styles.navTitle, color: textColor}}>Deliveries</h3>
                <p style={{...styles.navDesc, color: mutedColor}}>
                  Track delivery status and manage pending shipments.
                </p>
                <span style={{...styles.navLink, color: '#F59E0B'}}>Go to Deliveries →</span>
              </div>
            </Link>
            
            <Link href="/invoices" style={{textDecoration: 'none'}}>
              <div style={{...styles.navCard, backgroundColor: cardBg, borderColor}}>
                <div style={{...styles.navIcon, backgroundColor: '#EF444420', color: '#EF4444'}}>📄</div>
                <h3 style={{...styles.navTitle, color: textColor}}>Invoices</h3>
                <p style={{...styles.navDesc, color: mutedColor}}>
                  View and manage invoices. Track paid and unpaid invoices.
                </p>
                <span style={{...styles.navLink, color: '#EF4444'}}>Go to Invoices →</span>
              </div>
            </Link>
            
            <Link href="/receivables" style={{textDecoration: 'none'}}>
              <div style={{...styles.navCard, backgroundColor: cardBg, borderColor}}>
                <div style={{...styles.navIcon, backgroundColor: '#10B98120', color: '#10B981'}}>💰</div>
                <h3 style={{...styles.navTitle, color: textColor}}>Receivables</h3>
                <p style={{...styles.navDesc, color: mutedColor}}>
                  Manage accounts receivable and track payments.
                </p>
                <span style={{...styles.navLink, color: '#10B981'}}>Go to Receivables →</span>
              </div>
            </Link>
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
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'stretch' : 'center',
    gap: '12px',
  },
  headerCenter: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: isMobile ? 'none' : 1,
    justifyContent: isMobile ? 'center' : 'center',
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
    justifyContent: isMobile ? 'center' : 'flex-end',
    gap: '6px',
    flexWrap: 'wrap',
  },
  headerLabel: {
    fontSize: '0.625rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  themeBtnCompact: {
    padding: '6px 10px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  headerBtnCompact: {
    padding: '4px 8px',
    color: 'white',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '0.7rem',
    whiteSpace: 'nowrap',
  },
  headerControlCompact: {
    display: 'flex',
    alignItems: 'center',
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
  welcomeCard: {
    border: '1px solid',
    borderRadius: '16px',
    padding: '32px',
    marginBottom: '24px',
    textAlign: 'center',
  },
  welcomeTitle: {
    margin: '0 0 8px 0',
    fontSize: '1.75rem',
    fontWeight: 700,
  },
  welcomeSubtitle: {
    margin: 0,
    fontSize: '1rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    border: '1px solid',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
  },
  statIcon: {
    fontSize: '2rem',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '1.75rem',
    fontWeight: 700,
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  navGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
  },
  navCard: {
    border: '1px solid',
    borderRadius: '16px',
    padding: '24px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  navIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    marginBottom: '16px',
  },
  navTitle: {
    margin: '0 0 8px 0',
    fontSize: '1.25rem',
    fontWeight: 600,
  },
  navDesc: {
    margin: '0 0 16px 0',
    fontSize: '0.9rem',
    lineHeight: 1.5,
    flex: 1,
  },
  navLink: {
    fontSize: '0.875rem',
    fontWeight: 600,
  },
}