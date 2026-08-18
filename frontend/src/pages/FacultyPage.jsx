import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { GraduationCap, UserPlus, Search, Edit, Eye, CheckCircle2, AlertCircle } from 'lucide-react';

export function FacultyPage() {
  const { user } = useAuth();
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  // Form Data
  const [formData, setFormData] = useState({
    employee_id: '',
    name: '',
    email: '',
    mobile: '',
    address: '',
    qualification: '',
    specialization: '',
    department: ''
  });

  const loadFaculty = async () => {
    setLoading(true);
    setError('');
    try {
      if (user?.role === 'admin') {
        const data = await api.getAllFaculty();
        setFacultyList(Array.isArray(data) ? data : []);
      } else if (user?.role === 'faculty') {
        const res = await api.getFaculty(user.username);
        setFacultyList(res.faculty ? [res.faculty] : []);
      } else {
        setFacultyList([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load faculty roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaculty();
  }, [user]);

  const handleRegisterFaculty = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.registerFaculty(formData);
      setSuccess(`Faculty member ${formData.name} (${formData.employee_id}) successfully registered!`);
      setIsAddModalOpen(false);
      setFormData({
        employee_id: '',
        name: '',
        email: '',
        mobile: '',
        address: '',
        qualification: '',
        specialization: '',
        department: ''
      });
      loadFaculty();
    } catch (err) {
      setError(err.message || 'Error registering faculty member.');
    }
  };

  const handleUpdateFaculty = async (e) => {
    e.preventDefault();
    if (!selectedFaculty) return;
    setError('');
    setSuccess('');
    try {
      await api.updateFaculty(selectedFaculty.employee_id, {
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        address: formData.address,
        qualification: formData.qualification,
        specialization: formData.specialization,
        department: formData.department
      });
      setSuccess(`Faculty record ${selectedFaculty.employee_id} updated.`);
      setIsEditModalOpen(false);
      loadFaculty();
    } catch (err) {
      setError(err.message || 'Error updating faculty record.');
    }
  };

  const openEditModal = (f) => {
    setSelectedFaculty(f);
    setFormData({
      employee_id: f.employee_id,
      name: f.name || '',
      email: f.email || '',
      mobile: f.mobile || '',
      address: f.address || '',
      qualification: f.qualification || '',
      specialization: f.specialization || '',
      department: f.department || ''
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (f) => {
    setSelectedFaculty(f);
    setIsViewModalOpen(true);
  };

  const filteredFaculty = facultyList.filter((f) => {
    const q = search.toLowerCase();
    return (
      (f.name && f.name.toLowerCase().includes(q)) ||
      (f.employee_id && f.employee_id.toLowerCase().includes(q)) ||
      (f.email && f.email.toLowerCase().includes(q)) ||
      (f.department && f.department.toLowerCase().includes(q)) ||
      (f.specialization && f.specialization.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={16} />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <CheckCircle2 size={16} />
          <div>{success}</div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <GraduationCap size={18} />
            Institutional Faculty Directory
          </h2>
          {user?.role === 'admin' && (
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>
              <UserPlus size={14} />
              Register Faculty Member
            </button>
          )}
        </div>

        <div className="card-body" style={{ paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search faculty by name, employee ID, department, or specialization..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing <strong>{filteredFaculty.length}</strong> of <strong>{facultyList.length}</strong> faculty
            </div>
          </div>

          {loading ? (
            <LoadingSpinner message="Fetching faculty staff roster..." />
          ) : filteredFaculty.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No faculty found"
              description={search ? 'No faculty records match your query.' : 'No faculty members registered in directory.'}
            />
          ) : (
            <div className="table-container">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Faculty Name</th>
                    <th>Email Address</th>
                    <th>Mobile</th>
                    <th>Department</th>
                    <th>Specialization</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFaculty.map((f) => (
                    <tr key={f.id || f.employee_id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{f.employee_id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{f.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>{f.qualification || 'Professor'}</div>
                      </td>
                      <td>{f.email}</td>
                      <td>{f.mobile || '—'}</td>
                      <td>{f.department ? <StatusBadge status={f.department} type="info" /> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                      <td>{f.specialization || 'General'}</td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 7px', marginRight: '4px' }}
                          onClick={() => openViewModal(f)}
                          title="View Details"
                        >
                          <Eye size={13} />
                        </button>
                        {(user?.role === 'admin' || user?.username === f.employee_id) && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 7px' }}
                            onClick={() => openEditModal(f)}
                            title="Edit Faculty Record"
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

      {/* Add Faculty Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Faculty Member"
        maxWidth="600px"
      >
        <form onSubmit={handleRegisterFaculty}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Employee ID <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. EMP001"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Full Name <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="Faculty full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email Address <span className="required">*</span></label>
              <input
                type="email"
                className="form-control"
                placeholder="faculty@institute.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile Number <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="Contact mobile"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Login Password for Faculty Account <span className="required">*</span></label>
            <input
              type="text"
              className="form-control"
              placeholder="Set login password (default: faculty123)"
              value={formData.password || 'faculty123'}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Faculty will use Employee ID and this password to log in.
            </span>
          </div>


          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Department</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Computer Science, AI, Maths"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Specialization</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Machine Learning, Cloud Systems"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Highest Qualification</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Ph.D, M.Tech, M.S"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input
                type="text"
                className="form-control"
                placeholder="Office or Residential address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ margin: '1rem -1.25rem -1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register Faculty
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Faculty Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Faculty: ${selectedFaculty?.employee_id}`}
        maxWidth="600px"
      >
        <form onSubmit={handleUpdateFaculty}>
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
              <label className="form-label">Email Address</label>
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
              <label className="form-label">Mobile Number</label>
              <input
                type="text"
                className="form-control"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input
                type="text"
                className="form-control"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Specialization</label>
              <input
                type="text"
                className="form-control"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Qualification</label>
              <input
                type="text"
                className="form-control"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
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

      {/* View Faculty Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Faculty Member Profile"
        maxWidth="500px"
      >
        {selectedFaculty && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Employee ID</span>
                <strong>{selectedFaculty.employee_id}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Full Name</span>
                <strong>{selectedFaculty.name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Email Address</span>
                <span>{selectedFaculty.email}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Contact Mobile</span>
                <span>{selectedFaculty.mobile || 'Not recorded'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Department</span>
                <span>{selectedFaculty.department || 'Not assigned'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Specialization</span>
                <span>{selectedFaculty.specialization || 'General'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Qualification</span>
                <span>{selectedFaculty.qualification || 'Degree'}</span>
              </div>
            </div>
            {selectedFaculty.address && (
              <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)', fontSize: '12.5px' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Address</span>
                <span>{selectedFaculty.address}</span>
              </div>
            )}
            <div className="modal-footer" style={{ margin: '1.25rem -1.25rem -1.25rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsViewModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
