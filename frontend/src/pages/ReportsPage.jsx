import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { StatusBadge } from '../components/StatusBadge';
import { FileSpreadsheet, Printer, CheckCircle2, AlertCircle, Award, CalendarCheck, CreditCard, User } from 'lucide-react';

export function ReportsPage() {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = async (studentId) => {
    if (!studentId) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.getStudentReport(studentId);
      setReport(data);
    } catch (err) {
      setError(err.message || 'Failed to generate academic report.');
      setReport(null);
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
            await loadReport(prof.student.id);
          }
        } else if (role === 'admin' || role === 'faculty') {
          const stuList = await api.getAllStudents().catch(() => []);
          const list = Array.isArray(stuList) ? stuList : [];
          setStudents(list);
          if (list.length > 0) {
            setSelectedStudentId(list[0].id);
            await loadReport(list[0].id);
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to initialize reports module.');
        setLoading(false);
      }
    }

    init();
  }, [user]);

  const handleStudentChange = (e) => {
    const sId = parseInt(e.target.value);
    setSelectedStudentId(sId);
    loadReport(sId);
  };

  const handlePrint = () => {
    window.print();
  };

  const isFacultyOrAdmin = user?.role === 'faculty' || user?.role === 'admin';

  return (
    <div>
      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={16} />
          <div>{error}</div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h2 className="card-title">
              <FileSpreadsheet size={18} />
              Comprehensive Academic & Progress Report
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

          {report && (
            <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
              <Printer size={14} />
              Print Official Report
            </button>
          )}
        </div>

        <div className="card-body">
          {loading ? (
            <LoadingSpinner message="Synthesizing academic report card..." />
          ) : !report ? (
            <EmptyState
              icon={FileSpreadsheet}
              title="No report data generated"
              description="Could not generate report for the selected student record."
            />
          ) : (
            <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.75rem' }}>
              {/* Institutional Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid var(--primary-navy)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-navy)', letterSpacing: '-0.3px' }}>
                  AI SMART INSTITUTE OF TECHNOLOGY & MANAGEMENT
                </h1>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Official Consolidated Academic Transcript & Institutional Progress Dossier
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Generated on: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              {/* Student Metadata Box */}
              <div style={{ background: 'var(--bg-subtle)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', fontSize: '13px' }}>
                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Student Name</span>
                    <strong>{report.student?.name || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Registration ID</span>
                    <strong>{report.student?.registration_id || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Academic Course</span>
                    <span>{report.student?.course || 'Enrolled Program'}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Assigned Batch</span>
                    <span>{report.student?.batch || 'Active Cohort'}</span>
                  </div>
                </div>
              </div>

              {/* 3 Summary Badges */}
              <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="kpi-card" style={{ background: 'var(--bg-subtle)' }}>
                  <div className="kpi-icon-wrap success">
                    <CalendarCheck size={18} />
                  </div>
                  <div className="kpi-info">
                    <div className="kpi-label">Attendance Score</div>
                    <div className="kpi-value">{report.attendance_percentage !== undefined ? `${report.attendance_percentage}%` : 'N/A'}</div>
                  </div>
                </div>

                <div className="kpi-card" style={{ background: 'var(--bg-subtle)' }}>
                  <div className="kpi-icon-wrap warning">
                    <CreditCard size={18} />
                  </div>
                  <div className="kpi-info">
                    <div className="kpi-label">Fee Clearance</div>
                    <div className="kpi-value" style={{ fontSize: '16px' }}>
                      ₹{report.fee_summary?.total_paid || 0} / ₹{report.fee_summary?.total_fee || 0}
                    </div>
                  </div>
                </div>

                <div className="kpi-card" style={{ background: 'var(--bg-subtle)' }}>
                  <div className="kpi-icon-wrap">
                    <Award size={18} />
                  </div>
                  <div className="kpi-info">
                    <div className="kpi-label">Academic Result</div>
                    <div className="kpi-value" style={{ fontSize: '16px' }}>
                      {report.academic_result?.percentage !== undefined ? `${report.academic_result.percentage}% (${report.academic_result.grade})` : 'Under Evaluation'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Academic Assessments Breakdown */}
              <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--primary-navy)', marginBottom: '0.75rem' }}>
                Evaluated Subject Modules & Examination Marks
              </h3>

              {(!report.assessments || report.assessments.length === 0) ? (
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>No completed evaluations on file.</p>
              ) : (
                <div className="table-container" style={{ marginBottom: '1.5rem' }}>
                  <table className="table-custom">
                    <thead>
                      <tr>
                        <th>Subject / Curriculum Module</th>
                        <th>Exam Classification</th>
                        <th>Marks Awarded</th>
                        <th>Maximum Marks</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.assessments.map((a, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{a.subject}</td>
                          <td>{a.exam_type || 'Exam'}</td>
                          <td style={{ fontWeight: 700 }}>{a.marks}</td>
                          <td>{a.total_marks || 100}</td>
                          <td>{Math.round((parseFloat(a.marks) / parseFloat(a.total_marks || 100)) * 100)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Institutional Sign-off */}
              <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderBottom: '1px solid var(--border-dark)', width: '160px', marginBottom: '4px' }}></div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Controller of Examinations</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderBottom: '1px solid var(--border-dark)', width: '160px', marginBottom: '4px' }}></div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Academic Dean / Registrar</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
