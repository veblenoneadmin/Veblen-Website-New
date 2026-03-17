/* ============================================
   VEBLEN GROUP v2 — MAIN JAVASCRIPT
   ============================================ */

/* ---- ALWAYS START FROM TOP ON REFRESH ---- */
window.scrollTo(0, 0);
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

/* ---- BACKGROUND AUDIO ---- */
(function initBgAudio() {
  const audio = document.getElementById('bg-audio');
  if (!audio) return;
  audio.volume = 0.4;
  let started = false;

  function tryPlay() {
    if (started) return;
    audio.play().then(() => {
      started = true;
    }).catch(() => {
      // Browser blocked — will retry on interaction
      started = false;
    });
  }

  // Try immediately on page load
  tryPlay();

  // Fallback: retry on any user interaction if browser blocked autoplay
  ['click', 'scroll', 'keydown', 'touchstart', 'mousedown'].forEach(evt => {
    document.addEventListener(evt, tryPlay, { once: false, passive: true });
  });
})();

/* ---- SMOOTH SCROLL (Lenis — fixes Windows wheel jumping) ---- */
const lenis = new Lenis({
  duration: 1.2,
  easing: function(t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
  touchMultiplier: 2,
  infinite: false,
});
function lenisRaf(time) {
  lenis.raf(time);
  requestAnimationFrame(lenisRaf);
}
requestAnimationFrame(lenisRaf);

/* ---- CUSTOM CURSOR (desktop only) ---- */
const cursor = document.querySelector('.cursor');
const cursorRing = document.querySelector('.cursor-ring');
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 768;
let mouseX = 0, mouseY = 0;
let ringX = 0, ringY = 0;

if (!isTouchDevice) {
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
  });

  (function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top  = ringY + 'px';
    requestAnimationFrame(animateRing);
  })();

  document.querySelectorAll('a, button, .tier, .who-item').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.width = '14px';
      cursor.style.height = '14px';
      cursorRing.style.width = '56px';
      cursorRing.style.height = '56px';
      cursorRing.style.borderColor = 'rgba(201,146,42,0.8)';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.width = '8px';
      cursor.style.height = '8px';
      cursorRing.style.width = '36px';
      cursorRing.style.height = '36px';
      cursorRing.style.borderColor = 'rgba(201,146,42,0.5)';
    });
  });
}

/* ---- INTRO SEQUENCE ---- */
const introScene   = document.getElementById('intro-scene');
const scrollWrapper = document.getElementById('scroll-wrapper');
const navbarEl     = document.getElementById('navbar');
const heroLogo     = document.getElementById('hero-logo');

// Hide navbar and hero logo during intro
navbarEl.style.opacity = '0';
navbarEl.style.pointerEvents = 'none';
heroLogo.style.opacity = '0';

setTimeout(() => {
  introScene.classList.add('hidden');
  setTimeout(() => {
    introScene.style.display = 'none';
    // Show navbar
    navbarEl.style.transition = 'opacity 0.6s ease';
    navbarEl.style.opacity = '1';
    navbarEl.style.pointerEvents = '';
    // Show content
    scrollWrapper.classList.add('visible');
    // Show hero logo
    heroLogo.style.opacity = '1';
    // Show hero words
    document.querySelectorAll('.hero-word-el').forEach(el => { el.style.opacity = '1'; });
    // Show fixed CTA
    setTimeout(() => {
      document.querySelector('.fixed-cta').classList.add('visible');
    }, 800);
    // Init logo animation
    initLogoAnimation();
    // Init character explosion for end of hero
    initCharExplosion();
    // Init amber door + debris system
    initDoorSystem();
  }, 1200);
}, 2600); // intro duration

