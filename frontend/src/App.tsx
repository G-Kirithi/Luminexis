import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { socket } from './socket';

import CategoryManager from './pages/Admin/CategoryManager';
import LoginSelection from './pages/LoginSelection';
import PosDashboard from './pages/POS/PosDashboard';
import NewOrderPage from './pages/POS/NewOrderPage';
import PaymentPage from './pages/POS/PaymentPage';
import KitchenPanel from './pages/Kitchen/KitchenPanel';
import CustomerPage from './pages/Customer/CustomerPage';
import FranchiseSelector from './pages/FranchiseSelector';
import SuperAdminPanel from './pages/SuperAdminPanel';
import { OrderProvider, useOrders } from './store/OrderContext';
import { getInventory, getComplaints, updateComplaintStatus } from './api';

interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  unit: string | null;
  is_scarce: boolean;
  expiry_date: string | null;
  notes: string | null;
  last_updated: string;
}

const AdminDashboard = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  // Orders Log
  const { orders, refreshOrders } = useOrders();
  const [orderSearch, setOrderSearch] = useState('');

  // Complaints state
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);

  const fetchComplaints = async () => {
    try {
      setLoadingComplaints(true);
      const data = await getComplaints();
      setComplaints(data);
    } catch (err) {
      console.error('Failed to load complaints in admin:', err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleApproveRefund = async (complaintId: number, orderId: string, amount: number) => {
    if (!window.confirm(`Are you sure you want to approve the refund of $${amount.toFixed(2)} for ${orderId}?`)) {
      return;
    }
    try {
      await updateComplaintStatus(complaintId, 'Approved', amount);
      alert('Refund approved successfully!');
      await fetchComplaints();
      await refreshOrders();
    } catch (err) {
      console.error('Failed to approve refund:', err);
      alert('Failed to approve refund.');
    }
  };

  const handleRejectRefund = async (complaintId: number) => {
    if (!window.confirm('Are you sure you want to reject this complaint/refund request?')) {
      return;
    }
    try {
      await updateComplaintStatus(complaintId, 'Rejected');
      alert('Refund request rejected.');
      await fetchComplaints();
    } catch (err) {
      console.error('Failed to reject refund:', err);
      alert('Failed to reject refund.');
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await getInventory();
      setInventory(data);
    } catch (err) {
      console.error('Failed to load inventory in admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const getDaysUntilExpiry = (dateStr: string | null) => {
    if (!dateStr) return null;
    const expiry = new Date(dateStr);
    const now = new Date();
    expiry.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Stats
  const totalItems = inventory.length;
  const scarceItems = inventory.filter(i => i.is_scarce || i.quantity <= 0);
  const expiringItems = inventory.filter(i => {
    const days = getDaysUntilExpiry(i.expiry_date);
    return days !== null && days >= 0 && days <= 7;
  });
  const expiredItems = inventory.filter(i => {
    const days = getDaysUntilExpiry(i.expiry_date);
    return days !== null && days < 0;
  });

  const filteredOrders = orders.filter(order => {
    const term = orderSearch.toLowerCase();
    return (
      order.order_id.toLowerCase().includes(term) ||
      (order.customer_id && `cust-${order.customer_id}`.toLowerCase().includes(term)) ||
      order.customer_name.toLowerCase().includes(term)
    );
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (scarceItems.length === 0) return;
    const headers = ['Item Name', 'Current Stock', 'Unit', 'Notes'];
    const rows = scarceItems.map(i => [
      i.name,
      i.quantity,
      i.unit || 'units',
      i.notes || ''
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `restock_checklist_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
      <style>
        {`
          .admin-stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 1.5rem;
          }
          .stat-card {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1.5rem;
            border-radius: var(--card-radius);
          }
          .stat-icon {
            font-size: 2.5rem;
            opacity: 0.8;
          }
          .stat-info {
            display: flex;
            flex-direction: column;
          }
          .stat-value {
            font-size: 2rem;
            font-weight: 800;
            line-height: 1.1;
          }
          .stat-label {
            font-size: 0.85rem;
            color: var(--text-muted);
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .restock-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
          }
          .restock-table th, .restock-table td {
            text-align: left;
            padding: 0.8rem 1rem;
            border-bottom: 1px solid var(--surface-border);
          }
          .restock-table th {
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted);
            font-weight: 600;
          }
          .restock-table tbody tr:hover {
            background: rgba(255,255,255,0.02);
          }
          .restock-checkbox {
            width: 18px;
            height: 18px;
            cursor: pointer;
          }
          .row-checked {
            text-decoration: line-through;
            opacity: 0.4;
          }
          .checklist-actions {
            display: flex;
            gap: 1rem;
            margin-top: 1.5rem;
          }
          .expiring-list {
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
            margin-top: 1rem;
          }
          .expiring-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(0,0,0,0.15);
            padding: 0.8rem 1rem;
            border-radius: 8px;
            border-left: 3px solid;
          }
          .expiring-item.warning {
            border-left-color: var(--warning-color);
          }
          .expiring-item.danger {
            border-left-color: var(--accent-color);
          }
          
          /* Orders Log styles */
          .orders-log-card {
            background: rgba(33, 37, 41, 0.55);
            border-radius: var(--card-radius);
            padding: 1.5rem;
          }
          .orders-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
          }
          .orders-table th, .orders-table td {
            text-align: left;
            padding: 0.8rem 1rem;
            border-bottom: 1px solid var(--surface-border);
          }
          .orders-table th {
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted);
            font-weight: 600;
          }
          .orders-table tbody tr:hover {
            background: rgba(255,255,255,0.02);
          }
          .status-badge {
            font-size: 0.72rem;
            font-weight: 700;
            padding: 0.25rem 0.65rem;
            border-radius: 999px;
            letter-spacing: 0.3px;
            border: 1px solid currentColor;
            display: inline-block;
            text-transform: uppercase;
          }
          .status-badge.status-pending {
            background: rgba(51, 154, 240, 0.15);
            color: var(--primary-color);
          }
          .status-badge.status-cooking {
            background: rgba(252, 196, 25, 0.15);
            color: var(--warning-color);
          }
          .status-badge.status-ready {
            background: rgba(81, 207, 102, 0.15);
            color: var(--success-color);
          }
          .status-badge.status-completed {
            background: rgba(134, 142, 150, 0.15);
            color: var(--text-muted);
          }
          .status-badge.status-cancelled {
            background: rgba(255, 107, 107, 0.15);
            color: var(--accent-color);
          }
          .order-search-input {
            width: 100%;
            max-width: 360px;
            margin-bottom: 1.25rem;
          }
          
          @media print {
            body {
              background: white !important;
              color: black !important;
            }
            nav, button, header, .outline, .glass-card:not(.restock-checklist-card), h1, p, .admin-stats-grid, .expiring-tracker-card, .orders-log-card {
              display: none !important;
            }
            .restock-checklist-card {
              border: none !important;
              box-shadow: none !important;
              background: transparent !important;
              color: black !important;
              width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .restock-checklist-card h2 {
              color: black !important;
              margin-bottom: 1.5rem !important;
              font-size: 1.8rem !important;
            }
            .restock-table {
              color: black !important;
              border-collapse: collapse !important;
              width: 100% !important;
              margin-top: 1rem !important;
            }
            .restock-table th, .restock-table td {
              border: 1px solid #ddd !important;
              padding: 10px !important;
              color: black !important;
            }
            .restock-table th {
              background-color: #f5f5f5 !important;
            }
          }
        `}
      </style>

      <div className="glass-card">
        <h1>Admin Dashboard</h1>
        <p className="text-muted">Configure Products, Users, Categories, and Track Kitchen Inventory Status.</p>
      </div>

      {/* Stats Widgets */}
      <div className="admin-stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <span className="stat-value">{totalItems}</span>
            <span className="stat-label">Total Items</span>
          </div>
        </div>
        
        <div className="glass-card stat-card" style={{ borderColor: scarceItems.length > 0 ? 'rgba(255,107,107,0.3)' : 'inherit' }}>
          <div className="stat-icon" style={{ color: scarceItems.length > 0 ? 'var(--accent-color)' : 'inherit' }}>⚠️</div>
          <div className="stat-info">
            <span className="stat-value" style={{ color: scarceItems.length > 0 ? 'var(--accent-color)' : 'inherit' }}>{scarceItems.length}</span>
            <span className="stat-label">Scarce / Low Stock</span>
          </div>
        </div>

        <div className="glass-card stat-card" style={{ borderColor: expiringItems.length > 0 ? 'rgba(252,196,25,0.3)' : 'inherit' }}>
          <div className="stat-icon" style={{ color: expiringItems.length > 0 ? 'var(--warning-color)' : 'inherit' }}>📅</div>
          <div className="stat-info">
            <span className="stat-value" style={{ color: expiringItems.length > 0 ? 'var(--warning-color)' : 'inherit' }}>{expiringItems.length}</span>
            <span className="stat-label">Expiring Soon (≤7d)</span>
          </div>
        </div>

        <div className="glass-card stat-card" style={{ borderColor: expiredItems.length > 0 ? 'rgba(255,107,107,0.3)' : 'inherit' }}>
          <div className="stat-icon" style={{ color: expiredItems.length > 0 ? 'var(--accent-color)' : 'inherit' }}>🚨</div>
          <div className="stat-info">
            <span className="stat-value" style={{ color: expiredItems.length > 0 ? 'var(--accent-color)' : 'inherit' }}>{expiredItems.length}</span>
            <span className="stat-label">Expired Items</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        {/* Restock Checklist Widget */}
        <div className="glass-card restock-checklist-card">
          <h2>🛒 Restock Checklist</h2>
          <p className="text-muted">Items currently flagged as scarce or low stock. Tick them off as you complete purchases.</p>
          
          {loading ? (
            <p>Loading restock checklist...</p>
          ) : scarceItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--success-color)' }}>
              <h3>✅ All Stock Levels Healthy!</h3>
              <p className="text-muted">No items are currently scarce or out of stock.</p>
            </div>
          ) : (
            <div>
              <table className="restock-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>Item Name</th>
                    <th>Current Qty</th>
                    <th>Unit</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {scarceItems.map(item => {
                    const isChecked = !!checkedItems[item.id];
                    return (
                      <tr key={item.id} className={isChecked ? 'row-checked' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => setCheckedItems(prev => ({ ...prev, [item.id]: e.target.checked }))}
                            className="restock-checkbox"
                          />
                        </td>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td style={{ color: item.quantity <= 0 ? 'var(--accent-color)' : 'var(--warning-color)' }}>
                          {item.quantity}
                        </td>
                        <td className="text-muted">{item.unit || 'units'}</td>
                        <td className="text-muted" style={{ fontSize: '0.85rem' }}>{item.notes || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="checklist-actions">
                <button onClick={handlePrint} className="outline">
                  🖨️ Print Checklist
                </button>
                <button onClick={handleExportCSV} className="outline">
                  📥 Export as CSV
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Expiring / Expired Alert tracker */}
        {((expiringItems.length > 0) || (expiredItems.length > 0)) && (
          <div className="glass-card expiring-tracker-card">
            <h2>⚠️ Food Safety & Expiry Alert</h2>
            <p className="text-muted">Monitor items that are already expired or reaching their expiry date soon.</p>
            
            <div className="expiring-list">
              {expiredItems.map(item => (
                <div key={item.id} className="expiring-item danger">
                  <div>
                    <strong style={{ color: 'var(--accent-color)' }}>[EXPIRED]</strong> {item.name}
                    <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }} className="text-muted">
                      {item.notes}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>EXPIRED</span>
                    <div style={{ fontSize: '0.75rem' }} className="text-muted">
                      Exp: {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : ''}
                    </div>
                  </div>
                </div>
              ))}

              {expiringItems.map(item => {
                const days = getDaysUntilExpiry(item.expiry_date);
                return (
                  <div key={item.id} className="expiring-item warning">
                    <div>
                      <strong style={{ color: 'var(--warning-color)' }}>[EXPIRING SOON]</strong> {item.name}
                      <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }} className="text-muted">
                        {item.notes}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: 'var(--warning-color)', fontWeight: 'bold' }}>In {days} Days</span>
                      <div style={{ fontSize: '0.75rem' }} className="text-muted">
                        Exp: {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Orders Log Widget */}
        <div className="glass-card orders-log-card">
          <h2>🧾 Order Transactions Log</h2>
          <p className="text-muted">Real-time log of customer orders, payment details, and status.</p>
          
          <input
            type="text"
            placeholder="Search by Order ID, Customer ID, or Customer Name..."
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            className="order-search-input"
          />

          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--surface-border)', borderRadius: '8px' }}>
            {filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No orders found.
              </div>
            ) : (
              <table className="orders-table">
                <thead style={{ position: 'sticky', top: 0, background: '#14181e', zIndex: 1 }}>
                  <tr>
                    <th>Order Reference</th>
                    <th>Customer ID</th>
                    <th>Customer Name</th>
                    <th>Payment Method</th>
                    <th>Payment Status</th>
                    <th>Total Bill</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600 }}>
                        <span style={{ color: 'var(--primary-color)' }}>{order.order_id}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>(ID: {order.id})</span>
                      </td>
                      <td style={{ fontFamily: 'monospace' }}>
                        {order.customer_id ? `CUST-${order.customer_id}` : 'Walk-in'}
                      </td>
                      <td>{order.customer_name}</td>
                      <td>
                        <span style={{ fontSize: '0.85rem' }}>
                          {order.payment_method === 'Cash' && '💵 Cash'}
                          {order.payment_method === 'Card' && '💳 Card'}
                          {order.payment_method === 'UPI' && '📱 UPI'}
                          {!order.payment_method && 'Not Specified'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${order.status.toLowerCase()}`}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: '#fff' }}>
                        ${order.total_bill.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Complaints & Refunds Desk Widget */}
        <div className="glass-card">
          <h2>💬 Customer Complaints & Refunds Desk</h2>
          <p className="text-muted">Review customer complaints, view uploaded photo evidence, and process refund claims.</p>

          {loadingComplaints ? (
            <p>Loading complaints list...</p>
          ) : complaints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--success-color)' }}>
              <h3>✅ No Pending Tickets!</h3>
              <p className="text-muted">All customer complaints and refunds have been processed.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
              {complaints.map(t => {
                const isPendingRefund = t.is_refund_request && t.refund_status === 'Pending';
                
                return (
                  <div
                    key={t.id}
                    style={{
                      background: 'rgba(0,0,0,0.15)',
                      border: '1px solid var(--surface-border)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{t.customer_name}</h3>
                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>Phone: {t.customer_phone}</span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                          {new Date(t.created_at).toLocaleString()}
                        </span>
                        
                        <span
                          className="status-badge"
                          style={{
                            borderColor: t.refund_status === 'Approved' ? 'var(--success-color)' : t.refund_status === 'Rejected' ? 'var(--accent-color)' : 'var(--warning-color)',
                            color: t.refund_status === 'Approved' ? 'var(--success-color)' : t.refund_status === 'Rejected' ? 'var(--accent-color)' : 'var(--warning-color)',
                            background: t.refund_status === 'Approved' ? 'rgba(81,207,102,0.1)' : t.refund_status === 'Rejected' ? 'rgba(255,107,107,0.1)' : 'rgba(252,196,25,0.1)'
                          }}
                        >
                          {t.is_refund_request ? `Refund ${t.refund_status}` : 'Complaint'}
                        </span>
                      </div>
                    </div>

                    {t.is_refund_request && (
                      <div style={{
                        background: 'rgba(252,196,25,0.1)',
                        border: '1px solid var(--warning-color)',
                        borderRadius: '8px',
                        padding: '0.8rem 1.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.95rem'
                      }}>
                        <span>⚠️ <strong>Refund Claim:</strong> Order <strong style={{ color: 'var(--primary-color)' }}>{t.order_id}</strong> needs a refund of <strong>${t.refund_amount.toFixed(2)}</strong></span>
                      </div>
                    )}

                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                      {t.message}
                    </div>

                    {t.photo_url && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <span className="text-muted" style={{ fontSize: '0.8rem' }}>Attachment (click to enlarge):</span>
                        <a href={`http://localhost:8000${t.photo_url}`} target="_blank" rel="noreferrer">
                          <img
                            src={`http://localhost:8000${t.photo_url}`}
                            alt="Evidence Attachment"
                            style={{
                              maxWidth: '150px',
                              maxHeight: '150px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '1px solid var(--surface-border)',
                              cursor: 'pointer',
                              transition: 'transform 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                          />
                        </a>
                      </div>
                    )}

                    {isPendingRefund && (
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                        <button
                          onClick={() => handleApproveRefund(t.id, t.order_id, t.refund_amount)}
                          style={{
                            background: 'var(--success-color)',
                            boxShadow: '0 4px 14px 0 rgba(81, 207, 102, 0.39)',
                            padding: '0.6rem 1.2rem',
                            fontSize: '0.9rem'
                          }}
                        >
                          Approve Refund
                        </button>
                        <button
                          onClick={() => handleRejectRefund(t.id)}
                          className="danger outline"
                          style={{
                            padding: '0.6rem 1.2rem',
                            fontSize: '0.9rem'
                          }}
                        >
                          Reject Request
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <CategoryManager />
    </div>
  );
};


const TopNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeFranchise = sessionStorage.getItem('franchise_name');

  if (
    location.pathname === '/' ||
    location.pathname === '/franchise-selector' ||
    location.pathname === '/super-admin' ||
    location.pathname.startsWith('/customer')
  ) {
    return null;
  }

  const handleSwitchFranchise = () => {
    sessionStorage.removeItem('franchise_name');
    navigate('/franchise-selector');
  };

  return (
    <nav style={{ 
      padding: '1rem 2rem', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      background: 'rgba(0,0,0,0.2)', 
      borderBottom: '1px solid var(--surface-border)' 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Franchise:</span>
        <span style={{ fontWeight: 'bold', color: 'var(--primary-color)', textTransform: 'capitalize' }}>
          {activeFranchise || 'None'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button onClick={handleSwitchFranchise} className="outline" style={{ padding: '0.4rem 1rem' }}>
          🏢 Switch Franchise
        </button>
        <Link to="/">
          <button className="outline" style={{ padding: '0.4rem 1rem' }}>
            Logout / Switch User
          </button>
        </Link>
      </div>
    </nav>
  );
};

const FranchiseRedirectHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if a franchise query parameter is passed in the URL (e.g. ?franchise=downtown)
    const params = new URLSearchParams(location.search);
    const urlFranchise = params.get('franchise');
    if (urlFranchise) {
      sessionStorage.setItem('franchise_name', urlFranchise);
    }

    // Customer pages handle their own franchise selection or bypass employee authentication
    if (location.pathname.startsWith('/customer')) {
      return;
    }

    const franchise = sessionStorage.getItem('franchise_name');
    if (!franchise && location.pathname !== '/franchise-selector' && location.pathname !== '/super-admin') {
      navigate('/franchise-selector');
    }
  }, [location.pathname, location.search, navigate]);

  return null;
};

function App() {
  useEffect(() => {
    // Connect to socket.io
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <BrowserRouter>
      <FranchiseRedirectHandler />
      <OrderProvider>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <TopNav />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Routes>
              <Route path="/" element={<LoginSelection />} />
              <Route path="/franchise-selector" element={<FranchiseSelector />} />
              <Route path="/super-admin" element={<SuperAdminPanel />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
              
              {/* POS Routes */}
              <Route path="/pos" element={<PosDashboard />} />
              <Route path="/pos/new" element={<NewOrderPage />} />
              <Route path="/pos/payment" element={<PaymentPage />} />
              
              <Route path="/kds" element={<KitchenPanel />} />
              <Route path="/customer" element={<CustomerPage />} />
            </Routes>
          </div>
        </div>
      </OrderProvider>
    </BrowserRouter>
  );
}

export default App;
