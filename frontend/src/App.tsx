import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { socket } from './socket';

import CategoryManager from './pages/Admin/CategoryManager';
import LoginSelection from './pages/LoginSelection';
import PosDashboard from './pages/POS/PosDashboard';
import NewOrderPage from './pages/POS/NewOrderPage';
import PaymentPage from './pages/POS/PaymentPage';
import KitchenPanel from './pages/Kitchen/KitchenPanel';
import { OrderProvider } from './store/OrderContext';

// Placeholder Components
const AdminDashboard = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
    <div className="glass-card"><h1>Admin Dashboard</h1><p>Configure Products, Users, etc.</p></div>
    <CategoryManager />
  </div>
);


const TopNav = () => {
  const location = useLocation();
  if (location.pathname === '/') return null; // Don't show nav on login screen

  return (
    <nav style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--surface-border)' }}>
      <Link to="/"><button className="outline" style={{ padding: '0.4rem 1rem' }}>Logout / Switch User</button></Link>
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
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <TopNav />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Routes>
              <Route path="/" element={<LoginSelection />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
              
              {/* POS Routes */}
              <Route path="/pos" element={<PosDashboard />} />
              <Route path="/pos/new" element={<NewOrderPage />} />
              <Route path="/pos/payment" element={<PaymentPage />} />
              
              <Route path="/kds" element={<KitchenPanel />} />
            </Routes>
          </div>
        </div>
      </OrderProvider>
    </BrowserRouter>
  );
}

export default App;
