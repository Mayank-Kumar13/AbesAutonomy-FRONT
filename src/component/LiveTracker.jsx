import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { trackingApi } from '../services/api';

const LiveTracker = () => {
  const { user, token } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!user || !token) return;

    let pdfTitle = null;
    let pdfId = null;

    if (location.pathname === '/pdfpreview') {
      if (location.state) {
        pdfTitle = location.state.title;
        pdfId = location.state.url;
      }
      
      const searchParams = new URLSearchParams(location.search);
      if (!pdfTitle) pdfTitle = searchParams.get('title');
      if (!pdfId) pdfId = searchParams.get('url');
    }

    const ping = async () => {
      try {
        await trackingApi.ping(
          location.pathname + location.search,
          pdfId || null,
          pdfTitle || null
        );
      } catch (err) {}
    };

    // Ping immediately when location changes
    ping();

    // Then ping every 15 seconds to keep alive
    const interval = setInterval(ping, 15000);
    return () => clearInterval(interval);
  }, [location, user, token]);

  return null;
};

export default LiveTracker;
