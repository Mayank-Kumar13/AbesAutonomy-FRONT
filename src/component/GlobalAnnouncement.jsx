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
    setAnnouncement(prev => ({
      ...prev,
      reactions: (prev?.reactions || 0) + 1
    }));
    try {
      await settingsApi.reactToAnnouncement();
    } catch (err) {
      console.error(err);
      setHasReacted(false);
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
                  style={{ color: '#d4a373', textDecoration: 'none', fontWeight: '500', borderBottom: '1px dashed #d4a373' }}
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
    <div style={{
      position: 'fixed',
      bottom: '30px',
      right: '30px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {isOpen && (
        <div style={{
          backgroundColor: 'rgba(15, 20, 27, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(212, 163, 115, 0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '16px',
          maxWidth: '380px',
          width: 'calc(100vw - 60px)', // For smaller screens
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.05) inset',
          color: '#f5f5f5',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={18} color="#d4a373" className="bell-shake" />
              <h4 style={{ margin: 0, fontSize: '16px', color: '#d4a373', fontWeight: '600', letterSpacing: '0.5px' }}>
                Announcement
              </h4>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: 'none', 
                color: '#a0aec0', 
                cursor: 'pointer', 
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#a0aec0'; }}
            >
              <X size={16} />
            </button>
          </div>
          <div style={{ 
            margin: 0, 
            fontSize: '14.5px', 
            lineHeight: '1.6', 
            color: '#cbd5e1',
            maxHeight: '400px',
            overflowY: 'auto',
            paddingRight: '4px'
          }}>
            {formatMessage(announcement.message)}
          </div>
          
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-start', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
            <button
              onClick={handleReact}
              disabled={hasReacted}
              style={{
                background: hasReacted ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: hasReacted ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                color: hasReacted ? '#ef4444' : '#a0aec0',
                padding: '6px 14px',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: hasReacted ? 'default' : 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
              onMouseEnter={(e) => { 
                if (!hasReacted) {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; 
                  e.currentTarget.style.color = '#ef4444'; 
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => { 
                if (!hasReacted) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; 
                  e.currentTarget.style.color = '#a0aec0'; 
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              <Heart size={16} fill={hasReacted ? '#ef4444' : 'none'} className={hasReacted ? 'heart-beat' : ''} />
              {announcement.reactions || 0}
            </button>
          </div>
        </div>
      )}
      
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            backgroundColor: '#d4a373',
            color: '#11161d',
            border: 'none',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(212, 163, 115, 0.4)',
            transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            animation: 'pulseGlow 2s infinite'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Bell size={26} />
        </button>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(212, 163, 115, 0.6); }
          70% { box-shadow: 0 0 0 15px rgba(212, 163, 115, 0); }
          100% { box-shadow: 0 0 0 0 rgba(212, 163, 115, 0); }
        }
        @keyframes bellShake {
          0% { transform: rotate(0); }
          15% { transform: rotate(15deg); }
          30% { transform: rotate(-15deg); }
          45% { transform: rotate(10deg); }
          60% { transform: rotate(-10deg); }
          75% { transform: rotate(5deg); }
          90% { transform: rotate(-5deg); }
          100% { transform: rotate(0); }
        }
        .bell-shake {
          animation: bellShake 2.5s infinite;
          transform-origin: top center;
        }
        @keyframes heartBeat {
          0% { transform: scale(1); }
          14% { transform: scale(1.3); }
          28% { transform: scale(1); }
          42% { transform: scale(1.3); }
          70% { transform: scale(1); }
        }
        .heart-beat {
          animation: heartBeat 1s ease-in-out;
        }
        /* Custom scrollbar for the popup text area */
        div::-webkit-scrollbar {
          width: 4px;
        }
        div::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        div::-webkit-scrollbar-thumb {
          background: rgba(212, 163, 115, 0.3);
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: rgba(212, 163, 115, 0.6);
        }
      `}</style>
    </div>
  );
};

export default GlobalAnnouncement;
