import React from 'react';

const STATUS_MAP = {
  open: { label: 'Open', cls: 'badge-open' },
  in_progress: { label: 'In Progress', cls: 'badge-in-progress' },
  resolved: { label: 'Resolved', cls: 'badge-resolved' },
  closed: { label: 'Closed', cls: 'badge-closed' },
  reopened: { label: 'Reopened', cls: 'badge-reopened' },
};

const PRIORITY_MAP = {
  low: { label: 'Low', cls: 'badge-low' },
  medium: { label: 'Medium', cls: 'badge-medium' },
  high: { label: 'High', cls: 'badge-high' },
  urgent: { label: 'Urgent', cls: 'badge-urgent' },
};

export function StatusBadge({ status }) {
  const map = STATUS_MAP[status] || { label: status, cls: '' };
  return <span className={`badge ${map.cls}`}>{map.label}</span>;
}

export function PriorityBadge({ priority }) {
  const map = PRIORITY_MAP[priority] || { label: priority, cls: '' };
  return <span className={`badge ${map.cls}`}>{map.label}</span>;
}

export function RoleBadge({ role }) {
  return <span className={`badge badge-${role}`}>{role}</span>;
}
