import { useNavigate, useLocation } from "react-router-dom";
import Pdfviewer from "../component/Pdfviewer";
import { useEffect } from "react";
import { notesApi } from "../services/api";

export default function PdfPreview() {
  const navigate = useNavigate();
  const location = useLocation();

  const { pdfUrl, title = "PDF Preview", noteId } = location.state || {};

  // Increment view count when a note is viewed
  useEffect(() => {
    if (noteId) {
      notesApi.incrementView(noteId).catch(() => {
        // Silently ignore — view counting is non-critical
      });
    }
  }, [noteId]);

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
    </div>
  );
}