import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ChatView from './components/ChatView';
import AuthView from './components/AuthView';
import ApprovalQueue from './components/ApprovalQueue';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showApprovals, setShowApprovals] = useState(false);

  useEffect(() => {
    // Check for token on initial load
    if (localStorage.getItem('access_token')) setIsAuthenticated(true);
  }, []);

  if (!isAuthenticated) {
    return <AuthView onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="app-shell">
      <Navbar setShowApprovals={setShowApprovals} />
      <div className="main-layout">
        <ChatView />
        {showApprovals && <ApprovalQueue />}
      </div>
    </div>
  );
}