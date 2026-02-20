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
  const [createdUser, setCreatedUser] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
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

      // Step 2: Create Admin User for the tenant
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

      if (!userResponse.ok) {
        const data = await userResponse.json()
        throw new Error(data.error || 'Failed to create user account')
      }

      const userData = await userResponse.json()

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
        const data = await loginResponse.json()
        throw new Error(data.error || 'Auto-login failed')
      }

      const loginData = await loginResponse.json()

      // Store user data
      localStorage.setItem('tracelid-user', JSON.stringify(loginData.user))
      localStorage.setItem('tracelid-selected-tenant', loginData.user.tenant.id)
      localStorage.setItem('tracelid-selected-tenant-name', loginData.user.tenant.name)

      setCreatedUser(loginData.user)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Auto-redirect to dashboard after successful registration
  useEffect(() => {
    if (success && createdUser) {
      const timer = setTimeout(() => {
        router.push('/')
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [success, createdUser, router])

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>🎉</div>
          <h2>Welcome to Tracelid!</h2>
          <p><strong>{formData.companyName}</strong> has been created.</p>
          <p>Your admin account <strong>{formData.email}</strong> is ready.</p>
          <p style={{marginTop: '20px'}}>Redirecting you to the dashboard...</p>
          
          <Link href="/" style={styles.button}>
            Go to Dashboard →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <Link href="/" style={styles.backLink}>← Back</Link>
          <h1 style={styles.title}>🚀 Create Your Account</h1>
          <p style={styles.subtitle}>Set up your company and admin account in one step</p>
        </div>

        {error && <div style={styles.error}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🏢 Company Information</h3>
            
            <div style={styles.field}>
              <label style={styles.label}>Company Name *</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                style={styles.input}
                placeholder="Enter your company name"
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
                <option value="US">🇺🇸 United States</option>
                <option value="GB">🇬🇧 United Kingdom</option>
                <option value="DE">🇩🇪 Germany</option>
                <option value="FR">🇫🇷 France</option>
                <option value="ES">🇪🇸 Spain</option>
                <option value="NL">🇳🇱 Netherlands</option>
                <option value="MX">🇲🇽 Mexico</option>
                <option value="CA">🇨🇦 Canada</option>
                <option value="AU">🇦🇺 Australia</option>
                <option value="JP">🇯🇵 Japan</option>
              </select>
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>👤 Admin Account</h3>
            
            <div style={styles.row}>
              <div style={{...styles.field, flex: 1}}>
                <label style={styles.label}>First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  style={styles.input}
                  placeholder="First name"
                />
              </div>
              <div style={{...styles.field, flex: 1}}>
                <label style={styles.label}>Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  style={styles.input}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={styles.input}
                placeholder="you@company.com"
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={styles.input}
                placeholder="Create a secure password"
                required
                minLength={6}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Confirm Password *</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                style={styles.input}
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={styles.footer}>
          Already have an account?{' '}
          <Link href="/login" style={styles.link}>Sign in</Link>
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
    padding: '20px',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '24px',
    padding: '40px',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: '24px',
    padding: '50px',
    width: '100%',
    maxWidth: '450px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    textAlign: 'center',
  },
  successIcon: {
    fontSize: '4rem',
    marginBottom: '20px',
  },
  header: {
    marginBottom: '30px',
  },
  backLink: {
    color: '#667eea',
    textDecoration: 'none',
    fontSize: '0.95rem',
    display: 'inline-block',
    marginBottom: '15px',
  },
  title: {
    margin: 0,
    fontSize: '1.8rem',
    color: '#1f2937',
  },
  subtitle: {
    margin: '10px 0 0 0',
    color: '#6b7280',
    fontSize: '0.95rem',
  },
  section: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
  },
  sectionTitle: {
    margin: '0 0 15px 0',
    fontSize: '1rem',
    color: '#374151',
    fontWeight: 600,
  },
  error: {
    padding: '14px 18px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '12px',
    marginBottom: '20px',
    fontSize: '0.95rem',
  },
  field: {
    marginBottom: '16px',
  },
  row: {
    display: 'flex',
    gap: '12px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: 600,
    color: '#374151',
    fontSize: '0.9rem',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '2px solid #e5e7eb',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  submitBtn: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1.1rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '10px',
  },
  footer: {
    marginTop: '25px',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '0.95rem',
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: 600,
  },
  button: {
    display: 'inline-block',
    marginTop: '25px',
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    borderRadius: '12px',
    textDecoration: 'none',
    fontWeight: 600,
  },
}
