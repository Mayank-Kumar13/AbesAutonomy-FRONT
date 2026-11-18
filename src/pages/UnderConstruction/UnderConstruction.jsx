import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Rocket,
  Zap,
  BookOpen,
  Layers,
  Shield,
  Clock,
  Bell,
  Search,
  Users,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import './UnderConstruction.css';

const UnderConstruction = () => {
  /* ── Progress bar animation ── */
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setProgress(85), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="uc-wrapper">
      {/* Background decorative orbs */}
      <div className="uc-bg-decorations" aria-hidden="true">
        <div className="uc-light-orb uc-orb-1" />
        <div className="uc-light-orb uc-orb-2" />
        <div className="uc-light-orb uc-orb-3" />
      </div>

      <div className="uc-content">
        {/* Top Badge */}
        <div className="uc-top-badge">
          <Sparkles className="uc-badge-icon" size={15} />
          <span>MAJOR UPGRADE IN PROGRESS</span>
          <Sparkles className="uc-badge-icon" size={15} />
        </div>

        {/* Main Title & Version */}
        <h1 className="uc-title">
          ABES Autonomy <span className="uc-version-highlight">2.0</span>
        </h1>

        {/* Opening Soon Banner */}
        <div className="uc-coming-soon-banner">
          <Rocket className="uc-rocket-icon" size={18} />
          <span>Opening Soon with New Features!</span>
        </div>

        {/* Status / Progress Card */}
        <div className="uc-status-card">
          <div className="uc-status-icon">🚀</div>
          <div className="uc-status-info">
            <h2 className="uc-status-title">We're Almost Ready!</h2>
            <p className="uc-status-subtitle">
              हम कुछ बेहतरीन नए फीचर्स के साथ जल्द वापस आ रहे हैं
            </p>
            <div className="uc-progress-bar-wrapper">
              <div className="uc-progress-bar">
                <div
                  className="uc-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="uc-progress-label">{progress}% Complete</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="uc-description">
          We are rebuilding our platform from the ground up to bring you a massively
          improved experience. <strong>ABES Autonomy 2.0</strong> is packed with
          powerful new tools, smoother performance, and a completely redesigned
          interface.
        </p>

        {/* What's New Section */}
        <div className="uc-whats-new-header">
          <Zap size={16} />
          <span>What's Coming in 2.0</span>
        </div>

        {/* Feature Highlights Grid */}
        <div className="uc-features-grid">
          <div className="uc-feature-pill">
            <Zap size={15} className="uc-feat-icon" />
            <span>Faster & Smarter UI</span>
          </div>
          <div className="uc-feature-pill">
            <BookOpen size={15} className="uc-feat-icon" />
            <span>Upgraded Study Hub</span>
          </div>
          <div className="uc-feature-pill">
            <Search size={15} className="uc-feat-icon" />
            <span>Smart Search</span>
          </div>
          <div className="uc-feature-pill">
            <Shield size={15} className="uc-feat-icon" />
            <span>Enhanced Security</span>
          </div>
          <div className="uc-feature-pill">
            <BarChart3 size={15} className="uc-feat-icon" />
            <span>Progress Tracking</span>
          </div>
          <div className="uc-feature-pill">
            <Users size={15} className="uc-feat-icon" />
            <span>Community Features</span>
          </div>
          <div className="uc-feature-pill">
            <Layers size={15} className="uc-feat-icon" />
            <span>Better Resource Org</span>
          </div>
          <div className="uc-feature-pill">
            <Clock size={15} className="uc-feat-icon" />
            <span>Exam Countdown</span>
          </div>
        </div>

        {/* GIF */}
        <div className="uc-gif-container">
          <img
            src="https://media.giphy.com/media/RbDKaczqWovIugyJmW/giphy.gif"
            alt="Developer working on the upgrade"
            className="uc-working-gif"
          />
        </div>

        {/* Stay Tuned Banner */}
        <div className="uc-stay-tuned-banner">
          <Bell size={16} className="uc-bell-icon" />
          <span>Stay Tuned — Something Amazing is Coming!</span>
          <ArrowRight size={16} />
        </div>

        <p className="uc-check-back">
          Thank you for your patience. We'll be back very soon with an incredible new
          experience!
        </p>

        {/* Hidden link for admins to access the login page */}
        <Link
          to="/login"
          state={{ from: { pathname: '/admin' } }}
          className="uc-admin-link"
        >
          Admin Login
        </Link>
      </div>
    </div>
  );
};

export default UnderConstruction;
