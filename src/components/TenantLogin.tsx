'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/LanguageContext'

interface TenantLoginProps {
  tenantName: string
  onLogin: (password: string) => void
  onCancel: () => void
  error?: string
}

export default function TenantLogin({ tenantName, onLogin, onCancel, error }: TenantLoginProps) {
  const { t } = useLanguage()
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin(password)
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>🔐 {t('tenantLogin')}</h2>
        <p style={styles.subtitle}>
          {t('enterPassword')} for <strong>{tenantName}</strong>
        </p>

        {error && <div style={styles.error}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('password')}
            style={styles.input}
            autoFocus
          />

          <div style={styles.buttons}>
            <button type="button" onClick={onCancel} style={styles.cancelBtn}>
              {t('close')}
            </button>
            <button type="submit" style={styles.loginBtn}>
              {t('login')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '32px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '1.5rem',
    color: '#1f2937',
  },
  subtitle: {
    margin: '0 0 24px 0',
    color: '#6b7280',
    fontSize: '0.95rem',
  },
  error: {
    padding: '12px 16px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '10px',
    marginBottom: '16px',
    fontSize: '0.9rem',
  },
  input: {
    width: '100%',
    padding: '14px 18px',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
    fontSize: '1rem',
    marginBottom: '20px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  buttons: {
    display: 'flex',
    gap: '12px',
  },
  cancelBtn: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  loginBtn: {
    flex: 1,
    padding: '14px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
}
