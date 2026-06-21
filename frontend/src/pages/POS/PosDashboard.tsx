import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../store/OrderContext';

const STATUS_STYLES: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
  Pending:   { bg: 'rgba(34, 139, 230, 0.15)',  color: '#228BE6', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> },
  Cooking:   { bg: 'rgba(255, 140, 0, 0.15)',   color: '#FF8C00', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg> },
  Ready:     { bg: 'rgba(0, 200, 83, 0.15)',    color: '#00C853', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> },
  Completed: { bg: 'rgba(134, 142, 150, 0.15)', color: '#868e96', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg> },
};

const PosDashboard = () => {
  const navigate = useNavigate();
  const { orders, tables, freeTable, updateOrderStatus } = useOrders();

  const pending  = orders.filter(o => o.status === 'Pending').length;
  const cooking  = orders.filter(o => o.status === 'Cooking').length;
  const ready    = orders.filter(o => o.status === 'Ready').length;

  const handleTableClick = (table: { number: number, status: string }) => {
    if (table.status === 'Available') {
      navigate('/pos/new', { state: { table_number: table.number } });
    } else {
      if (window.confirm(`Free Table ${table.number}?`)) {
        freeTable(table.number);
      }
    }
  };
  return (
    <div style={{ 
      padding: '1.5rem', 
      minHeight: '100%', 
      boxSizing: 'border-box', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '1.2rem',
      background: 'linear-gradient(135deg, #EAD6C0 0%, #D5B895 50%, #C29B78 100%)'
    }}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem' }}>POS Dashboard</h1>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{orders.length} total orders</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => navigate('/pos/menu-management')}
            style={{ padding: '0.8rem 1.5rem', fontSize: '1.05rem', background: '#D4A373', color: '#2C1E16', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
          >
            🍔 Manage Menu
          </button>
          <button
            onClick={() => navigate('/pos/new')}
            style={{ padding: '0.8rem 1.5rem', fontSize: '1.05rem', background: 'var(--success-color)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
          >
            + New Walk-in Order
          </button>
        </div>
      </div>

      {/* Table Map */}
      <div className="glass-card flex-col gap-2">
        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Dine-in Tables</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 130px)', gap: '1.5rem', justifyContent: 'center', marginTop: '1rem' }}>
          {tables.map(table => {
            let bgColor = 'rgba(43, 138, 62, 0.1)';
            let borderColor = '#2B8A3E';
            if (table.status === 'Reserved') {
              bgColor = 'rgba(201, 42, 42, 0.1)';
              borderColor = '#C92A2A';
            } else if (table.status === 'On Hold') {
              bgColor = 'rgba(230, 119, 0, 0.1)';
              borderColor = '#E67700';
            }
            return (
              <div
                key={table.number}
                onClick={() => handleTableClick(table)}
                style={{
                  width: '130px', height: '110px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '16px', cursor: 'pointer',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: `2px solid ${borderColor}`,
                  boxShadow: `0 6px 16px ${bgColor}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 12px 24px ${bgColor}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = `0 6px 16px ${bgColor}`;
                }}
              >
                <div style={{ position: 'absolute', top: -15, right: -15, opacity: 0.05, fontSize: '5rem' }}>☕</div>
                
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: borderColor, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                  Table
                </span>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-color)', lineHeight: 1, margin: '6px 0', fontFamily: 'var(--font-family)' }}>
                  {table.number.toString().padStart(2, '0')}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: borderColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  • {table.status} •
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Summary Pills */}
      {orders.length >= 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '1rem', marginBottom: '1rem' }}>
          {[
            { label: 'Pending',  count: pending,  ...STATUS_STYLES.Pending  },
            { label: 'Cooking',  count: cooking,  ...STATUS_STYLES.Cooking  },
            { label: 'Ready',    count: ready,    ...STATUS_STYLES.Ready    },
          ].map(s => (
            <div key={s.label} className="glass-card" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.95)', border: `2px solid ${s.bg}`,
              boxShadow: `0 4px 16px ${s.bg.replace('0.15', '0.2')}`,
              padding: '1rem 1.5rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'default',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
              e.currentTarget.style.boxShadow = `0 12px 32px ${s.bg.replace('0.15', '0.5')}`;
              e.currentTarget.style.borderColor = s.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = `0 4px 16px ${s.bg.replace('0.15', '0.2')}`;
              e.currentTarget.style.borderColor = s.bg;
            }}
            >
              <div style={{ position: 'absolute', right: '-10%', top: '-20%', opacity: 0.05, transform: 'scale(4)', color: s.color }}>
                {s.icon}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
                <div style={{
                  background: `linear-gradient(135deg, ${s.bg}, rgba(255,255,255,0))`, color: s.color, padding: '0.8rem', borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${s.bg}`
                }}>
                  {s.icon}
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {s.label}
                </span>
              </div>
              <span style={{ color: s.color, fontWeight: 800, fontSize: '2.5rem', lineHeight: 1, fontFamily: 'var(--font-family)', position: 'relative', zIndex: 1 }}>
                {s.count}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="glass-card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid var(--surface-border)' }}>
        <div style={{ overflow: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#F5EFE6', color: '#2C1E16', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderBottom: '2px solid rgba(212, 163, 115, 0.5)' }}>
              <tr>
                <th style={{ padding: '1.2rem 1rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Token</th>
                <th style={{ padding: '1.2rem 1rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Table/ID</th>
                <th style={{ padding: '1.2rem 1rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Time</th>
                <th style={{ padding: '1.2rem 1rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Customer</th>
                <th style={{ padding: '1.2rem 1rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Items</th>
                <th style={{ padding: '1.2rem 1rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Total</th>
                <th style={{ padding: '1.2rem 1rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Chef</th>
                <th style={{ padding: '1.2rem 1rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Status</th>
                <th style={{ padding: '1.2rem 1rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => {
                const s = STATUS_STYLES[order.status] ?? STATUS_STYLES.Pending;
                const isEven = index % 2 === 0;
                return (
                  <tr key={order.id} style={{
                    borderBottom: '1px solid var(--surface-border)',
                    background: isEven ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)',
                    transition: 'all 0.2s ease',
                    color: '#2C1E16'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,1)'}
                  onMouseLeave={e => e.currentTarget.style.background = isEven ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)'}
                  >
                    <td style={{ padding: '1rem', fontWeight: 800, fontSize: '1.4rem', color: '#668BA4' }}>
                      #{order.token_number}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {order.table_number ? (
                        <div style={{ fontWeight: 800, color: '#B88655', fontSize: '1.1rem' }}>Table {order.table_number}</div>
                      ) : (
                        <div style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Walk-in</div>
                      )}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{order.order_id.substring(0,8)}</div>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                      {new Date(`1970-01-01T${order.created_at}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div className="flex-col">
                        <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{order.customer_name || 'Walk-in'}</span>
                        {order.customer_id && <span style={{ fontSize: '0.8rem', color: '#1864AB', fontWeight: 600 }}>CUST-{order.customer_id}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {order.items.map((item, idx) => (
                          <span key={idx} style={{ 
                            background: 'rgba(0,0,0,0.05)', 
                            padding: '0.2rem 0.6rem', 
                            borderRadius: '6px', 
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            border: '1px solid rgba(0,0,0,0.05)'
                          }}>
                            <strong style={{ color: '#D9480F' }}>{item.qty}×</strong> {item.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 800, fontSize: '1.2rem', color: '#2C1E16' }}>
                      ${order.total_bill.toFixed(2)}
                      {order.generated_coupon && (
                        <div style={{ fontSize: '0.75rem', color: '#00C853', marginTop: '0.3rem', fontWeight: 700, background: 'rgba(0, 200, 83, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-block' }}>
                          🎁 {order.generated_coupon}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {order.chef_name
                        ? <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#D9480F', background: 'rgba(217, 72, 15, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>👨‍🍳 {order.chef_name}</span>
                        : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                      }
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        background: s.bg,
                        color: s.color,
                        border: `1px solid ${s.color}44`,
                      }}>
                        <div style={{ width: 14, height: 14, display: 'flex', alignItems: 'center' }}>{s.icon}</div> {order.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      {order.status === 'Ready' && (
                        <button 
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: '#00C853', color: 'white', fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,200,83,0.3)' }}
                          onClick={() => updateOrderStatus(order.id, 'Completed')}
                        >
                          MARK SERVED
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 600 }}>
                    No orders found. Wait for new orders or create a Walk-in.
                  </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default PosDashboard;
