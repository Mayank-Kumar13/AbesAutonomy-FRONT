# Homepage: campus to notes

The reference video's sequence is mapped to native scrolling: the wordmark rises
from below the roofline, holds behind the campus, then the camera moves toward the
lettering and dissolves into the notes destination. Scrolling back reverses it.
The homepage ends there; the previous cards, reviews and large footer are not
rendered on this route, in accordance with the requested content limit.

The campus is a procedural 3D interpretation of the supplied ABES photograph,
not a photograph or a surveyed architectural model. Its wings, window bays,
paired entrance towers, domes, red sign, atrium, pergolas and landscaping are
constructed in code. Pointer movement adds a small camera offset.

## Files and scope

- `HomeContent.jsx`: scroll lifecycle, accessible headings and notes destination.
- `HomeContent.css`: homepage-only styling, responsive layouts and motion rules.
- `HomeNavigation.jsx`: homepage navigation using the existing routes and auth context.
- `campusScene.js`: geometry, instancing, materials, camera and GPU cleanup.
- `CampusFallback.jsx`: code-drawn SVG facade when WebGL is unavailable or lost.
- `journey.js`: pure, reversible scroll timeline.
- `assets/gentilis-brand.json`: locally bundled, 13 KB font subset for the wordmark.
- `assets/FONT-LICENSE.txt`: the font's original SIL Open Font License.
- `src/App.jsx`: omit the shared navigation, timed intro and footer only on `/`.
- `package.json` and `package-lock.json`: add Three.js; no other package upgrades.

Backend, authentication, resource logic, environment and deployment configuration
are unchanged. The notes CTA uses `/resources`, including its existing login guard.

## Performance and accessibility

Three.js is loaded as a separate dynamic chunk (about 156 KB gzip). Repeated
architectural details use instanced meshes. Device pixel ratio is capped at 1.5,
static architecture shadows are cached, and rendering happens only on scroll,
resize and a short pointer settling loop. Listeners, animation frames, observers,
textures, geometries, materials and renderer resources are disposed on unmount.

The fallback renders before the 3D module loads. WebGL failure does not prevent
access to notes. Reduced motion displays the completed wordmark without camera
movement or a long pinned sequence. The navigation has native buttons, Escape
handling, visible focus, and a skip-to-notes link. Hidden notes are inert until
their reveal, so keyboard users cannot tab into invisible controls.

## Verification

- `npm run build`: passes. Vite reports the existing mixed static/dynamic API
  import and large chunk advisories; the optional 3D chunk also exceeds the raw
  500 KB warning threshold.
- Timeline assertions: 1,001 positions, bounded monotonic stages, completed
  reveal before zoom, exact endpoints and reduced-motion state pass.
- Browser: desktop and portrait mobile layouts, forward/backward and fast
  scrolling, notes reveal, mobile menu, and notes CTA to the existing login page.
- No horizontal overflow at the checked viewport sizes.
- Backend-dependent operations and authenticated account flows were not exercised;
  no local backend was running. Existing visit/announcement calls report errors
  in that environment. OS-level reduced-motion emulation was not available;
  its timeline behavior was checked programmatically.

The feature was developed in a separate worktree to preserve pre-existing local
changes to the original checkout's auth API, services API and Vercel configuration.
