import React, { useEffect } from 'react';
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

  useEffect(() => {
    try {
      localStorage.removeItem('bypass_construction');
    } catch {
      // ignore
    }
  }, []);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#080a0e' }}>
        <p style={{ color: '#718096', fontFamily: 'system-ui' }}>Loading...</p>
      </div>
    );
  }

  const isUnderConstruction = websiteStatus === 'UNDER_CONSTRUCTION' || import.meta.env.VITE_ENFORCE_UNDER_CONSTRUCTION === 'true';
  const isAdmin = Boolean(user && (user.role === 'admin' || user.isSuperAdmin === true));

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
    
    // Otherwise, strictly show the Under Construction page
    return <UnderConstruction />;
  }

  // Normal rendering (live, or admin logged in)
  return <>{children}</>;
};

export default GlobalStatusGuard;
