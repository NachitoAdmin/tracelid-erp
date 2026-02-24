export default function MaintenancePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '20px',
          padding: '60px 40px',
          width: '100%',
          maxWidth: '500px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ marginBottom: '30px' }}>
          <svg
            width="100"
            height="100"
            viewBox="0 0 200 200"
            style={{ marginBottom: '20px' }}
          >
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6C5CE7" />
                <stop offset="100%" stopColor="#A78BFA" />
              </linearGradient>
            </defs>
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="url(#logoGrad)"
              strokeWidth="12"
            />
            <polyline
              points="55,120 80,85 105,110 145,65"
              fill="none"
              stroke="url(#logoGrad)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="100" cy="100" r="20" fill="#6C5CE7" opacity="0.3" />
            <line
              x1="160"
              y1="160"
              x2="190"
              y2="190"
              stroke="url(#logoGrad)"
              strokeWidth="20"
              strokeLinecap="round"
            />
          </svg>
          <h1
            style={{
              margin: '0 0 10px 0',
              fontSize: '2rem',
              fontWeight: 700,
              color: '#1f2937',
            }}
          >
            Tracelid
          </h1>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <div
            style={{
              fontSize: '4rem',
              marginBottom: '20px',
            }}
          >
            🚧
          </div>
          <h2
            style={{
              margin: '0 0 15px 0',
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#374151',
            }}
          >
            Coming Soon
          </h2>
          <p
            style={{
              margin: '0',
              color: '#6b7280',
              fontSize: '1rem',
              lineHeight: '1.6',
            }}
          >
            Tracelid is coming soon. Stay tuned!
          </p>
        </div>

        <div
          style={{
            padding: '20px',
            backgroundColor: '#f3f4f6',
            borderRadius: '12px',
            marginTop: '20px',
          }}
        >
          <p
            style={{
              margin: '0',
              color: '#9ca3af',
              fontSize: '0.875rem',
            }}
          >
            We&apos;re working hard to bring you something amazing.
            <br />
            Check back soon for updates!
          </p>
        </div>
      </div>
    </div>
  );
}
