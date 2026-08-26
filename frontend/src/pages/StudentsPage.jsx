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
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

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

      setSuccess(res.message || `Student ${formData.name} created successfully! Enrollment ID: ${res.registration_id || res.student?.registration_id}`);
      setIsAddModalOpen(false);
      setFormData({
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
      loadData();
    } catch (err) {
      setError(err.message || 'Error registering student.');
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
              University Student Directory
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '4px 0 0' }}>
              University Code: <strong>{user?.institute_code || 'ITE-001'}</strong> • Registered & Active Student Roster ({students.length} Learners)
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
            description="No registered students in this university roster yet."
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

      {/* REGISTER STUDENT MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Student Manually"
        maxWidth="600px"
      >
        <form onSubmit={handleCreateStudent}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="Student full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address <span className="required">*</span></label>
              <input
                type="email"
                className="form-control"
                placeholder="student@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Mobile Number <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="10-digit mobile number"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Initial Password <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Enrolled Course</label>
              {courses.length > 0 ? (
                <select
                  className="form-control"
                  value={formData.course}
                  onChange={(e) => handleCourseSelection(e.target.value)}
                >
                  <option value="">Select a Course</option>
                  {courses.map((c) => (
                    <option key={c.id || c.course_code} value={c.name}>
                      {c.name} ({c.course_code})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Data Science"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                />
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Batch</label>
              {batches.length > 0 ? (
                <select
                  className="form-control"
                  value={formData.batch}
                  onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                >
                  <option value="">Select a Batch</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name} ({b.timing || 'TBD'})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Batch 2026-A"
                  value={formData.batch}
                  onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                />
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Course Fee (₹)</label>
              <input
                type="number"
                className="form-control"
                value={formData.course_fee}
                onChange={(e) => setFormData({ ...formData, course_fee: e.target.value === '' ? '' : Number(e.target.value) })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                className="form-control"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Residential Address</label>
            <input
              type="text"
              className="form-control"
              placeholder="City, State, Country"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ margin: '1.25rem -1.25rem -1.25rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Register Student
            </button>
          </div>
        </form>
      </Modal>

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
            <div><strong>University Code:</strong> {selectedStudent.institute_code}</div>
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
