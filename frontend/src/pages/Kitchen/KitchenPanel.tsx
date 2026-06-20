import React, { useState, useEffect } from 'react';
import { useOrders, type FullOrder } from '../../store/OrderContext';
import './KitchenPanel.css';
import KitchenInventory from './KitchenInventory';

const CHEFS = [
  { id: 1, name: 'Marco Rossi',  emoji: '🍳', role: 'Head Chef',       color: '#ff6b6b', glow: 'rgba(255,107,107,0.35)' },
  { id: 2, name: 'Aisha Khan',   emoji: '🔪', role: 'Sous Chef',        color: '#339af0', glow: 'rgba(51,154,240,0.35)' },
  { id: 3, name: 'Raj Patel',    emoji: '👨‍🍳', role: 'Pastry & Grill',  color: '#51cf66', glow: 'rgba(81,207,102,0.35)' },
];

const STATUS_CONFIG = {
  Pending:   { label: 'Pending',   color: '#339af0', bg: 'rgba(51,154,240,0.15)',   icon: '🕐' },
  Cooking:   { label: 'Cooking',   color: '#fcc419', bg: 'rgba(252,196,25,0.15)',   icon: '🔥' },
  Ready:     { label: 'Ready',     color: '#51cf66', bg: 'rgba(81,207,102,0.15)',   icon: '✅' },
  Completed: { label: 'Completed', color: '#868e96', bg: 'rgba(134,142,150,0.15)', icon: '📦' },
};

// --- Time elapsed hook ---
function useElapsed(createdAt: string) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    const parse = () => {
      const now = new Date();
      // createdAt is a locale time string like "2:30:00 PM"
      const today = new Date().toDateString();
      const dt = new Date(`${today} ${createdAt}`);
      const diffMs = now.getTime() - dt.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffSec = Math.floor((diffMs % 60000) / 1000);
      return diffMin > 0 ? `${diffMin}m ${diffSec}s` : `${diffSec}s`;
    };
    setElapsed(parse());
    const timer = setInterval(() => setElapsed(parse()), 1000);
    return () => clearInterval(timer);
  }, [createdAt]);
  return elapsed;
}

