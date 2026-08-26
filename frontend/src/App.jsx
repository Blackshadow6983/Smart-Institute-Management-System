import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage } from './pages/StudentsPage';
import { FacultyPage } from './pages/FacultyPage';
import { CoursesPage } from './pages/CoursesPage';
import { BatchesPage } from './pages/BatchesPage';
import { AttendancePage } from './pages/AttendancePage';
import { FeesPage } from './pages/FeesPage';
import { MarksPage } from './pages/MarksPage';
import { NoticesPage } from './pages/NoticesPage';
import { ReportsPage } from './pages/ReportsPage';
import { CertificatesPage } from './pages/CertificatesPage';
import { CourseApplicationsPage } from './pages/CourseApplicationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { StudentCourseDetailsPage } from './pages/StudentCourseDetailsPage';
import { StudyMaterialsPage } from './pages/StudyMaterialsPage';


function ProtectedRoute({ children }) {

  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AdminOnlyRoute({ children }) {
  const { user } = useAuth();
  const role = (user?.role || '').trim().toLowerCase();
  const isAdmin = ['admin', 'institute', 'institute_admin'].includes(role);
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function StaffRestrictedRoute({ children }) {
  const { user } = useAuth();
  const role = (user?.role || '').trim().toLowerCase();
  const isStaff = ['faculty', 'staff'].includes(role);
  if (isStaff) {
    return <Navigate to="/attendance" replace />;
  }
  return children;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />

      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout pageTitle="Student & University Portal" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="students" element={<AdminOnlyRoute><StudentsPage /></AdminOnlyRoute>} />
        <Route path="faculty" element={<AdminOnlyRoute><FacultyPage /></AdminOnlyRoute>} />
        <Route path="courses" element={<StaffRestrictedRoute><CoursesPage /></StaffRestrictedRoute>} />
        <Route path="course-details/:appId" element={<StudentCourseDetailsPage />} />
        <Route path="batches" element={<BatchesPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="fees" element={<StaffRestrictedRoute><FeesPage /></StaffRestrictedRoute>} />
        <Route path="marks" element={<StaffRestrictedRoute><MarksPage /></StaffRestrictedRoute>} />
        <Route path="study-materials" element={<StudyMaterialsPage />} />
        <Route path="notices" element={<NoticesPage />} />

        <Route path="reports" element={<AdminOnlyRoute><ReportsPage /></AdminOnlyRoute>} />
        <Route path="certificates" element={<StaffRestrictedRoute><CertificatesPage /></StaffRestrictedRoute>} />
        <Route path="applications" element={<AdminOnlyRoute><CourseApplicationsPage /></AdminOnlyRoute>} />

        <Route path="profile" element={<ProfilePage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}



export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
