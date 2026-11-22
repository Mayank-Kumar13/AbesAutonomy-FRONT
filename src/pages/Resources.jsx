import React from "react";
import "./Resources.css";
import {
  FileText,
  ClipboardList,
  FlaskConical,
  CircleHelp,
  Notebook,
  BookOpen,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";

// Map frontend card IDs to backend resourceType values (Must remain exact)
const RESOURCE_TYPE_MAP = {
  1: "theory",
  2: "assignment",
  3: "question_bank",
  4: "pyq",
  5: "handwritten",
  6: "syllabus",
};

const resourceCards = [
  {
    id: 1,
    title: "THEORY NOTES",
    description: "Verified academic notes, unit-wise modules, and faculty lecture presentations.",
    icon: FileText,
    badge: "Core Curriculum",
  },
  {
    id: 5,
    title: "HANDWRITTEN NOTES",
    description: "High-yield, handwritten notes contributed by semester toppers for intuitive learning.",
    icon: Notebook,
    badge: "Topper Curated",
  },
  {
    id: 6,
    title: "SYLLABUS",
    description: "Official branch-wise academic syllabus, course structure, and mark distributions.",
    icon: BookOpen,
    badge: "Official",
  },
  {
    id: 4,
    title: "PYQ PAPERS",
    description: "Previous year semester examination papers with question pattern analysis.",
    icon: CircleHelp,
    badge: "Exam Prep",
  },
  {
    id: 2,
    title: "ASSIGNMENTS",
    description: "Structured problem sets, tutorial sheets, and lab assignment guidelines.",
    icon: ClipboardList,
    badge: "Practice",
  },
  {
    id: 3,
    title: "QUESTION BANKS",
    description: "Exhaustive question banks covering frequent exam topics and numerical problems.",
    icon: FlaskConical,
    badge: "Revision",
  },
];

const Resources = () => {
  return (
    <div className="resources-page-wrapper">
      <div className="resources-ambient-light" aria-hidden="true" />
      
      <div className="resources-content-container">
        {/* Header Section */}
        <header className="resources-header anim-slide-up">
          <div className="resources-tag-pill">
            <Sparkles size={13} className="tag-icon" />
            <span>ACADEMIC ARCHIVE</span>
          </div>
          <h1 className="resources-title">
            Academic Resources
          </h1>
          <p className="resources-subtitle">
            Select a learning category below to discover organized, branch-specific notes, syllabus guides,
            and preparation papers designed for ABES Engineering College students.
          </p>
        </header>

        {/* 6 Liquid Glass Category Cards Grid */}
        <section className="resources-grid-section" aria-label="Resource Categories">
          <div className="resources-glass-grid">
            {resourceCards.map((card) => {
              const Icon = card.icon;

              return (
                <Link
                  to="/ChooseSubject"
                  state={{
                    resourceType: RESOURCE_TYPE_MAP[card.id],
                    resourceTitle: card.title,
                  }}
                  className="resource-card-link"
                  key={card.id}
                >
                  <article className="resource-glass-card glass-clear">
                    <div className="card-top-row">
                      <div className="resource-icon-bubble">
                        <Icon size={26} strokeWidth={1.6} />
                      </div>
                      <span className="resource-category-badge">{card.badge}</span>
                    </div>

                    <div className="card-body">
                      <h2 className="resource-card-title">{card.title}</h2>
                      <p className="resource-card-desc">{card.description}</p>
                    </div>

                    <div className="card-action-row">
                      <span className="card-explore-btn">
                        <span>Explore</span>
                        <ArrowRight size={15} className="explore-arrow" />
                      </span>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Resources;
