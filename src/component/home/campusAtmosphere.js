import * as THREE from 'three';
import { periodicNoise } from './campusSurfaces';

function cloudDensity(u, v) {
  // Periodic fields make wrapping mathematically seamless, including the warp.
  const warp = periodicNoise(u * 4, v * 4, 4, 7);
  const x = u * 8 + warp * 0.7;
  const y = v * 8 + warp * 0.45;
  const density = periodicNoise(x, y, 8, 4) * 0.57 +
    periodicNoise(x * 2, y * 2, 16, 11) * 0.28 +
    periodicNoise(x * 4, y * 4, 32, 17) * 0.1 +
    periodicNoise(x * 8, y * 8, 64, 2) * 0.05;
  return THREE.MathUtils.smoothstep(density, 0.43, 0.74);
}

export function createCampusAtmosphere(renderer) {
  const width = 1024, height = 256;
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const density = cloudDensity(x / width, y / height);
      const i = (y * width + x) * 4;
      pixels.set([230 + density * 25, 240 + density * 15, 248 + density * 7, density * 190], i);
    }
  }
  const texture = new THREE.DataTexture(pixels, width, height);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  const material = new THREE.ShaderMaterial({
    uniforms: { cloudMap: { value: texture }, drift: { value: 0 } },
    transparent: true, depthWrite: false, toneMapped: false,
    vertexShader: `varying vec2 cloudUv;
      void main() { cloudUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform sampler2D cloudMap; uniform float drift; varying vec2 cloudUv;
      void main() {
        vec4 cloud = texture2D(cloudMap, vec2(cloudUv.x + drift, cloudUv.y));
        float edge = smoothstep(0.0, 0.22, cloudUv.y) * (1.0 - smoothstep(0.8, 1.0, cloudUv.y));
        gl_FragColor = vec4(cloud.rgb, cloud.a * edge * 0.46);
        #include <colorspace_fragment>
      }`,
  });
  const clouds = new THREE.Mesh(new THREE.PlaneGeometry(210, 45), material);
  clouds.position.set(0, 42, -70);
  clouds.renderOrder = -10;

  // Outdoor illumination/reflections replace the studio room on the architecture.
  // The existing wordmark retains its original studio reflection map.
  const skyWidth = 512, skyHeight = 256;
  const skyPixels = new Uint8Array(skyWidth * skyHeight * 4);
  const skyTop = new THREE.Color('#5995bc');
  const horizon = new THREE.Color('#e4e8e5');
  const ground = new THREE.Color('#5b6258');
  const color = new THREE.Color();
  for (let y = 0; y < skyHeight; y++) {
    const v = y / (skyHeight - 1);
    for (let x = 0; x < skyWidth; x++) {
      if (v < 0.5) {
        color.copy(skyTop).lerp(horizon, Math.pow(v * 2, 0.7));
        color.lerp(horizon, cloudDensity(x / skyWidth, v * 2) * 0.6);
      } else color.copy(horizon).lerp(ground, Math.min(1, (v - 0.5) * 10));
      // DataTexture's first row is the bottom of the equirectangular image.
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
    // One UV uniform advances; no camera, geometry or React state is animated here.
    advance(seconds) { material.uniforms.drift.value = (material.uniforms.drift.value + seconds * 0.0018) % 1; },
    dispose() { texture.dispose(); environment.dispose(); },
  };
}
