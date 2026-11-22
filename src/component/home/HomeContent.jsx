import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, BookOpen, Notebook, Sparkles, ShieldCheck } from 'lucide-react';
import HomeNavigation from './HomeNavigation';
import CampusFallback from './CampusFallback';
import { getJourneyState } from './journey';
import './HomeContent.css';

export default function HomeContent() {
  const journeyRef = useRef(null);
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const notesRef = useRef(null);
  const [sceneReady, setSceneReady] = useState(false);

  const skipToNotes = (event) => {
    if (event) event.preventDefault();
    const notes = notesRef.current;
    if (!notes) return;
    notes.inert = false;
    notes.style.opacity = 1;
    window.scrollTo({ top: notes.getBoundingClientRect().top + window.scrollY, behavior: 'smooth' });
    const titleEl = notes.querySelector('h2');
    if (titleEl) titleEl.focus({ preventScroll: true });
  };

  useEffect(() => {
    const journey = journeyRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const notes = notesRef.current;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(pointer: fine)');
    let disposed = false;
    let scene;
    let frame = 0;
    let progress = 0;
    let pointer = { x: 0, y: 0 };
    let currentPointer = { x: 0, y: 0 };
    let start = 0;
    let distance = 1;

    const render = () => {
      frame = 0;
      if (disposed || document.hidden) return;
      progress = Math.max(0, Math.min(1, (window.scrollY - start) / distance));
      const state = getJourneyState(progress, motion.matches);
      currentPointer.x += (pointer.x - currentPointer.x) * 0.09;
      currentPointer.y += (pointer.y - currentPointer.y) * 0.09;
      stage.style.setProperty('--title-rise', `${(1 - state.rise) * 110}%`);
      stage.style.setProperty('--scene-opacity', `${state.opacity}`);
      stage.style.setProperty('--scene-scale', `${state.scale}`);
      stage.style.setProperty('--cue-opacity', `${Math.max(0, 1 - progress * 4.2)}`);
      stage.style.setProperty('--journey-progress', `${progress}`);

      if (notes) {
        notes.style.opacity = `${Math.max(0, (progress - 0.72) / 0.28)}`;
        notes.inert = progress < 0.94;
      }

      scene?.update({
        progress,
        pointer: currentPointer,
        state,
      });
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(render);
    };

    const measure = () => {
      const journeyRect = journey.getBoundingClientRect();
      start = journeyRect.top + window.scrollY;
      distance = Math.max(1, journey.offsetHeight - stage.offsetHeight);
      schedule();
    };

    const onPointer = (event) => {
      if (!finePointer.matches) return;
      const rect = stage.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      schedule();
    };

    const resetPointer = () => {
      pointer.x = 0;
      pointer.y = 0;
      schedule();
    };

    const onContextLost = (event) => {
      event.preventDefault();
      setSceneReady(false);
    };

    const onMotionChange = () => {
      measure();
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('pageshow', measure, { passive: true });
    document.addEventListener('visibilitychange', schedule, { passive: true });
    stage.addEventListener('pointermove', onPointer, { passive: true });
    stage.addEventListener('pointerleave', resetPointer, { passive: true });
    canvas.addEventListener('webglcontextlost', onContextLost, false);
    motion.addEventListener('change', onMotionChange);

    import('./campusScene')
      .then(({ createCampusScene }) => {
        if (disposed) return;
        scene = createCampusScene(canvas);
        setSceneReady(true);
        measure();
      })
      .catch((error) => {
        console.warn('3D campus scene skipped, using fallback stage.', error);
        setSceneReady(false);
      });

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
      window.removeEventListener('pageshow', measure);
      document.removeEventListener('visibilitychange', schedule);
      stage.removeEventListener('pointermove', onPointer);
      stage.removeEventListener('pointerleave', resetPointer);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      motion.removeEventListener('change', onMotionChange);
      scene?.dispose();
    };
  }, []);

  return (
    <div className="autonomy-home">
      <HomeNavigation onSkipNotes={skipToNotes} />
      <main>
        {/* 3D Campus Experience Stage */}
        <section className="campus-journey" id="campus" ref={journeyRef} aria-labelledby="campus-title">
          <div className={`campus-stage${sceneReady ? ' is-3d-ready' : ''}`} ref={stageRef}>
            <h1 className="home-sr-only" id="campus-title">ABES Autonomy</h1>
            <div className="campus-sky" aria-hidden="true" />
            <div className="campus-fallback" aria-hidden="true">
              <div className="campus-fallback-title"><span>ABES</span><span>AUTONOMY</span></div>
              <CampusFallback />
            </div>
            <canvas className="campus-canvas" ref={canvasRef} aria-hidden="true" />
            <div className="campus-vignette" aria-hidden="true" />
            <div className="campus-caption" aria-hidden="true">
              <span>ABES ENGINEERING COLLEGE</span>
              <span>ACADEMIC RESOURCE ECOSYSTEM</span>
            </div>
            <a className="campus-scroll-cue" href="#all-notes" onClick={skipToNotes}>
              <span>SCROLL TO EXPLORE</span>
              <ArrowDown size={18} />
            </a>
            <div className="campus-progress" aria-hidden="true"><span /></div>
          </div>
        </section>

        {/* Liquid Glass Showcase Section */}
        <section className="home-notes" id="all-notes" ref={notesRef} aria-labelledby="notes-title">
          <div className="notes-atmosphere" aria-hidden="true" />
          
          <div className="notes-content">
            <div className="notes-badge-pill anim-fade-in">
              <Sparkles size={13} className="notes-badge-icon" />
              <span>ACADEMIC PREPARATION SIMPLIFIED</span>
            </div>

            <h2 id="notes-title" tabIndex={-1}>
              All Your Academic Notes.<br />
              <em>Organized in One Sanctuary.</em>
            </h2>

            <p className="notes-description">
              Engineered exclusively for ABES Engineering College students. Access verified theory notes,
              handwritten topper solutions, syllabus guides, and previous year examination papers without the chaos.
            </p>

            {/* Feature Cards Grid (Apple Clear Glass style) */}
            <div className="home-features-grid">
              <div className="home-glass-card glass-clear">
                <div className="card-icon-bubble">
                  <BookOpen size={22} />
                </div>
                <h3>Structured Theory</h3>
                <p>Curated notes, unit-wise syllabus breakdowns, and lecture slide decks indexed by semester and branch.</p>
              </div>

              <div className="home-glass-card glass-clear">
                <div className="card-icon-bubble">
                  <Notebook size={22} />
                </div>
                <h3>Handwritten Notes</h3>
                <p>Authentic, high-resolution notes penned by academic achievers for intuitive end-semester revision.</p>
              </div>

              <div className="home-glass-card glass-clear">
                <div className="card-icon-bubble">
                  <ShieldCheck size={22} />
                </div>
                <h3>Integrated Reader</h3>
                <p>Comfortable in-browser PDF study suite with dark mode, reading-time counter, and direct downloads.</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="notes-action-row">
              <Link to="/resources" className="glass-btn-primary home-cta-btn">
                <span>Explore Academic Resources</span>
                <ArrowUpRight size={17} />
              </Link>
              <Link to="/mvp-projects" className="glass-btn-secondary home-sec-btn">
                <span>View MVP Projects</span>
              </Link>
            </div>
          </div>

          <div className="notes-bottom">
            <span>ABES AUTONOMY &copy; 2025&ndash;2026</span>
            <a href="#campus" aria-label="Back to the top">
              BACK TO TOP <ArrowUpRight size={13} />
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
