import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import {
  FileText,
  Plus,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Send,
  BookOpen,
  Award,
  Laptop,
  Users,
  CreditCard,
  Printer,
  ShieldCheck,
  Filter,
  Search,
  Download
} from 'lucide-react';

export function CourseApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters for Admin (Requirement 12)
  const [filterCourseId, setFilterCourseId] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterCompletion, setFilterCompletion] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Admin Completion Update State
  const [editApp, setEditApp] = useState(null);
  const [completionVal, setCompletionVal] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const role = (user?.role || '').toLowerCase();
      const courseList = await api.getAllCourses().catch(() => []);
      setCourses(Array.isArray(courseList) ? courseList : []);

      let params = {};
      if (filterCourseId) params.course_id = filterCourseId;
      if (filterMode) params.learning_mode = filterMode;
      if (filterPayment) params.payment_status = filterPayment;
      if (filterCompletion === 'completed') params.is_completed = true;
      if (filterCompletion === 'in_progress') params.is_completed = false;

      let apps = [];
      if (role === 'student') {
        apps = await api.getMyApplications();
      } else {
        apps = await api.getAllApplications(params);
      }
      setApplications(Array.isArray(apps) ? apps : []);
    } catch (err) {
      setError(err.message || 'Failed to load course enrollments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [user, filterCourseId, filterMode, filterPayment, filterCompletion]);

  const openAdminCompletionModal = (app) => {
    setEditApp(app);
    setCompletionVal(app.completion_status || 0);
    setIsEditModalOpen(true);
  };

  const handleUpdateCompletion = async (e) => {
    e.preventDefault();
    if (!editApp) return;
    setError('');
    setSuccess('');
    try {
      await api.updateCourseCompletion(editApp.id, parseInt(completionVal));
      setSuccess(`Updated course completion progress for ${editApp.student_name} to ${completionVal}%!`);
      setIsEditModalOpen(false);
      loadApplications();
    } catch (err) {
      setError(err.message || 'Failed to update completion status.');
    }
  };

  const filteredApps = applications.filter(app => {
    const q = searchTerm.toLowerCase();
    return (
      (app.student_name && app.student_name.toLowerCase().includes(q)) ||
      (app.registration_id && app.registration_id.toLowerCase().includes(q)) ||
      (app.course && app.course.toLowerCase().includes(q))
    );
  });

  const role = (user?.role || 'student').toLowerCase();
  const isAdmin = ['admin', 'faculty', 'institute', 'institute_admin'].includes(role);

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
              <FileText size={28} color="#60a5fa" />
              {isAdmin ? 'Admin Course Enrollment Management' : 'My Course Enrollments'}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '4px 0 0' }}>
              Track student enrollments, learning modes (Online/Offline), payment status, attendance %, and completion rules.
            </p>
          </div>
        </div>
      </div>

      {/* REQUIREMENT 12: Admin Filters Bar */}
      {isAdmin && (
        <div className="card-container" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '36px' }}
              placeholder="Search by student name, enrollment ID, course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={filterCourseId}
              onChange={(e) => setFilterCourseId(e.target.value)}
            >
              <option value="">All Courses</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.course_code} - {c.name}</option>
              ))}
            </select>

            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
            >
              <option value="">All Modes (Online/Offline)</option>
              <option value="Online">Online Mode</option>
              <option value="Offline">Offline Campus Mode</option>
            </select>

            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
            >
              <option value="">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>

            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={filterCompletion}
              onChange={(e) => setFilterCompletion(e.target.value)}
            >
              <option value="">All Completion Statuses</option>
              <option value="completed">Completed (100%)</option>
              <option value="in_progress">In Progress (&lt;100%)</option>
            </select>
          </div>
        </div>
      )}

      {/* Enrollments Table */}
      <div className="card-container">
        <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="var(--primary-blue)" /> Enrollment Records ({filteredApps.length})
        </h3>

        {loading ? (
          <LoadingSpinner message="Fetching enrollment records..." />
        ) : filteredApps.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No enrollments found"
            description="No student enrollments match the selected filter criteria."
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {isAdmin && <th>Student Details</th>}
                <th>Enrolled Course</th>
                <th>Mode</th>
                <th>Enrollment Date</th>
                <th>Fee Paid</th>
                <th>Payment Status</th>
                <th>Attendance %</th>
                <th>Course Progress</th>
                <th>Completion</th>
                {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredApps.map((app) => {
                const compPct = app.completion_status || 0;
                const is100 = compPct >= 100;
                const att = app.attendance_stats || { percentage: 0, present: 0, total: 0 };

                return (
                  <tr key={app.id}>
                    {isAdmin && (
                      <td>
                        <div style={{ fontWeight: 700 }}>{app.student_name}</div>
                        <span className="badge" style={{ background: 'var(--bg-subtle)', fontSize: '11px' }}>
                          {app.registration_id}
                        </span>
                      </td>
                    )}
                    <td>
                      <div style={{ fontWeight: 700 }}>{app.course}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Code: {app.course_code}</div>
                    </td>
                    <td>
                      <span className={`badge ${app.learning_mode === 'Online' ? 'info' : 'warning'}`}>
                        {app.learning_mode === 'Online' ? <Laptop size={12} style={{ marginRight: 4 }} /> : <Users size={12} style={{ marginRight: 4 }} />}
                        {app.learning_mode}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {app.application_date ? new Date(app.application_date).toLocaleDateString() : 'Instant'}
                    </td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{app.amount_paid?.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${app.payment_status === 'Paid' ? 'success' : 'warning'}`}>
                        {app.payment_status || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: att.percentage >= 75 ? '#10b981' : '#ef4444' }}>
                        {att.percentage}%
                      </div>
                    </td>
                    <td style={{ minWidth: '130px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>
                        <span>Progress</span>
                        <span>{compPct}%</span>
                      </div>
                      <div className="progress-bar-container" style={{ height: '6px' }}>
                        <div className="progress-bar-fill" style={{ width: `${compPct}%`, background: is100 ? '#10b981' : '#2563eb' }}></div>
                      </div>
                    </td>
                    <td>
                      {is100 ? (
                        <span className="badge success">Completed</span>
                      ) : (
                        <span className="badge warning">In Progress</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          {app.payment_status !== 'Paid' && (
                            <button
                              className="btn-primary"
                              style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#10b981', borderColor: '#10b981' }}
                              onClick={async () => {
                                try {
                                  await api.updatePaymentStatus(app.id, 'Paid');
                                  setSuccess(`Fee payment approved for ${app.student_name}!`);
                                  loadApplications();
                                } catch (err) {
                                  setError(err.message || 'Failed to approve payment');
                                }
                              }}
                            >
                              Approve Fee
                            </button>
                          )}
                          <button
                            className="btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            onClick={() => openAdminCompletionModal(app)}
                          >
                            Update %
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>


      {/* Admin Completion Status Update Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Update Completion Status: ${editApp?.student_name}`}
        maxWidth="440px"
      >
        <form onSubmit={handleUpdateCompletion}>
          <div className="form-group">
            <label className="form-label">Course: <strong>{editApp?.course}</strong></label>
            <div style={{ marginTop: '1rem' }}>
              <label className="form-label">Completion Percentage (0 - 100%): <strong>{completionVal}%</strong></label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                className="form-control"
                value={completionVal}
                onChange={(e) => setCompletionVal(e.target.value)}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>0% (Enrolled)</span>
                <span>50% (Halfway)</span>
                <span>100% (Completed & Unlocks Certificate)</span>
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ margin: '1rem -1.25rem -1.25rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Completion %
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default CourseApplicationsPage;
