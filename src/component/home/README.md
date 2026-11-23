# Homepage: campus to notes

The reference video's sequence is mapped to native scrolling: the wordmark rises
from below the roofline, holds behind the campus, then the camera moves toward the
lettering and dissolves into the notes destination. Scrolling back reverses it.
The destination shows a heading and an Explore Notes link to Resources. The shared footer is not rendered on this route.

The campus is a procedural 3D interpretation of the supplied ABES photograph,
not a photograph or a surveyed architectural model. Its wings, window bays,
paired entrance towers, domes, red sign, atrium, pergolas and landscaping are
constructed in code. Pointer movement adds a small camera offset.

## Files and scope

- `HomeContent.jsx`: scroll lifecycle, accessible headings and notes destination.
- `HomeContent.css`: homepage-only styling, responsive layouts and motion rules.
- `HomeNavigation.jsx`: homepage navigation using the existing routes and auth context.
- `campusScene.js`: geometry, instancing, materials, camera and GPU cleanup.
- `journey.js`: pure, reversible scroll timeline.
- `assets/gentilis-brand.json`: locally bundled, 13 KB font subset for the wordmark.
- `assets/FONT-LICENSE.txt`: the font's original SIL Open Font License.
- `src/App.jsx`: manage the startup intro independently of navigation.
- `package.json` and `package-lock.json`: add Three.js; no other package upgrades.

Backend, authentication, resource logic, environment and deployment configuration
are unchanged. The notes CTA uses `/resources`, including its existing login guard.

## Performance and accessibility

The campus module is loaded dynamically. Repeated
architectural details use instanced meshes. Device pixel ratio is capped at 1.5,
static architecture shadows are cached. Camera updates happen on scroll,
resize and a frame-rate-independent pointer settling loop. Clouds have a separate
24 fps loop (15 fps on low-power devices), paused when hidden or offscreen.
Listeners, animation frames, observers,
textures, geometries, materials and renderer resources are disposed on unmount.

A centered wordmark covers the stage until its first rendered 3D frame. WebGL failure does not prevent
access to notes. Reduced motion displays the completed wordmark without camera
movement or a long pinned sequence. The navigation has native buttons, Escape
handling, visible focus, and a skip-to-notes link. Hidden notes are inert until
their reveal, so keyboard users cannot tab into invisible controls. Explore notes
and the keyboard skip link jump directly to the notes heading and move focus;
they do not temporarily focus a destination that the animation will make inert.

The controller calls the scene's `resize(width, height)` before its first
`render(state, pointer, reducedMotion)`. Timeline values are `rise`, `zoom`, and
`fade`; scene opacity follows the fade. A ResizeObserver
keeps the drawing buffer and scroll distance aligned with the stage. One shared
stage-height variable keeps the sticky scene and notes overlap aligned, including
short landscape viewports. WebGL context loss disposes the scene and reveals the
static wordmark.

## Verification

- `npm run build`: passes with existing mixed static/dynamic API import and
  large chunk advisories.
- Browser: campus renders, scrolling reveals the wordmark and notes, reverse
  scrolling returns to campus, and Explore notes focuses the notes heading.
- Portrait phone (390 x 844): notes are visible and interactive after skipping,
  without horizontal overflow. The resources CTA reaches the existing login guard.
- Authenticated account flows were not exercised. OS-level reduced-motion and
  actual GPU context loss were not emulated during this verification.

The feature was developed in a separate worktree to preserve pre-existing local
changes to the original checkout's auth API, services API and Vercel configuration.
