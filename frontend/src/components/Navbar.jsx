import React from 'react';
import { MessageSquare, FileText, ShieldCheck, LogOut } from 'lucide-react';

export default function Navbar({ setShowApprovals, onLogout }) {
  return (
    <header className="ops-navbar">
      <div className="ops-logo">
        <ShieldCheck size={24} color="#00f2fe" />
        <h1>OpsAssistant</h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <nav className="ops-tabs">
          <button className="ops-tab active">
            <MessageSquare size={16} /> Agent Chat
          </button>
          <button className="ops-tab" onClick={() => setShowApprovals(prev => !prev)}>
            <FileText size={16} /> Approval Queue
          </button>
        </nav>
        <button
          onClick={onLogout}
          className="ops-tab"
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#f87171' }}
          title="Logout"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </header>
  );
}