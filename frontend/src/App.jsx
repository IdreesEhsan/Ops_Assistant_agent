import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ChatView from './components/ChatView';
import AuthView from './components/AuthView';
import ApprovalQueue from './components/ApprovalQueue';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showApprovals, setShowApprovals] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('access_token')) setIsAuthenticated(true);
  }, []);

  // Logout: clear token and set auth to false
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setIsAuthenticated(false);
    setShowApprovals(false);
  };

  if (!isAuthenticated) {
    return <AuthView onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="app-shell">
      <Navbar setShowApprovals={setShowApprovals} onLogout={handleLogout} />
      <div className="main-layout">
        <ChatView />
        {showApprovals && <ApprovalQueue />}
      </div>
    </div>
  );
}