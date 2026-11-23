import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Users
} from 'lucide-react';
import ProfileCard from '../../component/credits/ProfileCard';
import CreditsParticleScene from './CreditsParticleScene';
import './CreditsExperience.css';

// Local verified metadata (cutouts & handles) matching contributors
const MEMBER_META = {
  'mayank kumar': {
    cardPhoto: '/images/contributors/mayank_kumar_card.png',
    handle: 'tomar.13',
    roleFallback: 'Founder & Lead Architect'
  },
  'mayank kotuli': {
    cardPhoto: '/images/contributors/mayank_kotuli_card.png',
    handle: '_mayank099_',
    roleFallback: 'Founder & Product Engineer'
  },
  'mukul yadav': {
    cardPhoto: '/images/contributors/mukul_yadav_card.png',
    handle: 'mukul_yddv08',
    roleFallback: 'Co-Founder & Core Developer'
  },
  'mayank chaudhary': {
    cardPhoto: '/images/contributors/mayank_chaudhary_card.png',
    handle: 'mayankchaudhary_03',
    roleFallback: 'Communications & PR Strategist'
  },
  'mayank sharma': {
    cardPhoto: '/images/contributors/mayank_sharma_card.png',
    handle: 'mynk_911',
    roleFallback: 'Motion & Media Producer'
  },
  'medhawin tiwari': {
    cardPhoto: '/images/contributors/medhawin_tiwari_card.png',
    handle: 'medhawintiwari',
    roleFallback: 'Visual & Interface Designer'
  },
  'kanishq atterya': {
    cardPhoto: '/images/contributors/kanishq_atterya_card.png',
    handle: 'kanishq_attreya',
    roleFallback: 'Academic Contributions Head'
  },
  'nitin bhardwaj': {
    cardPhoto: '/images/contributors/nitin_bhardwaj_card.png',
    handle: 'nitin_bhardwaj',
    roleFallback: '10 SGPA Topper Contributor'
  }
};

// Default fallback role sections (identical to public API schema)
const DEFAULT_ROLE_SECTIONS = [
  {
    _id: "sec-founders",
    title: "Founders",
    members: [
      {
        _id: "m-1",
        name: "Mayank Kumar",
        role: "Founder & Lead Architect",
        description: "Still figuring it out, but never settling for a version that isn’t mine.",
        cardPhoto: "/images/contributors/mayank_kumar_card.png",
        handle: "tomar.13",
        status: "Online",
        statusColor: "#22c55e",
        github: "https://github.com/Mayank-Kumar13",
        linkedin: "https://www.linkedin.com/in/mayank-kumar-206209377/",
        instagram: "https://www.instagram.com/tomar.13/"
      },
      {
        _id: "m-2",
        name: "Mayank Kotuli",
        role: "Founder & Product Engineer",
        description: "Turning ideas into products, and problems into possibilities.",
        cardPhoto: "/images/contributors/mayank_kotuli_card.png",
        handle: "_mayank099_",
        status: "Online",
        statusColor: "#22c55e",
        github: "https://github.com/mayankkotuli099",
        linkedin: "https://www.linkedin.com/in/mayank-kotuli-445891363/",
        instagram: "https://www.instagram.com/_mayank099_/"
      }
    ]
  },
  {
    _id: "sec-cofounder",
    title: "Co-Founder",
    members: [
      {
        _id: "m-3",
        name: "Mukul Yadav",
        role: "Co-Founder & Core Developer",
        description: "Learning as I build, building as I learn.",
        cardPhoto: "/images/contributors/mukul_yadav_card.png",
        handle: "mukul_yddv08",
        status: "Online",
        statusColor: "#22c55e",
        github: "https://github.com/mukul2007yadav-lab",
        linkedin: "https://www.linkedin.com/in/mukul-yadav-19ab44377/",
        instagram: "https://www.instagram.com/mukul_yddv08/?hl=en"
      }
    ]
  },
  {
    _id: "sec-social",
    title: "Social Media & Production",
    members: [
      {
        _id: "m-4",
        name: "Mayank Chaudhary",
        role: "Communications & PR Strategist",
        description: "Driving community outreach, strategic partnerships, and student engagement.",
        cardPhoto: "/images/contributors/mayank_chaudhary_card.png",
        handle: "mayankchaudhary_03",
        status: "Online",
        statusColor: "#22c55e",
        github: "https://github.com/MAYANKCHAUDHARY03",
        linkedin: "https://www.linkedin.com/in/mayank-chaudhary03/",
        instagram: "https://www.instagram.com/mayankchaudhary_03"
      },
      {
        _id: "m-5",
        name: "Mayank Sharma",
        role: "Motion & Media Producer",
        description: "Crafting digital stories, cinematic edits, and platform visual narratives.",
        cardPhoto: "/images/contributors/mayank_sharma_card.png",
        handle: "mynk_911",
        status: "Online",
        statusColor: "#22c55e",
        github: "https://github.com/mykcodes",
        linkedin: "https://www.linkedin.com/in/mynksharma/",
        instagram: "https://www.instagram.com/mynk_911?stkn=eHdienJ1Nm1kdjQ5"
      },
      {
        _id: "m-6",
        name: "Medhawin Tiwari",
        role: "Visual & Interface Designer",
        description: "Designing modern aesthetics, brand materials, and intuitive visual assets.",
        cardPhoto: "/images/contributors/medhawin_tiwari_card.png",
        handle: "medhawintiwari",
        status: "Online",
        statusColor: "#22c55e",
        github: "https://github.com/medhawintiwari",
        linkedin: "https://www.linkedin.com/in/medhawin-tiwari-8a833038b/",
        instagram: "https://www.instagram.com/medhawintiwari?stkn=a215ZWYzNjB2OWh2"
      }
    ]
  },
  {
    _id: "sec-academics",
    title: "Contributors Head",
    members: [
      {
        _id: "m-7",
        name: "Kanishq Atterya",
        role: "Academic Contributions Head",
        description: "Curating verified syllabus modules, lecture notes, and topper resources.",
        cardPhoto: "/images/contributors/kanishq_atterya_card.png",
        handle: "kanishq_attreya",
        status: "Online",
        statusColor: "#22c55e",
        github: "https://github.com/Kanishqattreya19",
        linkedin: "https://www.linkedin.com/in/kanishq-attreya-b62109369",
        instagram: "https://www.instagram.com/kanishq_attreya?stkn=MTR6b2dkdG56MmJ5dQ=="
      }
    ]
  },
  {
    _id: "sec-contributors",
    title: "Contributors",
    members: [
      {
        _id: "m-8",
        name: "Nitin Bhardwaj",
        role: "10 SGPA Topper Contributor",
        description: "Authoring high-yield handwritten solutions for semester exam excellence.",
        cardPhoto: "/images/contributors/nitin_bhardwaj_card.png",
        handle: "nitin_bhardwaj",
        status: "Online",
        statusColor: "#22c55e",
        github: "",
        linkedin: "",
        instagram: ""
      }
    ]
  }
];

