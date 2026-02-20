'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    country: 'US',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [createdTenant, setCreatedTenant] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 4) {
      setError('Password must be at least 4 characters')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          country: formData.country,
          password: formData.password,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create tenant')
      }

      const data = await response.json()
      
      // Store tenant info for auto-login
      setCreatedTenant(data.tenant || data)
      
      // Auto-login: Save tenant to localStorage
      if (data.tenant) {
        localStorage.setItem('tracelid-selected-tenant', data.tenant.id)
        localStorage.setItem('tracelid-selected-tenant-name', data.tenant.name)
        
        // If tenant has a password, mark it as authenticated
        if (data.tenant.password) {
          const authenticatedTenants = new Set(JSON.parse(localStorage.getItem('tracelid-authenticated-tenants') || '[]'))
          authenticatedTenants.add(data.tenant.id)
          localStorage.setItem('tracelid-authenticated-tenants', JSON.stringify([...authenticatedTenants]))
        }
      }
      
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Auto-redirect to dashboard after successful registration
  useEffect(() => {
    if (success && createdTenant) {
      const timer = setTimeout(() => {
        router.push('/')
      }, 1500) // Show success message for 1.5 seconds before redirecting
      
      return () => clearTimeout(timer)
    }
  }, [success, createdTenant, router])

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✅</div>
          <h2>Tenant Created Successfully!</h2>
          <p>Welcome, <strong>{formData.name}</strong>!</p>
          <p>Redirecting you to the dashboard...</p>
          
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
          <h1 style={styles.title}>📝 Register New Tenant</h1>
        </div>

        {error && <div style={styles.error}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Company/Tenant Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={styles.input}
              placeholder="Enter your company name"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Country</label>
            <select
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              style={styles.input}
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

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={styles.input}
              placeholder="Create a password"
              required
              minLength={4}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              style={styles.input}
              placeholder="Confirm your password"
              required
            />
          </div>

          <button
            type="submit"
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Tenant'}
          </button>
        </form>

        <div style={styles.footer}>
          Already have a tenant?{' '}
          <Link href="/" style={styles.link}>Login here</Link>
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
    maxWidth: '450px',
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
  error: {
    padding: '14px 18px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '12px',
    marginBottom: '20px',
    fontSize: '0.95rem',
  },
  field: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 600,
    color: '#374151',
    fontSize: '0.95rem',
  },
  input: {
    width: '100%',
    padding: '14px 18px',
    borderRadius: '12px',
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
