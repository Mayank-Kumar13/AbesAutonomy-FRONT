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
      className="login-toast-island glass-frosted anim-slide-up"
      role="status"
      aria-live="polite"
    >
      <div className="toast-content-wrap">
        <CheckCircle2 size={18} className="toast-check-icon" />
        <span className="toast-text">
          {userName ? `Welcome back, ${userName.split(' ')[0]}` : 'Signed in successfully'}
        </span>
      </div>
      <button 
        type="button"
        className="toast-close-btn"
        onClick={() => setVisible(false)}
        aria-label="Dismiss toast"
      >
        <X size={14} />
      </button>

      <style>{`
        .login-toast-island {
          position: fixed;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 99999;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 8px 16px 8px 12px;
          border-radius: var(--radius-pill, 9999px);
          box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          font-family: var(--font-family-sans, -apple-system, sans-serif);
        }

        .toast-content-wrap {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .toast-check-icon {
          color: var(--status-success, #30D158);
        }

        .toast-text {
          font-size: 13.5px;
          font-weight: 600;
          color: #FFFFFF;
          white-space: nowrap;
        }

        .toast-close-btn {
          background: rgba(255, 255, 255, 0.05);
          border: none;
          color: var(--text-secondary, #A1A1A6);
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .toast-close-btn:hover {
          color: #FFFFFF;
        }
      `}</style>
    </div>
  );
};

export default LoginToast;
