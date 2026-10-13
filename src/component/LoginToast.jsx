import React, { useState, useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const LoginToast = () => {
  const [visible, setVisible] = useState(false);
  const [userName, setUserName] = useState('');
  const location = useLocation();

  const showToast = (name = '') => {
    if (name) setUserName(name);
    setVisible(true);
  };

  useEffect(() => {
    // Check if user just logged in via sessionStorage
    const flag = sessionStorage.getItem('just_logged_in');
    const storedName = sessionStorage.getItem('just_logged_in_name');
    if (flag) {
      sessionStorage.removeItem('just_logged_in');
      if (storedName) {
        setUserName(storedName);
        sessionStorage.removeItem('just_logged_in_name');
      }
      setVisible(true);
    }

    // Custom event listener so any flow can trigger it programmatically
    const handleLoginEvent = (e) => {
      showToast(e?.detail?.name || '');
    };

    window.addEventListener('show_login_toast', handleLoginEvent);
    return () => {
      window.removeEventListener('show_login_toast', handleLoginEvent);
    };
  }, [location.pathname]);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '28px',
        right: '28px',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        backgroundColor: 'rgba(15, 20, 28, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(74, 222, 128, 0.4)',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(34, 197, 94, 0.25)',
        borderRadius: '14px',
        padding: '16px 20px',
        color: '#f8fafc',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        maxWidth: '400px',
        animation: 'loginToastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          backgroundColor: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(74, 222, 128, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#4ade80',
          flexShrink: 0,
        }}
      >
        <CheckCircle2 size={22} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h4
          style={{
            margin: '0 0 2px 0',
            fontSize: '15px',
            fontWeight: '600',
            color: '#4ade80',
            letterSpacing: '0.3px',
          }}
        >
          Successfully Logged In!
        </h4>
        <p
          style={{
            margin: 0,
            fontSize: '13px',
            color: '#94a3b8',
            lineHeight: 1.4,
          }}
        >
          {userName ? `Welcome back, ${userName}!` : 'Welcome back to ABES Autonomy.'}
        </p>
      </div>

      <button
        onClick={() => setVisible(false)}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#64748b',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#cbd5e1')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
      >
        <X size={16} />
      </button>

      <style>{`
        @keyframes loginToastSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default LoginToast;
