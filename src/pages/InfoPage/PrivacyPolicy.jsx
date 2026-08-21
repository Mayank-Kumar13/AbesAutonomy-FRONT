import React from 'react';
import './InfoPage.css';

const PrivacyPolicy = () => {
  return (
    <div className="info-page-wrapper">
      <div className="info-container">
        <h1 className="info-title">Privacy Policy</h1>
        
        <p className="info-text">
          Effective Date: July 2026<br/>
          At ABES Autonomy, your privacy is our priority. This policy outlines how we handle your data when you access our academic resources, past papers, and portal features.
        </p>
        
        <h2 className="info-heading">1. Information We Collect</h2>
        <ul className="info-list">
          <li><strong>Account Data:</strong> When you register, we collect basic profile details like your Student ID, username, and email.</li>
          <li><strong>Platform Usage:</strong> We track which subjects and materials are accessed the most to help us prioritize uploading high-demand content.</li>
        </ul>

        <h2 className="info-heading">2. How We Use Your Data</h2>
        <p className="info-text">
          Your data is strictly used to improve your academic experience. We use it to maintain account security, provide personalized subject recommendations, and ensure the platform runs smoothly without server overload. We <span className="highlight">never</span> sell or share your data with third-party advertisers.
        </p>

        <h2 className="info-heading">3. Security Measures</h2>
        <p className="info-text">
          We implement robust, industry-standard security protocols to protect your passwords and personal information. However, please ensure you keep your login credentials secure and do not share your account.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;