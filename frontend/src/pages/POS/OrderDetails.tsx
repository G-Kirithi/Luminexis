import React from 'react';
import type { OrderInfo } from './OrderLog';

export interface OrderItem {
  id: number;
  product_id: number;
  name: string;
  qty: number;
  price: number;
  status: 'Pending' | 'Cooking' | 'Ready';
}

interface OrderDetailsProps {
  order: OrderInfo | null;
  items: OrderItem[];
  onUpdateQty: (itemId: number, delta: number) => void;
  onRemoveItem: (itemId: number) => void;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ order, items, onUpdateQty, onRemoveItem }) => {
  const total = items.reduce((acc, item) => acc + (item.price * item.qty), 0);

  if (!order) {
    return (
      <div className="glass-card flex-col items-center justify-center" style={{ flex: 1, padding: '1rem', height: '100%' }}>
        <div style={{ fontSize: '3rem', opacity: 0.5 }}>🧾</div>
        <h3 className="text-muted">Select an order or create a new one</h3>
      </div>
    );
  }

  return (
    <div className="glass-card flex-col" style={{ flex: 1, height: '100%', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Order {order.order_id}</h2>
          <span className="text-muted" style={{ fontSize: '0.9rem' }}>Token: {order.token_number} | {order.customer_name || 'Walk-in'}</span>
        </div>
        <span style={{ 
          background: 'var(--primary-color)', 
          padding: '0.3rem 0.8rem', 
          borderRadius: '20px', 
          fontSize: '0.8rem', 
          fontWeight: 'bold' 
        }}>
          {order.status.toUpperCase()}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }} className="flex-col gap-2">
        {items.map(item => (
          <div key={item.id} className="flex justify-between items-center" style={{ 
            padding: '0.8rem', 
            background: 'rgba(0,0,0,0.2)', 
            borderRadius: '8px' 
          }}>
            <div className="flex-col" style={{ flex: 1 }}>
              <span style={{ fontWeight: 'bold' }}>{item.name}</span>
              <div className="flex items-center gap-2" style={{ marginTop: '0.4rem' }}>
                <span style={{ 
                  fontSize: '0.7rem', 
                  padding: '0.2rem 0.5rem', 
                  borderRadius: '10px',
                  background: item.status === 'Ready' ? 'var(--success-color)' : item.status === 'Cooking' ? 'var(--warning-color)' : 'rgba(255,255,255,0.1)',
                  color: item.status === 'Cooking' ? '#000' : '#fff'
                }}>
                  {item.status}
                </span>
                <span className="text-muted" style={{ fontSize: '0.9rem' }}>${item.price.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '20px', padding: '0.2rem' }}>
                <button 
                  className="outline" 
                  style={{ padding: '0.2rem 0.6rem', border: 'none', borderRadius: '50%' }}
                  onClick={() => onUpdateQty(item.id, -1)}
                >-</button>
                <span style={{ minWidth: '1.5rem', textAlign: 'center', fontWeight: 'bold' }}>{item.qty}</span>
                <button 
                  className="outline" 
                  style={{ padding: '0.2rem 0.6rem', border: 'none', borderRadius: '50%' }}
                  onClick={() => onUpdateQty(item.id, 1)}
                >+</button>
              </div>
              <span style={{ fontWeight: 'bold', minWidth: '4rem', textAlign: 'right' }}>
                ${(item.price * item.qty).toFixed(2)}
              </span>
              <button 
                className="danger outline" 
                style={{ padding: '0.3rem 0.6rem', border: 'none' }}
                onClick={() => onRemoveItem(item.id)}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-muted" style={{ textAlign: 'center', marginTop: '2rem' }}>
            No items added yet. Add items from the catalog.
          </div>
        )}
      </div>

      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--surface-border)' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Total Amount</span>
          <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
            ${total.toFixed(2)}
          </span>
        </div>
        <div className="flex gap-4">
          <button className="outline" style={{ flex: 1 }}>Save Draft</button>
          <button style={{ flex: 2, background: 'var(--success-color)' }}>Send to Kitchen</button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
