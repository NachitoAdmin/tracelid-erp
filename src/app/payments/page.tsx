'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PaymentsPage() {
  const [formData, setFormData] = useState({
    vendor_id: '',
    vendor_name: '',
    material_id: '',
    material_name: '',
    quantity: '1',
    quantity_unit: 'PCS',
    cost_center: '',
    amount_paid: '',
    payment_date: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const tenantId = localStorage.getItem('tracelid-selected-tenant');
      const token = localStorage.getItem('tracelid-token');
      
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity),
          amount_paid: parseFloat(formData.amount_paid),
          tenant_id: tenantId,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setFormData({
          vendor_id: '',
          vendor_name: '',
          material_id: '',
          material_name: '',
          quantity: '1',
          quantity_unit: 'PCS',
          cost_center: '',
          amount_paid: '',
          payment_date: new Date().toISOString().split('T')[0],
        });
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to record payment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ backgroundColor: '#fff', borderBottom: '1px solid #E5E7EB', padding: '16px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/" style={{ color: '#6C5CE7', textDecoration: 'none', fontSize: '0.9rem' }}>← Back to Dashboard</Link>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1F2937' }}>💳 Record Payment</h1>
        </div>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          {success && (
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: '8px' }}>
              ✅ Payment recorded successfully!
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Vendor ID *</label>
                <input
                  type="text"
                  required
                  value={formData.vendor_id}
                  onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                  placeholder="VEND-001"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '1rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Vendor Name *</label>
                <input
                  type="text"
                  required
                  value={formData.vendor_name}
                  onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                  placeholder="Acme Supplies"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '1rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Material ID *</label>
                <input
                  type="text"
                  required
                  value={formData.material_id}
                  onChange={(e) => setFormData({ ...formData, material_id: e.target.value })}
                  placeholder="MAT-001"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '1rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Material Name *</label>
                <input
                  type="text"
                  required
                  value={formData.material_name}
                  onChange={(e) => setFormData({ ...formData, material_name: e.target.value })}
                  placeholder="Raw Material A"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '1rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '1rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Unit</label>
                <select
                  value={formData.quantity_unit}
                  onChange={(e) => setFormData({ ...formData, quantity_unit: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '1rem' }}
                >
                  <option>PCS</option>
                  <option>KG</option>
                  <option>MTR</option>
                  <option>BOX</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Cost Center</label>
                <input
                  type="text"
                  value={formData.cost_center}
                  onChange={(e) => setFormData({ ...formData, cost_center: e.target.value })}
                  placeholder="CC-001"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '1rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Amount Paid *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.amount_paid}
                  onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '1rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Payment Date *</label>
                <input
                  type="date"
                  required
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '1rem' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#6C5CE7',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Recording...' : 'Record Payment'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
