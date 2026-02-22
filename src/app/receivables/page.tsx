'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Receivable {
  id: string;
  customer_id: string;
  sales_order_number: string;
  amount_received: number;
  bank_id: string | null;
  account_id: string | null;
  received_date: string;
  created_at: string;
}

export default function ReceivablesPage() {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState('');
  const [selectedRec, setSelectedRec] = useState<Receivable | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [bankId, setBankId] = useState('');
  const [accountId, setAccountId] = useState('');

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

      const res = await fetch('/api/receivables', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          id: selectedRec.id,
          amount_received: parseFloat(paymentAmount),
          bank_id: bankId || null,
          account_id: accountId || null,
        }),
      });

      if (res.ok) {
        setSelectedRec(null);
        setPaymentAmount('');
        setBankId('');
        setAccountId('');
        fetchReceivables(tenantId);
      }
    } catch (err) {
      console.error('Failed to record payment:', err);
    }
  };

  const getStatusBadge = (amount: number) => {
    const isPaid = amount > 0;
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        backgroundColor: isPaid ? '#10B98120' : '#F59E0B20',
        color: isPaid ? '#10B981' : '#F59E0B',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
      }}>
        {isPaid ? 'Paid' : 'Unpaid'}
      </span>
    );
  };

  const totalUnpaid = receivables.filter(r => r.amount_received === 0).length;
  const totalPaid = receivables.filter(r => r.amount_received > 0).length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ backgroundColor: '#fff', borderBottom: '1px solid #E5E7EB', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" style={{ color: '#6C5CE7', textDecoration: 'none', fontSize: '0.9rem' }}>← Back to Dashboard</Link>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1F2937' }}>💰 Receivables</h1>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F59E0B' }}>{totalUnpaid}</div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Unpaid</div>
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
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: '12px' }}>
            <p style={{ color: '#6B7280' }}>No receivables found</p>
          </div>
        ) : (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Order #</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Customer ID</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Amount Received</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {receivables.map((rec) => (
                  <tr key={rec.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '16px', fontFamily: 'monospace', fontWeight: 600, color: '#6C5CE7' }}>{rec.sales_order_number}</td>
                    <td style={{ padding: '16px', color: '#1F2937' }}>{rec.customer_id}</td>
                    <td style={{ padding: '16px', fontWeight: 600, color: rec.amount_received > 0 ? '#10B981' : '#6B7280' }}>${rec.amount_received?.toFixed(2)}</td>
                    <td style={{ padding: '16px' }}>{getStatusBadge(rec.amount_received)}</td>
                    <td style={{ padding: '16px', color: '#6B7280', fontSize: '0.875rem' }}>{new Date(rec.received_date).toLocaleDateString()}</td>
                    <td style={{ padding: '16px' }}>
                      {rec.amount_received === 0 && (
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
                          }}
                        >
                          Record Payment
                        </button>
                      )}
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
            <p style={{ color: '#6B7280', marginBottom: '16px' }}>Order: {selectedRec.sales_order_number}</p>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 600 }}>Amount Received</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '6px' }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 600 }}>Bank ID (optional)</label>
              <input
                type="text"
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                placeholder="BANK-001"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '6px' }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 600 }}>Account ID (optional)</label>
              <input
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="ACC-001"
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
