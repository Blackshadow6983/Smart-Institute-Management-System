import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { CalendarCheck, Plus, CheckCircle2, AlertCircle, Clock, Calendar, Check, X, Edit2, Filter } from 'lucide-react';

export function AttendancePage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseName, setSelectedCourseName] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendancePercentage, setAttendancePercentage] = useState(null);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, percentage: 0 });
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecordToEdit, setSelectedRecordToEdit] = useState(null);

  const [markForm, setMarkForm] = useState({
    student_id: '',
    date: new Date().toISOString().split('T')[0],
    status: true,
    course: ''
  });

  const [editForm, setEditForm] = useState({
    status: true,
    course: ''
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const role = (user?.role || '').toLowerCase();
      const courseList = await api.getAllCourses().catch(() => []);
      setCourses(Array.isArray(courseList) ? courseList : []);

      if (role === 'student' && user?.username) {
        const prof = await api.getStudent(user.username);
        if (prof.student?.id) {
          setSelectedStudentId(prof.student.id);
          const attRes = await api.getStudentAttendance(prof.student.id, selectedCourseName || undefined);
          setAttendanceRecords(attRes.attendance || []);
          setStats({
            total: attRes.total_classes || 0,
            present: attRes.present_classes || 0,
            absent: attRes.absent_classes || 0,
            percentage: attRes.attendance_percentage || 0
          });
        }
      } else if (['admin', 'faculty', 'institute', 'institute_admin'].includes(role)) {
        const stuList = await api.getAllStudents().catch(() => []);
        const list = Array.isArray(stuList) ? stuList : [];
        setStudents(list);
        
        if (selectedStudentId || list.length > 0) {
          const sId = selectedStudentId || list[0].id;
          if (!selectedStudentId) setSelectedStudentId(sId);
          const attRes = await api.getStudentAttendance(sId, selectedCourseName || undefined);
          setAttendanceRecords(attRes.attendance || []);
          setStats({
            total: attRes.total_classes || 0,
            present: attRes.present_classes || 0,
            absent: attRes.absent_classes || 0,
            percentage: attRes.attendance_percentage || 0
          });
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load attendance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, selectedStudentId, selectedCourseName]);

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.markAttendance({
        student_id: parseInt(markForm.student_id),
        date: markForm.date,
        status: markForm.status === true || markForm.status === 'true',
        course: markForm.course || selectedCourseName || (courses[0]?.name || 'General Course')
      });
      setSuccess('Attendance marked successfully.');
      setIsMarkModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to record attendance.');
    }
  };

  const handleEditAttendance = async (e) => {
    e.preventDefault();
    if (!selectedRecordToEdit) return;
    setError('');
    setSuccess('');
    try {
      await api.updateAttendance(selectedRecordToEdit.id, {
        status: editForm.status === true || editForm.status === 'true',
        course: editForm.course
      });
      setSuccess('Attendance updated.');
      setIsEditModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to edit attendance record.');
    }
  };

  const openEditModal = (rec) => {
    setSelectedRecordToEdit(rec);
    setEditForm({
      status: rec.status,
      course: rec.course || ''
    });
    setIsEditModalOpen(true);
  };

  const role = (user?.role || 'student').toLowerCase();
  const isAdminOrStaff = ['admin', 'faculty', 'institute', 'institute_admin'].includes(role);

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
              <CalendarCheck size={28} color="#60a5fa" />
              Course-Specific Attendance Management
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '4px 0 0' }}>
              Track student attendance independently for every course, view percentages, and update logs.
            </p>
          </div>

          {isAdminOrStaff && (
            <button
              className="btn-primary"
              onClick={() => {
                setMarkForm({
                  student_id: selectedStudentId || (students[0]?.id || ''),
                  date: new Date().toISOString().split('T')[0],
                  status: true,
                  course: selectedCourseName || (courses[0]?.name || '')
                });
                setIsMarkModalOpen(true);
              }}
              style={{ padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={18} /> Mark Attendance
            </button>
          )}
        </div>
      </div>

      {/* Course Filter Bar */}
      <div className="card-container" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--primary-blue)" />
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Filter by Course:</span>
        </div>
        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '220px' }}
          value={selectedCourseName}
          onChange={(e) => setSelectedCourseName(e.target.value)}
        >
          <option value="">All Enrolled Courses</option>
          {courses.map(c => (
            <option key={c.id} value={c.name}>{c.course_code} - {c.name}</option>
          ))}
        </select>

        {isAdminOrStaff && students.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Select Student:</span>
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '220px' }}
              value={selectedStudentId || ''}
              onChange={(e) => setSelectedStudentId(parseInt(e.target.value))}
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.registration_id} - {s.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid-4-col" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Classes</div>
          <div className="stat-value">{stats.total}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sessions recorded</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Present Classes</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{stats.present}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Attended sessions</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Absent Classes</div>
          <div className="stat-value" style={{ color: '#ef4444' }}>{stats.absent}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Missed sessions</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Attendance Score</div>
          <div className="stat-value" style={{ color: stats.percentage >= 75 ? '#10b981' : '#ef4444' }}>
            {stats.percentage}%
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Threshold: 75%</div>
        </div>
      </div>

      {/* Table */}
      <div className="card-container">
        <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarCheck size={18} color="var(--primary-blue)" /> Course Attendance History Logs
        </h3>

        {loading ? (
          <LoadingSpinner message="Calculating course attendance logs..." />
        ) : attendanceRecords.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No attendance records found"
            description="No attendance entries match the selected course and student."
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Course</th>
                <th>Status</th>
                {isAdminOrStaff && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.map((rec) => (
                <tr key={rec.id}>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <Calendar size={14} color="var(--text-muted)" /> {rec.date}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{rec.course}</td>
                  <td>
                    <StatusBadge
                      status={rec.status ? 'Present' : 'Absent'}
                      type={rec.status ? 'success' : 'danger'}
                    />
                  </td>
                  {isAdminOrStaff && (
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                        onClick={() => openEditModal(rec)}
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MARK ATTENDANCE MODAL */}
      <Modal
        isOpen={isMarkModalOpen}
        onClose={() => setIsMarkModalOpen(false)}
        title="Mark Course Attendance"
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
            <label className="form-label">Course <span className="required">*</span></label>
            <select
              className="form-control"
              value={markForm.course}
              onChange={(e) => setMarkForm({ ...markForm, course: e.target.value })}
              required
            >
              <option value="">Select Course</option>
              {courses.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
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
            <label className="form-label">Attendance Status <span className="required">*</span></label>
            <select
              className="form-control"
              value={markForm.status}
              onChange={(e) => setMarkForm({ ...markForm, status: e.target.value === 'true' })}
            >
              <option value="true">Present</option>
              <option value="false">Absent</option>
            </select>
          </div>

          <div className="modal-footer" style={{ margin: '1.25rem -1.25rem -1.25rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsMarkModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Attendance Record
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT ATTENDANCE MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Attendance Entry"
        maxWidth="480px"
      >
        <form onSubmit={handleEditAttendance}>
          <div className="form-group">
            <label className="form-label">Course</label>
            <input
              type="text"
              className="form-control"
              value={editForm.course}
              onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Attendance Status <span className="required">*</span></label>
            <select
              className="form-control"
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value === 'true' })}
            >
              <option value="true">Present</option>
              <option value="false">Absent</option>
            </select>
          </div>

          <div className="modal-footer" style={{ margin: '1.25rem -1.25rem -1.25rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Update Attendance Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default AttendancePage;
