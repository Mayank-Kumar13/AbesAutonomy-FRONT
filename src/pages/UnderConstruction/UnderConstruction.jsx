import React from 'react';
import { Link } from 'react-router-dom';
import './UnderConstruction.css';

const UnderConstruction = () => {
  return (
    <div className="uc-wrapper">
      <div className="uc-content">
        <h1 className="uc-title">ABES Autonomy</h1>
        <h2 className="uc-subtitle">Website Under Construction</h2>
        <p className="uc-description">
          We're getting things ready and preparing something amazing for you. 
          The full website experience will be available very soon!
        </p>
        <div className="uc-date-badge">
          Official Launch: 5 September
        </div>
        <p className="uc-check-back">Please check back soon.</p>
        
        {/* Hidden link for admins to access the login page */}
        <Link to="/login" className="uc-admin-link">
          Admin Login
        </Link>
      </div>
    </div>
  );
};

export default UnderConstruction;
