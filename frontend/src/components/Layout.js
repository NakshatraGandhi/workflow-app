import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = {
  User:    [{ to: '/dashboard', icon: '📋', label: 'My Requests' }, { to: '/new-request', icon: '✦', label: 'New Request' }],
  Manager: [{ to: '/dashboard', icon: '📊', label: 'All Requests' }],
  Admin:   [{ to: '/dashboard', icon: '🛡️', label: 'All Requests' }]
};

const ROLE_COLOR = { User: 'var(--accent)', Manager: 'var(--yellow)', Admin: 'var(--red)' };

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };
  const navItems = NAV[user?.role] || [];
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">⚡</div>
          <span className="logo-text">WorkFlow</span>
        </div>
        <nav className="sidebar-nav">
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 4px 6px', marginBottom: '4px' }}>
            Navigation
          </div>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <div className="nav-icon">{item.icon}</div>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">
                <span className="role-dot" style={{ background: ROLE_COLOR[user?.role] }} />
                {user?.role}
              </div>
            </div>
          </div>
          <button className="nav-item" onClick={handleLogout} style={{ color: 'var(--red)', opacity: 0.8 }}>
            <div className="nav-icon" style={{ background: 'var(--red-dim)' }}>🚪</div>
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
