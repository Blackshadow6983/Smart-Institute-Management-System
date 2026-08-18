import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import {
  FileCheck,
  Plus,
  CheckCircle2,
  AlertCircle,
  Download,
  ShieldCheck,
  Search,
  Award,
  Calendar,
  Sparkles,
  UserCheck
} from 'lucide-react';

export function CertificatesPage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Public Verification State
  const [verifyIdInput, setVerifyIdInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  // Generation Modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    certificate_number: `CERT-2026-${Date.now().toString().slice(-5)}`,
    certificate_type: 'Course Completion Certificate',
    course_name: ''
  });

  const loadCertificates = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getAllCertificates();
      setCertificates(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load certificates registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      await loadCertificates();
      const role = (user?.role || '').toLowerCase();
      if (['admin', 'faculty', 'institute', 'institute_admin'].includes(role)) {
        const stuList = await api.getAllStudents().catch(() => []);
        setStudents(Array.isArray(stuList) ? stuList : []);
      }
    }
    init();
  }, [user]);

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verifyIdInput.trim()) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await api.verifyCertificate(verifyIdInput.trim());
      setVerifyResult(res);
    } catch (err) {
      setVerifyResult({
        valid: false,
        message: err.message || 'Verification request failed.'
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleGenerateCertificate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.generateCertificate({
        student_id: parseInt(formData.student_id),
        certificate_number: formData.certificate_number.trim(),
        certificate_type: formData.certificate_type,
        course_name: formData.course_name.trim() || undefined
      });
      setSuccess(`Certificate ${formData.certificate_number} issued successfully!`);
      setIsGenerateModalOpen(false);
      loadCertificates();
    } catch (err) {
      setError(err.message || 'Failed to issue certificate.');
    }
  };

  const role = (user?.role || 'student').toLowerCase();
  const isAdmin = ['admin', 'institute', 'institute_admin'].includes(role);

  return (
    <div>
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={16} />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
          <CheckCircle2 size={16} />
          <div>{success}</div>
        </div>
      )}

      {/* Header Banner */}
      <div className="card-container" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', borderRadius: '16px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: '#ffffff' }}>
              <FileCheck size={28} color="#60a5fa" />
              Certificates & Public Verification
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '4px 0 0' }}>
              Official 100% course completion certificates with digital seals and instant public authenticity verification.
            </p>
          </div>

          {isAdmin && (
            <button
              className="btn-primary"
              onClick={() => {
                setFormData({
                  student_id: students[0]?.id || '',
                  certificate_number: `CERT-2026-${Date.now().toString().slice(-5)}`,
                  certificate_type: 'Course Completion Certificate',
                  course_name: ''
                });
                setIsGenerateModalOpen(true);
              }}
              style={{ padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={18} /> Issue Manual Certificate
            </button>
          )}
        </div>
      </div>

      {/* REQUIREMENT 9: Certificate Verification Tool Card */}
      <div className="card-container" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #2563eb' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={20} color="#2563eb" /> Verify Certificate Authenticity
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Enter a Certificate ID (e.g. <code>CERT-2026-STU001-1</code> or <code>CERT-2026-00001</code>) to verify its validity.
        </p>

        <form onSubmit={handleVerifySubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: verifyResult ? '1rem' : 0 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '38px' }}
              placeholder="Enter Certificate ID..."
              value={verifyIdInput}
              onChange={(e) => setVerifyIdInput(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={verifying} style={{ padding: '10px 20px' }}>
            {verifying ? 'Verifying Registry...' : 'Verify Certificate'}
          </button>
        </form>

        {/* Verification Result Panel */}
        {verifyResult && (
          <div style={{
            background: verifyResult.valid ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
            border: verifyResult.valid ? '1px solid #10b981' : '1px solid #ef4444',
            borderRadius: '10px',
            padding: '1.25rem',
            marginTop: '1rem'
          }}>
            {verifyResult.valid ? (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <div className="badge success" style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                    AUTHENTIC & VERIFIED
                  </div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '2px 0 6px', color: '#065f46' }}>
                    Official Certificate Verified
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    <div><strong>Recipient Student:</strong> {verifyResult.certificate.student_name} ({verifyResult.certificate.registration_id})</div>
                    <div><strong>Course Title:</strong> {verifyResult.certificate.course_name}</div>
                    <div><strong>Certificate ID:</strong> {verifyResult.certificate.certificate_number}</div>
                    <div><strong>Issue Date:</strong> {verifyResult.certificate.issue_date}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#b91c1c' }}>
                <AlertCircle size={28} />
                <div>
                  <h4 style={{ margin: 0, fontWeight: 700 }}>Certificate Not Found</h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.9rem' }}>{verifyResult.message}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Certificates List Table */}
      <div className="card-container">
        <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={18} color="var(--primary-blue)" /> Conferred Certificates Registry
        </h3>

        {loading ? (
          <LoadingSpinner message="Fetching certificates registry..." />
        ) : certificates.length === 0 ? (
          <EmptyState
            icon={FileCheck}
            title="No certificates generated"
            description="Certificates will automatically appear here when students reach 100% course completion."
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Certificate ID</th>
                <th>Student Name</th>
                <th>Course Name</th>
                <th>Certificate Type</th>
                <th>Issue Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700 }}>{c.certificate_number}</td>
                  <td style={{ fontWeight: 600 }}>{c.student_name}</td>
                  <td>{c.course_name || 'Full Program'}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.certificate_type}</td>
                  <td style={{ fontSize: '0.85rem' }}>{c.issue_date || 'Instant'}</td>
                  <td>
                    <span className="badge success">{c.status || 'Issued'}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <a
                      href={api.getCertificateDownloadUrl(c.certificate_number)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.82rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Download size={14} /> Download PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ADMIN MANUAL ISSUE CERTIFICATE MODAL */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Issue Certificate Manually"
        maxWidth="500px"
      >
        <form onSubmit={handleGenerateCertificate}>
          <div className="form-group">
            <label className="form-label">Student <span className="required">*</span></label>
            <select
              className="form-control"
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              required
            >
              <option value="">Select Student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.registration_id} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Course Name <span className="required">*</span></label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Full Stack Web Development"
              value={formData.course_name}
              onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Unique Certificate ID <span className="required">*</span></label>
            <input
              type="text"
              className="form-control"
              value={formData.certificate_number}
              onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Certificate Type</label>
            <input
              type="text"
              className="form-control"
              value={formData.certificate_type}
              onChange={(e) => setFormData({ ...formData, certificate_type: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ margin: '1.25rem -1.25rem -1.25rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsGenerateModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Issue Official Certificate
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default CertificatesPage;
