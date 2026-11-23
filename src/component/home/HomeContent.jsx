import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import HomeNavigation from './HomeNavigation';
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
    // An accessibility skip must move focus immediately, without the scroll
    // timeline making its destination inert again halfway through an animation.
    window.scrollTo({ top: notes.getBoundingClientRect().top + window.scrollY, behavior: 'instant' });
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
    let hasRenderedScene = false;
    let frame = 0;
    let progress = 0;
    let pointer = { x: 0, y: 0 };
    let currentPointer = { x: 0, y: 0 };
    let start = 0;
    let distance = 1;

    let previousTime = 0;
    const render = (time = performance.now()) => {
      frame = 0;
      if (disposed || document.hidden) return;
      progress = Math.max(0, Math.min(1, (window.scrollY - start) / distance));
      const state = getJourneyState(progress, motion.matches);
      const delta = previousTime ? Math.min(time - previousTime, 64) : 16;
      previousTime = time;
      const damping = motion.matches ? 1 : 1 - Math.exp(-delta / 110);
      currentPointer.x += (pointer.x - currentPointer.x) * damping;
      currentPointer.y += (pointer.y - currentPointer.y) * damping;
      stage.style.setProperty('--scene-opacity', `${1 - state.fade}`);
      stage.style.setProperty('--cue-opacity', `${Math.max(0, 1 - progress * 4.2)}`);
      stage.style.setProperty('--journey-progress', `${progress}`);
      stage.inert = !motion.matches && state.fade >= 1;

      if (notes) {
        notes.style.opacity = motion.matches ? '1' : `${state.fade}`;
        notes.inert = !motion.matches && state.fade < 0.5;
      }

      if (scene) {
        scene.render(state, currentPointer, motion.matches);
        if (!hasRenderedScene) {
          hasRenderedScene = true;
          setSceneReady(true);
        }
      }
      // Finish easing after the last pointer event; stop once settled.
      if (!motion.matches && state.fade < 1 &&
          (Math.abs(pointer.x - currentPointer.x) > 0.001 || Math.abs(pointer.y - currentPointer.y) > 0.001)) {
        frame = window.requestAnimationFrame(render);
      } else {
        previousTime = 0;
      }
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(render);
    };

    const measure = () => {
      const journeyRect = journey.getBoundingClientRect();
      start = journeyRect.top + window.scrollY;
      distance = Math.max(1, journey.offsetHeight - stage.offsetHeight);
      scene?.resize(stage.clientWidth, stage.clientHeight);
      schedule();
    };

    const onPointer = (event) => {
      if (motion.matches || !finePointer.matches || progress > 0.8) return;
      const rect = stage.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      schedule();
    };

    const resetPointer = () => {
      pointer.x = 0;
      pointer.y = 0;
      schedule();
    };

    const onContextLost = (event) => {
      event.preventDefault();
      scene?.dispose();
      scene = undefined;
      setSceneReady(false);
      measure();
    };

    const onMotionChange = () => {
      resetPointer();
      measure();
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(journey);
    resizeObserver.observe(stage);
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
        measure();
        window.cancelAnimationFrame(frame);
        render();
      })
      .catch((error) => {
        console.warn('3D campus scene skipped, using fallback stage.', error);
        if (!disposed) {
          scene?.dispose();
          scene = undefined;
          setSceneReady(false);
        }
      });

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
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
      <a className="home-explore-link" href="#all-notes" onClick={skipToNotes}>Explore notes</a>
      <HomeNavigation onSkipNotes={skipToNotes} />
      <main>
        {/* 3D Campus Experience Stage */}
        <section className="campus-journey" id="campus" ref={journeyRef} aria-labelledby="campus-title">
          <div className={`campus-stage${sceneReady ? ' is-3d-ready' : ''}`} ref={stageRef}>
            <h1 className="home-sr-only" id="campus-title">ABES Autonomy</h1>
            <div className="campus-sky" aria-hidden="true" />
            <div className="campus-fallback" aria-hidden="true">
              <div className="campus-fallback-title"><span>ABES</span><span>AUTONOMY</span></div>
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

        <section className="home-notes" id="all-notes" ref={notesRef} aria-labelledby="notes-title">
          <h2 id="notes-title" tabIndex={-1}>Get your all notes here</h2>
          <Link to="/resources" className="glass-btn-primary home-cta-btn">
            Explore Notes <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </section>
      </main>
    </div>
  );
}
