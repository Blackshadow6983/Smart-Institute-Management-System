import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { CalendarCheck, Plus, CheckCircle2, AlertCircle, Clock, Calendar, Check, X } from 'lucide-react';

export function AttendancePage() {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendancePercentage, setAttendancePercentage] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mark Modal
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [markForm, setMarkForm] = useState({
    student_id: '',
    date: new Date().toISOString().split('T')[0],
    status: true,
    course: ''
  });

  const loadAttendanceForStudent = async (studentId) => {
    if (!studentId) return;
    setLoading(true);
    setError('');
    try {
      const [recRes, percRes] = await Promise.allSettled([
        api.getStudentAttendance(studentId),
        api.getAttendancePercentage(studentId)
      ]);

      if (recRes.status === 'fulfilled' && recRes.value?.attendance) {
        setAttendanceRecords(recRes.value.attendance);
      } else {
        setAttendanceRecords([]);
      }

      if (percRes.status === 'fulfilled' && percRes.value?.attendance_percentage !== undefined) {
        setAttendancePercentage(percRes.value.attendance_percentage);
      } else {
        setAttendancePercentage(null);
      }
    } catch (err) {
      setError(err.message || 'Error fetching attendance records.');
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
            await loadAttendanceForStudent(prof.student.id);
          }
        } else if (role === 'admin' || role === 'faculty') {
          const stuList = await api.getAllStudents().catch(() => []);
          const list = Array.isArray(stuList) ? stuList : [];
          setStudents(list);
          if (list.length > 0) {
            setSelectedStudentId(list[0].id);
            await loadAttendanceForStudent(list[0].id);
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to initialize attendance module.');
        setLoading(false);
      }
    }

    init();
  }, [user]);

  const handleStudentChange = (e) => {
    const sId = parseInt(e.target.value);
    setSelectedStudentId(sId);
    loadAttendanceForStudent(sId);
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.markAttendance({
        student_id: parseInt(markForm.student_id),
        date: markForm.date,
        status: markForm.status === true || markForm.status === 'true',
        course: markForm.course || null
      });
      setSuccess('Attendance record successfully submitted!');
      setIsMarkModalOpen(false);
      if (selectedStudentId === parseInt(markForm.student_id)) {
        loadAttendanceForStudent(selectedStudentId);
      }
    } catch (err) {
      setError(err.message || 'Failed to record attendance.');
    }
  };

  const isFacultyOrAdmin = user?.role === 'faculty' || user?.role === 'admin';
  const totalClasses = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((r) => r.status).length;
  const absentCount = totalClasses - presentCount;

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

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap">
            <CalendarCheck size={20} />
          </div>
          <div className="kpi-info">
            <div className="kpi-label">Total Sessions</div>
            <div className="kpi-value">{totalClasses}</div>
            <div className="kpi-subtext">Class lectures recorded</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap success">
            <Check size={20} />
          </div>
          <div className="kpi-info">
            <div className="kpi-label">Present</div>
            <div className="kpi-value" style={{ color: 'var(--status-success-text)' }}>{presentCount}</div>
            <div className="kpi-subtext">Attended sessions</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap danger">
            <X size={20} />
          </div>
          <div className="kpi-info">
            <div className="kpi-label">Absent</div>
            <div className="kpi-value" style={{ color: 'var(--status-danger-text)' }}>{absentCount}</div>
            <div className="kpi-subtext">Missed sessions</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap warning">
            <Clock size={20} />
          </div>
          <div className="kpi-info">
            <div className="kpi-label">Attendance Score</div>
            <div className="kpi-value">
              {attendancePercentage !== null ? `${attendancePercentage}%` : totalClasses > 0 ? `${Math.round((presentCount / totalClasses) * 100)}%` : 'N/A'}
            </div>
            <div className="kpi-subtext">Required threshold: 75%</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h2 className="card-title">
              <CalendarCheck size={18} />
              Attendance Record Sheet
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

          {user?.role === 'faculty' && (
            <button className="btn btn-primary btn-sm" onClick={() => {
              setMarkForm({ ...markForm, student_id: selectedStudentId || '' });
              setIsMarkModalOpen(true);
            }}>
              <Plus size={14} />
              Mark Attendance
            </button>
          )}
        </div>

        <div className="card-body">
          {loading ? (
            <LoadingSpinner message="Calculating attendance metrics..." />
          ) : attendanceRecords.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No attendance records"
              description="No attendance entries have been recorded for this student yet."
            />
          ) : (
            <div className="table-container">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Record ID</th>
                    <th>Date</th>
                    <th>Course Code / Subject</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((rec) => (
                    <tr key={rec.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{rec.id}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={13} color="var(--text-muted)" />
                          {rec.date}
                        </span>
                      </td>
                      <td>{rec.course || 'Core Subject'}</td>
                      <td>
                        <StatusBadge
                          status={rec.status ? 'Present' : 'Absent'}
                          type={rec.status ? 'success' : 'danger'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Mark Attendance Modal */}
      <Modal
        isOpen={isMarkModalOpen}
        onClose={() => setIsMarkModalOpen(false)}
        title="Record Student Attendance"
        maxWidth="480px"
      >
        <form onSubmit={handleMarkAttendance}>
          <div className="form-group">
            <label className="form-label">Student <span className="required">*</span></label>
            <select
              className="form-control"
              value={markForm.student_id}
              onChange={(e) => setMarkForm({ ...markForm, student_id: e.target.value })}
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
            <label className="form-label">Date <span className="required">*</span></label>
            <input
              type="date"
              className="form-control"
              value={markForm.date}
              onChange={(e) => setMarkForm({ ...markForm, date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Course / Subject</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. CS101 or Algorithms"
              value={markForm.course}
              onChange={(e) => setMarkForm({ ...markForm, course: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Status <span className="required">*</span></label>
            <select
              className="form-control"
              value={markForm.status}
              onChange={(e) => setMarkForm({ ...markForm, status: e.target.value === 'true' })}
            >
              <option value="true">Present</option>
              <option value="false">Absent</option>
            </select>
          </div>

          <div className="modal-footer" style={{ margin: '1rem -1.25rem -1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsMarkModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Attendance
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
