import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../store/OrderContext';

const PosDashboard = () => {
  const navigate = useNavigate();
  const { orders } = useOrders();

  return (
    <div style={{ padding: '2rem', height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>POS Order Log</h1>
        <button 
          onClick={() => navigate('/pos/new')}
          style={{ padding: '0.8rem 2rem', fontSize: '1.1rem', background: 'var(--success-color)' }}
        >
          + Create New Order
        </button>
      </div>

      <div className="glass-card" style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(0,0,0,0.4)', position: 'sticky', top: 0 }}>
            <tr>
              <th style={{ padding: '1rem' }}>Token</th>
              <th style={{ padding: '1rem' }}>Order ID</th>
              <th style={{ padding: '1rem' }}>Time</th>
              <th style={{ padding: '1rem' }}>Customer (ID / Name)</th>
              <th style={{ padding: '1rem' }}>Items</th>
              <th style={{ padding: '1rem' }}>Total Bill</th>
              <th style={{ padding: '1rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} style={{ borderBottom: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.1)', transition: 'background 0.2s' }}>
                <td style={{ padding: '1rem', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary-color)' }}>
                  #{order.token_number}
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{order.order_id}</td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{order.created_at}</td>
                <td style={{ padding: '1rem' }}>
                  <div className="flex-col">
                    <span style={{ fontWeight: 'bold' }}>{order.customer_id}</span>
                    <span className="text-muted" style={{ fontSize: '0.9rem' }}>{order.customer_name || 'Walk-in'}</span>
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem' }}>
                    {order.items.map((item, idx) => (
                      <li key={idx}>{item.qty}x {item.name}</li>
                    ))}
                  </ul>
                </td>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>${order.total_bill.toFixed(2)}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    background: order.status === 'Ready' ? 'var(--success-color)' : order.status === 'Cooking' ? 'var(--warning-color)' : 'rgba(255,255,255,0.1)',
                    color: order.status === 'Cooking' ? '#000' : '#fff'
                  }}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
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