// --- Single Order Ticket ---
const OrderTicket: React.FC<{ order: FullOrder; chefName: string }> = ({ order, chefName }) => {
  const { updateOrderStatus } = useOrders();
  const elapsed = useElapsed(order.created_at);
  const cfg = STATUS_CONFIG[order.status];

  const handleAction = () => {
    if (order.status === 'Pending') {
      updateOrderStatus(order.id, 'Cooking', chefName);
    } else if (order.status === 'Cooking') {
      updateOrderStatus(order.id, 'Ready', chefName);
    }
  };

  const isUrgent = (() => {
    const today = new Date().toDateString();
    const dt = new Date(`${today} ${order.created_at}`);
    return (Date.now() - dt.getTime()) > 10 * 60 * 1000; // > 10 mins
  })();

  return (
    <div className={`order-ticket ${order.status.toLowerCase()} ${isUrgent ? 'urgent' : ''}`}>
      {/* Ticket Header */}
      <div className="ticket-header">
        <div className="token-badge">
          <span className="token-label">TOKEN</span>
          <span className="token-number">#{order.token_number}</span>
        </div>
        <div className="ticket-meta">
          <span className="ticket-order-id">{order.order_id}</span>
          <span className={`status-pill status-${order.status.toLowerCase()}`} style={{ background: cfg.bg, color: cfg.color }}>
            {cfg.icon} {cfg.label}
          </span>
        </div>
      </div>

      {/* Customer */}
      <div className="ticket-customer">
        <span className="customer-icon">👤</span>
        <div>
          <div className="customer-name">{order.customer_name || 'Walk-in Customer'}</div>
          {order.customer_phone && <div className="customer-phone">{order.customer_phone}</div>}
        </div>
      </div>

      {/* Items */}
      <div className="ticket-items">
        {order.items.map((item, idx) => (
          <div key={idx} className="ticket-item">
            <span className="item-qty">×{item.qty}</span>
            <span className="item-name">{item.name}</span>
            <span className="item-price">${(item.price * item.qty).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="ticket-footer">
        <div className="ticket-time">
          <span className={`elapsed ${isUrgent ? 'urgent-text' : ''}`}>⏱ {elapsed}</span>
          {order.chef_name && order.chef_name !== chefName && (
            <span className="other-chef">👨‍🍳 {order.chef_name}</span>
          )}
        </div>

        {order.status !== 'Ready' && order.status !== 'Completed' && (
          <button
            className={`ticket-action ${order.status === 'Pending' ? 'action-start' : 'action-ready'}`}
            onClick={handleAction}
          >
            {order.status === 'Pending' ? '🔥 Start Cooking' : '✅ Mark Ready'}
          </button>
        )}

        {order.status === 'Ready' && (
          <div className="ready-badge">✅ Ready to Serve!</div>
        )}
      </div>
    </div>
  );
};

// --- Lane Column ---
const KitchenLane: React.FC<{
  title: string;
  icon: string;
  color: string;
  orders: FullOrder[];
  chefName: string;
}> = ({ title, icon, color, orders, chefName }) => (
  <div className="kitchen-lane">
    <div className="lane-header" style={{ borderColor: color }}>
      <span className="lane-icon">{icon}</span>
      <span className="lane-title">{title}</span>
      <span className="lane-count" style={{ background: color }}>{orders.length}</span>
    </div>
    <div className="lane-body">
      {orders.length === 0 ? (
        <div className="lane-empty">
          <div className="empty-icon">🍽️</div>
          <div>No orders here</div>
        </div>
      ) : (
        orders.map(order => (
          <OrderTicket key={order.id} order={order} chefName={chefName} />
        ))
      )}
    </div>
  </div>
);

// --- Chef Selection Screen ---
const ChefSelection: React.FC<{ onSelect: (chef: typeof CHEFS[0]) => void }> = ({ onSelect }) => (
  <div className="chef-selection-screen">
    <div className="chef-selection-header">
      <div className="kitchen-logo">🍽️</div>
      <h1 className="chef-selection-title">Kitchen Panel</h1>
      <p className="chef-selection-subtitle">Select your name to view and manage orders</p>
    </div>

    <div className="chef-grid">
      {CHEFS.map(chef => (
        <button
          key={chef.id}
          className="chef-card"
          style={{ '--chef-color': chef.color, '--chef-glow': chef.glow } as React.CSSProperties}
          onClick={() => onSelect(chef)}
          id={`chef-${chef.id}`}
        >
          <div className="chef-avatar">{chef.emoji}</div>
          <div className="chef-info">
            <div className="chef-name">{chef.name}</div>
            <div className="chef-role">{chef.role}</div>
          </div>
          <div className="chef-arrow">→</div>
        </button>
      ))}
    </div>
  </div>
);

// --- Main Kitchen Panel ---
const KitchenPanel: React.FC = () => {
  const { orders } = useOrders();
  const [selectedChef, setSelectedChef] = useState<typeof CHEFS[0] | null>(null);
  const [activeTab, setActiveTab] = useState<'kds' | 'inventory'>('kds');
  const [scarceCount, setScarceCount] = useState(0);

  // All active orders (not completed) visible to kitchen
  const activeOrders = orders.filter(o => o.status !== 'Completed');
  const pendingOrders  = activeOrders.filter(o => o.status === 'Pending');
  const cookingOrders  = activeOrders.filter(o => o.status === 'Cooking');
  const readyOrders    = activeOrders.filter(o => o.status === 'Ready');

  useEffect(() => {
    if (!selectedChef) return;
    
    const fetchScarceCount = async () => {
      try {
        const { getInventory } = await import('../../api');
        const items = await getInventory();
        const scarceItems = items.filter((i: any) => i.is_scarce);
        setScarceCount(scarceItems.length);
      } catch (err) {
        console.error('Error fetching scarce count:', err);
      }
    };

    fetchScarceCount();
    const interval = setInterval(fetchScarceCount, 15000);
    return () => clearInterval(interval);
  }, [selectedChef, activeTab]);

  if (!selectedChef) {
    return <ChefSelection onSelect={setSelectedChef} />;
  }

  return (
    <div className="kitchen-panel">
      {/* Top Bar */}
      <div className="kitchen-topbar">
        <div className="kitchen-topbar-left">
          <button className="back-btn" onClick={() => setSelectedChef(null)}>← Switch Chef</button>
          <div className="active-chef" style={{ '--chef-color': selectedChef.color } as React.CSSProperties}>
            <span className="active-chef-emoji">{selectedChef.emoji}</span>
            <div>
              <div className="active-chef-name">{selectedChef.name}</div>
              <div className="active-chef-role">{selectedChef.role}</div>
            </div>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            className={activeTab === 'kds' ? '' : 'outline'} 
            style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('kds')}
          >
            📋 KDS Board
          </button>
          <button 
            className={activeTab === 'inventory' ? '' : 'outline'} 
            style={{ 
              padding: '0.5rem 1.2rem', 
              fontSize: '0.85rem',
              position: 'relative'
            }}
            onClick={() => setActiveTab('inventory')}
          >
            📦 Inventory Stock
            {scarceCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: 'var(--accent-color)',
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                borderRadius: '999px',
                padding: '2px 6px',
                boxShadow: '0 0 8px rgba(255,107,107,0.5)',
                animation: 'pulse-ready 2s ease-in-out infinite'
              }}>
                {scarceCount}
              </span>
            )}
          </button>
        </div>

        <div className="kitchen-stats">
          <div className="stat-item">
            <span className="stat-num" style={{ color: '#339af0' }}>{pendingOrders.length}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num" style={{ color: '#fcc419' }}>{cookingOrders.length}</span>
            <span className="stat-label">Cooking</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num" style={{ color: '#51cf66' }}>{readyOrders.length}</span>
            <span className="stat-label">Ready</span>
          </div>
        </div>

        <div className="kitchen-live">
          <span className="live-dot" />
          LIVE
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'kds' ? (
        <div className="kitchen-board">
          <KitchenLane title="Pending"  icon="🕐" color="#339af0" orders={pendingOrders}  chefName={selectedChef.name} />
          <KitchenLane title="Cooking"  icon="🔥" color="#fcc419" orders={cookingOrders}  chefName={selectedChef.name} />
          <KitchenLane title="Ready"    icon="✅" color="#51cf66" orders={readyOrders}    chefName={selectedChef.name} />
        </div>
      ) : (
        <KitchenInventory />
      )}
    </div>
  );
};

export default KitchenPanel;
