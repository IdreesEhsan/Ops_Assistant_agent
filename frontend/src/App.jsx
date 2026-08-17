import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ChatView from './components/ChatView';
import AuthView from './components/AuthView';
import ApprovalQueue from './components/ApprovalQueue';
import DocumentPanel from './components/DocumentPanel';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showApprovals, setShowApprovals] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);   // NEW: toggle documents

  useEffect(() => {
    if (localStorage.getItem('access_token')) setIsAuthenticated(true);
  }, []);

  // Logout: clear token and reset state
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setIsAuthenticated(false);
    setShowApprovals(false);
    setShowDocuments(false);
  };

  if (!isAuthenticated) {
    return <AuthView onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="app-shell">
      <Navbar
        setShowApprovals={setShowApprovals}
        setShowDocuments={setShowDocuments}
        onLogout={handleLogout}
      />
      <div className="main-layout">
        <ChatView />
        {showDocuments && <DocumentPanel />}
        {showApprovals && <ApprovalQueue />}
      </div>
    </div>
  );
}