'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/LanguageContext'

export default function ChatBot() {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([
    { text: "Hi! I'm NachitoBot. How can I help you today?", isUser: false },
  ])
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim()) return

    // Add user message
    setMessages((prev) => [...prev, { text: input, isUser: true }])

    // Generate response
    const response = generateResponse(input.toLowerCase())
    setTimeout(() => {
      setMessages((prev) => [...prev, { text: response, isUser: false }])
    }, 500)

    setInput('')
  }

  const generateResponse = (query: string): string => {
    if (query.includes('transaction') || query.includes('sale')) {
      return 'To create a transaction, select a tenant, choose the transaction type (Sale, Return, Rebate, etc.), enter the amount, and click "Create Transaction".'
    }
    if (query.includes('analytics') || query.includes('report')) {
      return 'The Analytics Dashboard shows your sales, returns, discounts, and net revenue. You can view detailed analytics in the Analytics page.'
    }
    if (query.includes('tenant') || query.includes('login')) {
      return 'To access a tenant, enter the Tenant ID and click "Set Tenant". If the tenant has a password, you\'ll be prompted to enter it.'
    }
    if (query.includes('language') || query.includes('translate')) {
      return 'You can change the language using the language selector in the header. We support English, Spanish, French, German, and Dutch.'
    }
    if (query.includes('currency') || query.includes('money')) {
      return 'You can change the currency using the currency selector. We support USD, EUR, GBP, JPY, CAD, and AUD.'
    }
    if (query.includes('hello') || query.includes('hi')) {
      return 'Hello! How can I assist you with Tracelid today?'
    }
    return "I'm not sure about that. Try asking about transactions, analytics, tenants, language, or currency options."
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={styles.floatingButton}
        >
          💬 {t('help')}
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div style={styles.chatPanel}>
          <div style={styles.header}>
            <span>🤖 NachitoBot Assistant</span>
            <button onClick={() => setIsOpen(false)} style={styles.closeBtn}>
              ✕
            </button>
          </div>

          <div style={styles.messages}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.message,
                  ...(msg.isUser ? styles.userMessage : styles.botMessage),
                }}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <div style={styles.inputArea}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('chatbotPlaceholder')}
              style={styles.input}
            />
            <button onClick={handleSend} style={styles.sendBtn}>
              {t('send')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  floatingButton: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '50px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
    zIndex: 1000,
  },
  chatPanel: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '350px',
    height: '500px',
    backgroundColor: '#fff',
    borderRadius: '20px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
    overflow: 'hidden',
  },
  header: {
    padding: '16px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    fontWeight: 600,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '1.2rem',
    cursor: 'pointer',
  },
  messages: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  message: {
    padding: '12px 16px',
    borderRadius: '16px',
    maxWidth: '80%',
    fontSize: '0.9rem',
    lineHeight: 1.4,
  },
  userMessage: {
    backgroundColor: '#667eea',
    color: '#fff',
    alignSelf: 'flex-end',
    borderBottomRightRadius: '4px',
  },
  botMessage: {
    backgroundColor: '#f3f4f6',
    color: '#1f2937',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: '4px',
  },
  inputArea: {
    padding: '16px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    gap: '8px',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
    fontSize: '0.9rem',
    outline: 'none',
  },
  sendBtn: {
    padding: '12px 20px',
    backgroundColor: '#667eea',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
}
