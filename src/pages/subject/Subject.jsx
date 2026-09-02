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
        });

        setNotes(result.data || []);
      } catch (err) {
        console.error("Failed to fetch notes:", err);
        setError("Failed to load notes. Please try again.");
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [heading, year, resourceType, branch]);

  const handlePreview = (note) => {
    navigate("/pdfpreview", {
      state: {
        pdfUrl: note.pdfUrl,
        title: note.title,
        noteId: note._id,
      },
    });
  };

  const handleDownloadAll = () => {
    if (!notes || notes.length === 0) {
      alert("No notes available to download.");
      return;
    }
    
    notes.forEach((note, index) => {
      if (note.pdfUrl) {
        // Add a slight delay to prevent browser from blocking multiple simultaneous downloads
        setTimeout(() => {
          const link = document.createElement("a");
          link.href = note.pdfUrl;
          link.download = note.title ? `${note.title}.pdf` : `document_${index + 1}.pdf`;
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, index * 300);
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
                    <h2>
                      {unitData.unitNumber > 0
                        ? `Unit ${unitData.unitNumber}`
                        : "General"}
                    </h2>
                    <p style={{ color: "#888", fontSize: "13px", margin: "0 0 16px" }}>
                      {note.title}
                    </p>
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
                  <h2>
                    {unitData.unitNumber > 0
                      ? `Unit ${unitData.unitNumber}`
                      : "General"}
                  </h2>
                  {unitData.notes.length > 0 && (
                    <p style={{ color: "#888", fontSize: "13px", margin: "0 0 16px" }}>
                      {unitData.notes[0].title}
                    </p>
                  )}
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