import * as THREE from 'three';

// Small, deterministic, reusable surface maps. Nothing is downloaded at runtime.
export function seededRandom(seed = 7429) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

const noiseLattices = new Map();
export function periodicNoise(x, y, period, seed = 0) {
  const key = period * 1000 + seed;
  let lattice = noiseLattices.get(key);
  if (!lattice) {
    lattice = new Float32Array(period * period);
    for (let j = 0; j < period; j++) for (let i = 0; i < period; i++) {
      const n = Math.sin(i * 127.1 + j * 311.7 + seed * 17.3) * 43758.5453;
      lattice[j * period + i] = n - Math.floor(n);
    }
    noiseLattices.set(key, lattice);
  }
  const hash = (i, j) => lattice[((j % period + period) % period) * period + ((i % period + period) % period)];
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(ix, iy), hash(ix + 1, iy), u), THREE.MathUtils.lerp(hash(ix, iy + 1), hash(ix + 1, iy + 1), u), v);
}

function canvasTexture(canvas, color = true) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

function makeCanvas(width, height = width) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  return [canvas, canvas.getContext('2d')];
}

// Project real-world UVs onto each box face, including instanced pilasters.
// Grain size stays consistent on a 23m wall and a 30cm pillar instead of stretching.
function worldMapped(material, repeat) {
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', `
      #include <uv_vertex>
      vec4 surfacePoint = vec4(position, 1.0);
      vec3 surfaceNormal = normal;
      #ifdef USE_INSTANCING
        surfacePoint = instanceMatrix * surfacePoint;
        surfaceNormal = mat3(instanceMatrix) * surfaceNormal;
      #endif
      surfacePoint = modelMatrix * surfacePoint;
      surfaceNormal = abs(normalize(mat3(modelMatrix) * surfaceNormal));
      vec2 surfaceUv = surfaceNormal.y > 0.6 ? surfacePoint.xz :
        (surfaceNormal.x > 0.6 ? surfacePoint.zy : surfacePoint.xy);
      surfaceUv *= ${repeat.toFixed(4)};
      #ifdef USE_MAP
        vMapUv = surfaceUv;
      #endif
      #ifdef USE_BUMPMAP
        vBumpMapUv = surfaceUv;
      #endif
      #ifdef USE_ROUGHNESSMAP
        vRoughnessMapUv = surfaceUv;
      #endif
    `);
  };
  material.customProgramCacheKey = () => `campus-surface-${repeat}`;
  return material;
}

export function createCampusSurfaces() {
  const random = seededRandom();
  const [paint, paintContext] = makeCanvas(256);
  const [relief, reliefContext] = makeCanvas(256);
  const [rough, roughContext] = makeCanvas(256);
  const colorPixels = paintContext.createImageData(256, 256);
  const reliefPixels = reliefContext.createImageData(256, 256);
  const roughPixels = roughContext.createImageData(256, 256);
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const i = (y * 256 + x) * 4;
      const grain = random() - 0.5;
      const mottling = periodicNoise(x / 32, y / 32, 8) - 0.5;
      const tone = 230 + mottling * 10 + grain * 7;
      colorPixels.data.set([tone, tone + 1, tone - 3, 255], i);
      const height = 128 + grain * 55 + mottling * 20;
      reliefPixels.data.set([height, height, height, 255], i);
      const roughness = 229 + grain * 14 + mottling * 12;
      roughPixels.data.set([roughness, roughness, roughness, 255], i);
    }
  }
  paintContext.putImageData(colorPixels, 0, 0);
  reliefContext.putImageData(reliefPixels, 0, 0);
  roughContext.putImageData(roughPixels, 0, 0);
  const concrete = canvasTexture(paint);
  const bump = canvasTexture(relief, false);
  const roughness = canvasTexture(rough, false);

  const [pavers, paverContext] = makeCanvas(512);
  const [paverRelief, paverReliefContext] = makeCanvas(512);
  paverContext.fillStyle = '#6b6b63'; paverContext.fillRect(0, 0, 512, 512);
  paverReliefContext.fillStyle = '#505050'; paverReliefContext.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 16; row++) {
    for (let col = -1; col < 9; col++) {
      const x = col * 64 + (row % 2) * 32, y = row * 32;
      const tone = Math.floor(165 + random() * 23);
      paverContext.fillStyle = `rgb(${tone + 8},${tone + 6},${tone})`;
      paverContext.fillRect(x + 1, y + 1, 62, 30);
      paverContext.fillStyle = '#ffffff22'; paverContext.fillRect(x + 2, y + 1, 60, 1);
      paverReliefContext.fillStyle = '#c8c8c8'; paverReliefContext.fillRect(x + 1, y + 1, 62, 30);
    }
  }
  for (let i = 0; i < 26000; i++) {
    paverContext.fillStyle = i % 2 ? '#ffffff0c' : '#151e240c';
    paverContext.fillRect(random() * 512, random() * 512, 1, 1);
  }
  const paving = canvasTexture(pavers);
  const pavingBump = canvasTexture(paverRelief, false);

  // Dark interior, a little venetian-blind detail, and a restrained sky reflection.
  const [glass, glassContext] = makeCanvas(128, 256);
  const reflection = glassContext.createLinearGradient(0, 0, 60, 256);
  reflection.addColorStop(0, '#111c21'); reflection.addColorStop(0.18, '#34454d');
  reflection.addColorStop(0.52, '#2b383a'); reflection.addColorStop(1, '#151c1d');
  glassContext.fillStyle = reflection; glassContext.fillRect(0, 0, 128, 256);
  for (let y = 60; y < 250; y += 13) {
    glassContext.fillStyle = `rgba(157,145,121,${0.05 + random() * 0.08})`;
    glassContext.fillRect(0, y, 128, 2);
  }
  const sheen = glassContext.createLinearGradient(0, 0, 128, 200);
  sheen.addColorStop(0, '#c0d8e52c'); sheen.addColorStop(0.45, '#bad5e015'); sheen.addColorStop(1, '#ffffff00');
  glassContext.fillStyle = sheen; glassContext.fillRect(0, 0, 128, 256);
  const glazing = canvasTexture(glass);

  const [bark, barkContext] = makeCanvas(128, 256);
  barkContext.fillStyle = '#807461'; barkContext.fillRect(0, 0, 128, 256);
  for (let y = 0; y < 256; y += 9) {
    barkContext.fillStyle = '#423f3266'; barkContext.fillRect(0, y, 128, 2);
    barkContext.fillStyle = '#c2b18f55'; barkContext.fillRect(0, y + 3, 128, 1);
  }
  for (let i = 0; i < 2000; i++) {
    barkContext.fillStyle = i % 2 ? '#ddd1a922' : '#17201922';
    barkContext.fillRect(random() * 128, random() * 256, 1, random() * 6);
  }
  const trunk = canvasTexture(bark);
  const textures = [concrete, bump, roughness, paving, pavingBump, glazing, trunk];

  return {
    wall: worldMapped(new THREE.MeshStandardMaterial({ color: 0xe1e4df, map: concrete, bumpMap: bump, bumpScale: 0.018, roughnessMap: roughness, roughness: 1 }), 0.7),
    trim: worldMapped(new THREE.MeshStandardMaterial({ color: 0xf1f0e8, map: concrete, bumpMap: bump, bumpScale: 0.012, roughnessMap: roughness, roughness: 0.93 }), 0.7),
    paving: worldMapped(new THREE.MeshStandardMaterial({ color: 0xffffff, map: paving, bumpMap: pavingBump, bumpScale: 0.028, roughness: 0.94 }), 0.22),
    road: worldMapped(new THREE.MeshStandardMaterial({ color: 0xd1d4cc, map: paving, bumpMap: pavingBump, bumpScale: 0.025, roughness: 0.95 }), 0.22),
    brick: worldMapped(new THREE.MeshStandardMaterial({ color: 0xb17e6b, map: paving, bumpMap: pavingBump, bumpScale: 0.018, roughness: 0.94 }), 0.38),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: glazing, metalness: 0, roughness: 0.19, ior: 1.52, clearcoat: 0.6, clearcoatRoughness: 0.16, envMapIntensity: 0.95 }),
    glassLight: new THREE.MeshPhysicalMaterial({ color: 0xc3c0a7, map: glazing, metalness: 0, roughness: 0.28, ior: 1.52, clearcoat: 0.4, clearcoatRoughness: 0.2, envMapIntensity: 0.7 }),
    trunk: new THREE.MeshStandardMaterial({ color: 0xc3b6a2, map: trunk, bumpMap: bump, bumpScale: 0.04, roughness: 0.94 }),
    dispose: () => textures.forEach(texture => texture.dispose()),
  };
}
