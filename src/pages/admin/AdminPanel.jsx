import React, { useEffect, useState, useCallback, useRef } from 'react';
import { authApi } from '../../auth/authApi';
import { useAuth } from '../../auth/AuthContext';
import { uploadApi, notesApi, metaApi, subjectsApi, trackingApi } from '../../services/api';
import './AdminPanel.css';
import SubjectManagement from './SubjectManagement';

const BRANCHES_Y1 = ['electrical', 'electronics', 'common'];
const BRANCHES_Y2 = ['cse', 'ds', 'aiml', 'ece', 'elce', 'common'];
const BRANCHES = Array.from(new Set(['cse', 'it', 'me', 'aids', 'ds', 'aiml', 'ece', 'elce', 'electrical', 'electronics', 'common']));
const RESOURCE_TYPES = ['theory', 'assignment', 'lab_manual', 'pyq', 'handwritten', 'syllabus'];

let fileEntryIdCounter = 0;
const makeFileEntry = (file) => ({
  id: `${Date.now()}-${fileEntryIdCounter++}`,
  
  file,
  title: file.name.replace(/\.(pdf|png|jpe?g|webp)$/i, ''),
  year: 1,
  subject: '',
  branch: 'common',
  allowMultipleBranches: false,
  branches: ['common'],
  resourceType: 'theory',
  description: '',
});

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

