/**
 * ABES AUTONOMY — 3D IDENTITY BADGE TEXTURE GENERATOR
 * Generates high-resolution front (photograph-only) and back (complete profile)
 * textures and lanyard ribbon textures via HTML5 Canvas for Three.js WebGL materials.
 */

// Canonical UV hit regions for interactive social buttons on the 3D card back
export const SOCIAL_HIT_REGIONS = {
  github: {
    uMin: 0.088,
    uMax: 0.485,
    vMin: 0.225,
    vMax: 0.288,
  },
  linkedin: {
    uMin: 0.515,
    uMax: 0.912,
    vMin: 0.225,
    vMax: 0.288,
  },
  instagram: {
    uMin: 0.220,
    uMax: 0.780,
    vMin: 0.150,
    vMax: 0.213,
  },
};

/**
 * Checks if a UV intersection point from Three.js raycasting falls within a social button
 * @param {{ x: number, y: number }} uv - UV coordinates (0-1) from raycast intersection
 * @param {object} contributor - Active contributor data object
 * @returns {{ type: string, url: string } | null}
 */
export function getSocialHitFromUV(uv, contributor) {
  if (!uv || !contributor) return null;
  const { x: u, y: v } = uv;

  // GitHub
  if (
    contributor.github &&
    u >= SOCIAL_HIT_REGIONS.github.uMin &&
    u <= SOCIAL_HIT_REGIONS.github.uMax &&
    v >= SOCIAL_HIT_REGIONS.github.vMin &&
    v <= SOCIAL_HIT_REGIONS.github.vMax
  ) {
    return { type: 'github', url: contributor.github, label: 'GitHub' };
  }

  // LinkedIn
  if (
    contributor.linkedin &&
    u >= SOCIAL_HIT_REGIONS.linkedin.uMin &&
    u <= SOCIAL_HIT_REGIONS.linkedin.uMax &&
    v >= SOCIAL_HIT_REGIONS.linkedin.vMin &&
    v <= SOCIAL_HIT_REGIONS.linkedin.vMax
  ) {
    return { type: 'linkedin', url: contributor.linkedin, label: 'LinkedIn' };
  }

  // Instagram
  if (
    contributor.instagram &&
    u >= SOCIAL_HIT_REGIONS.instagram.uMin &&
    u <= SOCIAL_HIT_REGIONS.instagram.uMax &&
    v >= SOCIAL_HIT_REGIONS.instagram.vMin &&
    v <= SOCIAL_HIT_REGIONS.instagram.vMax
  ) {
    return { type: 'instagram', url: contributor.instagram, label: 'Instagram' };
  }

  return null;
}

/**
 * Creates procedural woven strap ribbon canvas with gold stitching and repeating brand typography
 */
