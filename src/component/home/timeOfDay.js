import * as THREE from 'three';

const tempA = new THREE.Color();
const tempB = new THREE.Color();

function lerpColorHex(hexA, hexB, t) {
  tempA.set(hexA);
  tempB.set(hexB);
  tempA.lerp(tempB, t);
  return `#${tempA.getHexString()}`;
}

function parseRgba(str) {
  const m = str.match(/rgba?\(([^)]+)\)/i);
  if (!m) return [255, 255, 255, 0];
  const parts = m[1].split(',').map((n) => parseFloat(n.trim()));
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0, parts[3] ?? 1];
}

function lerpRgba(rgbaA, rgbaB, t) {
  const a = parseRgba(rgbaA);
  const b = parseRgba(rgbaB);
  return `rgba(${Math.round(lerpNum(a[0], b[0], t))}, ${Math.round(lerpNum(a[1], b[1], t))}, ${Math.round(lerpNum(a[2], b[2], t))}, ${lerpNum(a[3], b[3], t).toFixed(3)})`;
}

function lerpNum(a, b, t) {
  return a + (b - a) * t;
}

function lerpVec3(a, b, t) {
  return [lerpNum(a[0], b[0], t), lerpNum(a[1], b[1], t), lerpNum(a[2], b[2], t)];
}

/**
 * 24-hour keyframe palette for smooth automatic transitions:
 * - Night (20:15 - 04:45): Starry deep navy sky, silver moonlit clouds, warm lit campus windows
 * - Dawn  (06:15): Soft morning peach & pastel blue transition
 * - Day   (08:00 - 16:00): Bright sunny blue sky, sunlit white cumulus clouds
 * - Evening / Shaam (17:45 - 18:30): Golden sunset horizon, rose-violet twilight, peach-lit clouds
 * - Blue Hour / Dusk (19:15): Deep indigo twilight as campus lights turn on
 */
