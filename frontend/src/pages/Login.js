import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally { setLoading(false); }
  };

  const fillDemo = (email) => setForm({ email, password: 'password' });

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">⚡</div>
          <div className="login-title">WorkFlow</div>
          <div className="login-sub">Approval & Workflow Management System</div>
        </div>

        {error && <div className="error-msg">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input name="email" type="email" className="form-control"
              placeholder="you@example.com" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input name="password" type="password" className="form-control"
              placeholder="••••••••" value={form.password} onChange={handleChange} required />
          </div>
          <button type="submit" className="btn btn-primary w-full"
            style={{ justifyContent: 'center', padding: '12px', marginTop: '4px', fontSize: '0.95rem' }}
            disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in...</> : 'Sign In →'}
          </button>
        </form>

        <div className="demo-box">
          <div className="demo-box-title">🔑 Demo Credentials — password: "password"</div>
          {[
            { role: 'user', label: 'User', email: 'user@example.com' },
            { role: 'manager', label: 'Manager', email: 'manager@example.com' },
            { role: 'admin', label: 'Admin', email: 'admin@example.com' },
          ].map(d => (
            <div key={d.role} className="demo-row" style={{ cursor: 'pointer' }} onClick={() => fillDemo(d.email)}>
              <span className={`demo-role ${d.role}`}>{d.label}</span>
              <span className="demo-email">{d.email}</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>click to fill</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
