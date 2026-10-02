import React, { useEffect, Suspense, lazy } from 'react';
import Navbar from './component/navbar/Navbar';
import IntroOverlay from './component/intro/IntroOverlay';
import LiveTracker from './component/LiveTracker';
import GlobalAnnouncement from './component/GlobalAnnouncement';
import Credits from './pages/Credits';
import HomeContent from './component/home/HomeContent';
import { Routes, Route } from "react-router-dom";
import Resources from './pages/Resources';
import Amcat from './pages/Amcat';
import Footer from './component/footer/Footer';
import ChooseSubject from './pages/choosesubject/ChooseSubject';
import Scroll from "./component/Scroll";
import Subject from './pages/subject/Subject';
import { useLocation } from "react-router-dom";
import LoginPage from './pages/loginPage/LoginPage';
import Profile from './pages/profile/Profile';
import About from './pages/InfoPage/About';
import PrivacyPolicy from './pages/InfoPage/PrivacyPolicy';
import Terms from './pages/InfoPage/Terms';
import Contact from './pages/InfoPage/Contact';
import Contribute from './pages/InfoPage/Contribute';
import ForgotPassword from './pages/forgotPassword/ForgotPassword';
import ResetPassword from './pages/forgotPassword/ResetPassword';
import OAuthCallback from './pages/oauth/OAuthCallback';
import ProviderCallback from './pages/oauth/ProviderCallback';
import ProtectedRoute from './auth/ProtectedRoute';
import AdminRoute from './auth/AdminRoute';
import GlobalStatusGuard from './auth/GlobalStatusGuard';
import { trackingApi } from './services/api';

const Pdfpreview = lazy(() => import('./pages/Pdfpreview'));
const AdminPanel = lazy(() => import('./pages/admin/AdminPanel'));

const App = () => {
  useEffect(() => {
    trackingApi.recordVisit().catch(console.error);
  }, []);

  return (
    <GlobalStatusGuard>
      <LiveTracker />
      <GlobalAnnouncement />
      <IntroOverlay />
      {useLocation().pathname !== "/pdfpreview" && <Navbar />} 
      <Scroll />
      <Suspense fallback={<div className="flex h-screen items-center justify-center text-white"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
        <Routes>
          <Route path="/" element={<HomeContent />} />
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
          <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
        </Routes>
      </Suspense>
      <Footer />
    </GlobalStatusGuard>
  )
}
export default App;