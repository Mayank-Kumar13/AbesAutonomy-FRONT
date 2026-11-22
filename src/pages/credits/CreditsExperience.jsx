import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ArrowLeft, ArrowRight, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import ContributorCard3D from './ContributorCard3D';
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
  const members = React.useMemo(() => {
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
  const [isTransitioning, setIsTransitioning] = useState(false);

  const stageRef = useRef(null);
  const cardElementsRef = useRef([]);
  const lastScrollTime = useRef(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // Preload and decode all contributor portraits eagerly
  useEffect(() => {
    members.forEach((member) => {
      if (member.photoUrl) {
        const img = new Image();
        img.src = member.photoUrl;
      }
    });
  }, [members]);

  // Set initial 3D positions for all cards
  const setupCards = useCallback(() => {
    cardElementsRef.current.forEach((cardEl, idx) => {
      if (!cardEl) return;
      if (idx === currentIndex) {
        gsap.set(cardEl, {
          xPercent: 0,
          yPercent: 0,
          rotateY: 0,
          rotateX: 0,
          rotateZ: 0,
          scale: 1,
          opacity: 1,
          zIndex: 20,
          visibility: 'visible',
        });
      } else if (idx < currentIndex) {
        gsap.set(cardEl, {
          xPercent: -150,
          yPercent: 0,
          rotateY: -48,
          rotateX: 8,
          rotateZ: -4,
          scale: 0.75,
          opacity: 0,
          zIndex: 10,
          visibility: 'hidden',
        });
      } else {
        gsap.set(cardEl, {
          xPercent: 150,
          yPercent: 0,
          rotateY: 48,
          rotateX: 8,
          rotateZ: 4,
          scale: 0.75,
          opacity: 0,
          zIndex: 10,
          visibility: 'hidden',
        });
      }
    });
  }, [currentIndex]);

  useEffect(() => {
    setupCards();
  }, [setupCards, members]);

  // Master transition function between cards
  const goToCard = useCallback(
    (newIndex, direction = 'next') => {
      if (isTransitioning || newIndex === currentIndex) return;
      if (newIndex < 0 || newIndex >= members.length) return;

      setIsTransitioning(true);
      const currentCard = cardElementsRef.current[currentIndex];
      const nextCard = cardElementsRef.current[newIndex];

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onComplete: () => {
          setCurrentIndex(newIndex);
          setIsTransitioning(false);
        },
      });

      if (direction === 'next') {
        // Current Card EXITS towards the LEFT with natural 3D rotation
        if (currentCard) {
          tl.to(
            currentCard,
            {
              xPercent: -150,
              rotateY: -48,
              rotateX: 8,
              rotateZ: -4,
              scale: 0.74,
              opacity: 0,
              duration: 0.85,
            },
            0
          );
        }

        // Next Card ENTERS from the RIGHT with 3D rotation, settling into center
        if (nextCard) {
          gsap.set(nextCard, {
            visibility: 'visible',
            xPercent: 150,
            rotateY: 52,
            rotateX: 10,
            rotateZ: 4,
            scale: 0.75,
            opacity: 0,
            zIndex: 25,
          });

          tl.to(
            nextCard,
            {
              xPercent: 0,
              rotateY: 0,
              rotateX: 0,
              rotateZ: 0,
              scale: 1,
              opacity: 1,
              duration: 0.95,
              ease: 'power3.out',
            },
            0.12
          );
        }
      } else {
        // Going backward: Current Card EXITS towards the RIGHT
        if (currentCard) {
          tl.to(
            currentCard,
            {
              xPercent: 150,
              rotateY: 48,
              rotateX: 8,
              rotateZ: 4,
              scale: 0.74,
              opacity: 0,
              duration: 0.85,
            },
            0
          );
        }

        // Previous Card ENTERS from the LEFT
        if (nextCard) {
          gsap.set(nextCard, {
            visibility: 'visible',
            xPercent: -150,
            rotateY: -52,
            rotateX: 10,
            rotateZ: -4,
            scale: 0.75,
            opacity: 0,
            zIndex: 25,
          });

          tl.to(
            nextCard,
            {
              xPercent: 0,
              rotateY: 0,
              rotateX: 0,
              rotateZ: 0,
              scale: 1,
              opacity: 1,
              duration: 0.95,
              ease: 'power3.out',
            },
            0.12
          );
        }
      }
    },
    [currentIndex, isTransitioning, members.length]
  );

  const nextCard = useCallback(() => {
    if (currentIndex < members.length - 1) {
      goToCard(currentIndex + 1, 'next');
    }
  }, [currentIndex, goToCard, members.length]);

  const prevCard = useCallback(() => {
    if (currentIndex > 0) {
      goToCard(currentIndex - 1, 'prev');
    }
  }, [currentIndex, goToCard]);

  // Scroll wheel interaction with cooldown
  useEffect(() => {
    const handleWheel = (e) => {
      const now = Date.now();
      if (now - lastScrollTime.current < 850) return;

      if (e.deltaY > 28) {
        if (currentIndex < members.length - 1) {
          lastScrollTime.current = now;
          nextCard();
        }
      } else if (e.deltaY < -28) {
        if (currentIndex > 0) {
          lastScrollTime.current = now;
          prevCard();
        }
      }
    };

    const stage = stageRef.current;
    if (stage) {
      stage.addEventListener('wheel', handleWheel, { passive: true });
    }
    return () => {
      if (stage) stage.removeEventListener('wheel', handleWheel);
    };
  }, [currentIndex, members.length, nextCard, prevCard]);

  // Keyboard navigation (ArrowLeft & ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextCard();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        prevCard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextCard, prevCard]);

  // Touch swipe gesture handling
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Detect intentional horizontal swipe (more horizontal than vertical, > 35px)
    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        nextCard();
      } else {
        prevCard();
      }
    }
  };

  // Subtle interactive 3D tilt tracking for the centered active card
  const handlePointerMove = (e) => {
    const activeEl = cardElementsRef.current[currentIndex];
    if (!activeEl || isTransitioning) return;

    const rect = activeEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = -((y - centerY) / centerY) * 6; // Max 6 deg
    const tiltY = ((x - centerX) / centerX) * 8; // Max 8 deg

    gsap.to(activeEl, {
      rotateX: tiltX,
      rotateY: tiltY,
      duration: 0.35,
      ease: 'power2.out',
      transformPerspective: 1200,
    });
  };

  const handlePointerLeave = () => {
    const activeEl = cardElementsRef.current[currentIndex];
    if (!activeEl) return;
    gsap.to(activeEl, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.6,
      ease: 'power3.out',
    });
  };

  // Format index (e.g. 01 / 08)
  const currentFormatted = String(currentIndex + 1).padStart(2, '0');
  const totalFormatted = String(members.length).padStart(2, '0');

  return (
    <div
      ref={stageRef}
      className="credits-stage-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ─── 3D AMBIENT PARTICLE BACKGROUND ─── */}
      <CreditsParticleScene />

      {/* ─── RADIAL LIGHTING & DEPTH VIGNETTE ─── */}
      <div className="credits-depth-overlay" aria-hidden="true" />

      {/* ─── FLOATING TOP HEADER ─── */}
      <header className="credits-top-header">
        <div className="credits-badge-pill anim-fade-in">
          <Sparkles size={12} className="credits-gold-icon" />
          <span>THE CRAFTSMEN OF ABES AUTONOMY</span>
        </div>
        <h1 className="credits-headline">Architects & Contributors</h1>
        <p className="credits-subheadline">
          The engineering minds and academic achievers shaping the digital campus ecosystem.
        </p>
      </header>

      {/* ─── 3D PRESENTATION ARENA ─── */}
      <main className="credits-3d-arena" aria-live="polite">
        {members.map((member, idx) => (
          <ContributorCard3D
            key={member._id || idx}
            member={member}
            isActive={idx === currentIndex}
            cardRef={(el) => (cardElementsRef.current[idx] = el)}
            onPointerMove={idx === currentIndex ? handlePointerMove : undefined}
            onPointerLeave={idx === currentIndex ? handlePointerLeave : undefined}
          />
        ))}
      </main>

      {/* ─── CINEMATIC PROGRESS & CONTROLS FOOTER ─── */}
      <footer className="credits-bottom-bar">
        {/* Counter Display: 01 / 08 */}
        <div className="credits-counter-box">
          <span className="counter-current">{currentFormatted}</span>
          <span className="counter-divider">/</span>
          <span className="counter-total">{totalFormatted}</span>
        </div>

        {/* Multi-segment Progress Scrubber */}
        <div className="credits-scrubber" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemax={members.length}>
          {members.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`scrubber-segment ${idx === currentIndex ? 'is-active' : ''} ${idx < currentIndex ? 'is-passed' : ''}`}
              onClick={() => goToCard(idx, idx > currentIndex ? 'next' : 'prev')}
              aria-label={`Jump to contributor ${idx + 1}`}
            />
          ))}
        </div>

        {/* Previous & Next Floating Navigation Buttons */}
        <div className="credits-nav-buttons">
          <button
            type="button"
            className="credits-nav-btn glass-clear"
            onClick={prevCard}
            disabled={currentIndex === 0 || isTransitioning}
            aria-label="Previous Contributor"
            title="Previous (Left Arrow)"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="credits-nav-btn glass-clear"
            onClick={nextCard}
            disabled={currentIndex === members.length - 1 || isTransitioning}
            aria-label="Next Contributor"
            title="Next (Right Arrow)"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Interaction Hint */}
        <div className="credits-hint-pill" aria-hidden="true">
          <span>SCROLL OR SWIPE TO EXPLORE</span>
        </div>
      </footer>
    </div>
  );
}
