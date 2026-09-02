import React from 'react';
import './InfoPage.css';

const Contact = () => {
  return (
    <div className="info-page-wrapper">
      <div className="info-container">
        <h1 className="info-title">Contact Support</h1>
        
        <p className="info-text">
          Have a question, found a bug, or need help with your account? We are here to ensure your experience on ABES Autonomy is flawless.
        </p>
        
        <h2 className="info-heading">Get in Touch</h2>
        <ul className="info-list">
          <li><strong>Technical Support:</strong> If a PDF isn't loading or a page is broken, reach out to our dev team.</li>
          <li><strong>Resource Requests:</strong> Cannot find the specific previous year paper you need? Let us know the subject and year.</li>
        </ul>

        <h2 className="info-heading">Reach Out Directly</h2>
        <p className="info-text">
          Drop us an email at: <span className="highlight">abesautonomy30@gmail.com</span>
        </p>

        <h2 className="info-heading">Developer Contacts</h2>
        <p className="info-text" style={{ marginBottom: '10px' }}>
          For any urgent queries, collaboration, or feedback, you can reach out directly to the core developers:
        </p>
        <ul className="info-list">
          <li><strong>Mayank Kotuli:</strong> +91 9310664653</li>
          <li><strong>Mayank Kumar:</strong> +91 97602 98122</li>
          <li><strong>Mukul Yadav:</strong> +91 97582 81801</li>
        </ul>
        
        <p className="info-text" style={{ marginTop: '20px' }}>
          Alternatively, you can message the development team directly via our official social channels linked in the footer. We typically respond within 24 hours.
        </p>
      </div>
    </div>
  );
};

export default Contact;