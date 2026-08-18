import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  CreditCard,
  FileCheck,
  FileSpreadsheet,
  FileText,
  User,
  KeyRound,
  LogOut,
  Building2,
  ShieldAlert,
  Search
} from 'lucide-react';

export function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const role = (user?.role || 'student').toLowerCase();
  const isAdmin = ['admin', 'institute', 'institute_admin'].includes(role);
  const isFaculty = role === 'faculty';
  const isStudent = role === 'student';

  const instCode = user?.institute_code || 'DEFAULT';
  const instName = user?.institute_name || 'AI SMART INSTITUTE';

  return (
    <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand-icon" style={{
          background: 'linear-gradient(135deg, var(--primary-navy, #0f172a), var(--primary-blue, #2563eb))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff'
        }}>
          <Building2 size={20} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="sidebar-brand-text" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={instName}>
            {instName}
          </div>
          <div className="sidebar-brand-sub" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{
              background: 'rgba(37,99,235,0.15)',
              color: 'var(--primary-blue)',
              padding: '1px 5px',
              borderRadius: '3px',
              fontWeight: 700,
              fontSize: '10px',
              letterSpacing: '0.4px'
            }}>
              {isAdmin ? 'ADMIN' : (isFaculty ? 'STAFF' : 'STUDENT')}
            </span>
            <span>Portal</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Navigation</div>
        
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        {!isFaculty && (
          <NavLink to="/courses" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
            <BookOpen size={18} />
            <span>{isAdmin ? 'Course Management' : 'Browse Courses'}</span>
          </NavLink>
        )}

        {isAdmin && (
          <NavLink to="/students" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
            <Users size={18} />
            <span>Student Management</span>
          </NavLink>
        )}

        {isAdmin && (
          <NavLink to="/faculty" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
            <GraduationCap size={18} />
            <span>Faculty Management</span>
          </NavLink>
        )}

        <NavLink to="/attendance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
          <CalendarCheck size={18} />
          <span>Attendance</span>
        </NavLink>

        {isAdmin && (
          <NavLink to="/applications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
            <FileText size={18} />
            <span>Enrollments</span>
          </NavLink>
        )}

        {!isFaculty && (
          <NavLink to="/fees" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
            <CreditCard size={18} />
            <span>{isStudent ? 'Fee Payments' : 'Fees & Accounts'}</span>
          </NavLink>
        )}

        {!isFaculty && (
          <NavLink to="/certificates" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
            <FileCheck size={18} />
            <span>Certificates & Verification</span>
          </NavLink>
        )}

        {isAdmin && (
          <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
            <FileSpreadsheet size={18} />
            <span>Reports & Analytics</span>
          </NavLink>
        )}

        <div className="nav-section-title" style={{ marginTop: '0.8rem' }}>Account</div>

        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
          <User size={18} />
          <span>My Profile</span>
        </NavLink>

        <NavLink to="/change-password" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
          <KeyRound size={18} />
          <span>Change Password</span>
        </NavLink>
      </nav>


      <div className="sidebar-footer">
        <div className="user-profile-badge">
          <div className="user-avatar">
            {(user?.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.username || 'User'}</div>
            <div className="user-role" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>{user?.role?.toUpperCase() || 'STUDENT'}</span>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout} title="Sign Out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
