import React from 'react';
import { MessageSquare, FileText, ShieldCheck, LogOut, FolderOpen } from 'lucide-react';

export default function Navbar({ activeTab, onTabChange, onLogout }) {
  const tabs = [
    { id: 'chat', label: 'Agent Chat', icon: <MessageSquare size={16} /> },
    { id: 'documents', label: 'Documents', icon: <FolderOpen size={16} /> },
    { id: 'approval', label: 'Approval Queue', icon: <FileText size={16} /> },
  ];

  return (
    <header className="ops-navbar">
      <div className="ops-logo">
        <ShieldCheck size={24} color="#00f2fe" />
        <h1>OpsAssistant</h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <nav className="ops-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`ops-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
              style={{
                background: activeTab === tab.id ? 'rgba(0,242,254,0.15)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '6px',
                color: activeTab === tab.id ? '#00f2fe' : 'var(--text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
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