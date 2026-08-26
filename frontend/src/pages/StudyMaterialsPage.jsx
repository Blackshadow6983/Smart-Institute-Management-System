import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import {
  BookOpen,
  Upload,
  FileText,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Search,
  FileType,
  Layers
} from 'lucide-react';

export function StudyMaterialsPage() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    course_id: '',
    batch_id: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const role = (user?.role || 'student').trim().toLowerCase();
  const isAdmin = ['admin', 'institute', 'institute_admin'].includes(role);
  const isStaff = ['faculty', 'staff'].includes(role);
  const canUpload = isAdmin || isStaff;

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [matList, courseList, batchList] = await Promise.allSettled([
        api.getStudyMaterials(),
        api.getAllCourses(),
        api.getAllBatches()
      ]);

      if (matList.status === 'fulfilled') setMaterials(Array.isArray(matList.value) ? matList.value : []);
      if (courseList.status === 'fulfilled') setCourses(Array.isArray(courseList.value) ? courseList.value : []);
      if (batchList.status === 'fulfilled') setBatches(Array.isArray(batchList.value) ? batchList.value : []);
    } catch (err) {
      setError(err.message || 'Error loading study materials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadForm.title.trim()) {
      setError('Material title is required.');
      return;
    }
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    try {
      const formData = new FormData();
      formData.append('title', uploadForm.title.trim());
      if (uploadForm.description) formData.append('description', uploadForm.description.trim());
      if (uploadForm.course_id) formData.append('course_id', uploadForm.course_id);
      if (uploadForm.batch_id) formData.append('batch_id', uploadForm.batch_id);
      formData.append('file', selectedFile);

      const res = await api.uploadStudyMaterial(formData);
      setSuccess(res.message || 'Study material uploaded successfully!');
      setIsUploadModalOpen(false);
      setUploadForm({ title: '', description: '', course_id: '', batch_id: '' });
      setSelectedFile(null);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to upload study material.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = async (materialId, materialTitle) => {
    if (!window.confirm(`Are you sure you want to delete '${materialTitle}'?`)) return;
    setError('');
    setSuccess('');
    try {
      const res = await api.deleteStudyMaterial(materialId);
      setSuccess(res.message || 'Material deleted.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete material.');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredMaterials = materials.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      (m.title && m.title.toLowerCase().includes(q)) ||
      (m.description && m.description.toLowerCase().includes(q)) ||
      (m.course_name && m.course_name.toLowerCase().includes(q)) ||
      (m.file_name && m.file_name.toLowerCase().includes(q));

    const matchCourse = selectedCourseFilter ? m.course_id === parseInt(selectedCourseFilter) : true;
    return matchQuery && matchCourse;
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
              <BookOpen size={28} color="#60a5fa" />
              {canUpload ? 'Study Materials & Academic Documents' : 'My Course Study Materials'}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '4px 0 0' }}>
              {canUpload ? 'Upload, manage, and share educational lecture slides, reference documents, and study notes.' : 'Access and download authorized lecture notes, presentations, and study guides for your enrolled courses.'}
            </p>
          </div>

          {canUpload && (
            <button className="btn-primary" onClick={() => setIsUploadModalOpen(true)} style={{ padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={18} /> Upload Study Material
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card-container" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '36px' }}
              placeholder="Search by title, course, or filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name || c.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Materials List / Grid */}
      {loading ? (
        <LoadingSpinner message="Loading study materials..." />
      ) : filteredMaterials.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No study materials found"
          description={canUpload ? "Click 'Upload Study Material' to upload your first lecture slide or reference PDF." : "No study materials available for your course at this moment."}
        />
      ) : (
        <div className="grid-2-col" style={{ gap: '1.25rem' }}>
          {filteredMaterials.map((m) => {
            const downloadUrl = api.getStudyMaterialDownloadUrl(m.id);
            const isOwnerOrAdmin = isAdmin || (isStaff && m.uploaded_by === user?.username);

            return (
              <div key={m.id} className="card-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid var(--primary-blue)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-blue)' }}>
                        <FileType size={22} />
                      </div>
                      <div>
                        <span className="badge info" style={{ fontSize: '11px', marginBottom: '2px' }}>
                          {m.file_type || 'PDF'}
                        </span>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--primary-navy)' }}>
                          {m.title}
                        </h3>
                      </div>
                    </div>

                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: '4px' }}>
                      {formatFileSize(m.file_size)}
                    </span>
                  </div>

                  {m.description && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 1rem', lineHeight: '1.4' }}>
                      {m.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                    {m.course_name && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eff6ff', color: '#1e40af', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                        <BookOpen size={12} /> {m.course_name}
                      </span>
                    )}
                    {m.batch_name && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f0fdf4', color: '#166534', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                        <Layers size={12} /> Batch: {m.batch_name}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div>
                    Uploaded by <strong>{m.uploaded_by}</strong>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                      style={{ textDecoration: 'none', padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Download size={14} /> Download
                    </a>
                    {isOwnerOrAdmin && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleDeleteMaterial(m.id, m.title)}
                        style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#ef4444', borderColor: '#fecaca' }}
                        title="Delete Material"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* UPLOAD STUDY MATERIAL MODAL */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Study Material"
        maxWidth="500px"
      >
        <form onSubmit={handleUploadSubmit}>
          <div className="form-group">
            <label className="form-label">Material Title <span className="required">*</span></label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Unit 1 - Introduction to Machine Learning"
              value={uploadForm.title}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Course / Subject</label>
            <select
              className="form-control"
              value={uploadForm.course_id}
              onChange={(e) => setUploadForm({ ...uploadForm, course_id: e.target.value })}
            >
              <option value="">General (All Enrolled Students)</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name || c.title}</option>
              ))}
            </select>
          </div>


          <div className="form-group">
            <label className="form-label">Target Batch (Optional)</label>
            <select
              className="form-control"
              value={uploadForm.batch_id}
              onChange={(e) => setUploadForm({ ...uploadForm, batch_id: e.target.value })}
            >
              <option value="">All Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description / Topics Covered</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="e.g. Overview of supervised learning, classification, and regression."
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Select File (.PDF, .PPT, .PPTX, .DOC, .DOCX, .TXT) <span className="required">*</span></label>
            <input
              type="file"
              accept=".pdf, .ppt, .pptx, .doc, .docx, .txt"
              className="form-control"
              onChange={(e) => setSelectedFile(e.target.files[0] || null)}
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Maximum file size allowed: 25 MB
            </span>
          </div>

          <div className="modal-footer" style={{ margin: '1.25rem -1.25rem -1.25rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={uploading || !selectedFile}>
              {uploading ? 'Uploading...' : 'Upload Material'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default StudyMaterialsPage;
