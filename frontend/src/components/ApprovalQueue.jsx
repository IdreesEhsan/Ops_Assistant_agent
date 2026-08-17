import React, { useState, useEffect } from 'react';
import { fetchPendingEmails, approveEmail } from '../services/api';

export default function ApprovalQueue() {
  const [emails, setEmails] = useState([]);

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    try {
      const data = await fetchPendingEmails();
      setEmails(data || []);
    } catch (e) {
      console.error(e);
    }
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
    <div style={{
      width: '100%',
      maxWidth: '360px',
      margin: '0 auto',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--panel-border)',
      borderRadius: '12px',
      padding: '14px',
      overflowY: 'auto',
      boxSizing: 'border-box',
    }}>
      <h2 style={{ fontSize: '16px', margin: '0 0 12px 0' }}>Approval Queue</h2>
      {emails.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No pending emails.</p>}
      {emails.map(email => (
        <div key={email.id} style={{ borderBottom: '1px solid var(--panel-border)', padding: '10px 0' }}>
          <div style={{ fontSize: '13px', marginBottom: '4px' }}><strong>To:</strong> {email.draft_json.to}</div>
          <div style={{ fontSize: '13px', marginBottom: '8px' }}><strong>Subject:</strong> {email.draft_json.subject}</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => handleApprove(email.id)} style={{ background: '#4ade80', color: '#000', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Approve & Send</button>
            <button onClick={() => handleReject(email.id)} style={{ background: '#f87171', color: '#000', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}