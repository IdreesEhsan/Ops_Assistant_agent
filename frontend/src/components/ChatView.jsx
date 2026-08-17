import React, { useState, useEffect, useRef } from 'react';
import { streamChat, fetchSessions, fetchSessionMessages } from '../services/api';
import { Send, Bot, User, Plus, MessageSquare, History, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatView() {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your Ops Assistant. Ask me about clients, tasks, or documents.', sources: [] }
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    loadSessions();
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
        setUserEmail(payload.email || 'User');
      }
    } catch (e) { console.error('JWT decode failed', e); }
  }, []);

  const loadSessions = async () => {
    try {
      const data = await fetchSessions();
      setSessions(data || []);
    } catch (err) {
      console.error('Failed to fetch sessions', err);
    }
  };

  const handleSelectSession = async (session) => {
    setCurrentSessionId(session.id);
    try {
      const history = await fetchSessionMessages(session.id);
      const formatted = history.map(m => ({ role: m.role, content: m.content, sources: [] }));
      setMessages(formatted.length ? formatted : [{ role: 'assistant', content: 'Conversation loaded.', sources: [] }]);
    } catch (err) { console.error(err); }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([{ role: 'assistant', content: 'Hello! I am your Ops Assistant. Ask me about clients, tasks, or documents.', sources: [] }]);
  };

  const handleDeleteSession = async (sessionId) => {
    const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
    await fetch(`${BASE}/api/chat/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    });
    loadSessions();
    if (currentSessionId === sessionId) handleNewChat();
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;
    const userMessage = { role: 'user', content: input, sources: [] };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsGenerating(true);

    const isNewSession = !currentSessionId;
    const assistantIndex = newMessages.length;
    setMessages(prev => [...prev, { role: 'assistant', content: '', sources: [] }]);

    const controller = new AbortController();
    let receivedSources = [];

    try {
      await streamChat(
        newMessages,
        'ops_agent',
        (chunk) => {
          setMessages(prev => {
            const updated = [...prev];
            updated[assistantIndex] = {
              ...updated[assistantIndex],
              content: updated[assistantIndex].content + chunk
            };
            return updated;
          });
        },
        currentSessionId,
        (assignedId) => {
          if (!currentSessionId) setCurrentSessionId(assignedId);
        },
        controller.signal,
        (src) => {
          receivedSources = src;
        }
      );
    } catch (err) {
      if (err.name === 'AbortError') return;
      setMessages(prev => {
        const updated = [...prev];
        updated[assistantIndex] = {
          ...updated[assistantIndex],
          content: updated[assistantIndex].content + `\n\n**[Error: ${err.message}]**`,
          sources: []
        };
        return updated;
      });
    } finally {
      setMessages(prev => {
        const updated = [...prev];
        updated[assistantIndex] = {
          ...updated[assistantIndex],
          sources: receivedSources
        };
        return updated;
      });
      setIsGenerating(false);
      loadSessions();
      if (isNewSession) {
        setTimeout(() => loadSessions(), 5000);
      }
    }
  };

  return (
    <div style={{
      display: 'flex', gap: '12px', height: 'calc(100vh - 120px)',
      padding: '0 8px', width: '100%', maxWidth: '100%', boxSizing: 'border-box',
    }}>
      {/* Sidebar */}
      <div style={{
        width: '200px', flexShrink: 0, background: 'var(--bg-secondary)',
        border: '1px solid var(--panel-border)', borderRadius: '12px',
        padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        <button onClick={handleNewChat} style={{ width: '100%', background: 'var(--accent-cyan)', color: '#000', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>
          <Plus size={16} /> New Chat
        </button>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>CHAT HISTORY</div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sessions.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', borderRadius: '6px', background: currentSessionId === s.id ? 'rgba(0,242,254,0.1)' : 'transparent' }} onClick={() => handleSelectSession(s)}>
              <MessageSquare size={14} color="#00f2fe" />
              <span style={{ flex: 1, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
              <Trash2 size={14} color="#ff7675" onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }} />
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
          Logged in as {userEmail}
        </div>
      </div>

      {/* Main chat area */}
      <div style={{
        flex: '1 1 0', minWidth: 0, background: 'var(--bg-secondary)',
        border: '1px solid var(--panel-border)', borderRadius: '12px',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--panel-border)', fontSize: '14px' }}>
          Ops Assistant – RAG + Tools
        </div>
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {m.role === 'assistant' && <Bot size={20} color="#00f2fe" />}
              <div style={{
                maxWidth: '70%', padding: '12px 16px', borderRadius: '16px',
                background: m.role === 'user' ? 'rgba(0,242,254,0.2)' : 'rgba(255,255,255,0.05)',
                border: '1px solid var(--panel-border)', lineHeight: '1.5'
              }}>
                {m.role === 'user' ? (
                  <div>{m.content}</div>
                ) : (
                  <div className="markdown-body">
                    {m.content ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown> : (isGenerating && i === messages.length-1) ? <em>Thinking...</em> : ''}
                    {m.role === 'assistant' && m.sources && m.sources.length > 0 && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#8892b0', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px' }}>
                        <strong>Sources:</strong>{" "}
                        {m.sources.map((s, idx) => (
                          <span key={idx}>
                            from <em>{s.filename}</em>{s.page ? `, Page ${s.page}` : ''}
                            {idx < m.sources.length - 1 ? ' | ' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {m.role === 'user' && <User size={20} color="#f59e0b" />}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div style={{ padding: '16px', borderTop: '1px solid var(--panel-border)', display: 'flex', gap: '12px' }}>
          <input
            style={{ flex: 1, background: 'transparent', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '10px', color: 'var(--text-main)' }}
            placeholder="Ask about clients, tasks, documents, or calculations..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <button onClick={handleSend} disabled={isGenerating} style={{ background: 'var(--accent-cyan)', color: '#000', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}