export function createStrapCanvas({ width = 1024, height = 128 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#1E222D');
  bgGrad.addColorStop(0.3, '#12151E');
  bgGrad.addColorStop(0.7, '#0C0E14');
  bgGrad.addColorStop(1, '#1E222D');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Micro-weave texture
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  const step = 6;
  for (let x = 0; x < width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + step * 2, height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + step * 2, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Top & bottom edge gold stitching
  ctx.strokeStyle = 'rgba(197, 172, 134, 0.85)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.lineTo(width, 10);
  ctx.moveTo(0, height - 10);
  ctx.lineTo(width, height - 10);
  ctx.stroke();
  ctx.setLineDash([]);

  // Central highlight streak
  const streak = ctx.createLinearGradient(0, height * 0.45, 0, height * 0.55);
  streak.addColorStop(0, 'rgba(255, 255, 255, 0)');
  streak.addColorStop(0.5, 'rgba(255, 255, 255, 0.12)');
  streak.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = streak;
  ctx.fillRect(0, height * 0.44, width, height * 0.12);

  // Repeating brand text
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const blockWidth = 512;
  const numBlocks = Math.ceil(width / blockWidth) + 1;

  for (let b = 0; b < numBlocks; b++) {
    const ox = b * blockWidth;

    // Diamond emblem
    ctx.fillStyle = '#DFCAAA';
    ctx.beginPath();
    ctx.arc(ox + 30, height / 2, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Brand text
    ctx.fillStyle = '#C5AC86';
    ctx.fillText('ABES AUTONOMY', ox + 48, height / 2);

    // Separator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(ox + 300, height / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Secondary text
    ctx.font = '600 17px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = 'rgba(245, 245, 247, 0.85)';
    ctx.fillText('STUDENT PLATFORM', ox + 320, height / 2);
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
  }

  return canvas;
}

/**
 * Creates high-resolution front badge canvas: PHOTOGRAPH ONLY (Zero text, zero labels, full-bleed portrait)
 * @param {HTMLImageElement|ImageBitmap} img - Preloaded image
 * @param {object} options - Focal positioning and dimensions
 */
export function createPhotoBadgeCanvas(img, {
  focalX = 0.5,
  focalY = 0.35,
  width = 1024,
  height = 1516,
  fallbackName = 'Contributor'
} = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  if (img && (img.naturalWidth || img.width)) {
    const nw = img.naturalWidth || img.width;
    const nh = img.naturalHeight || img.height;

    const imgRatio = nw / nh;
    const canvasRatio = width / height;

    let sW, sH, sX, sY;
    if (imgRatio > canvasRatio) {
      sH = nh;
      sW = sH * canvasRatio;
      sX = (nw - sW) * focalX;
      sY = 0;
    } else {
      sW = nw;
      sH = sW / canvasRatio;
      sX = 0;
      sY = (nh - sH) * focalY;
    }

    sX = Math.max(0, Math.min(nw - sW, sX));
    sY = Math.max(0, Math.min(nh - sH, sY));

    // Draw full-bleed photograph
    ctx.drawImage(img, sX, sY, sW, sH, 0, 0, width, height);

    // Subtle edge highlight so acrylic card perimeter looks physically grounded
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, width - 3, height - 3);

    // Very subtle glossy bottom vignette for physical depth
    const bottomVignette = ctx.createLinearGradient(0, height * 0.85, 0, height);
    bottomVignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    bottomVignette.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
    ctx.fillStyle = bottomVignette;
    ctx.fillRect(0, height * 0.85, width, height * 0.15);

  } else {
    // Elegant obsidian fallback with monogram initials if photo is still loading
    const bg = ctx.createRadialGradient(width / 2, height * 0.45, 60, width / 2, height / 2, width);
    bg.addColorStop(0, '#1E2330');
    bg.addColorStop(0.6, '#0E1118');
    bg.addColorStop(1, '#06080C');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Clean subtle monogram
    const initials = (fallbackName || 'ABES')
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('');

    ctx.font = 'bold 96px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
    ctx.fillStyle = '#DFCAAA';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, width / 2, height / 2);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, width - 4, height - 4);
  }

  return canvas;
}

/**
 * Creates high-resolution back ID badge canvas with full contributor profile & clickable social buttons
 */
