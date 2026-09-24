import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { trackingApi } from '../services/api';

const LiveTracker = () => {
  const { user, token } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!user || !token) return;

    // Only ping for normal pages (non-PDF). 
    // PDF tracking is handled directly in Pdfpreview.jsx now.
    if (location.pathname === '/pdfpreview') return;

    const ping = async () => {
      try {
        await trackingApi.ping(
          location.pathname + location.search,
          null,
          null
        );
      } catch (err) { console.error("[tracking] ping failed:", err); }
    };

    ping();
    const interval = setInterval(ping, 15000);
    return () => clearInterval(interval);
  }, [location, user, token]);

  return null;
};

export default LiveTracker;
