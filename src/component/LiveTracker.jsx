import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const LiveTracker = () => {
  const { user, token } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!user || !token) return;

    let pdfTitle = null;
    if (location.pathname === '/pdfpreview') {
      if (location.state && location.state.title) {
        pdfTitle = location.state.title;
      }
    }

    const ping = async () => {
      try {
        let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        if (apiUrl.includes('abes.work') && !apiUrl.endsWith('/api')) {
          apiUrl = `${apiUrl}/api`;
        }
        await fetch(`${apiUrl}/tracking/ping`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            location: location.pathname + location.search,
            pdfId: new URLSearchParams(location.search).get('url') || null,
            pdfTitle: pdfTitle
          })
        });
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
