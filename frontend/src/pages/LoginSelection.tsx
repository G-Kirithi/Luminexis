import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginSelection = () => {
  const [selectedPanel, setSelectedPanel] = useState<'admin' | 'pos' | 'kds' | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1234') { // Dummy password for now
      switch (selectedPanel) {
        case 'admin': navigate('/admin'); break;
        case 'pos': navigate('/pos'); break;
        case 'kds': navigate('/kds'); break;
      }
    } else {
      setError('Invalid password. Hint: try 1234');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      gap: '2rem'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', fontFamily: 'var(--heading-font)', fontWeight: 600, color: 'var(--text-color)' }}>
          Odoo Cafe POS
        </h1>
        <p className="text-muted">Select a panel to continue</p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { id: 'admin', title: 'Admin Panel', color: '#1864AB', bg: '/images/admin.png' },
          { id: 'pos', title: 'POS Terminal', color: '#B88655', bg: '/images/pos.png' },
          { id: 'kds', title: 'Kitchen Display', color: '#D9480F', bg: '/images/kds.png' }
        ].map(panel => (
          <div
            key={panel.id}
            className="glass-card"
            style={{
              width: '260px',
              height: '320px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              cursor: 'pointer',
              border: selectedPanel === panel.id ? `2px solid ${panel.color}` : '1px solid var(--surface-border)',
              transform: selectedPanel === panel.id ? 'translateY(-8px)' : 'none',
              boxShadow: selectedPanel === panel.id ? `0 12px 40px 0 ${panel.color}40` : 'var(--glass-shadow)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backgroundImage: `linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0.75) 30%, rgba(255,255,255,0.0) 80%), url(${panel.bg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              paddingBottom: '2rem'
            }}
            onClick={() => {
              setSelectedPanel(panel.id as any);
              setError('');
              setPassword('');
            }}
          >
            <h3 style={{ 
              margin: 0, 
              color: selectedPanel === panel.id ? panel.color : 'var(--text-color)', 
              fontWeight: 800,
              fontSize: '1.4rem',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontFamily: 'var(--font-family)',
              marginBottom: '0.5rem'
            }}>
              {panel.title}
            </h3>
          </div>
        ))}
      </div>

      {selectedPanel && (
        <form onSubmit={handleLogin} className="glass-card" style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.3s ease' }}>
          <h3 style={{ margin: 0, textAlign: 'center' }}>Enter Password</h3>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error && <span className="text-danger" style={{ fontSize: '0.8rem', textAlign: 'center' }}>{error}</span>}
          <button type="submit" style={{ width: '100%' }}>Login</button>
        </form>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
};

export default LoginSelection;
