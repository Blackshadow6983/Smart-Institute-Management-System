const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      console.warn('Unauthorized request - session may have expired.');
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.detail || data?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && (err.message === 'Failed to fetch' || err.message.includes('fetch'))) {
      throw new Error('Server connection failed. Please check if the backend server (FastAPI at http://127.0.0.1:8000) is running.');
    }
    throw err;
  }
}

export const api = {
  // Auth
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  changePassword: (data) => apiRequest('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),

  // Institutes (Admin)
  registerInstitute: (data) => apiRequest('/institutes/register', { method: 'POST', body: JSON.stringify(data) }),
  getInstituteProfile: () => apiRequest('/institutes/profile'),
  updateInstituteProfile: (data) => apiRequest('/institutes/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getInstituteDashboardStats: () => apiRequest('/institutes/dashboard-stats'),
  sendFeeNotification: (data) => apiRequest('/institutes/send-fee-notification', { method: 'POST', body: JSON.stringify(data) }),
  getNotifications: () => apiRequest('/institutes/notifications'),

  // Students
  registerStudent: (data) => apiRequest('/students/register', { method: 'POST', body: JSON.stringify(data) }),
  getStudent: (regId) => apiRequest(`/students/${regId}`),
  updateStudent: (regId, data) => apiRequest(`/students/${regId}`, { method: 'PUT', body: JSON.stringify(data) }),
  getAllStudents: () => apiRequest('/students/'),

  // Faculty
  registerFaculty: (data) => apiRequest('/faculty/register', { method: 'POST', body: JSON.stringify(data) }),
  getFaculty: (empId) => apiRequest(`/faculty/${empId}`),
  updateFaculty: (empId, data) => apiRequest(`/faculty/${empId}`, { method: 'PUT', body: JSON.stringify(data) }),
  getAllFaculty: () => apiRequest('/admin/faculty'),

  // Courses
  getAllCourses: () => apiRequest('/courses/'),
  getCourse: (courseCode) => apiRequest(`/courses/${courseCode}`),
  createCourse: (data) => apiRequest('/courses/', { method: 'POST', body: JSON.stringify(data) }),
  updateCourse: (courseCode, data) => apiRequest(`/courses/${courseCode}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Batches
  getAllBatches: () => apiRequest('/batches/'),
  getBatch: (batchId) => apiRequest(`/batches/${batchId}`),
  createBatch: (data) => apiRequest('/batches/', { method: 'POST', body: JSON.stringify(data) }),
  updateBatch: (batchId, data) => apiRequest(`/batches/${batchId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Attendance
  markAttendance: (data) => apiRequest('/attendance/', { method: 'POST', body: JSON.stringify(data) }),
  getStudentAttendance: (studentId) => apiRequest(`/attendance/student/${studentId}`),
  getAttendancePercentage: (studentId) => apiRequest(`/attendance/percentage/${studentId}`),

  // Fees
  createFeePayment: (data) => apiRequest('/fees/', { method: 'POST', body: JSON.stringify(data) }),
  getStudentFees: (studentId) => apiRequest(`/fees/${studentId}`),
  getFeeSummary: (studentId) => apiRequest(`/fees/summary/${studentId}`),

  // Assessments
  createAssessment: (data) => apiRequest('/assessments/', { method: 'POST', body: JSON.stringify(data) }),
  getStudentAssessments: (studentId) => apiRequest(`/assessments/${studentId}`),
  getStudentResult: (studentId) => apiRequest(`/assessments/result/${studentId}`),

  // Notices
  getNotices: () => apiRequest('/notices/'),
  createNotice: (data) => apiRequest('/notices/', { method: 'POST', body: JSON.stringify(data) }),

  // Reports
  getStudentReport: (studentId) => apiRequest(`/reports/student/${studentId}`),

  // Certificates
  generateCertificate: (data) => apiRequest('/certificates/', { method: 'POST', body: JSON.stringify(data) }),
  getStudentCertificate: (studentId) => apiRequest(`/certificates/${studentId}`),

  // Course Applications
  applyCourse: (courseId) => apiRequest('/course-applications/', { method: 'POST', body: JSON.stringify({ course_id: courseId }) }),
  getMyApplications: () => apiRequest('/course-applications/my'),
  getAllApplications: () => apiRequest('/course-applications/all'),

  // AI Chat Assistant
  sendChatMessage: (message) => apiRequest('/ai/chat', { method: 'POST', body: JSON.stringify({ message }) })
};
