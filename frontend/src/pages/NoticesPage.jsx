import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import {
  Bell,
  Plus,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Megaphone,
  Send,
  MessageSquare,
  MessageSquarePlus,
  Tag,
  Clock,
  Filter,
  CheckSquare,
  Search,
  User,
  ShieldCheck
} from 'lucide-react';

export function NoticesPage() {
  const { user } = useAuth();
  const role = (user?.role || 'student').toLowerCase();
  const isAdmin = ['admin', 'institute', 'institute_admin'].includes(role);
  const canPostNotice = ['admin', 'institute', 'institute_admin', 'faculty', 'staff'].includes(role);

  // Active Tab: 'notices' or 'suggestions'
  const [activeTab, setActiveTab] = useState('notices');

  // Notices State
  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [noticeSearch, setNoticeSearch] = useState('');
  const [isAddNoticeModalOpen, setIsAddNoticeModalOpen] = useState(false);
  const [noticeFormData, setNoticeFormData] = useState({ title: '', message: '' });

  // Suggestions State
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [suggestionFilterStatus, setSuggestionFilterStatus] = useState('ALL');
  const [suggestionSearch, setSuggestionSearch] = useState('');
  const [isAddSuggestionModalOpen, setIsAddSuggestionModalOpen] = useState(false);
  const [suggestionFormData, setSuggestionFormData] = useState({
    title: '',
    category: 'Academic',
    message: ''
  });

  // Admin Response Modal
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [responseFormData, setResponseFormData] = useState({
    status: 'Reviewed',
    admin_response: ''
  });

  // Alerts
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load Notices
  const loadNotices = async () => {
    setLoadingNotices(true);
    try {
      const data = await api.getNotices();
      setNotices(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load circulars.');
    } finally {
      setLoadingNotices(false);
    }
  };

  // Load Suggestions
  const loadSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const data = await api.getSuggestions();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load suggestions.');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    loadNotices();
    loadSuggestions();
  }, []);

  // Handlers for Notices
  const handleCreateNotice = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.createNotice(noticeFormData);
      setSuccess('Official notice published successfully!');
      setIsAddNoticeModalOpen(false);
      setNoticeFormData({ title: '', message: '' });
      loadNotices();
    } catch (err) {
      setError(err.message || 'Error publishing notice.');
    }
  };

  // Handlers for Suggestions
  const handleCreateSuggestion = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.createSuggestion(suggestionFormData);
      setSuccess('Your suggestion has been submitted successfully to administration!');
      setIsAddSuggestionModalOpen(false);
      setSuggestionFormData({ title: '', category: 'Academic', message: '' });
      loadSuggestions();
    } catch (err) {
      setError(err.message || 'Error submitting suggestion.');
    }
  };

  // Admin Response Handler
  const openResponseModal = (sug) => {
    setSelectedSuggestion(sug);
    setResponseFormData({
      status: sug.status || 'Reviewed',
      admin_response: sug.admin_response || ''
    });
    setIsResponseModalOpen(true);
  };

  const handleUpdateSuggestionStatus = async (e) => {
    e.preventDefault();
    if (!selectedSuggestion) return;
    setError('');
    setSuccess('');
    try {
      await api.updateSuggestionStatus(selectedSuggestion.id, responseFormData);
      setSuccess(`Suggestion #${selectedSuggestion.id} updated successfully!`);
      setIsResponseModalOpen(false);
      loadSuggestions();
    } catch (err) {
      setError(err.message || 'Error updating suggestion status.');
    }
  };

  // Filtered Notices
  const filteredNotices = notices.filter(n => {
    const q = noticeSearch.toLowerCase();
    return (
      (n.title && n.title.toLowerCase().includes(q)) ||
      (n.message && n.message.toLowerCase().includes(q))
    );
  });

  // Filtered Suggestions
  const filteredSuggestions = suggestions.filter(s => {
    const matchesSearch =
      !suggestionSearch ||
      (s.title && s.title.toLowerCase().includes(suggestionSearch.toLowerCase())) ||
      (s.message && s.message.toLowerCase().includes(suggestionSearch.toLowerCase())) ||
      (s.category && s.category.toLowerCase().includes(suggestionSearch.toLowerCase()));

    const matchesStatus =
      suggestionFilterStatus === 'ALL' ||
      (s.status || '').toUpperCase() === suggestionFilterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'resolved':
        return 'badge-success';
      case 'reviewed':
        return 'badge-info';
      default:
        return 'badge-warning';
    }
  };

  return (
    <div>
      {/* Alert Banner */}
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

      {/* Main Container */}
      <div className="card">
        {/* Header with Navigation Tabs */}
        <div className="card-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 className="card-title" style={{ margin: 0 }}>
              <Bell size={20} color="var(--primary-blue)" />
              Institute Communication & Feedback Portal
            </h2>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {activeTab === 'notices' && canPostNotice && (
                <button className="btn btn-primary btn-sm" onClick={() => setIsAddNoticeModalOpen(true)}>
                  <Plus size={14} />
                  Publish Circular
                </button>
              )}

              {activeTab === 'suggestions' && (
                <button className="btn btn-primary btn-sm" onClick={() => setIsAddSuggestionModalOpen(true)}>
                  <MessageSquarePlus size={14} />
                  Submit Suggestion
                </button>
              )}
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '1.5rem' }}>
            <button
              onClick={() => setActiveTab('notices')}
              style={{
                padding: '0.6rem 0.2rem',
                border: 'none',
                background: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: activeTab === 'notices' ? 'var(--primary-blue)' : 'var(--text-muted)',
                borderBottom: activeTab === 'notices' ? '3px solid var(--primary-blue)' : '3px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Megaphone size={16} />
              Official Circulars ({notices.length})
            </button>

            <button
              onClick={() => setActiveTab('suggestions')}
              style={{
                padding: '0.6rem 0.2rem',
                border: 'none',
                background: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: activeTab === 'suggestions' ? 'var(--primary-blue)' : 'var(--text-muted)',
                borderBottom: activeTab === 'suggestions' ? '3px solid var(--primary-blue)' : '3px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <MessageSquare size={16} />
              Suggestion & Feedback Box ({suggestions.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Official Notices */}
        {activeTab === 'notices' && (
          <div className="card-body">
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search notices by subject or content..."
                  value={noticeSearch}
                  onChange={(e) => setNoticeSearch(e.target.value)}
                />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Showing <strong>{filteredNotices.length}</strong> circulars
              </div>
            </div>

            {loadingNotices ? (
              <LoadingSpinner message="Fetching circulars & notices..." />
            ) : filteredNotices.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="No active circulars"
                description={noticeSearch ? 'No notices match your search.' : 'There are currently no official administrative notices posted.'}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredNotices.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.25rem',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge badge-info" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Megaphone size={11} /> Official Circular
                        </span>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-navy)', margin: 0 }}>
                          {n.title}
                        </h3>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} />
                        {n.created_at ? new Date(n.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Institutional Post'}
                      </span>
                    </div>

                    <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                      {n.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Suggestions & Feedback */}
        {activeTab === 'suggestions' && (
          <div className="card-body">
            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search suggestions by title, category, or detail..."
                  value={suggestionSearch}
                  onChange={(e) => setSuggestionSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Filter size={14} color="var(--text-muted)" />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
                <select
                  className="form-control"
                  style={{ width: 'auto', padding: '5px 10px', fontSize: '13px' }}
                  value={suggestionFilterStatus}
                  onChange={(e) => setSuggestionFilterStatus(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="REVIEWED">Reviewed</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
            </div>

            {loadingSuggestions ? (
              <LoadingSpinner message="Loading suggestions & feedback..." />
            ) : filteredSuggestions.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No suggestions found"
                description={
                  suggestionSearch || suggestionFilterStatus !== 'ALL'
                    ? 'No suggestions match your filter criteria.'
                    : 'No suggestions or feedback have been submitted yet. Be the first to submit!'
                }
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredSuggestions.map((sug) => (
                  <div
                    key={sug.id}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.25rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <span className={`badge ${getStatusBadgeClass(sug.status)}`} style={{ fontSize: '11px' }}>
                            {sug.status || 'Pending'}
                          </span>
                          <span className="badge badge-secondary" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Tag size={11} /> {sug.category || 'General'}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <User size={12} /> {sug.user_name || 'Anonymous Learner'} ({sug.user_role || 'user'})
                          </span>
                        </div>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-navy)', margin: 0 }}>
                          {sug.title}
                        </h3>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} />
                          {sug.created_at ? new Date(sug.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                        {isAdmin && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '12px' }}
                            onClick={() => openResponseModal(sug)}
                          >
                            <ShieldCheck size={13} style={{ marginRight: 3 }} />
                            Review / Reply
                          </button>
                        )}
                      </div>
                    </div>

                    <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 0.75rem', whiteSpace: 'pre-wrap' }}>
                      {sug.message}
                    </p>

                    {/* Admin Response Box */}
                    {sug.admin_response && (
                      <div
                        style={{
                          background: 'rgba(37,99,235,0.04)',
                          borderLeft: '3px solid var(--primary-blue)',
                          padding: '10px 14px',
                          borderRadius: '0 6px 6px 0',
                          marginTop: '0.75rem'
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-blue)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldCheck size={13} /> Administration Response:
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                          {sug.admin_response}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Publish Notice */}
      <Modal
        isOpen={isAddNoticeModalOpen}
        onClose={() => setIsAddNoticeModalOpen(false)}
        title="Publish Official Notice / Circular"
        maxWidth="520px"
      >
        <form onSubmit={handleCreateNotice}>
          <div className="form-group">
            <label className="form-label">Notice Title / Subject <span className="required">*</span></label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Schedule for Upcoming Term Assessment"
              value={noticeFormData.title}
              onChange={(e) => setNoticeFormData({ ...noticeFormData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notice Message / Circular Body <span className="required">*</span></label>
            <textarea
              className="form-control"
              rows={5}
              placeholder="Enter full announcement details here..."
              value={noticeFormData.message}
              onChange={(e) => setNoticeFormData({ ...noticeFormData, message: e.target.value })}
              required
            />
          </div>

          <div className="modal-footer" style={{ margin: '1rem -1.25rem -1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddNoticeModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Send size={13} />
              Publish Notice
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Submit Suggestion */}
      <Modal
        isOpen={isAddSuggestionModalOpen}
        onClose={() => setIsAddSuggestionModalOpen(false)}
        title="Submit Suggestion or Feedback"
        maxWidth="520px"
      >
        <form onSubmit={handleCreateSuggestion}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-control"
              value={suggestionFormData.category}
              onChange={(e) => setSuggestionFormData({ ...suggestionFormData, category: e.target.value })}
            >
              <option value="Academic">Academic & Curriculum</option>
              <option value="Infrastructure">Infrastructure & Labs</option>
              <option value="Facilities">Campus & Facilities</option>
              <option value="Administration">Administration & Fees</option>
              <option value="General">General Feedback</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Suggestion Subject / Title <span className="required">*</span></label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Request for additional lab practice hours"
              value={suggestionFormData.title}
              onChange={(e) => setSuggestionFormData({ ...suggestionFormData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Feedback / Suggestion Description <span className="required">*</span></label>
            <textarea
              className="form-control"
              rows={5}
              placeholder="Provide constructve details or suggestions for improvement..."
              value={suggestionFormData.message}
              onChange={(e) => setSuggestionFormData({ ...suggestionFormData, message: e.target.value })}
              required
            />
          </div>

          <div className="modal-footer" style={{ margin: '1rem -1.25rem -1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddSuggestionModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Send size={13} />
              Submit Suggestion
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Admin Response / Status Update */}
      <Modal
        isOpen={isResponseModalOpen}
        onClose={() => setIsResponseModalOpen(false)}
        title={`Review Suggestion: "${selectedSuggestion?.title}"`}
        maxWidth="520px"
      >
        <form onSubmit={handleUpdateSuggestionStatus}>
          <div className="form-group">
            <label className="form-label">Update Status</label>
            <select
              className="form-control"
              value={responseFormData.status}
              onChange={(e) => setResponseFormData({ ...responseFormData, status: e.target.value })}
            >
              <option value="Pending">Pending Review</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Resolved">Resolved & Addressed</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Admin Response Note / Action Taken</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Type official reply or steps taken regarding this feedback..."
              value={responseFormData.admin_response}
              onChange={(e) => setResponseFormData({ ...responseFormData, admin_response: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ margin: '1rem -1.25rem -1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsResponseModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <CheckSquare size={13} />
              Save Response & Status
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
