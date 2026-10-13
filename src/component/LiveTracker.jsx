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
      // Don't send background pings if tab is hidden
      if (document.hidden) return;
      try {
        await trackingApi.ping(
          location.pathname + location.search,
          null,
          null,
          null
        );
      } catch (err) { 
        // Silently ignore tracking errors to avoid console noise
      }
    };

    // Ping once on page navigation
    ping();

    // Lightweight heartbeat every 2.5 minutes (150s) instead of 15s to save API limits
    const interval = setInterval(() => {
      if (!document.hidden) {
        ping();
      }
    }, 150000);

    return () => clearInterval(interval);
  }, [location.pathname, location.search, user, token]);

  return null;
};

export default LiveTracker;
