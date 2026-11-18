import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
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
    event.preventDefault();
    const notes = notesRef.current;
    // Native hash scrolling can stop short of an inert, overlapping section.
    // A deliberate skip is immediate and moves keyboard focus to the destination.
    notes.inert = false;
    notes.style.opacity = 1;
    window.scrollTo({ top: notes.getBoundingClientRect().top + window.scrollY, behavior: 'instant' });
    notes.querySelector('h2').focus({ preventScroll: true });
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
      stage.style.setProperty('--scene-opacity', 1 - state.fade);
      stage.style.setProperty('--scene-scale', 1 + state.zoom * 1.8);
      stage.style.setProperty('--cue-opacity', 1 - Math.min(progress * 7, 1));
      stage.style.setProperty('--journey-progress', progress);
      notes.style.opacity = motion.matches ? 1 : state.fade;
      notes.inert = !motion.matches && state.fade < 0.5;
      scene?.render(state, currentPointer, motion.matches);
      if (!motion.matches && state.fade < 1 &&
          (Math.abs(pointer.x - currentPointer.x) > 0.001 || Math.abs(pointer.y - currentPointer.y) > 0.001)) {
        frame = requestAnimationFrame(render);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };
    const measure = () => {
      start = journey.getBoundingClientRect().top + window.scrollY;
      distance = Math.max(1, journey.offsetHeight - stage.offsetHeight);
      scene?.resize(stage.clientWidth, stage.clientHeight);
      schedule();
    };
    const onPointer = (event) => {
      if (motion.matches || !finePointer.matches || progress > 0.8) return;
      pointer = { x: event.clientX / stage.clientWidth * 2 - 1, y: event.clientY / stage.clientHeight * 2 - 1 };
      schedule();
    };
    const resetPointer = () => { pointer = { x: 0, y: 0 }; schedule(); };
    const onMotionChange = () => { resetPointer(); measure(); };
    const onContextLost = (event) => {
      event.preventDefault();
      scene?.dispose();
      scene = undefined;
      setSceneReady(false);
      measure();
    };
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(journey);
    resizeObserver.observe(stage);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('pageshow', measure);
    document.addEventListener('visibilitychange', schedule);
    stage.addEventListener('pointermove', onPointer, { passive: true });
    stage.addEventListener('pointerleave', resetPointer);
    canvas.addEventListener('webglcontextlost', onContextLost);
    motion.addEventListener('change', onMotionChange);
    measure();

    // Keep the homepage usable while the optional, separately bundled 3D scene loads.
    import('./campusScene').then(({ createCampusScene }) => {
      if (disposed) return;
      scene = createCampusScene(canvas);
      measure();
      cancelAnimationFrame(frame);
      render();
      setSceneReady(true);
    }).catch(() => {
      if (!disposed) { scene?.dispose(); scene = undefined; setSceneReady(false); }
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
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
            <div className="campus-caption" aria-hidden="true"><span>ABES ENGINEERING COLLEGE</span><span>GHAZIABAD, INDIA</span></div>
            <a className="campus-scroll-cue" href="#all-notes" onClick={skipToNotes}><span>SCROLL TO EXPLORE</span><ArrowDown size={18} /></a>
            <div className="campus-progress" aria-hidden="true"><span /></div>
          </div>
        </section>
        <section className="home-notes" id="all-notes" ref={notesRef} aria-labelledby="notes-title">
          <div className="notes-atmosphere" aria-hidden="true" />
          <div className="notes-content">
            <span className="notes-eyebrow">ABES AUTONOMY</span>
            <h2 id="notes-title" tabIndex={-1}>Get your all<br /><em>notes here.</em></h2>
            <Link to="/resources" className="notes-link"><span>Explore notes</span><ArrowUpRight size={22} /></Link>
          </div>
          <div className="notes-bottom"><a href="#campus" aria-label="Back to the top">BACK TO TOP <ArrowUpRight size={14} /></a></div>
        </section>
      </main>
    </div>
  );
}
