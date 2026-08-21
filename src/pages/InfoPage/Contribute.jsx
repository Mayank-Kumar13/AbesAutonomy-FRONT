import React from 'react';
import './InfoPage.css';

const Contribute = () => {
  return (
    <div className="info-page-wrapper">
      <div className="info-container">
        <h1 className="info-title">Contribute to the Platform</h1>
        
        <p className="info-text">
          ABES Autonomy is built <em>by</em> students, <em>for</em> students. The platform thrives when we collaborate and share knowledge. Here is how you can help make this the ultimate academic resource.
        </p>
        
        <h2 className="info-heading">1. Share Academic Resources</h2>
        <p className="info-text">
          Do you have high-quality handwritten notes, lab manuals, or previous year question papers? 
        </p>
        <ul className="info-list">
          <li>Scan your documents clearly into a PDF format.</li>
          <li>Ensure the subject name, semester, and year are clearly labeled.</li>
          <li>Email your contributions to our content team to get them verified and uploaded.</li>
        </ul>

        <h2 className="info-heading">2. Join the Development Team</h2>
        <p className="info-text">
          Are you passionate about React, web development, or UI/UX design? We are always looking for driven students to help build new features, optimize the database, and improve the interface. 
          <br /><br />
          If you want real-world project experience, reach out via the Contact page and include a link to your GitHub profile!
        </p>
      </div>
    </div>
  );
};

export default Contribute;