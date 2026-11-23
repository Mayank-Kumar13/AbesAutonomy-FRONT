import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  RotateCw,
  Hand
} from 'lucide-react';
import Lanyard from './Lanyard';
import { 
  createPhotoBadgeCanvas, 
  createBackBadgeCanvas, 
  createStrapCanvas 
} from './badgeTextureGenerator';
import CreditsParticleScene from './CreditsParticleScene';
import './CreditsExperience.css';

// Verified team members dataset with remote + local fallback photo paths
const DEFAULT_MEMBERS = [
  {
    _id: "m-1",
    name: "Mayank Kumar",
    role: "Founder & Lead Architect",
    description: "Still figuring it out, but never settling for a version that isn’t mine.",
    photoUrl: "https://ik.imagekit.io/dfkux2rsp/credits/IMG20260925161102.jpg_cVTTyjULF.jpeg",
    localPhoto: "/images/contributors/mayank_kumar.jpg",
    year: "2nd",
    github: "https://github.com/Mayank-Kumar13",
    linkedin: "https://www.linkedin.com/in/mayank-kumar-206209377/",
    instagram: "https://www.instagram.com/tomar.13/",
    focal: { focalX: 0.50, focalY: 0.32 },
  },
  {
    _id: "m-2",
    name: "Mayank Kotuli",
    role: "Co-Founder & Product Engineer",
    description: "Turning ideas into products, and problems into possibilities.",
    photoUrl: "https://ik.imagekit.io/dfkux2rsp/credits/mayankpfp_j-PzvfhM7.jpeg",
    localPhoto: "/images/contributors/mayank_kotuli.jpg",
    year: "2nd",
    github: "https://github.com/mayankkotuli099",
    linkedin: "https://www.linkedin.com/in/mayank-kotuli-445891363/",
    instagram: "https://www.instagram.com/_mayank099_/",
    focal: { focalX: 0.50, focalY: 0.30 },
  },
  {
    _id: "m-3",
    name: "Mukul Yadav",
    role: "Co-Founder & Core Developer",
    description: "Learning as I build, building as I learn.",
    photoUrl: "https://ik.imagekit.io/dfkux2rsp/credits/WhatsApp_Image_2026-09-26_at_14.14.13_WEZH6863R.jpeg",
    localPhoto: "/images/contributors/mukul_yadav.jpg",
    year: "2nd",
    github: "https://github.com/mukul2007yadav-lab",
    linkedin: "https://www.linkedin.com/in/mukul-yadav-19ab44377/",
    instagram: "https://www.instagram.com/mukul_yddv08/?hl=en",
    focal: { focalX: 0.50, focalY: 0.32 },
  },
  {
    _id: "m-4",
    name: "Mayank Chaudhary",
    role: "Communications & PR Strategist",
    description: "Driving community outreach, strategic partnerships, and student engagement.",
    photoUrl: "https://ik.imagekit.io/dfkux2rsp/credits/Chaudhary_hNJuPzOXu.jpeg",
    localPhoto: "/images/contributors/mayank_chaudhary.jpg",
    year: "2nd",
    github: "https://github.com/MAYANKCHAUDHARY03",
    linkedin: "https://www.linkedin.com/in/mayank-chaudhary03/",
    instagram: "https://www.instagram.com/mayankchaudhary_03",
    focal: { focalX: 0.50, focalY: 0.28 },
  },
  {
    _id: "m-5",
    name: "Mayank Sharma",
    role: "Motion & Media Producer",
    description: "Crafting digital stories, cinematic edits, and platform visual narratives.",
    photoUrl: "https://ik.imagekit.io/dfkux2rsp/credits/sharma_nbREYwqb0.png",
    localPhoto: "/images/contributors/mayank_sharma.png",
    year: "2nd",
    github: "https://github.com/mykcodes",
    linkedin: "https://www.linkedin.com/in/mynksharma/",
    instagram: "https://www.instagram.com/mynk_911?stkn=eHdienJ1Nm1kdjQ5",
    focal: { focalX: 0.50, focalY: 0.35 },
  },
  {
    _id: "m-6",
    name: "Medhawin Tiwari",
    role: "Visual & Interface Designer",
    description: "Designing modern aesthetics, brand materials, and intuitive visual assets.",
    photoUrl: "https://ik.imagekit.io/dfkux2rsp/credits/portfolioimage_NnIsksNCA.png",
    localPhoto: "/images/contributors/medhawin_tiwari.png",
    year: "2nd",
    github: "https://github.com/medhawintiwari",
    linkedin: "https://www.linkedin.com/in/medhawin-tiwari-8a833038b/",
    instagram: "https://www.instagram.com/medhawintiwari?stkn=a215ZWYzNjB2OWh2",
    focal: { focalX: 0.50, focalY: 0.35 },
  },
  {
    _id: "m-7",
    name: "Kanishq Atterya",
    role: "Academic Contributions Head",
    description: "Curating verified syllabus modules, lecture notes, and topper resources.",
    photoUrl: "https://ik.imagekit.io/dfkux2rsp/credits/kanishq_XuT23cowB.jpeg",
    localPhoto: "/images/contributors/kanishq_atterya.jpg",
    year: "2nd",
    github: "https://github.com/Kanishqattreya19",
    linkedin: "https://www.linkedin.com/in/kanishq-attreya-b62109369",
    instagram: "https://www.instagram.com/kanishq_attreya?stkn=MTR6b2dkdG56MmJ5dQ==",
    focal: { focalX: 0.50, focalY: 0.30 },
  },
  {
    _id: "m-8",
    name: "Nitin Bhardwaj",
    role: "10 SGPA Topper Contributor",
    description: "Authoring high-yield handwritten solutions for semester exam excellence.",
    photoUrl: "https://ik.imagekit.io/dfkux2rsp/credits/NITIN_qtQoWQAwx.jpeg",
    localPhoto: "/images/contributors/nitin_bhardwaj.jpg",
    year: "2nd",
    github: "",
    linkedin: "",
    instagram: "",
    focal: { focalX: 0.50, focalY: 0.26 },
  },
];

