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
        <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', background: '-webkit-linear-gradient(45deg, #339af0, #ff6b6b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Luminexis
        </h1>
        <p className="text-muted">Select a panel to continue</p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { id: 'admin', title: 'Admin Panel', icon: '🛡️', color: 'var(--primary-color)' },
          { id: 'pos', title: 'POS Terminal', icon: '💻', color: 'var(--success-color)' },
          { id: 'kds', title: 'Kitchen Display', icon: '👨‍🍳', color: 'var(--warning-color)' }
        ].map(panel => (
          <div
            key={panel.id}
            className="glass-card"
            style={{
              width: '200px',
              height: '200px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: selectedPanel === panel.id ? `2px solid ${panel.color}` : '1px solid var(--surface-border)',
              transform: selectedPanel === panel.id ? 'translateY(-8px)' : 'none',
              boxShadow: selectedPanel === panel.id ? `0 12px 40px 0 ${panel.color}40` : 'var(--glass-shadow)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onClick={() => {
              setSelectedPanel(panel.id as any);
              setError('');
              setPassword('');
            }}
          >
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{panel.icon}</div>
            <h3 style={{ margin: 0, color: selectedPanel === panel.id ? panel.color : 'inherit' }}>{panel.title}</h3>
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