const KEYFRAMES = [
  {
    hour: 0.0,
    phase: 'night',
    sky: ['#03060f', '#071022', '#0d1b33', '#152947', '#1a314f', '#122136', '#0a101a', '#060709'],
    haloColor: 'rgba(190, 216, 255, 0.22)',
    haloSecondary: 'rgba(120, 160, 225, 0.08)',
    haloPos: [76, 18],
    starOpacity: 0.9,
    vignetteTop: 0.28,
    cloud: {
      sunCol: '#9cb8dc',
      midCol: '#455c7c',
      shadowCol: '#182438',
      mistCol: '#162842',
      sunGlow: [0.01, 0.03, 0.06],
      cumulusOpacity: 0.78,
      cirrusOpacity: 0.38,
      sunOffset: [0.014, 0.04],
    },
    light: {
      sunColor: '#9ec2f2',
      sunIntensity: 1.0,
      sunPos: [24, 30, 22],
      hemiSky: '#42618c',
      hemiGround: '#1a212b',
      hemiIntensity: 0.62,
      rimColor: '#5c7fb8',
      rimIntensity: 0.42,
      exposure: 0.94,
    },
    arch: {
      glassLightEmissive: '#ffc982',
      glassLightIntensity: 0.85,
      glassEmissive: '#101d30',
      glassIntensity: 0.14,
      signEmissiveIntensity: 0.48,
      titleLower: '#7898b8',
      titleUpper: '#e4eef7',
      envIntensity: 0.42,
    },
  },
  {
    hour: 4.75,
    phase: 'night',
    sky: ['#03060f', '#071022', '#0d1b33', '#152947', '#1a314f', '#122136', '#0a101a', '#060709'],
    haloColor: 'rgba(190, 216, 255, 0.20)',
    haloSecondary: 'rgba(120, 160, 225, 0.07)',
    haloPos: [74, 20],
    starOpacity: 0.85,
    vignetteTop: 0.26,
    cloud: {
      sunCol: '#9cb8dc',
      midCol: '#455c7c',
      shadowCol: '#182438',
      mistCol: '#162842',
      sunGlow: [0.01, 0.03, 0.06],
      cumulusOpacity: 0.78,
      cirrusOpacity: 0.38,
      sunOffset: [0.014, 0.04],
    },
    light: {
      sunColor: '#9ec2f2',
      sunIntensity: 1.0,
      sunPos: [24, 30, 22],
      hemiSky: '#42618c',
      hemiGround: '#1a212b',
      hemiIntensity: 0.62,
      rimColor: '#5c7fb8',
      rimIntensity: 0.42,
      exposure: 0.94,
    },
    arch: {
      glassLightEmissive: '#ffc982',
      glassLightIntensity: 0.82,
      glassEmissive: '#101d30',
      glassIntensity: 0.14,
      signEmissiveIntensity: 0.45,
      titleLower: '#7898b8',
      titleUpper: '#e4eef7',
      envIntensity: 0.42,
    },
  },
  {
    hour: 6.25,
    phase: 'dawn',
    sky: ['#1f3a6e', '#385c94', '#6d83ae', '#c89fa8', '#f5c7a9', '#b5a0a6', '#3f3842', '#060709'],
    haloColor: 'rgba(255, 214, 170, 0.42)',
    haloSecondary: 'rgba(255, 178, 148, 0.16)',
    haloPos: [78, 42],
    starOpacity: 0.1,
    vignetteTop: 0.06,
    cloud: {
      sunCol: '#ffe6cf',
      midCol: '#f2ccd0',
      shadowCol: '#7480a6',
      mistCol: '#f2c7b2',
      sunGlow: [0.11, 0.06, 0.03],
      cumulusOpacity: 0.86,
      cirrusOpacity: 0.46,
      sunOffset: [0.014, 0.038],
    },
    light: {
      sunColor: '#ffd4ae',
      sunIntensity: 1.65,
      sunPos: [30, 18, 18],
      hemiSky: '#d4b3c2',
      hemiGround: '#595354',
      hemiIntensity: 0.72,
      rimColor: '#8aa4d6',
      rimIntensity: 0.4,
      exposure: 0.96,
    },
    arch: {
      glassLightEmissive: '#ffbe73',
      glassLightIntensity: 0.18,
      glassEmissive: '#1d1c28',
      glassIntensity: 0.04,
      signEmissiveIntensity: 0.1,
      titleLower: '#9eb0c8',
      titleUpper: '#fff2e6',
      envIntensity: 0.72,
    },
  },
  {
    hour: 8.0,
    phase: 'day',
    sky: ['#1a5ca3', '#2b78c5', '#549ed9', '#8ec5ea', '#cbe5f6', '#9bb0bf', '#2e3842', '#060709'],
    haloColor: 'rgba(255, 250, 232, 0.42)',
    haloSecondary: 'rgba(255, 244, 210, 0.15)',
    haloPos: [18, 14],
    starOpacity: 0.0,
    vignetteTop: 0.0,
    cloud: {
      sunCol: '#fffef9',
      midCol: '#e6f2fc',
      shadowCol: '#9ebad4',
      mistCol: '#d1e6f7',
      sunGlow: [0.04, 0.03, 0.01],
      cumulusOpacity: 0.88,
      cirrusOpacity: 0.46,
      sunOffset: [-0.014, 0.042],
    },
    light: {
      sunColor: '#fff5e4',
      sunIntensity: 2.2,
      sunPos: [-30, 32, 16],
      hemiSky: '#dceeff',
      hemiGround: '#858374',
      hemiIntensity: 0.78,
      rimColor: '#b3d5ed',
      rimIntensity: 0.35,
      exposure: 0.98,
    },
    arch: {
      glassLightEmissive: '#000000',
      glassLightIntensity: 0.0,
      glassEmissive: '#000000',
      glassIntensity: 0.0,
      signEmissiveIntensity: 0.0,
      titleLower: '#a8c2d8',
      titleUpper: '#f7faff',
      envIntensity: 0.95,
    },
  },
  {
    hour: 16.0,
    phase: 'day',
    sky: ['#1a5ca3', '#2b78c5', '#549ed9', '#8ec5ea', '#cbe5f6', '#9bb0bf', '#2e3842', '#060709'],
    haloColor: 'rgba(255, 250, 232, 0.42)',
    haloSecondary: 'rgba(255, 244, 210, 0.15)',
    haloPos: [18, 14],
    starOpacity: 0.0,
    vignetteTop: 0.0,
    cloud: {
      sunCol: '#fffef9',
      midCol: '#e6f2fc',
      shadowCol: '#9ebad4',
      mistCol: '#d1e6f7',
      sunGlow: [0.04, 0.03, 0.01],
      cumulusOpacity: 0.88,
      cirrusOpacity: 0.46,
      sunOffset: [-0.014, 0.042],
    },
    light: {
      sunColor: '#fff5e4',
      sunIntensity: 2.2,
      sunPos: [-30, 32, 16],
      hemiSky: '#dceeff',
      hemiGround: '#858374',
      hemiIntensity: 0.78,
      rimColor: '#b3d5ed',
      rimIntensity: 0.35,
      exposure: 0.98,
    },
    arch: {
      glassLightEmissive: '#000000',
      glassLightIntensity: 0.0,
      glassEmissive: '#000000',
      glassIntensity: 0.0,
      signEmissiveIntensity: 0.0,
      titleLower: '#a8c2d8',
      titleUpper: '#f7faff',
      envIntensity: 0.95,
    },
  },
  {
    hour: 17.85,
    phase: 'evening',
    sky: ['#1d2a56', '#3d4575', '#87577c', '#d47475', '#f5b376', '#8a6868', '#2a222b', '#060709'],
    haloColor: 'rgba(255, 178, 98, 0.56)',
    haloSecondary: 'rgba(255, 118, 110, 0.24)',
    haloPos: [20, 44],
    starOpacity: 0.12,
    vignetteTop: 0.08,
    cloud: {
      sunCol: '#ffd8a8',
      midCol: '#eba69f',
      shadowCol: '#564d73',
      mistCol: '#f2ac79',
      sunGlow: [0.18, 0.08, 0.02],
      cumulusOpacity: 0.92,
      cirrusOpacity: 0.54,
      sunOffset: [-0.016, 0.032],
    },
    light: {
      sunColor: '#ffad66',
      sunIntensity: 1.75,
      sunPos: [-34, 15, 20],
      hemiSky: '#d4869a',
      hemiGround: '#4b3d42',
      hemiIntensity: 0.7,
      rimColor: '#7682c4',
      rimIntensity: 0.45,
      exposure: 0.96,
    },
    arch: {
      glassLightEmissive: '#ffbe73',
      glassLightIntensity: 0.5,
      glassEmissive: '#2c1e2e',
      glassIntensity: 0.08,
      signEmissiveIntensity: 0.24,
      titleLower: '#b88f86',
      titleUpper: '#ffe7d1',
      envIntensity: 0.72,
    },
  },
  {
    hour: 19.15,
    phase: 'evening',
    sky: ['#0c1534', '#1a2752', '#3c3b6b', '#7b486c', '#b3666e', '#4f3f52', '#171722', '#060709'],
    haloColor: 'rgba(255, 134, 96, 0.34)',
    haloSecondary: 'rgba(176, 98, 152, 0.18)',
    haloPos: [18, 52],
    starOpacity: 0.55,
    vignetteTop: 0.18,
    cloud: {
      sunCol: '#e8a28e',
      midCol: '#7b6285',
      shadowCol: '#292745',
      mistCol: '#8a5766',
      sunGlow: [0.10, 0.04, 0.03],
      cumulusOpacity: 0.84,
      cirrusOpacity: 0.44,
      sunOffset: [-0.015, 0.03],
    },
    light: {
      sunColor: '#e8967d',
      sunIntensity: 1.15,
      sunPos: [-28, 18, 22],
      hemiSky: '#686e9e',
      hemiGround: '#262430',
      hemiIntensity: 0.64,
      rimColor: '#667ab8',
      rimIntensity: 0.44,
      exposure: 0.95,
    },
    arch: {
      glassLightEmissive: '#ffc982',
      glassLightIntensity: 0.75,
      glassEmissive: '#181e30',
      glassIntensity: 0.12,
      signEmissiveIntensity: 0.4,
      titleLower: '#8d96b8',
      titleUpper: '#f2dfe6',
      envIntensity: 0.5,
    },
  },
  {
    hour: 20.25,
    phase: 'night',
    sky: ['#03060f', '#071022', '#0d1b33', '#152947', '#1a314f', '#122136', '#0a101a', '#060709'],
    haloColor: 'rgba(190, 216, 255, 0.22)',
    haloSecondary: 'rgba(120, 160, 225, 0.08)',
    haloPos: [76, 18],
    starOpacity: 0.9,
    vignetteTop: 0.28,
    cloud: {
      sunCol: '#9cb8dc',
      midCol: '#455c7c',
      shadowCol: '#182438',
      mistCol: '#162842',
      sunGlow: [0.01, 0.03, 0.06],
      cumulusOpacity: 0.78,
      cirrusOpacity: 0.38,
      sunOffset: [0.014, 0.04],
    },
    light: {
      sunColor: '#9ec2f2',
      sunIntensity: 1.0,
      sunPos: [24, 30, 22],
      hemiSky: '#42618c',
      hemiGround: '#1a212b',
      hemiIntensity: 0.62,
      rimColor: '#5c7fb8',
      rimIntensity: 0.42,
      exposure: 0.94,
    },
    arch: {
      glassLightEmissive: '#ffc982',
      glassLightIntensity: 0.85,
      glassEmissive: '#101d30',
      glassIntensity: 0.14,
      signEmissiveIntensity: 0.48,
      titleLower: '#7898b8',
      titleUpper: '#e4eef7',
      envIntensity: 0.42,
    },
  },
  {
    hour: 24.0,
    phase: 'night',
    sky: ['#03060f', '#071022', '#0d1b33', '#152947', '#1a314f', '#122136', '#0a101a', '#060709'],
    haloColor: 'rgba(190, 216, 255, 0.22)',
    haloSecondary: 'rgba(120, 160, 225, 0.08)',
    haloPos: [76, 18],
    starOpacity: 0.9,
    vignetteTop: 0.28,
    cloud: {
      sunCol: '#9cb8dc',
      midCol: '#455c7c',
      shadowCol: '#182438',
      mistCol: '#162842',
      sunGlow: [0.01, 0.03, 0.06],
      cumulusOpacity: 0.78,
      cirrusOpacity: 0.38,
      sunOffset: [0.014, 0.04],
    },
    light: {
      sunColor: '#9ec2f2',
      sunIntensity: 1.0,
      sunPos: [24, 30, 22],
      hemiSky: '#42618c',
      hemiGround: '#1a212b',
      hemiIntensity: 0.62,
      rimColor: '#5c7fb8',
      rimIntensity: 0.42,
      exposure: 0.94,
    },
    arch: {
      glassLightEmissive: '#ffc982',
      glassLightIntensity: 0.85,
      glassEmissive: '#101d30',
      glassIntensity: 0.14,
      signEmissiveIntensity: 0.48,
      titleLower: '#7898b8',
      titleUpper: '#e4eef7',
      envIntensity: 0.42,
    },
  },
];

