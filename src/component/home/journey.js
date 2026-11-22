const clamp = (value) => Math.max(0, Math.min(1, value));
const smoothstep = (start, end, value) => {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};

// One reversible timeline: rise behind the facade, hold, move through the title.
// Only scroll position determines these stages; there are no autoplay timers.
export function getJourneyState(progress, reducedMotion = false) {
  if (reducedMotion) return { rise: 1, zoom: 0, fade: 0 };
  return {
    rise: smoothstep(0.015, 0.36, progress),
    zoom: smoothstep(0.56, 0.93, progress),
    fade: smoothstep(0.77, 0.97, progress),
  };
}
