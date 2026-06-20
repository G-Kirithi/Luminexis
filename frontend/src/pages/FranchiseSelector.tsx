import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFranchises, loginFranchise, registerFranchise } from '../api';

interface Franchise {
  id: number;
  name: string;
  created_at: string;
}

const FranchiseSelector = () => {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [activeTab, setActiveTab] = useState<'select' | 'register'>('select');
  
  // Selection state
  const [selectedFranchiseName, setSelectedFranchiseName] = useState('');
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Registration state
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Super Admin state
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPasskey, setAdminPasskey] = useState('');
  const [adminError, setAdminError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchFranchiseList();
  }, []);

  const fetchFranchiseList = async () => {
    try {
      const data = await getFranchises();
      setFranchises(data);
      if (data.length > 0) {
        setSelectedFranchiseName(data[0].name);
      }
    } catch (err) {
      console.error('Failed to fetch franchises:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFranchiseName) {
      setLoginError('Please select a franchise.');
      return;
    }
    if (!pin) {
      setLoginError('Please enter the Franchise PIN.');
      return;
    }

    setLoginError('');
    setIsLoggingIn(true);
    try {
      const res = await loginFranchise({ name: selectedFranchiseName, pin });
      sessionStorage.setItem('franchise_name', res.franchise_name);
      navigate('/');
    } catch (err: any) {
      setLoginError(err.response?.data?.detail || 'Invalid PIN or credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');

    if (!newName.trim()) {
      setRegisterError('Franchise name is required.');
      return;
    }
    if (!newPin || newPin.length < 4) {
      setRegisterError('PIN must be at least 4 digits.');
      return;
    }

    setIsRegistering(true);
    try {
      await registerFranchise({ name: newName.trim(), pin: newPin });
      setRegisterSuccess('Franchise registered and database provisioned successfully!');
      setNewName('');
      setNewPin('');
      await fetchFranchiseList();
      setActiveTab('select');
    } catch (err: any) {
      setRegisterError(err.response?.data?.detail || 'Failed to register franchise.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleAdminAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasskey === '9999') {
      setShowAdminModal(false);
      setAdminPasskey('');
      setAdminError('');
      navigate('/super-admin');
    } else {
      setAdminError('Incorrect passkey.');
    }
  };

  const isLimitReached = franchises.length >= 3;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '85vh',
      padding: '2rem',
      boxSizing: 'border-box'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '3.5rem', 
          fontWeight: 800,
          margin: 0,
          letterSpacing: '-1.5px',
          background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent' 
        }}>
          Luminexis POS
        </h1>
        <p className="text-muted" style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>
          Multi-Franchise Unified Management System
        </p>
      </div>

      <div className="glass-card" style={{ width: '100%', maxWidth: '450px', padding: '2rem' }}>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--surface-border)',
          marginBottom: '2rem',
          paddingBottom: '0.5rem',
          gap: '1rem'
        }}>
          <button 
            onClick={() => setActiveTab('select')}
            className="outline"
            style={{ 
              flex: 1, 
              border: 'none', 
              background: activeTab === 'select' ? 'rgba(51, 154, 240, 0.15)' : 'transparent',
              color: activeTab === 'select' ? 'var(--primary-color)' : 'var(--text-muted)',
              boxShadow: 'none'
            }}
          >
            🏢 Select Franchise
          </button>
          <button 
            onClick={() => setActiveTab('register')}
            className="outline"
            style={{ 
              flex: 1, 
              border: 'none', 
              background: activeTab === 'register' ? 'rgba(51, 154, 240, 0.15)' : 'transparent',
              color: activeTab === 'register' ? 'var(--primary-color)' : 'var(--text-muted)',
              boxShadow: 'none'
            }}
          >
            ➕ Register New
          </button>
        </div>

        {activeTab === 'select' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {franchises.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)' }}>
                No franchises registered yet. Use the "Register New" tab to get started.
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>SELECT FRANCHISE</label>
                  <select 
                    value={selectedFranchiseName} 
                    onChange={(e) => setSelectedFranchiseName(e.target.value)}
                    style={{
                      padding: '0.8rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--surface-border)',
                      background: 'rgba(0, 0, 0, 0.2)',
                      color: 'var(--text-color)',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {franchises.map(f => (
                      <option key={f.id} value={f.name} style={{ background: '#1a1f26', color: '#fff' }}>
                        {f.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>FRANCHISE PIN</label>
                  <input
                    type="password"
                    maxLength={10}
                    placeholder="Enter PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '8px' }}
                  />
                </div>

                {loginError && (
                  <div style={{ 
                    padding: '0.75rem 1rem', 
                    borderRadius: '8px', 
                    background: 'rgba(255, 107, 107, 0.12)', 
                    border: '1px solid var(--accent-color)', 
                    color: 'var(--accent-color)',
                    fontSize: '0.9rem',
                    textAlign: 'center'
                  }}>
                    {loginError}
                  </div>
                )}

                <button type="submit" disabled={isLoggingIn} style={{ width: '100%', marginTop: '0.5rem' }}>
                  {isLoggingIn ? 'Authenticating...' : 'Enter POS Dashboard'}
                </button>
              </>
            )}
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>FRANCHISE NAME</label>
              <input
                type="text"
                placeholder="e.g. Downtown, Uptown"
                value={newName}
                onChange={(e) => setNewName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                disabled={isLimitReached}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Alphanumeric characters only.</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>SET FRANCHISE PIN</label>
              <input
                type="password"
                placeholder="Choose numeric PIN"
                value={newPin}
                onChange={(e) => setPinVal(e.target.value)}
                disabled={isLimitReached}
                style={{ textAlign: 'center', fontSize: '1.1rem' }}
              />
            </div>

            {registerError && (
              <div style={{ 
                padding: '0.75rem 1rem', 
                borderRadius: '8px', 
                background: 'rgba(255, 107, 107, 0.12)', 
                border: '1px solid var(--accent-color)', 
                color: 'var(--accent-color)',
                fontSize: '0.9rem',
                textAlign: 'center'
              }}>
                {registerError}
              </div>
            )}

            {registerSuccess && (
              <div style={{ 
                padding: '0.75rem 1rem', 
                borderRadius: '8px', 
                background: 'rgba(81, 207, 102, 0.12)', 
                border: '1px solid var(--success-color)', 
                color: 'var(--success-color)',
                fontSize: '0.9rem',
                textAlign: 'center'
              }}>
                {registerSuccess}
              </div>
            )}

            {isLimitReached ? (
              <div style={{ 
                padding: '0.75rem 1rem', 
                borderRadius: '8px', 
                background: 'rgba(252, 196, 25, 0.1)', 
                border: '1px solid var(--warning-color)', 
                color: 'var(--warning-color)',
                fontSize: '0.9rem',
                textAlign: 'center',
                fontWeight: 500
              }}>
                ⚠️ Maximum limit of 3 franchises has been reached.
              </div>
            ) : (
              <button type="submit" disabled={isRegistering} style={{ width: '100%', background: 'var(--success-color)', boxShadow: '0 4px 14px 0 rgba(81, 207, 102, 0.39)' }}>
                {isRegistering ? 'Provisioning Tenant Database...' : 'Register & Create Database'}
              </button>
            )}
          </form>
        )}
      </div>

      {/* Super Admin entrance trigger */}
      <div style={{ marginTop: '2.5rem' }}>
        <button 
          onClick={() => setShowAdminModal(true)} 
          className="outline" 
          style={{ 
            borderColor: 'rgba(255,255,255,0.15)', 
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            padding: '0.6rem 1.5rem'
          }}
        >
          ⚙️ Super Admin Portal
        </button>
      </div>

      {/* Super Admin Access Passkey Modal */}
      {showAdminModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.25s ease'
        }}>
          <div className="glass-card" style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ margin: 0, textAlign: 'center' }}>Super Admin Access</h3>
            <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0, textAlign: 'center' }}>
              Enter the Super Admin 4-digit passkey to continue.
            </p>
            <form onSubmit={handleAdminAccess} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="password"
                placeholder="Passkey"
                value={adminPasskey}
                onChange={(e) => setAdminPasskey(e.target.value)}
                style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '6px' }}
                autoFocus
              />
              {adminError && <span className="text-danger" style={{ fontSize: '0.8rem', textAlign: 'center' }}>{adminError}</span>}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="outline" onClick={() => { setShowAdminModal(false); setAdminPasskey(''); setAdminError(''); }} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" style={{ flex: 1 }}>
                  Unlock
                </button>
              </div>
            </form>
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

  function setPinVal(val: string) {
    setNewPin(val.replace(/\D/g, ''));
  }
};

export default FranchiseSelector;
