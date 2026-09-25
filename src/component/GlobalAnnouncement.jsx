import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { settingsApi } from '../services/api';

const GlobalAnnouncement = () => {
  const [announcement, setAnnouncement] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

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

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      fontFamily: 'inherit'
    }}>
      {isOpen && (
        <div style={{
          backgroundColor: '#1a1f26',
          border: '1px solid #2a3441',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '12px',
          maxWidth: '300px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          color: '#f5f5f5',
          animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: '#d4a373', fontWeight: 'bold' }}>Announcement</h4>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '4px' }}
            >
              <X size={16} />
            </button>
          </div>
          <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5' }}>
            {announcement.message}
          </p>
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
            width: '48px',
            height: '48px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(212, 163, 115, 0.3)',
            animation: 'bounce 2s infinite'
          }}
        >
          <Bell size={24} />
        </button>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
};

export default GlobalAnnouncement;
