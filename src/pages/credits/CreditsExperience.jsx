import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  ExternalLink,
  ShieldCheck,
  Award
} from 'lucide-react';
import { FaGithub, FaLinkedinIn, FaInstagram } from 'react-icons/fa';
import Lanyard from './Lanyard';
import { 
  createFrontBadgeCanvas, 
  createBackBadgeCanvas, 
  createStrapCanvas 
} from './badgeTextureGenerator';
import CreditsParticleScene from './CreditsParticleScene';
import './CreditsExperience.css';

// Verified default team members dataset from ABES Autonomy repository
const DEFAULT_MEMBERS = [
  {
    _id: "m-1",
    name: "Mayank Kumar",
    role: "Founder & Lead Architect",
    description: "Still figuring it out, but never settling for a version that isn’t mine.",
    photoUrl: "https://ik.imagekit.io/dfkux2rsp/credits/IMG20260925161102.jpg_cVTTyjULF.jpeg",
    year: "2nd",
    github: "https://github.com/Mayank-Kumar13",
    linkedin: "https://www.linkedin.com/in/mayank-kumar-206209377/",
    instagram: "https://www.instagram.com/tomar.13/",
  },
  {
    _id: "m-2",
    name: "Mayank Kotuli",
    role: "Co-Founder & Product Engineer",
    description: "Turning ideas into products, and problems into possibilities.",
    photoUrl: "https://ik.imagekit.io/dfkux2rsp/credits/mayankpfp_j-PzvfhM7.jpeg",
    year: "2nd",
    github: "https://github.com/mayankkotuli099",
    linkedin: "https://www.linkedin.com/in/mayank-kotuli-445891363/",
    instagram: "https://www.instagram.com/_mayank099_/",
  },
  {
    _id: "m-3",
    name: "Mukul Yadav",
    role: "Co-Founder & Core Developer",
    description: "Learning as I build, building as I learn.",
    photoUrl: "https://ik.imagekit.io/dfkux2rsp/credits/WhatsApp_Image_2026-09-26_at_14.14.13_WEZH6863R.jpeg",
    year: "2nd",
    github: "https://github.com/mukul2007yadav-lab",
    linkedin: "https://www.linkedin.com/in/mukul-yadav-19ab44377/",
    instagram: "https://www.instagram.com/mukul_yddv08/?hl=en",
  },
  {
    _id: "m-4",
    name: "Mayank Chaudhary",
    role: "Communications & PR Strategist",
    description: "Driving community outreach, strategic partnerships, and student engagement.",
    photoUrl: "https://ik.imagekit.io/dfkux2rsp/credits/Chaudhary_hNJuPzOXu.jpeg",
    year: "2nd",
    github: "https://github.com/MAYANKCHAUDHARY03",
    linkedin: "https://www.linkedin.com/in/mayank-chaudhary03/",
    instagram: "https://www.instagram.com/mayankchaudhary_03",
  },
  {
    _id: "m-5",
    name: "Mayank Sharma",
    role: "Motion & Media Producer",
    description: "Crafting digital stories, cinematic edits, and platform visual narratives.",
    photoUrl: "https://ik.imagekit.io/dfkux2rsp/credits/sharma_nbREYwqb0.png",
    year: "2nd",
    github: "https://github.com/mykcodes",
    linkedin: "https://www.linkedin.com/in/mynksharma/",
    instagram: "https://www.instagram.com/mynk_911?stkn=eHdienJ1Nm1kdjQ5",
  },
  {
    _id: "m-6",
    name: "Medhawin Tiwari",
    role: "Visual & Interface Designer",
    description: "Designing modern aesthetics, brand materials, and intuitive visual assets.",
    photoUrl: "https://ik.imagekit.io/dfkux2rsp/credits/portfolioimage_NnIsksNCA.png",
    year: "2nd",
    github: "https://github.com/medhawintiwari",
    linkedin: "https://www.linkedin.com/in/medhawin-tiwari-8a833038b/",
    instagram: "https://www.instagram.com/medhawintiwari?stkn=a215ZWYzNjB2OWh2",
  },
  {
    _id: "m-7",
    name: "Kanishq Atterya",
    role: "Academic Contributions Head",
    description: "Curating verified syllabus modules, lecture notes, and topper resources.",
    photoUrl: "https://ik.imagekit.io/dfkux2rsp/credits/kanishq_XuT23cowB.jpeg",
    year: "2nd",
    github: "https://github.com/Kanishqattreya19",
    linkedin: "https://www.linkedin.com/in/kanishq-attreya-b62109369",
    instagram: "https://www.instagram.com/kanishq_attreya?stkn=MTR6b2dkdG56MmJ5dQ==",
  },
  {
    _id: "m-8",
    name: "Nitin Bhardwaj",
    role: "10 SGPA Topper Contributor",
    description: "Authoring high-yield handwritten solutions for semester exam excellence.",
    photoUrl: "https://ik.imagekit.io/dfkux2rsp/credits/NITIN_qtQoWQAwx.jpeg",
    year: "2nd",
    github: "",
    linkedin: "",
    instagram: "",
  },
];

