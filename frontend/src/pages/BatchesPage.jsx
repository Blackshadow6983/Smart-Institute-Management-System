import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { Layers, Plus, Edit, CheckCircle2, AlertCircle, Clock, GraduationCap, BookOpen, Trash2 } from 'lucide-react';

export function BatchesPage() {
  const { user } = useAuth();
  const role = (user?.role || '').toLowerCase();
  const canManage = ['admin', 'institute', 'institute_admin', 'faculty', 'staff'].includes(role);

  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    course: '',
    timing: '',
    faculty: ''
  });

  const loadBatchesCoursesAndFaculty = async () => {
    setLoading(true);
    setError('');
    try {
      const [batchData, courseData, facultyData] = await Promise.allSettled([
        api.getAllBatches(),
        api.getAllCourses(),
        api.getAllFaculty()
      ]);

      if (batchData.status === 'fulfilled') {
        setBatches(Array.isArray(batchData.value) ? batchData.value : []);
      }
      if (courseData.status === 'fulfilled') {
        setCourses(Array.isArray(courseData.value) ? courseData.value : []);
      }
      if (facultyData.status === 'fulfilled') {
        setFacultyList(Array.isArray(facultyData.value) ? facultyData.value : []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load batch data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatchesCoursesAndFaculty();
  }, []);

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.createBatch(formData);
      setSuccess(`Batch "${formData.name}" created successfully!`);
      setIsAddModalOpen(false);
      setFormData({ name: '', course: '', timing: '', faculty: '' });
      loadBatchesCoursesAndFaculty();
    } catch (err) {
      setError(err.message || 'Error creating batch.');
    }
  };

  const handleUpdateBatch = async (e) => {
    e.preventDefault();
    if (!selectedBatch) return;
    setError('');
    setSuccess('');
    try {
      await api.updateBatch(selectedBatch.id, formData);
      setSuccess(`Batch "${selectedBatch.name}" updated successfully.`);
      setIsEditModalOpen(false);
      loadBatchesCoursesAndFaculty();
    } catch (err) {
      setError(err.message || 'Error updating batch.');
    }
  };

  const openEditModal = (b) => {
    setSelectedBatch(b);
    setFormData({
      name: b.name || '',
      course: b.course || '',
      timing: b.timing || '',
      faculty: b.faculty || ''
    });
    setIsEditModalOpen(true);
  };

  const filteredBatches = batches.filter((b) => {
    const q = search.toLowerCase();
    return (
      (b.name && b.name.toLowerCase().includes(q)) ||
      (b.course && b.course.toLowerCase().includes(q)) ||
      (b.faculty && b.faculty.toLowerCase().includes(q)) ||
      (b.timing && b.timing.toLowerCase().includes(q))
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

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <Layers size={18} />
            Academic Batches & Schedules
          </h2>
          {canManage && (
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={14} />
              Create New Batch
            </button>
          )}
        </div>

        <div className="card-body" style={{ paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search batches by name, course, faculty, or timing..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing <strong>{filteredBatches.length}</strong> of <strong>{batches.length}</strong> batches
            </div>
          </div>

          {loading ? (
            <LoadingSpinner message="Loading batch schedules..." />
          ) : filteredBatches.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No batches found"
              description={search ? 'No batches match your search criteria.' : 'No active cohorts or batches registered.'}
            />
          ) : (
            <div className="table-container">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Batch ID</th>
                    <th>Batch Name</th>
                    <th>Associated Course</th>
                    <th>Class Schedule / Timing</th>
                    <th>Assigned Faculty</th>
                    {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredBatches.map((b) => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{b.id}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>{b.name}</div>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <BookOpen size={13} color="var(--primary-blue)" />
                          {b.course || 'Unassigned'}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <Clock size={13} color="var(--text-muted)" />
                          {b.timing || 'TBD'}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <GraduationCap size={13} color="var(--text-muted)" />
                          {b.faculty || 'Unassigned'}
                        </span>
                      </td>
                      {canManage && (
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px' }}
                            onClick={() => openEditModal(b)}
                            title="Edit Batch"
                          >
                            <Edit size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Batch Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Academic Batch"
        maxWidth="500px"
      >
        <form onSubmit={handleCreateBatch}>
          <div className="form-group">
            <label className="form-label">Batch Name <span className="required">*</span></label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Batch 2026-A (Morning)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Associated Course</label>
            {courses.length > 0 ? (
              <select
                className="form-control"
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              >
                <option value="">Select a course or type custom</option>
                {courses.map((c) => (
                  <option key={c.id || c.course_code} value={c.title || c.name || c.course_code}>
                    {c.title || c.name} ({c.course_code})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Full Stack Web Development"
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              />
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Class Timing / Schedule</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Mon-Fri 09:00 AM - 12:00 PM"
              value={formData.timing}
              onChange={(e) => setFormData({ ...formData, timing: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Assigned Faculty / Instructor</label>
            {facultyList.length > 0 ? (
              <select
                className="form-control"
                value={formData.faculty}
                onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
              >
                <option value="">Select assigned faculty</option>
                {facultyList.map((f) => (
                  <option key={f.id || f.employee_id} value={f.name || f.employee_id}>
                    {f.name} ({f.department || 'Faculty'})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Dr. A. Sharma"
                value={formData.faculty}
                onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
              />
            )}
          </div>

          <div className="modal-footer" style={{ margin: '1rem -1.25rem -1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Batch
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Batch Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Batch: ${selectedBatch?.name}`}
        maxWidth="500px"
      >
        <form onSubmit={handleUpdateBatch}>
          <div className="form-group">
            <label className="form-label">Batch Name</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Associated Course</label>
            <input
              type="text"
              className="form-control"
              value={formData.course}
              onChange={(e) => setFormData({ ...formData, course: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Class Timing / Schedule</label>
            <input
              type="text"
              className="form-control"
              value={formData.timing}
              onChange={(e) => setFormData({ ...formData, timing: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Assigned Faculty</label>
            <input
              type="text"
              className="form-control"
              value={formData.faculty}
              onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
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
