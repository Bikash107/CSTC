import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import { getTickets } from '../api/api';
import { useAuth } from '../context/AuthContext';

const FILTERS = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'];
const FILTER_MAP = {
  'All': null, 'Open': 'open', 'In Progress': 'in_progress',
  'Resolved': 'resolved', 'Closed': 'closed',
};

function shortId(id) {
  return 'TCK-' + String(id).slice(-6).toUpperCase();
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    getTickets()
      .then(({ data }) => setTickets(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'All'
    ? tickets
    : tickets.filter((t) => t.status === FILTER_MAP[filter]);

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length,
  };

  return (
    <>
      <Navbar />
      <div className="dashboard-content">
        {/* Header */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title">My Support Tickets</h1>
            <p className="page-subtitle">Welcome back, {user?.name} — here's your ticket overview</p>
          </div>
          <Link to="/create-ticket" className="btn btn-primary">
            + New Ticket
          </Link>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {[
            { label: 'Total Tickets', value: stats.total, color: 'indigo', icon: '🎫' },
            { label: 'Open', value: stats.open, color: 'blue', icon: '📂' },
            { label: 'In Progress', value: stats.inProgress, color: 'amber', icon: '⚙️' },
            { label: 'Resolved', value: stats.resolved, color: 'emerald', icon: '✅' },
          ].map((s) => (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className={`stat-icon ${s.color}`}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="filter-bar">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Ticket List */}
        {loading ? (
          <div className="loading-spinner" />
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>No tickets yet</h3>
            <p>Click "New Ticket" to submit your first support request.</p>
          </div>
        ) : (
          <div className="tickets-table">
            <div className="table-header">
              <span>ID</span>
              <span>Subject</span>
              <span>Category</span>
              <span>Priority</span>
              <span>Status</span>
              <span>Created</span>
            </div>
            {filtered.map((t) => (
              <Link key={t._id} to={`/tickets/${t._id}`} className="ticket-row">
                <span className="ticket-id">{shortId(t._id)}</span>
                <div>
                  <div className="ticket-subject">{t.subject}</div>
                  <div className="ticket-meta">{t.description?.slice(0, 60)}...</div>
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t.category}</span>
                <PriorityBadge priority={t.priority} />
                <StatusBadge status={t.status} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {new Date(t.createdAt).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
