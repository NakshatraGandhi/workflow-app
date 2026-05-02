import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import api from '../utils/api';

// Define which buttons each role sees per status
const ACTIONS = {
  Manager: {
    Submitted:  [
      { label: '✅ Approve',           newStatus: 'Approved',             cls: 'btn-success' },
      { label: '❌ Reject',             newStatus: 'Rejected',             cls: 'btn-danger' },
      { label: '💬 Need Clarification',newStatus: 'Needs Clarification',  cls: 'btn-warning' }
    ]
  },
  User: {
    'Needs Clarification': [
      { label: '📤 Resubmit',          newStatus: 'Submitted',            cls: 'btn-primary' }
    ]
  },
  Admin: {
    Approved: [
      { label: '🔒 Close',             newStatus: 'Closed',               cls: 'btn-ghost' }
    ],
    Closed: [
      { label: '🔄 Reopen',            newStatus: 'Reopened',             cls: 'btn-warning' }
    ]
  }
};

const TIMELINE_DOT_CLASS = {
  'Submitted': 'submitted',
  'Approved': 'approved',
  'Rejected': 'rejected',
  'Needs Clarification': 'clarification',
  'Closed': 'closed',
  'Reopened': 'reopened'
};

export default function RequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [modal, setModal] = useState(null); // { newStatus, label }
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [reqRes, logsRes] = await Promise.all([
        api.get(`/requests/${id}`),
        api.get(`/requests/${id}/logs`)
      ]);
      setRequest(reqRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      if (err.response?.status === 404) navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const availableActions = request
    ? (ACTIONS[user.role]?.[request.status] || [])
    : [];

  const handleAction = async () => {
    if (!modal) return;
    setActionLoading(true); setError('');
    try {
      await api.patch(`/requests/${id}/status`, { status: modal.newStatus, comment });
      setSuccess(`Status updated to "${modal.newStatus}".`);
      setModal(null); setComment('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!request) return null;

  return (
    <>
      {/* Header */}
      <div className="page-header flex justify-between items-center">
        <div>
          <button className="btn btn-ghost btn-sm mb-3" onClick={() => navigate('/dashboard')}>← Back</button>
          <h1 className="page-title">{request.title}</h1>
          <div className="flex gap-2 mt-1" style={{ flexWrap: 'wrap' }}>
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
            <span className="badge" style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}>
              {request.category}
            </span>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          {availableActions.map(action => (
            <button key={action.newStatus} className={`btn ${action.cls}`}
              onClick={() => { setModal(action); setError(''); setComment(''); }}>
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {success && <div className="success-msg">{success}</div>}
      {error && <div className="error-msg">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', alignItems: 'start' }}>
        {/* Request Details */}
        <div>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '14px', fontSize: '0.95rem', color: 'var(--text-sub)' }}>REQUEST DETAILS</h3>
            <p style={{ lineHeight: 1.7 }}>{request.description}</p>
            <div className="divider" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.875rem' }}>
              <div><div className="form-label">Submitted By</div><div>{request.user_name}</div></div>
              <div><div className="form-label">Request ID</div><div>#{request.id}</div></div>
              <div><div className="form-label">Created</div><div>{new Date(request.created_at).toLocaleString()}</div></div>
              <div><div className="form-label">Last Updated</div><div>{new Date(request.updated_at).toLocaleString()}</div></div>
            </div>
          </div>
        </div>

        {/* Timeline / Action Log */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '20px', fontSize: '0.95rem', color: 'var(--text-sub)' }}>
            📋 ACTION TIMELINE
          </h3>
          {logs.length === 0 ? (
            <div className="empty-state"><div className="icon">📭</div>No activity yet</div>
          ) : (
            <div className="timeline">
              {logs.map((log, i) => (
                <div key={log.id} className="timeline-item">
                  <div className={`timeline-dot ${TIMELINE_DOT_CLASS[log.new_status] || ''}`}>
                    {i === 0 ? '🚀' : '→'}
                  </div>
                  <div className="timeline-body">
                    <div className="timeline-title">
                      {log.old_status ? `${log.old_status} → ${log.new_status}` : log.new_status}
                    </div>
                    <div className="timeline-meta">
                      by <strong>{log.changed_by_name}</strong> ({log.role}) · {new Date(log.timestamp).toLocaleString()}
                    </div>
                    {log.comment && (
                      <div className="timeline-comment">💬 {log.comment}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Confirm: {modal.label}</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
              This will change the status to <strong style={{ color: 'var(--text)' }}>"{modal.newStatus}"</strong>.
            </p>
            <div className="form-group">
              <label className="form-label">Comment (optional)</label>
              <textarea className="form-control" placeholder="Add a comment or note..."
                value={comment} onChange={e => setComment(e.target.value)} rows={3} />
            </div>
            {error && <div className="error-msg">{error}</div>}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className={`btn ${modal.cls}`} onClick={handleAction} disabled={actionLoading}>
                {actionLoading ? <><span className="spinner" style={{ width: 15, height: 15 }} /> Processing...</> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
