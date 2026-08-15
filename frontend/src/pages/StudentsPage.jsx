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
  Sparkles
} from 'lucide-react';

export function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Form states for Registration
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

  // Fee notification modal states
  const [feeCustomNote, setFeeCustomNote] = useState('');
  const [feeActionLoading, setFeeActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [studentsData, coursesData, batchesData] = await Promise.allSettled([
        api.getAllStudents(),
        api.getAllCourses(),
        api.getAllBatches()
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
    } catch (err) {
      setError(err.message || 'Failed to load student directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle course dropdown change and auto fill duration/fees
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

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setError('');
    setSuccess('');
    try {
      await api.updateStudent(selectedStudent.registration_id, {
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        address: formData.address,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        parent_name: formData.parent_name,
        parent_mobile: formData.parent_mobile,
        parent_email: formData.parent_email,
        course: formData.course,
        course_duration: formData.course_duration,
        course_fee: parseFloat(formData.course_fee || 0),
        batch: formData.batch
      });
      setSuccess(`Student record ${selectedStudent.registration_id} updated.`);
      setIsEditModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Error updating student record.');
    }
  };

  const handleSendFeeNotification = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setFeeActionLoading(true);
    try {
      const res = await api.sendFeeNotification({
        student_id: selectedStudent.id,
        custom_note: feeCustomNote.trim() || undefined
      });
      setSuccess(res.message || 'Fee notification dispatched to student & parent Gmail.');
      setIsFeeModalOpen(false);
      setFeeCustomNote('');
    } catch (err) {
      setError(err.message || 'Failed to dispatch fee notification.');
    } finally {
      setFeeActionLoading(false);
    }
  };

  const openEditModal = (stu) => {
    setSelectedStudent(stu);
    setFormData({
      name: stu.name || '',
      email: stu.email || '',
      mobile: stu.mobile || '',
      password: '',
      address: stu.address || '',
      date_of_birth: stu.date_of_birth || '',
      gender: stu.gender || 'Male',
      parent_name: stu.parent_name || '',
      parent_mobile: stu.parent_mobile || '',
      parent_email: stu.parent_email || '',
      course: stu.course || '',
      course_duration: stu.course_duration || '1 Year',
      course_fee: stu.course_fee || 0,
      batch: stu.batch || ''
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (stu) => {
    setSelectedStudent(stu);
    setIsViewModalOpen(true);
  };

  const openFeeModal = (stu) => {
    setSelectedStudent(stu);
    setIsFeeModalOpen(true);
  };

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.registration_id && s.registration_id.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.parent_name && s.parent_name.toLowerCase().includes(q)) ||
      (s.course && s.course.toLowerCase().includes(q)) ||
      (s.batch && s.batch.toLowerCase().includes(q))
    );
  });

  const role = (user?.role || 'student').toLowerCase();
  const isAdmin = role === 'admin' || role === 'institute' || role === 'institute_admin';

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

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} />
            <h2 className="card-title">
              Institute Student Directory ({user?.institute_code || 'Cohort'})
            </h2>
          </div>
          {isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>
              <UserPlus size={14} />
              Register New Student
            </button>
          )}
        </div>

        <div className="card-body" style={{ paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search by student name, enrollment ID, parent name, course, batch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> enrolled students
            </div>
          </div>

          {loading ? (
            <LoadingSpinner message="Fetching institute student roster..." />
          ) : filteredStudents.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No students found"
              description={search ? 'No student records match your search criteria.' : 'No registered students in this institute roster yet.'}
            />
          ) : (
            <div className="table-container">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Enrollment ID</th>
                    <th>Student Name & Mobile</th>
                    <th>Parent / Guardian</th>
                    <th>Enrolled Course</th>
                    <th>Duration</th>
                    <th>Course Fee</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s.id || s.registration_id}>
                      <td style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>
                        <span style={{
                          background: 'rgba(37,99,235,0.08)',
                          color: 'var(--primary-blue)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          display: 'inline-block',
                          letterSpacing: '0.3px'
                        }}>
                          {s.registration_id}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{s.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                          {s.email} • {s.mobile}
                        </div>
                      </td>
                      <td>
                        <div>{s.parent_name || '—'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {s.parent_mobile || (s.parent_email ? s.parent_email : 'No contact')}
                        </div>
                      </td>
                      <td>
                        {s.course ? (
                          <StatusBadge status={s.course} type="info" />
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                        )}
                        {s.batch && <span className="badge badge-pending" style={{ marginLeft: '4px' }}>{s.batch}</span>}
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {s.course_duration || '1 Year'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#065f46' }}>
                          ₹{(s.course_fee || 0).toLocaleString()}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 7px', marginRight: '4px' }}
                          onClick={() => openViewModal(s)}
                          title="View Complete Academic Record"
                        >
                          <Eye size={13} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '3px 7px', marginRight: '4px' }}
                              onClick={() => openEditModal(s)}
                              title="Edit Student Record"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '3px 7px', color: 'var(--primary-blue)' }}
                              onClick={() => openFeeModal(s)}
                              title="Send Fee Statement / Demand Notice to Student & Parent"
                            >
                              <Mail size={13} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REGISTER NEW STUDENT MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register & Enroll New Student"
        maxWidth="680px"
      >
        <form onSubmit={handleCreateStudent}>
          <div style={{
            background: 'rgba(37, 99, 235, 0.06)',
            padding: '10px 14px',
            borderRadius: '6px',
            marginBottom: '1rem',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Sparkles size={16} color="var(--primary-blue)" />
            <span>
              The system will auto-assign a unique Enrollment ID (e.g. <strong>{user?.institute_code || 'ITE-001'}-STU001</strong>) and automatically email login credentials & course details to the student's Gmail.
            </span>
          </div>

          <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--primary-navy)', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', margin: '0 0 10px' }}>
            1. Student Personal Information
          </h4>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="Student legal full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Student Email (Gmail) <span className="required">*</span></label>
              <input
                type="email"
                className="form-control"
                placeholder="student@gmail.com (receives ID & Password)"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Student Mobile Phone <span className="required">*</span></label>
              <input
                type="tel"
                className="form-control"
                placeholder="10-digit mobile number"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                required
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

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Residential Address</label>
              <input
                type="text"
                className="form-control"
                placeholder="Residential street, city, pin"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                className="form-control"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
            </div>
          </div>

          <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--primary-navy)', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', margin: '14px 0 10px' }}>
            2. Parents / Guardian Information
          </h4>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Parent / Guardian Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Father or Mother's Full Name"
                value={formData.parent_name}
                onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Parent Phone / Mobile</label>
              <input
                type="tel"
                className="form-control"
                placeholder="Parent emergency contact number"
                value={formData.parent_mobile}
                onChange={(e) => setFormData({ ...formData, parent_mobile: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Parent Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="parent@gmail.com (for fee receipts & updates)"
              value={formData.parent_email}
              onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
            />
          </div>

          <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--primary-navy)', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', margin: '14px 0 10px' }}>
            3. Academic Course & Fees Structure
          </h4>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Enrolled Academic Course <span className="required">*</span></label>
              <select
                className="form-control"
                value={formData.course}
                onChange={(e) => handleCourseSelection(e.target.value)}
                required
              >
                <option value="">Select Course Program</option>
                {courses.map((c) => (
                  <option key={c.id || c.course_code} value={c.name}>
                    {c.course_code} - {c.name} ({c.duration || '1 Year'}) - ₹{(c.fees || 0).toLocaleString()}
                  </option>
                ))}
                <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                <option value="Full Stack Web Development Bootcamp">Full Stack Web Development Bootcamp</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Course Duration</label>
              <select
                className="form-control"
                value={formData.course_duration}
                onChange={(e) => setFormData({ ...formData, course_duration: e.target.value })}
              >
                <option value="3 Months">3 Months</option>
                <option value="6 Months">6 Months</option>
                <option value="1 Year">1 Year</option>
                <option value="2 Years">2 Years</option>
                <option value="3 Years">3 Years</option>
                <option value="4 Years">4 Years</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Course Fee (₹) <span className="required">*</span></label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 35000"
                value={formData.course_fee}
                onChange={(e) => setFormData({ ...formData, course_fee: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Cohort Batch</label>
              <select
                className="form-control"
                value={formData.batch}
                onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
              >
                <option value="">Select Batch</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name} ({b.timing || 'Standard'})
                  </option>
                ))}
                <option value="Batch Morning 2026">Batch Morning 2026</option>
                <option value="Batch Evening 2026">Batch Evening 2026</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Initial Password for Student</label>
            <input
              type="text"
              className="form-control"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <small style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Sent in the welcome credential email along with the Enrollment ID.
            </small>
          </div>

          <div className="modal-footer" style={{ margin: '1.25rem -1.25rem -1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <UserPlus size={15} />
              Register Student & Email Credentials
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* EDIT STUDENT MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Student: ${selectedStudent?.registration_id}`}
        maxWidth="680px"
      >
        <form onSubmit={handleUpdateStudent}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Student Email (Gmail)</label>
              <input
                type="email"
                className="form-control"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Student Mobile</label>
              <input
                type="text"
                className="form-control"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                required
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

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Parent / Guardian Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.parent_name}
                onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Parent Mobile</label>
              <input
                type="text"
                className="form-control"
                value={formData.parent_mobile}
                onChange={(e) => setFormData({ ...formData, parent_mobile: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Parent Email Address</label>
            <input
              type="email"
              className="form-control"
              value={formData.parent_email}
              onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Enrolled Course</label>
              <input
                type="text"
                className="form-control"
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Course Duration</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 6 Months, 1 Year"
                value={formData.course_duration}
                onChange={(e) => setFormData({ ...formData, course_duration: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Course Fee (₹)</label>
              <input
                type="number"
                className="form-control"
                value={formData.course_fee}
                onChange={(e) => setFormData({ ...formData, course_fee: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Assigned Batch</label>
              <input
                type="text"
                className="form-control"
                value={formData.batch}
                onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <input
              type="text"
              className="form-control"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ margin: '1.25rem -1.25rem -1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* VIEW STUDENT PROFILE MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Student Profile: ${selectedStudent?.name} [${selectedStudent?.registration_id}]`}
        maxWidth="600px"
      >
        {selectedStudent && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-subtle)',
              padding: '12px 16px',
              borderRadius: '6px',
              marginBottom: '1rem'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Institute Code</span>
                <div style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>{selectedStudent.institute_code || user?.institute_code || 'ITE-001'}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Enrollment ID</span>
                <div style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{selectedStudent.registration_id}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Course Fee</span>
                <div style={{ fontWeight: 700, color: '#065f46' }}>₹{(selectedStudent.course_fee || 0).toLocaleString()}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Full Name</span>
                <strong>{selectedStudent.name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Student Gmail</span>
                <span>{selectedStudent.email}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Student Mobile</span>
                <span>{selectedStudent.mobile}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Gender & DOB</span>
                <span>{selectedStudent.gender || 'Not specified'} • {selectedStudent.date_of_birth || 'N/A'}</span>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Parent's Name</span>
                <strong>{selectedStudent.parent_name || 'Not recorded'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Parent's Mobile</span>
                <span>{selectedStudent.parent_mobile || 'Not recorded'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Parent's Email</span>
                <span>{selectedStudent.parent_email || 'Not recorded'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Enrolled Course</span>
                <span>{selectedStudent.course || 'Unassigned'}</span>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Course Duration</span>
                <span style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>{selectedStudent.course_duration || '1 Year'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Assigned Batch</span>
                <span>{selectedStudent.batch || 'Unassigned'}</span>
              </div>
            </div>

            {selectedStudent.address && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '12.5px' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Address</span>
                <span>{selectedStudent.address}</span>
              </div>
            )}

            <div className="modal-footer" style={{ margin: '1.25rem -1.25rem -1.25rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsViewModalOpen(false)}>
                Close
              </button>
              {isAdmin && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => { setIsViewModalOpen(false); openFeeModal(selectedStudent); }}
                >
                  <Mail size={14} />
                  Send Fee Notice
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* SEND FEE NOTIFICATION MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isFeeModalOpen}
        onClose={() => setIsFeeModalOpen(false)}
        title={`Send Fee Statement Notice: ${selectedStudent?.name}`}
        maxWidth="540px"
      >
        {selectedStudent && (
          <form onSubmit={handleSendFeeNotification}>
            <div style={{
              background: 'var(--bg-subtle, #f8fafc)',
              padding: '0.85rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              fontSize: '12.5px',
              display: 'grid',
              gap: '6px'
            }}>
              <div><strong>Enrollment ID:</strong> {selectedStudent.registration_id}</div>
              <div><strong>Student Email:</strong> {selectedStudent.email}</div>
              {selectedStudent.parent_email && (
                <div><strong>Parent Email:</strong> {selectedStudent.parent_email} ({selectedStudent.parent_name || 'Parent'})</div>
              )}
              <div><strong>Course:</strong> {selectedStudent.course || 'Enrolled Program'} ({selectedStudent.course_duration || '1 Year'})</div>
              <div><strong>Course Fee:</strong> ₹{(selectedStudent.course_fee || 0).toLocaleString()}</div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="customFeeNote">
                Add Custom Note / Payment Due Date <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(Optional)</span>
              </label>
              <textarea
                id="customFeeNote"
                className="form-control"
                rows={3}
                placeholder="e.g. Please clear the outstanding installment on or before the 10th of next month."
                value={feeCustomNote}
                onChange={(e) => setFeeCustomNote(e.target.value)}
              />
            </div>

            <div className="modal-footer" style={{ margin: '1.25rem -1.25rem -1.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsFeeModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={feeActionLoading}
              >
                {feeActionLoading ? (
                  <span>Dispatching Email...</span>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Send Notification Email</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
