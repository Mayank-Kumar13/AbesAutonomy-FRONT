import React, { useState, useEffect } from "react";
import "./Subject.css";
import { useLocation, useNavigate } from "react-router-dom";
import { FileText, Download } from "lucide-react";
import { notesApi } from "../../services/api";
import { downloadNoteFile } from "../../utils/downloadHelper";

const Subject = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    heading = "SUBJECT",
    para = "Subject Resources",
    year = 1,
    resourceType = "theory",
    resourceTitle = "THEORY NOTES",
    branch = "electrical",
  } = location.state || {};

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

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

    if (isDownloadingAll) return;
    setIsDownloadingAll(true);

    try {
      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        try {
          await downloadNoteFile(
            {
              noteId: note._id,
              pdfUrl: note.pdfUrl,
              title: note.title,
            },
            i
          );
        } catch (error) {
          console.error("Blob download failed for:", note.title, error);
        }

        // Small delay between downloads so browsers don't block multiple files
        if (i < notes.length - 1) {
          await new Promise((res) => setTimeout(res, 600));
        }
      }
    } finally {
      setIsDownloadingAll(false);
    }
  };

  // Group notes by unit for display
  const groupedByUnit = {};
  notes.forEach((note) => {
    const unitKey = note.unit || 0;
    if (!groupedByUnit[unitKey]) groupedByUnit[unitKey] = [];
    groupedByUnit[unitKey].push(note);
  });

  // If no notes are fetched, do not show fallback units.
  const displayUnits = Object.keys(groupedByUnit)
    .sort((a, b) => Number(a) - Number(b))
    .map((unitKey) => ({
      unitNumber: Number(unitKey),
      notes: groupedByUnit[unitKey],
    }));

  return (
    <main className="subject-page">
      <div className="subject-container">
        <div style={{ color: '#d4a373', marginBottom: '24px', fontSize: '13px', fontWeight: '600', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = '#d4a373'} onClick={() => navigate('/resources')}>RESOURCES</span>
          <span>/</span>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = '#d4a373'} onClick={() => navigate(-1)}>{resourceTitle.toUpperCase()}</span>
          <span>/</span>
          <span style={{ color: '#fff' }}>{heading.toUpperCase()}</span>
        </div>
        <div className="subject-heading">
          <h1>{heading}</h1>

          <p>
            Download all {para} study materials
            <br />
            organized by units.
          </p>
        </div>

        <button
          className="download-all"
          onClick={handleDownloadAll}
          disabled={isDownloadingAll}
          title={isDownloadingAll ? "Downloading notes..." : "Download all notes"}
        >
          <Download size={22} />
          <span>{isDownloadingAll ? "DOWNLOADING..." : "DOWNLOAD ALL"}</span>
        </button>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#b9b8b5" }}>
            <p>Loading notes...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#e57373" }}>
            <p>{error}</p>
          </div>
        ) : displayUnits.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#b9b8b5" }}>
            <p>No resources found for this subject yet.</p>
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