/* ---- AMBER DOOR + DEBRIS ANIMATION SYSTEM ---- */
/*
  Phase 1: Realistic wood door fragments scattered, interactive
  Phase 2: Fragments assemble into tight door frame — SYNCED with word merge
  Phase 3: Word cycling inside frame
  Phase 4: Frame reshapes to vertical door + becomes solid with knob (left)
  Phase 5: Door slowly opens WHILE zooming in simultaneously → white → About

  IMPORTANT: body.background is ONLY set during portal zoom, and ALWAYS cleared otherwise.
*/
function initDoorSystem() {
  const canvas = document.getElementById('debris-canvas');
  const door = document.getElementById('amber-door');
  const heroScene = document.getElementById('scene-hero');
  const portalScene = document.getElementById('scene-door-portal');
  const elOwn = document.getElementById('hw-own');
  const elThe = document.getElementById('hw-the');
  const elMarket = document.getElementById('hw-market');

  if (!canvas || !door || !heroScene) return;

  const ctx = canvas.getContext('2d');
  let cW = window.innerWidth;
  let cH = window.innerHeight;
  canvas.width = cW;
  canvas.height = cH;
  canvas.classList.add('interactive');

  window.addEventListener('resize', () => {
    cW = window.innerWidth; cH = window.innerHeight;
    canvas.width = cW; canvas.height = cH;
  });

  // === WOOD DOOR FRAGMENTS ===
  const PIECE_COUNT = 18;
  const pieces = [];
  const AMB = { r: 201, g: 146, b: 42 };
  // Pre-generate a small wood texture pattern
  const woodPattern = (function() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const x = c.getContext('2d');
    // Base wood color
    x.fillStyle = '#b8873a';
    x.fillRect(0, 0, 64, 64);
    // Dark grain lines
    x.strokeStyle = 'rgba(90,55,10,0.3)';
    x.lineWidth = 1;
    for (let i = 0; i < 64; i += 3 + Math.random() * 4) {
      x.beginPath();
      x.moveTo(0, i);
      x.bezierCurveTo(16, i + (Math.random()-0.5)*3, 48, i + (Math.random()-0.5)*3, 64, i + (Math.random()-0.5)*2);
      x.stroke();
    }
    // Light grain highlights
    x.strokeStyle = 'rgba(220,180,100,0.15)';
    for (let i = 2; i < 64; i += 5 + Math.random() * 6) {
      x.beginPath();
      x.moveTo(0, i);
      x.lineTo(64, i + (Math.random()-0.5)*2);
      x.stroke();
    }
    return ctx.createPattern(c, 'repeat');
  })();

  for (let i = 0; i < PIECE_COUNT; i++) {
    const nv = 4 + Math.floor(Math.random() * 3);
    const verts = [];
    const sz = 18 + Math.random() * 30;
    for (let v = 0; v < nv; v++) {
      const a = (v / nv) * Math.PI * 2 + (Math.random() - 0.5) * 0.9;
      const d = sz * (0.35 + Math.random() * 0.65);
      verts.push({ x: Math.cos(a) * d, y: Math.sin(a) * d });
    }
    const thickness = 3 + Math.random() * 5;
    const shade = 0.6 + Math.random() * 0.4;

    pieces.push({
      scatterX: Math.random() * cW,
      scatterY: Math.random() * cH,
      scatterRot: (Math.random() - 0.5) * Math.PI * 4,
      targetX: 0, targetY: 0, targetRot: 0,
      x: 0, y: 0, rot: 0,
      verts, thickness, shade,
      userRot: 0, frameW: 0, frameH: 0
    });
  }

  // === MOUSE ===
  let mx = -9999, my = -9999;
  canvas.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  canvas.addEventListener('mouseleave', () => { mx = -9999; my = -9999; });

  // === FRAME TARGETS — tight around text ===
  function calcFrameTargets(rect) {
    const { x, y, w, h } = rect;
    const bw = 8; // thicker frame border so bars form a visible frame
    const perim = 2 * (w + h);
    const seg = perim / PIECE_COUNT;
    for (let i = 0; i < PIECE_COUNT; i++) {
      const d = i * seg;
      let tx, ty, tr, fw, fh;
      if (d < w) {
        tx = x + d + seg / 2; ty = y; tr = 0; fw = seg + 4; fh = bw;
      } else if (d < w + h) {
        tx = x + w; ty = y + (d - w) + seg / 2; tr = Math.PI / 2; fw = seg + 4; fh = bw;
      } else if (d < 2 * w + h) {
        tx = x + w - (d - w - h) - seg / 2; ty = y + h; tr = Math.PI; fw = seg + 4; fh = bw;
      } else {
        tx = x; ty = y + h - (d - 2 * w - h) - seg / 2; tr = -Math.PI / 2; fw = seg + 4; fh = bw;
      }
      // Clamp targets to stay within frame bounds
      pieces[i].targetX = Math.max(x, Math.min(x + w, tx));
      pieces[i].targetY = Math.max(y, Math.min(y + h, ty));
      pieces[i].targetRot = tr;
      pieces[i].frameW = fw;
      pieces[i].frameH = fh;
    }
  }

  function getTextBounds() {
    const els = [elOwn, elThe, elMarket].filter(e => e && e.style.opacity !== '0');
    if (els.length === 0) return { x: cW/2 - 250, y: cH/2 - 80, w: 500, h: 160 };
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    els.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.left < x1) x1 = r.left;
      if (r.top < y1) y1 = r.top;
      if (r.right > x2) x2 = r.right;
      if (r.bottom > y2) y2 = r.bottom;
    });
    const pad = 18; // tight padding
    return { x: x1 - pad, y: y1 - pad, w: (x2 - x1) + pad * 2, h: (y2 - y1) + pad * 2 };
  }

  const DOOR_W = 220;
  const DOOR_H = 420;

  // === DRAW 3D WOOD FRAGMENT ===
  function drawFragment(p, morphT) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot + p.userRot * (1 - morphT));

    const hw = (p.frameW || 20) / 2;
    const hh = (p.frameH || 6) / 2;

    // Build shape path (morph from shard → bar)
    // morphT < 0.7: interpolate vertices (still irregular)
    // morphT 0.7→0.85: blend toward perfect rectangle
    // morphT >= 0.85: perfect rectangle
    function shapePath() {
      ctx.beginPath();
      if (morphT >= 0.85) {
        // Perfect rectangle
        ctx.rect(-hw, -hh, hw * 2, hh * 2);
      } else if (morphT > 0.7) {
        // Blend: interpolated vertices → perfect rect corners
        const rectT = (morphT - 0.7) / 0.15; // 0→1
        // Perfect rect corners: TL, TR, BR, BL
        const rectCorners = [{x:-hw,y:-hh},{x:hw,y:-hh},{x:hw,y:hh},{x:-hw,y:hh}];
        p.verts.forEach((v, idx) => {
          // Target: nearest rect corner based on vertex angle
          const cornerIdx = Math.min(idx, rectCorners.length - 1);
          const rc = rectCorners[cornerIdx];
          // Interpolated position
          const bx = (idx < p.verts.length / 2 ? -hw : hw);
          const by = (idx < p.verts.length / 2 ? -hh : hh);
          const ix = v.x + (bx - v.x) * morphT;
          const iy = v.y + (by - v.y) * morphT;
          // Blend toward perfect corner
          const fx = ix + (rc.x - ix) * rectT;
          const fy = iy + (rc.y - iy) * rectT;
          idx === 0 ? ctx.moveTo(fx, fy) : ctx.lineTo(fx, fy);
        });
      } else {
        // Normal vertex interpolation
        p.verts.forEach((v, idx) => {
          const bx = (idx < p.verts.length / 2 ? -hw : hw);
          const by = (idx < p.verts.length / 2 ? -hh : hh);
          const ix = v.x + (bx - v.x) * morphT;
          const iy = v.y + (by - v.y) * morphT;
          idx === 0 ? ctx.moveTo(ix, iy) : ctx.lineTo(ix, iy);
        });
      }
      ctx.closePath();
    }

    // 3D side face (depth)
    if (morphT < 0.8) {
      const th = p.thickness * (1 - morphT);
      ctx.save();
      ctx.translate(th * 0.4, th * 0.6);
      shapePath();
      ctx.fillStyle = `rgb(${Math.round(AMB.r * p.shade * 0.4)}, ${Math.round(AMB.g * p.shade * 0.4)}, ${Math.round(AMB.b * p.shade * 0.4)})`;
      ctx.fill();
      ctx.restore();
    }

    // Top face with wood texture
    shapePath();
    ctx.save();
    ctx.clip();
    // Wood pattern fill
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = woodPattern;
    ctx.fillRect(-40, -40, 80, 80);
    ctx.globalAlpha = 1;
    // Amber tint overlay
    ctx.fillStyle = `rgba(${Math.round(AMB.r * p.shade)}, ${Math.round(AMB.g * p.shade)}, ${Math.round(AMB.b * p.shade)}, 0.55)`;
    ctx.fillRect(-40, -40, 80, 80);
    ctx.restore();

    // Re-draw shape for stroke
    shapePath();
    // Top highlight edge
    ctx.strokeStyle = `rgba(255,220,150,${0.25 * (1 - morphT * 0.5)})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Drop shadow
    if (morphT < 0.7) {
      ctx.shadowColor = `rgba(0,0,0,${0.3 * (1 - morphT)})`;
      ctx.shadowBlur = 10 * (1 - morphT);
      ctx.shadowOffsetX = 3 * (1 - morphT);
      ctx.shadowOffsetY = 5 * (1 - morphT);
    }

    ctx.restore();
  }

  // === DRAW SOLID DOOR ===
  // openAngle: 0 = closed, 1 = fully open (3D perspective swing from left hinge)
  // drawSolidDoor: draws door at given position
  // openT: 0 = fully closed, 1 = fully open (door panel slides left, reveals white interior)
  function drawSolidDoor(x, y, w, h, alpha, openT) {
    alpha = Math.min(1, alpha);
    openT = openT || 0;
    const openEase = openT > 0 ? (1 - Math.pow(1 - openT, 2)) : 0;

    ctx.save();

    // === DOOR FRAME (always visible) ===
    const frameBW = 5;
    ctx.fillStyle = `rgba(140, 100, 25, ${alpha})`;
    // Top
    ctx.fillRect(x, y, w, frameBW);
    // Bottom
    ctx.fillRect(x, y + h - frameBW, w, frameBW);
    // Left
    ctx.fillRect(x, y, frameBW, h);
    // Right
    ctx.fillRect(x + w - frameBW, y, frameBW, h);

    // === WHITE INTERIOR (visible as door opens) ===
    if (openEase > 0) {
      ctx.fillStyle = `rgba(255,255,255,${alpha * openEase})`;
      ctx.fillRect(x + frameBW, y + frameBW, w - frameBW * 2, h - frameBW * 2);
    }

    // === DOOR PANEL (slides from right to left as it opens) ===
    // When closed: panel fills entire interior
    // When open: panel width shrinks toward left hinge
    const interiorX = x + frameBW;
    const interiorY = y + frameBW;
    const interiorW = w - frameBW * 2;
    const interiorH = h - frameBW * 2;
    // Panel shrinks to just the frame border width (flush against left frame edge)
    const minPanelW = frameBW;
    const panelW = minPanelW + (interiorW - minPanelW) * (1 - openEase);

    if (panelW > 2) {
      // Door panel gradient
      const grd = ctx.createLinearGradient(interiorX, interiorY, interiorX + panelW, interiorY + interiorH);
      grd.addColorStop(0, `rgba(212, 168, 83, ${alpha})`);
      grd.addColorStop(0.4, `rgba(201, 146, 42, ${alpha})`);
      grd.addColorStop(1, `rgba(155, 112, 28, ${alpha})`);
      ctx.fillStyle = grd;
      ctx.fillRect(interiorX, interiorY, panelW, interiorH);

      // Panel inset decoration
      if (panelW > 30) {
        ctx.strokeStyle = `rgba(180,130,35,${alpha * 0.3})`;
        ctx.lineWidth = 1;
        const inset = Math.min(10, panelW * 0.1);
        const topPanelH = interiorH * 0.38;
        ctx.strokeRect(interiorX + inset, interiorY + inset, panelW - inset * 2, topPanelH - inset);
        ctx.strokeRect(interiorX + inset, interiorY + topPanelH + 4, panelW - inset * 2, interiorH - topPanelH - inset - 4);
      }

      // Wood grain on panel
      ctx.save();
      ctx.beginPath();
      ctx.rect(interiorX, interiorY, panelW, interiorH);
      ctx.clip();
      ctx.strokeStyle = `rgba(0,0,0,${alpha * 0.04})`;
      ctx.lineWidth = 1;
      for (let gy = interiorY + 5; gy < interiorY + interiorH; gy += 9) {
        ctx.beginPath();
        ctx.moveTo(interiorX + 1, gy);
        ctx.lineTo(interiorX + panelW - 1, gy);
        ctx.stroke();
      }
      ctx.restore();

      // Knob (on right side of panel, near the edge that moves)
      if (alpha > 0.3 && panelW > 20) {
        const ka = Math.min(1, (alpha - 0.3) / 0.7);
        const kx = interiorX + panelW - 15;
        const ky = interiorY + interiorH * 0.5;
        // Shadow
        ctx.beginPath();
        ctx.arc(kx + 1, ky + 1, 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,0,0,${ka * 0.15})`;
        ctx.fill();
        // Knob
        ctx.beginPath();
        ctx.arc(kx, ky, 5, 0, Math.PI * 2);
        const kg = ctx.createRadialGradient(kx - 1, ky - 1, 0, kx, ky, 5);
        kg.addColorStop(0, `rgba(230,190,90,${ka})`);
        kg.addColorStop(0.5, `rgba(201,146,42,${ka})`);
        kg.addColorStop(1, `rgba(130,95,20,${ka})`);
        ctx.fillStyle = kg;
        ctx.fill();
        // Highlight
        ctx.beginPath();
        ctx.arc(kx - 1.5, ky - 1.5, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${ka * 0.3})`;
        ctx.fill();
      }

      // Shadow on the right edge of panel (depth)
      if (openEase > 0.05) {
        const shadowAlpha = alpha * openEase * 0.3;
        const shadowW = Math.min(8, panelW * 0.05);
        const shadowGrad = ctx.createLinearGradient(interiorX + panelW, interiorY, interiorX + panelW + shadowW, interiorY);
        shadowGrad.addColorStop(0, `rgba(0,0,0,${shadowAlpha})`);
        shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shadowGrad;
        ctx.fillRect(interiorX + panelW, interiorY, shadowW, interiorH);
      }
    }

    // Frame border highlight
    ctx.strokeStyle = `rgba(100, 70, 15, ${alpha * 0.5})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    ctx.restore();
  }

  // === MAIN UPDATE ===

  function update() {
    const scrollY = window.scrollY;
    const viewH = window.innerHeight;
    const viewW = window.innerWidth;
    const heroH = heroScene.offsetHeight;
    const sceneH = heroH - viewH;
    const t = Math.min(Math.max(scrollY / sceneH, 0), 1);

    // Merge progress — SYNCED with hero word merge
    const mergeScrollEnd = viewH * 1.2;
    const mergeRaw = Math.min(Math.max(scrollY / mergeScrollEnd, 0), 1);
    const mergeEase = 1 - Math.pow(1 - mergeRaw, 2.5);

    const portalTop = portalScene ? portalScene.offsetTop : heroH;
    const portalH = portalScene ? portalScene.offsetHeight : viewH * 2;
    // portalT: 0 when we START scrolling into portal (portal top hits viewport bottom)
    //          1 when we've scrolled through the full portal height
    const portalScrollRange = portalH - viewH; // actual scrollable distance within portal
    const portalT = portalScene ? Math.min(Math.max((scrollY - portalTop) / portalScrollRange, 0), 1) : 0;

    ctx.clearRect(0, 0, cW, cH);

    const textBounds = getTextBounds();
    calcFrameTargets(textBounds);

    // Mouse interaction
    pieces.forEach(p => {
      const dx = mx - p.x, dy = my - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120 && mergeEase < 0.4) {
        p.userRot += (Math.atan2(dy, dx) * 0.1 - p.userRot) * 0.15;
      } else {
        p.userRot *= 0.9;
      }
    });

    // ============================================================
    // PHASE 1-3: Debris → frame (synced with word merge exactly)
    // When mergeEase > 0.85, draw a single continuous frame instead of pieces
    // ============================================================
    if (t < 0.82 && portalT <= 0) {
      // Always update piece positions
      pieces.forEach(p => {
        p.x = p.scatterX + (p.targetX - p.scatterX) * mergeEase;
        p.y = p.scatterY + (p.targetY - p.scatterY) * mergeEase;
        p.rot = p.scatterRot + (p.targetRot - p.scatterRot) * mergeEase;
      });

      // Shape morph: ramp morphT aggressively so pieces are perfect rects early
      // mergeEase 0→0.4: morphT follows position (0→0.4)
      // mergeEase 0.4→0.65: morphT jumps to 1.0 (forces perfect rectangle)
      let morphT;
      if (mergeEase < 0.4) {
        morphT = mergeEase;
      } else if (mergeEase < 0.65) {
        const ramp = (mergeEase - 0.4) / 0.25;
        morphT = 0.4 + ramp * 0.6; // 0.4→1.0
      } else {
        morphT = 1.0; // guaranteed perfect rectangle
      }

      // === DRAW DEBRIS — they ARE the frame when assembled ===
      // After morphT=1 (pieces are rectangles), adjust bar lengths to close gaps
      // mergeEase 0.70→0.85: bars stretch/adjust to form a perfect continuous rectangle
      let barAdjustT = 0;
      if (mergeEase > 0.70) {
        barAdjustT = Math.min((mergeEase - 0.70) / 0.15, 1);
        barAdjustT = 1 - Math.pow(1 - barAdjustT, 2); // ease-out

        // Calculate perfect bar sizes to cover each edge completely
        const { x, y, w, h } = textBounds;
        const bw = 8;
        // Count pieces per edge
        const perim = 2 * (w + h);
        const seg = perim / PIECE_COUNT;

        pieces.forEach((p, i) => {
          const d = i * seg;
          let perfectW, perfectH, perfectX, perfectY, perfectRot;

          if (d < w) {
            // Top edge — piece should span from its start to next piece start
            const startX = x + (d / w) * w;
            const endX = x + (Math.min(d + seg, w) / w) * w;
            perfectW = endX - startX + 1;
            perfectH = bw;
            perfectX = (startX + endX) / 2;
            perfectY = y;
            perfectRot = 0;
          } else if (d < w + h) {
            const localD = d - w;
            const startY = y + (localD / h) * h;
            const endY = y + (Math.min(localD + seg, h) / h) * h;
            perfectW = endY - startY + 1;
            perfectH = bw;
            perfectX = x + w;
            perfectY = (startY + endY) / 2;
            perfectRot = Math.PI / 2;
          } else if (d < 2 * w + h) {
            const localD = d - w - h;
            const startX = x + w - (localD / w) * w;
            const endX = x + w - (Math.min(localD + seg, w) / w) * w;
            perfectW = Math.abs(endX - startX) + 1;
            perfectH = bw;
            perfectX = (startX + endX) / 2;
            perfectY = y + h;
            perfectRot = Math.PI;
          } else {
            const localD = d - 2 * w - h;
            const startY = y + h - (localD / h) * h;
            const endY = y + h - (Math.min(localD + seg, h) / h) * h;
            perfectW = Math.abs(endY - startY) + 1;
            perfectH = bw;
            perfectX = x;
            perfectY = (startY + endY) / 2;
            perfectRot = -Math.PI / 2;
          }

          // Interpolate current frameW toward perfect size
          p.frameW = p.frameW + (perfectW - p.frameW) * barAdjustT;
          // Nudge position to close gaps
          p.x = p.x + (perfectX - p.x) * barAdjustT;
          p.y = p.y + (perfectY - p.y) * barAdjustT;
          p.rot = p.rot + (perfectRot - p.rot) * barAdjustT;
        });
      }

      // Draw pieces, then crossfade to single solid frame at the end
      if (mergeEase < 0.80) {
        pieces.forEach(p => drawFragment(p, morphT));
      } else {
        // Quick crossfade: bars fade out, single frame stroke fades in
        const blendT = Math.min((mergeEase - 0.80) / 0.05, 1); // 0→1 over 0.80→0.85

        // Fading bars
        if (blendT < 1) {
          ctx.save();
          ctx.globalAlpha = 1 - blendT;
          pieces.forEach(p => drawFragment(p, morphT));
          ctx.globalAlpha = 1;
          ctx.restore();
        }

        // Single solid amber frame
        ctx.save();
        ctx.globalAlpha = blendT;
        ctx.strokeStyle = `rgb(${AMB.r}, ${AMB.g}, ${AMB.b})`;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.rect(textBounds.x, textBounds.y, textBounds.w, textBounds.h);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      door.style.opacity = '0';
      canvas.classList.toggle('interactive', mergeEase < 0.4);
      canvas.classList.remove('above-content');
      canvas.style.opacity = '1';
    }

    // ============================================================
    // PHASE 4: Frame → vertical solid door (t: 0.82 → 1.0)
    // Starts when word cycling reaches "Take" and explosion begins
    // ============================================================
    if (t >= 0.82 && portalT <= 0) {
      canvas.classList.remove('interactive');
      canvas.classList.add('above-content');
      canvas.style.opacity = '1';

      // Fill canvas with solid black to cover any section gaps
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, cW, cH);

      const reshapeT = Math.min((t - 0.82) / 0.18, 1);
      const reshapeEase = 1 - Math.pow(1 - reshapeT, 2.5);

      const curW = textBounds.w + (DOOR_W - textBounds.w) * reshapeEase;
      const curH = textBounds.h + (DOOR_H - textBounds.h) * reshapeEase;
      const curX = textBounds.x + ((viewW - DOOR_W) / 2 - textBounds.x) * reshapeEase;
      const curY = textBounds.y + ((viewH - DOOR_H) / 2 - textBounds.y) * reshapeEase;

      // Frame outline visible throughout, solid fill blends in gradually
      // Frame outline: always visible, fades as fill takes over
      const outlineAlpha = Math.max(0, 1 - reshapeEase);
      if (outlineAlpha > 0) {
        ctx.strokeStyle = `rgba(${AMB.r}, ${AMB.g}, ${AMB.b}, ${outlineAlpha})`;
        ctx.lineWidth = 4 + reshapeEase * 2;
        ctx.beginPath();
        ctx.roundRect(curX, curY, curW, curH, [4, 4, 0, 0]);
        ctx.stroke();
      }
      // Solid fill: ramps smoothly from 0→1 across entire reshape
      {
        const fillA = reshapeEase;

        // Door stays fully closed until reshape is complete AND we're past the hero
        // Then gradually opens through the gap before portal
        let earlyOpen = 0;
        if (reshapeEase >= 1 && scrollY > sceneH) {
          // Wait 30% into the gap before starting to open (brief solid door moment)
          const gapRaw = (scrollY - sceneH) / (portalTop - sceneH);
          const gapProgress = Math.min(Math.max((gapRaw - 0.3) / 0.7, 0), 1);
          earlyOpen = gapProgress * 0.15; // 0→0.15
        }

        // Slight zoom during the gap — starts after the brief solid door pause
        let gapZoom = 1;
        if (reshapeEase >= 1 && scrollY > sceneH) {
          const gapRaw = (scrollY - sceneH) / (portalTop - sceneH);
          const gp = Math.min(Math.max((gapRaw - 0.3) / 0.7, 0), 1);
          gapZoom = 1 + gp * 0.3; // 1→1.3
        }
        if (gapZoom > 1) {
          ctx.save();
          ctx.translate(viewW / 2, viewH / 2);
          ctx.scale(gapZoom, gapZoom);
          ctx.translate(-viewW / 2, -viewH / 2);
        }

        drawSolidDoor(curX, curY, curW, curH, fillA, earlyOpen);

        if (gapZoom > 1) {
          ctx.restore();
        }
      }

    }

    // ============================================================
    // PHASE 5: Door opens + zoom in SIMULTANEOUSLY
    // 500vh portal, scrollRange = 400vh — very slow cinematic
    //
    // portalT 0.0→0.3 : Door opens slowly, zoom barely starts (1x→1.5x)
    //                    User sees the door panel sliding left, white peeking through
    // portalT 0.3→0.5 : Door fully open, user SEES white interior, zoom gentle (1.5x→3x)
    // portalT 0.5→0.7 : Zoom into the opening (3x→8x), entering the doorway
    // portalT 0.7→0.9 : Zoom fills screen (8x→20x), white bg transition
    // portalT 0.9→1.0 : Fully white, canvas fades out
    //
    // At scale ~5x the 220px door = 1100px which fills most viewports,
    // so by portalT 0.5 you're looking through the open doorway.
    // ============================================================
    if (portalT > 0 && portalT < 1) {
      canvas.classList.remove('interactive');
      canvas.classList.add('above-content');
      // Clear any stale content before drawing
      ctx.clearRect(0, 0, cW, cH);

      const doorX = (viewW - DOOR_W) / 2;
      const doorY = (viewH - DOOR_H) / 2;

      // --- DOOR OPENING: starts at 0.15 (where Phase 4 left off) ---
      // 0→0.3 = opens from 0.15 to 0.7, 0.3→0.5 = fully open
      let openAmount;
      if (portalT < 0.3) {
        openAmount = 0.15 + (portalT / 0.3) * 0.55; // 0.15→0.7
      } else if (portalT < 0.5) {
        openAmount = 0.7 + ((portalT - 0.3) / 0.2) * 0.3; // 0.7→1.0
      } else {
        openAmount = 1;
      }

      // --- ZOOM: smooth continuous curve, no big jumps ---
      // Quadratic ease-in — less extreme slow start, smoother throughout
      const zoomRaw = portalT;
      const zoomEaseIn = zoomRaw * zoomRaw; // quadratic ease-in
      const zoomScale = 1.3 + zoomEaseIn * 48.7; // 1.3→50

      canvas.style.opacity = '1';

      // Black background behind the door
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, cW, cH);

      // Draw door — the white comes from the door's open interior naturally
      ctx.save();
      ctx.translate(viewW / 2, viewH / 2);
      ctx.scale(zoomScale, zoomScale);
      ctx.translate(-viewW / 2, -viewH / 2);

      drawSolidDoor(doorX, doorY, DOOR_W, DOOR_H, 1, openAmount);

      ctx.restore();

      // --- STAGED HEADER COLOR TRANSITION ---
      // White expands from center outward. Logo (center) turns black first,
      // then nav links + contact (sides) follow as white reaches the edges.
      //
      // Door interior bounds in screen space:
      const frameBW = 5;
      const intTop = viewH / 2 - (viewH / 2 - doorY - frameBW) * zoomScale;
      const intLeft = viewW / 2 - (viewW / 2 - doorX - frameBW) * zoomScale;
      const intRight = viewW / 2 + (doorX + DOOR_W - frameBW - viewW / 2) * zoomScale;

      const navEl = document.getElementById('navbar');
      const heroLogo = document.getElementById('hero-logo');
      const navLinks = navEl ? navEl.querySelector('.nav-links') : null;
      const navContact = navEl ? navEl.querySelector('.nav-contact') : null;

      // Logo turns black when white interior has expanded enough to fill most of screen
      if (heroLogo) {
        heroLogo.style.color = zoomScale > 3 ? 'var(--black)' : 'var(--white)';
        heroLogo.style.transition = 'color 0.5s ease';
      }

      // Other buttons follow shortly after
      const sideBlack = zoomScale > 6;
      if (navLinks) {
        navLinks.querySelectorAll('a').forEach(a => {
          a.style.color = sideBlack ? 'var(--black)' : '';
          a.style.transition = 'color 0.6s ease';
        });
      }
      if (navContact) {
        navContact.style.color = sideBlack ? 'var(--black)' : '';
        navContact.style.transition = 'color 0.6s ease';
        navContact.querySelectorAll('a').forEach(a => {
          a.style.color = sideBlack ? 'var(--black)' : '';
          a.style.transition = 'color 0.6s ease';
        });
      }

      // CTA light-mode when white is visible
      const fixedCta = document.querySelector('.fixed-cta');
      if (fixedCta) {
        if (zoomScale > 3) fixedCta.classList.add('light-mode');
        else fixedCta.classList.remove('light-mode');
      }

      // Canvas stays visible — clone overlay handles the transition to About
    }

    // ============================================================
    // AGGRESSIVE BACKGROUND RESET — the #1 rule:
    // body.background is ONLY white during portal zoom (portalT > 0 && portalT < 1)
    // EVERYWHERE else it must be cleared. No exceptions.
    // ============================================================
    if (!(portalT > 0 && portalT < 1)) {
      document.body.style.background = '';
      if (scrollY < portalTop) {
        // Scrolling back into hero — reset header to white
        const navEl = document.getElementById('navbar');
        const heroLogo = document.getElementById('hero-logo');
        if (heroLogo) { heroLogo.style.color = ''; heroLogo.style.transition = ''; }
        if (navEl) {
          navEl.querySelectorAll('.nav-links a').forEach(a => { a.style.color = ''; a.style.transition = ''; });
          const nc = navEl.querySelector('.nav-contact');
          if (nc) { nc.style.color = ''; nc.style.transition = ''; nc.querySelectorAll('a').forEach(a => { a.style.color = ''; a.style.transition = ''; }); }
        }
      }
      // Past portal — keep header black for About page white bg
      // The navbar scroll handler will take over from here
    }

    // Past portal — hide canvas/door, clear canvas content
    if (scrollY >= portalTop + portalH) {
      ctx.clearRect(0, 0, cW, cH);
      canvas.style.opacity = '0';
      canvas.classList.remove('above-content');
      door.style.opacity = '0';
      // Clear inline transitions ONCE (not colors — navbar handler manages those)
      if (!this._portalCleanedUp) {
        this._portalCleanedUp = true;
        const navEl = document.getElementById('navbar');
        if (navEl) {
          navEl.querySelectorAll('.nav-links a').forEach(a => { a.style.transition = ''; });
          const nc = navEl.querySelector('.nav-contact');
          if (nc) { nc.style.transition = ''; nc.querySelectorAll('a').forEach(a => { a.style.transition = ''; }); }
        }
        const heroLogo = document.getElementById('hero-logo');
        if (heroLogo) { heroLogo.style.transition = ''; }
      }
    } else {
      this._portalCleanedUp = false;
    }

    // Reset at top
    if (scrollY < 10) {
      door.style.opacity = '0';
      door.style.transform = '';
      door.classList.remove('solid');
      canvas.style.opacity = '1';
      canvas.classList.add('interactive');
      canvas.classList.remove('above-content');
    }

    // Between hero end and portal start
    if (t >= 1 && portalT <= 0) {
      canvas.style.opacity = '1';
    }
  }

  window.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });

  // Continuous render for mouse interaction + smooth animation
  (function loop() {
    update();
    requestAnimationFrame(loop);
  })();
}

