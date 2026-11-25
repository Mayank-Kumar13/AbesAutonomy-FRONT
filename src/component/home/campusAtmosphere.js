import * as THREE from 'three';
import { periodicNoise } from './campusSurfaces';

function periodicFbm(u, v, px, py, seed) {
  let sum = 0;
  let amp = 0.54;
  let freq = 1;
  for (let i = 0; i < 4; i++) {
    const p = Math.max(2, Math.round(px * freq));
    sum += periodicNoise(u * p, v * py * freq, p, seed + i * 7) * amp;
    freq *= 2;
    amp *= 0.5;
  }
  return sum;
}

function periodicBillow(u, v, px, py, seed) {
  let sum = 0;
  let amp = 0.56;
  let freq = 1;
  for (let i = 0; i < 4; i++) {
    const p = Math.max(2, Math.round(px * freq));
    const n = periodicNoise(u * p, v * py * freq, p, seed + i * 13);
    const puff = 1 - Math.abs(n * 2 - 1);
    sum += puff * puff * amp;
    freq *= 2;
    amp *= 0.48;
  }
  return sum;
}

function sampleCloudChannels(u, v) {
  const warpX = (periodicNoise(u * 4, v * 2, 4, 3) - 0.5) * 0.14;
  const warpY = (periodicNoise(u * 4, v * 2, 4, 19) - 0.5) * 0.12;
  const wu = u + warpX;
  const wv = v + warpY;

  // Primary cumulus mass: blends smooth fBm with rounded cauliflower billows
  const fbmMain = periodicFbm(wu, wv, 8, 3, 4);
  const billowMain = periodicBillow(wu, wv, 8, 3, 29);
  const cumulus = THREE.MathUtils.clamp(fbmMain * 0.52 + billowMain * 0.55, 0, 1);

  // Secondary billowing turbulence for organic morphing as clouds drift
  const detail = periodicBillow(u + warpX * 0.6, v + warpY * 0.6, 12, 4.5, 41);

  // Fine high-frequency wisps and cirrus streaks
  const wisp = periodicFbm(u * 1.0 + warpX * 1.4, v * 0.75, 16, 6, 73);

  // Broad atmospheric cluster mask so sky keeps clean clear-blue openings
  const cluster = periodicFbm(u, v, 4, 1.8, 97);

  return [cumulus, detail, wisp, cluster];
}

