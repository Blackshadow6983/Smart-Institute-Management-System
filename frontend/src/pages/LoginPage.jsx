import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Lock, Building2, ArrowRight, GraduationCap } from 'lucide-react';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      if (result.user?.must_change_password) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error || 'Failed to sign in. Please verify your credentials.');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{
            width: '44px',
            height: '44px',
            background: 'linear-gradient(135deg, var(--primary-navy, #0f172a), var(--primary-blue, #2563eb))',
            borderRadius: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '18px',
            marginBottom: '8px',
            boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
          }}>
            <Building2 size={22} />
          </div>
          <h1>UNIVERSITY PORTAL</h1>
          <p>Multi-Tenant Academic & Student Management</p>
        </div>

        <div className="auth-body">
          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                University Code / Student Enrollment ID / Email <span className="required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  id="username"
                  className="form-control"
                  placeholder="e.g. ITE-001, ITE-001-STU001, or email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <small style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '3px' }}>
                Admins use University Code (e.g. ITE-001). Students use Enrollment ID (e.g. ITE-001-STU001).
              </small>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password <span className="required">*</span>
              </label>
              <input
                type="password"
                id="password"
                className="form-control"
                placeholder="Enter account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              style={{ marginTop: '0.75rem' }}
              disabled={loading}
            >
              {loading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Need to register your University?{' '}
            <Link to="/register" style={{ fontWeight: 600, color: 'var(--primary-blue, #2563eb)' }}>
              Register University &rarr;
            </Link>
          </div>
        </div>

        <div className="auth-footer">
          <div>Students receive login credentials via Gmail directly from their university.</div>
        </div>
      </div>
    </div>
  );
}
