import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { User, Mail, Phone, MapPin, Calendar, BookOpen, Layers, Save, CheckCircle2, AlertCircle, Shield, QrCode, CreditCard, Award, Building } from 'lucide-react';

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
    department: '',
    // Institute Payment & Certificate Settings
    payment_upi_id: '',
    payment_qr_code_url: '',
    payment_bank_details: '',
    payment_instructions: '',
    certificate_title: '',
    certificate_signatory_name: '',
    certificate_logo_url: ''
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
          setFormData(prev => ({
            ...prev,
            name: res.student.name || '',
            email: res.student.email || '',
            mobile: res.student.mobile || '',
            address: res.student.address || '',
            date_of_birth: res.student.date_of_birth || '',
            gender: res.student.gender || 'Male'
          }));
        }
      } else if (role === 'faculty' && user?.username) {
        const res = await api.getFaculty(user.username);
        if (res.faculty) {
          setProfile(res.faculty);
          setFormData(prev => ({
            ...prev,
            name: res.faculty.name || '',
            email: res.faculty.email || '',
            mobile: res.faculty.mobile || '',
            address: res.faculty.address || '',
            qualification: res.faculty.qualification || '',
            specialization: res.faculty.specialization || '',
            department: res.faculty.department || ''
          }));
        }
      } else {
        // Institute Admin
        const inst = await api.getInstituteProfile();
        setProfile(inst);
        setFormData(prev => ({
          ...prev,
          name: inst.name || '',
          email: inst.email || '',
          mobile: inst.contact_number || '',
          address: inst.address || '',
          payment_upi_id: inst.payment_upi_id || '',
          payment_qr_code_url: inst.payment_qr_code_url || '',
          payment_bank_details: inst.payment_bank_details || '',
          payment_instructions: inst.payment_instructions || '',
          certificate_title: inst.certificate_title || 'Course Completion Certificate',
          certificate_signatory_name: inst.certificate_signatory_name || 'Academic Director',
          certificate_logo_url: inst.certificate_logo_url || ''
        }));
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
      } else {
        // Institute Admin Profile & Payment Settings Update
        await api.updateInstituteProfile({
          name: formData.name,
          contact_number: formData.mobile,
          address: formData.address,
          payment_upi_id: formData.payment_upi_id,
          payment_qr_code_url: formData.payment_qr_code_url,
          payment_bank_details: formData.payment_bank_details,
          payment_instructions: formData.payment_instructions,
          certificate_title: formData.certificate_title,
          certificate_signatory_name: formData.certificate_signatory_name,
          certificate_logo_url: formData.certificate_logo_url
        });
        setSuccess('Institute settings, payment configuration & certificate details updated successfully!');
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
  const isAdminRole = ['admin', 'institute', 'institute_admin'].includes(role);

  return (
    <div className="page-container" style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
          {isAdminRole ? 'Institute & Profile Settings' : 'My Profile'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
          Manage your personal information, institutional credentials, payment gateways, and certificate templates.
        </p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        
        {/* Profile Card */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <User size={20} color="var(--primary-color)" />
            <h2 className="card-title">Profile Overview</h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Institute Code</span>
                <p style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{profile?.institute_code || user?.institute_code || 'N/A'}</p>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Role</span>
                <p style={{ fontWeight: 600, textTransform: 'capitalize' }}>{user?.role || 'User'}</p>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Identifier / Username</span>
                <p style={{ fontWeight: 600 }}>{user?.username || profile?.registration_id || profile?.employee_id || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              {isAdminRole ? 'Configure Institute & Payment Settings' : 'Edit Personal Profile'}
            </h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">{isAdminRole ? 'Institute / Organization Name' : 'Full Name'} <span className="required">*</span></label>
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
                    required={!isAdminRole}
                    disabled={isAdminRole}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Mobile Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              {/* Institute Payment Details Section for Admin */}
              {isAdminRole && (
                <>
                  <div style={{ borderTop: '1px solid var(--border-color)', margin: '1.5rem 0 1rem 0', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <QrCode size={18} color="var(--primary-color)" />
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                        Institute Payment Gateway Settings (UPI & QR Code)
                      </h3>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      Students enrolling in your courses will see these UPI payment details to pay course fees.
                    </p>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Institute UPI ID (e.g. yourname@upi or institute@okaxis)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. institute@upi"
                        value={formData.payment_upi_id}
                        onChange={(e) => setFormData({ ...formData, payment_upi_id: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Payment QR Code Image URL</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="https://example.com/qr-code.png or image URL"
                        value={formData.payment_qr_code_url}
                        onChange={(e) => setFormData({ ...formData, payment_qr_code_url: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Bank Account Details (Bank Name, Account No, IFSC Code)</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Bank: State Bank of India&#10;A/C: 1234567890&#10;IFSC: SBIN0001234"
                      value={formData.payment_bank_details}
                      onChange={(e) => setFormData({ ...formData, payment_bank_details: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Student Payment Instructions</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="e.g., Scan QR or transfer via UPI ID. Share receipt or UTR transaction ID with Institute Admin."
                      value={formData.payment_instructions}
                      onChange={(e) => setFormData({ ...formData, payment_instructions: e.target.value })}
                    />
                  </div>

                  {/* Certificate Settings */}
                  <div style={{ borderTop: '1px solid var(--border-color)', margin: '1.5rem 0 1rem 0', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <Award size={18} color="var(--primary-color)" />
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                        Custom Certificate Template Settings
                      </h3>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Certificate Title Header</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. CERTIFICATE OF EXCELLENCE"
                        value={formData.certificate_title}
                        onChange={(e) => setFormData({ ...formData, certificate_title: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Authorized Signatory Name / Title</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Dr. A. Sharma, Director"
                        value={formData.certificate_signatory_name}
                        onChange={(e) => setFormData({ ...formData, certificate_signatory_name: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save size={14} />
                  {saving ? 'Saving Settings...' : 'Save Profile & Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
