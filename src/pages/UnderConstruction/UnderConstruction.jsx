import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './UnderConstruction.css';

const UnderConstruction = () => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setProgress(85), 600);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: '⚡',
      title: 'Lightning Fast UI',
      desc: 'Completely rebuilt interface with blazing performance',
    },
    {
      icon: '📚',
      title: 'Smart Study Hub',
      desc: 'AI-powered study tools and intelligent resource discovery',
    },
    {
      icon: '🔍',
      title: 'Instant Search',
      desc: 'Find notes, papers, and resources in milliseconds',
    },
    {
      icon: '🛡️',
      title: 'Enhanced Security',
      desc: 'New authentication system with added protection',
    },
    {
      icon: '📊',
      title: 'Progress Tracking',
      desc: 'Track your study progress and performance analytics',
    },
    {
      icon: '👥',
      title: 'Community',
      desc: 'Collaborate with peers and share resources seamlessly',
    },
  ];

  return (
    <div className="uc-page">
      {/* Ambient glow orbs */}
      <div className="uc-glow-orbs" aria-hidden="true">
        <div className="uc-orb uc-orb-1" />
        <div className="uc-orb uc-orb-2" />
        <div className="uc-orb uc-orb-3" />
      </div>

      {/* Noise overlay for texture */}
      <div className="uc-noise" aria-hidden="true" />

      <div className="uc-container">
        {/* Hero Section */}
        <div className="uc-hero">
          <div className="uc-badge">
            <span className="uc-badge-dot" />
            <span>Opening Soon</span>
          </div>

          <h1 className="uc-heading">
            ABES Autonomy
            <span className="uc-version">2.0</span>
          </h1>

          <p className="uc-subheading">
            Something extraordinary is being built. A completely reimagined
            platform with powerful new features, stunning design, and unmatched
            performance.
          </p>

          <p className="uc-hindi">
            हम कुछ बेहतरीन नए फीचर्स के साथ जल्द वापस आ रहे हैं ✨
          </p>
        </div>

        {/* Progress Glass Card */}
        <div className="uc-glass-card uc-progress-card">
          <div className="uc-card-shine" />
          <div className="uc-progress-header">
            <span className="uc-progress-emoji">🚀</span>
            <div>
              <h2 className="uc-progress-title">Development Progress</h2>
              <p className="uc-progress-status">Almost there — final touches in progress</p>
            </div>
          </div>
          <div className="uc-progress-track">
            <div
              className="uc-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="uc-progress-meta">
            <span>{progress}% Complete</span>
            <span>Launching Soon</span>
          </div>
        </div>

        {/* Features Grid */}
        <h3 className="uc-section-label">What's Coming</h3>
        <div className="uc-features-grid">
          {features.map((f, i) => (
            <div className="uc-glass-card uc-feature-card" key={i}>
              <div className="uc-card-shine" />
              <span className="uc-feature-icon">{f.icon}</span>
              <h4 className="uc-feature-title">{f.title}</h4>
              <p className="uc-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom message */}
        <div className="uc-bottom">
          <p className="uc-thanks">
            Thank you for your patience. We'll be back very soon.
          </p>
        </div>

        {/* Hidden admin link */}
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
