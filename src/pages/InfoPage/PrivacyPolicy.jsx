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
          Your account data is strictly used to improve your academic experience. We use it to maintain account security, provide personalized subject recommendations, and ensure the platform runs smoothly without server overload. We <span className="highlight">never</span> sell your personal student records or account details.
        </p>

        <h2 className="info-heading">3. Security Measures</h2>
        <p className="info-text">
          We implement robust, industry-standard security protocols to protect your passwords and personal information. However, please ensure you keep your login credentials secure and do not share your account.
        </p>

        <h2 className="info-heading">4. Advertising &amp; Cookies (Google AdSense)</h2>
        <p className="info-text">
          To keep free study materials accessible to students, we partner with third-party advertising networks including Google AdSense to display non-intrusive advertisements across selected resource pages. Third-party vendors, including Google, use cookies to serve ads based on a user&apos;s prior visits to ABES Autonomy (abes.work) or other websites.
        </p>
        <p className="info-text">
          Google&apos;s use of advertising cookies enables it and its partners to serve ads to you based on your visits across the internet. You may opt out of personalized advertising at any time by visiting{' '}
          <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer" className="highlight">
            Google Ad Settings
          </a>{' '}
          or{' '}
          <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="highlight">
            aboutads.info
          </a>.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;