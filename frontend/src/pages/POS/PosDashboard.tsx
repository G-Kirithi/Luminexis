import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../store/OrderContext';

const STATUS_STYLES: Record<string, { bg: string; color: string; icon: string }> = {
  Pending:   { bg: 'rgba(51,154,240,0.15)',  color: '#339af0', icon: '🕐' },
  Cooking:   { bg: 'rgba(252,196,25,0.18)',  color: '#fcc419', icon: '🔥' },
  Ready:     { bg: 'rgba(81,207,102,0.18)',  color: '#51cf66', icon: '✅' },
  Completed: { bg: 'rgba(134,142,150,0.15)', color: '#868e96', icon: '📦' },
};

const PosDashboard = () => {
  const navigate = useNavigate();
  const { orders } = useOrders();

  const pending  = orders.filter(o => o.status === 'Pending').length;
  const cooking  = orders.filter(o => o.status === 'Cooking').length;
  const ready    = orders.filter(o => o.status === 'Ready').length;

  return (
    <div style={{ padding: '1.5rem', minHeight: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem' }}>POS Order Log</h1>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{orders.length} total orders</span>
        </div>
        <button
          onClick={() => navigate('/pos/new')}
          style={{ padding: '0.8rem 2rem', fontSize: '1.05rem', background: 'var(--success-color)' }}
        >
          + Create New Order
        </button>
      </div>

      {/* Live Summary Pills */}
      {orders.length > 0 && (
        <div className="flex gap-4">
          {[
            { label: 'Pending',  count: pending,  ...STATUS_STYLES.Pending  },
            { label: 'Cooking',  count: cooking,  ...STATUS_STYLES.Cooking  },
            { label: 'Ready',    count: ready,    ...STATUS_STYLES.Ready    },
          ].map(s => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: s.bg, border: `1px solid ${s.color}33`,
              borderRadius: '10px', padding: '0.5rem 1rem'
            }}>
              <span>{s.icon}</span>
              <span style={{ color: s.color, fontWeight: 700, fontSize: '1.1rem' }}>{s.count}</span>
              <span style={{ color: s.color, fontSize: '0.85rem' }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="glass-card" style={{ flex: 1, padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(0,0,0,0.4)', position: 'sticky', top: 0 }}>
            <tr>
              <th style={{ padding: '1rem' }}>Token</th>
              <th style={{ padding: '1rem' }}>Order ID</th>
              <th style={{ padding: '1rem' }}>Time</th>
              <th style={{ padding: '1rem' }}>Customer</th>
              <th style={{ padding: '1rem' }}>Items</th>
              <th style={{ padding: '1rem' }}>Total</th>
              <th style={{ padding: '1rem' }}>Chef</th>
              <th style={{ padding: '1rem' }}>Kitchen Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => {
              const s = STATUS_STYLES[order.status] ?? STATUS_STYLES.Pending;
              return (
                <tr key={order.id} style={{
                  borderBottom: '1px solid var(--surface-border)',
                  background: 'rgba(0,0,0,0.1)',
                  transition: 'background 0.2s'
                }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary-color)' }}>
                    #{order.token_number}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{order.order_id}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{order.created_at}</td>
                  <td style={{ padding: '1rem' }}>
                    <div className="flex-col">
                      <span style={{ fontWeight: 'bold' }}>{order.customer_name || 'Walk-in'}</span>
                      <span className="text-muted" style={{ fontSize: '0.82rem' }}>{order.customer_id}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.88rem' }}>
                      {order.items.map((item, idx) => (
                        <li key={idx}>{item.qty}× {item.name}</li>
                      ))}
                    </ul>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>${order.total_bill.toFixed(2)}</td>
                  <td style={{ padding: '1rem' }}>
                    {order.chef_name
                      ? <span style={{ fontSize: '0.88rem', color: '#fff' }}>👨‍🍳 {order.chef_name}</span>
                      : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                    }
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '999px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      background: s.bg,
                      color: s.color,
                      border: `1px solid ${s.color}44`,
                      transition: 'all 0.4s ease',
                    }}>
                      {s.icon} {order.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No orders found. Click "Create New Order" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PosDashboard;
