import React from 'react';
import './InfoPage.css'; 

const About = () => {
  return (
    <div className="info-page-wrapper">
      <div className="info-container">
        <h1 className="info-title">About ABES Autonomy</h1>
        
        <p className="info-text">
          ABES Autonomy is a centralized platform designed to empower students by providing seamless access to academic resources, previous year papers, detailed notes, and essential study materials.
        </p>
        
        <h2 className="info-heading">Our Mission</h2>
        <p className="info-text">
          We believe that finding the right study material shouldn't be the hardest part of your engineering journey. Our goal is to streamline the academic process, making high-quality resources available at the click of a button so you can focus on what truly matters: learning, building, and innovating.
        </p>

        <h2 className="info-heading">Behind the Platform</h2>
        <p className="info-text">
          This platform is proudly built and maintained by a dedicated team of developers from the Computer Science and Engineering (CSE) department: <span className="highlight">Mukul Yadav</span>, <span className="highlight">Mayank Kumar</span>, and <span className="highlight">Mayank Kotuli</span>. As fellow students, our shared vision is to solve the exact problems we face during exam preparations and project deadlines, creating a robust and reliable tool for the entire campus community.
        </p>
      </div>
    </div>
  );
};

export default About;