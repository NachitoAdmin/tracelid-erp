'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTheme } from '@/lib/ThemeContext'

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

interface ParsedData {
  headers: string[]
  rows: string[][]
}

export default function MasterDataPage() {
  const buildTime = '20260226-v2'
  const { isDark } = useTheme();
  const bgColor = isDark ? '#111827' : '#F1F5F9';
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const textColor = isDark ? '#F9FAFB' : '#1F2937';
  const borderColor = isDark ? '#374151' : '#E5E7EB';
  const inputBg = isDark ? '#374151' : '#F9FAFB';
  const mutedColor = isDark ? '#9CA3AF' : '#6B7280';

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'customers' | 'products' | 'costs' | 'rebates' | 'discounts'>('customers')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [fileName, setFileName] = useState('')
  
  // Manual customer entry form state
  const [manualCustomer, setManualCustomer] = useState({
    customer_code: '',
    name: '',
    country: '',
    email: '',
  })
  const [manualSubmitting, setManualSubmitting] = useState(false)

  // Manual product entry form state
  const [manualProduct, setManualProduct] = useState({
    product_code: '',
    name: '',
    uom: '',
    sales_price: '',
    standard_cost: '',
  })
  const [manualProductSubmitting, setManualProductSubmitting] = useState(false)

  // Manual cost entry form state
  const [manualCost, setManualCost] = useState({
    product_id: '',
    cost_amount: '',
    date: '',
  })
  const [manualCostSubmitting, setManualCostSubmitting] = useState(false)

  // Manual rebate entry form state
  const [manualRebate, setManualRebate] = useState({
    customer_id: '',
    product_id: '',
    rebate_amount: '',
    quantity_target: '',
    quantity_unit: '',
    valid_from: '',
    valid_to: '',
  })
  const [manualRebateSubmitting, setManualRebateSubmitting] = useState(false)

  // Manual discount entry form state
  const [manualDiscount, setManualDiscount] = useState({
    customer_id: '',
    product_id: '',
    discount_amount: '',
    quantity_target: '',
    quantity_unit: '',
    valid_from: '',
    valid_to: '',
  })
  const [manualDiscountSubmitting, setManualDiscountSubmitting] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('tracelid-user')
    console.log('Master Data - localStorage user:', userData)
    if (userData) {
      try {
        const parsed = JSON.parse(userData)
        console.log('Master Data - parsed user:', parsed)
        setUser(parsed)
      } catch (e) {
        console.error('Failed to parse user data')
      }
    }
    setLoading(false)
  }, [])

  const downloadTemplate = (type: string) => {
    const templates: Record<string, string> = {
      customers: 'customer_id,customer_name,email,phone,address\nCUST001,Acme Corp,contact@acme.com,+1234567890,123 Main St\nCUST002,Global Inc,info@global.com,+0987654321,456 Oak Ave',
      products: 'product_id,product_name,price,uom,cost\nPROD001,Widget Pro,99.99,PCS,50.00\nPROD002,Super Gadget,149.99,BOX,75.00',
      costs: 'product_id,cost_amount,date\nPROD001,45.50,2024-01-15\nPROD002,67.25,2024-01-15',
      rebates: 'customer_id,product_id,rebate_amount,quantity_target,quantity_unit,valid_from,valid_to\nCUST001,PROD001,5.00,100,PCS,2024-01-01,2024-12-31\nCUST002,PROD002,3.50,50,BOX,2024-02-01,2024-06-30',
      discounts: 'customer_id,product_id,discount_amount,quantity_target,quantity_unit,valid_from,valid_to\nCUST001,PROD001,10.00,200,PCS,2024-01-01,2024-12-31\nCUST002,PROD002,15.00,100,BOX,2024-03-01,2024-09-30',
    }

    const blob = new Blob([templates[type]], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}_template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const parseCSV = (content: string): ParsedData => {
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length === 0) return { headers: [], rows: [] }
    
    const headers = lines[0].split(',').map(h => h.trim())
    const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()))
    
    return { headers, rows }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setMessage('')
    setParsedData(null)

    try {
      const content = await file.text()
      const data = parseCSV(content)
      setParsedData(data)
      setMessage(`✅ Parsed ${data.rows.length} rows from ${file.name}`)
    } catch (err) {
      setMessage('❌ Error parsing file: ' + (err as Error).message)
    }
  }

  const handleSave = async () => {
    if (!parsedData || !user?.tenant?.id) {
      setMessage('❌ No data to save or no tenant selected')
      return
    }

    setUploading(true)
    setMessage('')

    try {
      const response = await fetch('/api/master-data/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: activeTab,
          tenantId: user.tenant.id,
          data: parsedData,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Upload failed')
      }

      setMessage(`✅ Successfully saved ${result.count} records!`)
      setParsedData(null)
      setFileName('')
    } catch (err: any) {
      setMessage('❌ Error saving: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.tenant?.id) {
      setMessage('❌ No tenant selected')
      return
    }
    if (!manualCustomer.customer_code || !manualCustomer.name) {
      setMessage('❌ Customer Code and Name are required')
      return
    }

    setManualSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_code: manualCustomer.customer_code,
          name: manualCustomer.name,
          country: manualCustomer.country,
          email: manualCustomer.email,
          tenant_id: user.tenant.id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to add customer')
      }

      setMessage(`✅ Customer "${manualCustomer.name}" added successfully!`)
      setManualCustomer({ customer_code: '', name: '', country: '', email: '' })
    } catch (err: any) {
      setMessage('❌ Error adding customer: ' + err.message)
    } finally {
      setManualSubmitting(false)
    }
  }

  // Manual product submit handler
  const handleManualProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.tenant?.id) {
      setMessage('❌ No tenant selected')
      return
    }
    if (!manualProduct.product_code || !manualProduct.name) {
      setMessage('❌ Product Code and Name are required')
      return
    }

    setManualProductSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_code: manualProduct.product_code,
          name: manualProduct.name,
          uom: manualProduct.uom,
          sales_price: parseFloat(manualProduct.sales_price) || 0,
          standard_cost: parseFloat(manualProduct.standard_cost) || 0,
          tenant_id: user.tenant.id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to add product')
      }

      setMessage(`✅ Product "${manualProduct.name}" added successfully!`)
      setManualProduct({ product_code: '', name: '', uom: '', sales_price: '', standard_cost: '' })
    } catch (err: any) {
      setMessage('❌ Error adding product: ' + err.message)
    } finally {
      setManualProductSubmitting(false)
    }
  }

  // Manual cost submit handler
  const handleManualCostSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.tenant?.id) {
      setMessage('❌ No tenant selected')
      return
    }
    if (!manualCost.product_id || !manualCost.cost_amount || !manualCost.date) {
      setMessage('❌ Product ID, Cost Amount, and Date are required')
      return
    }

    setManualCostSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/master-data/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'costs',
          tenantId: user.tenant.id,
          data: {
            headers: ['product_id', 'cost_amount', 'date'],
            rows: [[manualCost.product_id, manualCost.cost_amount, manualCost.date]],
          },
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to add cost')
      }

      setMessage(`✅ Cost entry added successfully!`)
      setManualCost({ product_id: '', cost_amount: '', date: '' })
    } catch (err: any) {
      setMessage('❌ Error adding cost: ' + err.message)
    } finally {
      setManualCostSubmitting(false)
    }
  }

  // Manual rebate submit handler
  const handleManualRebateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.tenant?.id) {
      setMessage('❌ No tenant selected')
      return
    }
    if (!manualRebate.customer_id || !manualRebate.product_id) {
      setMessage('❌ Customer ID and Product ID are required')
      return
    }

    setManualRebateSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/master-data/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'rebates',
          tenantId: user.tenant.id,
          data: {
            headers: ['customer_id', 'product_id', 'rebate_amount', 'quantity_target', 'quantity_unit', 'valid_from', 'valid_to'],
            rows: [[
              manualRebate.customer_id,
              manualRebate.product_id,
              manualRebate.rebate_amount,
              manualRebate.quantity_target,
              manualRebate.quantity_unit,
              manualRebate.valid_from,
              manualRebate.valid_to,
            ]],
          },
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to add rebate')
      }

      setMessage(`✅ Rebate entry added successfully!`)
      setManualRebate({ customer_id: '', product_id: '', rebate_amount: '', quantity_target: '', quantity_unit: '', valid_from: '', valid_to: '' })
    } catch (err: any) {
      setMessage('❌ Error adding rebate: ' + err.message)
    } finally {
      setManualRebateSubmitting(false)
    }
  }

  // Manual discount submit handler
  const handleManualDiscountSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.tenant?.id) {
      setMessage('❌ No tenant selected')
      return
    }
    if (!manualDiscount.customer_id || !manualDiscount.product_id) {
      setMessage('❌ Customer ID and Product ID are required')
      return
    }

    setManualDiscountSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/master-data/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'discounts',
          tenantId: user.tenant.id,
          data: {
            headers: ['customer_id', 'product_id', 'discount_amount', 'quantity_target', 'quantity_unit', 'valid_from', 'valid_to'],
            rows: [[
              manualDiscount.customer_id,
              manualDiscount.product_id,
              manualDiscount.discount_amount,
              manualDiscount.quantity_target,
              manualDiscount.quantity_unit,
              manualDiscount.valid_from,
              manualDiscount.valid_to,
            ]],
          },
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to add discount')
      }

      setMessage(`✅ Discount entry added successfully!`)
      setManualDiscount({ customer_id: '', product_id: '', discount_amount: '', quantity_target: '', quantity_unit: '', valid_from: '', valid_to: '' })
    } catch (err: any) {
      setMessage('❌ Error adding discount: ' + err.message)
    } finally {
      setManualDiscountSubmitting(false)
    }
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'owner'

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <h2>Loading...</h2>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div style={styles.container}>
        <div style={styles.unauthorized}>
          <h1>⛔ Access Denied</h1>
          <p>You need Admin or Owner permissions to access this page.</p>
          <p>Your role: {user?.role || 'Not logged in'}</p>
          {!user && (
            <p>
              <Link href="/login" style={{...styles.backLink, color: '#6C5CE7'}}>
                → Go to Login
              </Link>
            </p>
          )}
          <Link href="/" style={styles.backLink}>← Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const getRequiredColumns = () => {
    switch (activeTab) {
      case 'customers':
        return 'Required: customer_id, customer_name, email, phone, address'
      case 'products':
        return 'Required: product_id, product_name, price, uom, cost'
      case 'costs':
        return 'Required: product_id, cost_amount, date'
      case 'rebates':
        return 'Required: customer_id, product_id, rebate_amount, quantity_target, quantity_unit, valid_from, valid_to'
      case 'discounts':
        return 'Required: customer_id, product_id, discount_amount, quantity_target, quantity_unit, valid_from, valid_to'
      default:
        return ''
    }
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
            onClick={() => { setActiveTab('customers'); setParsedData(null); setMessage(''); }}
            style={{...styles.tab, ...(activeTab === 'customers' ? styles.tabActive : {})}}
          >
            👥 Customers
          </button>
          <button
            onClick={() => { setActiveTab('products'); setParsedData(null); setMessage(''); }}
            style={{...styles.tab, ...(activeTab === 'products' ? styles.tabActive : {})}}
          >
            📦 Products
          </button>
          <button
            onClick={() => { setActiveTab('costs'); setParsedData(null); setMessage(''); }}
            style={{...styles.tab, ...(activeTab === 'costs' ? styles.tabActive : {})}}
          >
            💰 Costs
          </button>
          <button
            onClick={() => { setActiveTab('rebates'); setParsedData(null); setMessage(''); }}
            style={{...styles.tab, ...(activeTab === 'rebates' ? styles.tabActive : {})}}
          >
            🎁 Rebates
          </button>
          <button
            onClick={() => { setActiveTab('discounts'); setParsedData(null); setMessage(''); }}
            style={{...styles.tab, ...(activeTab === 'discounts' ? styles.tabActive : {})}}
          >
            💰 Discounts
          </button>
        </div>

        <div style={styles.section}>
          <h2>
            {activeTab === 'customers' && '👥 Customer Upload'}
            {activeTab === 'products' && '📦 Product Upload'}
            {activeTab === 'costs' && '💰 Cost Upload'}
            {activeTab === 'rebates' && '🎁 Rebates Upload'}
            {activeTab === 'discounts' && '💰 Discounts Upload'}
          </h2>
          
          <p style={styles.description}>{getRequiredColumns()}</p>

          {message && <div style={styles.message}>{message}</div>}

          <div style={styles.uploadSection}>
            <div style={styles.buttonGroup}>
              <button
                onClick={() => downloadTemplate(activeTab)}
                style={styles.templateBtn}
              >
                📥 Download Template
              </button>
              
              <label style={styles.uploadLabel}>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
                <span style={styles.uploadBtn}>📁 Upload File</span>
              </label>
            </div>

            {fileName && (
              <p style={styles.fileName}>Selected: {fileName}</p>
            )}
          </div>

          {parsedData && (
            <div style={styles.previewSection}>
              <h3>Preview ({parsedData.rows.length} rows)</h3>
              
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {parsedData.headers.map((header, i) => (
                        <th key={i} style={styles.th}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.rows.slice(0, 10).map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j} style={styles.td}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {parsedData.rows.length > 10 && (
                  <p style={styles.moreRows}>... and {parsedData.rows.length - 10} more rows</p>
                )}
              </div>

              <button
                onClick={handleSave}
                disabled={uploading}
                style={styles.saveBtn}
              >
                {uploading ? '💾 Saving...' : '💾 Save to Database'}
              </button>
            </div>
          )}

          {/* Manual Customer Entry Form - Only show for customers tab */}
          {activeTab === 'customers' && (
            <div style={styles.manualEntrySection}>
              <h3 style={styles.manualEntryTitle}>➕ Add Customer Manually</h3>
              <form onSubmit={handleManualSubmit} style={styles.manualForm}>
                <div style={styles.formRow}>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Customer Code *</label>
                    <input
                      type="text"
                      value={manualCustomer.customer_code}
                      onChange={(e) => setManualCustomer({ ...manualCustomer, customer_code: e.target.value })}
                      placeholder="e.g., CUST001"
                      style={styles.formInput}
                      required
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Name *</label>
                    <input
                      type="text"
                      value={manualCustomer.name}
                      onChange={(e) => setManualCustomer({ ...manualCustomer, name: e.target.value })}
                      placeholder="e.g., Acme Corp"
                      style={styles.formInput}
                      required
                    />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Country</label>
                    <input
                      type="text"
                      value={manualCustomer.country}
                      onChange={(e) => setManualCustomer({ ...manualCustomer, country: e.target.value })}
                      placeholder="e.g., USA"
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Email</label>
                    <input
                      type="email"
                      value={manualCustomer.email}
                      onChange={(e) => setManualCustomer({ ...manualCustomer, email: e.target.value })}
                      placeholder="e.g., contact@acme.com"
                      style={styles.formInput}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={manualSubmitting}
                  style={styles.addCustomerBtn}
                >
                  {manualSubmitting ? '➕ Adding...' : '➕ Add Customer'}
                </button>
              </form>
            </div>
          )}

          {/* Manual Product Entry Form - Only show for products tab */}
          {activeTab === 'products' && (
            <div style={styles.manualEntrySection}>
              <h3 style={styles.manualEntryTitle}>➕ Add Product Manually</h3>
              <form onSubmit={handleManualProductSubmit} style={styles.manualForm}>
                <div style={styles.formRow}>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Product Code *</label>
                    <input
                      type="text"
                      value={manualProduct.product_code}
                      onChange={(e) => setManualProduct({ ...manualProduct, product_code: e.target.value })}
                      placeholder="e.g., PROD001"
                      style={styles.formInput}
                      required
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Name *</label>
                    <input
                      type="text"
                      value={manualProduct.name}
                      onChange={(e) => setManualProduct({ ...manualProduct, name: e.target.value })}
                      placeholder="e.g., Widget Pro"
                      style={styles.formInput}
                      required
                    />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>UOM</label>
                    <input
                      type="text"
                      value={manualProduct.uom}
                      onChange={(e) => setManualProduct({ ...manualProduct, uom: e.target.value })}
                      placeholder="e.g., PCS"
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Sales Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={manualProduct.sales_price}
                      onChange={(e) => setManualProduct({ ...manualProduct, sales_price: e.target.value })}
                      placeholder="e.g., 99.99"
                      style={styles.formInput}
                    />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Standard Cost</label>
                    <input
                      type="number"
                      step="0.01"
                      value={manualProduct.standard_cost}
                      onChange={(e) => setManualProduct({ ...manualProduct, standard_cost: e.target.value })}
                      placeholder="e.g., 50.00"
                      style={styles.formInput}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={manualProductSubmitting}
                  style={styles.addCustomerBtn}
                >
                  {manualProductSubmitting ? '➕ Adding...' : '➕ Add Product'}
                </button>
              </form>
            </div>
          )}

          {/* Manual Cost Entry Form - Only show for costs tab */}
          {activeTab === 'costs' && (
            <div style={styles.manualEntrySection}>
              <h3 style={styles.manualEntryTitle}>➕ Add Cost Entry Manually</h3>
              <form onSubmit={handleManualCostSubmit} style={styles.manualForm}>
                <div style={styles.formRow}>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Product ID *</label>
                    <input
                      type="text"
                      value={manualCost.product_id}
                      onChange={(e) => setManualCost({ ...manualCost, product_id: e.target.value })}
                      placeholder="e.g., PROD001"
                      style={styles.formInput}
                      required
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Cost Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={manualCost.cost_amount}
                      onChange={(e) => setManualCost({ ...manualCost, cost_amount: e.target.value })}
                      placeholder="e.g., 45.50"
                      style={styles.formInput}
                      required
                    />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Date *</label>
                    <input
                      type="date"
                      value={manualCost.date}
                      onChange={(e) => setManualCost({ ...manualCost, date: e.target.value })}
                      style={styles.formInput}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={manualCostSubmitting}
                  style={styles.addCustomerBtn}
                >
                  {manualCostSubmitting ? '➕ Adding...' : '➕ Add Cost Entry'}
                </button>
              </form>
            </div>
          )}

          {/* Manual Rebate Entry Form - Only show for rebates tab */}
          {activeTab === 'rebates' && (
            <div style={styles.manualEntrySection}>
              <h3 style={styles.manualEntryTitle}>➕ Add Rebate Entry Manually</h3>
              <form onSubmit={handleManualRebateSubmit} style={styles.manualForm}>
                <div style={styles.formRow}>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Customer ID *</label>
                    <input
                      type="text"
                      value={manualRebate.customer_id}
                      onChange={(e) => setManualRebate({ ...manualRebate, customer_id: e.target.value })}
                      placeholder="e.g., CUST001"
                      style={styles.formInput}
                      required
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Product ID *</label>
                    <input
                      type="text"
                      value={manualRebate.product_id}
                      onChange={(e) => setManualRebate({ ...manualRebate, product_id: e.target.value })}
                      placeholder="e.g., PROD001"
                      style={styles.formInput}
                      required
                    />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Rebate Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={manualRebate.rebate_amount}
                      onChange={(e) => setManualRebate({ ...manualRebate, rebate_amount: e.target.value })}
                      placeholder="e.g., 5.00"
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Quantity Target</label>
                    <input
                      type="number"
                      step="0.01"
                      value={manualRebate.quantity_target}
                      onChange={(e) => setManualRebate({ ...manualRebate, quantity_target: e.target.value })}
                      placeholder="e.g., 100"
                      style={styles.formInput}
                    />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Quantity Unit</label>
                    <input
                      type="text"
                      value={manualRebate.quantity_unit}
                      onChange={(e) => setManualRebate({ ...manualRebate, quantity_unit: e.target.value })}
                      placeholder="e.g., PCS"
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Valid From</label>
                    <input
                      type="date"
                      value={manualRebate.valid_from}
                      onChange={(e) => setManualRebate({ ...manualRebate, valid_from: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Valid To</label>
                    <input
                      type="date"
                      value={manualRebate.valid_to}
                      onChange={(e) => setManualRebate({ ...manualRebate, valid_to: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={manualRebateSubmitting}
                  style={styles.addCustomerBtn}
                >
                  {manualRebateSubmitting ? '➕ Adding...' : '➕ Add Rebate Entry'}
                </button>
              </form>
            </div>
          )}

          {/* Manual Discount Entry Form - Only show for discounts tab */}
          {activeTab === 'discounts' && (
            <div style={styles.manualEntrySection}>
              <h3 style={styles.manualEntryTitle}>➕ Add Discount Entry Manually</h3>
              <form onSubmit={handleManualDiscountSubmit} style={styles.manualForm}>
                <div style={styles.formRow}>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Customer ID *</label>
                    <input
                      type="text"
                      value={manualDiscount.customer_id}
                      onChange={(e) => setManualDiscount({ ...manualDiscount, customer_id: e.target.value })}
                      placeholder="e.g., CUST001"
                      style={styles.formInput}
                      required
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Product ID *</label>
                    <input
                      type="text"
                      value={manualDiscount.product_id}
                      onChange={(e) => setManualDiscount({ ...manualDiscount, product_id: e.target.value })}
                      placeholder="e.g., PROD001"
                      style={styles.formInput}
                      required
                    />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Discount Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={manualDiscount.discount_amount}
                      onChange={(e) => setManualDiscount({ ...manualDiscount, discount_amount: e.target.value })}
                      placeholder="e.g., 10.00"
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Quantity Target</label>
                    <input
                      type="number"
                      step="0.01"
                      value={manualDiscount.quantity_target}
                      onChange={(e) => setManualDiscount({ ...manualDiscount, quantity_target: e.target.value })}
                      placeholder="e.g., 200"
                      style={styles.formInput}
                    />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Quantity Unit</label>
                    <input
                      type="text"
                      value={manualDiscount.quantity_unit}
                      onChange={(e) => setManualDiscount({ ...manualDiscount, quantity_unit: e.target.value })}
                      placeholder="e.g., PCS"
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Valid From</label>
                    <input
                      type="date"
                      value={manualDiscount.valid_from}
                      onChange={(e) => setManualDiscount({ ...manualDiscount, valid_from: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Valid To</label>
                    <input
                      type="date"
                      value={manualDiscount.valid_to}
                      onChange={(e) => setManualDiscount({ ...manualDiscount, valid_to: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={manualDiscountSubmitting}
                  style={styles.addCustomerBtn}
                >
                  {manualDiscountSubmitting ? '➕ Adding...' : '➕ Add Discount Entry'}
                </button>
              </form>
            </div>
          )}
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
    backgroundColor: '#FFFFFF', borderRadius: '16px',
    padding: '30px',
    marginBottom: '30px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  },
  description: {
    color: '#6B7280',
    fontSize: '0.9rem',
    marginBottom: '20px',
  },
  uploadSection: {
    marginBottom: '30px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '15px',
    marginBottom: '15px',
  },
  templateBtn: {
    padding: '12px 24px',
    backgroundColor: '#F3F4F6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.95rem',
  },
  uploadLabel: {
    cursor: 'pointer',
  },
  uploadBtn: {
    display: 'inline-block',
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.95rem',
  },
  fileName: {
    color: '#6B7280',
    fontSize: '0.9rem',
  },
  message: {
    padding: '15px 20px',
    backgroundColor: '#D1FAE5',
    color: '#065F46',
    borderRadius: '8px',
    marginBottom: '20px',
    fontWeight: 600,
  },
  previewSection: {
    marginTop: '30px',
  },
  tableContainer: {
    overflowX: 'auto',
    marginBottom: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    backgroundColor: '#F9FAFB',
    borderBottom: '2px solid #E5E7EB',
    fontWeight: 600,
    color: '#374151',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #E5E7EB',
    color: '#6B7280',
  },
  moreRows: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontStyle: 'italic',
    padding: '10px',
  },
  saveBtn: {
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  unauthorized: {
    backgroundColor: '#FFFFFF', borderRadius: '16px',
    padding: '50px',
    textAlign: 'center',
    maxWidth: '500px',
    margin: '100px auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  loading: {
    backgroundColor: '#FFFFFF', borderRadius: '16px',
    padding: '50px',
    textAlign: 'center',
    maxWidth: '500px',
    margin: '100px auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  manualEntrySection: {
    marginTop: '40px',
    paddingTop: '30px',
    borderTop: '2px solid #E5E7EB',
  },
  manualEntryTitle: {
    color: '#374151',
    fontSize: '1.1rem',
    marginBottom: '20px',
    fontWeight: 600,
  },
  manualForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formRow: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap' as const,
  },
  formField: {
    flex: '1',
    minWidth: '200px',
  },
  formLabel: {
    display: 'block',
    color: '#374151',
    fontSize: '0.9rem',
    fontWeight: 600,
    marginBottom: '6px',
  },
  formInput: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '0.95rem',
    color: '#374151',
    backgroundColor: 'white',
    boxSizing: 'border-box' as const,
  },
  addCustomerBtn: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
}
