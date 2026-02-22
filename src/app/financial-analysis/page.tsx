'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

type TabType = 'dashboard' | 'income-statement' | 'balance-sheet' | 'monthly';

export default function FinancialAnalysisPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [tenantId, setTenantId] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatementItem[]>([]);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetItem[]>([]);
  const [dashboard, setDashboard] = useState<FinancialDashboard | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('tracelid-selected-tenant');
    if (stored) {
      setTenantId(stored);
      fetchFinancialData(stored);
    }
  }, []);

  const fetchFinancialData = async (tid: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('tracelid-token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [incomeRes, balanceRes, dashRes] = await Promise.all([
        fetch(`/api/financial/income-statement?tenantId=${tid}`, { headers }),
        fetch(`/api/financial/balance-sheet?tenantId=${tid}`, { headers }),
        fetch(`/api/financial/dashboard?tenantId=${tid}`, { headers }),
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
    <div style={{ minHeight: '100vh', backgroundColor: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#fff', borderBottom: '1px solid #E5E7EB', padding: '16px 24px' }}>
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
              <div style={{ backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1F2937' }}>Income Statement (YTD)</h2>
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
                            borderBottom: '1px solid #F3F4F6',
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
              <div style={{ backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1F2937' }}>Balance Sheet</h2>
                </div>
                
                {/* Assets Section */}
                <div style={{ padding: '16px 24px', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#1F2937', fontWeight: 700 }}>ASSETS</h3>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {balanceSheet
                      .filter(item => item.tenant_id === tenantId && item.section === 'ASSETS')
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((item) => (
                        <tr key={item.line_item} style={{ borderBottom: '1px solid #F3F4F6' }}>
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
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#1F2937', fontWeight: 700 }}>LIABILITIES</h3>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {balanceSheet
                      .filter(item => item.tenant_id === tenantId && item.section === 'LIABILITIES')
                      .map((item) => (
                        <tr key={item.line_item} style={{ borderBottom: '1px solid #F3F4F6' }}>
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
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#1F2937', fontWeight: 700 }}>EQUITY</h3>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {balanceSheet
                      .filter(item => item.tenant_id === tenantId && item.section === 'EQUITY')
                      .map((item) => (
                        <tr key={item.line_item} style={{ borderBottom: '1px solid #F3F4F6' }}>
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
              <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h2 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', color: '#1F2937' }}>Monthly Financial Trend</h2>
                <p style={{ color: '#6B7280' }}>Monthly breakdown coming soon...</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