export default function CreditsExperience({ liveSections = [] }) {
  // Aggregate members from live backend sections if provided, else use defaults
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
                focal: { focalX: 0.50, focalY: 0.32 },
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
  const [hasInteracted, setHasInteracted] = useState(false);
  const [loadedImages, setLoadedImages] = useState({});
  const [canvasTextures, setCanvasTextures] = useState({});

  const activeMember = members[currentIndex] || members[0];

  // Procedural strap texture canvas
  const strapCanvas = useMemo(() => {
    return createStrapCanvas({ width: 1024, height: 128 });
  }, []);

  // Preload all contributor photos with local fallback safety
  useEffect(() => {
    members.forEach((member) => {
      if (!loadedImages[member._id]) {
        const primarySrc = member.photoUrl || member.localPhoto;
        const fallbackSrc = member.localPhoto || member.photoUrl;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          setLoadedImages((prev) => ({ ...prev, [member._id]: img }));
        };
        img.onerror = () => {
          if (fallbackSrc && fallbackSrc !== primarySrc) {
            const fallbackImg = new Image();
            fallbackImg.onload = () => {
              setLoadedImages((prev) => ({ ...prev, [member._id]: fallbackImg }));
            };
            fallbackImg.onerror = () => {
              setLoadedImages((prev) => ({ ...prev, [member._id]: null }));
            };
            fallbackImg.src = fallbackSrc;
          } else {
            setLoadedImages((prev) => ({ ...prev, [member._id]: null }));
          }
        };
        img.src = primarySrc;
      }
    });
  }, [members, loadedImages]);

  // Generate front (photograph-only) and back (complete profile) textures for active member
  useEffect(() => {
    const member = activeMember;
    if (!member) return;

    const img = loadedImages[member._id];
    const focal = member.focal || { focalX: 0.50, focalY: 0.35 };

    // Front Face: 100% Photograph Only (No labels, no names, no barcodes)
    const front = createPhotoBadgeCanvas(img, {
      focalX: focal.focalX,
      focalY: focal.focalY,
      fallbackName: member.name,
    });

    // Back Face: Complete Contributor Profile with Interactive Social Link Hitboxes
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
    setHasInteracted(true);
    setIsFlipped((prev) => !prev);
  }, []);

  // Keyboard controls: Arrow Left/Right to change contributor, Space/Enter to flip
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFlipToggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, handleFlipToggle]);

  const activeFront = canvasTextures[activeMember?._id]?.front || null;
  const activeBack = canvasTextures[activeMember?._id]?.back || null;

  return (
    <div className="credits-root">
      {/* 3D Celestial Background Particles */}
      <CreditsParticleScene />

      {/* Atmospheric Ambient Lighting Gradients */}
      <div className="credits-ambient-mesh" aria-hidden="true">
        <div className="credits-orb credits-orb-gold" />
        <div className="credits-orb credits-orb-cyan" />
      </div>

      <main className="credits-layout-container">
        {/* Minimal Restrained Header */}
        <header className="credits-page-header">
          <div className="credits-badge-pill">
            <Sparkles size={11} className="credits-badge-sparkle" />
            <span>ARCHITECTURAL COLLECTIVE</span>
          </div>
          <h1 className="credits-main-title">
            The Minds Behind <span className="gold-text-glow">ABES Autonomy</span>
          </h1>
          <p className="credits-main-subtitle">
            Hover or drag the identity badge to swing • Click to flip between portrait and full profile
          </p>
        </header>

        {/* ONE LARGE CENTERED 3D IDENTITY BADGE STAGE */}
        <section className="credits-stage-section" aria-label="3D Contributor Identity Showcase">
          <div className="credits-lanyard-stage">
            <Lanyard
              frontImage={activeFront}
              backImage={activeBack}
              contributor={activeMember}
              strapImage={strapCanvas}
              imageFit="cover"
              cardColor="#FFFFFF"
              orientation="portrait"
              finish="glossy"
              cornerRadius={0.3}
              size={0.88}
              anchor="center"
              strapLength={0.44}
              strapColor="#111111"
              strapWidth={0.65}
              metal="silver"
              gravity={1}
              damping={0.62}
              elasticity={0.55}
              breeze={0.35}
              interactive={true}
              intro={true}
              isFlipped={isFlipped}
              onFlip={(flipped) => {
                setHasInteracted(true);
                setIsFlipped(flipped);
              }}
            />

            {/* Subtle Floating Interaction Hint (Auto-fades on user interaction) */}
            <div 
              className={`credits-interaction-hint ${hasInteracted ? 'is-faded' : ''}`}
              aria-hidden="true"
            >
              <div className="hint-pulsing-dot" />
              <span>{isFlipped ? 'CLICK CARD TO SHOW PORTRAIT' : 'CLICK CARD TO REVEAL PROFILE'}</span>
            </div>
          </div>

          {/* Minimal Frosted Glass Navigation Pill */}
          <nav className="credits-nav-capsule" aria-label="Contributor Navigation">
            <button
              type="button"
              className="credits-nav-btn"
              onClick={handlePrev}
              aria-label="Previous Contributor"
              title="Previous Contributor (← Arrow)"
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
              title="Next Contributor (→ Arrow)"
            >
              <ChevronRight size={18} />
            </button>

            <div className="nav-capsule-divider" />

            <button
              type="button"
              className={`credits-flip-btn ${isFlipped ? 'is-active' : ''}`}
              onClick={handleFlipToggle}
              aria-label={isFlipped ? "Flip to Portrait Photo" : "Flip to Profile Details"}
              title="Flip Card (Spacebar)"
            >
              <RotateCw size={14} className={isFlipped ? 'icon-rotated' : ''} />
              <span>{isFlipped ? 'View Photo' : 'View Profile'}</span>
            </button>
          </nav>

          {/* Minimal Dot Scrubber */}
          <div className="credits-dots-bar" role="tablist" aria-label="Select Contributor">
            {members.map((m, idx) => (
              <button
                key={m._id}
                type="button"
                role="tab"
                aria-selected={idx === currentIndex}
                aria-label={`Select ${m.name}`}
                title={m.name}
                className={`credits-dot ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => {
                  setHasInteracted(true);
                  setIsFlipped(false);
                  setCurrentIndex(idx);
                }}
              />
            ))}
          </div>

          {/* Accessible Screen-Reader Summary */}
          <div className="home-sr-only" aria-live="polite">
            Current Contributor: {activeMember.name}, {activeMember.role}. 
            {activeMember.description}. 
            {activeMember.github && `GitHub: ${activeMember.github}`}
            {activeMember.linkedin && `LinkedIn: ${activeMember.linkedin}`}
            {activeMember.instagram && `Instagram: ${activeMember.instagram}`}
          </div>
        </section>
      </main>
    </div>
  );
}
