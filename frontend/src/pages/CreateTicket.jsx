import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { createTicket, uploadAttachment } from '../api/api';
import { useToast } from '../context/ToastContext';

const CATEGORIES = ['General', 'Billing', 'Technical', 'Account', 'Feature Request', 'Bug Report', 'Other'];
const PRIORITIES = [
  { value: 'low', label: '🟢 Low' },
  { value: 'medium', label: '🔵 Medium' },
  { value: 'high', label: '🟠 High' },
  { value: 'urgent', label: '🔴 Urgent' },
];

export default function CreateTicket() {
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  const [form, setForm] = useState({
    subject: '',
    category: 'General',
    priority: 'medium',
    description: '',
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) {
      toast.error('Subject and description are required');
      return;
    }
    setLoading(true);
    try {
      const { data } = await createTicket(form);
      const ticketId = data.ticket._id;

      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        await uploadAttachment(ticketId, fd);
      }

      toast.success('Ticket submitted successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="dashboard-content">
        <div className="page-header">
          <h1 className="page-title">Create New Ticket</h1>
          <p className="page-subtitle">Describe your issue and we'll get back to you as soon as possible</p>
        </div>

        <div style={{ maxWidth: 700 }}>
          <div className="card">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              <div className="form-group">
                <label className="form-label">Subject *</label>
                <input
                  name="subject"
                  type="text"
                  className="form-input"
                  placeholder="Brief summary of your issue..."
                  value={form.subject}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select name="category" className="form-select" value={form.category} onChange={handleChange}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select name="priority" className="form-select" value={form.priority} onChange={handleChange}>
                    {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  name="description"
                  className="form-textarea"
                  placeholder="Describe your issue in detail. Include steps to reproduce, expected vs actual behavior..."
                  value={form.description}
                  onChange={handleChange}
                  rows={6}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Attachment (optional)</label>
                <div
                  style={{
                    border: '1px dashed var(--border-strong)',
                    borderRadius: 'var(--radius-md)',
                    padding: '24px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: file ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.02)',
                  }}
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  {file ? (
                    <div>
                      <span style={{ fontSize: 24 }}>📎</span>
                      <p style={{ color: 'var(--primary-light)', fontWeight: 600, marginTop: 8 }}>{file.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span style={{ fontSize: 32 }}>📁</span>
                      <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Click to attach a file</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        Images, PDFs, docs up to 10MB
                      </p>
                    </div>
                  )}
                  <input
                    id="fileInput"
                    type="file"
                    style={{ display: 'none' }}
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                </div>
                {file && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ alignSelf: 'flex-start', marginTop: 8 }}
                    onClick={() => setFile(null)}
                  >
                    Remove file
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Submitting...' : '🚀 Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