export function createBackBadgeCanvas(contributor, { width = 1024, height = 1516 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Deep obsidian carbon background
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#090B10');
  bg.addColorStop(0.5, '#0E1118');
  bg.addColorStop(1, '#05070A');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Subtle radial ambient glow behind crest
  const glow = ctx.createRadialGradient(width / 2, 260, 20, width / 2, 260, 360);
  glow.addColorStop(0, 'rgba(197, 172, 134, 0.14)');
  glow.addColorStop(0.6, 'rgba(197, 172, 134, 0.03)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 60, width, 400);

  // Micro carbon pattern
  ctx.fillStyle = 'rgba(255, 255, 255, 0.012)';
  for (let x = 0; x < width; x += 16) {
    for (let y = 0; y < height; y += 16) {
      if ((x + y) % 32 === 0) {
        ctx.fillRect(x, y, 8, 8);
      }
    }
  }

  // Outer border with subtle corner inset
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, width - 48, height - 48);

  // Top Punch Slot Simulation
  ctx.fillStyle = '#020305';
  ctx.beginPath();
  const slotW = 160;
  const slotH = 22;
  const slotX = (width - slotW) / 2;
  const slotY = 44;
  ctx.roundRect(slotX, slotY, slotW, slotH, 11);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 1. BRAND HEADER: Large Gold Crest & Title
  drawLargeGoldCrest(ctx, width / 2, 210, 84);

  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('ABES AUTONOMY', width / 2, 310);

  ctx.font = '700 15px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#C5AC86';
  ctx.fillText('CONTRIBUTOR IDENTITY // 2024–2028', width / 2, 358);

  // Divider Line
  ctx.strokeStyle = 'rgba(197, 172, 134, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(140, 395);
  ctx.lineTo(width - 140, 395);
  ctx.stroke();

  // Central Gold Diamond on Divider
  ctx.fillStyle = '#DFCAAA';
  ctx.beginPath();
  ctx.moveTo(width / 2, 388);
  ctx.lineTo(width / 2 + 7, 395);
  ctx.lineTo(width / 2, 402);
  ctx.lineTo(width / 2 - 7, 395);
  ctx.closePath();
  ctx.fill();

  // 2. CONTRIBUTOR FULL NAME
  const nameY = 430;
  ctx.font = 'bold 50px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(contributor?.name || 'Contributor', width / 2, nameY);

  // 3. ROLE / DESIGNATION PILL
  const roleText = (contributor?.role || 'Core Team').toUpperCase();
  ctx.font = '700 16px -apple-system, BlinkMacSystemFont, sans-serif';
  const roleMetrics = ctx.measureText(roleText);
  const pillW = Math.max(roleMetrics.width + 48, 220);
  const pillH = 42;
  const pillX = (width - pillW) / 2;
  const pillY = nameY + 68;

  ctx.fillStyle = 'rgba(197, 172, 134, 0.14)';
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 21);
  ctx.fill();
  ctx.strokeStyle = 'rgba(197, 172, 134, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#DFCAAA';
  ctx.textBaseline = 'middle';
  ctx.fillText(roleText, width / 2, pillY + pillH / 2);

  // Department
  ctx.font = '500 17px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.textBaseline = 'top';
  ctx.fillText('ABES Engineering College • Verified Contributor', width / 2, pillY + 54);

  // 4. BIOGRAPHY / QUOTE STATEMENT
  const quoteY = 620;
  const quote = contributor?.description || 'Crafting accessible digital engineering resources.';
  
  // Frosted Quote Card Box
  const qBoxW = width - 160;
  const qBoxH = 170;
  const qBoxX = 80;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.beginPath();
  ctx.roundRect(qBoxX, quoteY, qBoxW, qBoxH, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Ambient Quote Mark Icon
  ctx.font = 'bold 72px "Georgia", serif';
  ctx.fillStyle = 'rgba(197, 172, 134, 0.22)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('“', qBoxX + 24, quoteY + 12);

  // Quote Text
  ctx.font = 'italic 24px "Georgia", serif';
  ctx.fillStyle = 'rgba(245, 245, 247, 0.92)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  wrapText(ctx, `“${quote}”`, width / 2, quoteY + qBoxH / 2 + 8, qBoxW - 60, 36);

  // 5. SECONDARY DIVIDER
  const divY2 = 830;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, divY2);
  ctx.lineTo(width - 120, divY2);
  ctx.stroke();

  // Social Links Header
  ctx.font = '700 14px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#C5AC86';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VERIFIED PROFILES & LINKS', width / 2, divY2 + 28);

  // 6. INTERACTIVE SOCIAL LINK BUTTONS (MATCHING SOCIAL_HIT_REGIONS)
  // Button 1: GitHub (Row 1 Left: x=100..490, y=1080..1168)
  drawSocialButton(
    ctx,
    100,
    1080,
    390,
    88,
    'GitHub',
    contributor?.github,
    'github'
  );

  // Button 2: LinkedIn (Row 1 Right: x=534..924, y=1080..1168)
  drawSocialButton(
    ctx,
    534,
    1080,
    390,
    88,
    'LinkedIn',
    contributor?.linkedin,
    'linkedin'
  );

  // Button 3: Instagram (Row 2 Center: x=232..792, y=1195..1283)
  drawSocialButton(
    ctx,
    232,
    1195,
    560,
    88,
    'Instagram',
    contributor?.instagram,
    'instagram'
  );

  // 7. BOTTOM VERIFICATION FOOTER
  const footerY = 1350;
  ctx.font = '600 14px "SF Mono", monospace, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const badgeId = (contributor?._id || '01').replace(/^m-/, '').padStart(3, '0');
  ctx.fillText(`AUTH-ID: ABES-2026-${badgeId} // VERIFIED CORE TEAM`, width / 2, footerY);

  ctx.font = '500 13px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = 'rgba(197, 172, 134, 0.65)';
  ctx.fillText('★ OFFICIAL ABES AUTONOMY ACADEMIC PLATFORM ★', width / 2, footerY + 28);

  ctx.font = '500 12px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillText('Tap links to visit verified profiles • Tap card to return', width / 2, footerY + 54);

  return canvas;
}

