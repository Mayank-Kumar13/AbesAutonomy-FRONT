import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import './Lanyard.css';

/**
 * ABES AUTONOMY — THREE.JS LANYARD COMPONENT
 * Physically simulated 3D hanging identity badge lanyard with interactive dragging,
 * card flipping, dynamic ribbon strap, and Apple Liquid Glass materials.
 */
export default function Lanyard({
  frontImage,
  backImage,
  strapImage = '/images/credits/abes-lanyard-band.svg',
  imageFit = 'cover',
  cardColor = '#FFFFFF',
  orientation = 'portrait',
  finish = 'glossy',
  cornerRadius = 0.3,
  size = 0.65,
  anchor = 'center',
  strapLength = 0.5,
  strapColor = '#111111',
  strapWidth = 0.65,
  metal = 'silver',
  gravity = 1,
  damping = 0.6,
  elasticity = 0.55,
  breeze = 0.35,
  interactive = true,
  intro = true,
  isFlipped = false,
  onFlip,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [webglSupported, setWebglSupported] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [internalFlipped, setInternalFlipped] = useState(false);

  // Sync internal flip state with prop
  useEffect(() => {
    setInternalFlipped(isFlipped);
  }, [isFlipped]);

  // Main Three.js lifecycle
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Check WebGL availability
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

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 600;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0, 5.2);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
    } catch (e) {
      console.warn('Three.js WebGLRenderer creation error:', e);
      setWebglSupported(false);
      return;
    }

    // ─── 2. LIGHTING (Glossy Apple Glass Lighting) ───
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLightFront = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLightFront.position.set(2, 4, 4);
    scene.add(dirLightFront);

    const dirLightBack = new THREE.DirectionalLight(0xc5ac86, 0.9);
    dirLightBack.position.set(-2, -2, -3);
    scene.add(dirLightBack);

    // Pointer-responsive point light for glossy reflection sheen
    const pointLight = new THREE.PointLight(0xffffff, 1.6, 12);
    pointLight.position.set(0, 0, 3.5);
    scene.add(pointLight);

    // ─── 3. TEXTURE LOADER ───
    const textureLoader = new THREE.TextureLoader();

    // Default front/back textures
    const frontMatMap = frontImage instanceof HTMLCanvasElement
      ? new THREE.CanvasTexture(frontImage)
      : typeof frontImage === 'string'
        ? textureLoader.load(frontImage)
        : null;

    if (frontMatMap) {
      frontMatMap.colorSpace = THREE.SRGBColorSpace;
      frontMatMap.anisotropy = 4;
    }

    const backMatMap = backImage instanceof HTMLCanvasElement
      ? new THREE.CanvasTexture(backImage)
      : typeof backImage === 'string'
        ? textureLoader.load(backImage)
        : null;

    if (backMatMap) {
      backMatMap.colorSpace = THREE.SRGBColorSpace;
      backMatMap.anisotropy = 4;
    }

    // Strap texture
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

    // ─── 4. CARD ASSEMBLY GEOMETRY & MATERIALS ───
    const cardGroup = new THREE.Group();
    scene.add(cardGroup);

    // Aspect ratio: ~ 1.25 width x 1.85 height (scaled by `size`)
    const cardW = 1.25 * size;
    const cardH = 1.85 * size;
    const cardD = 0.035 * size;

    // Card Body with Rounded Edges
    const cardShape = new THREE.Shape();
    const cr = Math.min(cornerRadius * size * 0.45, cardW * 0.2);
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

    // Punch hole cutout at top of card for the clip
    const holePath = new THREE.Path();
    const holeW = 0.16 * size;
    const holeH = 0.05 * size;
    const holeY = hh - 0.12 * size;
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
      bevelSize: 0.015 * size,
      bevelThickness: 0.015 * size,
    };

    const cardGeometry = new THREE.ExtrudeGeometry(cardShape, extrudeSettings);
    cardGeometry.center();

    // Material for the card core and edges
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x12151d,
      roughness: 0.35,
      metalness: 0.1,
    });

    const isGlossy = finish === 'glossy';

    // Front Face Plate
    const frontGeometry = new THREE.PlaneGeometry(cardW - 0.02, cardH - 0.02);
    const frontMaterial = new THREE.MeshPhysicalMaterial({
      map: frontMatMap,
      color: frontMatMap ? 0xffffff : new THREE.Color(cardColor),
      roughness: isGlossy ? 0.10 : 0.45,
      metalness: 0.04,
      clearcoat: isGlossy ? 1.0 : 0.1,
      clearcoatRoughness: 0.08,
      reflectivity: 0.9,
    });
    const frontMesh = new THREE.Mesh(frontGeometry, frontMaterial);
    frontMesh.position.z = cardD / 2 + 0.017 * size;

    // Back Face Plate
    const backGeometry = new THREE.PlaneGeometry(cardW - 0.02, cardH - 0.02);
    const backMaterial = new THREE.MeshPhysicalMaterial({
      map: backMatMap,
      color: backMatMap ? 0xffffff : new THREE.Color(0x0e1118),
      roughness: isGlossy ? 0.12 : 0.4,
      metalness: 0.05,
      clearcoat: isGlossy ? 1.0 : 0.1,
      clearcoatRoughness: 0.1,
      reflectivity: 0.85,
    });
    const backMesh = new THREE.Mesh(backGeometry, backMaterial);
    backMesh.position.z = -cardD / 2 - 0.017 * size;
    backMesh.rotation.y = Math.PI; // Face outwards to the back

    const cardRimMesh = new THREE.Mesh(cardGeometry, rimMaterial);
    cardGroup.add(cardRimMesh);
    cardGroup.add(frontMesh);
    cardGroup.add(backMesh);

    // ─── 5. METALLIC CLASP & MOUNT RING ───
    const metalColor = metal === 'gold' ? 0xc5ac86 : 0xd8d8e0;
    const metalMaterial = new THREE.MeshStandardMaterial({
      color: metalColor,
      metalness: 0.95,
      roughness: 0.18,
    });

    // Ring through top punch hole
    const ringGeo = new THREE.TorusGeometry(0.085 * size, 0.02 * size, 16, 32);
    const ringMesh = new THREE.Mesh(ringGeo, metalMaterial);
    ringMesh.position.set(0, hh - 0.08 * size, 0);
    cardGroup.add(ringMesh);

    // Swivel clasp connecting ring to lanyard strap
    const claspGeo = new THREE.CylinderGeometry(0.045 * size, 0.045 * size, 0.16 * size, 16);
    const claspMesh = new THREE.Mesh(claspGeo, metalMaterial);
    claspMesh.position.set(0, hh + 0.07 * size, 0);
    cardGroup.add(claspMesh);

    // ─── 6. PHYSICAL VERLET PARTICLES FOR LANYARD STRAP ───
    const NUM_SEGMENTS = 8;
    const anchorY = 2.45;
    const restLength = (strapLength * 2.8) / NUM_SEGMENTS;

    // Particles: p0 is fixed top anchor, pN connects to card
    const particles = [];
    for (let i = 0; i <= NUM_SEGMENTS; i++) {
      const y = anchorY - i * restLength;
      // Slight intro impulse if requested
      const initX = intro ? (Math.random() - 0.5) * 0.4 : 0;
      const p = {
        pos: new THREE.Vector3(initX, y, 0),
        oldPos: new THREE.Vector3(initX, y, 0),
        acc: new THREE.Vector3(0, 0, 0),
      };
      particles.push(p);
    }

    // Ribbon Geometry & Mesh for Strap
    const ribbonWidth = 0.12 * strapWidth * size;
    const strapMaterial = new THREE.MeshStandardMaterial({
      map: strapTex,
      color: strapTex ? 0xffffff : new THREE.Color(strapColor),
      roughness: 0.6,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    // Create ribbon strip mesh with dynamic quad segments
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

    // ─── 7. POINTER INTERACTION & DRAGGING ───
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

        // Define intersection plane at card's current Z depth
        dragPlane.constant = -cardGroup.position.z;
        raycaster.ray.intersectPlane(dragPlane, dragTarget);
      }
    };

    const handlePointerMove = (e) => {
      const coords = getPointerCoords(e);
      mousePos.set(coords.x, coords.y);

      // Move pointLight slightly for specular response
      pointLight.position.x = mousePos.x * 2.5;
      pointLight.position.y = mousePos.y * 2.5;

      if (isUserDragging && interactive) {
        raycaster.setFromCamera(mousePos, camera);
        raycaster.ray.intersectPlane(dragPlane, dragTarget);
      }
    };

    const handlePointerUp = (e) => {
      if (!isUserDragging) return;
      isUserDragging = false;
      setIsDragging(false);

      const upCoords = getPointerCoords(e);
      const elapsed = performance.now() - pointerDownTime;
      const dist = Math.hypot(upCoords.rawX - pointerDownPos.x, upCoords.rawY - pointerDownPos.y);

      // Short tap / click triggers card flip!
      if (elapsed < 300 && dist < 12) {
        setInternalFlipped((prev) => {
          const next = !prev;
          if (onFlip) onFlip(next);
          return next;
        });
      }
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // ─── 8. RESIZE OBSERVER ───
    const handleResize = () => {
      if (!container || !renderer) return;
      const newW = container.clientWidth || 600;
      const newH = container.clientHeight || 600;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // ─── 9. ANIMATION & PHYSICS SIMULATION LOOP ───
    const clock = new THREE.Clock();
    let currentFlipAngle = internalFlipped ? Math.PI : 0;
    let cardTiltAngle = 0;

    const animate = () => {
      if (!isMounted) return;
      animId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.033);
      const time = clock.getElapsedTime();

      // ─── Verlet Physics Integration ───
      // Anchor particle 0 is pinned
      particles[0].pos.set(0, anchorY, 0);

      const endIdx = particles.length - 1;

      // When dragging, strongly pull the bottom particle toward pointer
      if (isUserDragging) {
        particles[endIdx].pos.lerp(
          new THREE.Vector3(dragTarget.x, dragTarget.y + cardH * 0.5, dragTarget.z),
          0.45
        );
      }

      for (let i = 1; i <= endIdx; i++) {
        const p = particles[i];
        if (i === endIdx && isUserDragging) continue;

        // Velocity with damping
        const vx = (p.pos.x - p.oldPos.x) * damping;
        const vy = (p.pos.y - p.oldPos.y) * damping;
        const vz = (p.pos.z - p.oldPos.z) * damping;

        // Forces: gravity + gentle natural breeze
        const grav = -gravity * 8.5;
        const bz = Math.sin(time * 1.5 + i * 0.35) * breeze * 0.8;
        const bzZ = Math.cos(time * 1.2 + i * 0.3) * breeze * 0.35;

        p.oldPos.copy(p.pos);
        p.pos.x += vx + bz * (delta * delta) * 12;
        p.pos.y += vy + grav * (delta * delta);
        p.pos.z += vz + bzZ * (delta * delta) * 8;
      }

      // Satisfy distance constraints (relaxation iterations)
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
            // Anchor is fixed: only move p2
            p2.pos.x -= dx * diff * elasticity;
            p2.pos.y -= dy * diff * elasticity;
            p2.pos.z -= dz * diff * elasticity;
          } else if (i + 1 === endIdx && isUserDragging) {
            // pEnd is pinned by cursor
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

      // ─── Update Strap Ribbon Strip Mesh ───
      const positions = ribbonGeo.attributes.position.array;
      const uvs = ribbonGeo.attributes.uv.array;

      for (let i = 0; i <= NUM_SEGMENTS; i++) {
        const p = particles[i].pos;

        // Normal perpendicular to segment direction for ribbon width
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

      // ─── Update Card Position & Dynamic Orientation ───
      const endPos = particles[endIdx].pos;
      const prevPos = particles[endIdx - 1].pos;

      // Card sits right beneath the clasp
      cardGroup.position.set(endPos.x, endPos.y - cardH * 0.5 - 0.08 * size, endPos.z);

      // Tangent alignment
      const strapTangent = new THREE.Vector3().subVectors(endPos, prevPos).normalize();
      const targetRoll = -strapTangent.x * 0.7;
      cardTiltAngle += (targetRoll - cardTiltAngle) * 0.15;

      // Smooth card flip interpolation (0 front, Math.PI back)
      const targetFlip = internalFlipped ? Math.PI : 0;
      currentFlipAngle += (targetFlip - currentFlipAngle) * 0.12;

      cardGroup.rotation.z = cardTiltAngle;
      cardGroup.rotation.y = currentFlipAngle;
      cardGroup.rotation.x = (endPos.z - prevPos.z) * 0.4;

      renderer.render(scene, camera);
    };

    animate();

    // ─── 10. CLEANUP ON UNMOUNT ───
    return () => {
      isMounted = false;
      if (animId) cancelAnimationFrame(animId);

      resizeObserver.disconnect();
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      // Dispose Three.js objects
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

      renderer.dispose();
    };
  }, [
    frontImage,
    backImage,
    strapImage,
    cardColor,
    finish,
    cornerRadius,
    size,
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
    internalFlipped,
    onFlip,
  ]);

  return (
    <div
      ref={containerRef}
      className={`lanyard-container ${isDragging ? 'is-dragging' : ''}`}
      aria-label="3D Interactive Contributor Lanyard ID Badge"
    >
      {webglSupported ? (
        <>
          <canvas ref={canvasRef} className="lanyard-canvas" />
          <div className="lanyard-hint-badge">
            <span className="lanyard-hint-dot" />
            <span>Drag card to swing • Tap to flip badge</span>
          </div>
        </>
      ) : (
        <div className="lanyard-fallback-card">
          {frontImage && typeof frontImage === 'string' && (
            <img src={frontImage} alt="Contributor" className="lanyard-fallback-portrait" />
          )}
          <h3 className="lanyard-fallback-name">Contributor Badge</h3>
          <p className="lanyard-fallback-role">ABES Autonomy Contributor</p>
        </div>
      )}
    </div>
  );
}
