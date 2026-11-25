import React, { useEffect, useState, Suspense, lazy, Component } from 'react';
import Navbar from './component/navbar/Navbar';
import IntroOverlay from './component/intro/IntroOverlay';
import LiveTracker from './component/LiveTracker';
import GlobalAnnouncement from './component/GlobalAnnouncement';
import LoginToast from './component/LoginToast';
import Credits from './pages/Credits';
import HomeContent from './component/home/HomeContent';
import { Routes, Route, useLocation } from "react-router-dom";
import Resources from './pages/Resources';
import Amcat from './pages/Amcat';
import Footer from './component/footer/Footer';
import ChooseSubject from './pages/choosesubject/ChooseSubject';
import Scroll from "./component/Scroll";
import Subject from './pages/subject/Subject';
import LoginPage from './pages/loginPage/LoginPage';
import Profile from './pages/profile/Profile';
import About from './pages/InfoPage/About';
import PrivacyPolicy from './pages/InfoPage/PrivacyPolicy';
import Terms from './pages/InfoPage/Terms';
import Contact from './pages/InfoPage/Contact';
import Contribute from './pages/InfoPage/Contribute';
import UnderConstruction from './pages/UnderConstruction/UnderConstruction';
import ForgotPassword from './pages/forgotPassword/ForgotPassword';
import ResetPassword from './pages/forgotPassword/ResetPassword';
import OAuthCallback from './pages/oauth/OAuthCallback';
import ProviderCallback from './pages/oauth/ProviderCallback';
import ProtectedRoute from './auth/ProtectedRoute';
import AdminRoute from './auth/AdminRoute';
import GlobalStatusGuard from './auth/GlobalStatusGuard';
import { trackingApi } from './services/api';
import PaymentResult from './pages/payment/PaymentResult';

// Reload once cleanly if a new Vercel deployment replaced lazy-loaded JS chunk hashes
function lazyWithRetry(importFn, chunkName) {
  return lazy(() =>
    importFn().catch((err) => {
      const key = `abes_chunk_retry_${chunkName}`;
      const alreadyRetried = sessionStorage.getItem(key);
      if (!alreadyRetried) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
        return new Promise(() => {});
      }
      sessionStorage.removeItem(key);
      throw err;
    })
  );
}

class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Failed to load this page.' };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            color: '#F5F5F7',
            gap: '14px',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Something went wrong loading this view</h2>
          <p style={{ margin: 0, color: '#94a3b8', maxWidth: '420px', fontSize: '0.92rem' }}>
            {this.state.message}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 22px',
              borderRadius: '9999px',
              border: 'none',
              background: '#C5AC86',
              color: '#080a0e',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const PageLoaderFallback = () => (
  <div
    style={{
      minHeight: '85vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '14px',
      backgroundColor: '#060709',
      color: '#CBD5E1',
      paddingTop: '80px',
    }}
  >
    <div
      style={{
        width: '34px',
        height: '34px',
        border: '3px solid rgba(197, 172, 134, 0.25)',
        borderTopColor: '#C5AC86',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
    <span style={{ fontSize: '0.9rem', letterSpacing: '0.03em' }}>Loading...</span>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const Pdfpreview = lazyWithRetry(() => import('./pages/Pdfpreview'), 'pdfpreview');
const AdminPanel = lazyWithRetry(() => import('./pages/admin/AdminPanel'), 'admin');
const PremiumPage = lazyWithRetry(() => import('./pages/premium/PremiumPage'), 'premium');

const App = () => {
  useEffect(() => {
    trackingApi.recordVisit().catch(console.error);
  }, []);

  const location = useLocation();
  const path = location.pathname.toLowerCase();
  const isAuthPage = path === '/login' || path === '/forgot-password' || path === '/reset-password' || path.startsWith('/auth/');
  const isCreditsPage = path === '/credits';
  const hideNavAndFooter = isAuthPage || path === '/pdfpreview';
  const hideFooter = hideNavAndFooter || isCreditsPage;
  const isHomePage = path === '/';

  const [showStartupIntro] = useState(() => isHomePage);

  return (
    <GlobalStatusGuard>
      {isHomePage && showStartupIntro && <IntroOverlay locationKey={location.key} />}
      {!isAuthPage && <LoginToast />}
      {!isAuthPage && <LiveTracker />}
      {!isAuthPage && !isCreditsPage && <GlobalAnnouncement />}
      {!hideNavAndFooter && !isHomePage && <Navbar />}
      <Scroll />
      <RouteErrorBoundary key={location.pathname}>
        <Suspense fallback={<PageLoaderFallback />}>
          <div key={location.pathname} className="page-transition-container">
            <Routes>
              <Route path="/" element={<HomeContent />} />
              <Route path="/premium" element={<PremiumPage />} />
              <Route path="/payment/success" element={<PaymentResult type="success" />} />
              <Route path="/payment/failed" element={<PaymentResult type="failed" />} />
              <Route path="/payment/pending" element={<PaymentResult type="pending" />} />
              <Route path="/resources" element={<ProtectedRoute><Resources/></ProtectedRoute>} />
              <Route path="/credits" element={<Credits />} />
              <Route path="/mvp-projects" element={<Amcat />} />
              <Route path="/Choosesubject" element={<ProtectedRoute><ChooseSubject /></ProtectedRoute>} />
              <Route path="/Subject" element={<ProtectedRoute><Subject /></ProtectedRoute>} />
              <Route path="/pdfpreview" element={<ProtectedRoute><Pdfpreview /></ProtectedRoute>} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/callback" element={<OAuthCallback />} />
              <Route path="/auth/google/callback" element={<ProviderCallback provider="google" />} />
              <Route path="/auth/github/callback" element={<ProviderCallback provider="github" />} />
              <Route path="/about" element={<About/>}/>
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/contribute" element={<Contribute />} />
              <Route path="/under-construction" element={<UnderConstruction />} />
              <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
            </Routes>
          </div>
        </Suspense>
      </RouteErrorBoundary>
      {!hideFooter && !isHomePage && <Footer />}
    </GlobalStatusGuard>
  );
};

export default App;
