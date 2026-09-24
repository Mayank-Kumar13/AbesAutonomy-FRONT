import React, { useState, useEffect } from "react";
import "./Subject.css";
import { useLocation, useNavigate } from "react-router-dom";
import { FileText, Download } from "lucide-react";
import { notesApi } from "../../services/api";

const Subject = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    heading = "SUBJECT",
    para = "Subject Resources",
    year = 1,
    resourceType = "theory",
    branch = "electrical",
  } = location.state || {};

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchNotes = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await notesApi.list({
          subject: heading,
          year: year,
          resourceType: resourceType,
          branch: branch,
          limit: 50,
          sort: "unit",
        }, { signal: controller.signal });

        setNotes(result.data || []);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error("Failed to fetch notes:", err);
        setError("Failed to load notes. Please try again.");
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();

    return () => controller.abort();
  }, [heading, year, resourceType, branch]);

  const handlePreview = (note) => {
    const isImg = note.pdfUrl ? /\.(png|jpe?g|webp)$/i.test(note.pdfUrl.split('?')[0]) : false;
    navigate("/pdfpreview", {
      state: {
        pdfUrl: note.pdfUrl,
        title: note.title,
        noteId: note._id,
        subject: note.subject,
        isImage: isImg
      },
    });
  };

  const handleDownloadAll = async () => {
    if (!notes || notes.length === 0) {
      alert("No notes available to download.");
      return;
    }

    const token = localStorage.getItem("token");
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};

    notes.forEach(async (note, index) => {
      if (note._id) {
        const downloadUrl = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/notes/${note._id}/download`;
        try {
          // Fetch the PDF as a blob to bypass pop-up blockers for multiple files
          const response = await fetch(downloadUrl, { headers });
          if (!response.ok) throw new Error("Download failed");
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          
          const extMatch = note.pdfUrl ? note.pdfUrl.match(/\.(pdf|png|jpe?g|webp)$/i) : null;
          const ext = extMatch ? extMatch[1].toLowerCase() : 'pdf';
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = note.title ? `${note.title}.${ext}` : `document_${index + 1}.${ext}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Cleanup the object URL
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
        } catch (error) {
          console.error("Blob download failed for:", note.title, error);
          alert(`Failed to download ${note.title}`);
        }
      }
    });
  };

  // Group notes by unit for display
  const groupedByUnit = {};
  notes.forEach((note) => {
    const unitKey = note.unit || 0;
    if (!groupedByUnit[unitKey]) groupedByUnit[unitKey] = [];
    groupedByUnit[unitKey].push(note);
  });

  // If no notes are fetched, show fallback units
  const displayUnits =
    notes.length > 0
      ? Object.keys(groupedByUnit)
          .sort((a, b) => Number(a) - Number(b))
          .map((unitKey) => ({
            unitNumber: Number(unitKey),
            notes: groupedByUnit[unitKey],
          }))
      : [1, 2, 3, 4, 5].map((u) => ({ unitNumber: u, notes: [] }));

  return (
    <main className="subject-page">
      <div className="subject-container">
        <div className="subject-heading">
          <h1>{heading}</h1>

          <p>
            Download all {para} study materials
            <br />
            organized by units.
          </p>
        </div>

        <button className="download-all" onClick={handleDownloadAll}>
          <Download size={22} />
          <span>DOWNLOAD ALL</span>
        </button>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#b9b8b5" }}>
            <p>Loading notes...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#e57373" }}>
            <p>{error}</p>
          </div>
        ) : (
          <div className="units-grid">
            {displayUnits.map((unitData) =>
              unitData.notes.length > 1 ? (
                // Multiple files share this unit (common for PYQs, which usually
                // don't have a meaningful "unit") — show each one as its own card.
                unitData.notes.map((note) => (
                  <div
                    className="unit-card"
                    key={note._id}
                    onClick={() => handlePreview(note)}
                    style={{ cursor: "pointer" }}
                  >
                    <FileText className="file-icon" />
                    <h2 style={{ marginBottom: "16px" }}>
                      {note.title}
                    </h2>
                    <button className="unit-download-btn">
                      <span>Preview</span>
                    </button>
                  </div>
                ))
              ) : (
                <div
                  className="unit-card"
                  key={unitData.unitNumber}
                  onClick={() => {
                    if (unitData.notes.length > 0) {
                      handlePreview(unitData.notes[0]);
                    }
                  }}
                  style={{ cursor: unitData.notes.length > 0 ? "pointer" : "default" }}
                >
                  <FileText className="file-icon" />
                  <h2 style={unitData.notes.length > 0 ? { marginBottom: "16px" } : {}}>
                    {unitData.notes.length > 0
                      ? unitData.notes[0].title
                      : `Unit ${unitData.unitNumber}`}
                  </h2>
                  <button className="unit-download-btn">
                    <span>
                      {unitData.notes.length > 0 ? "Preview" : "Coming Soon"}
                    </span>
                  </button>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default Subject;