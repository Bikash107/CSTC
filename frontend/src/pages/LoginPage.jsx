import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as loginApi, register as registerApi } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await loginApi({ email: loginEmail, password: loginPassword });
      login(data.user, data.token);
      toast.success('Welcome back, ' + data.user.name + '!');
      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'agent') navigate('/agent');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (regPassword !== regConfirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await registerApi({ name: regName, email: regEmail, password: regPassword });
      toast.success('Account created! Please log in.');
      setTab('login');
      setLoginEmail(regEmail);
      setRegName(''); setRegEmail(''); setRegPassword(''); setRegConfirm('');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-card">
        <Link to="/" className="auth-logo">
          <div className="logo-mark">C</div>
          CSTC
        </Link>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(''); }}
          >
            Log In
          </button>
          <button
            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(''); }}
          >
            Register
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {tab === 'login' ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Log In →'}
            </button>
            <p className="auth-divider">
              Don't have an account?{' '}
              <button type="button" style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: 'inherit' }} onClick={() => setTab('register')}>
                Sign up
              </button>
            </p>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="John Smith"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={regConfirm}
                onChange={(e) => setRegConfirm(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
            <p className="auth-divider">
              Already have an account?{' '}
              <button type="button" style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: 'inherit' }} onClick={() => setTab('login')}>
                Log in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