const LiveTimer = ({ updatedAt, durationMs }) => {
  const [timeLeft, setTimeLeft] = useState(durationMs - (Date.now() - new Date(updatedAt).getTime()));

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      const remaining = durationMs - (Date.now() - new Date(updatedAt).getTime());
      setTimeLeft(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [updatedAt, durationMs, timeLeft]);

  if (timeLeft <= 0) {
    return <span style={{ color: '#4ade80' }}>Reset / Lifted</span>;
  }

  const h = Math.floor(timeLeft / 3600000);
  const m = Math.floor((timeLeft % 3600000) / 60000);
  const s = Math.floor((timeLeft % 60000) / 1000);

  if (h > 0) return <span style={{ color: '#fca5a5', fontVariantNumeric: 'tabular-nums' }}>{h}h {m}m {s}s</span>;
  return <span style={{ color: '#fca5a5', fontVariantNumeric: 'tabular-nums' }}>{m}m {s}s</span>;
};

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all'); // 'all', 'admin', 'coordinator', 'user'
  const [userStatusFilter, setUserStatusFilter] = useState('all'); // 'all', 'live', 'offline'
  const [userSortBy, setUserSortBy] = useState('recent'); // 'recent', 'watchTime', 'logins'
  const [actionLoading, setActionLoading] = useState(null);
  
  const { websiteStatus, setWebsiteStatus, user, token } = useAuth();
  const [statusLoading, setStatusLoading] = useState(false);

  // ─── Uploads tab state ────────────────────────────
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState('');
  const [fileEntries, setFileEntries] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // { done, total }
  const [uploadMsg, setUploadMsg] = useState(null); // { type: 'success' | 'error', text }
  const [deletingId, setDeletingId] = useState(null);
  const notesLoadedRef = useRef(false);

  const [uploadsSearchQuery, setUploadsSearchQuery] = useState('');
  const [uploadsBranchFilter, setUploadsBranchFilter] = useState('all');
  const [uploadsYearFilter, setUploadsYearFilter] = useState('all');
  // ─── Edit Note State ────────────────────────────
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteTitle, setEditingNoteTitle] = useState('');
  const [editingNoteBranch, setEditingNoteBranch] = useState('');
  const [renamingId, setRenamingId] = useState(null);

  // ─── Reviews tab state ────────────────────────────
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const reviewsLoadedRef = useRef(false);

  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState('');

  // ─── Activities tab state ────────────────────────────
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState('');
  const activitiesLoadedRef = useRef(false);

  // ─── Security tab state ────────────────────────────
  const [suspiciousIPs, setSuspiciousIPs] = useState([]);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState('');
  const securityLoadedRef = useRef(false);

  // ─── Mail History state ────────────────────────────
  const [emailLogs, setEmailLogs] = useState([]);
  const [emailLogsLoading, setEmailLogsLoading] = useState(false);
  const [emailLogsError, setEmailLogsError] = useState('');
  const [emailQuota, setEmailQuota] = useState(null);
  
  const [mailSearch, setMailSearch] = useState('');
  const [mailStatusFilter, setMailStatusFilter] = useState('');
  const [mailTemplateFilter, setMailTemplateFilter] = useState('');
  const [mailPage, setMailPage] = useState(1);
  const [mailTotalPages, setMailTotalPages] = useState(1);

  // ─── PDF Read Logs state ────────────────────────────
  const [pdfLogs, setPdfLogs] = useState([]);
  const [pdfLogsSearch, setPdfLogsSearch] = useState('');
  const [pdfLogsStatusFilter, setPdfLogsStatusFilter] = useState('all');
  const [pdfLogsSort, setPdfLogsSort] = useState('recent');

  const fetchPdfLogs = async () => {
    try {
      const json = await trackingApi.getLogs();
      if (json.success) setPdfLogs(json.data);
    } catch (err) { console.error("[admin] failed to fetch PDF read logs:", err); }
  };

  useEffect(() => {
    if (tab === 'liveTracking') {
      fetchPdfLogs();
      const interval = setInterval(fetchPdfLogs, 5000);
      return () => clearInterval(interval);
    } else {
      setPdfLogs([]);
    }
  }, [tab, token]);

  const loadAll = useCallback(async () => {
    try {
      const [statsRes, usersRes, logsRes, quotaRes] = await Promise.all([
        authApi.getAdminStats(),
        authApi.getAdminUsers(),
        authApi.getAdminLogs(),
        authApi.getAdminEmailQuota()
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setLogs(logsRes.data);
      setEmailQuota(quotaRes.data || quotaRes);
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

  const loadActivities = useCallback(async () => {
    setActivitiesLoading(true);
    try {
      const res = await authApi.getAdminActivities(100);
      setActivities(res.data || []);
      setActivitiesError('');
    } catch (err) {
      setActivitiesError(err.message);
    } finally {
      setActivitiesLoading(false);
    }
  }, []);

  const loadSuspiciousIPs = useCallback(async () => {
    setSecurityLoading(true);
    try {
      const res = await authApi.getAdminSuspiciousIPs(100);
      setSuspiciousIPs(res.data || []);
      setSecurityError('');
    } catch (err) {
      setSecurityError(err.message);
    } finally {
      setSecurityLoading(false);
    }
  }, []);

  const loadEmailLogs = useCallback(async (page = 1) => {
    setEmailLogsLoading(true);
    try {
      const res = await authApi.getAdminEmailLogs(page, 20, mailSearch, mailStatusFilter, mailTemplateFilter);
      setEmailLogs(res.data || []);
      setMailPage(res.page || 1);
      setMailTotalPages(res.totalPages || 1);
      setEmailLogsError('');
    } catch (err) {
      setEmailLogsError(err.message);
    } finally {
      setEmailLogsLoading(false);
    }
  }, [mailSearch, mailStatusFilter, mailTemplateFilter]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 60000);
    return () => clearInterval(interval);
  }, [loadAll]);

  useEffect(() => {
    if (user?.role === 'coordinator' && tab !== 'uploads') {
      setTab('uploads');
    }
  }, [user, tab]);

  const loadSubjects = useCallback(async () => {
    setSubjectsLoading(true);
    try {
      const res = await subjectsApi.getAllSubjects();
      setSubjects(res.data || []);
      setSubjectsError('');
    } catch (err) {
      setSubjectsError(err.message || 'Failed to load subjects.');
    } finally {
      setSubjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'uploads' && !notesLoadedRef.current) {
      notesLoadedRef.current = true;
      loadNotes();
      loadSubjects();
    }
    if (tab === 'reviews' && !reviewsLoadedRef.current) {
      reviewsLoadedRef.current = true;
      loadReviews();
    }
    if (tab === 'activities' && !activitiesLoadedRef.current) {
      activitiesLoadedRef.current = true;
      loadActivities();
    }
    if (tab === 'security' && !securityLoadedRef.current) {
      securityLoadedRef.current = true;
      loadSuspiciousIPs();
    }
    if (tab === 'mailHistory') {
      loadEmailLogs(mailPage);
    }
  }, [tab, loadNotes, loadReviews, loadActivities, loadSuspiciousIPs, loadEmailLogs, mailPage]);

  const handleFilesChange = (e) => {
    const selected = Array.from(e.target.files || []);
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const validFiles = selected.filter((f) => allowedTypes.includes(f.type));

    if (validFiles.length !== selected.length) {
      setUploadMsg({ type: 'error', text: 'Only PDF and image files are allowed — invalid files were skipped.' });
    } else {
      setUploadMsg(null);
    }

    if (validFiles.length > 0) {
      setFileEntries((prev) => [...prev, ...validFiles.map(makeFileEntry)]);
    }

    e.target.value = ''; // allow re-selecting the same file(s) again later
  };

  const updateFileEntry = (id, field, value) => {
    setFileEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry))
    );
  };

  const removeFileEntry = (id) => {
    setFileEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const resetUploadForm = () => {
    setFileEntries([]);
    setUploadProgress(null);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadMsg(null);

    if (fileEntries.length === 0) {
      setUploadMsg({ type: 'error', text: 'Please choose at least one file to upload.' });
      return;
    }

    const missing = fileEntries.find((entry) => !entry.title.trim() || !entry.subject.trim());
    if (missing) {
      setUploadMsg({ type: 'error', text: 'Title and subject are required for every file.' });
      return;
    }

    setUploading(true);
    setUploadProgress({ done: 0, total: fileEntries.length });

    const failed = [];
    let succeeded = 0;

    // Uploaded one at a time (not in parallel) so the server isn't hit with
    // many large file uploads simultaneously.
    for (const entry of fileEntries) {
      try {
        const isMultiple = entry.allowMultipleBranches && entry.branches && entry.branches.length > 0;
        const branchList = isMultiple ? entry.branches : [entry.branch];

        if (branchList.length === 0) {
          throw new Error('No branch selected for ' + entry.file.name);
        }

        const metadata = {
          title: entry.title.trim(),
          description: entry.description.trim(),
          subject: entry.subject.trim(),
          branch: branchList,
          resourceType: entry.resourceType,
          year: entry.year,
        };

        await uploadApi.uploadPdf(entry.file, metadata);
        succeeded += 1;
      } catch (err) {
        failed.push({ name: entry.file.name, error: err.message || 'Upload failed.' });
      }
      setUploadProgress((prev) => ({ done: (prev?.done || 0) + 1, total: fileEntries.length }));
    }

    setUploading(false);

    if (failed.length === 0) {
      setUploadMsg({ type: 'success', text: `${succeeded} file${succeeded === 1 ? '' : 's'} uploaded successfully.` });
      resetUploadForm();
    } else {
      setUploadMsg({
        type: 'error',
        text: `${succeeded} uploaded, ${failed.length} failed: ${failed.map((f) => `${f.name} (${f.error})`).join('; ')}`,
      });
      // Keep only the failed entries in the form so the user can retry them
      setFileEntries((prev) => prev.filter((entry) => failed.some((f) => f.name === entry.file.name)));
    }

    loadNotes();
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

  const handleEditSubmit = async (note) => {
    const newTitle = editingNoteTitle.trim();
    if (!newTitle) {
      alert('Note title cannot be empty.');
      return;
    }
    setRenamingId(note._id);
    try {
      await notesApi.update(note._id, { title: newTitle, branch: editingNoteBranch });
      setNotes((prev) => prev.map((n) => n._id === note._id ? { ...n, title: newTitle, branch: editingNoteBranch } : n));
      setEditingNoteId(null);
      setNotesError('');
      alert(`Successfully updated note`);
    } catch (err) {
      alert(`Error updating note: ${err.message}`);
    } finally {
      setRenamingId(null);
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

  const [editingUserRole, setEditingUserRole] = useState(null);
  const [editRoleForm, setEditRoleForm] = useState({ role: '' });

  const startEditRole = (u) => {
    setEditingUserRole(u._id);
    setEditRoleForm({ role: u.role });
  };

  const handleSaveRole = async (u) => {
    setActionLoading(`role-${u._id}`);
    try {
      const res = await authApi.updateAdminUserRole(u._id, editRoleForm.role);
      setUsers((prev) => prev.map((usr) => (usr._id === u._id ? { ...usr, role: res.data.role } : usr)));
      setEditingUserRole(null);
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

  const filteredUsers = users
    .filter((u) => {
      // Role Filter
      if (userRoleFilter !== 'all') {
        const uRole = u.role || 'user';
        if (uRole !== userRoleFilter) return false;
      }
      
      // Status Filter
      if (userStatusFilter === 'live' && !u.isLive) return false;
      if (userStatusFilter === 'offline' && u.isLive) return false;

      // Search Query
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        if (
          !(u.name && u.name.toLowerCase().includes(lowerQuery)) &&
          !(u.email && u.email.toLowerCase().includes(lowerQuery))
        ) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (userSortBy === 'watchTime') {
        return (b.totalWatchTime || 0) - (a.totalWatchTime || 0);
      }
      if (userSortBy === 'logins') {
        return (b.loginCount || 0) - (a.loginCount || 0);
      }
      // default: recent (descending _id or createdAt)
      return new Date(b.createdAt || b.lastActiveAt || 0) - new Date(a.createdAt || a.lastActiveAt || 0);
    });

  const filteredNotes = notes.filter((n) => {
    // Branch Filter
    if (uploadsBranchFilter !== 'all') {
      const g = n.group || 'common';
      if (g !== uploadsBranchFilter && g !== 'common') return false;
    }
    
    // Year Filter
    if (uploadsYearFilter !== 'all') {
      if (n.year !== Number(uploadsYearFilter)) return false;
    }

    // Search Query
    if (uploadsSearchQuery) {
      const q = uploadsSearchQuery.toLowerCase();
      if (
        !(n.title && n.title.toLowerCase().includes(q)) &&
        !(n.subject && n.subject.toLowerCase().includes(q))
      ) {
        return false;
      }
    }
    return true;
  });

  if (loading) {
    return <div className="admin-wrapper"><p className="admin-loading">Loading admin panel...</p></div>;
  }

  return (
    <div className="admin-wrapper">
      <h1 className="admin-title">Admin Panel</h1>

      {error && <p className="admin-error">{error}</p>}

      {user?.role !== 'coordinator' && (
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
          <div className="admin-card">
            <span className="admin-card-label">Website Visitors (Unique)</span>
            <span className="admin-card-value">{stats?.totalVisitors ?? '—'}</span>
          </div>
        </div>
      )}

      {user?.role !== 'coordinator' && (
        <div className="quota-dashboard" style={{ marginTop: '2rem' }}>
          <div className="quota-header">
            <h2 className="quota-title">Load Test Statistics (Synthetic Traffic)</h2>
          </div>
          <div className="quota-stats">
            <div className="quota-stat">
              <span className="quota-stat-label">Synthetic Unique VUs</span>
              <span className="quota-stat-val">{stats?.syntheticVisitors ?? 0}</span>
            </div>
            <div className="quota-stat">
              <span className="quota-stat-label">Synthetic Requests</span>
              <span className="quota-stat-val">{stats?.syntheticRequests ?? 0}</span>
            </div>
            <div className="quota-stat">
              <span className="quota-stat-label">Synthetic Last Activity</span>
              <span className="quota-stat-val">
                {stats?.syntheticLastActive ? new Date(stats.syntheticLastActive).toLocaleString() : 'Never'}
              </span>
            </div>
          </div>
        </div>
      )}

      {user?.role !== 'coordinator' && emailQuota && (
        <div className="quota-dashboard">
          <div className="quota-header">
            <h2 className="quota-title">Email Quota</h2>
            {emailQuota.lastReset && (
              <span style={{ fontSize: '0.8rem', color: '#a0aec0' }}>
                Resets in: {Math.floor((new Date(new Date(emailQuota.lastReset).setHours(24,0,0,0)).getTime() - Date.now()) / 3600000)}h {Math.floor(((new Date(new Date(emailQuota.lastReset).setHours(24,0,0,0)).getTime() - Date.now()) % 3600000) / 60000)}m
              </span>
            )}
          </div>
          
          <div className="quota-stats">
            <div className="quota-stat">
              <span className="quota-stat-label">Daily Limit</span>
              <span className="quota-stat-val">{emailQuota.dailyLimit}</span>
            </div>
            <div className="quota-stat">
              <span className="quota-stat-label">Used Today</span>
              <span className="quota-stat-val">{emailQuota.usedToday}</span>
            </div>
            <div className="quota-stat">
              <span className="quota-stat-label">Remaining</span>
              <span className="quota-stat-val">{Math.max(0, emailQuota.dailyLimit - emailQuota.usedToday)}</span>
            </div>
            <div className="quota-stat">
              <span className="quota-stat-label">Sent</span>
              <span className="quota-stat-val" style={{ color: '#4ade80' }}>{emailQuota.sent}</span>
            </div>
            <div className="quota-stat">
              <span className="quota-stat-label">Failed</span>
              <span className="quota-stat-val" style={{ color: '#ef4444' }}>{emailQuota.failed}</span>
            </div>
            <div className="quota-stat">
              <span className="quota-stat-label">Blocked by Quota</span>
              <span className="quota-stat-val" style={{ color: '#f59e0b' }}>{emailQuota.blocked}</span>
            </div>
          </div>

          <div className="quota-progress-wrapper">
            <div 
              className={`quota-progress-bar ${emailQuota.usedToday >= emailQuota.dailyLimit * 0.9 ? 'warning' : ''}`} 
              style={{ width: `${Math.min(100, (emailQuota.usedToday / emailQuota.dailyLimit) * 100)}%` }}
            ></div>
            <div className="quota-progress-text">
              {Math.min(100, Math.round((emailQuota.usedToday / emailQuota.dailyLimit) * 100))}%
            </div>
          </div>
        </div>
      )}

      {user?.role !== 'coordinator' && (
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
      )}



      <div className="admin-tabs">
        {user?.role !== 'coordinator' && (
          <>
            <button className={`admin-tab-btn ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
              Users
            </button>
            <button className={`admin-tab-btn ${tab === 'logs' ? 'active' : ''}`} onClick={() => setTab('logs')}>
              Login Logs
            </button>
          </>
        )}
        <button className={`admin-tab-btn ${tab === 'uploads' ? 'active' : ''}`} onClick={() => setTab('uploads')}>
          Uploads
        </button>
        {user?.role !== 'coordinator' && (
          <>
            <button className={`admin-tab-btn ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>
              Reviews
            </button>
            <button className={`admin-tab-btn ${tab === 'activities' ? 'active' : ''}`} onClick={() => setTab('activities')}>
              Activities
            </button>
            <button className={`admin-tab-btn ${tab === 'security' ? 'active' : ''}`} onClick={() => setTab('security')}>
              Security
            </button>
            <button className={`admin-tab-btn ${tab === 'mailHistory' ? 'active' : ''}`} onClick={() => setTab('mailHistory')}>
              Mail History
            </button>
            <button className={`admin-tab-btn ${tab === 'subjects' ? 'active' : ''}`} onClick={() => setTab('subjects')}>
              Subjects
            </button>
            <button className={`admin-tab-btn ${tab === 'liveTracking' ? 'active' : ''}`} onClick={() => setTab('liveTracking')}>
              Document Read Logs
            </button>
          </>
        )}
      </div>

      {tab === 'subjects' && (
        <SubjectManagement />
      )}

      {tab === 'liveTracking' && (() => {
        const filteredPdfLogs = pdfLogs.filter(log => {
          const isReadingNow = (Date.now() - new Date(log.endTime).getTime()) < 30000;
          
          if (pdfLogsStatusFilter === 'live' && !isReadingNow) return false;
          if (pdfLogsStatusFilter === 'finished' && isReadingNow) return false;

          if (pdfLogsSearch) {
            const q = pdfLogsSearch.toLowerCase();
            if (
              !(log.userName && log.userName.toLowerCase().includes(q)) &&
              !(log.userEmail && log.userEmail.toLowerCase().includes(q)) &&
              !(log.pdfTitle && log.pdfTitle.toLowerCase().includes(q))
            ) {
              return false;
            }
          }
          return true;
        }).sort((a, b) => {
          if (pdfLogsSort === 'duration') {
            return (b.durationMs || 0) - (a.durationMs || 0);
          }
          return new Date(b.endTime).getTime() - new Date(a.endTime).getTime();
        });

        return (
          <div className="admin-table-wrap">
            <div className="admin-toolbar">
              <div className="admin-toolbar-left">
                <h2 className="upload-form-title" style={{ margin: 0 }}>Document Read Logs ({filteredPdfLogs.length})</h2>
                <input
                  type="text"
                  placeholder="Search by user or Document..."
                  value={pdfLogsSearch}
                  onChange={(e) => setPdfLogsSearch(e.target.value)}
                  className="admin-search-input"
                  style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #2d3748', background: '#0b0d10', color: '#fff', width: '250px' }}
                />
              </div>
              <div className="admin-toolbar-right">
                <select className="admin-filter-select" value={pdfLogsStatusFilter} onChange={(e) => setPdfLogsStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="live">Reading Now</option>
                  <option value="finished">Finished</option>
                </select>
                <select className="admin-filter-select" value={pdfLogsSort} onChange={(e) => setPdfLogsSort(e.target.value)}>
                  <option value="recent">Sort: Recent</option>
                  <option value="duration">Sort: Longest Duration</option>
                </select>
                <button className="upload-submit-btn" style={{ margin: 0, padding: '0.6rem 1rem', width: 'auto' }} onClick={fetchPdfLogs}>
                  Refresh
                </button>
              </div>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Viewing Document</th>
                  <th>Subject</th>
                  <th>Started At</th>
                  <th>Duration (mins)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPdfLogs.map((log) => {
                  const durationMins = Math.floor(log.durationMs / 60000);
                  const isReadingNow = (Date.now() - new Date(log.endTime).getTime()) < 30000;

                  return (
                    <tr key={log._id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{log.userName}</div>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{log.userEmail}</div>
                      </td>
                      <td>{log.pdfTitle ? <span style={{ color: '#38bdf8' }}>{log.pdfTitle}</span> : '—'}</td>
                      <td>{log.subject ? <span style={{ color: '#a78bfa' }}>{log.subject}</span> : '—'}</td>
                      <td>{new Date(log.startTime).toLocaleString()}</td>
                      <td>{durationMins} mins</td>
                      <td>
                        {isReadingNow ? (
                          <span style={{ color: '#4ade80', fontWeight: 'bold' }}>Reading Now</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Finished</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredPdfLogs.length === 0 && (
                  <tr><td colSpan={6} className="admin-empty">No document reading logs found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        );
      })()}

      {tab === 'users' && (
        <div className="admin-table-wrap">
          <div className="admin-toolbar">
            <div className="admin-toolbar-left">
              <h2 className="upload-form-title" style={{ margin: 0 }}>Users ({filteredUsers.length})</h2>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="admin-search-input"
                style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #2d3748', background: '#0b0d10', color: '#fff', width: '250px' }}
              />
            </div>
            <div className="admin-toolbar-right">
              <select className="admin-filter-select" value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}>
                <option value="all">All Roles</option>
                <option value="user">Users</option>
                <option value="coordinator">Coordinators</option>
                <option value="admin">Admins</option>
              </select>
              <select className="admin-filter-select" value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="live">Live Now</option>
                <option value="offline">Offline</option>
              </select>
              <select className="admin-filter-select" value={userSortBy} onChange={(e) => setUserSortBy(e.target.value)}>
                <option value="recent">Sort: Recent</option>
                <option value="watchTime">Sort: Watch Time</option>
                <option value="logins">Sort: Logins</option>
              </select>
            </div>
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
                    {u.role === 'admin' ? <span className="badge admin-badge">Admin</span> : u.role === 'coordinator' ? <span className="badge coordinator-badge">Coordinator</span> : <span className="badge user-badge">User</span>}
                  </td>
                  <td>{u.provider}</td>
                  <td>{u.emailVerified ? 'Yes' : 'No'}</td>
                  <td>{u.loginCount || 0}</td>
                  <td>{formatWatchTime(u.totalWatchTimeMs || 0)}</td>
                  <td>{formatDate(u.lastActiveAt)}</td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    {editingUserRole === u._id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#0b0d10', padding: '0.5rem', borderRadius: '4px', border: '1px solid #334155' }}>
                        <select 
                          value={editRoleForm.role} 
                          onChange={(e) => setEditRoleForm({ ...editRoleForm, role: e.target.value })}
                          style={{ padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        >
                          <option value="user">User</option>
                          <option value="coordinator">Coordinator</option>
                          <option value="admin">Admin</option>
                        </select>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button type="button" onClick={() => handleSaveRole(u)} className="upload-submit-btn" style={{ padding: '2px 8px', fontSize: '0.75rem', margin: 0, width: 'auto' }} disabled={actionLoading === `role-${u._id}`}>Save</button>
                          <button type="button" onClick={() => setEditingUserRole(null)} className="upload-reset-btn" style={{ padding: '2px 8px', fontSize: '0.75rem', margin: 0 }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="admin-action-btn"
                          style={{ padding: '4px 8px', fontSize: '0.8rem', backgroundColor: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          onClick={() => startEditRole(u)}
                          disabled={actionLoading === `role-${u._id}`}
                        >
                          Manage Role
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
                      </>
                    )}
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
          <div className="coordinator-guide">
            <h3>📝 Coordinator Upload Guide</h3>
            <p>Welcome Coordinators! Please follow these rules before uploading notes:</p>
            <ul>
              <li><strong>Compress Files:</strong> The database has a strict file size limit. Please compress your files to <strong>under 15MB</strong> before uploading. You can use <a href="https://www.ilovepdf.com/compress_pdf" target="_blank" rel="noreferrer">iLovePDF</a> to compress them easily.</li>
              <li><strong>Select Branch Carefully:</strong> Ensure you are only uploading files for your assigned branch/subject. If a subject belongs to multiple branches, check "Allow multiple groups".</li>
              <li><strong>Naming Convention:</strong> Give the file a clear, descriptive title (e.g., "Unit 1: Quantum Physics").</li>
              <li><strong>Need Help?</strong> If you face any issues or errors while uploading, please contact the ABES Autonomy Admins/Creators immediately.</li>
            </ul>
          </div>

          <form className="upload-form" onSubmit={handleUploadSubmit}>
            <h2 className="upload-form-title">Upload New Files</h2>

            <div className="upload-field file-field">
              <label htmlFor="pdf-file">Files *</label>
              <input
                id="pdf-file"
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                multiple
                onChange={handleFilesChange}
              />
              <span className="file-chosen">
                {fileEntries.length === 0
                  ? 'No files chosen'
                  : `${fileEntries.length} file${fileEntries.length === 1 ? '' : 's'} selected`}
              </span>
            </div>

            {fileEntries.length > 0 && (
              <div className="upload-entries">
                {fileEntries.map((entry) => (
                  <div key={entry.id} className="upload-entry-card">
                    <div className="upload-entry-header">
                      <span className="upload-entry-filename">{entry.file.name}</span>
                      <button
                        type="button"
                        className="upload-entry-remove"
                        onClick={() => removeFileEntry(entry.id)}
                        disabled={uploading}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="upload-grid">
                      <div className="upload-field">
                        <label>Title *</label>
                        <input
                          type="text"
                          value={entry.title}
                          onChange={(e) => updateFileEntry(entry.id, 'title', e.target.value)}
                          placeholder="e.g. Unit 3 - Digital Electronics Notes"
                          disabled={uploading}
                        />
                      </div>

                      <div className="upload-field">
                        <label>Year *</label>
                        <select
                          value={entry.year}
                          onChange={(e) => {
                            const newYear = Number(e.target.value);
                            updateFileEntry(entry.id, 'year', newYear);
                            updateFileEntry(entry.id, 'subject', '');
                            if (newYear === 2) {
                              updateFileEntry(entry.id, 'branch', 'cse');
                              updateFileEntry(entry.id, 'branches', ['cse']);
                            } else {
                              updateFileEntry(entry.id, 'branch', 'common');
                              updateFileEntry(entry.id, 'branches', ['common']);
                            }
                          }}
                          disabled={uploading}
                        >
                          <option value={1}>Year 1</option>
                          <option value={2}>Year 2</option>
                        </select>
                      </div>

                      <div className="upload-field">
                        <label>Subject *</label>
                        {subjectsLoading ? (
                          <select disabled value="">
                            <option value="">Loading subjects...</option>
                          </select>
                        ) : subjectsError ? (
                          <div className="admin-error">{subjectsError}</div>
                        ) : (
                          <select
                            value={entry.subject}
                            onChange={(e) => updateFileEntry(entry.id, 'subject', e.target.value)}
                            disabled={uploading}
                          >
                            <option value="" disabled>Select Subject ▼</option>
                            {subjects
                              .filter((s) => s.year === entry.year)
                              .map((s) => (
                                <option key={s._id || s.name} value={s.name}>
                                  {s.name}
                                </option>
                              ))}
                          </select>
                        )}
                      </div>

                      <div className="upload-field">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label>Group / Branch</label>
                          <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 'normal' }}>
                            <input
                              type="checkbox"
                              checked={entry.allowMultipleBranches || false}
                              onChange={(e) => updateFileEntry(entry.id, 'allowMultipleBranches', e.target.checked)}
                              disabled={uploading}
                            />
                            Allow Multiple Branch
                          </label>
                        </div>
                        {entry.allowMultipleBranches ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', background: '#0b0d10', padding: '0.5rem', borderRadius: '4px', border: '1px solid #2d3748' }}>
                            {(entry.year === 1 ? BRANCHES_Y1 : BRANCHES_Y2).map((b) => (
                              <label key={b} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  value={b}
                                  checked={(entry.branches || []).includes(b)}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    let newBranches = [...(entry.branches || [])];
                                    if (checked) {
                                      newBranches.push(b);
                                    } else {
                                      newBranches = newBranches.filter((branch) => branch !== b);
                                    }
                                    updateFileEntry(entry.id, 'branches', newBranches);
                                  }}
                                  disabled={uploading}
                                />
                                {b.toUpperCase()}
                              </label>
                            ))}
                          </div>
                        ) : (
                          <select
                            value={entry.branch}
                            onChange={(e) => updateFileEntry(entry.id, 'branch', e.target.value)}
                            disabled={uploading}
                          >
                            {(entry.year === 1 ? BRANCHES_Y1 : BRANCHES_Y2).map((b) => (
                              <option key={b} value={b}>{b.toUpperCase()}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="upload-field">
                        <label>Resource Type</label>
                        <select
                          value={entry.resourceType}
                          onChange={(e) => updateFileEntry(entry.id, 'resourceType', e.target.value)}
                          disabled={uploading}
                        >
                          {RESOURCE_TYPES.map((r) => (
                            <option key={r} value={r}>{r.replace('_', ' ')}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="upload-field">
                      <label>Description</label>
                      <textarea
                        rows={2}
                        value={entry.description}
                        onChange={(e) => updateFileEntry(entry.id, 'description', e.target.value)}
                        placeholder="Optional short description"
                        disabled={uploading}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {uploadMsg && (
              <p className={`upload-msg ${uploadMsg.type}`}>{uploadMsg.text}</p>
            )}

            {uploading && uploadProgress && (
              <p className="upload-msg">
                Uploading {uploadProgress.done} of {uploadProgress.total}...
              </p>
            )}

            <div className="upload-actions">
              <button type="submit" className="upload-submit-btn" disabled={uploading || fileEntries.length === 0}>
                {uploading
                  ? 'Uploading...'
                  : `Upload ${fileEntries.length || ''} file${fileEntries.length === 1 ? '' : 's'}`}
              </button>
              <button type="button" className="upload-reset-btn" onClick={() => resetUploadForm(false)} disabled={uploading}>
                Clear
              </button>
            </div>
          </form>

          <div className="upload-list-section">
            <div className="admin-toolbar" style={{ marginBottom: '1.5rem' }}>
              <div className="admin-toolbar-left">
                <h2 className="upload-form-title" style={{ margin: 0 }}>Uploaded Notes ({filteredNotes.length})</h2>
                <input
                  type="text"
                  placeholder="Search notes by title or subject..."
                  value={uploadsSearchQuery}
                  onChange={(e) => setUploadsSearchQuery(e.target.value)}
                  className="admin-search-input"
                  style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #2d3748', background: '#0b0d10', color: '#fff', width: '250px' }}
                />
              </div>
              <div className="admin-toolbar-right">
                <select className="admin-filter-select" value={uploadsYearFilter} onChange={(e) => setUploadsYearFilter(e.target.value)}>
                  <option value="all">All Years</option>
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                </select>
                <select className="admin-filter-select" value={uploadsBranchFilter} onChange={(e) => setUploadsBranchFilter(e.target.value)}>
                  <option value="all">All Branches</option>
                  <option value="cse">CSE</option>
                  <option value="ds">DS</option>
                  <option value="aiml">AIML</option>
                  <option value="ece">ECE</option>
                  <option value="elce">ELCE</option>
                  <option value="electrical">Electrical</option>
                  <option value="electronics">Electronics</option>
                </select>
                <button type="button" className="upload-reset-btn" onClick={() => { notesLoadedRef.current = true; loadNotes(); }} disabled={notesLoading}>
                  Refresh
                </button>
              </div>
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
                    <th>Uploaded Date</th>
                    <th>Uploader</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotes.map((n) => (
                    <tr key={n._id}>
                      <td>
                        {editingNoteId === n._id ? (
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input
                              type="text"
                              value={editingNoteTitle}
                              onChange={(e) => setEditingNoteTitle(e.target.value)}
                              style={{
                                background: '#0b0d10',
                                border: '1px solid #2d3748',
                                borderRadius: '4px',
                                padding: '0.3rem 0.5rem',
                                color: '#e2e8f0',
                                fontSize: '0.85rem'
                              }}
                              autoFocus
                            />
                            <button
                              type="button"
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', backgroundColor: '#4ade80', color: '#0b0d10', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                              onClick={() => handleEditSubmit(n)}
                              disabled={renamingId === n._id}
                            >
                              {renamingId === n._id ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              className="delete-note-btn"
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                              onClick={() => setEditingNoteId(null)}
                              disabled={renamingId === n._id}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          n.title
                        )}
                      </td>
                      <td>{n.subject}</td>
                      <td>
                        {editingNoteId === n._id ? (
                          <select
                            value={editingNoteBranch}
                            onChange={(e) => setEditingNoteBranch(e.target.value)}
                            style={{
                              background: '#0b0d10',
                              border: '1px solid #2d3748',
                              borderRadius: '4px',
                              padding: '0.3rem',
                              color: '#e2e8f0',
                              fontSize: '0.85rem'
                            }}
                          >
                            {(n.year === 1 ? BRANCHES_Y1 : BRANCHES_Y2).map(b => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                        ) : (
                          Array.isArray(n.branch) ? n.branch.join(', ') : n.branch
                        )}
                      </td>
                      <td>{n.year}</td>
                      <td>{n.resourceType}</td>
                      <td>{n.viewCount || 0}</td>
                      <td>{formatDate(n.createdAt)}</td>
                      <td>
                        <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>
                          {n.uploadedBy?.name || 'Unknown'}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: '0.5rem' }}>
                        {editingNoteId !== n._id && (
                          <button
                            type="button"
                            style={{ padding: '4px 8px', fontSize: '0.8rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            onClick={() => { setEditingNoteId(n._id); setEditingNoteTitle(n.title); setEditingNoteBranch(n.branch); }}
                          >
                            Edit
                          </button>
                        )}
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

      {tab === 'activities' && (
        <div className="admin-table-wrap">
          <div className="admin-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 1rem' }}>
            <h2 className="upload-form-title" style={{ margin: 0 }}>Admin Activities ({activities.length})</h2>
            <button type="button" className="upload-reset-btn" onClick={() => loadActivities()} disabled={activitiesLoading}>
              Refresh
            </button>
          </div>
          {activitiesError && <p className="admin-error">{activitiesError}</p>}
          <table className="admin-table">
            <thead>
              <tr>
                <th>Admin Name</th>
                <th>Role</th>
                <th>Action</th>
                <th>Target</th>
                <th>Details</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((act) => (
                <tr key={act._id}>
                  <td>{act.adminName}</td>
                  <td>{act.role || 'admin'}</td>
                  <td><span className="badge" style={{backgroundColor: '#334155', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85em', color: 'white'}}>{act.action}</span></td>
                  <td>
                    {act.branch && <span className="badge" style={{backgroundColor: '#1d4ed8', marginRight: '4px'}}>{act.branch}</span>}
                    {act.subject && <span style={{fontSize: '0.8rem', color: '#94a3b8', display: 'block'}}>{act.subject}</span>}
                    {act.fileName && <span style={{fontSize: '0.8rem', color: '#94a3b8', display: 'block'}}>{act.fileName}</span>}
                  </td>
                  <td style={{ maxWidth: '300px', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.4' }}>{act.details}</td>
                  <td>{formatDate(act.createdAt)}</td>
                </tr>
              ))}
              {!activitiesLoading && activities.length === 0 && (
                <tr><td colSpan={6} className="admin-empty">No admin activities found</td></tr>
              )}
              {activitiesLoading && (
                <tr><td colSpan={6} className="admin-empty">Loading activities...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'security' && (
        <div className="admin-table-wrap">
          <div className="admin-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 1rem' }}>
            <h2 className="upload-form-title" style={{ margin: 0, color: '#ef4444' }}>Suspicious IPs (Rate Limited)</h2>
            <button type="button" className="upload-reset-btn" onClick={() => loadSuspiciousIPs()} disabled={securityLoading}>
              Refresh
            </button>
          </div>
          <p style={{ padding: '0 1rem', color: '#a0aec0', fontSize: '0.9rem', marginBottom: '1rem' }}>
            These IP addresses have exceeded the rate limits on sensitive authentication or forgot password routes.
          </p>
          {securityError && <p className="admin-error">{securityError}</p>}
          <table className="admin-table">
            <thead>
              <tr>
                <th>Device Name (User Agent)</th>
                <th>IP Address</th>
                <th>Endpoint Targeted</th>
                <th>Method</th>
                <th>Attempts</th>
                <th>Time Left (Live)</th>
              </tr>
            </thead>
            <tbody>
              {suspiciousIPs.map((ipRec) => {
                let durationMs = 15 * 60 * 1000;
                if (ipRec.endpoint && ipRec.endpoint.includes('/forgot-password')) {
                  durationMs = 24 * 60 * 60 * 1000;
                }
                
                return (
                  <tr key={ipRec._id}>
                    <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#94a3b8' }} title={ipRec.userAgent || 'Unknown'}>
                      {ipRec.userAgent || 'Unknown'}
                    </td>
                    <td style={{ fontFamily: 'monospace', color: '#fca5a5' }}>{ipRec.ip}</td>
                    <td>{ipRec.endpoint}</td>
                    <td><span className="badge" style={{backgroundColor: '#334155'}}>{ipRec.method}</span></td>
                    <td style={{ fontWeight: 'bold' }}>{ipRec.attemptCount}</td>
                    <td>
                      <LiveTimer updatedAt={ipRec.updatedAt} durationMs={durationMs} />
                    </td>
                  </tr>
                );
              })}
              {!securityLoading && suspiciousIPs.length === 0 && (
                <tr><td colSpan={6} className="admin-empty" style={{ color: '#4ade80' }}>No suspicious IPs detected recently.</td></tr>
              )}
              {securityLoading && (
                <tr><td colSpan={6} className="admin-empty">Loading security data...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'mailHistory' && (
        <div className="admin-table-wrap">
          <div className="admin-table-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', padding: '1rem 1rem 0' }}>
            <h2 className="upload-form-title" style={{ margin: 0, width: '100%' }}>Mail History</h2>
            
            <input
              type="text"
              placeholder="Search recipient or subject..."
              value={mailSearch}
              onChange={(e) => setMailSearch(e.target.value)}
              className="admin-search-input"
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', flex: '1', minWidth: '200px' }}
            />
            
            <select 
              value={mailStatusFilter} 
              onChange={(e) => setMailStatusFilter(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#0b0d10', color: '#e2e8f0' }}
            >
              <option value="">All Statuses</option>
              <option value="SENT">Sent</option>
              <option value="FAILED">Failed</option>
              <option value="QUOTA_EXCEEDED">Quota Exceeded</option>
              <option value="EXPIRED">Expired</option>
            </select>

            <select 
              value={mailTemplateFilter} 
              onChange={(e) => setMailTemplateFilter(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#0b0d10', color: '#e2e8f0' }}
            >
              <option value="">All Templates</option>
              <option value="OTP">OTP</option>
              <option value="Password Reset">Password Reset</option>
              <option value="Login Notification">Login Notification</option>
              <option value="Review Appreciation">Review Appreciation</option>
            </select>

            <button 
              className="upload-submit-btn" 
              style={{ padding: '0.5rem 1rem' }}
              onClick={() => { setMailPage(1); loadEmailLogs(1); }}
            >
              Search
            </button>
          </div>

          {emailLogsError && <p className="admin-error" style={{ padding: '0 1rem' }}>{emailLogsError}</p>}
          
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Recipient</th>
                <th>Template</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Brevo Msg ID</th>
                <th>Error Reason</th>
              </tr>
            </thead>
            <tbody>
              {emailLogsLoading ? (
                <tr><td colSpan={7} className="admin-empty">Loading logs...</td></tr>
              ) : emailLogs.map((log) => (
                <tr key={log._id}>
                  <td>{formatDate(log.createdAt)}</td>
                  <td>{log.recipient}</td>
                  <td>{log.template}</td>
                  <td>{log.subject}</td>
                  <td>
                    <span className={`status-badge status-${log.status}`}>{log.status}</span>
                  </td>
                  <td>{log.messageId || '—'}</td>
                  <td style={{ color: '#ef4444' }}>{log.errorReason || '—'}</td>
                </tr>
              ))}
              {!emailLogsLoading && emailLogs.length === 0 && (
                <tr><td colSpan={7} className="admin-empty">No email logs found</td></tr>
              )}
            </tbody>
          </table>

          {mailTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', padding: '1rem' }}>
              <button 
                onClick={() => setMailPage(p => Math.max(1, p - 1))}
                disabled={mailPage === 1}
                className="upload-reset-btn"
                style={{ padding: '0.3rem 0.8rem' }}
              >
                Previous
              </button>
              <span style={{ color: '#a0aec0', display: 'flex', alignItems: 'center' }}>
                Page {mailPage} of {mailTotalPages}
              </span>
              <button 
                onClick={() => setMailPage(p => Math.min(mailTotalPages, p + 1))}
                disabled={mailPage === mailTotalPages}
                className="upload-reset-btn"
                style={{ padding: '0.3rem 0.8rem' }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}