/* ============================================
   VEBLEN GROUP v2 — MAIN JAVASCRIPT
   ============================================ */

/* ---- CUSTOM CURSOR ---- */
const cursor = document.querySelector('.cursor');
const cursorRing = document.querySelector('.cursor-ring');
let mouseX = 0, mouseY = 0;
let ringX = 0, ringY = 0;

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
    // Start hero text animation
    document.querySelectorAll('.hero-word span').forEach((el, i) => {
      setTimeout(() => el.classList.add('revealed'), i * 150);
    });
    // Show fixed CTA
    setTimeout(() => {
      document.querySelector('.fixed-cta').classList.add('visible');
    }, 800);
    // Init logo animation
    initLogoAnimation();
  }, 1200);
}, 2600); // intro duration

/* ---- LOGO ANIMATION (hero → navbar on scroll) ---- */
function initLogoAnimation() {
  const logo    = document.getElementById('hero-logo');
  const navLogo = document.querySelector('.nav-logo');

  navLogo.style.opacity = '0';
  logo.style.transition = 'none';

  // Start & end values
  const startTop   = window.innerHeight / 2;
  const isMobile   = window.innerWidth <= 480;
  const endTop     = isMobile ? 28 : 50;       // centre of navbar (56px mobile, 100px desktop)
  const startSize  = Math.min(Math.max(window.innerWidth * 0.025, 18), 36);
  const endSize    = isMobile ? 14 : 36;
  const startSpace = 0.3;
  const endSpace   = 0.2;
  const scrollEnd  = window.innerHeight * 0.5;

  // Smooth interpolation state
  let currentTop   = startTop;
  let currentSize  = startSize;
  let currentSpace = startSpace;
  let targetTop    = startTop;
  let targetSize   = startSize;
  let targetSpace  = startSpace;
  let ticking      = false;

  // Lerp factor — lower = smoother/laggier, higher = snappier
  const lerp = 0.18;

  function updateTargets() {
    const scrollY = window.scrollY;
    const t = Math.min(Math.max(scrollY / scrollEnd, 0), 1);
    // Ease-out quart for smooth deceleration
    const ease = 1 - Math.pow(1 - t, 4);

    targetTop   = startTop + (endTop - startTop) * ease;
    targetSize  = startSize + (endSize - startSize) * ease;
    targetSpace = startSpace + (endSpace - startSpace) * ease;

    // Swap to nav logo when fully docked
    if (t >= 0.98) {
      logo.style.opacity = '0';
      navLogo.style.opacity = '1';
    } else {
      logo.style.opacity = '1';
      navLogo.style.opacity = '0';
    }
  }

  function animate() {
    currentTop   += (targetTop - currentTop) * lerp;
    currentSize  += (targetSize - currentSize) * lerp;
    currentSpace += (targetSpace - currentSpace) * lerp;

    logo.style.top = currentTop + 'px';
    logo.style.fontSize = currentSize + 'px';
    logo.style.letterSpacing = currentSpace + 'em';

    requestAnimationFrame(animate);
  }

  function onScroll() {
    updateTargets();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  // Set initial state
  updateTargets();
  currentTop = targetTop;
  currentSize = targetSize;
  currentSpace = targetSpace;
  logo.style.top = currentTop + 'px';
  logo.style.fontSize = currentSize + 'px';
  logo.style.letterSpacing = currentSpace + 'em';
  // Start continuous animation loop
  requestAnimationFrame(animate);
}

/* ---- NAVBAR SCROLL STATE ---- */
const navbar = document.getElementById('navbar');
let lastScrollY = 0;
let lightSceneActive = false;

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;

  // Scrolled state (background blur)
  if (scrollY > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }

  // Light mode when in cream scene
  const lightScene = document.getElementById('scene-light');
  const fixedCta = document.querySelector('.fixed-cta');
  if (lightScene) {
    const rect = lightScene.getBoundingClientRect();
    const viewH = window.innerHeight;
    if (rect.top < 80 && rect.bottom > 0) {
      navbar.classList.add('light-mode');
    } else {
      navbar.classList.remove('light-mode');
    }
    // Toggle fixed CTA light mode when CTA overlaps the light section
    if (fixedCta) {
      if (rect.top < viewH - 40 && rect.bottom > viewH - 100) {
        fixedCta.classList.add('light-mode');
      } else {
        fixedCta.classList.remove('light-mode');
      }
    }
  }

  lastScrollY = scrollY;
}, { passive: true });

/* ---- HERO TEXT ZOOM-OUT + FADE ON SCROLL ---- */
(function initHeroTextZoom() {
  const heroLeft = document.querySelector('.hero-text-left');
  const heroRight = document.querySelector('.hero-text-right');
  const heroHint = document.querySelector('.hero-scroll-hint');
  const heroScene = document.getElementById('scene-hero');
  if (!heroLeft || !heroRight || !heroScene) return;

  // Set transform-origin so text scales from its own center
  heroLeft.style.willChange = 'transform, opacity';
  heroRight.style.willChange = 'transform, opacity';

  function onScroll() {
    const scrollY = window.scrollY;
    const sceneH = heroScene.offsetHeight;
    // Start effect early, complete by 60% of hero height
    const progress = Math.min(Math.max(scrollY / (sceneH * 0.55), 0), 1);

    // Scale from 1 → 2.5 and opacity from 1 → 0
    const scale = 1 + progress * 1.5;
    const opacity = 1 - progress;

    heroLeft.style.transform = `translateY(-50%) scale(${scale})`;
    heroLeft.style.opacity = opacity;
    heroRight.style.transform = `scale(${scale})`;
    heroRight.style.opacity = opacity;
    if (heroHint) heroHint.style.opacity = opacity;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
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
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

    // Barrel text (rotates with outer barrel)
    const textR = R * 0.97;
    const fontSize = Math.max(14, R * 0.04);
    ctx.font = `500 ${fontSize}px "DM Sans", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.textAlign = 'center';
    const marks = ['50mm', 'f/1.4', '\u2022', 'VEBLEN OPTICS', '\u2022', 'ASPHERICAL', '\u2022', 'ED'];
    marks.forEach((txt, i) => {
      const a = (i / marks.length) * Math.PI * 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a);
      ctx.translate(0, -textR);
      ctx.rotate(Math.PI / 2);
      ctx.fillText(txt, 0, 0);
      ctx.restore();
    });

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
