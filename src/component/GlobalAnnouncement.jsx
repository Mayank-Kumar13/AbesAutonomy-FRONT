import React, { useState, useEffect } from 'react';
import { Bell, X, Heart } from 'lucide-react';
import { settingsApi } from '../services/api';

const GlobalAnnouncement = () => {
  const [announcement, setAnnouncement] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasReacted, setHasReacted] = useState(false);

  const handleReact = async () => {
    if (hasReacted) return;
    setHasReacted(true);
    if (announcement?.message) {
      localStorage.setItem('reacted_announcement_msg', announcement.message);
    }
    setAnnouncement(prev => ({
      ...prev,
      reactions: (prev?.reactions || 0) + 1
    }));
    try {
      await settingsApi.reactToAnnouncement();
    } catch (err) {
      console.error(err);
      setHasReacted(false);
      localStorage.removeItem('reacted_announcement_msg');
      setAnnouncement(prev => ({
        ...prev,
        reactions: Math.max((prev?.reactions || 1) - 1, 0)
      }));
    }
  };

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const res = await settingsApi.getSettings();
        if (res?.data?.announcement && res.data.announcement.active && res.data.announcement.message) {
          setAnnouncement(res.data.announcement);
          setIsVisible(true);
          
          if (localStorage.getItem('reacted_announcement_msg') === res.data.announcement.message) {
            setHasReacted(true);
          } else {
            setHasReacted(false);
          }
        } else {
          setIsVisible(false);
          setIsOpen(false);
        }
      } catch (err) {
        console.error("Failed to fetch announcement:", err);
      }
    };

    fetchAnnouncement();
    
    // Poll every 30 seconds for new announcements
    const interval = setInterval(fetchAnnouncement, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible || !announcement) return null;

  const formatMessage = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line.split(' ').map((word, j) => {
          const isUrl = word.startsWith('http://') || word.startsWith('https://');
          if (isUrl) {
            return (
              <React.Fragment key={j}>
                <a 
                  href={word} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="announcement-link"
                >
                  {word}
                </a>{' '}
              </React.Fragment>
            );
          }
          return <span key={j}>{word} </span>;
        })}
        {i !== text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="global-announcement-root">
      {isOpen && (
        <div className="global-announcement-box glass-frosted anim-scale-in">
          <div className="announcement-header">
            <div className="announcement-title-wrap">
              <div className="announcement-bell-bubble">
                <Bell size={15} className="bell-shake" />
              </div>
              <h4>College Announcement</h4>
            </div>
            <button 
              type="button"
              className="announcement-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close announcement"
            >
              <X size={15} />
            </button>
          </div>

          <div className="announcement-body">
            {formatMessage(announcement.message)}
          </div>
          
          <div className="announcement-footer">
            <button
              type="button"
              onClick={handleReact}
              disabled={hasReacted}
              className={`announcement-react-btn ${hasReacted ? 'has-reacted' : ''}`}
            >
              <Heart size={14} fill={hasReacted ? '#FF453A' : 'none'} className={hasReacted ? 'heart-beat' : ''} />
              <span>{announcement.reactions || 0}</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Bell Toggle Button */}
      <button
        type="button"
        className={`announcement-bell-trigger glass-frosted ${isOpen ? 'is-active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle announcement"
      >
        <Bell size={20} className="bell-icon" />
        {!hasReacted && <span className="announcement-pulse-dot" />}
      </button>

      <style>{`
        .global-announcement-root {
          position: fixed;
          bottom: 26px;
          right: 26px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          font-family: var(--font-family-sans, -apple-system, sans-serif);
        }

        .global-announcement-box {
          margin-bottom: 14px;
          max-width: 380px;
          width: calc(100vw - 52px);
          padding: 22px;
          border-radius: var(--radius-xl, 24px);
          box-shadow: 0 24px 60px -10px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.16);
        }

        .announcement-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .announcement-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .announcement-bell-bubble {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(197, 172, 134, 0.12);
          border: 1px solid rgba(197, 172, 134, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--brand-gold, #C5AC86);
        }

        .announcement-title-wrap h4 {
          margin: 0;
          font-size: 14.5px;
          font-weight: 650;
          color: #FFFFFF;
          letter-spacing: -0.01em;
        }

        .announcement-close-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--text-secondary, #A1A1A6);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .announcement-close-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #FFFFFF;
        }

        .announcement-body {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-secondary, #A1A1A6);
          max-height: 320px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .announcement-link {
          color: var(--brand-gold, #C5AC86);
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .announcement-footer {
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
        }

        .announcement-react-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-pill, 9999px);
          color: var(--text-secondary, #A1A1A6);
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .announcement-react-btn:hover:not(:disabled) {
          background: rgba(255, 69, 58, 0.12);
          border-color: rgba(255, 69, 58, 0.3);
          color: var(--status-error, #FF453A);
        }

        .announcement-react-btn.has-reacted {
          background: rgba(255, 69, 58, 0.12);
          border-color: rgba(255, 69, 58, 0.3);
          color: var(--status-error, #FF453A);
          cursor: default;
        }

        /* ─── BELL TRIGGER ─── */
        .announcement-bell-trigger {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--brand-gold, #C5AC86);
          cursor: pointer;
          position: relative;
          box-shadow: 0 12px 30px -4px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          transition: all var(--duration-fast, 160ms) var(--ease-apple);
        }

        .announcement-bell-trigger:hover,
        .announcement-bell-trigger.is-active {
          transform: scale(1.06);
          color: #FFFFFF;
          border-color: rgba(255, 255, 255, 0.22);
        }

        .announcement-pulse-dot {
          position: absolute;
          top: 11px;
          right: 11px;
          width: 9px;
          height: 9px;
          background: var(--status-error, #FF453A);
          border: 2px solid #060709;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(255, 69, 58, 0.8);
        }
      `}</style>
    </div>
  );
};

export default GlobalAnnouncement;
