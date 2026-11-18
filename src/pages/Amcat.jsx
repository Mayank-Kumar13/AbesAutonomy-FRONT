import React from 'react';
import { FaInstagram } from 'react-icons/fa';

const Amcat = () => {
  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh', 
      minHeight: '100dvh',
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#090c10', 
      padding: 'clamp(24px, 5vw, 40px) clamp(16px, 4vw, 24px)',
      color: '#C5AC86',
      fontFamily: 'inherit'
    }}>
      <img 
        src="/MVP_POSTER.png" 
        alt="MVP Projects Poster" 
        style={{ 
          maxWidth: '100%', 
          maxHeight: '65vh',
          height: 'auto', 
          borderRadius: '12px', 
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)', 
          marginBottom: 'clamp(20px, 4vw, 40px)' 
        }} 
      />
      
      <div style={{ textAlign: 'center', maxWidth: '600px', width: '100%' }}>
        <h2 style={{ marginBottom: '14px', fontSize: 'clamp(1.25rem, 5vw, 28px)', fontWeight: 'bold' }}>Got An Amazing Project? Just Pitch It</h2>
        <p style={{ fontSize: 'clamp(0.95rem, 3.5vw, 18px)', marginBottom: '24px', lineHeight: '1.6', color: '#e0cfa5' }}>
          If you have an Amazing Project, just DM us! We are always looking for innovative student projects to feature and collaborate on.
        </p>
        
        <a 
          href="https://www.instagram.com/abes_autonomy/" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            backgroundColor: '#C5AC86',
            color: '#090c10',
            padding: '12px clamp(20px, 4vw, 28px)',
            borderRadius: '50px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: 'clamp(0.95rem, 3.5vw, 17px)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            boxShadow: '0 4px 12px rgba(197, 172, 134, 0.3)',
            maxWidth: '100%'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(197, 172, 134, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(197, 172, 134, 0.3)';
          }}
        >
          <FaInstagram size={24} />
          DM us on Instagram
        </a>
      </div>
    </div>
  )
}

export default Amcat;
