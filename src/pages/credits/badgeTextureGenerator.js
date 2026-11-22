/**
 * ABES AUTONOMY — 3D IDENTITY BADGE TEXTURE GENERATOR
 * Generates high-resolution front and back ID card textures and lanyard ribbon textures
 * via HTML5 Canvas for Three.js materials.
 */

/**
 * Creates a procedural strap texture canvas with repeat pattern
 */
export function createStrapCanvas({ width = 1024, height = 128 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#1A1D27');
  bgGrad.addColorStop(0.3, '#10131B');
  bgGrad.addColorStop(0.7, '#0B0D13');
  bgGrad.addColorStop(1, '#1A1D27');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Micro weave pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
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
  ctx.strokeStyle = 'rgba(197, 172, 134, 0.75)';
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
  const streak = ctx.createLinearGradient(0, height * 0.48, 0, height * 0.52);
  streak.addColorStop(0, 'rgba(255, 255, 255, 0)');
  streak.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
  streak.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = streak;
  ctx.fillRect(0, height * 0.45, width, height * 0.1);

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
    ctx.letterSpacing = '3px';
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
 * Creates high-resolution front ID badge canvas
 */
export function createFrontBadgeCanvas(contributor, loadedImage, { width = 640, height = 960 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Background deep obsidian
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#151922');
  bg.addColorStop(0.35, '#0E1118');
  bg.addColorStop(0.85, '#080A0E');
  bg.addColorStop(1, '#050609');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Top punch slot hole (where lanyard clasp attaches)
  ctx.fillStyle = '#020305';
  ctx.beginPath();
  const slotW = 110;
  const slotH = 16;
  const slotX = (width - slotW) / 2;
  const slotY = 32;
  ctx.roundRect(slotX, slotY, slotW, slotH, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Subtle metallic outer border inset
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, width - 36, height - 36);

  // Top header banner
  ctx.fillStyle = '#0B0E14';
  ctx.fillRect(20, 68, width - 40, 78);
  ctx.strokeStyle = 'rgba(197, 172, 134, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(20, 68, width - 40, 78);

  // Gold shield crest icon
  drawShieldCrest(ctx, 48, 107, 24);

  // Header Title
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('ABES AUTONOMY', 90, 96);

  ctx.font = '700 10.5px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#C5AC86';
  ctx.fillText('OFFICIAL CONTRIBUTOR PASS • 2025–2026', 90, 120);

  // Contributor Portrait Area
  const photoW = 440;
  const photoH = 440;
  const photoX = (width - photoW) / 2;
  const photoY = 170;

  // Portrait background / placeholder
  ctx.fillStyle = '#0B0E14';
  ctx.beginPath();
  ctx.roundRect(photoX, photoY, photoW, photoH, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (loadedImage) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoW, photoH, 20);
    ctx.clip();

    // Calculate aspect ratio cover
    const imgAspect = loadedImage.width / loadedImage.height;
    const boxAspect = photoW / photoH;
    let sx = 0, sy = 0, sWidth = loadedImage.width, sHeight = loadedImage.height;

    if (imgAspect > boxAspect) {
      sWidth = loadedImage.height * boxAspect;
      sx = (loadedImage.width - sWidth) / 2;
    } else {
      sHeight = loadedImage.width / boxAspect;
      sy = (loadedImage.height - sHeight) / 2;
    }

    ctx.drawImage(loadedImage, sx, sy, sWidth, sHeight, photoX, photoY, photoW, photoH);

    // Subtle inner vignette
    const vig = ctx.createLinearGradient(0, photoY + photoH - 90, 0, photoY + photoH);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(11, 14, 20, 0.7)');
    ctx.fillStyle = vig;
    ctx.fillRect(photoX, photoY + photoH - 90, photoW, 90);

    ctx.restore();
  } else {
    // Placeholder monogram
    ctx.font = 'bold 72px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#C5AC86';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initials = (contributor?.name || 'ABES')
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('');
    ctx.fillText(initials, width / 2, photoY + photoH / 2);
  }

  // Hologram Security Chip Icon (Gold embossed chip)
  drawChip(ctx, photoX + photoW - 55, photoY + 22, 36, 28);

  // Identity Details Area
  const infoY = 640;

  // Name
  ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(contributor?.name || 'Contributor', width / 2, infoY);

  // Role Pill
  const roleText = (contributor?.role || 'Core Team').toUpperCase();
  ctx.font = '700 14px -apple-system, BlinkMacSystemFont, sans-serif';
  const roleMetrics = ctx.measureText(roleText);
  const pillW = Math.max(roleMetrics.width + 36, 160);
  const pillH = 32;
  const pillX = (width - pillW) / 2;
  const pillY = infoY + 48;

  ctx.fillStyle = 'rgba(197, 172, 134, 0.14)';
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(197, 172, 134, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#DFCAAA';
  ctx.textBaseline = 'middle';
  ctx.fillText(roleText, width / 2, pillY + pillH / 2);

  // Academic Affiliation
  ctx.font = '500 15px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.textBaseline = 'top';
  ctx.fillText('ABES Engineering College • Computer Science', width / 2, pillY + 44);

  // Bottom Card Barcode & ID Strip
  const stripY = 780;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.fillRect(40, stripY, width - 80, 110);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, stripY, width - 80, 110);

  // Realistic Barcode
  drawBarcode(ctx, 70, stripY + 20, width - 140, 48, contributor?._id || 'ABES-01');

  // Badge ID & Security Code
  ctx.font = '600 12px "SF Mono", monospace, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.textAlign = 'center';
  ctx.fillText(`AUTH-ID: ABES-2026-${(contributor?._id || '01').replace(/^m-/, '').padStart(3, '0')} // VERIFIED SECURE`, width / 2, stripY + 84);

  // Bottom subtle watermark
  ctx.font = '600 11px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = 'rgba(197, 172, 134, 0.45)';
  ctx.fillText('★ ACADEMIC RESOURCE ARCHITECTURE ★', width / 2, height - 32);

  return canvas;
}

/**
 * Creates high-resolution back ID badge canvas
 */
export function createBackBadgeCanvas(contributor, { width = 640, height = 960 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Deep obsidian background with carbon weave gradient
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#090B0F');
  bg.addColorStop(0.5, '#0E1117');
  bg.addColorStop(1, '#05070A');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Micro carbon pattern
  ctx.fillStyle = 'rgba(255, 255, 255, 0.012)';
  for (let x = 0; x < width; x += 12) {
    for (let y = 0; y < height; y += 12) {
      if ((x + y) % 24 === 0) {
        ctx.fillRect(x, y, 6, 6);
      }
    }
  }

  // Top punch slot
  ctx.fillStyle = '#020305';
  ctx.beginPath();
  const slotW = 110;
  const slotH = 16;
  const slotX = (width - slotW) / 2;
  const slotY = 32;
  ctx.roundRect(slotX, slotY, slotW, slotH, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Magnetic strip simulation (like physical cards)
  ctx.fillStyle = '#111319';
  ctx.fillRect(20, 70, width - 40, 72);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  ctx.strokeRect(20, 70, width - 40, 72);

  // Magnetic stripe fine texture
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(20, 85, width - 40, 42);

  // Outer border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, width - 36, height - 36);

  // Big Central Gold Crest
  drawLargeGoldCrest(ctx, width / 2, 280, 68);

  // Title
  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('ABES AUTONOMY', width / 2, 380);

  ctx.font = '700 13px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#C5AC86';
  ctx.fillText('ACADEMIC PREPARATION PLATFORM', width / 2, 420);

  // Divider line
  ctx.strokeStyle = 'rgba(197, 172, 134, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(120, 450);
  ctx.lineTo(width - 120, 450);
  ctx.stroke();

  // Contributor statement / quote
  const quote = contributor?.description || 'Crafting accessible digital engineering resources.';
  ctx.font = 'italic 18px "Georgia", serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'center';
  wrapText(ctx, `"${quote}"`, width / 2, 480, 480, 28);

  // Contributor Profile Details Box
  const boxY = 620;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.beginPath();
  ctx.roundRect(50, boxY, width - 100, 180, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Key-value pairs inside box
  ctx.font = '600 12px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#C5AC86';
  ctx.textAlign = 'left';
  ctx.fillText('DESIGNATION', 80, boxY + 28);
  ctx.fillText('DEPARTMENT', 80, boxY + 76);
  ctx.fillText('STATUS', 80, boxY + 124);

  ctx.font = '600 15px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(contributor?.role || 'Contributor', 80, boxY + 48);
  ctx.fillText('ABES Engineering College', 80, boxY + 96);
  ctx.fillText('Active Architecture Contributor', 80, boxY + 144);

  // Bottom Notice
  ctx.font = '500 11px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.textAlign = 'center';
  ctx.fillText('Property of ABES Autonomy • www.abes.work', width / 2, height - 60);
  ctx.fillText('Handcrafted with Three.js & Apple Liquid Glass', width / 2, height - 42);

  return canvas;
}

/* Helper functions for canvas graphics */

function drawShieldCrest(ctx, cx, cy, size) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = '#DFCAAA';
  ctx.lineWidth = 2.5;
  ctx.fillStyle = 'rgba(197, 172, 134, 0.15)';

  ctx.beginPath();
  ctx.moveTo(-size * 0.7, -size * 0.8);
  ctx.lineTo(size * 0.7, -size * 0.8);
  ctx.lineTo(size * 0.7, 0);
  ctx.quadraticCurveTo(size * 0.7, size * 0.9, 0, size * 1.1);
  ctx.quadraticCurveTo(-size * 0.7, size * 0.9, -size * 0.7, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawLargeGoldCrest(ctx, cx, cy, radius) {
  ctx.save();
  ctx.translate(cx, cy);

  // Outer glowing ring
  ctx.strokeStyle = 'rgba(197, 172, 134, 0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Inner shield
  const s = radius * 0.65;
  ctx.fillStyle = 'rgba(197, 172, 134, 0.12)';
  ctx.strokeStyle = '#DFCAAA';
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(-s, -s);
  ctx.lineTo(s, -s);
  ctx.lineTo(s, s * 0.2);
  ctx.quadraticCurveTo(s, s * 1.2, 0, s * 1.5);
  ctx.quadraticCurveTo(-s, s * 1.2, -s, s * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Gold monogram 'ABES'
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#DFCAAA';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ABES', 0, 0);

  ctx.restore();
}

function drawChip(ctx, x, y, w, h) {
  ctx.save();
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, '#E5C07B');
  grad.addColorStop(0.5, '#D19A66');
  grad.addColorStop(1, '#986801');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Internal chip contact lines
  ctx.strokeStyle = 'rgba(50, 30, 0, 0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.35, y);
  ctx.lineTo(x + w * 0.35, y + h);
  ctx.moveTo(x + w * 0.65, y);
  ctx.lineTo(x + w * 0.65, y + h);
  ctx.moveTo(x, y + h * 0.5);
  ctx.lineTo(x + w, y + h * 0.5);
  ctx.stroke();
  ctx.restore();
}

function drawBarcode(ctx, x, y, width, height, seed = '') {
  ctx.save();
  ctx.fillStyle = '#E5E5EA';
  let curX = x;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;

  while (curX < x + width) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    const barW = (hash % 3) + 1.5;
    const gapW = ((hash >> 4) % 3) + 1.5;
    if (curX + barW > x + width) break;
    ctx.fillRect(curX, y, barW, height);
    curX += barW + gapW;
  }
  ctx.restore();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let curY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, curY);
}
