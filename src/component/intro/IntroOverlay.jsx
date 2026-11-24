import React, { useState, useLayoutEffect, useEffect, useRef } from "react";
import "./IntroOverlay.css";

const WORD1 = "ABES";
const WORD2 = "AUTONOMY";

const IntroOverlay = ({ locationKey }) => {
  const entryKey = useRef(locationKey);
  const [stage, setStage] = useState("init"); // 'init' -> 'hold' -> 'move' -> 'fade' -> 'done'
  const [style, setStyle] = useState({ opacity: 0 }); // hide initially to prevent flash
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [cursorLine, setCursorLine] = useState(1); // 1 = line 1, 2 = line 2, 0 = hidden
  const [shimmer, setShimmer] = useState(false);
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    if (stage === "init" || stage === "hold") {
      document.documentElement.classList.add("intro-running");
    } else {
      document.documentElement.classList.remove("intro-running");
    }
    return () => {
      document.documentElement.classList.remove("intro-running");
    };
  }, [stage]);

  useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setStage("done");
      return;
    }

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const unscaledWidth = containerRef.current.offsetWidth || rect.width || 120;
      const unscaledHeight = containerRef.current.offsetHeight || rect.height || 42;

      // Dynamic initial scale: generous on desktop, safely bounded on mobile
      const maxAvailableWidth = window.innerWidth * 0.82;
      const initialScale = Math.min(2.4, Math.max(1.3, maxAvailableWidth / unscaledWidth));

      const centerX = (window.innerWidth / 2) - ((unscaledWidth * initialScale) / 2);
      const centerY = (window.innerHeight / 2) - ((unscaledHeight * initialScale) / 2);

      setStyle({
        transform: `translate(${centerX}px, ${centerY}px) scale(${initialScale})`,
        transition: "none",
        opacity: 1
      });

      setStage("hold");
    }
  }, []);

  useLayoutEffect(() => {
    if (locationKey !== entryKey.current) setStage("done");
  }, [locationKey]);

  // Smooth character-by-character typing animation during hold stage
  useEffect(() => {
    if (stage !== "hold") return;

    let idx1 = 0;
    let idx2 = 0;
    let timer1 = null;
    let timer2 = null;

    // Type "ABES"
    const interval1 = setInterval(() => {
      idx1++;
      setText1(WORD1.slice(0, idx1));
      if (idx1 >= WORD1.length) {
        clearInterval(interval1);
        setCursorLine(2);

        // Micro-pause, then type "AUTONOMY"
        timer1 = setTimeout(() => {
          const interval2 = setInterval(() => {
            idx2++;
            setText2(WORD2.slice(0, idx2));
            if (idx2 >= WORD2.length) {
              clearInterval(interval2);
              setCursorLine(0);
              setShimmer(true);

              // Pause briefly for specular shine, then smoothly glide into navbar
              timer2 = setTimeout(() => {
                setStage("move");
              }, 450);
            }
          }, 65);
        }, 120);
      }
    }, 90);

    return () => {
      clearInterval(interval1);
      if (timer1) clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
    };
  }, [stage]);

  // Handle move & fade transitions
  useEffect(() => {
    if (stage === "move") {
      const target = document.querySelector(".capsule-brand") || document.querySelector(".glass-nav-capsule");
      let destX = (window.innerWidth / 2) - 60;
      let destY = 18;
      let targetScale = 1;

      if (target && containerRef.current) {
        const targetRect = target.getBoundingClientRect();
        const unscaledWidth = containerRef.current.offsetWidth || targetRect.width || 120;
        destX = targetRect.left;
        destY = targetRect.top;
        if (unscaledWidth > 0) {
          targetScale = targetRect.width / unscaledWidth;
        }
      }

      setStyle({
        transform: `translate(${destX}px, ${destY}px) scale(${targetScale})`,
        opacity: 1
      });

      const timer = setTimeout(() => {
        setStage("fade");
      }, 850); // Matches cubic-bezier move duration
      return () => clearTimeout(timer);
    } else if (stage === "fade") {
      const timer = setTimeout(() => {
        setStage("done");
      }, 420); // Matches fade-out dissolve duration
      return () => clearTimeout(timer);
    }
  }, [stage]);

  if (stage === "done") return null;

  return (
    <div className={`intro-overlay ${stage === "fade" ? "fade-out" : ""}`}>
      <div 
        className="intro-logo-container" 
        ref={containerRef}
        style={style}
      >
        <div className={`intro-capsule-pod ${stage === "move" || stage === "fade" ? "is-docking" : ""} ${shimmer ? "intro-shimmer" : ""}`}>
          <div className="brand-crest intro-crest">
            <svg viewBox="0 0 400 500" width="28" height="34" aria-hidden="true">
              <defs>
                <linearGradient id="introCrestGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#DFCAAA" />
                  <stop offset="100%" stopColor="#C5AC86" />
                </linearGradient>
              </defs>
              <path
                d="M50 60 L350 60 L350 250 C350 380 200 460 200 460 C200 460 50 380 50 250 Z"
                stroke="url(#introCrestGoldGrad)"
                strokeWidth="8"
                fill="rgba(12, 14, 18, 0.85)"
              />
              <path
                d="M75 85 L325 85 L325 240 C325 350 200 420 200 420 C200 420 75 350 75 240 Z"
                stroke="url(#introCrestGoldGrad)"
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
                fill="url(#introCrestGoldGrad)"
                textAnchor="middle"
                letterSpacing="4"
              >
                ABES
              </text>
              <circle cx="200" cy="270" r="45" fill="none" stroke="url(#introCrestGoldGrad)" strokeWidth="6" />
              <path d="M185 270 L215 270 M200 255 L200 285" stroke="url(#introCrestGoldGrad)" strokeWidth="6" strokeLinecap="round" />
            </svg>
          </div>
          <div className="brand-text intro-brand-text">
            <div className="brand-line-1">
              <span className="brand-title intro-ghost-measure" aria-hidden="true">{WORD1}</span>
              <span className="brand-title intro-visible-text">
                {text1}
                {cursorLine === 1 && <span className="intro-caret" />}
              </span>
            </div>
            <div className="brand-line-2">
              <span className="brand-sub intro-ghost-measure" aria-hidden="true">{WORD2}</span>
              <span className="brand-sub intro-visible-text">
                {text2}
                {cursorLine === 2 && <span className="intro-caret intro-caret-gold" />}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroOverlay;
