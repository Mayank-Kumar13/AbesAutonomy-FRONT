import React, { useState, useRef, useEffect } from "react";
import "./Navbar.css";
import { NavLink } from "react-router-dom";
import { HiOutlineUserCircle } from "react-icons/hi2";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { HiMenu, HiX } from "react-icons/hi";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo-link" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="logo-section">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 400 500"
          width="70"
          height="70"
        >
          <defs>
            <style>{`
              .bg-dark { fill: #111215; }
              .gold-fill { fill: #C5AC86; }
              .gold-stroke { stroke: #C5AC86; fill: none; }
              .text-serif {
                font-family: 'Times New Roman', Times, serif;
                fill: #C5AC86;
                text-anchor: middle;
              }
            `}</style>
          </defs>

          <rect width="400" height="500" className="bg-dark" />

          <path
            d="M50 60 L350 60 L350 250 C350 380 200 460 200 460 C200 460 50 380 50 250 Z"
            className="gold-stroke"
            strokeWidth="1.5"
          />

          <path
            d="M58 68 L342 68 L342 250 C342 372 200 448 200 448 C200 448 58 372 58 250 Z"
            className="gold-stroke"
            strokeWidth="1"
          />

          <text
            x="200"
            y="145"
            className="text-serif"
            fontSize="72"
            letterSpacing="5"
          >
            ABES
          </text>

          <line
            x1="58"
            y1="165"
            x2="342"
            y2="165"
            className="gold-stroke"
            strokeWidth="1"
          />

          <g transform="translate(0,-5)">
            <path
              d="M98 280 A102 102 0 0 1 302 280"
              className="gold-stroke"
              strokeWidth="16"
            />

            <path
              d="M98 280 A102 102 0 0 1 302 280"
              stroke="#111215"
              strokeWidth="18"
              strokeDasharray="6 15"
              fill="none"
            />

            <path
              d="M90 280 A110 110 0 0 1 310 280"
              className="gold-stroke"
              strokeWidth="2"
            />

            <path
              d="M120 280 A80 80 0 0 1 280 280 Z"
              className="gold-fill"
            />

            <g fill="#111215">
              <path d="M194 270 C194 270 180 240 200 223 C220 240 206 270 206 270 Z" />
              <path d="M189 271 C189 271 160 255 160 235 C180 240 192 260 192 260 Z" />
              <path d="M211 271 C211 271 240 255 240 235 C220 240 208 260 208 260 Z" />
              <path d="M183 275 C183 275 140 270 135 255 C160 255 183 266 183 266 Z" />
              <path d="M217 275 C217 275 260 270 265 255 C240 255 217 266 217 266 Z" />
              <path d="M120 282 Q160 270 200 283 Q240 270 280 282 L280 285 Q240 273 200 286 Q160 273 120 285 Z" />
              <path d="M130 275 Q165 263 200 278 Q235 263 270 275 L270 278 Q235 268 200 281 Q165 268 130 278 Z" />
            </g>

            <rect
              x="110"
              y="284"
              width="180"
              height="4"
              className="gold-fill"
            />
          </g>

          <text
            x="200"
            y="325"
            className="text-serif"
            fontSize="34"
            letterSpacing="4"
          >
            ABES
          </text>

          <text
            x="200"
            y="352"
            className="text-serif"
            fontSize="17"
            letterSpacing="5"
          >
            AUTONOMY
          </text>

          <line
            x1="135"
            y1="370"
            x2="190"
            y2="370"
            className="gold-stroke"
            strokeWidth="1"
          />

          <polygon
            points="200,366 204,370 200,374 196,370"
            className="gold-fill"
          />

          <line
            x1="210"
            y1="370"
            x2="265"
            y2="370"
            className="gold-stroke"
            strokeWidth="1"
          />

          <text
            x="200"
            y="400"
            className="text-serif"
            fontSize="18"
            letterSpacing="1"
          >
            Estd. 2025
          </text>
        </svg>
        <h2 className="abesname">ABES Autonomy</h2>
      </div>
      </Link>

      <div className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        {mobileMenuOpen ? <HiX size={28} color="#C5AC86" /> : <HiMenu size={28} color="#C5AC86" />}
      </div>

      <div className={`nav-right ${mobileMenuOpen ? "active" : ""}`}>
        <ul className="nav-links">
          <li><NavLink to="/" onClick={() => setMobileMenuOpen(false)}>Home</NavLink></li>
          <li><NavLink to="/resources" onClick={() => setMobileMenuOpen(false)}>Resources</NavLink></li>
          <li><NavLink to="/amcat" onClick={() => setMobileMenuOpen(false)}>AMCAT</NavLink></li>
          <li><NavLink to="/credits" onClick={() => setMobileMenuOpen(false)}>Credits</NavLink></li>
        </ul>

        {isAuthenticated ? (
          <div className="profile" ref={menuRef} style={{ position: "relative" }}>
            <div
              onClick={() => setMenuOpen((o) => !o)}
              style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            >
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="avatar"
                  referrerPolicy="no-referrer"
                  style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                />
              ) : (
                <HiOutlineUserCircle size={28} />
              )}
              <span style={{ fontSize: "15px", fontFamily: "inherit", color: "#C5AC86" }}>{user?.name}</span>
            </div>

            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "36px",
                  right: 0,
                  background: "#111215",
                  border: "1px solid #C5AC86",
                  borderRadius: "6px",
                  minWidth: "150px",
                  zIndex: 10,
                }}
              >
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  style={{ display: "block", padding: "10px 14px", textDecoration: "none", color: "#C5AC86", fontSize: "14px", fontFamily: "inherit" }}
                >
                  My Profile
                </Link>
                <div
                  onClick={handleLogout}
                  style={{ padding: "10px 14px", cursor: "pointer", color: "#C5AC86", fontSize: "14px", fontFamily: "inherit" }}
                >
                  Logout
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" style={{ textDecoration: 'none', color: 'inherit' }} onClick={() => setMobileMenuOpen(false)}>
          <div className="sign-in">Sign In</div>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;