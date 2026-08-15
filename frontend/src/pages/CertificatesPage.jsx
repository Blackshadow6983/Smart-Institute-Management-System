import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { FileCheck, Plus, CheckCircle2, AlertCircle, Printer, Award, ShieldCheck } from 'lucide-react';

export function CertificatesPage() {
  const { user } = useAuth();
  const [certificate, setCertificate] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Generation Modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    certificate_number: `CERT-${Date.now().toString().slice(-6)}`,
    certificate_type: 'Course Completion'
  });

  const loadCertificate = async (studentId) => {
    if (!studentId) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.getStudentCertificate(studentId);
      setCertificate(data);
    } catch (err) {
      setCertificate(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      setError('');
      try {
        const role = (user?.role || '').toLowerCase();
        if (role === 'student' && user?.username) {
          const prof = await api.getStudent(user.username);
          if (prof.student?.id) {
            setSelectedStudentId(prof.student.id);
            await loadCertificate(prof.student.id);
          }
        } else if (role === 'admin' || role === 'faculty') {
          const stuList = await api.getAllStudents().catch(() => []);
          const list = Array.isArray(stuList) ? stuList : [];
          setStudents(list);
          if (list.length > 0) {
            setSelectedStudentId(list[0].id);
            await loadCertificate(list[0].id);
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to initialize certificates module.');
        setLoading(false);
      }
    }

    init();
  }, [user]);

  const handleStudentChange = (e) => {
    const sId = parseInt(e.target.value);
    setSelectedStudentId(sId);
    loadCertificate(sId);
  };

  const handleGenerateCertificate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.generateCertificate({
        student_id: parseInt(formData.student_id),
        certificate_number: formData.certificate_number,
        certificate_type: formData.certificate_type
      });
      setSuccess(`Certificate #${formData.certificate_number} successfully issued!`);
      setIsGenerateModalOpen(false);
      if (selectedStudentId === parseInt(formData.student_id)) {
        loadCertificate(selectedStudentId);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate certificate.');
    }
  };

  const isAdmin = user?.role === 'admin';
  const isFacultyOrAdmin = user?.role === 'faculty' || user?.role === 'admin';

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

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h2 className="card-title">
              <FileCheck size={18} />
              Institutional Credentials & Certificate Issuance
            </h2>
            {isFacultyOrAdmin && students.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Student:</span>
                <select
                  className="form-control"
                  style={{ width: 'auto', padding: '3px 8px', fontSize: '12px' }}
                  value={selectedStudentId || ''}
                  onChange={handleStudentChange}
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.registration_id} - {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {certificate && (
              <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                <Printer size={14} />
                Print Certificate
              </button>
            )}
            {isAdmin && (
              <button className="btn btn-primary btn-sm" onClick={() => {
                setFormData({
                  ...formData,
                  student_id: selectedStudentId || '',
                  certificate_number: `CERT-${Date.now().toString().slice(-6)}`
                });
                setIsGenerateModalOpen(true);
              }}>
                <Plus size={14} />
                Issue Certificate
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <LoadingSpinner message="Verifying credentials registry..." />
          ) : !certificate ? (
            <EmptyState
              icon={FileCheck}
              title="No certificate issued"
              description="No completion certificate has been generated for this student record yet."
            />
          ) : (
            <div style={{
              background: '#ffffff',
              border: '8px double #1d63b8',
              borderRadius: 'var(--radius-lg)',
              padding: '3rem 2rem',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--primary-blue)',
                border: '1px solid var(--primary-blue-border)',
                padding: '3px 8px',
                borderRadius: '4px'
              }}>
                <ShieldCheck size={14} />
                VERIFIED CREDENTIAL
              </div>

              <div style={{ width: '48px', height: '48px', background: 'var(--primary-navy)', color: '#fff', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '20px', marginBottom: '1rem' }}>
                AI
              </div>

              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-navy)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                AI SMART INSTITUTE
              </h1>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '2rem' }}>
                Certificate of Excellence & Completion
              </div>

              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '1rem' }}>
                This is to officially certify that
              </p>

              <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--primary-blue)', borderBottom: '2px solid var(--primary-blue-light)', display: 'inline-block', paddingBottom: '4px', marginBottom: '1.25rem' }}>
                {certificate.student_name || 'Enrolled Scholar'}
              </h2>

              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
                has successfully fulfilled all institutional, practical, and academic requirements for the curriculum of <strong>{certificate.certificate_type || 'Professional Certification'}</strong> with distinction and exemplary academic merit.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '2rem', fontSize: '12px', color: 'var(--text-muted)' }}>
                <div>
                  <strong>Certificate No:</strong> {certificate.certificate_number}
                </div>
                <div>
                  <strong>Issue Date:</strong> {certificate.issue_date ? new Date(certificate.issue_date).toLocaleDateString() : 'Official'}
                </div>
                <div>
                  <strong>Institutional Status:</strong> Valid & Conferred
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generate Certificate Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Issue Official Academic Certificate"
        maxWidth="480px"
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
            <label className="form-label">Certificate Serial Number <span className="required">*</span></label>
            <input
              type="text"
              className="form-control"
              value={formData.certificate_number}
              onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Certification Type / Honor</label>
            <select
              className="form-control"
              value={formData.certificate_type}
              onChange={(e) => setFormData({ ...formData, certificate_type: e.target.value })}
            >
              <option value="Course Completion">Course Completion Certificate</option>
              <option value="Diploma in Artificial Intelligence">Diploma in Artificial Intelligence</option>
              <option value="Advanced Computer Science Specialist">Advanced Computer Science Specialist</option>
              <option value="Academic Excellence Merit Award">Academic Excellence Merit Award</option>
            </select>
          </div>

          <div className="modal-footer" style={{ margin: '1rem -1.25rem -1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsGenerateModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Issue Certificate
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