export default function CreditsExperience({ liveSections = [] }) {
  // Process live backend sections or fallback to default
  const sections = useMemo(() => {
    if (Array.isArray(liveSections) && liveSections.length > 0) {
      const valid = liveSections
        .filter((sec) => sec.isPublished !== false && Array.isArray(sec.members) && sec.members.length > 0)
        .map((sec) => {
          const processedMembers = sec.members
            .filter((m) => m.isVisible !== false)
            .map((m) => {
              const nameKey = (m.name || '').toLowerCase().trim();
              const meta = MEMBER_META[nameKey] || {};
              const defaultHandle = nameKey ? nameKey.replace(/\s+/g, '_') : 'contributor';
              return {
                ...m,
                role: m.role || meta.roleFallback || 'Contributor',
                cardPhoto: meta.cardPhoto || m.photoUrl || '/images/contributors/mayank_kumar_card.png',
                handle: meta.handle || defaultHandle,
                status: 'Online',
                statusColor: '#22c55e',
                github: m.github || '',
                linkedin: m.linkedin || '',
                instagram: m.instagram || '',
              };
            });
          return {
            ...sec,
            members: processedMembers,
          };
        })
        .filter((sec) => sec.members.length > 0);

      if (valid.length > 0) return valid;
    }
    return DEFAULT_ROLE_SECTIONS;
  }, [liveSections]);

  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState('next'); // 'next' | 'prev'
  const [isTransitioning, setIsTransitioning] = useState(false);
  const touchStartRef = useRef({ x: 0, y: 0 });

  const activeSection = sections[activeSectionIndex] || sections[0];

  const goToSection = useCallback((targetIndex, direction) => {
    if (targetIndex === activeSectionIndex || isTransitioning) return;
    setSlideDirection(direction || (targetIndex > activeSectionIndex ? 'next' : 'prev'));
    setIsTransitioning(true);
    setActiveSectionIndex(targetIndex);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 450);
  }, [activeSectionIndex, isTransitioning]);

  const handlePrev = useCallback(() => {
    const nextIdx = activeSectionIndex > 0 ? activeSectionIndex - 1 : sections.length - 1;
    goToSection(nextIdx, 'prev');
  }, [activeSectionIndex, sections.length, goToSection]);

  const handleNext = useCallback(() => {
    const nextIdx = activeSectionIndex < sections.length - 1 ? activeSectionIndex + 1 : 0;
    goToSection(nextIdx, 'next');
  }, [activeSectionIndex, sections.length, goToSection]);

  // Keyboard navigation: Left / Right arrows
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  // Touch Swipe Gestures
  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
  };

  const handleTouchEnd = (e) => {
    if (e.changedTouches && e.changedTouches[0]) {
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      // Horizontal swipe must dominate vertical scroll
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }
  };

  return (
    <div 
      className="credits-root"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D Celestial Background Particles */}
      <CreditsParticleScene />

      {/* Atmospheric Ambient Lighting Gradients */}
      <div className="credits-ambient-mesh" aria-hidden="true">
        <div className="credits-orb credits-orb-gold" />
        <div className="credits-orb credits-orb-cyan" />
      </div>

      <main className="credits-layout-container">
        {/* Subtle, Refined Apple iOS 27 Heading */}
        <header className="credits-page-header">
          <div className="credits-badge-pill">
            <Sparkles size={11} className="credits-badge-sparkle" />
            <span>ARCHITECTURAL COLLECTIVE</span>
          </div>

          <div className="credits-heading-slider" key={activeSection.title}>
            <h1 className={`credits-role-heading anim-slide-${slideDirection}`}>
              {activeSection.title}
            </h1>
            <p className={`credits-role-meta anim-fade-${slideDirection}`}>
              <Users size={12} className="inline mr-1 opacity-70" />
              <span>
                {activeSection.members.length === 1 
                  ? '1 Contributor' 
                  : `${activeSection.members.length} Contributors`}
              </span>
              <span className="credits-meta-sep">•</span>
              <span>Section {String(activeSectionIndex + 1).padStart(2, '0')} of {String(sections.length).padStart(2, '0')}</span>
            </p>
          </div>
        </header>

        {/* Grouped Cards Stage with Swipe/Slide Animation */}
        <section 
          className="credits-stage-section" 
          aria-label={`${activeSection.title} Contributor Showcase`}
        >
          <div 
            key={`section-cards-${activeSectionIndex}`} 
            className={`credits-cards-row anim-stage-${slideDirection} cards-count-${activeSection.members.length}`}
          >
            {activeSection.members.map((member) => (
              <div key={member._id || member.name} className="credits-card-wrapper">
                <ProfileCard
                  avatarUrl={member.cardPhoto}
                  name={member.name}
                  title={member.role}
                  handle={member.handle}
                  status={member.status || 'Online'}
                  statusColor={member.statusColor || '#22c55e'}
                  socials={{
                    github: member.github,
                    linkedin: member.linkedin,
                    instagram: member.instagram
                  }}
                  theme="dark"
                  radius={18}
                  holo={0.82}
                  glare={0.52}
                  enableTilt={true}
                  tiltStrength={12}
                  parallax={8}
                  intro={true}
                />
              </div>
            ))}
          </div>

          {/* Minimal Apple Liquid Glass Navigation Capsule */}
          <nav className="credits-nav-capsule" aria-label="Section Navigation">
            <button
              type="button"
              className="credits-nav-btn"
              onClick={handlePrev}
              aria-label="Previous Section"
              title="Previous Role (← Arrow)"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Interactive Section Indicator Tabs */}
            <div className="credits-section-pills" role="tablist" aria-label="Select Role Section">
              {sections.map((sec, idx) => {
                const isActive = idx === activeSectionIndex;
                return (
                  <button
                    key={sec._id || sec.title}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`View ${sec.title}`}
                    className={`credits-section-pill-tab ${isActive ? 'is-active' : ''}`}
                    onClick={() => goToSection(idx)}
                  >
                    <span className="tab-dot" />
                    <span className="tab-title">{sec.title}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="credits-nav-btn"
              onClick={handleNext}
              aria-label="Next Section"
              title="Next Role (→ Arrow)"
            >
              <ChevronRight size={18} />
            </button>
          </nav>

          {/* Accessible Screen-Reader Summary */}
          <div className="home-sr-only" aria-live="polite">
            Current Section: {activeSection.title} with {activeSection.members.length} members:
            {activeSection.members.map((m) => `${m.name} (${m.role})`).join(', ')}
          </div>
        </section>
      </main>
    </div>
  );
}
