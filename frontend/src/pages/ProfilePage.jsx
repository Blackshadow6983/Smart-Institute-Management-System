import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { User, Mail, Phone, MapPin, Calendar, BookOpen, Layers, Save, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

export function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
    date_of_birth: '',
    gender: 'Male',
    qualification: '',
    specialization: '',
    department: ''
  });

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const role = (user?.role || '').toLowerCase();
      if (role === 'student' && user?.username) {
        const res = await api.getStudent(user.username);
        if (res.student) {
          setProfile(res.student);
          setFormData({
            name: res.student.name || '',
            email: res.student.email || '',
            mobile: res.student.mobile || '',
            address: res.student.address || '',
            date_of_birth: res.student.date_of_birth || '',
            gender: res.student.gender || 'Male',
            qualification: '',
            specialization: '',
            department: ''
          });
        }
      } else if (role === 'faculty' && user?.username) {
        const res = await api.getFaculty(user.username);
        if (res.faculty) {
          setProfile(res.faculty);
          setFormData({
            name: res.faculty.name || '',
            email: res.faculty.email || '',
            mobile: res.faculty.mobile || '',
            address: res.faculty.address || '',
            date_of_birth: '',
            gender: 'Male',
            qualification: res.faculty.qualification || '',
            specialization: res.faculty.specialization || '',
            department: res.faculty.department || ''
          });
        }
      } else {
        // Admin
        setProfile({
          username: user?.username,
          role: 'Administrator',
          name: 'System Administrator'
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile record.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const role = (user?.role || '').toLowerCase();
      if (role === 'student' && user?.username) {
        await api.updateStudent(user.username, {
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          address: formData.address,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender
        });
        setSuccess('Student profile details updated successfully!');
      } else if (role === 'faculty' && user?.username) {
        await api.updateFaculty(user.username, {
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          address: formData.address,
          qualification: formData.qualification,
          specialization: formData.specialization,
          department: formData.department
        });
        setSuccess('Faculty profile details updated successfully!');
      }
      loadProfile();
    } catch (err) {
      setError(err.message || 'Error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Retrieving institutional profile..." />;
  }

  const role = (user?.role || 'student').toLowerCase();

  return (
    <div>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Profile Card Summary */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <User size={18} />
              Identity & Role Information
            </h2>
          </div>
          <div className="card-body" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'var(--primary-navy)',
              color: '#fff',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '24px',
              marginBottom: '1rem'
            }}>
              {(formData.name || user?.username || 'U').charAt(0).toUpperCase()}
            </div>
            
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-navy)' }}>
              {formData.name || profile?.name || user?.username}
            </h3>
            <div style={{ marginTop: '4px' }}>
              <span className="badge badge-info" style={{ textTransform: 'uppercase', fontSize: '11px' }}>
                <Shield size={11} /> {user?.role || 'User'}
              </span>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'left', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Identifier / ID:</span>
                <strong>{user?.username}</strong>
              </div>
              {profile?.course && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Enrolled Course:</span>
                  <span>{profile.course}</span>
                </div>
              )}
              {profile?.batch && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Cohort Batch:</span>
                  <span>{profile.batch}</span>
                </div>
              )}
              {profile?.department && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Department:</span>
                  <span>{profile.department}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              Edit Account Information
            </h2>
          </div>
          <div className="card-body">
            {role === 'admin' ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                System Administrator accounts are managed through root administrative security configurations.
              </p>
            ) : (
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label className="form-label">Full Name <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email Address <span className="required">*</span></label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    />
                  </div>
                </div>

                {role === 'student' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Date of Birth</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Gender</label>
                      <select
                        className="form-control"
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                )}

                {role === 'faculty' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Specialization</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    <Save size={14} />
                    {saving ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