export default function CreditsExperience({ liveSections = [] }) {
  // Aggregate all members from live backend sections if provided, else use defaults
  const members = useMemo(() => {
    if (Array.isArray(liveSections) && liveSections.length > 0) {
      const flattened = [];
      liveSections.forEach((sec) => {
        if (Array.isArray(sec.members) && sec.members.length > 0) {
          sec.members.forEach((m) => {
            if (m.isVisible !== false) {
              flattened.push({
                ...m,
                sectionTitle: sec.title,
              });
            }
          });
        }
      });
      if (flattened.length > 0) return flattened;
    }
    return DEFAULT_MEMBERS;
  }, [liveSections]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loadedImages, setLoadedImages] = useState({});
  const [canvasTextures, setCanvasTextures] = useState({});

  const activeMember = members[currentIndex] || members[0];

  // Pre-generate procedural strap texture canvas
  const strapCanvas = useMemo(() => {
    return createStrapCanvas({ width: 1024, height: 128 });
  }, []);

  // Preload contributor photos into Image elements
  useEffect(() => {
    members.forEach((member) => {
      if (member.photoUrl && !loadedImages[member._id]) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          setLoadedImages((prev) => ({ ...prev, [member._id]: img }));
        };
        img.onerror = () => {
          console.warn(`Could not load portrait for ${member.name}, using fallback canvas`);
          // Set null image so generator renders monogram placeholder
          setLoadedImages((prev) => ({ ...prev, [member._id]: null }));
        };
        img.src = member.photoUrl;
      }
    });
  }, [members, loadedImages]);

  // Generate and cache front/back canvas textures for each member
  useEffect(() => {
    const member = activeMember;
    if (!member) return;

    const img = loadedImages[member._id];
    const front = createFrontBadgeCanvas(member, img);
    const back = createBackBadgeCanvas(member);

    setCanvasTextures((prev) => ({
      ...prev,
      [member._id]: { front, back },
    }));
  }, [activeMember, loadedImages]);

  // Navigation handlers
  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : members.length - 1));
  }, [members.length]);

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev < members.length - 1 ? prev + 1 : 0));
  }, [members.length]);

  const handleFlipToggle = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === ' ' || e.key === 'Enter') handleFlipToggle();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, handleFlipToggle]);

  // Active texture sources for Three.js Lanyard
  const activeFront = canvasTextures[activeMember?._id]?.front || null;
  const activeBack = canvasTextures[activeMember?._id]?.back || null;

  return (
    <div className="credits-root">
      {/* Dynamic 3D Celestial Background Particles */}
      <CreditsParticleScene />

      {/* Atmospheric Radial Gradients */}
      <div className="credits-ambient-mesh" aria-hidden="true">
        <div className="credits-orb credits-orb-gold" />
        <div className="credits-orb credits-orb-cyan" />
      </div>

      <main className="credits-layout-container">
        {/* Section Header */}
        <header className="credits-page-header">
          <div className="credits-badge-pill">
            <Sparkles size={12} className="credits-badge-sparkle" />
            <span>CORE CONTRIBUTORS &amp; ARCHITECTS</span>
          </div>
          <h1 className="credits-main-title">
            The Minds Behind <span className="gold-text-glow">ABES Autonomy</span>
          </h1>
          <p className="credits-main-subtitle">
            An engineering collective passionate about making academic preparation organized, accessible, and exceptional.
          </p>
        </header>

        {/* 3D Lanyard Identity Badge Stage & Companion Profile Showcase */}
        <div className="credits-showcase-wrapper">
          <div className="credits-stage-column">
            <div className="credits-lanyard-stage">
              <Lanyard
                key={activeMember?._id}
                frontImage={activeFront || activeMember?.photoUrl}
                backImage={activeBack}
                strapImage={strapCanvas}
                imageFit="cover"
                cardColor="#FFFFFF"
                orientation="portrait"
                finish="glossy"
                cornerRadius={0.3}
                size={0.75}
                anchor="center"
                strapLength={0.5}
                strapColor="#111111"
                strapWidth={0.65}
                metal="silver"
                gravity={1}
                damping={0.6}
                elasticity={0.55}
                breeze={0.35}
                interactive={true}
                intro={true}
                isFlipped={isFlipped}
                onFlip={(flipped) => setIsFlipped(flipped)}
              />
            </div>

            {/* Liquid Glass Navigation Bar & Flip Trigger */}
            <nav className="credits-nav-capsule" aria-label="Contributor Navigation">
              <button
                type="button"
                className="credits-nav-btn"
                onClick={handlePrev}
                aria-label="Previous Contributor"
                title="Previous (Left Arrow)"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="credits-nav-counter">
                <span className="counter-current">
                  {String(currentIndex + 1).padStart(2, '0')}
                </span>
                <span className="counter-divider">/</span>
                <span className="counter-total">
                  {String(members.length).padStart(2, '0')}
                </span>
              </div>

              <button
                type="button"
                className="credits-nav-btn"
                onClick={handleNext}
                aria-label="Next Contributor"
                title="Next (Right Arrow)"
              >
                <ChevronRight size={18} />
              </button>

              <div className="nav-capsule-divider" />

              <button
                type="button"
                className={`credits-flip-btn ${isFlipped ? 'is-active' : ''}`}
                onClick={handleFlipToggle}
                aria-label="Flip Badge to reverse side"
                title="Flip Badge (Spacebar)"
              >
                <RotateCw size={14} className={isFlipped ? 'icon-rotated' : ''} />
                <span>{isFlipped ? 'Show Front' : 'Flip Badge'}</span>
              </button>
            </nav>

            {/* Dots Scrubber Bar */}
            <div className="credits-dots-bar" role="tablist" aria-label="Choose Contributor">
              {members.map((m, idx) => (
                <button
                  key={m._id}
                  type="button"
                  role="tab"
                  aria-selected={idx === currentIndex}
                  aria-label={`Go to ${m.name}`}
                  className={`credits-dot ${idx === currentIndex ? 'active' : ''}`}
                  onClick={() => {
                    setIsFlipped(false);
                    setCurrentIndex(idx);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Frosted Liquid Glass Contributor Companion Info Panel */}
          <article className="credits-info-panel glass-frosted">
            <div className="info-panel-header">
              <div className="info-identity">
                <h2 className="info-name">{activeMember.name}</h2>
                <div className="info-role-badge">
                  <Award size={13} className="role-icon" />
                  <span>{activeMember.role}</span>
                </div>
              </div>

              {/* Social Link Action Buttons */}
              <div className="info-socials">
                {activeMember.github && (
                  <a
                    href={activeMember.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="info-social-pill"
                    aria-label={`${activeMember.name}'s GitHub Profile`}
                    title="GitHub"
                  >
                    <FaGithub size={15} />
                    <span>GitHub</span>
                  </a>
                )}
                {activeMember.linkedin && (
                  <a
                    href={activeMember.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="info-social-pill"
                    aria-label={`${activeMember.name}'s LinkedIn Profile`}
                    title="LinkedIn"
                  >
                    <FaLinkedinIn size={15} />
                    <span>LinkedIn</span>
                  </a>
                )}
                {activeMember.instagram && (
                  <a
                    href={activeMember.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="info-social-pill"
                    aria-label={`${activeMember.name}'s Instagram Profile`}
                    title="Instagram"
                  >
                    <FaInstagram size={15} />
                    <span>Instagram</span>
                  </a>
                )}
              </div>
            </div>

            <p className="info-quote">
              &ldquo;{activeMember.description}&rdquo;
            </p>

            <div className="info-meta-footer">
              <span className="info-meta-item">
                <ShieldCheck size={14} className="meta-icon" />
                Verified Student Developer • ABES Engineering College
              </span>
              <span className="info-meta-item meta-year">
                Batch 2024–2028
              </span>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
