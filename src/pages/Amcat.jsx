import React from 'react';
import { FaInstagram } from 'react-icons/fa';
import { ArrowUpRight, Rocket } from 'lucide-react';

const Amcat = () => {
  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100dvh',
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: 'var(--bg-canvas, #060709)', 
      padding: '100px 24px 80px',
      color: 'var(--text-primary, #F5F5F7)',
      fontFamily: 'var(--font-family-sans, -apple-system, sans-serif)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Ambient lighting */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '800px',
        height: '400px',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(197, 172, 134, 0.08) 0%, transparent 65%)',
        pointerEvents: 'none',
        zIndex: 0
      }} aria-hidden="true" />

      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '840px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        {/* Poster in Frosted Glass Container */}
        <div style={{
          position: 'relative',
          padding: '10px',
          borderRadius: '24px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          marginBottom: '36px',
          maxWidth: '560px',
          width: '100%'
        }}>
          <img 
            src="/MVP_POSTER.png" 
            alt="MVP Projects Poster" 
            style={{ 
              width: '100%', 
              height: 'auto', 
              borderRadius: '16px', 
              display: 'block' 
            }} 
          />
        </div>
        
        <div style={{ maxWidth: '620px', width: '100%' }}>
          <h1 style={{ 
            marginBottom: '14px', 
            fontSize: 'clamp(26px, 4.5vw, 38px)', 
            fontWeight: 750,
            letterSpacing: '-0.03em',
            color: '#FFFFFF',
            lineHeight: 1.15
          }}>
            Got An Amazing Project?<br />Pitch It to ABES Autonomy.
          </h1>
          <p style={{ 
            fontSize: '15px', 
            marginBottom: '28px', 
            lineHeight: '1.6', 
            color: 'var(--text-secondary, #A1A1A6)' 
          }}>
            Are you building innovative software, hardware, or AI models? Reach out directly via our Instagram. 
            We showcase outstanding student ventures to the entire ABES community.
          </p>
          
          <a 
            href="https://www.instagram.com/abes_autonomy/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="glass-btn-gold"
            style={{
              padding: '12px 28px',
              fontSize: '15px',
              fontWeight: 650
            }}
          >
            <FaInstagram size={18} />
            <span>Connect on Instagram</span>
            <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Amcat;
