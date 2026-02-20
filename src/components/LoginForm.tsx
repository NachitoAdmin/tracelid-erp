'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log('LoginPage mounted');
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('HANDLE SUBMIT CALLED');
    e.preventDefault();
    console.log('Login form submitted - email:', email);
    setError('');
    setLoading(true);

    try {
      console.log('Calling login API...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      console.log('Login response status:', res.status);
      console.log('Response headers:', Object.fromEntries(res.headers.entries()));
      
      const responseText = await res.text();
      console.log('Raw response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed data:', data);
      } catch (jsonErr) {
        console.error('Failed to parse JSON:', jsonErr);
        setError('Server error: Invalid response - ' + responseText.substring(0, 100));
        setLoading(false);
        return;
      }
      
      console.log('Login response data:', data);
      console.log('Data has user?', data.hasOwnProperty('user'));
      console.log('Data.user:', data.user);

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      console.log('Storing user data to localStorage...');
      console.log('data.user exists?', !!data.user);
      console.log('data.user.id:', data.user?.id);
      console.log('data.user.tenant:', data.user?.tenant);
      
      if (!data.user) {
        console.error('No user data in response!');
        setError('Invalid response: missing user data');
        setLoading(false);
        return;
      }

      localStorage.setItem('tracelid-user', JSON.stringify(data.user));
      localStorage.setItem('tracelid-selected-tenant', data.user.tenant?.id || '');
      localStorage.setItem('tracelid-selected-tenant-name', data.user.tenant?.name || '');

      console.log('Redirecting to dashboard...');
      console.log('User role:', data.user.role);
      setLoading(false);
      
      const redirectUrl = data.user.role === 'operator' ? '/operator' : '/';
      console.log('Redirect URL:', redirectUrl);
      
      setTimeout(() => {
        console.log('Executing redirect to:', redirectUrl);
        window.location.href = redirectUrl;
      }, 100);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError('Network error: ' + err.message);
      }
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    console.log('BUTTON CLICKED DIRECTLY');
  };

  if (!mounted) {
    return <div style={styles.container}>Loading...⏳</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <svg width="80" height="80" viewBox="0 0 200 200" style={{marginBottom: '10px'}}>
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6C5CE7" />
                <stop offset="100%" stopColor="#A78BFA" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="80" fill="none" stroke="url(#logoGrad)" strokeWidth="12" />
            <polyline points="55,120 80,85 105,110 145,65" fill="none" stroke="url(#logoGrad)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="100" cy="100" r="20" fill="#6C5CE7" opacity="0.3" />
            <line x1="160" y1="160" x2="190" y2="190" stroke="url(#logoGrad)" strokeWidth="20" strokeLinecap="round" />
          </svg>
          <h1 style={styles.title}>Tracelid</h1>
        </div>
        
        <p style={styles.subtitle}>Sign in to your account</p>
        
        {error && (
          <div style={styles.error}>⚠️ {error}</div>
        )}
        
        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="you@company.com"
              required
            />
          </div>
          
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            onClick={handleButtonClick}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div style={styles.footer}>
          Don&apos;t have an account?{' '}
          <Link href="/register" style={styles.link}>Create one</Link>
        </div>
        
        <div style={{marginTop: '15px'}}>
          <p style={{margin: '0', fontSize: '0.8rem', color: '#9ca3af'}}>
            Forgot password? Contact admin or{' '}
            <Link href="/register" style={styles.link}>create new account</Link>
          </p>
        </div>
      </div>
    </div>
  );
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
    boxSizing: 'border-box',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  logo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    margin: '0',
    fontSize: '1.8rem',
    fontWeight: 700,
    color: '#1f2937',
  },
  subtitle: {
    margin: '0 0 25px 0',
    color: '#6b7280',
    fontSize: '0.95rem',
  },
  form: {
    width: '100%',
    boxSizing: 'border-box',
  },
  error: {
    padding: '12px 16px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '10px',
    marginBottom: '20px',
    fontSize: '0.9rem',
    width: '100%',
    boxSizing: 'border-box',
  },
  field: {
    marginBottom: '18px',
    textAlign: 'left',
    width: '100%',
    boxSizing: 'border-box',
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
    maxWidth: '100%',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: 600,
    marginTop: '10px',
    boxSizing: 'border-box',
  },
  footer: {
    marginTop: '25px',
    color: '#6b7280',
    fontSize: '0.9rem',
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: 600,
  },
};
