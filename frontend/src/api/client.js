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

    const isPublicEndpoint =
      endpoint.includes('/auth/login') ||
      endpoint.includes('/courses/public') ||
      endpoint.includes('/auth/register') ||
      endpoint.includes('/certificates/verify');

    if (response.status === 401 && !isPublicEndpoint) {
      console.warn('Unauthorized request - session may have expired.');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_info');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
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
  selfRegisterStudent: (data) => apiRequest('/auth/register-student', { method: 'POST', body: JSON.stringify(data) }),

  // Institutes & Admin Dashboard Stats
  registerInstitute: (data) => apiRequest('/institutes/register', { method: 'POST', body: JSON.stringify(data) }),
  getInstituteProfile: () => apiRequest('/institutes/profile'),
  updateInstituteProfile: (data) => apiRequest('/institutes/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getInstitutePaymentInfo: (instCode) => apiRequest(`/institutes/payment-info/${instCode}`),
  getInstituteDashboardStats: () => apiRequest('/institutes/dashboard-stats'),

  // Students
  registerStudent: (data) => apiRequest('/students/register', { method: 'POST', body: JSON.stringify(data) }),
  getStudent: (regId) => apiRequest(`/students/${regId}`),
  updateStudent: (regId, data) => apiRequest(`/students/${regId}`, { method: 'PUT', body: JSON.stringify(data) }),
  getAllStudents: () => apiRequest('/students/'),
  getPendingApprovals: () => apiRequest('/students/pending-approvals/list'),
  approveStudent: (studentId, assignedRegistrationId) => apiRequest(`/students/${studentId}/approve`, { method: 'POST', body: JSON.stringify({ assigned_registration_id: assignedRegistrationId }) }),
  rejectStudent: (studentId, reason) => apiRequest(`/students/${studentId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Faculty
  registerFaculty: (data) => apiRequest('/faculty/register', { method: 'POST', body: JSON.stringify(data) }),
  getFaculty: (empId) => apiRequest(`/faculty/${empId}`),
  updateFaculty: (empId, data) => apiRequest(`/faculty/${empId}`, { method: 'PUT', body: JSON.stringify(data) }),
  getAllFaculty: () => apiRequest('/admin/faculty'),

  // Courses & Course Modules
  getPublicCourses: (instCode) => apiRequest(`/courses/public${instCode ? `?institute_code=${encodeURIComponent(instCode)}` : ''}`),
  getAllCourses: () => apiRequest('/courses/'),
  getCourse: (courseCode) => apiRequest(`/courses/${courseCode}`),
  createCourse: (data) => apiRequest('/courses/', { method: 'POST', body: JSON.stringify(data) }),
  updateCourse: (courseCode, data) => apiRequest(`/courses/${courseCode}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCourse: (courseId) => apiRequest(`/courses/${courseId}`, { method: 'DELETE' }),
  toggleCourseStatus: (courseId) => apiRequest(`/courses/${courseId}/toggle-status`, { method: 'PATCH' }),
  addCourseModule: (courseId, data) => apiRequest(`/courses/${courseId}/modules`, { method: 'POST', body: JSON.stringify(data) }),
  getCourseModules: (courseId) => apiRequest(`/courses/${courseId}/modules`),
  deleteCourseModule: (moduleId) => apiRequest(`/courses/modules/${moduleId}`, { method: 'DELETE' }),

  // Batches
  getAllBatches: () => apiRequest('/batches/'),
  getBatch: (batchId) => apiRequest(`/batches/${batchId}`),
  createBatch: (data) => apiRequest('/batches/', { method: 'POST', body: JSON.stringify(data) }),
  updateBatch: (batchId, data) => apiRequest(`/batches/${batchId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Attendance
  markAttendance: (data) => apiRequest('/attendance/', { method: 'POST', body: JSON.stringify(data) }),
  updateAttendance: (attendanceId, data) => apiRequest(`/attendance/${attendanceId}`, { method: 'PUT', body: JSON.stringify(data) }),
  getStudentAttendance: (studentId, course) => apiRequest(`/attendance/student/${studentId}${course ? `?course=${encodeURIComponent(course)}` : ''}`),
  getAttendancePercentage: (studentId, course) => apiRequest(`/attendance/percentage/${studentId}${course ? `?course=${encodeURIComponent(course)}` : ''}`),
  getCourseAttendance: (courseName) => apiRequest(`/attendance/course/${encodeURIComponent(courseName)}`),

  // Fees & Payment Verification
  createFeePayment: (data) => apiRequest('/fees/', { method: 'POST', body: JSON.stringify(data) }),
  submitFeePayment: (data) => apiRequest('/fees/submit-payment', { method: 'POST', body: JSON.stringify(data) }),
  verifyFeePayment: (data) => apiRequest('/fees/verify', { method: 'POST', body: JSON.stringify(data) }),
  getFeeVerifications: () => apiRequest('/fees/verification-list'),
  getStudentFees: (studentId) => apiRequest(`/fees/${studentId}`),
  getFeeSummary: (studentId) => apiRequest(`/fees/summary/${studentId}`),

  // Tax Invoices
  getStudentInvoices: (studentId) => apiRequest(`/invoices/student/${studentId}`),
  getInstituteInvoices: () => apiRequest('/invoices/institute'),
  getInvoiceDetails: (invoiceId) => apiRequest(`/invoices/${invoiceId}`),
  getInvoiceHtmlUrl: (invoiceId) => `${API_BASE_URL || 'http://127.0.0.1:8000'}/invoices/${invoiceId}/html`,

  // Assessments, Notices & Suggestions
  createAssessment: (data) => apiRequest('/assessments/', { method: 'POST', body: JSON.stringify(data) }),
  getStudentAssessments: (studentId) => apiRequest(`/assessments/${studentId}`),
  getNotices: () => apiRequest('/notices/'),
  createNotice: (data) => apiRequest('/notices/', { method: 'POST', body: JSON.stringify(data) }),
  getSuggestions: () => apiRequest('/suggestions/'),
  createSuggestion: (data) => apiRequest('/suggestions/', { method: 'POST', body: JSON.stringify(data) }),
  updateSuggestionStatus: (id, data) => apiRequest(`/suggestions/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Certificates & Public Verification
  getAllCertificates: () => apiRequest('/certificates/'),
  generateCertificate: (data) => apiRequest('/certificates/', { method: 'POST', body: JSON.stringify(data) }),
  getStudentCertificate: (studentId) => apiRequest(`/certificates/${studentId}`),
  claimCertificate: (applicationId) => apiRequest(`/certificates/claim/${applicationId}`, { method: 'POST' }),
  verifyCertificate: (certificateNumber) => apiRequest(`/certificates/verify/${encodeURIComponent(certificateNumber)}`),
  getCertificateDownloadUrl: (certId) => `${API_BASE_URL}/certificates/download/${certId}`,

  // Course Applications & Module Progress
  applyCourse: (courseId) => apiRequest('/course-applications/', { method: 'POST', body: JSON.stringify({ course_id: courseId }) }),
  applyCourseDetailed: (data) => apiRequest('/course-applications/', { method: 'POST', body: JSON.stringify(data) }),
  getMyApplications: () => apiRequest('/course-applications/my'),
  getEnrollmentDetails: (appId) => apiRequest(`/course-applications/${appId}/details`),
  toggleModuleCompletion: (appId, moduleId) => apiRequest(`/course-applications/${appId}/modules/${moduleId}/toggle`, { method: 'POST' }),
  getAllApplications: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/course-applications/all${query ? `?${query}` : ''}`);
  },
  updateCourseCompletion: (appId, completionStatus, remarks = '') => apiRequest(`/course-applications/${appId}/completion`, { method: 'PATCH', body: JSON.stringify({ completion_status: completionStatus, remarks }) }),
  updatePaymentStatus: (appId, paymentStatus) => apiRequest(`/course-applications/${appId}/payment-status`, { method: 'PATCH', body: JSON.stringify({ payment_status: paymentStatus }) }),

  // Reports & AI Assistant
  getStudentReport: (studentId) => apiRequest(`/reports/student/${studentId}`),
  sendChatMessage: (message) => apiRequest('/ai/chat', { method: 'POST', body: JSON.stringify({ message }) })
};

