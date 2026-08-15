import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { FileText, Plus, CheckCircle2, AlertCircle, Calendar, Send, BookOpen } from 'lucide-react';

export function CourseApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Apply Modal
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');

  const loadApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const role = (user?.role || '').toLowerCase();
      let apps = [];
      if (role === 'student') {
        apps = await api.getMyApplications();
      } else {
        apps = await api.getAllApplications();
      }
      setApplications(Array.isArray(apps) ? apps : []);

      const courseList = await api.getAllCourses().catch(() => []);
      setCourses(Array.isArray(courseList) ? courseList : []);
    } catch (err) {
      setError(err.message || 'Failed to load course applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [user]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    setError('');
    setSuccess('');
    try {
      await api.applyCourse(parseInt(selectedCourseId));
      setSuccess('Course enrollment application submitted successfully!');
      setIsApplyModalOpen(false);
      setSelectedCourseId('');
      loadApplications();
    } catch (err) {
      setError(err.message || 'Error submitting application.');
    }
  };

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
          <h2 className="card-title">
            <FileText size={18} />
            Course Enrollment Applications
          </h2>
          {user?.role === 'student' && courses.length > 0 && (
            <button className="btn btn-primary btn-sm" onClick={() => setIsApplyModalOpen(true)}>
              <Plus size={14} />
              Apply for Course
            </button>
          )}
        </div>

        <div className="card-body">
          {loading ? (
            <LoadingSpinner message="Fetching admission & course applications..." />
          ) : applications.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No course applications"
              description="No student course enrollment applications have been submitted."
            />
          ) : (
            <div className="table-container">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Registration ID</th>
                    <th>Student Name</th>
                    <th>Course Applied</th>
                    <th>Course Code</th>
                    <th>Submission Date</th>
                    <th>Application Status</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{app.registration_id || '—'}</td>
                      <td>{app.student_name || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{app.course || '—'}</td>
                      <td>{app.course_code ? <span className="badge badge-info">{app.course_code}</span> : '—'}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                          <Calendar size={12} />
                          {app.application_date ? new Date(app.application_date).toLocaleDateString() : 'Recent'}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={app.status || 'Approved'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply for Course Enrollment"
        maxWidth="480px"
      >
        <form onSubmit={handleApply}>
          <div className="form-group">
            <label className="form-label">Select Academic Course <span className="required">*</span></label>
            <select
              className="form-control"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              required
            >
              <option value="">Choose Course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course_code} - {c.name} {c.fees ? `(₹${parseFloat(c.fees).toLocaleString()})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-footer" style={{ margin: '1rem -1.25rem -1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsApplyModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Send size={13} />
              Submit Application
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
