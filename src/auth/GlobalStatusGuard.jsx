import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import UnderConstruction from '../pages/UnderConstruction/UnderConstruction';

const GlobalStatusGuard = ({ children }) => {
  const { websiteStatus, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0d10' }}>
        <p style={{ color: '#718096', fontFamily: 'system-ui' }}>Loading...</p>
      </div>
    );
  }

  const isUnderConstruction = websiteStatus === 'UNDER_CONSTRUCTION';
  const isAdmin = user?.role === 'admin';

  // If the site is under construction and the user is NOT an admin
  if (isUnderConstruction && !isAdmin) {
    // Allow access to login and OAuth callback routes so admins can still authenticate
    const path = location.pathname.toLowerCase();
    if (path === '/login' || path.startsWith('/auth/')) {
      return <>{children}</>;
    }
    
    // Otherwise, show the Under Construction page
    return <UnderConstruction />;
  }

  // Normal rendering (live, or admin logged in)
  return <>{children}</>;
};

export default GlobalStatusGuard;