export function resolveTargetHour() {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const preset = params.get('time')?.toLowerCase();
    if (preset === 'day') return 12.25;
    if (preset === 'morning') return 8.5;
    if (preset === 'evening' || preset === 'sunset' || preset === 'shaam') return 17.85;
    if (preset === 'night') return 22.5;
    if (preset === 'dawn') return 6.25;

    const customHour = Number(params.get('hour'));
    if (params.has('hour') && Number.isFinite(customHour)) {
      return ((customHour % 24) + 24) % 24;
    }
  }
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

export function getCelestialState(hour) {
  const h = ((hour % 24) + 24) % 24;

  // Solar arc: sunrise at 05:45 (5.75) East/Left -> solar noon ~12:22 -> sunset at 19:00 (19.0) West/Right
  const sunrise = 5.75;
  const sunset = 19.0;
  const solarSpan = sunset - sunrise;
  const solarP = THREE.MathUtils.clamp((h - sunrise) / solarSpan, 0, 1);
  const solarArc = Math.sin(solarP * Math.PI);

  const smoothstep = (edge0, edge1, x) => {
    const u = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return u * u * (3 - 2 * u);
  };

  const sunVisibility = smoothstep(5.55, 6.25, h) * (1 - smoothstep(18.5, 19.25, h));
  const sunScreenX = lerpNum(11, 89, solarP);
  const sunScreenY = lerpNum(44, 17.5, solarArc);

  // Color of the solar disc transitions warm amber-orange near horizon -> blazing cream-white at midday
  const warmth = Math.pow(solarArc, 0.55);
  const sunCoreColor = lerpColorHex('#ff9e52', '#fff9e6', warmth);
  const sunCoronaColor = lerpColorHex('#ff7b3b', '#ffe6a6', warmth);

  // Lunar arc: moonrise at 19:15 (19.25) -> midnight apex -> moonset at 05:30 (5.5)
  const nightHour = h >= 19.25 ? h - 19.25 : h + 4.75;
  const nightSpan = 10.25;
  const lunarP = THREE.MathUtils.clamp(nightHour / nightSpan, 0, 1);
  const lunarArc = Math.sin(lunarP * Math.PI);

  const moonVisibility = Math.max(smoothstep(19.05, 19.75, h), 1 - smoothstep(5.1, 5.75, h));
  const moonScreenX = lerpNum(15, 85, lunarP);
  const moonScreenY = lerpNum(41, 18.5, lunarArc);

  // 3D directional light position follows real solar/lunar path
  const isDayDominant = sunVisibility >= moonVisibility;
  const activeSunPos = isDayDominant
    ? [lerpNum(-36, 36, solarP), lerpNum(13, 38, solarArc), lerpNum(20, 16, solarArc)]
    : [lerpNum(30, -30, lunarP), lerpNum(22, 34, lunarArc), 22];

  // Cloud directional shadow UV offset points toward the active Sun/Moon position
  const activeScreenX = isDayDominant ? sunScreenX : moonScreenX;
  const activeOffsetX = lerpNum(-0.02, 0.02, THREE.MathUtils.clamp((activeScreenX - 10) / 80, 0, 1));
  const activeOffsetY = lerpNum(0.026, 0.044, isDayDominant ? solarArc : lunarArc);

  return {
    sunVisibility,
    sunScreenX,
    sunScreenY,
    sunCoreColor,
    sunCoronaColor,
    moonVisibility,
    moonScreenX,
    moonScreenY,
    solarArc,
    activeSunPos,
    activeHaloX: isDayDominant ? sunScreenX : moonScreenX,
    activeHaloY: isDayDominant ? sunScreenY : moonScreenY,
    cloudSunOffset: [activeOffsetX, activeOffsetY],
  };
}

