import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import {
  Users,
  UserPlus,
  Search,
  Edit,
  Eye,
  CheckCircle2,
  AlertCircle,
  Mail,
  Send,
  Building2,
  Clock,
  CreditCard,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  Check,
  X,
  UserCheck,
  ShieldCheck,
  Award
} from 'lucide-react';

export function StudentsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('approved'); // 'approved' or 'pending'
  const [students, setStudents] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Approval Form
  const [assignedEnrollmentId, setAssignedEnrollmentId] = useState('');

  // Form states for Admin Registration
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: 'Pass@' + Math.floor(1000 + Math.random() * 9000),
    address: '',
    date_of_birth: '',
    gender: 'Male',
    parent_name: '',
    parent_mobile: '',
    parent_email: '',
    course: '',
    course_duration: '1 Year',
    course_fee: 25000,
    batch: ''
  });

  const [feeCustomNote, setFeeCustomNote] = useState('');
  const [feeActionLoading, setFeeActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [studentsData, coursesData, batchesData, pendingData] = await Promise.allSettled([
        api.getAllStudents(),
        api.getAllCourses(),
        api.getAllBatches(),
        api.getPendingApprovals()
      ]);

      if (studentsData.status === 'fulfilled') {
        setStudents(Array.isArray(studentsData.value) ? studentsData.value : []);
      }
      if (coursesData.status === 'fulfilled') {
        setCourses(Array.isArray(coursesData.value) ? coursesData.value : []);
      }
      if (batchesData.status === 'fulfilled') {
        setBatches(Array.isArray(batchesData.value) ? batchesData.value : []);
      }
      if (pendingData.status === 'fulfilled') {
        setPendingApprovals(Array.isArray(pendingData.value) ? pendingData.value : []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load student directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCourseSelection = (courseName) => {
    const selected = courses.find((c) => c.name === courseName || c.course_code === courseName);
    setFormData((prev) => ({
      ...prev,
      course: courseName,
      course_duration: selected?.duration || prev.course_duration || '1 Year',
      course_fee: selected?.fees !== undefined ? selected.fees : prev.course_fee
    }));
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await api.registerStudent({
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        password: formData.password,
        address: formData.address.trim() || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || 'Male',
        parent_name: formData.parent_name.trim() || null,
        parent_mobile: formData.parent_mobile.trim() || null,
        parent_email: formData.parent_email.trim() || null,
        course: formData.course || null,
        course_duration: formData.course_duration || null,
        course_fee: parseFloat(formData.course_fee || 0),
        batch: formData.batch || null
      });

      setSuccess(res.message || `Student created! Login ID & Password sent to ${formData.email}`);
      setIsAddModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Error registering student.');
    }
  };

  const openApproveModal = (stu) => {
    setSelectedStudent(stu);
    const code = user?.institute_code || stu.institute_code || 'ITE-001';
    setAssignedEnrollmentId(`${code}-STU${Math.floor(100 + Math.random() * 900)}`);
    setIsApproveModalOpen(true);
  };

  const handleApproveStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setError('');
    setSuccess('');
    try {
      const res = await api.approveStudent(selectedStudent.id, assignedEnrollmentId.trim());
      setSuccess(res.message || `Approved student ${selectedStudent.name}! Enrollment No: ${assignedEnrollmentId}`);
      setIsApproveModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to approve student registration.');
    }
  };

  const handleRejectStudent = async (stu) => {
    if (!window.confirm(`Are you sure you want to reject the registration request for ${stu.name}?`)) return;
    setError('');
    setSuccess('');
    try {
      await api.rejectStudent(stu.id, 'Denied by institute admin');
      setSuccess(`Registration request for ${stu.name} rejected.`);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to reject student request.');
    }
  };

  const role = (user?.role || 'student').toLowerCase();
  const isAdmin = ['admin', 'institute', 'institute_admin'].includes(role);

  const filteredApproved = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.registration_id && s.registration_id.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.course && s.course.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={16} />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
          <CheckCircle2 size={16} />
          <div>{success}</div>
        </div>
      )}

      {/* Header Banner */}
      <div className="card-container" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', borderRadius: '16px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: '#ffffff' }}>
              <Users size={28} color="#60a5fa" />
              Institute Student Directory
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '4px 0 0' }}>
              Institute Code: <strong>{user?.institute_code || 'ITE-001'}</strong> • Registered & Active Student Roster ({students.length} Learners)
            </p>
          </div>

          {isAdmin && (
            <button className="btn-primary" onClick={() => setIsAddModalOpen(true)} style={{ padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={18} /> Register Student Manually
            </button>
          )}
        </div>
      </div>

      {/* ENROLLED STUDENTS TABLE */}
      <div className="card-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '36px' }}
                placeholder="Search by student name, enrollment ID, course..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {filteredApproved.length} of {students.length} students
            </div>
          </div>

          {loading ? (
            <LoadingSpinner message="Loading roster..." />
          ) : filteredApproved.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No student records found"
              description="No registered students in this institute roster yet."
            />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Enrollment ID</th>
                  <th>Student Name & Email</th>
                  <th>Mobile</th>
                  <th>Enrolled Course</th>
                  <th>Duration</th>
                  <th>Fee (₹)</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApproved.map((s) => (
                  <tr key={s.id || s.registration_id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{s.registration_id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.email}</div>
                    </td>
                    <td>{s.mobile}</td>
                    <td>
                      <span className="badge info">{s.course || 'Unassigned'}</span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{s.course_duration || '1 Year'}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{(s.course_fee || 0).toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                        onClick={() => { setSelectedStudent(s); setIsViewModalOpen(true); }}
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      {/* VIEW PROFILE MODAL */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Student Profile: ${selectedStudent?.name}`}
        maxWidth="500px"
      >
        {selectedStudent && (
          <div style={{ fontSize: '0.9rem', display: 'grid', gap: '0.75rem' }}>
            <div><strong>Enrollment ID:</strong> {selectedStudent.registration_id}</div>
            <div><strong>Name:</strong> {selectedStudent.name}</div>
            <div><strong>Email:</strong> {selectedStudent.email}</div>
            <div><strong>Mobile:</strong> {selectedStudent.mobile}</div>
            <div><strong>Institute Code:</strong> {selectedStudent.institute_code}</div>
            <div><strong>Enrolled Course:</strong> {selectedStudent.course || 'Unassigned'}</div>
            <div><strong>Course Duration:</strong> {selectedStudent.course_duration || '1 Year'}</div>
            <div><strong>Course Fee:</strong> ₹{(selectedStudent.course_fee || 0).toLocaleString()}</div>
          </div>
        )}
      </Modal>
    </div>
  );
}
export default StudentsPage;
