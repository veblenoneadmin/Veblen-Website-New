(function () {
  var TOTAL = 91, images = [], loaded = 0, ready = false, current = -1, rafId = null;
  var canvas, ctx, W, H;
  var visible = false;
  var videoEnded = false;

  function draw(idx) {
    idx = Math.max(0, Math.min(idx, TOTAL - 1));
    if (idx === current) return;
    current = idx;
    var img = images[idx];
    if (!img || !img.complete || !img.naturalWidth) return;
    var sc = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    var dw = Math.ceil(img.naturalWidth * sc);
    var dh = Math.ceil(img.naturalHeight * sc);
    var dx = Math.floor((W - dw) / 2);
    var dy = Math.floor((H - dh) / 2);
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function show() {
    if (!visible) { canvas.style.opacity = '1'; visible = true; }
  }

  function hide() {
    if (visible) { canvas.style.opacity = '0'; visible = false; }
  }

  function tick() {
    rafId = null;
    if (!ready) return;

    var section = document.getElementById('scene-door-portal');
    if (!section) return;

    var rect = section.getBoundingClientRect();
    var sectionH = section.offsetHeight;
    var winH = window.innerHeight;

    // Is the portal section in view?
    var inPortal = rect.top < winH && rect.bottom > 0;

    // After video ends, sequence is driven by scroll from top of page
    // through the full hero + portal range
    if (!videoEnded) {
      if (!inPortal) {
        hide();
        if (rect.top >= winH) {
          var words = document.querySelectorAll('.hero-word-el');
          for (var j = 0; j < words.length; j++) {
            words[j].style.transform = '';
            words[j].style.opacity = '1';
          }
        }
        return;
      }
      show();
      var scrolled = -rect.top;
      var maxScroll = sectionH - winH;
      var p = maxScroll > 0 ? scrolled / maxScroll : 0;
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      draw(Math.round(p * (TOTAL - 1)));
    } else {
      show();
      // Progress spans from scroll 0 (top) to bottom of portal section
      var scrollY = window.scrollY || window.pageYOffset;
      var heroEl = document.getElementById('scene-hero');
      var heroH = heroEl ? heroEl.offsetHeight : winH;
      var maxScroll = heroH + sectionH - winH;
      var p = maxScroll > 0 ? scrollY / maxScroll : 0;
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      draw(Math.round(p * (TOTAL - 1)));

      // Hide canvas after scrolling past portal
      if (rect.bottom <= 0) {
        hide();
        return;
      }
    }

    // Hero text — fly off edges (like JeskoJets: left text → -50vw, right text → +50vw)
    var t = Math.min(p * 4, 1); // text fully gone by 25% of scroll
    var scale = 1 + t * 5;
    var opacity = Math.max(0, 1 - t * 2);

    var hwOwn = document.getElementById('hw-own');
    var hwThe = document.getElementById('hw-the');
    var hwMarket = document.getElementById('hw-market');

    if (hwOwn) {
      hwOwn.style.transform = 'translate(' + (-t * 50) + 'vw, ' + (-t * 20) + 'vh) scale(' + scale + ')';
      hwOwn.style.opacity = String(opacity);
    }
    if (hwThe) {
      hwThe.style.transform = 'translate(' + (t * 50) + 'vw, ' + (-t * 15) + 'vh) scale(' + scale + ')';
      hwThe.style.opacity = String(opacity);
    }
    if (hwMarket) {
      hwMarket.style.transform = 'translate(' + (t * 50) + 'vw, ' + (t * 15) + 'vh) scale(' + scale + ')';
      hwMarket.style.opacity = String(opacity);
    }

    // Hide scroll hint
    var hint = document.querySelector('.hero-scroll-hint');
    if (hint) hint.style.opacity = String(1 - Math.min(p * 10, 1));
  }

  function requestTick() {
    if (rafId) return;
    rafId = requestAnimationFrame(tick);
  }

  function init() {
    canvas = document.getElementById('portal-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';

    window.addEventListener('resize', function () {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      current = -1;
      if (ready) requestTick();
    });

    // Preload 91 frames
    for (var i = 0; i < TOTAL; i++) {
      (function (idx) {
        var img = new Image();
        img.src = 'assets/sequence-2/Dzoom001080' + (idx < 10 ? '0' : '') + idx + '.jpg';
        img.onload = function () {
          if (++loaded === TOTAL) { ready = true; requestTick(); }
        };
        images[idx] = img;
      })(i);
    }

    // When video ends, show canvas with frame 0 immediately
    window.addEventListener('portal-show', function () {
      videoEnded = true;
      if (ready) {
        show();
        draw(0);
      }
    });

    // Listen to both native scroll and Lenis
    window.addEventListener('scroll', requestTick, { passive: true });
    if (typeof lenis !== 'undefined') {
      lenis.on('scroll', requestTick);
    } else {
      var check = setInterval(function () {
        if (typeof lenis !== 'undefined') {
          lenis.on('scroll', requestTick);
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
