import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ChatView from './components/ChatView';
import AuthView from './components/AuthView';
import DocumentPanel from './components/DocumentPanel';
import ApprovalQueue from './components/ApprovalQueue';

function isTokenExpired(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
    return payload.exp ? Date.now() >= payload.exp * 1000 : true;
  } catch {
    return true;
  }
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showApprovals, setShowApprovals] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setIsLoggedIn(false);
    setSessionExpired(false);
  };

  useEffect(() => {
    const handler = () => {
      setSessionExpired(true);
      setIsLoggedIn(false);
    };
    window.addEventListener('auth_expired', handler);

    const token = localStorage.getItem('access_token');
    if (token && !isTokenExpired(token)) {
      setIsLoggedIn(true);
    } else {
      if (token) {
        setSessionExpired(true);
        localStorage.removeItem('access_token');
      }
      setIsLoggedIn(false);
    }

    return () => window.removeEventListener('auth_expired', handler);
  }, []);

  if (!isLoggedIn) {
    return <AuthView onLoginSuccess={() => { setIsLoggedIn(true); setSessionExpired(false); }} sessionExpired={sessionExpired} />;
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0f1e' }}>
      <Navbar
        setShowDocuments={setShowDocuments}
        setShowApprovals={setShowApprovals}
        onLogout={handleLogout}
      />
      <div style={{ flex: 1, position: 'relative', paddingTop: '16px' }}>
        <ChatView />
        {showDocuments && (
          <div style={{
            position: 'absolute', top: '16px', right: '16px', width: '400px',
            maxHeight: 'calc(100vh - 140px)', overflowY: 'auto',
            background: 'var(--bg-secondary)', border: '1px solid var(--panel-border)',
            borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            zIndex: 10, padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0 }}>Documents</h3>
              <button onClick={() => setShowDocuments(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>
            <DocumentPanel />
          </div>
        )}
        {showApprovals && (
          <div style={{
            position: 'absolute', top: '16px', right: '16px', width: '400px',
            maxHeight: 'calc(100vh - 140px)', overflowY: 'auto',
            background: 'var(--bg-secondary)', border: '1px solid var(--panel-border)',
            borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            zIndex: 10, padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0 }}>Approval Queue</h3>
              <button onClick={() => setShowApprovals(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>
            <ApprovalQueue />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;