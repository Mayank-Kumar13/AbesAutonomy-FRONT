import React, { useState } from "react";
import { Star, X, Send, Lock, Unlock } from "lucide-react";
import { reviewApi } from "../../services/api";
import { useAuth } from "../../auth/AuthContext";
import "./ReviewModal.css";

const ReviewModal = ({ isOpen, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { currentWatchTime } = useAuth();
  
  const REQUIRED_TIME_MS = 600000; // 10 minutes
  const isLocked = currentWatchTime < REQUIRED_TIME_MS;
  const remainingMs = Math.max(0, REQUIRED_TIME_MS - currentWatchTime);
  const remainingMins = Math.floor(remainingMs / 60000);
  const remainingSecs = Math.floor((remainingMs % 60000) / 1000);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    if (content.trim().length < 10) {
      setError("Review must be at least 10 characters.");
      return;
    }
    if (content.trim().length > 500) {
      setError("Review cannot exceed 500 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await reviewApi.create(rating, content.trim());
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setRating(0);
        setContent("");
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const activeRating = hoveredRating || rating;

  return (
    <div className="review-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Write a review">
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        <button className="review-modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <h2 className="review-modal-title">Write a Review</h2>
        <p className="review-modal-subtitle">Share your experience with ABES Autonomy</p>

        {success ? (
          <div className="review-modal-success">
            <div className="success-icon">✓</div>
            <p>Review submitted successfully!</p>
          </div>
        ) : isLocked ? (
          <div className="review-locked-state" style={{ textAlign: "center", padding: "2rem 0" }}>
            <Lock size={48} color="#d4a373" style={{ margin: "0 auto 1rem" }} />
            <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>🔒 Review locked</h3>
            <p style={{ color: "#a0a0a0", marginBottom: "1rem" }}>Watch for 10 minutes to unlock the review option.</p>
            <div style={{ background: "#2a2a2a", padding: "10px", borderRadius: "8px", display: "inline-block" }}>
              <span style={{ color: "#d4a373", fontWeight: "bold" }}>Remaining: {remainingMins} minutes {remainingSecs} seconds</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="review-modal-form">
            <div className="review-unlocked-banner" style={{ background: "rgba(76, 175, 80, 0.1)", color: "#4caf50", padding: "10px", borderRadius: "8px", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <Unlock size={18} />
              <span>✓ Review unlocked. You can now submit your review.</span>
            </div>
            {/* Star Rating */}
            <div className="rating-section">
              <label className="rating-label">Your Rating</label>
              <div className="star-row" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${star <= activeRating ? "star-filled" : ""}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                    role="radio"
                    aria-checked={star === rating}
                  >
                    <Star size={28} fill={star <= activeRating ? "#d4a373" : "none"} />
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="content-section">
              <label htmlFor="review-content" className="content-label">
                Your Review
              </label>
              <textarea
                id="review-content"
                className="review-textarea"
                placeholder="Tell us what you think about ABES Autonomy..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                maxLength={500}
              />
              <span className="char-count">{content.length}/500</span>
            </div>

            {error && <p className="review-modal-error">{error}</p>}

            <button
              type="submit"
              className="review-submit-btn"
              disabled={submitting}
            >
              {submitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send size={16} />
                  Submit Review
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReviewModal;
