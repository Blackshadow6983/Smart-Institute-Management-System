import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { Bell, Plus, CheckCircle2, AlertCircle, Calendar, Megaphone, Send } from 'lucide-react';

export function NoticesPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Notice Creation Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: ''
  });

  const loadNotices = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getNotices();
      setNotices(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load notices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.createNotice(formData);
      setSuccess('Official notice published to institute board!');
      setIsAddModalOpen(false);
      setFormData({ title: '', message: '' });
      loadNotices();
    } catch (err) {
      setError(err.message || 'Error publishing notice.');
    }
  };

  const canPost = user?.role === 'admin' || user?.role === 'faculty';

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
            <Bell size={18} />
            Institutional Notice Board & Circulars
          </h2>
          {canPost && (
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={14} />
              Publish Circular
            </button>
          )}
        </div>

        <div className="card-body">
          {loading ? (
            <LoadingSpinner message="Fetching circulars..." />
          ) : notices.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No active circulars"
              description="There are currently no official administrative notices posted."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {notices.map((n) => (
                <div
                  key={n.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-info" style={{ fontSize: '11px' }}>
                        <Megaphone size={11} /> Official Circular
                      </span>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary-navy)', margin: 0 }}>
                        {n.title}
                      </h3>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      {n.created_at ? new Date(n.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Institutional Post'}
                    </span>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                    {n.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Notice Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Publish Official Notice / Circular"
        maxWidth="520px"
      >
        <form onSubmit={handleCreateNotice}>
          <div className="form-group">
            <label className="form-label">Notice Subject / Title <span className="required">*</span></label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Mid-Term Examination Schedule Announcement"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notice Details / Message Body <span className="required">*</span></label>
            <textarea
              className="form-control"
              rows={5}
              placeholder="Type the full official institutional circular text here..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
            />
          </div>

          <div className="modal-footer" style={{ margin: '1rem -1.25rem -1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Send size={13} />
              Publish Circular
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
