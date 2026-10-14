import { useNavigate, useLocation } from "react-router-dom";
import Pdfviewer from "../component/Pdfviewer";
import { useEffect, useState, useRef, useCallback } from "react";
import { notesApi, trackingApi } from "../services/api";
import { useAuth } from "../auth/AuthContext";
import ReviewModal from "../component/home/ReviewModal";
import Navbar from "../component/navbar/Navbar";
import { downloadNoteFile } from "../utils/downloadHelper";
export default function PdfPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();

  const { pdfUrl, title = "PDF Preview", noteId, subject = "", isImage = false } = location.state || {};
  
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [showActualReviewModal, setShowActualReviewModal] = useState(false);
  const [showStillReadingPrompt, setShowStillReadingPrompt] = useState(false);
  const [isReadingActive, setIsReadingActive] = useState(true);

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

  // 1-second ticker to accumulate genuine active reading seconds
  useEffect(() => {
    if (!user || !token) return;

    // 10 minutes without interaction = Pause tracking & show Still Reading prompt
    const INACTIVITY_LIMIT_MS = 10 * 60 * 1000;

    const ticker = setInterval(() => {
      // 1. If tab is in background / minimized -> Pause accumulation
      if (document.hidden) {
        setIsReadingActive(false);
        return;
      }

      const idleDuration = Date.now() - lastInteractionRef.current;

      // 2. If idle for >= 10 minutes -> Show prompt and pause accumulation
      if (idleDuration >= INACTIVITY_LIMIT_MS) {
        if (!isPromptVisibleRef.current) {
          isPromptVisibleRef.current = true;
          setShowStillReadingPrompt(true);
        }
        setIsReadingActive(false);
        return;
      }

      // 3. Otherwise user is genuinely reading! Keep Reading Active!
      setIsReadingActive(true);
      activeSecondsAccumulatorRef.current += 1;
    }, 1000);

    return () => clearInterval(ticker);
  }, [user, token]);



  // Periodic 60-second ping (reduces API load by ~75% compared to 15s)
  useEffect(() => {
    if (!user || !token) return;

    const sendPing = async (forcedDurationMs = null) => {
      const durationToReport = forcedDurationMs !== null 
        ? forcedDurationMs 
        : activeSecondsAccumulatorRef.current * 1000;

      // Only send if at least 10 seconds of active reading occurred
      if (durationToReport < 10000) return;

      // Reset accumulator before network request to prevent double-counting
      activeSecondsAccumulatorRef.current = 0;

      try {
        await trackingApi.ping(
          "/pdfpreview",
          pdfUrl || null,
          title || "Untitled PDF",
          subject || "Unknown Subject",
          {
            isActive: true,
            activeDurationMs: durationToReport
          }
        );
      } catch (err) {
        // Silently catch tracking errors to avoid disrupting reader
      }
    };

    // First heartbeat after 30 seconds of active reading
    const initialTimer = setTimeout(() => {
      sendPing();
    }, 30000);

    // Main 60-second interval
    const interval = setInterval(() => {
      sendPing();
    }, 60000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      // Flush any remaining active seconds on unmount
      if (activeSecondsAccumulatorRef.current >= 10) {
        sendPing(activeSecondsAccumulatorRef.current * 1000);
      }
    };
  }, [user, token, pdfUrl, title, subject]);

  // Increment view count when a note is viewed
  useEffect(() => {
    if (noteId) {
      notesApi.incrementView(noteId).catch(() => {
        // Silently ignore — view counting is non-critical
      });
    }
  }, [noteId]);

  useEffect(() => {
    // If user is not logged in or has already reviewed, don't show popup
    if (!user || user.hasReviewed) return;

    // Check cooldown (24 hours)
    const lastAsked = localStorage.getItem("reviewPopupCooldown");
    if (lastAsked && Date.now() - parseInt(lastAsked, 10) < 24 * 60 * 60 * 1000) {
      return;
    }

    // Set timer for 5 minutes (300000 ms)
    const timer = setTimeout(() => {
      setShowReviewPrompt(true);
    }, 300000);

    return () => clearTimeout(timer);
  }, [user]);

  const handleReviewLater = () => {
    localStorage.setItem("reviewPopupCooldown", Date.now().toString());
    setShowReviewPrompt(false);
  };

  const handleReviewNow = () => {
    setShowReviewPrompt(false);
    setShowActualReviewModal(true);
  };

  const API_BASE = import.meta.env.VITE_API_URL || "/api";
  // Directly use pdfUrl to load from CDN fast, rather than going through the backend which does slow dynamic watermarking on the fly.
  const viewerFileUrl = pdfUrl || (noteId ? `${API_BASE}/notes/${noteId}/pdf` : "");

  const [isDownloading, setIsDownloading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleDownload = async () => {
    if (!noteId && !pdfUrl && !viewerFileUrl) {
      alert("Cannot download this file.");
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
      alert("Failed to download PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div 
        style={{ 
          transition: 'max-height 0.4s ease-in-out, opacity 0.3s ease-in-out, margin-top 0.4s ease-in-out', 
          maxHeight: isNavbarVisible ? '150px' : '0px', 
          opacity: isNavbarVisible ? 1 : 0,
          flexShrink: 0,
          width: '100%',
          overflow: 'hidden'
        }}
      >
        <Navbar />
      </div>

      <div style={{ display: "flex", width: "100%", zIndex: 10, position: 'relative', boxShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            flex: 1,
            padding: "8px",
            cursor: "pointer",
            color: "black",
            backgroundColor: "#d9a441",
            border: "none",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          ← Back — {title}
        </button>

        <button
          onClick={() => setIsNavbarVisible(!isNavbarVisible)}
          style={{
            padding: "8px 20px",
            cursor: "pointer",
            color: "white",
            backgroundColor: "#161b22",
            border: "none",
            fontSize: "16px",
            fontWeight: "bold",
            borderLeft: "1px solid #1a252f",
            transition: "background-color 0.3s"
          }}
        >
          {isNavbarVisible ? "▲ Hide Nav" : "▼ Show Nav"}
        </button>

        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          style={{
            padding: "8px 20px",
            cursor: "pointer",
            color: "white",
            backgroundColor: isDarkMode ? "#374151" : "#1f2937",
            border: "none",
            fontSize: "16px",
            fontWeight: "bold",
            borderLeft: "1px solid #1a252f",
            transition: "background-color 0.3s"
          }}
        >
          {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>

        <button
          onClick={handleDownload}
          disabled={isDownloading || (!noteId && !pdfUrl && !viewerFileUrl)}
          style={{
            padding: "8px 20px",
            cursor: isDownloading || (!noteId && !pdfUrl && !viewerFileUrl) ? "not-allowed" : "pointer",
            color: "white",
            backgroundColor: isDownloading ? "#555" : "#2c3e50",
            border: "none",
            fontSize: "16px",
            fontWeight: "bold",
            borderLeft: "1px solid #1a252f"
          }}
        >
          {isDownloading ? "Downloading..." : (isImage ? "Download Image" : "Download File")}
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '0 16px',
          backgroundColor: '#11161d',
          borderLeft: '1px solid #1a252f',
          fontSize: '13px',
          fontWeight: 600,
          color: isReadingActive ? '#10b981' : '#f59e0b',
          whiteSpace: 'nowrap'
        }}>
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isReadingActive ? '#10b981' : '#f59e0b',
            boxShadow: isReadingActive ? '0 0 8px #10b981' : 'none'
          }} />
          {isReadingActive ? 'Reading Active' : 'Paused (Idle)'}
        </div>
      </div>

      <Pdfviewer file={viewerFileUrl} backendUrl={noteId ? `${API_BASE}/notes/${noteId}/pdf` : ''} isImageFlag={isImage} isDarkMode={isDarkMode} />

      {/* "Still Reading?" Anti-AFK Modal */}
      {showStillReadingPrompt && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          backgroundColor: '#0d131f',
          border: '1px solid #3b82f6',
          boxShadow: '0 12px 35px rgba(0,0,0,0.85), 0 0 25px rgba(59,130,246,0.3)',
          borderRadius: '12px',
          padding: '14px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          maxWidth: '92%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>📖</span>
            <div>
              <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: '14px' }}>
                Are you still reading?
              </div>
              <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                Study time tracking paused due to inactivity. Click resume to continue recording your progress.
              </div>
            </div>
          </div>
          <button
            onClick={resetActivity}
            style={{
              backgroundColor: '#d9a441',
              color: '#0b0d10',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 10px rgba(217, 164, 65, 0.4)'
            }}
          >
            I'm Still Reading
          </button>
        </div>
      )}

      {/* Custom Review Prompt Modal */}
      {showReviewPrompt && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{
            background: '#11161d', border: '1px solid #222d38', padding: '30px',
            borderRadius: '12px', textAlign: 'center', maxWidth: '400px', width: '90%'
          }}>
            <h2 style={{ color: '#e2e8f0', marginBottom: '15px' }}>Enjoying the Notes?</h2>
            <p style={{ color: '#94a3b8', marginBottom: '25px', lineHeight: '1.5' }}>
              You've been studying for a while! If you find these resources helpful, please consider leaving a review.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                onClick={handleReviewNow}
                style={{ background: '#d9a441', color: '#0b0d10', border: 'none', padding: '10px 20px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Leave a Review
              </button>
              <button 
                onClick={handleReviewLater}
                style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #475569', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actual Review Modal */}
      <ReviewModal 
        isOpen={showActualReviewModal} 
        onClose={() => {
          setShowActualReviewModal(false);
          // If they close the actual modal without submitting, also trigger cooldown
          localStorage.setItem("reviewPopupCooldown", Date.now().toString());
        }}
        onSuccess={() => {
          // If they successfully review, the next login/refresh will have hasReviewed=true
          // For now just close the modal
        }}
      />
    </div>
  );
}