import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './UnderConstruction.css';

const UnderConstruction = () => {
  const [progress, setProgress] = useState(0);
  const { user, logout } = useAuth();

  useEffect(() => {
    try {
      localStorage.removeItem('bypass_construction');
    } catch {
      // ignore
    }
    const timer = setTimeout(() => setProgress(85), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="uc-page">
      {/* ── Animated glow blobs (visible behind the card) ── */}
      <div className="uc-glow-layer" aria-hidden="true">
        <div className="uc-blob uc-blob-1" />
        <div className="uc-blob uc-blob-2" />
        <div className="uc-blob uc-blob-3" />
        <div className="uc-blob uc-blob-4" />
      </div>

      {/* ── Single centered notice card ── */}
      <div className="uc-notice">
        {/* Top shine streak */}
        <div className="uc-shine" />

        {/* Title */}
        <h1 className="uc-title">
          ABES Autonomy <span className="uc-v">2.0</span>
        </h1>

        {/* Subtitle */}
        <p className="uc-sub">
          We're building something extraordinary. A completely reimagined
          platform with powerful new features, stunning design, and
          unmatched performance.
        </p>

        <p className="uc-hindi">
          हम कुछ बेहतरीन नए फीचर्स के साथ जल्द वापस आ रहे हैं ✨
        </p>

        {/* Divider */}
        <div className="uc-divider" />

        {/* Progress */}
        <div className="uc-progress-section">
          <div className="uc-progress-head">
            <span className="uc-progress-icon">🚀</span>
            <div>
              <strong>Development Progress</strong>
              <span className="uc-progress-status">Almost there — final touches</span>
            </div>
          </div>
          <div className="uc-track">
            <div className="uc-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="uc-progress-meta">
            <span>{progress}% Complete</span>
            <span>Launching Soon</span>
          </div>
        </div>

        {/* Divider */}
        <div className="uc-divider" />

        {/* Features */}
        <p className="uc-feat-label">WHAT'S COMING</p>
        <div className="uc-feat-grid">
          <div className="uc-feat">
            <span className="uc-feat-icon">⚡</span>
            <span>Faster & Smarter UI</span>
          </div>
          <div className="uc-feat">
            <span className="uc-feat-icon">📚</span>
            <span>Upgraded Study Hub</span>
          </div>
          <div className="uc-feat">
            <span className="uc-feat-icon">🔍</span>
            <span>Instant Search</span>
          </div>
          <div className="uc-feat">
            <span className="uc-feat-icon">🛡️</span>
            <span>Enhanced Security</span>
          </div>
          <div className="uc-feat">
            <span className="uc-feat-icon">📊</span>
            <span>Progress Tracking</span>
          </div>
          <div className="uc-feat">
            <span className="uc-feat-icon">👥</span>
            <span>Community Features</span>
          </div>
        </div>

        {/* Footer message */}
        <div className="uc-divider" />
        <p className="uc-footer-msg">
          Thank you for your patience.<br />
          We'll be back very soon with an incredible new experience!
        </p>

        {/* Admin links */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1.2rem' }}>
          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                Signed in as <strong style={{ color: '#DFCAAA' }}>{user.name || user.email}</strong> (Non-Admin)
              </span>
              <button
                type="button"
                onClick={() => {
                  logout?.();
                  window.location.href = '/login';
                }}
                className="uc-admin-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Log Out / Switch to Admin Account
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              state={{ from: { pathname: '/admin' } }}
              className="uc-admin-link"
              style={{ marginTop: 0 }}
            >
              Admin Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnderConstruction;
