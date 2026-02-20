'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

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

export default function MasterDataPage() {
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<'customers' | 'products' | 'costs'>('customers')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const userData = localStorage.getItem('tracelid-user')
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (e) {
        console.error('Failed to parse user data')
      }
    }
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage('')

    // TODO: Implement actual upload logic
    setTimeout(() => {
      setMessage(`✅ ${type} data uploaded successfully!`)
      setUploading(false)
    }, 1500)
  }

  const downloadTemplate = (type: string) => {
    const templates: Record<string, string> = {
      customers: 'Name,Email,Phone,Address,City,Country,CustomerID\nAcme Corp,contact@acme.com,+1234567890,123 Main St,New York,US,CUST001',
      products: 'SKU,Name,Description,Category,UnitPrice,Currency\nPROD001,Widget Pro,Professional widget,Electronics,99.99,USD',
      costs: 'Type,Name,Value,Currency,EffectiveDate\nREBATE,Volume Discount,10,%,2024-01-01',
    }

    const blob = new Blob([templates[type]], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}_template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'owner'

  if (!isAdmin) {
    return (
      <div style={styles.container}>
        <div style={styles.unauthorized}>
          <h1>⛔ Access Denied</h1>
          <p>You need Admin or Owner permissions to access this page.</p>
          <Link href="/" style={styles.backLink}>← Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1>📊 Master Data Management</h1>
          <div style={styles.userInfo}>
            {user && (
              <span style={styles.roleBadge}>
                {user.role.toUpperCase()}: {user.firstName} {user.lastName}
              </span>
            )}
            <Link href="/" style={styles.backLink}>← Back to Dashboard</Link>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab('customers')}
            style={{
              ...styles.tab,
              ...(activeTab === 'customers' ? styles.tabActive : {}),
            }}
          >
            👥 Customers
          </button>
          <button
            onClick={() => setActiveTab('products')}
            style={{
              ...styles.tab,
              ...(activeTab === 'products' ? styles.tabActive : {}),
            }}
          >
            📦 Products
          </button>
          <button
            onClick={() => setActiveTab('costs')}
            style={{
              ...styles.tab,
              ...(activeTab === 'costs' ? styles.tabActive : {}),
            }}
          >
            💰 Costs/Rebates/Discounts
          </button>
        </div>

        {message && <div style={styles.message}>{message}</div>}

        {activeTab === 'customers' && (
          <div style={styles.section}>
            <h2>👥 Customer Management</h2>
            <p>Upload customer data via CSV or Excel file.</p>
            
            <div style={styles.uploadBox}>
              <h3>Upload Customers</h3>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleFileUpload(e, 'Customers')}
                disabled={uploading}
                style={styles.fileInput}
              />
              <button
                onClick={() => downloadTemplate('customers')}
                style={styles.templateBtn}
              >
                📥 Download Template
              </button>
            </div>

            <div style={styles.infoBox}>
              <h4>Required Fields:</h4>
              <ul>
                <li><strong>Name</strong> - Customer/Company name</li>
                <li><strong>Email</strong> - Contact email</li>
                <li><strong>Phone</strong> - Contact phone</li>
                <li><strong>Address</strong> - Street address</li>
                <li><strong>City</strong> - City name</li>
                <li><strong>Country</strong> - Country code (US, UK, etc.)</li>
                <li><strong>CustomerID</strong> - Unique identifier</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div style={styles.section}>
            <h2>📦 Product Management</h2>
            <p>Upload product catalog via CSV or Excel file.</p>
            
            <div style={styles.uploadBox}>
              <h3>Upload Products</h3>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleFileUpload(e, 'Products')}
                disabled={uploading}
                style={styles.fileInput}
              />
              <button
                onClick={() => downloadTemplate('products')}
                style={styles.templateBtn}
              >
                📥 Download Template
              </button>
            </div>

            <div style={styles.infoBox}>
              <h4>Required Fields:</h4>
              <ul>
                <li><strong>SKU</strong> - Stock Keeping Unit</li>
                <li><strong>Name</strong> - Product name</li>
                <li><strong>Description</strong> - Product description</li>
                <li><strong>Category</strong> - Product category</li>
                <li><strong>UnitPrice</strong> - Price per unit</li>
                <li><strong>Currency</strong> - Price currency (USD, EUR, etc.)</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'costs' && (
          <div style={styles.section}>
            <h2>💰 Costs, Rebates & Discounts</h2>
            <p>Upload cost structures, rebate programs, and discount rules.</p>
            
            <div style={styles.uploadBox}>
              <h3>Upload Costs/Rebates/Discounts</h3>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleFileUpload(e, 'Costs')}
                disabled={uploading}
                style={styles.fileInput}
              />
              <button
                onClick={() => downloadTemplate('costs')}
                style={styles.templateBtn}
              >
                📥 Download Template
              </button>
            </div>

            <div style={styles.infoBox}>
              <h4>Required Fields:</h4>
              <ul>
                <li><strong>Type</strong> - REBATE, DISCOUNT, or COST</li>
                <li><strong>Name</strong> - Program name</li>
                <li><strong>Value</strong> - Amount or percentage</li>
                <li><strong>Currency</strong> - % for percentage, or currency code</li>
                <li><strong>EffectiveDate</strong> - YYYY-MM-DD format</li>
              </ul>
            </div>
          </div>
        )}

        <div style={styles.googleSheetsSection}>
          <h3>🔗 Google Sheets Integration (Coming Soon)</h3>
          <p>Sync your master data directly from Google Sheets.</p>
          <button disabled style={styles.disabledBtn}>
            Connect Google Sheets
          </button>
        </div>
      </main>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  header: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: '20px 40px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  roleBadge: {
    padding: '6px 12px',
    backgroundColor: '#10B981',
    color: 'white',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 600,
  },
  backLink: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: 600,
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: '10px',
    borderRadius: '12px',
  },
  tab: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: 'white',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabActive: {
    backgroundColor: 'white',
    color: '#667eea',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '30px',
    marginBottom: '30px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  },
  uploadBox: {
    border: '2px dashed #E5E7EB',
    borderRadius: '12px',
    padding: '30px',
    textAlign: 'center',
    marginBottom: '20px',
  },
  fileInput: {
    marginBottom: '15px',
  },
  templateBtn: {
    padding: '10px 20px',
    backgroundColor: '#F3F4F6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  infoBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    padding: '20px',
  },
  message: {
    padding: '15px 20px',
    backgroundColor: '#D1FAE5',
    color: '#065F46',
    borderRadius: '8px',
    marginBottom: '20px',
    fontWeight: 600,
  },
  googleSheetsSection: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '30px',
    textAlign: 'center',
    color: 'white',
  },
  disabledBtn: {
    padding: '12px 24px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: 'rgba(255,255,255,0.5)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'not-allowed',
  },
  unauthorized: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '50px',
    textAlign: 'center',
    maxWidth: '500px',
    margin: '100px auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
}