/* ---- ABOUT TEXT SCATTER-TO-MERGE ---- */
/*
  Each character starts scattered randomly across the screen.
  As progress goes 0→1, chars fly inward and assemble into their correct positions.
  Reverse of the hero text explosion.
*/
const aboutScatter = {
  initialized: false,
  elements: [],  // { el, originalText, chars: [{ span, startX, startY, startRot }] }

  init(aboutEl) {
    if (this.initialized) return;
    this.initialized = true;
    this.elements = [];

    const targets = aboutEl.querySelectorAll('.statement-eyebrow, .statement-line, .statement-sub');
    targets.forEach(el => {
      const entry = { el, originalHTML: el.innerHTML, chars: [] };

      // Walk through all child nodes to preserve colors from inner spans
      const charData = [];
      function extractChars(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          for (let i = 0; i < node.textContent.length; i++) {
            charData.push({ char: node.textContent[i], color: null });
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const color = node.style.color || null;
          if (node.childNodes.length === 0) {
            // Self-closing or empty
          } else {
            node.childNodes.forEach(child => {
              if (child.nodeType === Node.TEXT_NODE) {
                for (let i = 0; i < child.textContent.length; i++) {
                  charData.push({ char: child.textContent[i], color: color });
                }
              } else {
                extractChars(child);
              }
            });
          }
        }
      }
      el.childNodes.forEach(node => extractChars(node));

      el.innerHTML = '';
      el.style.overflow = 'visible';
      el.style.position = 'relative';

      charData.forEach(cd => {
        const span = document.createElement('span');
        span.textContent = cd.char;
        span.style.display = 'inline-block';
        span.style.willChange = 'transform, opacity';
        if (cd.color) span.style.color = cd.color;
        if (cd.char === ' ') span.style.width = '0.3em';
        el.appendChild(span);

        const angle = Math.random() * Math.PI * 2;
        const dist = 400 + Math.random() * 800;
        entry.chars.push({
          span,
          startX: Math.cos(angle) * dist,
          startY: Math.sin(angle) * dist,
          startRot: (Math.random() - 0.5) * 360
        });
      });

      this.elements.push(entry);
    });
  },

  update(progress) {
    // progress: 0 = fully scattered, 1 = fully assembled
    const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic

    this.elements.forEach(entry => {
      entry.chars.forEach(ch => {
        if (ease >= 0.99) {
          // Fully assembled — switch to inline so word wrap matches normal flow
          ch.span.style.display = 'inline';
          ch.span.style.transform = '';
          ch.span.style.opacity = '1';
        } else {
          // Still animating — need inline-block for transforms
          ch.span.style.display = 'inline-block';
          const x = ch.startX * (1 - ease);
          const y = ch.startY * (1 - ease);
          const rot = ch.startRot * (1 - ease);
          const opacity = Math.min(1, ease * 1.5);

          ch.span.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
          ch.span.style.opacity = String(opacity);
        }
      });
    });
  },

  reset() {
    if (!this.initialized) return;
    this.elements.forEach(entry => {
      entry.el.innerHTML = entry.originalHTML;
      entry.el.style.overflow = '';
      entry.el.style.position = '';
    });
    this.elements = [];
    this.initialized = false;
  }
};

