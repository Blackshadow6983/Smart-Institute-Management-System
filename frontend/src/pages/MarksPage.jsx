import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { Award, Plus, CheckCircle2, AlertCircle, BookOpen, Percent, TrendingUp } from 'lucide-react';

export function MarksPage() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [resultSummary, setResultSummary] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Assessment Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    subject: '',
    marks: '',
    total_marks: '100',
    exam_type: 'Midterm Exam'
  });

  const loadAssessments = async (studentId) => {
    if (!studentId) return;
    setLoading(true);
    setError('');
    try {
      const [listRes, resSummary] = await Promise.allSettled([
        api.getStudentAssessments(studentId),
        api.getStudentResult(studentId)
      ]);

      if (listRes.status === 'fulfilled') {
        const list = Array.isArray(listRes.value) ? listRes.value : listRes.value?.assessments || [];
        setAssessments(list);
      } else {
        setAssessments([]);
      }

      if (resSummary.status === 'fulfilled') {
        setResultSummary(resSummary.value);
      } else {
        setResultSummary(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch assessment scorecard.');
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
            await loadAssessments(prof.student.id);
          }
        } else if (role === 'admin' || role === 'faculty') {
          const stuList = await api.getAllStudents().catch(() => []);
          const list = Array.isArray(stuList) ? stuList : [];
          setStudents(list);
          if (list.length > 0) {
            setSelectedStudentId(list[0].id);
            await loadAssessments(list[0].id);
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to initialize marks module.');
        setLoading(false);
      }
    }

    init();
  }, [user]);

  const handleStudentChange = (e) => {
    const sId = parseInt(e.target.value);
    setSelectedStudentId(sId);
    loadAssessments(sId);
  };

  const handleAddAssessment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.createAssessment({
        student_id: parseInt(formData.student_id),
        subject: formData.subject,
        marks: parseFloat(formData.marks),
        total_marks: parseFloat(formData.total_marks || '100'),
        exam_type: formData.exam_type
      });
      setSuccess(`Assessment marks for ${formData.subject} saved successfully!`);
      setIsAddModalOpen(false);
      setFormData({
        student_id: selectedStudentId || '',
        subject: '',
        marks: '',
        total_marks: '100',
        exam_type: 'Midterm Exam'
      });
      if (selectedStudentId === parseInt(formData.student_id)) {
        loadAssessments(selectedStudentId);
      }
    } catch (err) {
      setError(err.message || 'Failed to save assessment marks.');
    }
  };

  const isFaculty = user?.role === 'faculty' || user?.role === 'admin';
  const percentage = resultSummary?.percentage !== undefined ? resultSummary.percentage : null;
  const grade = resultSummary?.grade || (percentage ? (percentage >= 85 ? 'A+' : percentage >= 70 ? 'A' : percentage >= 55 ? 'B' : percentage >= 40 ? 'C' : 'F') : 'N/A');

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

      {/* KPI Scorecards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap">
            <BookOpen size={20} />
          </div>
          <div className="kpi-info">
            <div className="kpi-label">Exams / Assessments</div>
            <div className="kpi-value">{assessments.length}</div>
            <div className="kpi-subtext">Completed evaluations</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap success">
            <Percent size={20} />
          </div>
          <div className="kpi-info">
            <div className="kpi-label">Cumulative Score</div>
            <div className="kpi-value" style={{ color: 'var(--status-success-text)' }}>
              {percentage !== null ? `${percentage}%` : 'N/A'}
            </div>
            <div className="kpi-subtext">Aggregated academic result</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap warning">
            <Award size={20} />
          </div>
          <div className="kpi-info">
            <div className="kpi-label">Academic Grade</div>
            <div className="kpi-value" style={{ color: 'var(--primary-navy)' }}>
              {grade}
            </div>
            <div className="kpi-subtext">
              <StatusBadge status={percentage >= 40 ? 'Passed' : 'Pending Review'} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h2 className="card-title">
              <Award size={18} />
              Evaluated Assessments & Scorecard
            </h2>
            {(user?.role === 'admin' || user?.role === 'faculty') && students.length > 0 && (
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
              setFormData({ ...formData, student_id: selectedStudentId || '' });
              setIsAddModalOpen(true);
            }}>
              <Plus size={14} />
              Enter Marks
            </button>
          )}
        </div>

        <div className="card-body">
          {loading ? (
            <LoadingSpinner message="Calculating academic scorecards..." />
          ) : assessments.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No assessment scores recorded"
              description="No exam marks or assessment results have been published for this student record yet."
            />
          ) : (
            <div className="table-container">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Subject / Module</th>
                    <th>Exam Type</th>
                    <th>Marks Scored</th>
                    <th>Maximum Marks</th>
                    <th>Percentage</th>
                    <th>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((a, idx) => {
                    const score = parseFloat(a.marks);
                    const total = parseFloat(a.total_marks || 100);
                    const pct = Math.round((score / total) * 100);
                    return (
                      <tr key={a.id || idx}>
                        <td style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{a.subject}</td>
                        <td>{a.exam_type || 'Exam'}</td>
                        <td style={{ fontWeight: 700 }}>{score}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{total}</td>
                        <td style={{ fontWeight: 600 }}>{pct}%</td>
                        <td>
                          <StatusBadge
                            status={pct >= 75 ? 'Distinction' : pct >= 40 ? 'Pass' : 'Fail'}
                            type={pct >= 75 ? 'success' : pct >= 40 ? 'info' : 'danger'}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Assessment Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Enter Student Assessment Marks"
        maxWidth="480px"
      >
        <form onSubmit={handleAddAssessment}>
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
            <label className="form-label">Subject / Course Module <span className="required">*</span></label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Data Structures or CS101"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Marks Scored <span className="required">*</span></label>
              <input
                type="number"
                step="0.1"
                className="form-control"
                placeholder="e.g. 88"
                value={formData.marks}
                onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Max Marks</label>
              <input
                type="number"
                step="0.1"
                className="form-control"
                placeholder="100"
                value={formData.total_marks}
                onChange={(e) => setFormData({ ...formData, total_marks: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Assessment Type</label>
            <select
              className="form-control"
              value={formData.exam_type}
              onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
            >
              <option value="Midterm Exam">Midterm Exam</option>
              <option value="Final Semester Exam">Final Semester Exam</option>
              <option value="Practical Lab Assessment">Practical Lab Assessment</option>
              <option value="Assignment / Project">Assignment / Project</option>
              <option value="Quiz / Class Test">Quiz / Class Test</option>
            </select>
          </div>

          <div className="modal-footer" style={{ margin: '1rem -1.25rem -1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Score
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
