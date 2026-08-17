import React, { useState } from 'react';
import Navbar from './components/Navbar';
import ChatView from './components/ChatView';
import AuthView from './components/AuthView';
import DocumentPanel from './components/DocumentPanel';
import ApprovalQueue from './components/ApprovalQueue';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('access_token'));
  const [showDocuments, setShowDocuments] = useState(false);
  const [showApprovals, setShowApprovals] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setIsLoggedIn(false);
    setShowDocuments(false);
    setShowApprovals(false);
  };

  if (!isLoggedIn) {
    return <AuthView onLoginSuccess={handleLogin} />;
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