/* ---- CHARACTER EXPLOSION (after "Take the Market") ---- */
/*
  When the hero word cycling reaches "Take" and the explosion phase starts (t > 0.85),
  split each hero word into individual characters and explode them outward.
*/
function initCharExplosion() {
  const elOwn = document.getElementById('hw-own');
  const elThe = document.getElementById('hw-the');
  const elMarket = document.getElementById('hw-market');
  const heroScene = document.getElementById('scene-hero');
  if (!elOwn || !elThe || !elMarket || !heroScene) return;

  let charsWrapped = false;
  let allChars = [];

  // Wrap each letter in a span for individual animation
  function wrapChars() {
    if (charsWrapped) return;
    charsWrapped = true;

    [elOwn, elThe, elMarket].forEach(el => {
      // Get the text content (for elOwn, get the changing word span's text)
      const changingWord = el.querySelector('.hero-changing-word');
      const textSource = changingWord || el;
      const text = textSource.textContent;

      // Build character spans
      const frag = document.createDocumentFragment();
      for (let i = 0; i < text.length; i++) {
        const span = document.createElement('span');
        span.textContent = text[i];
        span.className = 'explode-char';
        span.style.display = 'inline-block';
        span.style.willChange = 'transform, opacity';
        frag.appendChild(span);
      }

      // Replace content
      if (changingWord) {
        changingWord.textContent = '';
        changingWord.appendChild(frag);
      } else {
        el.textContent = '';
        el.appendChild(frag);
      }
    });

    // Collect all char spans
    allChars = Array.from(document.querySelectorAll('.explode-char'));

    // Assign random explosion vectors to each char
    allChars.forEach((ch, i) => {
      const angle = (Math.random() * Math.PI * 2);
      const dist = 300 + Math.random() * 600;
      ch._explodeX = Math.cos(angle) * dist;
      ch._explodeY = Math.sin(angle) * dist;
      ch._explodeRot = (Math.random() - 0.5) * 360;
    });
  }

  // Undo wrapping (when scrolling back before explosion)
  function unwrapChars() {
    if (!charsWrapped) return;
    charsWrapped = false;

    const changingWord = elOwn.querySelector('.hero-changing-word');
    if (changingWord) {
      const text = changingWord.textContent;
      changingWord.textContent = text;
    }
    // "the" and "Market." are plain text
    elThe.textContent = 'the';
    elMarket.textContent = 'Market.';
    allChars = [];
  }

  function onScroll() {
    requestAnimationFrame(update);
  }

  function update() {
    const scrollY = window.scrollY;
    const viewH = window.innerHeight;
    const sceneH = heroScene.offsetHeight - viewH;
    const t = Math.min(Math.max(scrollY / sceneH, 0), 1);

    if (t >= 0.82) {
      // Wrap characters if not already
      wrapChars();

      const explodeT = Math.min((t - 0.82) / 0.18, 1); // 0→1
      const ease = 1 - Math.pow(1 - explodeT, 2.5);

      allChars.forEach(ch => {
        const x = ch._explodeX * ease;
        const y = ch._explodeY * ease;
        const rot = ch._explodeRot * ease;
        const scale = 1 - ease * 0.5;
        const opacity = Math.max(0, 1 - ease * 1.2);

        ch.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale})`;
        ch.style.opacity = String(opacity);
      });
    } else {
      // Reset — put text back to normal
      if (charsWrapped) {
        unwrapChars();
      }
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ---- LOGO ANIMATION (hero → navbar on scroll) ---- */
function initLogoAnimation() {
  const logo    = document.getElementById('hero-logo');
  const navLogo = document.querySelector('.nav-logo');

  // Hide the static nav logo — the hero logo becomes the nav logo
  navLogo.style.display = 'none';
  logo.style.transition = 'none';
  logo.style.pointerEvents = 'auto';

  // Copy nav logo click behavior
  logo.style.cursor = 'pointer';
  logo.addEventListener('click', () => {
    lenis.scrollTo(0);
  });

  // Start & end values — recalculated on resize
  let startTop, startSize, endSize, endTop, scrollEnd;
  const startSpace = 0.3;
  const endSpace   = 0.2;

  function calcLogoLayout() {
    startTop = window.innerHeight / 2;
    const isMobile = window.innerWidth <= 480;
    startSize = isMobile ? Math.min(Math.max(window.innerWidth * 0.07, 20), 32)
                         : Math.min(Math.max(window.innerWidth * 0.06, 48), 80);
    endSize = isMobile ? 14 : Math.min(Math.max(window.innerWidth * 0.015, 16), 30);
    const navH = document.getElementById('navbar').offsetHeight;
    endTop = (navH - endSize * 1.2) / 2;
    scrollEnd = window.innerHeight * 1.2;
  }
  calcLogoLayout();

  function update() {
    const scrollY = window.scrollY;
    const t = Math.min(Math.max(scrollY / scrollEnd, 0), 1);
    const ease = 1 - Math.pow(1 - t, 2.5);

    const top   = startTop + (endTop - startTop) * ease;
    const size  = startSize + (endSize - startSize) * ease;
    const space = startSpace + (endSpace - startSpace) * ease;

    logo.style.top = top + 'px';
    logo.style.fontSize = size + 'px';
    logo.style.letterSpacing = space + 'em';
  }

  window.addEventListener('resize', () => { calcLogoLayout(); update(); });
  window.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  update();
}

/* ---- NAVBAR SCROLL STATE ---- */
const navbar = document.getElementById('navbar');
let lastScrollY = 0;
let lightSceneActive = false;

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;

  // Detect if navbar overlaps any light (cream) section
  const lightSections = document.querySelectorAll('.scene-cream, .scene-about');
  const fixedCta = document.querySelector('.fixed-cta');
  const viewH = window.innerHeight;
  let overLight = false;
  let ctaOverLight = false;

  lightSections.forEach(section => {
    // Skip sections that are hidden or have invisible inner content
    if (section.style.visibility === 'hidden') return;
    const inner = section.querySelector('.statement-inner');
    if (inner && inner.style.opacity === '0') return;

    const rect = section.getBoundingClientRect();
    if (rect.top < 100 && rect.bottom > 0) overLight = true;
    if (fixedCta && rect.top < viewH - 40 && rect.bottom > viewH - 100) ctaOverLight = true;
  });

  const heroLogo = document.getElementById('hero-logo');
  if (overLight) {
    navbar.classList.add('light-mode');
    if (heroLogo) heroLogo.style.color = 'var(--black)';
  } else {
    navbar.classList.remove('light-mode');
    if (heroLogo) heroLogo.style.color = 'var(--white)';
  }

  if (fixedCta) {
    if (ctaOverLight) {
      fixedCta.classList.add('light-mode');
    } else {
      fixedCta.classList.remove('light-mode');
    }
  }

  lastScrollY = scrollY;
}, { passive: true });

/* ---- HERO TEXT MERGE + WORD TRANSITIONS ON SCROLL ---- */
(function initHeroSequence() {
  const elOwn = document.getElementById('hw-own');
  const elThe = document.getElementById('hw-the');
  const elMarket = document.getElementById('hw-market');
  const changingWord = document.getElementById('hero-changing-word');
  const heroHint = document.querySelector('.hero-scroll-hint');
  const heroScene = document.getElementById('scene-hero');
  const aboutEl = document.getElementById('scene-statement');
  if (!elOwn || !elThe || !elMarket || !heroScene) return;

  // Make them fixed so they stay on screen during scroll
  [elOwn, elThe, elMarket].forEach(el => { el.style.position = 'fixed'; });

  const words = ['Own', 'Run', 'Lead', 'Take'];
  let currentWordIndex = 0;

  // Layout values — recalculated on resize
  let vh, vw, ownW, ownH, theW, theH, mktW, mktH;
  let ownStartX, ownStartY, theStartX, theStartY, mktStartX, mktStartY;
  let ownEndX, ownEndY, theEndX, theEndY, mktEndX, mktEndY;
  let mergeScrollEnd;

  function calcLayout() {
    vh = window.innerHeight;
    vw = window.innerWidth;
    const isMobile = vw <= 480;
    const isTablet = vw <= 900;

    // Measure word sizes
    ownW = elOwn.offsetWidth;
    ownH = elOwn.offsetHeight;
    theW = elThe.offsetWidth;
    theH = elThe.offsetHeight;
    mktW = elMarket.offsetWidth;
    mktH = elMarket.offsetHeight;

    // START positions — adjusted for mobile
    const edgePad = isMobile ? 0.04 : 0.05;
    ownStartX = vw * edgePad;
    ownStartY = vh * (isMobile ? 0.22 : 0.28) - ownH / 2;

    // "the" + "Market." → bottom-right
    // On mobile, clamp so they don't go off-screen
    theStartX = Math.max(vw * 0.02, vw * (1 - edgePad) - theW);
    theStartY = vh * (isMobile ? 0.75 : 0.82) - theH - mktH;
    mktStartX = Math.max(vw * 0.02, vw * (1 - edgePad) - mktW);
    mktStartY = vh * (isMobile ? 0.75 : 0.82) - mktH;

    // END positions (merged centered)
    const gap = isMobile ? vw * 0.015 : vw * 0.02;
    const line1W = ownW + gap + theW;
    const line2W = mktW;
    const blockW = Math.max(line1W, line2W);
    const lineH = ownH;
    const blockH = lineH * 2.1;

    // On mobile, left-align with padding instead of centering if block is wider than screen
    let blockLeft;
    if (blockW > vw * 0.92) {
      blockLeft = vw * 0.04; // left-align with padding
    } else {
      blockLeft = (vw - blockW) / 2;
    }
    const blockTop = (vh - blockH) / 2;

    ownEndX = blockLeft;
    ownEndY = blockTop;
    theEndX = blockLeft + ownW + gap;
    theEndY = blockTop;
    mktEndX = blockLeft;
    mktEndY = blockTop + lineH * 1.1;

    mergeScrollEnd = vh * 1.2;
  }

  calcLayout();
  window.addEventListener('resize', () => { calcLayout(); update(); });

  // Set initial positions
  elOwn.style.left = ownStartX + 'px';
  elOwn.style.top = ownStartY + 'px';
  elThe.style.left = theStartX + 'px';
  elThe.style.top = theStartY + 'px';
  elMarket.style.left = mktStartX + 'px';
  elMarket.style.top = mktStartY + 'px';

  function update() {
    const scrollY = window.scrollY;
    const sceneH = heroScene.offsetHeight - vh;

    // Fade scroll hint
    if (heroHint) {
      // Fade out during first half of merge
      const hintFade = Math.max(0, 1 - scrollY / (mergeScrollEnd * 0.5));
      heroHint.style.opacity = String(hintFade);
      heroHint.style.display = hintFade <= 0 ? 'none' : '';
    }

    // === MERGE: each word moves from start to end ===
    // Same ease-out as VEBLEN logo
    const mergeRaw = Math.min(Math.max(scrollY / mergeScrollEnd, 0), 1);
    const ease = 1 - Math.pow(1 - mergeRaw, 2.5);

    // Interpolate each word's position
    const ox = ownStartX + (ownEndX - ownStartX) * ease;
    const oy = ownStartY + (ownEndY - ownStartY) * ease;
    const tx = theStartX + (theEndX - theStartX) * ease;
    const ty = theStartY + (theEndY - theStartY) * ease;
    const mx = mktStartX + (mktEndX - mktStartX) * ease;
    const my = mktStartY + (mktEndY - mktStartY) * ease;

    elOwn.style.left = ox + 'px';
    elOwn.style.top = oy + 'px';
    elThe.style.left = tx + 'px';
    elThe.style.top = ty + 'px';
    elMarket.style.left = mx + 'px';
    elMarket.style.top = my + 'px';

    // Motion blur — subtle directional blur while moving, fades as merge completes
    const speed = mergeRaw < 1 ? (1 - ease) * 4 : 0; // stronger at start, fades out
    const blur = `0 0 ${speed}px rgba(255,255,255,0.3)`;
    const noBlur = 'none';
    const shadow = speed > 0.2 ? blur : noBlur;
    elOwn.style.textShadow = shadow;
    elThe.style.textShadow = shadow;
    elMarket.style.textShadow = shadow;

    // === WORD CHANGES — only after merge is fully complete ===
    const t = Math.min(Math.max(scrollY / sceneH, 0), 1);
    const mergeComplete = mergeScrollEnd / sceneH; // t value when merge finishes

    // Dynamic word ranges — fit all 4 words between mergeComplete and 0.80
    // Works on any hero height (desktop 400vh, mobile 350vh)
    const wordStart = mergeComplete + 0.03;
    const wordEnd = 0.80; // must finish before explosion at 0.82
    const wordRange = (wordEnd - wordStart) / 4;
    let wordIndex;
    if (t < wordStart + wordRange) wordIndex = 0;
    else if (t < wordStart + wordRange * 2) wordIndex = 1;
    else if (t < wordStart + wordRange * 3) wordIndex = 2;
    else wordIndex = 3;

    // Color per word: Own=white, Run=green, Lead=blue, Take=yellow
    const wordColors = ['#FFFFFF', '#7CA630', '#4A9EC9', '#C9922A'];

    // Don't change word if explosion has already wrapped characters
    const explosionActive = document.querySelectorAll('.explode-char').length > 0;
    if (wordIndex !== currentWordIndex && !explosionActive) {
      currentWordIndex = wordIndex;
      changingWord.style.transition = 'none';
      changingWord.style.transform = 'scaleY(0)';
      changingWord.textContent = words[wordIndex];
      changingWord.style.color = wordColors[wordIndex];
      changingWord.offsetHeight;
      changingWord.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), color 0.4s ease';
      changingWord.style.transform = 'scaleY(1)';
    }

    // Character explosion is handled by initCharExplosion()
    // Keep words visible until explosion takes over
    if (t < 0.82) {
      [elOwn, elThe, elMarket].forEach(el => {
        el.style.transform = 'scale(1)';
        el.style.opacity = '1';
      });
    }

    // About text assembly now handled by portal section (initDoorSystem)
    // Just hide hero words after hero ends
    if (heroScene.getBoundingClientRect().bottom < 0) {
      [elOwn, elThe, elMarket].forEach(el => { el.style.opacity = '0'; });
    }

    // === ABOUT ZOOM-IN (during portal scroll) ===
    // Strategy: create a CLONE overlay once. Show clone during portal, hide after.
    // Real About section stays in flow always, never touched.
    const portalScene = document.getElementById('scene-door-portal');
    if (portalScene && aboutEl) {
      const portalTop = portalScene.offsetTop;
      const portalH = portalScene.offsetHeight;
      const portalScrollRange = portalH - vh;
      const portalT = Math.min(Math.max((scrollY - portalTop) / portalScrollRange, 0), 1);

      const aboutStart = 0.47;
      const aboutT = Math.min(Math.max((portalT - aboutStart) / (1 - aboutStart), 0), 1);

      // Create clone overlay once — matches real About section layout exactly
      let clone = document.getElementById('about-clone-overlay');
      if (!clone) {
        clone = document.createElement('div');
        clone.id = 'about-clone-overlay';
        // Match #scene-statement.scene-about layout exactly
        clone.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100vh;z-index:7995;display:flex;align-items:center;justify-content:center;background:#fff;visibility:hidden;pointer-events:none;padding:clamp(80px,8vw,120px) clamp(24px,5vw,80px);box-sizing:border-box;';
        // Copy the inner content — match .statement-inner exactly
        const realInner = aboutEl.querySelector('.statement-inner');
        const inner = document.createElement('div');
        inner.innerHTML = realInner.innerHTML;
        inner.className = 'statement-inner';
        // Get computed styles from real inner to match
        const cs = window.getComputedStyle(realInner);
        inner.style.cssText = `max-width:${cs.maxWidth};width:100%;text-align:center;margin:0 auto;color:#080808;transform:scale(0);opacity:0;transform-origin:center center;`;
        clone.appendChild(inner);
        document.body.appendChild(clone);
        // Apply About text colors to clone
        clone.querySelectorAll('.statement-text, .statement-line').forEach(el => { el.style.color = '#080808'; });
        clone.querySelectorAll('.statement-sub').forEach(el => { el.style.color = 'rgba(0,0,0,0.6)'; });
        clone.querySelectorAll('.statement-eyebrow').forEach(el => { el.style.color = '#C9922A'; });
      }

      const cloneInner = clone.querySelector('.statement-inner');

      // Check if real About section covers viewport (for handoff)
      const realAboutRect = aboutEl.getBoundingClientRect();
      const realAboutCoversViewport = realAboutRect.top <= 0;

      // Keep logo black whenever clone or About white bg is visible
      const heroLogo = document.getElementById('hero-logo');

      if (aboutT > 0 && !realAboutCoversViewport) {
        // Show clone with zoom animation — stays until real About takes over
        clone.style.visibility = 'visible';
        const zoomEase = Math.min(1, 1 - Math.pow(1 - aboutT, 2));
        cloneInner.style.transform = `scale(${zoomEase})`;
        cloneInner.style.opacity = String(zoomEase);
        // Force entire header black — white bg is showing
        if (heroLogo) heroLogo.style.color = 'var(--black)';
        const navEl = document.getElementById('navbar');
        if (navEl) {
          navEl.querySelectorAll('.nav-links a').forEach(a => { a.style.color = 'var(--black)'; });
          const nc = navEl.querySelector('.nav-contact');
          if (nc) { nc.style.color = 'var(--black)'; nc.querySelectorAll('a').forEach(a => { a.style.color = 'var(--black)'; }); }
        }
        const cloneCta = document.querySelector('.fixed-cta');
        if (cloneCta) cloneCta.classList.add('light-mode');
      } else if (realAboutCoversViewport) {
        // Real About has taken over — hide clone
        clone.style.visibility = 'hidden';
        clone.style.opacity = '1';
        cloneInner.style.transform = '';
        cloneInner.style.opacity = '';
        // Clear inline colors ONCE so navbar handler can take over
        if (!clone._handedOff) {
          clone._handedOff = true;
          if (heroLogo) { heroLogo.style.color = ''; }
          const navEl = document.getElementById('navbar');
          if (navEl) {
            navEl.querySelectorAll('.nav-links a').forEach(a => { a.style.color = ''; });
            const nc = navEl.querySelector('.nav-contact');
            if (nc) { nc.style.color = ''; nc.querySelectorAll('a').forEach(a => { a.style.color = ''; }); }
          }
          const handoffCta = document.querySelector('.fixed-cta');
          if (handoffCta) handoffCta.classList.remove('light-mode');
        }
      } else {
        clone._handedOff = false;
        // Before About animation — hide clone
        clone.style.visibility = 'hidden';
        cloneInner.style.transform = 'scale(0)';
        cloneInner.style.opacity = '0';
      }
    }
  }

  window.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  update();
})();

