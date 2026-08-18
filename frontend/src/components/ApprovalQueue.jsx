import React, { useState, useEffect } from 'react';
import { fetchPendingEmails, approveEmail } from '../services/api';

export default function ApprovalQueue() {
  const [emails, setEmails] = useState([]);
  const [message, setMessage] = useState('');

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
    try {
      await approveEmail(id, true);
      setMessage('✅ Email sent successfully!');
    } catch (e) {
      setMessage('❌ Failed to send email.');
    }
    loadEmails();
    setTimeout(() => setMessage(''), 3000);
  };

  const handleReject = async (id) => {
    try {
      await approveEmail(id, false);
      setMessage('⛔ Email rejected.');
    } catch (e) {
      setMessage('❌ Failed to reject email.');
    }
    loadEmails();
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '400px',
      margin: '0 auto',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--panel-border)',
      borderRadius: '12px',
      padding: '14px',
      overflowY: 'auto',
      boxSizing: 'border-box',
    }}>
      <h2 style={{ fontSize: '16px', margin: '0 0 12px 0' }}>Approval Queue</h2>

      {message && (
        <div style={{
          background: 'rgba(0,242,254,0.1)',
          border: '1px solid rgba(0,242,254,0.3)',
          color: '#00f2fe',
          padding: '8px',
          borderRadius: '6px',
          marginBottom: '10px',
          fontSize: '13px',
          textAlign: 'center',
        }}>
          {message}
        </div>
      )}

      {emails.length === 0 && !message && (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No pending emails.</p>
      )}

      {emails.map(email => (
        <div key={email.id} style={{ borderBottom: '1px solid var(--panel-border)', padding: '10px 0' }}>
          <div style={{ fontSize: '13px', marginBottom: '4px' }}><strong>To:</strong> {email.draft_json.to}</div>
          <div style={{ fontSize: '13px', marginBottom: '8px' }}><strong>Subject:</strong> {email.draft_json.subject}</div>

          {/* Email body preview – improved wrapping */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--panel-border)',
            borderRadius: '6px',
            padding: '10px',
            maxHeight: '220px',
            overflowY: 'auto',
            overflowX: 'hidden',
            fontSize: '12px',
            color: 'var(--text-main)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            marginBottom: '8px',
          }}>
            {email.draft_json.body}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleApprove(email.id)}
              style={{
                background: '#4ade80',
                color: '#000',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Approve & Send
            </button>
            <button
              onClick={() => handleReject(email.id)}
              style={{
                background: '#f87171',
                color: '#000',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}