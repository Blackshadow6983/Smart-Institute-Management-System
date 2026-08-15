import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';
import {
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  CalendarCheck,
  CreditCard,
  Award,
  Bell,
  ArrowRight,
  TrendingUp,
  UserPlus,
  Send,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [instituteData, setInstituteData] = useState(null);
  const [studentData, setStudentData] = useState({
    profile: null,
    attendanceRate: null,
    feeSummary: null,
    notifications: []
  });

  // Modal for quick fee reminder
  const [selectedStudentForFee, setSelectedStudentForFee] = useState(null);
  const [feeCustomNote, setFeeCustomNote] = useState('');
  const [feeActionLoading, setFeeActionLoading] = useState(false);
  const [feeActionMessage, setFeeActionMessage] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const role = (user?.role || '').toLowerCase();

      if (role === 'admin' || role === 'institute' || role === 'institute_admin') {
        const data = await api.getInstituteDashboardStats();
        setInstituteData(data);
      } else if (role === 'student') {
        const username = user?.username;
        const [profileRes, notifs] = await Promise.allSettled([
          api.getStudent(username),
          api.getNotifications()
        ]);

        const profile = profileRes.status === 'fulfilled' ? profileRes.value.student : null;
        let feeSum = null;
        let attRate = null;

        if (profile?.id) {
          try {
            feeSum = await api.getFeeSummary(profile.id);
            const att = await api.getAttendancePercentage(profile.id);
            attRate = att?.attendance_percentage;
          } catch (e) {
            // Summary fallback
          }
        }

        setStudentData({
          profile,
          attendanceRate: attRate,
          feeSummary: feeSum,
          notifications: notifs.status === 'fulfilled' && Array.isArray(notifs.value) ? notifs.value : []
        });
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const handleSendQuickFeeNotice = async (e) => {
    e.preventDefault();
    if (!selectedStudentForFee) return;

    setFeeActionLoading(true);
    setFeeActionMessage('');
    try {
      const res = await api.sendFeeNotification({
        student_id: selectedStudentForFee.id,
        custom_note: feeCustomNote.trim() || undefined
      });
      setFeeActionMessage(res.message || 'Fee notice dispatched to student & parent Gmail.');
      setTimeout(() => {
        setSelectedStudentForFee(null);
        setFeeCustomNote('');
        setFeeActionMessage('');
        loadDashboard();
      }, 2000);
    } catch (err) {
      setFeeActionMessage(`Error: ${err.message}`);
    } finally {
      setFeeActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Connecting to institutional environment..." />;
  }

  const role = (user?.role || 'student').toLowerCase();
  const isAdmin = role === 'admin' || role === 'institute' || role === 'institute_admin';

  return (
    <div>
      {/* ========================================================================= */}
      {/* INSTITUTE ADMIN DASHBOARD */}
      {/* ========================================================================= */}
      {isAdmin ? (
        <>
          {/* Institute Admin Banner */}
          <div className="card" style={{ marginBottom: '1.25rem', background: 'linear-gradient(to right, #ffffff, #f8fafc)', borderLeft: '4px solid var(--primary-blue, #2563eb)' }}>
            <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--primary-navy, #0f172a), var(--primary-blue, #2563eb))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
                }}>
                  <Building2 size={26} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-navy, #0f172a)', margin: 0 }}>
                      {instituteData?.institute?.name || user?.institute_name || 'Institute Management'}
                    </h1>
                    <span style={{
                      background: 'var(--primary-navy, #0f172a)',
                      color: '#ffffff',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 700,
                      letterSpacing: '0.5px'
                    }}>
                      {instituteData?.institute?.institute_code || user?.institute_code || 'ITE-001'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Multi-Tenant Administration • {instituteData?.institute?.email || 'admin@institute.edu'} • {instituteData?.institute?.contact_number || 'Official Contact Active'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <Link to="/students" className="btn btn-primary btn-sm">
                  <UserPlus size={15} />
                  <span>Register Student</span>
                </Link>
                <Link to="/courses" className="btn btn-secondary btn-sm">
                  <BookOpen size={15} />
                  <span>Add Course</span>
                </Link>
                <Link to="/fees" className="btn btn-secondary btn-sm">
                  <CreditCard size={15} />
                  <span>Fee Ledger</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Institute KPIs */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', marginBottom: '1.25rem' }}>
            <div className="kpi-card">
              <div className="kpi-icon-wrap">
                <Users size={20} />
              </div>
              <div className="kpi-info">
                <div className="kpi-label">Registered Students</div>
                <div className="kpi-value">{instituteData?.stats?.total_students || 0}</div>
                <div className="kpi-subtext">Under {instituteData?.institute?.institute_code || 'Institute'}</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap">
                <BookOpen size={20} />
              </div>
              <div className="kpi-info">
                <div className="kpi-label">Active Courses</div>
                <div className="kpi-value">{instituteData?.stats?.total_courses || 0}</div>
                <div className="kpi-subtext">Curriculum & durations</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap success">
                <CreditCard size={20} />
              </div>
              <div className="kpi-info">
                <div className="kpi-label">Fees Collected</div>
                <div className="kpi-value">₹{(instituteData?.stats?.total_fees_collected || 0).toLocaleString()}</div>
                <div className="kpi-subtext">Received into accounts</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap warning">
                <Clock size={20} />
              </div>
              <div className="kpi-info">
                <div className="kpi-label">Pending Student Fees</div>
                <div className="kpi-value" style={{ color: '#dc2626' }}>₹{(instituteData?.stats?.pending_fees || 0).toLocaleString()}</div>
                <div className="kpi-subtext">Pending fee balance</div>
              </div>
            </div>
          </div>

          {/* Recent Student Roster & Notification Activity */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
            
            {/* Institute Students Roster */}
            <div className="card" style={{ margin: 0 }}>
              <div className="card-header">
                <h2 className="card-title">
                  <Users size={16} />
                  Enrolled Students ({instituteData?.institute?.institute_code})
                </h2>
                <Link to="/students" className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: '11.5px' }}>
                  All Students <ArrowRight size={12} />
                </Link>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {(!instituteData?.recent_students || instituteData.recent_students.length === 0) ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No students registered under this institute yet. Click 'Register Student' to enroll.
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="table-custom">
                      <thead>
                        <tr>
                          <th>Enrollment ID</th>
                          <th>Student Details</th>
                          <th>Course & Duration</th>
                          <th>Fees</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {instituteData.recent_students.map((s) => (
                          <tr key={s.id}>
                            <td style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>
                              {s.registration_id}
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{s.name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.email}</div>
                            </td>
                            <td>
                              <div>{s.course || 'Unassigned'}</div>
                              <div style={{ fontSize: '11px', color: 'var(--primary-blue)', fontWeight: 600 }}>
                                {s.course_duration || '1 Year'}
                              </div>
                            </td>
                            <td>
                              <span style={{ fontWeight: 600 }}>₹{(s.course_fee || 0).toLocaleString()}</span>
                            </td>
                            <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '3px 8px', fontSize: '11px', color: 'var(--primary-blue)' }}
                                onClick={() => setSelectedStudentForFee(s)}
                                title="Send Fee Notification / Reminder to Student & Parent Gmail"
                              >
                                <Mail size={12} />
                                <span>Fee Notice</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Email & Notification Activity Feed */}
            <div className="card" style={{ margin: 0 }}>
              <div className="card-header">
                <h2 className="card-title">
                  <Mail size={16} />
                  Gmail & Notification Dispatch Log
                </h2>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {(!instituteData?.recent_notifications || instituteData.recent_notifications.length === 0) ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No emails dispatched yet. Notifications will appear when students are registered or fee notices are sent.
                  </div>
                ) : (
                  <div>
                    {instituteData.recent_notifications.map((n) => (
                      <div key={n.id} style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: n.notification_type === 'welcome_credentials' ? 'rgba(37,99,235,0.1)' : 'rgba(234,179,8,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: n.notification_type === 'welcome_credentials' ? 'var(--primary-blue)' : '#ca8a04',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}>
                          {n.notification_type === 'welcome_credentials' ? <GraduationCap size={15} /> : <CreditCard size={15} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--primary-navy)' }}>{n.subject}</span>
                            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                              {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                            </span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Sent to <strong>{n.recipient_email}</strong> ({n.recipient_type}) • <span style={{ color: '#10b981', fontWeight: 600 }}>{n.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </>
      ) : (
        /* ========================================================================= */
        /* STUDENT PORTAL DASHBOARD */
        /* ========================================================================= */
        <>
          {/* Student Welcome Banner */}
          <div className="card" style={{ marginBottom: '1.25rem', background: 'linear-gradient(to right, #ffffff, #f8fafc)', borderLeft: '4px solid var(--primary-blue, #2563eb)' }}>
            <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    background: 'var(--primary-navy, #0f172a)',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.4px'
                  }}>
                    {studentData.profile?.institute_code || user?.institute_code || 'INSTITUTE'}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {studentData.profile?.institute_name || user?.institute_name || 'AI Smart Institute'}
                  </span>
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-navy)', margin: '0 0 4px' }}>
                  Welcome, {studentData.profile?.name || user?.username}
                </h2>
                <div style={{ display: 'flex', gap: '1.25rem', fontSize: '12.5px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  <div><strong>Enrollment ID:</strong> {studentData.profile?.registration_id}</div>
                  <div><strong>Course:</strong> {studentData.profile?.course || 'General Program'}</div>
                  <div><strong>Duration:</strong> {studentData.profile?.course_duration || '1 Year'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link to="/profile" className="btn btn-secondary btn-sm">
                  My Profile
                </Link>
                <Link to="/fees" className="btn btn-primary btn-sm">
                  View Fees
                </Link>
              </div>
            </div>
          </div>

          {/* Student KPIs */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon-wrap">
                <BookOpen size={20} />
              </div>
              <div className="kpi-info">
                <div className="kpi-label">Enrolled Program</div>
                <div className="kpi-value" style={{ fontSize: '16px' }}>{studentData.profile?.course || 'Enrolled'}</div>
                <div className="kpi-subtext">Duration: {studentData.profile?.course_duration || 'Standard'}</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap success">
                <CalendarCheck size={20} />
              </div>
              <div className="kpi-info">
                <div className="kpi-label">Attendance Score</div>
                <div className="kpi-value">
                  {studentData.attendanceRate !== null ? `${studentData.attendanceRate}%` : 'N/A'}
                </div>
                <div className="kpi-subtext">Verified attendance</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap warning">
                <CreditCard size={20} />
              </div>
              <div className="kpi-info">
                <div className="kpi-label">Balance Pending Fees</div>
                <div className="kpi-value" style={{ color: (studentData.feeSummary?.pending_fee || 0) > 0 ? '#dc2626' : '#10b981' }}>
                  ₹{(studentData.feeSummary?.pending_fee || 0).toLocaleString()}
                </div>
                <div className="kpi-subtext">
                  Paid: ₹{(studentData.feeSummary?.total_paid || 0).toLocaleString()} / Total: ₹{(studentData.feeSummary?.course_fee || studentData.profile?.course_fee || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap info">
                <Bell size={20} />
              </div>
              <div className="kpi-info">
                <div className="kpi-label">Institute Notices</div>
                <div className="kpi-value">{studentData.notifications.length}</div>
                <div className="kpi-subtext">Official updates</div>
              </div>
            </div>
          </div>

          {/* Quick Academic Navigation */}
          <div className="card" style={{ marginTop: '1.25rem' }}>
            <div className="card-header">
              <h2 className="card-title">
                <TrendingUp size={16} />
                Student Academic Quick Links
              </h2>
            </div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <Link to="/attendance" className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '0.75rem' }}>
                <CalendarCheck size={16} color="var(--primary-blue)" />
                <span>Attendance</span>
              </Link>
              <Link to="/fees" className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '0.75rem' }}>
                <CreditCard size={16} color="var(--primary-blue)" />
                <span>Fee Statements</span>
              </Link>
              <Link to="/marks" className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '0.75rem' }}>
                <Award size={16} color="var(--primary-blue)" />
                <span>Exam Results</span>
              </Link>
              <Link to="/certificates" className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '0.75rem' }}>
                <ShieldCheck size={16} color="var(--primary-blue)" />
                <span>Certificates</span>
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Fee Notification Modal */}
      <Modal
        isOpen={!!selectedStudentForFee}
        onClose={() => { setSelectedStudentForFee(null); setFeeActionMessage(''); }}
        title={`Send Fee Notification: ${selectedStudentForFee?.name} (${selectedStudentForFee?.registration_id})`}
        maxWidth="520px"
      >
        {selectedStudentForFee && (
          <form onSubmit={handleSendQuickFeeNotice}>
            {feeActionMessage && (
              <div className={`alert ${feeActionMessage.startsWith('Error') ? 'alert-danger' : 'alert-success'}`} style={{ marginBottom: '1rem' }}>
                {feeActionMessage.startsWith('Error') ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                <div>{feeActionMessage}</div>
              </div>
            )}

            <div style={{
              background: 'var(--bg-subtle, #f8fafc)',
              padding: '0.85rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              fontSize: '12.5px',
              display: 'grid',
              gap: '6px'
            }}>
              <div><strong>Student Email (Gmail):</strong> {selectedStudentForFee.email}</div>
              {selectedStudentForFee.parent_email && (
                <div><strong>Parent Email:</strong> {selectedStudentForFee.parent_email} ({selectedStudentForFee.parent_name || 'Parent'})</div>
              )}
              <div><strong>Enrolled Course:</strong> {selectedStudentForFee.course || 'None'} ({selectedStudentForFee.course_duration || '1 Year'})</div>
              <div><strong>Total Course Fee:</strong> ₹{(selectedStudentForFee.course_fee || 0).toLocaleString()}</div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="customNote">
                Custom Message / Due Date Note <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(Optional)</span>
              </label>
              <textarea
                id="customNote"
                className="form-control"
                rows={3}
                placeholder="e.g. Please clear the pending installment by 25th of this month to avoid exam hold."
                value={feeCustomNote}
                onChange={(e) => setFeeCustomNote(e.target.value)}
              />
            </div>

            <div className="modal-footer" style={{ margin: '1.25rem -1.25rem -1.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setSelectedStudentForFee(null); setFeeActionMessage(''); }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={feeActionLoading}
              >
                {feeActionLoading ? (
                  <span>Dispatching Email...</span>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Send Email Notification</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
