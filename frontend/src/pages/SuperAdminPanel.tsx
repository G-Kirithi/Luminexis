import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFranchiseStats, getFranchiseAnalytics, resetFranchiseDb } from '../api';

interface FranchiseStats {
  name: string;
  created_at: string;
  orders_count: number;
  total_revenue: number;
  average_order: number;
  top_product: string;
  top_category: string;
}

const SuperAdminPanel = () => {
  const [stats, setStats] = useState<FranchiseStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selected franchise for detailed analytics
  const [selectedFranchiseName, setSelectedFranchiseName] = useState<string>('');
  const [period, setPeriod] = useState<string>('all');
  const [userId, setUserId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);
  const [analyticsError, setAnalyticsError] = useState<string>('');

  // Wipe database modal state
  const [confirmWipeName, setConfirmWipeName] = useState<string | null>(null);
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [isWiping, setIsWiping] = useState(false);
  const [wipeError, setWipeError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (selectedFranchiseName) {
      fetchAnalytics();
    }
  }, [selectedFranchiseName, period, userId, sessionId, productId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getFranchiseStats();
      setStats(data);
      if (data.length > 0 && !selectedFranchiseName) {
        setSelectedFranchiseName(data[0].name);
      }
      setError('');
    } catch (err) {
      console.error('Failed to load franchise stats:', err);
      setError('Could not retrieve franchise databases data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const params: any = { period };
      if (userId) params.user_id = userId;
      if (sessionId) params.session_id = sessionId;
      if (productId) params.product_id = productId;
      
      const data = await getFranchiseAnalytics(selectedFranchiseName, params);
      setAnalyticsData(data);
      setAnalyticsError('');
    } catch (err) {
      console.error('Failed to load franchise analytics:', err);
      setAnalyticsError('Could not retrieve detailed analytics for this franchise.');
    } finally {
      setAnalyticsLoading(false);
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

  const handleResetFilters = () => {
    setPeriod('all');
    setUserId('');
    setSessionId('');
    setProductId('');
  };

  const handleDownloadReport = (format: 'pdf' | 'xls') => {
    alert(`Generating ${format.toUpperCase()} report for franchise '${selectedFranchiseName.toUpperCase()}'...\nFilters: Period=${period}, User=${userId || 'All'}, Session=${sessionId || 'All'}, Product=${productId || 'All'}\nDownload started.`);
  };

  // Cross-tenant aggregated summary
  const totalGlobalRevenue = stats.reduce((acc, curr) => acc + curr.total_revenue, 0);
  const totalGlobalOrders = stats.reduce((acc, curr) => acc + curr.orders_count, 0);

  // Leaderboard sorting
  const leaderboardStats = [...stats].sort((a, b) => b.total_revenue - a.total_revenue);

  // Helper for coordinates in SVG pie chart
  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  // Render pure SVG Pie/Donut Chart
  const renderPieChart = (categories: any[]) => {
    if (!categories || categories.length === 0) {
      return (
        <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)', width: '160px', height: '160px' }}>
          <circle cx="0" cy="0" r="1" fill="#EAD6C0" />
          <text x="0" y="0" textAnchor="middle" dy="0.1" fill="#2C1E16" fontSize="0.2" style={{ transform: 'rotate(90deg)' }}>No Data</text>
        </svg>
      );
    }
    
    let accumulatedPercent = 0;
    return (
      <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)', width: '180px', height: '180px', filter: 'drop-shadow(0px 8px 15px rgba(44,30,22,0.06))' }}>
        {categories.map((cat, idx) => {
          const percent = cat.percentage / 100;
          if (percent >= 1.0) {
            return <circle key={idx} cx="0" cy="0" r="1" fill={cat.color} />;
          }
          const [startX, startY] = getCoordinatesForPercent(accumulatedPercent);
          accumulatedPercent += percent;
          const [endX, endY] = getCoordinatesForPercent(accumulatedPercent);
          const largeArcFlag = percent > 0.5 ? 1 : 0;
          const pathData = [
            `M 0 0`,
            `L ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `Z`
          ].join(' ');
          return <path key={idx} d={pathData} fill={cat.color} stroke="#ffffff" strokeWidth="0.015" />;
        })}
      </svg>
    );
  };

  // Render pure SVG Sales Line Chart
  const renderLineChart = (chartData: { label: string; value: number }[]) => {
    if (!chartData || chartData.length === 0) {
      return (
        <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B88655', fontWeight: 600 }}>
          No sales data available.
        </div>
      );
    }

    const width = 500;
    const height = 220;
    const paddingLeft = 55;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 40;

    const maxVal = Math.max(...chartData.map(d => d.value), 10);
    const roundMax = Math.ceil(maxVal / 10) * 10;

    const getX = (index: number) => {
      const step = (width - paddingLeft - paddingRight) / (chartData.length - 1 || 1);
      return paddingLeft + index * step;
    };

    const getY = (value: number) => {
      const usableHeight = height - paddingTop - paddingBottom;
      return height - paddingBottom - (value / roundMax) * usableHeight;
    };

    const points = chartData.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');
    const linePath = `M ${points}`;
    const fillPath = `${linePath} L ${getX(chartData.length - 1)},${height - paddingBottom} L ${getX(0)},${height - paddingBottom} Z`;

    const gridLines = [0, roundMax * 0.1, roundMax * 0.5, roundMax];

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4A373" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#D4A373" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {gridLines.map((gl, i) => (
          <g key={i}>
            <line 
              x1={paddingLeft} 
              y1={getY(gl)} 
              x2={width - paddingRight} 
              y2={getY(gl)} 
              stroke="#EAD6C0" 
              strokeWidth="1" 
              strokeDasharray={gl === 0 ? "none" : "3 3"}
            />
            <text 
              x={paddingLeft - 8} 
              y={getY(gl) + 3} 
              textAnchor="end" 
              fill="#B88655" 
              style={{ fontSize: '10px', fontWeight: 800 }}
            >
              ${gl.toFixed(0)}
            </text>
          </g>
        ))}

        {points && <path d={fillPath} fill="url(#salesGrad)" />}
        {points && <path d={linePath} fill="none" stroke="#D4A373" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

        {chartData.map((d, i) => (
          <circle 
            key={i} 
            cx={getX(i)} 
            cy={getY(d.value)} 
            r="3.5" 
            fill="#ffffff" 
            stroke="#D4A373" 
            strokeWidth="2" 
          />
        ))}

        {chartData.map((d, i) => {
          const showLabel = chartData.length <= 8 || i % Math.ceil(chartData.length / 8) === 0 || i === chartData.length - 1;
          if (!showLabel) return null;
          return (
            <text 
              key={i} 
              x={getX(i)} 
              y={height - 15} 
              textAnchor="middle" 
              fill="#B88655" 
              style={{ fontSize: '10px', fontWeight: 800 }}
            >
              {d.label}
            </text>
          );
        })}
      </svg>
    );
  };

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '2rem', background: '#FDFBF7', color: '#2C1E16' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button 
            onClick={() => navigate('/franchise-selector')} 
            className="outline" 
            style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', marginBottom: '0.5rem', background: 'transparent', border: '2px solid #D4A373', color: '#D4A373', borderRadius: '8px', fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer' }}
          >
            ← Back to Landing Page
          </button>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900, color: '#2C1E16' }}>Super Admin Panel</h1>
          <span style={{ color: '#B88655', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.5px' }}>Cross-tenant analytics, leaderboards, and database management</span>
        </div>
        <button onClick={fetchStats} className="outline" style={{ background: '#D4A373', color: '#2C1E16', border: 'none', padding: '0.6rem 1.2rem', fontWeight: 800, borderRadius: '8px', cursor: 'pointer' }}>
          🔄 Refresh Leaderboard
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', borderRadius: '10px', background: '#FFF5F5', border: '2px solid #ff6b6b', color: '#E03131', fontWeight: 700 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#B88655', fontWeight: 700, fontSize: '1.2rem' }}>
          Loading franchise registry metrics...
        </div>
      ) : (
        <>
          {/* Global Consolidated Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', background: '#ffffff', border: '2.5px solid #EAD6C0', borderRadius: '16px', boxShadow: '0 4px 15px rgba(44,30,22,0.05)' }}>
              <div style={{ fontSize: '2.5rem' }}>🏢</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: '#2C1E16', lineHeight: 1.1 }}>
                  {stats.length}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#B88655', fontWeight: 800, textTransform: 'uppercase', marginTop: '0.2rem' }}>
                  Active Franchises
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', background: '#ffffff', border: '2.5px solid #EAD6C0', borderRadius: '16px', boxShadow: '0 4px 15px rgba(44,30,22,0.05)' }}>
              <div style={{ fontSize: '2.5rem', color: '#00C853' }}>💰</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: '#00C853', lineHeight: 1.1 }}>
                  ${totalGlobalRevenue.toFixed(2)}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#B88655', fontWeight: 800, textTransform: 'uppercase', marginTop: '0.2rem' }}>
                  Consolidated Revenue
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', background: '#ffffff', border: '2.5px solid #EAD6C0', borderRadius: '16px', boxShadow: '0 4px 15px rgba(44,30,22,0.05)' }}>
              <div style={{ fontSize: '2.5rem', color: '#D4A373' }}>🧾</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: '#D4A373', lineHeight: 1.1 }}>
                  {totalGlobalOrders}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#B88655', fontWeight: 800, textTransform: 'uppercase', marginTop: '0.2rem' }}>
                  Consolidated Orders
                </span>
              </div>
            </div>
          </div>

          {/* Franchise Leaderboard Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.8rem', margin: 0, fontWeight: 900, color: '#2C1E16' }}>🏆 Franchise Leaderboard</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {leaderboardStats.map((f, index) => {
                const medals = ["🥇 First Place", "🥈 Second Place", "🥉 Third Place"];
                const borderColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
                const bgColors = ["#FFFDF0", "#F7F9FA", "#FAF5F0"];
                return (
                  <div key={f.name} style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.8rem', 
                    padding: '1.5rem', 
                    background: bgColors[index] || '#ffffff', 
                    border: `2.5px solid ${borderColors[index] || '#EAD6C0'}`, 
                    borderRadius: '16px', 
                    boxShadow: '0 8px 24px rgba(44,30,22,0.06)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: borderColors[index] || '#B88655' }}>
                        {medals[index] || `Rank #${index + 1}`}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#668BA4', fontWeight: 600 }}>
                        Reg: {new Date(f.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#2C1E16', textTransform: 'capitalize' }}>
                      {f.name}
                    </div>
                    <div style={{ height: '1.5px', background: '#EAD6C0', margin: '0.2rem 0' }}></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontSize: '0.95rem' }}>
                      <div>
                        <div style={{ color: '#B88655', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Revenue</div>
                        <div style={{ fontWeight: 900, color: '#00C853', fontSize: '1.2rem' }}>${f.total_revenue.toFixed(2)}</div>
                      </div>
                      <div>
                        <div style={{ color: '#B88655', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Orders Count</div>
                        <div style={{ fontWeight: 900, color: '#2C1E16', fontSize: '1.2rem' }}>{f.orders_count}</div>
                      </div>
                      <div>
                        <div style={{ color: '#B88655', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Average Order</div>
                        <div style={{ fontWeight: 800, color: '#D4A373' }}>${f.average_order.toFixed(2)}</div>
                      </div>
                      <div>
                        <div style={{ color: '#B88655', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Best Category</div>
                        <div style={{ fontWeight: 800, color: '#668BA4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.top_category}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: '0.4rem' }}>
                      <div style={{ color: '#B88655', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Top Product</div>
                      <div style={{ fontWeight: 800, color: '#2C1E16', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🔥 {f.top_product}</div>
                    </div>
                  </div>
                );
              })}
              {stats.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#B88655', fontWeight: 700 }}>
                  No franchises registered to display on the leaderboard.
                </div>
              )}
            </div>
          </div>

          {/* Detailed Analytics Dashboard */}
          {stats.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#ffffff', border: '2px solid #EAD6C0', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 15px rgba(44,30,22,0.05)' }}>
              
              {/* Dashboard Title & Franchise Selector */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '2px solid #EAD6C0', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <h2 style={{ fontSize: '1.6rem', margin: 0, fontWeight: 900, color: '#2C1E16' }}>📊 Detailed Analytics:</h2>
                  <select 
                    value={selectedFranchiseName} 
                    onChange={(e) => {
                      setSelectedFranchiseName(e.target.value);
                      handleResetFilters();
                    }}
                    style={{ padding: '0.6rem 1.2rem', fontSize: '1.1rem', fontWeight: 900, border: '2.5px solid #D4A373', borderRadius: '8px', color: '#2C1E16', background: '#FDFBF7', textTransform: 'capitalize', cursor: 'pointer' }}
                  >
                    {stats.map(f => (
                      <option key={f.name} value={f.name}>{f.name}</option>
                    ))}
                  </select>
                </div>

                {/* Report Download Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#B88655', fontWeight: 800, textTransform: 'uppercase' }}>Download report:</span>
                  <button 
                    onClick={() => handleDownloadReport('pdf')}
                    style={{ background: '#2C1E16', color: '#ffffff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    PDF
                  </button>
                  <button 
                    onClick={() => handleDownloadReport('xls')}
                    style={{ background: '#668BA4', color: '#ffffff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    XLS
                  </button>
                </div>
              </div>

              {/* Filter Controls Bar */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', background: '#FDFBF7', border: '1.5px solid #EAD6C0', borderRadius: '10px', padding: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: '130px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#B88655', textTransform: 'uppercase' }}>Select Period</span>
                  <select 
                    value={period} 
                    onChange={(e) => setPeriod(e.target.value)}
                    style={{ padding: '0.5rem 0.8rem', borderRadius: '6px', border: '1.5px solid #EAD6C0', fontSize: '0.9rem', fontWeight: 700, color: '#2C1E16' }}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: '150px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#B88655', textTransform: 'uppercase' }}>User</span>
                  <select 
                    value={userId} 
                    onChange={(e) => setUserId(e.target.value)}
                    style={{ padding: '0.5rem 0.8rem', borderRadius: '6px', border: '1.5px solid #EAD6C0', fontSize: '0.9rem', fontWeight: 700, color: '#2C1E16' }}
                  >
                    <option value="">All Users</option>
                    {analyticsData?.filters?.users?.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: '150px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#B88655', textTransform: 'uppercase' }}>Session</span>
                  <select 
                    value={sessionId} 
                    onChange={(e) => setSessionId(e.target.value)}
                    style={{ padding: '0.5rem 0.8rem', borderRadius: '6px', border: '1.5px solid #EAD6C0', fontSize: '0.9rem', fontWeight: 700, color: '#2C1E16' }}
                  >
                    <option value="">All Sessions</option>
                    {analyticsData?.filters?.sessions?.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: '180px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#B88655', textTransform: 'uppercase' }}>Product</span>
                  <select 
                    value={productId} 
                    onChange={(e) => setProductId(e.target.value)}
                    style={{ padding: '0.5rem 0.8rem', borderRadius: '6px', border: '1.5px solid #EAD6C0', fontSize: '0.9rem', fontWeight: 700, color: '#2C1E16' }}
                  >
                    <option value="">All Products</option>
                    {analyticsData?.filters?.products?.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={handleResetFilters}
                  style={{ padding: '0.5rem 1rem', background: 'transparent', border: '2px solid #D4A373', color: '#D4A373', borderRadius: '6px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', height: '36px' }}
                >
                  ✖ Reset Filters
                </button>
              </div>

              {analyticsError && (
                <div style={{ padding: '1rem', background: '#FFF5F5', color: '#E03131', fontWeight: 700, borderRadius: '8px' }}>
                  {analyticsError}
                </div>
              )}

              {analyticsLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#B88655', fontWeight: 700 }}>
                  Fetching detailed metrics...
                </div>
              ) : analyticsData && (
                <>
                  {/* KPI Cards Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                    
                    {/* Total Order Card */}
                    <div style={{ padding: '1.5rem', background: '#FDFBF7', border: '2px solid #EAD6C0', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', color: '#B88655', fontWeight: 800, textTransform: 'uppercase' }}>Total Order</span>
                      <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#2C1E16', lineHeight: 1.1 }}>
                        {analyticsData.metrics.total_orders}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 800, color: analyticsData.metrics.orders_pct >= 0 ? '#00C853' : '#E03131' }}>
                        <span>{analyticsData.metrics.orders_pct >= 0 ? '▲' : '▼'}</span>
                        <span>{Math.abs(analyticsData.metrics.orders_pct)}%</span>
                        <span style={{ color: '#668BA4', fontWeight: 600 }}>Since Last Period</span>
                      </div>
                    </div>

                    {/* Revenue Card */}
                    <div style={{ padding: '1.5rem', background: '#FDFBF7', border: '2px solid #EAD6C0', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', color: '#B88655', fontWeight: 800, textTransform: 'uppercase' }}>Revenue</span>
                      <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#00C853', lineHeight: 1.1 }}>
                        ${analyticsData.metrics.total_revenue.toFixed(2)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 800, color: analyticsData.metrics.revenue_pct >= 0 ? '#00C853' : '#E03131' }}>
                        <span>{analyticsData.metrics.revenue_pct >= 0 ? '▲' : '▼'}</span>
                        <span>{Math.abs(analyticsData.metrics.revenue_pct)}%</span>
                        <span style={{ color: '#668BA4', fontWeight: 600 }}>Since Last Period</span>
                      </div>
                    </div>

                    {/* Average Order Card */}
                    <div style={{ padding: '1.5rem', background: '#FDFBF7', border: '2px solid #EAD6C0', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', color: '#B88655', fontWeight: 800, textTransform: 'uppercase' }}>Average Order</span>
                      <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#2C1E16', lineHeight: 1.1 }}>
                        ${analyticsData.metrics.average_order.toFixed(2)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 800, color: analyticsData.metrics.aov_pct >= 0 ? '#00C853' : '#E03131' }}>
                        <span>{analyticsData.metrics.aov_pct >= 0 ? '▲' : '▼'}</span>
                        <span>{Math.abs(analyticsData.metrics.aov_pct)}%</span>
                        <span style={{ color: '#668BA4', fontWeight: 600 }}>Since Last Period</span>
                      </div>
                    </div>
                  </div>

                  {/* Charts Section */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginTop: '1rem' }}>
                    
                    {/* Sales Line Chart Container */}
                    <div style={{ border: '2.5px solid #EAD6C0', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#2C1E16' }}>Sales over time</h3>
                      <div style={{ height: '220px', width: '100%' }}>
                        {renderLineChart(analyticsData.chart_data)}
                      </div>
                    </div>

                    {/* Top Selling Category Pie Chart Container */}
                    <div style={{ border: '2.5px solid #EAD6C0', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#2C1E16' }}>Top selling Category</h3>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1rem', minHeight: '220px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {renderPieChart(analyticsData.top_categories)}
                        </div>
                        {/* Legend */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '150px' }}>
                          {analyticsData.top_categories.map((cat: any, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 700 }}>
                              <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', background: cat.color }}></span>
                              <span style={{ color: '#2C1E16', textTransform: 'capitalize' }}>{cat.name}</span>
                              <span style={{ color: '#668BA4' }}>{cat.percentage}%</span>
                            </div>
                          ))}
                          {analyticsData.top_categories.length === 0 && (
                            <div style={{ fontSize: '0.9rem', color: '#B88655', fontWeight: 600 }}>No categories found</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Orders Table Container */}
                  <div style={{ border: '2.5px solid #EAD6C0', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#2C1E16' }}>Top Orders</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '2.5px solid #EAD6C0' }}>
                            <th style={{ padding: '0.8rem', color: '#B88655', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 800 }}>Order</th>
                            <th style={{ padding: '0.8rem', color: '#B88655', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 800 }}>Sessions</th>
                            <th style={{ padding: '0.8rem', color: '#B88655', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 800 }}>Point of Sale</th>
                            <th style={{ padding: '0.8rem', color: '#B88655', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 800 }}>Date</th>
                            <th style={{ padding: '0.8rem', color: '#B88655', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 800 }}>Customer</th>
                            <th style={{ padding: '0.8rem', color: '#B88655', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 800 }}>Employee</th>
                            <th style={{ padding: '0.8rem', color: '#B88655', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 800, textAlign: 'right' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.top_orders.map((o: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #EAD6C0', background: idx % 2 === 0 ? '#FDFBF7' : '#ffffff' }}>
                              <td style={{ padding: '0.8rem', fontWeight: 800, color: '#668BA4' }}>{o.order_name}</td>
                              <td style={{ padding: '0.8rem', fontWeight: 700, color: '#2C1E16' }}>{o.session}</td>
                              <td style={{ padding: '0.8rem', fontWeight: 700, color: '#2C1E16' }}>{o.pos}</td>
                              <td style={{ padding: '0.8rem', color: '#668BA4', fontWeight: 600 }}>{o.date}</td>
                              <td style={{ padding: '0.8rem', fontWeight: 700, color: '#2C1E16' }}>{o.customer}</td>
                              <td style={{ padding: '0.8rem', fontWeight: 700, color: '#2C1E16' }}>{o.employee}</td>
                              <td style={{ padding: '0.8rem', fontWeight: 900, color: '#00C853', textAlign: 'right' }}>${o.total.toFixed(2)}</td>
                            </tr>
                          ))}
                          {analyticsData.top_orders.length === 0 && (
                            <tr>
                              <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#B88655', fontWeight: 700 }}>
                                No orders found in this period.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Top Product & Top Category Side-by-Side Tables */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginTop: '1rem' }}>
                    
                    {/* Top Products Table */}
                    <div style={{ border: '2.5px solid #EAD6C0', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#2C1E16' }}>Top Product</h3>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #EAD6C0' }}>
                            <th style={{ padding: '0.6rem 0.4rem', color: '#B88655', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 800 }}>Product</th>
                            <th style={{ padding: '0.6rem 0.4rem', color: '#B88655', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 800 }}>Qty</th>
                            <th style={{ padding: '0.6rem 0.4rem', color: '#B88655', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 800, textAlign: 'right' }}>Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.top_products.map((p: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #EAD6C0' }}>
                              <td style={{ padding: '0.6rem 0.4rem', fontWeight: 800, color: '#2C1E16' }}>{p.name}</td>
                              <td style={{ padding: '0.6rem 0.4rem', fontWeight: 700, color: '#668BA4' }}>{p.qty}</td>
                              <td style={{ padding: '0.6rem 0.4rem', fontWeight: 900, color: '#00C853', textAlign: 'right' }}>${p.revenue.toFixed(2)}</td>
                            </tr>
                          ))}
                          {analyticsData.top_products.length === 0 && (
                            <tr>
                              <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: '#B88655', fontWeight: 700 }}>
                                No products sold.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Top Category Table */}
                    <div style={{ border: '2.5px solid #EAD6C0', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#2C1E16' }}>Top Category</h3>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #EAD6C0' }}>
                            <th style={{ padding: '0.6rem 0.4rem', color: '#B88655', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 800 }}>Category</th>
                            <th style={{ padding: '0.6rem 0.4rem', color: '#B88655', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 800, textAlign: 'right' }}>Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.top_categories.slice(0, 5).map((c: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #EAD6C0' }}>
                              <td style={{ padding: '0.6rem 0.4rem', fontWeight: 800, color: '#2C1E16', textTransform: 'capitalize' }}>
                                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: c.color, marginRight: '0.4rem' }}></span>
                                {c.name}
                              </td>
                              <td style={{ padding: '0.6rem 0.4rem', fontWeight: 900, color: '#00C853', textAlign: 'right' }}>${c.revenue.toFixed(2)}</td>
                            </tr>
                          ))}
                          {analyticsData.top_categories.length === 0 && (
                            <tr>
                              <td colSpan={2} style={{ padding: '2rem', textAlign: 'center', color: '#B88655', fontWeight: 700 }}>
                                No categories found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

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
