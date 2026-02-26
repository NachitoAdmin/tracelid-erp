'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/ThemeContext';

interface Invoice {
  id: string;
  invoice_number: string;
  sales_order_number: string;
  customer_id: string;
  customer_name: string;
  product_id: string;
  product_name: string;
  quantity: number;
  quantity_unit: string;
  price: number;
  total_amount: number;
  invoice_date: string;
  status?: string;
  country: string;
  cost_center: string;
  profit_center: string;
  tenant_id: string;
  created_at: string;
}

export default function InvoicesPage() {
  const { isDark } = useTheme();
  const bgColor = isDark ? '#111827' : '#F1F5F9';
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const textColor = isDark ? '#F9FAFB' : '#1F2937';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState('');
  const [filter, setFilter] = useState<'all' | 'recent' | 'month'>('all');

  useEffect(() => {
    const stored = localStorage.getItem('tracelid-selected-tenant');
    if (stored) {
      setTenantId(stored);
      fetchInvoices(stored);
    }
  }, []);

  const fetchInvoices = async (tid: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('tracelid-token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/invoices?tenantId=${tid}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const res = await fetch('/api/invoices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        fetchInvoices(tenantId);
      } else {
        console.error('Failed to delete invoice');
      }
    } catch (err) {
      console.error('Error deleting invoice:', err);
    }
  };

  const handleMarkAsPaid = async (inv: Invoice) => {
    if (!confirm('Mark this invoice as paid?')) return;

    try {
      const token = localStorage.getItem('tracelid-token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Update invoice status
      const invoiceRes = await fetch('/api/invoices', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ id: inv.id, status: 'paid' }),
      });

      if (!invoiceRes.ok) {
        console.error('Failed to update invoice');
        return;
      }

      // Update receivable
      await fetch('/api/receivables', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          sales_order_number: inv.sales_order_number,
          status: 'paid',
          amount_received: inv.total_amount,
        }),
      });

      fetchInvoices(tenantId);
    } catch (err) {
      console.error('Error marking invoice as paid:', err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('tracelid-token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/invoices', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        fetchInvoices(tenantId);
      } else {
        console.error('Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    if (filter === 'all') return true;
    const invDate = new Date(inv.invoice_date);
    const now = new Date();
    if (filter === 'recent') {
      // Last 7 days
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return invDate >= sevenDaysAgo;
    }
    if (filter === 'month') {
      // Current month
      return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{ backgroundColor: cardBg, borderBottom: '1px solid #E5E7EB', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" style={{ color: '#6C5CE7', textDecoration: 'none', fontSize: '0.9rem' }}>← Back to Dashboard</Link>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1F2937' }}>📄 Invoices</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Total Amount</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10B981' }}>${totalAmount.toFixed(2)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#6C5CE7' }}>{invoices.length}</div>
              <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>Invoices</div>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Info Banner */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            backgroundColor: '#DBEAFE',
            color: '#1E40AF',
            fontSize: '0.9rem',
          }}
        >
          💡 Invoices are auto-generated when deliveries are marked as delivered.
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {(['all', 'recent', 'month'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
                backgroundColor: filter === f ? '#6C5CE7' : '#fff',
                color: filter === f ? '#fff' : '#374151',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              {f === 'all' ? 'All Time' : f === 'recent' ? 'Last 7 Days' : 'This Month'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Loading...</div>
        ) : filteredInvoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#fff', borderRadius: '12px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📄</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#1F2937' }}>No Invoices Found</h3>
            <p style={{ color: '#6B7280', marginBottom: '16px' }}>Invoices are auto-created when deliveries are marked as delivered.</p>
            <Link
              href="/delivery-status"
              style={{
                padding: '10px 20px',
                backgroundColor: '#6C5CE7',
                color: '#fff',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-block',
              }}
            >
              Go to Deliveries
            </Link>
          </div>
        ) : (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Invoice #</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Order #</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Customer</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Product</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Amount</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '16px', fontFamily: 'monospace', fontWeight: 600, color: '#10B981' }}>{inv.invoice_number}</td>
                    <td style={{ padding: '16px' }}>
                      <Link
                        href={`/sales-orders`}
                        style={{ fontFamily: 'monospace', color: '#6C5CE7', textDecoration: 'none' }}
                      >
                        {inv.sales_order_number}
                      </Link>
                    </td>
                    <td style={{ padding: '16px', color: '#1F2937' }}>{inv.customer_name}</td>
                    <td style={{ padding: '16px', color: '#6B7280' }}>{inv.product_name}</td>
                    <td style={{ padding: '16px', fontWeight: 600, color: '#1F2937' }}>${inv.total_amount?.toFixed(2)}</td>
                    <td style={{ padding: '16px' }}>
                      <select
                        value={inv.status || 'unpaid'}
                        onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #E5E7EB',
                          fontSize: '0.875rem',
                          backgroundColor: inv.status === 'paid' ? '#D1FAE5' : '#FEF3C7',
                          color: inv.status === 'paid' ? '#065F46' : '#92400E',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                      </select>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {inv.status !== 'paid' && (
                        <button
                          onClick={() => handleMarkAsPaid(inv)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#10B981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            marginRight: '8px',
                          }}
                        >
                          Mark as Paid
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(inv.id)}
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
    </div>
  );
}
