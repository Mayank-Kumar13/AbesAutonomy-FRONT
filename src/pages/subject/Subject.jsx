import React, { useState, useEffect } from "react";
import "./Subject.css";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { 
  FileText, 
  Download, 
  ArrowRight, 
  ChevronRight, 
  BookOpen, 
  Eye, 
  CheckCircle2, 
  AlertCircle,
  Inbox,
  Sparkles,
  Loader2
} from "lucide-react";
import { notesApi } from "../../services/api";
import { downloadNoteFile } from "../../utils/downloadHelper";
import PremiumUpgradeModal from "../../component/premium/PremiumUpgradeModal";

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
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

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

  const handleDownloadSingle = async (e, note) => {
    e.stopPropagation();
    if (downloadingId === note._id) return;
    setDownloadingId(note._id);
    try {
      await downloadNoteFile({
        noteId: note._id,
        pdfUrl: note.pdfUrl,
        title: note.title,
      });
    } catch (err) {
      console.error("Download failed:", err);
      if (err.status === 403 || err.data?.code === 'PREMIUM_REQUIRED') {
        setShowPremiumModal(true);
      }
    } finally {
      setDownloadingId(null);
    }
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
          if (error.status === 403 || error.data?.code === 'PREMIUM_REQUIRED') {
            setShowPremiumModal(true);
            break;
          }
        }
      }
    } finally {
      setIsDownloadingAll(false);
    }
  };

  // Group notes by Unit
  const groupedNotes = notes.reduce((acc, note) => {
    const unit = note.unit ? `Unit ${note.unit}` : "General Notes";
    if (!acc[unit]) acc[unit] = [];
    acc[unit].push(note);
    return acc;
  }, {});

  return (
    <div className="subject-page-wrapper">
      <div className="subject-ambient-light" aria-hidden="true" />

      <div className="subject-page-container">
        {/* Breadcrumb Navigation */}
        <nav className="subject-breadcrumb" aria-label="Breadcrumb">
          <Link to="/resources" className="breadcrumb-link">RESOURCES</Link>
          <ChevronRight size={14} className="breadcrumb-sep" />
          <Link 
            to="/ChooseSubject" 
            state={{ resourceType, resourceTitle }} 
            className="breadcrumb-link"
          >
            {resourceTitle.toUpperCase()}
          </Link>
          <ChevronRight size={14} className="breadcrumb-sep" />
          <span className="breadcrumb-current">{heading}</span>
        </nav>

        {/* Subject Header */}
        <header className="subject-header">
          <div className="subject-header-info">
            <div className="subject-tags-row">
              <span className="subject-tag">Year {year}</span>
              <span className="subject-tag">{branch.toUpperCase()}</span>
              <span className="subject-tag">{notes.length} Documents</span>
            </div>
            <h1 className="subject-main-title">{heading}</h1>
            <p className="subject-main-subtitle">{para}</p>
          </div>

          {/* Action Row */}
          {notes.length > 0 && (
            <div className="subject-header-actions">
              <button
                type="button"
                className="glass-btn-secondary download-all-btn"
                onClick={handleDownloadAll}
                disabled={isDownloadingAll}
              >
                {isDownloadingAll ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Downloading Archive...</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>Download All Notes</span>
                  </>
                )}
              </button>
            </div>
          )}
        </header>

        {/* Content Section */}
        {loading ? (
          <div className="subject-loading-state">
            {[1, 2, 3].map((i) => (
              <div key={i} className="subject-unit-skeleton skeleton-shimmer" />
            ))}
          </div>
        ) : error ? (
          <div className="subject-error-state glass-clear">
            <AlertCircle size={32} className="error-icon" />
            <h3>Unable to Load Notes</h3>
            <p>{error}</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="subject-empty-state glass-clear">
            <div className="empty-bubble">
              <Inbox size={32} />
            </div>
            <h3>No Notes Uploaded Yet</h3>
            <p>Notes for {heading} are currently being curated and uploaded by our academic coordinators.</p>
          </div>
        ) : (
          <div className="subject-units-flow">
            {Object.entries(groupedNotes).map(([unitName, unitNotes]) => (
              <section key={unitName} className="unit-glass-panel glass-frosted" aria-label={unitName}>
                <div className="unit-panel-header">
                  <div className="unit-title-wrap">
                    <BookOpen size={18} className="unit-icon" />
                    <h2 className="unit-title">{unitName}</h2>
                  </div>
                  <span className="unit-notes-count">{unitNotes.length} file{unitNotes.length > 1 ? 's' : ''}</span>
                </div>

                <div className="unit-notes-list">
                  {unitNotes.map((note) => (
                    <article 
                      key={note._id} 
                      className="note-row-item glass-clear"
                      onClick={() => handlePreview(note)}
                    >
                      <div className="note-left-col">
                        <div className="note-file-bubble">
                          <FileText size={20} />
                        </div>
                        <div className="note-meta-block">
                          <h3 className="note-title">{note.title}</h3>
                          <div className="note-specs-row">
                            <span className="note-spec-badge">{note.resourceType || resourceType}</span>
                            {note.unit && <span className="note-spec-badge">Unit {note.unit}</span>}
                            {note.viewsCount > 0 && <span className="note-views-text">{note.viewsCount} reads</span>}
                          </div>
                        </div>
                      </div>

                      <div className="note-right-actions">
                        <button
                          type="button"
                          className="glass-btn-primary note-preview-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(note);
                          }}
                        >
                          <Eye size={14} />
                          <span>Preview</span>
                        </button>

                        <button
                          type="button"
                          className="glass-icon-btn note-dl-btn"
                          aria-label={`Download ${note.title}`}
                          onClick={(e) => handleDownloadSingle(e, note)}
                          disabled={downloadingId === note._id}
                        >
                          {downloadingId === note._id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Download size={16} />
                          )}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Premium Upgrade Modal if user hits premium gate */}
        {showPremiumModal && (
          <PremiumUpgradeModal 
            isOpen={showPremiumModal} 
            onClose={() => setShowPremiumModal(false)} 
          />
        )}
      </div>
    </div>
  );
};

export default Subject;
