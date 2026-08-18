import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  CreditCard,
  Laptop,
  Users,
  Power,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export function CoursesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Form Data for Admin
  const [formData, setFormData] = useState({
    course_code: '',
    name: '',
    description: '',
    duration: '6 Months',
    fees: 25000,
    mode: 'Both',
    total_classes: 20,
    start_date: '',
    end_date: '',
    capacity: 50,
    is_active: true
  });

  // Enrollment & Payment Form Data for Student
  const [enrollData, setEnrollData] = useState({
    learning_mode: 'Online',
    payment_method: 'UPI'
  });
  const [enrolling, setEnrolling] = useState(false);

  const loadCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getAllCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load courses catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.createCourse({
        course_code: formData.course_code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        duration: formData.duration,
        fees: formData.fees ? parseFloat(formData.fees) : 0,
        mode: formData.mode,
        total_classes: formData.total_classes ? parseInt(formData.total_classes) : 20,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        capacity: formData.capacity ? parseInt(formData.capacity) : 50,
        is_active: formData.is_active
      });
      setSuccess(`Course ${formData.name} created successfully!`);
      setIsAddModalOpen(false);
      loadCourses();
    } catch (err) {
      setError(err.message || 'Error creating course.');
    }
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setError('');
    setSuccess('');
    try {
      await api.updateCourse(selectedCourse.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        duration: formData.duration,
        fees: formData.fees ? parseFloat(formData.fees) : 0,
        mode: formData.mode,
        total_classes: formData.total_classes ? parseInt(formData.total_classes) : 20,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        capacity: formData.capacity ? parseInt(formData.capacity) : 50,
        is_active: formData.is_active
      });
      setSuccess(`Course ${selectedCourse.name} updated successfully.`);
      setIsEditModalOpen(false);
      loadCourses();
    } catch (err) {
      setError(err.message || 'Error updating course.');
    }
  };

  const handleToggleStatus = async (courseId) => {
    try {
      const res = await api.toggleCourseStatus(courseId);
      setSuccess(res.message);
      loadCourses();
    } catch (err) {
      setError(err.message || 'Failed to toggle course status.');
    }
  };

  const handleDeleteCourse = async (courseId, courseName) => {
    if (!window.confirm(`Are you sure you want to delete course "${courseName}"?`)) return;
    try {
      await api.deleteCourse(courseId);
      setSuccess(`Course "${courseName}" deleted.`);
      loadCourses();
    } catch (err) {
      setError(err.message || 'Failed to delete course.');
    }
  };

  const openEnrollModal = (course) => {
    if (course.is_active === false || course.status === 'Inactive') {
      setError('Cannot enroll in an inactive course.');
      return;
    }
    setSelectedCourse(course);
    setEnrollData({
      learning_mode: course.mode === 'Offline' ? 'Offline' : 'Online',
      payment_method: 'UPI'
    });
    setIsEnrollModalOpen(true);
  };

  const handleConfirmEnrollmentAndPayment = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setEnrolling(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.applyCourseDetailed({
        course_id: selectedCourse.id,
        learning_mode: enrollData.learning_mode,
        payment_method: enrollData.payment_method,
        amount_paid: parseFloat(selectedCourse.fees || 0)
      });
      setSuccess(res.message);
      setIsEnrollModalOpen(false);
      setTimeout(() => {
        if (res.application?.id) {
          navigate(`/course-details/${res.application.id}`);
        } else {
          navigate('/dashboard');
        }
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to complete course enrollment.');
    } finally {
      setEnrolling(false);
    }
  };

  const openEditModal = (c) => {
    setSelectedCourse(c);
    setFormData({
      course_code: c.course_code,
      name: c.name || '',
      description: c.description || '',
      duration: c.duration || '6 Months',
      fees: c.fees !== null && c.fees !== undefined ? c.fees : 0,
      mode: c.mode || 'Both',
      total_classes: c.total_classes || 20,
      start_date: c.start_date || '',
      end_date: c.end_date || '',
      capacity: c.capacity || 50,
      is_active: c.is_active !== false
    });
    setIsEditModalOpen(true);
  };

  const filteredCourses = courses.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.course_code && c.course_code.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  const role = (user?.role || 'student').toLowerCase();
  const isAdmin = ['admin', 'institute', 'institute_admin'].includes(role);

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
      <div className="card-container" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', padding: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: '#ffffff' }}>
              <BookOpen size={28} color="#60a5fa" />
              {isAdmin ? 'Course & Curriculum Management' : 'Available Academic Courses'}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '4px 0 0' }}>
              Browse catalog, select learning mode (Online/Offline), review tuition fees, and complete enrollment.
            </p>
          </div>

          {isAdmin && (
            <button className="btn-primary" onClick={() => setIsAddModalOpen(true)} style={{ padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> Add New Course
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="card-container" style={{ marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '38px' }}
            placeholder="Search courses by code, title, or syllabus topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Courses Cards Grid */}
      {loading ? (
        <LoadingSpinner message="Loading course catalog..." />
      ) : filteredCourses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses available"
          description={search ? 'No courses match your search criteria.' : 'No courses currently added.'}
        />
      ) : (
        <div className="grid-2-col" style={{ gap: '1.5rem' }}>
          {filteredCourses.map((c) => {
            const isActive = c.is_active !== false && c.status !== 'Inactive';
            return (
              <div
                key={c.id || c.course_code}
                className="card-container"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  opacity: isActive ? 1 : 0.75,
                  borderTop: isActive ? '4px solid #2563eb' : '4px solid #94a3b8'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <span className="badge" style={{ background: 'var(--bg-subtle)', fontWeight: 700, marginBottom: '4px', display: 'inline-block' }}>
                        {c.course_code}
                      </span>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0 4px', color: 'var(--text-primary)' }}>
                        {c.name}
                      </h3>
                    </div>
                    {isActive ? (
                      <span className="badge success">Active</span>
                    ) : (
                      <span className="badge danger">Inactive</span>
                    )}
                  </div>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                    {c.description || 'Comprehensive curriculum with practical labs, assessments, and continuous evaluation.'}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '10px', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, display: 'block' }}>DURATION</span>
                      <span style={{ fontWeight: 700 }}><Clock size={12} style={{ marginRight: 4 }} />{c.duration || '6 Months'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, display: 'block' }}>MODE</span>
                      <span style={{ fontWeight: 700 }}>
                        {c.mode === 'Online' ? 'Online Only' : c.mode === 'Offline' ? 'Offline Only' : 'Online / Offline'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, display: 'block' }}>TUITION FEE</span>
                      <span style={{ fontWeight: 800, color: '#059669', fontSize: '1.05rem' }}>₹{c.fees?.toLocaleString() || 0}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, display: 'block' }}>START DATE</span>
                      <span style={{ fontWeight: 600 }}>{c.start_date || 'Immediate'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                  {isAdmin ? (
                    <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'space-between' }}>
                      <button
                        className={`btn-secondary ${isActive ? 'danger' : 'success'}`}
                        onClick={() => handleToggleStatus(c.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                      >
                        <Power size={14} /> {isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-secondary" onClick={() => openEditModal(c)} style={{ padding: '6px 12px' }}>
                          <Edit size={14} /> Edit
                        </button>
                        <button className="btn-secondary danger" onClick={() => handleDeleteCourse(c.id, c.name)} style={{ padding: '6px 12px' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="btn-primary"
                      onClick={() => openEnrollModal(c)}
                      disabled={!isActive}
                      style={{
                        width: '100%',
                        padding: '10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: isActive ? 'var(--primary-blue)' : '#94a3b8',
                        cursor: isActive ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {isActive ? (
                        <>
                          <Send size={16} /> Enroll & Proceed to Payment
                        </>
                      ) : (
                        'Course Currently Inactive'
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* STUDENT ENROLLMENT & PAYMENT MODAL */}
      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title={`Course Enrollment & Fee Payment`}
        maxWidth="520px"
      >
        {selectedCourse && (
          <form onSubmit={handleConfirmEnrollmentAndPayment}>
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '1.2rem',
              marginBottom: '1.25rem'
            }}>
              <span className="badge" style={{ marginBottom: '4px', display: 'inline-block' }}>{selectedCourse.course_code}</span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '2px 0 6px' }}>{selectedCourse.name}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Course Duration: <strong>{selectedCourse.duration || '6 Months'}</strong></span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>₹{selectedCourse.fees?.toLocaleString()}</span>
              </div>
            </div>

            {/* REQUIREMENT 3: Mode Selection (Online vs Offline) */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Select Learning Mode <span className="required">*</span></label>
              <div className="grid-2-col" style={{ gap: '0.75rem' }}>
                <label style={{
                  border: `2px solid ${enrollData.learning_mode === 'Online' ? '#2563eb' : 'var(--border-color)'}`,
                  background: enrollData.learning_mode === 'Online' ? 'rgba(37,99,235,0.06)' : 'var(--card-bg)',
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}>
                  <input
                    type="radio"
                    name="learning_mode"
                    value="Online"
                    checked={enrollData.learning_mode === 'Online'}
                    onChange={(e) => setEnrollData({ ...enrollData, learning_mode: e.target.value })}
                  />
                  <Laptop size={18} color="#2563eb" /> Online Classes
                </label>

                <label style={{
                  border: `2px solid ${enrollData.learning_mode === 'Offline' ? '#2563eb' : 'var(--border-color)'}`,
                  background: enrollData.learning_mode === 'Offline' ? 'rgba(37,99,235,0.06)' : 'var(--card-bg)',
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}>
                  <input
                    type="radio"
                    name="learning_mode"
                    value="Offline"
                    checked={enrollData.learning_mode === 'Offline'}
                    onChange={(e) => setEnrollData({ ...enrollData, learning_mode: e.target.value })}
                  />
                  <Users size={18} color="#2563eb" /> Offline Campus
                </label>
              </div>
            </div>

            {/* REQUIREMENT 4: Payment Gateway Workflow */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Payment Gateway & Method <span className="required">*</span></label>
              <select
                className="form-control"
                value={enrollData.payment_method}
                onChange={(e) => setEnrollData({ ...enrollData, payment_method: e.target.value })}
              >
                <option value="UPI">UPI / QR Code (GPay, PhonePe, Paytm)</option>
                <option value="Credit Card">Credit / Debit Card (Razorpay / Stripe Gateway)</option>
                <option value="Net Banking">Internet Banking</option>
                <option value="Offline Cash">Counter Cash / Bank Transfer</option>
              </select>
            </div>

            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', padding: '0.85rem', borderRadius: '8px', fontSize: '0.85rem', color: '#065f46', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} style={{ flexShrink: 0 }} />
              <span>Payment status will be verified and marked as <strong>Paid</strong> upon submission.</span>
            </div>

            <div className="modal-footer" style={{ margin: '1.25rem -1.25rem -1.25rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsEnrollModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={enrolling} style={{ padding: '10px 20px' }}>
                {enrolling ? 'Verifying Payment...' : `Pay ₹${selectedCourse.fees?.toLocaleString()} & Complete Enrollment`}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ADMIN ADD COURSE MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Academic Course"
        maxWidth="540px"
      >
        <form onSubmit={handleCreateCourse}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Course Code <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. CS101"
                value={formData.course_code}
                onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Duration</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 6 Months"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Course Name <span className="required">*</span></label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Full Stack Web Development"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tuition Fee (₹) <span className="required">*</span></label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 25000"
                value={formData.fees}
                onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Course Mode</label>
              <select
                className="form-control"
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
              >
                <option value="Both">Both (Online & Offline)</option>
                <option value="Online">Online Only</option>
                <option value="Offline">Offline Only</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description & Syllabus</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Description of the course..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ margin: '1.25rem -1.25rem -1.25rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Course
            </button>
          </div>
        </form>
      </Modal>

      {/* ADMIN EDIT COURSE MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Course: ${selectedCourse?.name}`}
        maxWidth="540px"
      >
        <form onSubmit={handleUpdateCourse}>
          <div className="form-group">
            <label className="form-label">Course Name</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Duration</label>
              <input
                type="text"
                className="form-control"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tuition Fee (₹)</label>
              <input
                type="number"
                className="form-control"
                value={formData.fees}
                onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mode</label>
            <select
              className="form-control"
              value={formData.mode}
              onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
            >
              <option value="Both">Both (Online & Offline)</option>
              <option value="Online">Online Only</option>
              <option value="Offline">Offline Only</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ margin: '1.25rem -1.25rem -1.25rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default CoursesPage;
