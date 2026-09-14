import { useNavigate, useLocation } from "react-router-dom";
import Pdfviewer from "../component/Pdfviewer";
import { useEffect, useState } from "react";
import { notesApi, trackingApi } from "../services/api";
import { useAuth } from "../auth/AuthContext";
import ReviewModal from "../component/home/ReviewModal";

export default function PdfPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();

  const { pdfUrl, title = "PDF Preview", noteId, subject = "" } = location.state || {};
  
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [showActualReviewModal, setShowActualReviewModal] = useState(false);

  // Live Tracking for PDFs
  useEffect(() => {
    if (!user || !token) return;

    const ping = async () => {
      try {
        await trackingApi.ping(
          "/pdfpreview",
          pdfUrl || null,
          title || "Untitled PDF",
          subject || "Unknown Subject"
        );
      } catch (err) { console.error("[tracking] ping failed:", err); }
    };

    ping();
    const interval = setInterval(ping, 15000);
    return () => clearInterval(interval);
  }, [user, token, pdfUrl, title]);

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
  const viewerFileUrl = noteId ? `${API_BASE}/notes/${noteId}/pdf` : pdfUrl;

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        style={{
          width: "100%",
          padding: "4px",
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

      <Pdfviewer file={viewerFileUrl} />

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