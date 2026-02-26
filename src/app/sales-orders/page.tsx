'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/ThemeContext';
import { useLanguage } from '@/lib/LanguageContext';
import { useCurrency } from '@/lib/CurrencyContext';
import { formatCurrency } from '@/lib/currency';

interface Customer {
  id: string;
  customer_code: string;
  name: string;
  country: string;
  city: string;
  email: string;
}

interface Product {
  id: string;
  product_code: string;
  name: string;
  uom: string;
  standard_cost: number;
  sales_price: number;
}

interface GLAccount {
  id: string;
  account_code: string;
  name: string;
  type: string;
  is_postable: boolean;
}

interface SalesOrder {
  id: string;
  sales_order_number: string;
  customer_id: string;
  customer_name: string;
  product_id: string;
  product_name: string;
  quantity: number;
  quantity_unit: string;
  price: number;
  total_amount: number;
  country: string;
  cost_center: string;
  profit_center: string;
  status: 'pending' | 'processing' | 'cancelled' | 'delivered' | 'invoiced';
  transaction_type: 'SALE' | 'COST' | 'RETURN';
  created_at: string;
}

type TransactionType = 'SALE' | 'COST' | 'RETURN';

export default function SalesOrdersPage() {
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

  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [glAccounts, setGlAccounts] = useState<GLAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tenantId, setTenantId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Searchable dropdown states
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    product_id: '',
    product_name: '',
    quantity: 1,
    quantity_unit: 'PCS',
    price: 0,
    country: 'US',
    cost_center: '',
    profit_center: '',
    transaction_type: 'SALE' as TransactionType,
    gl_account_id: '',
    is_damaged_return: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem('tracelid-selected-tenant');
    if (stored) {
      setTenantId(stored);
      fetchOrders(stored);
      fetchMasterData(stored);
    }
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
      }
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-calculate total when quantity or price changes
  const totalAmount = formData.quantity * formData.price;

  const fetchOrders = async (tid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sales-orders?tenantId=${tid}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('tracelid-token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/sales-orders', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        const savedTenantId = localStorage.getItem('tracelid-selected-tenant');
        if (savedTenantId) {
          fetchOrders(savedTenantId);
        }
        setDeleteConfirmId(null);
      } else {
        console.error('Failed to delete sales order');
      }
    } catch (err) {
      console.error('Error deleting sales order:', err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('tracelid-token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/sales-orders', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        const savedTenantId = localStorage.getItem('tracelid-selected-tenant');
        if (savedTenantId) {
          fetchOrders(savedTenantId);
        }
        setStatusMessage('Status updated successfully');
        setTimeout(() => setStatusMessage(''), 3000);
      } else {
        console.error('Failed to update status');
        setStatusMessage('Failed to update status');
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setStatusMessage('Failed to update status');
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const fetchMasterData = async (tid: string) => {
    try {
      const [customersRes, productsRes, glRes] = await Promise.all([
        fetch(`/api/customers?tenantId=${tid}`),
        fetch(`/api/products?tenantId=${tid}`),
        fetch(`/api/gl-accounts?tenantId=${tid}&isPostable=true`),
      ]);

      if (customersRes.ok) {
        const data = await customersRes.json();
        setCustomers(data);
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data);
      }
      if (glRes.ok) {
        const data = await glRes.json();
        setGlAccounts(data);
      }
    } catch (err) {
      console.error('Failed to fetch master data:', err);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setFormData(prev => ({
      ...prev,
      customer_id: customer.id,
      customer_name: customer.name,
    }));
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
  };

  const handleProductSelect = (product: Product) => {
    setFormData(prev => ({
      ...prev,
      product_id: product.id,
      product_name: product.name,
      price: product.sales_price || 0,
      quantity_unit: product.uom || 'PCS',
    }));
    setProductSearch(`${product.name} (${product.product_code}) - ${formatCurrency(product.sales_price, currency)}`);
    setShowProductDropdown(false);
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.customer_code.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.product_code.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Filter GL accounts for COST transactions (COGS/OPEX types only)
  const filteredGLAccounts = glAccounts.filter(gl =>
    gl.type === 'COGS' || gl.type === 'OPEX'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const orderData = {
        ...formData,
        total_amount: totalAmount,
        tenant_id: tenantId,
      };
      console.log('Creating order with:', JSON.stringify(orderData, null, 2));

      const res = await fetch('/api/sales-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        setMessage('✅ Sales order created successfully!');
        setShowCreateModal(false);
        resetForm();
        fetchOrders(tenantId);
      } else {
        const err = await res.json();
        setMessage(`❌ Error: ${err.error || 'Failed to create order'}`);
      }
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      customer_name: '',
      product_id: '',
      product_name: '',
      quantity: 1,
      quantity_unit: 'PCS',
      price: 0,
      country: 'US',
      cost_center: '',
      profit_center: '',
      transaction_type: 'SALE',
      gl_account_id: '',
      is_damaged_return: false,
    });
    setCustomerSearch('');
    setProductSearch('');
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#F59E0B',
      delivered: '#10B981',
      invoiced: '#6C5CE7',
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
        {status}
      </span>
    );
  };

  const getTransactionTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      SALE: '#10B981',
      COST: '#EF4444',
      RETURN: '#F59E0B',
    };
    return (
      <span
        style={{
          padding: '4px 8px',
          borderRadius: '6px',
          backgroundColor: colors[type] + '20',
          color: colors[type],
          fontSize: '0.7rem',
          fontWeight: 600,
          textTransform: 'uppercase',
        }}
      >
        {type}
      </span>
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{ backgroundColor: cardBg, borderBottom: '1px solid #E5E7EB', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" style={{ color: '#6C5CE7', textDecoration: 'none', fontSize: '0.9rem' }}>← {t('back')}</Link>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1F2937' }}>📋 {t('salesOrders')}</h1>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
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
            + {t('createOrder')}
          </button>
        </div>
      </header>

      {/* Content */}
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
        
        {statusMessage && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              backgroundColor: statusMessage.includes('success') ? '#D1FAE5' : '#FEE2E2',
              color: statusMessage.includes('success') ? '#065F46' : '#991B1B',
            }}
          >
            {statusMessage}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>{t('loading')}</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#fff', borderRadius: '12px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#1F2937' }}>No Sales Orders Yet</h3>
            <p style={{ color: '#6B7280', marginBottom: '24px' }}>Create your first sales order to get started.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6C5CE7',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              + Create First Order
            </button>
          </div>
        ) : (
          <div style={{ backgroundColor: cardBg, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: inputBg }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: textColor, textTransform: 'uppercase' }}>{t('orderNumber')}</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: textColor, textTransform: 'uppercase' }}>Type</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: textColor, textTransform: 'uppercase' }}>{t('customer')}</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: textColor, textTransform: 'uppercase' }}>{t('product')}</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: textColor, textTransform: 'uppercase' }}>{t('quantity')}</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: textColor, textTransform: 'uppercase' }}>{t('price')}</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: textColor, textTransform: 'uppercase' }}>{t('total')}</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: textColor, textTransform: 'uppercase' }}>{t('status')}</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: textColor, textTransform: 'uppercase' }}>{t('date')}</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: textColor, textTransform: 'uppercase' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} style={{ borderTop: `1px solid ${borderColor}` }}>
                    <td style={{ padding: '16px', fontFamily: 'monospace', fontWeight: 600, color: '#6C5CE7' }}>{order.sales_order_number}</td>
                    <td style={{ padding: '16px' }}>{getTransactionTypeBadge(order.transaction_type || 'SALE')}</td>
                    <td style={{ padding: '16px', color: textColor }}>{order.customer_name}</td>
                    <td style={{ padding: '16px', color: textColor }}>{order.product_name}</td>
                    <td style={{ padding: '16px', color: textColor }}>{order.quantity} {order.quantity_unit}</td>
                    <td style={{ padding: '16px', color: textColor }}>{formatCurrency(order.price, currency)}</td>
                    <td style={{ padding: '16px', fontWeight: 600, color: textColor }}>{formatCurrency(order.total_amount, currency)}</td>
                    <td style={{ padding: '16px' }}>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${borderColor}`,
                          fontSize: '0.875rem',
                          backgroundColor: inputBg,
                          color: textColor,
                          cursor: 'pointer',
                        }}
                      >
                        <option value="pending">{t('pending')}</option>
                        <option value="processing">Processing</option>
                        <option value="cancelled">{t('cancelled')}</option>
                      </select>
                    </td>
                    <td style={{ padding: '16px', color: textColor, fontSize: '0.875rem' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '16px' }}>
                      {deleteConfirmId === order.id ? (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <button
                            onClick={() => handleDelete(order.id)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#EF4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#6B7280',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(order.id)}
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
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: cardBg,
              padding: '32px',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '700px',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            <h2 style={{ margin: '0 0 24px 0', color: textColor }}>{t('newSalesOrder')}</h2>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                
                {/* Transaction Type */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: textColor }}>
                    Transaction Type *
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {(['SALE', 'COST', 'RETURN'] as TransactionType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, transaction_type: type }))}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          borderRadius: '8px',
                          border: '2px solid',
                          borderColor: formData.transaction_type === type ? '#6C5CE7' : '#E5E7EB',
                          backgroundColor: formData.transaction_type === type ? '#6C5CE720' : '#fff',
                          color: formData.transaction_type === type ? '#6C5CE7' : '#374151',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Customer Searchable Dropdown */}
                <div style={{ gridColumn: 'span 2' }} ref={customerDropdownRef}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: textColor }}>
                    {t('customer')} *
                  </label>
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    placeholder="Search customers..."
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: `1px solid ${borderColor}`,
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      backgroundColor: inputBg,
                      color: textColor,
                    }}
                  />
                  {showCustomerDropdown && filteredCustomers.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        zIndex: 10,
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        marginTop: '4px',
                        maxHeight: '200px',
                        overflow: 'auto',
                        width: 'calc(100% - 64px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    >
                      {filteredCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => handleCustomerSelect(customer)}
                          style={{
                            padding: '10px 14px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #F3F4F6',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                        >
                          <div style={{ fontWeight: 600, color: '#1F2937' }}>{customer.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                            {customer.customer_code} • {customer.city}{customer.city && customer.country ? ', ' : ''}{customer.country}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {customers.length === 0 && (
                    <p style={{ fontSize: '0.8rem', color: '#F59E0B', marginTop: '4px' }}>
                      No customers found. Please add customers in Master Data first.
                    </p>
                  )}
                </div>

                {/* Product Searchable Dropdown */}
                <div style={{ gridColumn: 'span 2' }} ref={productDropdownRef}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: textColor }}>
                    {t('product')} *
                  </label>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    placeholder="Search products..."
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: `1px solid ${borderColor}`,
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      backgroundColor: inputBg,
                      color: textColor,
                    }}
                  />
                  {showProductDropdown && filteredProducts.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        zIndex: 10,
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        marginTop: '4px',
                        maxHeight: '200px',
                        overflow: 'auto',
                        width: 'calc(100% - 64px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    >
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => handleProductSelect(product)}
                          style={{
                            padding: '10px 14px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #F3F4F6',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                        >
                          <div style={{ fontWeight: 600, color: '#1F2937' }}>{product.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                            {product.product_code} • {formatCurrency(product.sales_price, currency)} / {product.uom}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {products.length === 0 && (
                    <p style={{ fontSize: '0.8rem', color: '#F59E0B', marginTop: '4px' }}>
                      No products found. Please add products in Master Data first.
                    </p>
                  )}
                </div>

                {/* GL Account Dropdown - Only for COST transactions */}
                {formData.transaction_type === 'COST' && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: textColor }}>
                      GL Account (COGS/OPEX) *
                    </label>
                    <select
                      value={formData.gl_account_id}
                      onChange={(e) => setFormData({ ...formData, gl_account_id: e.target.value })}
                      required={formData.transaction_type === 'COST'}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: `1px solid ${borderColor}`,
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        backgroundColor: inputBg,
                        color: textColor,
                      }}
                    >
                      <option value="">Select GL account...</option>
                      {filteredGLAccounts.map((gl) => (
                        <option key={gl.id} value={gl.id}>
                          {gl.account_code} - {gl.name} ({gl.type})
                        </option>
                      ))}
                    </select>
                    {filteredGLAccounts.length === 0 && (
                      <p style={{ fontSize: '0.8rem', color: '#F59E0B', marginTop: '4px' }}>
                        No postable COGS/OPEX accounts found. Please add GL accounts in Master Data.
                      </p>
                    )}
                  </div>
                )}

                {/* Return Damaged Checkbox - Only for RETURN transactions */}
                {formData.transaction_type === 'RETURN' && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px',
                        backgroundColor: '#FEF3C7',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.is_damaged_return}
                        onChange={(e) => setFormData({ ...formData, is_damaged_return: e.target.checked })}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <span style={{ fontWeight: 600, color: '#92400E' }}>
                        Return is damaged?
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#B45309' }}>
                        (Yes → DAMAGE_COST | No → Net off original sale)
                      </span>
                    </label>
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: textColor }}>
                    {t('quantity')} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: `1px solid ${borderColor}`,
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      backgroundColor: inputBg,
                      color: textColor,
                    }}
                  />
                </div>

                {/* Quantity Unit */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: textColor }}>
                    Unit *
                  </label>
                  <select
                    value={formData.quantity_unit}
                    onChange={(e) => setFormData({ ...formData, quantity_unit: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: `1px solid ${borderColor}`,
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      backgroundColor: inputBg,
                      color: textColor,
                    }}
                  >
                    <option value="PCS">PCS (Pieces)</option>
                    <option value="KG">KG (Kilograms)</option>
                    <option value="LB">LB (Pounds)</option>
                    <option value="BOX">BOX</option>
                    <option value="PALLET">PALLET</option>
                    <option value="LTR">LTR (Liters)</option>
                    <option value="MTR">MTR (Meters)</option>
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: textColor }}>
                    {t('price')} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: `1px solid ${borderColor}`,
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      backgroundColor: inputBg,
                      color: textColor,
                    }}
                  />
                </div>

                {/* Total Amount (Read-only) */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: textColor }}>
                    {t('total')}
                  </label>
                  <input
                    type="text"
                    value={formatCurrency(totalAmount, currency)}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: `1px solid ${borderColor}`,
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      backgroundColor: inputBg,
                      fontWeight: 600,
                      color: '#6C5CE7',
                    }}
                  />
                </div>

                {/* Country */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: textColor }}>
                    Country
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: `1px solid ${borderColor}`,
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      backgroundColor: inputBg,
                      color: textColor,
                    }}
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="MX">Mexico</option>
                    <option value="GB">United Kingdom</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="ES">Spain</option>
                    <option value="IT">Italy</option>
                    <option value="NL">Netherlands</option>
                    <option value="AU">Australia</option>
                    <option value="JP">Japan</option>
                    <option value="CN">China</option>
                    <option value="IN">India</option>
                    <option value="BR">Brazil</option>
                  </select>
                </div>

                {/* Cost Center */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: textColor }}>
                    Cost Center
                  </label>
                  <input
                    type="text"
                    value={formData.cost_center}
                    onChange={(e) => setFormData({ ...formData, cost_center: e.target.value })}
                    placeholder="e.g., CC-001"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: `1px solid ${borderColor}`,
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      backgroundColor: inputBg,
                      color: textColor,
                    }}
                  />
                </div>

                {/* Profit Center */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: textColor }}>
                    Profit Center
                  </label>
                  <input
                    type="text"
                    value={formData.profit_center}
                    onChange={(e) => setFormData({ ...formData, profit_center: e.target.value })}
                    placeholder="e.g., PC-001"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: `1px solid ${borderColor}`,
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      backgroundColor: inputBg,
                      color: textColor,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#F3F4F6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.customer_id || !formData.product_id}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#6C5CE7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    opacity: submitting || !formData.customer_id || !formData.product_id ? 0.6 : 1,
                  }}
                >
                  {submitting ? t('loading') : t('createOrder')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
