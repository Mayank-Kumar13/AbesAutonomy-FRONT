import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../auth/AuthContext';

// Global socket instance exported so other components (like AdminPanel) can use it
export let socket = null;

const LiveTracker = () => {
  const { user, token } = useAuth();
  const location = useLocation();
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect if the user exists
    if (user && token) {
      if (!socketRef.current) {
        socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
          withCredentials: true,
        });
        socket = socketRef.current;

        socketRef.current.on('connect', () => {
          socketRef.current.emit('register_user', {
            token,
            location: location.pathname + location.search,
            pdfId: new URLSearchParams(location.search).get('url') || null, // Assuming pdfpreview uses ?url=...
            pdfTitle: new URLSearchParams(location.search).get('title') || null,
          });
        });
      }
    } else {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        socket = null;
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        socket = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]); // Re-run if user/token changes

  useEffect(() => {
    if (socketRef.current && socketRef.current.connected) {
      let pdfTitle = null;
      if (location.pathname === '/pdfpreview') {
          // If we pass title in state instead of URL
          if (location.state && location.state.title) {
              pdfTitle = location.state.title;
          }
      }

      socketRef.current.emit('update_location', {
        location: location.pathname + location.search,
        pdfId: new URLSearchParams(location.search).get('url') || null,
        pdfTitle: pdfTitle,
      });
    }
  }, [location]);

  return null; // This component doesn't render anything
};

export default LiveTracker;
