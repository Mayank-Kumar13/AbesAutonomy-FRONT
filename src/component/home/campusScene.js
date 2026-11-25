import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import brandFont from './assets/gentilis-brand.json';
import { createCampusSurfaces, seededRandom } from './campusSurfaces';
import { createCampusAtmosphere } from './campusAtmosphere';
import { addCampusPlanting } from './campusPlanting';

// A deliberately architectural interpretation of the supplied ABES facade.
// Repeated facade details are instanced: hundreds of windows, only a few draw calls.
export function createCampusScene(canvas) {
  const lowPower = window.matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency || 8) <= 4;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.localClippingEnabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.98;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  // Architecture is static; cache its shadows instead of rebuilding them on scroll.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.15, 200);
  const campus = new THREE.Group();
  scene.add(campus);

  const room = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(room, 0.04);
  const atmosphere = createCampusAtmosphere(renderer);
  scene.environment = atmosphere.environment;
  scene.add(atmosphere.clouds);
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xdceeff, 0x858374, 0.78));
  const sun = new THREE.DirectionalLight(0xfff5e4, 2.2);
  sun.position.set(-30, 32, 16);
  sun.castShadow = true;
  sun.shadow.mapSize.set(lowPower ? 1024 : 2048, lowPower ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -42, right: 42, top: 32, bottom: -25, near: 1, far: 110 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.normalBias = 0.025;
  sun.shadow.bias = -0.00015;
  sun.shadow.radius = 2.5;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xb3d5ed, 0.35);
  rim.position.set(15, 22, -16);
  scene.add(rim);

  const surfaces = createCampusSurfaces();
  const materials = {
    wall: surfaces.wall,
    trim: surfaces.trim,
    shadow: new THREE.MeshStandardMaterial({ color: 0x303a3e, roughness: 0.92 }),
    glass: surfaces.glass,
    glassLight: surfaces.glassLight,
    frame: new THREE.MeshStandardMaterial({ color: 0x86857b, metalness: 0.65, roughness: 0.38 }),
    rail: new THREE.MeshStandardMaterial({ color: 0x9e9c8d, metalness: 0.83, roughness: 0.32 }),
    paving: surfaces.paving,
    road: surfaces.road,
    brick: surfaces.brick,
    leaf: new THREE.MeshStandardMaterial({ color: 0x35482b, roughness: 0.96 }),
    trunk: surfaces.trunk,
    silver: new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, metalness: 0.65, roughness: 0.3 }),
    silverSide: new THREE.MeshStandardMaterial({ color: 0x1c3a56, metalness: 0.7, roughness: 0.34 }),
  };
  Object.entries(materials).forEach(([name, material]) => {
    if (name.startsWith('silver')) {
      material.envMap = environment.texture;
      material.envMapIntensity = 0.9;
    } else if (!name.startsWith('glass')) material.envMapIntensity = 0.45;
  });
  const batches = new Map();
  function box(material, x, y, z, w, h, d, rotation = 0) {
    if (!batches.has(material)) batches.set(material, []);
    batches.get(material).push({ x, y, z, w, h, d, rotation });
  }
  function mesh(geometry, material, x, y, z) {
    const item = new THREE.Mesh(geometry, materials[material] || material);
    item.position.set(x, y, z);
    item.castShadow = true;
    item.receiveShadow = true;
    campus.add(item);
    return item;
  }
  function windowBay(x, y, z, width = 1.95, height = 1.12, alternate = false) {
    box('shadow', x, y, z, width + 0.28, height + 0.3, 0.1);
    box(alternate ? 'glassLight' : 'glass', x, y, z + 0.055, width, height, 0.035);
    // Projecting reveals and sills put the glass visibly behind the outer facade.
    for (const dx of [-width / 2 - 0.11, width / 2 + 0.11]) {
      box('trim', x + dx, y, z + 0.15, 0.12, height + 0.3, 0.4);
    }
    for (const dx of [-width / 2, -width / 6, width / 6, width / 2]) {
      box('frame', x + dx, y, z + 0.12, 0.035, height, 0.09);
    }
    box('frame', x, y + height * 0.23, z + 0.12, width, 0.035, 0.09);
    for (const dy of [-height / 2 - 0.05, height / 2 + 0.05]) box('trim', x, y + dy, z + 0.19, width + 0.35, 0.12, 0.5);
  }

  // Two five-level wings, projecting pilasters, recessed glazing and roof pergolas.
  for (const side of [-1, 1]) {
    const center = side * 19;
    box('wall', center, 6, -1.4, 23, 12, 5);
    box('shadow', center, 1.3, 1.18, 22.7, 2.35, 0.1);
    for (let floor = 0; floor < 5; floor++) {
      const y = 1.4 + floor * 2.32;
      box('trim', center, floor * 2.32 + 0.2, 1.22, 23.5, 0.15, 0.42);
      for (let col = 0; col < 7; col++) {
        const x = center - 9.75 + col * 3.25;
        windowBay(x, y, 1.19, 2.04, floor === 0 ? 1.5 : 1.12, (col + floor) % 4 === 0);
        if (floor > 0 && col % 2 === 0) {
          box('frame', x + 0.62, y - 0.23, 1.5, 0.52, 0.32, 0.35);
          box('shadow', x + 0.62, y - 0.23, 1.69, 0.35, 0.19, 0.02);
          for (let grille = 0; grille < 4; grille++) box('rail', x + 0.62, y - 0.3 + grille * 0.045, 1.71, 0.34, 0.012, 0.025);
        }
      }
    }
    for (let col = 0; col < 8; col++) {
      box('trim', center - 11.37 + col * 3.25, 6.1, 1.48, 0.3, 12.6, 0.65);
    }
    box('trim', center, 12.3, 0, 23.7, 0.3, 6);
    box('wall', center, 12.65, -2.5, 23.2, 0.5, 0.3);
    for (let col = 0; col < 13; col++) {
      box('rail', center - 10.8 + col * 1.8, 13.2, -1.6, 0.07, 1.2, 0.07);
      box('rail', center - 10.8 + col * 1.8, 13.8, -1.5, 0.12, 0.12, 3.8, -0.12);
    }
    box('frame', center, 13.75, -3.3, 22, 0.1, 0.12);
    box('frame', center, 13.5, 0.3, 22, 0.12, 0.12);
    for (let slat = 0; slat < 6; slat++) box('rail', center, 13.55 + slat * 0.04, 0.1 - slat * 0.62, 22, 0.045, 0.08);
  }

  // Recessed central atrium with the recognizable open entrance and balconies.
  box('shadow', 0, 6, -4.3, 11, 12, 1);
  for (let floor = 0; floor < 5; floor++) {
    for (let col = 0; col < 4; col++) windowBay(-3.6 + col * 2.4, 1.3 + floor * 2.3, -3.7, 1.95, 1.5);
    box('trim', 0, 0.1 + floor * 2.3, -0.6, 11.5, 0.22, 6.1);
    if (floor > 0) {
      for (let i = 0; i < 27; i++) box('rail', -5.3 + i * 0.405, floor * 2.3 + 0.55, 2.4, 0.035, 0.9, 0.035);
      box('rail', 0, floor * 2.3 + 1, 2.4, 11, 0.07, 0.08);
      box('shadow', 0, floor * 2.3 + 0.02, 2.4, 11.2, 0.12, 0.3);
    }
  }
  // Paired entrance towers, slit windows, curved caps and small rooftop domes.
  for (const x of [-6.3, 6.3]) {
    box('wall', x, 6.8, 0.8, 3.1, 13.6, 4.3);
    box('trim', x - 1.5, 7, 3, 0.27, 14, 0.35);
    box('trim', x + 1.5, 7, 3, 0.27, 14, 0.35);
    for (let floor = 0; floor < 5; floor++) windowBay(x, 1.4 + floor * 2.35, 3.02, 1.9, 1.15);
    box('shadow', x, 13.2, 3.02, 2.2, 1.5, 0.1);
    // Frame the existing top opening instead of changing the towers' proportions.
    box('wall', x - 1.12, 13.2, 3.2, 0.18, 1.5, 0.45);
    box('wall', x + 1.12, 13.2, 3.2, 0.18, 1.5, 0.45);
    box('trim', x, 12.4, 3.1, 3.35, 0.22, 0.55);
    box('trim', x, 14.1, 0.8, 3.65, 0.22, 4.6);
    mesh(new THREE.SphereGeometry(1.65, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), 'trim', x, 14.2, 0.8).scale.y = 0.36;
  }
  // Rear academic block, visible above and through the central atrium.
  box('wall', 5, 7.5, -10, 23, 15, 4);
  for (let floor = 0; floor < 5; floor++) {
    for (let col = 0; col < 8; col++) windowBay(-4.8 + col * 2.8, 2 + floor * 2.6, -7.92, 1.8, 1.4);
  }
  box('trim', 5, 15.2, -10, 23.5, 0.3, 4.5);

  const signCanvas = document.createElement('canvas');
  signCanvas.width = 1024; signCanvas.height = 256;
  const ctx = signCanvas.getContext('2d');
  ctx.fillStyle = '#871e35'; ctx.fillRect(0, 0, 1024, 256);
  ctx.fillStyle = '#eee8d9'; ctx.fillRect(0, 0, 145, 256);
  ctx.strokeStyle = '#ae8d36'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(22, 28); ctx.lineTo(122, 28); ctx.lineTo(122, 100); ctx.quadraticCurveTo(122, 154, 72, 183); ctx.quadraticCurveTo(22, 154, 22, 100); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = '#922f3e'; ctx.textAlign = 'center'; ctx.font = 'bold 30px Georgia'; ctx.fillText('ABES', 72, 78);
  ctx.font = '17px Arial'; ctx.fillText('Estd. 2000', 72, 225);
  ctx.fillStyle = '#f9f3e5'; ctx.font = 'bold 116px Georgia'; ctx.fillText('ABES', 582, 119);
  ctx.font = '58px Arial'; ctx.fillText('Engineering College', 582, 208);
  const signTexture = new THREE.CanvasTexture(signCanvas);
  signTexture.colorSpace = THREE.SRGBColorSpace;
  const signMaterial = new THREE.MeshStandardMaterial({ map: signTexture, roughness: 0.65, envMapIntensity: 0.2 });
  mesh(new THREE.BoxGeometry(9.35, 2.5, 0.22), signMaterial, 0, 13.15, 3.02);

  // Forecourt, walkway, planting beds and palms add depth without a bitmap backdrop.
  box('road', 0, -0.3, 4, 100, 0.4, 48);
  box('paving', 0, -0.02, 4.9, 65, 0.16, 5.5);
  box('paving', 0, -0.01, 11, 8, 0.15, 18);
  const drive = mesh(new THREE.RingGeometry(4.5, 6, 64), 'brick', 0, 0.075, 13);
  drive.rotation.x = -Math.PI / 2;
  for (const side of [-1, 1]) {
    box('trim', side * 19, 0.1, 6.8, 23.8, 0.3, 2);
    box('leaf', side * 19, 0.32, 6.8, 23.4, 0.46, 1.55);
    for (let i = 0; i < 5; i++) {
      const x = side * (4.5 + i * 1.6);
      mesh(new THREE.CylinderGeometry(0.24, 0.16, 0.45, 8), 'brick', x, 0.24, 9);
    }
  }
  addCampusPlanting(campus, materials, lowPower);

  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const dummy = new THREE.Object3D();
  const random = seededRandom(209);
  const instanceColor = new THREE.Color();
  for (const [name, items] of batches) {
    const instances = new THREE.InstancedMesh(unitBox, materials[name], items.length);
    instances.castShadow = true;
    instances.receiveShadow = true;
    items.forEach((item, i) => {
      dummy.position.set(item.x, item.y, item.z);
      dummy.scale.set(item.w, item.h, item.d);
      dummy.rotation.set(item.rotation, 0, 0);
      dummy.updateMatrix(); instances.setMatrixAt(i, dummy.matrix);
      if (name.startsWith('glass')) {
        instanceColor.setHSL(0.08 + random() * 0.08, 0.05 + random() * 0.08, 0.58 + random() * 0.36);
      } else {
        const variation = 0.94 + random() * 0.06;
        instanceColor.setRGB(variation, variation, variation);
      }
      instances.setColorAt(i, instanceColor);
    });
    instances.instanceMatrix.needsUpdate = true;
    campus.add(instances);
  }

  const title = new THREE.Group();
  // The atrium has real openings. Clip only the lettering below the roofline
  // so it cannot show through those openings while rising behind the campus.
  const titleRoofline = new THREE.Plane(new THREE.Vector3(0, 1, 0), -15.5);
  materials.silver.clippingPlanes = [titleRoofline];
  materials.silverSide.clippingPlanes = [titleRoofline];
  const font = new FontLoader().parse(brandFont);
  for (const [word, width, y] of [['ABES', 21, 18.1], ['AUTONOMY', 49, 11.8]]) {
    const geometry = new TextGeometry(word, { font, size: 6.6, depth: 1.3, curveSegments: 6, bevelEnabled: true, bevelThickness: 0.09, bevelSize: 0.055, bevelSegments: 2 });
    geometry.computeBoundingBox();
    const bounds = geometry.boundingBox;
    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const lower = new THREE.Color(0xa8c2d8);
    const upper = new THREE.Color(0xf7faff);
    const color = new THREE.Color();
    for (let vertex = 0; vertex < positions.count; vertex++) {
      const height = (positions.getY(vertex) - bounds.min.y) / (bounds.max.y - bounds.min.y);
      color.copy(lower).lerp(upper, height);
      color.toArray(colors, vertex * 3);
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const scale = width / (bounds.max.x - bounds.min.x);
    geometry.translate(-(bounds.max.x + bounds.min.x) / 2, 0, 0);
    const text = new THREE.Mesh(geometry, [materials.silver, materials.silverSide]);
    text.scale.setScalar(scale);
    text.position.set(0, y, -5.7);
    title.add(text);
  }
  scene.add(title);
  let aspect = 1;
  let lastWidth = 0;
  let lastHeight = 0;
  let released = false;
  let cloudFrame = 0;
  let cloudTimer = 0;
  let previousCloudTime = 0;
  let cloudVisible = true;
  let cloudMotion = false;
  let sceneVisible = false;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Independent atmospheric motion. It never advances the scroll state or camera.
  // At rest, limit full-scene redraws to 24fps (15fps on coarse/low-power devices).
  const stopClouds = () => {
    clearTimeout(cloudTimer);
    cancelAnimationFrame(cloudFrame);
    cloudTimer = cloudFrame = previousCloudTime = 0;
  };
  const canDrift = () => !released && cloudVisible && sceneVisible && cloudMotion && !motionQuery.matches && !document.hidden;
  const scheduleClouds = () => {
    if (!canDrift() || cloudTimer || cloudFrame) return;
    cloudTimer = window.setTimeout(() => {
      cloudTimer = 0;
      cloudFrame = requestAnimationFrame(tickClouds);
    }, 1000 / (lowPower ? 20 : 30));
  };
  function tickClouds(time) {
    cloudFrame = 0;
    if (!canDrift()) { previousCloudTime = 0; return; }
    if (previousCloudTime) atmosphere.advance(Math.min(0.15, (time - previousCloudTime) / 1000));
    previousCloudTime = time;
    renderer.render(scene, camera);
    scheduleClouds();
  }
  const refreshClouds = () => { stopClouds(); scheduleClouds(); };
  const cloudObserver = new IntersectionObserver(([entry]) => { cloudVisible = entry.isIntersecting; refreshClouds(); });
  cloudObserver.observe(canvas);
  document.addEventListener('visibilitychange', refreshClouds);
  motionQuery.addEventListener('change', refreshClouds);

  return {
    resize(width, height) {
      if (width === lastWidth && height === lastHeight) return;
      lastWidth = width; lastHeight = height;
      aspect = width / Math.max(height, 1);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    },
    render({ rise, zoom, fade }, pointer, reducedMotion) {
      cloudMotion = !reducedMotion;
      sceneVisible = fade < 1;
      if (!canDrift()) stopClouds();
      if (released || fade >= 1) return;
      // The lettering starts below the roof, never above the viewport.
      const narrow = aspect < 0.8;
      const baseDistance = narrow ? 77 : Math.max(49, 33 / aspect);
      const titleScale = Math.min(1, baseDistance * Math.tan(THREE.MathUtils.degToRad(20)) * aspect * 1.8 / 49);
      title.scale.setScalar(titleScale);
      // Clear the rear block and entrance domes before the zoom begins. Pan
      // upward with the reveal so ABES keeps headroom beneath the navigation.
      const titleLift = 4.5;
      title.position.y = 17 * (1 - titleScale) - 15 * (1 - rise) + titleLift * rise;
      const x = reducedMotion ? 0 : pointer.x * (1 - zoom) * 0.85;
      const y = reducedMotion ? 0 : -pointer.y * (1 - zoom) * 0.28;
      camera.position.set(x, THREE.MathUtils.lerp((narrow ? 16 : 15) + rise * 2.5, 17.5 + titleLift, zoom) + y, THREE.MathUtils.lerp(baseDistance + rise * 3, -1.8, zoom));
      camera.lookAt(0, THREE.MathUtils.lerp((narrow ? 13 : 12) + rise * 3, 17.5 + titleLift, zoom), -6);
      renderer.render(scene, camera);
      scheduleClouds();
    },
    dispose() {
      if (released) return;
      released = true;
      stopClouds();
      cloudObserver.disconnect();
      document.removeEventListener('visibilitychange', refreshClouds);
      motionQuery.removeEventListener('change', refreshClouds);
      const geometries = new Set();
      const materialSet = new Set(Object.values(materials));
      scene.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materialSet.add(material));
        if (object.isInstancedMesh) object.dispose();
      });
      geometries.forEach(geometry => geometry.dispose());
      materialSet.forEach(material => material.dispose());
      signTexture.dispose();
      surfaces.dispose();
      atmosphere.dispose();
      sun.shadow.dispose();
      environment.dispose();
      renderer.dispose();
    },
  };
}