/* ---- MOBILE CASE STUDY CAROUSEL (infinite loop) ---- */
(function initProofCarousel() {
  if (window.innerWidth > 480) return;

  const grid = document.getElementById('proof-case-grid');
  const leftBtn = document.getElementById('proof-arrow-left');
  const rightBtn = document.getElementById('proof-arrow-right');
  if (!grid || !leftBtn || !rightBtn) return;

  const items = Array.from(grid.querySelectorAll('.proof-case-item'));
  const count = items.length;
  if (count === 0) return;

  // Clone first and last for seamless looping
  const firstClone = items[0].cloneNode(true);
  const lastClone = items[count - 1].cloneNode(true);
  grid.appendChild(firstClone);
  grid.insertBefore(lastClone, items[0]);

  // Now order is: [lastClone, item0, item1, item2, item3, firstClone]
  // Start at index 1 (real first card)
  let index = 1;
  let animating = false;
  grid.style.transform = `translateX(-${index * 100}%)`;

  function slideTo(newIndex) {
    if (animating) return;
    animating = true;
    index = newIndex;
    grid.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    grid.style.transform = `translateX(-${index * 100}%)`;

    grid.addEventListener('transitionend', function handler() {
      grid.removeEventListener('transitionend', handler);
      // If we landed on a clone, jump to the real card instantly
      if (index === 0) {
        grid.style.transition = 'none';
        index = count;
        grid.style.transform = `translateX(-${index * 100}%)`;
      } else if (index === count + 1) {
        grid.style.transition = 'none';
        index = 1;
        grid.style.transform = `translateX(-${index * 100}%)`;
      }
      animating = false;
    });
  }

  rightBtn.addEventListener('click', () => slideTo(index + 1));
  leftBtn.addEventListener('click', () => slideTo(index - 1));
})();

