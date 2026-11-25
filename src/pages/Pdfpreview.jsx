import { useNavigate, useLocation } from "react-router-dom";
import Pdfviewer from "../component/Pdfviewer";
import { useEffect, useState, useRef, useCallback } from "react";
import { notesApi, trackingApi } from "../services/api";
import { useAuth } from "../auth/AuthContext";
import Navbar from "../component/navbar/Navbar";
import { downloadNoteFile } from "../utils/downloadHelper";
import PremiumUpgradeModal from "../component/premium/PremiumUpgradeModal";
import PdfChatPanel from "../component/PdfChatPanel";
import { 
  ArrowLeft, 
  ChevronUp, 
  ChevronDown, 
  Sun, 
  Moon, 
  Download, 
  Lock, 
  BookOpen, 
  Sparkles,
  Loader2,
  Clock
} from "lucide-react";

export default function PdfPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();

  const queryParams = new URLSearchParams(location.search);
  const searchNoteId = queryParams.get('noteId') || '';
  const searchPdfUrl = queryParams.get('pdfUrl') || '';
  const searchTitle = queryParams.get('title') || 'PDF Preview';

  const { 
    pdfUrl = searchPdfUrl, 
    title = searchTitle, 
    noteId = searchNoteId, 
    subject = (queryParams.get('subject') || ''), 
    isImage = false 
  } = location.state || {};
  
  const [isNavbarVisible, setIsNavbarVisible] = useState(false);
  const [showStillReadingPrompt, setShowStillReadingPrompt] = useState(false);
  const [isReadingActive, setIsReadingActive] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState("");
  const [freePdfResetAt, setFreePdfResetAt] = useState(null);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0, totalSecs: 0 });

  // Live 24-Hour Free Quota Reset Timer
  useEffect(() => {
    if (!freePdfResetAt) return;
    const tick = () => {
      const diff = Math.max(0, new Date(freePdfResetAt).getTime() - Date.now());
      const totalSecs = Math.floor(diff / 1000);
      const hours = Math.floor(totalSecs / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      const seconds = totalSecs % 60;
      setCountdown({ hours, minutes, seconds, totalSecs });
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [freePdfResetAt]);

  // Pre-flight check for access rights on the document
  useEffect(() => {
    if (noteId) {
      notesApi.checkAccess(noteId)
        .then((res) => {
          if (res?.data && !res.data.allowed) {
            setAccessDenied(true);
            setAccessDeniedMessage(res.data.message || 'You have used all 3 free document accesses. Upgrade to Premium for unlimited access.');
            if (res.data.freePdfResetAt) {
              setFreePdfResetAt(res.data.freePdfResetAt);
            }
            setShowPremiumModal(true);
          }
        })
        .catch((err) => {
          if (err.status === 403 || err.data?.code === 'PREMIUM_REQUIRED') {
            setAccessDenied(true);
            setAccessDeniedMessage(err.message || 'Active Premium subscription required to view this document.');
            if (err.data?.freePdfResetAt) {
              setFreePdfResetAt(err.data.freePdfResetAt);
            }
            setShowPremiumModal(true);
          }
        });
    }
  }, [noteId]);

  // References to track genuine engagement & active read seconds
  const lastInteractionRef = useRef(Date.now());
  const activeSecondsAccumulatorRef = useRef(0);
  const isPromptVisibleRef = useRef(false);

  const resetActivity = useCallback(() => {
    lastInteractionRef.current = Date.now();
    if (isPromptVisibleRef.current) {
      isPromptVisibleRef.current = false;
      setShowStillReadingPrompt(false);
      setIsReadingActive(true);
    }
  }, []);

  // Listen to user engagement (scroll, mouse, touch, keyboard) on parent window AND inside PDF viewer iframe
  useEffect(() => {
    const handleUserInteraction = () => {
      lastInteractionRef.current = Date.now();
      if (isPromptVisibleRef.current) {
        isPromptVisibleRef.current = false;
        setShowStillReadingPrompt(false);
      }
      setIsReadingActive(true);
    };

    window.addEventListener('mousemove', handleUserInteraction, { passive: true });
    window.addEventListener('scroll', handleUserInteraction, { passive: true });
    window.addEventListener('keydown', handleUserInteraction, { passive: true });
    window.addEventListener('touchstart', handleUserInteraction, { passive: true });
    window.addEventListener('wheel', handleUserInteraction, { passive: true });

    // Also attach listeners to the PDF Viewer iframe so scrolling/reading inside PDF resets timer
    const attachIframeListeners = () => {
      try {
        const iframe = document.querySelector('iframe[title="PDF Viewer"]');
        if (iframe && iframe.contentWindow) {
          const doc = iframe.contentDocument || iframe.contentWindow.document;
          if (doc && !doc._hasTrackingListeners) {
            doc._hasTrackingListeners = true;
            doc.addEventListener('mousemove', handleUserInteraction, { passive: true });
            doc.addEventListener('scroll', handleUserInteraction, { passive: true });
            doc.addEventListener('keydown', handleUserInteraction, { passive: true });
            doc.addEventListener('touchstart', handleUserInteraction, { passive: true });
            doc.addEventListener('wheel', handleUserInteraction, { passive: true });
          }
        }
      } catch (e) {
        // Ignore cross-origin iframe security restrictions if any
      }
    };

    attachIframeListeners();
    const iframeTimer = setInterval(attachIframeListeners, 2000);

    return () => {
      clearInterval(iframeTimer);
      window.removeEventListener('mousemove', handleUserInteraction);
      window.removeEventListener('scroll', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('wheel', handleUserInteraction);
    };
  }, []);

  // 1-Second Precision Engagement Engine
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden) {
        setIsReadingActive(false);
        return;
      }

      const idleMs = Date.now() - lastInteractionRef.current;

      if (idleMs > 60000) {
        setIsReadingActive(false);
        if (!isPromptVisibleRef.current) {
          isPromptVisibleRef.current = true;
          setShowStillReadingPrompt(true);
        }
      } else {
        setIsReadingActive(true);
        activeSecondsAccumulatorRef.current += 1;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 60-Second Server Sync Worker
  useEffect(() => {
    const syncWithBackend = () => {
      const secondsToReport = activeSecondsAccumulatorRef.current;
      if (secondsToReport > 0 && !document.hidden && noteId) {
        activeSecondsAccumulatorRef.current = 0;
        
        trackingApi.ping(
          location.pathname,
          noteId,
          title,
          subject,
          {
            activeReadingSeconds: secondsToReport,
            duration: secondsToReport,
            isDocumentView: true,
          }
        ).catch(() => {});
      }
    };

    const flushRemainingTime = () => {
      const seconds = activeSecondsAccumulatorRef.current;
      if (seconds > 0 && noteId) {
        const payload = JSON.stringify({
          location: location.pathname,
          pdfId: noteId,
          pdfTitle: title,
          subject: subject,
          activeReadingSeconds: seconds,
          duration: seconds,
          isDocumentView: true,
        });

        const tokenVal = localStorage.getItem("token");
        const blob = new Blob([payload], { type: 'application/json' });
        
        const API_BASE = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.includes("abes.work"))
          ? "/api"
          : (import.meta.env.VITE_API_URL || "/api");

        if (navigator.sendBeacon) {
          const beaconUrl = tokenVal 
            ? `${API_BASE}/reader/status?token=${encodeURIComponent(tokenVal)}`
            : `${API_BASE}/reader/status`;
          navigator.sendBeacon(beaconUrl, blob);
        }
        activeSecondsAccumulatorRef.current = 0;
      }
    };

    const serverSyncInterval = setInterval(syncWithBackend, 60000);
    window.addEventListener('beforeunload', flushRemainingTime);
    window.addEventListener('pagehide', flushRemainingTime);

    return () => {
      clearInterval(serverSyncInterval);
      window.removeEventListener('beforeunload', flushRemainingTime);
      window.removeEventListener('pagehide', flushRemainingTime);
      flushRemainingTime();
    };
  }, [location.pathname, noteId, title, subject]);

  useEffect(() => {
    if (noteId) {
      notesApi.incrementView(noteId).catch(() => {});
    }
  }, [noteId]);

  const API_BASE = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.includes("abes.work"))
    ? "/api"
    : (import.meta.env.VITE_API_URL || "/api");

  const backendDocumentUrl = noteId ? `${API_BASE}/notes/${noteId}/pdf` : "";
  const viewerFileUrl = pdfUrl || backendDocumentUrl;

  const [isDownloading, setIsDownloading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleDownload = async () => {
    if (!noteId && !pdfUrl && !viewerFileUrl) {
      alert("Cannot download this file.");
      return;
    }

    // STRICT POLICY: PDF Downloads are strictly reserved for Premium members (and Main Super Admin)
    const isSuperAdmin = user?.email?.toLowerCase().trim() === 'abesautonomy30@gmail.com' || user?.isSuperAdmin === true;
    const isPremiumUser = user?.isPremium === true;

    if (!isSuperAdmin && !isPremiumUser) {
      setAccessDeniedMessage('PDF downloads are exclusive to Premium subscribers. Upgrade to ABES Autonomy Premium to download and save documents offline.');
      setShowPremiumModal(true);
      return;
    }
    
    setIsDownloading(true);
    try {
      await downloadNoteFile({
        noteId,
        pdfUrl: pdfUrl || viewerFileUrl,
        title,
      });
    } catch (error) {
      console.error("PDF download error:", error);
      if (error.status === 403 || error.data?.code === 'PREMIUM_DOWNLOAD_REQUIRED' || error.data?.code === 'PREMIUM_REQUIRED' || error.message?.includes('Premium') || error.message?.includes('free')) {
        setAccessDeniedMessage(error.message || 'PDF downloads are exclusive to Premium subscribers. Upgrade to Premium for unlimited downloads.');
        setShowPremiumModal(true);
      } else {
        alert("Failed to download PDF.");
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="pdf-preview-root">
      {/* Optional Top Navigation Drawer */}
      <div 
        className={`pdf-nav-drawer ${isNavbarVisible ? 'is-visible' : ''}`}
      >
        <Navbar />
      </div>

      {/* Apple-grade Liquid Glass Floating Toolbar */}
      <header className="pdf-glass-toolbar glass-frosted" aria-label="Document Viewer Controls">
        <div className="pdf-toolbar-left">
          <button
            onClick={() => navigate(-1)}
            className="pdf-back-pill"
            title={`Back — ${title}`}
            aria-label="Back to notes list"
          >
            <ArrowLeft size={16} />
            <span className="pdf-back-label">Back</span>
          </button>

          <div className="pdf-title-block">
            <h1 className="pdf-doc-title" title={title}>{title}</h1>
            {subject && <span className="pdf-subject-badge">{subject}</span>}
          </div>
        </div>

        <div className="pdf-toolbar-actions">
          {/* Navigation Toggle */}
          <button
            onClick={() => setIsNavbarVisible(!isNavbarVisible)}
            className="pdf-control-btn"
            title={isNavbarVisible ? "Hide Navigation" : "Show Navigation"}
          >
            {isNavbarVisible ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            <span className="control-btn-text">{isNavbarVisible ? "Hide Nav" : "Nav"}</span>
          </button>

          {/* Dark Mode Inversion Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`pdf-control-btn ${isDarkMode ? 'is-active' : ''}`}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            <span className="control-btn-text">{isDarkMode ? "Light" : "Dark"}</span>
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading || (!noteId && !pdfUrl && !viewerFileUrl)}
            className="glass-btn-primary pdf-download-pill"
            title="Download Document"
          >
            {isDownloading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Download size={15} />
            )}
            <span>{isDownloading ? "Saving..." : (isImage ? "Save Image" : "Download file")}</span>
          </button>

          {/* Study Engagement Status Indicator */}
          <div 
            className={`pdf-reading-pill ${isReadingActive ? 'active' : 'paused'}`}
            title={isReadingActive ? "Study time tracking active" : "Tracking paused"}
          >
            <span className="status-dot" />
            <span className="status-label">{isReadingActive ? 'Active' : 'Paused'}</span>
          </div>
        </div>
      </header>

      {/* Main Document Viewer Container */}
      <main className="pdf-viewer-stage">
        {accessDenied ? (
          <div className="pdf-access-denied-screen">
            <div className="access-denied-card glass-frosted anim-scale-in">
              <div className="access-lock-bubble">
                <Lock size={32} />
              </div>
              <h2>Document Access Locked</h2>

              {/* 24-Hour Free Quota Renewal Timer */}
              {freePdfResetAt && (
                <div className="pdf-quota-timer-box">
                  <div className="quota-timer-label">
                    <Clock size={14} className="timer-icon-pulse" />
                    <span>Free Quota Renews In:</span>
                  </div>
                  <div className="quota-timer-digits">
                    <span className="timer-unit">{String(countdown.hours).padStart(2, '0')}<small>h</small></span>
                    <span className="timer-sep">:</span>
                    <span className="timer-unit">{String(countdown.minutes).padStart(2, '0')}<small>m</small></span>
                    <span className="timer-sep">:</span>
                    <span className="timer-unit">{String(countdown.seconds).padStart(2, '0')}<small>s</small></span>
                  </div>
                </div>
              )}

              <p>
                {accessDeniedMessage || (freePdfResetAt
                  ? 'You have used all 3 free document accesses for today. Buy ABES Autonomy Premium to continue reading immediately, or wait for the 24-hour timer to renew your free quota.'
                  : 'You have used all 3 free document accesses. Upgrade to ABES Autonomy Premium for unlimited access to all study materials.')}
              </p>
              <div className="access-btn-row">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="glass-btn-secondary"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={() => setShowPremiumModal(true)}
                  className="glass-btn-gold"
                >
                  <Sparkles size={15} />
                  <span>Buy Premium • From ₹29</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <Pdfviewer 
            file={viewerFileUrl} 
            backendUrl={backendDocumentUrl}
            isImageFlag={isImage} 
            isDarkMode={isDarkMode} 
          />
        )}
      </main>

      {/* AI Assistant Sidebar (Premium Supported) */}
      {noteId && !isImage && !accessDenied && (
        <PdfChatPanel noteId={noteId} title={title} />
      )}

      {/* "Still Reading?" Anti-AFK Modal */}
      {showStillReadingPrompt && (
        <div className="pdf-afk-toast glass-frosted anim-slide-up" role="alert">
          <div className="afk-text-wrap">
            <div className="afk-icon-bubble">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="afk-title">Are you still reading?</p>
              <p className="afk-desc">Study time tracking paused due to inactivity.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetActivity}
            className="glass-btn-gold afk-resume-btn"
          >
            Resume Study Session
          </button>
        </div>
      )}

      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal
        isOpen={showPremiumModal}
        message={accessDeniedMessage}
        freePdfResetAt={freePdfResetAt}
        onClose={() => {
          setShowPremiumModal(false);
        }}
        onSuccess={() => {
          setShowPremiumModal(false);
          window.location.reload();
        }}
      />

      {/* Document Viewer Custom Styles */}
      <style>{`
        .pdf-preview-root {
          display: flex;
          flex-direction: column;
          height: 100vh;
          height: 100dvh;
          overflow: hidden;
          background: #060709;
          position: relative;
        }

        .pdf-nav-drawer {
          transition: max-height 0.35s var(--ease-apple), opacity 0.25s ease;
          max-height: 0;
          opacity: 0;
          flex-shrink: 0;
          width: 100%;
          overflow: hidden;
          z-index: 1002;
        }

        .pdf-nav-drawer.is-visible {
          max-height: 120px;
          opacity: 1;
        }

        /* ─── LIQUID GLASS TOOLBAR ─── */
        .pdf-glass-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          height: 54px;
          flex-shrink: 0;
          z-index: 100;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          gap: 12px;
        }

        .pdf-toolbar-left {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .pdf-back-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: var(--radius-pill, 9999px);
          color: var(--text-primary, #F5F5F7);
          font-family: var(--font-family-sans);
          font-size: 13px;
          font-weight: 550;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.16s ease;
        }

        .pdf-back-pill:hover {
          background: rgba(255, 255, 255, 0.10);
          border-color: rgba(255, 255, 255, 0.20);
          color: #FFFFFF;
        }

        .pdf-title-block {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .pdf-doc-title {
          margin: 0;
          font-size: 14.5px;
          font-weight: 600;
          color: #FFFFFF;
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 380px;
        }

        .pdf-subject-badge {
          font-size: 11px;
          font-weight: 600;
          color: var(--brand-gold, #C5AC86);
          background: rgba(197, 172, 134, 0.12);
          border: 1px solid rgba(197, 172, 134, 0.22);
          padding: 2px 8px;
          border-radius: 4px;
          white-space: nowrap;
        }

        /* ─── CONTROLS ─── */
        .pdf-toolbar-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .pdf-control-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-pill, 9999px);
          color: var(--text-secondary, #A1A1A6);
          font-family: var(--font-family-sans);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.16s ease;
        }

        .pdf-control-btn:hover,
        .pdf-control-btn.is-active {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.16);
          color: #FFFFFF;
        }

        .pdf-download-pill {
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 600;
        }

        .pdf-reading-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: var(--radius-pill, 9999px);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 11.5px;
          font-weight: 550;
        }

        .pdf-reading-pill .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .pdf-reading-pill.active {
          color: var(--status-success, #30D158);
        }

        .pdf-reading-pill.active .status-dot {
          background: var(--status-success, #30D158);
          box-shadow: 0 0 8px rgba(48, 209, 88, 0.6);
        }

        .pdf-reading-pill.paused {
          color: var(--status-warning, #FF9F0A);
        }

        .pdf-reading-pill.paused .status-dot {
          background: var(--status-warning, #FF9F0A);
        }

        /* ─── STAGE ─── */
        .pdf-viewer-stage {
          flex: 1;
          position: relative;
          overflow: hidden;
          display: flex;
        }

        /* ─── ACCESS DENIED SCREEN ─── */
        .pdf-access-denied-screen {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .access-denied-card {
          max-width: 480px;
          width: 100%;
          text-align: center;
          padding: 40px 32px;
          border-radius: var(--radius-xl, 26px);
        }

        .access-lock-bubble {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(197, 172, 134, 0.12);
          border: 1px solid rgba(197, 172, 134, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--brand-gold, #C5AC86);
          margin: 0 auto 20px;
        }

        .access-denied-card h2 {
          margin: 0 0 12px;
          font-size: 22px;
          font-weight: 700;
          color: #FFFFFF;
        }

        .pdf-quota-timer-box {
          background: rgba(197, 172, 134, 0.08);
          border: 1px solid rgba(197, 172, 134, 0.28);
          border-radius: 16px;
          padding: 12px 18px;
          margin: 0 auto 18px;
          max-width: 320px;
          box-shadow: 0 8px 24px -6px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .quota-timer-label {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #C5AC86;
          margin-bottom: 6px;
        }

        .timer-icon-pulse {
          animation: pulseSlow 2s ease-in-out infinite;
        }

        @keyframes pulseSlow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.92); }
        }

        .quota-timer-digits {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 5px;
          font-family: var(--font-family-mono, ui-monospace, SFMono-Regular, monospace);
          font-size: 26px;
          font-weight: 800;
          color: #FFFFFF;
          letter-spacing: 0.02em;
        }

        .quota-timer-digits small {
          font-size: 11px;
          font-weight: 500;
          color: #C5AC86;
          margin-left: 2px;
        }

        .timer-sep {
          color: rgba(197, 172, 134, 0.5);
          font-weight: 300;
        }

        .access-denied-card p {
          margin: 0 0 28px;
          font-size: 14.5px;
          line-height: 1.6;
          color: var(--text-secondary, #A1A1A6);
        }

        .access-btn-row {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* ─── ANTI-AFK MODAL ─── */
        .pdf-afk-toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          border-radius: var(--radius-lg, 22px);
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 18px;
          max-width: 90%;
          box-shadow: 0 16px 40px -10px rgba(0, 0, 0, 0.8), 0 0 24px rgba(56, 189, 248, 0.15);
        }

        .afk-text-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .afk-icon-bubble {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--brand-gold, #C5AC86);
          flex-shrink: 0;
        }

        .afk-title {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #FFFFFF;
        }

        .afk-desc {
          margin: 2px 0 0;
          font-size: 12.5px;
          color: var(--text-secondary, #A1A1A6);
        }

        .afk-resume-btn {
          white-space: nowrap;
          font-size: 13px;
          padding: 8px 18px;
        }

        /* ─── REVIEW OVERLAY ─── */
        .pdf-review-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 9999;
        }

        .pdf-review-card {
          max-width: 440px;
          width: 100%;
          text-align: center;
          padding: 36px 28px;
          border-radius: var(--radius-xl, 26px);
        }

        .review-sparkle-bubble {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: rgba(197, 172, 134, 0.12);
          border: 1px solid rgba(197, 172, 134, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--brand-gold, #C5AC86);
          margin: 0 auto 18px;
        }

        .pdf-review-card h2 {
          margin: 0 0 10px;
          font-size: 21px;
          font-weight: 700;
          color: #FFFFFF;
        }

        .pdf-review-card p {
          margin: 0 0 24px;
          font-size: 14px;
          line-height: 1.55;
          color: var(--text-secondary, #A1A1A6);
        }

        .review-btn-row {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 768px) {
          .pdf-glass-toolbar {
            height: auto;
            flex-wrap: wrap;
            padding: 10px 12px;
          }

          .pdf-toolbar-left {
            width: 100%;
            justify-content: space-between;
          }

          .pdf-doc-title {
            max-width: 220px;
            font-size: 13.5px;
          }

          .pdf-toolbar-actions {
            width: 100%;
            justify-content: space-between;
          }

          .control-btn-text {
            display: none;
          }

          .pdf-afk-toast {
            flex-direction: column;
            width: calc(100% - 32px);
            text-align: center;
          }

          .afk-text-wrap {
            flex-direction: column;
          }

          .afk-resume-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
