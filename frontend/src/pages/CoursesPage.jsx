import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { BookOpen, Plus, Search, Edit, Send, CheckCircle2, AlertCircle, Clock, IndianRupee, Building2 } from 'lucide-react';

export function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Form Data
  const [formData, setFormData] = useState({
    course_code: '',
    name: '',
    description: '',
    duration: '1 Year',
    fees: 25000
  });

  const loadCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getAllCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load courses.');
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
        fees: formData.fees ? parseFloat(formData.fees) : 0
      });
      setSuccess(`Course ${formData.course_code} successfully created!`);
      setIsAddModalOpen(false);
      setFormData({ course_code: '', name: '', description: '', duration: '1 Year', fees: 25000 });
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
      await api.updateCourse(selectedCourse.course_code, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        duration: formData.duration,
        fees: formData.fees ? parseFloat(formData.fees) : 0
      });
      setSuccess(`Course ${selectedCourse.course_code} updated.`);
      setIsEditModalOpen(false);
      loadCourses();
    } catch (err) {
      setError(err.message || 'Error updating course.');
    }
  };

  const handleApplyCourse = async (course) => {
    setError('');
    setSuccess('');
    try {
      await api.applyCourse(course.id);
      setSuccess(`Course application for ${course.name} (${course.course_code}) submitted successfully!`);
    } catch (err) {
      setError(err.message || 'Failed to submit application.');
    }
  };

  const openEditModal = (c) => {
    setSelectedCourse(c);
    setFormData({
      course_code: c.course_code,
      name: c.name || '',
      description: c.description || '',
      duration: c.duration || '1 Year',
      fees: c.fees !== null && c.fees !== undefined ? c.fees : 0
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
          <h2 className="card-title">
            <BookOpen size={18} />
            Institutional Academic Curriculum & Courses ({user?.institute_code || 'All'})
          </h2>
          {isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={14} />
              Add New Course
            </button>
          )}
        </div>

        <div className="card-body" style={{ paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search courses by code, title, duration, or syllabus..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing <strong>{filteredCourses.length}</strong> of <strong>{courses.length}</strong> curriculum programs
            </div>
          </div>

          {loading ? (
            <LoadingSpinner message="Loading courses syllabus..." />
          ) : filteredCourses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No courses found"
              description={search ? 'No curriculum programs match your search.' : 'No academic courses currently registered.'}
            />
          ) : (
            <div className="table-container">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Course Title</th>
                    <th>Duration</th>
                    <th>Tuition Fees</th>
                    <th>Description</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((c) => (
                    <tr key={c.id || c.course_code}>
                      <td style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>{c.course_code}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'rgba(37,99,235,0.06)',
                          color: 'var(--primary-blue)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 600,
                          fontSize: '12px'
                        }}>
                          <Clock size={12} />
                          {c.duration || '1 Year'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: '#065f46' }}>
                        {c.fees !== null && c.fees !== undefined ? `₹${parseFloat(c.fees).toLocaleString()}` : '—'}
                      </td>
                      <td style={{ maxWidth: '280px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        {c.description || 'Institutional syllabus module'}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {role === 'student' && (
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ padding: '3px 9px', marginRight: '4px', fontSize: '11.5px' }}
                            onClick={() => handleApplyCourse(c)}
                            title="Apply for Enrollment"
                          >
                            <Send size={12} /> Apply
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 7px' }}
                            onClick={() => openEditModal(c)}
                            title="Edit Course"
                          >
                            <Edit size={13} />
                          </button>
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

      {/* Add Course Modal */}
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
                placeholder="e.g. CS101, AI200, or WD100"
                value={formData.course_code}
                onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Duration <span className="required">*</span></label>
              <select
                className="form-control"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
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

          <div className="form-group">
            <label className="form-label">Course Name <span className="required">*</span></label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Applied Artificial Intelligence & Machine Learning"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tuition Fees (₹) <span className="required">*</span></label>
            <input
              type="number"
              className="form-control"
              placeholder="e.g. 35000"
              value={formData.fees}
              onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Syllabus Overview</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Summary of modules, syllabus topics, and learning objectives..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ margin: '1rem -1.25rem -1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Course
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Course Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Course: ${selectedCourse?.course_code}`}
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
              <select
                className="form-control"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              >
                <option value="3 Months">3 Months</option>
                <option value="6 Months">6 Months</option>
                <option value="1 Year">1 Year</option>
                <option value="2 Years">2 Years</option>
                <option value="3 Years">3 Years</option>
                <option value="4 Years">4 Years</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tuition Fees (₹)</label>
              <input
                type="number"
                className="form-control"
                value={formData.fees}
                onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description / Syllabus</label>
            <textarea
              className="form-control"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ margin: '1rem -1.25rem -1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