/* ---- MOBILE MENU TOGGLE ---- */
(function initMobileMenu() {
  const burger = document.getElementById('nav-burger');
  const menu = document.getElementById('mobile-menu');
  if (!burger || !menu) return;

  burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    menu.classList.toggle('open');
  });

  // Close menu when a link is clicked
  menu.querySelectorAll('[data-scroll-to]').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('active');
      menu.classList.remove('open');
    });
  });

  // Close on scroll
  window.addEventListener('scroll', () => {
    if (menu.classList.contains('open')) {
      burger.classList.remove('active');
      menu.classList.remove('open');
    }
  }, { passive: true });
})();

/* ---- NAV SMOOTH SCROLL ---- */
document.querySelectorAll('[data-scroll-to]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.getElementById(link.dataset.scrollTo);
    if (target) {
      // Release any fixed-position sections before scrolling
      target.style.position = '';
      target.style.top = '';
      target.style.left = '';
      target.style.width = '';
      target.style.zIndex = '';
      target.style.transform = '';
      target.style.opacity = '';
      target.style.transformOrigin = '';
      lenis.scrollTo(target, { offset: 0 });
    }
  });
});

/* ---- SCROLL REVEAL (Intersection Observer) ---- */
const revealElements = document.querySelectorAll(
  '.statement-eyebrow, .statement-line, .statement-sub, .statement-rule, ' +
  '.proof-stat, .tier, .fade-up, .split-word span, .proof-eyebrow, ' +
  '.proof-headline, .system-eyebrow, .system-headline'
);

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
    }
  });
}, {
  threshold: 0.15,
  rootMargin: '0px 0px -60px 0px'
});

revealElements.forEach(el => revealObserver.observe(el));

/* ---- SERVICES AUTO-SCROLL (pause on hover) ---- */
const servicesScrollInner = document.querySelector('.services-scroll-inner');
if (servicesScrollInner) {
  // Clone content for seamless loop
  const origHTML = servicesScrollInner.innerHTML;
  servicesScrollInner.innerHTML = origHTML + origHTML + origHTML;

  // Remove CSS animation — JS drives it
  servicesScrollInner.style.animation = 'none';

  const allItems = servicesScrollInner.querySelectorAll('li');
  const oneSetCount = allItems.length / 3;
  let paused = false;
  let scrollPos = 0;
  const speed = 0.5;

  servicesScrollInner.parentElement.addEventListener('mouseenter', () => { paused = true; });
  servicesScrollInner.parentElement.addEventListener('mouseleave', () => { paused = false; });

  requestAnimationFrame(function measure() {
    // Measure one set height after layout
    const firstItem = allItems[0];
    const lastOfSet = allItems[oneSetCount - 1];
    const oneSetHeight = lastOfSet.offsetTop + lastOfSet.offsetHeight - firstItem.offsetTop;

    function tick() {
      if (!paused) {
        scrollPos += speed;
        if (scrollPos >= oneSetHeight) {
          scrollPos -= oneSetHeight;
        }
        servicesScrollInner.style.transform = 'translateY(' + (-scrollPos) + 'px)';
      }

      // Highlight center item
      const listRect = servicesScrollInner.parentElement.getBoundingClientRect();
      const centerY = listRect.top + listRect.height / 2;
      allItems.forEach(li => {
        const rect = li.getBoundingClientRect();
        const itemCenter = rect.top + rect.height / 2;
        const dist = Math.abs(centerY - itemCenter);
        if (dist < rect.height * 0.6) {
          li.classList.add('active');
        } else {
          li.classList.remove('active');
        }
      });

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

/* ---- WHO-WE-SERVE VERTICAL SCROLL ---- */
const whoCol = document.querySelector('.who-scroll-col');
if (whoCol) {
  // Triple-clone for plenty of runway so reset is never visible
  const items = whoCol.innerHTML;
  whoCol.innerHTML = items + items + items;

  whoCol.style.animation = 'none';

  const mask = document.querySelector('.who-scroll-mask');
  let scrollPos = 0;
  const speed = 0.5;

  // Measure one set height directly from the DOM after render
  const allSpans = whoCol.querySelectorAll('span');
  const oneSetCount = allSpans.length / 3;

  // Wait a frame so layout is ready before measuring
  requestAnimationFrame(() => {
    const firstSpan = allSpans[0];
    const lastOfSet = allSpans[oneSetCount - 1];
    const oneSetHeight = lastOfSet.offsetTop + lastOfSet.offsetHeight - firstSpan.offsetTop;

    function tick() {
      scrollPos += speed;
      if (scrollPos >= oneSetHeight) {
        scrollPos -= oneSetHeight;
      }
      whoCol.style.transform = 'translateY(' + (-scrollPos) + 'px)';

      // Highlight center item
      const maskRect = mask.getBoundingClientRect();
      const centerY = maskRect.top + maskRect.height / 2;
      allSpans.forEach(span => {
        const rect = span.getBoundingClientRect();
        const itemCenter = rect.top + rect.height / 2;
        const dist = Math.abs(centerY - itemCenter);
        if (dist < rect.height * 0.6) {
          span.style.color = 'rgba(255,255,255,1)';
        } else if (dist < rect.height * 1.5) {
          span.style.color = 'rgba(255,255,255,0.45)';
        } else {
          span.style.color = '';
        }
      });

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

/* ---- GLOBE (Three.js momentum drag) ---- */
function initGlobe() {
  const canvas = document.getElementById('globe-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 2.8;

  const radius = 1;
  const globeGroup = new THREE.Group();
  scene.add(globeGroup);

  // --- WIREFRAME SPHERE (subtle grid) ---
  const wireGeo = new THREE.SphereGeometry(radius, 24, 12);
  const wireMat = new THREE.MeshBasicMaterial({ color: 0xC9922A, wireframe: true, transparent: true, opacity: 0.06 });
  globeGroup.add(new THREE.Mesh(wireGeo, wireMat));

  // --- WORLD MAP TEXTURE ---
  const texLoader = new THREE.TextureLoader();
  texLoader.crossOrigin = 'anonymous';
  texLoader.load('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/World_map_blank_without_borders.svg/1280px-World_map_blank_without_borders.svg.png', function(tex) {
    const mapGeo = new THREE.SphereGeometry(radius * 1.002, 32, 16);
    const mapMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.35, color: 0xC9922A });
    globeGroup.add(new THREE.Mesh(mapGeo, mapMat));
  });

  // --- CONNECTION ARCS ---
  function ll2v(lat, lon, r) {
    const p = (90 - lat) * Math.PI / 180, t = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(-r * Math.sin(p) * Math.cos(t), r * Math.cos(p), r * Math.sin(p) * Math.sin(t));
  }
  const conns = [
    [[-33.8,151.2],[35.6,139.6]], [[-33.8,151.2],[51.5,-0.1]], [[-33.8,151.2],[40.7,-74.0]],
    [[-27.5,153.0],[1.3,103.8]], [[-37.8,144.9],[25.2,55.3]], [[51.5,-0.1],[40.7,-74.0]],
  ];
  const arcMat = new THREE.LineBasicMaterial({ color: 0xC9922A, transparent: true, opacity: 0.3 });
  conns.forEach(([f, t]) => {
    const s = ll2v(f[0],f[1],1.01), e = ll2v(t[0],t[1],1.01);
    const m = s.clone().add(e).multiplyScalar(0.5).normalize().multiplyScalar(1.4);
    const geo = new THREE.BufferGeometry().setFromPoints(new THREE.QuadraticBezierCurve3(s, m, e).getPoints(20));
    globeGroup.add(new THREE.Line(geo, arcMat));
  });

  // --- FLYING LINES (pre-baked vectors, no .clone() per frame) ---
  const flyCount = 15;
  const flyData = [];
  const flyMat = new THREE.LineBasicMaterial({ color: 0xC9922A, transparent: true, opacity: 0.4 });
  for (let i = 0; i < flyCount; i++) {
    const phi = Math.random() * Math.PI, theta = Math.random() * Math.PI * 2;
    const dx = Math.sin(phi) * Math.cos(theta), dy = Math.cos(phi), dz = Math.sin(phi) * Math.sin(theta);
    const len = 0.15 + Math.random() * 0.2;
    const spd = 0.005 + Math.random() * 0.008;
    const maxD = 0.5 + Math.random() * 0.6;
    const arr = new Float32Array(6);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const mat = flyMat.clone();
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    flyData.push({ arr, geo, mat, dx, dy, dz, ox: dx * 1.02, oy: dy * 1.02, oz: dz * 1.02, len, spd, maxD, dist: Math.random() * maxD });
  }

  // --- ORBITAL RINGS ---
  const ringGeo = new THREE.TorusGeometry(1.3, 0.0015, 4, 60);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xC9922A, transparent: true, opacity: 0.12 });
  const ring1 = new THREE.Mesh(ringGeo, ringMat);
  ring1.rotation.x = Math.PI / 2.2; ring1.rotation.z = 0.3;
  scene.add(ring1);
  const ring2 = new THREE.Mesh(ringGeo.clone(), ringMat.clone());
  ring2.rotation.x = Math.PI / 3; ring2.rotation.y = Math.PI / 4;
  scene.add(ring2);

  // --- DRAG ---
  let isDragging = false, velX = 0, velY = 0, prevX = 0, prevY = 0, rotX = 0, rotY = 0;
  const wrap = canvas.parentElement;

  wrap.addEventListener('mousedown', e => { isDragging = true; prevX = e.clientX; prevY = e.clientY; velX = 0; velY = 0; });
  window.addEventListener('mouseup', () => { isDragging = false; });
  window.addEventListener('mousemove', e => { if (!isDragging) return; velX = (e.clientX - prevX) * 0.006; velY = (e.clientY - prevY) * 0.006; prevX = e.clientX; prevY = e.clientY; });
  wrap.addEventListener('touchstart', e => { isDragging = true; prevX = e.touches[0].clientX; prevY = e.touches[0].clientY; velX = 0; velY = 0; }, { passive: true });
  window.addEventListener('touchend', () => { isDragging = false; });
  window.addEventListener('touchmove', e => { if (!isDragging) return; velX = (e.touches[0].clientX - prevX) * 0.006; velY = (e.touches[0].clientY - prevY) * 0.006; prevX = e.touches[0].clientX; prevY = e.touches[0].clientY; }, { passive: true });

  // --- ANIMATE ---
  function animate() {
    requestAnimationFrame(animate);

    if (!isDragging) { velX *= 0.93; velY *= 0.93; if (Math.abs(velX) < 0.0003) velX += 0.002; }
    rotY += velX; rotX += velY;
    rotX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rotX));

    globeGroup.rotation.y = rotY;
    globeGroup.rotation.x = rotX;
    ring1.rotation.z = rotY * 0.3;
    ring2.rotation.z = -rotY * 0.2;

    // Flying lines — no allocations per frame
    for (let i = 0; i < flyData.length; i++) {
      const f = flyData[i];
      f.dist += f.spd;
      if (f.dist > f.maxD) f.dist = 0;
      const d = f.dist;
      f.arr[0] = f.ox + f.dx * d;
      f.arr[1] = f.oy + f.dy * d;
      f.arr[2] = f.oz + f.dz * d;
      f.arr[3] = f.ox + f.dx * (d + f.len);
      f.arr[4] = f.oy + f.dy * (d + f.len);
      f.arr[5] = f.oz + f.dz * (d + f.len);
      f.geo.attributes.position.needsUpdate = true;
      f.mat.opacity = 0.4 * (1 - d / f.maxD);
    }

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => { renderer.setSize(wrap.clientWidth, wrap.clientHeight); });
}

// Load Three.js then init globe
const threeScript = document.createElement('script');
threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
threeScript.onload = () => initGlobe();
document.head.appendChild(threeScript);

/* ---- COUNTER ANIMATION ---- */
function animateCounter(el, target, suffix = '') {
  const duration = 2000;
  const start = performance.now();
  const startVal = 0;

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(startVal + (target - startVal) * ease);
    el.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

const statsObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      animateCounter(el, target, suffix);
      statsObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.proof-number[data-target]').forEach(el => {
  statsObserver.observe(el);
});

/* ---- NOISE TEXTURE OVERLAY ---- */
(function addGrain() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(256, 256);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const val = Math.random() * 255;
    imageData.data[i] = val;
    imageData.data[i+1] = val;
    imageData.data[i+2] = val;
    imageData.data[i+3] = 12; // very subtle
  }
  ctx.putImageData(imageData, 0, 0);

  const grain = document.createElement('div');
  grain.style.cssText = `
    position: fixed; inset: 0; z-index: 9997; pointer-events: none;
    background: url(${canvas.toDataURL()}) repeat;
    opacity: 0.35; mix-blend-mode: overlay;
  `;
  document.body.appendChild(grain);
})();