function createCloudMaterial(texture, { opacity, scale, driftScale, wispWeight, horizonTint }) {
  return new THREE.ShaderMaterial({
    uniforms: {
      cloudMap: { value: texture },
      driftPrimary: { value: 0 },
      driftSecondary: { value: 0 },
      layerOpacity: { value: opacity },
      uvScale: { value: new THREE.Vector2(scale[0], scale[1]) },
      driftScale: { value: driftScale },
      wispWeight: { value: wispWeight },
      horizonTint: { value: horizonTint },
    },
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D cloudMap;
      uniform float driftPrimary;
      uniform float driftSecondary;
      uniform float layerOpacity;
      uniform vec2 uvScale;
      uniform float driftScale;
      uniform float wispWeight;
      uniform float horizonTint;
      varying vec2 vUv;

      float sampleDensity(vec2 baseUv, float d1, float d2) {
        vec4 c1 = texture2D(cloudMap, vec2(baseUv.x + d1, baseUv.y));
        vec4 c2 = texture2D(cloudMap, vec2(baseUv.x * 1.25 + d2 + 0.19, clamp(baseUv.y * 1.08 - 0.02, 0.01, 0.99)));
        float base = mix(c1.r, c1.b, wispWeight);
        float sculpted = base * 0.72 + c2.g * 0.28;
        float clusterMask = smoothstep(0.28, 0.72, c1.a * 0.65 + c2.a * 0.35);
        return smoothstep(0.36, 0.78, sculpted * (0.72 + 0.42 * clusterMask));
      }

      void main() {
        vec2 baseUv = vec2(vUv.x * uvScale.x, vUv.y * uvScale.y);
        float d1 = driftPrimary * driftScale;
        float d2 = driftSecondary * driftScale;

        float density = sampleDensity(baseUv, d1, d2);

        // Directional self-shadowing toward upper-left daytime sun (-30, 32, 16)
        float sunSample = sampleDensity(baseUv + vec2(-0.014, 0.042), d1, d2);
        float lightDiff = clamp((density - sunSample) * 2.2, -0.5, 0.7);

        // Sun-facing upper ridges + silver lining on thinner edges
        float topExposure = smoothstep(0.18, 0.85, vUv.y);
        float edgeGlow = (1.0 - smoothstep(0.25, 0.85, density)) * smoothstep(0.05, 0.35, density);
        float directSun = clamp(0.58 + lightDiff * 0.55 + topExposure * 0.24 + edgeGlow * 0.28, 0.0, 1.0);

        // Cool atmospheric underside shading on thick cloud bellies
        float bellyShade = smoothstep(0.35, 0.95, density) * (1.0 - topExposure * 0.75);

        vec3 shadowCol = vec3(0.62, 0.74, 0.86);
        vec3 midCol = vec3(0.90, 0.95, 0.99);
        vec3 sunCol = vec3(1.0, 0.994, 0.975);

        vec3 cloudCol = mix(shadowCol, midCol, smoothstep(0.1, 0.65, directSun));
        cloudCol = mix(cloudCol, sunCol, smoothstep(0.55, 1.0, directSun));
        cloudCol = mix(cloudCol, shadowCol * 0.96, bellyShade * 0.35);

        // Gentle warm sunlight boost toward upper-left sun quadrant
        float sunProximity = (1.0 - smoothstep(0.0, 0.7, vUv.x)) * smoothstep(0.25, 0.95, vUv.y);
        cloudCol += vec3(0.04, 0.03, 0.01) * sunProximity;

        // Soft aerial perspective blend near the horizon
        float horizonFade = smoothstep(0.0, 0.24, vUv.y);
        float topFade = 1.0 - smoothstep(0.84, 1.0, vUv.y);
        vec3 mistCol = vec3(0.82, 0.90, 0.97);
        cloudCol = mix(mistCol, cloudCol, mix(1.0, horizonFade, horizonTint));

        float alpha = density * horizonFade * topFade * layerOpacity;
        if (alpha < 0.004) discard;
        gl_FragColor = vec4(cloudCol, alpha);
        #include <colorspace_fragment>
      }
    `,
  });
}

export function createCampusAtmosphere(renderer) {
  const width = 1024;
  const height = 384;
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const v = y / (height - 1);
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const [cumulus, detail, wisp, cluster] = sampleCloudChannels(u, v);
      const i = (y * width + x) * 4;
      pixels[i] = Math.round(cumulus * 255);
      pixels[i + 1] = Math.round(detail * 255);
      pixels[i + 2] = Math.round(wisp * 255);
      pixels[i + 3] = Math.round(cluster * 255);
    }
  }

  const texture = new THREE.DataTexture(pixels, width, height);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;

  const clouds = new THREE.Group();

  // Primary mid-altitude sunlit cumulus layer across the daytime sky
  const cumulusGeo = new THREE.PlaneGeometry(240, 48);
  const cumulusMat = createCloudMaterial(texture, {
    opacity: 0.88,
    scale: [1.0, 1.0],
    driftScale: 1.0,
    wispWeight: 0.14,
    horizonTint: 0.85,
  });
  const cumulusMesh = new THREE.Mesh(cumulusGeo, cumulusMat);
  cumulusMesh.position.set(0, 33, -72);
  cumulusMesh.renderOrder = -10;
  clouds.add(cumulusMesh);

  // Higher-altitude wispy cirrus layer moving slower for atmospheric depth parallax
  const cirrusGeo = new THREE.PlaneGeometry(290, 62);
  const cirrusMat = createCloudMaterial(texture, {
    opacity: 0.46,
    scale: [1.35, 1.0],
    driftScale: 0.52,
    wispWeight: 0.72,
    horizonTint: 0.9,
  });
  const cirrusMesh = new THREE.Mesh(cirrusGeo, cirrusMat);
  cirrusMesh.position.set(18, 40, -92);
  cirrusMesh.renderOrder = -12;
  clouds.add(cirrusMesh);

  // Daytime environment reflection map aligned with the blue sky & sunlit clouds
  const skyWidth = 512;
  const skyHeight = 256;
  const skyPixels = new Uint8Array(skyWidth * skyHeight * 4);
  const skyTop = new THREE.Color('#2b78c4');
  const horizon = new THREE.Color('#dceaf5');
  const ground = new THREE.Color('#6b7268');
  const color = new THREE.Color();
  for (let y = 0; y < skyHeight; y++) {
    const v = y / (skyHeight - 1);
    for (let x = 0; x < skyWidth; x++) {
      if (v < 0.5) {
        color.copy(skyTop).lerp(horizon, Math.pow(v * 2, 0.72));
        const [cumulus] = sampleCloudChannels(x / skyWidth, v * 2);
        const cloudMask = THREE.MathUtils.smoothstep(cumulus, 0.44, 0.76);
        color.lerp(horizon, cloudMask * 0.55);
      } else {
        color.copy(horizon).lerp(ground, Math.min(1, (v - 0.5) * 10));
      }
      const i = ((skyHeight - y - 1) * skyWidth + x) * 4;
      skyPixels.set([color.r * 255, color.g * 255, color.b * 255, 255], i);
    }
  }
  const sky = new THREE.DataTexture(skyPixels, skyWidth, skyHeight);
  sky.mapping = THREE.EquirectangularReflectionMapping;
  sky.needsUpdate = true;
  const generator = new THREE.PMREMGenerator(renderer);
  const environment = generator.fromEquirectangular(sky);
  generator.dispose();
  sky.dispose();

  return {
    clouds,
    environment: environment.texture,
    // Advance dual-octave drift uniforms so clouds glide and gently evolve across the sky.
    advance(seconds) {
      cumulusMat.uniforms.driftPrimary.value = (cumulusMat.uniforms.driftPrimary.value + seconds * 0.0085) % 1;
      cumulusMat.uniforms.driftSecondary.value = (cumulusMat.uniforms.driftSecondary.value + seconds * 0.0052) % 1;
      cirrusMat.uniforms.driftPrimary.value = (cirrusMat.uniforms.driftPrimary.value + seconds * 0.0085) % 1;
      cirrusMat.uniforms.driftSecondary.value = (cirrusMat.uniforms.driftSecondary.value + seconds * 0.0052) % 1;
    },
    dispose() {
      cumulusGeo.dispose();
      cumulusMat.dispose();
      cirrusGeo.dispose();
      cirrusMat.dispose();
      texture.dispose();
      environment.dispose();
    },
  };
}
