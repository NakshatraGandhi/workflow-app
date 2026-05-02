import React from 'react';

const STATUS_MAP = {
  'Submitted':           { cls: 'badge-submitted',     label: 'Submitted' },
  'Approved':            { cls: 'badge-approved',      label: 'Approved' },
  'Rejected':            { cls: 'badge-rejected',      label: 'Rejected' },
  'Needs Clarification': { cls: 'badge-clarification', label: 'Needs Info' },
  'Closed':              { cls: 'badge-closed',        label: 'Closed' },
  'Reopened':            { cls: 'badge-reopened',      label: 'Reopened' }
};

const PRIORITY_MAP = { 'High': 'badge-high', 'Medium': 'badge-medium', 'Low': 'badge-low' };

export const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || { cls: '', label: status };
  return <span className={`badge ${s.cls}`}><span className="badge-dot" />{s.label}</span>;
};

export const PriorityBadge = ({ priority }) => (
  <span className={`badge ${PRIORITY_MAP[priority] || ''}`}>{priority}</span>
);
