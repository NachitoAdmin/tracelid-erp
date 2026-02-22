'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Delivery {
  id: string;
  sales_order_number: string;
  delivery_status: 'pending' | 'in_transit' | 'delivered';
  delivery_date: string | null;
  created_at: string;
  tenant_id: string;
}

interface SalesOrder {
  id: string;
  sales_order_number: string;
  customer_name: string;
  product_name: string;
  quantity: number;
  total_amount: number;
}

export default function DeliveryStatusPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [orders, setOrders] = useState<Record<string, SalesOrder>>({});
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_transit' | 'delivered'>('all');

  useEffect(() => {
    const stored = localStorage.getItem('tracelid-selected-tenant');
    if (stored) {
      setTenantId(stored);
      fetchData(stored);
    }
  }, []);

  const fetchData = async (tid: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('tracelid-token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [deliveriesRes, ordersRes] = await Promise.all([
        fetch(`/api/delivery-status?tenantId=${tid}`, { headers }),
        fetch(`/api/sales-orders?tenantId=${tid}`, { headers }),
      ]);

      if (deliveriesRes.ok) {
        const data = await deliveriesRes.json();
        setDeliveries(data);
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        const ordersMap: Record<string, SalesOrder> = {};
        ordersData.forEach((o: SalesOrder) => {
          ordersMap[o.sales_order_number] = o;
        });
        setOrders(ordersMap);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(id);
    setMessage('');

    try {
      const token = localStorage.getItem('tracelid-token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/delivery-status', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          id,
          delivery_status: newStatus,
          delivery_date: newStatus === 'delivered' ? new Date().toISOString() : null,
        }),
      });

      if (res.ok) {
        setMessage(`✅ Delivery marked as ${newStatus.replace('_', ' ')}! Invoice auto-generated.`);
        fetchData(tenantId);
      } else {
        const err = await res.json();
        setMessage(`❌ Error: ${err.error || 'Failed to update status'}`);
      }
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#F59E0B',
      in_transit: '#3B82F6',
      delivered: '#10B981',
    };
    const labels: Record<string, string> = {
      pending: 'Pending',
      in_transit: 'In Transit',
      delivered: 'Delivered',
    };
    return (
      <span
        style={{
          padding: '4px 12px',
          borderRadius: '12px',
          backgroundColor: colors[status] + '20',
          color: colors[status],
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
        }}
      >
        {labels[status]}
      </span>
    );
  };

  const getNextStatus = (current: string) => {
    const flow: Record<string, string> = {
      pending: 'in_transit',
      in_transit: 'delivered',
      delivered: 'delivered',
    };
    return flow[current];
  };

  const getNextStatusLabel = (current: string) => {
    const labels: Record<string, string> = {
      pending: 'Mark In Transit',
      in_transit: 'Mark Delivered',
      delivered: 'Delivered',
    };
    return labels[current];
  };

  const filteredDeliveries = deliveries.filter(d => 
    filter === 'all' ? true : d.delivery_status === filter
  );

  const pendingCount = deliveries.filter(d => d.delivery_status === 'pending').length;
  const inTransitCount = deliveries.filter(d => d.delivery_status === 'in_transit').length;
  const deliveredCount = deliveries.filter(d => d.delivery_status === 'delivered').length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#fff', borderBottom: '1px solid #E5E7EB', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" style={{ color: '#6C5CE7', textDecoration: 'none', fontSize: '0.9rem' }}>← Back to Dashboard</Link>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1F2937' }}>🚚 Delivery Status</h1>
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F59E0B' }}>{pendingCount}</div>
              <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>Pending</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3B82F6' }}>{inTransitCount}</div>
              <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>In Transit</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10B981' }}>{deliveredCount}</div>
              <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>Delivered</div>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {message && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              backgroundColor: message.startsWith('✅') ? '#D1FAE5' : '#FEE2E2',
              color: message.startsWith('✅') ? '#065F46' : '#991B1B',
            }}
          >
            {message}
          </div>
        )}

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {(['all', 'pending', 'in_transit', 'delivered'] as const).map((f) => (
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
              {f === 'all' ? 'All' : f === 'in_transit' ? 'In Transit' : f.charAt(0).toUpperCase() + f.slice(1)}
              {' '}
              ({f === 'all' ? deliveries.length : deliveries.filter(d => d.delivery_status === f).length})
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Loading...</div>
        ) : filteredDeliveries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#fff', borderRadius: '12px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🚚</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#1F2937' }}>No Deliveries Found</h3>
            <p style={{ color: '#6B7280' }}>
              {filter === 'all' 
                ? 'Deliveries are created automatically when you create a sales order.'
                : `No ${filter.replace('_', ' ')} deliveries found.`}
            </p>
          </div>
        ) : (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Order #</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Customer</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Product</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Qty</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Delivery Date</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeliveries.map((d) => {
                  const order = orders[d.sales_order_number];
                  return (
                    <tr key={d.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '16px', fontFamily: 'monospace', fontWeight: 600, color: '#6C5CE7' }}>{d.sales_order_number}</td>
                      <td style={{ padding: '16px', color: '#1F2937' }}>{order?.customer_name || '-'}</td>
                      <td style={{ padding: '16px', color: '#6B7280' }}>{order?.product_name || '-'}</td>
                      <td style={{ padding: '16px', color: '#6B7280' }}>{order?.quantity || '-'}</td>
                      <td style={{ padding: '16px' }}>{getStatusBadge(d.delivery_status)}</td>
                      <td style={{ padding: '16px', color: '#6B7280' }}>{d.delivery_date ? new Date(d.delivery_date).toLocaleDateString() : '-'}</td>
                      <td style={{ padding: '16px' }}>
                        {d.delivery_status !== 'delivered' ? (
                          <button
                            onClick={() => updateStatus(d.id, getNextStatus(d.delivery_status))}
                            disabled={updating === d.id}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: d.delivery_status === 'pending' ? '#F59E0B' : '#6C5CE7',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: updating === d.id ? 'not-allowed' : 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              opacity: updating === d.id ? 0.6 : 1,
                            }}
                          >
                            {updating === d.id ? 'Updating...' : getNextStatusLabel(d.delivery_status)}
                          </button>
                        ) : (
                          <span style={{ color: '#10B981', fontSize: '0.875rem', fontWeight: 600 }}>✓ Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
