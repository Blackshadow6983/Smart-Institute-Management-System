import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Info,
  Sparkles
} from 'lucide-react';

export function RegisterPage() {
  const navigate = useNavigate();

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact_number: '',
    preferred_code: '',
    address: '',
    password: '',
    confirmPassword: ''
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registeredInfo, setRegisteredInfo] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Please enter the official Institute Name.';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) return 'Please provide a valid official email address.';
    if (!formData.contact_number.trim() || formData.contact_number.replace(/\D/g, '').length < 10) return 'Please enter a valid 10-digit contact number.';
    if (!formData.password) return 'Password is required.';
    if (formData.password.length < 6) return 'Password must be at least 6 characters in length.';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setRegisteredInfo(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const response = await api.registerInstitute({
        name: formData.name.trim(),
        email: formData.email.trim(),
        contact_number: formData.contact_number.trim(),
        address: formData.address.trim() || null,
        preferred_code: formData.preferred_code.trim() || null,
        password: formData.password
      });

      setRegisteredInfo(response);
    } catch (err) {
      setError(err.message || 'Institute registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ padding: '2.5rem 1rem' }}>
      <div className="auth-card" style={{ maxWidth: '640px' }}>
        <div className="auth-header">
          <div style={{
            width: '46px',
            height: '46px',
            background: 'linear-gradient(135deg, var(--primary-navy, #0f172a), var(--primary-blue, #2563eb))',
            borderRadius: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            marginBottom: '10px',
            boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
          }}>
            <Building2 size={24} />
          </div>
          <h1 style={{ fontSize: '22px', letterSpacing: '-0.5px' }}>Register Your Institute</h1>
          <p>Multi-Tenant Institutional Administration Portal</p>
        </div>

        <div className="auth-body">
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{error}</div>
            </div>
          )}

          {registeredInfo ? (
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid #10b981',
              borderRadius: '8px',
              padding: '1.5rem',
              textAlign: 'center',
              marginBottom: '1rem'
            }}>
              <CheckCircle2 size={42} style={{ color: '#10b981', margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 6px', color: '#065f46' }}>Institute Registration Successful!</h3>
              <p style={{ margin: '0 0 14px', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                Your institute has been registered on the network.
              </p>

              <div style={{
                background: '#ffffff',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '6px',
                padding: '1rem',
                marginBottom: '1.25rem',
                textAlign: 'left',
                display: 'grid',
                gap: '8px',
                fontSize: '13px'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Institute Name</span>
                  <strong>{registeredInfo.institute?.name}</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Assigned Institute Code</span>
                    <span style={{
                      display: 'inline-block',
                      background: 'var(--primary-navy, #0f172a)',
                      color: '#ffffff',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      letterSpacing: '0.5px'
                    }}>
                      {registeredInfo.institute?.institute_code}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Admin Username</span>
                    <strong>{registeredInfo.login?.username}</strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => navigate('/login')}
              >
                Proceed to Sign In <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <>
              {/* Informational Callout */}
              <div style={{
                background: 'rgba(37, 99, 235, 0.05)',
                border: '1px solid rgba(37, 99, 235, 0.15)',
                borderRadius: '6px',
                padding: '10px 14px',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '12.5px',
                color: 'var(--text-secondary)'
              }}>
                <Info size={18} style={{ color: 'var(--primary-blue, #2563eb)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Are you a Student?</strong> Students are enrolled directly by their Institute and will receive their unique <strong>Student ID & Password</strong> via Gmail. Only Institute Admins need to create an account here.
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="name">
                    Institute Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-control"
                    placeholder="e.g. ITE Institute of Technology & Engineering"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="preferred_code">
                      Institute Code / Acronym <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(Optional)</span>
                    </label>
                    <input
                      type="text"
                      id="preferred_code"
                      name="preferred_code"
                      className="form-control"
                      placeholder="e.g. ITE (auto becomes ITE-001)"
                      value={formData.preferred_code}
                      onChange={handleChange}
                    />
                    <small style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                      Codes are automatically sequenced (e.g. ITE-001) to ensure uniqueness.
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="email">
                      Official Admin Email <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-control"
                      placeholder="admissions@institute.edu"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="contact_number">
                      Contact / Helpline Phone <span className="required">*</span>
                    </label>
                    <input
                      type="tel"
                      id="contact_number"
                      name="contact_number"
                      className="form-control"
                      placeholder="+91 98765 43210"
                      value={formData.contact_number}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="address">
                      Campus Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      className="form-control"
                      placeholder="City, State / Campus location"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="password">
                      Admin Master Password <span className="required">*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        className="form-control"
                        placeholder="Minimum 6 characters"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px'
                        }}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="confirmPassword">
                      Confirm Password <span className="required">*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        className="form-control"
                        placeholder="Re-enter password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px'
                        }}
                        aria-label="Toggle confirm password visibility"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  style={{ marginTop: '0.75rem' }}
                  disabled={loading}
                >
                  {loading ? (
                    <span>Registering Institute & Provisioning Environment...</span>
                  ) : (
                    <>
                      <ShieldCheck size={17} />
                      <span>Register Institute & Access Dashboard</span>
                    </>
                  )}
                </button>
              </form>

              <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Already registered your institute or have student login?{' '}
                <Link to="/login" style={{ fontWeight: 600, color: 'var(--primary-blue, #2563eb)' }}>
                  Sign In to Portal &rarr;
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="auth-footer">
          <div>Multi-Tenant Institute Management System • Dedicated per-institute environment</div>
        </div>
      </div>
    </div>
  );
}
