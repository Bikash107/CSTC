import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

function SLATimer() {
  const [remaining, setRemaining] = useState(1 * 3600 + 47 * 60 + 12);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const h = String(Math.floor(remaining / 3600)).padStart(2, '0');
  const m = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
  const s = String(remaining % 60).padStart(2, '0');
  return <span className="sla-timer">{h}:{m}:{s}</span>;
}

export default function LandingPage() {
  return (
    <div className="landing-page">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid-bg" />
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-eyebrow">
              <span>🎫</span>
              Built for managing customer issues
            </div>
            <h1 className="hero-title">
              Every ticket,{' '}
              <span className="gradient-text">resolved on time,</span>{' '}
              every time
            </h1>
            <p className="hero-desc">
              CSTC brings customers, support agents, and admins into one
              seamless workflow — so nothing slips through the cracks.
            </p>
            <div className="hero-actions">
              <Link to="/login" className="btn btn-primary btn-lg">
                Get Started Free →
              </Link>
              <a href="#lifecycle" className="btn btn-ghost btn-lg">
                See how it works
              </a>
            </div>
          </div>

          {/* Hero visual */}
          <div className="hero-visual">
            <div className="ticket-showcase">
              <div className="showcase-header">
                <div className="showcase-dots">
                  <div className="showcase-dot" />
                  <div className="showcase-dot" />
                  <div className="showcase-dot" />
                </div>
                <span className="showcase-title">Live Ticket Preview</span>
              </div>

              <div className="showcase-card">
                <div className="showcase-card-header">
                  <span className="showcase-ticket-id">TCK-2417</span>
                  <span className="badge badge-in-progress">In Progress</span>
                </div>
                <div className="showcase-subject">Unable to export invoice as PDF</div>
                <div className="showcase-desc">
                  Customer reports the export button spins indefinitely on the billing page after the last update.
                </div>
                <div className="showcase-tags">
                  <span className="badge badge-urgent">Urgent</span>
                  <span className="badge badge-medium" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>Billing</span>
                </div>
                <div className="sla-box">
                  <span>⏱ SLA breach in</span>
                  <SLATimer />
                </div>
              </div>

              <div className="showcase-card" style={{ opacity: 0.6 }}>
                <div className="showcase-card-header">
                  <span className="showcase-ticket-id">TCK-2416</span>
                  <span className="badge badge-resolved">Resolved</span>
                </div>
                <div className="showcase-subject">Login fails on mobile browsers</div>
                <div className="showcase-tags">
                  <span className="badge badge-high">High</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Roles ────────────────────────────────────────── */}
      <section className="section" id="roles">
        <div className="section-inner">
          <div className="section-head">
            <span className="section-tag">Who it's for</span>
            <h2 className="section-title">One system, three points of view</h2>
            <p className="section-desc">
              Customers, agents, and admins each get an interface built around
              what they actually need to do.
            </p>
          </div>

          <div className="roles-grid">
            <div className="role-card">
              <div className="role-icon">👤</div>
              <h3>Customer</h3>
              <p>Submit and track support issues without needing to know how support works internally.</p>
              <div className="role-feature-list">
                {['Submit tickets', 'Track status in real-time', 'Reply to agents', 'Upload attachments'].map((f) => (
                  <div key={f} className="role-feature">
                    <div className="role-feature-dot" />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            <div className="role-card">
              <div className="role-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>🧑‍💼</div>
              <h3>Support Agent</h3>
              <p>Work a focused queue with all the context needed to resolve, not just respond.</p>
              <div className="role-feature-list">
                {['View all tickets', 'Assign to self', 'Set priority', 'Add internal notes'].map((f) => (
                  <div key={f} className="role-feature">
                    <div className="role-feature-dot" style={{ background: '#10b981' }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            <div className="role-card">
              <div className="role-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>👑</div>
              <h3>Admin</h3>
              <p>See the whole system's health at a glance and keep the team accountable.</p>
              <div className="role-feature-list">
                {['System-wide stats', 'Manage all tickets', 'Promote users to agents', 'Full audit trail'].map((f) => (
                  <div key={f} className="role-feature">
                    <div className="role-feature-dot" style={{ background: '#f59e0b' }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Lifecycle ────────────────────────────────────── */}
      <section className="section" id="lifecycle" style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div className="section-inner">
          <div className="section-head">
            <span className="section-tag">The workflow</span>
            <h2 className="section-title">A ticket's life, start to finish</h2>
            <p className="section-desc">
              Every ticket moves through clear stages, so nothing is ambiguous about what happens next.
            </p>
          </div>

          <div className="lifecycle-track">
            {[
              { num: '1', title: 'Open', desc: 'Customer submits a new ticket.', color: '#6366f1' },
              { num: '2', title: 'In Progress', desc: 'Agent picks it up, SLA clock starts.', color: '#f59e0b' },
              { num: '3', title: 'Resolved', desc: 'Agent marks it fixed.', color: '#10b981' },
              { num: '4', title: 'Closed', desc: 'Customer confirms it\'s done.', color: '#64748b' },
              { num: '5', title: 'Reopened', desc: 'If it returns, back into the queue.', color: '#ef4444' },
            ].map((step) => (
              <div key={step.num} className="life-step">
                <div className="life-num" style={{ background: `linear-gradient(135deg, ${step.color}, ${step.color}cc)` }}>
                  {step.num}
                </div>
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="section">
        <div className="section-inner" style={{ textAlign: 'center' }}>
          <h2 className="section-title">Ready to get started?</h2>
          <p className="section-desc" style={{ marginBottom: '32px' }}>
            Join the platform built for efficient customer support management.
          </p>
          <Link to="/login" className="btn btn-primary btn-lg">
            Create your account →
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container">
          <p>© 2026 CSTC — Customer Support Ticket System. Built for final presentation.</p>
        </div>
      </footer>
    </div>
  );
}
