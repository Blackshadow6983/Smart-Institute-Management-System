import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  CalendarCheck,
  CreditCard,
  Award,
  ArrowLeft,
  Download,
  AlertCircle,
  ShieldCheck,
  Layers,
  Clock,
  Sparkles
} from 'lucide-react';

export function StudentCourseDetailsPage() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('modules');
  const [togglingModule, setTogglingModule] = useState(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await api.getEnrollmentDetails(appId);
      setDetails(res);
    } catch (err) {
      setError(err.message || 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [appId]);

  const handleToggleModule = async (moduleId) => {
    try {
      setTogglingModule(moduleId);
      setActionMsg('');
      const res = await api.toggleModuleCompletion(appId, moduleId);
      setActionMsg(res.message);
      await fetchDetails();
    } catch (err) {
      alert(err.message || 'Failed to update module progress');
    } finally {
      setTogglingModule(null);
    }
  };

  const handleClaimCertificate = async () => {
    try {
      setClaimLoading(true);
      const res = await api.claimCertificate(appId);
      setActionMsg(res.message);
      await fetchDetails();
    } catch (err) {
      alert(err.message || 'Failed to claim certificate');
    } finally {
      setClaimLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card-container" style={{ padding: '3rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading course progress & syllabus...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="card-container" style={{ padding: '2rem' }}>
        <div className="alert-badge error" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={18} />
          <span>{error || 'Course record not found.'}</span>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>
    );
  }

  const { enrollment, course, student, modules, attendance_stats, attendance_logs, certificate } = details;
  const progressPct = enrollment.completion_status || 0;
  const isCompleted = progressPct >= 100;

  return (
    <div className="course-details-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Header Card */}
      <div className="card-container" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <button 
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#93c5fd',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge" style={{ background: 'rgba(37,99,235,0.3)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)' }}>
                {course.course_code}
              </span>
              <span className="badge" style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>
                {enrollment.learning_mode} Mode
              </span>
              {isCompleted ? (
                <span className="badge" style={{ background: 'rgba(52,211,153,0.25)', color: '#6ee7b7' }}>
                  <CheckCircle2 size={12} style={{ marginRight: 4 }} /> Completed
                </span>
              ) : (
                <span className="badge" style={{ background: 'rgba(245,158,11,0.25)', color: '#fcd34d' }}>
                  <Clock size={12} style={{ marginRight: 4 }} /> In Progress
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.75rem 0 0.5rem', color: '#ffffff' }}>
              {course.name}
            </h1>
            <p style={{ color: '#94a3b8', maxWidth: '650px', fontSize: '0.95rem' }}>
              {course.description || 'Complete training program with modules, hands-on practice, and official certification.'}
            </p>
          </div>

          <div style={{ textAlign: 'right', minWidth: '220px' }}>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Course Fee</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>
              ₹{course.fees?.toLocaleString() || 0}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.2)', color: '#34d399', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', marginTop: '6px' }}>
              <ShieldCheck size={14} /> Fee Status: {enrollment.payment_status}
            </div>
          </div>
        </div>

        {/* Progress Bar Header */}
        <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
            <span style={{ fontWeight: 600, color: '#e2e8f0' }}>Overall Course Completion</span>
            <span style={{ fontWeight: 700, color: isCompleted ? '#34d399' : '#60a5fa' }}>{progressPct}%</span>
          </div>
          <div className="progress-bar-container" style={{ height: '10px', background: 'rgba(255,255,255,0.1)' }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${progressPct}%`,
                background: isCompleted
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : 'linear-gradient(90deg, #2563eb, #38bdf8)'
              }}
            ></div>
          </div>
        </div>
      </div>

      {actionMsg && (
        <div className="alert-badge success" style={{ padding: '0.75rem 1rem' }}>
          <Sparkles size={18} />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="tab-container" style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          className={`btn-tab ${activeTab === 'modules' ? 'active' : ''}`}
          onClick={() => setActiveTab('modules')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 600 }}
        >
          <Layers size={18} /> Modules & Progress
        </button>
        <button
          className={`btn-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 600 }}
        >
          <BookOpen size={18} /> Overview
        </button>
        <button
          className={`btn-tab ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 600 }}
        >
          <CalendarCheck size={18} /> Attendance ({attendance_stats.percentage}%)
        </button>
        <button
          className={`btn-tab ${activeTab === 'payment' ? 'active' : ''}`}
          onClick={() => setActiveTab('payment')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 600 }}
        >
          <CreditCard size={18} /> Payment & Receipt
        </button>
        <button
          className={`btn-tab ${activeTab === 'certificate' ? 'active' : ''}`}
          onClick={() => setActiveTab('certificate')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 600 }}
        >
          <Award size={18} /> Certificate {isCompleted && '✓'}
        </button>
      </div>

      {/* TAB 1: MODULES & PROGRESS CHECKLIST */}
      {activeTab === 'modules' && (
        <div className="card-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Course Syllabus Modules</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0' }}>
                Check off modules as you complete learning topics to update your course progress.
              </p>
            </div>
            <div className="stat-badge" style={{ background: 'var(--bg-subtle)', padding: '6px 14px', borderRadius: '8px', fontWeight: 700 }}>
              {modules.filter(m => m.completed).length} / {modules.length} Modules Completed
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {modules.map((mod, idx) => (
              <div
                key={mod.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1.2rem',
                  borderRadius: '10px',
                  border: mod.completed ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border-color)',
                  background: mod.completed ? 'rgba(16,185,129,0.03)' : 'var(--card-bg)',
                  transition: 'all 0.2s ease'
                }}
              >
                <button
                  onClick={() => handleToggleModule(mod.id)}
                  disabled={togglingModule === mod.id}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: mod.completed ? '#10b981' : 'var(--text-muted)',
                    padding: 0,
                    marginTop: '2px'
                  }}
                  title={mod.completed ? 'Unmark Module' : 'Mark Module as Completed'}
                >
                  {mod.completed ? (
                    <CheckCircle2 size={24} style={{ fill: 'rgba(16,185,129,0.1)' }} />
                  ) : (
                    <Circle size={24} />
                  )}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: mod.completed ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {mod.title}
                    </span>
                    {mod.completed && (
                      <span className="badge success" style={{ fontSize: '11px' }}>Completed</span>
                    )}
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0' }}>
                    {mod.description || 'Module topics and practical lab exercises.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="card-container">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Course Overview & Specifications</h3>
          <div className="grid-2-col" style={{ gap: '1.5rem' }}>
            <div>
              <label style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>COURSE NAME</label>
              <p style={{ fontSize: '1.05rem', fontWeight: 600, margin: '2px 0 1rem' }}>{course.name}</p>

              <label style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>COURSE CODE</label>
              <p style={{ fontSize: '1.05rem', fontWeight: 600, margin: '2px 0 1rem' }}>{course.course_code}</p>

              <label style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>DESCRIPTION</label>
              <p style={{ color: 'var(--text-secondary)', margin: '2px 0 1rem', lineHeight: 1.5 }}>
                {course.description || 'Comprehensive curriculum with practical labs, assessments, and continuous evaluation.'}
              </p>
            </div>

            <div>
              <label style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>DURATION</label>
              <p style={{ fontSize: '1.05rem', fontWeight: 600, margin: '2px 0 1rem' }}>{course.duration || '6 Months'}</p>

              <label style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>LEARNING MODE</label>
              <p style={{ fontSize: '1.05rem', fontWeight: 600, margin: '2px 0 1rem' }}>{enrollment.learning_mode}</p>

              <label style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>TOTAL SCHEDULED CLASSES</label>
              <p style={{ fontSize: '1.05rem', fontWeight: 600, margin: '2px 0 1rem' }}>{course.total_classes || 20} Sessions</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="card-container">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Course-Specific Attendance</h3>
          
          <div className="grid-3-col" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="stat-card">
              <div className="stat-label">Total Classes Conducted</div>
              <div className="stat-value">{attendance_stats.total}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Classes Attended (Present)</div>
              <div className="stat-value" style={{ color: '#10b981' }}>{attendance_stats.present}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Attendance Percentage</div>
              <div className="stat-value" style={{ color: attendance_stats.percentage >= 75 ? '#10b981' : '#ef4444' }}>
                {attendance_stats.percentage}%
              </div>
            </div>
          </div>

          <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Class Attendance History</h4>
          {attendance_logs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No attendance sessions recorded yet for this course.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Session Date</th>
                  <th>Course</th>
                  <th>Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance_logs.map(log => (
                  <tr key={log.id}>
                    <td>{log.date}</td>
                    <td>{course.name}</td>
                    <td>
                      {log.status ? (
                        <span className="badge success">Present</span>
                      ) : (
                        <span className="badge danger">Absent</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 4: PAYMENT */}
      {activeTab === 'payment' && (
        <div className="card-container">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Fee Payment & Payment QR / UPI Details</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            
            {/* Payment Summary Box */}
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)' }}>Transaction Overview</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Course Fee</span>
                <span style={{ fontWeight: 700 }}>₹{course.fees?.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Amount</span>
                <span style={{ fontWeight: 700, color: enrollment.payment_status === 'Paid' ? '#10b981' : '#f59e0b' }}>
                  ₹{enrollment.amount_paid?.toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Learning Mode</span>
                <span style={{ fontWeight: 600 }}>{enrollment.learning_mode}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment Approval Status</span>
                <span className={`badge ${enrollment.payment_status === 'Paid' ? 'success' : 'warning'}`} style={{ fontSize: '0.9rem' }}>
                  {enrollment.payment_status || 'Pending'}
                </span>
              </div>
            </div>

            {/* Institute QR & UPI Instructions Box */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={18} color="#2563eb" />
                Institute Payment Details
              </h4>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '1rem' }}>
                Scan QR or use UPI ID below to pay course fees. Admin will verify and mark your payment status as Paid.
              </p>

              <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>INSTITUTE UPI ID</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2563eb', marginTop: '2px' }}>
                  {student?.institute_code ? `${student.institute_code.toLowerCase()}@upi` : 'institute@upi'}
                </div>
              </div>

              {enrollment.payment_status !== 'Paid' && (
                <div style={{ padding: '0.75rem', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a', color: '#92400e', fontSize: '12px' }}>
                  <strong>Fee Verification Pending:</strong> Once paid, contact your Institute Admin to approve your fee status.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* TAB 5: CERTIFICATE */}
      {activeTab === 'certificate' && (
        <div className="card-container" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          {enrollment.payment_status !== 'Paid' ? (
            <div>
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <AlertCircle size={38} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>Payment Verification Required</h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: '540px', margin: '0.5rem auto 1.5rem', fontSize: '14px' }}>
                Fee payment is currently <strong>Pending Admin Verification</strong>. The completion certificate is locked until your payment status is marked <strong>Paid</strong> by the Institute Admin.
              </p>
            </div>
          ) : isCompleted ? (
            <div>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'rgba(16,185,129,0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <Award size={44} />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Course Completion Certificate Ready!</h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0.5rem auto 1.5rem' }}>
                Congratulations! You have completed 100% of {course.name}. Your official certificate of completion is available for download.
              </p>

              {certificate?.certificate_number ? (
                <div>
                  <div className="badge" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', fontSize: '1rem', padding: '8px 16px', marginBottom: '1.5rem' }}>
                    Certificate ID: <strong>{certificate.certificate_number}</strong>
                  </div>
                  <br />
                  <a
                    href={api.getCertificateDownloadUrl(certificate.certificate_number)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', textDecoration: 'none' }}
                  >
                    <Download size={18} /> Download Official PDF Certificate
                  </a>
                </div>
              ) : (
                <button
                  className="btn-primary"
                  onClick={handleClaimCertificate}
                  disabled={claimLoading}
                  style={{ padding: '12px 24px' }}
                >
                  {claimLoading ? 'Generating Certificate...' : 'Generate Official Certificate'}
                </button>
              )}
            </div>
          ) : (
            <div>
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: 'rgba(245,158,11,0.15)',
                color: '#f59e0b',
                display: 'flex',

                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <Clock size={36} />
              </div>
              <h3 style={{ fontSize: '1.3rem' }}>Certificate Locked</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '480px', margin: '0.5rem auto 1rem' }}>
                You must complete 100% of the course modules to unlock your completion certificate.
              </p>
              <div style={{ fontWeight: 700, color: 'var(--primary-blue)', fontSize: '1.1rem' }}>
                Current Progress: {progressPct}%
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
export default StudentCourseDetailsPage;
