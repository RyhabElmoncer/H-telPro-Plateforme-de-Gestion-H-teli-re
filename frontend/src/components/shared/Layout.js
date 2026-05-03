import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <div className="layout">
      <header className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand">
            <span className="brand-icon">⬡</span>
            <span className="brand-name">Grand<em>Hôtel</em></span>
          </Link>

          <nav className="navbar-nav desktop-nav">
            <Link to="/" className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}>Accueil</Link>
            <Link to="/rooms" className={location.pathname.startsWith('/rooms') ? 'nav-link active' : 'nav-link'}>Chambres</Link>
            {user && user.role === 'client' && (
              <Link to="/my-reservations" className={location.pathname === '/my-reservations' ? 'nav-link active' : 'nav-link'}>Mes Réservations</Link>
            )}
          </nav>

          <div className="navbar-actions desktop-nav">
            {user ? (
              <div className="user-menu">
                <button className="user-btn" onClick={() => setMenuOpen(!menuOpen)}>
                  <div className="user-avatar">{user.firstName?.[0]}{user.lastName?.[0]}</div>
                  <span>{user.firstName}</span>
                  <span style={{fontSize: '10px', opacity: 0.6}}>▼</span>
                </button>
                {menuOpen && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <p className="dropdown-name">{user.firstName} {user.lastName}</p>
                      <p className="dropdown-role">{user.role === 'admin' ? 'Administrateur' : user.role === 'receptionist' ? 'Réceptionniste' : 'Client'}</p>
                    </div>
                    <Link to="/profile" className="dropdown-item" onClick={() => setMenuOpen(false)}>Mon profil</Link>
                    {(user.role === 'admin' || user.role === 'receptionist') && (
                      <Link to="/admin" className="dropdown-item" onClick={() => setMenuOpen(false)}>Administration</Link>
                    )}
                    <button className="dropdown-item dropdown-logout" onClick={handleLogout}>Déconnexion</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary btn-sm">Connexion</Link>
                <Link to="/register" className="btn btn-primary btn-sm">S'inscrire</Link>
              </>
            )}
          </div>

          <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        </div>

        {menuOpen && (
          <div className="mobile-menu">
            <Link to="/" className="mobile-menu-item" onClick={() => setMenuOpen(false)}>Accueil</Link>
            <Link to="/rooms" className="mobile-menu-item" onClick={() => setMenuOpen(false)}>Chambres</Link>
            {user && user.role === 'client' && <Link to="/my-reservations" className="mobile-menu-item" onClick={() => setMenuOpen(false)}>Mes Réservations</Link>}
            {user ? (
              <>
                <Link to="/profile" className="mobile-menu-item" onClick={() => setMenuOpen(false)}>Mon profil</Link>
                {(user.role === 'admin' || user.role === 'receptionist') && <Link to="/admin" className="mobile-menu-item" onClick={() => setMenuOpen(false)}>Administration</Link>}
                <button className="mobile-menu-item" onClick={handleLogout} style={{textAlign:'left', width:'100%', background:'none', border:'none', color: 'var(--error)'}}>Déconnexion</button>
              </>
            ) : (
              <>
                <Link to="/login" className="mobile-menu-item" onClick={() => setMenuOpen(false)}>Connexion</Link>
                <Link to="/register" className="mobile-menu-item" onClick={() => setMenuOpen(false)}>S'inscrire</Link>
              </>
            )}
          </div>
        )}
      </header>

      <main className="main-content">{children}</main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="brand-icon">⬡</span>
            <span className="brand-name">Grand<em>Hôtel</em></span>
          </div>
          <p className="footer-copy">© {new Date().getFullYear()} GrandHôtel. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