export function getTimeOfDayTheme(hour = resolveTargetHour()) {
  const h = ((hour % 24) + 24) % 24;
  let a = KEYFRAMES[0];
  let b = KEYFRAMES[KEYFRAMES.length - 1];

  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    if (h >= KEYFRAMES[i].hour && h <= KEYFRAMES[i + 1].hour) {
      a = KEYFRAMES[i];
      b = KEYFRAMES[i + 1];
      break;
    }
  }

  const span = Math.max(0.0001, b.hour - a.hour);
  const rawT = THREE.MathUtils.clamp((h - a.hour) / span, 0, 1);
  // Smoothstep easing prevents harsh linear jumps near sunrise/sunset boundaries
  const t = rawT * rawT * (3 - 2 * rawT);
  const celestial = getCelestialState(h);

  return {
    hour: h,
    phase: t < 0.5 ? a.phase : b.phase,
    celestial,
    sky: a.sky.map((col, idx) => lerpColorHex(col, b.sky[idx], t)),
    haloColor: lerpRgba(a.haloColor, b.haloColor, t),
    haloSecondary: lerpRgba(a.haloSecondary, b.haloSecondary, t),
    haloPos: [celestial.activeHaloX, celestial.activeHaloY],
    starOpacity: lerpNum(a.starOpacity, b.starOpacity, t),
    vignetteTop: lerpNum(a.vignetteTop, b.vignetteTop, t),
    cloud: {
      sunCol: lerpColorHex(a.cloud.sunCol, b.cloud.sunCol, t),
      midCol: lerpColorHex(a.cloud.midCol, b.cloud.midCol, t),
      shadowCol: lerpColorHex(a.cloud.shadowCol, b.cloud.shadowCol, t),
      mistCol: lerpColorHex(a.cloud.mistCol, b.cloud.mistCol, t),
      sunGlow: lerpVec3(a.cloud.sunGlow, b.cloud.sunGlow, t),
      cumulusOpacity: lerpNum(a.cloud.cumulusOpacity, b.cloud.cumulusOpacity, t),
      cirrusOpacity: lerpNum(a.cloud.cirrusOpacity, b.cloud.cirrusOpacity, t),
      sunOffset: celestial.cloudSunOffset,
    },
    light: {
      sunColor: lerpColorHex(a.light.sunColor, b.light.sunColor, t),
      sunIntensity: lerpNum(a.light.sunIntensity, b.light.sunIntensity, t),
      sunPos: celestial.activeSunPos,
      hemiSky: lerpColorHex(a.light.hemiSky, b.light.hemiSky, t),
      hemiGround: lerpColorHex(a.light.hemiGround, b.light.hemiGround, t),
      hemiIntensity: lerpNum(a.light.hemiIntensity, b.light.hemiIntensity, t),
      rimColor: lerpColorHex(a.light.rimColor, b.light.rimColor, t),
      rimIntensity: lerpNum(a.light.rimIntensity, b.light.rimIntensity, t),
      exposure: lerpNum(a.light.exposure, b.light.exposure, t),
    },
    arch: {
      glassLightEmissive: lerpColorHex(a.arch.glassLightEmissive, b.arch.glassLightEmissive, t),
      glassLightIntensity: lerpNum(a.arch.glassLightIntensity, b.arch.glassLightIntensity, t),
      glassEmissive: lerpColorHex(a.arch.glassEmissive, b.arch.glassEmissive, t),
      glassIntensity: lerpNum(a.arch.glassIntensity, b.arch.glassIntensity, t),
      signEmissiveIntensity: lerpNum(a.arch.signEmissiveIntensity, b.arch.signEmissiveIntensity, t),
      titleLower: lerpColorHex(a.arch.titleLower, b.arch.titleLower, t),
      titleUpper: lerpColorHex(a.arch.titleUpper, b.arch.titleUpper, t),
      envIntensity: lerpNum(a.arch.envIntensity, b.arch.envIntensity, t),
    },
  };
}

export function applySkyCssVars(stageEl, theme) {
  if (!stageEl || !theme) return;
  theme.sky.forEach((col, i) => stageEl.style.setProperty(`--sky-stop-${i + 1}`, col));
  stageEl.style.setProperty('--sky-halo-x', `${theme.haloPos[0].toFixed(1)}%`);
  stageEl.style.setProperty('--sky-halo-y', `${theme.haloPos[1].toFixed(1)}%`);
  stageEl.style.setProperty('--sky-halo-primary', theme.haloColor);
  stageEl.style.setProperty('--sky-halo-secondary', theme.haloSecondary);
  stageEl.style.setProperty('--star-opacity', theme.starOpacity.toFixed(3));
  stageEl.style.setProperty('--vignette-top', theme.vignetteTop.toFixed(3));
}
