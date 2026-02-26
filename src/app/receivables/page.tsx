'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/ThemeContext';
import { useLanguage } from '@/lib/LanguageContext';
import { useCurrency } from '@/lib/CurrencyContext';
import { formatCurrency } from '@/lib/currency';

interface Receivable {
  id: string;
  customer_id: string;
  customer_name: string;
  sales_order_number: string;
  amount_due: number;
  amount_received: number;
  status: string;
  due_date: string;
  created_at: string;
}

export default function ReceivablesPage() {
  const buildTime = '20260226-v2'
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { currency } = useCurrency();
  const bgColor = isDark ? '#111827' : '#F1F5F9';
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const textColor = isDark ? '#F9FAFB' : '#1F2937';
  const borderColor = isDark ? '#374151' : '#E5E7EB';
  const inputBg = isDark ? '#374151' : '#F9FAFB';
  const mutedColor = isDark ? '#9CA3AF' : '#6B7280';

  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState('');
  const [selectedRec, setSelectedRec] = useState<Receivable | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('tracelid-selected-tenant');
    if (stored) {
      setTenantId(stored);
      fetchReceivables(stored);
    }
  }, []);

  const fetchReceivables = async (tid: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('tracelid-token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/receivables?tenantId=${tid}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setReceivables(data);
      }
    } catch (err) {
      console.error('Failed to fetch receivables:', err);
    } finally {
      setLoading(false);
    }
  };

  const recordPayment = async () => {
    if (!selectedRec || !paymentAmount) return;

    try {
      const token = localStorage.getItem('tracelid-token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const newAmountReceived = selectedRec.amount_received + parseFloat(paymentAmount);
      const newStatus = newAmountReceived >= selectedRec.amount_due ? 'paid' : 'partial';

      const res = await fetch('/api/receivables', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          id: selectedRec.id,
          amount_received: newAmountReceived,
          status: newStatus,
        }),
      });

      if (res.ok) {
        setSelectedRec(null);
        setPaymentAmount('');
        fetchReceivables(tenantId);
      }
    } catch (err) {
      console.error('Failed to record payment:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this receivable?')) return;

    try {
      const token = localStorage.getItem('tracelid-token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/receivables', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        fetchReceivables(tenantId);
      } else {
        console.error('Failed to delete receivable');
      }
    } catch (err) {
      console.error('Error deleting receivable:', err);
    }
  };

  const handleStatusChange = async (rec: Receivable, newStatus: string) => {
    try {
      const token = localStorage.getItem('tracelid-token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const newAmountReceived = newStatus === 'paid' ? rec.amount_due : 
                               newStatus === 'partial' ? rec.amount_received : 0;

      const res = await fetch('/api/receivables', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          id: rec.id,
          status: newStatus,
          amount_received: newAmountReceived,
        }),
      });

      if (res.ok) {
        fetchReceivables(tenantId);
      } else {
        console.error('Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      paid: { bg: '#10B98120', color: '#10B981' },
      partial: { bg: '#F59E0B20', color: '#F59E0B' },
      unpaid: { bg: '#EF444420', color: '#EF4444' },
    };
    const style = colors[status] || colors.unpaid;
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        backgroundColor: style.bg,
        color: style.color,
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
      }}>
        {status}
      </span>
    );
  };

  const totalUnpaid = receivables.filter(r => r.status === 'unpaid').length;
  const totalPartial = receivables.filter(r => r.status === 'partial').length;
  const totalPaid = receivables.filter(r => r.status === 'paid').length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, fontFamily: 'Inter, sans-serif' }}>
      <header style={{ backgroundColor: cardBg, borderBottom: '1px solid #E5E7EB', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" style={{ color: '#6C5CE7', textDecoration: 'none', fontSize: '0.9rem' }}>← Back to Dashboard</Link>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1F2937' }}>💰 Receivables</h1>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#EF4444' }}>{totalUnpaid}</div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Unpaid</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F59E0B' }}>{totalPartial}</div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Partial</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10B981' }}>{totalPaid}</div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Paid</div>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Loading...</div>
        ) : receivables.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: cardBg, borderRadius: '12px' }}>
            <p style={{ color: '#6B7280' }}>No receivables found</p>
          </div>
        ) : (
          <div style={{ backgroundColor: cardBg, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: inputBg }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: mutedColor, textTransform: 'uppercase' }}>Customer</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: mutedColor, textTransform: 'uppercase' }}>Order #</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: mutedColor, textTransform: 'uppercase' }}>Amount Due</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: mutedColor, textTransform: 'uppercase' }}>Received</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: mutedColor, textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: mutedColor, textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {receivables.map((rec) => (
                  <tr key={rec.id} style={{ borderTop: `1px solid ${borderColor}` }}>
                    <td style={{ padding: '16px', color: '#1F2937' }}>{rec.customer_name || rec.customer_id}</td>
                    <td style={{ padding: '16px', fontFamily: 'monospace', fontWeight: 600, color: '#6C5CE7' }}>{rec.sales_order_number}</td>
                    <td style={{ padding: '16px', fontWeight: 600 }}>${rec.amount_due?.toFixed(2)}</td>
                    <td style={{ padding: '16px', color: rec.amount_received > 0 ? '#10B981' : '#6B7280' }}>${rec.amount_received?.toFixed(2)}</td>
                    <td style={{ padding: '16px' }}>
                      <select
                        value={rec.status}
                        onChange={(e) => handleStatusChange(rec, e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #E5E7EB',
                          fontSize: '0.875rem',
                          backgroundColor: rec.status === 'paid' ? '#D1FAE5' : rec.status === 'partial' ? '#FEF3C7' : '#FEE2E2',
                          color: rec.status === 'paid' ? '#065F46' : rec.status === 'partial' ? '#92400E' : '#991B1B',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="partial">Partial</option>
                        <option value="paid">Paid</option>
                      </select>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {rec.status !== 'paid' && (
                        <button
                          onClick={() => setSelectedRec(rec)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#6C5CE7',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            marginRight: '8px',
                          }}
                        >
                          Record Payment
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(rec.id)}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: 'transparent',
                          color: '#EF4444',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                        }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Payment Modal */}
      {selectedRec && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Record Payment</h3>
            <p style={{ color: '#6B7280', marginBottom: '8px' }}>Customer: {selectedRec.customer_name || selectedRec.customer_id}</p>
            <p style={{ color: '#6B7280', marginBottom: '16px' }}>Order: {selectedRec.sales_order_number}</p>
            <p style={{ color: '#6B7280', marginBottom: '16px' }}>Amount Due: ${selectedRec.amount_due?.toFixed(2)}</p>
            <p style={{ color: '#6B7280', marginBottom: '16px' }}>Already Paid: ${selectedRec.amount_received?.toFixed(2)}</p>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 600 }}>Payment Amount</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '6px' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setSelectedRec(null)}
                style={{ flex: 1, padding: '10px', backgroundColor: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={recordPayment}
                style={{ flex: 1, padding: '10px', backgroundColor: '#6C5CE7', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Save Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
