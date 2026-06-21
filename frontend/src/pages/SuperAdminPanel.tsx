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
    <div style={{ padding: '2rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '2rem', background: '#FDFBF7', color: '#2C1E16' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button 
            onClick={() => navigate('/franchise-selector')} 
            className="outline" 
            style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', marginBottom: '0.5rem', background: 'transparent', border: '2px solid #D4A373', color: '#D4A373', borderRadius: '8px', fontWeight: 800, textTransform: 'uppercase' }}
          >
            ← Back to Landing Page
          </button>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900, color: '#2C1E16' }}>Super Admin Panel</h1>
          <span style={{ color: '#B88655', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.5px' }}>Cross-tenant analytics and database management</span>
        </div>
        <button onClick={fetchStats} className="outline" style={{ background: '#D4A373', color: '#2C1E16', border: 'none', padding: '0.6rem 1.2rem', fontWeight: 800, borderRadius: '8px' }}>
          🔄 Refresh Data
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: '1rem', 
          borderRadius: '10px', 
          background: '#FFF5F5', 
          border: '2px solid #ff6b6b', 
          color: '#E03131',
          fontWeight: 700
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#B88655', fontWeight: 700, fontSize: '1.2rem' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', background: '#ffffff', border: '2px solid #EAD6C0', borderRadius: '16px', boxShadow: '0 4px 15px rgba(44,30,22,0.05)' }}>
              <div style={{ fontSize: '2.5rem' }}>💼</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#2C1E16', lineHeight: 1.1 }}>
                  {stats.length}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#B88655', fontWeight: 700, textTransform: 'uppercase' }}>
                  Active Franchises
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', background: '#ffffff', border: '2px solid #EAD6C0', borderRadius: '16px', boxShadow: '0 4px 15px rgba(44,30,22,0.05)' }}>
              <div style={{ fontSize: '2.5rem', color: '#00C853' }}>💰</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#00C853', lineHeight: 1.1 }}>
                  ${totalGlobalRevenue.toFixed(2)}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#B88655', fontWeight: 700, textTransform: 'uppercase' }}>
                  Total Consolidated Revenue
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', background: '#ffffff', border: '2px solid #EAD6C0', borderRadius: '16px', boxShadow: '0 4px 15px rgba(44,30,22,0.05)' }}>
              <div style={{ fontSize: '2.5rem', color: '#D4A373' }}>🧾</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#D4A373', lineHeight: 1.1 }}>
                  {totalGlobalOrders}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#B88655', fontWeight: 700, textTransform: 'uppercase' }}>
                  Total Consolidated Orders
                </span>
              </div>
            </div>
          </div>

          {/* Franchise Database Registry List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#ffffff', border: '2px solid #EAD6C0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 15px rgba(44,30,22,0.05)' }}>
            <h2 style={{ fontSize: '1.6rem', margin: 0, fontWeight: 900, color: '#2C1E16' }}>Registered Franchise Databases</h2>
            <p style={{ margin: 0, fontSize: '1rem', color: '#B88655', fontWeight: 600 }}>
              Monitor tenant database status, registration date, and wipe/reset databases.
            </p>

            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '3px solid #EAD6C0' }}>
                    <th style={{ padding: '1.2rem 1rem', color: '#B88655', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 800 }}>Franchise ID</th>
                    <th style={{ padding: '1.2rem 1rem', color: '#B88655', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 800 }}>Database Name</th>
                    <th style={{ padding: '1.2rem 1rem', color: '#B88655', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 800 }}>Date Registered</th>
                    <th style={{ padding: '1.2rem 1rem', color: '#B88655', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 800 }}>Orders Count</th>
                    <th style={{ padding: '1.2rem 1rem', color: '#B88655', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 800 }}>Revenue</th>
                    <th style={{ padding: '1.2rem 1rem', color: '#B88655', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 800, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((f, idx) => (
                    <tr key={f.name} style={{ borderBottom: '1px solid #EAD6C0', background: idx % 2 === 0 ? '#FDFBF7' : '#ffffff' }}>
                      <td style={{ padding: '1.2rem 1rem', fontWeight: 900, color: '#2C1E16', fontSize: '1.1rem' }}>#{idx + 1}</td>
                      <td style={{ padding: '1.2rem 1rem' }}>
                        <span style={{ fontWeight: 800, color: '#D4A373', textTransform: 'capitalize', fontSize: '1.1rem' }}>
                          {f.name}
                        </span>
                        <div style={{ fontSize: '0.85rem', color: '#668BA4', fontFamily: 'monospace', fontWeight: 600, marginTop: '0.2rem' }}>
                          cafe_pos_{f.name}
                        </div>
                      </td>
                      <td style={{ padding: '1.2rem 1rem', fontSize: '0.95rem', color: '#668BA4', fontWeight: 600 }}>
                        {new Date(f.created_at).toLocaleDateString()} at {new Date(f.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '1.2rem 1rem', fontWeight: 800, color: '#2C1E16', fontSize: '1.1rem' }}>{f.orders_count}</td>
                      <td style={{ padding: '1.2rem 1rem', fontWeight: 800, color: '#00C853', fontSize: '1.1rem' }}>
                        ${f.total_revenue.toFixed(2)}
                      </td>
                      <td style={{ padding: '1.2rem 1rem', textAlign: 'right' }}>
                        <button 
                          onClick={() => setConfirmWipeName(f.name)}
                          style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', fontWeight: 800, borderRadius: '8px', border: '2px solid #ff6b6b', background: '#FFF5F5', color: '#E03131', cursor: 'pointer' }}
                        >
                          🗑️ Reset Database
                        </button>
                      </td>
                    </tr>
                  ))}
                  {stats.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#B88655', fontWeight: 700 }}>
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
          background: 'rgba(253, 251, 247, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.25s ease'
        }}>
          <div style={{ width: '450px', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#ffffff', border: '2px solid #EAD6C0', borderRadius: '20px', padding: '2rem', boxShadow: '0 20px 50px rgba(44,30,22,0.15)' }}>
            <h3 style={{ margin: 0, color: '#D9480F', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.4rem', fontWeight: 900 }}>
              ⚠️ Critical Action Required
            </h3>
            
            <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.4, color: '#2C1E16', fontWeight: 600 }}>
              You are about to wipe the database for franchise <strong style={{ color: '#D4A373', fontWeight: 900 }}>{confirmWipeName.toUpperCase()}</strong>.
              This will drop and recreate all tables, resetting the tenant DB to its seed state.
            </p>

            <div style={{
              background: '#FFF5F0',
              border: '2px solid #D9480F',
              borderRadius: '10px',
              padding: '1rem',
              fontSize: '0.9rem',
              color: '#D9480F',
              lineHeight: 1.4
            }}>
              <strong style={{ fontWeight: 900 }}>WARNING:</strong> All customer orders, tables active data, and customization records will be permanently deleted.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2C1E16' }}>
                TYPE FRANCHISE NAME <strong style={{ color: '#D4A373' }}>"{confirmWipeName.toUpperCase()}"</strong> TO CONFIRM:
              </label>
              <input
                type="text"
                placeholder={`Type ${confirmWipeName}`}
                value={typedConfirmation}
                onChange={(e) => setTypedConfirmation(e.target.value)}
                style={{ textTransform: 'lowercase', padding: '0.8rem 1rem', borderRadius: '8px', border: '2px solid #EAD6C0', background: '#FDFBF7', color: '#2C1E16', fontSize: '1rem', fontWeight: 700 }}
                autoFocus
              />
            </div>

            {wipeError && (
              <span style={{ fontSize: '0.9rem', textAlign: 'center', color: '#E03131', fontWeight: 700 }}>
                {wipeError}
              </span>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button 
                type="button" 
                onClick={() => { setConfirmWipeName(null); setTypedConfirmation(''); setWipeError(''); }}
                style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: '2px solid #EAD6C0', color: '#668BA4', fontWeight: 800, borderRadius: '10px', cursor: 'pointer', textTransform: 'uppercase' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                disabled={isWiping || typedConfirmation.toLowerCase() !== confirmWipeName.toLowerCase()}
                onClick={handleWipeDatabase} 
                style={{ flex: 1, padding: '0.8rem', background: '#ff6b6b', border: '2px solid #E03131', color: '#ffffff', fontWeight: 800, borderRadius: '10px', cursor: (isWiping || typedConfirmation.toLowerCase() !== confirmWipeName.toLowerCase()) ? 'not-allowed' : 'pointer', textTransform: 'uppercase', opacity: (isWiping || typedConfirmation.toLowerCase() !== confirmWipeName.toLowerCase()) ? 0.5 : 1 }}
              >
                {isWiping ? 'Wiping...' : 'Confirm Reset'}
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
