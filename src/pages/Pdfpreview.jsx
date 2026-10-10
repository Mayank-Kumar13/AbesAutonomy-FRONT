import { useNavigate, useLocation } from "react-router-dom";
import Pdfviewer from "../component/Pdfviewer";
import { useEffect, useState } from "react";
import { notesApi, trackingApi } from "../services/api";
import { useAuth } from "../auth/AuthContext";
import ReviewModal from "../component/home/ReviewModal";
import Navbar from "../component/navbar/Navbar";
export default function PdfPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();

  const { pdfUrl, title = "PDF Preview", noteId, subject = "", isImage = false } = location.state || {};
  
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
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
  // Directly use pdfUrl to load from CDN fast, rather than going through the backend which does slow dynamic watermarking on the fly.
  const viewerFileUrl = pdfUrl || (noteId ? `${API_BASE}/notes/${noteId}/pdf` : "");

  const [isDownloading, setIsDownloading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleDownload = async () => {
    if (!noteId) {
      alert("Cannot download this file securely.");
      return;
    }
    
    setIsDownloading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      const downloadUrl = `${API_BASE}/notes/${noteId}/download`;
      
      const response = await fetch(downloadUrl, { headers });
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      
      let ext = 'pdf';
      const urlToMatch = response.url || viewerFileUrl;
      const urlMatch = urlToMatch ? urlToMatch.match(/\.([a-zA-Z0-9]+)(?:[\?#]|$)/) : null;
      if (urlMatch) ext = urlMatch[1].toLowerCase();

      if (blob.type === 'image/jpeg') ext = 'jpg';
      else if (blob.type === 'image/png') ext = 'png';
      else if (blob.type === 'image/webp') ext = 'webp';
      else if (blob.type === 'application/pdf') ext = 'pdf';
      else if (blob.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') ext = 'docx';
      else if (blob.type === 'application/msword') ext = 'doc';
      else if (blob.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') ext = 'pptx';
      else if (blob.type === 'application/vnd.ms-powerpoint') ext = 'ppt';
      
      link.download = `${title}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error(error);
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
          disabled={isDownloading || !noteId}
          style={{
            padding: "8px 20px",
            cursor: isDownloading || !noteId ? "not-allowed" : "pointer",
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
      </div>

      <Pdfviewer file={viewerFileUrl} backendUrl={noteId ? `${API_BASE}/notes/${noteId}/pdf` : ''} isImageFlag={isImage} isDarkMode={isDarkMode} />

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