import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';
import {
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  CreditCard,
  Award,
  Bell,
  ArrowRight,
  UserPlus,
  Send,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Layers,
  Download,
  Sparkles,
  ChevronRight,
  FileText
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Admin Data
  const [adminStats, setAdminStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    activeCourses: 0,
    completedCourses: 0,
    totalRevenue: 0,
    onlineStudents: 0,
    offlineStudents: 0,
    recentApplications: []
  });

  // Student Data
  const [studentData, setStudentData] = useState({
    profile: null,
    enrolledCourses: [],
    paymentHistory: []
  });

  // Staff Data
  const [staffData, setStaffData] = useState({
    profile: null,
    totalStudents: 0,
    totalBatches: 0,
    recentNotices: []
  });

  const [selectedStudentForFee, setSelectedStudentForFee] = useState(null);
  const [feeCustomNote, setFeeCustomNote] = useState('');
  const [feeActionLoading, setFeeActionLoading] = useState(false);
  const [feeActionMessage, setFeeActionMessage] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const role = (user?.role || '').trim().toLowerCase();

      if (['admin', 'institute', 'institute_admin'].includes(role)) {
        // Fetch all data for admin
        const [instStats, allStudents, allCourses, allApps, pendingApps] = await Promise.allSettled([
          api.getInstituteDashboardStats(),
          api.getAllStudents(),
          api.getAllCourses(),
          api.getAllApplications(),
          api.getPendingApprovals()
        ]);

        const students = allStudents.status === 'fulfilled' ? allStudents.value : [];
        const courses = allCourses.status === 'fulfilled' ? allCourses.value : [];
        const apps = allApps.status === 'fulfilled' ? allApps.value : [];
        const pending = pendingApps.status === 'fulfilled' ? pendingApps.value : [];

        const totalStud = students.length;
        const totalCour = courses.length;
        const activeCour = courses.filter(c => c.is_active !== false).length;
        const completedApps = apps.filter(a => (a.completion_status || 0) >= 100).length;
        const totalRev = apps.reduce((sum, a) => sum + (a.amount_paid || 0), 0);
        const onlineCount = apps.filter(a => (a.learning_mode || '').toLowerCase() === 'online').length;
        const offlineCount = apps.filter(a => (a.learning_mode || '').toLowerCase() === 'offline').length;

        setAdminStats({
          totalStudents: totalStud,
          totalCourses: totalCour,
          activeCourses: activeCour,
          completedCourses: completedApps,
          totalRevenue: totalRev,
          onlineStudents: onlineCount,
          offlineStudents: offlineCount,
          pendingApprovalsCount: pending.length,
          recentApplications: apps.slice(0, 8)
        });
      } else if (['faculty', 'staff'].includes(role)) {
        const username = user?.username;
        const [facRes, rosterRes, batchesRes, noticesRes] = await Promise.allSettled([
          api.getFaculty(username),
          api.getAttendanceStudentRoster(),
          api.getAllBatches(),
          api.getNotices()
        ]);

        const profile = facRes.status === 'fulfilled' ? facRes.value.faculty : null;
        const roster = rosterRes.status === 'fulfilled' ? rosterRes.value : [];
        const batches = batchesRes.status === 'fulfilled' ? batchesRes.value : [];
        const notices = noticesRes.status === 'fulfilled' ? noticesRes.value : [];

        setStaffData({
          profile,
          totalStudents: Array.isArray(roster) ? roster.length : 0,
          totalBatches: Array.isArray(batches) ? batches.length : 0,
          recentNotices: Array.isArray(notices) ? notices.slice(0, 5) : []
        });
      } else if (role === 'student') {
        const username = user?.username;
        const [profileRes, myAppsRes] = await Promise.allSettled([
          api.getStudent(username),
          api.getMyApplications()
        ]);

        const profile = profileRes.status === 'fulfilled' ? profileRes.value.student : null;
        const apps = myAppsRes.status === 'fulfilled' ? myAppsRes.value : [];

        setStudentData({
          profile,
          enrolledCourses: apps,
          paymentHistory: apps.map(a => ({
            id: a.id,
            course: a.course,
            amount: a.amount_paid,
            method: a.payment_method,
            status: a.payment_status,
            date: a.application_date
          }))
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
    return <LoadingSpinner message="Connecting to academic management environment..." />;
  }

  const role = (user?.role || 'student').trim().toLowerCase();
  const isAdmin = ['admin', 'institute', 'institute_admin'].includes(role);
  const isStaff = ['faculty', 'staff'].includes(role);

  return (
    <div>
      {/* ========================================================================= */}
      {/* ADMIN DASHBOARD */}
      {/* ========================================================================= */}
      {isAdmin ? (
        <>
          {/* Admin Banner */}

          <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', borderRadius: '16px' }}>
            <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.4)'
                }}>
                  <Building2 size={28} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                      University Control Center
                    </h1>
                    <span style={{
                      background: 'rgba(37,99,235,0.3)',
                      color: '#60a5fa',
                      border: '1px solid rgba(96,165,250,0.3)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.5px'
                    }}>
                      {user?.institute_code || 'DEFAULT'}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                    System Administration • Role-Based Control • Live Enrollment Analytics
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <Link to="/courses" className="btn btn-primary btn-sm" style={{ padding: '8px 14px' }}>
                  <BookOpen size={15} />
                  <span>Manage Courses</span>
                </Link>
                <Link to="/students" className="btn btn-secondary btn-sm" style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.1)', color: '#ffffff', border: 'none' }}>
                  <Users size={15} />
                  <span>Manage Students</span>
                </Link>
                <Link to="/applications" className="btn btn-secondary btn-sm" style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.1)', color: '#ffffff', border: 'none' }}>
                  <FileText size={15} />
                  <span>Enrollments</span>
                </Link>
              </div>
            </div>
          </div>

          {/* REQUIREMENT 2: Admin Dashboard Stats Cards */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '1.5rem', gap: '1rem' }}>
            <div className="kpi-card">
              <div className="kpi-icon-wrap">
                <Users size={22} />
              </div>
              <div className="kpi-info">
                <div className="kpi-label">Total Students</div>
                <div className="kpi-value">{adminStats.totalStudents}</div>
                <div className="kpi-subtext">Registered learners</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap">
                <BookOpen size={22} />
              </div>
              <div className="kpi-info">
                <div className="kpi-label">Total Courses</div>
                <div className="kpi-value">{adminStats.totalCourses}</div>
                <div className="kpi-subtext">{adminStats.activeCourses} Active Courses</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap success">
                <CheckCircle2 size={22} />
              </div>
              <div className="kpi-info">
                <div className="kpi-label">Completed Courses</div>
                <div className="kpi-value" style={{ color: '#10b981' }}>{adminStats.completedCourses}</div>
                <div className="kpi-subtext">100% finished</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap success">
                <CreditCard size={22} />
              </div>
              <div className="kpi-info">
                <div className="kpi-label">Total Revenue</div>
                <div className="kpi-value" style={{ color: '#059669' }}>₹{adminStats.totalRevenue.toLocaleString()}</div>
                <div className="kpi-subtext">Verified fees paid</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap info">
                <Layers size={22} />
              </div>
              <div className="kpi-info">
                <div className="kpi-label">Online Students</div>
                <div className="kpi-value" style={{ color: '#2563eb' }}>{adminStats.onlineStudents}</div>
                <div className="kpi-subtext">Remote learning mode</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap warning">
                <Building2 size={22} />
              </div>
              <div className="kpi-info">
                <div className="kpi-label">Offline Students</div>
                <div className="kpi-value" style={{ color: '#d97706' }}>{adminStats.offlineStudents}</div>
                <div className="kpi-subtext">On-campus learning</div>
              </div>
            </div>
          </div>

          {/* Recent Enrollments Table */}
          <div className="card-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="var(--primary-blue)" /> Recent Course Enrollments
              </h3>
              <Link to="/applications" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Manage All Enrollments <ChevronRight size={14} />
              </Link>
            </div>

            {adminStats.recentApplications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No student course enrollments found yet.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Enrollment ID</th>
                    <th>Course</th>
                    <th>Mode</th>
                    <th>Fee Paid</th>
                    <th>Payment Status</th>
                    <th>Progress</th>
                    <th>Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {adminStats.recentApplications.map(app => (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 700 }}>{app.student_name}</td>
                      <td>
                        <span className="badge" style={{ background: 'var(--bg-subtle)' }}>
                          {app.registration_id}
                        </span>
                      </td>
                      <td>{app.course}</td>
                      <td>
                        <span className={`badge ${app.learning_mode === 'Online' ? 'info' : 'warning'}`}>
                          {app.learning_mode}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: '#10b981' }}>₹{app.amount_paid?.toLocaleString()}</td>
                      <td>
                        <span className="badge success">{app.payment_status}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '110px' }}>
                          <div className="progress-bar-container" style={{ flex: 1, height: '6px' }}>
                            <div className="progress-bar-fill" style={{ width: `${app.completion_status || 0}%` }}></div>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 700 }}>{app.completion_status || 0}%</span>
                        </div>
                      </td>
                      <td>
                        {(app.completion_status || 0) >= 100 ? (
                          <span className="badge success">Completed</span>
                        ) : (
                          <span className="badge warning">In Progress</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : isStaff ? (
        /* ========================================================================= */
        /* STAFF / FACULTY DASHBOARD */
        /* ========================================================================= */
        <>
          {/* Staff Header Banner */}
          <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', borderRadius: '16px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="badge" style={{ background: 'rgba(37,99,235,0.3)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)' }}>
                    STAFF PORTAL
                  </span>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                    {staffData.profile?.employee_id || user?.username}
                  </span>
                </div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Welcome back, {staffData.profile?.name || user?.username}!
                </h1>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '4px 0 0' }}>
                  {staffData.profile?.department || 'Academic Department'} • {staffData.profile?.specialization || 'Faculty Staff'} • {staffData.profile?.email || ''}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <Link to="/attendance" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', padding: '10px 18px' }}>
                  <CalendarCheck size={16} /> Mark & Update Attendance
                </Link>
                <Link to="/batches" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', padding: '10px 18px', background: 'rgba(255,255,255,0.1)', color: '#ffffff', border: 'none' }}>
                  <Layers size={16} /> Batches & Schedule
                </Link>
                <Link to="/notices" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', padding: '10px 18px', background: 'rgba(255,255,255,0.1)', color: '#ffffff', border: 'none' }}>
                  <Bell size={16} /> Notices
                </Link>
              </div>
            </div>
          </div>

          {/* Staff KPI Grid */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '1.5rem', gap: '1rem' }}>
            <div className="kpi-card">
              <div className="kpi-icon-wrap">
                <GraduationCap size={22} />
              </div>
              <div className="kpi-info">
                <div className="kpi-label">Department</div>
                <div className="kpi-value" style={{ fontSize: '1.2rem' }}>{staffData.profile?.department || 'Academic'}</div>
                <div className="kpi-subtext">{staffData.profile?.specialization || 'General Faculty'}</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap info">
                <Users size={22} />
              </div>
              <div className="kpi-info">
                <div className="kpi-label">Roster Students</div>
                <div className="kpi-value" style={{ color: '#2563eb' }}>{staffData.totalStudents}</div>
                <div className="kpi-subtext">Registered learners</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap success">
                <Layers size={22} />
              </div>
              <div className="kpi-info">
                <div className="kpi-label">Batches & Schedule</div>
                <div className="kpi-value" style={{ color: '#10b981' }}>{staffData.totalBatches}</div>
                <div className="kpi-subtext">Active class schedules</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap warning">
                <Bell size={22} />
              </div>
              <div className="kpi-info">
                <div className="kpi-label">Announcements</div>
                <div className="kpi-value" style={{ color: '#d97706' }}>{staffData.recentNotices.length}</div>
                <div className="kpi-subtext">Active notices published</div>
              </div>
            </div>
          </div>

          {/* Quick Staff Actions & Recent Notices */}
          <div className="grid-2-col" style={{ gap: '1.25rem' }}>
            <div className="card-container">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarCheck size={18} color="var(--primary-blue)" /> Quick Attendance & Management
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                As a Faculty/Staff member, you have full authorization to record, update, and manage course attendance logs for all enrolled students.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link to="/attendance" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}>
                  <CalendarCheck size={18} /> Open Attendance Portal
                </Link>
                <Link to="/batches" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}>
                  <Layers size={18} /> View Batches & Class Schedule
                </Link>
                <Link to="/profile" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}>
                  <Users size={18} /> View My Employee Profile
                </Link>
              </div>
            </div>

            <div className="card-container">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={18} color="var(--primary-blue)" /> University Notices & Suggestions
              </h3>
              {staffData.recentNotices.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No active notices found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {staffData.recentNotices.map(notice => (
                    <div key={notice.id} style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: '8px', borderLeft: '3px solid var(--primary-blue)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-navy)' }}>{notice.title}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>{notice.content}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '6px' }}>{notice.created_at ? new Date(notice.created_at).toLocaleDateString() : 'Recent'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* ========================================================================= */
        /* REQUIREMENT 5: STUDENT DASHBOARD */
        /* ========================================================================= */
        <>

          {/* Student Welcome Banner */}
          <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', borderRadius: '16px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="badge" style={{ background: 'rgba(37,99,235,0.3)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)' }}>
                    STUDENT PORTAL
                  </span>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                    {studentData.profile?.registration_id}
                  </span>
                </div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Welcome back, {studentData.profile?.name || user?.username}!
                </h1>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '4px 0 0' }}>
                  {studentData.profile?.email} • {studentData.profile?.mobile}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <Link to="/courses" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', padding: '10px 18px' }}>
                  <BookOpen size={16} /> Browse Available Courses
                </Link>
              </div>
            </div>
          </div>

          {/* Enrolled Courses Section */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.3rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={20} color="var(--primary-blue)" /> My Enrolled Courses
              </h2>
              <span className="stat-badge" style={{ background: 'var(--bg-subtle)', padding: '4px 12px', borderRadius: '6px', fontWeight: 700 }}>
                {studentData.enrolledCourses.length} Enrolled
              </span>
            </div>

            {studentData.enrolledCourses.length === 0 ? (
              <div className="card-container" style={{ padding: '3rem', textAlign: 'center' }}>
                <BookOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                <h3>No Courses Enrolled Yet</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0.5rem auto 1.5rem' }}>
                  Explore our industry-aligned courses, select your preferred mode (Online/Offline), and enroll today.
                </p>
                <Link to="/courses" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', padding: '10px 20px' }}>
                  Browse Available Courses <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="grid-2-col" style={{ gap: '1.25rem' }}>
                {studentData.enrolledCourses.map(app => {
                  const isComp = (app.completion_status || 0) >= 100;
                  return (
                    <div key={app.id} className="card-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: isComp ? '4px solid #10b981' : '4px solid #2563eb' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div>
                            <span className="badge" style={{ background: 'var(--bg-subtle)', marginBottom: '4px', display: 'inline-block' }}>
                              {app.course_code}
                            </span>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '2px 0 4px' }}>
                              {app.course}
                            </h3>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                              Duration: {app.duration || '6 Months'} • Mode: <strong>{app.learning_mode}</strong>
                            </div>
                          </div>
                          {isComp ? (
                            <span className="badge success" style={{ fontSize: '12px' }}>
                              <CheckCircle2 size={12} style={{ marginRight: 4 }} /> Completed
                            </span>
                          ) : (
                            <span className="badge warning" style={{ fontSize: '12px' }}>
                              <Clock size={12} style={{ marginRight: 4 }} /> In Progress
                            </span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div style={{ margin: '1.25rem 0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                            <span>Course Syllabus Progress</span>
                            <span style={{ color: isComp ? '#10b981' : '#2563eb' }}>{app.completion_status || 0}%</span>
                          </div>
                          <div className="progress-bar-container" style={{ height: '8px' }}>
                            <div
                              className="progress-bar-fill"
                              style={{
                                width: `${app.completion_status || 0}%`,
                                background: isComp ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #2563eb, #38bdf8)'
                              }}
                            ></div>
                          </div>
                        </div>

                        {/* Stats Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                          <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700 }}>ATTENDANCE</div>
                            <div style={{ fontWeight: 700, color: app.attendance_stats?.percentage >= 75 ? '#10b981' : '#ef4444' }}>
                              {app.attendance_stats?.percentage || 0}%
                            </div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700 }}>PAYMENT</div>
                            <div style={{ fontWeight: 700, color: '#10b981' }}>{app.payment_status}</div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700 }}>CERTIFICATE</div>
                            <div style={{ fontWeight: 700, color: isComp ? '#10b981' : 'var(--text-muted)' }}>
                              {isComp ? 'Available' : 'Locked'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link
                          to={`/course-details/${app.id}`}
                          className="btn-primary"
                          style={{ flex: 1, textDecoration: 'none', textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px' }}
                        >
                          <Layers size={16} /> Course & Syllabus Details
                        </Link>
                        {isComp && app.certificate_id && (
                          <a
                            href={api.getCertificateDownloadUrl(app.certificate_id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary"
                            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '9px 12px' }}
                            title="Download Certificate"
                          >
                            <Download size={16} /> PDF
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment History Section */}
          <div className="card-container">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} color="var(--primary-blue)" /> Payment History & Receipts
            </h3>
            {studentData.paymentHistory.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No fee payment transactions recorded yet.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Payment Amount</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                    <th>Transaction Date</th>
                  </tr>
                </thead>
                <tbody>
                  {studentData.paymentHistory.map(pay => (
                    <tr key={pay.id}>
                      <td style={{ fontWeight: 700 }}>{pay.course}</td>
                      <td style={{ fontWeight: 700, color: '#10b981' }}>₹{pay.amount?.toLocaleString()}</td>
                      <td>{pay.method}</td>
                      <td>
                        <span className="badge success">{pay.status}</span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {pay.date ? new Date(pay.date).toLocaleDateString() : 'Instant'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
export default DashboardPage;
