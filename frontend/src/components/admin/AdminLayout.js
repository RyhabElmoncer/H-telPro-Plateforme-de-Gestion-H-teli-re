import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AdminLayout.css';

const navItems = [
  { path: '/admin', label: 'Tableau de bord', icon: '◈', roles: ['admin', 'receptionist'] },
  { path: '/admin/rooms', label: 'Chambres', icon: '⌂', roles: ['admin', 'receptionist'] },
  { path: '/admin/reservations', label: 'Réservations', icon: '📋', roles: ['admin', 'receptionist'] },
  { path: '/admin/payments', label: 'Paiements', icon: '💳', roles: ['admin', 'receptionist'] },
  { path: '/admin/users', label: 'Utilisateurs', icon: '👥', roles: ['admin'] },
  { path: '/admin/notifications', label: 'Notifications', icon: '🔔', roles: ['admin'] },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => { logout(); navigate('/login'); };

  const visibleItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand">
            <span style={{color: 'var(--gold)', fontSize: '18px'}}>⬡</span>
            {sidebarOpen && <span>Grand<em style={{color: 'var(--gold-light)'}}>Hôtel</em></span>}
          </Link>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
          {sidebarOpen && (
            <div>
              <p className="sidebar-username">{user?.firstName} {user?.lastName}</p>
              <p className="sidebar-role">{user?.role === 'admin' ? 'Administrateur' : 'Réceptionniste'}</p>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {visibleItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
              title={!sidebarOpen ? item.label : ''}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="sidebar-item" title="Voir le site">
            <span className="sidebar-icon">↗</span>
            {sidebarOpen && <span>Voir le site</span>}
          </Link>
          <button className="sidebar-item sidebar-logout" onClick={handleLogout} title="Déconnexion">
            <span className="sidebar-icon">⏻</span>
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button className="mobile-sidebar-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <h1 className="topbar-title">
            {visibleItems.find(i => i.path === location.pathname)?.label || 'Administration'}
          </h1>
          <div className="topbar-user">
            <div className="user-avatar" style={{width:32, height:32, fontSize:12, borderRadius:'50%', background:'var(--gold)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700}}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </div>
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
