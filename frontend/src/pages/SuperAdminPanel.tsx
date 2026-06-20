import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFranchiseStats, resetFranchiseDb } from '../api';

interface FranchiseStats {
  name: string;
  created_at: string;
  orders_count: number;
  total_revenue: number;
}

const SuperAdminPanel = () => {
  const [stats, setStats] = useState<FranchiseStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Wipe database modal state
  const [confirmWipeName, setConfirmWipeName] = useState<string | null>(null);
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [isWiping, setIsWiping] = useState(false);
  const [wipeError, setWipeError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getFranchiseStats();
      setStats(data);
      setError('');
    } catch (err) {
      console.error('Failed to load franchise stats:', err);
      setError('Could not retrieve franchise databases data.');
    } finally {
      setLoading(false);
    }
  };

  const handleWipeDatabase = async () => {
    if (!confirmWipeName) return;

    if (typedConfirmation.toLowerCase() !== confirmWipeName.toLowerCase()) {
      setWipeError(`Confirmation mismatch. Please type '${confirmWipeName}' correctly.`);
      return;
    }

    setWipeError('');
    setIsWiping(true);
    try {
      await resetFranchiseDb(confirmWipeName);
      alert(`Database for franchise '${confirmWipeName.toUpperCase()}' has been wiped and reset successfully.`);
      setConfirmWipeName(null);
      setTypedConfirmation('');
      await fetchStats();
    } catch (err: any) {
      setWipeError(err.response?.data?.detail || 'Failed to wipe database.');
    } finally {
      setIsWiping(false);
    }
  };

  // Cross-tenant aggregated summary
  const totalGlobalRevenue = stats.reduce((acc, curr) => acc + curr.total_revenue, 0);
  const totalGlobalOrders = stats.reduce((acc, curr) => acc + curr.orders_count, 0);

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button 
            onClick={() => navigate('/franchise-selector')} 
            className="outline" 
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', marginBottom: '0.5rem' }}
          >
            ← Back to Landing Page
          </button>
          <h1 style={{ margin: 0, fontSize: '2.2rem' }}>Super Admin Panel</h1>
          <span style={{ color: 'var(--text-muted)' }}>Cross-tenant analytics and database management</span>
        </div>
        <button onClick={fetchStats} className="outline">
          🔄 Refresh Data
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: '1rem', 
          borderRadius: '8px', 
          background: 'rgba(255, 107, 107, 0.12)', 
          border: '1px solid var(--accent-color)', 
          color: 'var(--accent-color)' 
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading franchise registry metrics...
        </div>
      ) : (
        <>
          {/* Summary Dashboard Widgets */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem'
          }}>
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem' }}>💼</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
                  {stats.length}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Active Franchises
                </span>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', color: 'var(--success-color)' }}>💰</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success-color)', lineHeight: 1.1 }}>
                  ${totalGlobalRevenue.toFixed(2)}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Total Consolidated Revenue
                </span>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', color: 'var(--primary-color)' }}>🧾</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-color)', lineHeight: 1.1 }}>
                  {totalGlobalOrders}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Total Consolidated Orders
                </span>
              </div>
            </div>
          </div>

          {/* Franchise Database Registry List */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Registered Franchise Databases</h2>
            <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>
              Monitor tenant database status, registration date, and wipe/reset databases.
            </p>

            <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--surface-border)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Franchise ID</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Database Name</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Date Registered</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Orders Count</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Revenue</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((f, idx) => (
                    <tr key={f.name} style={{ borderBottom: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.05)' }}>
                      <td style={{ padding: '1rem', fontWeight: 'bold' }}>#{idx + 1}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary-color)', textTransform: 'capitalize' }}>
                          {f.name}
                        </span>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          cafe_pos_{f.name}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        {new Date(f.created_at).toLocaleDateString()} at {new Date(f.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 'bold' }}>{f.orders_count}</td>
                      <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--success-color)' }}>
                        ${f.total_revenue.toFixed(2)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button 
                          onClick={() => setConfirmWipeName(f.name)}
                          className="danger outline"
                          style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                        >
                          🗑️ Reset Database
                        </button>
                      </td>
                    </tr>
                  ))}
                  {stats.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No registered franchises.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Database Wipe/Reset Double-Confirmation Modal */}
      {confirmWipeName && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.25s ease'
        }}>
          <div className="glass-card" style={{ width: '420px', display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '1px solid var(--accent-color)' }}>
            <h3 style={{ margin: 0, color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚠️ Critical Action Required
            </h3>
            
            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.4 }}>
              You are about to wipe the database for franchise <strong>{confirmWipeName.toUpperCase()}</strong>.
              This will drop and recreate all tables, resetting the tenant DB to its seed state.
            </p>

            <div style={{
              background: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              fontSize: '0.85rem',
              color: 'var(--accent-color)'
            }}>
              <strong>WARNING:</strong> All customer orders, tables active data, and customization records will be permanently deleted.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                TYPE FRANCHISE NAME <strong>"{confirmWipeName.toUpperCase()}"</strong> TO CONFIRM:
              </label>
              <input
                type="text"
                placeholder={`Type ${confirmWipeName}`}
                value={typedConfirmation}
                onChange={(e) => setTypedConfirmation(e.target.value)}
                style={{ textTransform: 'lowercase' }}
                autoFocus
              />
            </div>

            {wipeError && (
              <span className="text-danger" style={{ fontSize: '0.85rem', textAlign: 'center' }}>
                {wipeError}
              </span>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                className="outline" 
                onClick={() => { setConfirmWipeName(null); setTypedConfirmation(''); setWipeError(''); }}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="danger"
                disabled={isWiping || typedConfirmation.toLowerCase() !== confirmWipeName.toLowerCase()}
                onClick={handleWipeDatabase} 
                style={{ flex: 1 }}
              >
                {isWiping ? 'Wiping Database...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
};

export default SuperAdminPanel;
