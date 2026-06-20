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
    <div style={{ padding: '1.5rem', minHeight: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem' }}>POS Dashboard</h1>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{orders.length} total orders</span>
        </div>
        <button
          onClick={() => navigate('/pos/new')}
          style={{ padding: '0.8rem 2rem', fontSize: '1.05rem', background: 'var(--success-color)' }}
        >
          + New Walk-in Order
        </button>
      </div>

      {/* Table Map */}
      <div className="glass-card flex-col gap-2">
        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Dine-in Tables</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
          {tables.map(table => {
            let bgColor = 'rgba(81,207,102,0.1)';
            let borderColor = 'var(--success-color)';
            if (table.status === 'Reserved') {
              bgColor = 'rgba(250,82,82,0.1)';
              borderColor = 'var(--danger-color)';
            } else if (table.status === 'On Hold') {
              bgColor = 'rgba(252,196,25,0.1)';
              borderColor = '#fcc419';
            }
            return (
              <div
                key={table.number}
                onClick={() => handleTableClick(table)}
                style={{
                  width: '80px', height: '80px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '12px', cursor: 'pointer',
                  background: bgColor,
                  border: `2px solid ${borderColor}`,
                  transition: 'transform 0.2s',
                }}
              >
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>T{table.number}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{table.status}</span>
              </div>
            );
          })}
        </div>
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
      <div className="glass-card" style={{ flex: 1, padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(0,0,0,0.4)', position: 'sticky', top: 0 }}>
            <tr>
              <th style={{ padding: '1rem' }}>Token</th>
              <th style={{ padding: '1rem' }}>Table/ID</th>
              <th style={{ padding: '1rem' }}>Time</th>
              <th style={{ padding: '1rem' }}>Customer</th>
              <th style={{ padding: '1rem' }}>Items</th>
              <th style={{ padding: '1rem' }}>Total</th>
              <th style={{ padding: '1rem' }}>Chef</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
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
                  <td style={{ padding: '1rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {order.table_number ? (
                      <div style={{ color: 'var(--text-color)', fontWeight: 'bold' }}>Table {order.table_number}</div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)' }}>Walk-in</div>
                    )}
                    <div style={{ fontSize: '0.8rem' }}>{order.order_id}</div>
                  </td>
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
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                    ${order.total_bill.toFixed(2)}
                    {order.generated_coupon && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--success-color)', marginTop: '0.3rem', background: 'rgba(81, 207, 102, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-block' }}>
                        🎁 {order.generated_coupon}
                      </div>
                    )}
                  </td>
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
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    {order.status === 'Ready' && (
                      <button 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: 'var(--success-color)' }}
                        onClick={() => updateOrderStatus(order.id, 'Completed')}
                      >
                        ✅ Mark Served
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
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
