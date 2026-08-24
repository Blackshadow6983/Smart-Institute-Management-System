import React from 'react';
import { Menu, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Header({ title, onToggleSidebar }) {
  const { user } = useAuth();

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="mobile-menu-btn" onClick={onToggleSidebar} aria-label="Toggle navigation menu" type="button">
          <Menu size={22} />
        </button>
        <h1 className="page-title">{title}</h1>
      </div>
      <div className="header-right">
        <span className="header-meta-badge">
          <Calendar size={13} />
          <span>Academic Session 2026</span>
        </span>
        <span className="badge badge-info" style={{ textTransform: 'uppercase', fontSize: '11px' }}>
          {user?.role || 'Guest'}
        </span>
      </div>
    </header>
  );
}
