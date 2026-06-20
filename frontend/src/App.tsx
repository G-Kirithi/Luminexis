import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { socket } from './socket';

import CategoryManager from './pages/Admin/CategoryManager';
import LoginSelection from './pages/LoginSelection';
import PosDashboard from './pages/POS/PosDashboard';
import NewOrderPage from './pages/POS/NewOrderPage';
import { OrderProvider } from './store/OrderContext';

// Placeholder Components
const AdminDashboard = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
    <div className="glass-card"><h1>Admin Dashboard</h1><p>Configure Products, Users, etc.</p></div>
    <CategoryManager />
  </div>
);
const KitchenDisplay = () => <div className="glass-card" style={{ margin: '2rem' }}><h1>Kitchen Display</h1><p>Real-time order statuses</p></div>;

// Navigation Bar Component
const TopNav = () => {
  const location = useLocation();
  if (location.pathname === '/') return null; // Don't show nav on login screen

  return (
    <nav style={{ padding: '1rem 2rem', display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--surface-border)' }}>
      <Link to="/"><button className="outline" style={{ padding: '0.4rem 1rem' }}>Back to Login</button></Link>
      <Link to="/admin"><button className={location.pathname.startsWith('/admin') ? '' : 'outline'} style={{ padding: '0.4rem 1rem' }}>Admin</button></Link>
      <Link to="/pos"><button className={location.pathname.startsWith('/pos') ? '' : 'outline'} style={{ padding: '0.4rem 1rem' }}>POS</button></Link>
      <Link to="/kds"><button className={location.pathname.startsWith('/kds') ? '' : 'outline'} style={{ padding: '0.4rem 1rem' }}>Kitchen</button></Link>
    </nav>
  );
};

function App() {
  useEffect(() => {
    // Connect to socket.io
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <BrowserRouter>
      <OrderProvider>
        <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
          <TopNav />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Routes>
              <Route path="/" element={<LoginSelection />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
              
              {/* POS Routes */}
              <Route path="/pos" element={<PosDashboard />} />
              <Route path="/pos/new" element={<NewOrderPage />} />
              
              <Route path="/kds" element={<KitchenDisplay />} />
            </Routes>
          </div>
        </div>
      </OrderProvider>
    </BrowserRouter>
  );
}

export default App;
