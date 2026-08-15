import React from 'react';
import { MessageSquare, FileText, ShieldCheck } from 'lucide-react';

export default function Navbar({ setShowApprovals }) {
  return (
    <header className="ops-navbar">
      <div className="ops-logo">
        <ShieldCheck size={24} color="#00f2fe" />
        <h1>OpsAssistant</h1>
      </div>
      <nav className="ops-tabs">
        <button className="ops-tab active">
          <MessageSquare size={16} /> Agent Chat
        </button>
        <button className="ops-tab" onClick={() => setShowApprovals(prev => !prev)}>
          <FileText size={16} /> Approval Queue
        </button>
      </nav>
    </header>
  );
}