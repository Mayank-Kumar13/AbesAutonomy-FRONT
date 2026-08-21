import React from 'react';
import './InfoPage.css';

const Terms = () => {
  return (
    <div className="info-page-wrapper">
      <div className="info-container">
        <h1 className="info-title">Terms & Conditions</h1>
        
        <p className="info-text">
          By accessing and using ABES Autonomy, you agree to abide by the following terms of service. Please read them carefully.
        </p>
        
        <h2 className="info-heading">1. Educational Use Only</h2>
        <p className="info-text">
          All materials provided on this platform—including notes, previous year papers, and assignments—are intended strictly for personal, non-commercial, educational use. You may not sell or redistribute these materials for profit.
        </p>

        <h2 className="info-heading">2. User Conduct</h2>
        <ul className="info-list">
          <li>You agree not to attempt to breach the platform's security or overload the servers.</li>
          <li>When contributing materials, you must ensure you have the right to share them and that they do not violate any academic integrity policies.</li>
          <li>Spamming or inappropriate behavior in community features will result in account suspension.</li>
        </ul>

        <h2 className="info-heading">3. Disclaimer of Warranties</h2>
        <p className="info-text">
          While we strive to provide accurate and up-to-date resources, ABES Autonomy makes no guarantees regarding the absolute correctness of student-contributed notes or the exact format of upcoming examinations. Always cross-reference with your official syllabus.
        </p>
      </div>
    </div>
  );
};

export default Terms;