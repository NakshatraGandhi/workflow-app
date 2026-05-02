import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import api from '../utils/api';

const STATUSES = ['', 'Submitted', 'Approved', 'Rejected', 'Needs Clarification', 'Closed', 'Reopened'];
const CATEGORIES = ['', 'HR', 'IT', 'Finance', 'Operations', 'Legal', 'Other'];

const STAT_CONFIG = [
  { label: 'Submitted',  key: 'Submitted',           icon: '📤', color: 'var(--accent)',  iconBg: 'var(--accent-dim)' },
  { label: 'Approved',   key: 'Approved',             icon: '✅', color: 'var(--green)',   iconBg: 'var(--green-dim)' },
  { label: 'Rejected',   key: 'Rejected',             icon: '❌', color: 'var(--red)',     iconBg: 'var(--red-dim)' },
  { label: 'Needs Info', key: 'Needs Clarification',  icon: '💬', color: 'var(--yellow)',  iconBg: 'var(--yellow-dim)' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [allStats, setAllStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', category: '', from_date: '', to_date: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = user.role === 'User' ? '/requests/my-requests' : '/requests';
      const { data } = await api.get(endpoint, { params: { ...filters, page, limit: LIMIT } });
      setRequests(data.requests);
      setTotal(data.total);
      const s = {};
      data.requests.forEach(r => { s[r.status] = (s[r.status] || 0) + 1; });
      setAllStats(s);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [user, filters, page]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleFilterChange = e => { setFilters(f => ({ ...f, [e.target.name]: e.target.value })); setPage(1); };
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">{user.role === 'User' ? 'My Requests' : 'All Requests'}</h1>
          <p className="page-sub">
            {user.role === 'User' ? 'Track and manage your submitted requests' : `${user.role} dashboard — review and action requests`}
          </p>
        </div>
        {user.role === 'User' && (
          <button className="btn btn-primary" onClick={() => navigate('/new-request')}>
            ✦ New Request
          </button>
        )}
      </div>

      {/* Stat Cards */}
      <div className="stat-cards">
        {STAT_CONFIG.map(s => (
          <div className="stat-card" key={s.key}>
            <div className="stat-icon" style={{ background: s.iconBg }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{allStats[s.key] || 0}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <span className="filters-label">Filter:</span>
        <select name="status" className="form-control" style={{ width: 'auto', minWidth: 150 }} value={filters.status} onChange={handleFilterChange}>
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
        <select name="category" className="form-control" style={{ width: 'auto', minWidth: 140 }} value={filters.category} onChange={handleFilterChange}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c || 'All Categories'}</option>)}
        </select>
        <input type="date" name="from_date" className="form-control" style={{ width: 'auto' }} value={filters.from_date} onChange={handleFilterChange} />
        <input type="date" name="to_date" className="form-control" style={{ width: 'auto' }} value={filters.to_date} onChange={handleFilterChange} />
        <button className="btn btn-ghost btn-sm" onClick={() => { setFilters({ status: '', category: '', from_date: '', to_date: '' }); setPage(1); }}>
          ✕ Clear
        </button>
        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{total} result{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-header-bar">
          <span className="table-header-title">Requests</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Page {page} of {Math.max(1, totalPages)}</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                {user.role !== 'User' && <th>Submitted By</th>}
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px' }}><div className="spinner" /></td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <div className="empty-text">No requests found</div>
                    {user.role === 'User' && <button className="btn btn-primary btn-sm mt-3" onClick={() => navigate('/new-request')}>Create your first request</button>}
                  </div>
                </td></tr>
              ) : requests.map(r => (
                <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/requests/${r.id}`)}>
                  <td><span className="td-id">#{r.id}</span></td>
                  <td>
                    <div className="td-title">{r.title}</div>
                    <div className="td-sub">{r.description?.slice(0, 50)}{r.description?.length > 50 ? '...' : ''}</div>
                  </td>
                  {user.role !== 'User' && <td>{r.user_name}</td>}
                  <td><span style={{ fontSize: '0.82rem', color: 'var(--text-sub)' }}>{r.category}</span></td>
                  <td><PriorityBadge priority={r.priority} /></td>
                  <td><StatusBadge status={r.status} /></td>
                  <td><span className="text-muted">{new Date(r.created_at).toLocaleDateString('en-GB')}</span></td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/requests/${r.id}`)}>View →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        )}
      </div>
    </>
  );
}
