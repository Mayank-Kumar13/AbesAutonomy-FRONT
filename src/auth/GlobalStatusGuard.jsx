import React from 'react';
import { useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import UnderConstruction from '../pages/UnderConstruction/UnderConstruction';
import LoginPage from '../pages/loginPage/LoginPage';
import ForgotPassword from '../pages/forgotPassword/ForgotPassword';
import ResetPassword from '../pages/forgotPassword/ResetPassword';
import OAuthCallback from '../pages/oauth/OAuthCallback';
import ProviderCallback from '../pages/oauth/ProviderCallback';

const GlobalStatusGuard = ({ children }) => {
  const { websiteStatus, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#080a0e' }}>
        <p style={{ color: '#718096', fontFamily: 'system-ui' }}>Loading...</p>
      </div>
    );
  }

  // In local development, preview mode, or review testing, allow designing and previewing the full application
  // without being locked out by the production backend's UNDER_CONSTRUCTION status.
  const hasPreviewAccess = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname.endsWith('.local') ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    window.location.hostname.startsWith('172.') ||
    window.location.search.includes('preview=true') ||
    window.location.search.includes('bypass=true') ||
    localStorage.getItem('bypass_construction') === 'true'
  );
  const isDev = import.meta.env.DEV || hasPreviewAccess;
  const forceConstruction = import.meta.env.VITE_ENFORCE_UNDER_CONSTRUCTION === 'true';
  const isUnderConstruction = websiteStatus === 'UNDER_CONSTRUCTION' && (!isDev || forceConstruction);
  const isAdmin = user?.role === 'admin';

  // If the site is under construction and the user is NOT an admin
  if (isUnderConstruction && !isAdmin) {
    const path = location.pathname.toLowerCase();
    
    // Allow admins to authenticate via login or OAuth callback without exposing the rest of the app UI
    if (path === '/login' || path.startsWith('/auth/') || path === '/forgot-password' || path === '/reset-password') {
      return (
        <div style={{ minHeight: '100vh', backgroundColor: '#080a0e', width: '100%', overflowY: 'auto' }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<OAuthCallback />} />
            <Route path="/auth/google/callback" element={<ProviderCallback provider="google" />} />
            <Route path="/auth/github/callback" element={<ProviderCallback provider="github" />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      );
    }
    
    // Otherwise, show the Under Construction page
    return <UnderConstruction />;
  }

  // Normal rendering (live, or admin logged in)
  return <>{children}</>;
};

export default GlobalStatusGuard;
