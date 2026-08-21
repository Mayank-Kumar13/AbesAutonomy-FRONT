import React from "react";
import "./Resources.css";
import { Search } from "lucide-react";
import { useState } from "react";
import {
  FileText,
  ClipboardList,
  FlaskConical,
  CircleHelp,
  Notebook,
  Info
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { notesApi } from "../services/api";

// Map frontend card IDs to backend resourceType values
const RESOURCE_TYPE_MAP = {
  1: "theory",
  2: "assignment",
  3: "lab_manual",
  4: "pyq",
  5: "handwritten",
  6: "info",
};

const Resources = () => {
  const [selectedYear, setSelectedYear] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  const resourceCards = [
  {
    id: 1,
    title: "THEORY NOTES",
    description: "Academic notes & lecture slides",
    icon: FileText,
  },
  {
    id: 2,
    title: "ASSIGNMENTS",
    description: "Problem sets & projects",
    icon: ClipboardList,
  },
  {
    id: 3,
    title: "LAB MANUALS",
    description: "Manuals & experimentation logs",
    icon: FlaskConical,
  },
  {
    id: 4,
    title: "PYQ QUESTION",
    description: "Previous year exam papers",
    icon: CircleHelp,
  },
  {
    id: 5,
    title: "HANDWRITTEN NOTES",
    description: "Handwritten notes by Topper Student [10 SGPA]",
    icon: Notebook,
  },
  {
    id: 6,
    title: "INFO",
    description: "Important information & guidelines",
    icon: Info,
  },
];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;

    setSearching(true);
    try {
      const result = await notesApi.search(searchQuery.trim());
      setSearchResults(result);
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResults({ data: [], pagination: { total: 0 } });
    } finally {
      setSearching(false);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  };

  return (
    <div className="main">

      <div className="hero_section">
        <h1>RESOURCES</h1>

        <p>
          Your one-stop destination for academic materials, notes, labs,
          <br />
          assignments, and previous year papers.
        </p>
      </div>

      {/* <section className="search-section">

        <div className="search-box">
          <Search className="search-icon" size={22} />

          <input
            type="text"
            placeholder="Search for subjects, courses, notes, PYQs..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!e.target.value.trim()) setSearchResults(null);
            }}
            onKeyDown={handleSearchKeyDown}
          />
        </div>

        {/* Search results 
        {searching && (
          <p style={{ color: "#d4a373", marginTop: "20px" }}>Searching...</p>
        )}
        {searchResults && !searching && (
          <div style={{ width: "60%", marginTop: "20px" }}>
            <p style={{ color: "#888", marginBottom: "10px" }}>
              {searchResults.pagination?.total || 0} result(s) found
            </p>
            {searchResults.data?.map((note) => (
              <div
                key={note._id}
                onClick={() =>
                  navigate("/pdfpreview", {
                    state: { pdfUrl: note.pdfUrl, title: note.title, noteId: note._id },
                  })
                }
                style={{
                  padding: "12px 16px",
                  marginBottom: "8px",
                  background: "#11161d",
                  border: "1px solid #222d38",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "border-color 0.3s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#d4a373")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#222d38")}
              >
                <strong style={{ color: "#f5f5f5" }}>{note.title}</strong>
                <p style={{ color: "#888", fontSize: "13px", margin: "4px 0 0" }}>
                  {note.subject} · {note.branch} · Year {note.year} · {note.resourceType}
                </p>
              </div>
            ))}
          </div>
        )}
      </section> */}

      {/* <div className="year-selector">

  <span className="year-label">
    YEAR
  </span>

  {[1, 2, 3, 4].map((year) => (
    <button
      key={year}
      className={`year-button ${
        selectedYear === year ? "active" : ""
      }`}
      onClick={() => setSelectedYear(year)}
    >
      {year}
    </button>
  ))}

</div> */}
<section className="resources-section">

  <div className="resources-grid">

    {resourceCards.map((card) => {

      const Icon = card.icon;

      return (
        <Link
          to="/ChooseSubject"
          state={{
            year: selectedYear,
            resourceType: RESOURCE_TYPE_MAP[card.id],
            resourceTitle: card.title,
          }}
          style={{ textDecoration: 'none', color: 'inherit' }}
          key={card.id}
        >
        <div className="resource-card" key={card.id}>

          <div className="resource-icon">
            <Icon size={42} strokeWidth={1.5} />
          </div>
          <h2>{card.title}</h2>
          <p>{card.description}</p>
          <button className="explore-button">
            Explore
            <span>→</span>
          </button>

        </div>
        </Link>
      );

    })}

  </div>

</section>

    </div>
  );
};

export default Resources;