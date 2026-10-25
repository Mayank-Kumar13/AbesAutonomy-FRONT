import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Rocket, Zap, BookOpen, Layers } from 'lucide-react';
import './UnderConstruction.css';

const UnderConstruction = () => {
  return (
    <div className="uc-wrapper">
      <div className="uc-bg-decorations" aria-hidden="true">
        <div className="uc-light-orb uc-orb-1" />
        <div className="uc-light-orb uc-orb-2" />
      </div>

      <div className="uc-content">
        {/* Festive Badge */}
        <div className="uc-top-badge">
          <Sparkles className="uc-badge-icon" size={15} />
          <span>FESTIVE UPGRADE NOTICE</span>
          <Sparkles className="uc-badge-icon" size={15} />
        </div>

        {/* Main Title & Version */}
        <h1 className="uc-title">
          ABES Autonomy <span className="uc-version-highlight">2.0</span>
        </h1>

        {/* Coming Soon Notice */}
        <div className="uc-coming-soon-banner">
          <Rocket className="uc-rocket-icon" size={18} />
          <span>Coming Soon with New Features!</span>
        </div>

        {/* Diwali Reopening Highlight Box */}
        <div className="uc-reopen-card">
          <div className="uc-diya-icon">🪔</div>
          <div className="uc-reopen-info">
            <h2 className="uc-reopen-title">Website Reopening After Diwali</h2>
            <p className="uc-reopen-hindi">अब वेबसाइट दिवाली के बाद नए फीचर्स के साथ खुलेगी</p>
          </div>
        </div>

        {/* Description */}
        <p className="uc-description">
          We are upgrading our platform to bring you a massively improved experience. 
          Get ready for <strong>ABES Autonomy 2.0</strong> packed with exciting new features, 
          smoother performance, and enhanced study tools!
        </p>

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
            <Layers size={15} className="uc-feat-icon" />
            <span>Exciting New Features</span>
          </div>
        </div>

        {/* Working GIF */}
        <div className="uc-gif-container">
          <img 
            src="https://gifsec.com/wp-content/uploads/2022/12/under-construction-gif-2.gif" 
            alt="Site under construction for 2.0 upgrade"
            className="uc-working-gif"
          />
        </div>

        {/* Festive Wish */}
        <div className="uc-wishes-banner">
          ✨ Wishing Everyone a Happy & Prosperous Diwali! 🪔
        </div>

        <p className="uc-check-back">Thank you for your patience. Please check back after Diwali!</p>
        
        {/* Hidden link for admins to access the login page */}
        <Link to="/login" state={{ from: { pathname: '/admin' } }} className="uc-admin-link">
          Admin Login
        </Link>
      </div>
    </div>
  );
};

export default UnderConstruction;
