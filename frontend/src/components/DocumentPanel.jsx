import React, { useState, useEffect } from 'react';
import { uploadDocument, fetchDocuments, deleteDocument } from '../services/api';
import { Upload, Trash2, FileText } from 'lucide-react';

export default function DocumentPanel() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadDocs = async () => {
    try {
      const data = await fetchDocuments();
      setDocs(data || []);
    } catch(e) { console.error(e); }
  };

  useEffect(() => { loadDocs(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      await uploadDocument(file);
      loadDocs();
    } catch(err) { alert('Upload failed'); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    await deleteDocument(id);
    loadDocs();
  };

  return (
    <div style={{ padding: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--panel-border)', borderRadius: '12px' }}>
      <h3>Documents</h3>
      <label style={{ display: 'inline-block', cursor: 'pointer', marginBottom: '12px', background: 'var(--accent-cyan)', color: '#000', padding: '8px 16px', borderRadius: '6px' }}>
        <Upload size={16} /> Upload PDF/DOCX
        <input type="file" accept=".pdf,.docx" onChange={handleUpload} hidden />
      </label>
      {loading && <div>Processing...</div>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {docs.map(doc => (
          <li key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--panel-border)' }}>
            <div><FileText size={14} color="#00f2fe" /> {doc.filename}</div>
            <button onClick={() => handleDelete(doc.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={14} color="#ff7675" /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}