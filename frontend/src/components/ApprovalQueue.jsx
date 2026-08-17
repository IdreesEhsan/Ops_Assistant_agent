import React, { useState, useEffect } from 'react';
import { fetchPendingEmails, approveEmail } from '../services/api';

export default function ApprovalQueue() {
  const [emails, setEmails] = useState([]);

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    const data = await fetchPendingEmails();
    setEmails(data || []);
  };

  const handleApprove = async (id) => {
    await approveEmail(id, true);
    loadEmails();
  };

  const handleReject = async (id) => {
    await approveEmail(id, false);
    loadEmails();
  };

  return (
    <div style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--panel-border)', borderRadius: '12px', padding: '16px', overflowY: 'auto' }}>
      <h2 style={{ fontSize: '18px' }}>Approval Queue</h2>
      {emails.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No pending emails.</p>}
      {emails.map(email => (
        <div key={email.id} style={{ borderBottom: '1px solid var(--panel-border)', padding: '12px 0' }}>
          <div><strong>To:</strong> {email.draft_json.to}</div>
          <div><strong>Subject:</strong> {email.draft_json.subject}</div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button onClick={() => handleApprove(email.id)} style={{ background: '#4ade80', color: '#000', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>Approve & Send</button>
            <button onClick={() => handleReject(email.id)} style={{ background: '#f87171', color: '#000', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}