import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Chatbot } from './Chatbot';

export function Layout({ pageTitle = 'Institutional Portal' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Header title={pageTitle} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="content-body">
          <Outlet />
        </div>
      </div>
      {/* Floating Institute AI Chatbot */}
      <Chatbot />
    </div>
  );
}
