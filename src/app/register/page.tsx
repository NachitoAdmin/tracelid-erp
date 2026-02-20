'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    companyName: '',
    country: 'US',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)

    try {
      // Step 1: Create Tenant
      const tenantResponse = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.companyName,
          country: formData.country,
          password: formData.password,
        }),
      })

      if (!tenantResponse.ok) {
        const data = await tenantResponse.json()
        throw new Error(data.error || 'Failed to create tenant')
      }

      const tenantData = await tenantResponse.json()
      const tenant = tenantData.tenant

      // Step 2: Create Admin User
      const userResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          tenantId: tenant.id,
        }),
      })

      const userData = await userResponse.json()

      if (!userResponse.ok) {
        throw new Error(userData.error || 'Failed to create user account')
      }

      // Step 3: Auto-login
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      if (!loginResponse.ok) {
        const loginData = await loginResponse.json()
        throw new Error(loginData.error || 'Auto-login failed')
      }

      const loginData = await loginResponse.json()

      // Store user data
      localStorage.setItem('tracelid-user', JSON.stringify(loginData.user))
      localStorage.setItem('tracelid-selected-tenant', loginData.user.tenant.id)
      localStorage.setItem('tracelid-selected-tenant-name', loginData.user.tenant.name)

      setSuccess(true)
      
      // Immediate redirect after a brief delay to show success
      setTimeout(() => {
        router.push('/')
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>🎉</div>
          <h2>Welcome to Tracelid!</h2>
          <p><strong>{formData.companyName}</strong> is ready.</p>
          <p>Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <Link href="/" style={styles.backLink}>← Back</Link>
          <h1 style={styles.title}>🚀 Create Account</h1>
        </div>

        {error && <div style={styles.error}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.row}>
            <div style={{...styles.field, flex: 2}}>
              <label style={styles.label}>Company *</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                style={styles.input}
                placeholder="Company name"
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Country *</label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                style={styles.input}
                required
              >
                <option value="US">🇺🇸 US</option>
                <option value="GB">🇬🇧 UK</option>
                <option value="DE">🇩🇪 DE</option>
                <option value="FR">🇫🇷 FR</option>
                <option value="ES">🇪🇸 ES</option>
                <option value="NL">🇳🇱 NL</option>
                <option value="MX">🇲🇽 MX</option>
                <option value="CA">🇨🇦 CA</option>
              </select>
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                style={styles.input}
                placeholder="First"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                style={styles.input}
                placeholder="Last"
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={styles.input}
              placeholder="you@company.com"
              required
            />
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={styles.input}
                placeholder="Min 6 chars"
                required
                minLength={6}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Confirm *</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                style={styles.input}
                placeholder="Confirm"
                required
              />
            </div>
          </div>

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <div style={styles.footer}>
          Have an account? <Link href="/login" style={styles.link}>Sign in</Link>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '15px',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    boxSizing: 'border-box',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '30px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    boxSizing: 'border-box',
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '50px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  successIcon: {
    fontSize: '4rem',
    marginBottom: '15px',
  },
  header: {
    marginBottom: '20px',
  },
  backLink: {
    color: '#667eea',
    textDecoration: 'none',
    fontSize: '0.9rem',
    display: 'inline-block',
    marginBottom: '10px',
  },
  title: {
    margin: 0,
    fontSize: '1.6rem',
    color: '#1f2937',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    boxSizing: 'border-box',
  },
  error: {
    padding: '10px 14px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '8px',
    marginBottom: '10px',
    fontSize: '0.9rem',
    width: '100%',
    boxSizing: 'border-box',
  },
  row: {
    display: 'flex',
    gap: '12px',
    width: '100%',
    boxSizing: 'border-box',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    boxSizing: 'border-box',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: '100%',
  },
  submitBtn: {
    padding: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
    width: '100%',
    boxSizing: 'border-box',
  },
  footer: {
    marginTop: '18px',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '0.9rem',
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: 600,
  },
}
