'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/ThemeContext';

interface IncomeStatementItem {
  line_item: string;
  sort_order: number;
  amount: number;
  tenant_id: string;
}

interface BalanceSheetItem {
  section: string;
  line_item: string;
  sort_order: number;
  amount: number;
  tenant_id: string;
}

interface FinancialDashboard {
  tenant_id: string;
  completed_orders: number;
  total_revenue: number;
  avg_order_value: number;
  pending_orders: number;
  pending_revenue: number;
  total_invoiced: number;
  outstanding_receivables: number;
  total_cogs: number;
  gross_profit: number;
  gross_margin_pct: number;
}

type TabType = 'dashboard' | 'income-statement' | 'balance-sheet' | 'monthly' | 'journal-entries';

interface JournalEntry {
  id: string;
  tenant_id: string;
  date: string;
  description: string;
  account_code: string;
  debit: number;
  credit: number;
  created_by: string;
  created_at: string;
}

interface GLAccount {
  id: string;
  account_code: string;
  name: string;
  type: string;
}

export default function FinancialAnalysisPage() {
  const { isDark } = useTheme();
  const bgColor = isDark ? '#111827' : '#F1F5F9';
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const textColor = isDark ? '#F9FAFB' : '#1F2937';
  const borderColor = isDark ? '#374151' : '#E5E7EB';
  const inputBg = isDark ? '#374151' : '#F9FAFB';
  const mutedColor = isDark ? '#9CA3AF' : '#6B7280';

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [tenantId, setTenantId] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatementItem[]>([]);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetItem[]>([]);
  const [dashboard, setDashboard] = useState<FinancialDashboard | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [glAccounts, setGlAccounts] = useState<GLAccount[]>([]);
  const [user, setUser] = useState<any>(null);
  
  // Journal entry form state
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [journalForm, setJournalForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    account_code: '',
    debit: '',
    credit: '',
  });

  useEffect(() => {
    const stored = localStorage.getItem('tracelid-selected-tenant');
    const userData = localStorage.getItem('tracelid-user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Failed to parse user data');
      }
    }
    if (stored) {
      setTenantId(stored);
      fetchFinancialData(stored);
      fetchJournalEntries(stored);
      fetchGLAccounts(stored);
    }
  }, []);

  const fetchFinancialData = async (tid: string) => {
    setLoading(true);
    try {
      const [incomeRes, balanceRes, dashRes] = await Promise.all([
        fetch(`/api/financial/income-statement?tenantId=${tid}`),
        fetch(`/api/financial/balance-sheet?tenantId=${tid}`),
        fetch(`/api/financial/dashboard?tenantId=${tid}`),
      ]);

      if (incomeRes.ok) setIncomeStatement(await incomeRes.json());
      if (balanceRes.ok) setBalanceSheet(await balanceRes.json());
      if (dashRes.ok) {
        const dashData = await dashRes.json();
        setDashboard(dashData[0] || null);
      }
    } catch (err) {
      console.error('Failed to fetch financial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchJournalEntries = async (tid: string) => {
    try {
      const res = await fetch(`/api/journal-entries?tenantId=${tid}`);
      if (res.ok) {
        const data = await res.json();
        setJournalEntries(data);
      }
    } catch (err) {
      console.error('Failed to fetch journal entries:', err);
    }
  };

  const fetchGLAccounts = async (tid: string) => {
    try {
      const res = await fetch(`/api/gl-accounts?tenantId=${tid}`);
      if (res.ok) {
        const data = await res.json();
        setGlAccounts(data);
      }
    } catch (err) {
      console.error('Failed to fetch GL accounts:', err);
    }
  };

  const handleJournalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !user) return;

    try {
      const res = await fetch('/api/journal-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          date: journalForm.date,
          description: journalForm.description,
          account_code: journalForm.account_code,
          debit: parseFloat(journalForm.debit) || 0,
          credit: parseFloat(journalForm.credit) || 0,
          created_by: user.email || user.id,
        }),
      });

      if (res.ok) {
        setJournalForm({
          date: new Date().toISOString().split('T')[0],
          description: '',
          account_code: '',
          debit: '',
          credit: '',
        });
        setShowJournalForm(false);
        fetchJournalEntries(tenantId);
      }
    } catch (err) {
      console.error('Failed to create journal entry:', err);
    }
  };

  const deleteJournalEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      const res = await fetch(`/api/journal-entries?id=${id}`, { method: 'DELETE' });
      if (res.ok && tenantId) {
        fetchJournalEntries(tenantId);
      }
    } catch (err) {
      console.error('Failed to delete journal entry:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getLineItemLabel = (item: string) => {
    const labels: Record<string, string> = {
      'GROSS_REVENUE': 'Gross Revenue',
      'RETURNS': 'Sales Returns',
      'DISCOUNTS': 'Sales Discounts',
      'NET_REVENUE': 'Net Revenue',
      'COGS': 'Cost of Goods Sold',
      'GROSS_PROFIT': 'Gross Profit',
      'OPEX': 'Operating Expenses',
      'EBIT': 'EBIT',
      'FIN_RESULT': 'Financial Result',
      'PROFIT_BEFORE_TAX': 'Profit Before Tax',
      'TAX': 'Income Tax',
      'NET_PROFIT': 'Net Profit',
    };
    return labels[item] || item;
  };

  const isSummaryLine = (item: string) => {
    return ['NET_REVENUE', 'GROSS_PROFIT', 'EBIT', 'PROFIT_BEFORE_TAX', 'NET_PROFIT'].includes(item);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{ backgroundColor: cardBg, borderBottom: '1px solid #E5E7EB', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" style={{ color: '#6C5CE7', textDecoration: 'none', fontSize: '0.9rem' }}>← Back to Dashboard</Link>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1F2937' }}>📊 Financial Analysis</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          {[
            { key: 'dashboard', label: '📈 Dashboard' },
            { key: 'income-statement', label: '📄 Income Statement' },
            { key: 'balance-sheet', label: '⚖️ Balance Sheet' },
            { key: 'monthly', label: '📅 Monthly Trend' },
            { key: 'journal-entries', label: '📒 Journal Entries' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              style={{
                padding: '12px 24px',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                backgroundColor: activeTab === tab.key ? '#6C5CE7' : '#fff',
                color: activeTab === tab.key ? '#fff' : '#374151',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Loading...</div>
        ) : (
          <>
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && dashboard && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {/* Revenue Card */}
                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '8px' }}>Total Revenue</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10B981' }}>{formatCurrency(dashboard.total_revenue)}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '8px' }}>{dashboard.completed_orders} completed orders</div>
                </div>

                {/* Gross Profit Card */}
                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '8px' }}>Gross Profit</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#6C5CE7' }}>{formatCurrency(dashboard.gross_profit)}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '8px' }}>{dashboard.gross_margin_pct}% margin</div>
                </div>

                {/* Pending Revenue Card */}
                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '8px' }}>Pending Revenue</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#F59E0B' }}>{formatCurrency(dashboard.pending_revenue)}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '8px' }}>{dashboard.pending_orders} pending orders</div>
                </div>

                {/* Outstanding Receivables Card */}
                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '8px' }}>Outstanding Receivables</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#EF4444' }}>{formatCurrency(dashboard.outstanding_receivables)}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '8px' }}>of {formatCurrency(dashboard.total_invoiced)} invoiced</div>
                </div>

                {/* Avg Order Value Card */}
                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '8px' }}>Average Order Value</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1F2937' }}>{formatCurrency(dashboard.avg_order_value)}</div>
                </div>

                {/* COGS Card */}
                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '8px' }}>Cost of Goods Sold</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1F2937' }}>{formatCurrency(dashboard.total_cogs)}</div>
                </div>
              </div>
            )}

            {/* Income Statement Tab */}
            {activeTab === 'income-statement' && (
              <div style={{ backgroundColor: cardBg, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: textColor }}>Income Statement (YTD)</h2>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {incomeStatement
                      .filter(item => item.tenant_id === tenantId)
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((item) => (
                        <tr 
                          key={item.line_item} 
                          style={{ 
                            borderBottom: `1px solid ${borderColor}`,
                            backgroundColor: isSummaryLine(item.line_item) ? '#F9FAFB' : '#fff',
                          }}
                        >
                          <td style={{ 
                            padding: '16px 24px', 
                            fontWeight: isSummaryLine(item.line_item) ? 700 : 400,
                            color: isSummaryLine(item.line_item) ? '#1F2937' : '#6B7280',
                            paddingLeft: item.line_item.startsWith('  ') ? '48px' : '24px',
                          }}>
                            {getLineItemLabel(item.line_item)}
                          </td>
                          <td style={{ 
                            padding: '16px 24px', 
                            textAlign: 'right',
                            fontWeight: isSummaryLine(item.line_item) ? 700 : 600,
                            color: item.amount < 0 ? '#EF4444' : '#1F2937',
                            fontFamily: 'monospace',
                            fontSize: '0.95rem',
                          }}>
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Balance Sheet Tab */}
            {activeTab === 'balance-sheet' && (
              <div style={{ backgroundColor: cardBg, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: textColor }}>Balance Sheet</h2>
                </div>
                
                {/* Assets Section */}
                <div style={{ padding: '16px 24px', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: textColor, fontWeight: 700 }}>ASSETS</h3>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {balanceSheet
                      .filter(item => item.tenant_id === tenantId && item.section === 'ASSETS')
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((item) => (
                        <tr key={item.line_item} style={{ borderBottom: `1px solid ${borderColor}` }}>
                          <td style={{ padding: '16px 24px', color: '#6B7280' }}>{item.line_item}</td>
                          <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.95rem' }}>
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                {/* Liabilities Section */}
                <div style={{ padding: '16px 24px', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', borderTop: '2px solid #E5E7EB' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: textColor, fontWeight: 700 }}>LIABILITIES</h3>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {balanceSheet
                      .filter(item => item.tenant_id === tenantId && item.section === 'LIABILITIES')
                      .map((item) => (
                        <tr key={item.line_item} style={{ borderBottom: `1px solid ${borderColor}` }}>
                          <td style={{ padding: '16px 24px', color: '#6B7280' }}>{item.line_item}</td>
                          <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.95rem' }}>
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                {/* Equity Section */}
                <div style={{ padding: '16px 24px', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', borderTop: '2px solid #E5E7EB' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: textColor, fontWeight: 700 }}>EQUITY</h3>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {balanceSheet
                      .filter(item => item.tenant_id === tenantId && item.section === 'EQUITY')
                      .map((item) => (
                        <tr key={item.line_item} style={{ borderBottom: `1px solid ${borderColor}` }}>
                          <td style={{ padding: '16px 24px', color: '#6B7280' }}>{item.line_item}</td>
                          <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.95rem' }}>
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Monthly Trend Tab */}
            {activeTab === 'monthly' && (
              <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h2 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', color: textColor }}>Monthly Financial Trend</h2>
                <p style={{ color: '#6B7280' }}>Monthly breakdown coming soon...</p>
              </div>
            )}

            {/* Journal Entries Tab */}
            {activeTab === 'journal-entries' && (
              <div style={{ backgroundColor: cardBg, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: textColor }}>📒 Journal Entries</h2>
                  <button
                    onClick={() => setShowJournalForm(!showJournalForm)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#6C5CE7',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {showJournalForm ? 'Cancel' : '+ Add Entry'}
                  </button>
                </div>

                {/* Add Entry Form */}
                {showJournalForm && (
                  <form onSubmit={handleJournalSubmit} style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Date</label>
                        <input
                          type="date"
                          value={journalForm.date}
                          onChange={(e) => setJournalForm({ ...journalForm, date: e.target.value })}
                          required
                          style={{ width: '100%', padding: '10px', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Account</label>
                        <select
                          value={journalForm.account_code}
                          onChange={(e) => setJournalForm({ ...journalForm, account_code: e.target.value })}
                          required
                          style={{ width: '100%', padding: '10px', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                        >
                          <option value="">Select account...</option>
                          {glAccounts.map((acc) => (
                            <option key={acc.id} value={acc.account_code}>
                              {acc.account_code} - {acc.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Debit</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={journalForm.debit}
                          onChange={(e) => setJournalForm({ ...journalForm, debit: e.target.value })}
                          placeholder="0.00"
                          style={{ width: '100%', padding: '10px', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Credit</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={journalForm.credit}
                          onChange={(e) => setJournalForm({ ...journalForm, credit: e.target.value })}
                          placeholder="0.00"
                          style={{ width: '100%', padding: '10px', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Description</label>
                      <input
                        type="text"
                        value={journalForm.description}
                        onChange={(e) => setJournalForm({ ...journalForm, description: e.target.value })}
                        placeholder="Enter description..."
                        required
                        style={{ width: '100%', padding: '10px', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                      />
                    </div>
                    <div style={{ marginTop: '16px' }}>
                      <button
                        type="submit"
                        style={{
                          padding: '12px 24px',
                          backgroundColor: '#10B981',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        Save Entry
                      </button>
                    </div>
                  </form>
                )}

                {/* Journal Entries Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: inputBg }}>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: mutedColor, textTransform: 'uppercase' }}>Date</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: mutedColor, textTransform: 'uppercase' }}>Description</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: mutedColor, textTransform: 'uppercase' }}>Account</th>
                      <th style={{ padding: '16px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Debit</th>
                      <th style={{ padding: '16px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Credit</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: mutedColor, textTransform: 'uppercase' }}>Created By</th>
                      {(user?.role === 'admin' || user?.role === 'owner') && (
                        <th style={{ padding: '16px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {journalEntries.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                          No journal entries found. Click "Add Entry" to create one.
                        </td>
                      </tr>
                    ) : (
                      journalEntries.map((entry) => (
                        <tr key={entry.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                          <td style={{ padding: '16px', color: '#1F2937' }}>{new Date(entry.date).toLocaleDateString()}</td>
                          <td style={{ padding: '16px', color: '#1F2937' }}>{entry.description}</td>
                          <td style={{ padding: '16px', color: '#6B7280', fontFamily: 'monospace' }}>{entry.account_code}</td>
                          <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600, fontFamily: 'monospace', color: entry.debit > 0 ? '#1F2937' : '#9CA3AF' }}>
                            {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600, fontFamily: 'monospace', color: entry.credit > 0 ? '#1F2937' : '#9CA3AF' }}>
                            {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                          </td>
                          <td style={{ padding: '16px', color: '#6B7280', fontSize: '0.875rem' }}>{entry.created_by}</td>
                          {(user?.role === 'admin' || user?.role === 'owner') && (
                            <td style={{ padding: '16px', textAlign: 'center' }}>
                              <button
                                onClick={() => deleteJournalEntry(entry.id)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#FEE2E2',
                                  color: '#991B1B',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                }}
                              >
                                Delete
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
