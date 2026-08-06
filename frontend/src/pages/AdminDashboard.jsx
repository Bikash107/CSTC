import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import { getStats, getTickets } from '../api/api';

const STATUS_FILTERS = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'];
const FILTER_MAP = { All: null, Open: 'open', 'In Progress': 'in_progress', Resolved: 'resolved', Closed: 'closed' };

function shortId(id) {
  return 'TCK-' + String(id).slice(-6).toUpperCase();
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    Promise.all([getStats(), getTickets()])
      .then(([statsRes, ticketsRes]) => {
        setStats(statsRes.data);
        setTickets(ticketsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'All'
    ? tickets
    : tickets.filter((t) => t.status === FILTER_MAP[filter]);

  const statCards = stats ? [
    { label: 'Total Tickets', value: stats.totalTickets, color: 'indigo', icon: '🎫' },
    { label: 'Open', value: stats.openTickets, color: 'blue', icon: '📂' },
    { label: 'In Progress', value: stats.inProgressTickets, color: 'amber', icon: '⚙️' },
    { label: 'Resolved', value: stats.resolvedTickets, color: 'emerald', icon: '✅' },
    { label: 'Urgent', value: stats.urgentTickets, color: 'red', icon: '🚨' },
    { label: 'Customers', value: stats.totalUsers, color: 'slate', icon: '👥' },
    { label: 'Agents', value: stats.totalAgents, color: 'emerald', icon: '🧑‍💼' },
    { label: 'Closed', value: stats.closedTickets, color: 'slate', icon: '🔒' },
  ] : [];

  return (
    <>
      <Navbar />
      <div className="dashboard-content">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">System-wide overview — full control at your fingertips</p>
          </div>
          <Link to="/admin/users" className="btn btn-ghost">
            👥 Manage Users
          </Link>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="loading-spinner" />
        ) : (
          <>
            <div className="stats-grid">
              {statCards.map((s) => (
                <div key={s.label} className={`stat-card ${s.color}`}>
                  <div className={`stat-icon ${s.color}`}>{s.icon}</div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Tickets Section */}
            <div style={{ marginTop: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                  All Tickets ({tickets.length})
                </h2>
                <div className="filter-bar" style={{ margin: 0 }}>
                  {STATUS_FILTERS.map((f) => (
                    <button
                      key={f}
                      className={`filter-btn ${filter === f ? 'active' : ''}`}
                      onClick={() => setFilter(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <h3>No tickets</h3>
                  <p>No tickets match this filter.</p>
                </div>
              ) : (
                <div className="tickets-table">
                  <div className="table-header">
                    <span>ID</span>
                    <span>Subject</span>
                    <span>Customer</span>
                    <span>Priority</span>
                    <span>Status</span>
                    <span>Created</span>
                  </div>
                  {filtered.map((t) => (
                    <Link key={t._id} to={`/tickets/${t._id}`} className="ticket-row">
                      <span className="ticket-id">{shortId(t._id)}</span>
                      <div>
                        <div className="ticket-subject">{t.subject}</div>
                        <div className="ticket-meta">{t.category}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {t.customer_id?.name || '—'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {t.customer_id?.email}
                        </div>
                      </div>
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
        )}
      </div>
    </>
  );
}
