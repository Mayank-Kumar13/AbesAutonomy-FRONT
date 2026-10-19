import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  uploadPdfToSupabase,
  listSupabasePdfs,
  deleteSupabasePdf,
  downloadSupabasePdf,
  isSupabaseConfigured,
  BUCKET_NAME,
} from '../../services/supabaseClient';
import { uploadApi } from '../../services/api';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ExternalLink,
  Download,
  RefreshCw,
  Copy,
  Search,
  Database,
  Shield,
  Layers,
} from 'lucide-react';

export default function SupabasePdfManager() {
  const navigate = useNavigate();

  // Storage State
  const [configured, setConfigured] = useState(isSupabaseConfigured());
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [customFolder, setCustomFolder] = useState('notes');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Sync Library State
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncError, setSyncError] = useState('');

  // Copied Link Feedback
  const [copiedPath, setCopiedPath] = useState(null);

  // Load files from Supabase Storage
  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (!isSupabaseConfigured()) {
        setConfigured(false);
        setLoading(false);
        return;
      }

      setConfigured(true);
      const res = await listSupabasePdfs(customFolder, { limit: 100 });
      setFiles(res.files || []);
    } catch (err) {
      console.error('Failed to load Supabase PDFs:', err);
      setError(err.message || 'Failed to list PDF files from Supabase Storage.');
    } finally {
      setLoading(false);
    }
  }, [customFolder]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Handle local file selection with validation
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setError('');
    setSuccessMsg('');

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Invalid file format. Only PDF documents (.pdf) are allowed.');
      setSelectedFile(null);
      return;
    }

    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setError(`File size (${sizeMb} MB) exceeds maximum allowed size of 25 MB.`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  // Upload PDF file
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(20);
    setError('');
    setSuccessMsg('');

    try {
      setUploadProgress(50);
      const res = await uploadPdfToSupabase(selectedFile, {
        folder: customFolder,
      });

      setUploadProgress(100);
      setSuccessMsg(`Successfully uploaded "${res.name}" to Supabase Storage (${BUCKET_NAME}/${res.path}).`);
      setSelectedFile(null);

      // Reset file input element
      const input = document.getElementById('supabase-pdf-input');
      if (input) input.value = '';

      // Refresh list
      await loadFiles();
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message || 'Failed to upload PDF to Supabase Storage.');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // Delete file with confirmation
  const handleDelete = async (filePath, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}" from Supabase Storage?`)) {
      return;
    }

    try {
      await deleteSupabasePdf(filePath);
      setSuccessMsg(`Deleted "${fileName}" from Supabase Storage.`);
      setFiles((prev) => prev.filter((f) => f.path !== filePath));
    } catch (err) {
      setError(err.message || 'Failed to delete file.');
    }
  };

  // Download file directly
  const handleDownload = async (file) => {
    try {
      await downloadSupabasePdf(file.path, file.name);
    } catch (err) {
      setError(err.message || 'Download failed.');
    }
  };

  // Copy Public/Signed URL
  const handleCopyUrl = (url, path) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2500);
  };

  // Trigger Library Synchronization
  const handleSyncAll = async () => {
    if (!window.confirm('Synchronize all existing ImageKit notes to Supabase Storage? This copies files safely without overwriting.')) {
      return;
    }

    setSyncing(true);
    setSyncError('');
    setSyncResult(null);

    try {
      const res = await uploadApi.syncToSupabase();
      setSyncResult(res.data);
      setSuccessMsg(res.message || 'Synchronization complete.');
      await loadFiles();
    } catch (err) {
      setSyncError(err.message || 'Failed to run library synchronization.');
    } finally {
      setSyncing(false);
    }
  };

  // Filter and paginate files
  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage) || 1;
  const paginatedFiles = filteredFiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #11161d 0%, #16202c 100%)',
          border: '1px solid #222d38',
          borderRadius: '12px',
          padding: '1.75rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Database size={24} color="#38bdf8" />
            <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.35rem', fontWeight: 700 }}>
              Supabase Storage (Bucket: <span style={{ color: '#d9a441' }}>{BUCKET_NAME}</span>)
            </h2>
            <span
              style={{
                backgroundColor: configured ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: configured ? '#34d399' : '#f87171',
                border: `1px solid ${configured ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                borderRadius: '9999px',
                padding: '2px 10px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              {configured ? 'Connected' : 'Configuration Pending'}
            </span>
          </div>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', maxWidth: '650px' }}>
            Primary delivery remains on ImageKit. Supabase Storage serves as your synchronized, automatic failover
            repository for zero-downtime document access.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={loadFiles}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid #334155',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            Refresh Storage
          </button>

          <button
            type="button"
            onClick={handleSyncAll}
            disabled={syncing || !configured}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: syncing ? '#475569' : 'linear-gradient(135deg, #0284c7, #0369a1)',
              background: syncing ? '#334155' : 'linear-gradient(135deg, #0284c7, #0369a1)',
              color: '#ffffff',
              border: 'none',
              padding: '0.6rem 1.1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: syncing || !configured ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 10px rgba(2, 132, 199, 0.3)',
            }}
          >
            <Layers size={15} />
            {syncing ? 'Syncing Library...' : 'Sync ImageKit Library to Supabase'}
          </button>
        </div>
      </div>

      {/* Sync Status Banner if available */}
      {syncResult && (
        <div
          style={{
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '8px',
            padding: '1rem 1.25rem',
            color: '#e0f2fe',
            fontSize: '0.9rem',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color="#38bdf8" />
            Library Synchronization Results
          </div>
          <div style={{ display: 'flex', gap: '20px', marginTop: '6px', fontSize: '0.85rem' }}>
            <span>Total: <strong>{syncResult.totalNotes}</strong></span>
            <span style={{ color: '#4ade80' }}>Newly Synced: <strong>{syncResult.syncedCount}</strong></span>
            <span style={{ color: '#94a3b8' }}>Already Existed: <strong>{syncResult.alreadyExistedCount}</strong></span>
            {syncResult.failedCount > 0 && (
              <span style={{ color: '#f87171' }}>Failed: <strong>{syncResult.failedCount}</strong></span>
            )}
          </div>
        </div>
      )}

      {syncError && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '1rem',
            color: '#fca5a5',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={18} />
          {syncError}
        </div>
      )}

      {/* Upload Form Section */}
      <div
        style={{
          background: '#11161d',
          border: '1px solid #222d38',
          borderRadius: '12px',
          padding: '1.75rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        }}
      >
        <h3
          style={{
            margin: '0 0 1.25rem 0',
            color: '#f8fafc',
            fontSize: '1.15rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <UploadCloud size={20} color="#d9a441" />
          Direct Upload to Supabase Storage
        </h3>

        <form onSubmit={handleUpload}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {/* File Selection */}
            <div>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600 }}>
                Select PDF File * (Max 25 MB)
              </label>
              <input
                id="supabase-pdf-input"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                disabled={uploading}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  backgroundColor: '#0b0d10',
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              />
              {selectedFile && (
                <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#38bdf8' }}>
                  Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </div>
              )}
            </div>

            {/* Folder selection */}
            <div>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600 }}>
                Storage Folder / Path Prefix
              </label>
              <input
                type="text"
                value={customFolder}
                onChange={(e) => setCustomFolder(e.target.value)}
                placeholder="e.g. notes or notes/cse"
                disabled={uploading}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  backgroundColor: '#0b0d10',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                }}
              />
            </div>
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                <span>Uploading to {BUCKET_NAME}...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{ height: '6px', width: '100%', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${uploadProgress}%`,
                    backgroundColor: '#d9a441',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          )}

          {/* Messages */}
          {error && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                color: '#f87171',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {successMsg && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '6px',
                color: '#34d399',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={16} />
              {successMsg}
            </div>
          )}

          {/* Submit Action */}
          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={uploading || !selectedFile || !configured}
              style={{
                backgroundColor: uploading || !selectedFile || !configured ? '#334155' : '#d9a441',
                color: uploading || !selectedFile || !configured ? '#94a3b8' : '#0b0d10',
                fontWeight: 700,
                fontSize: '0.9rem',
                padding: '0.65rem 1.4rem',
                borderRadius: '6px',
                border: 'none',
                cursor: uploading || !selectedFile || !configured ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {uploading ? 'Uploading PDF...' : 'Upload to Supabase'}
            </button>

            {selectedFile && (
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                disabled={uploading}
                style={{
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid #334155',
                  padding: '0.65rem 1.2rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Uploaded PDF Listing Section */}
      <div
        style={{
          background: '#11161d',
          border: '1px solid #222d38',
          borderRadius: '12px',
          padding: '1.75rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.15rem' }}>
              Files in '{customFolder}' ({filteredFiles.length})
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Storage Bucket: <strong>{BUCKET_NAME}</strong>
            </span>
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <Search
              size={16}
              color="#64748b"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search filename..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                backgroundColor: '#0b0d10',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#f8fafc',
                fontSize: '0.85rem',
              }}
            />
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: '8px' }} />
            <p style={{ margin: 0 }}>Querying Supabase Storage...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3.5rem 1rem',
              border: '1px dashed #334155',
              borderRadius: '8px',
              color: '#94a3b8',
            }}
          >
            <FileText size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#cbd5e1', fontWeight: 600 }}>
              No PDF files found in folder '{customFolder}'
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>
              Upload your first PDF above or run "Sync ImageKit Library to Supabase" to populate files.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222d38', color: '#94a3b8' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Filename</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Size</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Updated</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFiles.map((file) => (
                  <tr
                    key={file.id || file.name}
                    style={{
                      borderBottom: '1px solid #1a2430',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#161e27')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '0.85rem 1rem', color: '#f8fafc', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} color="#d9a441" />
                        <span style={{ wordBreak: 'break-all' }}>{file.name}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', paddingLeft: '24px' }}>
                        {file.path}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {formatFileSize(file.metadata?.size)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {formatDate(file.updated_at || file.created_at)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        {/* Preview in website viewer */}
                        <button
                          type="button"
                          title="Preview in PDF Viewer"
                          onClick={() => {
                            navigate('/pdfpreview', {
                              state: {
                                pdfUrl: file.publicUrl,
                                title: file.name.replace(/\.pdf$/i, ''),
                                isImage: false,
                              },
                            });
                          }}
                          style={{
                            background: '#1e293b',
                            border: '1px solid #334155',
                            color: '#38bdf8',
                            borderRadius: '5px',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                          }}
                        >
                          <ExternalLink size={13} />
                          Preview
                        </button>

                        {/* Direct Download */}
                        <button
                          type="button"
                          title="Download PDF"
                          onClick={() => handleDownload(file)}
                          style={{
                            background: '#1e293b',
                            border: '1px solid #334155',
                            color: '#4ade80',
                            borderRadius: '5px',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                          }}
                        >
                          <Download size={13} />
                          Download
                        </button>

                        {/* Copy URL */}
                        <button
                          type="button"
                          title="Copy Supabase URL"
                          onClick={() => handleCopyUrl(file.publicUrl, file.path)}
                          style={{
                            background: '#1e293b',
                            border: '1px solid #334155',
                            color: copiedPath === file.path ? '#34d399' : '#cbd5e1',
                            borderRadius: '5px',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                          }}
                        >
                          <Copy size={13} />
                          {copiedPath === file.path ? 'Copied!' : 'Copy'}
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          title="Delete from Storage"
                          onClick={() => handleDelete(file.path, file.name)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171',
                            borderRadius: '5px',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '1.25rem',
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredFiles.length)} of {filteredFiles.length}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                      background: '#1e293b',
                      color: currentPage === 1 ? '#475569' : '#f8fafc',
                      border: '1px solid #334155',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Previous
                  </button>
                  <span style={{ padding: '4px 8px', color: '#d9a441', fontWeight: 600 }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      background: '#1e293b',
                      color: currentPage === totalPages ? '#475569' : '#f8fafc',
                      border: '1px solid #334155',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Storage Configuration & Security Information Card */}
      <div
        style={{
          background: '#0d131b',
          border: '1px solid #222d38',
          borderRadius: '12px',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Shield size={18} color="#34d399" />
          <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '0.95rem' }}>
            Supabase Storage Permissions & Security Policies (RLS)
          </h4>
        </div>
        <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#94a3b8' }}>
          To allow browser-side PDF previewing and direct downloads while preventing unauthorized file deletions or public tampering, ensure your <code>pdfs</code> bucket has these SQL Row-Level Security policies applied in your Supabase SQL Editor:
        </p>

        <pre
          style={{
            background: '#050709',
            border: '1px solid #1e293b',
            borderRadius: '6px',
            padding: '1rem',
            color: '#38bdf8',
            fontSize: '0.8rem',
            overflowX: 'auto',
            lineHeight: '1.5',
            margin: 0,
          }}
        >
{`-- 1. Create the 'pdfs' bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs', 'pdfs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow public/anonymous reads for PDF viewing and downloads
CREATE POLICY "Public Read Access for PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'pdfs');

-- 3. Allow authenticated or authorized uploads
CREATE POLICY "Allow Uploads to PDFs Bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pdfs');`}
        </pre>
      </div>
    </div>
  );
}
