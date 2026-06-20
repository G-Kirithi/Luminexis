import React from 'react';

export interface OrderInfo {
  id: number;
  order_id: string; // e.g. ORD-001
  token_number: number;
  customer_name: string;
  status: 'active' | 'completed';
}

interface OrderLogProps {
  orders: OrderInfo[];
  selectedOrderId: number | null;
  onSelectOrder: (id: number) => void;
}

const OrderLog: React.FC<OrderLogProps> = ({ orders, selectedOrderId, onSelectOrder }) => {
  return (
    <div className="glass-card flex-col" style={{ width: '280px', height: '100%', padding: '1rem', overflowY: 'auto' }}>
      <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>Active Orders</h3>
      
      <div className="flex-col gap-2">
        {orders.map(order => (
          <div
            key={order.id}
            onClick={() => onSelectOrder(order.id)}
            style={{
              padding: '0.8rem',
              borderRadius: '8px',
              cursor: 'pointer',
              background: selectedOrderId === order.id ? 'rgba(51, 154, 240, 0.15)' : 'rgba(0,0,0,0.2)',
              border: `1px solid ${selectedOrderId === order.id ? 'var(--primary-color)' : 'transparent'}`,
              transition: 'all 0.2s ease',
            }}
          >
            <div className="flex justify-between items-center" style={{ marginBottom: '0.3rem' }}>
              <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Token: {order.token_number}</span>
              <span style={{ fontSize: '0.8rem' }} className="text-muted">{order.order_id}</span>
            </div>
            <div className="text-muted" style={{ fontSize: '0.9rem' }}>
              👤 {order.customer_name || 'Walk-in Customer'}
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <div className="text-muted" style={{ textAlign: 'center', marginTop: '2rem' }}>
            No active orders
          </div>
        )}
      </div>
      
      <button 
        style={{ marginTop: 'auto' }}
        onClick={() => onSelectOrder(-1)} // -1 could mean 'new order'
      >
        + New Order
      </button>
    </div>
  );
};

export default OrderLog;
