/* ============================================
   ZIPPER SEQUENCE (Services page overlay)
   — 1200 frames: 258 PNG (transparent) + 942 JPG
   — Shares scene-scroll-text, starts at p=0.35
   — Direct scroll-to-frame mapping (no burst)
   ============================================ */
(function () {
  var filePaths = [];
  var i;
  for (i = 0; i <= 257; i++) {
    filePaths.push('assets/zip-small/1.PNG00' + String(108000 + i) + '.png');
  }
  for (i = 0; i <= 941; i++) {
    filePaths.push('assets/zip-small/2.JPG00' + String(108453 + i) + '.jpg');
  }

  var TOTAL = filePaths.length;
  var images = [], loaded = 0, ready = false, current = -1;
  var canvas, ctx, W, H;

  var section;
  var servicesTitleWrap, servicesHero;
  var growthWrap, growthContent;
  var resultsWrap, resultsContent;

  var ZIP_START = 0.35;
  var ZIP_END = 0.95;

  // No lerp/burst — pure direct draw on every scroll event

  function drawCover(img) {
    var sc = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    var dw = Math.ceil(img.naturalWidth * sc);
    var dh = Math.ceil(img.naturalHeight * sc);
    var dx = Math.floor((W - dw) / 2);
    var dy = Math.floor((H - dh) / 2);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function drawFrame(idx) {
    idx = Math.max(0, Math.min(idx, TOTAL - 1));
    if (idx === current) return;
    current = idx;
    var img = images[idx];
    if (!img || !img.complete || !img.naturalWidth) return;
    ctx.clearRect(0, 0, W, H);
    drawCover(img);
  }

  // updateTexts now only called from burst loop for frame-synced things (currently nothing)
  function updateTexts(f) {}

  // Smooth text updates driven by continuous scroll p (not discrete frames)
  function updateTextsSmooth(p, winH) {
    // "Built to Dominate": pinned until p=0.60, drifts down 0.60–0.80, gone after 0.80
    if (servicesTitleWrap && servicesHero) {
      if (p <= 0.60) {
        servicesTitleWrap.style.opacity = '1';
        servicesHero.style.transform = 'translate3d(0,0,0)';
      } else if (p <= 0.80) {
        servicesTitleWrap.style.opacity = '1';
        servicesTitleWrap.style.visibility = 'visible';
        var drift = ((p - 0.60) / 0.20) * winH * 1.5;
        servicesHero.style.transform = 'translate3d(0,' + drift + 'px,0)';
      } else {
        servicesTitleWrap.style.opacity = '0';
        servicesTitleWrap.style.visibility = 'hidden';
      }
    }
    // "Growth System": enters 0.60–0.724, exits 0.724–0.825
    if (growthWrap && growthContent) {
      if (p < 0.60) {
        growthWrap.style.opacity = '0';
      } else if (p < 0.724) {
        growthWrap.style.opacity = '1';
        var enterP = (p - 0.60) / 0.124;
        growthContent.style.transform = 'translate3d(0,' + (-(1 - enterP) * winH * 0.8) + 'px,0)';
      } else if (p <= 0.825) {
        growthWrap.style.opacity = '1';
        var leaveP = (p - 0.724) / 0.101;
        growthContent.style.transform = 'translate3d(0,' + (-leaveP * winH * 1.3) + 'px,0)';
      } else {
        growthWrap.style.opacity = '0';
      }
    }
  }

  var cachedSectionH = 0;
  function updateScroll() {
    if (!ready || !section) return;
    var rect = section.getBoundingClientRect();
    var winH = window.innerHeight;
    var inView = rect.top < winH && rect.bottom > 0;
    if (!cachedSectionH) cachedSectionH = section.offsetHeight;

    // Always update results position regardless of section visibility
    if (resultsWrap && resultsContent) {
      var rAnchorP = ZIP_START + (920 / (TOTAL - 1)) * (ZIP_END - ZIP_START);
      var rawY = rect.top + rAnchorP * cachedSectionH;
      var yPos = winH * 1.15 + (rawY - winH) * 0.5;
      resultsWrap.style.opacity = '1';
      resultsContent.style.transform = 'translate3d(0,' + yPos + 'px,0)';
    }

    if (!inView) {
      if (rect.top >= winH) {
        ctx.clearRect(0, 0, W, H);
        current = -1;
      } else if (current !== TOTAL - 1) {
        drawFrame(TOTAL - 1);
      }
      window._zipperActive = false;
      if (growthWrap) growthWrap.style.opacity = '0';
      return;
    }

    var scrolled = winH - rect.top;
    var p = cachedSectionH > 0 ? scrolled / cachedSectionH : 0;
    p = p < 0 ? 0 : p > 1 ? 1 : p;

    if (p < ZIP_START) {
      ctx.clearRect(0, 0, W, H);
      current = -1;
      displayFrame = 0;
      targetFrame = 0;
      window._zipperActive = false;
      if (growthWrap) growthWrap.style.opacity = '0';
      return;
    }

    // Past zipper end — keep last frame drawn as background for pricing page
    if (p > ZIP_END + 0.02) {
      if (current !== TOTAL - 1) drawFrame(TOTAL - 1);
      window._zipperActive = false;
      if (growthWrap) growthWrap.style.opacity = '0';
      return;
    }

    window._zipperActive = true;
    var zp = (p - ZIP_START) / (ZIP_END - ZIP_START);
    zp = zp < 0 ? 0 : zp > 1 ? 1 : zp;
    var frame = Math.round(zp * (TOTAL - 1));
    drawFrame(frame);
    window._zipperFrame = frame;
    // Smooth text driven by continuous p — not burst frames
    updateTextsSmooth(p, winH);
  }

  function sizeCanvas() {
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W;
    canvas.height = H;
    current = -1;
    if (section) cachedSectionH = section.offsetHeight;
  }

  function init() {
    canvas = document.getElementById('zipper-canvas');
    section = document.getElementById('scene-scroll-text');
    servicesTitleWrap = document.getElementById('services-title-wrap');
    servicesHero = document.getElementById('services-hero');
    growthWrap = document.getElementById('growth-system-wrap');
    growthContent = document.getElementById('growth-system-content');
    resultsWrap = document.getElementById('results-wrap');
    resultsContent = document.getElementById('results-content');

    // Results accordion click handler — toggle open/close
    var accordionItems = document.querySelectorAll('.results-item');
    var accordionImages = document.querySelectorAll('.results-image');
    for (var a = 0; a < accordionItems.length; a++) {
      (function (item) {
        var header = item.querySelector('.results-item-header');
        if (!header) return;
        header.addEventListener('click', function () {
          var wasActive = item.classList.contains('active');
          var idx = item.getAttribute('data-results-idx');
          // Close all
          for (var b = 0; b < accordionItems.length; b++) {
            accordionItems[b].classList.remove('active');
          }
          for (var c = 0; c < accordionImages.length; c++) {
            accordionImages[c].classList.remove('active');
          }
          // If wasn't active, open it
          if (!wasActive) {
            item.classList.add('active');
            var targetImg = document.querySelector('[data-results-img="' + idx + '"]');
            if (targetImg) targetImg.classList.add('active');
          }
        });
      })(accordionItems[a]);
    }

    if (!canvas || !section) return;
    ctx = canvas.getContext('2d');

    sizeCanvas();
    window.addEventListener('resize', function () {
      sizeCanvas();
      if (ready) updateScroll();
    });

    for (var j = 0; j < TOTAL; j++) {
      (function (idx) {
        var img = new Image();
        img.src = filePaths[idx];
        img.onload = function () {
          // Pre-decode so drawImage never blocks during scroll
          if (img.decode) {
            img.decode().then(function () {
              if (++loaded === TOTAL) { ready = true; updateScroll(); }
            }).catch(function () {
              if (++loaded === TOTAL) { ready = true; updateScroll(); }
            });
          } else {
            if (++loaded === TOTAL) { ready = true; updateScroll(); }
          }
        };
        img.onerror = function () {
          if (++loaded === TOTAL) { ready = true; updateScroll(); }
        };
        images[idx] = img;
      })(j);
    }

    window.addEventListener('scroll', updateScroll, { passive: true });
    if (typeof lenis !== 'undefined') {
      lenis.on('scroll', updateScroll);
    } else {
      var check = setInterval(function () {
        if (typeof lenis !== 'undefined') {
          lenis.on('scroll', updateScroll);
          clearInterval(check);
        }
      }, 100);
      setTimeout(function () { clearInterval(check); }, 3000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