/**
 * Draws a glass social button on the canvas
 */
function drawSocialButton(ctx, x, y, w, h, label, url, type) {
  const isAvailable = Boolean(url);

  // Button pill background
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);

  if (isAvailable) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Top specular highlight
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, w - 4, h / 2 - 2, [h / 2, h / 2, 0, 0]);
    const topGleam = ctx.createLinearGradient(0, y, 0, y + h / 2);
    topGleam.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
    topGleam.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = topGleam;
    ctx.fill();
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Draw Icon
  const iconX = x + 36;
  const iconY = y + h / 2;
  drawSocialGlyph(ctx, iconX, iconY, type, isAvailable);

  // Draw Text
  ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
  ctx.fillStyle = isAvailable ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, iconX + 28, iconY);

  // Draw Arrow indicator
  if (isAvailable) {
    ctx.font = '600 18px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#DFCAAA';
    ctx.textAlign = 'right';
    ctx.fillText('↗', x + w - 32, iconY);
  }

  ctx.restore();
}

/**
 * Draws simple vector glyphs for social platforms
 */
function drawSocialGlyph(ctx, cx, cy, type, active) {
  ctx.save();
  ctx.fillStyle = active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)';
  ctx.strokeStyle = active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2.5;

  if (type === 'github') {
    // Circle with cat ears representation
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'linkedin') {
    // Square with 'in' symbol
    ctx.beginPath();
    ctx.roundRect(cx - 14, cy - 14, 28, 28, 6);
    ctx.stroke();
    ctx.font = 'bold 15px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('in', cx, cy);
  } else if (type === 'instagram') {
    // Rounded camera rect with center lens
    ctx.beginPath();
    ctx.roundRect(cx - 14, cy - 14, 28, 28, 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 8, cy - 8, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Draws the ABES Autonomy Gold Crest
 */
function drawLargeGoldCrest(ctx, cx, cy, radius) {
  ctx.save();
  const grad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.3, '#DFCAAA');
  grad.addColorStop(1, '#C5AC86');

  // Shield Path
  ctx.beginPath();
  const w = radius * 1.5;
  const h = radius * 1.9;
  const left = cx - w / 2;
  const right = cx + w / 2;
  const top = cy - h / 2;
  const bottom = cy + h / 2;

  ctx.moveTo(left, top);
  ctx.lineTo(right, top);
  ctx.lineTo(right, cy + h * 0.1);
  ctx.bezierCurveTo(right, bottom - 10, cx, bottom, cx, bottom);
  ctx.bezierCurveTo(cx, bottom, left, bottom - 10, left, cy + h * 0.1);
  ctx.closePath();

  ctx.fillStyle = 'rgba(12, 14, 18, 0.9)';
  ctx.fill();
  ctx.strokeStyle = grad;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Shield Inner Border
  ctx.beginPath();
  const inScale = 0.85;
  const inW = w * inScale;
  const inH = h * inScale;
  const inL = cx - inW / 2;
  const inR = cx + inW / 2;
  const inT = cy - inH / 2;
  const inB = cy + inH / 2;

  ctx.moveTo(inL, inT);
  ctx.lineTo(inR, inT);
  ctx.lineTo(inR, cy + inH * 0.1);
  ctx.bezierCurveTo(inR, inB - 8, cx, inB, cx, inB);
  ctx.bezierCurveTo(cx, inB, inL, inB - 8, inL, cy + inH * 0.1);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(197, 172, 134, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Word ABES inside shield
  ctx.font = '800 24px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
  ctx.fillStyle = grad;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ABES', cx, cy - 8);

  // Star Emblem
  ctx.beginPath();
  ctx.arc(cx, cy + 22, 6, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.restore();
}

/**
 * Multi-line canvas text wrapping utility
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);

  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  for (let k = 0; k < lines.length; k++) {
    ctx.fillText(lines[k], x, startY + k * lineHeight);
  }
}
