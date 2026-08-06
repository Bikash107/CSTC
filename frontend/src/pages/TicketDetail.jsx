import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import {
  getTicket, updateTicket, getComments, addComment,
  getAttachments, uploadAttachment,
} from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'reopened', label: 'Reopened' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

function shortId(id) {
  return 'TCK-' + String(id).slice(-6).toUpperCase();
}

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [reply, setReply] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newStatus, setNewStatus] = useState('');
  const [newPriority, setNewPriority] = useState('');
  const [updating, setUpdating] = useState(false);

  const [attachFile, setAttachFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const isStaff = user?.role === 'agent' || user?.role === 'admin';

  const fetchAll = async () => {
    try {
      const [tRes, cRes, aRes] = await Promise.all([
        getTicket(id),
        getComments(id),
        getAttachments(id),
      ]);
      setTicket(tRes.data);
      setNewStatus(tRes.data.status);
      setNewPriority(tRes.data.priority);
      setComments(cRes.data);
      setAttachments(aRes.data);
    } catch (err) {
      toast.error('Failed to load ticket');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) { toast.error('Reply cannot be empty'); return; }
    setSubmitting(true);
    try {
      await addComment(id, { message: reply, is_internal: isInternal });
      toast.success('Reply sent!');
      setReply('');
      setIsInternal(false);
      const { data } = await getComments(id);
      setComments(data);
    } catch (err) {
      toast.error('Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await updateTicket(id, { status: newStatus, priority: newPriority });
      toast.success('Ticket updated!');
      const { data } = await getTicket(id);
      setTicket(data);
    } catch (err) {
      toast.error('Failed to update ticket');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignMe = async () => {
    try {
      await updateTicket(id, { assigned_agent_id: user.id });
      toast.success('Ticket assigned to you!');
      const { data } = await getTicket(id);
      setTicket(data);
    } catch (err) {
      toast.error('Failed to assign');
    }
  };

  const handleUpload = async () => {
    if (!attachFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', attachFile);
      await uploadAttachment(id, fd);
      toast.success('File uploaded!');
      const { data } = await getAttachments(id);
      setAttachments(data);
      setAttachFile(null);
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <>
      <Navbar />
      <div className="dashboard-content"><div className="loading-spinner" /></div>
    </>
  );

  if (!ticket) return null;

  const getDashLink = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'agent') return '/agent';
    return '/dashboard';
  };

  return (
    <>
      <Navbar />
      <div className="dashboard-content">
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13, color: 'var(--text-muted)' }}>
          <Link to={getDashLink()} style={{ color: 'var(--text-muted)' }}>Dashboard</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)' }}>{shortId(ticket._id)}</span>
        </div>

        {/* Header */}
        <div className="detail-header">
          <div>
            <div className="detail-ticket-id">{shortId(ticket._id)}</div>
            <h1 className="detail-title">{ticket.subject}</h1>
          </div>
          <div className="detail-badges">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>
        </div>

        <div className="detail-grid">
          {/* Main Column */}
          <div>
            {/* Description */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Description
              </h4>
              <p className="detail-desc" style={{ margin: 0 }}>{ticket.description}</p>

              {/* Attachments */}
              {attachments.length > 0 && (
                <div className="attachment-list" style={{ marginTop: 16 }}>
                  {attachments.map((a) => (
                    <a
                      key={a._id}
                      href={`http://localhost:3000${a.file_url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="attachment-link"
                    >
                      📎 {a.file_name}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Thread */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
                Conversation ({comments.length})
              </h4>
              {comments.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>
                  No replies yet. Be the first to respond.
                </p>
              ) : (
                <div className="thread">
                  {comments.map((c) => (
                    <div key={c._id} className={`thread-item ${c.is_internal ? 'internal' : ''}`}>
                      <div className="thread-head">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="thread-author">{c.author_name}</span>
                          <span className="thread-role">({c.author_role})</span>
                          {c.is_internal && <span className="thread-internal-tag">Internal</span>}
                        </div>
                        <span className="thread-time">{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="thread-message">{c.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reply Box */}
            <div className="reply-box">
              <h4>Add Reply</h4>
              <form onSubmit={handleReply}>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Type your reply..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
                <div className="reply-actions">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      disabled={!isStaff}
                    />
                    Internal note only (staff only)
                  </label>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Sending...' : '✉ Send Reply'}
                  </button>
                </div>
              </form>
            </div>

            {/* Upload Attachment */}
            <div className="card" style={{ marginTop: 20 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Add Attachment
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <input
                  type="file"
                  className="form-input"
                  style={{ flex: 1, minWidth: 200 }}
                  onChange={(e) => setAttachFile(e.target.files[0])}
                />
                <button
                  className="btn btn-ghost"
                  onClick={handleUpload}
                  disabled={!attachFile || uploading}
                >
                  {uploading ? 'Uploading...' : '📎 Upload'}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Ticket Info */}
            <div className="card sidebar-card">
              <h4>Ticket Info</h4>
              {[
                { label: 'Category', value: ticket.category },
                { label: 'Customer', value: ticket.customer_id?.name },
                { label: 'Email', value: ticket.customer_id?.email },
                { label: 'Created', value: new Date(ticket.createdAt).toLocaleDateString() },
                { label: 'Updated', value: new Date(ticket.updatedAt).toLocaleDateString() },
              ].map((row) => (
                <div key={row.label} className="info-row">
                  <span className="info-label">{row.label}</span>
                  <span className="info-value">{row.value || '—'}</span>
                </div>
              ))}
              <div className="info-row">
                <span className="info-label">Assigned Agent</span>
                <div style={{ textAlign: 'right' }}>
                  {ticket.assigned_agent_id ? (
                    <span className="info-value" style={{ color: 'var(--success)' }}>
                      {ticket.assigned_agent_id?.name || 'Assigned'}
                    </span>
                  ) : isStaff ? (
                    <button className="btn btn-primary btn-sm" onClick={handleAssignMe}>
                      Assign to Me
                    </button>
                  ) : (
                    <span className="info-value" style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                  )}
                </div>
              </div>
            </div>

            {/* Update Ticket (staff only) */}
            {isStaff && (
              <div className="card">
                <h4>Update Ticket</h4>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  className="btn btn-primary btn-full"
                  onClick={handleUpdate}
                  disabled={updating}
                >
                  {updating ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
