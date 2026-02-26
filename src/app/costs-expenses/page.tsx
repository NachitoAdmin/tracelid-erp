'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/ThemeContext';

interface CostExpense {
  id: string;
  tenant_id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  vendor_name: string;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'operator';
  firstName: string;
  lastName: string;
  tenant: {
    id: string;
    name: string;
  };
}

type Category = 'materials' | 'services' | 'logistics' | 'overhead' | 'other';

export default function CostsExpensesPage() {
  const buildTime = '20260226-v2'
  const { isDark } = useTheme();
  const bgColor = isDark ? '#111827' : '#F1F5F9';
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const textColor = isDark ? '#F9FAFB' : '#1F2937';
  const borderColor = isDark ? '#374151' : '#E5E7EB';
  const inputBg = isDark ? '#374151' : '#F9FAFB';
  const mutedColor = isDark ? '#9CA3AF' : '#6B7280';

  const [costs, setCosts] = useState<CostExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tenantId, setTenantId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: 'materials' as Category,
    amount: 0,
    vendor_name: '',
  });

  useEffect(() => {
    const stored = localStorage.getItem('tracelid-selected-tenant');
    const storedName = localStorage.getItem('tracelid-selected-tenant-name');
    const userData = localStorage.getItem('tracelid-user');
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (e) {
        console.error('Failed to parse user data');
      }
    }
    
    if (stored) {
      setTenantId(stored);
      if (storedName) setTenantName(storedName);
      fetchCosts(stored);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCosts = async (tid: string) => {
    try {
      const token = localStorage.getItem('tracelid-token');
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      
      const response = await fetch(`/api/costs-expenses?tenantId=${tid}`, { headers });
      if (!response.ok) throw new Error('Failed to fetch costs');
      const data = await response.json();
      setCosts(data);
    } catch (err) {
      console.error('Error fetching costs:', err);
      setMessage('❌ Failed to load costs/expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      setMessage('❌ No tenant selected');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const token = localStorage.getItem('tracelid-token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch('/api/costs-expenses', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...formData,
          tenant_id: tenantId,
        }),
      });

      if (!response.ok) throw new Error('Failed to create cost/expense');

      setMessage('✅ Cost/expense created successfully!');
      setShowCreateModal(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: 'materials',
        amount: 0,
        vendor_name: '',
      });
      fetchCosts(tenantId);
    } catch (err) {
      console.error('Error creating cost:', err);
      setMessage('❌ Failed to create cost/expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cost/expense?')) return;

    try {
      const token = localStorage.getItem('tracelid-token');
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`/api/costs-expenses?id=${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) throw new Error('Failed to delete cost/expense');

      setMessage('✅ Cost/expense deleted successfully!');
      fetchCosts(tenantId);
    } catch (err) {
      console.error('Error deleting cost:', err);
      setMessage('❌ Failed to delete cost/expense');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenantId) return;

    setUploading(true);
    setMessage('');

    // TODO: Implement CSV upload logic
    setTimeout(() => {
      setMessage('✅ CSV upload feature coming soon!');
      setUploading(false);
    }, 1000);
  };

  const downloadTemplate = () => {
    const template = 'Date,Description,Category,Amount,VendorName\n2024-01-15,Office supplies,materials,250.00,Staples\n2024-01-16,Shipping,logistics,150.00,FedEx';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'costs_expenses_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalCosts = costs.reduce((sum, cost) => sum + parseFloat(String(cost.amount)), 0);

  const isOwnerOrAdmin = user?.role === 'owner' || user?.role === 'admin';

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading costs/expenses...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1>💸 Costs & Expenses</h1>
          <div style={styles.headerRight}>
            {tenantName && (
              <span style={styles.tenantBadge}>
                {tenantName}
              </span>
            )}
            <Link href="/" style={styles.backLink}>
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {message && (
          <div style={{
            ...styles.message,
            backgroundColor: message.startsWith('✅') ? '#D1FAE5' : '#FEE2E2',
            color: message.startsWith('✅') ? '#065F46' : '#991B1B',
          }}>
            {message}
          </div>
        )}

        {/* File Upload Section */}
        <div style={styles.uploadSection}>
          <h3>📥 Upload CSV</h3>
          <div style={styles.uploadBox}>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={uploading || !tenantId}
              style={styles.fileInput}
            />
            <button onClick={downloadTemplate} style={styles.templateBtn}>
              📥 Download Template
            </button>
          </div>
        </div>

        {/* Summary */}
        <div style={styles.summaryBox}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Total Entries</span>
            <span style={styles.summaryValue}>{costs.length}</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Total Costs</span>
            <span style={styles.summaryValue}>${totalCosts.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          {isOwnerOrAdmin && (
            <button onClick={() => setShowCreateModal(true)} style={styles.createBtn}>
              + Add Cost/Expense
            </button>
          )}
        </div>

        {/* Table */}
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Vendor</th>
                {isOwnerOrAdmin && <th style={styles.th}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {costs.length === 0 ? (
                <tr>
                  <td colSpan={isOwnerOrAdmin ? 6 : 5} style={styles.emptyCell}>
                    No costs/expenses found. {isOwnerOrAdmin && 'Click "Add Cost/Expense" to create one.'}
                  </td>
                </tr>
              ) : (
                costs.map((cost) => (
                  <tr key={cost.id}>
                    <td style={styles.td}>{new Date(cost.date).toLocaleDateString()}</td>
                    <td style={styles.td}>{cost.description || '-'}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.categoryBadge,
                        backgroundColor: getCategoryColor(cost.category),
                      }}>
                        {cost.category}
                      </span>
                    </td>
                    <td style={styles.td}>${parseFloat(String(cost.amount)).toFixed(2)}</td>
                    <td style={styles.td}>{cost.vendor_name || '-'}</td>
                    {isOwnerOrAdmin && (
                      <td style={styles.td}>
                        <button
                          onClick={() => handleDelete(cost.id)}
                          style={styles.deleteBtn}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Add Cost/Expense</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                  required
                  style={styles.input}
                >
                  <option value="materials">Materials</option>
                  <option value="services">Services</option>
                  <option value="logistics">Logistics</option>
                  <option value="overhead">Overhead</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Vendor Name</label>
                <input
                  type="text"
                  value={formData.vendor_name}
                  onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                  placeholder="Vendor/supplier name"
                  style={styles.input}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={styles.cancelBtn}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.submitBtn}
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    materials: '#3B82F6',
    services: '#10B981',
    logistics: '#F59E0B',
    overhead: '#EF4444',
    other: '#6B7280',
  };
  return colors[category] || colors.other;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F1F5F9',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '1.1rem',
    color: '#6B7280',
  },
  header: {
    backgroundColor: 'white',
    borderBottom: '1px solid #E5E7EB',
    padding: '20px 40px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  tenantBadge: {
    padding: '6px 12px',
    backgroundColor: '#EDE9FE',
    color: '#6C5CE7',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: 600,
  },
  backLink: {
    color: '#6C5CE7',
    textDecoration: 'none',
    fontWeight: 600,
  },
  main: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '32px 40px',
  },
  message: {
    padding: '15px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontWeight: 600,
  },
  uploadSection: {
    backgroundColor: '#FFFFFF', borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  uploadBox: {
    border: '2px dashed #E5E7EB',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  fileInput: {
    fontSize: '0.9rem',
  },
  templateBtn: {
    padding: '10px 20px',
    backgroundColor: '#F3F4F6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  summaryBox: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  summaryItem: {
    backgroundColor: '#FFFFFF', borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  summaryLabel: {
    fontSize: '0.875rem',
    color: '#6B7280',
    fontWeight: 500,
  },
  summaryValue: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#1F2937',
  },
  actions: {
    marginBottom: '20px',
    display: 'flex',
    gap: '12px',
  },
  createBtn: {
    padding: '12px 24px',
    backgroundColor: '#6C5CE7',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '1rem',
  },
  tableWrapper: {
    backgroundColor: '#FFFFFF', borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '16px',
    textAlign: 'left',
    backgroundColor: '#F9FAFB',
    color: '#374151',
    fontWeight: 600,
    fontSize: '0.875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  td: {
    padding: '16px',
    borderTop: '1px solid #E5E7EB',
    color: '#1F2937',
  },
  emptyCell: {
    padding: '40px',
    textAlign: 'center',
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  categoryBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: 600,
    display: 'inline-block',
  },
  deleteBtn: {
    padding: '6px 12px',
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 600,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#FFFFFF', borderRadius: '16px',
    padding: '32px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalTitle: {
    margin: '0 0 24px 0',
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1F2937',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#374151',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '1rem',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '8px',
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#F3F4F6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  submitBtn: {
    padding: '10px 20px',
    backgroundColor: '#6C5CE7',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
  },
};
