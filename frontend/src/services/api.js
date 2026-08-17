// Base URL from Vite env or localhost
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE_URL = BASE.replace(/\/+$/, '') + '/api';

// Helper to attach JWT token
const getHeaders = () => {
  const token = localStorage.getItem('access_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

// Handle expired session globally
export function handleAuthExpired() {
  localStorage.removeItem('access_token');
  window.dispatchEvent(new Event('auth_expired'));
}

// Wrapper that checks for 401 and triggers logout
async function authFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    handleAuthExpired();
    throw new Error('Session expired. Please log in again.');
  }
  return res;
}

// ========== Auth ==========
export async function registerAPI(data) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).detail || 'Registration failed');
  return res.json();
}

export async function loginAPI(email, password) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error((await res.json()).detail || 'Login failed');
  return res.json();
}

// ========== Chat ==========
export async function fetchSessions() {
  const res = await authFetch(`${API_BASE_URL}/chat/sessions`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
}

export async function fetchSessionMessages(sessionId) {
  const res = await authFetch(`${API_BASE_URL}/chat/sessions/${sessionId}/messages`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

export async function streamChat(
  messages,
  systemPrompt,
  onChunk,
  sessionId,
  onSessionCreated,
  signal,
  onSources
) {
  const res = await authFetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: getHeaders(),
    signal,
    body: JSON.stringify({ messages, system_prompt: systemPrompt, session_id: sessionId })
  });
  if (!res.ok) throw new Error(`Server error: ${res.statusText}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.session_id && onSessionCreated) onSessionCreated(parsed.session_id);
          if (parsed.content) onChunk(parsed.content);
          if (parsed.sources && onSources) onSources(parsed.sources);
        } catch (e) {}
      }
    }
  }
}

// ========== Documents ==========
export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await authFetch(`${API_BASE_URL}/documents/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
    body: formData
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

export async function fetchDocuments() {
  const res = await authFetch(`${API_BASE_URL}/documents/`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}

export async function deleteDocument(docId) {
  const res = await authFetch(`${API_BASE_URL}/documents/${docId}`, { method: 'DELETE', headers: getHeaders() });
  if (!res.ok) throw new Error('Delete failed');
  return res.json();
}

// ========== Emails ==========
export async function fetchPendingEmails() {
  const res = await authFetch(`${API_BASE_URL}/emails/pending`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch emails');
  return res.json();
}

export async function approveEmail(emailId, approve) {
  const res = await authFetch(`${API_BASE_URL}/emails/approve`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email_log_id: emailId, approve })
  });
  if (!res.ok) throw new Error('Approval failed');
  return res.json();
}