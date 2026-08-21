import React from 'react';
import { Link } from 'react-router-dom'; // <-- The magic React Router link
import './Footer.css'; 
import { Camera, Play, Code, Briefcase } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer-wrapper">
      <div className="footer-container">
        
        {/* Main Grid Container */}
        <div className="footer-grid">
          
          {/* Left Column: Brand & Description */}
          <div className="brand-section">
            <div className="brand-logo">
              <span className="brand-icon">A</span>
              <span className="brand-text">ABES AUTONOMY</span>
            </div>
            
            <p className="brand-description">
              A centralized platform for academic resources, previous papers, notes and much more for ABES students.
            </p>

            {/* Social Icons */}
            <div className="social-icons">
              <button className="social-btn" aria-label="Instagram"><Camera size={16} strokeWidth={1.5} /></button>
              <button className="social-btn" aria-label="YouTube"><Play size={16} strokeWidth={1.5} /></button>
              <button className="social-btn" aria-label="Development"><Code size={16} strokeWidth={1.5} /></button>
              <button className="social-btn" aria-label="Portfolio"><Briefcase size={16} strokeWidth={1.5} /></button>
            </div>
          </div>

          {/* Middle Column: Platform Links */}
          <div className="link-column">
            <h3 className="link-heading">Platform</h3>
            <ul className="link-list">
              <li><Link to="/about">About</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/contribute">Contribute</Link></li>
            </ul>
          </div>

          {/* Right Column: Legal Links */}
          <div className="link-column">
            <h3 className="link-heading">Legal</h3>
            <ul className="link-list">
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms & Conditions</Link></li>
            </ul>
          </div>
          
        </div>
      </div>

      {/* Bottom Copyright Section */}
      <div className="footer-container">
        <div className="footer-bottom">
          <p className="copyright">
            © 2026 ABES Autonomy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;