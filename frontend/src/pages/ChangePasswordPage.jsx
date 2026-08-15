import React, { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { KeyRound, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

export function ChangePasswordPage() {
  const { user, updateUser } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters in length.');
      return;
    }

    setLoading(true);
    try {
      await api.changePassword({
        username: user?.username,
        old_password: oldPassword,
        new_password: newPassword
      });

      setSuccess('Account password successfully updated!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');

      if (user?.must_change_password) {
        updateUser({ must_change_password: false });
      }
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto' }}>
      {user?.must_change_password && (
        <div className="alert alert-warning" style={{ marginBottom: '1.25rem' }}>
          <ShieldAlert size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Password Update Required:</strong> You are using a temporary initial password. For security compliance, please set a new personal password before continuing.
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={16} />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <CheckCircle2 size={16} />
          <div>{success}</div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <KeyRound size={18} />
            Update Account Password
          </h2>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Current Password <span className="required">*</span></label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter existing password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password <span className="required">*</span></label>
              <input
                type="password"
                className="form-control"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password <span className="required">*</span></label>
              <input
                type="password"
                className="form-control"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                <KeyRound size={14} />
                {loading ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        <div className="card-footer">
          Institutional Security Policy: Ensure you choose a strong password and never share credentials with unauthorized parties.
        </div>
      </div>
    </div>
  );
}
