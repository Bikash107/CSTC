import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { success } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    success('Logged out successfully');
    navigate('/');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'agent') return '/agent';
    return '/dashboard';
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <div className="logo-mark">C</div>
          CSTC
        </Link>

        {user ? (
          <>
            <div className="navbar-links">
              <Link to={getDashboardLink()} className={`nav-link ${isActive(getDashboardLink())}`}>
                Dashboard
              </Link>
              {user.role === 'customer' && (
                <Link to="/create-ticket" className={`nav-link ${isActive('/create-ticket')}`}>
                  New Ticket
                </Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin/users" className={`nav-link ${isActive('/admin/users')}`}>
                  Users
                </Link>
              )}
            </div>
            <div className="navbar-right">
              <div className="user-pill">
                <div className="user-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span>{user.name}</span>
                <span className={`badge badge-${user.role}`}>{user.role}</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="navbar-links">
              <a href="#roles" className="nav-link">Product</a>
              <a href="#lifecycle" className="nav-link">How it Works</a>
            </div>
            <div className="navbar-right">
              <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link to="/login" className="btn btn-primary btn-sm">Get Started</Link>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
