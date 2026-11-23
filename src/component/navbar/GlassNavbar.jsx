import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { HiOutlineUserCircle } from "react-icons/hi2";
import { 
  Menu, 
  X, 
  ChevronDown, 
  Crown, 
  Sparkles, 
  User, 
  ShieldCheck, 
  LogOut, 
  LogIn,
  Layers,
  Award,
  BookOpen
} from "lucide-react";
import "./GlassNavbar.css";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/resources", label: "Resources" },
  { to: "/premium", label: "Premium", isPremium: true },
  { to: "/mvp-projects", label: "MVP Projects" },
  { to: "/credits", label: "Credits" },
];

export default function GlassNavbar({ variant = "standard", onSkipNotes }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0, opacity: 0 });

  const capsuleRef = useRef(null);
  const userMenuRef = useRef(null);
  const lastScrollY = useRef(0);

  // Track scroll position and direction: auto-hide when scrolling down to avoid
  // obstructing content, and smoothly restore when scrolling up or at top.
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 20);

      if (currentY > 100 && currentY > lastScrollY.current + 8 && !mobileMenuOpen && !userDropdownOpen) {
        setNavHidden(true);
      } else if (currentY < lastScrollY.current - 6 || currentY <= 60) {
        setNavHidden(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mobileMenuOpen, userDropdownOpen]);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  // Click outside listener for user dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setUserDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Pointer lighting effect across the capsule
  const handlePointerMove = useCallback((e) => {
    if (!capsuleRef.current) return;
    const rect = capsuleRef.current.getBoundingClientRect();
    setSpotlightPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      opacity: 1,
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    setSpotlightPos((prev) => ({ ...prev, opacity: 0 }));
  }, []);

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    navigate("/");
  };

  const isHome = variant === "home" || location.pathname === "/";

  return (
    <>
      {/* Skip to content link for accessibility */}
      <a 
        href={isHome ? "#all-notes" : "#main-content"} 
        onClick={onSkipNotes} 
        className="glass-skip-link"
      >
        Skip to content
      </a>

      {/* Floating Dynamic Island Navigation Capsule */}
      <header 
        className={`glass-nav-wrapper ${scrolled ? "is-scrolled" : ""} ${isHome ? "is-home" : ""} ${navHidden ? "is-hidden" : ""}`}
      >
        <nav 
          ref={capsuleRef}
          className="glass-nav-capsule"
          onMouseMove={handlePointerMove}
          onMouseLeave={handlePointerLeave}
          aria-label="Main Navigation"
        >
          {/* Mouse-tracking specular spotlight illumination */}
          <div 
            className="capsule-spotlight"
            style={{
              transform: `translate(${spotlightPos.x - 100}px, ${spotlightPos.y - 100}px)`,
              opacity: spotlightPos.opacity,
            }}
            aria-hidden="true"
          />

          {/* Brand Logo & Name */}
          <Link to="/" className="capsule-brand" aria-label="ABES Autonomy Home">
            <div className="brand-crest">
              <svg viewBox="0 0 400 500" width="28" height="34" aria-hidden="true">
                <defs>
                  <linearGradient id="crestGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#DFCAAA" />
                    <stop offset="100%" stopColor="#C5AC86" />
                  </linearGradient>
                </defs>
                <path
                  d="M50 60 L350 60 L350 250 C350 380 200 460 200 460 C200 460 50 380 50 250 Z"
                  stroke="url(#crestGoldGrad)"
                  strokeWidth="8"
                  fill="rgba(12, 14, 18, 0.85)"
                />
                <path
                  d="M75 85 L325 85 L325 240 C325 350 200 420 200 420 C200 420 75 350 75 240 Z"
                  stroke="url(#crestGoldGrad)"
                  strokeWidth="3"
                  fill="none"
                  opacity="0.6"
                />
                <text
                  x="200"
                  y="180"
                  fontFamily="'SF Pro Display', -apple-system, sans-serif"
                  fontWeight="800"
                  fontSize="82"
                  fill="url(#crestGoldGrad)"
                  textAnchor="middle"
                  letterSpacing="4"
                >
                  ABES
                </text>
                <circle cx="200" cy="270" r="45" fill="none" stroke="url(#crestGoldGrad)" strokeWidth="6" />
                <path d="M185 270 L215 270 M200 255 L200 285" stroke="url(#crestGoldGrad)" strokeWidth="6" strokeLinecap="round" />
              </svg>
            </div>
            <div className="brand-text">
              <span className="brand-title">ABES</span>
              <span className="brand-sub">AUTONOMY</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="capsule-links">
            {navLinks.map(({ to, label, isPremium }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) => `capsule-link ${isActive ? "active" : ""} ${isPremium ? "is-premium" : ""}`}
              >
                {isPremium && <Crown size={13} className="premium-crown" aria-hidden="true" />}
                <span>{label}</span>
              </NavLink>
            ))}
          </div>

          {/* Right Action: Auth or Profile */}
          <div className="capsule-actions">
            {isAuthenticated ? (
              <div className="user-menu-container" ref={userMenuRef}>
                <button
                  type="button"
                  className={`user-pill ${userDropdownOpen ? "open" : ""}`}
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                  aria-label="User account menu"
                >
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="user-avatar"
                    />
                  ) : (
                    <div className="user-avatar-placeholder">
                      <User size={15} />
                    </div>
                  )}
                  <span className="user-name">
                    {user?.name ? user.name.split(" ")[0] : "Account"}
                  </span>
                  <ChevronDown size={14} className={`dropdown-chevron ${userDropdownOpen ? "rotate" : ""}`} />
                </button>

                {/* Frosted Glass User Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="glass-dropdown-menu anim-scale-in" role="menu">
                    <div className="dropdown-header">
                      <p className="dropdown-user-name">{user?.name}</p>
                      <p className="dropdown-user-email">{user?.email}</p>
                      {user?.isPremium && (
                        <span className="premium-badge">
                          <Crown size={11} /> Pro Member
                        </span>
                      )}
                    </div>
                    <div className="dropdown-divider" />
                    <Link
                      to="/profile"
                      className="dropdown-item"
                      role="menuitem"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <User size={15} />
                      <span>My Profile</span>
                    </Link>
                    {(user?.role === "admin" || user?.role === "coordinator") && (
                      <Link
                        to="/admin"
                        className="dropdown-item"
                        role="menuitem"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <ShieldCheck size={15} />
                        <span>Admin Panel</span>
                      </Link>
                    )}
                    <div className="dropdown-divider" />
                    <button
                      type="button"
                      className="dropdown-item logout-item"
                      role="menuitem"
                      onClick={handleLogout}
                    >
                      <LogOut size={15} />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                to="/login" 
                className="nav-signin-pill"
                style={{ color: '#08090C', textDecoration: 'none' }}
              >
                <span style={{ color: '#08090C', WebkitTextFillColor: '#08090C' }}>Sign In</span>
                <LogIn size={14} style={{ color: '#08090C', stroke: '#08090C' }} />
              </Link>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className="mobile-capsule-toggle"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Glass Navigation Sheet / Drawer */}
      <div 
        className={`mobile-glass-overlay ${mobileMenuOpen ? "active" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <div 
        className={`mobile-glass-sheet ${mobileMenuOpen ? "active" : ""}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="mobile-sheet-header">
          <div className="brand-text">
            <span className="brand-title">ABES</span>
            <span className="brand-sub">AUTONOMY</span>
          </div>
          <button 
            type="button" 
            className="mobile-sheet-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mobile-sheet-links">
          {navLinks.map(({ to, label, isPremium }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => `mobile-sheet-link ${isActive ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="link-label">
                {isPremium && <Crown size={16} className="premium-crown" />}
                {label}
              </span>
              {isPremium && <span className="mobile-pro-tag">PRO</span>}
            </NavLink>
          ))}
        </nav>

        <div className="mobile-sheet-footer">
          {isAuthenticated ? (
            <div className="mobile-user-actions">
              <div className="mobile-user-info">
                <p className="mobile-name">{user?.name}</p>
                <p className="mobile-email">{user?.email}</p>
              </div>
              <div className="mobile-button-group">
                <Link
                  to="/profile"
                  className="glass-btn-secondary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User size={15} /> My Profile
                </Link>
                {(user?.role === "admin" || user?.role === "coordinator") && (
                  <Link
                    to="/admin"
                    className="glass-btn-secondary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ShieldCheck size={15} /> Admin
                  </Link>
                )}
                <button
                  type="button"
                  className="glass-btn-secondary mobile-logout-btn"
                  onClick={handleLogout}
                >
                  <LogOut size={15} /> Log Out
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="glass-btn-primary mobile-signin-btn"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In to ABES Autonomy
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
