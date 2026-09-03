import React, { useEffect, useState, useCallback, useRef } from 'react';
import { authApi } from '../../auth/authApi';
import { useAuth } from '../../auth/AuthContext';
import { uploadApi, notesApi } from '../../services/api';
import './AdminPanel.css';

const BRANCHES = ['electrical', 'electronics', 'common'];
const RESOURCE_TYPES = ['theory', 'assignment', 'lab_manual', 'pyq', 'handwritten', 'info'];

const emptyUploadForm = {
  title: '',
  description: '',
  subject: '',
  branch: 'common',
  year: '1',
  semester: '',
  resourceType: 'theory',
  unit: '',
  tags: '',
};

const formatWatchTime = (ms) => {
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString();
};

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  
  const { websiteStatus, setWebsiteStatus } = useAuth();
  const [statusLoading, setStatusLoading] = useState(false);

  // ─── Uploads tab state ────────────────────────────
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState('');
  const [uploadForm, setUploadForm] = useState(emptyUploadForm);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null); // { type: 'success' | 'error', text }
  const [deletingId, setDeletingId] = useState(null);
  const notesLoadedRef = useRef(false);

  // ─── Reviews tab state ────────────────────────────
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const reviewsLoadedRef = useRef(false);

  const loadAll = useCallback(async () => {
    try {
      const [statsRes, usersRes, logsRes] = await Promise.all([
        authApi.getAdminStats(),
        authApi.getAdminUsers(),
        authApi.getAdminLogs(),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setLogs(logsRes.data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadNotes = useCallback(async () => {
    setNotesLoading(true);
    try {
      const res = await notesApi.list({ limit: 100, sort: '-createdAt' });
      setNotes(res.data || []);
      setNotesError('');
    } catch (err) {
      setNotesError(err.message);
    } finally {
      setNotesLoading(false);
    }
  }, []);

  const loadReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const res = await authApi.getAdminReviews(1, 100);
      setReviews(res.data || []);
      setReviewsError('');
    } catch (err) {
      setReviewsError(err.message);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 60000);
    return () => clearInterval(interval);
  }, [loadAll]);

  useEffect(() => {
    if (tab === 'uploads' && !notesLoadedRef.current) {
      notesLoadedRef.current = true;
      loadNotes();
    }
    if (tab === 'reviews' && !reviewsLoadedRef.current) {
      reviewsLoadedRef.current = true;
      loadReviews();
    }
  }, [tab, loadNotes, loadReviews]);

  const handleUploadFieldChange = (field) => (e) => {
    setUploadForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    if (f && f.type !== 'application/pdf') {
      setUploadMsg({ type: 'error', text: 'Only PDF files are allowed.' });
      setFile(null);
      e.target.value = '';
      return;
    }
    setFile(f);
    setUploadMsg(null);
  };

  const resetUploadForm = () => {
    setUploadForm(emptyUploadForm);
    setFile(null);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadMsg(null);

    if (!file) {
      setUploadMsg({ type: 'error', text: 'Please choose a PDF file to upload.' });
      return;
    }
    if (!uploadForm.title.trim() || !uploadForm.subject.trim()) {
      setUploadMsg({ type: 'error', text: 'Title and subject are required.' });
      return;
    }

    setUploading(true);
    try {
      const metadata = {
        title: uploadForm.title.trim(),
        description: uploadForm.description.trim(),
        subject: uploadForm.subject.trim(),
        branch: uploadForm.branch,
        year: uploadForm.year,
        resourceType: uploadForm.resourceType,
      };
      if (uploadForm.semester) metadata.semester = uploadForm.semester;
      if (uploadForm.unit) metadata.unit = uploadForm.unit;
      if (uploadForm.tags.trim()) {
        metadata.tags = JSON.stringify(
          uploadForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
        );
      }

      await uploadApi.uploadPdf(file, metadata);

      setUploadMsg({ type: 'success', text: 'PDF uploaded successfully.' });
      resetUploadForm();
      loadNotes();
    } catch (err) {
      setUploadMsg({ type: 'error', text: err.message || 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteNote = async (note) => {
    if (!window.confirm(`Delete "${note.title}"? This cannot be undone.`)) return;
    setDeletingId(note._id);
    try {
      await notesApi.delete(note._id, true);
      setNotes((prev) => prev.filter((n) => n._id !== note._id));
    } catch (err) {
      setNotesError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteReview = async (review) => {
    const userName = review.user?.name || review.displayName || 'Anonymous';
    if (!window.confirm(`Delete review from ${userName}? This cannot be undone.`)) return;
    setDeletingReviewId(review._id);
    try {
      await authApi.deleteAdminReview(review._id);
      setReviews((prev) => prev.filter((r) => r._id !== review._id));
    } catch (err) {
      setReviewsError(err.message);
    } finally {
      setDeletingReviewId(null);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete ${user.name}? This will permanently remove their account.`)) return;
    setActionLoading(`delete-${user._id}`);
    try {
      await authApi.deleteAdminUser(user._id);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
    } catch (err) {
      alert(`Error deleting user: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Are you sure you want to make ${user.name} a ${newRole}?`)) return;
    setActionLoading(`role-${user._id}`);
    try {
      const res = await authApi.updateAdminUserRole(user._id, newRole);
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, role: res.data.role } : u)));
    } catch (err) {
      alert(`Error updating role: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear ALL login logs? This cannot be undone.')) return;
    setActionLoading('clear-logs');
    try {
      await authApi.clearAdminLogs();
      setLogs([]);
    } catch (err) {
      alert(`Error clearing logs: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async () => {
    const isLive = websiteStatus === 'LIVE';
    const actionStr = isLive ? 'put the website Under Construction' : 'make the website public (LIVE)';
    if (!window.confirm(`Are you sure you want to ${actionStr}?`)) return;
    
    setStatusLoading(true);
    try {
      const newStatus = isLive ? 'UNDER_CONSTRUCTION' : 'LIVE';
      await authApi.updateSettings(newStatus);
      setWebsiteStatus(newStatus);
    } catch (err) {
      alert(`Error updating status: ${err.message}`);
    } finally {
      setStatusLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(lowerQuery)) ||
      (u.email && u.email.toLowerCase().includes(lowerQuery))
    );
  });

  if (loading) {
    return <div className="admin-wrapper"><p className="admin-loading">Loading admin panel...</p></div>;
  }

  return (
    <div className="admin-wrapper">
      <h1 className="admin-title">Admin Panel</h1>

      {error && <p className="admin-error">{error}</p>}

      <div className="admin-cards">
        <div className="admin-card">
          <span className="admin-card-label">Total Registered Users</span>
          <span className="admin-card-value">{stats?.totalUsers ?? '—'}</span>
        </div>
        <div className="admin-card live">
          <span className="admin-card-label">Live Users (last 5 min)</span>
          <span className="admin-card-value">
            <span className="live-dot" /> {stats?.liveUsers ?? '—'}
          </span>
        </div>
        <div className="admin-card">
          <span className="admin-card-label">Verified Users</span>
          <span className="admin-card-value">{stats?.verifiedUsers ?? '—'}</span>
        </div>
        <div className="admin-card">
          <span className="admin-card-label">Total Watch Time (all users)</span>
          <span className="admin-card-value">{formatWatchTime(stats?.totalWatchTimeMs ?? 0)}</span>
        </div>
      </div>

      <div className="admin-table-wrap" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: '#e2e8f0', margin: '0 0 0.5rem 0' }}>Website Status</h2>
          <p style={{ color: '#a0aec0', margin: 0, fontSize: '0.9rem' }}>
            Current Status: 
            <span style={{ fontWeight: 'bold', marginLeft: '0.5rem', color: websiteStatus === 'LIVE' ? '#4ade80' : '#f97316' }}>
              {websiteStatus === 'LIVE' ? '🟢 Live' : '🟠 Under Construction'}
            </span>
          </p>
        </div>
        <button 
          className="upload-submit-btn" 
          style={{ margin: 0, padding: '0.75rem 1.5rem', width: 'auto', backgroundColor: websiteStatus === 'LIVE' ? '#b91c1c' : '#15803d' }}
          onClick={handleToggleStatus}
          disabled={statusLoading}
        >
          {statusLoading ? 'Updating...' : websiteStatus === 'LIVE' ? 'Put Website Under Construction' : 'Make Website Live'}
        </button>
      </div>

      <div className="admin-table-wrap" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: '#e2e8f0', margin: '0 0 0.5rem 0' }}>Website Status</h2>
          <p style={{ color: '#a0aec0', margin: 0, fontSize: '0.9rem' }}>
            Current Status: 
            <span style={{ fontWeight: 'bold', marginLeft: '0.5rem', color: websiteStatus === 'LIVE' ? '#4ade80' : '#f97316' }}>
              {websiteStatus === 'LIVE' ? '🟢 Live' : '🟠 Under Construction'}
            </span>
          </p>
        </div>
        <button 
          className="upload-submit-btn" 
          style={{ margin: 0, padding: '0.75rem 1.5rem', width: 'auto', backgroundColor: websiteStatus === 'LIVE' ? '#b91c1c' : '#15803d' }}
          onClick={handleToggleStatus}
          disabled={statusLoading}
        >
          {statusLoading ? 'Updating...' : websiteStatus === 'LIVE' ? 'Put Website Under Construction' : 'Make Website Live'}
        </button>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab-btn ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          Users
        </button>
        <button className={`admin-tab-btn ${tab === 'logs' ? 'active' : ''}`} onClick={() => setTab('logs')}>
          Login Logs
        </button>
        <button className={`admin-tab-btn ${tab === 'uploads' ? 'active' : ''}`} onClick={() => setTab('uploads')}>
          Uploads
        </button>
        <button className={`admin-tab-btn ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>
          Reviews
        </button>
      </div>

      {tab === 'users' && (
        <div className="admin-table-wrap">
          <div className="admin-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 1rem' }}>
            <h2 className="upload-form-title" style={{ margin: 0 }}>Users ({filteredUsers.length})</h2>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search-input"
              style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #cbd5e1', width: '300px' }}
            />
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Provider</th>
                <th>Verified</th>
                <th>Logins</th>
                <th>Watch Time</th>
                <th>Last Active</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u._id}>
                  <td>
                    {u.isLive ? <span className="badge live-badge">Live</span> : <span className="badge">Offline</span>}
                  </td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    {u.role === 'admin' ? <span className="badge" style={{backgroundColor: '#4f46e5', color: 'white'}}>Admin</span> : 'User'}
                  </td>
                  <td>{u.provider}</td>
                  <td>{u.emailVerified ? 'Yes' : 'No'}</td>
                  <td>{u.loginCount || 0}</td>
                  <td>{formatWatchTime(u.totalWatchTimeMs || 0)}</td>
                  <td>{formatDate(u.lastActiveAt)}</td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="admin-action-btn"
                      style={{ padding: '4px 8px', fontSize: '0.8rem', backgroundColor: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      onClick={() => handleToggleRole(u)}
                      disabled={actionLoading === `role-${u._id}`}
                    >
                      {actionLoading === `role-${u._id}` ? '...' : (u.role === 'admin' ? 'Remove Admin' : 'Make Admin')}
                    </button>
                    <button
                      type="button"
                      className="delete-note-btn"
                      style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                      onClick={() => handleDeleteUser(u)}
                      disabled={actionLoading === `delete-${u._id}`}
                    >
                      {actionLoading === `delete-${u._id}` ? '...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan={11} className="admin-empty">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'logs' && (
        <div className="admin-table-wrap">
          <div className="admin-table-header" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', padding: '0 1rem' }}>
            <button
              type="button"
              className="delete-note-btn"
              onClick={handleClearLogs}
              disabled={actionLoading === 'clear-logs'}
            >
              {actionLoading === 'clear-logs' ? 'Clearing...' : 'Clear All Logs'}
            </button>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Provider</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l._id}>
                  <td>{l.name}</td>
                  <td>{l.email}</td>
                  <td>{l.provider}</td>
                  <td>{formatDate(l.createdAt)}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={4} className="admin-empty">No login activity yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'uploads' && (
        <div className="admin-uploads">
          <form className="upload-form" onSubmit={handleUploadSubmit}>
            <h2 className="upload-form-title">Upload New PDF</h2>

            <div className="upload-field file-field">
              <label htmlFor="pdf-file">PDF File *</label>
              <input
                id="pdf-file"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
              />
              {file && <span className="file-chosen">{file.name}</span>}
            </div>

            <div className="upload-grid">
              <div className="upload-field">
                <label htmlFor="title">Title *</label>
                <input
                  id="title"
                  type="text"
                  value={uploadForm.title}
                  onChange={handleUploadFieldChange('title')}
                  placeholder="e.g. Unit 3 - Digital Electronics Notes"
                />
              </div>

              <div className="upload-field">
                <label htmlFor="subject">Subject *</label>
                <input
                  id="subject"
                  type="text"
                  value={uploadForm.subject}
                  onChange={handleUploadFieldChange('subject')}
                  placeholder="e.g. DIGITAL ELECTRONICS"
                />
              </div>

              <div className="upload-field">
                <label htmlFor="branch">Branch</label>
                <select id="branch" value={uploadForm.branch} onChange={handleUploadFieldChange('branch')}>
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="upload-field">
                <label htmlFor="resourceType">Resource Type</label>
                <select id="resourceType" value={uploadForm.resourceType} onChange={handleUploadFieldChange('resourceType')}>
                  {RESOURCE_TYPES.map((r) => (
                    <option key={r} value={r}>{r.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div className="upload-field">
                <label htmlFor="year">Year</label>
                <select id="year" value={uploadForm.year} onChange={handleUploadFieldChange('year')}>
                  {[1, 2, 3, 4].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div className="upload-field">
                <label htmlFor="semester">Semester</label>
                <input
                  id="semester"
                  type="number"
                  min="1"
                  max="8"
                  value={uploadForm.semester}
                  onChange={handleUploadFieldChange('semester')}
                  placeholder="Optional"
                />
              </div>

              <div className="upload-field">
                <label htmlFor="unit">Unit</label>
                <input
                  id="unit"
                  type="number"
                  min="1"
                  max="10"
                  value={uploadForm.unit}
                  onChange={handleUploadFieldChange('unit')}
                  placeholder="Optional"
                />
              </div>

              <div className="upload-field">
                <label htmlFor="tags">Tags</label>
                <input
                  id="tags"
                  type="text"
                  value={uploadForm.tags}
                  onChange={handleUploadFieldChange('tags')}
                  placeholder="Comma separated, optional"
                />
              </div>
            </div>

            <div className="upload-field">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                rows={3}
                value={uploadForm.description}
                onChange={handleUploadFieldChange('description')}
                placeholder="Optional short description"
              />
            </div>

            {uploadMsg && (
              <p className={`upload-msg ${uploadMsg.type}`}>{uploadMsg.text}</p>
            )}

            <div className="upload-actions">
              <button type="submit" className="upload-submit-btn" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload PDF'}
              </button>
              <button type="button" className="upload-reset-btn" onClick={resetUploadForm} disabled={uploading}>
                Clear
              </button>
            </div>
          </form>

          <div className="upload-list-section">
            <div className="upload-list-header">
              <h2 className="upload-form-title">Uploaded Notes ({notes.length})</h2>
              <button type="button" className="upload-reset-btn" onClick={() => { notesLoadedRef.current = true; loadNotes(); }} disabled={notesLoading}>
                Refresh
              </button>
            </div>

            {notesError && <p className="admin-error">{notesError}</p>}

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Subject</th>
                    <th>Branch</th>
                    <th>Year</th>
                    <th>Type</th>
                    <th>Views</th>
                    <th>Uploaded</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {notes.map((n) => (
                    <tr key={n._id}>
                      <td>{n.title}</td>
                      <td>{n.subject}</td>
                      <td>{n.branch}</td>
                      <td>{n.year}</td>
                      <td>{n.resourceType}</td>
                      <td>{n.viewCount || 0}</td>
                      <td>{formatDate(n.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="delete-note-btn"
                          onClick={() => handleDeleteNote(n)}
                          disabled={deletingId === n._id}
                        >
                          {deletingId === n._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!notesLoading && notes.length === 0 && (
                    <tr><td colSpan={8} className="admin-empty">No notes uploaded yet</td></tr>
                  )}
                  {notesLoading && (
                    <tr><td colSpan={8} className="admin-empty">Loading notes...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'reviews' && (
        <div className="admin-table-wrap">
          {reviewsError && <p className="admin-error" style={{ margin: '1rem' }}>{reviewsError}</p>}
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Rating</th>
                <th>Content</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r._id}>
                  <td>{r.user?.name || r.displayName || 'Anonymous'}</td>
                  <td>{r.user?.email || '—'}</td>
                  <td style={{ color: '#c89b63' }}>{'★'.repeat(r.rating) + '☆'.repeat(5 - r.rating)}</td>
                  <td style={{ maxWidth: '300px', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.4' }}>{r.content}</td>
                  <td>{formatDate(r.createdAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="delete-note-btn"
                      onClick={() => handleDeleteReview(r)}
                      disabled={deletingReviewId === r._id}
                    >
                      {deletingReviewId === r._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
              {!reviewsLoading && reviews.length === 0 && (
                <tr><td colSpan={6} className="admin-empty">No reviews found</td></tr>
              )}
              {reviewsLoading && (
                <tr><td colSpan={6} className="admin-empty">Loading reviews...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}