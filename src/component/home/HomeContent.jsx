import React, { useState, useEffect, useRef, useCallback } from "react";
import "./HomeContent.css";
import buildingPhoto from "../../../IMAGES/BUILDING.png";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  FlaskConical,
  Copy,
  BookOpen,
  ArrowRight,
  Star,
  MessageSquare,
  Pen,
} from "lucide-react";
import { reviewApi } from "../../services/api";
import { useAuth } from "../../auth/AuthContext";
import ReviewModal from "./ReviewModal";

const cards = [
  {
    title: "ASSIGNMENTS",
    description: "Homework, problem sets and project assignments.",
    icon: <ClipboardList size={34} />,
  },
  {
    title: "LAB MANUALS",
    description: "Practical manuals, experiment records and lab guides.",
    icon: <FlaskConical size={34} />,
  },
  {
    title: "PREVIOUS PAPERS",
    description: "Previous year question papers and exam resources.",
    icon: <Copy size={34} />,
  },
  {
    title: "SUBJECTS",
    description: "Browse all subjects and course materials.",
    icon: <BookOpen size={34} />,
  },
];

const ReviewCard = ({ review }) => {
  const initial = (review.displayName || "U")[0].toUpperCase();
  const date = new Date(review.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="review-card" aria-label={`Review by ${review.displayName}`}>
      <div className="review-card-header">
        <div className="review-avatar">{initial}</div>
        <div className="review-meta">
          <span className="review-name">{review.displayName}</span>
          <span className="review-date">{date}</span>
        </div>
      </div>
      <div className="review-stars" aria-label={`${review.rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={14}
            fill={s <= review.rating ? "#d4a373" : "none"}
            color={s <= review.rating ? "#d4a373" : "#374151"}
          />
        ))}
      </div>
      <p className="review-text">{review.content}</p>
    </div>
  );
};

const HomeContent = () => {
  const [reviews, setReviews] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const scrollRef = useRef(null);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await reviewApi.list(1, 50);
      setReviews(res.data || []);
    } catch {
      // Silently fail — reviews are non-critical
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleWriteReview = () => {
    if (!isAuthenticated) {
      // Navigate to login — simple approach
      window.location.href = "/login";
      return;
    }
    setModalOpen(true);
  };

  return (
    <main className="home">

      {/* WELCOME SECTION */}
      <section className="welcome-section">

        <h1 className="welcome-heading">
          Welcome to Abes Autonomy
        </h1>

        <p className="welcome-quote">
          "Success is the sum of small efforts, repeated day in and day out."
        </p>

      </section>

      {/* ABOUT SECTION */}

      <section className="about-section">

        <div className="about-card">

          <pre className="why">WHY ABES AUTONOMY
            
            <p>
               IS 
               </p>
              <pre className="important">
            IMPORTANT?
            </pre>
            </pre>

          <div className="quote-mark">"</div>

          <p>
            Education is not just about learning,
            it's about building a better tomorrow.
          </p>

          <span>– ABES Autonomy</span>

        </div>

        <div className="building-card">

          <img
            src={buildingPhoto}
            alt="ABES Building"
          />

        </div>

      </section>

      {/* RESOURCE CARDS */}

      <section className="resource-section">

  {cards.map((card, index) => (

    <Link
      key={index}
      to="/ChooseSubject"
      className="resource-link"
    >

      <div className="resource-card">

        <div className="card-icon">
          {card.icon}
        </div>

        <h3>{card.title}</h3>

        <p>{card.description}</p>

        <button>
          <ArrowRight size={18} />
        </button>

      </div>

    </Link>

  ))}

</section>

      {/* ════════════════ REVIEWS SECTION ════════════════ */}
      <section className="reviews-live-section" role="region" aria-label="Student Reviews">
        <div className="reviews-live-inner">

          {/* Left Panel */}
          <div className="reviews-left-panel">
            <span className="reviews-badge">REVIEWS</span>
            <h2 className="reviews-heading">
              Your feedback<br />
              <span className="reviews-accent">means a lot!</span>
            </h2>
            <p className="reviews-description">
              If you like ABES Autonomy, send your review to us and see
              <span className="reviews-accent"> your name </span>
              here!
            </p>
            <button className="write-review-btn" onClick={handleWriteReview}>
              <Pen size={16} />
              Write a Review
            </button>
          </div>

          {/* Right Panel — Scrolling Reviews */}
          <div className="reviews-right-panel">
            {reviews.length === 0 ? (
              <div className="reviews-empty">
                <MessageSquare size={40} color="#d4a373" />
                <h3>YOUR REVIEW WILL APPEAR HERE</h3>
                <p>Help others by sharing your thoughts.</p>
              </div>
            ) : (
              <div
                className="reviews-scroll-container"
                ref={scrollRef}
                aria-live="polite"
              >
                <div className="reviews-scroll-track">
                  {reviews.map((review, i) => (
                    <ReviewCard key={`${review._id}-${i}`} review={review} />
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Review Modal */}
      <ReviewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchReviews}
      />
  </main>
  );
};

export default HomeContent;