/* ---- CONTACT FORM MODAL ---- */
const openBtn = document.getElementById('open-contact');
const overlay = document.getElementById('contact-overlay');
const panel   = document.getElementById('contact-panel');
const closeBtn = document.getElementById('close-contact');

if (openBtn && overlay) {
  openBtn.addEventListener('click', () => {
    overlay.classList.add('active');
  });

  closeBtn.addEventListener('click', () => {
    overlay.classList.remove('active');
  });

  // Close when clicking outside the panel
  overlay.addEventListener('click', (e) => {
    if (!panel.contains(e.target)) {
      overlay.classList.remove('active');
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') overlay.classList.remove('active');
  });
}

/* ---- ULTRA-REALISTIC 3D ANIMATED CAMERA LENS (Canvas 2D) ---- */
(function initLens() {
  const canvas = document.getElementById('lens-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const R = W * 0.44;

  let time = 0;
  let mx = 0, my = 0;
  let smx = 0, smy = 0;

  // Animated rotation angles
  let outerRot = 0;    // outer barrel + focus ring — clockwise
  let innerRot = 0;    // inner elements — counter-clockwise
  let irisOpenness = 0.5; // 0 = closed, 1 = fully open — driven by focus ring

  canvas.parentElement.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    my = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  });

  // 3D perspective helper — simulate slight tilt based on mouse
  function perspScale(ringR) {
    // Outer rings get more perspective distortion
    const tiltX = smx * 0.03 * (ringR / R);
    const tiltY = smy * 0.03 * (ringR / R);
    return { sx: 1 + tiltX, sy: 1 + tiltY };
  }

  function drawEllipse(x, y, r, scaleX, scaleY) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scaleX, scaleY);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.restore();
  }

  function drawLens() {
    time += 0.005;
    smx += (mx - smx) * 0.06;
    smy += (my - smy) * 0.06;

    // Rotation speeds
    outerRot += 0.003;
    innerRot -= 0.005;

    // Iris responds to focus ring position (sine wave for breathing effect)
    irisOpenness = 0.4 + Math.sin(outerRot * 2.5) * 0.3; // oscillates 0.1 — 0.7

    ctx.clearRect(0, 0, W, H);

    const glassR = R * 0.86;
    // 3D tilt factors
    const tiltSx = 1 + smx * 0.015;
    const tiltSy = 1 + smy * 0.015;

    // ========== 3D PERSPECTIVE TRANSFORM ==========
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(tiltSx, tiltSy);
    ctx.translate(-cx, -cy);

    // ========== OUTER DROP SHADOW ==========
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 100;
    ctx.shadowOffsetX = smx * 15;
    ctx.shadowOffsetY = 20 + smy * 10;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.07, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.01)';
    ctx.fill();
    ctx.restore();

    // ========== OUTER BARREL — ROTATING CLOCKWISE ==========
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(outerRot);
    ctx.translate(-cx, -cy);

    // Base barrel
    const barrelG = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, 0, cx, cy, R * 1.08);
    barrelG.addColorStop(0, '#383838');
    barrelG.addColorStop(0.2, '#2a2a2a');
    barrelG.addColorStop(0.5, '#1e1e1e');
    barrelG.addColorStop(0.8, '#131313');
    barrelG.addColorStop(1, '#0a0a0a');
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.07, 0, Math.PI * 2);
    ctx.fillStyle = barrelG;
    ctx.fill();

    // Brushed metal texture
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.07, 0, Math.PI * 2);
    ctx.clip();
    for (let i = 0; i < 450; i++) {
      const a = (i / 450) * Math.PI * 2;
      const bright = (Math.sin(i * 9.7 + outerRot * 50) * 0.5 + 0.5) * 0.05;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * R * 0.88, cy + Math.sin(a) * R * 0.88);
      ctx.lineTo(cx + Math.cos(a) * R * 1.07, cy + Math.sin(a) * R * 1.07);
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = `rgba(255,255,255,${bright})`;
      ctx.stroke();
    }
    ctx.restore();

    // Outer chrome ring
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.07, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    const chromeG = ctx.createConicGradient(outerRot, cx, cy);
    chromeG.addColorStop(0, 'rgba(255,255,255,0.14)');
    chromeG.addColorStop(0.2, 'rgba(255,255,255,0.03)');
    chromeG.addColorStop(0.4, 'rgba(255,255,255,0.12)');
    chromeG.addColorStop(0.6, 'rgba(255,255,255,0.02)');
    chromeG.addColorStop(0.8, 'rgba(255,255,255,0.10)');
    chromeG.addColorStop(1, 'rgba(255,255,255,0.14)');
    ctx.strokeStyle = chromeG;
    ctx.stroke();

    // Second chrome ring (inner)
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.055, 0, Math.PI * 2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.stroke();

    // ========== FOCUS RING — knurl pattern (rotating with barrel) ==========
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.05, 0, Math.PI * 2);
    ctx.arc(cx, cy, R * 0.93, 0, Math.PI * 2, true);
    ctx.clip();
    // Rubber base with 3D lighting
    const rubberG = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    rubberG.addColorStop(0, '#222');
    rubberG.addColorStop(0.3, '#181818');
    rubberG.addColorStop(0.5, '#141414');
    rubberG.addColorStop(0.7, '#181818');
    rubberG.addColorStop(1, '#111');
    ctx.fillStyle = rubberG;
    ctx.fillRect(cx - R * 1.1, cy - R * 1.1, R * 2.2, R * 2.2);
    // Diamond knurl
    for (let i = 0; i < 150; i++) {
      const a = (i / 150) * Math.PI * 2;
      const r1 = R * 0.935;
      const r2 = R * 1.045;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.lineWidth = 2.5;
      const knurlBright = (Math.sin(a * 30 + outerRot * 20) * 0.5 + 0.5);
      ctx.strokeStyle = knurlBright > 0.5
        ? `rgba(255,255,255,${knurlBright * 0.06})`
        : `rgba(0,0,0,${(1 - knurlBright) * 0.5})`;
      ctx.stroke();
    }
    // Cross-hatching for diamond pattern
    for (let i = 0; i < 150; i++) {
      const a = (i / 150) * Math.PI * 2 + Math.PI / 150;
      const r1 = R * 0.94;
      const r2 = R * 1.04;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a + 0.02) * r2, cy + Math.sin(a + 0.02) * r2);
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = 'rgba(255,255,255,0.02)';
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore(); // end outer barrel rotation

    // ========== INNER BARREL RINGS (static, between grip and glass) ==========
    const barrelRings = [0.92, 0.905, 0.895, 0.885, 0.875];
    barrelRings.forEach((r, i) => {
      ctx.beginPath();
      ctx.arc(cx, cy, R * r, 0, Math.PI * 2);
      ctx.lineWidth = i === 0 ? 3.5 : 1.5;
      const rb = i === 0 ? 0.12 : 0.03 + i * 0.015;
      ctx.strokeStyle = `rgba(255,255,255,${rb})`;
      ctx.stroke();
    });

    // Inner barrel fill
    const ibG = ctx.createRadialGradient(cx, cy, R * 0.865, cx, cy, R * 0.92);
    ibG.addColorStop(0, '#0c0c0c');
    ibG.addColorStop(0.3, '#111');
    ibG.addColorStop(0.7, '#0e0e0e');
    ibG.addColorStop(1, '#0a0a0a');
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.92, 0, Math.PI * 2);
    ctx.arc(cx, cy, R * 0.865, 0, Math.PI * 2, true);
    ctx.fillStyle = ibG;
    ctx.fill();

    // ========== GLASS ELEMENT ==========
    const glassG = ctx.createRadialGradient(
      cx + smx * 30, cy + smy * 30, 0, cx, cy, glassR
    );
    glassG.addColorStop(0, 'rgba(22, 28, 55, 0.88)');
    glassG.addColorStop(0.2, 'rgba(14, 18, 42, 0.93)');
    glassG.addColorStop(0.45, 'rgba(8, 12, 30, 0.97)');
    glassG.addColorStop(0.75, 'rgba(4, 6, 20, 0.99)');
    glassG.addColorStop(1, 'rgba(2, 3, 10, 1)');
    ctx.beginPath();
    ctx.arc(cx, cy, glassR, 0, Math.PI * 2);
    ctx.fillStyle = glassG;
    ctx.fill();

    // Depth layers
    [0.80, 0.70, 0.58, 0.46, 0.35].forEach((r, i) => {
      const dg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * r);
      dg.addColorStop(0, 'transparent');
      dg.addColorStop(0.6, `rgba(${10 + i * 3}, ${14 + i * 2}, ${35 + i * 5}, ${0.15 + i * 0.03})`);
      dg.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, R * r, 0, Math.PI * 2);
      ctx.fillStyle = dg;
      ctx.fill();
    });

    // ========== INTERNAL LENS RINGS — ROTATING COUNTER-CLOCKWISE ==========
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(innerRot);
    ctx.translate(-cx, -cy);

    const elemRings = [
      { r: 0.82, w: 3, a: 0.09 },
      { r: 0.74, w: 2, a: 0.07 },
      { r: 0.65, w: 2.5, a: 0.08 },
      { r: 0.55, w: 1.5, a: 0.06 },
      { r: 0.46, w: 2, a: 0.07 },
      { r: 0.38, w: 1.5, a: 0.05 },
      { r: 0.31, w: 2.5, a: 0.08 },
    ];
    elemRings.forEach((ring, idx) => {
      ctx.beginPath();
      ctx.arc(cx, cy, R * ring.r, 0, Math.PI * 2);
      ctx.lineWidth = ring.w;
      const rg = ctx.createConicGradient(innerRot * 2 + idx, cx, cy);
      rg.addColorStop(0, `rgba(100, 140, 230, ${ring.a * 0.5})`);
      rg.addColorStop(0.25, `rgba(160, 170, 255, ${ring.a * 1.3})`);
      rg.addColorStop(0.5, `rgba(100, 140, 230, ${ring.a * 0.5})`);
      rg.addColorStop(0.75, `rgba(160, 170, 255, ${ring.a * 1.3})`);
      rg.addColorStop(1, `rgba(100, 140, 230, ${ring.a * 0.5})`);
      ctx.strokeStyle = rg;
      ctx.stroke();
    });

    ctx.restore(); // end inner rotation

    // ========== APERTURE BLADES — iris responds to focus ring ==========
    const bladeCount = 11;
    // Iris size driven by irisOpenness (0.1 to 0.7 of R)
    const maxApertureR = R * 0.30;
    const minApertureR = R * 0.14;
    const apertureR = minApertureR + (maxApertureR - minApertureR) * irisOpenness;
    const maxInner = R * 0.12;
    const minInner = R * 0.04;
    const apertureInner = minInner + (maxInner - minInner) * irisOpenness;
    // Blades rotate slightly opposite to outer ring
    const bladeRot = -outerRot * 1.5;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(bladeRot);
    for (let i = 0; i < bladeCount; i++) {
      const a1 = (i / bladeCount) * Math.PI * 2;
      const a2 = ((i + 0.52) / bladeCount) * Math.PI * 2;
      const aMid = (a1 + a2) / 2;

      ctx.beginPath();
      ctx.moveTo(Math.cos(a1) * apertureInner, Math.sin(a1) * apertureInner);
      ctx.lineTo(Math.cos(a1) * apertureR, Math.sin(a1) * apertureR);
      ctx.quadraticCurveTo(
        Math.cos(aMid) * (apertureR * 1.06),
        Math.sin(aMid) * (apertureR * 1.06),
        Math.cos(a2) * apertureR, Math.sin(a2) * apertureR
      );
      ctx.lineTo(Math.cos(a2) * apertureInner, Math.sin(a2) * apertureInner);
      ctx.closePath();

      // Metallic gradient per blade with 3D shading
      const lightAngle = Math.atan2(smy, smx);
      const angleDiff = Math.abs(((a1 + a2) / 2) - lightAngle);
      const bladeBright = 0.02 + Math.cos(angleDiff) * 0.04;
      const bg = ctx.createLinearGradient(
        Math.cos(a1) * apertureR, Math.sin(a1) * apertureR,
        Math.cos(a2) * apertureR, Math.sin(a2) * apertureR
      );
      bg.addColorStop(0, `rgba(${20 + bladeBright * 300}, ${20 + bladeBright * 300}, ${25 + bladeBright * 200}, 0.94)`);
      bg.addColorStop(0.5, `rgba(${15 + bladeBright * 200}, ${15 + bladeBright * 200}, ${20 + bladeBright * 150}, 0.92)`);
      bg.addColorStop(1, `rgba(10, 10, 14, 0.96)`);
      ctx.fillStyle = bg;
      ctx.fill();

      // Blade edge
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = `rgba(140, 150, 180, ${0.08 + bladeBright * 2})`;
      ctx.stroke();
    }
    ctx.restore();

    // ========== APERTURE CENTER (deep void) ==========
    const centerR = apertureInner * 0.9;
    const centerG = ctx.createRadialGradient(cx, cy, 0, cx, cy, centerR);
    centerG.addColorStop(0, 'rgba(0,0,0,1)');
    centerG.addColorStop(0.4, 'rgba(1,1,3,1)');
    centerG.addColorStop(0.8, 'rgba(3,4,12,0.97)');
    centerG.addColorStop(1, 'rgba(6,8,20,0.90)');
    ctx.beginPath();
    ctx.arc(cx, cy, centerR, 0, Math.PI * 2);
    ctx.fillStyle = centerG;
    ctx.fill();

    // Pinpoint reflection in center
    const pinG = ctx.createRadialGradient(cx + centerR * 0.2, cy - centerR * 0.2, 0, cx, cy, centerR * 0.4);
    pinG.addColorStop(0, 'rgba(255,255,255,0.20)');
    pinG.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy, centerR * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = pinG;
    ctx.fill();

    // ========== MULTI-COATING REFLECTIONS ==========
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, glassR, 0, Math.PI * 2);
    ctx.clip();

    // Purple/magenta coating
    const c1x = cx + smx * 70 + Math.sin(time * 0.7) * 30;
    const c1y = cy + smy * 70 + Math.cos(time * 0.5) * 25;
    const c1 = ctx.createRadialGradient(c1x, c1y, 0, c1x, c1y, R * 0.8);
    c1.addColorStop(0, 'rgba(160, 80, 255, 0.32)');
    c1.addColorStop(0.15, 'rgba(130, 70, 240, 0.22)');
    c1.addColorStop(0.4, 'rgba(90, 80, 220, 0.10)');
    c1.addColorStop(1, 'transparent');
    ctx.fillStyle = c1;
    ctx.fillRect(0, 0, W, H);

    // Green/teal coating
    const c2x = cx - smx * 55 + Math.cos(time * 0.6) * 35;
    const c2y = cy - smy * 55 + Math.sin(time * 0.9) * 30;
    const c2 = ctx.createRadialGradient(c2x, c2y, 0, c2x, c2y, R * 0.65);
    c2.addColorStop(0, 'rgba(30, 220, 180, 0.20)');
    c2.addColorStop(0.3, 'rgba(40, 200, 200, 0.10)');
    c2.addColorStop(1, 'transparent');
    ctx.fillStyle = c2;
    ctx.fillRect(0, 0, W, H);

    // Amber/warm coating
    const c3x = cx + smx * 40 + Math.sin(time * 0.4) * 40;
    const c3y = cy - smy * 35 + Math.cos(time * 0.7) * 30;
    const c3 = ctx.createRadialGradient(c3x, c3y, 0, c3x, c3y, R * 0.55);
    c3.addColorStop(0, 'rgba(220, 160, 50, 0.28)');
    c3.addColorStop(0.25, 'rgba(201, 146, 42, 0.15)');
    c3.addColorStop(0.5, 'rgba(180, 130, 40, 0.06)');
    c3.addColorStop(1, 'transparent');
    ctx.fillStyle = c3;
    ctx.fillRect(0, 0, W, H);

    // Rose/pink coating
    const c4x = cx - smx * 30 + Math.cos(time * 1.1) * 25;
    const c4y = cy + smy * 30 + Math.sin(time * 0.8) * 35;
    const c4 = ctx.createRadialGradient(c4x, c4y, 0, c4x, c4y, R * 0.4);
    c4.addColorStop(0, 'rgba(255, 100, 150, 0.14)');
    c4.addColorStop(0.4, 'rgba(240, 80, 130, 0.05)');
    c4.addColorStop(1, 'transparent');
    ctx.fillStyle = c4;
    ctx.fillRect(0, 0, W, H);

    // ========== SPECULAR HIGHLIGHTS ==========
    // Main specular (elongated window)
    const s1x = cx + R * 0.22 + smx * 50;
    const s1y = cy - R * 0.28 + smy * 50;
    ctx.save();
    ctx.translate(s1x, s1y);
    ctx.rotate(0.3 + smx * 0.3);
    ctx.scale(1, 0.55);
    const s1g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.2);
    s1g.addColorStop(0, 'rgba(255,255,255,0.55)');
    s1g.addColorStop(0.15, 'rgba(255,255,255,0.30)');
    s1g.addColorStop(0.4, 'rgba(255,255,255,0.10)');
    s1g.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = s1g;
    ctx.fill();
    ctx.restore();

    // Secondary specular
    const s2x = cx - R * 0.2 + smx * 25;
    const s2y = cy + R * 0.25 + smy * 25;
    const s2g = ctx.createRadialGradient(s2x, s2y, 0, s2x, s2y, R * 0.08);
    s2g.addColorStop(0, 'rgba(255,255,255,0.38)');
    s2g.addColorStop(0.4, 'rgba(220,210,255,0.12)');
    s2g.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(s2x, s2y, R * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = s2g;
    ctx.fill();

    // Tiny dot speculars
    for (let i = 0; i < 4; i++) {
      const sx = cx + Math.cos(i * 1.8 + time * 0.3) * R * (0.15 + i * 0.1) + smx * 18;
      const sy = cy + Math.sin(i * 1.8 + time * 0.3) * R * (0.1 + i * 0.08) + smy * 18;
      const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, R * 0.015);
      sg.addColorStop(0, 'rgba(255,255,255,0.6)');
      sg.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(sx, sy, R * 0.015, 0, Math.PI * 2);
      ctx.fillStyle = sg;
      ctx.fill();
    }

    // Chromatic aberration
    ctx.beginPath();
    ctx.arc(cx, cy, glassR + 1.5, 0, Math.PI * 2);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(255, 50, 50, 0.05)';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, glassR - 1.5, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(50, 70, 255, 0.05)';
    ctx.stroke();

    ctx.restore(); // end glass clip

    // ========== GLASS EDGE REFRACTION — animated conic ==========
    ctx.beginPath();
    ctx.arc(cx, cy, glassR, 0, Math.PI * 2);
    ctx.lineWidth = 3.5;
    const edgeG = ctx.createConicGradient(time * 0.4, cx, cy);
    edgeG.addColorStop(0, 'rgba(140, 80, 240, 0.28)');
    edgeG.addColorStop(0.12, 'rgba(60, 140, 240, 0.16)');
    edgeG.addColorStop(0.25, 'rgba(40, 220, 200, 0.14)');
    edgeG.addColorStop(0.38, 'rgba(255, 255, 255, 0.22)');
    edgeG.addColorStop(0.5, 'rgba(220, 160, 50, 0.20)');
    edgeG.addColorStop(0.62, 'rgba(255, 100, 150, 0.12)');
    edgeG.addColorStop(0.75, 'rgba(100, 60, 240, 0.18)');
    edgeG.addColorStop(0.88, 'rgba(60, 200, 180, 0.14)');
    edgeG.addColorStop(1, 'rgba(140, 80, 240, 0.28)');
    ctx.strokeStyle = edgeG;
    ctx.stroke();

    // ========== GHOST REFLECTIONS ==========
    for (let i = 0; i < 4; i++) {
      const gr = R * (0.30 + i * 0.14);
      const gx = cx - smx * (25 + i * 12) + Math.cos(time * 0.8 + i * 1.8) * 6;
      const gy = cy - smy * (25 + i * 12) + Math.sin(time * 0.8 + i * 1.8) * 6;
      ctx.beginPath();
      ctx.arc(gx, gy, gr, 0, Math.PI * 2);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = `rgba(140, 160, 250, ${0.035 - i * 0.007})`;
      ctx.stroke();
    }

    // ========== 3D HIGHLIGHT RIM (simulates light hitting edge) ==========
    const rimG = ctx.createConicGradient(Math.atan2(smy, smx) + Math.PI, cx, cy);
    rimG.addColorStop(0, 'rgba(255,255,255,0.0)');
    rimG.addColorStop(0.35, 'rgba(255,255,255,0.0)');
    rimG.addColorStop(0.45, 'rgba(255,255,255,0.08)');
    rimG.addColorStop(0.5, 'rgba(255,255,255,0.14)');
    rimG.addColorStop(0.55, 'rgba(255,255,255,0.08)');
    rimG.addColorStop(0.65, 'rgba(255,255,255,0.0)');
    rimG.addColorStop(1, 'rgba(255,255,255,0.0)');
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.07, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = rimG;
    ctx.stroke();

    ctx.restore(); // end 3D perspective

    requestAnimationFrame(drawLens);
  }

  // Only render when visible
  let running = false;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !running) {
        running = true;
        requestAnimationFrame(drawLens);
      }
    });
  }, { threshold: 0 });
  observer.observe(canvas);
})();
