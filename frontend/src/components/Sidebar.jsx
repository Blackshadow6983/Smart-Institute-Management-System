import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  CalendarCheck,
  CreditCard,
  Award,
  Bell,
  FileSpreadsheet,
  FileCheck,
  FileText,
  User,
  KeyRound,
  LogOut,
  Building2
} from 'lucide-react';

export function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const role = (user?.role || 'student').toLowerCase();
  const instCode = user?.institute_code || 'ITE-001';
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
              {instCode}
            </span>
            <span>Portal</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Core Modules</div>
        
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/students" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
          <Users size={18} />
          <span>Students</span>
        </NavLink>

        <NavLink to="/faculty" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
          <GraduationCap size={18} />
          <span>Faculty</span>
        </NavLink>

        <NavLink to="/courses" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
          <BookOpen size={18} />
          <span>Courses</span>
        </NavLink>

        <NavLink to="/batches" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
          <Layers size={18} />
          <span>Batches</span>
        </NavLink>

        <NavLink to="/attendance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
          <CalendarCheck size={18} />
          <span>Attendance</span>
        </NavLink>

        <NavLink to="/fees" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
          <CreditCard size={18} />
          <span>Fees & Accounts</span>
        </NavLink>

        <NavLink to="/marks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
          <Award size={18} />
          <span>Marks & Results</span>
        </NavLink>

        <div className="nav-section-title" style={{ marginTop: '0.6rem' }}>Academic Records</div>

        <NavLink to="/notices" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
          <Bell size={18} />
          <span>Notices</span>
        </NavLink>

        <NavLink to="/applications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
          <FileText size={18} />
          <span>Applications</span>
        </NavLink>

        <NavLink to="/certificates" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
          <FileCheck size={18} />
          <span>Certificates</span>
        </NavLink>

        <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
          <FileSpreadsheet size={18} />
          <span>Reports</span>
        </NavLink>

        <div className="nav-section-title" style={{ marginTop: '0.6rem' }}>Account</div>

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
              <span>{user?.role?.toUpperCase() || 'GUEST'}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({instCode})</span>
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
