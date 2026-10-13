import React, { useState, useEffect, useCallback } from 'react';
import { authApi } from '../../auth/authApi';
import { Trophy, Clock, BookOpen, Users, RefreshCw, ChevronDown, ChevronUp, Search, Award } from 'lucide-react';
import './TopReadersLeaderboard.css';

const formatDuration = (ms) => {
  if (!ms || ms <= 0) return '< 1m';
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' on ' + new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export default function TopReadersLeaderboard() {
  const [timeframe, setTimeframe] = useState('24h');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUsers, setExpandedUsers] = useState({});

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authApi.getTopReaders(timeframe);
      if (res && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch top readers:', err);
      setError(err.message || 'Failed to load reading leaderboard');
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const toggleExpand = (userId) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const top3 = data?.top3 || [];
  const top10 = data?.top10 || [];
  const summary = data?.summary || { totalReadingTimeMs: 0, activeReadersCount: 0, uniquePdfsReadCount: 0 };

  const filteredTop10 = top10.filter((reader) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchesUser =
      (reader.name && reader.name.toLowerCase().includes(q)) ||
      (reader.email && reader.email.toLowerCase().includes(q));
    const matchesPdf = (reader.pdfsRead || []).some(
      (p) => p.pdfTitle && p.pdfTitle.toLowerCase().includes(q)
    );
    return matchesUser || matchesPdf;
  });

  return (
    <div className="top-readers-container">
      {/* Header & Controls */}
      <div className="top-readers-header">
        <div className="top-readers-title-group">
          <h2 className="top-readers-title">
            <Trophy size={26} color="#eab308" />
            Reading Leaderboard & Analytics
          </h2>
          <p className="top-readers-subtitle">
            Track top active students, total study duration, and exact documents read in the selected period.
          </p>
        </div>

        <div className="top-readers-controls">
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className={`timeframe-pill-btn ${timeframe === '24h' ? 'active' : ''}`}
              onClick={() => setTimeframe('24h')}
            >
              Last 24 Hours
            </button>
            <button
              className={`timeframe-pill-btn ${timeframe === '7d' ? 'active' : ''}`}
              onClick={() => setTimeframe('7d')}
            >
              Last 7 Days
            </button>
            <button
              className={`timeframe-pill-btn ${timeframe === '30d' ? 'active' : ''}`}
              onClick={() => setTimeframe('30d')}
            >
              Last 30 Days
            </button>
            <button
              className={`timeframe-pill-btn ${timeframe === 'all' ? 'active' : ''}`}
              onClick={() => setTimeframe('all')}
            >
              All Time
            </button>
          </div>

          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#cbd5e1',
              padding: '6px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="top-readers-summary-grid">
        <div className="summary-stat-card">
          <div className="stat-icon-wrapper stat-icon-time">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Reading Time ({timeframe})</span>
            <span className="stat-number">{formatDuration(summary.totalReadingTimeMs)}</span>
          </div>
        </div>

        <div className="summary-stat-card">
          <div className="stat-icon-wrapper stat-icon-users">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Active Students Reading</span>
            <span className="stat-number">{summary.activeReadersCount || 0}</span>
          </div>
        </div>

        <div className="summary-stat-card">
          <div className="stat-icon-wrapper stat-icon-docs">
            <BookOpen size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Documents Accessed</span>
            <span className="stat-number">{summary.uniquePdfsReadCount || 0}</span>
          </div>
        </div>
      </div>

      {/* Top 3 Readers Podium */}
      {top3.length > 0 && (
        <div className="podium-section">
          <h3 className="podium-title">
            <Award size={20} color="#eab308" />
            Top 3 Readers ({timeframe === '24h' ? 'Last 24 Hours' : timeframe.toUpperCase()})
          </h3>

          <div className="podium-grid">
            {/* Rank 1 (Center or First) */}
            {top3[0] && (
              <div className="podium-card podium-gold" style={{ order: 1 }}>
                <div className="podium-badge-wrapper">
                  <span className="podium-rank-badge badge-gold">🥇 Rank #1 Champion</span>
                  <Trophy size={20} color="#eab308" />
                </div>
                <h4 className="podium-user-name" title={top3[0].name}>{top3[0].name}</h4>
                <p className="podium-user-email" title={top3[0].email}>{top3[0].email}</p>

                <div className="podium-stat-highlight">
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Time Read</span>
                    <div className="podium-time-val">{formatDuration(top3[0].totalReadTimeMs)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Documents</span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>{top3[0].totalPdfsCount} PDFs</div>
                  </div>
                </div>

                <div className="podium-top-pdf-box">
                  <div className="podium-pdf-label">Most Read Document:</div>
                  <div className="podium-pdf-title" title={top3[0].pdfsRead?.[0]?.pdfTitle || '—'}>
                    {top3[0].pdfsRead?.[0]?.pdfTitle || '—'}
                  </div>
                </div>
              </div>
            )}

            {/* Rank 2 */}
            {top3[1] && (
              <div className="podium-card podium-silver" style={{ order: 2 }}>
                <div className="podium-badge-wrapper">
                  <span className="podium-rank-badge badge-silver">🥈 Rank #2</span>
                  <Award size={18} color="#cbd5e1" />
                </div>
                <h4 className="podium-user-name" title={top3[1].name}>{top3[1].name}</h4>
                <p className="podium-user-email" title={top3[1].email}>{top3[1].email}</p>

                <div className="podium-stat-highlight">
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Time Read</span>
                    <div className="podium-time-val">{formatDuration(top3[1].totalReadTimeMs)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Documents</span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>{top3[1].totalPdfsCount} PDFs</div>
                  </div>
                </div>

                <div className="podium-top-pdf-box">
                  <div className="podium-pdf-label">Most Read Document:</div>
                  <div className="podium-pdf-title" title={top3[1].pdfsRead?.[0]?.pdfTitle || '—'}>
                    {top3[1].pdfsRead?.[0]?.pdfTitle || '—'}
                  </div>
                </div>
              </div>
            )}

            {/* Rank 3 */}
            {top3[2] && (
              <div className="podium-card podium-bronze" style={{ order: 3 }}>
                <div className="podium-badge-wrapper">
                  <span className="podium-rank-badge badge-bronze">🥉 Rank #3</span>
                  <Award size={18} color="#f97316" />
                </div>
                <h4 className="podium-user-name" title={top3[2].name}>{top3[2].name}</h4>
                <p className="podium-user-email" title={top3[2].email}>{top3[2].email}</p>

                <div className="podium-stat-highlight">
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Time Read</span>
                    <div className="podium-time-val">{formatDuration(top3[2].totalReadTimeMs)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Documents</span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>{top3[2].totalPdfsCount} PDFs</div>
                  </div>
                </div>

                <div className="podium-top-pdf-box">
                  <div className="podium-pdf-label">Most Read Document:</div>
                  <div className="podium-pdf-title" title={top3[2].pdfsRead?.[0]?.pdfTitle || '—'}>
                    {top3[2].pdfsRead?.[0]?.pdfTitle || '—'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top 10 Readers Detailed Breakdown Table */}
      <div className="top-readers-table-section">
        <div className="table-section-header">
          <h3 className="table-section-title">
            Top 10 Readers Breakdown (Kitna Padha & Kya PDF Padhi)
          </h3>

          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search student or PDF..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="reader-search-input"
              style={{ paddingLeft: '32px' }}
            />
          </div>
        </div>

        {filteredTop10.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="readers-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Rank</th>
                  <th>Student Info</th>
                  <th>Kitna Padha (Read Time)</th>
                  <th>Total PDFs</th>
                  <th>Kya PDF Padhi (Documents & Time)</th>
                  <th>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {filteredTop10.map((reader) => {
                  const isExpanded = !!expandedUsers[reader.userId];
                  const pdfs = reader.pdfsRead || [];
                  const displayedPdfs = isExpanded ? pdfs : pdfs.slice(0, 2);
                  const hasMore = pdfs.length > 2;

                  let rankClass = '';
                  if (reader.rank === 1) rankClass = 'rank-gold';
                  else if (reader.rank === 2) rankClass = 'rank-silver';
                  else if (reader.rank === 3) rankClass = 'rank-bronze';

                  return (
                    <tr key={reader.userId}>
                      <td>
                        <div className={`reader-rank-circle ${rankClass}`}>
                          #{reader.rank}
                        </div>
                      </td>

                      <td>
                        <div className="reader-user-cell">
                          <span className="reader-name">{reader.name}</span>
                          <span className="reader-email">{reader.email}</span>
                        </div>
                      </td>

                      <td>
                        <span className="time-badge">
                          {formatDuration(reader.totalReadTimeMs)}
                        </span>
                      </td>

                      <td style={{ fontWeight: 600, color: '#f1f5f9' }}>
                        {reader.totalPdfsCount} {reader.totalPdfsCount === 1 ? 'PDF' : 'PDFs'}
                      </td>

                      <td>
                        <div className="pdf-chips-wrapper">
                          {displayedPdfs.map((pdf, pIdx) => (
                            <div key={pIdx} className="pdf-chip" title={`${pdf.pdfTitle} (${pdf.subject || 'General'})`}>
                              <span className="pdf-chip-title">
                                📄 {pdf.pdfTitle}
                              </span>
                              <span className="pdf-chip-time">
                                ⏱️ {formatDuration(pdf.durationMs)}
                              </span>
                            </div>
                          ))}

                          {hasMore && (
                            <button
                              type="button"
                              className="toggle-more-pdfs-btn"
                              onClick={() => toggleExpand(reader.userId)}
                            >
                              {isExpanded ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  Show Less <ChevronUp size={14} />
                                </span>
                              ) : (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  + {pdfs.length - 2} more document(s) <ChevronDown size={14} />
                                </span>
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      <td style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                        {formatDate(reader.lastActiveAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-readers-box">
            <BookOpen size={48} className="empty-readers-icon" />
            <h4 style={{ margin: '0 0 8px 0', color: '#f1f5f9', fontSize: '1.1rem' }}>
              No reading activity found for this period
            </h4>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              Students haven't opened any PDFs in the {timeframe === '24h' ? 'last 24 hours' : timeframe}. Try switching the timeframe above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
