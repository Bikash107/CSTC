import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import { getTickets, updateTicket } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const PRIORITY_FILTERS = ['All', 'Urgent', 'High', 'Medium', 'Low'];
const PRIORITY_MAP = { All: null, Urgent: 'urgent', High: 'high', Medium: 'medium', Low: 'low' };

function shortId(id) {
  return 'TCK-' + String(id).slice(-6).toUpperCase();
}

export default function AgentDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const fetchTickets = () => {
    setLoading(true);
    getTickets()
      .then(({ data }) => setTickets(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleAssignMe = async (e, ticketId) => {
    e.preventDefault();
    try {
      await updateTicket(ticketId, { assigned_agent_id: user.id });
      toast.success('Ticket assigned to you!');
      fetchTickets();
    } catch (err) {
      toast.error('Failed to assign ticket');
    }
  };

  const filtered = filter === 'All'
    ? tickets
    : tickets.filter((t) => t.priority === PRIORITY_MAP[filter]);

  const stats = {
    total: tickets.length,
    // BUG-3 fix: normalize ObjectId to string for reliable comparison
    mine: tickets.filter((t) => String(t.assigned_agent_id?._id) === String(user?.id)).length,
    open: tickets.filter((t) => t.status === 'open').length,
    urgent: tickets.filter((t) => t.priority === 'urgent').length,
  };

  return (
    <>
      <Navbar />
      <div className="dashboard-content">
        <div className="page-header">
          <h1 className="page-title">Agent Queue</h1>
          <p className="page-subtitle">All incoming support tickets — pick them up and resolve</p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {[
            { label: 'Total Tickets', value: stats.total, color: 'indigo', icon: '🎫' },
            { label: 'Assigned to Me', value: stats.mine, color: 'blue', icon: '👤' },
            { label: 'Open', value: stats.open, color: 'emerald', icon: '📂' },
            { label: 'Urgent', value: stats.urgent, color: 'red', icon: '🚨' },
          ].map((s) => (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className={`stat-icon ${s.color}`}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Priority Filter */}
        <div className="filter-bar">
          {PRIORITY_FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Tickets Table */}
        {loading ? (
          <div className="loading-spinner" />
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎉</div>
            <h3>Queue is clear!</h3>
            <p>No tickets match this filter.</p>
          </div>
        ) : (
          <div className="tickets-table">
            <div className="table-header">
              <span>ID</span>
              <span>Subject</span>
              <span>Priority</span>
              <span>Status</span>
              <span>Assigned</span>
              <span>Created</span>
            </div>
            {filtered.map((t) => (
              <Link key={t._id} to={`/tickets/${t._id}`} className="ticket-row">
                <span className="ticket-id">{shortId(t._id)}</span>
                <div>
                  <div className="ticket-subject">{t.subject}</div>
                  <div className="ticket-meta">
                    {t.customer_id?.name || 'Unknown Customer'}
                  </div>
                </div>
                <PriorityBadge priority={t.priority} />
                <StatusBadge status={t.status} />
                <div onClick={(e) => e.preventDefault()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {t.assigned_agent_id ? (
                    <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
                      {t.assigned_agent_id?.name || 'Assigned'}
                    </span>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={(e) => handleAssignMe(e, t._id)}
                    >
                      Assign Me
                    </button>
                  )}
                </div>
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
