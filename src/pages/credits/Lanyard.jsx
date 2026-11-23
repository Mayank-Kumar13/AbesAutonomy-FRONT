import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { getSocialHitFromUV } from './badgeTextureGenerator';
import './Lanyard.css';

/**
 * ABES AUTONOMY — THREE.JS LANYARD 3D IDENTITY BADGE
 * Centered, large, physically simulated hanging identity card.
 * Features:
 * - Verlet physics ribbon strap simulation with gravity and natural breeze
 * - Interactive pointer grab and velocity transfer
 * - Smooth 180° card flipping between photograph front and profile back
 * - Raycasted UV hit detection for clickable social buttons directly on the 3D card back
 * - Adaptive camera framing maintaining 65-75% presentation height across desktop and mobile
 * - Glossy Apple Liquid Glass materials with dual specular highlights
 */
export default function Lanyard({
  frontImage,
  backImage,
  contributor,
  strapImage = '/images/credits/abes-lanyard-band.svg',
  imageFit = 'cover',
  cardColor = '#FFFFFF',
  orientation = 'portrait',
  finish = 'glossy',
  cornerRadius = 0.3,
  size = 0.88,
  anchor = 'center',
  strapLength = 0.44,
  strapColor = '#111111',
  strapWidth = 0.65,
  metal = 'silver',
  gravity = 1,
  damping = 0.62,
  elasticity = 0.55,
  breeze = 0.35,
  interactive = true,
  intro = true,
  isFlipped = false,
  onFlip,
  onSocialClick,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const frontMeshRef = useRef(null);
  const backMeshRef = useRef(null);
  const contributorRef = useRef(contributor);
  const onFlipRef = useRef(onFlip);
  const onSocialClickRef = useRef(onSocialClick);
  const flippedRef = useRef(isFlipped);

  const [webglSupported, setWebglSupported] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [internalFlipped, setInternalFlipped] = useState(isFlipped);

  // Keep references current
  useEffect(() => {
    contributorRef.current = contributor;
    onFlipRef.current = onFlip;
    onSocialClickRef.current = onSocialClick;
  });

  // Sync internal flip state with prop
  useEffect(() => {
    flippedRef.current = isFlipped;
    setInternalFlipped(isFlipped);
  }, [isFlipped]);

  // Main Three.js WebGL Scene Lifecycle
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Verify WebGL availability
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    let isMounted = true;
    let animId = null;

    // ─── 1. THREE.JS SCENE SETUP ───
    const scene = new THREE.Scene();

    const initialW = container.clientWidth || 800;
    const initialH = container.clientHeight || 750;

    const camera = new THREE.PerspectiveCamera(36, initialW / initialH, 0.1, 50);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(initialW, initialH);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.18;
    } catch (e) {
      console.warn('Three.js WebGLRenderer creation error:', e);
      setWebglSupported(false);
      return;
    }

    // ─── 2. APPLE LIQUID GLASS LIGHTING ───
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const dirLightFront = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLightFront.position.set(2.5, 4.5, 4.5);
    scene.add(dirLightFront);

    const dirLightBack = new THREE.DirectionalLight(0xffffff, 1.1);
    dirLightBack.position.set(-2.5, 3.5, 4.5);
    scene.add(dirLightBack);

    // Dynamic point light tracking pointer for specular sheen (softened to prevent specular blowouts)
    const pointLight = new THREE.PointLight(0xffffff, 0.65, 12);
    pointLight.position.set(0, 0, 3.5);
    scene.add(pointLight);

    // ─── 3. TEXTURE LOADER ───
    const textureLoader = new THREE.TextureLoader();

    const frontMatMap = frontImage instanceof HTMLCanvasElement
      ? new THREE.CanvasTexture(frontImage)
      : typeof frontImage === 'string'
        ? textureLoader.load(frontImage)
        : null;

    if (frontMatMap) {
      frontMatMap.colorSpace = THREE.SRGBColorSpace;
      frontMatMap.anisotropy = 8;
    }

    const backMatMap = backImage instanceof HTMLCanvasElement
      ? new THREE.CanvasTexture(backImage)
      : typeof backImage === 'string'
        ? textureLoader.load(backImage)
        : null;

    if (backMatMap) {
      backMatMap.colorSpace = THREE.SRGBColorSpace;
      backMatMap.anisotropy = 8;
    }

    let strapTex = null;
    if (strapImage instanceof HTMLCanvasElement) {
      strapTex = new THREE.CanvasTexture(strapImage);
    } else if (typeof strapImage === 'string') {
      strapTex = textureLoader.load(strapImage);
    }
    if (strapTex) {
      strapTex.wrapS = THREE.RepeatWrapping;
      strapTex.wrapT = THREE.RepeatWrapping;
      strapTex.repeat.set(1, 6);
      strapTex.colorSpace = THREE.SRGBColorSpace;
    }

    // ─── 4. CARD ASSEMBLY GEOMETRY (LARGE 3D IDENTITY BADGE) ───
    const cardGroup = new THREE.Group();
    scene.add(cardGroup);

    // Aspect ratio: 1.25 width x 1.85 height, scaled by `size`
    const cardW = 1.25 * size;
    const cardH = 1.85 * size;
    const cardD = 0.038 * size;

    // Card Body Outline with Rounded Corners
    const cardShape = new THREE.Shape();
    const cr = Math.min(cornerRadius * size * 0.45, cardW * 0.18);
    const hw = cardW / 2;
    const hh = cardH / 2;

    cardShape.moveTo(-hw + cr, -hh);
    cardShape.lineTo(hw - cr, -hh);
    cardShape.quadraticCurveTo(hw, -hh, hw, -hh + cr);
    cardShape.lineTo(hw, hh - cr);
    cardShape.quadraticCurveTo(hw, hh, hw - cr, hh);
    cardShape.lineTo(-hw + cr, hh);
    cardShape.quadraticCurveTo(-hw, hh, -hw, hh - cr);
    cardShape.lineTo(-hw, -hh + cr);
    cardShape.quadraticCurveTo(-hw, -hh, -hw + cr, -hh);

    // Top punch hole slot for metallic clasp ring
    const holePath = new THREE.Path();
    const holeW = 0.18 * size;
    const holeH = 0.055 * size;
    const holeY = hh - 0.13 * size;
    holePath.moveTo(-holeW / 2, holeY);
    holePath.lineTo(holeW / 2, holeY);
    holePath.lineTo(holeW / 2, holeY + holeH);
    holePath.lineTo(-holeW / 2, holeY + holeH);
    holePath.closePath();
    cardShape.holes.push(holePath);

    const extrudeSettings = {
      depth: cardD,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.016 * size,
      bevelThickness: 0.016 * size,
    };

    const cardGeometry = new THREE.ExtrudeGeometry(cardShape, extrudeSettings);
    cardGeometry.center();

    // Dark metallic rim edge material
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x12151e,
      roughness: 0.32,
      metalness: 0.15,
    });

    const isGlossy = finish === 'glossy';

    // Front Face (Photograph Only)
    const frontGeometry = new THREE.PlaneGeometry(cardW - 0.02, cardH - 0.02);
    const frontMaterial = new THREE.MeshPhysicalMaterial({
      map: frontMatMap,
      color: 0xffffff,
      roughness: isGlossy ? 0.16 : 0.45,
      metalness: 0.01,
      clearcoat: isGlossy ? 0.8 : 0.1,
      clearcoatRoughness: 0.12,
      reflectivity: 0.8,
    });
    const frontMesh = new THREE.Mesh(frontGeometry, frontMaterial);
    frontMesh.position.z = cardD / 2 + 0.018 * size;
    frontMeshRef.current = frontMesh;

    // Back Face (Full Profile Artwork with Social Buttons)
    const backGeometry = new THREE.PlaneGeometry(cardW - 0.02, cardH - 0.02);
    const backMaterial = new THREE.MeshPhysicalMaterial({
      map: backMatMap,
      color: 0xffffff,
      roughness: isGlossy ? 0.20 : 0.45,
      metalness: 0.01,
      clearcoat: isGlossy ? 0.8 : 0.1,
      clearcoatRoughness: 0.12,
      reflectivity: 0.8,
    });
    const backMesh = new THREE.Mesh(backGeometry, backMaterial);
    backMesh.position.z = -cardD / 2 - 0.018 * size;
    backMesh.rotation.y = Math.PI; // Face outwards to the back
    backMeshRef.current = backMesh;

    const cardRimMesh = new THREE.Mesh(cardGeometry, rimMaterial);
    cardGroup.add(cardRimMesh);
    cardGroup.add(frontMesh);
    cardGroup.add(backMesh);

    // ─── 5. METALLIC CLASP & HANGING RING ───
    const metalColor = metal === 'gold' ? 0xc5ac86 : 0xdcdce4;
    const metalMaterial = new THREE.MeshStandardMaterial({
      color: metalColor,
      metalness: 0.95,
      roughness: 0.16,
    });

    const ringGeo = new THREE.TorusGeometry(0.09 * size, 0.022 * size, 16, 32);
    const ringMesh = new THREE.Mesh(ringGeo, metalMaterial);
    ringMesh.position.set(0, hh - 0.085 * size, 0);
    cardGroup.add(ringMesh);

    const claspGeo = new THREE.CylinderGeometry(0.048 * size, 0.048 * size, 0.17 * size, 16);
    const claspMesh = new THREE.Mesh(claspGeo, metalMaterial);
    claspMesh.position.set(0, hh + 0.075 * size, 0);
    cardGroup.add(claspMesh);

    // ─── 6. PHYSICAL VERLET PARTICLES FOR LANYARD STRAP ───
    const NUM_SEGMENTS = 8;
    const anchorY = 2.05;
    const restLength = (strapLength * 2.6) / NUM_SEGMENTS;

    const particles = [];
    for (let i = 0; i <= NUM_SEGMENTS; i++) {
      const y = anchorY - i * restLength;
      const initX = intro ? (Math.random() - 0.5) * 0.35 : 0;
      particles.push({
        pos: new THREE.Vector3(initX, y, 0),
        oldPos: new THREE.Vector3(initX, y, 0),
        acc: new THREE.Vector3(0, 0, 0),
      });
    }

    // Ribbon strip mesh
    const ribbonWidth = 0.13 * strapWidth * size;
    const strapMaterial = new THREE.MeshStandardMaterial({
      map: strapTex,
      color: strapTex ? 0xffffff : new THREE.Color(strapColor),
      roughness: 0.65,
      metalness: 0.08,
      side: THREE.DoubleSide,
    });

    const ribbonGeo = new THREE.BufferGeometry();
    const posAttr = new Float32Array((NUM_SEGMENTS + 1) * 2 * 3);
    const uvAttr = new Float32Array((NUM_SEGMENTS + 1) * 2 * 2);
    const indexArr = [];

    for (let i = 0; i < NUM_SEGMENTS; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      indexArr.push(a, b, c);
      indexArr.push(b, d, c);
    }

    ribbonGeo.setAttribute('position', new THREE.BufferAttribute(posAttr, 3));
    ribbonGeo.setAttribute('uv', new THREE.BufferAttribute(uvAttr, 2));
    ribbonGeo.setIndex(indexArr);

    const ribbonMesh = new THREE.Mesh(ribbonGeo, strapMaterial);
    scene.add(ribbonMesh);

    // ─── 7. RESPONSIVE CAMERA FRAMING (TARGET 65-75% HEIGHT) ───
    const updateFraming = (w, h) => {
      const aspect = w / h;
      camera.aspect = aspect;

      // Base desktop framing: target card occupying ~70% of presentation height
      const fovRad = THREE.MathUtils.degToRad(camera.fov);
      const targetFrustumH = cardH / 0.70;
      const targetZ = targetFrustumH / (2 * Math.tan(fovRad / 2));

      // Mobile/narrow protection: ensure card width never exceeds 80% of width
      const minFrustumW = cardW / 0.80;
      const zForWidth = minFrustumW / (2 * aspect * Math.tan(fovRad / 2));

      camera.position.z = Math.max(targetZ, zForWidth);
      camera.position.y = 0.06;
      camera.position.x = 0;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    updateFraming(initialW, initialH);

    // ─── 8. POINTER INTERACTION, DRAGGING & RAYCASTING ───
    let isUserDragging = false;
    let dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const raycaster = new THREE.Raycaster();
    const mousePos = new THREE.Vector2();
    const dragTarget = new THREE.Vector3();
    let pointerDownTime = 0;
    let pointerDownPos = { x: 0, y: 0 };

    const getPointerCoords = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: ((clientX - rect.left) / rect.width) * 2 - 1,
        y: -((clientY - rect.top) / rect.height) * 2 + 1,
        rawX: clientX,
        rawY: clientY,
      };
    };

    const handlePointerDown = (e) => {
      if (!interactive) return;
      const coords = getPointerCoords(e);
      mousePos.set(coords.x, coords.y);
      raycaster.setFromCamera(mousePos, camera);

      const intersects = raycaster.intersectObjects([cardRimMesh, frontMesh, backMesh], true);
      if (intersects.length > 0) {
        isUserDragging = true;
        setIsDragging(true);
        pointerDownTime = performance.now();
        pointerDownPos = { x: coords.rawX, y: coords.rawY };

        dragPlane.constant = -cardGroup.position.z;
        raycaster.ray.intersectPlane(dragPlane, dragTarget);
      }
    };

    let currentFlipAngle = internalFlipped ? Math.PI : 0;

    const handlePointerMove = (e) => {
      const coords = getPointerCoords(e);
      mousePos.set(coords.x, coords.y);

      // Light sheen follow
      pointLight.position.x = mousePos.x * 2.5;
      pointLight.position.y = mousePos.y * 2.5 + 0.2;

      if (isUserDragging && interactive) {
        raycaster.setFromCamera(mousePos, camera);
        raycaster.ray.intersectPlane(dragPlane, dragTarget);
      } else if (interactive) {
        // Cursor hover feedback: check if hovering over social links on the back
        const isBackFacing = Math.abs(currentFlipAngle - Math.PI) < 0.45;
        if (isBackFacing && backMesh) {
          raycaster.setFromCamera(mousePos, camera);
          const hits = raycaster.intersectObject(backMesh);
          if (hits.length > 0 && hits[0].uv) {
            const hit = getSocialHitFromUV(hits[0].uv, contributorRef.current);
            if (hit && hit.url) {
              canvas.style.cursor = 'pointer';
              return;
            }
          }
        }
        canvas.style.cursor = 'grab';
      }
    };

    const handlePointerUp = (e) => {
      if (!isUserDragging) return;
      isUserDragging = false;
      setIsDragging(false);

      const upCoords = getPointerCoords(e);
      const elapsed = performance.now() - pointerDownTime;
      const dist = Math.hypot(upCoords.rawX - pointerDownPos.x, upCoords.rawY - pointerDownPos.y);

      // Short tap / click detection
      if (elapsed < 380 && dist < 14) {
        const isBackFacing = Math.abs(currentFlipAngle - Math.PI) < 0.45;

        // If card is showing its back, check if clicked on an interactive social button
        if (isBackFacing && backMesh) {
          raycaster.setFromCamera(mousePos, camera);
          const hits = raycaster.intersectObject(backMesh);
          if (hits.length > 0 && hits[0].uv) {
            const hit = getSocialHitFromUV(hits[0].uv, contributorRef.current);
            if (hit && hit.url) {
              if (onSocialClickRef.current) {
                onSocialClickRef.current(hit);
              } else {
                window.open(hit.url, '_blank', 'noopener,noreferrer');
              }
              return; // Do NOT flip the badge when social link is clicked!
            }
          }
        }

        // Tap on card body flips the card!
        const next = !flippedRef.current;
        flippedRef.current = next;
        setInternalFlipped(next);
        if (onFlipRef.current) onFlipRef.current(next);
      }
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // ─── 9. RESIZE OBSERVER ───
    const handleResize = () => {
      if (!container || !renderer) return;
      const newW = container.clientWidth || 800;
      const newH = container.clientHeight || 750;
      updateFraming(newW, newH);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // ─── 10. PHYSICS & ANIMATION RENDER LOOP ───
    const clock = new THREE.Clock();
    let cardTiltAngle = 0;

    const animate = () => {
      if (!isMounted) return;
      animId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.033);
      const time = clock.getElapsedTime();

      // Verlet Particle Integration
      particles[0].pos.set(0, anchorY, 0);
      const endIdx = particles.length - 1;

      if (isUserDragging) {
        particles[endIdx].pos.lerp(
          new THREE.Vector3(dragTarget.x, dragTarget.y + cardH * 0.5, dragTarget.z),
          0.45
        );
      }

      for (let i = 1; i <= endIdx; i++) {
        const p = particles[i];
        if (i === endIdx && isUserDragging) continue;

        const vx = (p.pos.x - p.oldPos.x) * damping;
        const vy = (p.pos.y - p.oldPos.y) * damping;
        const vz = (p.pos.z - p.oldPos.z) * damping;

        const grav = -gravity * 8.5;
        const bz = Math.sin(time * 1.5 + i * 0.35) * breeze * 0.8;
        const bzZ = Math.cos(time * 1.2 + i * 0.3) * breeze * 0.35;

        p.oldPos.copy(p.pos);
        p.pos.x += vx + bz * (delta * delta) * 12;
        p.pos.y += vy + grav * (delta * delta);
        p.pos.z += vz + bzZ * (delta * delta) * 8;
      }

      // Relaxation iterations for distance constraints
      const ITERATIONS = 12;
      for (let iter = 0; iter < ITERATIONS; iter++) {
        particles[0].pos.set(0, anchorY, 0);

        for (let i = 0; i < endIdx; i++) {
          const p1 = particles[i];
          const p2 = particles[i + 1];

          const dx = p2.pos.x - p1.pos.x;
          const dy = p2.pos.y - p1.pos.y;
          const dz = p2.pos.z - p1.pos.z;
          const dist = Math.hypot(dx, dy, dz) || 0.001;
          const diff = (dist - restLength) / dist;
          const factor = diff * elasticity * 0.5;

          if (i === 0) {
            p2.pos.x -= dx * diff * elasticity;
            p2.pos.y -= dy * diff * elasticity;
            p2.pos.z -= dz * diff * elasticity;
          } else if (i + 1 === endIdx && isUserDragging) {
            p1.pos.x += dx * diff * elasticity;
            p1.pos.y += dy * diff * elasticity;
            p1.pos.z += dz * diff * elasticity;
          } else {
            p1.pos.x += dx * factor;
            p1.pos.y += dy * factor;
            p1.pos.z += dz * factor;

            p2.pos.x -= dx * factor;
            p2.pos.y -= dy * factor;
            p2.pos.z -= dz * factor;
          }
        }
      }

      // Update Ribbon Geometry
      const positions = ribbonGeo.attributes.position.array;
      const uvs = ribbonGeo.attributes.uv.array;

      for (let i = 0; i <= NUM_SEGMENTS; i++) {
        const p = particles[i].pos;
        const prev = i > 0 ? particles[i - 1].pos : p;
        const next = i < NUM_SEGMENTS ? particles[i + 1].pos : p;
        const dir = new THREE.Vector3().subVectors(next, prev).normalize();
        const side = new THREE.Vector3(-dir.y, dir.x, 0).normalize().multiplyScalar(ribbonWidth);

        const vIdx = i * 6;
        positions[vIdx + 0] = p.x - side.x;
        positions[vIdx + 1] = p.y - side.y;
        positions[vIdx + 2] = p.z - side.z;

        positions[vIdx + 3] = p.x + side.x;
        positions[vIdx + 4] = p.y + side.y;
        positions[vIdx + 5] = p.z + side.z;

        const uvIdx = i * 4;
        const tCoord = i / NUM_SEGMENTS;
        uvs[uvIdx + 0] = 0;
        uvs[uvIdx + 1] = tCoord;
        uvs[uvIdx + 2] = 1;
        uvs[uvIdx + 3] = tCoord;
      }

      ribbonGeo.attributes.position.needsUpdate = true;
      ribbonGeo.attributes.uv.needsUpdate = true;
      ribbonGeo.computeVertexNormals();

      // Update Card Position & Dynamic Orientation
      const endPos = particles[endIdx].pos;
      const prevPos = particles[endIdx - 1].pos;

      cardGroup.position.set(endPos.x, endPos.y - cardH * 0.5 - 0.08 * size, endPos.z);

      const strapTangent = new THREE.Vector3().subVectors(endPos, prevPos).normalize();
      const targetRoll = -strapTangent.x * 0.7;
      cardTiltAngle += (targetRoll - cardTiltAngle) * 0.15;

      // Smooth card flip interpolation (0 front, Math.PI back)
      const targetFlip = flippedRef.current ? Math.PI : 0;
      currentFlipAngle += (targetFlip - currentFlipAngle) * 0.12;

      cardGroup.rotation.z = cardTiltAngle;
      cardGroup.rotation.y = currentFlipAngle;
      cardGroup.rotation.x = (endPos.z - prevPos.z) * 0.4;

      renderer.render(scene, camera);
    };

    animate();

    // ─── 11. CLEANUP ON UNMOUNT ───
    return () => {
      isMounted = false;
      if (animId) cancelAnimationFrame(animId);

      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      resizeObserver.disconnect();

      // Clean dispose of Three.js objects
      renderer.dispose();
      cardGeometry.dispose();
      frontGeometry.dispose();
      backGeometry.dispose();
      ringGeo.dispose();
      claspGeo.dispose();
      ribbonGeo.dispose();
      rimMaterial.dispose();
      frontMaterial.dispose();
      backMaterial.dispose();
      metalMaterial.dispose();
      strapMaterial.dispose();
      if (frontMatMap) frontMatMap.dispose();
      if (backMatMap) backMatMap.dispose();
      if (strapTex) strapTex.dispose();
    };
  }, [
    size,
    orientation,
    finish,
    cornerRadius,
    strapLength,
    strapColor,
    strapWidth,
    metal,
    gravity,
    damping,
    elasticity,
    breeze,
    interactive,
    intro,
  ]);

  // Update front texture dynamically without rebuilding WebGL context
  useEffect(() => {
    if (!frontMeshRef.current || !frontImage) return;
    const tex = frontImage instanceof HTMLCanvasElement
      ? new THREE.CanvasTexture(frontImage)
      : new THREE.TextureLoader().load(frontImage);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    if (frontMeshRef.current.material.map) {
      frontMeshRef.current.material.map.dispose();
    }
    frontMeshRef.current.material.color.set(0xffffff);
    frontMeshRef.current.material.map = tex;
    frontMeshRef.current.material.needsUpdate = true;
  }, [frontImage]);

  // Update back texture dynamically without rebuilding WebGL context
  useEffect(() => {
    if (!backMeshRef.current || !backImage) return;
    const tex = backImage instanceof HTMLCanvasElement
      ? new THREE.CanvasTexture(backImage)
      : new THREE.TextureLoader().load(backImage);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    if (backMeshRef.current.material.map) {
      backMeshRef.current.material.map.dispose();
    }
    backMeshRef.current.material.color.set(0xffffff);
    backMeshRef.current.material.map = tex;
    backMeshRef.current.material.needsUpdate = true;
  }, [backImage]);

  if (!webglSupported) {
    return (
      <div className="lanyard-fallback-card">
        <div className="fallback-badge-content">
          <p>3D WebGL acceleration is unavailable in this environment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lanyard-wrapper" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className={`lanyard-canvas ${isDragging ? 'is-dragging' : ''}`}
        aria-label="3D Interactive Contributor Identity Badge Lanyard"
      />
    </div>
  );
}
